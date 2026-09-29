/**
 * Pure logic for the duplicate line remover. No React, no DOM, no imports from the
 * rest of the site, so it can be exercised directly from a script or a test.
 */

export type Mode = "dedupe" | "duplicates" | "unique";
export type Keep = "first" | "last";
/** remove = drop empty lines, dedupe = treat "" like any other line, keep = leave every empty line where it is. */
export type BlankHandling = "remove" | "dedupe" | "keep";
export type LineEnding = "auto" | "lf" | "crlf";

export interface Options {
  mode: Mode;
  keep: Keep;
  caseSensitive: boolean;
  /** Ignore spaces and tabs at the start and end of a line when comparing. */
  trim: boolean;
  /** When `trim` is on, also strip them from the lines that are kept. */
  trimOutput: boolean;
  /** Treat any run of whitespace inside a line as a single space when comparing. */
  collapseSpaces: boolean;
  /** Compare "café" and "cafe" as equal (Latin, Greek and Cyrillic accents). */
  ignoreAccents: boolean;
  /** Ignore zero-width spaces, soft hyphens, BOMs and bidi marks when comparing. */
  ignoreInvisible: boolean;
  /** Only lines that touch each other count as duplicates (like `uniq`). */
  adjacentOnly: boolean;
  blank: BlankHandling;
  lineEnding: LineEnding;
}

export const DEFAULT_OPTIONS: Options = {
  mode: "dedupe",
  keep: "first",
  caseSensitive: true,
  trim: true,
  trimOutput: true,
  collapseSpaces: false,
  ignoreAccents: false,
  ignoreInvisible: true,
  adjacentOnly: false,
  blank: "remove",
  lineEnding: "auto",
};

export const MODES: Mode[] = ["dedupe", "duplicates", "unique"];
const KEEPS: Keep[] = ["first", "last"];
const BLANKS: BlankHandling[] = ["remove", "dedupe", "keep"];
const ENDINGS: LineEnding[] = ["auto", "lf", "crlf"];

/** Repair options read from storage: unknown keys are dropped, wrong types fall back to the defaults. */
export function normalizeOptions(raw: unknown): Options {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const bool = (k: keyof Options): boolean => (typeof src[k] === "boolean" ? (src[k] as boolean) : (DEFAULT_OPTIONS[k] as boolean));
  const pick = <T extends string>(k: keyof Options, allowed: readonly T[]): T =>
    allowed.includes(src[k] as T) ? (src[k] as T) : (DEFAULT_OPTIONS[k] as T);
  return {
    mode: pick("mode", MODES),
    keep: pick("keep", KEEPS),
    caseSensitive: bool("caseSensitive"),
    trim: bool("trim"),
    trimOutput: bool("trimOutput"),
    collapseSpaces: bool("collapseSpaces"),
    ignoreAccents: bool("ignoreAccents"),
    ignoreInvisible: bool("ignoreInvisible"),
    adjacentOnly: bool("adjacentOnly"),
    blank: pick("blank", BLANKS),
    lineEnding: pick("lineEnding", ENDINGS),
  };
}

/**
 * Every sequence treated as a line break: CRLF, LF, CR, vertical tab (Word's Shift+Enter),
 * form feed, NEL and the Unicode line and paragraph separators.
 */
const LINE_BREAK_RE = /\r\n|[\n\r\u000B\u000C\u0085\u2028\u2029]/;

/**
 * Characters that are invisible on screen and often ride along when text is copied from
 * a web page, PDF or spreadsheet: soft hyphen, Arabic letter mark, zero-width space, LRM and
 * RLM, bidi embedding controls, word joiner, bidi isolates and the byte order mark.
 * Zero-width joiner and non-joiner are kept because they change how some scripts and emoji render.
 */
