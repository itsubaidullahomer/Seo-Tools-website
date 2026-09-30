/**
 * Colour parsing and WCAG 2 contrast maths for the color contrast checker.
 *
 * Everything here is pure (no DOM, no storage) so it can run on the server and
 * be tested in isolation.
 *
 * - Colours are stored as 8-bit sRGB channels plus an alpha value, because that
 *   is what a browser paints and what a HEX code describes.
 * - OKLCH values outside the sRGB gamut are mapped in by lowering chroma while
 *   lightness and hue stay put.
 * - OKLab matrices are the published ones by Bjorn Ottosson.
 * - Contrast ratio and relative luminance follow the WCAG 2 definitions.
 */

export interface Rgba {
  /** 0-255 integers. */
  r: number;
  g: number;
  b: number;
  /** Opacity, 0-1. */
  a: number;
}

export type ColorFormat = "hex" | "rgb" | "hsl" | "oklch" | "name";

export interface ParsedColor extends Rgba {
  format: ColorFormat;
  /** True when an OKLCH value was outside sRGB and had to be mapped in. */
  outOfGamut: boolean;
}

export type ParseResult = { ok: true; color: ParsedColor } | { ok: false; reason: "empty" | "invalid" };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Round to `dp` decimals, never returning -0. */
function round(n: number, dp = 0): number {
  const p = 10 ** dp;
  const r = Math.round(n * p) / p;
  return Object.is(r, -0) ? 0 : r;
}

/** Number to string with at most `dp` decimals and no trailing zeros. */
function trim(n: number, dp: number): string {
  return String(round(n, dp));
}

const byte = (n: number) => clamp(Math.round(n), 0, 255);

// ---------------------------------------------------------------------------
// Named colours (CSS Color Module)
// ---------------------------------------------------------------------------

const NAMED =
  "aliceblue:f0f8ff,antiquewhite:faebd7,aqua:00ffff,aquamarine:7fffd4,azure:f0ffff,beige:f5f5dc,bisque:ffe4c4,black:000000," +
  "blanchedalmond:ffebcd,blue:0000ff,blueviolet:8a2be2,brown:a52a2a,burlywood:deb887,cadetblue:5f9ea0,chartreuse:7fff00," +
  "chocolate:d2691e,coral:ff7f50,cornflowerblue:6495ed,cornsilk:fff8dc,crimson:dc143c,cyan:00ffff,darkblue:00008b," +
  "darkcyan:008b8b,darkgoldenrod:b8860b,darkgray:a9a9a9,darkgreen:006400,darkgrey:a9a9a9,darkkhaki:bdb76b,darkmagenta:8b008b," +
  "darkolivegreen:556b2f,darkorange:ff8c00,darkorchid:9932cc,darkred:8b0000,darksalmon:e9967a,darkseagreen:8fbc8f," +
  "darkslateblue:483d8b,darkslategray:2f4f4f,darkslategrey:2f4f4f,darkturquoise:00ced1,darkviolet:9400d3,deeppink:ff1493," +
  "deepskyblue:00bfff,dimgray:696969,dimgrey:696969,dodgerblue:1e90ff,firebrick:b22222,floralwhite:fffaf0,forestgreen:228b22," +
  "fuchsia:ff00ff,gainsboro:dcdcdc,ghostwhite:f8f8ff,gold:ffd700,goldenrod:daa520,gray:808080,green:008000,greenyellow:adff2f," +
  "grey:808080,honeydew:f0fff0,hotpink:ff69b4,indianred:cd5c5c,indigo:4b0082,ivory:fffff0,khaki:f0e68c,lavender:e6e6fa," +
  "lavenderblush:fff0f5,lawngreen:7cfc00,lemonchiffon:fffacd,lightblue:add8e6,lightcoral:f08080,lightcyan:e0ffff," +
  "lightgoldenrodyellow:fafad2,lightgray:d3d3d3,lightgreen:90ee90,lightgrey:d3d3d3,lightpink:ffb6c1,lightsalmon:ffa07a," +
  "lightseagreen:20b2aa,lightskyblue:87cefa,lightslategray:778899,lightslategrey:778899,lightsteelblue:b0c4de,lightyellow:ffffe0," +
  "lime:00ff00,limegreen:32cd32,linen:faf0e6,magenta:ff00ff,maroon:800000,mediumaquamarine:66cdaa,mediumblue:0000cd," +
  "mediumorchid:ba55d3,mediumpurple:9370db,mediumseagreen:3cb371,mediumslateblue:7b68ee,mediumspringgreen:00fa9a," +
  "mediumturquoise:48d1cc,mediumvioletred:c71585,midnightblue:191970,mintcream:f5fffa,mistyrose:ffe4e1,moccasin:ffe4b5," +
  "navajowhite:ffdead,navy:000080,oldlace:fdf5e6,olive:808000,olivedrab:6b8e23,orange:ffa500,orangered:ff4500,orchid:da70d6," +
  "palegoldenrod:eee8aa,palegreen:98fb98,paleturquoise:afeeee,palevioletred:db7093,papayawhip:ffefd5,peachpuff:ffdab9,peru:cd853f," +
  "pink:ffc0cb,plum:dda0dd,powderblue:b0e0e6,purple:800080,rebeccapurple:663399,red:ff0000,rosybrown:bc8f8f,royalblue:4169e1," +
  "saddlebrown:8b4513,salmon:fa8072,sandybrown:f4a460,seagreen:2e8b57,seashell:fff5ee,sienna:a0522d,silver:c0c0c0,skyblue:87ceeb," +
  "slateblue:6a5acd,slategray:708090,slategrey:708090,snow:fffafa,springgreen:00ff7f,steelblue:4682b4,tan:d2b48c,teal:008080," +
  "thistle:d8bfd8,tomato:ff6347,turquoise:40e0d0,violet:ee82ee,wheat:f5deb3,white:ffffff,whitesmoke:f5f5f5,yellow:ffff00," +
  "yellowgreen:9acd32";

