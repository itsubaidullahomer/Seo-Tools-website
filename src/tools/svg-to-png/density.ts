/**
 * Write a pixel-density (DPI) value into a finished PNG or JPEG.
 *
 * Canvas encoders write no density at all, so a design or print program has to
 * guess the physical size. The pixel grid is never touched: only a few header
 * bytes are added (PNG pHYs chunk) or changed (JPEG JFIF density fields), and the
 * rest of the file is passed on as a Blob slice without being read into memory.
 */

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
/** Enough to walk every chunk that precedes the image data in a canvas-made PNG. */
const PNG_SCAN_BYTES = 64 * 1024;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const ascii = (bytes: Uint8Array, start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));

/** Dots per inch to the PNG unit, pixels per meter. */
export function dpiToPixelsPerMeter(dpi: number): number {
  return Math.round(dpi / 0.0254);
}

function buildPhys(dpi: number): Uint8Array<ArrayBuffer> {
  const chunk = new Uint8Array(new ArrayBuffer(21));
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // "pHYs"
  const ppm = dpiToPixelsPerMeter(dpi);
  view.setUint32(8, ppm);
  view.setUint32(12, ppm);
  chunk[16] = 1; // unit: meter
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  return chunk;
}

async function pngWithDensity(blob: Blob, dpi: number): Promise<Blob | null> {
  const head = new Uint8Array(await blob.slice(0, PNG_SCAN_BYTES).arrayBuffer());
  if (head.length < 33 || !PNG_SIGNATURE.every((b, i) => head[i] === b) || ascii(head, 12, 4) !== "IHDR") return null;

  const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
  let offset = 8;
  const insertAt = 33; // right after IHDR (8-byte signature + 25-byte IHDR chunk)
  let replaceEnd = -1;
  let replaceStart = -1;
  while (offset + 12 <= head.length) {
    const length = view.getUint32(offset);
    const type = ascii(head, offset + 4, 4);
    const end = offset + 12 + length;
    if (type === "IDAT" || type === "IEND") break;
    if (type === "pHYs") {
      replaceStart = offset;
      replaceEnd = end;
      break;
    }
    offset = end;
  }

  const phys = buildPhys(dpi);
  if (replaceStart >= 0) return new Blob([head.slice(0, replaceStart), phys, blob.slice(replaceEnd)], { type: "image/png" });
  return new Blob([head.slice(0, insertAt), phys, blob.slice(insertAt)], { type: "image/png" });
}

const JFIF_HEAD = 20;

async function jpegWithDensity(blob: Blob, dpi: number): Promise<Blob | null> {
  const head = new Uint8Array(await blob.slice(0, JFIF_HEAD).arrayBuffer());
  const isJfif = head.length >= JFIF_HEAD && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff && head[3] === 0xe0 && ascii(head, 6, 5) === "JFIF\0";
  if (!isJfif) return null;
  const d = Math.min(65535, Math.round(dpi));
  const patched = head.slice();
  patched[13] = 1; // units: dots per inch
  patched[14] = d >> 8;
  patched[15] = d & 0xff;
  patched[16] = d >> 8;
  patched[17] = d & 0xff;
  return new Blob([patched, blob.slice(JFIF_HEAD)], { type: "image/jpeg" });
}

export interface DensityResult {
  blob: Blob;
  /** False when the encoder's output had an unexpected layout and the file was left unchanged. */
  applied: boolean;
}

/** Return the image with `dpi` written into its header, or unchanged (applied: false) if that is not possible. */
export async function withDensity(blob: Blob, format: "png" | "jpg", dpi: number): Promise<DensityResult> {
  try {
    const next = format === "png" ? await pngWithDensity(blob, dpi) : await jpegWithDensity(blob, dpi);
    return next ? { blob: next, applied: true } : { blob, applied: false };
  } catch {
    return { blob, applied: false };
  }
}
