import { test } from "node:test";
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";
import { crc32, dpiToPixelsPerMeter, withDensity } from "../src/tools/svg-to-png/density";
import {
  batchMessage,
  clampMessage,
  decodeDataUri,
  findFontFamilies,
  MAX_BATCH_BYTES,
  MAX_FILE_BYTES,
  MAX_FILES,
  MAX_PIXELS,
  MAX_SIDE,
  measureSvg,
  outputFileName,
  parseDimension,
  parseLength,
  parseViewBox,
  planBatch,
  planOutput,
  prepareSource,
  printToPixels,
  scanSvg,
  sizeDelta,
  sizeTemplate,
  stripComments,
  stripSizeFromStyle,
  uniqueName,
} from "../src/tools/svg-to-png/svg";

const natural = (width: string | null, height: string | null, viewBox: string | null) => measureSvg({ width, height, viewBox });

test("natural size: width/height, then viewBox, then 300 × 150", () => {
  assert.deepEqual(
    { ...natural("24", "16", "0 0 100 100"), viewBox: null },
    { width: 24, height: 16, source: "size", viewBox: null },
  );
  const vb = natural(null, null, "0 0 120 120");
  assert.equal(vb.source, "viewBox");
  assert.equal(vb.width, 120);
  assert.equal(vb.height, 120);
  const half = natural("60", null, "0 0 120 240");
  assert.equal(half.width, 60);
  assert.equal(half.height, 120);
  const none = natural(null, null, null);
  assert.equal(none.source, "default");
  assert.equal(none.width, 300);
  assert.equal(none.height, 150);
});

test("lengths: 96 CSS px per inch, so width=4in is 384 px", () => {
  assert.equal(parseLength("4in"), 384);
  assert.equal(parseLength("72pt"), 96);
  assert.equal(parseLength("2.54cm"), 96);
  assert.equal(parseLength("25.4mm"), 96);
  assert.equal(parseLength("24"), 24);
  assert.equal(parseLength("100%"), null);
  assert.equal(parseLength("auto"), null);
  assert.equal(parseLength("-5"), null);
  assert.deepEqual(parseViewBox("0,0,120,120"), { minX: 0, minY: 0, width: 120, height: 120 });
  assert.equal(parseViewBox("0 0 0 10"), null);
  assert.equal(natural("4in", "2in", null).width, 384);
});

test("worked example: 120 × 120 icon at 2×, and the 512 preset", () => {
  const icon = { width: 120, height: 120 };
  const twice = planOutput(icon, { mode: "scale", scale: 2 });
  assert.equal(twice.width, 240);
  assert.equal(twice.height, 240);
  const preset = planOutput(icon, { mode: "exact", width: 512, height: null });
  assert.equal(preset.width, 512);
  assert.equal(preset.height, 512);
  assert.equal((512 / 120).toFixed(2), "4.27");
  assert.equal(512 * 512, 262_144);
  assert.equal(512 * 512 * 4, 1024 * 1024); // RGBA bytes = 1 MiB
});

test("worked example: 1,000 × 1,000 at 8× is clamped by 0.512 to 4,096 × 4,096", () => {
  assert.equal(MAX_PIXELS, 4096 * 4096);
  assert.equal(Math.sqrt(MAX_PIXELS / 64_000_000), 0.512);
  const plan = planOutput({ width: 1000, height: 1000 }, { mode: "scale", scale: 8 });
  assert.equal(plan.requestedWidth, 8000);
  assert.equal(plan.requestedHeight, 8000);
  assert.equal(plan.width, 4096);
  assert.equal(plan.height, 4096);
  assert.ok(plan.clamped);
  const msg = clampMessage(plan);
  assert.ok(msg?.includes("8,000 × 8,000 px (64.0 million pixels)"));
  assert.ok(msg?.includes("4,096 × 4,096 px instead"));
  assert.equal(clampMessage(planOutput({ width: 10, height: 10 }, { mode: "scale", scale: 1 })), null);
});

