/**
 * Page-layout model behind the Words to Pages calculator.
 *
 * Pure functions only (no DOM, no React) so the same code renders the tool, the
 * lookup table and the tests. The model lays text out the way a word processor
 * does: it measures every word with real per-character advance widths for the
 * chosen typeface, wraps lines greedily inside the margins, stacks the lines at
 * the chosen line spacing and starts a new page when the next line no longer
 * fits.
 *
 * Simplifications, all stated on the page: no hyphenation, no widow/orphan
 * control, no headings, tables or images, one typeface and size for the whole
 * document.
 */
import { FONT_METRICS, type FontId, type FontMetrics } from "./metrics";
import { REFERENCE_PARAGRAPHS } from "./reference";

export type { FontId };
export type SpacingId = "single" | "1.15" | "1.5" | "double";
export type PaperId = "letter" | "a4";
export type ParagraphStyleId = "essay" | "block" | "blank";

export interface LayoutSettings {
  font: FontId;
  sizePt: number;
  spacing: SpacingId;
  /** Margin on all four sides, in inches. */
  marginIn: number;
  paper: PaperId;
  paragraphStyle: ParagraphStyleId;
}

export const FONTS: readonly { id: FontId; label: string }[] = [
  { id: "times", label: "Times New Roman" },
  { id: "arial", label: "Arial" },
  { id: "calibri", label: "Calibri" },
  { id: "courier", label: "Courier New" },
];

export const SIZES: readonly number[] = [9, 10, 10.5, 11, 12, 13, 14, 16];

export const SPACINGS: readonly { id: SpacingId; label: string; short: string; factor: number }[] = [
  { id: "single", label: "Single (1.0)", short: "Single", factor: 1 },
  { id: "1.15", label: "1.15", short: "1.15", factor: 1.15 },
  { id: "1.5", label: "1.5 lines", short: "1.5", factor: 1.5 },
  { id: "double", label: "Double (2.0)", short: "Double", factor: 2 },
];

export const PAPERS: readonly { id: PaperId; label: string; widthIn: number; heightIn: number; size: string }[] = [
  { id: "letter", label: "US Letter", widthIn: 8.5, heightIn: 11, size: "8.5 × 11 in" },
  { id: "a4", label: "A4", widthIn: 210 / 25.4, heightIn: 297 / 25.4, size: "210 × 297 mm" },
];

export const MARGINS: readonly { value: number; label: string }[] = [
  { value: 0.5, label: "0.5 in (1.27 cm)" },
  { value: 0.75, label: "0.75 in (1.91 cm)" },
  { value: 1, label: "1 in (2.54 cm)" },
  { value: 1.25, label: "1.25 in (3.18 cm)" },
  { value: 1.5, label: "1.5 in (3.81 cm)" },
];

/** indentPt: first-line indent. gapPt: space between paragraphs ("line" = one blank line at the chosen spacing). */
export const PARAGRAPH_STYLES: readonly { id: ParagraphStyleId; label: string; indentPt: number; gapPt: number | "line" }[] = [
  { id: "essay", label: "Indented, no gap (essay)", indentPt: 36, gapPt: 0 },
  { id: "block", label: "Block, 8 pt gap", indentPt: 0, gapPt: 8 },
  { id: "blank", label: "Block, blank line between", indentPt: 0, gapPt: "line" },
];

export const DEFAULT_SETTINGS: LayoutSettings = {
  font: "times",
  sizePt: 12,
  spacing: "double",
  marginIn: 1,
  paper: "letter",
  paragraphStyle: "essay",
};

/** Rebuild settings from untrusted stored JSON so a bad value can never crash the tool. */
export function normalizeSettings(stored: unknown): LayoutSettings {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const out = { ...DEFAULT_SETTINGS };
  if (FONTS.some((f) => f.id === src.font)) out.font = src.font as FontId;
  if (typeof src.sizePt === "number" && SIZES.includes(src.sizePt)) out.sizePt = src.sizePt;
  if (SPACINGS.some((s) => s.id === src.spacing)) out.spacing = src.spacing as SpacingId;
  if (typeof src.marginIn === "number" && MARGINS.some((m) => m.value === src.marginIn)) out.marginIn = src.marginIn;
  if (PAPERS.some((p) => p.id === src.paper)) out.paper = src.paper as PaperId;
  if (PARAGRAPH_STYLES.some((p) => p.id === src.paragraphStyle)) out.paragraphStyle = src.paragraphStyle as ParagraphStyleId;
  return out;
}

