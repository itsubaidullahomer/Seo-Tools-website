import { test } from "node:test";
import assert from "node:assert/strict";
import { crc32 as zlibCrc32 } from "node:zlib";
import {
  batchMessage,
  isGenericClipboardName,
  MAX_BATCH_BYTES,
  MAX_BATCH_FILES,
  pastedImageName,
  planBatch,
  pngFileName,
  sizeDelta,
  uniqueName,
} from "../src/tools/webp-to-png/batch";
import { CONCURRENCY, ConversionQueue, optionsKey, type Processor } from "../src/tools/webp-to-png/queue";
import { countAnimationFrames, describeWebp, parseWebpHeader, sniffFormat } from "../src/tools/webp-to-png/webp";
import { buildZip } from "../src/tools/webp-to-png/zip";

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const u32 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
const u24 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff];
const chunk = (id: string, payload: number[]) => [...ascii(id), ...u32(payload.length), ...payload, ...(payload.length & 1 ? [0] : [])];
const riff = (chunks: number[]) => new Uint8Array([...ascii("RIFF"), ...u32(4 + chunks.length), ...ascii("WEBP"), ...chunks]);

test("header inspection: lossy / lossless / alpha / animation flag", () => {
  const lossy = riff(chunk("VP8 ", [0, 0, 0, 0x9d, 0x01, 0x2a, 0xb0, 0x04, 0x20, 0x03, 0, 0]));
  const info = parseWebpHeader(lossy)!;
  assert.equal(sniffFormat(lossy), "webp");
  assert.equal(info.bitstream, "lossy");
  assert.deepEqual([info.width, info.height], [1200, 800]);

  const bits = (1199 | (799 << 14) | (1 << 28)) >>> 0;
  const ll = parseWebpHeader(riff(chunk("VP8L", [0x2f, ...u32(bits), 0])))!;
  assert.equal(describeWebp(ll), "Lossless WebP");
  assert.equal(ll.hasAlpha, true);
  assert.deepEqual([ll.width, ll.height], [1200, 800]);

  // The animation flag sits in the VP8X header, so it is known before decoding.
  const anim = riff([...chunk("VP8X", [0x02 | 0x10, 0, 0, 0, ...u24(99), ...u24(49)]), ...chunk("ANIM", [0, 0, 0, 0, 0, 0]), ...chunk("ANMF", [0])]);
  const a = parseWebpHeader(anim.subarray(0, 30))!;
  assert.equal(a.animated, true);
  assert.equal(a.hasAlpha, true);
  assert.deepEqual([a.width, a.height], [100, 50]);
  assert.equal(countAnimationFrames(anim), 1);
  assert.equal(describeWebp({ ...a, frameCount: 1 }), "Animated WebP, 1 frame");
});

test("WebP maximum is 16,383 × 16,383 (14-bit dimensions)", () => {
  const max = 2 ** 14 - 1;
  assert.equal(max, 16_383);
  const bits = ((max - 1) | ((max - 1) << 14)) >>> 0;
  const info = parseWebpHeader(riff(chunk("VP8L", [0x2f, ...u32(bits), 0])))!;
  assert.deepEqual([info.width, info.height], [16_383, 16_383]);
  const lossy = parseWebpHeader(riff(chunk("VP8 ", [0, 0, 0, 0x9d, 0x01, 0x2a, 0xff, 0xff, 0xff, 0xff, 0, 0])))!;
  assert.deepEqual([lossy.width, lossy.height], [16_383, 16_383]); // top two bits are the scale field
});

test("article worked example: 1,200 × 800 RGBA is 3,840,000 bytes, about 3.7 MiB", () => {
  const pixels = 1200 * 800;
  assert.equal(pixels, 960_000);
  assert.equal(pixels * 4, 3_840_000);
  assert.equal(((pixels * 4) / 1024 / 1024).toFixed(1), "3.7");
});

