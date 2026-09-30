/**
 * Pure helpers for the PX to REM converter. No DOM access, so everything here
 * can be unit-tested in Node and is safe to import during server rendering.
 */

export type Unit = "px" | "rem";
export type Mode = "px-to-rem" | "rem-to-px";

export const DEFAULT_ROOT = 16;
export const MAX_ROOT = 1000;
export const MAX_VALUE = 1_000_000_000;
export const MAX_BULK_CHARS = 1_000_000;
export const MAX_DECIMALS = 8;
export const TABLE_MAX_PX = 128;

// ---------------------------------------------------------------- numbers

export type Parsed = { kind: "empty" } | { kind: "invalid"; hint: string } | { kind: "ok"; value: number };

const OTHER_UNITS = /^(px|rem|em|ex|ch|pt|pc|in|cm|mm|q|vw|vh|vmin|vmax|cqi|cqw|cqh|lh|rlh|%|deg|s|ms)$/i;

/**
 * Parse a length typed by a person. Accepts `16`, `16px`, `1.5 rem`, `.5`,
 * `+4`, `-8`, `1,024` (thousands separators) and a Unicode minus. Anything
 * else returns a hint explaining what to change instead of guessing.
 */
export function parseLength(raw: string, unit: Unit): Parsed {
  const text = raw.trim().replace(/−/g, "-");
  if (!text) return { kind: "empty" };
  const m = /^([+-]?)\s*((?:\d[\d,]*\.?\d*)|(?:\.\d+))\s*([a-zA-Z%]*)$/.exec(text);
  if (!m) return { kind: "invalid", hint: `Enter a number such as 16 or 1.5. "${text.length > 24 ? text.slice(0, 24) + "…" : text}" is not a number.` };
  const [, sign, numText, suffix] = m;
  if (suffix && suffix.toLowerCase() !== unit) {
    return {
      kind: "invalid",
      hint: OTHER_UNITS.test(suffix)
        ? `This field takes ${unit}. "${suffix}" is a different unit, so enter just the number.`
        : `Unknown unit "${suffix}". Enter a plain number or a value in ${unit}.`,
    };
  }
  let cleaned = numText;
  if (cleaned.includes(",")) {
    if (!/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(cleaned)) {
      return { kind: "invalid", hint: "Use a dot as the decimal separator (1.5, not 1,5)." };
    }
    cleaned = cleaned.replace(/,/g, "");
  }
  const value = Number(cleaned) * (sign === "-" ? -1 : 1);
  if (!Number.isFinite(value)) return { kind: "invalid", hint: "That is not a valid number." };
  if (Math.abs(value) > MAX_VALUE) return { kind: "invalid", hint: "That value is too large. The limit is 1,000,000,000." };
  return { kind: "ok", value };
}

/** Parse the root font size: a positive number of pixels up to MAX_ROOT. */
export function parseRoot(raw: string): Parsed {
  const p = parseLength(raw, "px");
  if (p.kind !== "ok") return p;
  if (p.value <= 0) return { kind: "invalid", hint: "The root font size must be greater than 0." };
  if (p.value > MAX_ROOT) return { kind: "invalid", hint: `The root font size cannot be above ${MAX_ROOT}px.` };
  return p;
}

/** Format a number with at most `decimals` places, trimming trailing zeros and avoiding "-0". */
export function formatNum(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return "";
  const d = Math.min(MAX_DECIMALS, Math.max(0, Math.round(decimals)));
  let s = n.toFixed(d);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s === "-0" ? "0" : s;
}

export interface Converted {
  px: number;
  rem: number;
  /** em against `parent` (px). */
  em: number;
}

/** Convert a value typed in `mode`'s source unit into px, rem and em. */
export function convertSingle(value: number, mode: Mode, root: number, parent: number): Converted {
  const px = mode === "px-to-rem" ? value : value * root;
  const rem = mode === "px-to-rem" ? value / root : value;
  return { px, rem, em: px / parent };
}

// ---------------------------------------------------------------- Tailwind

export type UseAs = "font-size" | "padding" | "margin" | "gap" | "width" | "height";
export type TwVersion = "v4" | "v3";

export const USE_AS: { value: UseAs; label: string; prefix: string }[] = [
  { value: "font-size", label: "font-size", prefix: "text" },
  { value: "padding", label: "padding", prefix: "p" },
  { value: "margin", label: "margin", prefix: "m" },
  { value: "gap", label: "gap", prefix: "gap" },
  { value: "width", label: "width", prefix: "w" },
  { value: "height", label: "height", prefix: "h" },
];

