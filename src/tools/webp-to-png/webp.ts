/**
 * Pure helpers that read the first bytes of an image file.
 *
 * Nothing here touches the DOM, so it can run on the server, in a worker or in a
 * plain Node test. WebP files are a RIFF container:
 *
 *   offset  size  meaning
 *   0       4     "RIFF"
 *   4       4     little-endian size of everything after these 8 bytes
 *   8       4     "WEBP"
 *   12      4     first chunk id: "VP8 " (lossy), "VP8L" (lossless) or "VP8X" (extended)
 *   16      4     first chunk payload size
 *   20      ...   first chunk payload
 *
 * The extended header ("VP8X") carries a flag byte at offset 20:
 *   0x20 ICC profile, 0x10 alpha, 0x08 EXIF, 0x04 XMP, 0x02 animation
 * followed by 3 reserved bytes and the canvas width - 1 and height - 1 as
 * 24-bit little-endian values (offsets 24 and 27).
 */

export type SniffedFormat = "webp" | "png" | "jpeg" | "gif" | "avif" | "heic" | "bmp" | "unknown";

export interface WebpInfo {
  /** "simple" = a single VP8 or VP8L chunk, "extended" = VP8X container. */
  container: "simple" | "extended";
  /** Bitstream type of the (first) image, when it could be read. */
  bitstream: "lossy" | "lossless" | "unknown";
  /** Canvas size from the header, when readable. */
  width: number | null;
  height: number | null;
  /** Header says the image may contain transparency. */
  hasAlpha: boolean;
  animated: boolean;
  /** Number of animation frames (only set when the whole file was scanned). */
  frameCount: number | null;
  hasIcc: boolean;
  hasExif: boolean;
  hasXmp: boolean;
  /** Total file size the RIFF header claims (RIFF size + 8 bytes). */
  declaredSize: number;
}

/** Bytes needed to sniff the format and read a simple or extended WebP header. */
export const HEADER_BYTES = 65536;

function ascii(b: Uint8Array, offset: number, length: number): string {
  if (offset < 0 || offset + length > b.length) return "";
  let s = "";
  for (let i = 0; i < length; i++) s += String.fromCharCode(b[offset + i]);
  return s;
}

function u32le(b: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 4 > b.length) return null;
  return (b[offset] | (b[offset + 1] << 8) | (b[offset + 2] << 16) | (b[offset + 3] << 24)) >>> 0;
}

function u24le(b: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 3 > b.length) return null;
  return b[offset] | (b[offset + 1] << 8) | (b[offset + 2] << 16);
}

