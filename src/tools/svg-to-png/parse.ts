/**
 * Turn SVG text into a "template": cleaned markup whose root element has no
 * width or height, plus a viewBox, so the renderer can stamp any output size on
 * it. The markup is parsed with DOMParser into a detached document that is never
 * attached to the page, then serialized back to a string. The string is only ever
 * drawn through an <img> element (see render.ts), which blocks scripts and outside
 * resources, so pasted or uploaded markup is never inserted into the page.
 *
 * Only call parseSvg / readSvgText from event handlers or effects (DOMParser and
 * DecompressionStream are browser APIs).
 */
import {
  MAX_CODE_CHARS,
  SVG_NS,
  UserFacingError,
  decodeDataUri,
  describeParserError,
  measureSvg,
  prepareSource,
  scanSvg,
  stripSizeFromStyle,
  type SizeSource,
  type SvgWarning,
} from "./svg";

export interface ParsedSvg {
  /** Serialized root element without width/height. Starts with "<svg". */
  template: string;
  /** Natural size in CSS pixels, as a browser would draw the SVG in an <img>. */
  size: { width: number; height: number };
  source: SizeSource;
  /** A viewBox was missing and was added so the drawing scales with the output size. */
  viewBoxAdded: boolean;
  warnings: SvgWarning[];
}

const round = (n: number) => Math.round(n * 1000) / 1000;

export function parseSvg(input: string): ParsedSvg {
  if (input.length > MAX_CODE_CHARS * 4) throw new UserFacingError("This SVG is far larger than a normal SVG and was not processed.");
  const source = decodeDataUri(input) ?? input;
  if (!/<svg[\s>/]/i.test(source)) {
    throw new UserFacingError("No <svg> element found. Paste or upload SVG markup that starts with <svg ...>.");
  }
  const text = prepareSource(source);
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");

  const problem = doc.getElementsByTagName("parsererror")[0];
  if (problem) {
    const detail = describeParserError(problem.textContent ?? "");
    throw new UserFacingError(`The SVG is not valid XML${detail ? ` (${detail})` : ""}. Fix the markup and try again.`);
  }
  const root = doc.documentElement;
  if (!root || root.localName !== "svg") {
    throw new UserFacingError(`The top-level element is <${root?.localName ?? "unknown"}>, not <svg>.`);
  }
  if (root.namespaceURI !== SVG_NS) {
    throw new UserFacingError('The <svg> element is in a namespace other than "http://www.w3.org/2000/svg", so browsers will not draw it as SVG.');
  }
  if (root.prefix) {
    throw new UserFacingError(`The root element is written as <${root.prefix}:svg>. Remove the "${root.prefix}:" prefix, or re-export the SVG from your design tool.`);
  }

  const size = measureSvg({ width: root.getAttribute("width"), height: root.getAttribute("height"), viewBox: root.getAttribute("viewBox") });
  root.removeAttribute("width");
  root.removeAttribute("height");
  const viewBoxAdded = !size.viewBox;
  if (viewBoxAdded) root.setAttribute("viewBox", `0 0 ${round(size.width)} ${round(size.height)}`);
  const style = root.getAttribute("style");
  if (style) {
    const stripped = stripSizeFromStyle(style);
    if (stripped) root.setAttribute("style", stripped);
    else root.removeAttribute("style");
  }

  const template = new XMLSerializer().serializeToString(root);
  return {
    template,
    size: { width: size.width, height: size.height },
    source: size.source,
    viewBoxAdded,
    warnings: scanSvg(text),
  };
}

/** Read an uploaded file as text, unzipping .svgz (gzip) files when the browser can. */
export async function readSvgText(file: Blob): Promise<string> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  if (head[0] === 0x1f && head[1] === 0x8b) {
    if (typeof DecompressionStream === "undefined") {
      throw new UserFacingError("This is a compressed .svgz file and your browser cannot unzip it here. Unzip it first (it is a gzip file) or use a newer browser.");
    }
    try {
      const stream = file.stream().pipeThrough(new DecompressionStream("gzip"));
      return await new Response(stream).text();
    } catch {
      throw new UserFacingError("This .svgz file could not be unzipped. It may be damaged.");
    }
  }
  return file.text();
}