/** Tailwind v3 default spacing scale, in units of 0.25rem (plus the `px` step handled separately). */
const V3_SPACING = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96];

/** Tailwind default type scale (identical in v3 and v4), in rem. */
const TEXT_SCALE: [string, number][] = [
  ["xs", 0.75],
  ["sm", 0.875],
  ["base", 1],
  ["lg", 1.125],
  ["xl", 1.25],
  ["2xl", 1.5],
  ["3xl", 1.875],
  ["4xl", 2.25],
  ["5xl", 3],
  ["6xl", 3.75],
  ["7xl", 4.5],
  ["8xl", 6],
  ["9xl", 8],
];

export interface TailwindResult {
  applicable: boolean;
  reason?: string;
  /** A named or numeric class that equals the value exactly. */
  exact: string | null;
  /** Arbitrary-value class, always valid, e.g. `p-[0.8125rem]`. */
  arbitrary: string;
  /** Closest step on the scale when there is no exact class. */
  nearest: { className: string; rem: number } | null;
}

const closeTo = (a: number, b: number) => Math.abs(a - b) < 1e-9;

function nearestOf(values: number[], target: number): number {
  let best = values[0];
  for (const v of values) {
    const d = Math.abs(v - target);
    const bd = Math.abs(best - target);
    if (d < bd - 1e-12 || (closeTo(d, bd) && v < best)) best = v;
  }
  return best;
}

/**
 * Map a length onto Tailwind's default scale.
 *
 * v4 builds spacing utilities from `--spacing: 0.25rem`, and accepts any
 * multiple of 0.25 (p-6, p-3.25, p-0.75). v3 only has the fixed list above.
 * Text sizes use the same named scale in both versions.
 */
export function tailwindFor(rem: number, px: number, useAs: UseAs, version: TwVersion, decimals: number): TailwindResult {
  const prefix = USE_AS.find((u) => u.value === useAs)?.prefix ?? "p";
  const remText = formatNum(rem, decimals);
  const none = (reason: string): TailwindResult => ({ applicable: false, reason, exact: null, arbitrary: "", nearest: null });

  if (useAs === "font-size") {
    if (rem < 0) return none("Font sizes cannot be negative.");
    const arbitrary = `text-[${remText}rem]`;
    const hit = TEXT_SCALE.find(([, v]) => closeTo(v, rem));
    if (hit) return { applicable: true, exact: `text-${hit[0]}`, arbitrary, nearest: null };
    const nearV = nearestOf(
      TEXT_SCALE.map(([, v]) => v),
      rem,
    );
    const near = TEXT_SCALE.find(([, v]) => v === nearV)!;
    return { applicable: true, exact: null, arbitrary, nearest: { className: `text-${near[0]}`, rem: near[1] } };
  }

  const negative = rem < 0;
  if (negative && useAs !== "margin") return none(`Negative values are not valid for ${useAs}.`);
  const neg = negative ? "-" : "";
  const abs = Math.abs(rem);
  const arbitrary = `${neg}${prefix}-[${formatNum(abs, decimals)}rem]`;

  if (closeTo(Math.abs(px), 1)) return { applicable: true, exact: `${neg}${prefix}-px`, arbitrary, nearest: null };

  const n = abs / 0.25;
  const num = (v: number) => formatNum(v, 2);

  if (version === "v4") {
    const steps = n * 4;
    if (closeTo(steps, Math.round(steps))) return { applicable: true, exact: `${neg}${prefix}-${num(n)}`, arbitrary, nearest: null };
    const nearN = Math.round(steps) / 4;
    return { applicable: true, exact: null, arbitrary, nearest: { className: `${neg}${prefix}-${num(nearN)}`, rem: nearN * 0.25 } };
  }

  const hit = V3_SPACING.find((v) => closeTo(v, n));
  if (hit !== undefined) return { applicable: true, exact: `${neg}${prefix}-${num(hit)}`, arbitrary, nearest: null };
  const nearN = nearestOf(V3_SPACING, n);
  return { applicable: true, exact: null, arbitrary, nearest: { className: `${neg}${prefix}-${num(nearN)}`, rem: nearN * 0.25 } };
}

// ---------------------------------------------------------------- reference table

export interface TableRow {
  px: number;
  rem: string;
  tailwind: string;
}

