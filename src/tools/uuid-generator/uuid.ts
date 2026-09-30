/**
 * Pure logic for the UUID / GUID generator: no React, no DOM, no imports.
 *
 * Randomness, the clock and SHA-1 are injected through `Env` so every function
 * can be tested with fixed inputs. `browserEnv()` builds the real environment
 * and is only called from event handlers and effects (never during render).
 *
 * BigInt literals (`1n`) need an ES2020 target, so the helper `big()` is used
 * instead. The layouts follow RFC 9562 (which replaced RFC 4122 in 2024).
 */

export const MAX_COUNT = 10_000;
export const MAX_NANOID_LENGTH = 128;

export type IdType = "v4" | "v7" | "v1" | "v5" | "v3" | "v6" | "nil" | "max" | "ulid" | "nanoid";

export const UUID_FAMILY: IdType[] = ["v4", "v7", "v1", "v5", "v3", "v6", "nil", "max"];

export function isUuidFamily(type: IdType): boolean {
  return UUID_FAMILY.includes(type);
}

/** Injected side effects. */
export interface Env {
  /** Milliseconds since the Unix epoch. */
  now: () => number;
  /** Cryptographically secure random bytes. */
  randomBytes: (n: number) => Uint8Array;
  /** Native `crypto.randomUUID`, used for v4 when the browser has it. */
  randomUUID?: () => string;
  /** SHA-1 digest (needs SubtleCrypto, which browsers only expose on HTTPS or localhost). */
  sha1?: (data: Uint8Array) => Promise<Uint8Array>;
}

/** Build the real environment. Call only on the client, inside a handler or effect. */
export function browserEnv(): Env {
  const c = globalThis.crypto;
  const subtle = c?.subtle;
  return {
    now: () => Date.now(),
    randomBytes: (n) => {
      const out = new Uint8Array(n);
      // getRandomValues accepts at most 65,536 bytes per call.
      for (let i = 0; i < n; i += 65536) c.getRandomValues(out.subarray(i, Math.min(n, i + 65536)));
      return out;
    },
    randomUUID: typeof c?.randomUUID === "function" ? () => c.randomUUID() : undefined,
    sha1: subtle
      ? async (data) => new Uint8Array(await subtle.digest("SHA-1", data as unknown as BufferSource))
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const big = (v: number | string): bigint => BigInt(v);
const mask = (bits: number): bigint => (big(1) << big(bits)) - big(1);

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));

