import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  bytesToUlid,
  createTimeGenerator,
  createUlidGenerator,
  createV7Generator,
  decodeId,
  formatBatch,
  formatId,
  generateBatch,
  isStrictlyIncreasing,
  md5,
  MAX_UUID,
  NAMESPACES,
  nanoId,
  NANOID_ALPHABETS,
  NIL_UUID,
  parseCount,
  parseId,
  parseNames,
  representations,
  toGuidByteOrderHex,
  tokenize,
  uuidV3,
  uuidV4,
  type Env,
} from "../src/tools/uuid-generator/uuid";

/** Deterministic environment: xorshift bytes, a fixed clock and Node's SHA-1. */
function fakeEnv(nowMs: number, seed = 0x9e3779b9): Env {
  let s = seed >>> 0;
  return {
    now: () => nowMs,
    randomBytes: (n) => {
      const out = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        s ^= s << 13;
        s >>>= 0;
        s ^= s >>> 17;
        s ^= s << 5;
        s >>>= 0;
        out[i] = s & 0xff;
      }
      return out;
    },
    sha1: async (data) => new Uint8Array(createHash("sha1").update(data).digest()),
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const versionOf = (u: string) => parseInt(u[14], 16);
const variantOk = (u: string) => "89ab".includes(u[19]);
const T0 = Date.UTC(2026, 9, 1, 12, 0, 0, 123);

test("v4: version 4, RFC variant, 8-4-4-4-12 (fallback path without randomUUID)", () => {
  const env = fakeEnv(T0);
  const ids = Array.from({ length: 200 }, () => uuidV4(env));
  for (const id of ids) {
    assert.match(id, UUID_RE);
    assert.equal(versionOf(id), 4);
    assert.ok(variantOk(id));
  }
  assert.equal(new Set(ids).size, ids.length);
  const native = uuidV4({ ...env, randomUUID: () => "native" });
  assert.equal(native, "native");
});

test("v7: 48-bit ms timestamp, version 7, variant 10, strictly increasing within a batch", async () => {
  const ids = await generateBatch({ type: "v7", count: 2000 }, fakeEnv(T0));
  for (const id of ids) {
    assert.match(id, UUID_RE);
    assert.equal(versionOf(id), 7);
    assert.ok(variantOk(id));
    assert.equal(parseInt(id.replace(/-/g, "").slice(0, 12), 16), T0);
  }
  assert.ok(isStrictlyIncreasing(ids));
  // A clock that steps backwards keeps counting up.
  let now = T0;
  const next = createV7Generator({ ...fakeEnv(0), now: () => now });
  const a = next();
  now = T0 - 5000;
  const b = next();
  assert.ok(b > a);
});

test("article: RFC 9562 v7 test vector decodes to 1,645,557,742,000 ms = 2022-02-22 19:22:22 UTC", () => {
  const p = parseId("017F22E2-79B0-7CC3-98C4-DC0C0C07398F");
  assert.ok(p.ok);
  const d = decodeId(p.value);
  assert.equal(d.version, 7);
  assert.match(d.variant, /^10xx/);
  assert.equal(d.time?.ms, 1_645_557_742_000);
  assert.equal(d.time?.iso, "2022-02-22T19:22:22.000Z");
});

test("RFC 9562 v1 and v6 test vectors decode to the same timestamp", () => {
  for (const [s, v] of [
    ["C232AB00-9414-11EC-B3C8-9F6BCCD9C1B1", 1],
    ["1EC9414C-232A-6B00-B3C8-9F6BCCD9C1B1", 6],
  ] as const) {
    const p = parseId(s);
    assert.ok(p.ok);
    const d = decodeId(p.value);
    assert.equal(d.version, v);
    assert.equal(d.time?.iso, "2022-02-22T19:22:22.000Z");
    assert.equal(d.clockSeq, 0x33c8);
    assert.equal(d.node?.hex, "9f:6b:cc:d9:c1:b1");
  }
});

test("v1 and v6: 100 ns ticks since 1582-10-15, random multicast node, round-trip through the decoder", () => {
  for (const version of [1, 6] as const) {
    const next = createTimeGenerator(fakeEnv(T0), version);
    const ids = Array.from({ length: 50 }, next);
    const decoded = ids.map((id) => {
      const p = parseId(id);
      assert.ok(p.ok);
      return decodeId(p.value);
    });
    for (const d of decoded) {
      assert.equal(d.version, version);
      assert.match(d.variant, /^10xx/);
      assert.equal(d.time?.ms, T0);
      assert.equal(d.node?.randomlyGenerated, true);
    }
    // Same clock, so the sub-millisecond ticks count up 0, 1, 2, ...
    assert.deepEqual(
      decoded.slice(0, 3).map((d) => d.time?.subMsTicks),
      [0, 1, 2],
    );
    if (version === 6) assert.ok(isStrictlyIncreasing(ids));
  }
});

test("article: v5 and v3 of www.example.com in the DNS namespace", async () => {
  assert.equal(NAMESPACES.dns.uuid, "6ba7b810-9dad-11d1-80b4-00c04fd430c8");
  const env = fakeEnv(T0);
  const [v5] = await generateBatch({ type: "v5", namespace: NAMESPACES.dns.uuid, names: ["www.example.com"] }, env);
  const [v3] = await generateBatch({ type: "v3", namespace: NAMESPACES.dns.uuid, names: ["www.example.com"] }, env);
  assert.equal(v5, "2ed6657d-e927-568b-95e1-2665a8aea6a2");
  assert.equal(v3, "5df41881-3aed-3515-88a7-2f4a814cf09e");
  const ns = parseId(NAMESPACES.dns.uuid);
  assert.ok(ns.ok);
  assert.equal(uuidV3(ns.value.bytes, "www.example.com"), v3);
  await assert.rejects(generateBatch({ type: "v5", namespace: NAMESPACES.dns.uuid, names: ["x"] }, { ...env, sha1: undefined }), /SubtleCrypto/);
});

test("MD5 matches Node's implementation", () => {
  for (const s of ["", "a", "abc", "x".repeat(55), "y".repeat(56), "z".repeat(64), "héllo wörld ".repeat(20)]) {
    const data = new TextEncoder().encode(s);
    assert.equal(Buffer.from(md5(data)).toString("hex"), createHash("md5").update(data).digest("hex"));
  }
});

test("nil and max", async () => {
  assert.deepEqual(await generateBatch({ type: "nil" }, fakeEnv(0)), [NIL_UUID]);
  assert.deepEqual(await generateBatch({ type: "max" }, fakeEnv(0)), [MAX_UUID]);
  for (const u of [NIL_UUID, MAX_UUID]) {
    const p = parseId(u);
    assert.ok(p.ok);
    assert.equal(decodeId(p.value).version, null);
  }
});

test("ULID: 26 Crockford characters, ms timestamp, monotonic, and the FAQ example decodes", async () => {
  const ids = await generateBatch({ type: "ulid", count: 1000 }, fakeEnv(T0));
  for (const id of ids) {
    assert.match(id, /^[0-9A-HJKMNP-TV-Z]{26}$/);
    const p = parseId(id);
    assert.ok(p.ok);
    assert.equal(decodeId(p.value).time?.ms, T0);
  }
  assert.ok(isStrictlyIncreasing(ids));
  const faq = parseId("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  assert.ok(faq.ok);
  assert.equal(faq.value.kind, "ulid");
  assert.equal(decodeId(faq.value).time?.iso, "2016-07-30T23:54:10.259Z");
  // Converts to a UUID and back without loss.
  assert.equal(bytesToUlid(faq.value.bytes), "01ARZ3NDEKTSV4RRFFQ69G5FAV");
  assert.equal(createUlidGenerator(fakeEnv(T0))().length, 26);
  assert.equal(parseId("8ZZZZZZZZZZZZZZZZZZZZZZZZZ").ok, false);
});

test("NanoID: length, alphabet, and the 126-bit / ~70-bit strength figures", () => {
  const env = fakeEnv(T0);
  const id = nanoId(env, 21, NANOID_ALPHABETS.url);
  assert.equal(id.length, 21);
  assert.match(id, /^[A-Za-z0-9_-]{21}$/);
  assert.match(nanoId(env, 128, NANOID_ALPHABETS.digits), /^\d{128}$/);
  assert.equal(NANOID_ALPHABETS.url.length, 64);
  assert.equal(21 * Math.log2(64), 126);
  assert.equal(Math.round(21 * Math.log2(10)), 70);
  // Rejection sampling: a 36-symbol alphabet still uses every symbol.
  const seen = new Set(nanoId(env, 5000, NANOID_ALPHABETS.lower));
  assert.equal(seen.size, 36);
});

test("count, names and parsing rules", () => {
  assert.deepEqual(parseCount("10,000"), { ok: true, value: 10_000 });
  assert.equal(parseCount("10001").ok, false);
  assert.equal(parseCount("0").ok, false);
  assert.equal(parseCount("2.5").ok, false);
  assert.deepEqual(parseNames(" a \n\n b\r\n"), ["a", "b"]);
  for (const s of [
    "550E8400-E29B-41D4-A716-446655440000",
    "{550e8400-e29b-41d4-a716-446655440000}",
    "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
    "550e8400e29b41d4a716446655440000",
  ]) {
    const p = parseId(s);
    assert.ok(p.ok, s);
    assert.equal(p.value.uuid, "550e8400-e29b-41d4-a716-446655440000");
    assert.equal(decodeId(p.value).version, 4);
  }
  assert.equal(parseId("550e8400-e29b41d4-a716-446655440000").ok, false);
  assert.equal(parseId("550e8400-e29b-41d4-a716-44665544000g").ok, false);
  assert.deepEqual(tokenize(`["a", 'b'];c`), ["a", "b", "c"]);
});

test("formatting options and layouts", () => {
  const ids = ["550e8400-e29b-41d4-a716-446655440000", "919108f7-52d1-4320-9bac-f847db4148a8"];
  assert.equal(formatId(ids[0], "v4", { uppercase: true, noDashes: true, braces: true }), "{550E8400E29B41D4A716446655440000}");
  assert.equal(formatId("01ARZ3NDEKTSV4RRFFQ69G5FAV", "ulid", { uppercase: false, noDashes: true, braces: true }), "01ARZ3NDEKTSV4RRFFQ69G5FAV");
  const o = { uppercase: false, noDashes: false, braces: false };
  assert.equal(formatBatch(ids, "v4", { ...o, layout: "comma" }), ids.join(", "));
  assert.equal(formatBatch(ids, "v4", { ...o, layout: "single" }), `'${ids[0]}',\n'${ids[1]}'`);
  assert.equal(formatBatch(ids, "v4", { ...o, layout: "double" }), `"${ids[0]}",\n"${ids[1]}"`);
  assert.deepEqual(JSON.parse(formatBatch(ids, "v4", { ...o, layout: "json" })), ids);
});

test(".NET byte order swaps the first three groups", () => {
  const p = parseId("00112233-4455-6677-8899-aabbccddeeff");
  assert.ok(p.ok);
  assert.equal(toGuidByteOrderHex(p.value.bytes), "33221100554477668899aabbccddeeff");
  const rows = Object.fromEntries(representations(p.value).map((r) => [r.label, r.value]));
  assert.equal(rows.URN, "urn:uuid:00112233-4455-6677-8899-aabbccddeeff");
  assert.equal(rows.Base64, Buffer.from(p.value.bytes).toString("base64"));
  assert.equal(rows["128-bit integer"], BigInt("0x00112233445566778899aabbccddeeff").toString());
});

test("collision table and other arithmetic in the article", () => {
  const d = 2 * 2 ** 122;
  const p = (n: number) => 1 - Math.exp(-(n * n) / d);
  assert.equal((1e18 / d).toExponential(1), "9.4e-20"); // 1 billion: n²/(2·2^122)
  assert.ok(Math.abs(p(103e12) - 1e-9) < 0.01e-9);
  assert.equal(Math.round(p(1e18) * 100), 9);
  assert.equal(Math.round(p(2.7e18) * 100), 50);
  const years = 2.7e18 / 1e9 / (365.25 * 86400); // "roughly 85 years"
  assert.ok(years > 85 && years < 86);
  assert.equal(Math.round(100_000 * (1 - (1 - 1 / 100_000) ** 1000)), 995);
});