let namedCache: Map<string, string> | null = null;

/** Map of CSS colour name to six-digit hex (no #). Built lazily. */
export function namedColors(): Map<string, string> {
  if (!namedCache) {
    namedCache = new Map(
      NAMED.split(",").map((pair) => {
        const [name, hex] = pair.split(":");
        return [name, hex] as [string, string];
      }),
    );
  }
  return namedCache;
}

// ---------------------------------------------------------------------------
// sRGB <-> OKLab / OKLCH
// ---------------------------------------------------------------------------

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

type Triple = [number, number, number];

/** OKLCH to linear-light sRGB, not clamped (may fall outside 0-1). */
function oklchToLinear(l: number, c: number, h: number): Triple {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const GAMUT_EPS = 0.0005;
const inGamut = (rgb: Triple) => rgb.every((v) => v >= -GAMUT_EPS && v <= 1 + GAMUT_EPS);

function linearToBytes(rgb: Triple): Triple {
  return rgb.map((v) => byte(toGamma(clamp(v, 0, 1)) * 255)) as Triple;
}

/**
 * OKLCH to 8-bit sRGB. When the colour is outside the sRGB gamut, chroma is
 * reduced (binary search) until it fits; lightness and hue are kept.
 */
export function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number; outOfGamut: boolean } {
  const L = clamp(l, 0, 1);
  const C = Math.max(0, c);
  if (L <= 0) return { r: 0, g: 0, b: 0, outOfGamut: false };
  if (L >= 1) return { r: 255, g: 255, b: 255, outOfGamut: C > 1e-4 };
  let rgb = oklchToLinear(L, C, h);
  let outOfGamut = false;
  if (!inGamut(rgb)) {
    outOfGamut = true;
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear(L, mid, h))) lo = mid;
      else hi = mid;
    }
    rgb = oklchToLinear(L, lo, h);
  }
  const [r, g, b] = linearToBytes(rgb);
  return { r, g, b, outOfGamut };
}

