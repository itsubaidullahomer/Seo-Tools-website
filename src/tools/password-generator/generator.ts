/**
 * Pure password / passphrase generation and entropy logic.
 *
 * Randomness comes only from `crypto.getRandomValues` (a CSPRNG). Every random
 * choice goes through `Rng`, an unbiased "integer in [0, max)" function, so the
 * logic can be tested with a deterministic generator.
 */
import { WORDS } from "./words";

export const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const LOWER = "abcdefghijklmnopqrstuvwxyz";
export const DIGITS = "0123456789";
/** 28 symbols that are accepted almost everywhere; quotes, backslash and backtick are left out on purpose. */
export const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>/?~|";
/** Characters that are easy to misread in many fonts. */
export const AMBIGUOUS = "0O1lI|";

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 128;
export const MIN_WORDS = 3;
export const MAX_WORDS = 10;
export const MAX_COUNT = 20;
/** Guessing speed assumed for the time-to-guess estimate: 10 billion guesses per second. */
export const GUESSES_PER_SECOND = 1e10;

/** Returns a uniformly distributed integer in [0, max). */
export type Rng = (max: number) => number;

/**
 * Unbiased random integers from the browser's CSPRNG. Uses rejection sampling so
 * that `max` values which do not divide 2^32 evenly are not skewed (no modulo bias).
 */
export function createSecureRng(): Rng {
  const buf = new Uint32Array(256);
  let pos = buf.length;
  const next = () => {
    if (pos >= buf.length) {
      crypto.getRandomValues(buf);
      pos = 0;
    }
    return buf[pos++];
  };
  return (max: number) => {
    if (!Number.isInteger(max) || max < 1 || max > 2 ** 32) throw new RangeError(`invalid range ${max}`);
    const limit = 2 ** 32 - (2 ** 32 % max);
    let x = next();
    while (x >= limit) x = next();
    return x % max;
  };
}

// ---------------------------------------------------------------------------
// Random passwords
// ---------------------------------------------------------------------------

export interface RandomOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  noAmbiguous: boolean;
  noRepeat: boolean;
  /** Extra characters the user never wants to see. */
  exclude: string;
}

export interface CharPool {
  key: "upper" | "lower" | "digits" | "symbols";
  label: string;
  chars: string[];
}

export interface PoolPlan {
  pools: CharPool[];
  /** Selected sets that ended up empty after exclusions. */
  emptied: string[];
  /** Total number of distinct characters available. */
  size: number;
  error?: string;
}

const SETS: { key: CharPool["key"]; label: string; chars: string }[] = [
  { key: "upper", label: "uppercase letters", chars: UPPER },
  { key: "lower", label: "lowercase letters", chars: LOWER },
  { key: "digits", label: "numbers", chars: DIGITS },
  { key: "symbols", label: "symbols", chars: SYMBOLS },
];

/** Works out which characters can be used, after the ambiguous and custom exclusions. */
export function planPools(o: RandomOptions): PoolPlan {
  const blocked = new Set<string>([...o.exclude]);
  if (o.noAmbiguous) for (const c of AMBIGUOUS) blocked.add(c);
  const pools: CharPool[] = [];
  const emptied: string[] = [];
  let selected = 0;
  for (const s of SETS) {
    if (!o[s.key]) continue;
    selected++;
    const chars = [...s.chars].filter((c) => !blocked.has(c));
    if (chars.length) pools.push({ key: s.key, label: s.label, chars });
    else emptied.push(s.label);
  }
  const size = pools.reduce((n, p) => n + p.chars.length, 0);
  let error: string | undefined;
  if (!selected) error = "Turn on at least one character type (uppercase, lowercase, numbers or symbols).";
  else if (!size) error = "Every available character has been excluded. Remove some characters from the exclusion box.";
  else if (o.length < pools.length) error = `The password must be at least ${pools.length} characters long to include one of each selected type.`;
  else if (o.noRepeat && o.length > size)
    error = `“No repeated characters” needs ${o.length} different characters, but only ${size} are available. Shorten the password, turn on more character types or allow repeats.`;
  return { pools, emptied, size, error };
}

function coversAll(chars: string[], pools: CharPool[]): boolean {
  return pools.every((p) => chars.some((c) => p.chars.includes(c)));
}

/**
 * Generates one password that contains at least one character from every pool.
 *
 * Uses rejection sampling: draw a uniformly random string from the combined set and
 * throw it away if a selected type is missing. The result is uniform over all valid
 * passwords, so the entropy figure from `randomEntropyBits` is exact.
 */
export function generatePassword(plan: PoolPlan, length: number, noRepeat: boolean, rng: Rng): string {
  if (plan.error) throw new Error(plan.error);
  const all = plan.pools.flatMap((p) => p.chars);
  for (let attempt = 0; attempt < 10_000; attempt++) {
    const out = noRepeat ? sampleWithoutReplacement(all, length, rng) : Array.from({ length }, () => all[rng(all.length)]);
    if (coversAll(out, plan.pools)) return out.join("");
  }
  // Practically unreachable (needs a pathological exclusion list); fall back to
  // placing one character from each pool and shuffling.
  const used = new Set<string>();
  const out: string[] = [];
  for (const p of plan.pools) {
    const choices = noRepeat ? p.chars.filter((c) => !used.has(c)) : p.chars;
    const c = choices[rng(choices.length)];
    used.add(c);
    out.push(c);
  }
  const rest = noRepeat ? all.filter((c) => !used.has(c)) : all;
  const fill = noRepeat ? sampleWithoutReplacement(rest, length - out.length, rng) : Array.from({ length: length - out.length }, () => rest[rng(rest.length)]);
  return shuffle([...out, ...fill], rng).join("");
}

