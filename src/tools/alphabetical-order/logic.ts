/**
 * Pure logic for the alphabetical order tool. No React, no DOM, no imports from the rest
 * of the site, so it can be exercised directly from a script or a test.
 */

export type SortBy = "alpha" | "last" | "length" | "number" | "random" | "reverse";
export type Direction = "asc" | "desc";
export type InputSeparator = "newline" | "comma" | "semicolon" | "tab" | "space" | "custom";
export type OutputSeparator = "same" | "newline" | "comma" | "commaSpace" | "semicolon" | "semicolonSpace" | "tab" | "space" | "custom";
/**
 * mixed = dictionary order, lowercase before uppercase when two words differ only by case;
 * upperFirst = same, but uppercase first; ignore = case never decides (ties keep input order);
 * code = raw Unicode order, where every capital letter sorts before every lowercase letter.
 */
export type CaseMode = "mixed" | "upperFirst" | "ignore" | "code";

export interface Options {
  sortBy: SortBy;
  direction: Direction;
  inputSep: InputSeparator;
  customInputSep: string;
  outputSep: OutputSeparator;
  customOutputSep: string;
  /** BCP 47 language tag used for the collation rules (where ä, å, ñ or ch belong). */
  locale: string;
  caseMode: CaseMode;
  /** item2 before item10. */
  natural: boolean;
  /** Ignore spaces and punctuation: "Newark" before "New York". Off = word by word. */
  letterByLetter: boolean;
  ignoreAccents: boolean;
  ignoreArticles: boolean;
  /** Comma-separated list of leading words to skip, e.g. "the, a, an". */
  articles: string;
  ignorePunctuation: boolean;
  ignoreBullets: boolean;
  /** File "McDonald" as "MacDonald". */
  macMc: boolean;
  /** Last-name sorting: keep van, de, von... together with the surname. */
  keepPrefixes: boolean;
  trim: boolean;
  removeEmpty: boolean;
  /** Remove repeated lines, ignoring capitals. */
  removeDuplicates: boolean;
}

export const DEFAULT_ARTICLES = "the, a, an";

export const DEFAULT_OPTIONS: Options = {
  sortBy: "alpha",
  direction: "asc",
  inputSep: "newline",
  customInputSep: "",
  outputSep: "same",
  customOutputSep: "",
  locale: "en",
  caseMode: "mixed",
  natural: true,
  letterByLetter: false,
  ignoreAccents: false,
  ignoreArticles: false,
  articles: DEFAULT_ARTICLES,
  ignorePunctuation: false,
  ignoreBullets: false,
  macMc: false,
  keepPrefixes: true,
  trim: true,
  removeEmpty: true,
  removeDuplicates: false,
};

export const SORT_BYS: SortBy[] = ["alpha", "last", "length", "number", "random", "reverse"];
export const DIRECTIONS: Direction[] = ["asc", "desc"];
export const INPUT_SEPARATORS: InputSeparator[] = ["newline", "comma", "semicolon", "tab", "space", "custom"];
export const OUTPUT_SEPARATORS: OutputSeparator[] = ["same", "newline", "comma", "commaSpace", "semicolon", "semicolonSpace", "tab", "space", "custom"];
export const CASE_MODES: CaseMode[] = ["mixed", "upperFirst", "ignore", "code"];

/** Languages offered in the selector. Every entry is a locale with its own alphabet rules or a common default. */
export const LOCALES: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "nl", label: "Dutch" },
  { value: "sv", label: "Swedish" },
  { value: "da", label: "Danish" },
  { value: "nb", label: "Norwegian" },
  { value: "fi", label: "Finnish" },
  { value: "pl", label: "Polish" },
  { value: "cs", label: "Czech" },
  { value: "tr", label: "Turkish" },
  { value: "ru", label: "Russian" },
  { value: "el", label: "Greek" },
  { value: "zh", label: "Chinese (pinyin)" },
];