test("clamping keeps proportions and respects the 16,384 px side limit", () => {
  const wide = planOutput({ width: 100_000, height: 10 }, { mode: "scale", scale: 1 });
  assert.equal(wide.width, MAX_SIDE);
  assert.ok(wide.width * wide.height <= MAX_PIXELS);
  const tall = planOutput({ width: 3000, height: 6000 }, { mode: "scale", scale: 2 });
  assert.ok(tall.width * tall.height <= MAX_PIXELS);
  assert.ok(Math.abs(tall.height / tall.width - 2) < 0.01);
  // Aspect lock with only a height.
  const byHeight = planOutput({ width: 200, height: 100 }, { mode: "exact", width: null, height: 50 });
  assert.deepEqual([byHeight.width, byHeight.height], [100, 50]);
  // Unlocked: both sides as typed.
  const free = planOutput({ width: 200, height: 100 }, { mode: "exact", width: 30, height: 70 });
  assert.deepEqual([free.width, free.height], [30, 70]);
});

test("print sizing: pixels = inches × DPI (4 in → 1,200 px; 10 cm → 1,181 px)", () => {
  assert.equal(printToPixels(4, "in", 300), 1200);
  assert.equal(printToPixels(10, "cm", 300), 1181);
  assert.equal(printToPixels(100, "mm", 300), 1181);
  assert.equal(printToPixels(0, "in", 300), null);
  assert.equal(1200 / 384, 3.125);
  assert.equal(parseDimension("512"), 512);
  assert.equal(parseDimension("0"), null);
  assert.equal(parseDimension("abc"), null);
});

test("source clean-up: xmlns added, comments stripped, data: URIs decoded", () => {
  assert.equal(prepareSource('<svg viewBox="0 0 1 1"></svg>'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>');
  const xlink = prepareSource('<svg><use xlink:href="#a"/></svg>');
  assert.ok(xlink.includes('xmlns:xlink="http://www.w3.org/1999/xlink"'));
  assert.ok(xlink.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.equal(stripComments("a<!-- x -->b<!-- y -->c"), "abc");
  const markup = '<svg xmlns="http://www.w3.org/2000/svg"/>';
  assert.equal(decodeDataUri(`data:image/svg+xml;base64,${Buffer.from(markup).toString("base64")}`), markup);
  assert.equal(decodeDataUri(`data:image/svg+xml,${encodeURIComponent(markup)}`), markup);
  assert.equal(decodeDataUri("<svg/>"), null);
  assert.equal(sizeTemplate('<svg viewBox="0 0 1 1"/>', 10, 20), '<svg width="10" height="20" viewBox="0 0 1 1"/>');
  assert.equal(stripSizeFromStyle("width: 10px; fill: red; max-height: 5px"), "fill: red");
});

test("warnings: fonts, linked files, @import, foreignObject, script, animation", () => {
  const ids = (s: string) => scanSvg(s).map((w) => w.id);
  assert.deepEqual(ids('<svg><text font-family="Inter, sans-serif">Hi</text></svg>'), ["fonts"]);
  assert.deepEqual(findFontFamilies('<text style="font-family: \'Open Sans\', Arial">'), ["Open Sans"]);
  assert.deepEqual(ids('<svg><text font-family="serif">Hi</text></svg>'), []);
  assert.deepEqual(ids('<svg><image href="photo.jpg"/></svg>'), ["external"]);
  assert.deepEqual(ids('<svg><image href="data:image/png;base64,AAAA"/></svg>'), []);
  assert.deepEqual(ids('<svg><use href="#icon"/></svg>'), []);
  assert.deepEqual(ids("<svg><style>@import url(a.css);</style></svg>"), ["external"]);
  assert.deepEqual(ids("<svg><style>.a{fill:red}</style></svg>"), []);
  assert.deepEqual(ids("<svg><foreignObject/></svg>"), ["foreignObject"]);
  assert.deepEqual(ids("<svg><script>x</script></svg>"), ["script"]);
  assert.deepEqual(ids('<svg><animate attributeName="x"/></svg>'), ["animation"]);
});

test("file names: .svg → .png/.jpg and -2, -3 suffixes for duplicates", () => {
  assert.equal(outputFileName("logo.svg", "png"), "logo.png");
  assert.equal(outputFileName("icons.v2.svgz", "jpg"), "icons.v2.jpg");
  assert.equal(outputFileName("svg-code", "png"), "svg-code.png");
  assert.equal(outputFileName('a:b*c?.svg', "png"), "a_b_c_.png");
  const taken = new Set<string>();
  assert.equal(uniqueName("logo.png", taken), "logo.png");
  assert.equal(uniqueName("Logo.png", taken), "Logo-2.png");
  assert.equal(uniqueName("logo.png", taken), "logo-3.png");
});

test("batch limits: 50 files, 100 MB per batch, 20 MB per file", () => {
  assert.equal(MAX_FILES, 50);
  assert.equal(MAX_BATCH_BYTES, 100 * 1024 * 1024);
  assert.equal(MAX_FILE_BYTES, 20 * 1024 * 1024);
  const tooBig = planBatch(0, 0, [MAX_FILE_BYTES + 1, 10]);
  assert.deepEqual(tooBig.accepted, [1]);
  assert.equal(tooBig.skippedTooLarge, 1);
  const full = planBatch(49, 0, [1, 1]);
  assert.deepEqual(full.accepted, [0]);
  assert.equal(full.skippedForCount, 1);
  assert.ok(batchMessage(full)?.includes("up to 50 files or 100 MB"));
  const bytes = planBatch(0, MAX_BATCH_BYTES - 5, [10, 5]);
  assert.deepEqual(bytes.accepted, [1]);
  assert.equal(sizeDelta(100, 273), "+173%");
  assert.equal(sizeDelta(100, 85), "-15%");
});

/* ---------------------------------------------------------- DPI in headers */

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function tinyPng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.from([0, 0, 0, 0, 0]))),
    chunk("IEND", new Uint8Array(0)),
  ]);
}

