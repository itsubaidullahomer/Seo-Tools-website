import type { FallbackMeasure } from "./logic";

let cached: FallbackMeasure | null | undefined;

/**
 * Browser-only fallback for characters that are not in the bundled width table
 * (emoji, Arabic, Thai ...). Measures one grapheme cluster with canvas measureText
 * using the same Arial-first font stack the preview uses. Returns null on the
 * server or when canvas is unavailable, in which case logic.ts uses a rule of thumb.
 */
export function getCanvasMeasurer(): FallbackMeasure | null {
  if (cached !== undefined) return cached;
  if (typeof document === "undefined") return null;
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    cached = ctx
      ? (cluster, fontPx) => {
          ctx.font = `${fontPx}px Arial, "Liberation Sans", Arimo, Helvetica, sans-serif`;
          const w = ctx.measureText(cluster).width;
          return Number.isFinite(w) ? w : null;
        }
      : null;
  } catch {
    cached = null;
  }
  return cached;
}
