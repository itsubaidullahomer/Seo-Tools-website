/**
 * Pure comparison logic for Text Compare – no React, no DOM, so it runs in the Web Worker,
 * on the main thread as a fallback, and in unit tests.
 *
 * Differences are computed with jsdiff's Myers implementation (`diffArrays`) on tokens we
 * produce ourselves (lines, Unicode words or grapheme clusters). Options such as "ignore case"
 * only change the comparison keys; every result keeps the original text of both sides.
 */
import { createTwoFilesPatch, diffArrays, FILE_HEADERS_ONLY } from "diff";

export type Granularity = "line" | "word" | "char";

export interface CompareOptions {
  granularity: Granularity;
  /** Treat upper- and lower-case letters as equal. */
  ignoreCase: boolean;
  /** Treat any run of spaces/tabs as one space, ignore leading/trailing spaces and changes that only add or remove whitespace (including blank lines). */
  ignoreWhitespace: boolean;
}

/** A run of text in word/character results or inside a changed line. */
export type Segment =
  | { op: "equal"; left: string; right: string }
  | { op: "removed" | "added"; text: string; ignored?: boolean };

export interface LineCell {
  /** 1-based line number on that side. */
  no: number;
  text: string;
  /** Word-level highlights inside a changed line (equal + removed on the left, equal + added on the right). */
  segments?: Segment[];
}

export interface LineRow {
  /** "ignored": a whitespace-only change hidden by the ignore-whitespace option. */
  type: "equal" | "removed" | "added" | "changed" | "ignored";
  left?: LineCell;
  right?: LineCell;
  /** Index of the change this row belongs to (for next/previous navigation). */
  change?: number;
  /** Equal only because of the ignore options – the original lines are not identical. */
  normalized?: boolean;
}

export interface CompareStats {
  /** Number of separate places where the texts differ. */
  changes: number;
  /** Lines (line mode), words (word mode) or characters (character mode) only in the original. */
  removed: number;
  /** Units only in the changed text. */
  added: number;
  /** Units present in both. */
  unchanged: number;
  /** 2 × unchanged ÷ (2 × unchanged + removed + added), from 0 to 1. Identical or both-empty texts score 1. */
  similarity: number;
}

export type CompareResult =
  | { status: "ok"; granularity: "line"; rows: LineRow[]; stats: CompareStats; notes: string[]; identical: boolean }
  | { status: "ok"; granularity: "word" | "char"; segments: Segment[]; changeStarts: number[]; stats: CompareStats; notes: string[]; identical: boolean }
  | { status: "too-large"; message: string }
  | { status: "timeout"; message: string };

/** Per-side limits that keep the browser responsive. Larger texts get a clear message instead of a frozen tab. */
export const LIMITS = { maxChars: 5_000_000, maxCharTokens: 300_000, maxWordTokens: 1_500_000 };
/** jsdiff gives up and returns undefined after this many milliseconds. */
export const DIFF_TIMEOUT_MS = 20_000;
/** Changed-line pairs longer than this are highlighted as whole lines instead of word by word. */
const MAX_INTRALINE_CHARS = 4000;

const WORD_CHAR = /[\p{L}\p{N}]/u;
const WHITESPACE_ONLY = /^\s+$/u;

// ---------------------------------------------------------------- tokenising

/**
 * Splits text into lines on \r\n, \r or \n. A final line break does not start an extra empty
 * line, so "a\nb\n" and "a\nb" both have two lines (the difference is reported as a note).
 */
export function splitLines(text: string): string[] {
  if (text === "") return [];
  const lines = text.split(/\r\n|\r|\n/);
  if (/(\r\n|\r|\n)$/.test(text)) lines.pop();
  return lines;
}

const graphemeSegmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
const wordSegmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "word" }) : null;

/** User-perceived characters: "é" written as e + accent, "👍🏽" and "🇵🇰" each count as one. */
export function splitChars(text: string): string[] {
  if (graphemeSegmenter) return Array.from(graphemeSegmenter.segment(text), (s) => s.segment);
  return Array.from(text);
}

/**
 * Words, whitespace runs and punctuation as separate tokens, using the browser's Unicode word
 * rules (so Chinese, Japanese and Thai are split into words too).
 */
