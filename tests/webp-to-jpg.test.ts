import { test } from "node:test";
import assert from "node:assert/strict";
import { crc32 as zlibCrc32 } from "node:zlib";
import {
  assignOutNames,
  batchMessage,
  isGenericClipboardName,
  jpgFileName,
  MAX_BATCH_BYTES,
  MAX_BATCH_FILES,
  pastedImageName,
  planBatch,
  sizeDelta,
  uniqueName,
} from "../src/tools/webp-to-jpg/batch";
import { fitToSize } from "../src/tools/webp-to-jpg/fit";
import { ConversionQueue, optionsKey, type Processor } from "../src/tools/webp-to-jpg/queue";
import {
  BYTES_PER_KB,
  clampQuality,
  DEFAULT_SETTINGS,
  limitBytes,
  MAX_QUALITY,
  MIN_FIT_QUALITY,
  MIN_QUALITY,
  parseSettings,
  PRESETS,
  qualityHint,
} from "../src/tools/webp-to-jpg/settings";
import { countAnimationFrames, describeWebp, parseWebpHeader, sniffFormat } from "../src/tools/webp-to-jpg/webp";
import { buildZip, crc32Update } from "../src/tools/webp-to-jpg/zip";

/* ------------------------------------------------------------ WebP headers */

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
const u32 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
const u24 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff];
const chunk = (id: string, payload: number[]) => [...ascii(id), ...u32(payload.length), ...payload, ...(payload.length & 1 ? [0] : [])];
const riff = (chunks: number[]) => new Uint8Array([...ascii("RIFF"), ...u32(4 + chunks.length), ...ascii("WEBP"), ...chunks]);

