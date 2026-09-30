/**
 * Pure logic for the Discord colored text generator. No DOM, no React.
 *
 * Model: the text is a plain string and the formatting is a list of spans
 * { start, end, fg, bg, bold, underline } over UTF-16 indexes (the same indexes a
 * textarea reports through selectionStart / selectionEnd). Internally every
 * operation turns the spans into one packed number per character, changes that
 * array, and turns it back into normalized spans, which keeps the edge cases
 * (overlaps, splits, merges) simple and testable.
 */

export const ESC = "\u001b";
export const ZWSP = "​";
export const FENCE_OPEN = "```ansi\n";
export const FENCE_CLOSE = "\n```";
/** Characters the code-block fence adds around the body. */
export const FENCE_OVERHEAD = FENCE_OPEN.length + FENCE_CLOSE.length;
/** Hard cap for the editor so a huge paste cannot freeze the page. */
export const MAX_TEXT_LENGTH = 20000;
export const LIMIT_STANDARD = 2000;
export const LIMIT_EXTENDED = 4000;

export interface Span {
  start: number;
  end: number;
  /** ANSI foreground code 30-37. */
  fg?: number;
  /** ANSI background code 40-47. */
  bg?: number;
  bold?: boolean;
  underline?: boolean;
}

export interface Doc {
  text: string;
  spans: Span[];
}

export const EMPTY_DOC: Doc = { text: "", spans: [] };

/** Change to apply to a range. `null` clears a color; omitted keys are left alone. */
export interface StylePatch {
  fg?: number | null;
  bg?: number | null;
  bold?: boolean;
  underline?: boolean;
}

type StyleFields = Omit<Span, "start" | "end">;

const isFg = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 30 && n <= 37;
const isBg = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 40 && n <= 47;

const BOLD_BIT = 4096;
const UNDERLINE_BIT = 8192;

/** Pack a style into one integer (0 = unstyled). fg < 64, bg < 64, then two flag bits. */
export function packStyle(s: StyleFields): number {
  return (isFg(s.fg) ? s.fg : 0) + (isBg(s.bg) ? s.bg : 0) * 64 + (s.bold ? BOLD_BIT : 0) + (s.underline ? UNDERLINE_BIT : 0);
}

export function unpackStyle(n: number): StyleFields {
  const out: StyleFields = {};
  const fg = n % 64;
  const bg = Math.floor(n / 64) % 64;
  if (fg) out.fg = fg;
  if (bg) out.bg = bg;
  if (n & BOLD_BIT) out.bold = true;
  if (n & UNDERLINE_BIT) out.underline = true;
  return out;
}

export function stylesFromSpans(spans: readonly Span[], length: number): Uint16Array {
  const arr = new Uint16Array(length);
  for (const sp of spans) {
    if (!sp || typeof sp.start !== "number" || typeof sp.end !== "number") continue;
    const s = Math.max(0, Math.floor(sp.start));
    const e = Math.min(length, Math.floor(sp.end));
    if (!(s < e)) continue;
    const v = packStyle(sp);
    for (let i = s; i < e; i++) arr[i] = v;
  }
  return arr;
}

export function spansFromStyles(arr: ArrayLike<number>): Span[] {
  const spans: Span[] = [];
  let i = 0;
  while (i < arr.length) {
    const v = arr[i];
    if (!v) {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < arr.length && arr[j] === v) j++;
    spans.push({ start: i, end: j, ...unpackStyle(v) });
    i = j;
  }
  return spans;
}

const isHigh = (c: number) => c >= 0xd800 && c <= 0xdbff;
const isLow = (c: number) => c >= 0xdc00 && c <= 0xdfff;

/** Clamp a selection to the text and keep surrogate pairs (emoji) whole. */
export function snapRange(text: string, start: number, end: number): [number, number] {
  let s = Math.max(0, Math.min(text.length, Math.min(start, end)));
  let e = Math.max(0, Math.min(text.length, Math.max(start, end)));
  if (s > 0 && s < text.length && isLow(text.charCodeAt(s)) && isHigh(text.charCodeAt(s - 1))) s--;
  if (e > 0 && e < text.length && isLow(text.charCodeAt(e)) && isHigh(text.charCodeAt(e - 1))) e++;
  return [s, e];
}