test("names: .webp → .png, pasted images, duplicates get -2, -3", () => {
  assert.equal(pngFileName("photo.webp"), "photo.png");
  assert.equal(pngFileName("archive.tar.webp"), "archive.tar.png");
  assert.equal(pngFileName("pasted-image-1"), "pasted-image-1.png");
  assert.equal(pngFileName(""), "image.png");
  const taken = new Set<string>();
  assert.deepEqual(
    ["a.png", "A.png", "a.png"].map((n) => uniqueName(n, taken)),
    ["a.png", "A-2.png", "a-3.png"],
  );
  assert.equal(pastedImageName(2), "pasted-image-2");
  assert.ok(isGenericClipboardName("image.png"));
  assert.ok(isGenericClipboardName("blob"));
});

test("batch: 50 files or 300 MB, extra files skipped with a message", () => {
  assert.equal(MAX_BATCH_FILES, 50);
  assert.equal(MAX_BATCH_BYTES, 300 * 1024 * 1024);
  const p = planBatch(0, 0, Array(52).fill(1));
  assert.equal(p.accepted.length, 50);
  assert.equal(p.skippedForCount, 2);
  assert.match(batchMessage(p)!, /Added 50 of 52 files\. A batch can hold 50 files or 300 MB in total/);
  const tooBig = planBatch(0, 0, [MAX_BATCH_BYTES + 1]);
  assert.equal(tooBig.skippedTooLarge, 1);
  assert.equal(sizeDelta(100, 273), "+173%");
});

const settle = () => new Promise((r) => setTimeout(r, 20));

test("queue: two files at a time; changing the fill re-converts finished files", async () => {
  assert.equal(CONCURRENCY, 2);
  const runs: string[] = [];
  const processor: Processor = async (file, options) => {
    runs.push(`${file.name}:${optionsKey(options)}`);
    await new Promise((r) => setTimeout(r, 2));
    return { width: 1, height: 1, out: new Blob(["png"]) };
  };
  const q = new ConversionQueue(processor, CONCURRENCY, 5);
  q.add(["x.webp", "y.webp", "x.webp"].map((n) => ({ file: new File(["d"], n) })));
  assert.deepEqual(
    q.getSnapshot().map((r) => r.outName),
    ["x.png", "y.png", "x-2.png"],
  );
  await settle();
  assert.equal(q.peakActive, 2);
  assert.ok(q.getSnapshot().every((r) => r.status === "done" && r.optionsKey === "transparent"));
  q.setOptions({ fillColor: "#ffffff" });
  await settle();
  await settle();
  assert.ok(q.getSnapshot().every((r) => r.status === "done" && r.optionsKey === "#ffffff"));
  assert.equal(runs.length, 6);
  q.dispose();
});

test("queue: a failing file shows an error and can be retried", async () => {
  let fail = true;
  const q = new ConversionQueue(async () => {
    if (fail) throw new Error("boom");
    return { out: new Blob(["ok"]) };
  }, 2, 5);
  q.add([{ file: new File(["d"], "bad.webp") }]);
  await settle();
  const row = q.getSnapshot()[0];
  assert.equal(row.status, "error");
  assert.match(row.error!, /Something went wrong/);
  fail = false;
  q.retry(row.id);
  await settle();
  assert.equal(q.getSnapshot()[0].status, "done");
  q.dispose();
});

test("ZIP keeps names and bytes (stored, CRC-32 checked)", async () => {
  const data = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
  const zip = new Uint8Array(await (await buildZip([{ name: "photo.png", blob: new Blob([data]) }])).arrayBuffer());
  const dv = new DataView(zip.buffer);
  assert.equal(dv.getUint32(0, true), 0x04034b50);
  assert.equal(dv.getUint32(14, true), zlibCrc32(data));
  assert.equal(new TextDecoder().decode(zip.subarray(30, 39)), "photo.png");
  assert.deepEqual(zip.subarray(39, 46), data);
  assert.equal(dv.getUint32(zip.length - 22, true), 0x06054b50);
});