export interface Oklch {
  /** 0-1 */
  l: number;
  /** roughly 0-0.4 */
  c: number;
  /** degrees, 0-360 (0 when the colour is grey) */
  h: number;
}

/** 8-bit sRGB to OKLCH. */
export function rgbToOklch(r: number, g: number, b: number): Oklch {
  const lr = toLinear(r / 255);
  const lg = toLinear(g / 255);
  const lb = toLinear(b / 255);
  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.hypot(a, bb);
  let h = (Math.atan2(bb, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h: c < 1e-4 ? 0 : h };
}

// ---------------------------------------------------------------------------
// HSL
// ---------------------------------------------------------------------------

function hslToRgb(h: number, s: number, l: number): Triple {
  const hh = ((h % 360) + 360) % 360;
  const ss = clamp(s, 0, 1);
  const ll = clamp(l, 0, 1);
  const k = (n: number) => (n + hh / 30) % 12;
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => ll - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [byte(f(0) * 255), byte(f(8) * 255), byte(f(4) * 255)];
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: clamp(s, 0, 1), l };
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

interface Token {
  value: number;
  unit: string;
}

const TOKEN_RE = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn)?$/;

function token(raw: string): Token | null {
  const s = raw.trim().toLowerCase();
  if (s === "none") return { value: 0, unit: "" };
  const m = TOKEN_RE.exec(s);
  if (!m) return null;
  const value = Number(m[1]);
  return Number.isFinite(value) ? { value, unit: m[2] ?? "" } : null;
}

function angle(t: Token): number | null {
  switch (t.unit) {
    case "":
    case "deg":
      return t.value;
    case "grad":
      return t.value * 0.9;
    case "rad":
      return (t.value * 180) / Math.PI;
    case "turn":
      return t.value * 360;
    default:
      return null;
  }
}

function alphaOf(raw: string | undefined): number | null {
  if (raw === undefined) return 1;
  const t = token(raw);
  if (!t || (t.unit !== "" && t.unit !== "%")) return null;
  return clamp(t.unit === "%" ? t.value / 100 : t.value, 0, 1);
}

/** Split the inside of a colour function into channel tokens and an optional alpha token. */
function functionArgs(body: string): { channels: string[]; alpha?: string } | null {
  const cleaned = body.replace(/,/g, " ").trim();
  let main = cleaned;
  let alpha: string | undefined;
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/");
    if (parts.length !== 2) return null;
    main = parts[0].trim();
    alpha = parts[1].trim();
    if (!alpha) return null;
  }
  const channels = main.split(/\s+/).filter(Boolean);
  if (alpha === undefined && channels.length === 4) alpha = channels.pop();
  if (channels.length !== 3) return null;
  return { channels, alpha };
}

const HEX_RE = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function parseHex(s: string): ParsedColor | null {
  const m = HEX_RE.exec(s);
  if (!m) return null;
  let h = m[1];
  if (h.length <= 4) h = [...h].map((c) => c + c).join("");
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1, format: "hex", outOfGamut: false };
}

function parseRgbFn(body: string): ParsedColor | null {
  const args = functionArgs(body);
  if (!args) return null;
  const vals: number[] = [];
  for (const raw of args.channels) {
    const t = token(raw);
    if (!t || (t.unit !== "" && t.unit !== "%")) return null;
    vals.push(byte(t.unit === "%" ? (t.value / 100) * 255 : t.value));
  }
  const a = alphaOf(args.alpha);
  if (a === null) return null;
  return { r: vals[0], g: vals[1], b: vals[2], a, format: "rgb", outOfGamut: false };
}

function parseHslFn(body: string): ParsedColor | null {
  const args = functionArgs(body);
  if (!args) return null;
  const [ht, st, lt] = args.channels.map(token);
  if (!ht || !st || !lt) return null;
  const h = angle(ht);
  if (h === null) return null;
  if ((st.unit !== "" && st.unit !== "%") || (lt.unit !== "" && lt.unit !== "%")) return null;
  const a = alphaOf(args.alpha);
  if (a === null) return null;
  const [r, g, b] = hslToRgb(h, st.value / 100, lt.value / 100);
  return { r, g, b, a, format: "hsl", outOfGamut: false };
}