/** Apply a style patch to [start, end). Returns new normalized spans. */
export function applyPatch(spans: readonly Span[], length: number, start: number, end: number, patch: StylePatch): Span[] {
  const arr = stylesFromSpans(spans, length);
  const s = Math.max(0, Math.min(length, start));
  const e = Math.max(0, Math.min(length, end));
  for (let i = s; i < e; i++) {
    const u = unpackStyle(arr[i]);
    if (patch.fg !== undefined) {
      if (patch.fg === null) delete u.fg;
      else if (isFg(patch.fg)) u.fg = patch.fg;
    }
    if (patch.bg !== undefined) {
      if (patch.bg === null) delete u.bg;
      else if (isBg(patch.bg)) u.bg = patch.bg;
    }
    if (patch.bold !== undefined) {
      if (patch.bold) u.bold = true;
      else delete u.bold;
    }
    if (patch.underline !== undefined) {
      if (patch.underline) u.underline = true;
      else delete u.underline;
    }
    arr[i] = packStyle(u);
  }
  return spansFromStyles(arr);
}

/** Remove every style from [start, end). */
export function clearRange(spans: readonly Span[], length: number, start: number, end: number): Span[] {
  const arr = stylesFromSpans(spans, length);
  const s = Math.max(0, Math.min(length, start));
  const e = Math.max(0, Math.min(length, end));
  for (let i = s; i < e; i++) arr[i] = 0;
  return spansFromStyles(arr);
}

export type Tri = "all" | "some" | "none";

export interface SelectionInfo {
  /** 0 = no color, -1 = mixed, otherwise the ANSI code. */
  fg: number;
  bg: number;
  bold: Tri;
  underline: Tri;
}

/** Summarize the formatting inside a selection so the toolbar can show what is active. */
export function selectionInfo(spans: readonly Span[], length: number, start: number, end: number): SelectionInfo | null {
  const s = Math.max(0, Math.min(length, start));
  const e = Math.max(0, Math.min(length, end));
  if (s >= e) return null;
  const arr = stylesFromSpans(spans, length);
  let fg: number | undefined;
  let bg: number | undefined;
  let bold = 0;
  let underline = 0;
  let mixedFg = false;
  let mixedBg = false;
  for (let i = s; i < e; i++) {
    const v = arr[i];
    const f = v % 64;
    const b = Math.floor(v / 64) % 64;
    if (fg === undefined) fg = f;
    else if (fg !== f) mixedFg = true;
    if (bg === undefined) bg = b;
    else if (bg !== b) mixedBg = true;
    if (v & BOLD_BIT) bold++;
    if (v & UNDERLINE_BIT) underline++;
  }
  const n = e - s;
  const tri = (c: number): Tri => (c === 0 ? "none" : c === n ? "all" : "some");
  return { fg: mixedFg ? -1 : (fg ?? 0), bg: mixedBg ? -1 : (bg ?? 0), bold: tri(bold), underline: tri(underline) };
}

/**
 * Find the single edit between two strings (common prefix and suffix). Edits never
 * split a surrogate pair, so an emoji is replaced as a whole.
 */
export function diffEdit(oldText: string, newText: string): { start: number; removed: number; inserted: string } {
  const max = Math.min(oldText.length, newText.length);
  let p = 0;
  while (p < max && oldText.charCodeAt(p) === newText.charCodeAt(p)) p++;
  let s = 0;
  while (s < max - p && oldText.charCodeAt(oldText.length - 1 - s) === newText.charCodeAt(newText.length - 1 - s)) s++;
  if (p > 0 && isHigh(oldText.charCodeAt(p - 1))) p--;
  if (s > 0 && isLow(oldText.charCodeAt(oldText.length - s))) s--;
  return { start: p, removed: oldText.length - p - s, inserted: newText.slice(p, newText.length - s) };
}

/**
 * Move the spans through a text edit. Removed text loses its styling; inserted text
 * uses `insertedStyles` when given, otherwise it inherits the style of the character
 * it replaces (or, for a pure insertion, the character before it), like a word processor.
 */
export function editSpans(
  spans: readonly Span[],
  oldLength: number,
  start: number,
  removed: number,
  insertedLength: number,
  insertedStyles?: ArrayLike<number> | null,
): Span[] {
  const old = stylesFromSpans(spans, oldLength);
  const removeEnd = start + removed;
  const inheritIndex = removed > 0 ? start : start - 1;
  const inherit = inheritIndex >= 0 && inheritIndex < oldLength ? old[inheritIndex] : 0;
  const next = new Uint16Array(oldLength - removed + insertedLength);
  next.set(old.subarray(0, start), 0);
  for (let k = 0; k < insertedLength; k++) next[start + k] = insertedStyles ? (insertedStyles[k] ?? 0) : inherit;
  next.set(old.subarray(removeEnd), start + insertedLength);
  return spansFromStyles(next);
}

// Control characters that have no place in a chat message. Tab and line feed stay.
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const HAS_CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const FENCE_WRAPPED_RE = /^\s*```ansi[ \t]*\r?\n?([\s\S]*?)\r?\n?```\s*$/i;

export interface ParsedAnsi {
  text: string;
  spans: Span[];
  /** Control characters and unsupported escape sequences that were dropped. */
  ignored: number;
}

