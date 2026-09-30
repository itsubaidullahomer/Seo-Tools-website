/**
 * Every number the checker uses to judge a title or description lives in this file.
 *
 * Google does not publish fixed limits. Its documentation says a title link or
 * snippet "is truncated ... as needed, typically to fit the device width", so the
 * figures below are working estimates compiled from published measurements of
 * Google's results pages. Change them here (or with the "Adjust limits" panel in
 * the tool) and the checker, the preview, the article table and the bulk audit all
 * follow.
 */

export type Device = "desktop" | "mobile";
export type FieldKind = "title" | "description";

/** Date (YYYY-MM-DD) the default limits were last reviewed. Printed on the page. */
export const LIMITS_REVIEWED = "2026-09-29";

/** Font size, in CSS pixels, that each field is measured at (Arial-metric, regular weight). */
export const FONT_PX: Record<FieldKind, number> = { title: 20, description: 14 };

export interface Limits {
  title: Record<Device, number>;
  description: Record<Device, number>;
}

/**
 * Width budget in pixels, measured as one continuous line of text.
 * Descriptions wrap over two or three lines on the results page, so the budget is
 * the total width of all lines, not the width of a single line.
 */
export const DEFAULT_LIMITS: Limits = {
  title: { desktop: 600, mobile: 540 },
  description: { desktop: 920, mobile: 680 },
};

/** Below this many characters a field is flagged "short" (guidance, not a Google rule). */
export const MIN_CHARS: Record<FieldKind, number> = { title: 30, description: 70 };

/** A field using at least this share of its limit gets a "close to the limit" warning. */
export const NEAR_RATIO = 0.95;

/** A keyword starting within this share of the width counts as "front-loaded". */
export const FRONT_RATIO: Record<FieldKind, number> = { title: 0.4, description: 0.5 };

/** Single-field input is clipped to this many characters before measuring. */
export const MAX_FIELD_CHARS = 20000;

/** Bulk mode processes at most this many rows. */
export const MAX_BULK_ROWS = 5000;

/** Largest CSV file the bulk tab will read (bytes). */
export const MAX_BULK_FILE_BYTES = 5 * 1024 * 1024;

/** Width in pixels of the preview card for each device. */
export const PREVIEW_WIDTH: Record<Device, number> = { desktop: 600, mobile: 360 };

/** Accepted range for user-adjusted limits. */
export const LIMIT_RANGE = { min: 100, max: 2000 } as const;

/** Return a valid Limits object, falling back to defaults for anything malformed. */
export function sanitizeLimits(input: unknown): Limits {
  const pick = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= LIMIT_RANGE.min && v <= LIMIT_RANGE.max ? Math.round(v) : fallback;
  const src = (input && typeof input === "object" ? input : {}) as Partial<Record<FieldKind, Partial<Record<Device, unknown>>>>;
  return {
    title: {
      desktop: pick(src.title?.desktop, DEFAULT_LIMITS.title.desktop),
      mobile: pick(src.title?.mobile, DEFAULT_LIMITS.title.mobile),
    },
    description: {
      desktop: pick(src.description?.desktop, DEFAULT_LIMITS.description.desktop),
      mobile: pick(src.description?.mobile, DEFAULT_LIMITS.description.mobile),
    },
  };
}
