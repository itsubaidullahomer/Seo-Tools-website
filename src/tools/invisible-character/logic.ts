/**
 * Pure scanning and cleaning logic for the Invisible Character tool. No React,
 * no DOM: import it from plain Node to test it.
 *
 * Vocabulary
 *  - hit    = one hidden character found in the text
 *  - legit  = a hit that is very probably meant to be there (a joiner inside an
 *             emoji, a joiner in Persian or Hindi, the emoji style selector,
 *             the tags of a flag emoji, a direction mark in right-to-left text)
 */

import { CATEGORIES, CATEGORY_ORDER, classify, codePointLabel, type Action, type CategoryId, type CharInfo } from "./chars";

export interface Hit {
  /** UTF-16 index of the first code unit. */
  index: number;
  /** Number of UTF-16 code units (1, or 2 for characters outside the BMP). */
  length: 1 | 2;
  cp: number;
  info: CharInfo;
  /** 1-based line number. */
  line: number;
  /** 1-based column, counted in code points. */
  col: number;
  /** Why this hit is probably intentional, or null if it is not. */
  legit: string | null;
}

export interface ScanResult {
  hits: Hit[];
  /** Number of Unicode code points in the text. */
  codePoints: number;
  /** Number of lines (line feeds + 1) for non-empty text. */
  lines: number;
}

/**
 * Candidate finder. The lookahead skips the four everyday whitespace characters
 * so that ordinary prose produces no candidates. Everything else in the listed
 * Unicode categories is passed to classify(), which decides what is really hidden.
 */
const CANDIDATE_RE_SOURCE = String.raw`(?![ \t\n\r])[\p{Cc}\p{Cf}\p{Zs}\p{Zl}\p{Zp}\p{Default_Ignorable_Code_Point}\p{Variation_Selector}\u2800]`;