/** Rows for 1..max px at the given root size. The Tailwind column is the exact class or an arbitrary value. */
export function buildTable(root: number, decimals: number, useAs: UseAs, version: TwVersion, max = TABLE_MAX_PX): TableRow[] {
  const rows: TableRow[] = [];
  for (let px = 1; px <= max; px++) {
    const rem = px / root;
    const tw = tailwindFor(rem, px, useAs, version, decimals);
    rows.push({ px, rem: formatNum(rem, decimals), tailwind: tw.exact ?? tw.arbitrary });
  }
  return rows;
}

export function tableToCsv(rows: TableRow[], tailwindHeader: string): string {
  return ["px,rem," + tailwindHeader, ...rows.map((r) => `${r.px},${r.rem},${r.tailwind}`)].join("\n");
}

// ---------------------------------------------------------------- bulk CSS

export interface BulkOptions {
  from: Unit;
  root: number;
  decimals: number;
  /** Also convert values inside @media and @container preludes. */
  convertQueries: boolean;
  /** Comma/space separated numbers to leave alone, e.g. "0, 1px". */
  ignore: string;
  /** Comma/space separated property names to leave alone; `*` is a wildcard. */
  skipProps: string;
}

export interface BulkResult {
  output: string;
  converted: number;
  ignored: number;
  skippedQueries: number;
  skippedProps: number;
  invalidIgnore: string[];
}

const MASK = "\u0001";
const isIdentChar = (c: string | undefined) => !!c && /[\w-]/.test(c);

/**
 * Replace comments, strings and url(...) with a filler character of the same
 * length. Because the length never changes, positions found in the masked text
 * can be applied to the original text directly, which is how whitespace and
 * protected regions are preserved byte for byte.
 */
export function maskProtected(src: string): string {
  const parts: string[] = [];
  const n = src.length;
  let plainStart = 0;
  let i = 0;
  const cover = (from: number, to: number) => {
    if (from > plainStart) parts.push(src.slice(plainStart, from));
    parts.push(MASK.repeat(to - from));
    plainStart = to;
    i = to;
  };
  while (i < n) {
    const ch = src[i];
    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      cover(i, end === -1 ? n : end + 2);
      continue;
    }
    // SCSS/Less style line comments: only when `//` starts a token, so `a//b` inside a value is untouched.
    if (ch === "/" && src[i + 1] === "/" && (i === 0 || /[\s;{}]/.test(src[i - 1]))) {
      let end = src.indexOf("\n", i);
      if (end === -1) end = n;
      cover(i, end);
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < n) {
        const c = src[j];
        if (c === "\\") {
          j += 2;
          continue;
        }
        if (c === ch) {
          j++;
          break;
        }
        if (c === "\n") break; // an unterminated string ends at the line break
        j++;
      }
      cover(i, Math.min(j, n));
      continue;
    }
    if ((ch === "u" || ch === "U") && src.substr(i, 4).toLowerCase() === "url(" && !isIdentChar(src[i - 1])) {
      let j = i + 4;
      while (j < n && /\s/.test(src[j])) j++;
      if (src[j] !== '"' && src[j] !== "'") {
        const close = src.indexOf(")", j);
        cover(i, close === -1 ? n : close + 1);
        continue;
      }
    }
    i++;
  }
  if (plainStart < n) parts.push(src.slice(plainStart));
  return parts.join("");
}

export function parseIgnoreList(raw: string, unit: Unit): { values: Set<number>; invalid: string[] } {
  const values = new Set<number>();
  const invalid: string[] = [];
  for (const tok of raw.split(/[\s,;]+/).filter(Boolean)) {
    const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(px|rem)?$/i.exec(tok);
    if (!m) {
      invalid.push(tok);
      continue;
    }
    const u = m[2]?.toLowerCase();
    if (u && u !== unit) continue; // "1px" does not apply when converting rem
    values.add(Math.abs(Number(m[1])));
  }
  return { values, invalid };
}

/** A compiled property pattern: lower-case text where `*` matches any run of characters. */
export type PropPattern = string;

export function parseSkipProps(raw: string): PropPattern[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase().replace(/\*+/g, "*"))
    .filter(Boolean);
}