function lossyWebp(w: number, h: number) {
  return riff(chunk("VP8 ", [0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, w & 0xff, (w >> 8) & 0x3f, h & 0xff, (h >> 8) & 0x3f, 0, 0]));
}
function losslessWebp(w: number, h: number, alpha: boolean) {
  const bits = ((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14) | ((alpha ? 1 : 0) << 28);
  return riff(chunk("VP8L", [0x2f, ...u32(bits >>> 0), 0, 0, 0]));
}
function extendedWebp(flags: number, w: number, h: number, rest: number[]) {
  return riff([...chunk("VP8X", [flags, 0, 0, 0, ...u24(w - 1), ...u24(h - 1)]), ...rest]);
}

test("sniffing by magic bytes", () => {
  assert.equal(sniffFormat(lossyWebp(1, 1)), "webp");
  assert.equal(sniffFormat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "png");
  assert.equal(sniffFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "jpeg");
  assert.equal(sniffFormat(new Uint8Array(ascii("GIF89a"))), "gif");
  assert.equal(sniffFormat(new Uint8Array([0, 0, 0, 0x18, ...ascii("ftypheic")])), "heic");
  assert.equal(sniffFormat(new Uint8Array([0, 0, 0, 0x18, ...ascii("ftypavif")])), "avif");
  assert.equal(sniffFormat(new Uint8Array(ascii("hello"))), "unknown");
});

test("WebP header: lossy, lossless with alpha, extended with EXIF/XMP/ICC, animated", () => {
  const lossy = parseWebpHeader(lossyWebp(1200, 800))!;
  assert.equal(lossy.bitstream, "lossy");
  assert.deepEqual([lossy.width, lossy.height], [1200, 800]);
  assert.equal(describeWebp(lossy), "Lossy WebP");

  const ll = parseWebpHeader(losslessWebp(16383, 16383, true))!;
  assert.equal(ll.bitstream, "lossless");
  assert.deepEqual([ll.width, ll.height], [16383, 16383]);
  assert.equal(ll.hasAlpha, true);

  const ext = parseWebpHeader(extendedWebp(0x20 | 0x10 | 0x08 | 0x04, 640, 480, [...chunk("ICCP", [1, 2]), ...chunk("ALPH", [0])]))!;
  assert.equal(ext.container, "extended");
  assert.deepEqual([ext.width, ext.height], [640, 480]);
  assert.ok(ext.hasIcc && ext.hasAlpha && ext.hasExif && ext.hasXmp);
  assert.equal(ext.animated, false);
  assert.equal(ext.bitstream, "lossy");

  const anim = extendedWebp(0x02, 10, 10, [...chunk("ANIM", [0, 0, 0, 0, 0, 0]), ...chunk("ANMF", [1, 2, 3]), ...chunk("ANMF", [4, 5, 6])]);
  const info = parseWebpHeader(anim)!;
  assert.equal(info.animated, true);
  assert.equal(countAnimationFrames(anim), 2);
  assert.equal(describeWebp({ ...info, frameCount: 2 }), "Animated WebP, 2 frames");
  assert.equal(parseWebpHeader(new Uint8Array([0x89, 0x50])), null);
  assert.equal(info.declaredSize, anim.length);
});

/* ---------------------------------------------------------------- settings */

test("quality: slider 10–100, default 90, presets 70/80/90/100", () => {
  assert.equal(MIN_QUALITY, 10);
  assert.equal(MAX_QUALITY, 100);
  assert.equal(DEFAULT_SETTINGS.quality, 90);
  assert.equal(DEFAULT_SETTINGS.color, "#ffffff");
  assert.deepEqual(
    PRESETS.map((p) => `${p.label} ${p.quality}`),
    ["Small 70", "Balanced 80", "High 90", "Maximum 100"],
  );
  assert.equal(clampQuality(5), 10);
  assert.equal(clampQuality(101), 100);
  assert.equal(clampQuality(NaN), 90);
  assert.match(qualityHint(95), /Top of the scale/);
  assert.match(qualityHint(85), /^High/);
});

test("size limit: 1 KB = 1,000 bytes, 240 KB default, whole numbers only", () => {
  assert.equal(BYTES_PER_KB, 1000);
  assert.equal(limitBytes("240"), 240_000);
  assert.equal(limitBytes(DEFAULT_SETTINGS.limitKb), 240_000);
  assert.equal(limitBytes("2.5"), null);
  assert.equal(limitBytes("4"), null);
  assert.equal(limitBytes("20001"), null);
  // A file that fits 240 × 1,000 bytes also fits 240 × 1,024.
  assert.ok(240_000 < 240 * 1024);
});

test("stored settings are rebuilt field by field", () => {
  assert.deepEqual(parseSettings("not json"), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettings('{"quality":300,"color":"#ABCDEF","extension":"jpeg","limitOn":true,"limitKb":"100"}'), {
    quality: 100,
    color: "#abcdef",
    extension: "jpeg",
    limitOn: true,
    limitKb: "100",
  });
  assert.equal(parseSettings('{"color":"red"}').color, "#ffffff");
});

/* ------------------------------------------------------- size-limit search */

/** Fake encoder: size grows with quality. */
const encoderFor = (bytesAt: (q: number) => number) => async (q: number) => new Blob([new Uint8Array(bytesAt(q))]);

test("fit: returns the chosen quality when it already fits (one encode)", async () => {
  const r = await fitToSize(encoderFor((q) => q * 100), 90, 10_000, MIN_FIT_QUALITY);
  assert.deepEqual([r.quality, r.fits, r.encodes], [90, true, 1]);
});

test("fit: finds the highest quality under the limit", async () => {
  const r = await fitToSize(encoderFor((q) => q * 100), 90, 5_555, MIN_FIT_QUALITY);
  assert.equal(r.quality, 55);
  assert.ok(r.fits);
  assert.equal(r.blob.size, 5_500);
});

test("fit: never goes below quality 20 and reports when it cannot fit", async () => {
  assert.equal(MIN_FIT_QUALITY, 20);
  const r = await fitToSize(encoderFor((q) => 1_000 + q), 90, 500, MIN_FIT_QUALITY);
  assert.deepEqual([r.quality, r.fits, r.encodes], [20, false, 2]);
});

test("fit: article's 'nine trial encodes at most' holds for every start quality and limit", async () => {
  let worst = 0;
  for (let start = MIN_QUALITY; start <= MAX_QUALITY; start++) {
    for (let limit = 0; limit <= 10_100; limit += 37) {
      const r = await fitToSize(encoderFor((q) => q * 100), start, limit, Math.min(MIN_FIT_QUALITY, start));
      worst = Math.max(worst, r.encodes);
      if (r.fits) assert.ok(r.blob.size <= limit);
    }
  }
  assert.equal(worst, 9);
});

/* --------------------------------------------------------- names and batch */

test("names: .webp → .jpg or .jpeg, duplicates get -2, -3", () => {
  assert.equal(jpgFileName("photo.webp"), "photo.jpg");
  assert.equal(jpgFileName("photo.webp", "jpeg"), "photo.jpeg");
  assert.equal(jpgFileName("archive.tar.webp"), "archive.tar.jpg");
  assert.equal(jpgFileName("pasted-image-1"), "pasted-image-1.jpg");
  assert.equal(jpgFileName("C:\\pics\\a:b.webp"), "a_b.jpg");
  assert.deepEqual(assignOutNames(["a.webp", "a.png", "A.webp"], "jpg"), ["a.jpg", "a-2.jpg", "A-3.jpg"]);
  const taken = new Set<string>();
  assert.equal(uniqueName("x.jpg", taken), "x.jpg");
  assert.equal(uniqueName("x.jpg", taken), "x-2.jpg");
  assert.equal(pastedImageName(1), "pasted-image-1");
  assert.ok(isGenericClipboardName("image.png"));
  assert.ok(!isGenericClipboardName("holiday.webp"));
});

test("batch: up to 50 files or 300 MB", () => {
  assert.equal(MAX_BATCH_FILES, 50);
  assert.equal(MAX_BATCH_BYTES, 300 * 1024 * 1024);
  const p = planBatch(48, 0, [1, 1, 1]);
  assert.deepEqual(p.accepted, [0, 1]);
  assert.equal(p.skippedForCount, 1);
  assert.match(batchMessage(p)!, /50 files or 300 MB/);
  const big = planBatch(0, MAX_BATCH_BYTES - 10, [20, 10]);
  assert.deepEqual(big.accepted, [1]);
  assert.equal(batchMessage(planBatch(0, 0, [1])), null);
  assert.equal(sizeDelta(1000, 1730), "+73%");
  assert.equal(sizeDelta(1000, 1000), "same size");
});

/* --------------------------------------------------------- flattening maths */

test("article worked example: orange at 50% over white and over black", () => {
  const over = (c: number, bg: number, a = 0.5) => a * c + (1 - a) * bg;
  // Math.round(127.5) is 128 and Math.round(187.5) is 188, as the article says.
  assert.deepEqual([255, 120, 0].map((c) => Math.round(over(c, 255))), [255, 188, 128]);
  assert.deepEqual([255, 120, 0].map((c) => Math.round(over(c, 0))), [128, 60, 0]);
});

/* -------------------------------------------------------------------- queue */

const settle = () => new Promise((r) => setTimeout(r, 20));

test("queue: two at a time, unique names, re-conversion after options change", async () => {
  const seen: string[] = [];
  const processor: Processor = async (file, options) => {
    seen.push(`${file.name}@${optionsKey(options)}`);
    await new Promise((r) => setTimeout(r, 2));
    return { width: 1, height: 1, out: new Blob(["x"]), usedQuality: options.quality };
  };
  const q = new ConversionQueue(processor, 2, 5);
  const files = ["a.webp", "a.webp", "b.webp", "c.webp", "d.webp"].map((n) => ({ file: new File(["data"], n) }));
  const res = q.add(files);
  assert.equal(res.added, 5);
  assert.deepEqual(
    q.getSnapshot().map((r) => r.outName),
    ["a.jpg", "a-2.jpg", "b.jpg", "c.jpg", "d.jpg"],
  );
  await settle();
  assert.equal(q.peakActive, 2);
  assert.ok(q.getSnapshot().every((r) => r.status === "done"));
  q.setOptions({ quality: 70, fillColor: "#000000", maxBytes: null });
  assert.ok(q.getSnapshot().every((r) => r.stale));
  await settle();
  await settle();
  assert.ok(q.getSnapshot().every((r) => r.status === "done" && !r.stale && r.usedQuality === 70));
  q.setExtension("jpeg");
  assert.equal(q.getSnapshot()[1].outName, "a-2.jpeg");
  q.dispose();
});

/* ---------------------------------------------------------------------- zip */

test("ZIP: stored entries with correct CRC-32 and UTF-8 names", async () => {
  const files = [
    { name: "a.jpg", blob: new Blob(["hello"]) },
    { name: "é.jpg", blob: new Blob([new Uint8Array([1, 2, 3, 4, 5, 6])]) },
  ];
  const zip = new Uint8Array(await (await buildZip(files, new Date(2026, 0, 2, 3, 4, 6))).arrayBuffer());
  const dv = new DataView(zip.buffer);
  const eocd = zip.length - 22;
  assert.equal(dv.getUint32(eocd, true), 0x06054b50);
  assert.equal(dv.getUint16(eocd + 10, true), 2);
  let off = 0;
  for (const f of files) {
    assert.equal(dv.getUint32(off, true), 0x04034b50);
    assert.equal(dv.getUint16(off + 8, true), 0); // stored
    const size = dv.getUint32(off + 18, true);
    const nameLen = dv.getUint16(off + 26, true);
    const name = new TextDecoder().decode(zip.subarray(off + 30, off + 30 + nameLen));
    const data = zip.subarray(off + 30 + nameLen, off + 30 + nameLen + size);
    assert.equal(name, f.name);
    assert.deepEqual(Buffer.from(data), Buffer.from(await f.blob.arrayBuffer()));
    assert.equal(dv.getUint32(off + 14, true), zlibCrc32(data));
    off += 30 + nameLen + size;
  }
  assert.equal(dv.getUint32(eocd + 16, true), off); // central directory starts after the entries
  assert.equal(crc32Update(crc32Update(0, new TextEncoder().encode("1234")), new TextEncoder().encode("56789")), 0xcbf43926);
});
