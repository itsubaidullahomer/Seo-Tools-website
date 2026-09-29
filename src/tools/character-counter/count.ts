/**
 * Pure counting logic for the Character Counter. No React, no DOM – everything
 * here can be unit-tested with plain Node.
 *
 * Terminology used throughout:
 *  - grapheme  = one user-perceived character ("é", "👍🏽", "🇺🇸" are each 1)
 *  - code unit = one UTF-16 unit, what JavaScript's `.length` reports
 *  - code point = one Unicode scalar value
 *  - byte      = one byte of the UTF-8 encoding
 */

/** How a limit preset measures text. */
export type LimitRule = "graphemes" | "units" | "x" | "sms";

export interface Preset {
  id: string;
  label: string;
  limit: number;
  rule: LimitRule;
  group: string;
  /** Short note shown next to the progress bar. */
  note?: string;
}

/** Above this many code units the tool skips grapheme segmentation to stay responsive. */
export const HUGE_TEXT_UNITS = 1_000_000;

export const X_URL_WEIGHT = 23;

export const NO_LIMIT_PRESET_ID = "none";
export const CUSTOM_PRESET_ID = "custom";

export const PRESETS: Preset[] = [
  { id: NO_LIMIT_PRESET_ID, label: "No limit", limit: 0, rule: "graphemes", group: "" },
  { id: "x-post", label: "X (Twitter) post – 280", limit: 280, rule: "x", group: "Social media", note: "URLs count as 23, emoji and CJK characters as 2. Premium accounts get 25,000." },
  { id: "x-bio", label: "X (Twitter) bio – 160", limit: 160, rule: "graphemes", group: "Social media" },
  { id: "instagram-caption", label: "Instagram caption – 2,200", limit: 2200, rule: "graphemes", group: "Social media", note: "Includes hashtags and spaces. The feed shows about 125 characters before “more”." },
  { id: "instagram-bio", label: "Instagram bio – 150", limit: 150, rule: "graphemes", group: "Social media" },
  { id: "threads-post", label: "Threads post – 500", limit: 500, rule: "graphemes", group: "Social media" },
  { id: "bluesky-post", label: "Bluesky post – 300", limit: 300, rule: "graphemes", group: "Social media", note: "Bluesky counts grapheme clusters, so every emoji is 1." },
  { id: "facebook-post", label: "Facebook post – 63,206", limit: 63206, rule: "graphemes", group: "Social media", note: "The feed collapses posts after roughly 480 characters." },
  { id: "linkedin-post", label: "LinkedIn post – 3,000", limit: 3000, rule: "graphemes", group: "Social media", note: "The feed truncates after about 210 characters with “…more”." },
  { id: "linkedin-headline", label: "LinkedIn headline – 220", limit: 220, rule: "graphemes", group: "Social media" },
  { id: "linkedin-about", label: "LinkedIn About section – 2,600", limit: 2600, rule: "graphemes", group: "Social media" },
  { id: "tiktok-caption", label: "TikTok caption – 4,000", limit: 4000, rule: "graphemes", group: "Social media" },
  { id: "tiktok-bio", label: "TikTok bio – 80", limit: 80, rule: "graphemes", group: "Social media" },
  { id: "youtube-title", label: "YouTube title – 100", limit: 100, rule: "graphemes", group: "Social media", note: "Search results and suggestions cut titles at about 60–70 characters." },
  { id: "youtube-description", label: "YouTube description – 5,000", limit: 5000, rule: "graphemes", group: "Social media" },
  { id: "pinterest-title", label: "Pinterest Pin title – 100", limit: 100, rule: "graphemes", group: "Social media" },
  { id: "pinterest-description", label: "Pinterest Pin description – 500", limit: 500, rule: "graphemes", group: "Social media" },
  { id: "reddit-title", label: "Reddit post title – 300", limit: 300, rule: "graphemes", group: "Social media" },
  { id: "discord-message", label: "Discord message – 2,000", limit: 2000, rule: "graphemes", group: "Social media", note: "Nitro subscribers can send 4,000." },
  { id: "google-title", label: "Google title tag – 60", limit: 60, rule: "graphemes", group: "SEO & ads", note: "Google truncates by pixel width (about 600 px), so 60 is a safe guide, not a rule." },
  { id: "meta-description", label: "Meta description – 160", limit: 160, rule: "graphemes", group: "SEO & ads", note: "Desktop shows about 155–160 characters, mobile about 120." },
  { id: "google-ads-headline", label: "Google Ads headline – 30", limit: 30, rule: "graphemes", group: "SEO & ads" },
  { id: "google-ads-description", label: "Google Ads description – 90", limit: 90, rule: "graphemes", group: "SEO & ads" },
  { id: "email-subject", label: "Email subject line – 60", limit: 60, rule: "graphemes", group: "SEO & ads", note: "Most inboxes show 40–60 characters; mobile clients show fewer." },
  { id: "sms", label: "SMS text message – 160", limit: 160, rule: "sms", group: "Messaging", note: "160 characters with the GSM-7 alphabet, 70 if the message contains any other character (most emoji, curly quotes, many accented letters)." },
  { id: "excel-cell", label: "Excel cell – 32,767", limit: 32767, rule: "graphemes", group: "Other" },
  { id: CUSTOM_PRESET_ID, label: "Custom limit…", limit: 0, rule: "graphemes", group: "Other" },
];