export function bytesToHex(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += HEX[b[i]];
  return s;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** 32 hex digits to canonical 8-4-4-4-12 form. */
export function hexToUuid(h: string): string {
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export function bytesToUuid(b: Uint8Array): string {
  return hexToUuid(bytesToHex(b));
}

function bigToUuid(v: bigint): string {
  return hexToUuid(v.toString(16).padStart(32, "0"));
}

function randomBig(env: Env, bits: number): bigint {
  const bytes = env.randomBytes(Math.ceil(bits / 8));
  return BigInt("0x" + bytesToHex(bytes)) & mask(bits);
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Version 4: 122 random bits. */
export function uuidV4(env: Env): string {
  if (env.randomUUID) return env.randomUUID();
  const b = env.randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return bytesToUuid(b);
}

/** Milliseconds between 1582-10-15 (the Gregorian epoch) and 1970-01-01, in 100 ns ticks. */
export const GREGORIAN_OFFSET_TICKS = big("122192928000000000");
const TICKS_PER_MS = big(10000);

/**
 * Versions 1 and 6 share one 60-bit timestamp (100 ns ticks since 1582-10-15).
 * The node is random with the multicast bit set (RFC 9562 section 6.10), so no
 * real MAC address is ever used. Timestamps strictly increase within a batch.
 */
export function createTimeGenerator(env: Env, version: 1 | 6): () => string {
  const node = env.randomBytes(6);
  node[0] |= 0x01; // multicast bit: marks the node as randomly generated
  const nodeValue = BigInt("0x" + bytesToHex(node));
  const cs = env.randomBytes(2);
  const clockSeq = ((cs[0] << 8) | cs[1]) & 0x3fff;
  const variantAndClock = big(0x8000 | clockSeq);
  let last = big(-1);

  return () => {
    let ts = big(Math.floor(env.now())) * TICKS_PER_MS + GREGORIAN_OFFSET_TICKS;
    if (ts <= last) ts = last + big(1);
    last = ts;
    let value: bigint;
    if (version === 1) {
      const timeLow = ts & mask(32);
      const timeMid = (ts >> big(32)) & mask(16);
      const timeHi = (ts >> big(48)) & mask(12);
      value = (timeLow << big(96)) | (timeMid << big(80)) | (big(1) << big(76)) | (timeHi << big(64));
    } else {
      const timeHigh = (ts >> big(28)) & mask(32);
      const timeMid = (ts >> big(12)) & mask(16);
      const timeLow = ts & mask(12);
      value = (timeHigh << big(96)) | (timeMid << big(80)) | (big(6) << big(76)) | (timeLow << big(64));
    }
    return bigToUuid(value | (variantAndClock << big(48)) | nodeValue);
  };
}

/**
 * Version 7: 48-bit Unix millisecond timestamp, 4 version bits, 12 + 62 random
 * bits (74 in total, as rand_a and rand_b) and 2 variant bits.
 *
 * Within one millisecond the 74 random bits are treated as a counter that grows
 * by a random amount (RFC 9562 "monotonic random"), so every UUID in a batch is
 * strictly greater than the one before it. A clock that steps backwards is
 * ignored: the last timestamp keeps counting up instead.
 */
export function createV7Generator(env: Env): () => string {
  let lastMs = -1;
  let rand = big(0);
  return () => {
    const ms = Math.max(Math.floor(env.now()), lastMs);
    // The seed has its top bit clear (73 of 74 bits), and a batch adds at most
    // 10,000 steps of up to 2^32, so the counter can never overflow 74 bits.
    rand = ms === lastMs ? rand + randomBig(env, 32) + big(1) : randomBig(env, 73);
    lastMs = ms;
    const randA = rand >> big(62);
    const randB = rand & mask(62);
    const value = (big(ms) << big(80)) | (big(7) << big(76)) | (randA << big(64)) | (big(2) << big(62)) | randB;
    return bigToUuid(value);
  };
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeUlidValue(value: bigint): string {
  let v = value;
  let out = "";
  for (let i = 0; i < 26; i++) {
    out = CROCKFORD[Number(v & big(31))] + out;
    v >>= big(5);
  }
  return out;
}

/** ULID: 48-bit millisecond timestamp + 80 random bits, Crockford Base32, monotonic within a batch. */
export function createUlidGenerator(env: Env): () => string {
  let lastMs = -1;
  let rand = big(0);
  return () => {
    const ms = Math.max(Math.floor(env.now()), lastMs);
    rand = ms === lastMs ? rand + randomBig(env, 32) + big(1) : randomBig(env, 79); // 79-bit seed leaves headroom to count up
    lastMs = ms;
    return encodeUlidValue((big(ms) << big(80)) | rand);
  };
}

/** 128-bit value of a UUID's bytes as a ULID string. */
export function bytesToUlid(bytes: Uint8Array): string {
  return encodeUlidValue(BigInt("0x" + bytesToHex(bytes)));
}

export const NANOID_ALPHABETS = {
  url: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-",
  alnum: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  lower: "abcdefghijklmnopqrstuvwxyz0123456789",
  hex: "0123456789abcdef",
  digits: "0123456789",
} as const;
export type NanoAlphabet = keyof typeof NANOID_ALPHABETS;

/** Random string from `alphabet` using rejection sampling, so every symbol is equally likely. */
export function nanoId(env: Env, length: number, alphabet: string): string {
  const n = alphabet.length;
  if (n < 2 || n > 256) throw new Error("Alphabet must have between 2 and 256 symbols.");
  const m = (2 << (31 - Math.clz32((n - 1) | 1))) - 1; // smallest all-ones mask covering n - 1
  const step = Math.ceil((1.6 * m * length) / n) + 4;
  let out = "";
  while (out.length < length) {
    const bytes = env.randomBytes(step);
    for (let i = 0; i < bytes.length && out.length < length; i++) {
      const idx = bytes[i] & m;
      if (idx < n) out += alphabet[idx];
    }
  }
  return out;
}

// --- MD5 (version 3 needs it; SubtleCrypto does not offer MD5) --------------

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23,
  4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];
const MD5_K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0);

export function md5(data: Uint8Array): Uint8Array {
  const len = data.length;
  const paddedLen = (((len + 8) >> 6) + 1) << 6;
  const buf = new Uint8Array(paddedLen);
  buf.set(data);
  buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(paddedLen - 8, (len << 3) >>> 0, true);
  dv.setUint32(paddedLen - 4, Math.floor(len / 0x20000000), true);

  let a0 = 0x67452301 | 0;
  let b0 = 0xefcdab89 | 0;
  let c0 = 0x98badcfe | 0;
  let d0 = 0x10325476 | 0;
  const M = new Int32Array(16);

  for (let off = 0; off < paddedLen; off += 64) {
    for (let i = 0; i < 16; i++) M[i] = dv.getInt32(off + i * 4, true);
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + MD5_K[i] + M[g]) | 0;
      A = D;
      D = C;
      C = B;
      const s = MD5_S[i];
      B = (B + ((F << s) | (F >>> (32 - s)))) | 0;
    }
    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }
  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setInt32(0, a0, true);
  odv.setInt32(4, b0, true);
  odv.setInt32(8, c0, true);
  odv.setInt32(12, d0, true);
  return out;
}