function parseOklchFn(body: string): ParsedColor | null {
  const args = functionArgs(body);
  if (!args) return null;
  const [lt, ct, ht] = args.channels.map(token);
  if (!lt || !ct || !ht) return null;
  if ((lt.unit !== "" && lt.unit !== "%") || (ct.unit !== "" && ct.unit !== "%")) return null;
  const h = angle(ht);
  if (h === null) return null;
  const a = alphaOf(args.alpha);
  if (a === null) return null;
  const l = lt.unit === "%" ? lt.value / 100 : lt.value;
  const c = ct.unit === "%" ? (ct.value / 100) * 0.4 : ct.value;
  const { r, g, b, outOfGamut } = oklchToRgb(l, c, h);
  return { r, g, b, a, format: "oklch", outOfGamut };
}

/**
 * Parse a CSS-style colour: HEX (3, 4, 6 or 8 digits, # optional), rgb()/rgba(),
 * hsl()/hsla(), oklch() with optional alpha, or a CSS colour name.
 * A pasted declaration such as "color: #fff;" is also accepted.
 */
export function parseColor(input: string): ParseResult {
  let s = input.trim().toLowerCase();
  if (!s) return { ok: false, reason: "empty" };
  s = s.replace(/^-{0,2}[a-z][a-z0-9_-]*\s*:\s*/, "").replace(/\s*;+\s*$/, "").trim();
  if (!s) return { ok: false, reason: "empty" };

  const named = namedColors().get(s);
  if (named) {
    const c = parseHex(named);
    if (c) return { ok: true, color: { ...c, format: "name" } };
  }
  if (s === "transparent") return { ok: true, color: { r: 0, g: 0, b: 0, a: 0, format: "name", outOfGamut: false } };

  const hex = parseHex(s);
  if (hex) return { ok: true, color: hex };

  const fn = /^(rgba?|hsla?|oklch)\s*\(\s*([^()]*?)\s*\)$/.exec(s);
  if (fn) {
    const name = fn[1];
    const color = name.startsWith("rgb") ? parseRgbFn(fn[2]) : name.startsWith("hsl") ? parseHslFn(fn[2]) : parseOklchFn(fn[2]);
    if (color) return { ok: true, color };
  }
  return { ok: false, reason: "invalid" };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const hex2 = (n: number) => byte(n).toString(16).padStart(2, "0");

/** #rrggbb, or #rrggbbaa when `withAlpha` is set and the colour is not opaque. */
export function toHex(c: Rgba, withAlpha = true): string {
  const base = `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`;
  return withAlpha && c.a < 1 ? base + hex2(c.a * 255) : base;
}

const alphaText = (a: number) => trim(a, 3);

export function toRgbString(c: Rgba): string {
  return c.a < 1 ? `rgba(${c.r}, ${c.g}, ${c.b}, ${alphaText(c.a)})` : `rgb(${c.r}, ${c.g}, ${c.b})`;
}

export function toHslString(c: Rgba): string {
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b);
  const body = `${trim(h, 0)}, ${trim(s * 100, 0)}%, ${trim(l * 100, 0)}%`;
  return c.a < 1 ? `hsla(${body}, ${alphaText(c.a)})` : `hsl(${body})`;
}

export function toOklchString(c: Rgba): string {
  const { l, c: chroma, h } = rgbToOklch(c.r, c.g, c.b);
  const body = `${trim(l * 100, 1)}% ${trim(chroma, 3)} ${trim(h, 1)}`;
  return c.a < 1 ? `oklch(${body} / ${alphaText(c.a)})` : `oklch(${body})`;
}

// ---------------------------------------------------------------------------
// WCAG 2 contrast
// ---------------------------------------------------------------------------