export function fontLabel(id: FontId): string {
  return FONTS.find((f) => f.id === id)?.label ?? id;
}
export function spacingLabel(id: SpacingId): string {
  return id === "single" ? "single-spaced" : id === "double" ? "double-spaced" : `${id} spacing`;
}
export function paperLabel(id: PaperId): string {
  return id === "a4" ? "A4" : "US Letter";
}
export function marginLabel(inches: number): string {
  return `${inches} in`;
}
export function sizeLabel(pt: number): string {
  return `${pt} pt`;
}

/** One-line description of the settings, used in the result and in copied text. */
export function describeSettings(s: LayoutSettings): string {
  return `${fontLabel(s.font)} ${sizeLabel(s.sizePt)}, ${spacingLabel(s.spacing)}, ${marginLabel(s.marginIn)} margins, ${paperLabel(s.paper)}`;
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const EPS = 1e-6;

export interface PageGeometry {
  /** Usable text width and height in points (1 pt = 1/72 in). */
  contentWidthPt: number;
  contentHeightPt: number;
  lineHeightPt: number;
  linesPerPage: number;
  /** Height of a page filled with lines and no paragraph gaps. */
  fillHeightPt: number;
  indentPt: number;
  gapPt: number;
}

export function geometry(s: LayoutSettings): PageGeometry {
  const fm = FONT_METRICS[s.font];
  const paper = PAPERS.find((p) => p.id === s.paper) ?? PAPERS[0];
  const factor = SPACINGS.find((x) => x.id === s.spacing)?.factor ?? 1;
  const style = PARAGRAPH_STYLES.find((p) => p.id === s.paragraphStyle) ?? PARAGRAPH_STYLES[0];
  const contentWidthPt = Math.max(72, (paper.widthIn - 2 * s.marginIn) * 72);
  const contentHeightPt = Math.max(72, (paper.heightIn - 2 * s.marginIn) * 72);
  const lineHeightPt = fm.lineHeight * s.sizePt * factor;
  const linesPerPage = Math.max(1, Math.floor(contentHeightPt / lineHeightPt + EPS));
  return {
    contentWidthPt,
    contentHeightPt,
    lineHeightPt,
    linesPerPage,
    fillHeightPt: Math.min(contentHeightPt, linesPerPage * lineHeightPt),
    indentPt: style.indentPt,
    gapPt: style.gapPt === "line" ? lineHeightPt : style.gapPt,
  };
}

/** Text area size in inches, for display. */
export function textAreaInches(s: LayoutSettings): { width: number; height: number } {
  const g = geometry(s);
  return { width: g.contentWidthPt / 72, height: g.contentHeightPt / 72 };
}

/* ------------------------------------------------------------------ */
/* Measuring and wrapping                                              */
/* ------------------------------------------------------------------ */

export interface Measurer {
  /** Width of a word in points. */
  word(w: string): number;
  /** Width of one character (a code point string) in points. */
  char(ch: string): number;
  /** Width of a space in points. */
  space: number;
}

const wideRanges: [number, number][] = [
  [0x1100, 0x115f],
  [0x2e80, 0xa4cf],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe30, 0xfe4f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x1f000, 0x1faff],
  [0x20000, 0x3fffd],
];

function slowEm(fm: FontMetrics, cp: number): number {
  const ch = String.fromCodePoint(cp);
  const extra = fm.extras[ch];
  if (extra !== undefined) return extra;
  if (/\p{M}/u.test(ch)) return 0;
  for (const [lo, hi] of wideRanges) if (cp >= lo && cp <= hi) return 1000;
  const base = ch.normalize("NFD")[0];
  if (base && base !== ch) {
    const b = base.charCodeAt(0);
    if (b >= 32 && b < 127) return fm.widths[b - 32];
  }
  return fm.widths["n".charCodeAt(0) - 32];
}

