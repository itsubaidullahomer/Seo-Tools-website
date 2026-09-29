/**
 * Browser-side conversion: decode with the browser's own image decoder, paint
 * the pixels over a solid background color on a canvas and encode the canvas
 * as JPEG. Only call these functions from event handlers or effects – they use
 * `document`, `createImageBitmap` and `Image`.
 *
 * JPEG has no alpha channel, so a canvas that still holds transparent pixels
 * would be flattened onto black by the encoder. Painting the background first
 * (white by default) makes that choice explicit and gives the same result in
 * every browser.
 */
import { formatLabel, parseWebpHeader, sniffFormat, countAnimationFrames, HEADER_BYTES, type SniffedFormat } from "./webp";
import { fitToSize } from "./fit";
import { MIN_FIT_QUALITY } from "./settings";
import { UserFacingError, type ConvertOptions, type Processor, type RowUpdate } from "./queue";

/** Scanning every chunk header of a huge animated file is not worth the memory. */
const FRAME_SCAN_LIMIT = 96 * 1024 * 1024;
const THUMB_SIZE = 112;
const ALPHA_PROBE_SIZE = 96;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
}

function isJpeg(blob: Blob | null): blob is Blob {
  return !!blob && blob.type === "image/jpeg" && blob.size > 0;
}

function tooLargeError(width: number, height: number): UserFacingError {
  return new UserFacingError(`This ${width} × ${height} image is too large for your browser to encode as JPG. Try a desktop browser or a smaller file.`);
}

function undecodableMessage(format: SniffedFormat): string {
  if (format === "heic") return "This is a HEIC/HEIF photo, which most browsers cannot decode. Open this page in Safari, or convert it with a HEIC tool first.";
  if (format === "avif") return "Your browser could not decode this AVIF image. Update the browser or try another one.";
  return "Your browser could not decode this file. It may be damaged, cut off, or not a supported image.";
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

/**
 * Does the decoded image contain any pixel that is not fully opaque? Checked on a
 * small copy: averaging keeps any transparent pixel below full alpha, so even a
 * single see-through pixel is noticed. Returns null when the check itself fails.
 */
function hasTransparentPixels(source: CanvasImageSource, width: number, height: number): boolean | null {
  try {
    const scale = Math.min(1, ALPHA_PROBE_SIZE / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const probe = document.createElement("canvas");
    probe.width = w;
    probe.height = h;
    const ctx = probe.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 255) return true;
    }
    return false;
  } catch {
    return null;
  }
}

/** Small preview (a data URL, so there is no object URL to revoke). */
function makeThumb(source: HTMLCanvasElement, width: number, height: number): string | null {
  try {
    const scale = Math.min(1, THUMB_SIZE / Math.max(width, height));
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.round(width * scale));
    small.height = Math.max(1, Math.round(height * scale));
    const ctx = small.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, small.width, small.height);
    return small.toDataURL("image/jpeg", 0.8);
  } catch {
    return null; // a preview is a nicety, never a reason to fail
  }
}

interface Encoded {
  blob: Blob;
  width: number;
  height: number;
  thumb: string | null;
  flattened: boolean | null;
  quality: number;
  fits: boolean | null;
}

async function encodeJpeg(file: Blob, options: ConvertOptions, format: SniffedFormat): Promise<Encoded> {
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
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw tooLargeError(width, height);
    ctx.fillStyle = options.fillColor;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(source, 0, 0);
    const flattened = hasTransparentPixels(source, width, height);

    const encode = async (quality: number): Promise<Blob> => {
      const blob = await canvasToBlob(canvas, quality / 100);
      if (!isJpeg(blob)) throw tooLargeError(width, height);
      return blob;
    };

    const thumb = makeThumb(canvas, width, height);
    if (options.maxBytes !== null) {
      const fitted = await fitToSize(encode, options.quality, options.maxBytes, Math.min(MIN_FIT_QUALITY, options.quality));
      return { blob: fitted.blob, width, height, thumb, flattened, quality: fitted.quality, fits: fitted.fits };
    }
    return { blob: await encode(options.quality), width, height, thumb, flattened, quality: options.quality, fits: null };
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
  } else if (sniff === "jpeg") {
    note = "This file is already a JPEG. Saving it again compresses it a second time, which can only lower quality.";
  } else if (sniff !== "unknown") {
    note = `This file is a ${formatLabel(sniff)}, not a WebP. It was converted anyway.`;
  }
  report({ ...update, stage: 2, note });

  const result = await encodeJpeg(file, options, sniff);
  return {
    ...update,
    note,
    width: result.width,
    height: result.height,
    out: result.blob,
    thumb: result.thumb,
    flattened: result.flattened,
    usedQuality: result.quality,
    fit: options.maxBytes !== null && result.fits !== null ? { limit: options.maxBytes, quality: result.quality, fits: result.fits } : null,
    stage: 3,
  };
};