/**
 * Turn text that contains real ESC sequences (for example a message copied out of a
 * chat) into plain text plus spans. Understands 0, 1, 4, 22, 24, 30-37, 39, 40-47 and 49;
 * other sequences are dropped. A surrounding ```ansi fence is removed.
 */
export function parseAnsi(input: string): ParsedAnsi {
  let src = input;
  const fenced = FENCE_WRAPPED_RE.exec(src);
  if (fenced) src = fenced[1];
  // The "␛" symbol shown in the readable view stands for ESC when it introduces a color code.
  src = src.replace(/␛(?=\[[0-9;]*m)/g, ESC);

  const re = /\u001b\[([0-9;]*)m|\u001b\[[0-9;?]*[@-~]|\u001b/g;
  let plain = "";
  const styles: number[] = [];
  let ignored = 0;
  let fg = 0;
  let bg = 0;
  let bold = false;
  let underline = false;
  const current = () => packStyle({ fg, bg, bold, underline });

  const pushText = (chunk: string) => {
    const cleaned = chunk.replace(CONTROL_RE, "");
    ignored += chunk.length - cleaned.length;
    const v = current();
    for (let i = 0; i < cleaned.length; i++) styles.push(v);
    plain += cleaned;
  };

  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    pushText(src.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[1] === undefined) {
      ignored++;
      continue;
    }
    const codes = m[1].split(";").map((x) => (x === "" ? 0 : parseInt(x, 10)));
    for (let k = 0; k < codes.length; k++) {
      const c = codes[k];
      if (c === 0) {
        fg = 0;
        bg = 0;
        bold = false;
        underline = false;
      } else if (c === 1) bold = true;
      else if (c === 4) underline = true;
      else if (c === 22) bold = false;
      else if (c === 24) underline = false;
      else if (c >= 30 && c <= 37) fg = c;
      else if (c === 39) fg = 0;
      else if (c >= 40 && c <= 47) bg = c;
      else if (c === 49) bg = 0;
      else if (c === 38 || c === 48) {
        // Extended color (38;5;n or 38;2;r;g;b) is not supported by Discord: skip its arguments.
        k += codes[k + 1] === 5 ? 2 : codes[k + 1] === 2 ? 4 : 0;
        ignored++;
      } else ignored++;
    }
  }
  pushText(src.slice(last));
  return { text: plain, spans: spansFromStyles(styles), ignored };
}

export interface EditResult {
  doc: Doc;
  /** Where to put the caret when the text differs from what the textarea holds. */
  caret: number | null;
  /** Control characters or unsupported escape sequences that were removed. */
  removedControls: number;
  /** Number of styled sections imported from pasted ANSI text. */
  importedSections: number;
}

/** Fold a new textarea value into the document, moving the spans with the edit. */
export function applyEdit(doc: Doc, rawValue: string): EditResult {
  const next = rawValue.replace(/\r\n?/g, "\n");
  const { start, removed, inserted } = diffEdit(doc.text, next);
  let plain = inserted;
  let insertedStyles: Uint16Array | null = null;
  let removedControls = 0;
  let importedSections = 0;
  if (inserted.includes(ESC) || inserted.includes("␛") || HAS_CONTROL_RE.test(inserted) || FENCE_WRAPPED_RE.test(inserted)) {
    const parsed = parseAnsi(inserted);
    plain = parsed.text;
    insertedStyles = stylesFromSpans(parsed.spans, plain.length);
    removedControls = parsed.ignored;
    importedSections = parsed.spans.length;
  }
  const text = doc.text.slice(0, start) + plain + doc.text.slice(start + removed);
  const spans = editSpans(doc.spans, doc.text.length, start, removed, plain.length, insertedStyles);
  return {
    doc: { text, spans },
    caret: plain !== inserted ? start + plain.length : null,
    removedControls,
    importedSections,
  };
}

/** Make any stored or pasted value safe to use. Never throws. */
export function normalizeDoc(raw: unknown): Doc {
  if (!raw || typeof raw !== "object") return EMPTY_DOC;
  const r = raw as { text?: unknown; spans?: unknown };
  if (typeof r.text !== "string" || r.text === "") return EMPTY_DOC;
  let text = r.text;
  let trustSpans = Array.isArray(r.spans);
  if (text.includes("\r") || HAS_CONTROL_RE.test(text)) {
    text = text.replace(/\r\n?/g, "\n").replace(CONTROL_RE, "");
    trustSpans = false;
  }
  if (text.length > MAX_TEXT_LENGTH) {
    let cut = MAX_TEXT_LENGTH;
    if (isHigh(text.charCodeAt(cut - 1))) cut--;
    text = text.slice(0, cut);
  }
  if (!trustSpans) return { text, spans: [] };
  const clean: Span[] = [];
  for (const item of r.spans as unknown[]) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.start !== "number" || typeof o.end !== "number") continue;
    clean.push({
      start: o.start,
      end: o.end,
      fg: isFg(o.fg) ? o.fg : undefined,
      bg: isBg(o.bg) ? o.bg : undefined,
      bold: o.bold === true,
      underline: o.underline === true,
    });
  }
  return { text, spans: spansFromStyles(stylesFromSpans(clean, text.length)) };
}

