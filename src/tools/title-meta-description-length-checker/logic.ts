/**
 * Pure logic for the Title Tag & Meta Description Length Checker.
 * No React, no DOM access (except inside the optional fallback measurer that the
 * component passes in) - everything here can be unit-tested in Node.
 *
 * Widths are ESTIMATES: the sum of Arial-metric advance widths at the font size a
 * results page uses for that field. Kerning, hinting and Google's own fonts are not
 * modelled, so leave a margin when text is close to a limit.
 */
import { ADVANCE_UNITS, UNITS_PER_EM } from "./widths";
import {
  DEFAULT_LIMITS,
  FONT_PX,
  FRONT_RATIO,
  MIN_CHARS,
  NEAR_RATIO,
  type Device,
  type FieldKind,
  type Limits,
} from "./limits";

export type { Device, FieldKind, Limits } from "./limits";

/* -------------------------------------------------------------------------- */
/* Text normalisation and measurement                                          */
/* -------------------------------------------------------------------------- */

/**
 * Optional measurer for characters that are not in the bundled width table
 * (emoji, Arabic, Thai ...). Receives one grapheme cluster and a font size and
 * returns its width in pixels, or null when it cannot measure.
 */
export type FallbackMeasure = (cluster: string, fontPx: number) => number | null;

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
// Text in which every code point is its own grapheme cluster (no combining marks, joiners,
// surrogate pairs or Hangul jamo), so the slower Intl.Segmenter can be skipped.
const SIMPLE_CLUSTERS_RE = /^[\u0020-\u02FF\u0370-\u0482\u048A-\u052F\u2000-\u200A\u2010-\u2027\u2030-\u20CF]*$/;

