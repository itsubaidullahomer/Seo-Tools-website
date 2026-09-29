/**
 * Pure logic for the Number to Words converter. No DOM access, and user input is
 * never turned into a JavaScript Number: values are handled as digit strings
 * (BigInt for currency rounding), so a 30-digit number stays exact.
 */

/** Longest whole-number part accepted. 36 digits reaches "decillion" on the short scale. */
export const MAX_INT_DIGITS = 36;
/** Longest input string accepted for a single number. */
export const MAX_INPUT_LENGTH = 1000;
/** Most decimal digits read out in plain-words mode. */
export const MAX_FRACTION_DIGITS = 100;
/** Largest scientific-notation exponent accepted (1e30 is fine, 1e5000 is not). */
export const MAX_EXPONENT = 1000;
/** Most lines converted in list mode. */
export const MAX_LIST_LINES = 2000;

export type Mode = "words" | "currency" | "check" | "ordinal";
export type NumberSystem = "international" | "indian";
export type Scale = "short" | "long";
export type CaseStyle = "lower" | "sentence" | "title" | "upper";
export type DecimalMark = "." | ",";
export type NegativeWord = "minus" | "negative";
export type CurrencyCode = "USD" | "GBP" | "EUR" | "CAD" | "AUD" | "INR";

export interface Currency {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** [singular, plural] of the main unit as read aloud. */
  major: [string, string];
  /** [singular, plural] of the subunit. */
  minor: [string, string];
  /** Short name placed after a check-style amount. */
  checkName: string;
  /** Numbering system that people using this currency normally read amounts in. */
  defaultSystem: NumberSystem;
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: "USD", label: "US dollar (USD)", symbol: "$", major: ["dollar", "dollars"], minor: ["cent", "cents"], checkName: "dollars", defaultSystem: "international" },
  GBP: { code: "GBP", label: "British pound (GBP)", symbol: "£", major: ["pound", "pounds"], minor: ["penny", "pence"], checkName: "pounds", defaultSystem: "international" },
  EUR: { code: "EUR", label: "Euro (EUR)", symbol: "€", major: ["euro", "euros"], minor: ["cent", "cents"], checkName: "euros", defaultSystem: "international" },
  CAD: { code: "CAD", label: "Canadian dollar (CAD)", symbol: "$", major: ["Canadian dollar", "Canadian dollars"], minor: ["cent", "cents"], checkName: "dollars", defaultSystem: "international" },
  AUD: { code: "AUD", label: "Australian dollar (AUD)", symbol: "$", major: ["Australian dollar", "Australian dollars"], minor: ["cent", "cents"], checkName: "dollars", defaultSystem: "international" },
  INR: { code: "INR", label: "Indian rupee (INR)", symbol: "₹", major: ["rupee", "rupees"], minor: ["paisa", "paise"], checkName: "rupees", defaultSystem: "indian" },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export interface ConvertOptions {
  mode: Mode;
  currency: CurrencyCode;
  system: NumberSystem;
  scale: Scale;
  caseStyle: CaseStyle;
  /** British style: "one hundred and five". */
  british: boolean;
  /** Hyphenate 21-99: "twenty-one". */
  hyphen: boolean;
  negativeWord: NegativeWord;
  decimalMark: DecimalMark;
  /** Check style: add the currency name after the fraction. */
  checkCurrencyName: boolean;
  /** Currency mode: end with "only". */
  onlySuffix: boolean;
}

export const DEFAULT_OPTIONS: ConvertOptions = {
  mode: "words",
  currency: "USD",
  system: "international",
  scale: "short",
  caseStyle: "sentence",
  british: false,
  hyphen: true,
  negativeWord: "minus",
  decimalMark: ".",
  checkCurrencyName: false,
  onlySuffix: false,
};

/* -------------------------------------------------------------------------- */
/*  Parsing                                                                    */
/* -------------------------------------------------------------------------- */

