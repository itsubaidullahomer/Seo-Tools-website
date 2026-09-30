/**
 * Pure helpers for the SVG to PNG converter: length parsing, output sizing and
 * clamping, source clean-up, warnings about things an <img> cannot draw, file
 * names and batch limits.
 *
 * Nothing here touches the DOM (parsing with DOMParser lives in parse.ts), so the
 * whole file can be tested in Node.
 */

export const SVG_NS = "http://www.w3.org/2000/svg";
export const XLINK_NS = "http://www.w3.org/1999/xlink";

/** What browsers use for a replaced element that has no size of its own. */
export const DEFAULT_WIDTH = 300;
export const DEFAULT_HEIGHT = 150;

/** Output limits. 4,096 x 4,096 is the canvas area iOS Safari has long supported. */
export const MAX_PIXELS = 16_777_216;
export const MAX_SIDE = 16_384;

/** Input limits. SVG is text, so these are generous. */
export const MAX_FILES = 50;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_BATCH_BYTES = 100 * 1024 * 1024;
export const MAX_CODE_CHARS = 5_000_000;

/** Error whose message is written for the user and shown as is. Anything else gets a generic message. */
export class UserFacingError extends Error {}

export const GENERIC_ERROR = "Something went wrong while converting this SVG. It may be damaged, or too large for this browser's memory.";

/* ------------------------------------------------------------------ lengths */

const UNIT_TO_PX: Record<string, number> = {
  "": 1,
  px: 1,
  pt: 96 / 72,
  pc: 16,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 101.6,
  // Font-relative units depend on the context; 16 px and 8 px are the usual fallbacks.
  em: 16,
  rem: 16,
  ex: 8,
};

/**
 * Convert an SVG length such as "24", "2in" or "10.5mm" to CSS pixels (96 per inch).
 * Returns null for percentages, "auto", negative or zero values and anything unparseable.
 */
export function parseLength(value: string | null | undefined): number | null {
  if (value == null) return null;
  const m = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([a-zA-Z%]*)\s*$/.exec(value);
  if (!m) return null;
  const factor = UNIT_TO_PX[m[2].toLowerCase()];
  if (factor === undefined) return null; // also rejects "%"
  const px = Number(m[1]) * factor;
  return Number.isFinite(px) && px > 0 && px <= 10_000_000 ? px : null;
}

export interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export function parseViewBox(value: string | null | undefined): ViewBox | null {
  if (!value) return null;
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [minX, minY, width, height] = parts;
  if (!(width > 0) || !(height > 0)) return null;
  return { minX, minY, width, height };
}

export type SizeSource = "size" | "viewBox" | "default";

export interface Intrinsic {
  width: number;
  height: number;
  /** size: from width and height. viewBox: derived from the viewBox. default: nothing usable, 300 x 150 assumed. */
  source: SizeSource;
  viewBox: ViewBox | null;
}

/**
 * Work out the natural size of an SVG the way a browser would for an <img>:
 * width and height win, the viewBox fills in whatever is missing, and with
 * neither the image falls back to 300 x 150.
 */
export function measureSvg(attrs: { width: string | null; height: string | null; viewBox: string | null }): Intrinsic {
  const w = parseLength(attrs.width);
  const h = parseLength(attrs.height);
  const viewBox = parseViewBox(attrs.viewBox);
  if (w && h) return { width: w, height: h, source: "size", viewBox };
  if (viewBox) {
    if (w) return { width: w, height: (w * viewBox.height) / viewBox.width, source: "viewBox", viewBox };
    if (h) return { width: (h * viewBox.width) / viewBox.height, height: h, source: "viewBox", viewBox };
    return { width: viewBox.width, height: viewBox.height, source: "viewBox", viewBox };
  }
  return { width: w ?? DEFAULT_WIDTH, height: h ?? DEFAULT_HEIGHT, source: "default", viewBox: null };
}

