/** Pure conversion logic for the Case Converter – no React, no DOM, so it can be unit-tested. */

export type ModeId =
  | "sentence"
  | "lower"
  | "upper"
  | "capitalized"
  | "title"
  | "alternating"
  | "inverse"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot";

export type TitleStyle = "ap" | "apa" | "chicago" | "mla" | "all";

export interface ConvertOptions {
  titleStyle: TitleStyle;
  keepAcronyms: boolean;
}

/** A "word": letters/digits, optionally joined by apostrophes or internal periods (don't, e.g., U.S., 3.5, Node.js). */
const WORD_RE = /[\p{L}\p{N}]+(?:[.'’][\p{L}\p{N}]+)*/gu;
const LETTER_RE = /\p{L}/u;
const SINGLE_LETTER_RE = /^\p{L}$/u;
/** A capital letter on its own, which before a period is an initial (J. K. Rowling). */
const CAPITAL_LETTER_RE = /^\p{Lu}$/u;
const PRONOUN_I_RE = /^i(?:['’](?:m|ll|ve|d))?$/u;
const ELLIPSIS_RE = /\.{2,}|…/;
/** Punctuation that, when it directly follows a short word in a title, shows the word is not a dangling preposition. */
const CLAUSE_END_RE = /^[,;:!?)\]}"”»]/;
/** Separator text that starts a subtitle (colon, dash, question or exclamation mark). A period counts only when it ends a sentence. */
const SUBTITLE_RE = /[:!?—–]|\s-\s/;
/** Words after which a "preposition" is really a noun or adjective (The Past, A Near Miss, The In Crowd). */
const DETERMINERS = new Set("a an the my your his her its our their this that these those".split(" "));
/** Subjects after which "like" is a verb (Some Like It Hot, Why We Like Cats). */
const SUBJECTS = new Set("i you we they he she it who some people".split(" "));

/** Words after which a period does not end a sentence. */
const ABBREVIATIONS = new Set(
  "mr mrs ms dr prof sr jr st mt ave blvd rd rev hon gen col capt sgt lt cpl pvt vs approx dept est inc ltd co corp bros misc fig vol pp ch".split(" "),
);

const ARTICLES = ["a", "an", "the"];
const COORD_SHORT = ["and", "but", "or", "nor", "for", "yet", "so"];
const PREPS_SHORT = ["as", "at", "by", "in", "of", "on", "to", "per", "via", "vs", "v"];
// "up", "down", "off", "out" and "over" are absent (except "up"/"off" in APA): in titles they are usually adverbs (Sold Out, Growing Up).
/** Prepositions of four letters or fewer that Chicago 18 (2024) still lowercases. */
const PREPS_FOUR = ["amid", "from", "into", "like", "near", "onto", "past", "than", "till", "unto", "upon", "with"];
const PREPS_LONG = [
  "about", "above", "across", "after", "against", "along", "amid", "among", "around", "before", "behind", "below", "beneath",
  "beside", "between", "beyond", "despite", "during", "except", "from", "inside", "into", "like", "near", "onto", "outside",
  "past", "since", "through", "throughout", "till", "toward", "towards", "under", "underneath", "until", "unto", "upon",
  "with", "within", "without",
];

const SMALL_WORDS: Record<TitleStyle, Set<string>> = {
  // AP: articles, conjunctions and prepositions of fewer than four letters.
  ap: new Set([...ARTICLES, ...COORD_SHORT, "if", ...PREPS_SHORT]),
  // APA 7: minor words of three letters or fewer; APA's own list of short prepositions includes "up" and "off".
  apa: new Set([...ARTICLES, ...COORD_SHORT, "if", ...PREPS_SHORT, "up", "off"]),
  // Chicago 18 (8.159): articles, coordinating conjunctions (and, but, for, or, nor), "as", "to" and prepositions of up to four letters.
  chicago: new Set([...ARTICLES, "and", "but", "for", "or", "nor", ...PREPS_SHORT, ...PREPS_FOUR]),
  // MLA 9: articles, coordinating conjunctions (incl. so, yet), "to" and prepositions of any length.
  mla: new Set([...ARTICLES, ...COORD_SHORT, ...PREPS_SHORT, ...PREPS_LONG]),
  all: new Set(),
};

// Prose follows the reader's locale (Turkish dotted İ, etc.); identifiers must not depend on it.
const upper = (s: string) => s.toLocaleUpperCase();
const lower = (s: string) => s.toLocaleLowerCase();
const codeUpper = (s: string) => s.toUpperCase();
const codeLower = (s: string) => s.toLowerCase();

/** Upper-case the first code point, lower-case the rest. */
function capitalizeFirst(word: string, up = upper, down = lower): string {
  const cp = word.codePointAt(0);
  if (cp === undefined) return word;
  const first = String.fromCodePoint(cp);
  return up(first) + down(word.slice(first.length));
}
const codeCapitalize = (w: string) => capitalizeFirst(w, codeUpper, codeLower);

/** True when text of at least two words is written entirely in capitals ("NASA" alone is an acronym, not shouting). */
function isShouting(text: string): boolean {
  const words = text.match(/\p{L}{2,}/gu);
  return !!words && words.length >= 2 && text === upper(text) && text !== lower(text);
}

/** Acronym (NASA, HTML5, U.S) or mixed-case word (iPhone, JavaScript, McDonald's). */
function isAcronymOrMixed(word: string): boolean {
  const letters = word.match(/\p{L}/gu);
  if (!letters || letters.length < 2) return false;
  if (word === upper(word)) return true;
  // an upper-case letter anywhere after the first letter
  return letters.slice(1).some((ch) => ch !== lower(ch));
}

interface WordContext {
  index: number;
  count: number;
  /** The previous word on the line, or "" for the first word. */
  prev: string;
  /** Separator text immediately before the word. */
  before: string;
  /** Separator text between this word and the next (or end of line). */
  after: string;
}

/** Replace every word in a line, leaving separators untouched. */
function mapWords(line: string, fn: (word: string, ctx: WordContext) => string): string {
  const matches = [...line.matchAll(WORD_RE)];
  if (matches.length === 0) return line;
  let out = "";
  let pos = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index ?? 0;
    const word = m[0];
    const next = matches[i + 1];
    const before = line.slice(pos, start);
    const after = line.slice(start + word.length, next ? (next.index ?? line.length) : line.length);
    out += before + fn(word, { index: i, count: matches.length, prev: i > 0 ? matches[i - 1][0] : "", before, after });
    pos = start + word.length;
  }
  return out + line.slice(pos);
}

/** Does the separator after `word` end a sentence? */
function endsSentence(word: string, after: string): boolean {
  if (/[!?]/.test(after)) return true;
  if (!after.includes(".")) return false;
  if (ELLIPSIS_RE.test(after)) return false;
  const w = lower(word);
  if (SINGLE_LETTER_RE.test(w)) return false; // initial: J. K. Rowling
  if (w.includes(".")) return false; // e.g., i.e., U.S., a.m.
  return !ABBREVIATIONS.has(w);
}

/** "1." "2)" "a." "b)" at the start of a line. */
const LIST_MARKER_RE = /^(?:\p{N}+|\p{L})$/u;

function sentenceCaseLine(line: string, keep: boolean, textShouting: boolean): string {
  const shouting = textShouting || isShouting(line);
  let atStart = true;
  return mapWords(line, (word, { index, before, after }) => {
    // A list marker keeps its own case and the item after it starts a sentence.
    if (index === 0 && !before.trim() && LIST_MARKER_RE.test(word) && /^[.)]\s/.test(after)) return word;
    const initial = CAPITAL_LETTER_RE.test(word) && after.startsWith(".");
    const preserved = keep && !shouting && (isAcronymOrMixed(word) || initial);
    let result: string;
    if (preserved) result = word;
    else if (atStart) result = capitalizeFirst(word);
    else result = lower(word);
    if (!preserved && PRONOUN_I_RE.test(result)) result = "I" + result.slice(1);
    atStart = endsSentence(word, after);
    return result;
  });
}