export function splitWords(text: string): string[] {
  if (wordSegmenter) return Array.from(wordSegmenter.segment(text), (s) => s.segment);
  return text.match(/[\p{L}\p{N}\p{M}_]+|\s+|[^\s]/gu) ?? [];
}

function tokenKey(token: string, o: CompareOptions): string {
  let k = token;
  if (o.ignoreWhitespace && WHITESPACE_ONLY.test(k)) return " ";
  if (o.ignoreCase) k = k.toLowerCase();
  return k;
}

function lineKey(line: string, o: CompareOptions): string {
  let k = line;
  if (o.ignoreWhitespace) k = k.replace(/\s+/gu, " ").trim();
  if (o.ignoreCase) k = k.toLowerCase();
  return k;
}

// ---------------------------------------------------------------- notes

function lineEnding(text: string): "CRLF" | "LF" | "CR" | null {
  const m = text.match(/\r\n|\r|\n/);
  if (!m) return null;
  return m[0] === "\r\n" ? "CRLF" : m[0] === "\r" ? "CR" : "LF";
}

function collectNotes(left: string, right: string, granularity: Granularity): string[] {
  const notes: string[] = [];
  const le = lineEnding(left);
  const re = lineEnding(right);
  if (le && re && le !== re) {
    notes.push(
      `Line endings differ: the original uses ${le === "CRLF" ? "Windows (CRLF)" : le === "LF" ? "Unix (LF)" : "old Mac (CR)"} and the changed text uses ${re === "CRLF" ? "Windows (CRLF)" : re === "LF" ? "Unix (LF)" : "old Mac (CR)"} line breaks. Lines are compared without their line-break characters; the downloaded patch keeps them.`,
    );
  }
  if (granularity === "line" && left && right) {
    const lEnd = /(\r\n|\r|\n)$/.test(left);
    const rEnd = /(\r\n|\r|\n)$/.test(right);
    if (lEnd !== rEnd) notes.push(`Only the ${lEnd ? "original" : "changed"} text ends with a line break. Line comparison ignores this; the downloaded patch includes it.`);
  }
  return notes;
}

// ---------------------------------------------------------------- shared helpers

function similarity(unchanged: number, removed: number, added: number): number {
  const total = 2 * unchanged + removed + added;
  return total === 0 ? 1 : (2 * unchanged) / total;
}

/** Merges neighbouring segments with the same operation (and ignored flag). */
function pushSegment(out: Segment[], seg: Segment) {
  const last = out[out.length - 1];
  if (last && last.op === seg.op) {
    if (last.op === "equal" && seg.op === "equal") {
      last.left += seg.left;
      last.right += seg.right;
      return;
    }
    if (last.op !== "equal" && seg.op !== "equal" && Boolean(last.ignored) === Boolean(seg.ignored)) {
      last.text += seg.text;
      return;
    }
  }
  out.push(seg.op === "equal" ? { ...seg } : { ...seg });
}

/** Word-level highlights for one changed line pair. */
function intraline(a: string, b: string, o: CompareOptions): { left: Segment[]; right: Segment[] } | null {
  if (a.length + b.length > MAX_INTRALINE_CHARS) return null;
  const ta = splitWords(a);
  const tb = splitWords(b);
  const changes = diffArrays(
    ta.map((t) => tokenKey(t, o)),
    tb.map((t) => tokenKey(t, o)),
  );
  const left: Segment[] = [];
  const right: Segment[] = [];
  let i = 0;
  let j = 0;
  for (const c of changes) {
    const n = c.count ?? c.value.length;
    if (c.removed) {
      const text = ta.slice(i, i + n).join("");
      pushSegment(left, { op: "removed", text, ignored: o.ignoreWhitespace && WHITESPACE_ONLY.test(text) });
      i += n;
    } else if (c.added) {
      const text = tb.slice(j, j + n).join("");
      pushSegment(right, { op: "added", text, ignored: o.ignoreWhitespace && WHITESPACE_ONLY.test(text) });
      j += n;
    } else {
      const l = ta.slice(i, i + n).join("");
      const r = tb.slice(j, j + n).join("");
      pushSegment(left, { op: "equal", left: l, right: r });
      pushSegment(right, { op: "equal", left: l, right: r });
      i += n;
      j += n;
    }
  }
  return { left, right };
}

// ---------------------------------------------------------------- line mode

