/**
 * Roman numeral logic for the converter. Pure functions only (no DOM access), so
 * everything here runs on the server and in the browser and can be tested alone.
 *
 * Conventions used throughout:
 *  - Standard numerals cover 1 to 3,999 (I to MMMCMXCIX).
 *  - 4,000 to 3,999,999 use a vinculum: the thousands are written as a standard
 *    numeral with an overline, followed by an ordinary numeral for the rest.
 *  - The Unicode form puts U+0305 (combining overline) after each overlined letter.
 */

export const OVERLINE = "̅";
export const MAX_STANDARD = 3999;
export const MAX_VALUE = 3_999_999;
/** Largest number for which the repeated-M spelling (MMMM = 4,000) is offered as an alternative. */
export const MAX_REPEATED_M = 9999;
const MAX_INPUT_LENGTH = 120;
/** Whitespace and zero-width characters that are ignored inside a numeral. */
const WHITESPACE = /[\s\u200b-\u200d\u2060\ufeff]+/g;

/** "XII" with an overline on every letter, used in explanations. */
const OVERLINED_EXAMPLE = [..."XII"].map((c) => c + OVERLINE).join("");

const LETTER_VALUES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

/** The seven symbols, for reference tables. */
export const SYMBOLS: ReadonlyArray<{ letter: string; value: number }> = [
  { letter: "I", value: 1 },
  { letter: "V", value: 5 },
  { letter: "X", value: 10 },
  { letter: "L", value: 50 },
  { letter: "C", value: 100 },
  { letter: "D", value: 500 },
  { letter: "M", value: 1000 },
];

const TABLE: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

const SUBTRACTIVE_PAIRS = new Set(["IV", "IX", "XL", "XC", "CD", "CM"]);

