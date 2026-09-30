/**
 * Pure logic for the box shadow generator: layer model, CSS / Tailwind output,
 * the smooth layered-shadow algorithm, presets and state sanitising.
 * No DOM access, so everything here can run on the server and be tested in Node.
 */
import { color, formatColor, normalizeColor, round, trimNum, type Color, type ColorFormat } from "./color";

// ---------------------------------------------------------------------------
// Types and limits
// ---------------------------------------------------------------------------

export interface ShadowLayer {
  id: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: Color;
  inset: boolean;
  visible: boolean;
}

export type LayerSpec = Omit<ShadowLayer, "id">;

export const LIMITS = {
  offset: 100,
  blur: 200,
  spread: 100,
  maxLayers: 10,
} as const;

/** Blur radius above which painting gets noticeably expensive. */
export const HEAVY_BLUR = 100;

export interface CardSettings {
  width: number;
  height: number;
  radius: number;
  lightBg: string;
  lightCard: string;
  darkBg: string;
  darkCard: string;
}

export const DEFAULT_CARD: CardSettings = {
  width: 180,
  height: 120,
  radius: 16,
  lightBg: "#f3f4f6",
  lightCard: "#ffffff",
  darkBg: "#0f1115",
  darkCard: "#1a1d23",
};

export type PreviewMode = "both" | "light" | "dark";

export interface SmoothSettings {
  /** Height of the largest layer's offset in px, 1-24. */
  elevation: number;
  /** Maximum number of layers, 2-8. */
  layers: number;
  /** Sum of the layer opacities in percent; every layer gets an equal share. */
  opacity: number;
  /** Blur radius divided by offset, 1-4. */
  softness: number;
  /** Horizontal offset as a percentage of the vertical offset, -100 to 100. */
  lean: number;
  /** Negative spread as a percentage of each layer's blur, 0-50. */
  tuck: number;
  /** Shadow colour (its alpha is ignored; opacity is set above). */
  color: Color;
}

export interface ToolState {
  layers: ShadowLayer[];
  activeId: string;
  format: ColorFormat;
  card: CardSettings;
  preview: PreviewMode;
  smooth: SmoothSettings;
  name: string;
  multiline: boolean;
}

export const SMOOTH_LIMITS = {
  elevation: [1, 24],
  layers: [2, 8],
  opacity: [5, 100],
  softness: [1, 4],
  lean: [-100, 100],
  tuck: [0, 50],
} as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ---------------------------------------------------------------------------
// CSS output
// ---------------------------------------------------------------------------

/** "0", "4px", "-2.5px". */
export function fmtLen(n: number): string {
  const r = round(n, 2);
  return r === 0 ? "0" : `${trimNum(r, 2)}px`;
}

/** One layer as a box-shadow value, e.g. `inset 0 4px 8px -2px rgba(0, 0, 0, 0.2)`. */
export function layerCss(layer: LayerSpec, format: ColorFormat): string {
  const parts: string[] = [];
  if (layer.inset) parts.push("inset");
  parts.push(fmtLen(layer.x), fmtLen(layer.y), fmtLen(layer.blur));
  if (layer.spread !== 0) parts.push(fmtLen(layer.spread));
  parts.push(formatColor(layer.color, format));
  return parts.join(" ");
}

export function visibleLayers<T extends LayerSpec>(layers: T[]): T[] {
  return layers.filter((l) => l.visible);
}

/** The value of the box-shadow property, or `none` when nothing is visible. */
export function shadowValue(layers: LayerSpec[], format: ColorFormat, separator = ", "): string {
  const vis = visibleLayers(layers);
  return vis.length ? vis.map((l) => layerCss(l, format)).join(separator) : "none";
}

/** A full `box-shadow: ...;` declaration. */
export function cssDeclaration(layers: LayerSpec[], format: ColorFormat, multiline: boolean): string {
  const vis = visibleLayers(layers);
  if (vis.length <= 1 || !multiline) return `box-shadow: ${shadowValue(layers, format)};`;
  return `box-shadow:\n${vis.map((l) => `  ${layerCss(l, format)}`).join(",\n")};`;
}

/** Turn a free-text name into the suffix of a custom property, e.g. "Card soft" -> "card-soft". */
export function sanitizeName(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/^-+shadow-/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "card";
}

function propertyBlock(name: string, layers: LayerSpec[], format: ColorFormat, multiline: boolean, indent: string): string {
  const vis = visibleLayers(layers);
  if (vis.length <= 1 || !multiline) return `${indent}--shadow-${name}: ${shadowValue(layers, format)};`;
  return `${indent}--shadow-${name}:\n${vis.map((l) => `${indent}  ${layerCss(l, format)}`).join(",\n")};`;
}