export function createMeasurer(font: FontId, sizePt: number): Measurer {
  const fm = FONT_METRICS[font];
  const k = sizePt / 1000;
  const cache = new Map<number, number>();
  const em = (cp: number): number => {
    if (cp >= 32 && cp < 127) return fm.widths[cp - 32];
    let v = cache.get(cp);
    if (v === undefined) {
      v = slowEm(fm, cp);
      cache.set(cp, v);
    }
    return v;
  };
  return {
    space: fm.widths[0] * k,
    char: (ch) => em(ch.codePointAt(0) ?? 32) * k,
    word: (w) => {
      let sum = 0;
      for (let i = 0; i < w.length; i++) {
        const c = w.charCodeAt(i);
        if (c >= 32 && c < 127) sum += fm.widths[c - 32];
        else {
          const cp = w.codePointAt(i) ?? c;
          if (cp > 0xffff) i++;
          sum += em(cp);
        }
      }
      return sum * k;
    },
  };
}

/**
 * Number of lines a paragraph occupies: greedy wrapping, spaces between words
 * only, words wider than a line are broken across lines.
 */
export function countLines(words: readonly string[], m: Measurer, lineWidthPt: number, indentPt: number): number {
  if (words.length === 0) return 0;
  const space = m.space;
  let lines = 1;
  let avail = Math.max(lineWidthPt * 0.25, lineWidthPt - indentPt);
  let x = -1; // -1 means the current line is empty
  for (const w of words) {
    const ww = m.word(w);
    if (x >= 0) {
      if (x + space + ww <= avail + EPS) {
        x += space + ww;
        continue;
      }
      lines++;
      avail = lineWidthPt;
    }
    if (ww <= avail + EPS) {
      x = ww;
      continue;
    }
    let cur = 0;
    for (const ch of w) {
      const cw = m.char(ch);
      if (cur + cw > avail + EPS && cur > 0) {
        lines++;
        avail = lineWidthPt;
        cur = 0;
      }
      cur += cw;
    }
    x = cur;
  }
  return lines;
}

/** Split pasted text into paragraphs of words. Every line break starts a paragraph; blank lines are ignored. */
export function splitParagraphs(text: string): string[][] {
  const out: string[][] = [];
  for (const line of text.split(/\r\n|[\r\n\u2028\u2029\u000B\u000C]/)) {
    const t = line.trim();
    if (t) out.push(t.split(/\s+/));
  }
  return out;
}