function titleCaseLine(line: string, style: TitleStyle, keep: boolean, textShouting: boolean): string {
  const shouting = textShouting || isShouting(line);
  const small = SMALL_WORDS[style];
  return mapWords(line, (word, { index, count, prev, before, after }) => {
    if (keep && !shouting && isAcronymOrMixed(word)) return word;
    // "Batman vs. the Joker" and "Mr. and Mrs. Smith": a period after an abbreviation does not start a subtitle.
    const isFirst = index === 0 || SUBTITLE_RE.test(before) || (before.includes(".") && endsSentence(prev, before));
    const isLast = index === count - 1;
    const w = lower(word);
    const p = lower(prev);
    const nounOrVerb = (DETERMINERS.has(p) && !ARTICLES.includes(w)) || (w === "like" && SUBJECTS.has(p));
    if (!isFirst && !isLast && small.has(w) && !nounOrVerb && !CLAUSE_END_RE.test(after)) return w;
    return capitalizeFirst(word);
  });
}

function capitalizedCaseLine(line: string, keep: boolean, textShouting: boolean): string {
  const shouting = textShouting || isShouting(line);
  return mapWords(line, (word) => (keep && !shouting && isAcronymOrMixed(word) ? word : capitalizeFirst(word)));
}

function alternatingCase(text: string): string {
  let up = false;
  let out = "";
  for (const ch of text) {
    if (LETTER_RE.test(ch)) {
      out += up ? upper(ch) : lower(ch);
      up = !up;
    } else {
      out += ch;
    }
  }
  return out;
}

