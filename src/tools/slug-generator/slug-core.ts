/**
 * Pure slug logic for the URL Slug Generator. No DOM, no React, so it can be
 * unit-tested in plain Node.
 *
 * Pipeline for one string:
 *   1. strip HTML tags and decode common entities
 *   2. join thousands separators (1,000 -> 1000) and delete apostrophes
 *   3. optionally spell out & @ % +
 *   4. transliterate to A-Z (or keep Unicode letters)
 *   5. lowercase, split into words, drop stop words
 *   6. join with the separator and cut to the maximum length
 */

export type Separator = "-" | "_";
export type Charset = "transliterate" | "unicode";

export interface SlugOptions {
  separator: Separator;
  lowercase: boolean;
  removeStopWords: boolean;
  charset: Charset;
  /** ä -> ae, ö -> oe, ü -> ue instead of a, o, u. Only used when charset is "transliterate". */
  germanUmlauts: boolean;
  /** & -> and, @ -> at, % -> percent, + -> plus. */
  spellSymbols: boolean;
  /** Maximum slug length in characters, or null for no limit. */
  maxLength: number | null;
  /** When cutting to maxLength, drop back to the last whole word. */
  wholeWords: boolean;
}

export interface SlugResult {
  slug: string;
  /** Number of words in the slug. */
  words: number;
  stopWordsRemoved: number;
  /** Every word was a stop word, so none were removed. */
  onlyStopWords: boolean;
  /** The slug was shortened to fit maxLength. */
  truncated: boolean;
  /** Letters or digits that have no Latin equivalent and were skipped (transliterate mode). */
  dropped: string[];
}

export interface BatchRow extends SlugResult {
  input: string;
  blank: boolean;
  /** A -2, -3 ... suffix was added to avoid a duplicate. */
  renamed: boolean;
}

export const DEFAULT_OPTIONS: SlugOptions = {
  separator: "-",
  lowercase: true,
  removeStopWords: false,
  charset: "transliterate",
  germanUmlauts: false,
  spellSymbols: true,
  maxLength: null,
  wholeWords: true,
};

/** Short, deliberately conservative English list: articles, conjunctions, prepositions, be-verbs. */
export const STOP_WORD_LIST = [
  "a", "an", "the", "and", "or", "but", "nor", "of", "to", "in", "on", "at", "by", "for", "with", "from", "as",
  "is", "are", "was", "were", "be", "been", "it", "its", "this", "that", "these", "those", "into", "than", "then", "if",
];
const STOP_WORDS = new Set(STOP_WORD_LIST);

/* ------------------------------ transliteration ----------------------------- */

const LATIN_EXTRA: Record<string, string> = {
  ß: "ss", ẞ: "SS", æ: "ae", Æ: "AE", œ: "oe", Œ: "OE", ø: "o", Ø: "O", đ: "d", Đ: "D", ð: "d", Ð: "D",
  þ: "th", Þ: "Th", ł: "l", Ł: "L", ı: "i", ħ: "h", Ħ: "H", ŧ: "t", Ŧ: "T", ŋ: "ng", Ŋ: "Ng", ĳ: "ij", Ĳ: "IJ",
  ſ: "s", ŀ: "l", Ŀ: "L", ĸ: "k", ƒ: "f",
};

const GERMAN: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue" };

/** Simplified Russian scheme plus common Ukrainian, Belarusian, Serbian and Macedonian letters. */
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  і: "i", ї: "yi", є: "ye", ґ: "g", ў: "u",
  ђ: "dj", ј: "j", љ: "lj", њ: "nj", ћ: "c", џ: "dz", ѓ: "gj", ќ: "kj", ѕ: "dz",
};

/** Simplified modern Greek (accents are removed first; digraphs are handled in code). */
const GREEK: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x",
  ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o",
};
/** Greek letters that make an "αυ"/"ευ" pair sound like "av"/"ev" (vowels and voiced consonants). */
const GREEK_VOICED = new Set([..."βγδζλμνραεηιουω"]);

const isUpper = (ch: string) => ch !== ch.toLowerCase();