let segmenter: Intl.Segmenter | null | undefined;
function clustersOf(text: string): string[] {
  if (PLAIN_ASCII_RE.test(text)) return text.split("");
  if (SIMPLE_CLUSTERS_RE.test(text)) return Array.from(text);
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

function clusterWidth(cluster: string, fontPx: number, fallback?: FallbackMeasure): ClusterWidth {
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

export interface Measured {
  clusters: string[];
  /** Width of each cluster in pixels. */
  widths: number[];
  total: number;
  /** How many clusters were measured by the fallback rather than the table. */
  estimatedClusters: number;
}

/** Measure already-normalised text. */
export function measureText(text: string, fontPx: number, fallback?: FallbackMeasure): Measured {
  const clusters = clustersOf(text);
  const widths: number[] = new Array(clusters.length);
  let total = 0;
  let estimatedClusters = 0;
  for (let i = 0; i < clusters.length; i++) {
    const w = clusterWidth(clusters[i], fontPx, fallback);
    widths[i] = w.px;
    total += w.px;
    if (w.estimated) estimatedClusters++;
  }
  return { clusters, widths, total, estimatedClusters };
}

/** Estimated width in pixels of a string at the given font size. */
export function pixelWidth(text: string, fontPx: number, fallback?: FallbackMeasure): number {
  return measureText(normalizeText(text), fontPx, fallback).total;
}

/** Width of the "..." that replaces cut-off text. */
export function ellipsisWidth(fontPx: number): number {
  return (3 * (ADVANCE_UNITS.get(0x2e) ?? 569) * fontPx) / UNITS_PER_EM;
}

export interface Cut {
  truncated: boolean;
  visible: string;
  hidden: string;
  /** Width of the visible text plus the ellipsis when truncated. */
  visibleWidth: number;
}

/**
 * Cut measured text to fit `limit` pixels, keeping room for the ellipsis and
 * backing up to a word boundary (results pages cut between words).
 */
export function truncateMeasured(m: Measured, limit: number, ellipsisPx: number): Cut {
  if (m.total <= limit) return { truncated: false, visible: m.clusters.join(""), hidden: "", visibleWidth: m.total };
  let acc = 0;
  let keep = 0;
  for (let i = 0; i < m.clusters.length; i++) {
    if (acc + m.widths[i] + ellipsisPx > limit) break;
    acc += m.widths[i];
    keep = i + 1;
  }
  let cut = keep;
  if (m.clusters[keep] !== " ") {
    let j = keep - 1;
    while (j > 0 && m.clusters[j] !== " ") j--;
    if (j > 0) cut = j;
  }
  while (cut > 0 && m.clusters[cut - 1] === " ") cut--;
  let visibleWidth = ellipsisPx;
  for (let i = 0; i < cut; i++) visibleWidth += m.widths[i];
  return { truncated: true, visible: m.clusters.slice(0, cut).join(""), hidden: m.clusters.slice(cut).join("").trimStart(), visibleWidth };
}

/* -------------------------------------------------------------------------- */
/* Field analysis                                                              */
/* -------------------------------------------------------------------------- */

export type FieldStatus = "empty" | "short" | "good" | "long";

export interface DeviceView extends Cut {
  limit: number;
  /** limit - width; negative when the text is over the limit. */
  remaining: number;
  /** width / limit. */
  ratio: number;
}

export interface FieldResult {
  kind: FieldKind;
  device: Device;
  /** Normalised text that was measured. */
  text: string;
  /** Length in Unicode code points. */
  chars: number;
  words: number;
  fontPx: number;
  width: number;
  status: FieldStatus;
  /** Fits, but uses at least NEAR_RATIO of the limit. */
  near: boolean;
  /** View for the selected device. */
  view: DeviceView;
  byDevice: Record<Device, DeviceView>;
  /** Clusters measured by the fallback (emoji, non-Latin scripts). */
  estimatedClusters: number;
  avgCharPx: number;
  /** Rough number of characters of this text's kind that fit in the limit. */
  fitChars: number;
  /** The input contained line breaks, tabs or repeated spaces that were collapsed. */
  collapsedWhitespace: boolean;
  ellipsisPx: number;
}

export function analyzeField(
  raw: string,
  kind: FieldKind,
  device: Device,
  limits: Limits = DEFAULT_LIMITS,
  fallback?: FallbackMeasure,
): FieldResult {
  const text = normalizeText(raw);
  const fontPx = FONT_PX[kind];
  const m = measureText(text, fontPx, fallback);
  const ellipsisPx = ellipsisWidth(fontPx);
  const build = (d: Device): DeviceView => {
    const limit = limits[kind][d];
    return { ...truncateMeasured(m, limit, ellipsisPx), limit, remaining: limit - m.total, ratio: m.total / limit };
  };
  const byDevice = { desktop: build("desktop"), mobile: build("mobile") };
  const view = byDevice[device];
  const chars = Array.from(text).length;
  let status: FieldStatus;
  if (chars === 0) status = "empty";
  else if (view.truncated) status = "long";
  else if (chars < MIN_CHARS[kind]) status = "short";
  else status = "good";
  const avgCharPx = chars ? m.total / chars : 0;
  return {
    kind,
    device,
    text,
    chars,
    words: text ? text.split(" ").length : 0,
    fontPx,
    width: m.total,
    status,
    near: status === "good" && view.ratio >= NEAR_RATIO,
    view,
    byDevice,
    estimatedClusters: m.estimatedClusters,
    avgCharPx,
    fitChars: avgCharPx ? Math.floor(view.limit / avgCharPx) : 0,
    collapsedWhitespace: /[\t\r\n\f]| {2,}/.test(raw.trim()),
    ellipsisPx,
  };
}

/** Number of characters (code points) of the visible part of a cut. */
export function visibleChars(view: DeviceView): number {
  return Array.from(view.visible).length;
}

/* -------------------------------------------------------------------------- */
/* Pasted HTML: <title> and <meta name="description">                          */
/* -------------------------------------------------------------------------- */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  middot: "·",
  raquo: "»",
  laquo: "«",
  copy: "©",
  reg: "®",
  trade: "™",
  euro: "€",
  pound: "£",
  times: "×",
};

/** Decode the HTML entities that commonly appear in titles and descriptions. */
export function decodeEntities(s: string): string {
  return s.replace(/&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-zA-Z]+));/g, (whole, dec: string, hex: string, name: string) => {
    if (name) return NAMED_ENTITIES[name] ?? NAMED_ENTITIES[name.toLowerCase()] ?? whole;
    const cp = dec ? parseInt(dec, 10) : parseInt(hex, 16);
    if (!Number.isFinite(cp) || cp < 32 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return whole;
    return String.fromCodePoint(cp);
  });
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tag))) attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  return attrs;
}

export interface Extracted {
  text: string;
  /** True when the text was read out of a pasted <title> or <meta> tag. */
  extracted: boolean;
}

