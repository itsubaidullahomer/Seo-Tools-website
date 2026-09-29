/**
 * Small colour engine for the box shadow generator.
 *
 * Colours are stored as OKLCH plus alpha, so an OKLCH value typed by the user
 * survives untouched and hue stays put when chroma is zero. HEX, RGB and HSL
 * are derived on demand, with out-of-range OKLCH colours mapped into sRGB by
 * reducing chroma (lightness and hue are kept).
 *
 * Conversion matrices are the published OKLab ones by Bjorn Ottosson.
 * Everything here is pure and safe to run on the server.
 */

export interface Color {
  /** Lightness, 0 (black) to 1 (white). */
  l: number;
  /** Chroma, 0 (grey) to roughly 0.4. */
  c: number;
  /** Hue angle in degrees, 0 to 360. */
  h: number;
  /** Opacity, 0 to 1. */
  a: number;
}

export type ColorFormat = "rgb" | "hex" | "hsl" | "oklch";

export const COLOR_FORMATS: readonly ColorFormat[] = ["rgb", "hex", "hsl", "oklch"];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Round to `dp` decimals and never return -0. */
export function round(n: number, dp = 0): number {
  const p = 10 ** dp;
  const r = Math.round(n * p) / p;
  return Object.is(r, -0) ? 0 : r;
}

/** Format a number with at most `dp` decimals and no trailing zeros. */
export function trimNum(n: number, dp = 2): string {
  return String(round(n, dp));
}

// ---------------------------------------------------------------------------
// Colour space maths
// ---------------------------------------------------------------------------

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toGamma = (v: number) => {
  const s = v < 0 ? -1 : 1;
  const x = Math.abs(v);
  return s * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
};