/**
 * Relative luminance of an opaque sRGB colour (WCAG 2 definition).
 * The linearisation threshold is 0.04045, the value in the sRGB standard.
 * Older copies of WCAG print 0.03928; no 8-bit channel value lies between the
 * two, so the results are identical for HEX and RGB input.
 */
export function relativeLuminance(c: Rgba): number {
  return 0.2126 * toLinear(c.r / 255) + 0.7152 * toLinear(c.g / 255) + 0.0722 * toLinear(c.b / 255);
}

/** Contrast ratio of two opaque colours, always 1 or more. */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };

/** Paint `top` over an opaque `bottom` (blending in gamma-encoded sRGB, as browsers do). */
export function flatten(top: Rgba, bottom: Rgba): Rgba {
  if (top.a >= 1) return { ...top, a: 1 };
  const mix = (t: number, b: number) => byte(t * top.a + b * (1 - top.a));
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

/**
 * The opaque colours that are actually compared: a translucent background is
 * painted over white, then a translucent text colour over that background.
 */
export function effectivePair(fg: Rgba, bg: Rgba): { fg: Rgba; bg: Rgba } {
  const opaqueBg = flatten(bg, WHITE);
  return { fg: flatten(fg, opaqueBg), bg: opaqueBg };
}

export type CheckId = "aa-normal" | "aaa-normal" | "aa-large" | "aaa-large" | "ui";

export interface Check {
  id: CheckId;
  label: string;
  level: "AA" | "AAA";
  required: number;
  pass: boolean;
}

export const REQUIRED: Record<CheckId, number> = {
  "aa-normal": 4.5,
  "aaa-normal": 7,
  "aa-large": 3,
  "aaa-large": 4.5,
  ui: 3,
};

/** Tolerance that only absorbs floating-point error; WCAG ratios are never rounded up. */
const EPS = 1e-9;

export const meets = (ratio: number, required: number) => ratio + EPS >= required;

export function evaluate(ratio: number): Record<CheckId, boolean> {
  return {
    "aa-normal": meets(ratio, REQUIRED["aa-normal"]),
    "aaa-normal": meets(ratio, REQUIRED["aaa-normal"]),
    "aa-large": meets(ratio, REQUIRED["aa-large"]),
    "aaa-large": meets(ratio, REQUIRED["aaa-large"]),
    ui: meets(ratio, REQUIRED.ui),
  };
}

export type Level = "AAA" | "AA" | "Large" | "Fail";

/** Best level reached for normal-size text; "Large" means large text and UI components only. */
export function bestLevel(ratio: number): Level {
  if (meets(ratio, 7)) return "AAA";
  if (meets(ratio, 4.5)) return "AA";
  if (meets(ratio, 3)) return "Large";
  return "Fail";
}

/**
 * Ratio for display, rounded to two decimals like other checkers. The one
 * exception: if rounding would lift a failing ratio onto a threshold (4.499
 * would read "4.50"), the value is cut instead, so a displayed 4.50 always passes.
 */
export function formatRatio(ratio: number): string {
  let v = Math.round(ratio * 100) / 100;
  for (const t of [3, 4.5, 7]) {
    if (v + EPS >= t && !meets(ratio, t)) v = Math.floor(ratio * 100 + 1e-7) / 100;
  }
  const s = v.toFixed(2);
  return s.endsWith(".00") ? s.slice(0, -3) : s;
}

export function summarize(ratio: number): string {
  switch (bestLevel(ratio)) {
    case "AAA":
      return "Meets AAA for normal text, and everything below it.";
    case "AA":
      return "Meets AA for normal text. AAA for normal text needs 7:1.";
    case "Large":
      return "Large text and UI components only. Normal text needs 4.5:1.";
    default:
      return "Below 3:1, so it misses every WCAG 2 contrast threshold.";
  }
}

// ---------------------------------------------------------------------------
// Nearest passing colour
// ---------------------------------------------------------------------------

export interface Suggestion {
  /** Which colour changes. "both" appears only when changing one colour cannot reach the goal. */
  role: "text" | "background" | "both";
  direction: "darker" | "lighter";
  /** Resulting colours, both opaque hex. */
  fgHex: string;
  bgHex: string;
  ratio: number;
  /** OKLCH lightness (0-100) of the changed colour before and after (single-colour fixes only). */
  lightness?: { from: number; to: number };
}

/** A colour with the same hue and chroma as `start` at another OKLCH lightness (chroma reduced only to fit sRGB). */
function atLightness(start: Oklch, lightness: number): Rgba {
  const { c, h } = start;
  // Treat near-greys as neutral so a grey stays a true grey instead of picking up a one-step tint.
  return { ...oklchToRgb(lightness, c < 0.002 ? 0 : c, h), a: 1 };
}

function searchLightness(start: Rgba, fixed: Rgba, target: number, dir: 1 | -1): Rgba | null {
  const lch = rgbToOklch(start.r, start.g, start.b);
  const extreme = dir > 0 ? 1 : 0;
  if (!meets(contrastRatio(atLightness(lch, extreme), fixed), target)) return null;
  let lo = lch.l;
  let hi = extreme;
  for (let i = 0; i < 36; i++) {
    const mid = (lo + hi) / 2;
    if (meets(contrastRatio(atLightness(lch, mid), fixed), target)) hi = mid;
    else lo = mid;
  }
  return atLightness(lch, hi);
}

/** Move both colours apart by the same share of the way to black and white; smallest share that reaches `target`. */
function searchBoth(fg: Rgba, bg: Rgba, target: number, fgDir: 1 | -1): { fg: Rgba; bg: Rgba } | null {
  const f = rgbToOklch(fg.r, fg.g, fg.b);
  const b = rgbToOklch(bg.r, bg.g, bg.b);
  const fgEnd = fgDir > 0 ? 1 : 0;
  const bgEnd = fgDir > 0 ? 0 : 1;
  const at = (t: number) => ({
    fg: atLightness(f, f.l + (fgEnd - f.l) * t),
    bg: atLightness(b, b.l + (bgEnd - b.l) * t),
  });
  const ok = (t: number) => {
    const p = at(t);
    return meets(contrastRatio(p.fg, p.bg), target);
  };
  if (!ok(1)) return null;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 36; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) hi = mid;
    else lo = mid;
  }
  return at(hi);
}

