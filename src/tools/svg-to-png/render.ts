/**
 * Draw a template made by parseSvg onto a canvas and encode it as PNG or JPEG.
 *
 * The SVG is turned into a Blob, loaded through an <img> element via a blob: URL
 * and drawn with drawImage. It is never inserted into the page. An image loaded
 * this way cannot run scripts or fetch outside files, which is what makes it safe
 * to draw markup the user pasted or uploaded.
 *
 * Only call these functions from event handlers or effects (they use `document`).
 */
import { UserFacingError, sizeTemplate, type OutputPlan } from "./svg";

export interface RenderOptions {
  format: "png" | "jpg";
  /** CSS color painted behind the drawing, or null to keep transparency (PNG only). */
  background: string | null;
  /** JPEG quality, 0.5 to 1. */
  quality: number;
}

export interface Rendered {
  blob: Blob;
  /** Small data-URL preview (no object URL to revoke). */
  thumb: string | null;
  /** The transparent PNG has no visible pixels at all. */
  blank: boolean;
}

const THUMB_SIZE = 320;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("The browser could not load the SVG as an image."));
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

/** Preview and emptiness check, both made from a small copy so huge outputs stay cheap. */
function makeThumb(source: HTMLCanvasElement, width: number, height: number, checkBlank: boolean): { thumb: string | null; blank: boolean } {
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
    let blank = false;
    if (checkBlank) {
      blank = true;
      const data = ctx.getImageData(0, 0, tw, th).data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 0) {
          blank = false;
          break;
        }
      }
    }
    return { thumb: small.toDataURL("image/png"), blank };
  } catch {
    return { thumb: null, blank: false }; // a preview is a nicety, never a reason to fail
  }
}

export async function renderSvg(template: string, plan: OutputPlan, options: RenderOptions): Promise<Rendered> {
  const { width, height } = plan;
  const markup = sizeTemplate(template, width, height);
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
  const canvas = document.createElement("canvas");
  try {
    let img: HTMLImageElement;
    try {
      img = await loadImage(url);
    } catch {
      throw new UserFacingError(
        "The browser could not draw this SVG. It may use features browsers do not support in images, or be damaged. Open it in a browser tab to check that it displays.",
      );
    }
    if (!(img.naturalWidth > 0 && img.naturalHeight > 0)) {
      throw new UserFacingError("The browser could not work out the size of this SVG. Add a viewBox or width and height to the <svg> tag.");
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new UserFacingError(`This browser could not create a ${width} × ${height} px canvas. Choose a smaller size.`);
    if (options.background) {
      ctx.fillStyle = options.background;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    const mime = options.format === "png" ? "image/png" : "image/jpeg";
    let blob: Blob | null;
    try {
      blob = await canvasToBlob(canvas, mime, options.format === "jpg" ? options.quality : undefined);
    } catch (e) {
      if (e instanceof DOMException && e.name === "SecurityError") {
        throw new UserFacingError(
          "This browser treats the SVG as cross-origin content and will not export it, which usually happens with <foreignObject>. Re-export the SVG without HTML text boxes, or try another browser.",
        );
      }
      throw e;
    }
    if (!blob || blob.size === 0 || blob.type !== mime) {
      throw new UserFacingError(`The browser could not encode a ${width} × ${height} px ${options.format.toUpperCase()}. Try a smaller size or a desktop browser.`);
    }
    return { blob, ...makeThumb(canvas, width, height, options.format === "png" && !options.background) };
  } finally {
    URL.revokeObjectURL(url);
    // Release the pixel memory right away (large canvases are the main cost).
    canvas.width = 0;
    canvas.height = 0;
  }
}