/** `:root { --shadow-name: ... }` plus a rule that uses it. */
export function cssVariable(name: string, layers: LayerSpec[], format: ColorFormat, multiline: boolean): string {
  const n = sanitizeName(name);
  return `:root {\n${propertyBlock(n, layers, format, multiline, "  ")}\n}\n\n.${n} {\n  box-shadow: var(--shadow-${n});\n}`;
}

/** Tailwind CSS v4 `@theme` block that creates a `shadow-name` utility. */
export function tailwindTheme(name: string, layers: LayerSpec[], format: ColorFormat, multiline: boolean): string {
  const n = sanitizeName(name);
  return `@theme {\n${propertyBlock(n, layers, format, multiline, "  ")}\n}\n\n/* Use it: class="shadow-${n}" */`;
}

/** Tailwind arbitrary-value class: spaces become underscores, commas separate layers. */
export function tailwindClass(layers: LayerSpec[], format: ColorFormat): string {
  const vis = visibleLayers(layers);
  if (!vis.length) return "shadow-none";
  const value = vis
    .map((l) =>
      layerCss(l, format)
        .replace(/,\s+/g, ",")
        .replace(/\s*\/\s*/g, "/")
        .replace(/\s+/g, "_"),
    )
    .join(",");
  return `shadow-[${value}]`;
}

export type OutputKind = "css" | "variable" | "tailwind" | "theme";