/** OKLCH to gamma-encoded sRGB, not clamped (may fall outside 0-1). */
function oklchToRgbRaw(l: number, c: number, h: number): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    toGamma(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    toGamma(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    toGamma(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

const EPS = 1e-4;
const inRange = (rgb: [number, number, number]) => rgb.every((v) => v >= -EPS && v <= 1 + EPS);

export interface Srgb {
  r: number;
  g: number;
  b: number;
  /** False when the OKLCH colour had to be mapped into the sRGB range. */
  inGamut: boolean;
}

/** OKLCH to sRGB (0-1 per channel), reducing chroma when the colour is out of range. */
export function toSrgb(color: Pick<Color, "l" | "c" | "h">): Srgb {
  const l = clamp(color.l, 0, 1);
  const h = color.h;
  let c = Math.max(0, color.c);
  let raw = oklchToRgbRaw(l, c, h);
  let inGamut = true;
  if (!inRange(raw)) {
    inGamut = false;
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inRange(oklchToRgbRaw(l, mid, h))) lo = mid;
      else hi = mid;
    }
    c = lo;
    raw = oklchToRgbRaw(l, c, h);
  }
  const [r, g, b] = raw.map((v) => clamp(v, 0, 1));
  return { r, g, b, inGamut };
}

/** Gamma-encoded sRGB (0-1) to OKLCH. */
export function srgbToOklch(r: number, g: number, b: number): Pick<Color, "l" | "c" | "h"> {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bb);
  // Below this chroma the hue is numerical noise, so treat the colour as grey.
  if (chroma < 2e-4) return { l: round(L, 6), c: 0, h: 0 };
  let hue = (Math.atan2(bb, a) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  return { l: round(L, 6), c: round(chroma, 6), h: round(hue, 4) };
}

/** Build a stored colour from 8-bit sRGB channels and an alpha of 0-1. */
export function colorFromRgb255(r: number, g: number, b: number, a = 1): Color {
  // Browsers store 8-bit channels, so snap fractional input such as rgb(10% 20% 30%) first.
  return { ...srgbToOklch(Math.round(r) / 255, Math.round(g) / 255, Math.round(b) / 255), a: clamp(a, 0, 1) };
}

/** Sanitise a colour that came from storage or user input. */
export function normalizeColor(value: unknown, fallback: Color): Color {
  if (!value || typeof value !== "object") return fallback;
  const v = value as Record<string, unknown>;
  const num = (x: unknown, d: number) => (typeof x === "number" && Number.isFinite(x) ? x : d);
  const h = num(v.h, fallback.h);
  return {
    l: clamp(num(v.l, fallback.l), 0, 1),
    c: clamp(num(v.c, fallback.c), 0, 0.5),
    h: ((h % 360) + 360) % 360,
    a: clamp(num(v.a, fallback.a), 0, 1),
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function rgb255(color: Color): [number, number, number] {
  const { r, g, b } = toSrgb(color);
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hsl(color: Color): [number, number, number] {
  const [r8, g8, b8] = rgb255(color);
  const r = r8 / 255;
  const g = g8 / 255;
  const b = b8 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, Math.round(l * 100)];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [Math.round(h) % 360, Math.round(s * 100), Math.round(l * 100)];
}

const hex2 = (n: number) => n.toString(16).padStart(2, "0");

/** Alpha as a short decimal such as 0.15 or 1. */
export function formatAlpha(a: number): string {
  return trimNum(clamp(a, 0, 1), 3);
}

/** Six-digit hex for `<input type="color">` (alpha ignored). */
export function toHex6(color: Color): string {
  const [r, g, b] = rgb255(color);
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

/**
 * Format a colour for CSS. With `alpha: false` the alpha channel is left out,
 * which is what the colour text field shows (opacity has its own slider).
 */
export function formatColor(color: Color, format: ColorFormat, options: { alpha?: boolean } = {}): string {
  const withAlpha = options.alpha !== false && color.a < 1;
  const a = formatAlpha(color.a);
  switch (format) {
    case "hex": {
      const hex = toHex6(color);
      return withAlpha ? `${hex}${hex2(Math.round(clamp(color.a, 0, 1) * 255))}` : hex;
    }
    case "rgb": {
      const [r, g, b] = rgb255(color);
      return withAlpha ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    }
    case "hsl": {
      const [h, s, l] = hsl(color);
      return withAlpha ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`;
    }
    case "oklch": {
      const body = `${trimNum(color.l, 3)} ${trimNum(color.c, 3)} ${trimNum(color.c === 0 ? 0 : color.h, 1)}`;
      return withAlpha ? `oklch(${body} / ${a})` : `oklch(${body})`;
    }
  }
}

/** Black or white, whichever reads better on the given colour. */
export function readableInk(color: Color): "dark" | "light" {
  return color.l > 0.62 ? "dark" : "light";
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export type ParseResult = { ok: true; color: Color; hasAlpha: boolean } | { ok: false; error: string };

const NAMED: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  silver: [192, 192, 192],
  red: [255, 0, 0],
  maroon: [128, 0, 0],
  orange: [255, 165, 0],
  yellow: [255, 255, 0],
  lime: [0, 255, 0],
  green: [0, 128, 0],
  teal: [0, 128, 128],
  aqua: [0, 255, 255],
  cyan: [0, 255, 255],
  blue: [0, 0, 255],
  navy: [0, 0, 128],
  purple: [128, 0, 128],
  fuchsia: [255, 0, 255],
  magenta: [255, 0, 255],
  pink: [255, 192, 203],
  brown: [165, 42, 42],
  gold: [255, 215, 0],
  indigo: [75, 0, 130],
  crimson: [220, 20, 60],
  tomato: [255, 99, 71],
  coral: [255, 127, 80],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
};

const BAD_FORMAT =
  "Use a HEX, rgb(), hsl() or oklch() color, for example #0f172a, rgb(15 23 42) or oklch(0.25 0.03 260).";

const NUM = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/;

/** A number or a percentage token. `pctBase` is what 100% means. */
function numOrPct(token: string, pctBase: number): number | null {
  if (token === "none") return 0;
  if (token.endsWith("%")) {
    const body = token.slice(0, -1);
    return NUM.test(body) ? (Number(body) / 100) * pctBase : null;
  }
  return NUM.test(token) ? Number(token) : null;
}

/** Hue token: a number, or a number with deg/turn/rad/grad. */
function hueToken(token: string): number | null {
  if (token === "none") return 0;
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(deg|turn|rad|grad)?$/.exec(token);
  if (!m) return null;
  const n = Number(m[1]);
  switch (m[2]) {
    case "turn":
      return n * 360;
    case "rad":
      return (n * 180) / Math.PI;
    case "grad":
      return n * 0.9;
    default:
      return n;
  }
}

function alphaToken(token: string | undefined): number | null {
  if (token === undefined) return 1;
  const v = numOrPct(token, 1);
  return v === null ? null : clamp(v, 0, 1);
}

const wrapHue = (h: number) => ((h % 360) + 360) % 360;

function hslToRgb255(h: number, s: number, l: number): [number, number, number] {
  const sat = clamp(s, 0, 100) / 100;
  const lig = clamp(l, 0, 100) / 100;
  const k = (n: number) => (n + wrapHue(h) / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/**
 * Parse a CSS colour typed by the user: HEX (3, 4, 6 or 8 digits), rgb()/rgba(),
 * hsl()/hsla(), oklch() in modern or legacy syntax, and a few colour names.
 */
export function parseColor(input: string): ParseResult {
  const text = input.trim().toLowerCase();
  if (!text) return { ok: false, error: "Enter a color." };

  if (text === "transparent") return { ok: true, color: { l: 0, c: 0, h: 0, a: 0 }, hasAlpha: true };
  if (NAMED[text]) {
    const [r, g, b] = NAMED[text];
    return { ok: true, color: colorFromRgb255(r, g, b), hasAlpha: false };
  }

  const hexMatch = /^#?([0-9a-f]+)$/.exec(text);
  if (hexMatch) {
    const digits = hexMatch[1];
    const hasHash = text.startsWith("#");
    const okLength = digits.length === 6 || digits.length === 8 || (hasHash && (digits.length === 3 || digits.length === 4));
    if (!okLength) return { ok: false, error: "A HEX color has 3, 4, 6 or 8 digits, for example #0f172a." };
    const full = digits.length <= 4 ? digits.split("").map((d) => d + d).join("") : digits;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const hasAlpha = full.length === 8;
    const a = hasAlpha ? parseInt(full.slice(6, 8), 16) / 255 : 1;
    return { ok: true, color: colorFromRgb255(r, g, b, round(a, 3)), hasAlpha };
  }

  const fn = /^(rgba?|hsla?|oklch)\(\s*([^)]*?)\s*\)$/.exec(text);
  if (!fn) return { ok: false, error: BAD_FORMAT };
  const name = fn[1];
  const [left, right, ...extra] = fn[2].split("/");
  if (extra.length) return { ok: false, error: BAD_FORMAT };
  const parts = left.split(/[\s,]+/).filter(Boolean);
  let alphaRaw: string | undefined = right !== undefined ? right.trim() : undefined;
  if (right === undefined && parts.length === 4) alphaRaw = parts.pop();
  if (right !== undefined && alphaRaw === "") return { ok: false, error: "Add an opacity after the slash, for example / 0.4." };
  if (parts.length !== 3) return { ok: false, error: `${name}() needs three values before the optional opacity.` };
  const alpha = alphaToken(alphaRaw);
  if (alpha === null) return { ok: false, error: "Opacity must be a number from 0 to 1 or a percentage." };
  const hasAlpha = alphaRaw !== undefined;

  if (name === "rgb" || name === "rgba") {
    const ch = parts.map((p) => numOrPct(p, 255));
    if (ch.some((v) => v === null)) return { ok: false, error: "rgb() values must be numbers from 0 to 255 or percentages." };
    const [r, g, b] = (ch as number[]).map((v) => clamp(v, 0, 255));
    return { ok: true, color: colorFromRgb255(r, g, b, alpha), hasAlpha };
  }

  if (name === "hsl" || name === "hsla") {
    const h = hueToken(parts[0]);
    const s = numOrPct(parts[1], 100);
    const l = numOrPct(parts[2], 100);
    if (h === null || s === null || l === null) return { ok: false, error: "hsl() needs a hue in degrees and saturation and lightness in percent." };
    const [r, g, b] = hslToRgb255(h, s, l);
    return { ok: true, color: colorFromRgb255(r, g, b, alpha), hasAlpha };
  }

  // oklch
  const l = numOrPct(parts[0], 1);
  const c = numOrPct(parts[1], 0.4);
  const h = hueToken(parts[2]);
  if (l === null || c === null || h === null) return { ok: false, error: "oklch() needs lightness (0 to 1 or 0% to 100%), chroma and a hue in degrees." };
  if (parts[0] !== "none" && !parts[0].endsWith("%") && (l < 0 || l > 1)) {
    return { ok: false, error: "OKLCH lightness is a number from 0 to 1, or a percentage such as 60%." };
  }
  return {
    ok: true,
    color: { l: round(clamp(l, 0, 1), 6), c: round(clamp(c, 0, 0.5), 6), h: round(wrapHue(h), 4), a: alpha },
    hasAlpha,
  };
}

/** Convenience for constants: parse a known-good colour string. */
export function color(text: string, alpha?: number): Color {
  const r = parseColor(text);
  if (!r.ok) throw new Error(`Invalid built-in colour "${text}"`);
  return alpha === undefined ? r.color : { ...r.color, a: alpha };
}