/** Give a lowercase replacement the case of the source letter ("Щ" -> "Shch", "ЩУКА" -> "SHCHUKA"). */
function matchCase(rep: string, source: string, next: string | undefined): string {
  if (!rep || !isUpper(source)) return rep;
  if (next !== undefined && isUpper(next)) return rep.toUpperCase();
  return rep.charAt(0).toUpperCase() + rep.slice(1);
}

const greekBase = (ch: string | undefined) => (ch === undefined ? "" : ch.normalize("NFD").charAt(0).toLowerCase());

/**
 * Convert text to ASCII. Latin diacritics are stripped, German umlauts optionally
 * expanded, Cyrillic and Greek transliterated. Punctuation and symbols become spaces.
 * Letters and digits with no Latin equivalent (CJK, Arabic, ...) become spaces too and
 * are reported in `dropped`.
 */
export function transliterate(input: string, germanUmlauts: boolean): { text: string; dropped: string[] } {
  const chars = Array.from(input.normalize("NFC"));
  const dropped: string[] = [];
  let out = "";

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch.charCodeAt(0) < 0x80) {
      out += ch;
      continue;
    }
    const next = chars[i + 1];
    const lower = ch.toLowerCase();

    if (germanUmlauts && GERMAN[lower] !== undefined) {
      out += matchCase(GERMAN[lower], ch, next);
      continue;
    }
    if (LATIN_EXTRA[ch] !== undefined) {
      out += LATIN_EXTRA[ch];
      continue;
    }
    if (CYRILLIC[lower] !== undefined) {
      out += matchCase(CYRILLIC[lower], ch, next);
      continue;
    }
    const base = greekBase(ch);
    if (GREEK[base] !== undefined) {
      const nextBase = greekBase(next);
      if (base === "ο" && nextBase === "υ") {
        out += matchCase("ou", ch, next);
        i++;
      } else if ((base === "α" || base === "ε") && nextBase === "υ") {
        const after = greekBase(chars[i + 2]);
        const voiced = after !== "" && GREEK_VOICED.has(after);
        out += matchCase(base === "α" ? (voiced ? "av" : "af") : voiced ? "ev" : "ef", ch, next);
        i++;
      } else {
        out += matchCase(GREEK[base], ch, next);
      }
      continue;
    }
    if (/\p{M}/u.test(ch)) continue; // stray combining mark
    if (!/[\p{L}\p{N}]/u.test(ch)) {
      out += " "; // punctuation, symbols, emoji, dashes
      continue;
    }
    // Accented Latin, full-width forms, ligatures, superscripts, roman numerals ...
    const flat = ch.normalize("NFKD").replace(/\p{M}/gu, "");
    if (/^[\x00-\x7f]+$/.test(flat) && flat.trim() !== "") {
      out += flat;
    } else {
      out += " ";
      if (!dropped.includes(ch)) dropped.push(ch);
    }
  }
  return { text: out, dropped };
}

/* -------------------------------- preprocessing ----------------------------- */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", nbsp: " ", quot: " ", apos: "", lt: " ", gt: " ", ndash: " ", mdash: " ", hellip: " ",
  rsquo: "", lsquo: "", ldquo: " ", rdquo: " ",
  szlig: "ß", aelig: "æ", AElig: "Æ", oelig: "œ", OElig: "Œ", eth: "ð", ETH: "Ð", thorn: "þ", THORN: "Þ",
  oslash: "ø", Oslash: "Ø",
};
const ACCENT_MARKS: Record<string, string> = {
  acute: "\u0301", grave: "\u0300", circ: "\u0302", uml: "\u0308", tilde: "\u0303", ring: "\u030a", cedil: "\u0327", caron: "\u030c",
};

/** Decode one named entity: Latin accent entities (&eacute;), a few symbols, anything else becomes a space. */
function decodeNamedEntity(name: string): string {
  const key = /^(AMP|LT|GT|QUOT)$/.test(name) ? name.toLowerCase() : name;
  if (Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, key)) return NAMED_ENTITIES[key];
  const accent = /^([A-Za-z])(acute|grave|circ|uml|tilde|ring|cedil|caron)$/.exec(name);
  if (accent) return (accent[1] + ACCENT_MARKS[accent[2]]).normalize("NFC");
  return " ";
}