export interface ParsedNumber {
  negative: boolean;
  /** Whole part without leading zeros ("0" for zero). */
  int: string;
  /** Digits after the decimal mark, trailing zeros preserved. */
  frac: string;
}

export type ParseOutcome =
  | { kind: "empty" }
  | { kind: "invalid"; message: string }
  | { kind: "ok"; value: ParsedNumber; notes: string[] };

const isZeroDigits = (s: string) => /^0*$/.test(s);

/**
 * Parse user text into sign, whole digits and fraction digits without ever using
 * Number. Accepts thousands separators (commas, spaces, underscores, apostrophes),
 * a leading currency symbol, accounting parentheses and scientific notation.
 */
export function parseNumber(raw: string, decimalMark: DecimalMark = "."): ParseOutcome {
  // NFKC turns full-width digits and signs (１２３) into ASCII before parsing.
  let s = raw.normalize("NFKC").trim();
  if (!s) return { kind: "empty" };
  if (s.length > MAX_INPUT_LENGTH) return { kind: "invalid", message: `That input is ${s.length} characters long. Numbers up to ${MAX_INPUT_LENGTH} characters are accepted.` };

  const original = s;
  s = s.replace(/[$£€₹¥]/g, "").trim();
  let negative = false;
  if (s === "(") return { kind: "empty" };
  const parens = /^\((.*)\)$/.exec(s);
  if (parens) {
    negative = true;
    s = parens[1].trim();
  }
  const sign = /^([+\-−])\s*/.exec(s);
  if (sign) {
    if (sign[1] !== "+") negative = true;
    s = s.slice(sign[0].length);
  }
  s = s.replace(/[\s_'’]/g, "");
  // Only a sign, symbol or bracket so far: the person is still typing.
  if (!s) return { kind: "empty" };

  const notes: string[] = [];
  const groupChar = decimalMark === "." ? "," : ".";
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    const lastIsGroup = decimalMark === "." ? lastComma > lastDot : lastDot > lastComma;
    if (lastIsGroup) {
      return {
        kind: "invalid",
        message: `"${original}" looks like ${decimalMark === "." ? "European" : "US/UK"} formatting. Change "Decimal mark" under More options to ${decimalMark === "." ? "comma" : "period"}.`,
      };
    }
  } else {
    const count = s.split(groupChar).length - 1;
    const tail = new RegExp(`\\${groupChar}\\d{1,2}(?:[eE][+-]?\\d+)?$`);
    if (count === 1 && !s.includes(decimalMark) && tail.test(s)) {
      notes.push(
        `"${original}" was read with "${groupChar}" as a thousands separator. If you meant a decimal ${groupChar === "," ? "comma" : "point"}, change "Decimal mark" under More options.`,
      );
    }
  }

  s = s.split(groupChar).join("");
  const pattern = new RegExp(`^(\\d*)(?:\\${decimalMark}(\\d*))?(?:[eE]([+-]?\\d+))?$`);
  const m = pattern.exec(s);
  if (!m) {
    const marks = s.split(decimalMark).length - 1;
    if (marks > 1) return { kind: "invalid", message: `A number can have only one decimal ${decimalMark === "." ? "point" : "comma"}.` };
    const bad = /[^0-9eE+\-.,]/u.exec(s);
    if (bad) return { kind: "invalid", message: `"${bad[0]}" is not a digit. Use 0-9, one decimal point and, if needed, a minus sign.` };
    return { kind: "invalid", message: `"${original}" does not look like a number.` };
  }

  const intPart = m[1] ?? "";
  const fracPart = m[2] ?? "";
  if (!intPart && !fracPart) return m[3] ? { kind: "invalid", message: "Enter at least one digit before the exponent." } : { kind: "empty" };
  const exp = m[3] ? parseInt(m[3], 10) : 0;
  if (!Number.isFinite(exp) || Math.abs(exp) > MAX_EXPONENT) return { kind: "invalid", message: `The exponent is too large. Use an exponent between -${MAX_EXPONENT} and ${MAX_EXPONENT}.` };

  const digits = intPart + fracPart;
  const point = intPart.length + exp;
  let int: string;
  let frac: string;
  if (point <= 0) {
    int = "0";
    frac = "0".repeat(-point) + digits;
  } else if (point >= digits.length) {
    int = digits + "0".repeat(point - digits.length);
    frac = "";
  } else {
    int = digits.slice(0, point);
    frac = digits.slice(point);
  }
  int = int.replace(/^0+(?=\d)/, "");

  if (int.length > MAX_INT_DIGITS) {
    return { kind: "invalid", message: `That number has ${int.length} digits before the decimal point. This tool converts up to ${MAX_INT_DIGITS} digits (as far as decillions on the short scale).` };
  }
  if (frac.length > MAX_FRACTION_DIGITS) {
    return { kind: "invalid", message: `That number has ${frac.length} decimal places. This tool reads up to ${MAX_FRACTION_DIGITS}.` };
  }
  if (isZeroDigits(int) && isZeroDigits(frac)) negative = false;
  return { kind: "ok", value: { negative, int, frac }, notes };
}

/* -------------------------------------------------------------------------- */
/*  Cardinal words                                                             */
/* -------------------------------------------------------------------------- */

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** Names of each three-digit group, index 0 = units. Short scale: billion = 10^9. */
export const SHORT_SCALE = ["", "thousand", "million", "billion", "trillion", "quadrillion", "quintillion", "sextillion", "septillion", "octillion", "nonillion", "decillion"];
/** Long scale: billion = 10^12, with "milliard" for 10^9 and so on. */
export const LONG_SCALE = ["", "thousand", "million", "milliard", "billion", "billiard", "trillion", "trilliard", "quadrillion", "quadrilliard", "quintillion", "quintilliard"];

export interface WordStyle {
  british: boolean;
  hyphen: boolean;
  scale: Scale;
  system: NumberSystem;
}

/** One period of the number (for example "Million" with digits "1" and words "one million"). */
export interface Part {
  label: string;
  digits: string;
  words: string;
  /** British style: read "and" before this part. */
  and: boolean;
  /** True for a final units part below 100. */
  small: boolean;
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function twoDigits(n: number, hyphen: boolean): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const unit = n % 10;
  return unit ? tens + (hyphen ? "-" : " ") + ONES[unit] : tens;
}

/** 1-999 as words. */
function threeDigits(n: number, style: WordStyle): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const out: string[] = [];
  if (hundreds) out.push(`${ONES[hundreds]} hundred`);
  if (rest) out.push((hundreds && style.british ? "and " : "") + twoDigits(rest, style.hyphen));
  return out.join(" ");
}