function readChunks(buf: Buffer) {
  const out: { type: string; data: Buffer; crcOk: boolean }[] = [];
  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("latin1", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    const crcOk = buf.readUInt32BE(off + 8 + len) === crc32(buf.subarray(off + 4, off + 8 + len));
    out.push({ type, data, crcOk });
    off += 12 + len;
  }
  return out;
}

test("CRC-32 matches the standard check value", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

test("DPI: a pHYs chunk is inserted after IHDR without touching the pixels", async () => {
  assert.equal(dpiToPixelsPerMeter(300), 11811);
  assert.equal(dpiToPixelsPerMeter(72), 2835);
  const src = tinyPng();
  const r = await withDensity(new Blob([new Uint8Array(src)], { type: "image/png" }), "png", 300);
  assert.ok(r.applied);
  const out = Buffer.from(await r.blob.arrayBuffer());
  const chunks = readChunks(out);
  assert.deepEqual(chunks.map((c) => c.type), ["IHDR", "pHYs", "IDAT", "IEND"]);
  assert.ok(chunks.every((c) => c.crcOk));
  const phys = chunks[1].data;
  assert.equal(phys.readUInt32BE(0), 11811);
  assert.equal(phys.readUInt32BE(4), 11811);
  assert.equal(phys[8], 1);
  assert.deepEqual(chunks[2].data, readChunks(src)[1].data);
  // Writing again replaces the chunk instead of adding a second one.
  const again = await withDensity(r.blob, "png", 150);
  const chunks2 = readChunks(Buffer.from(await again.blob.arrayBuffer()));
  assert.deepEqual(chunks2.map((c) => c.type), ["IHDR", "pHYs", "IDAT", "IEND"]);
  assert.equal(chunks2[1].data.readUInt32BE(0), 5906);
});

test("DPI: JFIF density fields are patched; unknown layouts are left unchanged", async () => {
  const jfif = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9]);
  const r = await withDensity(new Blob([jfif]), "jpg", 300);
  assert.ok(r.applied);
  const out = Buffer.from(await r.blob.arrayBuffer());
  assert.equal(out[13], 1);
  assert.equal(out.readUInt16BE(14), 300);
  assert.equal(out.readUInt16BE(16), 300);
  assert.equal(out.length, jfif.length);
  assert.deepEqual(out.subarray(18), jfif.subarray(18));
  const junk = await withDensity(new Blob([Buffer.from("not an image at all, really")]), "png", 300);
  assert.equal(junk.applied, false);
});