function sampleWithoutReplacement<T>(items: T[], k: number, rng: Rng): T[] {
  const a = items.slice();
  for (let i = 0; i < k; i++) {
    const j = i + rng(a.length - i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** log2 of a positive BigInt without losing range (values can exceed 2^800). */
export function log2Big(x: bigint): number {
  if (x <= BigInt(0)) return 0;
  const hex = x.toString(16);
  if (hex.length <= 12) return Math.log2(Number(x));
  return Math.log2(parseInt(hex.slice(0, 12), 16)) + 4 * (hex.length - 12);
}

function powBig(base: number, exp: number): bigint {
  let r = BigInt(1);
  const b = BigInt(base);
  for (let i = 0; i < exp; i++) r *= b;
  return r;
}

function fallingBig(n: number, k: number): bigint {
  if (k > n) return BigInt(0);
  let r = BigInt(1);
  for (let i = 0; i < k; i++) r *= BigInt(n - i);
  return r;
}

/**
 * Exact number of passwords the generator can produce: strings of `length` over the
 * combined set that contain every pool at least once (inclusion–exclusion), with or
 * without repeated characters.
 */
export function randomCombinations(plan: PoolPlan, length: number, noRepeat: boolean): bigint {
  const sizes = plan.pools.map((p) => p.chars.length);
  let total = BigInt(0);
  for (let mask = 0; mask < 1 << sizes.length; mask++) {
    let missing = 0;
    let bits = 0;
    sizes.forEach((s, i) => {
      if (mask & (1 << i)) {
        missing += s;
        bits++;
      }
    });
    const n = plan.size - missing;
    const term = noRepeat ? fallingBig(n, length) : n > 0 || length === 0 ? powBig(n, length) : BigInt(0);
    total += bits % 2 ? -term : term;
  }
  return total;
}

export function randomEntropyBits(plan: PoolPlan, length: number, noRepeat: boolean): number {
  if (plan.error) return 0;
  return log2Big(randomCombinations(plan, length, noRepeat));
}

// ---------------------------------------------------------------------------
// Passphrases
// ---------------------------------------------------------------------------

export interface PassphraseOptions {
  words: number;
  separator: string;
  capitalize: boolean;
  addNumber: boolean;
}

export function generatePassphrase(o: PassphraseOptions, rng: Rng, list: readonly string[] = WORDS): string {
  const picked = Array.from({ length: o.words }, () => list[rng(list.length)]);
  const words = o.capitalize ? picked.map((w) => w[0].toUpperCase() + w.slice(1)) : picked;
  if (o.addNumber) {
    const i = rng(words.length);
    words[i] = words[i] + String(rng(10));
  }
  return words.join(o.separator);
}

/** words × log2(list size), plus log2(10 digits × positions) when a number is added. */
export function passphraseEntropyBits(o: PassphraseOptions, listSize: number = WORDS.length): number {
  return o.words * Math.log2(listSize) + (o.addNumber ? Math.log2(10 * o.words) : 0);
}

// ---------------------------------------------------------------------------
// Strength and time-to-guess
// ---------------------------------------------------------------------------

export type StrengthLevel = "Weak" | "Fair" | "Strong" | "Very strong";

export function strengthLabel(bits: number): StrengthLevel {
  if (bits >= 80) return "Very strong";
  if (bits >= 64) return "Strong";
  if (bits >= 48) return "Fair";
  return "Weak";
}

const YEAR = 365.25 * 24 * 3600;

/**
 * Average time to guess: half of the 2^bits possibilities at `rate` guesses per
 * second. Works in log space so 800-bit values do not overflow.
 */
export function averageGuessSeconds(bits: number, rate = GUESSES_PER_SECOND): number {
  return 2 ** (bits - 1) / rate;
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

export function formatGuessTime(bits: number, rate = GUESSES_PER_SECOND): string {
  const log10Seconds = (bits - 1) * Math.log10(2) - Math.log10(rate);
  if (log10Seconds < 0) return "less than a second";
  const s = 10 ** log10Seconds;
  if (s < 60) return plural(Math.round(s), "second");
  if (s < 3600) return plural(Math.round(s / 60), "minute");
  if (s < 86400) return plural(Math.round(s / 3600), "hour");
  if (s < YEAR) return plural(Math.round(s / 86400), "day");
  const log10Years = log10Seconds - Math.log10(YEAR);
  if (log10Years < 3) return plural(Math.round(10 ** log10Years), "year");
  const scales: [number, string][] = [
    [12, "trillion"],
    [9, "billion"],
    [6, "million"],
    [3, "thousand"],
  ];
  if (log10Years >= 15) return `about 10^${Math.floor(log10Years)} years`;
  for (const [exp, word] of scales) {
    if (log10Years >= exp) {
      const v = 10 ** (log10Years - exp);
      return `${v >= 100 ? Math.round(v) : Number(v.toPrecision(2))} ${word} years`;
    }
  }
  return plural(Math.round(10 ** log10Years), "year");
}

/** "≈ 10^31" style description of 2^bits. */
export function formatCombinations(bits: number): string {
  const e = bits * Math.log10(2);
  if (e < 6) return Math.round(2 ** bits).toLocaleString("en-US");
  const mant = 10 ** (e - Math.floor(e));
  return `${mant.toFixed(1)} × 10^${Math.floor(e)}`;
}