/** Wildcard match with `*` only. Iterative (no regex), so odd patterns cannot cause runaway backtracking. */
export function matchProp(pattern: PropPattern, name: string): boolean {
  let p = 0;
  let n = 0;
  let star = -1;
  let mark = 0;
  while (n < name.length) {
    if (p < pattern.length && pattern[p] === "*") {
      star = p++;
      mark = n;
    } else if (p < pattern.length && pattern[p] === name[n]) {
      p++;
      n++;
    } else if (star !== -1) {
      p = star + 1;
      n = ++mark;
    } else {
      return false;
    }
  }
  while (p < pattern.length && pattern[p] === "*") p++;
  return p === pattern.length;
}

/**
 * Convert every `px` (or `rem`) length in a block of CSS. The pass is
 * CSS-aware: comments, strings and url() are masked; selectors and at-rule
 * names are never touched; @media and @container conditions are skipped unless
 * asked for; the ignore list and skipped properties are honoured; whitespace
 * is preserved exactly.
 */
export function convertCss(input: string, o: BulkOptions): BulkResult {
  const masked = maskProtected(input);
  const target: Unit = o.from === "px" ? "rem" : "px";
  const { values: ignore, invalid } = parseIgnoreList(o.ignore, o.from);
  const skipProps = parseSkipProps(o.skipProps);
  const unitRe = new RegExp(`(^|[\\s${MASK}(,:/*+=<>])([+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+))(${o.from})(?![\\w%.-])`, "gi");

  const edits: { start: number; end: number; text: string }[] = [];
  const tally = { converted: 0, ignored: 0, skippedQueries: 0, skippedProps: 0 };

  const scan = (start: number, end: number, mode: "convert" | "query" | "prop") => {
    if (end <= start) return;
    const seg = masked.slice(start, end);
    unitRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = unitRe.exec(seg))) {
      const n = Number(m[2]);
      if (!Number.isFinite(n)) continue;
      if (mode === "query") {
        tally.skippedQueries++;
        continue;
      }
      if (mode === "prop") {
        tally.skippedProps++;
        continue;
      }
      if (ignore.has(Math.abs(n))) {
        tally.ignored++;
        continue;
      }
      const from = start + m.index + m[1].length;
      const result = o.from === "px" ? n / o.root : n * o.root;
      edits.push({ start: from, end: from + m[2].length + m[3].length, text: formatNum(result, o.decimals) + target });
      tally.converted++;
    }
  };

  const flushPrelude = (s: number, e: number) => {
    const head = masked.slice(s, e).replace(/^[\s\u0001]+/, "");
    const at = /^@([\w-]+)/.exec(head);
    if (!at) return; // a selector: never converted
    const name = at[1].toLowerCase();
    if (name === "media" || name === "container") scan(s, e, o.convertQueries ? "convert" : "query");
    else if (name === "supports") scan(s, e, "convert");
  };

  const flushDecl = (s: number, e: number) => {
    const seg = masked.slice(s, e);
    if (!/[^\s\u0001]/.test(seg)) return;
    const head = seg.replace(/^[\s\u0001]+/, "");
    if (head.startsWith("@") && !/^@[\w-]+\s*:/.test(head)) return; // @import, @charset, @layer a, b; ...
    const colon = seg.indexOf(":");
    if (colon === -1) {
      scan(s, e, "convert"); // a bare value such as "16px 24px"
      return;
    }
    const prop = seg.slice(0, colon).replace(/\u0001/g, "").trim().toLowerCase();
    scan(s + colon + 1, e, skipProps.some((pat) => matchProp(pat, prop)) ? "prop" : "convert");
  };

  let segStart = 0;
  for (let i = 0; i < masked.length; i++) {
    const c = masked.charCodeAt(i);
    if (c === 123) {
      flushPrelude(segStart, i);
      segStart = i + 1;
    } else if (c === 125 || c === 59) {
      flushDecl(segStart, i);
      segStart = i + 1;
    }
  }
  flushDecl(segStart, masked.length);

  let output = "";
  let cursor = 0;
  for (const ed of edits) {
    output += input.slice(cursor, ed.start) + ed.text;
    cursor = ed.end;
  }
  output += input.slice(cursor);

  return { output, ...tally, invalidIgnore: invalid };
}

// ---------------------------------------------------------------- misc

/** Percentage of the 16px browser default that a root size represents, e.g. 10 -> "62.5". */
export function rootAsPercent(root: number): string {
  return formatNum((root / DEFAULT_ROOT) * 100, 4);
}

export function modeFromHash(hash: string): Mode | null {
  if (hash === "#rem-to-px") return "rem-to-px";
  if (hash === "#px-to-rem") return "px-to-rem";
  return null;
}
