/**
 * Pure logic for the border radius generator. Nothing here touches the DOM, so
 * every function can be tested in Node.
 *
 * Radii are stored as eight numbers in the order CSS uses for the slash syntax:
 *   [x-TL, x-TR, x-BR, x-BL, y-TL, y-TR, y-BR, y-BL]
 * where x is the horizontal radius and y the vertical radius of each corner.
 */

export type Unit = "px" | "%";
/** all = one value for every corner, corner = one value per corner, ellipse = eight values. */
export type Mode = "all" | "corner" | "ellipse";
export type OutKind = "css" | "longhand" | "tailwind";
export type Radii = number[];
export type Side = "top" | "right" | "bottom" | "left";

export const LIMITS = { boxMin: 20, boxMax: 1000, px: 9999, pct: 100 } as const;

export const CORNER_NAMES = ["Top-left", "Top-right", "Bottom-right", "Bottom-left"] as const;
const CSS_CORNERS = ["top-left", "top-right", "bottom-right", "bottom-left"] as const;
const TW_CORNERS = ["tl", "tr", "br", "bl"] as const;

export interface ToolState {
  mode: Mode;
  unit: Unit;
  width: number;
  height: number;
  radii: Radii;
  guides: boolean;
  squircle: boolean;
  out: OutKind;
}

export const DEFAULT_STATE: ToolState = {
  mode: "all",
  unit: "px",
  width: 320,
  height: 220,
  radii: [24, 24, 24, 24, 24, 24, 24, 24],
  guides: true,
  squircle: false,
  out: "css",
};

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100 || 0;
}