/**
 * Real HTML tag names only, so pasted headlines such as "Array<string> explained" or
 * "Vec<T> in Rust" keep their words. Anything else in angle brackets is treated as text
 * (but "<b ...>" is a real tag, so "a<b and c>d" loses "b and c").
 */
const HTML_TAG =
  /<\/?(?:a|abbr|article|aside|b|blockquote|br|button|center|cite|code|dd|del|div|dl|dt|em|figure|figcaption|font|footer|form|h[1-6]|header|hr|i|iframe|img|input|ins|kbd|label|li|main|mark|nav|ol|p|pre|q|s|section|small|span|strike|strong|sub|summary|sup|table|tbody|td|tfoot|th|thead|time|tr|u|ul|wbr)(?=[\s/>])[^>]*>/gi;

/** Remove HTML tags and decode the entities that show up in pasted titles. */
export function cleanMarkup(text: string): string {
  if (!/[<&]/.test(text)) return text;
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(HTML_TAG, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (_m, body: string) => {
      if (body[0] === "#") {
        const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
        if (!Number.isFinite(code) || code < 1 || code > 0x10ffff) return " ";
        try {
          return String.fromCodePoint(code);
        } catch {
          return " ";
        }
      }
      return decodeNamedEntity(body);
    });
}

const SYMBOL_WORDS: Record<string, string> = { "&": " and ", "@": " at ", "%": " percent ", "+": " plus " };