function internationalParts(int: string, style: WordStyle): Part[] {
  const groupCount = Math.ceil(int.length / 3);
  const padded = int.padStart(groupCount * 3, "0");
  const names = style.scale === "long" ? LONG_SCALE : SHORT_SCALE;
  const parts: Part[] = [];
  for (let i = 0; i < groupCount; i++) {
    const value = parseInt(padded.slice(i * 3, i * 3 + 3), 10);
    if (!value) continue;
    const index = groupCount - 1 - i;
    const name = names[index] ?? "";
    parts.push({
      label: index === 0 ? "Units" : capitalize(name),
      digits: String(value),
      words: threeDigits(value, style) + (name ? ` ${name}` : ""),
      and: false,
      small: index === 0 && value < 100,
    });
  }
  return parts;
}

function indianParts(int: string, style: WordStyle): Part[] {
  const parts: Part[] = [];
  const cr = int.length > 7 ? int.slice(0, -7) : "";
  const rest = int.slice(-7).padStart(7, "0");
  if (cr && !isZeroDigits(cr)) {
    // Above 99 crore the count of crores is itself read in the Indian system
    // ("one lakh crore" = 10^12), the way it is written in Indian finance.
    const crWords = buildParts(cr.replace(/^0+/, ""), style)
      .map((p) => p.words)
      .join(" ");
    parts.push({ label: "Crore", digits: cr.replace(/^0+/, ""), words: `${crWords} crore`, and: false, small: false });
  }
  const lakh = parseInt(rest.slice(0, 2), 10);
  const thousand = parseInt(rest.slice(2, 4), 10);
  const units = parseInt(rest.slice(4), 10);
  if (lakh) parts.push({ label: "Lakh", digits: String(lakh), words: `${twoDigits(lakh, style.hyphen)} lakh`, and: false, small: false });
  if (thousand) parts.push({ label: "Thousand", digits: String(thousand), words: `${twoDigits(thousand, style.hyphen)} thousand`, and: false, small: false });
  if (units) parts.push({ label: "Units", digits: String(units), words: threeDigits(units, style), and: false, small: units < 100 });
  return parts;
}