const EXT_PICT_RE = /\p{Extended_Pictographic}/u;
const HAN_RE = /\p{Script=Han}/u;
const MONGOLIAN_RE = /\p{Script_Extensions=Mongolian}/u;
const KEYCAP_BASE_RE = /[0-9#*]/;

/** Scripts whose spelling depends on ZWNJ or ZWJ. A joiner next to one of their letters is meaningful. */
const JOINER_SCRIPT_NAMES = [
  "Arabic",
  "Syriac",
  "Thaana",
  "Mongolian",
  "Devanagari",
  "Bengali",
  "Gurmukhi",
  "Gujarati",
  "Oriya",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Sinhala",
  "Khmer",
  "Myanmar",
  "Tibetan",
  "Balinese",
  "Javanese",
];
const JOINER_SCRIPT_RE = new RegExp(`[${JOINER_SCRIPT_NAMES.map((n) => String.raw`\p{Script_Extensions=${n}}`).join("")}]`, "u");

/** Right-to-left scripts. A direction mark on a line that contains one is meaningful. */
const RTL_RE = new RegExp(`[${["Arabic", "Hebrew", "Syriac", "Thaana", "Nko"].map((n) => String.raw`\p{Script=${n}}`).join("")}]`, "u");

function testCp(re: RegExp, cp: number): boolean {
  return cp >= 0 && re.test(String.fromCodePoint(cp));
}

/** Code point that ends right before `index`, or -1. */
function cpBefore(text: string, index: number): number {
  if (index <= 0) return -1;
  const lo = text.charCodeAt(index - 1);
  if (lo >= 0xdc00 && lo <= 0xdfff && index >= 2) {
    const hi = text.charCodeAt(index - 2);
    if (hi >= 0xd800 && hi <= 0xdbff) return text.codePointAt(index - 2) ?? lo;
  }
  return lo;
}

/** Code point that starts at `index`, or -1. */
function cpAt(text: string, index: number): number {
  return index >= text.length ? -1 : (text.codePointAt(index) ?? -1);
}

/**
 * Decide whether a single hit is a legitimate use of an invisible character.
 * Tag characters are handled separately because they need the whole run.
 */
function legitReason(text: string, cp: number, index: number, length: number, lineHasRtl: () => boolean): string | null {
  const prev = cpBefore(text, index);
  const next = cpAt(text, index + length);

  if (cp === 0x200d || cp === 0x200c) {
    if (cp === 0x200d) {
      // Walk back over an emoji style selector and skin-tone modifier to find the emoji before the joiner.
      let p = prev;
      let at = index;
      for (let step = 0; step < 3 && (p === 0xfe0f || (p >= 0x1f3fb && p <= 0x1f3ff)); step++) {
        at -= p > 0xffff ? 2 : 1;
        p = cpBefore(text, at);
      }
      if (testCp(EXT_PICT_RE, p) && testCp(EXT_PICT_RE, next)) return "joins two emoji into one";
    }
    if (testCp(JOINER_SCRIPT_RE, prev) || testCp(JOINER_SCRIPT_RE, next)) return "joiner in a script that uses it";
    return null;
  }

  if (cp === 0xfe0f || cp === 0xfe0e) {
    if (testCp(EXT_PICT_RE, prev)) return "emoji or text style selector";
    if (cp === 0xfe0f && prev >= 0 && prev < 0x80 && KEYCAP_BASE_RE.test(String.fromCharCode(prev)) && next === 0x20e3) return "part of a keycap emoji";
    return null;
  }

  if ((cp >= 0xfe00 && cp <= 0xfe0d) || (cp >= 0xe0100 && cp <= 0xe01ef)) {
    return testCp(HAN_RE, prev) ? "ideographic variation sequence" : null;
  }
  if ((cp >= 0x180b && cp <= 0x180d) || cp === 0x180f) {
    return testCp(MONGOLIAN_RE, prev) ? "Mongolian variation selector" : null;
  }

  if (cp === 0x200e || cp === 0x200f || cp === 0x061c) {
    return lineHasRtl() ? "direction mark in right-to-left text" : null;
  }

  return null;
}

/** Scan text for hidden characters. Linear in the length of the text. */
export function scan(text: string): ScanResult {
  const hits: Hit[] = [];
  const re = new RegExp(CANDIDATE_RE_SOURCE, "gu");

  // Line and column tracking, advanced lazily as hits arrive in index order.
  let line = 1;
  let lineStart = 0;
  let nextNewline = text.indexOf("\n");
  let colBase = 0;
  let colCount = 0;
  let rtlLineStart = -1;
  let rtlValue = false;

  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const index = m.index;
    const cp = m[0].codePointAt(0) ?? 0;
    const info = classify(cp);
    if (!info) continue;
    const length = m[0].length as 1 | 2;

    while (nextNewline !== -1 && nextNewline < index) {
      line++;
      lineStart = nextNewline + 1;
      nextNewline = text.indexOf("\n", lineStart);
      colBase = lineStart;
      colCount = 0;
    }
    for (let j = colBase; j < index; j++) {
      const c = text.charCodeAt(j);
      if (c < 0xdc00 || c > 0xdfff) colCount++;
    }
    colBase = index;

    const ls = lineStart;
    const lineHasRtl = () => {
      if (rtlLineStart !== ls) {
        rtlLineStart = ls;
        const end = text.indexOf("\n", ls);
        rtlValue = RTL_RE.test(text.slice(ls, end === -1 ? text.length : end));
      }
      return rtlValue;
    };

    hits.push({ index, length, cp, info, line, col: colCount + 1, legit: legitReason(text, cp, index, length, lineHasRtl) });
  }

  markFlagTagRuns(text, hits);

  let codePoints = text.length;
  let newlines = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0xdc00 && c <= 0xdfff && i > 0) {
      const p = text.charCodeAt(i - 1);
      if (p >= 0xd800 && p <= 0xdbff) codePoints--;
    } else if (c === 10) newlines++;
  }

  return { hits, codePoints, lines: text ? newlines + 1 : 0 };
}

/**
 * A run of tag characters directly after an emoji and closed by CANCEL TAG is
 * how flags such as England or Scotland are written, so it is legitimate.
 * Any other run is invisible text that a reader cannot see.
 */
