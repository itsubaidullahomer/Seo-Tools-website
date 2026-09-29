/**
 * Pure helpers for the converter settings: defaults, validation of stored
 * values, quality presets and the size-limit maths. No DOM access.
 */
import type { Extension } from "./batch";

export const MIN_QUALITY = 10;
export const MAX_QUALITY = 100;
export const DEFAULT_QUALITY = 90;
/** Lowest quality the size-limit search will try. Below this JPEGs look broken. */
export const MIN_FIT_QUALITY = 20;

/** Size limits are counted with 1 KB = 1,000 bytes, so a file also fits sites that count 1,024. */
export const BYTES_PER_KB = 1000;
export const MIN_LIMIT_KB = 5;
export const MAX_LIMIT_KB = 20000;
export const DEFAULT_LIMIT_KB = 240;

export interface Settings {
  /** JPEG quality, 10-100. */
  quality: number;
  /** Solid color that replaces transparent areas (JPEG cannot store transparency). */
  color: string;
  extension: Extension;
  /** Keep each JPG under `limitKb`, lowering the quality when needed. */
  limitOn: boolean;
  /** Raw text of the size-limit box, so half-typed values are not thrown away. */
  limitKb: string;
}

export const DEFAULT_SETTINGS: Settings = {
  quality: DEFAULT_QUALITY,
  color: "#ffffff",
  extension: "jpg",
  limitOn: false,
  limitKb: String(DEFAULT_LIMIT_KB),
};

export const PRESETS: { label: string; quality: number }[] = [
  { label: "Small", quality: 70 },
  { label: "Balanced", quality: 80 },
  { label: "High", quality: 90 },
  { label: "Maximum", quality: 100 },
];

export function clampQuality(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_QUALITY;
  return Math.min(MAX_QUALITY, Math.max(MIN_QUALITY, Math.round(n)));
}

/** Stored settings may be missing, hand-edited or from an older version: rebuild them field by field. */
export function parseSettings(raw: string): Settings {
  try {
    const v = JSON.parse(raw) as Partial<Settings> | null;
    return {
      quality: typeof v?.quality === "number" ? clampQuality(v.quality) : DEFAULT_SETTINGS.quality,
      color: typeof v?.color === "string" && /^#[0-9a-fA-F]{6}$/.test(v.color) ? v.color.toLowerCase() : DEFAULT_SETTINGS.color,
      extension: v?.extension === "jpeg" ? "jpeg" : "jpg",
      limitOn: v?.limitOn === true,
      limitKb: typeof v?.limitKb === "string" && v.limitKb.length <= 8 ? v.limitKb : DEFAULT_SETTINGS.limitKb,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** The size limit in bytes, or null when the text is not a whole number of KB in the allowed range. */
export function limitBytes(text: string): number | null {
  const t = text.trim();
  if (!/^\d{1,5}$/.test(t)) return null;
  const kb = Number(t);
  if (kb < MIN_LIMIT_KB || kb > MAX_LIMIT_KB) return null;
  return kb * BYTES_PER_KB;
}

/** Short guidance for the chosen quality, shown under the slider. */
export function qualityHint(quality: number): string {
  if (quality >= 95) return "Top of the scale: the largest files, for print or further editing.";
  if (quality >= 85) return "High: hard to tell from the original at normal viewing size. A good default for photos.";
  if (quality >= 70) return "Balanced: clearly smaller files, fine for web pages and email. Check gradients and text.";
  if (quality >= 50) return "Small: blocky artifacts around edges and text are likely. Best for thumbnails.";
  return "Very small: expect obvious artifacts. Use only when size matters more than looks.";
}