function buildParts(int: string, style: WordStyle): Part[] {
  if (isZeroDigits(int)) return [];
  return style.system === "indian" ? indianParts(int, style) : internationalParts(int, style);
}

/** Split a whole number (digit string) into periods with their words. Empty for zero. */
export function integerParts(int: string, style: WordStyle): Part[] {
  const parts = buildParts(int, style);
  if (style.british && parts.length > 1) {
    const last = parts[parts.length - 1];
    if (last.small) last.and = true;
  }
  return parts;
}

/** Join periods into a sentence fragment ("one thousand and five"). */
export function partsToWords(parts: Part[]): string {
  return parts.map((p) => (p.and ? "and " : "") + p.words).join(" ");
}

/** Whole number (digit string) as words; "zero" for zero. */
export function integerToWords(int: string, style: WordStyle): string {
  const parts = integerParts(int, style);
  return parts.length ? partsToWords(parts) : "zero";
}

/** Digits read one by one: "05" becomes "zero five". */
export function digitsToWords(digits: string): string {
  return digits
    .split("")
    .map((d) => ONES[Number(d)])
    .join(" ");
}

/* -------------------------------------------------------------------------- */
/*  Ordinals                                                                   */
/* -------------------------------------------------------------------------- */

const IRREGULAR_ORDINALS: Record<string, string> = {
  one: "first",
  two: "second",
  three: "third",
  five: "fifth",
  eight: "eighth",
  nine: "ninth",
  twelve: "twelfth",
};

/** Turn cardinal words into ordinal words by changing the last word ("twenty-one" -> "twenty-first"). */
export function cardinalToOrdinalWords(cardinal: string): string {
  const m = /([a-z]+)$/.exec(cardinal);
  if (!m) return cardinal;
  const last = m[1];
  const ordinal = IRREGULAR_ORDINALS[last] ?? (last.endsWith("y") ? `${last.slice(0, -1)}ieth` : `${last}th`);
  return cardinal.slice(0, cardinal.length - last.length) + ordinal;
}