/**
 * Nearest colours that reach `target`, found by moving OKLCH lightness while hue
 * and chroma are kept (chroma is reduced only where sRGB cannot hold it).
 * Returns the closest change to the text colour and the closest change to the
 * background. When neither colour can reach the goal alone, it returns one
 * combined change instead.
 */
export function suggestFixes(fgIn: Rgba, bgIn: Rgba, target: number): { ratio: number; passes: boolean; suggestions: Suggestion[] } {
  const { fg, bg } = effectivePair(fgIn, bgIn);
  const ratio = contrastRatio(fg, bg);
  if (meets(ratio, target)) return { ratio, passes: true, suggestions: [] };

  const fgL = rgbToOklch(fg.r, fg.g, fg.b).l * 100;
  const bgL = rgbToOklch(bg.r, bg.g, bg.b).l * 100;
  const fgHex = toHex(fg, false);
  const bgHex = toHex(bg, false);

  const text: Suggestion[] = [];
  const back: Suggestion[] = [];
  for (const dir of [-1, 1] as const) {
    const direction = dir > 0 ? "lighter" : "darker";
    const newFg = searchLightness(fg, bg, target, dir);
    if (newFg) {
      text.push({
        role: "text",
        direction,
        fgHex: toHex(newFg, false),
        bgHex,
        ratio: contrastRatio(newFg, bg),
        lightness: { from: fgL, to: rgbToOklch(newFg.r, newFg.g, newFg.b).l * 100 },
      });
    }
    const newBg = searchLightness(bg, fg, target, dir);
    if (newBg) {
      back.push({
        role: "background",
        direction,
        fgHex,
        bgHex: toHex(newBg, false),
        ratio: contrastRatio(fg, newBg),
        lightness: { from: bgL, to: rgbToOklch(newBg.r, newBg.g, newBg.b).l * 100 },
      });
    }
  }
  const shift = (s: Suggestion) => (s.lightness ? Math.abs(s.lightness.to - s.lightness.from) : 0);
  const nearest = (list: Suggestion[]) => list.sort((x, y) => shift(x) - shift(y))[0];
  const out = [nearest(text), nearest(back)].filter((s): s is Suggestion => Boolean(s));
  out.sort((x, y) => shift(x) - shift(y));
  if (out.length) return { ratio, passes: false, suggestions: out };

  // Neither colour can do it alone (for example mid-grey text on a mid-grey background at 7:1).
  let best: Suggestion | null = null;
  let bestShift = Infinity;
  for (const dir of [-1, 1] as const) {
    const pair = searchBoth(fg, bg, target, dir);
    if (!pair) continue;
    const moved =
      Math.abs(rgbToOklch(pair.fg.r, pair.fg.g, pair.fg.b).l * 100 - fgL) + Math.abs(rgbToOklch(pair.bg.r, pair.bg.g, pair.bg.b).l * 100 - bgL);
    if (moved < bestShift) {
      bestShift = moved;
      best = {
        role: "both",
        direction: dir > 0 ? "lighter" : "darker",
        fgHex: toHex(pair.fg, false),
        bgHex: toHex(pair.bg, false),
        ratio: contrastRatio(pair.fg, pair.bg),
      };
    }
  }
  return { ratio, passes: false, suggestions: best ? [best] : [] };
}