export function clampNum(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function maxFor(unit: Unit): number {
  return unit === "%" ? LIMITS.pct : LIMITS.px;
}

export function clampRadius(n: number, unit: Unit): number {
  return round2(clampNum(n, 0, maxFor(unit)));
}

/** "12", "12.5", "0". Never "-0" and never trailing zeros. */
export function fmtNum(n: number): string {
  return String(round2(n));
}

/** A CSS length: bare 0, otherwise the number and its unit. */
export function fmtLen(n: number, unit: Unit): string {
  const r = round2(n);
  return r === 0 ? "0" : `${r}${unit}`;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export function normalizeState(input: unknown): ToolState {
  const src = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const mode: Mode = src.mode === "corner" || src.mode === "ellipse" ? src.mode : "all";
  const out: OutKind = src.out === "longhand" || src.out === "tailwind" ? src.out : "css";
  const box = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.round(clampNum(v, LIMITS.boxMin, LIMITS.boxMax)) : fallback;
  const rawRadii = Array.isArray(src.radii) ? src.radii : [];
  const validRadii = rawRadii.length === 8 && rawRadii.every((n) => typeof n === "number" && Number.isFinite(n));
  // Radii and unit belong together: if the numbers are unusable, fall back to both defaults.
  const unit: Unit = validRadii && src.unit === "%" ? "%" : "px";
  const radii: Radii = validRadii ? (rawRadii as number[]).map((n) => clampRadius(n, unit)) : [...DEFAULT_STATE.radii];
  return {
    mode,
    unit,
    width: box(src.width, DEFAULT_STATE.width),
    height: box(src.height, DEFAULT_STATE.height),
    radii,
    guides: typeof src.guides === "boolean" ? src.guides : DEFAULT_STATE.guides,
    squircle: src.squircle === true,
    out,
  };
}

/** Pick the simplest editing mode that can represent these radii. */
export function detectMode(radii: Radii): Mode {
  if (radii.every((v) => v === radii[0])) return "all";
  if ([0, 1, 2, 3].every((c) => radii[c] === radii[c + 4])) return "corner";
  return "ellipse";
}

const MODE_RANK: Record<Mode, number> = { all: 0, corner: 1, ellipse: 2 };

/** Keep the chosen mode unless it cannot represent the radii, then widen it. */
export function atLeast(mode: Mode, needed: Mode): Mode {
  return MODE_RANK[mode] >= MODE_RANK[needed] ? mode : needed;
}

/** Apply one edit, honouring the linking of the current mode. */
export function setRadius(radii: Radii, index: number, value: number, mode: Mode): Radii {
  const next = radii.slice();
  if (mode === "all") return next.fill(value);
  if (mode === "corner") {
    const c = index % 4;
    next[c] = value;
    next[c + 4] = value;
    return next;
  }
  next[index] = value;
  return next;
}

// ---------------------------------------------------------------------------
// Geometry: what the browser actually draws
// ---------------------------------------------------------------------------

/** Length of the box side a radius is measured against (x radii use the width, y radii the height). */
export function axisLength(index: number, w: number, h: number): number {
  return index < 4 ? w : h;
}

export function toPx(v: number, index: number, unit: Unit, w: number, h: number): number {
  return unit === "%" ? (v / 100) * axisLength(index, w, h) : v;
}

export function fromPx(px: number, index: number, unit: Unit, w: number, h: number): number {
  return unit === "%" ? (px / axisLength(index, w, h)) * 100 : px;
}

export interface Resolved {
  /** Radii in pixels after the overlap rule has been applied. */
  px: number[];
  /** The factor every radius was multiplied by (1 when nothing overlaps). */
  scale: number;
  /** Sides whose two radii added up to more than the side itself. */
  overlapping: Side[];
}

/**
 * CSS Backgrounds and Borders: let f = min(L / S) over the four sides, where S is
 * the sum of the two radii on that side and L the side length. If f < 1, every
 * radius is multiplied by f.
 */
export function resolveRadii(radii: Radii, unit: Unit, w: number, h: number): Resolved {
  const px = radii.map((v, i) => toPx(v, i, unit, w, h));
  const sides: { side: Side; length: number; sum: number }[] = [
    { side: "top", length: w, sum: px[0] + px[1] },
    { side: "right", length: h, sum: px[5] + px[6] },
    { side: "bottom", length: w, sum: px[3] + px[2] },
    { side: "left", length: h, sum: px[4] + px[7] },
  ];
  let f = 1;
  const overlapping: Side[] = [];
  for (const s of sides) {
    if (s.sum > s.length * (1 + 1e-9)) {
      f = Math.min(f, s.length / s.sum);
      overlapping.push(s.side);
    }
  }
  return { px: px.map((v) => v * f), scale: f, overlapping };
}

/** True when the overlap rule visibly changes the shape (ignores rounding noise). */
export function isOverlapping(r: Resolved): boolean {
  return r.scale < 0.999;
}

/** Replace the values with what the browser really draws. */
export function bakeRadii(radii: Radii, unit: Unit, w: number, h: number): Radii {
  const r = resolveRadii(radii, unit, w, h);
  if (r.scale >= 1) return radii;
  return r.px.map((v, i) => clampRadius(fromPx(v, i, unit, w, h), unit));
}

/** Change units while keeping the drawn shape the same for this box. */
export function convertUnit(radii: Radii, from: Unit, to: Unit, w: number, h: number): Radii {
  if (from === to) return radii;
  const r = resolveRadii(radii, from, w, h);
  return r.px.map((v, i) => clampRadius(fromPx(v, i, to, w, h), to));
}

/** Largest useful value for a control, given how the current mode links the radii. */
export function valueMax(mode: Mode, unit: Unit, index: number, w: number, h: number): number {
  if (unit === "%") return mode === "all" ? 50 : 100;
  if (mode === "all") return Math.max(1, Math.floor(Math.min(w, h) / 2));
  if (mode === "corner") return Math.min(w, h);
  return axisLength(index, w, h);
}

/** Random organic blob: every opposite pair of radii on a side sums to exactly 100%. */
export function randomBlob(rand: () => number = Math.random): Radii {
  const pick = () => 30 + Math.floor(rand() * 41); // 30..70
  const top = pick();
  const bottom = pick();
  const left = pick();
  const right = pick();
  // x: TL, TR, BR, BL   y: TL, TR, BR, BL
  return [top, 100 - top, 100 - bottom, bottom, left, right, 100 - right, 100 - left];
}

// ---------------------------------------------------------------------------
// CSS output
// ---------------------------------------------------------------------------

/** Collapse a four-value list the way CSS shorthands allow (1, 2, 3 or 4 values). */
export function collapse(v: string[]): string[] {
  const [a, b, c, d] = v;
  if (a === b && b === c && c === d) return [a];
  if (a === c && b === d) return [a, b];
  if (b === d) return [a, b, c];
  return [a, b, c, d];
}

/** The value of the border-radius shorthand, using the slash only when needed. */
export function shorthandValue(radii: Radii, unit: Unit): string {
  const x = radii.slice(0, 4).map((v) => fmtLen(v, unit));
  const y = radii.slice(4).map((v) => fmtLen(v, unit));
  if (x.every((s, i) => s === y[i])) return collapse(x).join(" ");
  return `${collapse(x).join(" ")} / ${collapse(y).join(" ")}`;
}

export function cssShorthand(radii: Radii, unit: Unit, squircle: boolean): string {
  const lines = [`border-radius: ${shorthandValue(radii, unit)};`];
  if (squircle) lines.push("corner-shape: squircle;");
  return lines.join("\n");
}

export function cssLonghand(radii: Radii, unit: Unit, squircle: boolean): string {
  const lines = CSS_CORNERS.map((name, i) => {
    const x = fmtLen(radii[i], unit);
    const y = fmtLen(radii[i + 4], unit);
    return `border-${name}-radius: ${x === y ? x : `${x} ${y}`};`;
  });
  if (squircle) lines.push("corner-shape: squircle;");
  return lines.join("\n");
}

/** The declarations wrapped in a rule, for the downloadable .css file. */
export function cssFile(text: string): string {
  return `.shape {\n${text
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n")}\n}\n`;
}

// ---------------------------------------------------------------------------
// Tailwind output (default theme of Tailwind CSS v4)
// ---------------------------------------------------------------------------

export const TW_SCALE = [
  { name: "none", px: 0 },
  { name: "xs", px: 2 },
  { name: "sm", px: 4 },
  { name: "md", px: 6 },
  { name: "lg", px: 8 },
  { name: "xl", px: 12 },
  { name: "2xl", px: 16 },
  { name: "3xl", px: 24 },
  { name: "4xl", px: 32 },
] as const;

export interface ScaleMatch {
  name: string;
  px: number | null;
  diff: number;
  exact: boolean;
}

/** Closest default-theme step for a pixel value, or null when nothing is close. */
export function scaleMatch(px: number): ScaleMatch | null {
  if (px >= LIMITS.px) return { name: "full", px: null, diff: 0, exact: true };
  let best: (typeof TW_SCALE)[number] = TW_SCALE[0];
  for (const step of TW_SCALE) if (Math.abs(step.px - px) < Math.abs(best.px - px)) best = step;
  const diff = round2(Math.abs(best.px - px));
  if (diff > Math.max(2, px * 0.25)) return null;
  return { name: best.name, px: best.px, diff, exact: diff === 0 };
}

export interface TailwindRow {
  label: string;
  code: string;
  note?: string;
}

function twValue(v: string): string {
  return v.replace(/\s*\/\s*/g, "/").replace(/\s+/g, "_");
}

export function tailwindRows(radii: Radii, unit: Unit, squircle: boolean): TailwindRow[] {
  const extra = squircle ? " [corner-shape:squircle]" : "";
  const rows: TailwindRow[] = [];
  const uniform = radii.every((v) => v === radii[0]);
  const allZero = uniform && radii[0] === 0;

  rows.push(
    allZero
      ? { label: "Class", code: `rounded-none${extra}` }
      : { label: "Arbitrary value (exact)", code: `rounded-[${twValue(shorthandValue(radii, unit))}]${extra}` },
  );

  if (uniform && !allZero) {
    if (unit === "px") {
      const m = scaleMatch(radii[0]);
      if (m) {
        const note = m.exact
          ? m.name === "full"
            ? "rounded-full caps the radius at half the shorter side, so it draws a circle or pill on any box."
            : `Exact match: ${m.px}px in the default theme.`
          : `Closest step, ${m.px}px, which is ${m.diff}px ${m.px! > radii[0] ? "larger" : "smaller"} than your value.`;
        rows.push({ label: "Nearest scale class", code: `rounded-${m.name}${extra}`, note });
      } else {
        rows.push({
          label: "Nearest scale class",
          code: "",
          note: `No default step is near ${fmtNum(radii[0])}px (the scale stops at rounded-4xl, 32px, then rounded-full). Use the arbitrary value.`,
        });
      }
    } else if (radii[0] === 50) {
      rows.push({
        label: "Nearest scale class",
        code: `rounded-full${extra}`,
        note: "Matches 50% on a square box. On a wider box 50% is an ellipse while rounded-full stays a pill.",
      });
    }
  }

  if (!uniform) {
    const parts = TW_CORNERS.map((c, i) => {
      const x = radii[i];
      const y = radii[i + 4];
      if (unit === "px" && x === y) {
        const m = scaleMatch(x);
        if (m?.exact) return `rounded-${c}-${m.name}`;
      }
      const xs = fmtLen(x, unit);
      const ys = fmtLen(y, unit);
      return `rounded-${c}-[${x === y ? xs : `${xs}_${ys}`}]`;
    });
    rows.push({
      label: "Per-corner classes",
      code: parts.join(" ") + extra,
      note: "Same shape, written corner by corner. Exact scale names are used where one matches.",
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Importing existing CSS
// ---------------------------------------------------------------------------

export type ParseResult = { ok: true; radii: Radii; unit: Unit; note?: string } | { ok: false; error: string };

function expandFour<T>(v: T[]): T[] {
  if (v.length === 1) return [v[0], v[0], v[0], v[0]];
  if (v.length === 2) return [v[0], v[1], v[0], v[1]];
  if (v.length === 3) return [v[0], v[1], v[2], v[1]];
  return v;
}

interface Token {
  n: number;
  u: "px" | "%" | "rem" | "em" | "";
}

function readToken(p: string): Token | string {
  if (p.startsWith("-")) return `Negative radii such as ${p} are invalid in CSS.`;
  const m = /^(\d*\.?\d+)(px|%|rem|em)?$/i.exec(p);
  if (!m) return `Cannot read "${p}". Use numbers with px, %, rem or em.`;
  const n = Number(m[1]);
  const u = (m[2] ?? "").toLowerCase() as Token["u"];
  if (u === "" && n !== 0) return `"${p}" needs a unit such as px or %.`;
  return { n, u };
}

/** Read one or two space-separated tokens per list, or return an error message. */
function readList(text: string, max: number): Token[] | string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 1 || parts.length > max) return max === 4 ? "Each side of the slash takes between 1 and 4 values." : "Each corner takes one or two values: horizontal, then vertical.";
  const list: Token[] = [];
  for (const p of parts) {
    const t = readToken(p);
    if (typeof t === "string") return t;
    list.push(t);
  }
  return list;
}

const LONGHAND_RE = /border-(top-left|top-right|bottom-right|bottom-left)-radius\s*:\s*([^;}]*)/gi;
const LONGHAND_ORDER = ["top-left", "top-right", "bottom-right", "bottom-left"];

/** Read a border-radius value (or a whole declaration, a set of longhand declarations, or a Tailwind arbitrary class). */
export function parseBorderRadius(input: string, w: number, h: number): ParseResult {
  if (input.length > 400) return { ok: false, error: "That is too long for a border-radius value." };
  let s = input.replace(/\/\*[\s\S]*?\*\//g, " ").trim();
  if (!s) return { ok: false, error: "Paste a border-radius value first." };

  let xs: Token[];
  let ys: Token[];
  const longhands = [...s.matchAll(LONGHAND_RE)];
  if (longhands.length > 0 && !/(^|[^-\w])border-radius\s*:/i.test(s)) {
    // Corners that are not mentioned stay square (0).
    xs = [0, 1, 2, 3].map(() => ({ n: 0, u: "" as const }));
    ys = [0, 1, 2, 3].map(() => ({ n: 0, u: "" as const }));
    for (const m of longhands) {
      const value = m[2].replace(/!important/i, "");
      if (/[()]/.test(value)) return { ok: false, error: "Functions such as calc(), var() and clamp() are not supported. Use plain px, %, rem or em values." };
      const list = readList(value, 2);
      if (typeof list === "string") return { ok: false, error: list };
      const c = LONGHAND_ORDER.indexOf(m[1].toLowerCase());
      xs[c] = list[0];
      ys[c] = list[1] ?? list[0];
    }
  } else {
    const tw = /^(?:[a-z0-9-]+:)*rounded-\[(.+)\]$/i.exec(s);
    if (tw) {
      s = tw[1].replace(/_/g, " ");
    } else {
      const decl = /border-radius\s*:\s*([^;}]*)/i.exec(s);
      s = decl ? decl[1] : s.replace(/;+\s*$/, "");
    }
    s = s.replace(/!important/i, "").trim();
    if (!s) return { ok: false, error: "There is no value after border-radius:." };
    if (/[()]/.test(s)) return { ok: false, error: "Functions such as calc(), var() and clamp() are not supported. Use plain px, %, rem or em values." };

    const halves = s.split("/");
    if (halves.length > 2) return { ok: false, error: "A border-radius value can contain only one slash." };
    const tokens: Token[][] = [];
    for (const half of halves) {
      const list = readList(half, 4);
      if (typeof list === "string") return { ok: false, error: list };
      tokens.push(list);
    }
    xs = expandFour(tokens[0]);
    ys = expandFour(tokens[1] ?? tokens[0]);
  }
  const all = [...xs, ...ys];
  const nonZero = all.filter((t) => t.n !== 0);
  const hasPct = nonZero.some((t) => t.u === "%");
  const hasLen = nonZero.some((t) => t.u !== "%");
  const notes: string[] = [];

  let unit: Unit;
  let values: number[];
  if (hasPct && hasLen) {
    unit = "px";
    values = all.map((t, i) => (t.u === "%" ? (t.n / 100) * axisLength(i, w, h) : t.u === "rem" || t.u === "em" ? t.n * 16 : t.n));
    notes.push("Percent and length values were mixed, so everything was converted to px for the current box size.");
  } else if (hasPct) {
    unit = "%";
    values = all.map((t) => t.n);
  } else {
    unit = "px";
    values = all.map((t) => (t.u === "rem" || t.u === "em" ? t.n * 16 : t.n));
    if (nonZero.some((t) => t.u === "rem" || t.u === "em")) notes.push("rem and em values were converted to px at 16px each.");
  }
  const clamped = values.map((v) => clampRadius(v, unit));
  if (clamped.some((v, i) => v !== round2(values[i]))) notes.push(`Values above ${maxFor(unit)}${unit} were capped.`);
  return { ok: true, radii: clamped, unit, note: notes.length ? notes.join(" ") : undefined };
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export interface Preset {
  id: string;
  name: string;
  unit: Unit;
  radii: Radii;
  /** Box the preset is designed for; applied when set. */
  box?: [number, number];
}

const same = (n: number): Radii => Array(8).fill(n);
const blob = (x: number[], y: number[]): Radii => [...x, ...y];

export const PRESETS: Preset[] = [
  { id: "square", name: "Square", unit: "px", radii: same(0) },
  { id: "rounded", name: "Rounded", unit: "px", radii: same(12) },
  { id: "pill", name: "Pill", unit: "px", radii: same(9999), box: [320, 120] },
  { id: "circle", name: "Circle", unit: "%", radii: same(50), box: [240, 240] },
  { id: "ellipse", name: "Ellipse", unit: "%", radii: same(50), box: [320, 200] },
  { id: "leaf", name: "Leaf", unit: "%", radii: blob([0, 100, 0, 100], [0, 100, 0, 100]), box: [240, 240] },
  { id: "teardrop", name: "Teardrop", unit: "%", radii: blob([0, 50, 50, 50], [0, 50, 50, 50]), box: [240, 240] },
  { id: "tab", name: "Tab", unit: "px", radii: blob([16, 16, 0, 0], [16, 16, 0, 0]), box: [320, 120] },
  { id: "bubble", name: "Bubble", unit: "px", radii: blob([24, 24, 24, 4], [24, 24, 24, 4]), box: [320, 160] },
  { id: "squircle-ish", name: "Soft square", unit: "%", radii: same(30), box: [240, 240] },
  { id: "blob-1", name: "Blob 1", unit: "%", radii: blob([30, 70, 70, 30], [30, 30, 70, 70]), box: [260, 260] },
  { id: "blob-2", name: "Blob 2", unit: "%", radii: blob([58, 42, 38, 62], [42, 55, 45, 58]), box: [260, 260] },
  { id: "blob-3", name: "Blob 3", unit: "%", radii: blob([40, 60, 65, 35], [55, 35, 65, 45]), box: [260, 260] },
  { id: "egg", name: "Egg", unit: "%", radii: blob([50, 50, 50, 50], [60, 60, 40, 40]), box: [220, 280] },
];