export function getPreset(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[PRESETS.length - 1];
}

/* ---------------------------------------------------------------------------
 * Grapheme segmentation
 * ------------------------------------------------------------------------- */

/**
 * Characters that can make a grapheme cluster longer than one code unit:
 * surrogates (all emoji and other astral code points), combining marks,
 * zero-width joiner, variation selectors, Hangul conjoining jamo and CR.
 */
const COMPLEX_RE = /[\p{M}‍︎️\u{10000}-\u{10ffff}ᄀ-ᇿ\r]/u;

let segmenter: Intl.Segmenter | null | undefined;

function getSegmenter(): Intl.Segmenter | null {
  if (segmenter !== undefined) return segmenter;
  try {
    segmenter = typeof Intl !== "undefined" && typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  } catch {
    segmenter = null;
  }
  return segmenter;
}

const EXTEND_RE = /^[\p{M}︎️\u{1f3fb}-\u{1f3ff}\u{e0020}-\u{e007f}]$/u;
const RI_RE = /^\p{Regional_Indicator}$/u;

/** Approximate grapheme splitter for browsers without Intl.Segmenter. */
export function splitGraphemesFallback(text: string): string[] {
  const out: string[] = [];
  let current = "";
  let pendingJoiner = false;
  let riCount = 0;
  for (const ch of text) {
    if (current === "") {
      current = ch;
      riCount = RI_RE.test(ch) ? 1 : 0;
      pendingJoiner = false;
      continue;
    }
    if (ch === "\n" && current === "\r") {
      current += ch;
      continue;
    }
    if (pendingJoiner) {
      current += ch;
      pendingJoiner = false;
      continue;
    }
    if (ch === "‍") {
      current += ch;
      pendingJoiner = true;
      continue;
    }
    if (EXTEND_RE.test(ch)) {
      current += ch;
      continue;
    }
    if (riCount === 1 && RI_RE.test(ch)) {
      current += ch;
      riCount = 2;
      continue;
    }
    out.push(current);
    current = ch;
    riCount = RI_RE.test(ch) ? 1 : 0;
  }
  if (current) out.push(current);
  return out;
}

/** Iterate over grapheme clusters, using Intl.Segmenter when available. */
export function* graphemesOf(text: string): Generator<string> {
  if (!text) return;
  if (!COMPLEX_RE.test(text)) {
    for (const ch of text) yield ch;
    return;
  }
  const seg = getSegmenter();
  if (seg) {
    for (const s of seg.segment(text)) yield s.segment;
    return;
  }
  yield* splitGraphemesFallback(text);
}

/** Count code points: every surrogate pair is one code point made of two code units. */
export function countCodePoints(text: string): number {
  return text.length - (text.match(/[\ud800-\udbff][\udc00-\udfff]/g)?.length ?? 0);
}

/**
 * Count user-perceived characters. Returns `exact: false` when the text is so
 * long that segmentation was skipped and code points were counted instead.
 */
export function countGraphemes(text: string): { count: number; exact: boolean } {
  if (!text) return { count: 0, exact: true };
  if (!COMPLEX_RE.test(text)) return { count: text.length, exact: true };
  if (text.length > HUGE_TEXT_UNITS) return { count: countCodePoints(text), exact: false };
  let n = 0;
  const it = graphemesOf(text);
  while (!it.next().done) n++;
  return { count: n, exact: true };
}

/* ---------------------------------------------------------------------------
 * Bytes
 * ------------------------------------------------------------------------- */

const encoder: TextEncoder | null = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

/** Length of the UTF-8 encoding in bytes. Lone surrogates encode as U+FFFD (3 bytes), like TextEncoder. */
export function utf8Bytes(text: string): number {
  if (encoder) return encoder.encode(text).length;
  let bytes = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    bytes += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
  }
  return bytes;
}