function compareLines(left: string, right: string, o: CompareOptions): CompareResult {
  const a = splitLines(left);
  const b = splitLines(right);
  const ka = a.map((l) => lineKey(l, o));
  const kb = b.map((l) => lineKey(l, o));
  const changes = diffArrays(ka, kb, { timeout: DIFF_TIMEOUT_MS });
  if (!changes) return timeoutResult("line");

  const rows: LineRow[] = [];
  let removed = 0;
  let added = 0;
  let unchanged = 0;
  let changeCount = 0;
  let i = 0;
  let j = 0;

  let blockRemoved: number[] = [];
  let blockAdded: number[] = [];
  const flushBlock = () => {
    if (!blockRemoved.length && !blockAdded.length) return;
    // Whitespace-only blocks (blank lines added or removed) are hidden by the ignore-whitespace option.
    const onlyBlank = o.ignoreWhitespace && blockRemoved.every((x) => ka[x] === "") && blockAdded.every((y) => kb[y] === "");
    if (onlyBlank) {
      for (const x of blockRemoved) rows.push({ type: "ignored", left: { no: x + 1, text: a[x] } });
      for (const y of blockAdded) rows.push({ type: "ignored", right: { no: y + 1, text: b[y] } });
    } else {
      const change = changeCount++;
      removed += blockRemoved.length;
      added += blockAdded.length;
      const pairs = Math.min(blockRemoved.length, blockAdded.length);
      for (let k = 0; k < Math.max(blockRemoved.length, blockAdded.length); k++) {
        const x = blockRemoved[k];
        const y = blockAdded[k];
        if (k < pairs) {
          const hl = intraline(a[x], b[y], o);
          rows.push({
            type: "changed",
            change,
            left: { no: x + 1, text: a[x], ...(hl ? { segments: hl.left } : {}) },
            right: { no: y + 1, text: b[y], ...(hl ? { segments: hl.right } : {}) },
          });
        } else if (x !== undefined) {
          rows.push({ type: "removed", change, left: { no: x + 1, text: a[x] } });
        } else {
          rows.push({ type: "added", change, right: { no: y + 1, text: b[y] } });
        }
      }
    }
    blockRemoved = [];
    blockAdded = [];
  };

  for (const c of changes) {
    const n = c.count ?? c.value.length;
    if (c.removed) {
      for (let k = 0; k < n; k++) blockRemoved.push(i + k);
      i += n;
    } else if (c.added) {
      for (let k = 0; k < n; k++) blockAdded.push(j + k);
      j += n;
    } else {
      flushBlock();
      for (let k = 0; k < n; k++) {
        const row: LineRow = { type: "equal", left: { no: i + 1, text: a[i] }, right: { no: j + 1, text: b[j] } };
        if (a[i] !== b[j]) row.normalized = true;
        rows.push(row);
        unchanged++;
        i++;
        j++;
      }
    }
  }
  flushBlock();

  return {
    status: "ok",
    granularity: "line",
    rows,
    stats: { changes: changeCount, removed, added, unchanged, similarity: similarity(unchanged, removed, added) },
    notes: collectNotes(left, right, "line"),
    identical: left === right,
  };
}

// ---------------------------------------------------------------- word / character mode