export function buildOutput(kind: OutputKind, layers: LayerSpec[], format: ColorFormat, multiline: boolean, name: string): string {
  switch (kind) {
    case "css":
      return cssDeclaration(layers, format, multiline);
    case "variable":
      return cssVariable(name, layers, format, multiline);
    case "tailwind":
      return tailwindClass(layers, format);
    case "theme":
      return tailwindTheme(name, layers, format, multiline);
  }
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface Note {
  level: "info" | "warning";
  text: string;
}

export function analyze(layers: ShadowLayer[]): Note[] {
  const notes: Note[] = [];
  if (layers.length > 0 && visibleLayers(layers).length === 0) {
    notes.push({ level: "info", text: "Every layer is hidden, so the output is box-shadow: none." });
  }
  const vis = visibleLayers(layers);
  const heavy = vis.filter((l) => l.blur > HEAVY_BLUR);
  if (heavy.length) {
    notes.push({
      level: "warning",
      text: `${heavy.length === 1 ? "One layer has" : `${heavy.length} layers have`} a blur radius above ${HEAVY_BLUR}px. Very large blurs are expensive to paint, especially on elements that animate or scroll.`,
    });
  }
  const clear = vis.filter((l) => l.color.a === 0);
  if (clear.length) {
    notes.push({
      level: "info",
      text: `${clear.length === 1 ? "One visible layer has" : `${clear.length} visible layers have`} 0% opacity and draws nothing. Raise the opacity or delete the layer.`,
    });
  }
  return notes;
}

// ---------------------------------------------------------------------------
// Smooth layered shadow generator
// ---------------------------------------------------------------------------

/** Layers that fit at a given elevation: tiny elevations cannot hold many distinct layers. */
export function usableLayers(elevation: number, wanted: number): number {
  return Math.min(wanted, Math.max(2, Math.ceil(elevation / 1.5)));
}

/** Snap to half pixels below 10px and whole pixels above, so output stays readable. */
function snap(v: number): number {
  return v < 10 ? Math.round(v * 2) / 2 : Math.round(v);
}

export const DEFAULT_SMOOTH: SmoothSettings = {
  elevation: 12,
  layers: 5,
  opacity: 60,
  softness: 2,
  lean: 0,
  tuck: 15,
  color: color("#0f172a"),
};

/**
 * Build a stack of layers whose offsets grow with the square of the layer index.
 * The smallest layer is a tight contact shadow and the largest one carries the
 * full elevation. Total opacity is split equally between layers.
 */
export function smoothShadow(settings: SmoothSettings): LayerSpec[] {
  const s = sanitizeSmooth(settings);
  const m = usableLayers(s.elevation, s.layers);
  const alpha = round(s.opacity / 100 / m, 3);
  const out: LayerSpec[] = [];
  for (let k = 1; k <= m; k++) {
    const f = (k / m) ** 2;
    const y = Math.max(0.5, snap(s.elevation * f));
    const blur = Math.max(1, snap(y * s.softness));
    const x = round(Math.round(((y * s.lean) / 100) * 2) / 2, 1);
    const spread = -snap((blur * s.tuck) / 100);
    out.push({
      x,
      y,
      blur,
      spread: spread === 0 ? 0 : spread,
      color: { ...s.color, a: alpha },
      inset: false,
      visible: true,
    });
  }
  return out;
}

export function sanitizeSmooth(value: unknown): SmoothSettings {
  const src = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const num = (key: keyof typeof SMOOTH_LIMITS, fallback: number, int: boolean) => {
    const raw = src[key];
    const n = typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
    const [lo, hi] = SMOOTH_LIMITS[key];
    return clamp(int ? Math.round(n) : round(n, 2), lo, hi);
  };
  return {
    elevation: num("elevation", DEFAULT_SMOOTH.elevation, true),
    layers: num("layers", DEFAULT_SMOOTH.layers, true),
    opacity: num("opacity", DEFAULT_SMOOTH.opacity, true),
    softness: num("softness", DEFAULT_SMOOTH.softness, false),
    lean: num("lean", DEFAULT_SMOOTH.lean, true),
    tuck: num("tuck", DEFAULT_SMOOTH.tuck, true),
    color: { ...normalizeColor(src.color, DEFAULT_SMOOTH.color), a: 1 },
  };
}

// ---------------------------------------------------------------------------
// Layer helpers
// ---------------------------------------------------------------------------

export function withIds(specs: LayerSpec[], prefix = "l"): ShadowLayer[] {
  return specs.map((spec, i) => ({ ...spec, id: `${prefix}${i + 1}` }));
}

export function nextLayerId(layers: ShadowLayer[]): string {
  let n = layers.length + 1;
  const taken = new Set(layers.map((l) => l.id));
  while (taken.has(`l${n}`)) n++;
  return `l${n}`;
}

export const NEW_LAYER: LayerSpec = {
  x: 0,
  y: 4,
  blur: 12,
  spread: 0,
  color: color("#000000", 0.2),
  inset: false,
  visible: true,
};

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export interface Preset {
  id: string;
  name: string;
  layers: LayerSpec[];
  /** Card and background overrides, for shadows that only work on a matching surface. */
  card?: Partial<CardSettings>;
}

function spec(x: number, y: number, blur: number, spread: number, hex: string, alpha: number, inset = false): LayerSpec {
  return { x, y, blur, spread, color: color(hex, alpha), inset, visible: true };
}

const INK = "#0f172a";

export const PRESETS: Preset[] = [
  { id: "soft", name: "Soft card", layers: smoothShadow({ ...DEFAULT_SMOOTH, elevation: 8, layers: 4, opacity: 50 }) },
  { id: "floating", name: "Floating", layers: smoothShadow({ ...DEFAULT_SMOOTH, elevation: 20, layers: 6, opacity: 65, tuck: 20 }) },
  { id: "subtle", name: "Subtle", layers: smoothShadow({ ...DEFAULT_SMOOTH, elevation: 3, layers: 2, opacity: 32, tuck: 0 }) },
  {
    id: "key-ambient",
    name: "Key + ambient",
    layers: [spec(0, 2, 4, -1, "#000000", 0.2), spec(0, 6, 16, 0, "#000000", 0.09)],
  },
  {
    id: "ring",
    name: "Hairline ring",
    layers: [spec(0, 0, 0, 1, INK, 0.08), spec(0, 1, 2, 0, INK, 0.06), spec(0, 8, 16, -4, INK, 0.1)],
  },
  {
    id: "tw-md",
    name: "Tailwind md",
    layers: [spec(0, 4, 6, -1, "#000000", 0.1), spec(0, 2, 4, -2, "#000000", 0.1)],
  },
  { id: "tw-2xl", name: "Tailwind 2xl", layers: [spec(0, 25, 50, -12, "#000000", 0.25)] },
  { id: "hard", name: "Hard offset", layers: [spec(6, 6, 0, 0, "#111111", 1)] },
  {
    id: "pressed",
    name: "Pressed",
    layers: [spec(0, 2, 4, 0, "#000000", 0.2, true), spec(0, 0, 0, 1, "#000000", 0.06, true)],
  },
  {
    id: "bevel",
    name: "Button bevel",
    layers: [spec(0, 1, 0, 0, "#ffffff", 0.8, true), spec(0, 1, 2, 0, "#000000", 0.25), spec(0, 3, 6, -2, "#000000", 0.2)],
  },
  {
    id: "neumorphic",
    name: "Neumorphic",
    layers: [spec(8, 8, 16, 0, "#a3b1c6", 0.6), spec(-8, -8, 16, 0, "#ffffff", 0.9)],
    card: { lightBg: "#e6e9ef", lightCard: "#e6e9ef", radius: 24 },
  },
  {
    id: "glow",
    name: "Orange glow",
    layers: [spec(0, 0, 4, 0, "#ff5f1f", 0.7), spec(0, 0, 32, 4, "#ff5f1f", 0.4)],
  },
  { id: "one-edge", name: "Bottom edge only", layers: [spec(0, 10, 8, -8, "#000000", 0.45)] },
  {
    id: "paper",
    name: "Stacked paper",
    layers: [
      spec(0, 1, 1, 0, "#000000", 0.15),
      spec(0, 10, 0, -5, "#ffffff", 1),
      spec(0, 10, 1, -4, "#000000", 0.15),
      spec(0, 20, 0, -10, "#ffffff", 1),
      spec(0, 20, 1, -9, "#000000", 0.15),
    ],
  },
  { id: "inner", name: "Inner shade", layers: [spec(0, 0, 24, 0, "#000000", 0.25, true)] },
  {
    id: "dramatic",
    name: "Dramatic",
    layers: [spec(0, 30, 60, -15, INK, 0.35), spec(0, 15, 30, -10, INK, 0.25), spec(0, 2, 4, 0, INK, 0.1)],
  },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export const DEFAULT_LAYERS: ShadowLayer[] = withIds(smoothShadow(DEFAULT_SMOOTH));

export const DEFAULT_STATE: ToolState = {
  layers: DEFAULT_LAYERS,
  activeId: DEFAULT_LAYERS[DEFAULT_LAYERS.length - 1].id,
  format: "rgb",
  card: DEFAULT_CARD,
  preview: "both",
  smooth: DEFAULT_SMOOTH,
  name: "card",
  multiline: true,
};

const HEX6 = /^#[0-9a-f]{6}$/i;

function sanitizeLayer(value: unknown, fallbackId: string): ShadowLayer | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const num = (x: unknown, lo: number, hi: number, d: number) => (typeof x === "number" && Number.isFinite(x) ? clamp(round(x, 2), lo, hi) : d);
  return {
    id: typeof v.id === "string" && v.id ? v.id : fallbackId,
    x: num(v.x, -LIMITS.offset, LIMITS.offset, 0),
    y: num(v.y, -LIMITS.offset, LIMITS.offset, 4),
    blur: num(v.blur, 0, LIMITS.blur, 12),
    spread: num(v.spread, -LIMITS.spread, LIMITS.spread, 0),
    color: normalizeColor(v.color, NEW_LAYER.color),
    inset: v.inset === true,
    visible: v.visible !== false,
  };
}

function sanitizeCard(value: unknown): CardSettings {
  const src = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const num = (x: unknown, lo: number, hi: number, d: number) => (typeof x === "number" && Number.isFinite(x) ? clamp(Math.round(x), lo, hi) : d);
  const hex = (x: unknown, d: string) => (typeof x === "string" && HEX6.test(x) ? x.toLowerCase() : d);
  return {
    width: num(src.width, 60, 320, DEFAULT_CARD.width),
    height: num(src.height, 40, 300, DEFAULT_CARD.height),
    radius: num(src.radius, 0, 120, DEFAULT_CARD.radius),
    lightBg: hex(src.lightBg, DEFAULT_CARD.lightBg),
    lightCard: hex(src.lightCard, DEFAULT_CARD.lightCard),
    darkBg: hex(src.darkBg, DEFAULT_CARD.darkBg),
    darkCard: hex(src.darkCard, DEFAULT_CARD.darkCard),
  };
}

/**
 * Stored state may be missing, from an older version, or edited by hand.
 * Rebuild it field by field so bad data can never crash the tool.
 */
export function normalizeState(stored: unknown): ToolState {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  let layers: ShadowLayer[];
  if (Array.isArray(src.layers)) {
    const seen = new Set<string>();
    layers = [];
    for (const raw of src.layers.slice(0, LIMITS.maxLayers)) {
      let id = `l${layers.length + 1}`;
      const l = sanitizeLayer(raw, id);
      if (!l) continue;
      id = l.id;
      let n = 1;
      while (seen.has(id)) id = `${l.id}-${n++}`;
      seen.add(id);
      layers.push({ ...l, id });
    }
  } else {
    layers = DEFAULT_LAYERS;
  }
  const activeId = typeof src.activeId === "string" && layers.some((l) => l.id === src.activeId) ? src.activeId : (layers[0]?.id ?? "");
  const name = typeof src.name === "string" ? src.name.slice(0, 40) : DEFAULT_STATE.name;
  return {
    layers,
    activeId,
    format: (["rgb", "hex", "hsl", "oklch"] as const).find((f) => f === src.format) ?? DEFAULT_STATE.format,
    card: sanitizeCard(src.card),
    preview: (["both", "light", "dark"] as const).find((p) => p === src.preview) ?? DEFAULT_STATE.preview,
    smooth: sanitizeSmooth(src.smooth),
    name,
    multiline: src.multiline === false ? false : true,
  };
}