export function paragraphLineCounts(paragraphs: readonly (readonly string[])[], s: LayoutSettings): number[] {
  const g = geometry(s);
  const m = createMeasurer(s.font, s.sizePt);
  return paragraphs.map((p) => countLines(p, m, g.contentWidthPt, g.indentPt));
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

export interface Pagination {
  /** Fractional page count, e.g. 3.44 = three full pages and 44% of a fourth. */
  pages: number;
  /** Whole pages the document occupies (the last one may be nearly empty). */
  sheets: number;
  lines: number;
  /** 0-1 fill of the last page. */
  lastPageFill: number;
}

/** Stack paragraphs (given as line counts) onto pages. */
export function paginate(lineCounts: readonly number[], g: PageGeometry): Pagination {
  const lh = g.lineHeightPt;
  const H = g.contentHeightPt;
  let y = 0;
  let done = 0;
  let lines = 0;
  for (let i = 0; i < lineCounts.length; i++) {
    if (lines > 0) y += g.gapPt;
    for (let k = 0; k < lineCounts[i]; k++) {
      if (lines > 0 && y + lh > H + EPS) {
        done++;
        y = 0;
      }
      y += lh;
      lines++;
    }
  }
  if (lines === 0) return { pages: 0, sheets: 0, lines: 0, lastPageFill: 0 };
  const lastPageFill = Math.min(1, y / g.fillHeightPt);
  return { pages: done + lastPageFill, sheets: done + 1, lines, lastPageFill };
}

/* ------------------------------------------------------------------ */
/* Words per page from the reference passage                           */
/* ------------------------------------------------------------------ */

const REFERENCE_WORDS = REFERENCE_PARAGRAPHS.reduce((n, p) => n + p.split(/\s+/).length, 0);
const REFERENCE_WORD_LISTS = REFERENCE_PARAGRAPHS.map((p) => p.split(/\s+/));
const REFERENCE_COPIES = 30;
const referenceCache = new Map<string, number[]>();

function referenceLineCounts(s: LayoutSettings): number[] {
  const g = geometry(s);
  const key = `${s.font}|${s.sizePt}|${s.marginIn}|${s.paper}|${g.indentPt}`;
  let counts = referenceCache.get(key);
  if (!counts) {
    const m = createMeasurer(s.font, s.sizePt);
    counts = REFERENCE_WORD_LISTS.map((w) => countLines(w, m, g.contentWidthPt, g.indentPt));
    referenceCache.set(key, counts);
  }
  return counts;
}

/**
 * Words that fit on one page for ordinary English prose, averaged over many
 * pages of the reference passage. Returns a fractional number; round for display.
 */
export function wordsPerPage(s: LayoutSettings): number {
  const one = referenceLineCounts(s);
  const many: number[] = [];
  for (let i = 0; i < REFERENCE_COPIES; i++) many.push(...one);
  const p = paginate(many, geometry(s));
  return (REFERENCE_WORDS * REFERENCE_COPIES) / p.pages;
}

/** Pages needed for a word count at a given words-per-page figure. */
export function pagesForWords(words: number, wpp: number): number {
  return wpp > 0 ? words / wpp : 0;
}

export function wordsForPages(pages: number, wpp: number): number {
  return pages * wpp;
}

/** Whole pages needed: 3.01 needs 4 pages, an exact 4 needs 4. */
export function wholePages(pages: number): number {
  return pages <= 0 ? 0 : Math.max(1, Math.ceil(pages - 1e-9));
}

/* ------------------------------------------------------------------ */
/* Lookup tables (same functions as the calculator)                     */
/* ------------------------------------------------------------------ */

export const TABLE_WORD_COUNTS: readonly number[] = [250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000];
export const TABLE_PAGE_COUNTS: readonly number[] = [1, 2, 3, 5, 10, 15, 20, 25, 50, 100];

export interface SpacingColumn {
  id: SpacingId;
  short: string;
  wpp: number;
}

/** Words per page for every spacing option with the other settings held fixed. */
export function spacingColumns(s: LayoutSettings, overrideWpp?: number): SpacingColumn[] {
  return SPACINGS.map((sp) => ({
    id: sp.id,
    short: sp.short,
    // Whole numbers, exactly as displayed, so 1,020 words at 340 per page is 3.0 pages and not 3.003.
    wpp: overrideWpp && overrideWpp > 0 ? overrideWpp : Math.round(wordsPerPage({ ...s, spacing: sp.id })),
  }));
}

/** Paginate the same wrapped text at every spacing option (line breaks do not depend on spacing). */
export function paginateAllSpacings(lineCounts: readonly number[], s: LayoutSettings): { id: SpacingId; short: string; pagination: Pagination }[] {
  return SPACINGS.map((sp) => ({ id: sp.id, short: sp.short, pagination: paginate(lineCounts, geometry({ ...s, spacing: sp.id })) }));
}

/** Round a word count for display: pages-to-words answers are estimates, so they are not shown to the last digit. */
export function roundWords(w: number): number {
  if (w < 100) return Math.round(w);
  if (w < 1000) return Math.round(w / 5) * 5;
  return Math.round(w / 10) * 10;
}

export interface LookupTable {
  header: string[];
  /** Index of the column that matches the selected spacing (1-based into header, 0 = none). */
  selectedColumn: number;
  rows: { label: string; cells: string[] }[];
}

/**
 * The reference tables under the calculator. They call the same functions as
 * the calculator itself, so a table cell and the live result cannot disagree.
 */
export function lookupTable(kind: "words" | "pages", s: LayoutSettings, overrideWpp?: number): LookupTable {
  const cols = spacingColumns(s, overrideWpp);
  const inputs = kind === "words" ? TABLE_WORD_COUNTS : TABLE_PAGE_COUNTS;
  return {
    header: [kind === "words" ? "Words" : "Pages", ...cols.map((c) => c.short)],
    selectedColumn: overrideWpp ? 0 : cols.findIndex((c) => c.id === s.spacing) + 1,
    rows: inputs.map((n) => ({
      label: formatInt(n),
      cells: cols.map((c) => (kind === "words" ? formatPages(pagesForWords(n, c.wpp)) : formatInt(roundWords(wordsForPages(n, c.wpp))))),
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Parsing and formatting                                              */
/* ------------------------------------------------------------------ */

export const MAX_WORDS = 10_000_000;
export const MAX_PAGES = 100_000;
export const MIN_CUSTOM_WPP = 10;
export const MAX_CUSTOM_WPP = 5000;

export type Parsed = { kind: "empty" } | { kind: "invalid"; hint: string } | { kind: "ok"; value: number };

function clean(raw: string): string {
  return raw.trim().toLowerCase().replace(/[,\s_  ']/g, "");
}

/** Whole number of words. Accepts 1000, 1,000, 1 000 and 80k. */
export function parseWords(raw: string): Parsed {
  const s = clean(raw);
  if (!s) return { kind: "empty" };
  const m = /^(\d+(?:\.\d+)?)(k)?$/.exec(s);
  if (!m) return { kind: "invalid", hint: "Enter a whole number, for example 1000, 1,500 or 80k." };
  if (!m[2] && m[1].includes(".")) return { kind: "invalid", hint: "Words must be a whole number. Use 1000, not 1.000." };
  const n = Math.round(parseFloat(m[1]) * (m[2] ? 1000 : 1));
  if (n > MAX_WORDS) return { kind: "invalid", hint: `Enter ${MAX_WORDS.toLocaleString("en-US")} words or fewer.` };
  return { kind: "ok", value: n };
}

/** Pages, decimals allowed (2.5 = two and a half pages). */
export function parsePages(raw: string): Parsed {
  const s = clean(raw);
  if (!s) return { kind: "empty" };
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(s)) return { kind: "invalid", hint: "Enter a positive number of pages, for example 5 or 2.5." };
  const n = parseFloat(s);
  if (n > MAX_PAGES) return { kind: "invalid", hint: `Enter ${MAX_PAGES.toLocaleString("en-US")} pages or fewer.` };
  return { kind: "ok", value: n };
}

/** Optional custom words per page. Empty is valid and means "use the layout model". */
export function parseCustomWpp(raw: string): Parsed {
  const s = clean(raw);
  if (!s) return { kind: "empty" };
  if (!/^(\d+(\.\d+)?)$/.test(s)) return { kind: "invalid", hint: "Enter a number, for example 300." };
  const n = parseFloat(s);
  if (n < MIN_CUSTOM_WPP || n > MAX_CUSTOM_WPP)
    return { kind: "invalid", hint: `Use a value between ${MIN_CUSTOM_WPP} and ${MAX_CUSTOM_WPP.toLocaleString("en-US")} words per page.` };
  return { kind: "ok", value: n };
}

const nf = (digits: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const nf0 = nf(0);
const nfTrim = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const nf1 = nf(1);
const nf2 = nf(2);

/** Page counts: 0.34, 3.4, 12.7, 1,234. Tiny values show as <0.01. */
export function formatPages(p: number): string {
  if (!Number.isFinite(p) || p <= 0) return "0";
  if (p < 0.005) return "<0.01";
  if (p < 1) return nf2.format(p);
  if (p < 100) return nf1.format(p);
  return nf0.format(p);
}

/** A number as the reader typed it: 5, 2.5, 1,250 (no forced decimals). */
export function formatCount(n: number): string {
  return nfTrim.format(n);
}

export function formatInt(n: number): string {
  return nf0.format(Math.round(n));
}

export function pluralPages(p: number): string {
  return formatPages(p) === "1.0" || formatPages(p) === "1.00" ? "page" : "pages";
}
