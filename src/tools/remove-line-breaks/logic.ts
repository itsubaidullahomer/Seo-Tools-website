/** Pure logic for the Remove Line Breaks tool – no React, no DOM, so it can be unit-tested. */

export type Mode = "spaces" | "paragraphs" | "custom" | "none";
export type LineEnding = "lf" | "crlf";

export interface Options {
  mode: Mode;
  /** Separator used in "custom" mode. `\t` is read as a tab. */
  separator: string;
  collapseSpaces: boolean;
  trimLines: boolean;
  removeEmptyLines: boolean;
  keepLists: boolean;
  fixHyphens: boolean;
  lineEnding: LineEnding;
}

export const DEFAULT_OPTIONS: Options = {
  mode: "spaces",
  separator: ", ",
  collapseSpaces: true,
  trimLines: true,
  removeEmptyLines: true,
  keepLists: false,
  fixHyphens: false,
  lineEnding: "lf",
};

/**
 * Every character sequence treated as a line break: Windows CRLF, Unix LF, classic
 * Mac CR, vertical tab (Word's Shift+Enter), form feed (page break), NEL and the
 * Unicode line/paragraph separators.
 */
const BREAK_RE = /\r\n|[\n\r\u000B\u000C\u0085\u2028\u2029]/g;
/** A line that starts with a bullet or list number: "- ", "* ", "• ", "1. ", "2) ", "(3) ", "a) ", "(b) ". */
const LIST_RE = /^\s*(?:[-*+•◦▪‣](?:\s|$)|\d{1,3}[.)](?:\s|$)|\(\d{1,3}\)(?:\s|$)|\(?[A-Za-z]\)(?:\s|$))/;
const SPACE_RUN_RE = /[ \t\u00A0]{2,}/g;
const TRAILING_SPACE_RE = /[ \t\u00A0]+$/;
const LEADING_SPACE_RE = /^[ \t\u00A0]+/;
const HYPHEN_END_RE = /\p{L}-$/u;
const LOWER_START_RE = /^\p{Ll}/u;

export function countLineBreaks(text: string): number {
  let n = 0;
  BREAK_RE.lastIndex = 0;
  while (BREAK_RE.exec(text)) n++;
  return n;
}

export type LineEndingKind = "none" | "LF" | "CRLF" | "CR" | "other" | "mixed";

/**
 * Which line-ending convention the text uses. "other" means only vertical tabs, form
 * feeds, NEL or Unicode separators; any combination of two kinds is "mixed".
 */
export function detectLineEndings(text: string): LineEndingKind {
  const kinds = new Set<string>();
  const re = /\r\n|\n|\r|[\u000B\u000C\u0085\u2028\u2029]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    kinds.add(m[0] === "\r\n" ? "CRLF" : m[0] === "\n" ? "LF" : m[0] === "\r" ? "CR" : "other");
    if (kinds.size > 1) return "mixed";
  }
  if (kinds.size === 0) return "none";
  return [...kinds][0] as LineEndingKind;
}

/** Turn the text typed in the separator box into the real separator (`\t` = tab). */
export function decodeSeparator(raw: string): string {
  return raw.replace(/\\t/g, "\t");
}

/**
 * Characters as a person counts them: Unicode code points, so an emoji counts once
 * (String.length would count most emoji twice). A CRLF pair still counts as two.
 */
export function countChars(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    // Skip the low half of a valid surrogate pair; the high half was already counted.
    if (c >= 0xdc00 && c <= 0xdfff && i > 0) {
      const prev = text.charCodeAt(i - 1);
      if (prev >= 0xd800 && prev <= 0xdbff) continue;
    }
    n++;
  }
  return n;
}

/** Decode a text file, honoring UTF-16 byte-order marks (Windows Notepad's "Unicode"); UTF-8 otherwise. */
export function decodeTextFile(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes);
  return new TextDecoder("utf-8").decode(bytes);
}

export function isListLine(line: string): boolean {
  return LIST_RE.test(line);
}

const isBlank = (line: string) => line.trim() === "";