/**
 * If the input contains a <title> element (kind "title") or a
 * <meta name="description"> tag (kind "description"), return the text inside it
 * with entities decoded. Otherwise return the input unchanged.
 */
export function extractFromHtml(input: string, kind: FieldKind): Extracted {
  if (!input.includes("<")) return { text: input, extracted: false };
  if (kind === "title") {
    const m = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(input);
    if (m) return { text: decodeEntities(m[1]), extracted: true };
  } else {
    const tags = input.match(/<meta\b[^>]*>/gi) ?? [];
    for (const tag of tags) {
      const attrs = parseAttributes(tag);
      if (attrs.name?.toLowerCase() === "description" && attrs.content !== undefined) {
        return { text: decodeEntities(attrs.content), extracted: true };
      }
    }
  }
  return { text: input, extracted: false };
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function titleTag(title: string): string {
  return `<title>${escapeHtml(normalizeText(title))}</title>`;
}

export function metaDescriptionTag(description: string): string {
  return `<meta name="description" content="${escapeHtml(normalizeText(description))}">`;
}

/* -------------------------------------------------------------------------- */
/* Brand builder                                                               */
/* -------------------------------------------------------------------------- */

export const SEPARATORS = [
  { value: " | ", label: "Pipe ( | )" },
  { value: " - ", label: "Hyphen ( - )" },
  { value: " – ", label: "En dash ( – )" },
  { value: " — ", label: "Em dash ( — )" },
  { value: " · ", label: "Middle dot ( · )" },
  { value: " : ", label: "Colon ( : )" },
  { value: " » ", label: "Guillemet ( » )" },
] as const;

export type BrandPosition = "suffix" | "prefix";

/** Join a page title and a brand name. Returns "" when there is no page title. */
export function composeTitle(pageTitle: string, brand: string, separator: string, position: BrandPosition): string {
  const t = normalizeText(pageTitle);
  const b = normalizeText(brand);
  if (!t) return "";
  if (!b) return t;
  return position === "prefix" ? `${b}${separator}${t}` : `${t}${separator}${b}`;
}

/** Pixels left for the page title once the brand and separator take their share. */
export function roomForPageTitle(brand: string, separator: string, limit: number, fontPx = FONT_PX.title, fallback?: FallbackMeasure): number {
  const b = normalizeText(brand);
  if (!b) return limit;
  return limit - measureText(`${b}${separator}`, fontPx, fallback).total;
}

/* -------------------------------------------------------------------------- */
/* Keyword placement                                                           */
/* -------------------------------------------------------------------------- */

export interface KeywordInfo {
  keyword: string;
  /** exact phrase, all words somewhere, or not found */
  match: "exact" | "words" | "none";
  count: number;
  index: number;
  startPx: number;
  endPx: number;
  startRatio: number;
  /** The keyword sits entirely inside the part that is not cut off. */
  visible: boolean;
  front: boolean;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function analyzeKeyword(res: FieldResult, rawKeyword: string, fallback?: FallbackMeasure): KeywordInfo | null {
  const keyword = normalizeText(rawKeyword);
  if (!keyword || !res.text) return null;
  const base = { keyword, count: 0, index: -1, startPx: 0, endPx: 0, startRatio: 0, visible: false, front: false };
  const exact = new RegExp(escapeRegExp(keyword), "giu");
  const matches = res.text.match(exact);
  let index = -1;
  let matchLength = keyword.length;
  let match: KeywordInfo["match"] = "none";
  if (matches) {
    match = "exact";
    index = new RegExp(escapeRegExp(keyword), "iu").exec(res.text)!.index;
  } else {
    const words = keyword.split(" ").filter(Boolean);
    const positions = words.map((w) => new RegExp(escapeRegExp(w), "iu").exec(res.text));
    if (words.length > 1 && positions.every(Boolean)) {
      match = "words";
      const first = positions.reduce((a, b) => (a!.index <= b!.index ? a : b))!;
      index = first.index;
      matchLength = first[0].length;
    }
  }
  if (match === "none") return { ...base, match };
  const startPx = pixelWidth(res.text.slice(0, index), res.fontPx, fallback);
  const endPx = startPx + pixelWidth(res.text.slice(index, index + matchLength), res.fontPx, fallback);
  return {
    keyword,
    match,
    count: matches ? matches.length : 1,
    index,
    startPx,
    endPx,
    startRatio: startPx / res.view.limit,
    visible: !res.view.truncated || index + matchLength <= res.view.visible.length,
    front: startPx / res.view.limit <= FRONT_RATIO[res.kind],
  };
}

/* -------------------------------------------------------------------------- */
/* Checklists                                                                  */
/* -------------------------------------------------------------------------- */

export type CheckLevel = "pass" | "warn" | "fail" | "info";

export interface Check {
  id: string;
  level: CheckLevel;
  label: string;
  detail: string;
}

const STOP_WORDS = new Set(
  "a an and are as at be but by for from has have how in is it its of on or our that the their this to was we what when where which who why will with you your".split(" "),
);

const GENERIC_TITLES = new Set([
  "home",
  "homepage",
  "home page",
  "index",
  "untitled",
  "untitled document",
  "untitled page",
  "new page",
  "page",
  "page title",
  "title",
  "welcome",
  "default",
  "profile",
  "blog",
  "site",
  "website",
  "my website",
  "coming soon",
  "just another wordpress site",
  "document",
]);

const SEPARATOR_SPLIT_RE = /\s+[|–—·»•:~-]\s+|\s*\|\s*/;

function segmentsOf(text: string): string[] {
  return text.split(SEPARATOR_SPLIT_RE).map((s) => s.trim()).filter(Boolean);
}

function plainLabel(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, "").replace(/ {2,}/g, " ").trim();
}

function wordCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const w of text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []) {
    if (w.length < 3 || STOP_WORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return counts;
}

function capsRatio(text: string): { letters: number; ratio: number } {
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  const upper = (text.match(/\p{Lu}/gu) ?? []).length;
  return { letters, ratio: letters ? upper / letters : 0 };
}

const px = (n: number) => `${Math.round(n)} px`;

function shortSnippet(s: string, max = 28): string {
  const chars = Array.from(s);
  return chars.length > max ? `${chars.slice(0, max).join("").trimEnd()}...` : s;
}

function widthCheck(res: FieldResult, noun: string): Check {
  const v = res.view;
  const deviceName = res.device === "desktop" ? "desktop" : "mobile";
  if (res.status === "long") {
    return {
      id: "width",
      level: "fail",
      label: "Fits the width limit",
      detail: `Estimated ${px(res.width)} against a ${px(v.limit)} ${deviceName} limit. About ${px(res.width - v.limit)} would be cut off, starting at "${shortSnippet(v.hidden)}".`,
    };
  }
  if (res.near) {
    return {
      id: "width",
      level: "warn",
      label: "Fits the width limit",
      detail: `Only ${px(v.remaining)} of room left. Real rendering can differ by a few pixels, so keep a small margin.`,
    };
  }
  return { id: "width", level: "pass", label: "Fits the width limit", detail: `${px(res.width)} of ${px(v.limit)}; ${px(v.remaining)} to spare on ${deviceName}. The ${noun} is shown in full.` };
}

function keywordChecks(res: FieldResult, kw: KeywordInfo | null | undefined, noun: string): Check[] {
  if (!kw) return [];
  if (kw.match === "none") {
    return [{ id: "keyword", level: "warn", label: "Contains your target keyword", detail: `"${kw.keyword}" does not appear in the ${noun}.` }];
  }
  const out: Check[] = [];
  if (kw.match === "words") {
    out.push({ id: "keyword", level: "info", label: "Contains your target keyword", detail: `All the words of "${kw.keyword}" appear, but not together as a phrase.` });
  } else if (!kw.visible) {
    out.push({ id: "keyword", level: "fail", label: "Keyword survives the cut", detail: `"${kw.keyword}" sits in the part that is cut off on ${res.device}. Move it earlier or shorten the text before it.` });
  } else {
    out.push({ id: "keyword", level: "pass", label: "Contains your target keyword", detail: `"${kw.keyword}" appears and stays visible.` });
  }
  if (kw.match === "exact" && kw.visible) {
    out.push(
      kw.front
        ? { id: "front", level: "pass", label: "Keyword is near the start", detail: `It starts about ${px(kw.startPx)} in (${Math.round(kw.startRatio * 100)}% of the width).` }
        : { id: "front", level: "info", label: "Keyword is near the start", detail: `It starts about ${px(kw.startPx)} in (${Math.round(kw.startRatio * 100)}% of the width). Earlier placement is easier to notice, if it still reads naturally.` },
    );
  }
  if (kw.count >= 2) {
    out.push({ id: "keyword-repeat", level: "warn", label: "Keyword is not repeated", detail: `"${kw.keyword}" appears ${kw.count} times. Repeating it rarely helps and can read as stuffing.` });
  }
  return out;
}

function estimateCheck(res: FieldResult): Check[] {
  if (!res.estimatedClusters) return [];
  return [
    {
      id: "estimate",
      level: "info",
      label: "Some characters are estimated",
      detail: `${res.estimatedClusters} character${res.estimatedClusters === 1 ? "" : "s"} (emoji or a script outside the width table) were measured with your browser's fonts or a rule of thumb, so this estimate is less certain.`,
    },
  ];
}

export interface TitleCheckOptions {
  keyword?: KeywordInfo | null;
  /** Brand name appended by the brand builder, if any. */
  brand?: string;
  /** Current calendar year, for the stale-year check. */
  year: number;
}

/**
 * Checklist based on the title-link guidance in Google's Search Central
 * documentation: avoid vague labels such as "Home", boilerplate and repeated
 * text, and unnecessarily long or verbose titles.
 */
export function titleChecks(res: FieldResult, opts: TitleCheckOptions): Check[] {
  if (res.status === "empty") return [];
  const checks: Check[] = [widthCheck(res, "title")];

  checks.push(
    res.status === "short"
      ? { id: "length", level: "warn", label: "Specific enough", detail: `${res.chars} characters. Titles under ${MIN_CHARS.title} characters often leave useful words unused.` }
      : { id: "length", level: "pass", label: "Specific enough", detail: `${res.chars} characters, ${res.words} word${res.words === 1 ? "" : "s"}.` },
  );

  const segs = segmentsOf(res.text);
  const whole = plainLabel(res.text);
  const vague = segs.find((s) => GENERIC_TITLES.has(plainLabel(s)));
  if (GENERIC_TITLES.has(whole)) {
    checks.push({ id: "generic", level: "fail", label: "Not a generic label", detail: `"${res.text}" says nothing about the page. Google's documentation names vague titles such as "Home" and "Profile" as ones to avoid.` });
  } else if (vague) {
    checks.push({ id: "generic", level: "warn", label: "Not a generic label", detail: `"${vague}" is a vague label. Describe the page instead, for example what the home page is for.` });
  } else {
    checks.push({ id: "generic", level: "pass", label: "Not a generic label", detail: "No vague placeholder such as Home, Untitled or Welcome." });
  }

  const counts = wordCounts(res.text);
  const repeated = [...counts.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])[0];
  const commas = (res.text.match(/,/g) ?? []).length;
  if (repeated) {
    checks.push({ id: "stuffing", level: "warn", label: "No keyword stuffing", detail: `"${repeated[0]}" appears ${repeated[1]} times. Repeated words and boilerplate can lead Google to write its own title.` });
  } else if (segs.length >= 4) {
    checks.push({ id: "stuffing", level: "warn", label: "No keyword stuffing", detail: `${segs.length} parts joined by separators reads like a list of keywords. Two parts (page, brand) is the usual maximum.` });
  } else if (commas >= 3) {
    checks.push({ id: "stuffing", level: "warn", label: "No keyword stuffing", detail: `${commas} commas suggest a list of phrases. Write one clear description instead.` });
  } else {
    checks.push({ id: "stuffing", level: "pass", label: "No keyword stuffing", detail: "No word repeats three times and there is no long list of separators." });
  }

  const dupSeg = segs.find((s, i) => segs.findIndex((o) => o.toLowerCase() === s.toLowerCase()) !== i);
  const brand = normalizeText(opts.brand ?? "");
  const brandTimes = brand ? (res.text.match(new RegExp(escapeRegExp(brand), "giu")) ?? []).length : 0;
  if (dupSeg) {
    checks.push({ id: "repeat", level: "warn", label: "No repeated brand or phrase", detail: `"${dupSeg}" appears twice between separators.` });
  } else if (brandTimes >= 2) {
    checks.push({ id: "repeat", level: "warn", label: "No repeated brand or phrase", detail: `The brand "${brand}" appears ${brandTimes} times. Once is enough.` });
  } else {
    checks.push({ id: "repeat", level: "pass", label: "No repeated brand or phrase", detail: "Each part of the title is different." });
  }

  const caps = capsRatio(res.text);
  checks.push(
    caps.letters >= 8 && caps.ratio > 0.7
      ? { id: "caps", level: "warn", label: "Not written in capitals", detail: "Mostly capital letters are wide (so they use up the limit fast) and read as shouting." }
      : { id: "caps", level: "pass", label: "Not written in capitals", detail: "Normal capitalization." },
  );

  const staleYears = [...new Set((res.text.match(/\b20\d{2}\b/g) ?? []).map(Number))].filter((y) => y < opts.year);
  if (staleYears.length) {
    checks.push({ id: "year", level: "warn", label: "No out-of-date year", detail: `Mentions ${staleYears.join(", ")}. If the page is year-stamped, update or remove the year so it does not look stale.` });
  }

  checks.push(...keywordChecks(res, opts.keyword, "title"), ...estimateCheck(res));
  return checks;
}

