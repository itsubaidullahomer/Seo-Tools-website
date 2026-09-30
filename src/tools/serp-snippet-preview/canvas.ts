/**
 * Browser-only helpers: the measuring fallback, favicon loading and the PNG export.
 * Nothing here runs during render. The PNG is drawn directly on a canvas from the
 * same lines the preview card shows, so it needs no screenshot library.
 */
import {
  ASCENT,
  DESCENT,
  FONT_PX,
  GEOMETRY,
  HEADER,
  LINE_PX,
  PALETTES,
  SERP_FONT,
  WATERMARK,
  type Palette,
  type Theme,
} from "./config";
import type { FallbackMeasure, Run } from "./measure";
import type { SnippetLayout } from "./snippet";

let cachedMeasurer: FallbackMeasure | null | undefined;

/**
 * Fallback for characters that are not in the width table (emoji, Arabic, Thai ...).
 * Measures one grapheme cluster with canvas measureText using the same font stack the
 * preview uses. Returns null on the server or when canvas is unavailable.
 */
export function getCanvasMeasurer(): FallbackMeasure | null {
  if (cachedMeasurer !== undefined) return cachedMeasurer;
  if (typeof document === "undefined") return null;
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    cachedMeasurer = ctx
      ? (cluster, fontPx) => {
          ctx.font = `${fontPx}px ${SERP_FONT}`;
          const w = ctx.measureText(cluster).width;
          return Number.isFinite(w) ? w : null;
        }
      : null;
  } catch {
    cachedMeasurer = null;
  }
  return cachedMeasurer;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The image could not be decoded."));
    img.src = src;
  });
}

/** Size of the stored favicon (a small square PNG). */
const FAVICON_PX = 64;

/** Largest favicon file that is read, in bytes. */
export const MAX_FAVICON_BYTES = 2 * 1024 * 1024;

/** Read an image file into a small square PNG data URL. The file never leaves the browser. */
export async function fileToFavicon(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = FAVICON_PX;
    canvas.height = FAVICON_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available in this browser.");
    const w = img.naturalWidth || FAVICON_PX;
    const h = img.naturalHeight || FAVICON_PX;
    const scale = Math.min(FAVICON_PX / w, FAVICON_PX / h);
    const dw = w * scale;
    const dh = h * scale;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (FAVICON_PX - dw) / 2, (FAVICON_PX - dh) / 2, dw, dh);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/* -------------------------------------------------------------------------- */
/* Drawing                                                                     */
/* -------------------------------------------------------------------------- */

type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Baseline that centres a line of text in a line box, like CSS does. */
function baseline(top: number, lineHeight: number, fontPx: number): number {
  return top + (lineHeight - (ASCENT + DESCENT) * fontPx) / 2 + ASCENT * fontPx;
}

function drawRuns(ctx: Ctx, runs: Run[], x: number, y: number, fontPx: number, palette: Palette, base: string) {
  ctx.textBaseline = "alphabetic";
  let cx = x;
  for (const run of runs) {
    const bold = run.style === "bold";
    ctx.font = `${bold ? "bold " : ""}${fontPx}px ${SERP_FONT}`;
    ctx.fillStyle = run.style === "muted" ? palette.muted : bold ? palette.bold : base;
    ctx.fillText(run.text, cx, y);
    cx += ctx.measureText(run.text).width;
  }
}