function preprocess(text: string, spellSymbols: boolean): string {
  let s = cleanMarkup(text);
  // 10,000 -> 10000 (otherwise the comma splits the number into "10" and "000")
  s = s.replace(/(\d),(?=\d{3}(?!\d))/g, "$1");
  // Delete apostrophes without leaving a gap: don't -> dont, Kim's -> kims
  s = s.replace(/['‘’ʼ′`´]/g, "");
  if (spellSymbols) s = s.replace(/[&@%+]/g, (c) => SYMBOL_WORDS[c]);
  return s;
}

/* ----------------------------------- slugs ---------------------------------- */

const ASCII_WORD_SPLIT = /[^A-Za-z0-9]+/;
const UNICODE_WORD_SPLIT = /[^\p{L}\p{N}\p{M}]+/u;

/** Number of characters (code points) in a string. */
export const charLength = (s: string) => Array.from(s).length;

/** Cut a slug to `max` characters, optionally at the last whole word. */
export function truncateSlug(slug: string, max: number, separator: string, wholeWords: boolean): string {
  const chars = Array.from(slug);
  if (chars.length <= max) return slug;
  let cut = chars.slice(0, max);
  if (wholeWords && chars[max] !== separator) {
    const idx = cut.lastIndexOf(separator);
    if (idx > 0) cut = cut.slice(0, idx);
  }
  while (cut.length && cut[cut.length - 1] === separator) cut.pop();
  return cut.join("");
}

/** Turn one piece of text into a slug. */
export function slugifyOne(text: string, opts: SlugOptions): SlugResult {
  let s = preprocess(text, opts.spellSymbols);
  let dropped: string[] = [];
  let words: string[];

  if (opts.charset === "transliterate") {
    const t = transliterate(s, opts.germanUmlauts);
    s = t.text;
    dropped = t.dropped;
  } else {
    s = s.normalize("NFC");
  }
  if (opts.lowercase) s = s.toLowerCase();
  words = s.split(opts.charset === "transliterate" ? ASCII_WORD_SPLIT : UNICODE_WORD_SPLIT).filter(Boolean);

  let stopWordsRemoved = 0;
  let onlyStopWords = false;
  if (opts.removeStopWords && words.length) {
    const kept = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
    if (kept.length === 0) onlyStopWords = true;
    else {
      stopWordsRemoved = words.length - kept.length;
      words = kept;
    }
  }

  let slug = words.join(opts.separator);
  let truncated = false;
  if (opts.maxLength !== null && charLength(slug) > opts.maxLength) {
    slug = truncateSlug(slug, opts.maxLength, opts.separator, opts.wholeWords);
    truncated = true;
  }
  const count = slug ? slug.split(opts.separator).length : 0;
  return { slug, words: count, stopWordsRemoved, onlyStopWords, truncated, dropped };
}

/**
 * Append -2, -3 ... to repeated slugs, keeping each one within maxLength.
 * `next` remembers the next suffix to try per base slug, so a list of thousands of
 * identical titles stays linear instead of re-counting from 2 every time.
 */
function uniqueSlug(base: string, seen: Set<string>, next: Map<string, number>, opts: SlugOptions): string {
  const key = base.toLowerCase();
  if (!seen.has(key)) return base;
  for (let n = next.get(key) ?? 2; n < 1_000_000; n++) {
    const suffix = `${opts.separator}${n}`;
    let stem = base;
    if (opts.maxLength !== null) {
      const room = Math.max(1, opts.maxLength - suffix.length);
      stem = truncateSlug(base, room, opts.separator, opts.wholeWords);
      if (!stem) stem = Array.from(base).slice(0, room).join("");
    }
    const candidate = stem + suffix;
    if (!seen.has(candidate.toLowerCase())) {
      next.set(key, n + 1);
      return candidate;
    }
  }
  return base;
}

/** Slugify a list of lines. Blank lines stay blank so output lines line up with the input. */
export function slugifyLines(lines: string[], opts: SlugOptions, unique: boolean): BatchRow[] {
  const seen = new Set<string>();
  const next = new Map<string, number>();
  return lines.map((input) => {
    if (input.trim() === "") {
      return { input, blank: true, renamed: false, slug: "", words: 0, stopWordsRemoved: 0, onlyStopWords: false, truncated: false, dropped: [] };
    }
    const r = slugifyOne(input, opts);
    let renamed = false;
    if (r.slug) {
      if (unique) {
        const u = uniqueSlug(r.slug, seen, next, opts);
        if (u !== r.slug) {
          renamed = true;
          r.slug = u;
          r.words = r.slug.split(opts.separator).length;
        }
      }
      seen.add(r.slug.toLowerCase());
    }
    return { input, blank: false, renamed, ...r };
  });
}

/* ------------------------------- URL and export ----------------------------- */

/** Join a base URL and a slug, percent-encoding anything outside the unreserved set. */
export function buildUrl(base: string, slug: string): string {
  const b = base.trim();
  const enc = encodeURIComponent(slug);
  if (!b) return `/${enc}`;
  return b.endsWith("/") ? b + enc : `${b}/${enc}`;
}

/** Parse the max-length field. Empty means no limit. */
export function parseMaxLength(raw: string): { value: number | null; error?: string } {
  const t = raw.trim();
  if (t === "") return { value: null };
  if (!/^\d+$/.test(t)) return { value: null, error: "Enter a whole number of characters, or leave empty for no limit." };
  const n = Number(t);
  if (n < 1) return { value: null, error: "Maximum length must be at least 1." };
  if (n > 2000) return { value: null, error: "Maximum length can be at most 2,000 characters." };
  return { value: n };
}

export type LengthGrade = "concise" | "long" | "very-long";

/** Rule-of-thumb grade (not a Google limit): short slugs are easier to read, share and remember. */
export function gradeSlug(slug: string, words: number): LengthGrade | null {
  if (!slug) return null;
  const len = charLength(slug);
  if (len <= 60 && words <= 6) return "concise";
  if (len <= 100) return "long";
  return "very-long";
}

function csvCell(value: string): string {
  // Neutralise spreadsheet formulas in user-supplied text.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** CSV with a UTF-8 byte-order mark so Excel opens Cyrillic, Greek and accents correctly. */
export function toCsv(rows: BatchRow[], base: string): string {
  const body = rows
    .filter((r) => !r.blank)
    .map((r) => [csvCell(r.input), csvCell(r.slug), csvCell(r.slug ? buildUrl(base, r.slug) : "")].join(","));
  return "﻿" + ["input,slug,url", ...body].join("\r\n") + "\r\n";
}