/* ---------------------------------------------------------------------------
 * General statistics
 * ------------------------------------------------------------------------- */

export interface TextStats {
  /** User-perceived characters (grapheme clusters). */
  graphemes: number;
  /** Grapheme clusters excluding all whitespace. */
  graphemesNoSpaces: number;
  /** UTF-16 code units – what JavaScript, Java and many databases count. */
  codeUnits: number;
  codePoints: number;
  bytes: number;
  letters: number;
  digits: number;
  spaces: number;
  punctuation: number;
  words: number;
  sentences: number;
  lines: number;
  paragraphs: number;
  /** False when the text was too long to segment exactly. */
  exact: boolean;
}

function countMatches(text: string, re: RegExp): number {
  return text.match(re)?.length ?? 0;
}

export function analyzeText(text: string): TextStats {
  if (!text) {
    return {
      graphemes: 0,
      graphemesNoSpaces: 0,
      codeUnits: 0,
      codePoints: 0,
      bytes: 0,
      letters: 0,
      digits: 0,
      spaces: 0,
      punctuation: 0,
      words: 0,
      sentences: 0,
      lines: 0,
      paragraphs: 0,
      exact: true,
    };
  }
  const g = countGraphemes(text);
  const noSpaceText = text.replace(/\s+/g, "");
  const gNoSpaces = countGraphemes(noSpaceText);
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const sentences = trimmed ? (trimmed.match(/[^.!?…]+[.!?…]+["”’)]*(\s|$)|[^.!?…]+$/g) ?? []).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const lines = text.split(/\r\n|\r|\n/).length;

  return {
    graphemes: g.count,
    graphemesNoSpaces: gNoSpaces.count,
    codeUnits: text.length,
    codePoints: countCodePoints(text),
    bytes: utf8Bytes(text),
    letters: countMatches(text, /\p{L}/gu),
    digits: countMatches(text, /\p{Nd}/gu),
    spaces: text.length - noSpaceText.length,
    punctuation: countMatches(text, /[\p{P}\p{S}]/gu),
    words,
    sentences,
    lines,
    paragraphs,
    exact: g.exact && gNoSpaces.exact,
  };
}

/* ---------------------------------------------------------------------------
 * X (Twitter) weighted length – follows the twitter-text v3 rules
 * ------------------------------------------------------------------------- */

/**
 * URL detection close to what X links: scheme or www. prefixes, or a bare
 * domain with a common TLD. X replaces every link with a 23-character t.co URL.
 */
const URL_RE =
  /(?:https?:\/\/|www\.)[^\s<>"'()]+|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|edu|gov|mil|int|io|co|ai|app|dev|me|us|uk|ca|de|fr|es|it|nl|se|no|dk|fi|pl|ch|at|be|ie|au|nz|in|jp|kr|cn|br|mx|ar|za|ru|info|biz|tv|xyz|ly|gg|so|to|fm|cc|news|blog|store|shop|tech|online|site|social|live|media|design|studio|club|world|org\.uk|co\.uk|com\.au|com\.br)\b(?:\/[^\s<>"'()]*)?/gi;

/** Code points X weights as 1; everything else weighs 2. */
function isXLightCodePoint(cp: number): boolean {
  return cp <= 4351 || (cp >= 8192 && cp <= 8205) || (cp >= 8208 && cp <= 8223) || (cp >= 8242 && cp <= 8247);
}

const EMOJI_GRAPHEME_RE = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️|\p{Regional_Indicator}|⃣|‍/u;

/** Weight of a single grapheme cluster under X's rules (emoji are always 2). */
export function xGraphemeWeight(grapheme: string): number {
  if (EMOJI_GRAPHEME_RE.test(grapheme)) return 2;
  let w = 0;
  for (const ch of grapheme) w += isXLightCodePoint(ch.codePointAt(0) ?? 0) ? 1 : 2;
  return w;
}

export interface XCount {
  weighted: number;
  urls: number;
}

/** Weighted length of a post the way X counts it toward the 280 limit. */
export function xWeightedLength(text: string): XCount {
  if (!text) return { weighted: 0, urls: 0 };
  const urls = text.match(URL_RE)?.length ?? 0;
  let weighted = urls * X_URL_WEIGHT;
  for (const part of text.split(URL_RE)) {
    if (!part) continue;
    for (const g of graphemesOf(part)) weighted += xGraphemeWeight(g);
  }
  return { weighted, urls };
}

/* ---------------------------------------------------------------------------
 * SMS – GSM-7 vs UCS-2
 * ------------------------------------------------------------------------- */

const GSM7_BASIC = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà",
);
const GSM7_EXTENDED = new Set("^{}\\[~]|€");

export interface SmsInfo {
  encoding: "GSM-7" | "UCS-2";
  /** Septets (GSM-7) or UTF-16 code units (UCS-2) used. */
  units: number;
  /** Capacity of a single, unsplit message. */
  single: number;
  /** Capacity of each part once the message is split. */
  perSegment: number;
  segments: number;
}

/** Weight of one character in the GSM-7 alphabet, or 0 if it is not representable. */
export function gsm7Weight(ch: string): number {
  if (GSM7_BASIC.has(ch)) return 1;
  if (GSM7_EXTENDED.has(ch)) return 2;
  return 0;
}

export function smsInfo(text: string): SmsInfo {
  let septets = 0;
  let gsm = true;
  for (const ch of text) {
    const w = gsm7Weight(ch);
    if (w === 0) {
      gsm = false;
      break;
    }
    septets += w;
  }
  const units = gsm ? septets : text.length;
  const single = gsm ? 160 : 70;
  const perSegment = gsm ? 153 : 67;
  const segments = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / perSegment);
  return { encoding: gsm ? "GSM-7" : "UCS-2", units, single, perSegment, segments };
}

/* ---------------------------------------------------------------------------
 * Measuring against a limit and trimming to fit
 * ------------------------------------------------------------------------- */

/** How much of the limit the text uses under the given rule. */
export function measure(text: string, rule: LimitRule, stats: TextStats): number {
  switch (rule) {
    case "x":
      return xWeightedLength(text).weighted;
    case "sms":
      return smsInfo(text).units;
    case "units":
      return stats.codeUnits;
    default:
      return stats.graphemes;
  }
}

/** Weight of one grapheme under a rule (URLs handled separately for X). */
function tokenWeight(g: string, rule: LimitRule, smsEncoding: "GSM-7" | "UCS-2"): number {
  switch (rule) {
    case "x":
      return xGraphemeWeight(g);
    case "units":
      return g.length;
    case "sms":
      if (smsEncoding === "UCS-2") return g.length;
      let w = 0;
      for (const ch of g) w += gsm7Weight(ch);
      return w;
    default:
      return 1;
  }
}

/**
 * Return the longest prefix of `text` that fits within `limit` under `rule`,
 * preferring to cut at a word boundary unless that would throw away a large
 * part of the budget (a single very long token such as a URL). Trailing
 * whitespace is removed.
 */
export function trimToLimit(text: string, rule: LimitRule, limit: number): string {
  if (limit <= 0 || !text) return "";
  const smsEncoding = rule === "sms" ? smsInfo(text).encoding : "GSM-7";

  // Tokens: for X a URL is a single 23-weight token; otherwise one grapheme each.
  const tokens: { text: string; weight: number }[] = [];
  const pushPlain = (s: string) => {
    for (const g of graphemesOf(s)) tokens.push({ text: g, weight: tokenWeight(g, rule, smsEncoding) });
  };
  if (rule === "x") {
    let last = 0;
    for (const m of text.matchAll(URL_RE)) {
      const idx = m.index ?? 0;
      pushPlain(text.slice(last, idx));
      tokens.push({ text: m[0], weight: X_URL_WEIGHT });
      last = idx + m[0].length;
      if (tokens.length > limit * 2) break;
    }
    if (tokens.length <= limit * 2) pushPlain(text.slice(last));
  } else {
    // Only the beginning of the text can possibly fit.
    pushPlain(text.slice(0, Math.min(text.length, limit * 4 + 16)));
  }

  let used = 0;
  let cut = 0;
  let lastBoundary = -1;
  let usedAtBoundary = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^\s+$/.test(t.text)) {
      lastBoundary = i;
      usedAtBoundary = used;
    }
    if (used + t.weight > limit) break;
    used += t.weight;
    cut = i + 1;
  }
  if (cut >= tokens.length) return text.trimEnd();

  const nextIsBoundary = /^\s+$/.test(tokens[cut].text);
  const lostByBackingOff = limit - usedAtBoundary;
  if (!nextIsBoundary && lastBoundary > 0 && lostByBackingOff <= Math.max(25, limit * 0.4)) cut = lastBoundary;

  return tokens
    .slice(0, cut)
    .map((t) => t.text)
    .join("")
    .trimEnd();
}