// --- Name-based UUIDs -------------------------------------------------------

export const NAMESPACES = {
  dns: { label: "DNS (domain names)", uuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8" },
  url: { label: "URL", uuid: "6ba7b811-9dad-11d1-80b4-00c04fd430c8" },
  oid: { label: "OID (ISO object IDs)", uuid: "6ba7b812-9dad-11d1-80b4-00c04fd430c8" },
  x500: { label: "X.500 (distinguished names)", uuid: "6ba7b814-9dad-11d1-80b4-00c04fd430c8" },
} as const;
export type NamespaceKey = keyof typeof NAMESPACES | "custom";

function withVersion(hash: Uint8Array, version: 3 | 5): string {
  const b = hash.slice(0, 16);
  b[6] = (b[6] & 0x0f) | (version << 4);
  b[8] = (b[8] & 0x3f) | 0x80;
  return bytesToUuid(b);
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
}

const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);

/** Version 3: MD5 of namespace bytes followed by the UTF-8 name. */
export function uuidV3(namespace: Uint8Array, name: string): string {
  return withVersion(md5(concat(namespace, utf8(name))), 3);
}

/** Version 5: SHA-1 of namespace bytes followed by the UTF-8 name (first 128 bits). */
export async function uuidV5(env: Env, namespace: Uint8Array, name: string): Promise<string> {
  if (!env.sha1) throw new Error("This browser context does not offer SubtleCrypto (SHA-1). Open the page over HTTPS or on localhost.");
  return withVersion(await env.sha1(concat(namespace, utf8(name))), 5);
}

// ---------------------------------------------------------------------------
// Batch generation
// ---------------------------------------------------------------------------

export type GenRequest =
  | { type: "v4" | "v7" | "v1" | "v6" | "ulid"; count: number }
  | { type: "nil" | "max" }
  | { type: "v3" | "v5"; namespace: string; names: string[] }
  | { type: "nanoid"; count: number; length: number; alphabet: string };

export const NIL_UUID = "00000000-0000-0000-0000-000000000000";
export const MAX_UUID = "ffffffff-ffff-ffff-ffff-ffffffffffff";

export async function generateBatch(req: GenRequest, env: Env): Promise<string[]> {
  switch (req.type) {
    case "v4":
      return Array.from({ length: req.count }, () => uuidV4(env));
    case "v1":
    case "v6": {
      const next = createTimeGenerator(env, req.type === "v1" ? 1 : 6);
      return Array.from({ length: req.count }, next);
    }
    case "v7": {
      const next = createV7Generator(env);
      return Array.from({ length: req.count }, next);
    }
    case "ulid": {
      const next = createUlidGenerator(env);
      return Array.from({ length: req.count }, next);
    }
    case "nil":
      return [NIL_UUID];
    case "max":
      return [MAX_UUID];
    case "nanoid":
      return Array.from({ length: req.count }, () => nanoId(env, req.length, req.alphabet));
    case "v3":
    case "v5": {
      const parsed = parseId(req.namespace);
      if (!parsed.ok || parsed.value.kind !== "uuid") throw new Error("The namespace is not a valid UUID.");
      const ns = parsed.value.bytes;
      if (req.type === "v3") return req.names.map((n) => uuidV3(ns, n));
      const out: string[] = [];
      for (let i = 0; i < req.names.length; i += 500) {
        const chunk = req.names.slice(i, i + 500);
        out.push(...(await Promise.all(chunk.map((n) => uuidV5(env, ns, n)))));
      }
      return out;
    }
  }
}

// ---------------------------------------------------------------------------
// Input parsing
// ---------------------------------------------------------------------------

export type CountResult = { ok: true; value: number } | { ok: false; reason: string };