const STANDARD = /^(M{0,3})(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
const ANY_M = /^(M*)(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
const NO_M = /^(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

const intFormat = new Intl.NumberFormat("en-US");
/** 12345 -> "12,345" */
export function fmt(n: number): string {
  return intFormat.format(n);
}

/* ------------------------------------------------------------------ */
/* Number -> Roman                                                     */
/* ------------------------------------------------------------------ */

/** Standard numeral for a whole number from 1 to 3,999 (uppercase letters, no overline). */
export function toStandardRoman(n: number): string {
  let rest = Math.trunc(n);
  let out = "";
  for (const [value, symbol] of TABLE) {
    while (rest >= value) {
      out += symbol;
      rest -= value;
    }
  }
  return out;
}

export interface RomanSegment {
  text: string;
  overline: boolean;
}

export interface RomanForm {
  value: number;
  /** For display: overlined segment first (when present), then the ordinary letters. */
  segments: RomanSegment[];
  /** Copyable text. Overlined letters are followed by U+0305 (combining overline). */
  unicode: string;
  /** Alternative spelling with repeated M for 4,000-9,999, otherwise null. */
  repeatedM: string | null;
}

/** Roman form of a whole number from 1 to 3,999,999. Throws RangeError outside that range. */
export function toRomanForm(n: number): RomanForm {
  if (!Number.isInteger(n) || n < 1 || n > MAX_VALUE) {
    throw new RangeError(`Roman numerals are supported from 1 to ${MAX_VALUE}`);
  }
  if (n <= MAX_STANDARD) {
    const s = toStandardRoman(n);
    return { value: n, segments: [{ text: s, overline: false }], unicode: s, repeatedM: null };
  }
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const hi = toStandardRoman(thousands);
  const lo = rest ? toStandardRoman(rest) : "";
  const segments: RomanSegment[] = [{ text: hi, overline: true }];
  if (lo) segments.push({ text: lo, overline: false });
  return {
    value: n,
    segments,
    unicode: [...hi].map((c) => c + OVERLINE).join("") + lo,
    repeatedM: n <= MAX_REPEATED_M ? "M".repeat(thousands) + lo : null,
  };
}

/** Split copyable text (letters followed by U+0305 marks) into display segments. */
export function segmentsFromUnicode(text: string): RomanSegment[] {
  const tokens: { ch: string; bar: boolean }[] = [];
  for (const ch of text) {
    if (ch === OVERLINE) {
      if (tokens.length) tokens[tokens.length - 1].bar = true;
    } else {
      tokens.push({ ch, bar: false });
    }
  }
  const out: RomanSegment[] = [];
  for (const t of tokens) {
    const last = out[out.length - 1];
    if (last && last.overline === t.bar) last.text += t.ch;
    else out.push({ text: t.ch, overline: t.bar });
  }
  return out;
}

/** Lowercase copy of a form (i, ii, iii) as used for preface page numbers. */
export function withCase(form: RomanForm, lowercase: boolean): RomanForm {
  if (!lowercase) return form;
  return {
    ...form,
    segments: form.segments.map((s) => ({ ...s, text: s.text.toLowerCase() })),
    unicode: form.unicode.toLowerCase(),
    repeatedM: form.repeatedM ? form.repeatedM.toLowerCase() : null,
  };
}

/* ------------------------------------------------------------------ */
/* Step-by-step breakdown                                              */
/* ------------------------------------------------------------------ */

export interface PlaceRow {
  place: string;
  letters: string;
  value: number;
  /** e.g. "M + M" or "X − I" */
  how: string;
}

export interface BreakdownBlock {
  title: string | null;
  overline: boolean;
  rows: PlaceRow[];
  /** Sum of the row values (before any x1,000 multiplier). */
  sum: number;
  multiplier: number;
}

const PLACE_NAMES = ["Thousands", "Hundreds", "Tens", "Ones"];

/** Right-to-left evaluation: a smaller letter before a larger one is subtracted. */
function naiveValue(letters: string): number {
  let total = 0;
  let prev = 0;
  for (let i = letters.length - 1; i >= 0; i--) {
    const v = LETTER_VALUES[letters[i]];
    if (v < prev) total -= v;
    else total += v;
    prev = v;
  }
  return total;
}

function chunkHow(group: string): string {
  if (group.length === 2 && LETTER_VALUES[group[0]] < LETTER_VALUES[group[1]]) return `${group[1]} − ${group[0]}`;
  return group.split("").join(" + ");
}

/** Place-value rows for a standard numeral (any number of leading M is allowed). */
export function placeRows(letters: string): PlaceRow[] {
  const m = ANY_M.exec(letters);
  if (!m) return [];
  const rows: PlaceRow[] = [];
  m.slice(1, 5).forEach((group, i) => {
    if (group) rows.push({ place: PLACE_NAMES[i], letters: group, value: naiveValue(group), how: chunkHow(group) });
  });
  return rows;
}

const sumRows = (rows: PlaceRow[]) => rows.reduce((total, r) => total + r.value, 0);

function makeBlocks(hi: string, lo: string): BreakdownBlock[] {
  const blocks: BreakdownBlock[] = [];
  if (hi) {
    const rows = placeRows(hi);
    blocks.push({ title: "Overlined part (each overlined letter counts 1,000 times its value)", overline: true, rows, sum: sumRows(rows), multiplier: 1000 });
  }
  if (lo) {
    const rows = placeRows(lo);
    blocks.push({ title: hi ? "Ordinary part" : null, overline: false, rows, sum: sumRows(rows), multiplier: 1 });
  }
  return blocks;
}

/** Breakdown of the standard form of a number from 1 to 3,999,999. */
export function blocksForNumber(n: number): BreakdownBlock[] {
  const [hi, lo] = toRomanForm(n).segments.reduce<[string, string]>(
    (acc, s) => (s.overline ? [acc[0] + s.text, acc[1]] : [acc[0], acc[1] + s.text]),
    ["", ""],
  );
  return makeBlocks(hi, lo);
}

/* ------------------------------------------------------------------ */
/* Roman -> number, with explanations for invalid input                */
/* ------------------------------------------------------------------ */

export type RomanParse =
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | {
      kind: "valid";
      value: number;
      style: "standard" | "overline" | "repeated-m";
      display: string;
      blocks: BreakdownBlock[];
      canonical: RomanForm;
    }
  | {
      kind: "nonstandard";
      display: string;
      reason: string;
      /** Value of the usual loose reading, or null when the letters are too ambiguous to read. */
      value: number | null;
      suggestion: RomanForm | null;
    };

/** Text for a value in the standard form (used inside explanations). */
function writeAs(value: number): string {
  return value >= 1 && value <= MAX_VALUE ? toRomanForm(value).unicode : fmt(value);
}

interface Diagnosis {
  reason: string;
  /** True when the usual loose reading is meaningful enough to show as a value. */
  readable: boolean;
}

/** Explain why a run of letters is not a standard numeral. Only called for non-standard input. */
function diagnose(letters: string): Diagnosis {
  // 1. Four or more I, X or C in a row (IIII, XXXX, CCCC).
  const run = /I{4,}|X{4,}|C{4,}/.exec(letters);
  if (run) {
    const seq = run[0];
    const ch = seq[0];
    const value = LETTER_VALUES[ch] * seq.length;
    return {
      reason: `${seq} has ${seq.length} ${ch}'s in a row. A letter can appear at most three times in a row, so ${fmt(value)} is written ${writeAs(value)}, not ${seq}.`,
      readable: true,
    };
  }

  // 2. V, L and D are never doubled (VV, LL, DD, VIV).
  for (const [ch, doubled] of [
    ["V", "X"],
    ["L", "C"],
    ["D", "M"],
  ] as const) {
    if (letters.split(ch).length - 1 > 1) {
      const v = LETTER_VALUES[ch];
      return {
        reason: `${ch} appears more than once. ${ch} (${fmt(v)}) is never repeated: two of them make ${fmt(v * 2)}, which is written ${doubled}.`,
        readable: true,
      };
    }
  }

  // 3. A smaller letter in front of a larger one must be one of the six subtractive pairs.
  for (let i = 0; i < letters.length - 1; i++) {
    const a = letters[i];
    const b = letters[i + 1];
    if (LETTER_VALUES[a] < LETTER_VALUES[b] && !SUBTRACTIVE_PAIRS.has(a + b)) {
      const diff = LETTER_VALUES[b] - LETTER_VALUES[a];
      if ("VLD".includes(a)) {
        return {
          reason: `${a + b} puts ${a} in front of ${b}, but V, L and D are never subtracted. ${fmt(LETTER_VALUES[b])} − ${fmt(LETTER_VALUES[a])} = ${fmt(diff)}, which is written ${writeAs(diff)}.`,
          readable: true,
        };
      }
      const allowed = a === "I" ? "V or X" : a === "X" ? "L or C" : "D or M";
      return {
        reason: `${a + b} is not allowed because ${a} can only go in front of ${allowed}. ${fmt(LETTER_VALUES[b])} − ${fmt(LETTER_VALUES[a])} = ${fmt(diff)}, which is written ${writeAs(diff)}.`,
        readable: true,
      };
    }
  }

  // 4. A smaller letter repeated in front of a larger one (IIX, XXC).
  for (let i = 1; i < letters.length - 1; i++) {
    if (letters[i - 1] === letters[i] && LETTER_VALUES[letters[i]] < LETTER_VALUES[letters[i + 1]]) {
      const a = letters[i];
      return {
        reason: `Only one ${a} can go in front of a larger letter, so ${a}${a}${letters[i + 1]} is not standard. Write the amount from largest to smallest instead (for example 8 is VIII, not IIX).`,
        readable: false,
      };
    }
  }

  // 5. Anything else is an ordering problem (IXI, CMC, VIX).
  return {
    reason:
      "The letters are not in a valid order. Numerals run from the largest value to the smallest, and a subtractive pair such as IX or CM must be the last piece of its power of ten (so 11 is XI, not IXI).",
    readable: true,
  };
}

interface Group {
  value: number | null;
  reason: string | null;
}

function evalGroup(letters: string, mode: "standard" | "repeated-m" | "no-m"): Group {
  if (!letters) return { value: 0, reason: null };
  const re = mode === "no-m" ? NO_M : mode === "repeated-m" ? ANY_M : STANDARD;
  if (re.test(letters)) return { value: naiveValue(letters), reason: null };
  if (mode === "no-m" && letters.includes("M")) {
    return {
      value: naiveValue(letters),
      reason: "Once part of a numeral has an overline, the ordinary letters can only cover 1 to 999. Thousands belong in the overlined part.",
    };
  }
  const d = diagnose(letters);
  return { value: d.readable ? naiveValue(letters) : null, reason: d.reason };
}

function describeChar(c: string): string {
  return /[̀-ͯ]/.test(c) ? `the accent mark U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}` : `“${c}”`;
}

function listAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const TOO_LARGE = `That is above the largest value this converter writes, ${fmt(MAX_VALUE)}. Larger numbers need extra notation (a double overline or a box) that has no agreed text form.`;

/** Read a Roman numeral. Accepts any case, spaces, Unicode numeral characters such as Ⅻ and overlines (U+0305). */
export function parseRoman(raw: string): RomanParse {
  const cleaned = raw.normalize("NFKD").replace(WHITESPACE, "");
  if (!cleaned) return { kind: "empty" };
  if (cleaned.length > MAX_INPUT_LENGTH) {
    return { kind: "error", message: `That is too long to be a Roman numeral. Even ${fmt(MAX_VALUE)}, the largest value here, takes fewer than ${MAX_INPUT_LENGTH} characters.` };
  }

  const tokens: { letter: string; bar: boolean }[] = [];
  const bad: string[] = [];
  // Walk the original characters (not the decomposed ones) so an error can name what the person typed, such as "é".
  for (const original of raw) {
    for (const ch of original.normalize("NFKD").replace(WHITESPACE, "")) {
      if (ch === OVERLINE || ch === "\u0304") {
        const last = tokens[tokens.length - 1];
        if (!last) return { kind: "error", message: "An overline has to sit on top of a letter, so it cannot start the numeral." };
        last.bar = true;
        continue;
      }
      const up = ch.toUpperCase();
      if (up.length === 1 && "IVXLCDM".includes(up)) tokens.push({ letter: up, bar: false });
      else if (!bad.includes(original)) bad.push(original);
    }
  }
  if (bad.length) {
    if (bad.some((c) => /\d/.test(c))) {
      return { kind: "error", message: "Digits and Roman letters cannot be mixed. Enter either a number (2026) or a Roman numeral (MMXXVI)." };
    }
    const shown = listAnd(bad.slice(0, 3).map(describeChar));
    return {
      kind: "error",
      message: `${shown} ${bad.length === 1 ? "is not a Roman numeral letter" : "are not Roman numeral letters"}. Only I, V, X, L, C, D and M are used.`,
    };
  }

  const firstPlain = tokens.findIndex((t) => !t.bar);
  const hiTokens = firstPlain === -1 ? tokens : tokens.slice(0, firstPlain);
  const loTokens = firstPlain === -1 ? [] : tokens.slice(firstPlain);
  if (loTokens.some((t) => t.bar)) {
    return { kind: "error", message: `Overlined letters have to come first. The overlined part is the thousands, so it is written before the ordinary letters (${OVERLINED_EXAMPLE}CCCXLV, not CCCXLV${OVERLINED_EXAMPLE}).` };
  }
  const hi = hiTokens.map((t) => t.letter).join("");
  const lo = loTokens.map((t) => t.letter).join("");
  const display = tokens.map((t) => t.letter + (t.bar ? OVERLINE : "")).join("");

  if (/M{4}/.test(hi)) return { kind: "error", message: TOO_LARGE };

  const hiG = evalGroup(hi, "standard");
  const loG = evalGroup(lo, hi ? "no-m" : "repeated-m");

  if (hiG.reason || loG.reason) {
    const reason = hiG.reason ? `Overlined part: ${hiG.reason}` : (loG.reason as string);
    const total = hiG.value !== null && loG.value !== null ? hiG.value * 1000 + loG.value : null;
    const value = total !== null && total >= 1 && total <= MAX_VALUE ? total : null;
    const suggestion = value !== null ? toRomanForm(value) : null;
    return {
      kind: "nonstandard",
      display,
      reason,
      value,
      suggestion: suggestion && suggestion.unicode !== display ? suggestion : null,
    };
  }

  const value = (hiG.value as number) * 1000 + (loG.value as number);
  if (value > MAX_VALUE) return { kind: "error", message: TOO_LARGE };
  return {
    kind: "valid",
    value,
    style: hi ? "overline" : /^M{4,}/.test(lo) ? "repeated-m" : "standard",
    display,
    blocks: makeBlocks(hi, lo),
    canonical: toRomanForm(value),
  };
}

/* ------------------------------------------------------------------ */
/* Decimal input                                                       */
/* ------------------------------------------------------------------ */

export type NumberParse = { kind: "ok"; value: number } | { kind: "error"; message: string };

/** Read a whole number typed with optional thousands separators. */
export function parseNumberInput(raw: string): NumberParse {
  let s = raw.normalize("NFKC").trim().replace(/[\s_\u2009\u202f]/g, "");
  let negative = false;
  if (s.startsWith("-") || s.startsWith("−") || s.startsWith("–")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  if (/^\d[\d,]*,\d*(\.\d*)?$/.test(s) && !/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(s)) {
    return {
      kind: "error",
      message: "Commas are read as thousands separators, so they must sit before groups of three digits (1,000 or 12,345). For a decimal, use a point; note that Roman numerals only express whole numbers.",
    };
  }
  s = s.replace(/,/g, "");
  if (!/^\d+(\.\d*)?$/.test(s)) {
    return { kind: "error", message: "That does not look like a whole number. Type digits such as 2026, or letters such as MMXXVI." };
  }
  const [intPart, frac = ""] = s.split(".");
  if (/[1-9]/.test(frac)) {
    return { kind: "error", message: "Roman numerals only express whole numbers. Round to a whole number first, then convert." };
  }
  const digits = intPart.replace(/^0+/, "");
  if (digits === "") {
    return { kind: "error", message: "There is no Roman numeral for zero. The system starts at I (1). Medieval scribes who needed a zero wrote the Latin word nulla instead." };
  }
  if (negative) {
    return { kind: "error", message: "Roman numerals cannot show negative numbers. Convert the positive value and add the minus sign yourself." };
  }
  if (digits.length > 7 || Number(digits) > MAX_VALUE) return { kind: "error", message: TOO_LARGE };
  return { kind: "ok", value: Number(digits) };
}

export type ConvertResult =
  | { kind: "empty" }
  | { kind: "error"; source: "number" | "roman"; message: string }
  | { kind: "to-roman"; value: number; form: RomanForm; blocks: BreakdownBlock[] }
  | { kind: "from-roman"; parse: Exclude<RomanParse, { kind: "empty" | "error" }> };

/** Two-way conversion: digits go to Roman, letters go to a number. */
export function convert(raw: string): ConvertResult {
  const t = raw.normalize("NFKD").replace(/\s+/g, "");
  if (!t) return { kind: "empty" };
  const hasDigit = /\d/.test(t);
  const hasLetter = /[A-Za-z]/.test(t);
  if (hasDigit && hasLetter) {
    return { kind: "error", source: "roman", message: "Digits and Roman letters cannot be mixed. Enter either a number (2026) or a Roman numeral (MMXXVI)." };
  }
  if (hasDigit || /^[+\-−–.]/.test(t)) {
    const n = parseNumberInput(raw);
    if (n.kind === "error") return { kind: "error", source: "number", message: n.message };
    return { kind: "to-roman", value: n.value, form: toRomanForm(n.value), blocks: blocksForNumber(n.value) };
  }
  const r = parseRoman(raw);
  if (r.kind === "empty") return { kind: "empty" };
  if (r.kind === "error") return { kind: "error", source: "roman", message: r.message };
  return { kind: "from-roman", parse: r };
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export type DateOrder = "mdy" | "dmy" | "ymd";
export type YearStyle = "full" | "short" | "split";
export type SeparatorKey = "dot" | "dash" | "slash" | "space" | "middot" | "bullet";

export const SEPARATORS: Record<SeparatorKey, string> = {
  dot: ".",
  dash: "-",
  slash: "/",
  space: " ",
  middot: " · ",
  bullet: " • ",
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface DateInput {
  month: string;
  day: string;
  year: string;
  order: DateOrder;
  separator: SeparatorKey;
  yearStyle: YearStyle;
}

export interface DatePart {
  label: string;
  value: number;
  arabic: string;
  roman: string;
  /** Value obtained by reading the Roman text back, as a check. */
  readBack: number | null;
}

export type DateResult =
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      parts: DatePart[];
      roman: string;
      arabic: string;
      stacked: string;
      notes: string[];
    };

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

function readBack(roman: string): number | null {
  const r = parseRoman(roman);
  return r.kind === "valid" ? r.value : null;
}

/** Convert a calendar date to Roman numerals, validating it against the Gregorian calendar. */
export function convertDate(input: DateInput): DateResult {
  const dayRaw = input.day.trim();
  const yearRaw = input.year.trim();
  if (!dayRaw || !yearRaw) return { kind: "empty" };

  const month = Number(input.month);
  if (!Number.isInteger(month) || month < 1 || month > 12) return { kind: "error", message: "Choose a month." };
  if (!/^\d{1,2}$/.test(dayRaw)) return { kind: "error", message: "The day must be a whole number from 1 to 31." };
  if (!/^\d+$/.test(yearRaw)) return { kind: "error", message: "The year must be a whole number, for example 2026." };
  const day = Number(dayRaw);
  const year = Number(yearRaw);
  if (year === 0) return { kind: "error", message: "There is no year zero, and Roman numerals have no zero either. Enter a year from 1 to 3,999." };
  if (year > MAX_STANDARD) return { kind: "error", message: "Years above 3,999 cannot be written as a single standard numeral. Enter a year from 1 to 3,999." };
  if (day < 1) return { kind: "error", message: "The day must be from 1 to 31." };
  const dim = daysInMonth(year, month);
  if (day > dim) {
    return { kind: "error", message: `${MONTH_NAMES[month - 1]} ${year} has only ${dim} days, so day ${day} does not exist.` };
  }

  const notes: string[] = [];
  let style = input.yearStyle;
  const y2 = year % 100;
  const century = Math.floor(year / 100);
  if ((style === "short" && y2 === 0) || (style === "split" && (y2 === 0 || century === 0))) {
    notes.push(
      `The year ${year} has a 00 in the part this style would convert, and Roman numerals have no zero, so the full year is shown instead.`,
    );
    style = "full";
  }

  const mk = (label: string, value: number, arabic: string): DatePart => {
    const roman = toStandardRoman(value);
    return { label, value, arabic, roman, readBack: readBack(roman) };
  };
  const monthPart = mk("Month", month, pad2(month));
  const dayPart = mk("Day", day, pad2(day));
  const yearParts: DatePart[] =
    style === "full"
      ? [mk("Year", year, String(year))]
      : style === "short"
        ? [mk("Year (last two digits)", y2, pad2(y2))]
        : [mk("Year (first two digits)", century, String(century)), mk("Year (last two digits)", y2, pad2(y2))];

  const parts =
    input.order === "mdy"
      ? [monthPart, dayPart, ...yearParts]
      : input.order === "dmy"
        ? [dayPart, monthPart, ...yearParts]
        : [...yearParts, monthPart, dayPart];

  const sep = SEPARATORS[input.separator];
  return {
    kind: "ok",
    parts,
    roman: parts.map((p) => p.roman).join(sep),
    arabic: parts.map((p) => p.arabic).join(sep),
    stacked: parts.map((p) => p.roman).join("\n"),
    notes,
  };
}

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

export interface ChartRow {
  n: number;
  roman: string;
}

/** Rows for every whole number from `from` to `to` inclusive (both within 1-3,999). */
export function chartRows(from: number, to: number): ChartRow[] {
  const rows: ChartRow[] = [];
  for (let n = Math.max(1, from); n <= Math.min(MAX_STANDARD, to); n++) rows.push({ n, roman: toStandardRoman(n) });
  return rows;
}

/** Parse the first year of the years table (1 to 3,900 so that 100 rows fit). */
export function parseYearStart(raw: string): number | null {
  const s = raw.trim();
  if (!/^\d{1,4}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= 3900 ? n : null;
}

export function chartText(rows: ChartRow[]): string {
  return rows.map((r) => `${r.n} = ${r.roman}`).join("\n");
}

export function chartCsv(rows: ChartRow[], header: [string, string]): string {
  return [header.join(","), ...rows.map((r) => `${r.n},${r.roman}`)].join("\n") + "\n";
}