/** Drop width/height/min/max declarations from an inline style so they cannot override the size we set. */
export function stripSizeFromStyle(style: string): string {
  return style
    .split(";")
    .filter((decl) => {
      const prop = decl.split(":")[0]?.trim().toLowerCase();
      return prop && !["width", "height", "min-width", "max-width", "min-height", "max-height"].includes(prop);
    })
    .map((d) => d.trim())
    .join("; ");
}

/* --------------------------------------------------------------------- size */

export type Sizing =
  | { mode: "scale"; scale: number }
  /** A null side follows the other side at the image's own aspect ratio (aspect lock). */
  | { mode: "exact"; width: number | null; height: number | null };

export interface OutputPlan {
  width: number;
  height: number;
  requestedWidth: number;
  requestedHeight: number;
  clamped: boolean;
}

/** Work out the output size for one image and shrink it to the canvas limits when needed. */
export function planOutput(size: { width: number; height: number }, sizing: Sizing): OutputPlan {
  let rw: number;
  let rh: number;
  if (sizing.mode === "scale") {
    rw = size.width * sizing.scale;
    rh = size.height * sizing.scale;
  } else if (sizing.width !== null && sizing.height !== null) {
    rw = sizing.width;
    rh = sizing.height;
  } else if (sizing.width !== null) {
    rw = sizing.width;
    rh = (sizing.width * size.height) / size.width;
  } else if (sizing.height !== null) {
    rh = sizing.height;
    rw = (sizing.height * size.width) / size.height;
  } else {
    throw new UserFacingError("Enter a width or a height.");
  }
  rw = Math.max(1, Math.round(rw));
  rh = Math.max(1, Math.round(rh));

  const factor = Math.min(1, Math.sqrt(MAX_PIXELS / (rw * rh)), MAX_SIDE / Math.max(rw, rh));
  if (factor >= 1) return { width: rw, height: rh, requestedWidth: rw, requestedHeight: rh, clamped: false };
  // The small epsilon stops 4095.9999999999995 from flooring to 4095 when the exact answer is 4096.
  let width = Math.max(1, Math.floor(rw * factor + 1e-6));
  let height = Math.max(1, Math.floor(rh * factor + 1e-6));
  while ((width * height > MAX_PIXELS || Math.max(width, height) > MAX_SIDE) && (width > 1 || height > 1)) {
    if (width >= height) width--;
    else height--;
  }
  return { width, height, requestedWidth: rw, requestedHeight: rh, clamped: true };
}

const nf = (n: number) => n.toLocaleString("en-US");

/** Sentence explaining why the output is smaller than requested, or null. */
export function clampMessage(plan: OutputPlan): string | null {
  if (!plan.clamped) return null;
  const mp = ((plan.requestedWidth * plan.requestedHeight) / 1_000_000).toFixed(1);
  return `You asked for ${nf(plan.requestedWidth)} × ${nf(plan.requestedHeight)} px (${mp} million pixels). Browsers cannot reliably draw more than about 16.8 million pixels (4,096 × 4,096) or more than ${nf(MAX_SIDE)} px on one side, so the PNG was made at ${nf(plan.width)} × ${nf(plan.height)} px instead.`;
}

/** Pixels needed to print `value` (in the given unit) at `dpi` dots per inch. */
export function printToPixels(value: number, unit: "in" | "cm" | "mm", dpi: number): number | null {
  if (!(value > 0) || !(dpi > 0)) return null;
  const inches = unit === "in" ? value : unit === "cm" ? value / 2.54 : value / 25.4;
  const px = Math.round(inches * dpi);
  return px >= 1 ? px : null;
}

/** Parse a width/height field. Whole pixels from 1 up to one million, otherwise null. */
export function parseDimension(text: string): number | null {
  if (text.trim() === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 1 || n > 1_000_000) return null;
  return Math.round(n);
}

/* ------------------------------------------------------------------- source */

