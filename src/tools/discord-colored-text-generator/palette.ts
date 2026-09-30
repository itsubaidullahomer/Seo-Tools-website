/**
 * Preview colors. These are stand-ins for what a chat client draws; the escape codes in
 * the output do not depend on them. Two sets are offered because guides disagree on
 * what the background row (40-47) looks like after a reported 2026 change.
 */
import { buildSegments, segmentStyle, type Span } from "./logic";

export type PaletteId = "classic" | "matched";
export type ThemeId = "dark" | "light";

export interface Swatch {
  code: number;
  name: string;
  hex: string;
}

/** Text colors 30-37 of the widely documented (Solarized-based) palette. */
export const TEXT_SWATCHES: Swatch[] = [
  { code: 30, name: "Gray", hex: "#4f545c" },
  { code: 31, name: "Red", hex: "#dc322f" },
  { code: 32, name: "Green", hex: "#859900" },
  { code: 33, name: "Yellow", hex: "#b58900" },
  { code: 34, name: "Blue", hex: "#268bd2" },
  { code: 35, name: "Pink", hex: "#d33682" },
  { code: 36, name: "Cyan", hex: "#2aa198" },
  { code: 37, name: "White", hex: "#ffffff" },
];

/** Background colors 40-47 of the same classic palette. */
const CLASSIC_BACKGROUNDS: Swatch[] = [
  { code: 40, name: "Dark blue", hex: "#002b36" },
  { code: 41, name: "Orange", hex: "#cb4b16" },
  { code: 42, name: "Marble blue", hex: "#586e75" },
  { code: 43, name: "Greyish turquoise", hex: "#657b83" },
  { code: 44, name: "Gray", hex: "#839496" },
  { code: 45, name: "Indigo", hex: "#6c71c4" },
  { code: 46, name: "Light gray", hex: "#93a1a1" },
  { code: 47, name: "Cream white", hex: "#fdf6e3" },
];

/** Approximation of the reported change: background N uses the same hue as text N-10. */
const MATCHED_BACKGROUNDS: Swatch[] = TEXT_SWATCHES.map((s) => ({ code: s.code + 10, name: s.name, hex: s.hex }));

export const PALETTES: Record<PaletteId, { label: string; text: Swatch[]; background: Swatch[] }> = {
  classic: { label: "Classic palette (widely documented)", text: TEXT_SWATCHES, background: CLASSIC_BACKGROUNDS },
  matched: { label: "Backgrounds match text hues (reported 2026 change, approximate)", text: TEXT_SWATCHES, background: MATCHED_BACKGROUNDS },
};

export const THEMES: Record<ThemeId, { label: string; background: string; foreground: string }> = {
  dark: { label: "Dark", background: "#1e1f22", foreground: "#dbdee1" },
  light: { label: "Light", background: "#f2f3f5", foreground: "#2e3338" },
};

export function swatchHex(palette: PaletteId, code: number): string | undefined {
  const p = PALETTES[palette];
  return [...p.text, ...p.background].find((s) => s.code === code)?.hex;
}

export function swatchName(palette: PaletteId, code: number): string | undefined {
  const p = PALETTES[palette];
  return [...p.text, ...p.background].find((s) => s.code === code)?.name;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** WCAG contrast ratio between two #rrggbb colors (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface LowContrast {
  /** Text of the first affected run, shortened. */
  sample: string;
  /** How many runs are hard to read. */
  count: number;
  ratio: number;
}

export const LOW_CONTRAST_RATIO = 3;

/** Runs whose color pair is hard to read on the chosen preview theme. */
export function findLowContrast(text: string, spans: readonly Span[], palette: PaletteId, theme: ThemeId): LowContrast | null {
  const t = THEMES[theme];
  let count = 0;
  let sample = "";
  let worst = Infinity;
  for (const seg of buildSegments(text, spans)) {
    if (!seg.style) continue;
    const st = segmentStyle(seg.style);
    if (!st.fg && !st.bg) continue;
    const fg = (st.fg && swatchHex(palette, st.fg)) || t.foreground;
    const bg = (st.bg && swatchHex(palette, st.bg)) || t.background;
    const ratio = contrastRatio(fg, bg);
    if (ratio < LOW_CONTRAST_RATIO) {
      if (!count) sample = seg.text.length > 24 ? `${seg.text.slice(0, 24)}…` : seg.text;
      count++;
      worst = Math.min(worst, ratio);
    }
  }
  return count ? { sample, count, ratio: worst } : null;
}