export function parseCount(text: string, max = MAX_COUNT): CountResult {
  let t = text.trim();
  if (/^\d{1,3}(,\d{3})+$/.test(t)) t = t.replace(/,/g, ""); // "1,000" is accepted as 1000
  if (t === "") return { ok: false, reason: "Enter how many to generate." };
  if (!/^\d+$/.test(t)) return { ok: false, reason: "Use a whole number, for example 25." };
  const n = Number(t);
  if (n < 1) return { ok: false, reason: "Generate at least 1." };
  if (n > max) return { ok: false, reason: `The maximum is ${max.toLocaleString("en-US")} per batch.` };
  return { ok: true, value: n };
}

/** One name per line; each line is trimmed and blank lines are skipped. */
export function parseNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "");
}

export interface ParsedId {
  kind: "uuid" | "ulid";
  bytes: Uint8Array;
  /** Canonical lowercase 8-4-4-4-12 form (for a ULID, the same 128 bits as a UUID). */
  uuid: string;
  /** Canonical uppercase 26-character ULID form of the same 128 bits. */
  ulid: string;
}

export type ParseResult = { ok: true; value: ParsedId } | { ok: false; reason: string };

function fromBytes(kind: "uuid" | "ulid", bytes: Uint8Array): ParsedId {
  return { kind, bytes, uuid: bytesToUuid(bytes), ulid: bytesToUlid(bytes) };
}

/** Accepts UUIDs with or without dashes, in braces, as urn:uuid:, in any case, and 26-character ULIDs. */
export function parseId(raw: string): ParseResult {
  let s = raw.trim();
  if (s === "") return { ok: false, reason: "Empty value." };
  s = s.replace(/^urn:uuid:/i, "");
  if (s.startsWith("{") || s.endsWith("}")) {
    if (!(s.startsWith("{") && s.endsWith("}"))) return { ok: false, reason: "Unbalanced braces." };
    s = s.slice(1, -1).trim();
  }

  // ULID: exactly 26 characters and no dashes.
  if (s.length === 26 && !s.includes("-")) {
    const up = s.toUpperCase();
    for (const ch of up) {
      if (!CROCKFORD.includes(ch)) {
        return { ok: false, reason: `"${ch}" is not in the ULID alphabet (0-9 and A-Z without I, L, O and U).` };
      }
    }
    if (up[0] > "7") return { ok: false, reason: "A ULID cannot start with a character above 7; the value would not fit in 128 bits." };
    let v = big(0);
    for (const ch of up) v = v * big(32) + big(CROCKFORD.indexOf(ch));
    return { ok: true, value: fromBytes("ulid", hexToBytes(v.toString(16).padStart(32, "0"))) };
  }

  const bad = s.match(/[^0-9a-fA-F-]/);
  if (bad) return { ok: false, reason: `"${bad[0]}" is not a hexadecimal digit (0-9, a-f).` };
  const digits = s.replace(/-/g, "");
  if (digits.length !== 32) {
    return { ok: false, reason: `Found ${digits.length} hex digits; a UUID has exactly 32 (a ULID has 26 characters).` };
  }
  if (s.includes("-") && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s)) {
    return { ok: false, reason: "Dashes must split the digits as 8-4-4-4-12." };
  }
  return { ok: true, value: fromBytes("uuid", hexToBytes(digits.toLowerCase())) };
}