function inverseCase(text: string): string {
  let out = "";
  for (const ch of text) {
    const u = upper(ch);
    out += ch === u ? lower(ch) : u;
  }
  return out;
}

/** Split a line into identifier words: whitespace, punctuation, underscores, hyphens and camelCase humps are boundaries. */
export function splitIdentifierWords(line: string): string[] {
  return line
    .replace(/['’]/g, "")
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2") // fooBar -> foo Bar, html5Parser -> html5 Parser
    // HTTPServer -> HTTP Server, but a plural acronym stays whole: URLs, userIDs -> user IDs
    .replace(/(\p{Lu}+)(\p{Lu})(\p{Ll}+)/gu, (m, run: string, cap: string, rest: string) => (rest === "s" ? m : `${run} ${cap}${rest}`))
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function joinIdentifier(words: string[], mode: ModeId): string {
  switch (mode) {
    case "camel":
      return words.map((w, i) => (i === 0 ? codeLower(w) : codeCapitalize(w))).join("");
    case "pascal":
      return words.map(codeCapitalize).join("");
    case "snake":
      return words.map(codeLower).join("_");
    case "kebab":
      return words.map(codeLower).join("-");
    case "constant":
      return words.map(codeUpper).join("_");
    case "dot":
      return words.map(codeLower).join(".");
    default:
      return words.join(" ");
  }
}

const perLine = (text: string, fn: (line: string) => string) => text.split("\n").map(fn).join("\n");

export function convertCase(text: string, mode: ModeId, { titleStyle, keepAcronyms }: ConvertOptions): string {
  // Text that is entirely in capitals (e.g. a form that forced an address into capitals) is converted even with acronyms kept.
  const textShouting = (mode === "sentence" || mode === "title" || mode === "capitalized") && keepAcronyms && isShouting(text);
  switch (mode) {
    case "lower":
      return lower(text);
    case "upper":
      return upper(text);
    case "sentence":
      return perLine(text, (l) => sentenceCaseLine(l, keepAcronyms, textShouting));
    case "title":
      return perLine(text, (l) => titleCaseLine(l, titleStyle, keepAcronyms, textShouting));
    case "capitalized":
      return perLine(text, (l) => capitalizedCaseLine(l, keepAcronyms, textShouting));
    case "alternating":
      return alternatingCase(text);
    case "inverse":
      return inverseCase(text);
    default:
      return perLine(text, (l) => joinIdentifier(splitIdentifierWords(l), mode));
  }
}

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
}

export function getStats(text: string): TextStats {
  const trimmed = text.trim();
  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    lines: text ? text.split("\n").length : 0,
    paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
  };
}