export interface DescriptionCheckOptions {
  keyword?: KeywordInfo | null;
  /** The page title, to catch descriptions that just repeat it. */
  title?: string;
}

export function descriptionChecks(res: FieldResult, opts: DescriptionCheckOptions = {}): Check[] {
  if (res.status === "empty") return [];
  const checks: Check[] = [widthCheck(res, "description")];

  const other: Device = res.device === "desktop" ? "mobile" : "desktop";
  const otherView = res.byDevice[other];
  checks.push(
    res.status === "short"
      ? { id: "length", level: "warn", label: "Long enough to be useful", detail: `${res.chars} characters. Under ${MIN_CHARS.description} characters gives searchers little to go on.` }
      : { id: "length", level: "pass", label: "Long enough to be useful", detail: `${res.chars} characters, ${res.words} words.` },
  );
  checks.push(
    otherView.truncated
      ? { id: "other-device", level: "info", label: `Also check ${other}`, detail: `On ${other} the limit is ${px(otherView.limit)}, so it would be cut after roughly ${visibleChars(otherView)} characters. Put the main message before that point.` }
      : { id: "other-device", level: "pass", label: `Also fits on ${other}`, detail: `Within the ${px(otherView.limit)} ${other} limit as well.` },
  );

  const title = normalizeText(opts.title ?? "");
  if (title) {
    const lowerDesc = res.text.toLowerCase();
    const lowerTitle = title.toLowerCase();
    checks.push(
      lowerDesc === lowerTitle || lowerDesc.startsWith(lowerTitle)
        ? { id: "title-repeat", level: "warn", label: "Adds something the title does not", detail: "The description repeats the title. Use the space for a detail, benefit or reason to click." }
        : { id: "title-repeat", level: "pass", label: "Adds something the title does not", detail: "It does not simply repeat the title." },
    );
  }

  const bangs = (res.text.match(/!/g) ?? []).length;
  const caps = capsRatio(res.text);
  if (bangs >= 3 || /[!?]{2,}/.test(res.text) || (caps.letters >= 12 && caps.ratio > 0.6)) {
    checks.push({ id: "tone", level: "warn", label: "Calm punctuation and capitals", detail: "Stacked exclamation marks or mostly capital letters look spammy in results and use extra width." });
  } else {
    checks.push({ id: "tone", level: "pass", label: "Calm punctuation and capitals", detail: "No stacked punctuation or shouting." });
  }

  if (res.collapsedWhitespace) {
    checks.push({ id: "whitespace", level: "info", label: "Line breaks were collapsed", detail: "Line breaks, tabs and repeated spaces are measured as single spaces, the way a results page shows them." });
  }

  checks.push(...keywordChecks(res, opts.keyword, "description"), ...estimateCheck(res));
  return checks;
}

/* -------------------------------------------------------------------------- */
/* Small formatting helpers shared with the UI                                 */
/* -------------------------------------------------------------------------- */

export function statusLabel(status: FieldStatus, near: boolean): string {
  if (status === "empty") return "Empty";
  if (status === "long") return "Too long";
  if (status === "short") return "Too short";
  return near ? "Tight fit" : "Good fit";
}