/** Split pasted text into candidates: whitespace, commas and semicolons separate; quotes and brackets are stripped. */
export function tokenize(input: string): string[] {
  return input
    .split(/[\s,;]+/)
    .map((t) => t.replace(/^[\["'`(]+|[\]"'`)]+$/g, ""))
    .filter((t) => t !== "");
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

export interface DecodedTime {
  /** Unix time in milliseconds (may be negative for old v1/v6 dates). */
  ms: number;
  /** ISO 8601 UTC string, or null if outside the range JavaScript dates can represent. */
  iso: string | null;
  /** Extra 100 ns ticks after the millisecond (v1 and v6 only). */
  subMsTicks?: number;
  /** The raw 60-bit timestamp in 100 ns ticks since 1582-10-15 (v1 and v6 only). */
  rawTicks?: string;
}

export interface Decoded {
  kind: "uuid" | "ulid";
  /** Version number 1-8, or null for nil, max, ULID and non-RFC variants. */
  version: number | null;
  versionLabel: string;
  variant: string;
  special?: "nil" | "max";
  time?: DecodedTime;
  node?: { hex: string; randomlyGenerated: boolean };
  clockSeq?: number;
  notes: string[];
}

function safeIso(ms: number): string | null {
  try {
    return new Date(ms).toISOString();
  } catch {
    return null;
  }
}

function timeFromMs(ms: number): DecodedTime {
  return { ms, iso: safeIso(ms) };
}

function beNumber(b: Uint8Array, from: number, to: number): number {
  let n = 0;
  for (let i = from; i < to; i++) n = n * 256 + b[i];
  return n;
}

function timeFromTicks(ts: bigint): DecodedTime {
  const diff = ts - GREGORIAN_OFFSET_TICKS;
  let q = diff / TICKS_PER_MS;
  let r = diff % TICKS_PER_MS;
  if (r < big(0)) {
    q -= big(1);
    r += TICKS_PER_MS;
  }
  const ms = Number(q);
  return { ms, iso: safeIso(ms), subMsTicks: Number(r), rawTicks: ts.toString(10) };
}

const VERSION_LABELS: Record<number, string> = {
  1: "Version 1 (Gregorian timestamp + node)",
  2: "Version 2 (DCE security)",
  3: "Version 3 (MD5 of a namespace and name)",
  4: "Version 4 (random)",
  5: "Version 5 (SHA-1 of a namespace and name)",
  6: "Version 6 (reordered Gregorian timestamp)",
  7: "Version 7 (Unix millisecond timestamp + random)",
  8: "Version 8 (custom, vendor-defined)",
};

export function decodeId(p: ParsedId): Decoded {
  const b = p.bytes;
  const notes: string[] = [];

  if (p.kind === "ulid") {
    return {
      kind: "ulid",
      version: null,
      versionLabel: "ULID (not a UUID)",
      variant: "n/a",
      time: timeFromMs(beNumber(b, 0, 6)),
      notes: ["A ULID is a 48-bit millisecond timestamp followed by 80 random bits, written in Crockford Base32. It converts losslessly to the same 128 bits as a UUID."],
    };
  }

  if (p.uuid === NIL_UUID) {
    return { kind: "uuid", version: null, versionLabel: "Nil UUID (all zeros)", variant: "n/a", special: "nil", notes: ["The nil UUID is a placeholder meaning \"no value\". It is not random and should never identify a real record."] };
  }
  if (p.uuid === MAX_UUID) {
    return { kind: "uuid", version: null, versionLabel: "Max UUID (all ones)", variant: "n/a", special: "max", notes: ["The max UUID (all bits set) is defined by RFC 9562 as a sentinel upper bound, for example for range queries."] };
  }

  const v8 = b[8];
  let variant: string;
  let rfcVariant = false;
  if ((v8 & 0x80) === 0) variant = "0xxx: NCS backward compatibility";
  else if ((v8 & 0xc0) === 0x80) {
    variant = "10xx: RFC 9562 (the standard variant)";
    rfcVariant = true;
  } else if ((v8 & 0xe0) === 0xc0) variant = "110x: Microsoft GUID (reserved)";
  else variant = "111x: reserved for future use";

  const version = b[6] >> 4;
  if (!rfcVariant) {
    notes.push("The variant bits are not the RFC 9562 pattern (10xx), so the version digit does not describe how this value was made. It may be a legacy identifier or arbitrary data.");
    return { kind: "uuid", version: null, versionLabel: "Unknown (non-standard variant)", variant, notes };
  }

  const result: Decoded = {
    kind: "uuid",
    version,
    versionLabel: VERSION_LABELS[version] ?? `Version ${version} (not assigned by RFC 9562)`,
    variant,
    notes,
  };

  if (version === 1) {
    const ts = (big(((b[6] & 0x0f) << 8) | b[7]) << big(48)) | (big(beNumber(b, 4, 6)) << big(32)) | big(beNumber(b, 0, 4));
    result.time = timeFromTicks(ts);
    result.clockSeq = ((b[8] & 0x3f) << 8) | b[9];
    result.node = nodeInfo(b);
  } else if (version === 6) {
    const ts = (big(beNumber(b, 0, 4)) << big(28)) | (big(beNumber(b, 4, 6)) << big(12)) | big(((b[6] & 0x0f) << 8) | b[7]);
    result.time = timeFromTicks(ts);
    result.clockSeq = ((b[8] & 0x3f) << 8) | b[9];
    result.node = nodeInfo(b);
  } else if (version === 7) {
    result.time = timeFromMs(beNumber(b, 0, 6));
    notes.push("The remaining 74 bits are random (or a counter that keeps IDs from one generator in order).");
  } else if (version === 4) {
    notes.push("122 of the 128 bits are random. There is nothing to decode beyond the version and variant.");
  } else if (version === 3 || version === 5) {
    notes.push("The bits are a hash of a namespace UUID and a name. The same inputs always give the same UUID, and the inputs cannot be recovered from it.");
  } else if (version === 8) {
    notes.push("Version 8 layouts are defined by whoever generated the value, so there is no standard way to decode the other bits.");
  } else if (version === 2) {
    notes.push("Version 2 (DCE security) UUIDs embed a local domain and ID. RFC 9562 only reserves the version number and gives no layout.");
  } else {
    notes.push("RFC 9562 defines versions 1 to 8. This version digit is not assigned.");
  }
  return result;
}

function nodeInfo(b: Uint8Array): { hex: string; randomlyGenerated: boolean } {
  const parts: string[] = [];
  for (let i = 10; i < 16; i++) parts.push(HEX[b[i]]);
  return { hex: parts.join(":"), randomlyGenerated: (b[10] & 0x01) === 1 };
}

// ---------------------------------------------------------------------------
// Other representations of the same 128 bits
// ---------------------------------------------------------------------------

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? B64[n & 63] : "=";
  }
  return out;
}

/** Byte order of .NET's Guid.ToByteArray(): the first three groups are little-endian. */
export function toGuidByteOrderHex(bytes: Uint8Array): string {
  const g = bytes.slice();
  [g[0], g[1], g[2], g[3]] = [bytes[3], bytes[2], bytes[1], bytes[0]];
  [g[4], g[5]] = [bytes[5], bytes[4]];
  [g[6], g[7]] = [bytes[7], bytes[6]];
  return bytesToHex(g);
}

export interface FormatRow {
  label: string;
  value: string;
}

export function representations(p: ParsedId): FormatRow[] {
  const hex = bytesToHex(p.bytes);
  return [
    { label: "Lowercase", value: p.uuid },
    { label: "Uppercase", value: p.uuid.toUpperCase() },
    { label: "No dashes", value: hex },
    { label: "Braces (GUID style)", value: `{${p.uuid}}` },
    { label: "URN", value: `urn:uuid:${p.uuid}` },
    { label: "ULID form (Base32)", value: p.ulid },
    { label: "Base64", value: toBase64(p.bytes) },
    { label: "128-bit integer", value: BigInt("0x" + hex).toString(10) },
    { label: ".NET Guid.ToByteArray() hex", value: toGuidByteOrderHex(p.bytes) },
  ];
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

export type Layout = "lines" | "comma" | "single" | "double" | "json";

export const LAYOUTS: { value: Layout; label: string }[] = [
  { value: "lines", label: "One per line" },
  { value: "comma", label: "Comma separated" },
  { value: "single", label: "Single-quoted list (SQL)" },
  { value: "double", label: "Double-quoted list (CSV, code)" },
  { value: "json", label: "JSON array" },
];

export interface FormatOptions {
  uppercase: boolean;
  noDashes: boolean;
  braces: boolean;
  layout: Layout;
}

/** Case, dashes and braces only apply to UUID-family values; ULIDs and NanoIDs pass through unchanged. */
export function formatId(id: string, type: IdType, o: Pick<FormatOptions, "uppercase" | "noDashes" | "braces">): string {
  if (!isUuidFamily(type)) return id;
  let s = id;
  if (o.noDashes) s = s.replace(/-/g, "");
  if (o.uppercase) s = s.toUpperCase();
  if (o.braces) s = `{${s}}`;
  return s;
}

export function formatBatch(ids: string[], type: IdType, o: FormatOptions): string {
  const items = ids.map((id) => formatId(id, type, o));
  switch (o.layout) {
    case "comma":
      return items.join(", ");
    case "single":
      return items.map((s, i) => `'${s}'${i < items.length - 1 ? "," : ""}`).join("\n");
    case "double":
      return items.map((s, i) => `"${s}"${i < items.length - 1 ? "," : ""}`).join("\n");
    case "json":
      return JSON.stringify(items, null, 2);
    default:
      return items.join("\n");
  }
}

/** True when each value is strictly greater than the one before it as a string (lowercase UUID or ULID). */
export function isStrictlyIncreasing(ids: string[]): boolean {
  for (let i = 1; i < ids.length; i++) if (!(ids[i] > ids[i - 1])) return false;
  return true;
}
