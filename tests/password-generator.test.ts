import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AMBIGUOUS,
  DIGITS,
  GUESSES_PER_SECOND,
  LOWER,
  MAX_COUNT,
  MAX_LENGTH,
  MAX_WORDS,
  MIN_LENGTH,
  MIN_WORDS,
  SYMBOLS,
  UPPER,
  createSecureRng,
  formatCombinations,
  formatGuessTime,
  generatePassphrase,
  generatePassword,
  passphraseEntropyBits,
  planPools,
  randomCombinations,
  randomEntropyBits,
  strengthLabel,
  type RandomOptions,
  type Rng,
} from "../src/tools/password-generator/generator";
import { WORDS } from "../src/tools/password-generator/words";

const ALL: RandomOptions = { length: 16, upper: true, lower: true, digits: true, symbols: true, noAmbiguous: false, noRepeat: false, exclude: "" };
const simpleBits = (len: number, n: number) => len * Math.log2(n);
const shown = (bits: number) => (Math.floor(bits * 10) / 10).toFixed(1); // how the Entropy tile displays bits

/** Deterministic xorshift RNG built on the same unbiased contract as the secure one. */
function seededRng(seed: number): Rng {
  let x = seed >>> 0 || 1;
  const next = () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x;
  };
  return (max) => {
    const limit = 2 ** 32 - (2 ** 32 % max);
    let v = next();
    while (v >= limit) v = next();
    return v % max;
  };
}