const MAX_SEPARATOR_LENGTH = 24;
const MAX_ARTICLES_LENGTH = 300;

/** Repair options read from storage: unknown keys are dropped, wrong types fall back to the defaults. */
export function normalizeOptions(raw: unknown): Options {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const bool = (k: keyof Options): boolean => (typeof src[k] === "boolean" ? (src[k] as boolean) : (DEFAULT_OPTIONS[k] as boolean));
  const pick = <T extends string>(k: keyof Options, allowed: readonly T[]): T =>
    allowed.includes(src[k] as T) ? (src[k] as T) : (DEFAULT_OPTIONS[k] as T);
  const text = (k: keyof Options, max: number): string =>
    typeof src[k] === "string" ? (src[k] as string).slice(0, max) : (DEFAULT_OPTIONS[k] as string);
  return {
    sortBy: pick("sortBy", SORT_BYS),
    direction: pick("direction", DIRECTIONS),
    inputSep: pick("inputSep", INPUT_SEPARATORS),
    customInputSep: text("customInputSep", MAX_SEPARATOR_LENGTH),
    outputSep: pick("outputSep", OUTPUT_SEPARATORS),
    customOutputSep: text("customOutputSep", MAX_SEPARATOR_LENGTH),
    locale: LOCALES.some((l) => l.value === src.locale) ? (src.locale as string) : DEFAULT_OPTIONS.locale,
    caseMode: pick("caseMode", CASE_MODES),
    natural: bool("natural"),
    letterByLetter: bool("letterByLetter"),
    ignoreAccents: bool("ignoreAccents"),
    ignoreArticles: bool("ignoreArticles"),
    articles: text("articles", MAX_ARTICLES_LENGTH),
    ignorePunctuation: bool("ignorePunctuation"),
    ignoreBullets: bool("ignoreBullets"),
    macMc: bool("macMc"),
    keepPrefixes: bool("keepPrefixes"),
    trim: bool("trim"),
    removeEmpty: bool("removeEmpty"),
    removeDuplicates: bool("removeDuplicates"),
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Splitting and joining                                                                       */
/* ------------------------------------------------------------------------------------------ */

/** Every sequence treated as a line break: CRLF, LF, CR, vertical tab, form feed, NEL and the Unicode separators. */
const LINE_BREAK_RE = /\r\n|[\n\r\u000B\u000C\u0085\u2028\u2029]/;

/** Characters that are invisible on screen but ride along when text is copied from web pages and PDFs. */
const INVISIBLE_RE = /[\u00AD\u061C\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;

/** Turn the two-character sequences \n, \t, \r and \\ typed into a custom separator box into real characters. */
export function unescapeSeparator(s: string): string {
  return s.replace(/\\([ntr\\])/g, (_, c: string) => (c === "n" ? "\n" : c === "t" ? "\t" : c === "r" ? "\r" : "\\"));
}

/** Split the input into items. One trailing line break ends the last item; it does not start another. */
export function splitItems(text: string, sep: InputSeparator, custom = ""): string[] {
  if (text === "") return [];
  switch (sep) {
    case "newline": {
      const parts = text.split(LINE_BREAK_RE);
      if (parts.length > 1 && parts[parts.length - 1] === "") parts.pop();
      return parts;
    }
    case "comma":
      return text.split(",");
    case "semicolon":
      return text.split(";");
    case "tab":
      return text.split("\t");
    case "space":
      return text.split(/\s+/);
    case "custom": {
      const c = unescapeSeparator(custom);
      return c === "" ? [text] : text.split(c);
    }
  }
}

/** CRLF when the input uses it, LF otherwise. */
export function detectLineEnding(text: string): "\n" | "\r\n" {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

/** The string placed between items in the result. */
export function resolveOutputSeparator(text: string, o: Pick<Options, "inputSep" | "customInputSep" | "outputSep" | "customOutputSep">): string {
  switch (o.outputSep) {
    case "newline":
      return detectLineEnding(text);
    case "comma":
      return ",";
    case "commaSpace":
      return ", ";
    case "semicolon":
      return ";";
    case "semicolonSpace":
      return "; ";
    case "tab":
      return "\t";
    case "space":
      return " ";
    case "custom":
      return unescapeSeparator(o.customOutputSep);
    case "same":
      switch (o.inputSep) {
        case "newline":
          return detectLineEnding(text);
        case "comma":
          return /,[ \t]/.test(text) ? ", " : ",";
        case "semicolon":
          return /;[ \t]/.test(text) ? "; " : ";";
        case "tab":
          return "\t";
        case "space":
          return " ";
        case "custom":
          return unescapeSeparator(o.customInputSep);
      }
  }
}

/** The input separator that matches an output separator, used by "Use result as input". */
export function inputSeparatorFor(out: OutputSeparator, current: InputSeparator): InputSeparator {
  switch (out) {
    case "same":
      return current;
    case "newline":
      return "newline";
    case "comma":
    case "commaSpace":
      return "comma";
    case "semicolon":
    case "semicolonSpace":
      return "semicolon";
    case "tab":
      return "tab";
    case "space":
      return "space";
    case "custom":
      return "custom";
  }
}

/**
 * When the list is one long line (or the wrong separator is selected) suggest the separator
 * that would split it into several items. Returns null when the current setting looks right.
 */
export function suggestSeparator(text: string, sep: InputSeparator, custom = ""): InputSeparator | null {
  if (text.trim() === "") return null;
  const nonBlankLines = text.split(LINE_BREAK_RE).filter((l) => l.trim() !== "").length;
  const count = (re: RegExp) => (text.match(re) ?? []).length;
  if (sep === "newline") {
    if (nonBlankLines !== 1) return null;
    const commas = count(/,/g);
    const semis = count(/;/g);
    const tabs = count(/\t/g);
    // One comma alone is too weak a signal: "Curie, Marie" is a name, not a list.
    if (commas >= 2 && commas >= semis && commas >= tabs) return "comma";
    if (semis >= 1 && semis >= tabs) return "semicolon";
    if (tabs >= 1) return "tab";
    if (text.trim().split(/\s+/).length >= 3) return "space";
    return null;
  }
  // A list-style separator is selected but the text has none of it while it has several lines.
  if (nonBlankLines >= 2) {
    const has = sep === "comma" ? text.includes(",") : sep === "semicolon" ? text.includes(";") : sep === "tab" ? text.includes("\t") : sep === "space" ? false : unescapeSeparator(custom) !== "" && text.includes(unescapeSeparator(custom));
    if (!has) return "newline";
  }
  return null;
}

/* ------------------------------------------------------------------------------------------ */
/* Comparison keys                                                                             */
/* ------------------------------------------------------------------------------------------ */

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Collapse whitespace, drop invisible characters and normalize Unicode so look-alike text compares equal. */
export function normalizeSpace(s: string): string {
  return s.replace(INVISIBLE_RE, "").normalize("NFC").replace(/\s+/g, " ").trim();
}

const BULLET_RE = /^(?:[-*+•·▪◦‣–—►➤✓✔☐☑□■●○]|\(?\d{1,3}[.)])\s+(?=\S)/u;
const LEADING_PUNCT_RE = /^[^\p{L}\p{N}]+(?=[\p{L}\p{N}])/u;

/** Build the regular expression that removes leading articles, or null when the list is empty. */
export function articleRegExp(list: string): RegExp | null {
  const words = list
    .split(/[,;\n]+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 40);
  if (words.length === 0) return null;
  const alternatives = words.map((w) => (/['’]$/.test(w) ? `${escapeRegExp(w.slice(0, -1))}['’]` : `${escapeRegExp(w)}\\s+`));
  return new RegExp(`^(?:${alternatives.join("|")})(?=\\S)`, "iu");
}

/**
 * The text a line is sorted under, before the collator sees it: bullets, leading punctuation and
 * leading articles removed when those options are on, "Mc" filed as "Mac" when asked.
 */
export function sortText(item: string, o: Pick<Options, "sortBy" | "ignoreBullets" | "ignorePunctuation" | "ignoreArticles" | "macMc">, articles: RegExp | null): string {
  let s = normalizeSpace(item);
  if (o.ignoreBullets) s = s.replace(BULLET_RE, "");
  if (o.ignorePunctuation) s = s.replace(LEADING_PUNCT_RE, "");
  if (o.ignoreArticles && articles && o.sortBy !== "last") s = s.replace(articles, "");
  if (o.macMc) s = s.replace(/(^|[^\p{L}\p{N}])Mc(?=\p{L})/gu, "$1Mac");
  return s;
}

const TITLES = new Set(["mr", "mrs", "ms", "miss", "mx", "dr", "prof", "rev", "fr", "sir", "dame", "lord", "lady", "hon", "capt", "col", "gen", "lt", "sgt", "maj"]);
const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "phd", "md", "dds", "dvm", "esq", "cpa", "mba", "rn", "jd"]);
const PARTICLES = new Set([
  "van", "von", "de", "der", "den", "di", "da", "del", "della", "dei", "degli", "du", "des", "la", "le", "les", "lo", "los", "las",
  "el", "al", "bin", "ibn", "bint", "ter", "ten", "dos", "das", "do", "st", "zu", "zur", "af",
]);

const wordKey = (w: string) => w.toLowerCase().replace(/[.,]/g, "");
const stripTitles = (words: string[]): string[] => {
  let i = 0;
  while (words.length - i > 1 && TITLES.has(wordKey(words[i]))) i++;
  return words.slice(i);
};

export interface ParsedName {
  family: string;
  given: string;
}

/**
 * Split a personal name into surname and given names.
 * "Last, First" is taken as written. Otherwise the last word is the surname, together with
 * lowercase particles such as "van" or "de la" when `keepPrefixes` is on. Titles (Dr., Mrs.)
 * and suffixes (Jr., III, PhD) never decide the order.
 */
export function parseName(text: string, keepPrefixes = true): ParsedName {
  const segments = text
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
  if (segments.length === 0) return { family: "", given: "" };
  const rest = segments.slice(1);
  const restIsSuffix = rest.length > 0 && rest.every((seg) => seg.split(/\s+/).every((w) => SUFFIXES.has(wordKey(w))));
  if (rest.length > 0 && !restIsSuffix) {
    return { family: stripTitles(segments[0].split(/\s+/)).join(" "), given: rest.join(" ") };
  }
  let words = stripTitles(segments[0].split(/\s+/));
  while (words.length > 1 && SUFFIXES.has(wordKey(words[words.length - 1]))) words = words.slice(0, -1);
  let j = words.length - 1;
  if (keepPrefixes) while (j - 1 >= 1 && PARTICLES.has(wordKey(words[j - 1]))) j--;
  return { family: words.slice(j).join(" "), given: words.slice(0, j).join(" ") };
}

const NUMBER_RE = /(?:\d{1,3}(?:,\d{3})+(?!\d)|\d+)(?:\.\d+)?|\.\d+/g;

/**
 * The first number in a line. Commas group thousands, a period is the decimal point, and a
 * minus sign counts only when it starts the number ("-5", "(-5)", "$-5", not "Room-12").
 * A bare ".5" counts only when nothing word-like or dotted comes right before it ("Wait...5" is 5).
 */
export function firstNumber(s: string): number | null {
  NUMBER_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NUMBER_RE.exec(s))) {
    if (m[0][0] === "." && m.index > 0 && /[\p{L}\p{N}.]/u.test(s[m.index - 1])) {
      NUMBER_RE.lastIndex = m.index + 1;
      continue;
    }
    let v = Number(m[0].replace(/,/g, ""));
    if (!Number.isFinite(v)) return null;
    const before = s[m.index - 1];
    if ((before === "-" || before === "\u2212") && (m.index === 1 || /[\s(:=$\u20AC\u00A3]/.test(s[m.index - 2] ?? ""))) v = -v;
    return v;
  }
  return null;
}

let segmenter: Intl.Segmenter | null | undefined;

/** Length in visible characters: an emoji or a letter with a combining accent counts once. */
export function graphemeLength(s: string): number {
  if (/^[ -~]*$/.test(s)) return s.length;
  if (segmenter === undefined) segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  if (!segmenter) return Array.from(s).length;
  return Array.from(segmenter.segment(s)).length;
}

/* ------------------------------------------------------------------------------------------ */
/* Collation and shuffling                                                                     */
/* ------------------------------------------------------------------------------------------ */

/** Compare by Unicode code point (the same order as UTF-8 bytes). Plain `<` compares UTF-16 units, which misplaces emoji against U+E000 to U+FFFF. */
export function compareCodePoints(a: string, b: string): number {
  if (a === b) return 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    let x = a.charCodeAt(i);
    let y = b.charCodeAt(i);
    if (x !== y) {
      if (x >= 0xd800 && y >= 0xd800) {
        x = x >= 0xe000 ? x - 0x800 : x + 0x2000;
        y = y >= 0xe000 ? y - 0x800 : y + 0x2000;
      }
      return x < y ? -1 : 1;
    }
  }
  return a.length < b.length ? -1 : a.length > b.length ? 1 : 0;
}

/** The comparison function for two sort texts under the current language and case rules. */
export function makeCompare(o: Pick<Options, "locale" | "caseMode" | "natural" | "letterByLetter" | "ignoreAccents">): (a: string, b: string) => number {
  if (o.caseMode === "code") return compareCodePoints;
  const ignoreCase = o.caseMode === "ignore";
  const sensitivity: Intl.CollatorOptions["sensitivity"] =
    ignoreCase && o.ignoreAccents ? "base" : ignoreCase ? "accent" : o.ignoreAccents ? "case" : "variant";
  try {
    return new Intl.Collator(o.locale, {
      usage: "sort",
      sensitivity,
      numeric: o.natural,
      ignorePunctuation: o.letterByLetter,
      caseFirst: o.caseMode === "upperFirst" ? "upper" : "false",
    }).compare;
  } catch {
    return new Intl.Collator("en", { numeric: o.natural }).compare;
  }
}

/** Four random 32-bit words from the browser's secure generator, used to seed the shuffle. */
export function newSeed(): number[] {
  const seed = new Uint32Array(4);
  try {
    crypto.getRandomValues(seed);
  } catch {
    for (let i = 0; i < seed.length; i++) seed[i] = Math.floor(Math.random() * 4294967296);
  }
  return Array.from(seed);
}

/** Small fast generator with 128 bits of state (sfc32), returning numbers in [0, 1). */
function sfc32(seed: number[]): () => number {
  let a = seed[0] | 0;
  let b = seed[1] | 0;
  let c = seed[2] | 0;
  let d = seed[3] | 0;
  return () => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle driven by the seed. The same seed and length always give the same order. */
export function shuffled<T>(list: readonly T[], seed: number[]): T[] {
  const rand = sfc32(seed.length >= 4 ? seed : [1, 2, 3, 4]);
  for (let i = 0; i < 12; i++) rand(); // warm up
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ------------------------------------------------------------------------------------------ */
/* The sorter                                                                                  */
/* ------------------------------------------------------------------------------------------ */

/** How many "sorted as" rows are kept for the explanation table. */
export const MAX_KEY_ROWS = 40;

export interface KeyRow {
  item: string;
  key: string;
}

export interface SortResult {
  items: string[];
  output: string;
  itemsIn: number;
  itemsOut: number;
  emptyRemoved: number;
  duplicatesRemoved: number;
  /** Number mode: items that contain no number and were placed at the end. */
  withoutNumber: number;
  /** Items (in result order) that were sorted under text different from what was typed. */
  keyRows: KeyRow[];
  keyRowsTotal: number;
}

interface Entry {
  item: string;
  k1: string;
  k2: string;
  len: number;
  num: number | null;
  key: string;
}

/** Sort, shuffle or reverse a list according to `o`. Pure and deterministic for a given seed. */
export function sortList(input: string, o: Options, seed: number[] = [1, 2, 3, 4]): SortResult {
  const raw = splitItems(input, o.inputSep, o.customInputSep);
  const itemsIn = raw.length;

  let items = o.trim ? raw.map((s) => s.trim()) : raw;
  let emptyRemoved = 0;
  if (o.removeEmpty) {
    const kept = items.filter((s) => s.replace(INVISIBLE_RE, "").trim() !== "");
    emptyRemoved = items.length - kept.length;
    items = kept;
  }
  let duplicatesRemoved = 0;
  if (o.removeDuplicates) {
    const seen = new Set<string>();
    const kept: string[] = [];
    for (const s of items) {
      const k = normalizeSpace(s).toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      kept.push(s);
    }
    duplicatesRemoved = items.length - kept.length;
    items = kept;
  }

  const compare = makeCompare(o);
  const articles = o.ignoreArticles ? articleRegExp(o.articles) : null;
  const sign = o.direction === "desc" ? -1 : 1;
  let sorted: string[];
  let entries: Entry[] | null = null;
  let withoutNumber = 0;

  if (o.sortBy === "random") {
    sorted = shuffled(items, seed);
  } else if (o.sortBy === "reverse") {
    sorted = items.slice().reverse();
  } else {
    entries = items.map((item) => {
      const text = sortText(item, o, articles);
      const e: Entry = { item, k1: text, k2: "", len: 0, num: null, key: text };
      if (o.sortBy === "last") {
        const name = parseName(text, o.keepPrefixes);
        e.k1 = name.family;
        e.k2 = name.given;
        e.key = name.given ? `${name.family}, ${name.given}` : name.family;
      } else if (o.sortBy === "length") {
        e.len = graphemeLength(item);
      } else if (o.sortBy === "number") {
        e.num = firstNumber(o.ignoreBullets ? normalizeSpace(item).replace(BULLET_RE, "") : item);
        if (e.num === null) withoutNumber++;
      }
      return e;
    });
    const byText = (a: Entry, b: Entry) => compare(a.k1, b.k1) || compare(a.k2, b.k2);
    let cmp: (a: Entry, b: Entry) => number;
    if (o.sortBy === "length") cmp = (a, b) => sign * (a.len - b.len) || byText(a, b);
    else if (o.sortBy === "number")
      cmp = (a, b) => {
        if (a.num === null || b.num === null) return a.num === b.num ? byText(a, b) : a.num === null ? 1 : -1;
        return sign * (a.num - b.num) || byText(a, b);
      };
    else cmp = (a, b) => sign * byText(a, b);
    // Array.prototype.sort is stable, so items that compare equal keep their input order.
    entries.sort(cmp);
    sorted = entries.map((e) => e.item);
  }

  const keyRows: KeyRow[] = [];
  let keyRowsTotal = 0;
  if (entries && (o.sortBy === "alpha" || o.sortBy === "last")) {
    for (const e of entries) {
      if (e.key === normalizeSpace(e.item)) continue;
      keyRowsTotal++;
      if (keyRows.length < MAX_KEY_ROWS) keyRows.push({ item: e.item, key: e.key });
    }
  }

  return {
    items: sorted,
    output: sorted.join(resolveOutputSeparator(input, o)),
    itemsIn,
    itemsOut: sorted.length,
    emptyRemoved,
    duplicatesRemoved,
    withoutNumber,
    keyRows,
    keyRowsTotal,
  };
}

/** Decode a text file, honoring UTF-16 byte order marks (Windows Notepad's "Unicode"); UTF-8 otherwise. */
export function decodeTextFile(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes);
  return new TextDecoder("utf-8").decode(bytes);
}
