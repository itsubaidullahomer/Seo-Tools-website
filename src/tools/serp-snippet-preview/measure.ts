/**
 * Text measurement, truncation and line wrapping for the snippet preview.
 * Pure functions, no React and no DOM access, so everything here runs in Node.
 *
 * Widths are ESTIMATES: the sum of Arial-metric advance widths at the size a results
 * page uses for that field. Kerning, hinting and bold weights are not modelled. The
 * preview card and the PNG export both draw the lines produced here, so they always
 * break in the same places.
 */
import { ADVANCE_UNITS, UNITS_PER_EM } from "./widths";

export type RunStyle = "regular" | "bold" | "muted";

/** A piece of text with one style. */
export interface Span {
  text: string;
  style: RunStyle;
}

export type Run = Span;

/** One grapheme cluster with its width in pixels and style. */
export interface Piece {
  c: string;
  w: number;
  s: RunStyle;
}

/**
 * Optional measurer for characters that are not in the width table (emoji, Arabic,
 * Thai ...). Receives one grapheme cluster and a font size, returns pixels or null.
 */
export type FallbackMeasure = (cluster: string, fontPx: number) => number | null;

const EPS = 0.01;

/**
 * Bold text is drawn wider than the regular widths in the table (about 7 percent for
 * lowercase Arial). Line breaking allows for it so bold words do not spill past the
 * edge of the card. The truncation budget deliberately still uses regular widths, the
 * same as the length checker, because nobody publishes how bold text is budgeted.
 */
export const BOLD_LAYOUT_FACTOR = 1.07;

const layoutWidth = (p: Piece) => (p.s === "bold" ? p.w * BOLD_LAYOUT_FACTOR : p.w);

function sumLayout(pieces: readonly Piece[]): number {
  let total = 0;
  for (const p of pieces) total += layoutWidth(p);
  return total;
}

/** Collapse whitespace the way HTML does and drop control characters. */
export function normalizeText(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/[\t\r\n\f]+/g, " ")
    .replace(/\p{Cc}/gu, "")
    .replace(/ {2,}/g, " ")
    .trim();
}

const ZERO_WIDTH_RE = /^[­​-‏⁠-⁤︀-️﻿]$/;
// CJK ideographs, kana, Hangul and full-width forms are drawn one em wide.
const WIDE_RE =
  /^[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦\u{20000}-\u{3FFFD}]$/u;
const EMOJI_RE = /\p{Extended_Pictographic}/u;
const PLAIN_ASCII_RE = /^[ -~]*$/;

let segmenter: Intl.Segmenter | null | undefined;

/** Split text into grapheme clusters (so an emoji with modifiers stays one unit). */
export function clustersOf(text: string): string[] {
  if (PLAIN_ASCII_RE.test(text)) return text.split("");
  if (segmenter === undefined) {
    try {
      segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
    } catch {
      segmenter = null;
    }
  }
  if (segmenter) return Array.from(segmenter.segment(text), (s) => s.segment);
  return Array.from(text);
}

interface ClusterWidth {
  px: number;
  estimated: boolean;
}

function clusterWidth(cluster: string, fontPx: number, fallback?: FallbackMeasure | null): ClusterWidth {
  let units = 0;
  let known = true;
  for (const ch of cluster) {
    if (ZERO_WIDTH_RE.test(ch)) continue;
    const u = ADVANCE_UNITS.get(ch.codePointAt(0)!);
    if (u !== undefined) {
      units += u;
    } else if (WIDE_RE.test(ch)) {
      units += UNITS_PER_EM;
    } else {
      known = false;
      break;
    }
  }
  if (known) return { px: (units * fontPx) / UNITS_PER_EM, estimated: false };
  const measured = fallback?.(cluster, fontPx);
  if (typeof measured === "number" && Number.isFinite(measured) && measured >= 0) return { px: measured, estimated: true };
  return { px: (EMOJI_RE.test(cluster) ? 1.2 : 0.6) * fontPx, estimated: true };
}

/** Turn styled text into measured pieces. `estimated` counts clusters the width table did not know. */
export function toPieces(spans: Span[], fontPx: number, fallback?: FallbackMeasure | null): { pieces: Piece[]; estimated: number } {
  const pieces: Piece[] = [];
  let estimated = 0;
  for (const span of spans) {
    for (const cluster of clustersOf(span.text)) {
      const w = clusterWidth(cluster, fontPx, fallback);
      if (w.estimated) estimated++;
      pieces.push({ c: cluster, w: w.px, s: span.style });
    }
  }
  return { pieces, estimated };
}

export function sumWidth(pieces: readonly Piece[]): number {
  let total = 0;
  for (const p of pieces) total += p.w;
  return total;
}

/** Estimated width in pixels of a plain string at the given font size. */
export function textWidth(text: string, fontPx: number, fallback?: FallbackMeasure | null): number {
  return sumWidth(toPieces([{ text: normalizeText(text), style: "regular" }], fontPx, fallback).pieces);
}

export const ELLIPSIS = "...";

function ellipsisPieces(fontPx: number): Piece[] {
  const w = ((ADVANCE_UNITS.get(0x2e) ?? 569) * fontPx) / UNITS_PER_EM;
  return [0, 1, 2].map(() => ({ c: ".", w, s: "regular" as RunStyle }));
}