/** A stretch of text with one style (0 = unstyled). Segments cover the whole text in order. */
export interface Segment {
  text: string;
  style: number;
}

export function segmentStyle(style: number): StyleFields {
  return unpackStyle(style);
}

/**
 * Split the text into segments the way the output is written: styled runs never
 * contain a line break, and a run that only has a text color or bold drops the
 * spaces at its edges (they would carry no visible style).
 */
export function buildSegments(text: string, spans: readonly Span[]): Segment[] {
  const n = text.length;
  const eff = stylesFromSpans(spans, n);
  let i = 0;
  while (i < n) {
    if (text.charCodeAt(i) === 10) {
      eff[i] = 0;
      i++;
      continue;
    }
    const v = eff[i];
    if (!v) {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < n && eff[j] === v && text.charCodeAt(j) !== 10) j++;
    // Runs without a background or underline show nothing on whitespace.
    if (Math.floor(v / 64) % 64 === 0 && !(v & UNDERLINE_BIT)) {
      let a = i;
      let b = j;
      while (a < b && (text[a] === " " || text[a] === "\t")) eff[a++] = 0;
      while (b > a && (text[b - 1] === " " || text[b - 1] === "\t")) eff[--b] = 0;
    }
    i = j;
  }
  const segments: Segment[] = [];
  let k = 0;
  while (k < n) {
    const v = eff[k];
    let m = k + 1;
    while (m < n && eff[m] === v) m++;
    segments.push({ text: text.slice(k, m), style: v });
    k = m;
  }
  return segments;
}

/** The SGR parameter list for a style, e.g. "1;4;31;40". */
export function sgrCodes(style: number): string {
  const u = unpackStyle(style);
  const parts: number[] = [];
  if (u.bold) parts.push(1);
  if (u.underline) parts.push(4);
  if (u.fg) parts.push(u.fg);
  if (u.bg) parts.push(u.bg);
  return parts.join(";");
}

export interface Rendered {
  /** The text with real ESC characters, without the code-block fence. */
  body: string;
  /** Styled runs written. */
  runs: number;
  /** Times a triple backtick in the text had to be broken so it cannot close the block. */
  fenceBreaks: number;
}

/** Write the text with ANSI escape sequences. Empty text gives an empty body. */
export function renderAnsi(text: string, spans: readonly Span[]): Rendered {
  let body = "";
  let runs = 0;
  let fenceBreaks = 0;
  let ticks = 0;
  const emit = (chunk: string) => {
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i];
      if (ch === "`") {
        ticks++;
        if (ticks === 3) {
          body += ZWSP;
          ticks = 1;
          fenceBreaks++;
        }
      } else ticks = 0;
      body += ch;
    }
  };
  for (const seg of buildSegments(text, spans)) {
    if (!seg.style) {
      emit(seg.text);
      continue;
    }
    body += `${ESC}[${sgrCodes(seg.style)}m`;
    ticks = 0;
    emit(seg.text);
    body += `${ESC}[0m`;
    ticks = 0;
    runs++;
  }
  return { body, runs, fenceBreaks };
}

/** The full message to paste into Discord. Empty when there is no text. */
export function buildMessage(text: string, spans: readonly Span[]): { message: string; rendered: Rendered } {
  const rendered = renderAnsi(text, spans);
  return { message: text ? FENCE_OPEN + rendered.body + FENCE_CLOSE : "", rendered };
}

/** Show ESC as the visible symbol "␛" so the codes can be read. */
export function toVisible(message: string): string {
  return message.split(ESC).join("␛");
}

/** A string literal (valid in JavaScript, JSON and Python) that recreates the message. */
export function toCodeString(message: string): string {
  return message ? JSON.stringify(message) : "";
}

export interface ExampleSegment {
  text: string;
  style?: StyleFields;
}

/** Build a document from a list of [text, style] pieces. */
export function docFromSegments(pieces: readonly ExampleSegment[]): Doc {
  let text = "";
  const styles: number[] = [];
  for (const p of pieces) {
    const v = p.style ? packStyle(p.style) : 0;
    for (let i = 0; i < p.text.length; i++) styles.push(v);
    text += p.text;
  }
  return { text, spans: spansFromStyles(styles) };
}