/** Identify a file by its magic bytes instead of trusting its name or MIME type. */
export function sniffFormat(b: Uint8Array): SniffedFormat {
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "webp";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return "png";
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  const gif = ascii(b, 0, 6);
  if (gif === "GIF87a" || gif === "GIF89a") return "gif";
  if (ascii(b, 4, 4) === "ftyp") {
    const brand = ascii(b, 8, 4);
    if (brand === "avif" || brand === "avis") return "avif";
    if (["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(brand)) return "heic";
  }
  if (ascii(b, 0, 2) === "BM") return "bmp";
  return "unknown";
}

/** Human label for a sniffed format. */
export function formatLabel(f: SniffedFormat): string {
  switch (f) {
    case "webp":
      return "WebP";
    case "png":
      return "PNG";
    case "jpeg":
      return "JPEG";
    case "gif":
      return "GIF";
    case "avif":
      return "AVIF";
    case "heic":
      return "HEIC";
    case "bmp":
      return "BMP";
    default:
      return "image";
  }
}

/**
 * Read the WebP container header. Returns null when the bytes are not a WebP
 * file. Works on a partial buffer (the first few KB is enough); fields that
 * lie beyond the buffer come back as null / "unknown" rather than throwing.
 */
export function parseWebpHeader(b: Uint8Array): WebpInfo | null {
  if (sniffFormat(b) !== "webp") return null;
  const riffSize = u32le(b, 4) ?? 0;
  const info: WebpInfo = {
    container: "simple",
    bitstream: "unknown",
    width: null,
    height: null,
    hasAlpha: false,
    animated: false,
    frameCount: null,
    hasIcc: false,
    hasExif: false,
    hasXmp: false,
    declaredSize: riffSize + 8,
  };

  const first = ascii(b, 12, 4);

  if (first === "VP8 ") {
    // Lossy key frame: 3-byte frame tag, start code 9d 01 2a, then 14-bit width and height.
    info.bitstream = "lossy";
    if (b.length >= 30 && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
      info.width = (b[26] | (b[27] << 8)) & 0x3fff;
      info.height = (b[28] | (b[29] << 8)) & 0x3fff;
    }
    return info;
  }

  if (first === "VP8L") {
    // Lossless: signature 0x2f, then 14-bit width-1, 14-bit height-1, alpha hint, 3-bit version.
    info.bitstream = "lossless";
    const sig = b[20];
    const bits = u32le(b, 21);
    if (sig === 0x2f && bits !== null) {
      info.width = (bits & 0x3fff) + 1;
      info.height = ((bits >>> 14) & 0x3fff) + 1;
      info.hasAlpha = ((bits >>> 28) & 1) === 1;
    }
    return info;
  }

  if (first === "VP8X") {
    info.container = "extended";
    const flags = b[20];
    if (flags !== undefined) {
      info.hasIcc = (flags & 0x20) !== 0;
      info.hasAlpha = (flags & 0x10) !== 0;
      info.hasExif = (flags & 0x08) !== 0;
      info.hasXmp = (flags & 0x04) !== 0;
      info.animated = (flags & 0x02) !== 0;
    }
    const w = u24le(b, 24);
    const h = u24le(b, 27);
    if (w !== null && h !== null) {
      info.width = w + 1;
      info.height = h + 1;
    }
    // Walk the chunks after VP8X to find out whether the image data is lossy or lossless.
    const vp8xSize = u32le(b, 16) ?? 10;
    let off = 20 + vp8xSize + (vp8xSize & 1);
    for (let guard = 0; guard < 64 && off + 8 <= b.length; guard++) {
      const id = ascii(b, off, 4);
      const size = u32le(b, off + 4);
      if (size === null) break;
      if (id === "VP8 " || id === "ALPH") {
        info.bitstream = "lossy";
        break;
      }
      if (id === "VP8L") {
        info.bitstream = "lossless";
        if (!info.hasAlpha) {
          const bits = u32le(b, off + 9);
          if (bits !== null && b[off + 8] === 0x2f) info.hasAlpha = ((bits >>> 28) & 1) === 1;
        }
        break;
      }
      if (id === "ANMF") break; // animated: frames hold their own bitstreams
      off += 8 + size + (size & 1);
    }
    return info;
  }

  return info;
}

/**
 * Count animation frames (ANMF chunks) in a complete WebP file. The chunk walk
 * only reads 8-byte headers, so it is fast even for large files.
 */
export function countAnimationFrames(b: Uint8Array): number {
  if (sniffFormat(b) !== "webp") return 0;
  let off = 12;
  let frames = 0;
  while (off + 8 <= b.length) {
    const id = ascii(b, off, 4);
    const size = u32le(b, off + 4);
    if (size === null) break;
    if (id === "ANMF") frames++;
    off += 8 + size + (size & 1);
  }
  return frames;
}

/** One-line description such as "Lossless WebP" or "Animated WebP, 12 frames". */
export function describeWebp(info: WebpInfo): string {
  if (info.animated) {
    return info.frameCount && info.frameCount > 0 ? `Animated WebP, ${info.frameCount} frame${info.frameCount === 1 ? "" : "s"}` : "Animated WebP";
  }
  if (info.bitstream === "lossy") return "Lossy WebP";
  if (info.bitstream === "lossless") return "Lossless WebP";
  return "WebP";
}