// ---------------------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------------------

export const MAX_PALETTE = 24;

/** Palette text beyond this many characters is ignored, so a pasted file cannot stall the page. */
export const MAX_PALETTE_TEXT = 4000;

export interface PaletteColor {
  raw: string;
  color: ParsedColor;
  hex: string;
}

export interface Palette {
  colors: PaletteColor[];
  invalid: string[];
  truncated: boolean;
  duplicates: number;
}

/** Split on newlines, commas, semicolons and spaces, but not inside rgb(...) style brackets. */
export function splitColorList(text: string): string[] {
  const normalized = text.replace(/\b(rgba?|hsla?|oklch)\s+\(/gi, "$1(").replace(/-{0,2}[a-z][a-z0-9_-]*\s*:/gi, " ");
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of normalized) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === "," || ch === ";" || /\s/.test(ch))) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function parsePalette(text: string): Palette {
  const colors: PaletteColor[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  let truncated = false;
  if (text.length > MAX_PALETTE_TEXT) {
    text = text.slice(0, MAX_PALETTE_TEXT);
    truncated = true;
  }
  for (const raw of splitColorList(text)) {
    const r = parseColor(raw);
    if (!r.ok) {
      invalid.push(raw.length > 28 ? `${raw.slice(0, 27)}…` : raw);
      continue;
    }
    const hex = toHex(r.color);
    if (seen.has(hex)) {
      duplicates++;
      continue;
    }
    if (colors.length >= MAX_PALETTE) {
      truncated = true;
      continue;
    }
    seen.add(hex);
    colors.push({ raw, color: r.color, hex });
  }
  return { colors, invalid, truncated, duplicates };
}

export interface PairResult {
  ratio: number;
  level: Level;
  fgHex: string;
  bgHex: string;
}

/** Ratio of text colour `fg` on background `bg` after transparency is resolved. */
export function pairResult(fg: Rgba, bg: Rgba): PairResult {
  const e = effectivePair(fg, bg);
  const ratio = contrastRatio(e.fg, e.bg);
  return { ratio, level: bestLevel(ratio), fgHex: toHex(e.fg, false), bgHex: toHex(e.bg, false) };
}

// ---------------------------------------------------------------------------
// Text output
// ---------------------------------------------------------------------------

const passText = (ok: boolean) => (ok ? "Pass" : "Fail");

export function buildReport(fg: Rgba, bg: Rgba): string {
  const e = effectivePair(fg, bg);
  const ratio = contrastRatio(e.fg, e.bg);
  const ok = evaluate(ratio);
  return [
    `Text ${toHex(e.fg, false)} on background ${toHex(e.bg, false)}`,
    `Contrast ratio: ${formatRatio(ratio)}:1`,
    `Normal text: AA ${passText(ok["aa-normal"])} (4.5:1), AAA ${passText(ok["aaa-normal"])} (7:1)`,
    `Large text: AA ${passText(ok["aa-large"])} (3:1), AAA ${passText(ok["aaa-large"])} (4.5:1)`,
    `UI components and graphics: AA ${passText(ok.ui)} (3:1)`,
    "Measured with the WCAG 2 contrast ratio formula.",
  ].join("\n");
}

export function buildCss(fg: Rgba, bg: Rgba): string {
  return `color: ${toHex(fg)};\nbackground-color: ${toHex(bg)};`;
}

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Every text-on-background pair of a palette as CSV. */
export function buildCsv(colors: PaletteColor[]): string {
  const rows = ["text,background,ratio,aa_normal,aaa_normal,aa_large,aaa_large,ui_components"];
  for (const t of colors) {
    for (const b of colors) {
      if (t === b) continue;
      const e = effectivePair(t.color, b.color);
      const ratio = contrastRatio(e.fg, e.bg);
      const ok = evaluate(ratio);
      rows.push(
        [
          toHex(e.fg, false),
          toHex(e.bg, false),
          formatRatio(ratio),
          passText(ok["aa-normal"]),
          passText(ok["aaa-normal"]),
          passText(ok["aa-large"]),
          passText(ok["aaa-large"]),
          passText(ok.ui),
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }
  return rows.join("\n");
}

// ---------------------------------------------------------------------------
// Share links (URL hash)
// ---------------------------------------------------------------------------

export type Goal = "aa" | "aa-large" | "aaa";

export interface HashState {
  mode?: "pair" | "palette";
  fg?: string;
  bg?: string;
  palette?: string;
  target?: Goal;
}

const HASH_HEX = /^[0-9a-f]{6}(?:[0-9a-f]{2})?$/i;

/** Encode the current colours as a hash string without the leading "#". */
export function encodeHash(s: { mode: "pair" | "palette"; fg: string; bg: string; palette: string; target: Goal }): string {
  const params: string[] = [];
  const fg = parseColor(s.fg);
  const bg = parseColor(s.bg);
  if (fg.ok) params.push(`fg=${toHex(fg.color).slice(1)}`);
  if (bg.ok) params.push(`bg=${toHex(bg.color).slice(1)}`);
  if (s.target !== "aa") params.push(`goal=${s.target}`);
  if (s.mode === "palette") {
    const pal = parsePalette(s.palette);
    params.push("mode=palette");
    if (pal.colors.length) params.push(`p=${pal.colors.map((c) => c.hex.slice(1)).join("-")}`);
  }
  return params.join("&");
}

/** Read a hash (with or without the leading "#"). Returns null when nothing usable is in it. */
export function decodeHash(hash: string): HashState | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const out: HashState = {};
  const fg = params.get("fg");
  const bg = params.get("bg");
  if (fg && HASH_HEX.test(fg)) out.fg = `#${fg.toLowerCase()}`;
  if (bg && HASH_HEX.test(bg)) out.bg = `#${bg.toLowerCase()}`;
  const goal = params.get("goal");
  if (goal === "aa" || goal === "aa-large" || goal === "aaa") out.target = goal;
  if (params.get("mode") === "palette") out.mode = "palette";
  else if (out.fg || out.bg) out.mode = "pair";
  const p = params.get("p");
  if (p) {
    const list = p
      .split("-")
      .filter((x) => HASH_HEX.test(x))
      .slice(0, MAX_PALETTE)
      .map((x) => `#${x.toLowerCase()}`);
    if (list.length) out.palette = list.join("\n");
  }
  return Object.keys(out).length ? out : null;
}
