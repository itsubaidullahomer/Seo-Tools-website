/**
 * Pure percentage math and formatting for the Percentage Calculator.
 * No React, no DOM – easy to unit-test.
 */

export type Parsed = { kind: "empty" } | { kind: "invalid"; hint: string } | { kind: "ok"; value: number };

const NUMBER_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
/** Western (12,500,000) or Indian (1,25,00,000) digit grouping, optional decimals. */
const GROUPED_RE = /^[+-]?(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d*)?(?:e[+-]?\d+)?$/i;
/** What a field holds half-way through typing a number: "-", "+", ".", "-.". */
const IN_PROGRESS_RE = /^[+-]?\.?$/;
const LEADING_CURRENCY_RE = /^([+-]?)[$€£¥₹]/;
const TRAILING_CURRENCY_RE = /[$€£¥₹]$/;

export const INVALID_HINT = "Enter a number, e.g. 25, -3.5 or 1,250.75";
export const DECIMAL_COMMA_HINT = "Use a dot for decimals, e.g. 12.5 (commas only group thousands)";
export const TOO_LARGE_HINT = "This number is too large to calculate with";

/**
 * Parse what a person types into a number field. Accepts thousands separators
 * ("1,250.50" or Indian "1,25,000"), spaces, a currency symbol at either end, a leading "+",
 * a trailing "%" and the unicode minus sign. A decimal comma such as "12,5" is
 * rejected with a hint instead of being silently read as 125.
 */
export function parseNumber(raw: string): Parsed {
  const cleaned = raw
    .trim()
    .replace(/[−–]/g, "-")
    .replace(/[\s_]/g, "")
    .replace(/%$/, "")
    .replace(LEADING_CURRENCY_RE, "$1")
    .replace(TRAILING_CURRENCY_RE, "");
  if (IN_PROGRESS_RE.test(cleaned)) return { kind: "empty" };
  let plain = cleaned;
  if (cleaned.includes(",")) {
    if (!GROUPED_RE.test(cleaned)) return { kind: "invalid", hint: DECIMAL_COMMA_HINT };
    plain = cleaned.replace(/,/g, "");
  }
  if (!NUMBER_RE.test(plain)) return { kind: "invalid", hint: INVALID_HINT };
  const value = Number(plain);
  if (!Number.isFinite(value)) return { kind: "invalid", hint: TOO_LARGE_HINT };
  return { kind: "ok", value };
}

/** Numbers at or above this size lose integer precision in JavaScript doubles. */
export const PRECISION_LIMIT = 1e15;

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

/**
 * Format a result for people: thousands separators, up to 4 decimals, no "-0".
 * Very large or very small non-zero values switch to scientific notation so the
 * number is never silently shown as 0 or as a 25-digit string.
 */
export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return n > 0 ? "∞" : n < 0 ? "-∞" : "undefined";
  const abs = Math.abs(n);
  if (abs >= PRECISION_LIMIT) return n.toExponential(6).replace(/\.?0+e/, "e");
  if (abs !== 0 && abs < 0.00005) return n.toExponential(3).replace(/\.?0+e/, "e");
  const s = fmt.format(n);
  return s === "-0" ? "0" : s;
}

/** Wrap negative numbers in parentheses when they appear inside a formula. */
export function paren(n: number): string {
  const s = formatNum(n);
  return n < 0 ? `(${s})` : s;
}

/** Signed format, e.g. +25 or -12.5. */
export function signed(n: number): string {
  const s = formatNum(n);
  return n > 0 ? `+${s}` : s;
}

export type Calc<T = number> = { ok: true; value: T } | { ok: false; reason: string };

/** 1) What is P% of Y?  result = P / 100 × Y */
export function percentOf(p: number, y: number): Calc {
  return finite((p / 100) * y);
}

/** 2) X is what percent of Y?  result = X / Y × 100 */
export function whatPercent(x: number, y: number): Calc {
  if (y === 0) return { ok: false, reason: "The whole (Y) is 0, and you cannot divide by zero. Enter a non-zero total." };
  return finite((x / y) * 100);
}

export type Direction = "increase" | "decrease" | "no change";

/**
 * 3) Percentage change from X (old) to Y (new).
 * result = (Y − X) / |X| × 100. Using |X| keeps the sign meaningful when the
 * starting value is negative (a loss shrinking from -200 to -50 is an increase).
 */
export function percentChange(from: number, to: number): Calc<{ pct: number; diff: number; direction: Direction }> {
  if (from === 0)
    return {
      ok: false,
      reason: "The starting value is 0, so percentage change is undefined (any growth from zero is infinitely large). Compare the absolute difference instead.",
    };
  const diff = to - from;
  const pct = (diff / Math.abs(from)) * 100;
  if (!Number.isFinite(pct)) return tooLarge();
  return { ok: true, value: { pct, diff, direction: diff > 0 ? "increase" : diff < 0 ? "decrease" : "no change" } };
}

/**
 * 4) Percentage difference between two values (symmetric):
 * |a − b| / ((a + b) / 2) × 100. The average is taken as an absolute value so
 * two negative inputs still give a positive difference.
 */
export function percentDifference(a: number, b: number): Calc<{ pct: number; diff: number; mean: number }> {
  const mean = (a + b) / 2;
  if (mean === 0)
    return { ok: false, reason: "The two values average to 0, so percentage difference is undefined. It is meant for two values with the same sign." };
  const diff = Math.abs(a - b);
  const pct = (diff / Math.abs(mean)) * 100;
  if (!Number.isFinite(pct)) return tooLarge();
  return { ok: true, value: { pct, diff, mean } };
}

export type AddMode = "add" | "subtract";

/** 5) Add or subtract a percentage: value × (1 ± P/100). */
export function applyPercent(value: number, p: number, mode: AddMode): Calc<{ result: number; amount: number }> {
  const amount = (value * p) / 100;
  const result = mode === "add" ? value + amount : value - amount;
  if (!Number.isFinite(result) || !Number.isFinite(amount)) return tooLarge();
  return { ok: true, value: { result, amount } };
}

/**
 * 6) Reverse percentage: the original value before a P% increase or decrease.
 * original = final / (1 ± P/100).
 */
export function reversePercent(final: number, p: number, mode: AddMode): Calc<{ original: number; amount: number; factor: number }> {
  const factor = mode === "add" ? 1 + p / 100 : 1 - p / 100;
  if (factor === 0)
    return {
      ok: false,
      reason:
        mode === "subtract"
          ? "A 100% decrease leaves 0 whatever the original was, so the original value cannot be recovered."
          : "A -100% increase leaves 0 whatever the original was, so the original value cannot be recovered.",
    };
  const original = final / factor;
  if (!Number.isFinite(original)) return tooLarge();
  return { ok: true, value: { original, amount: final - original, factor } };
}

function finite(v: number): Calc {
  return Number.isFinite(v) ? { ok: true, value: v } : tooLarge();
}

function tooLarge(): { ok: false; reason: string } {
  return { ok: false, reason: "The result is too large to calculate. Try smaller numbers." };
}