/**
 * Remove <!-- ... --> comments in one pass. A regex with a lazy match is quadratic on
 * input with many unclosed "<!--", so this walks the text with indexOf instead.
 * An unclosed comment is left as is (the XML parser then reports it).
 */
export function stripComments(text: string): string {
  let start = text.indexOf("<!--");
  if (start < 0) return text;
  let out = "";
  let from = 0;
  while (start >= 0) {
    const end = text.indexOf("-->", start + 4);
    if (end < 0) break;
    out += text.slice(from, start);
    from = end + 3;
    start = text.indexOf("<!--", from);
  }
  return out + text.slice(from);
}

/** First opening <svg ...> tag, quote-aware so a ">" inside an attribute does not end it. */
const ROOT_TAG = /<svg(?=[\s>/])(?:[^>"']|"[^"]*"|'[^']*')*>/i;

/**
 * Decode a data:image/svg+xml URI (base64 or percent-encoded) to markup.
 * Returns null when the text is not such a URI.
 */
export function decodeDataUri(text: string): string | null {
  const m = /^data:image\/svg\+xml(?:;charset=[\w-]+)?(;base64)?,([\s\S]*)$/i.exec(text.trim());
  if (!m) return null;
  try {
    if (m[1]) {
      const bytes = Uint8Array.from(atob(decodeURIComponent(m[2]).replace(/\s+/g, "")), (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    return decodeURIComponent(m[2]);
  } catch {
    throw new UserFacingError("That data: URI could not be decoded. Check that it is complete and not cut off.");
  }
}

/**
 * Make pasted markup parseable as a standalone XML document: strip a byte-order
 * mark and comments, and add the xmlns / xmlns:xlink declarations that code copied
 * from a web page or a component often lacks.
 */
export function prepareSource(input: string): string {
  let text = stripComments(input.replace(/^\uFEFF/, "").trim());
  const open = ROOT_TAG.exec(text);
  if (!open) return text;
  const tag = open[0];
  let fixed = tag;
  if (!/\sxmlns\s*=/.test(tag)) fixed = fixed.replace(/^<svg/i, `<svg xmlns="${SVG_NS}"`);
  if (/\bxlink:[a-z]/i.test(text) && !/\sxmlns:xlink\s*=/.test(tag)) fixed = fixed.replace(/^<svg/i, `<svg xmlns:xlink="${XLINK_NS}"`);
  if (fixed !== tag) text = text.slice(0, open.index) + fixed + text.slice(open.index + tag.length);
  return text;
}

/** Turn a browser's XML parser message into one short, readable line. */
export function describeParserError(raw: string): string {
  const chrome = /error on line (\d+) at column (\d+): ([^\n]+)/i.exec(raw);
  if (chrome) return `Line ${chrome[1]}, column ${chrome[2]}: ${chrome[3].trim()}`;
  const firstLine = raw.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  const loc = /Line Number (\d+), Column (\d+)/i.exec(raw);
  const msg = firstLine.replace(/^XML Parsing Error:\s*/i, "").slice(0, 160);
  return loc ? `Line ${loc[1]}, column ${loc[2]}: ${msg}` : msg;
}

/** Insert the final pixel size on the root element of a template made by parseSvg. */
export function sizeTemplate(template: string, width: number, height: number): string {
  return template.replace(/^<svg\b/, `<svg width="${width}" height="${height}"`);
}

/* ----------------------------------------------------------------- warnings */

export interface SvgWarning {
  id: string;
  title: string;
  detail: string;
}

const GENERIC_FAMILIES = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-sans-serif", "ui-serif", "ui-monospace", "inherit", "initial", "unset", "emoji", "math"]);

/** Non-generic font family names used in font-family attributes or CSS, first name of each list, in order. */
export function findFontFamilies(text: string): string[] {
  const found: string[] = [];
  const add = (list: string) => {
    for (const part of list.split(",")) {
      const name = part.trim().replace(/^["']|["']$/g, "").trim();
      if (name && !GENERIC_FAMILIES.has(name.toLowerCase()) && !found.includes(name)) found.push(name);
      break; // only the first family of each list matters for the warning
    }
  };
  for (const m of text.matchAll(/font-family\s*=\s*"([^"]*)"/gi)) add(m[1]);
  for (const m of text.matchAll(/font-family\s*=\s*'([^']*)'/gi)) add(m[1]);
  for (const m of text.matchAll(/font-family\s*:\s*([^;"}>]+)/gi)) add(m[1]);
  return found;
}

/** True when an <image>, <use> or <feImage> tag points at a file or address instead of "#id" or data:. Each tag is cut at its first ">" so cost stays linear. */
function hasLinkedHref(src: string): boolean {
  const tag = /<(?:image|use|feImage)(?=[\s/>])/gi;
  let m: RegExpExecArray | null;
  while ((m = tag.exec(src))) {
    const end = src.indexOf(">", m.index);
    const body = src.slice(m.index, end < 0 ? Math.min(src.length, m.index + 4000) : Math.min(end, m.index + 4000));
    if (/\s(?:xlink:)?href\s*=\s*["']\s*(?!#|data:)[^"'\s]/i.test(body)) return true;
    if (end < 0) break;
    tag.lastIndex = end;
  }
  return false;
}

/**
 * Look for things an SVG drawn through an <img> cannot do, so the user learns
 * before downloading a PNG that looks different from the original.
 */
export function scanSvg(text: string): SvgWarning[] {
  const src = stripComments(text);
  const out: SvgWarning[] = [];

  const external: string[] = [];
  if (/@import\b/i.test(src)) external.push("an @import rule");
  if (/<\?xml-stylesheet\b/i.test(src)) external.push("a linked stylesheet");
  if (/url\(\s*['"]?\s*(?!#|data:)[^)'"\s]/i.test(src)) external.push("url() references to files outside the SVG (fonts or images)");
  if (hasLinkedHref(src)) external.push("linked images or shapes");
  if (external.length) {
    out.push({
      id: "external",
      title: "Links to files outside the SVG",
      detail: `This SVG uses ${external.join(", ")}. A browser does not load outside files for an image, so those parts are missing from the PNG. Inline them first: embed pictures as base64 data: URIs, paste stylesheet rules into a <style> element, and embed fonts as base64 @font-face rules, or convert text to paths in your design tool.`,
    });
  }

  if (/<foreignObject\b/i.test(src)) {
    out.push({
      id: "foreignObject",
      title: "Contains foreignObject (HTML inside the SVG)",
      detail:
        "Support for drawing foreignObject varies by browser, and some browsers refuse to export an image that used it. If the PNG is empty, missing text or cannot be saved, re-export the SVG without HTML text boxes, or convert the text to paths.",
    });
  }

  if (/<script\b/i.test(src) || /\son[a-z]+\s*=\s*["']/i.test(src)) {
    out.push({
      id: "script",
      title: "Contains script",
      detail: "Scripts and event handlers do not run when an SVG is drawn as an image, so anything the script creates or changes is missing from the PNG.",
    });
  }

  if (/<(?:animate|animateTransform|animateMotion|set)\b/i.test(src) || /@keyframes\b/i.test(src)) {
    out.push({
      id: "animation",
      title: "Contains animation",
      detail: "A PNG is a single still image. It captures the SVG at the moment it is first drawn, which is normally its starting state.",
    });
  }

  if (/<(?:text|tspan|textPath)\b/i.test(src)) {
    const embedded = /@font-face/i.test(src) && /url\(\s*['"]?data:/i.test(src);
    const families = findFontFamilies(src);
    if (!embedded && families.length) {
      const list = families.slice(0, 4).join(", ");
      out.push({
        id: "fonts",
        title: `Text uses fonts that are not embedded (${list})`,
        detail: `The text is drawn with fonts installed on this device. If ${families.length === 1 ? "that font is" : "those fonts are"} missing here, the browser substitutes another one and the letters will differ from the original. Convert the text to paths in your design tool, or embed the font in the SVG, for a result that does not depend on the device.`,
      });
    }
  }

  return out;
}

/* -------------------------------------------------------------------- names */

/** Replace characters that are not allowed in file names on common systems. */
export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, "_").replace(/^\.+/, "").trim();
  return cleaned || "image";
}

/** "logo.svg" -> "logo.png", "icons.v2.svgz" -> "icons.v2.png", "svg-code" -> "svg-code.png". */
export function outputFileName(original: string, ext: "png" | "jpg"): string {
  const base = sanitizeFileName(original.split(/[/\\]/).pop() ?? original);
  const stem = base.replace(/\.(svgz?|xml)$/i, "");
  return `${stem || "image"}.${ext}`;
}

/** photo.png, photo-2.png, photo-3.png ... The chosen name is added to `taken` (compared case-insensitively). */
export function uniqueName(name: string, taken: Set<string>): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let candidate = name;
  let n = 2;
  while (taken.has(candidate.toLowerCase())) {
    candidate = `${stem}-${n}${ext}`;
    n++;
  }
  taken.add(candidate.toLowerCase());
  return candidate;
}

/* ------------------------------------------------------------------- batches */

export interface BatchPlan {
  accepted: number[];
  skippedForCount: number;
  skippedForSize: number;
  skippedTooLarge: number;
}

/** Decide which incoming files fit. A file that does not fit is skipped; a later, smaller one may still fit. */
export function planBatch(currentCount: number, currentBytes: number, sizes: number[]): BatchPlan {
  const plan: BatchPlan = { accepted: [], skippedForCount: 0, skippedForSize: 0, skippedTooLarge: 0 };
  let count = currentCount;
  let bytes = currentBytes;
  sizes.forEach((size, i) => {
    if (size > MAX_FILE_BYTES) plan.skippedTooLarge++;
    else if (count >= MAX_FILES) plan.skippedForCount++;
    else if (bytes + size > MAX_BATCH_BYTES) plan.skippedForSize++;
    else {
      plan.accepted.push(i);
      count++;
      bytes += size;
    }
  });
  return plan;
}

export function batchMessage(plan: BatchPlan): string | null {
  const skipped = plan.skippedForCount + plan.skippedForSize + plan.skippedTooLarge;
  if (skipped === 0) return null;
  const files = (n: number) => `${n} file${n === 1 ? "" : "s"}`;
  const mb = (b: number) => b / 1024 / 1024;
  if (plan.skippedTooLarge > 0 && plan.skippedForCount + plan.skippedForSize === 0) {
    return `${files(plan.skippedTooLarge)} ${plan.skippedTooLarge === 1 ? "is" : "are"} larger than ${mb(MAX_FILE_BYTES)} MB, which is far beyond a normal SVG, and ${plan.skippedTooLarge === 1 ? "was" : "were"} skipped.`;
  }
  const added = plan.accepted.length;
  const head = added > 0 ? `Added ${added} of ${added + skipped} files.` : "No files were added.";
  return `${head} One batch holds up to ${MAX_FILES} files or ${mb(MAX_BATCH_BYTES)} MB, so ${files(skipped)} ${skipped === 1 ? "was" : "were"} skipped. Download this batch, click Clear all, then add the rest.`;
}

/** Signed percentage change, e.g. "+173%" or "-15%"; empty when the baseline is zero. */
export function sizeDelta(inBytes: number, outBytes: number): string {
  if (!(inBytes > 0)) return "";
  const pct = Math.round(((outBytes - inBytes) / inBytes) * 100);
  if (pct === 0) return "same size";
  return `${pct > 0 ? "+" : "-"}${Math.abs(pct)}%`;
}