/** Draw one preview card with its top-left corner at (x, y). */
export function drawCard(ctx: Ctx, x: number, y: number, layout: SnippetLayout, theme: Theme, favicon: HTMLImageElement | null) {
  const g = GEOMETRY[layout.device];
  const p = PALETTES[theme];
  const left = x + g.pad;
  const top = y + g.padTop;

  // Card.
  roundRect(ctx, x + 0.5, y + 0.5, g.outer - 1, layout.height - 1, 12);
  ctx.fillStyle = p.bg;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = p.border;
  ctx.stroke();

  // Favicon circle, with the uploaded icon or a letter.
  const cx = left + HEADER.favicon / 2;
  const cy = top + HEADER.height / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, HEADER.favicon / 2 - 0.5, 0, Math.PI * 2);
  ctx.fillStyle = p.faviconBg;
  ctx.fill();
  ctx.strokeStyle = p.border;
  ctx.stroke();
  if (favicon) {
    const s = HEADER.faviconImage;
    ctx.save();
    roundRect(ctx, cx - s / 2, cy - s / 2, s, s, 3);
    ctx.clip();
    ctx.drawImage(favicon, cx - s / 2, cy - s / 2, s, s);
    ctx.restore();
  } else {
    ctx.font = `bold 13px ${SERP_FONT}`;
    ctx.fillStyle = p.faviconFg;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(layout.monogram, cx, baseline(cy - 9, 18, 13));
    ctx.textAlign = "left";
  }

  // Site name and breadcrumb.
  const textLeft = left + HEADER.favicon + HEADER.gap;
  const blockHeight = LINE_PX.site + LINE_PX.crumb;
  const blockTop = top + (HEADER.height - blockHeight) / 2;
  drawRuns(ctx, [{ text: layout.siteName, style: "regular" }], textLeft, baseline(blockTop, LINE_PX.site, FONT_PX.site), FONT_PX.site, p, p.site);
  drawRuns(ctx, [{ text: layout.crumb, style: "regular" }], textLeft, baseline(blockTop + LINE_PX.site, LINE_PX.crumb, FONT_PX.crumb), FONT_PX.crumb, p, p.crumb);

  // Three-dot menu.
  const dotX = x + g.outer - g.pad - 3;
  ctx.fillStyle = p.dots;
  for (const dy of [-5, 0, 5]) {
    ctx.beginPath();
    ctx.arc(dotX, cy + dy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title and description.
  let lineTop = top + HEADER.height + HEADER.belowGap;
  for (const runs of layout.titleLines) {
    drawRuns(ctx, runs, left, baseline(lineTop, LINE_PX.title, FONT_PX.title), FONT_PX.title, p, p.title);
    lineTop += LINE_PX.title;
  }
  lineTop += HEADER.titleGap;
  for (const runs of layout.descriptionLines) {
    drawRuns(ctx, runs, left, baseline(lineTop, LINE_PX.description, FONT_PX.description), FONT_PX.description, p, p.text);
    lineTop += LINE_PX.description;
  }
}

export interface ExportCard {
  label: string;
  layout: SnippetLayout;
}

const MARGIN = 24;
const LABEL_HEIGHT = 22;
const CARD_GAP = 16;
const FOOTER_HEIGHT = 36;

/** Size of the exported image in CSS pixels (before the pixel-ratio scale). */
export function exportSize(cards: ExportCard[]): { width: number; height: number } {
  const widest = Math.max(...cards.map((c) => GEOMETRY[c.layout.device].outer));
  const body = cards.reduce((sum, c) => sum + LABEL_HEIGHT + c.layout.height, 0) + CARD_GAP * Math.max(0, cards.length - 1);
  return { width: widest + MARGIN * 2, height: MARGIN + body + FOOTER_HEIGHT };
}

/** Draw the cards, one under the other, and return a PNG blob. */
export async function renderPng(cards: ExportCard[], opts: { theme: Theme; favicon: string; scale?: number }): Promise<Blob> {
  if (!cards.length) throw new Error("Nothing to export.");
  const scale = opts.scale ?? 2;
  const p = PALETTES[opts.theme];
  const { width, height } = exportSize(cards);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.scale(scale, scale);
  ctx.fillStyle = p.canvas;
  ctx.fillRect(0, 0, width, height);

  let favicon: HTMLImageElement | null = null;
  if (opts.favicon) {
    try {
      favicon = await loadImage(opts.favicon);
    } catch {
      favicon = null;
    }
  }

  let y = MARGIN;
  for (const card of cards) {
    ctx.font = `600 11px ui-monospace, Menlo, Consolas, "Liberation Mono", monospace`;
    ctx.fillStyle = p.muted;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillText(card.label.toUpperCase(), MARGIN, y + 13);
    y += LABEL_HEIGHT;
    drawCard(ctx, MARGIN, y, card.layout, opts.theme, favicon);
    y += card.layout.height + CARD_GAP;
  }

  ctx.font = `11px ${SERP_FONT}`;
  ctx.fillStyle = p.muted;
  ctx.textAlign = "left";
  ctx.fillText(WATERMARK, MARGIN, height - 16);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The image could not be created."))), "image/png");
  });
}