/**
 * Cut pieces so that the kept text plus an ellipsis fits `budget` pixels, backing up
 * to a word boundary (results pages cut between words). The ellipsis is not added.
 */
export function cutToBudget(pieces: Piece[], budget: number, ellipsisPx: number, wordBoundary = true): { kept: Piece[]; truncated: boolean } {
  if (sumWidth(pieces) <= budget + EPS) return { kept: pieces, truncated: false };
  let acc = 0;
  let keep = 0;
  for (let i = 0; i < pieces.length; i++) {
    if (acc + pieces[i].w + ellipsisPx > budget) break;
    acc += pieces[i].w;
    keep = i + 1;
  }
  let cut = keep;
  if (wordBoundary && pieces[keep]?.c !== " ") {
    // The cut lands inside a word: back up to the previous space.
    let j = keep - 1;
    while (j > 0 && pieces[j].c !== " ") j--;
    if (j > 0) cut = j;
  }
  while (cut > 0 && pieces[cut - 1].c === " ") cut--;
  return { kept: pieces.slice(0, cut), truncated: true };
}

interface Word {
  pieces: Piece[];
  /** The space piece that precedes the word (null for the first word). */
  space: Piece | null;
}

/** Greedy word wrap. Words wider than the line are broken between characters. */
export function wrapPieces(pieces: Piece[], width: number): Piece[][] {
  const words: Word[] = [];
  let current: Piece[] = [];
  let pendingSpace: Piece | null = null;
  let lastSpace: Piece | null = null;
  for (const p of pieces) {
    if (p.c === " ") {
      if (current.length) {
        words.push({ pieces: current, space: pendingSpace });
        current = [];
        pendingSpace = null;
      }
      lastSpace = p;
    } else {
      if (!current.length) pendingSpace = words.length ? lastSpace : null;
      current.push(p);
    }
  }
  if (current.length) words.push({ pieces: current, space: pendingSpace });

  const lines: Piece[][] = [];
  let line: Piece[] = [];
  let lineWidth = 0;

  const placeWord = (word: Piece[]) => {
    const w = sumLayout(word);
    if (w <= width + EPS) {
      line = [...word];
      lineWidth = w;
      return;
    }
    for (const p of word) {
      if (lineWidth + layoutWidth(p) > width + EPS && line.length) {
        lines.push(line);
        line = [];
        lineWidth = 0;
      }
      line.push(p);
      lineWidth += layoutWidth(p);
    }
  };

  for (const word of words) {
    const w = sumLayout(word.pieces);
    if (!line.length) {
      placeWord(word.pieces);
    } else {
      const sp = word.space;
      const spaceW = sp ? layoutWidth(sp) : 0;
      if (lineWidth + spaceW + w <= width + EPS) {
        if (sp) line.push(sp);
        line.push(...word.pieces);
        lineWidth += spaceW + w;
      } else {
        lines.push(line);
        line = [];
        lineWidth = 0;
        placeWord(word.pieces);
      }
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

/** Merge neighbouring pieces with the same style into runs. */
export function toRuns(line: readonly Piece[]): Run[] {
  const runs: Run[] = [];
  for (const p of line) {
    const last = runs[runs.length - 1];
    if (last && last.style === p.s) last.text += p.c;
    else runs.push({ text: p.c, style: p.s });
  }
  return runs;
}

export interface FitOptions {
  /** Width of one line in pixels. */
  width: number;
  /** Most lines that may be shown. */
  maxLines: number;
  /** Total width budget in pixels for all the text (the estimated truncation point). */
  budget: number;
  fontPx: number;
  /** Cut only between words (default). Set false to cut anywhere, as for a URL. */
  wordBoundary?: boolean;
}

export interface Fitted {
  lines: Piece[][];
  truncated: boolean;
  /** Width of the full text on one line, before any cutting. */
  total: number;
}

/**
 * Lay a paragraph out the way a results page does: cut it at the width budget with an
 * ellipsis, wrap it into lines, and if that still needs too many lines, shorten the
 * last visible line and end it with an ellipsis.
 */
export function fitParagraph(pieces: Piece[], o: FitOptions): Fitted {
  const total = sumWidth(pieces);
  const ell = ellipsisPieces(o.fontPx);
  const ellPx = sumWidth(ell);
  let work = pieces;
  let truncated = false;
  const cut = cutToBudget(pieces, o.budget, ellPx, o.wordBoundary ?? true);
  if (cut.truncated) {
    work = [...cut.kept, ...ell];
    truncated = true;
  }
  let lines = wrapPieces(work, o.width);
  if (lines.length > o.maxLines) {
    truncated = true;
    const kept = lines.slice(0, o.maxLines);
    let last = kept[o.maxLines - 1];
    while (last.length > 0 && sumLayout(last) + ellPx > o.width + EPS) {
      let idx = -1;
      for (let i = last.length - 1; i >= 0; i--) {
        if (last[i].c === " ") {
          idx = i;
          break;
        }
      }
      last = idx > 0 ? last.slice(0, idx) : last.slice(0, -1);
    }
    kept[o.maxLines - 1] = [...last, ...ell];
    lines = kept;
  }
  return { lines, truncated, total };
}

/** Number of Unicode code points (what people mean by "characters"). */
export function charCount(text: string): number {
  return Array.from(text).length;
}