test("article: ranges, defaults-related limits and character sets", () => {
  assert.equal(MIN_LENGTH, 8);
  assert.equal(MAX_LENGTH, 128);
  assert.equal(MIN_WORDS, 3);
  assert.equal(MAX_WORDS, 10);
  assert.equal(MAX_COUNT, 20);
  assert.equal(GUESSES_PER_SECOND, 1e10);
  assert.equal(SYMBOLS.length, 28);
  assert.equal(new Set(SYMBOLS).size, 28);
  assert.ok(!/["'\\`]/.test(SYMBOLS)); // quotes, backslash and backtick left out
  assert.equal(UPPER.length + LOWER.length + DIGITS.length + SYMBOLS.length, 90);
  assert.equal(AMBIGUOUS, "0O1lI|");
  assert.equal(planPools(ALL).size, 90);
  assert.equal(planPools({ ...ALL, noAmbiguous: true }).size, 84);
});

test("article: word list – 1,500 unique words of 3-7 lowercase letters; example words are in it", () => {
  assert.equal(WORDS.length, 1500);
  assert.equal(new Set(WORDS).size, 1500);
  assert.ok(WORDS.every((w) => /^[a-z]{3,7}$/.test(w)));
  for (const w of ["maple", "orbit", "cozy", "harbor", "sprint", "teal"]) assert.ok(WORDS.includes(w), w);
  assert.equal(Math.log2(1500).toFixed(2), "10.55");
  assert.equal((Math.log2(1500) / Math.log2(90)).toFixed(1), "1.6");
  assert.equal(Math.log2(7776).toFixed(1), "12.9");
  assert.equal((Math.log2(7776) - Math.log2(1500)).toFixed(1), "2.4");
});

test("article worked example: default 16-character password", () => {
  assert.equal(Math.log2(90).toFixed(2), "6.49");
  assert.equal(simpleBits(16, 90).toFixed(1), "103.9");
  const bits = randomEntropyBits(planPools(ALL), 16, false);
  assert.equal(shown(bits), "103.6");
  assert.equal(formatCombinations(bits), "1.6 × 10^31");
  assert.equal(formatGuessTime(bits), "25 trillion years");
  // 100x faster attacker: about 250 billion years (246 at full precision).
  assert.equal(formatGuessTime(bits, 1e12), "246 billion years");
});

test("article: strength labels and their thresholds", () => {
  assert.equal(strengthLabel(47.9), "Weak");
  assert.equal(strengthLabel(48), "Fair");
  assert.equal(strengthLabel(63.9), "Fair");
  assert.equal(strengthLabel(64), "Strong");
  assert.equal(strengthLabel(79.9), "Strong");
  assert.equal(strengthLabel(80), "Very strong");
  assert.equal(formatGuessTime(48), "4 hours");
  assert.equal(formatGuessTime(64), "29 years");
  assert.equal(formatGuessTime(80), "1.9 million years");
});

test("article reference table (simple formula)", () => {
  const p = (words: number, addNumber = false) => passphraseEntropyBits({ words, separator: "-", capitalize: false, addNumber });
  const rows: [number, string, string][] = [
    [simpleBits(8, 26), "37.6", "10 seconds"],
    [simpleBits(8, 90), "51.9", "2 days"],
    [simpleBits(12, 62), "71.5", "5.1 thousand years"],
    [simpleBits(12, 90), "77.9", "447 thousand years"],
    [simpleBits(16, 26), "75.2", "69 thousand years"],
    [simpleBits(16, 90), "103.9", "29 trillion years"],
    [simpleBits(20, 90), "129.8", "about 10^21 years"],
    [p(4), "42.2", "4 minutes"],
    [p(6), "63.3", "18 years"],
    [p(6, true), "69.2", "1.1 thousand years"],
    [p(7), "73.9", "27 thousand years"],
    [p(8), "84.4", "41 million years"],
  ];
  for (const [bits, label, time] of rows) {
    assert.equal(bits.toFixed(1), label);
    assert.equal(formatGuessTime(bits), time, label);
  }
});

test("article: exact count for 8 characters of all four types reads 50.8 bits (about 1 day)", () => {
  const bits = randomEntropyBits(planPools({ ...ALL, length: 8 }), 8, false);
  assert.equal(shown(bits), "50.8");
  assert.equal(formatGuessTime(bits), "1 day");
  // With a 100x faster attacker the simple 51.9-bit figure falls in about 36 minutes instead of 2 days.
  assert.equal(formatGuessTime(simpleBits(8, 90), 1e12), "36 minutes");
});

test("article: 32 letters and numbers is about 190 bits", () => {
  const plan = planPools({ ...ALL, length: 32, symbols: false });
  assert.equal(plan.size, 62);
  assert.equal(simpleBits(32, 62).toFixed(1), "190.5"); // "about 190 bits"
  assert.ok(Math.abs(randomEntropyBits(plan, 32, false) - 190.5) < 0.1);
});

test("exact count = inclusion-exclusion over the selected types (brute force on a tiny case)", () => {
  const plan = planPools({ ...ALL, length: 3, exclude: "BCDEFGHIJKLMNOPQRSTUVWXYZbcdefghijklmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{};:,.<>/?~" });
  // Pools are now {A}, {a}, {0,1}, {|}: 5 characters, 4 types – impossible at length 3.
  assert.ok(plan.error);
  const small = planPools({ length: 3, upper: true, lower: true, digits: false, symbols: false, noAmbiguous: false, noRepeat: false, exclude: UPPER.slice(2) + LOWER.slice(1) });
  const chars = small.pools.flatMap((p) => p.chars); // A, B, a
  let valid = 0;
  for (const x of chars) for (const y of chars) for (const z of chars) if (/[AB]/.test(x + y + z) && /a/.test(x + y + z)) valid++;
  assert.equal(randomCombinations(small, 3, false), BigInt(valid));
  assert.equal(randomCombinations(small, 3, true), BigInt(6)); // permutations of A, B, a
});

test("generated passwords: right length, only allowed characters, every selected type present", () => {
  const rng = seededRng(12345);
  const cases: RandomOptions[] = [
    ALL,
    { ...ALL, length: 8 },
    { ...ALL, length: 64, noAmbiguous: true },
    { ...ALL, length: 20, symbols: false, exclude: "xyz" },
    { ...ALL, length: 30, noRepeat: true },
  ];
  for (const o of cases) {
    const plan = planPools(o);
    const allowed = new Set(plan.pools.flatMap((p) => p.chars));
    for (let i = 0; i < 200; i++) {
      const pw = generatePassword(plan, o.length, o.noRepeat, rng);
      assert.equal(pw.length, o.length);
      assert.ok([...pw].every((c) => allowed.has(c)));
      for (const p of plan.pools) assert.ok([...pw].some((c) => p.chars.includes(c)), `${p.key} missing in ${pw}`);
      if (o.noAmbiguous) assert.ok(![...pw].some((c) => AMBIGUOUS.includes(c)));
      if (o.noRepeat) assert.equal(new Set(pw).size, pw.length);
    }
  }
});

test("impossible settings are explained instead of producing something weaker", () => {
  assert.match(planPools({ ...ALL, upper: false, lower: false, digits: false, symbols: false }).error ?? "", /at least one character type/);
  assert.match(planPools({ ...ALL, length: 70, symbols: false, noRepeat: true }).error ?? "", /No repeated characters/);
  assert.match(planPools({ ...ALL, digits: true, upper: false, lower: false, symbols: false, exclude: DIGITS }).error ?? "", /excluded/);
  assert.throws(() => generatePassword(planPools({ ...ALL, length: 70, symbols: false, noRepeat: true }), 70, true, seededRng(1)));
});

test("passphrases: word count, separator, capitals, one digit", () => {
  const rng = seededRng(99);
  for (let i = 0; i < 100; i++) {
    const s = generatePassphrase({ words: 6, separator: "-", capitalize: true, addNumber: true }, rng);
    const parts = s.split("-");
    assert.equal(parts.length, 6);
    assert.equal((s.match(/\d/g) ?? []).length, 1);
    for (const part of parts) {
      const word = part.replace(/\d$/, "");
      assert.ok(/^[A-Z]/.test(word));
      assert.ok(WORDS.includes(word.toLowerCase()));
    }
  }
  assert.equal(generatePassphrase({ words: 3, separator: " ", capitalize: false, addNumber: false }, rng).split(" ").length, 3);
});

test("secure RNG: crypto-backed, range-checked and without modulo bias", () => {
  const rng = createSecureRng();
  assert.throws(() => rng(0), RangeError);
  assert.throws(() => rng(1.5), RangeError);
  for (let i = 0; i < 1000; i++) {
    const v = rng(90);
    assert.ok(Number.isInteger(v) && v >= 0 && v < 90);
  }
  // Rejection sampling: with max = 3 * 2^30 a plain modulo would make 0 .. 2^30-1 twice as likely
  // (about 50% of draws instead of 33%). The unbiased sampler stays near one third.
  const max = 3 * 2 ** 30;
  let low = 0;
  const n = 30000;
  for (let i = 0; i < n; i++) if (rng(max) < 2 ** 30) low++;
  assert.ok(Math.abs(low / n - 1 / 3) < 0.03, `share ${low / n}`);
  // Every symbol position is reachable.
  const seen = new Set<number>();
  for (let i = 0; i < 5000; i++) seen.add(rng(90));
  assert.equal(seen.size, 90);
});

test("the generator never uses Math.random", () => {
  const original = Math.random;
  Math.random = () => {
    throw new Error("Math.random used");
  };
  try {
    const plan = planPools(ALL);
    assert.equal(generatePassword(plan, 16, false, createSecureRng()).length, 16);
  } finally {
    Math.random = original;
  }
});
