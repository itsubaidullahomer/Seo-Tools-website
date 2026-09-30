/**
 * Browser-side conversion: decode with the browser's own image decoder and encode
 * the pixels as PNG through a canvas. Only call these functions from event
 * handlers or effects – they use `document`, `createImageBitmap` and `Image`.
 *
 * Two routes, both ending in `canvas.toBlob("image/png")`:
 *
 *  1. Exact route (default, no background fill). The image is decoded with
 *     premultiplyAlpha: "none" and handed to an ImageBitmapRenderingContext, so
 *     the canvas never premultiplies color by alpha. In Chromium this returns
 *     the same RGBA values libwebp produces, including the color stored under
 *     fully transparent pixels.
 *  2. Standard route (used for the background fill option, and as a fallback
 *     when the exact route is unavailable or draws nothing). The image is drawn
 *     on a 2D canvas; browsers premultiply alpha there, so very faint
 *     semi-transparent pixels can shift by a few levels.
 */
import { countAnimationFrames, formatLabel, parseWebpHeader, sniffFormat, HEADER_BYTES, type SniffedFormat } from "./webp";
import { UserFacingError, type ConvertOptions, type Processor, type RowUpdate } from "./queue";

/** Scanning every chunk header of a huge animated file is not worth the memory. */
const FRAME_SCAN_LIMIT = 96 * 1024 * 1024;
const THUMB_SIZE = 112;

interface Encoded {
  blob: Blob;
  width: number;
  height: number;
  thumb: string | null;
  /** The preview came out fully transparent (an empty image, or a route that drew nothing). */
  blank: boolean;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type));
}

function isPng(blob: Blob | null): blob is Blob {
  return !!blob && blob.type === "image/png" && blob.size > 0;
}

function tooLargeError(width: number, height: number): UserFacingError {
  return new UserFacingError(`This ${width} × ${height} image is too large for your browser to encode as PNG. Try a desktop browser or a smaller file.`);
}

function undecodableMessage(format: SniffedFormat): string {
  if (format === "heic") return "This is a HEIC/HEIF photo, which most browsers cannot decode. Open this page in Safari, or convert it with a HEIC tool first.";
  if (format === "avif") return "Your browser could not decode this AVIF image. Update the browser or try another one.";
  return "Your browser could not decode this file. It may be damaged, cut off, or not a supported image.";
}

/** Small preview (a data URL, so there is no object URL to revoke) and a blank check. */
function makeThumb(source: HTMLCanvasElement, width: number, height: number): { thumb: string | null; blank: boolean } {
  try {
    const scale = Math.min(1, THUMB_SIZE / Math.max(width, height));
    const tw = Math.max(1, Math.round(width * scale));
    const th = Math.max(1, Math.round(height * scale));
    const small = document.createElement("canvas");
    small.width = tw;
    small.height = th;
    const ctx = small.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { thumb: null, blank: false };
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, tw, th);
    const data = ctx.getImageData(0, 0, tw, th).data;
    let blank = true;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) {
        blank = false;
        break;
      }
    }
    return { thumb: small.toDataURL("image/png"), blank };
  } catch {
    return { thumb: null, blank: false }; // a preview is a nicety, never a reason to fail
  }
}

/** Route 1: decode without premultiplying alpha and let the canvas display the bitmap as is. */
async function encodeExact(file: Blob): Promise<Encoded> {
  const bitmap = await createImageBitmap(file, { premultiplyAlpha: "none" });
  const { width, height } = bitmap;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  try {
    const ctx = canvas.getContext("bitmaprenderer");
    if (!ctx) throw new Error("ImageBitmapRenderingContext is not available");
    ctx.transferFromImageBitmap(bitmap);
    const blob = await canvasToBlob(canvas, "image/png");
    if (!isPng(blob)) throw new Error("PNG encoding failed");
    return { blob, width, height, ...makeThumb(canvas, width, height) };
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** Decode with a bitmap when possible, otherwise through an <img> element. */
async function decode(file: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      /* fall through to the <img> decoder */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => undefined };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Route 2: draw on a 2D canvas (optionally over a solid fill) and encode. */
async function encodeStandard(file: Blob, options: ConvertOptions, format: SniffedFormat): Promise<Encoded> {
  let decoded: Awaited<ReturnType<typeof decode>>;
  try {
    decoded = await decode(file);
  } catch {
    throw new UserFacingError(undecodableMessage(format));
  }
  const { width, height, source } = decoded;
  const canvas = document.createElement("canvas");
  try {
    if (!(width > 0 && height > 0)) throw new UserFacingError("The image has no pixels (its width or height is 0).");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw tooLargeError(width, height);
    if (options.fillColor) {
      ctx.fillStyle = options.fillColor;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(source, 0, 0);
    const blob = await canvasToBlob(canvas, "image/png");
    if (!isPng(blob)) throw tooLargeError(width, height);
    return { blob, width, height, ...makeThumb(canvas, width, height) };
  } finally {
    decoded.release();
    // Release the pixel memory right away (large canvases are the main cost).
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** The Processor used by the tool: inspect, decode and encode one file. */
export const processFile: Processor = async (file, options, report) => {
  if (file.size === 0) {
    throw new UserFacingError("This file is empty (0 bytes). If you dropped a folder, drop the files inside it instead.");
  }

  const head = new Uint8Array(await file.slice(0, HEADER_BYTES).arrayBuffer());
  const sniff = sniffFormat(head);
  if (sniff === "unknown" && file.type && !file.type.startsWith("image/")) {
    throw new UserFacingError("This does not look like an image file.");
  }

  const update: RowUpdate = { sniff };
  let note: string | null = null;

  if (sniff === "webp") {
    const info = parseWebpHeader(head);
    if (info) {
      if (info.animated && file.size <= FRAME_SCAN_LIMIT) {
        info.frameCount = countAnimationFrames(new Uint8Array(await file.arrayBuffer()));
      }
      update.info = info;
      if (info.declaredSize > file.size) {
        note = "This file looks cut off: it is shorter than its header says. It may be an incomplete download.";
      }
    }
  } else if (sniff === "png") {
    note = "This file is already a PNG. It was re-encoded from its decoded pixels.";
  } else if (sniff !== "unknown") {
    note = `This file is a ${formatLabel(sniff)}, not a WebP. It was converted anyway.`;
  }
  report({ ...update, stage: 2, note });

  let result: Encoded | null = null;
  if (!options.fillColor && typeof createImageBitmap === "function") {
    try {
      result = await encodeExact(file);
    } catch {
      result = null; // unsupported option, undecodable file, ...: the standard route decides
    }
    if (result?.blank) result = null; // let the standard route double-check an empty result
  }
  if (!result) result = await encodeStandard(file, options, sniff);

  return { ...update, note, width: result.width, height: result.height, out: result.blob, thumb: result.thumb, stage: 3 };
};