/** English ordinal suffix for a whole number given as digits: st, nd, rd or th. */
export function ordinalSuffix(int: string): string {
  const lastTwo = parseInt(int.slice(-2), 10);
  if (lastTwo >= 11 && lastTwo <= 13) return "th";
  switch (lastTwo % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/* -------------------------------------------------------------------------- */
/*  Formatting helpers                                                         */
/* -------------------------------------------------------------------------- */

/** Group a digit string with separators: 1,234,567 (international) or 12,34,567 (Indian). */
export function groupDigits(int: string, system: NumberSystem, separator = ","): string {
  if (int.length <= 3) return int;
  if (system === "indian") {
    const tail = int.slice(-3);
    const head = int.slice(0, -3);
    return head.replace(/\B(?=(\d{2})+(?!\d))/g, separator) + separator + tail;
  }
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/** Apply the text-case option. Digits and the "/100" fraction are unaffected. */
export function applyCase(text: string, style: CaseStyle): string {
  switch (style) {
    case "lower":
      return text.toLowerCase();
    case "upper":
      return text.toUpperCase();
    case "sentence":
      return capitalize(text);
    case "title":
      return text
        .split(" ")
        .map((word, i) => (i > 0 && word === "and" ? word : word.split("-").map(capitalize).join("-")))
        .join(" ");
  }
}

/* -------------------------------------------------------------------------- */
/*  Currency                                                                   */
/* -------------------------------------------------------------------------- */

export interface Money {
  negative: boolean;
  /** Whole units as a digit string. */
  major: string;
  /** Subunits, 0-99. */
  minor: number;
  /** True when digits beyond the second decimal place changed the value. */
  rounded: boolean;
}

/** Round to two decimal places (half up on the magnitude) using BigInt, never floating point. */
export function toMoney(value: ParsedNumber): Money | { error: string } {
  const cents = value.frac.slice(0, 2).padEnd(2, "0");
  const roundUp = value.frac.length > 2 && value.frac.charCodeAt(2) >= 53; // "5"
  const rounded = value.frac.length > 2 && /[1-9]/.test(value.frac.slice(2));
  const total = BigInt(value.int + cents) + BigInt(roundUp ? 1 : 0);
  const digits = total.toString().padStart(3, "0");
  const major = digits.slice(0, -2);
  const minor = parseInt(digits.slice(-2), 10);
  if (major.length > MAX_INT_DIGITS) return { error: `That amount has more than ${MAX_INT_DIGITS} digits before the decimal point.` };
  const zero = major === "0" && minor === 0;
  return { negative: value.negative && !zero, major, minor, rounded };
}

/* -------------------------------------------------------------------------- */
/*  Conversion                                                                 */
/* -------------------------------------------------------------------------- */

export type ConvertResult =
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      /** Final text with the case option applied. */
      text: string;
      /** The number as digits with grouping, for example "$1,250.50" or "21st". */
      formatted: string;
      /** Digits in the whole-number part. */
      intDigits: number;
      /** Period-by-period breakdown of the whole-number part. */
      parts: Part[];
      notes: string[];
    };

/** Convert one number typed by the user according to the options. Never throws. */
export function convert(raw: string, o: ConvertOptions): ConvertResult {
  const parsed = parseNumber(raw, o.decimalMark);
  if (parsed.kind === "empty") return { kind: "empty" };
  if (parsed.kind === "invalid") return { kind: "error", message: parsed.message };
  const { value } = parsed;
  const notes = [...parsed.notes];
  const groupSep = o.decimalMark === "." ? "," : ".";
  const negWord = o.negativeWord;

  if (o.mode === "words") {
    const style: WordStyle = { british: o.british, hyphen: o.hyphen, scale: o.scale, system: o.system };
    const parts = integerParts(value.int, style);
    let text = parts.length ? partsToWords(parts) : "zero";
    if (value.frac) text += ` point ${digitsToWords(value.frac)}`;
    if (value.negative) text = `${negWord} ${text}`;
    const formatted =
      (value.negative ? "-" : "") + groupDigits(value.int, o.system, groupSep) + (value.frac ? o.decimalMark + value.frac : "");
    return { kind: "ok", text: applyCase(text, o.caseStyle), formatted, intDigits: isZeroDigits(value.int) ? 1 : value.int.length, parts, notes };
  }

  if (o.mode === "ordinal") {
    if (value.negative || !isZeroDigits(value.frac)) {
      return { kind: "error", message: "Ordinals are for whole numbers of zero or more, such as 21 (twenty-first). Remove the minus sign or decimals." };
    }
    const style: WordStyle = { british: o.british, hyphen: o.hyphen, scale: o.scale, system: "international" };
    const parts = integerParts(value.int, style);
    const text = cardinalToOrdinalWords(parts.length ? partsToWords(parts) : "zero");
    const formatted = groupDigits(value.int, "international", groupSep) + ordinalSuffix(value.int);
    if (o.system === "indian") notes.push("Ordinals are always read in the international system, because words such as “lakhth” are not used in practice.");
    return { kind: "ok", text: applyCase(text, o.caseStyle), formatted, intDigits: value.int.length, parts, notes };
  }

  // Currency and check style share the two-decimal rounding.
  const cur = CURRENCIES[o.currency];
  const money = toMoney(value);
  if ("error" in money) return { kind: "error", message: money.error };
  const shownFormatted =
    (money.negative ? "-" : "") +
    cur.symbol +
    groupDigits(money.major, o.system, groupSep) +
    o.decimalMark +
    String(money.minor).padStart(2, "0");
  if (money.rounded) {
    notes.push(`Rounded to two decimal places (${shownFormatted}) because money has no smaller unit than the ${cur.minor[0]}.`);
  }

  if (o.mode === "check") {
    if (money.negative) return { kind: "error", message: "A check amount cannot be negative. Remove the minus sign." };
    // "and" is reserved for the cents on a check, so it is never used inside the dollars.
    const style: WordStyle = { british: false, hyphen: o.hyphen, scale: o.scale, system: o.system };
    const parts = integerParts(money.major, style);
    const majorWords = parts.length ? partsToWords(parts) : "zero";
    const fraction = `${String(money.minor).padStart(2, "0")}/100`;
    const unitName = o.caseStyle === "upper" ? cur.checkName.toUpperCase() : o.caseStyle === "title" ? capitalize(cur.checkName) : cur.checkName;
    const text = `${applyCase(`${majorWords} and`, o.caseStyle)} ${fraction}${o.checkCurrencyName ? ` ${unitName}` : ""}`;
    if (o.british) notes.push("The British “and” option is ignored in check style, where “and” is reserved for the cents.");
    return { kind: "ok", text, formatted: shownFormatted, intDigits: money.major.length, parts, notes };
  }

  // currency
  const style: WordStyle = { british: o.british, hyphen: o.hyphen, scale: o.scale, system: o.system };
  const parts = integerParts(money.major, style);
  const majorIsZero = money.major === "0";
  const majorPhrase = `${majorIsZero ? "zero" : partsToWords(parts)} ${money.major === "1" ? cur.major[0] : cur.major[1]}`;
  const minorPhrase = money.minor > 0 ? `${twoDigits(money.minor, o.hyphen)} ${money.minor === 1 ? cur.minor[0] : cur.minor[1]}` : "";
  let text: string;
  if (minorPhrase && majorIsZero) text = minorPhrase;
  else if (minorPhrase) text = `${majorPhrase} and ${minorPhrase}`;
  else text = majorPhrase;
  if (money.negative) text = `${negWord} ${text}`;
  if (o.onlySuffix) text += " only";
  return { kind: "ok", text: applyCase(text, o.caseStyle), formatted: shownFormatted, intDigits: majorIsZero ? 1 : money.major.length, parts, notes };
}

export interface ListResult {
  text: string;
  converted: number;
  failed: number;
  errors: { line: number; message: string }[];
  truncated: boolean;
}

/** Convert one number per line, keeping blank lines so results line up with the input. */
export function convertList(input: string, o: ConvertOptions, showNumber: boolean): ListResult {
  const lines = input.split(/\r?\n/);
  const truncated = lines.length > MAX_LIST_LINES;
  const used = truncated ? lines.slice(0, MAX_LIST_LINES) : lines;
  const errors: { line: number; message: string }[] = [];
  let converted = 0;
  const out = used.map((line, i) => {
    const r = convert(line, o);
    if (r.kind === "empty") return "";
    if (r.kind === "error") {
      errors.push({ line: i + 1, message: r.message });
      return showNumber ? `${line.trim()} = (could not convert)` : "(could not convert)";
    }
    converted++;
    return showNumber ? `${line.trim()} = ${r.text}` : r.text;
  });
  return { text: out.join("\n"), converted, failed: errors.length, errors, truncated };
}