const INVISIBLE_RE = /[\u00AD\u061C\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g;
const WHITESPACE_RUN_RE = /\s+/g;
const COMBINING_MARKS_RE = /[\u0300-\u036F]/g;

/** Split text into lines. One trailing line break ends the last line; it does not start another. */
export function splitLines(text: string): string[] {
  if (text === "") return [];
  const lines = text.split(LINE_BREAK_RE);
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/** A line with nothing visible on it (whitespace only, or invisible characters when those are ignored). */
export function isBlankLine(text: string, ignoreInvisible: boolean): boolean {
  return (ignoreInvisible ? text.replace(INVISIBLE_RE, "") : text).trim() === "";
}

type CompareOptions = Pick<Options, "caseSensitive" | "trim" | "collapseSpaces" | "ignoreAccents" | "ignoreInvisible">;

/**
 * The string two lines are compared by. Two lines are duplicates when their keys are equal.
 * Unicode is always normalized to NFC so that a precomposed "é" and "e" + combining accent,
 * which look identical, are recognized as the same text.
 */
export function makeKey(text: string, o: CompareOptions): string {
  let s = text;
  if (o.ignoreInvisible) s = s.replace(INVISIBLE_RE, "");
  if (o.trim) s = s.trim();
  if (o.collapseSpaces) s = s.replace(WHITESPACE_RUN_RE, " ");
  s = o.ignoreAccents ? s.normalize("NFD").replace(COMBINING_MARKS_RE, "") : s.normalize("NFC");
  if (!o.caseSensitive) s = s.toLowerCase();
  return s;
}

/** CRLF when the input uses it, LF otherwise. */
export function detectLineEnding(text: string): "\n" | "\r\n" {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

/** How many line numbers are remembered per repeated line. */
export const MAX_LINE_NUMBERS = 25;

export interface RepeatedLine {
  /** The line as it appears in the result (trimmed if the result is trimmed). */
  text: string;
  /** How many times the line was found in the input. */
  count: number;
  /** 1-based input line numbers of the first occurrences (at most MAX_LINE_NUMBERS). */
  lineNumbers: number[];
}

export interface DedupeResult {
  lines: string[];
  output: string;
  linesIn: number;
  linesOut: number;
  /** linesIn - linesOut. */
  removed: number;
  /** Empty lines dropped because of the empty-line setting. */
  emptyRemoved: number;
  /** Lines dropped by the mode itself (duplicate copies, or the lines filtered out in the other modes). */
  filtered: number;
  /** Distinct lines that were found more than once. */
  repeatedLines: number;
  /** Distinct lines overall. */
  distinctLines: number;
  /** Every line found more than once, most frequent first. */
  report: RepeatedLine[];
}

/** Remove, list or isolate duplicate lines according to `o`. Pure and deterministic. */
export function dedupeLines(input: string, o: Options): DedupeResult {
  const lines = splitLines(input);
  const n = lines.length;
  const eol = o.lineEnding === "crlf" ? "\r\n" : o.lineEnding === "lf" ? "\n" : detectLineEnding(input);

  // "Leave empty lines alone" only makes sense when the result is the whole list.
  const blank: BlankHandling = o.mode === "dedupe" ? o.blank : o.blank === "dedupe" ? "dedupe" : "remove";
  const display = (t: string) => (o.trim && o.trimOutput ? t.trim() : t);

  const REMOVED_BLANK = -1;
  const KEPT_BLANK = -2;
  const groupOfRow = new Int32Array(n);
  const counts: number[] = [];
  const firstRow: number[] = [];
  const lastRow: number[] = [];
  const index = new Map<string, number>();
  let prevKey: string | null = null;
  let prevGroup = -1;
  let emptyRemoved = 0;

  for (let i = 0; i < n; i++) {
    const text = lines[i];
    if (blank !== "dedupe" && isBlankLine(text, o.ignoreInvisible)) {
      if (blank === "keep") {
        groupOfRow[i] = KEPT_BLANK;
        prevKey = null; // an empty line left in place separates the lines around it
      } else {
        groupOfRow[i] = REMOVED_BLANK; // removed lines are invisible to the neighbor check
        emptyRemoved++;
      }
      continue;
    }

    const key = makeKey(text, o);
    let g = -1;
    if (o.adjacentOnly) {
      if (prevKey !== null && key === prevKey) g = prevGroup;
      prevKey = key;
    } else {
      const found = index.get(key);
      if (found !== undefined) g = found;
    }
    if (g === -1) {
      g = counts.length;
      counts.push(0);
      firstRow.push(i);
      lastRow.push(i);
      if (!o.adjacentOnly) index.set(key, g);
    } else {
      lastRow[g] = i;
    }
    prevGroup = g;
    counts[g]++;
    groupOfRow[i] = g;
  }

  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const g = groupOfRow[i];
    if (g === REMOVED_BLANK) continue;
    if (g === KEPT_BLANK) {
      out.push(display(lines[i]));
      continue;
    }
    if (i !== (o.keep === "first" ? firstRow[g] : lastRow[g])) continue;
    const c = counts[g];
    if (o.mode === "dedupe" || (o.mode === "duplicates" && c > 1) || (o.mode === "unique" && c === 1)) out.push(display(lines[i]));
  }

  // Report: every line found more than once.
  const report: RepeatedLine[] = [];
  let repeatedLines = 0;
  for (const c of counts) if (c > 1) repeatedLines++;
  if (repeatedLines > 0) {
    const reportIndex = new Int32Array(counts.length).fill(-1);
    for (let g = 0; g < counts.length; g++) {
      if (counts[g] < 2) continue;
      reportIndex[g] = report.length;
      report.push({ text: display(lines[o.keep === "first" ? firstRow[g] : lastRow[g]]), count: counts[g], lineNumbers: [] });
    }
    for (let i = 0; i < n; i++) {
      const g = groupOfRow[i];
      if (g < 0) continue;
      const r = reportIndex[g];
      if (r >= 0 && report[r].lineNumbers.length < MAX_LINE_NUMBERS) report[r].lineNumbers.push(i + 1);
    }
    // Array.prototype.sort is stable, so equal counts stay in order of first appearance.
    report.sort((a, b) => b.count - a.count);
  }

  const removed = n - out.length;
  return {
    lines: out,
    output: out.join(eol),
    linesIn: n,
    linesOut: out.length,
    removed,
    emptyRemoved,
    filtered: removed - emptyRemoved,
    repeatedLines,
    distinctLines: counts.length,
    report,
  };
}

/** Copies removed for one report row in the given mode. */
export function copiesRemoved(entry: RepeatedLine, mode: Mode): number {
  if (mode === "dedupe") return entry.count - 1;
  if (mode === "unique") return entry.count;
  return 0;
}

/** Tab-separated report that pastes straight into a spreadsheet. */
export function reportToTsv(report: RepeatedLine[], mode: Mode): string {
  const showRemoved = mode !== "duplicates";
  const header = ["Times found", ...(showRemoved ? ["Copies removed"] : []), "Line", "Found on lines"].join("\t");
  const rows = report.map((r) =>
    [String(r.count), ...(showRemoved ? [String(copiesRemoved(r, mode))] : []), r.text.replace(/\t/g, " "), lineNumberText(r)].join("\t"),
  );
  return [header, ...rows].join("\n");
}

/** RFC 4180 CSV of the report (all fields quoted where needed). */
export function reportToCsv(report: RepeatedLine[], mode: Mode): string {
  const showRemoved = mode !== "duplicates";
  const q = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const header = ["Times found", ...(showRemoved ? ["Copies removed"] : []), "Line", "Found on lines"].join(",");
  const rows = report.map((r) => [String(r.count), ...(showRemoved ? [String(copiesRemoved(r, mode))] : []), q(r.text), q(lineNumberText(r))].join(","));
  return [header, ...rows].join("\r\n") + "\r\n";
}

/** "3, 8, 14" — with an ellipsis when more occurrences exist than are remembered. */
export function lineNumberText(entry: RepeatedLine, limit = MAX_LINE_NUMBERS): string {
  const shown = entry.lineNumbers.slice(0, limit);
  const more = entry.count > shown.length;
  return shown.join(", ") + (more ? ", …" : "");
}

/** Decode a text file, honoring UTF-16 byte order marks (Windows Notepad's "Unicode"); UTF-8 otherwise. */
export function decodeTextFile(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes);
  return new TextDecoder("utf-8").decode(bytes);
}