function markFlagTagRuns(text: string, hits: Hit[]): void {
  let i = 0;
  while (i < hits.length) {
    if (hits[i].info.category !== "tag") {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < hits.length && hits[j + 1].info.category === "tag" && hits[j + 1].index === hits[j].index + hits[j].length) j++;
    const before = cpBefore(text, hits[i].index);
    if (j > i && hits[j].cp === 0xe007f && testCp(EXT_PICT_RE, before)) {
      for (let k = i; k <= j; k++) hits[k].legit = "tags of a flag emoji";
    }
    i = j + 1;
  }
}

/* ---------------------------------------------------------------------------
 * Summaries
 * ------------------------------------------------------------------------- */

export interface Group {
  cp: number;
  info: CharInfo;
  count: number;
  legitCount: number;
  firstLine: number;
  firstCol: number;
}

/** One row per distinct code point, most frequent first. */
export function groupByCodePoint(hits: Hit[]): Group[] {
  const map = new Map<number, Group>();
  for (const h of hits) {
    const g = map.get(h.cp);
    if (g) {
      g.count++;
      if (h.legit) g.legitCount++;
    } else {
      map.set(h.cp, { cp: h.cp, info: h.info, count: 1, legitCount: h.legit ? 1 : 0, firstLine: h.line, firstCol: h.col });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.cp - b.cp);
}

export interface CategoryCount {
  id: CategoryId;
  count: number;
  legitCount: number;
}

/** Counts per category, in display order, for categories that occur at least once. */
export function countByCategory(hits: Hit[]): CategoryCount[] {
  const map = new Map<CategoryId, CategoryCount>();
  for (const h of hits) {
    const id = h.info.category;
    const c = map.get(id) ?? { id, count: 0, legitCount: 0 };
    c.count++;
    if (h.legit) c.legitCount++;
    map.set(id, c);
  }
  return CATEGORY_ORDER.flatMap((id) => {
    const c = map.get(id);
    return c ? [c] : [];
  });
}

export function linesAffected(hits: Hit[]): number {
  let n = 0;
  let last = -1;
  for (const h of hits) {
    if (h.line !== last) {
      n++;
      last = h.line;
    }
  }
  return n;
}

/** True when the text contains bidirectional overrides, embeddings or isolates (the Trojan Source family). */
export function hasBidiOverrides(hits: Hit[]): boolean {
  return hits.some((h) => (h.cp >= 0x202a && h.cp <= 0x202e) || (h.cp >= 0x2066 && h.cp <= 0x2069));
}

/**
 * Decode tag characters that are not part of a flag emoji. U+E0020..U+E007E
 * mirror printable ASCII, so a run of them is invisible text. Returns "" when
 * there is nothing to decode.
 */
export function decodeHiddenTags(hits: Hit[], maxLength = 300): string {
  const runs: string[] = [];
  let current = "";
  let lastEnd = -1;
  for (const h of hits) {
    const isTag = h.info.category === "tag" && !h.legit;
    if (!isTag) continue;
    if (h.index !== lastEnd && current) {
      runs.push(current);
      current = "";
    }
    if (h.cp >= 0xe0020 && h.cp <= 0xe007e) current += String.fromCharCode(h.cp - 0xe0000);
    lastEnd = h.index + h.length;
  }
  if (current) runs.push(current);
  const joined = runs.join(" | ");
  return joined.length > maxLength ? `${joined.slice(0, maxLength)}…` : joined;
}

/* ---------------------------------------------------------------------------
 * Cleaning
 * ------------------------------------------------------------------------- */

export type Actions = Record<CategoryId, Action>;

export interface CleanResult {
  output: string;
  removed: number;
  replaced: number;
  marked: number;
  kept: number;
}

export function markerFor(cp: number): string {
  return `<${codePointLabel(cp)}>`;
}

/** Apply one action per category. Hits flagged as legit are left alone when keepLegit is true. */
export function clean(text: string, hits: Hit[], actions: Actions, keepLegit: boolean): CleanResult {
  const parts: string[] = [];
  let last = 0;
  let removed = 0;
  let replaced = 0;
  let marked = 0;
  let kept = 0;

  for (const h of hits) {
    const action = actions[h.info.category];
    if (action === "keep" || (keepLegit && h.legit)) {
      kept++;
      continue;
    }
    parts.push(text.slice(last, h.index));
    last = h.index + h.length;
    switch (action) {
      case "remove":
        removed++;
        break;
      case "space":
        parts.push(" ");
        replaced++;
        break;
      case "newline":
        parts.push("\n");
        replaced++;
        break;
      case "mark":
        parts.push(markerFor(h.cp));
        marked++;
        break;
    }
  }
  parts.push(text.slice(last));
  return { output: parts.join(""), removed, replaced, marked, kept };
}

/* ---------------------------------------------------------------------------
 * Highlighted view
 * ------------------------------------------------------------------------- */

export type Segment = { kind: "text"; text: string } | { kind: "hit"; hit: Hit };

export interface SegmentResult {
  segments: Segment[];
  /** True when the text or the number of chips was cut short. */
  truncated: boolean;
  shownChars: number;
}

/** Split text into plain runs and hit chips for display. Caps both the characters and the chips rendered. */
export function toSegments(text: string, hits: Hit[], maxChars: number, maxHits: number): SegmentResult {
  let limit = Math.min(text.length, maxChars);
  if (limit < text.length && limit > 0) {
    const c = text.charCodeAt(limit - 1);
    if (c >= 0xd800 && c <= 0xdbff) limit++;
  }
  const segments: Segment[] = [];
  let pos = 0;
  let shown = 0;
  let end = limit;
  let truncated = limit < text.length;
  for (const h of hits) {
    if (h.index >= limit) break;
    if (shown >= maxHits) {
      truncated = true;
      end = h.index;
      break;
    }
    if (h.index > pos) segments.push({ kind: "text", text: text.slice(pos, h.index) });
    segments.push({ kind: "hit", hit: h });
    pos = h.index + h.length;
    shown++;
  }
  if (pos < end) segments.push({ kind: "text", text: text.slice(pos, end) });
  return { segments, truncated, shownChars: end };
}

/* ---------------------------------------------------------------------------
 * Presets and state sanitising
 * ------------------------------------------------------------------------- */

export function defaultActions(): Actions {
  return Object.fromEntries(CATEGORY_ORDER.map((id) => [id, CATEGORIES[id].defaultAction])) as Actions;
}

export function uniformActions(action: Action): Actions {
  return Object.fromEntries(CATEGORY_ORDER.map((id) => [id, CATEGORIES[id].actions.includes(action) ? action : CATEGORIES[id].defaultAction])) as Actions;
}

/** Rebuild an Actions object from stored JSON, dropping anything invalid. */
export function parseActions(raw: string): Actions {
  const base = defaultActions();
  try {
    const obj: unknown = JSON.parse(raw);
    if (obj && typeof obj === "object") {
      for (const id of CATEGORY_ORDER) {
        const v = (obj as Record<string, unknown>)[id];
        if (typeof v === "string" && (CATEGORIES[id].actions as string[]).includes(v)) base[id] = v as Action;
      }
    }
  } catch {
    /* keep defaults */
  }
  return base;
}

/** Example text with a few of each kind of hidden character, including legitimate emoji joiners. */
export function exampleText(): string {
  const c = (...cps: number[]) => String.fromCodePoint(...cps);
  return [
    `Order${c(0xa0)}#4821${c(0x200b)} - total:${c(0x2003)}$19.99${c(0x2800)}`,
    `Ship to: Jane${c(0x200d)} Doe${c(0x3164)}`,
    `${c(0xfeff)}Price list${c(0xad)} v2 - family ${c(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467)} approved ${c(0x2714, 0xfe0f)}`,
    `Persian word with a half-space: ${c(0x645, 0x6cc, 0x200c, 0x62e, 0x648, 0x627, 0x647, 0x645)}`,
  ].join("\n");
}
