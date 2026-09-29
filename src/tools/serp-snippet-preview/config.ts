/**
 * Every constant the snippet preview relies on: width budgets, card geometry and
 * the colours of the mock result card.
 *
 * The preview card has its own light and dark palette that is independent of the
 * site theme (the Light/Dark switch above the preview changes only the mock), and
 * the PNG export has to draw with real colour values, so this is the one place in
 * the tool where literal colours live. They are deliberately generic and are not
 * the colours of any search engine.
 */

export type Device = "desktop" | "mobile";
export type Theme = "light" | "dark";
export type FieldKind = "title" | "description";

/** Date (YYYY-MM-DD) the default limits were last reviewed. Printed on the page. */
export const LIMITS_REVIEWED = "2026-09-29";

/**
 * Width budget in pixels, measured as one continuous line of Arial-metric text.
 * These are the same working estimates the Title Tag & Meta Description Length
 * Checker uses, so the two tools always agree. Google publishes no fixed numbers:
 * it truncates "as needed, typically to fit the device width".
 */
export const LIMITS: Record<FieldKind, Record<Device, number>> = {
  title: { desktop: 600, mobile: 540 },
  description: { desktop: 920, mobile: 680 },
};

/** A field using at least this share of its budget gets a "close to the limit" note. */
export const NEAR_RATIO = 0.95;

/** Below this many characters a field is flagged as short (guidance, not a Google rule). */
export const MIN_CHARS: Record<FieldKind, number> = { title: 30, description: 70 };

/** Text longer than this is clipped before measuring. */
export const MAX_FIELD_CHARS = 5000;

/** Font sizes in CSS pixels. The width table is measured at these sizes. */
export const FONT_PX = { title: 20, description: 14, site: 14, crumb: 12 } as const;

/** Line heights in CSS pixels. */
export const LINE_PX = { title: 26, description: 22, site: 18, crumb: 16 } as const;

export interface Geometry {
  /** Outer width of the card, border included. */
  outer: number;
  /** Left and right padding. */
  pad: number;
  padTop: number;
  padBottom: number;
  /** Width available to text lines (outer - 2 * pad). */
  content: number;
  /** Most lines the title may use. */
  titleLines: number;
  /** Most lines the description may use. */
  descriptionLines: number;
}

export const GEOMETRY: Record<Device, Geometry> = {
  desktop: { outer: 640, pad: 20, padTop: 16, padBottom: 16, content: 600, titleLines: 1, descriptionLines: 2 },
  mobile: { outer: 360, pad: 16, padTop: 14, padBottom: 14, content: 328, titleLines: 2, descriptionLines: 3 },
};

/** Header row: favicon circle plus site name and breadcrumb. */
export const HEADER = {
  height: 34,
  favicon: 28,
  faviconImage: 18,
  /** Space between the favicon and the text. */
  gap: 12,
  /** Space reserved on the right for the three-dot menu. */
  menu: 26,
  /** Space between the header and the title. */
  belowGap: 6,
  /** Space between the title and the description. */
  titleGap: 2,
} as const;

/** Total height of a card with the given number of title and description lines. */
export function cardHeight(device: Device, titleLines: number, descriptionLines: number): number {
  const g = GEOMETRY[device];
  return g.padTop + HEADER.height + HEADER.belowGap + titleLines * LINE_PX.title + HEADER.titleGap + descriptionLines * LINE_PX.description + g.padBottom;
}

export const SERP_FONT = 'Arial, "Liberation Sans", Arimo, Helvetica, sans-serif';

/** Arial-family ascent and descent as a share of the font size (used to place baselines). */
export const ASCENT = 0.905;
export const DESCENT = 0.212;

export interface Palette {
  /** Background around the cards in the PNG export. */
  canvas: string;
  bg: string;
  border: string;
  site: string;
  crumb: string;
  title: string;
  text: string;
  bold: string;
  muted: string;
  faviconBg: string;
  faviconFg: string;
  dots: string;
}

export const PALETTES: Record<Theme, Palette> = {
  light: {
    canvas: "#eef0f3",
    bg: "#ffffff",
    border: "#dadde2",
    site: "#1f2328",
    crumb: "#5b6169",
    title: "#2545c6",
    text: "#474b52",
    bold: "#1f2328",
    muted: "#6b7076",
    faviconBg: "#eef0f3",
    faviconFg: "#4a4f57",
    dots: "#6b7076",
  },
  dark: {
    canvas: "#101215",
    bg: "#1b1d21",
    border: "#33363c",
    site: "#e7e9ed",
    crumb: "#a1a6ae",
    title: "#9bb2f4",
    text: "#b8bdc5",
    bold: "#eceef2",
    muted: "#9da2aa",
    faviconBg: "#2a2d33",
    faviconFg: "#d3d6dc",
    dots: "#9da2aa",
  },
};

/** Watermark drawn on every exported PNG. */
export const WATERMARK = "Preview - not a real search result";