function compareTokens(left: string, right: string, o: CompareOptions & { granularity: "word" | "char" }): CompareResult {
  const split = o.granularity === "word" ? splitWords : splitChars;
  const ta = split(left);
  const tb = split(right);
  const limit = o.granularity === "word" ? LIMITS.maxWordTokens : LIMITS.maxCharTokens;
  if (ta.length > limit || tb.length > limit) {
    return {
      status: "too-large",
      message: `Each text can have up to ${limit.toLocaleString("en-US")} ${o.granularity === "word" ? "words and symbols" : "characters"} in ${o.granularity === "word" ? "word" : "character"} mode. Compare by lines instead, or compare a smaller section.`,
    };
  }
  const changes = diffArrays(
    ta.map((t) => tokenKey(t, o)),
    tb.map((t) => tokenKey(t, o)),
    { timeout: DIFF_TIMEOUT_MS },
  );
  if (!changes) return timeoutResult(o.granularity);

  // Word mode counts words (tokens with a letter or digit); character mode counts every character.
  const counts = (t: string) => (o.granularity === "word" ? WORD_CHAR.test(t) : true);
  // Similarity ignores whitespace in word mode so spacing alone doesn't dilute the score.
  const unitForSimilarity = (t: string) => (o.granularity === "word" ? !WHITESPACE_ONLY.test(t) : true);

  const segments: Segment[] = [];
  let removed = 0;
  let added = 0;
  let unchanged = 0;
  let simRemoved = 0;
  let simAdded = 0;
  let simUnchanged = 0;
  let i = 0;
  let j = 0;
  for (const c of changes) {
    const n = c.count ?? c.value.length;
    if (c.removed || c.added) {
      const tokens = c.removed ? ta.slice(i, i + n) : tb.slice(j, j + n);
      const text = tokens.join("");
      const ignored = o.ignoreWhitespace && WHITESPACE_ONLY.test(text);
      if (!ignored) {
        for (const t of tokens) {
          if (counts(t)) {
            if (c.removed) removed++;
            else added++;
          }
          if (unitForSimilarity(t)) {
            if (c.removed) simRemoved++;
            else simAdded++;
          }
        }
      }
      pushSegment(segments, c.removed ? { op: "removed", text, ignored } : { op: "added", text, ignored });
      if (c.removed) i += n;
      else j += n;
    } else {
      const l = ta.slice(i, i + n);
      for (const t of l) {
        if (counts(t)) unchanged++;
        if (unitForSimilarity(t)) simUnchanged++;
      }
      pushSegment(segments, { op: "equal", left: l.join(""), right: tb.slice(j, j + n).join("") });
      i += n;
      j += n;
    }
  }

  // A change is a run of removed/added segments not interrupted by unchanged text.
  const changeStarts: number[] = [];
  let inChange = false;
  segments.forEach((s, idx) => {
    const isChange = s.op !== "equal" && !s.ignored;
    if (isChange && !inChange) changeStarts.push(idx);
    if (s.op === "equal" || isChange) inChange = isChange;
  });

  return {
    status: "ok",
    granularity: o.granularity,
    segments,
    changeStarts,
    stats: { changes: changeStarts.length, removed, added, unchanged, similarity: similarity(simUnchanged, simRemoved, simAdded) },
    notes: collectNotes(left, right, o.granularity),
    identical: left === right,
  };
}

function timeoutResult(g: Granularity): CompareResult {
  return {
    status: "timeout",
    message:
      g === "line"
        ? "These texts are too different to compare within 20 seconds. Try comparing smaller sections."
        : `These texts are too different to compare ${g === "word" ? "word by word" : "character by character"} within 20 seconds. Compare by lines instead, or compare smaller sections.`,
  };
}

// ---------------------------------------------------------------- public API

export function compareTexts(left: string, right: string, options: CompareOptions): CompareResult {
  if (left.length > LIMITS.maxChars || right.length > LIMITS.maxChars) {
    return { status: "too-large", message: `Each text can be up to ${LIMITS.maxChars.toLocaleString("en-US")} characters.` };
  }
  if (options.granularity === "line") return compareLines(left, right, options);
  return compareTokens(left, right, { ...options, granularity: options.granularity });
}

/**
 * A standard unified diff (the format `git apply` and `patch -p1` read) of the raw texts.
 * It always contains every difference, including ones hidden by the ignore options.
 * Returns "" when the texts are identical.
 */
export function makePatch(left: string, right: string, leftName = "original.txt", rightName = "changed.txt"): string {
  if (left === right) return "";
  const patch = createTwoFilesPatch(`a/${leftName}`, `b/${rightName}`, left, right, undefined, undefined, {
    context: 3,
    headerOptions: FILE_HEADERS_ONLY,
  });
  return patch ?? "";
}

/** True when the start of a file looks binary (contains a NUL byte), so it shouldn't be compared as text. */
export function looksBinary(sample: string): boolean {
  return sample.slice(0, 8000).includes("\u0000");
}

/** Plain-text summary used for screen readers and the copy button. */
export function describeStats(s: CompareStats, g: Granularity): string {
  const unit = g === "line" ? "line" : g === "word" ? "word" : "character";
  const plural = (n: number, w: string) => `${n.toLocaleString("en-US")} ${w}${n === 1 ? "" : "s"}`;
  if (s.changes === 0) return "No differences found.";
  return `${plural(s.changes, "change")}: ${plural(s.removed, unit)} removed, ${plural(s.added, unit)} added. Similarity ${Math.round(s.similarity * 100)}%.`;
}