/** Join already-cleaned lines with `sep`, honoring the list and hyphen options. */
function joinLines(lines: string[], sep: string, o: Options): string {
  const parts: string[] = [];
  const trimJunction = o.collapseSpaces && sep !== "";
  const sepStartsWithSpace = /^\s/.test(sep);
  const sepEndsWithSpace = /\s$/.test(sep);
  for (let line of lines) {
    if (parts.length === 0) {
      parts.push(line);
      continue;
    }
    const last = parts.length - 1;
    if (o.keepLists && isListLine(line)) {
      parts[last] = parts[last].replace(TRAILING_SPACE_RE, "");
      parts.push("\n", line);
      continue;
    }
    if (o.fixHyphens) {
      const prev = parts[last].replace(TRAILING_SPACE_RE, "");
      const next = line.replace(LEADING_SPACE_RE, "");
      if (HYPHEN_END_RE.test(prev) && LOWER_START_RE.test(next)) {
        parts[last] = prev.slice(0, -1) + next;
        continue;
      }
    }
    if (trimJunction) {
      if (sepStartsWithSpace) parts[last] = parts[last].replace(TRAILING_SPACE_RE, "");
      if (sepEndsWithSpace) line = line.replace(LEADING_SPACE_RE, "");
    }
    parts.push(sep, line);
  }
  return parts.join("");
}

/** Remove line breaks from `input` according to `o`. Pure and deterministic. */
export function removeLineBreaks(input: string, o: Options): string {
  if (!input) return "";
  let lines = input.split(BREAK_RE);
  if (o.trimLines) lines = lines.map((l) => l.trim());
  if (o.collapseSpaces) lines = lines.map((l) => l.replace(SPACE_RUN_RE, " "));

  // A trailing newline (or leading blank lines) never produces a separator.
  let start = 0;
  let end = lines.length;
  while (start < end && isBlank(lines[start])) start++;
  while (end > start && isBlank(lines[end - 1])) end--;
  lines = lines.slice(start, end);
  if (!lines.length) return "";

  let out: string;
  if (o.mode === "paragraphs") {
    const paragraphs: string[][] = [];
    let current: string[] = [];
    for (const line of lines) {
      if (isBlank(line)) {
        if (current.length) paragraphs.push(current);
        current = [];
      } else current.push(line);
    }
    if (current.length) paragraphs.push(current);
    out = paragraphs.map((p) => joinLines(p, " ", o)).join("\n\n");
  } else {
    if (o.removeEmptyLines) lines = lines.filter((l) => !isBlank(l));
    const sep = o.mode === "spaces" ? " " : o.mode === "none" ? "" : decodeSeparator(o.separator);
    out = joinLines(lines, sep, o);
  }

  // Blank lines kept in "spaces" mode can leave double spaces behind; tidy them.
  if (o.collapseSpaces && (o.mode === "spaces" || o.mode === "paragraphs")) out = out.replace(SPACE_RUN_RE, " ");
  if (o.lineEnding === "crlf") out = out.replace(/\n/g, "\r\n");
  return out;
}

export interface Summary {
  breaksBefore: number;
  breaksAfter: number;
  removed: number;
  charsBefore: number;
  charsAfter: number;
  linesBefore: number;
  linesAfter: number;
  paragraphs: number;
  endings: LineEndingKind;
}

export function summarize(input: string, output: string): Summary {
  const breaksBefore = countLineBreaks(input);
  const breaksAfter = countLineBreaks(output);
  return {
    breaksBefore,
    breaksAfter,
    removed: Math.max(0, breaksBefore - breaksAfter),
    charsBefore: countChars(input),
    charsAfter: countChars(output),
    linesBefore: input ? breaksBefore + 1 : 0,
    linesAfter: output ? breaksAfter + 1 : 0,
    paragraphs: input.trim() ? input.split(/(?:\r\n|[\n\r\u000B\u000C\u0085\u2028\u2029])[ \t\u00A0]*(?:\r\n|[\n\r\u000B\u000C\u0085\u2028\u2029])/).filter((p) => p.trim()).length : 0,
    endings: detectLineEndings(input),
  };
}
