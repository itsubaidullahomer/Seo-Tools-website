import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COMMON_LINK_SPEEDS,
  COUNTERPART,
  DECIMAL_COMMA_HINT,
  DEFAULT_FIELDS,
  EFFICIENCY_PRESETS,
  ETHERNET_FRAME,
  EXAMPLES,
  INVALID_HINT,
  MAX_BPS,
  MAX_BYTES,
  MAX_EFFICIENCY,
  MAX_INPUT_LENGTH,
  MAX_SECONDS,
  MESSAGES,
  MIN_BPS,
  MIN_BYTES,
  MIN_EFFICIENCY,
  MIN_SECONDS,
  MODE_FIELDS,
  SIZE_UNITS,
  SPEED_UNITS,
  TIME_UNITS,
  TOO_LARGE_HINT,
  UNIT_IN_FIELD_HINT,
  UNIT_TABLE,
  YEAR_SECONDS,
  approxYears,
  bytesTransferred,
  clean,
  comparisonCsv,
  comparisonRows,
  convertSize,
  convertSpeed,
  durationIn,
  evaluate,
  explainSteps,
  formatBitRate,
  formatByteRate,
  formatDuration,
  formatNum,
  formatPct,
  formatSeconds,
  formatSize,
  formatSizeIn,
  formatSpeedIn,
  headline,
  normalizeFields,
  parseNumber,
  requiredBitsPerSecond,
  scale,
  sizeHint,
  sizeInAllUnits,
  speedHint,
  speedInAllUnits,
  summaryText,
  tcpIpv4EthernetEfficiency,
  timeHint,
  toBitsPerSecond,
  toBytes,
  toSeconds,
  transferSeconds,
  type Evaluation,
  type Fields,
  type TransferResult,
} from "../src/tools/data-transfer-calculator/logic";
import { meta } from "../src/tools/data-transfer-calculator/meta";

const content = readFileSync(join(process.cwd(), "src/tools/data-transfer-calculator/content.md"), "utf8");
const faqText = meta.faq.map((f) => f.answer).join("\n");

function run(overrides: Partial<Fields>): TransferResult {
  const ev = evaluate({ ...DEFAULT_FIELDS, ...overrides });
  assert.equal(ev.status, "ok", JSON.stringify(ev));
  if (ev.status !== "ok") throw new Error("unreachable");
  return ev.result;
}

function fail(overrides: Partial<Fields>): Extract<Evaluation, { status: "invalid" }> {
  const ev = evaluate({ ...DEFAULT_FIELDS, ...overrides });
  assert.equal(ev.status, "invalid", JSON.stringify(ev));
  if (ev.status !== "invalid") throw new Error("unreachable");
  return ev;
}

function empty(overrides: Partial<Fields>): Extract<Evaluation, { status: "empty" }> {
  const ev = evaluate({ ...DEFAULT_FIELDS, ...overrides });
  assert.equal(ev.status, "empty", JSON.stringify(ev));
  if (ev.status !== "empty") throw new Error("unreachable");
  return ev;
}

const near = (actual: number, expected: number, rel = 1e-12) => assert.ok(Math.abs(actual - expected) <= rel * Math.abs(expected), `${actual} != ${expected}`);
const inArticle = (s: string) => assert.ok(content.includes(s), `content.md should contain "${s}"`);
const inFaq = (s: string) => assert.ok(faqText.includes(s), `FAQ should contain "${s}"`);

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

test("every size unit has the right number of bytes", () => {
  const expected: Record<string, number> = {
    B: 1,
    kB: 1000,
    MB: 1_000_000,
    GB: 1_000_000_000,
    TB: 1_000_000_000_000,
    PB: 1_000_000_000_000_000,
    KiB: 1024,
    MiB: 1_048_576,
    GiB: 1_073_741_824,
    TiB: 1_099_511_627_776,
    PiB: 1_125_899_906_842_624,
  };
  assert.deepEqual(Object.fromEntries(SIZE_UNITS.map((u) => [u.id, u.bytes])), expected);
  for (const u of SIZE_UNITS) assert.equal(toBytes(1, u.id), expected[u.id]);
  assert.equal(SIZE_UNITS.filter((u) => u.family === "decimal").length, 5);
  assert.equal(SIZE_UNITS.filter((u) => u.family === "binary").length, 5);
});

test("every speed unit has the right number of bits per second", () => {
  const expected: Record<string, number> = {
    bps: 1,
    kbps: 1e3,
    Mbps: 1e6,
    Gbps: 1e9,
    Bps: 8,
    kBps: 8e3,
    MBps: 8e6,
    GBps: 8e9,
    KiBps: 8192,
    MiBps: 8_388_608,
    GiBps: 8_589_934_592,
  };
  assert.deepEqual(Object.fromEntries(SPEED_UNITS.map((u) => [u.id, u.bps])), expected);
  for (const u of SPEED_UNITS) assert.equal(toBitsPerSecond(1, u.id), expected[u.id]);
  assert.deepEqual(
    SPEED_UNITS.map((u) => u.symbol),
    ["bps", "kbps", "Mbps", "Gbps", "B/s", "kB/s", "MB/s", "GB/s", "KiB/s", "MiB/s", "GiB/s"],
  );
});

test("time units", () => {
  assert.deepEqual(
    TIME_UNITS.map((u) => [u.id, u.seconds]),
    [
      ["s", 1],
      ["min", 60],
      ["h", 3600],
      ["d", 86400],
    ],
  );
  assert.equal(toSeconds(1, "h"), 3600);
  assert.equal(toSeconds(8, "h"), 28800);
  assert.equal(toSeconds(1, "d"), 86400);
  assert.equal(toSeconds(1.5, "min"), 90);
});

test("conversions between units", () => {
  // 1 TB drive in binary units (article + FAQ)
  assert.equal(formatNum(convertSize(1, "TB", "GiB"), 2), "931.32");
  assert.equal(formatSizeIn(1e12, "GiB"), "931.323 GiB");
  assert.equal(formatSizeIn(1e12, "TiB"), "0.9095 TiB");
  assert.equal(convertSize(1, "GiB", "B"), 1_073_741_824);
  assert.equal(convertSize(1024, "MiB", "GiB"), 1);
  assert.equal(convertSize(1000, "MB", "GB"), 1);
  // bits <-> bytes per second
  assert.equal(convertSpeed(100, "Mbps", "MBps"), 12.5);
  assert.equal(convertSpeed(1, "Gbps", "MBps"), 125);
  assert.equal(convertSpeed(480, "Mbps", "MBps"), 60);
  assert.equal(convertSpeed(50, "MBps", "Mbps"), 400);
  assert.equal(convertSpeed(1, "MiBps", "Mbps"), 8.388608);
  assert.equal(formatNum(convertSpeed(100, "Mbps", "MiBps"), 2), "11.92");
  assert.equal(formatNum(convertSpeed(1, "Gbps", "MiBps"), 3), "119.209");
  for (const [a, b] of Object.entries(COUNTERPART)) assert.equal(COUNTERPART[b as keyof typeof COUNTERPART], a);
});

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

test("parseNumber: accepted formats", () => {
  const ok = (raw: string, value: number, allowPercent = false) => assert.deepEqual(parseNumber(raw, { allowPercent }), { kind: "ok", value }, raw);
  ok("1.5", 1.5);
  ok("  2  ", 2);
  ok("1,500", 1500);
  ok("1,500.25", 1500.25);
  ok("12,345,678", 12_345_678);
  ok("1 500", 1500);
  ok("1 500", 1500);
  ok("1e9", 1e9);
  ok("1.5E3", 1500);
  ok("+3", 3);
  ok(".5", 0.5);
  ok("5.", 5);
  ok("007", 7);
  ok("-1", -1);
  ok("−5", -5);
  ok("94.93%", 94.93, true);
  ok("94.93 %", 94.93, true);
});

test("parseNumber: decimal comma, units, garbage and overflow get clear hints", () => {
  const bad = (raw: string, hint: string, allowPercent = false) => assert.deepEqual(parseNumber(raw, { allowPercent }), { kind: "invalid", hint }, raw);
  bad("1,5", DECIMAL_COMMA_HINT);
  bad("1,50", DECIMAL_COMMA_HINT);
  bad("1.500,25", DECIMAL_COMMA_HINT);
  bad("1,2345", DECIMAL_COMMA_HINT);
  bad("1.5GB", UNIT_IN_FIELD_HINT);
  bad("1.5 GiB", UNIT_IN_FIELD_HINT);
  bad("100 Mbps", UNIT_IN_FIELD_HINT);
  bad("10 MB/s", UNIT_IN_FIELD_HINT);
  bad("2 hours", UNIT_IN_FIELD_HINT);
  bad("abc", INVALID_HINT);
  bad("0x10", INVALID_HINT);
  bad("1e", INVALID_HINT);
  bad("1 5", INVALID_HINT);
  bad("1..5", INVALID_HINT);
  bad("NaN", INVALID_HINT);
  bad("Infinity", INVALID_HINT);
  bad("50%", INVALID_HINT);
  bad("1e400", TOO_LARGE_HINT);
  bad("9".repeat(MAX_INPUT_LENGTH + 1), INVALID_HINT);
  for (const raw of ["", "   ", "-", "+", ".", "-."]) assert.deepEqual(parseNumber(raw), { kind: "empty" }, JSON.stringify(raw));
  assert.deepEqual(parseNumber("%", { allowPercent: true }), { kind: "empty" });
});

// ---------------------------------------------------------------------------
// Core formulas and the three modes
// ---------------------------------------------------------------------------

test("must-verify: 1 GB at 100 Mbps = 80 s", () => {
  assert.equal(transferSeconds(1e9, 1e8), 80);
  const r = run({ mode: "time", size: "1", sizeUnit: "GB", speed: "100", speedUnit: "Mbps", efficiency: "100" });
  assert.equal(r.bytes, 1e9);
  assert.equal(r.bits, 8e9);
  assert.equal(r.nominalBps, 1e8);
  assert.equal(r.effectiveBps, 1e8);
  assert.equal(r.seconds, 80);
  assert.equal(headline(r), "1 min 20 s");
  assert.equal(formatSeconds(r.seconds), "80 s");
  assert.deepEqual(explainSteps(r), [
    "Data: 1 GB × 1,000,000,000 = 1,000,000,000 bytes",
    "Bits: 1,000,000,000 bytes × 8 = 8,000,000,000 bits",
    "Link speed: 100 Mbps × 1,000,000 = 100,000,000 bit/s",
    "Time: 8,000,000,000 bits ÷ 100,000,000 bit/s = 80 s (1 min 20 s)",
  ]);
  inArticle("8,000,000,000 ÷ 100,000,000 = **80 seconds**, or 1 min 20 s");
  inFaq("80 seconds (1 min 20 s)");
});

test("must-verify: 1 GiB at 100 Mbps ≈ 85.9 s", () => {
  const r = run({ size: "1", sizeUnit: "GiB", speed: "100", speedUnit: "Mbps" });
  assert.equal(r.bytes, 1_073_741_824);
  assert.equal(r.bits, 8_589_934_592);
  assert.equal(r.seconds, 85.89934592);
  assert.equal(formatNum(r.seconds, 1), "85.9");
  assert.equal(formatSeconds(r.seconds), "85.899 s");
  assert.equal(headline(r), "1 min 26 s");
  assert.equal(formatNum((r.seconds / 80 - 1) * 100, 2), "7.37");
  inArticle("85.899 seconds, about **85.9 seconds** (1 min 26 s)");
  inArticle("7.37% larger than 1 GB, so it takes 7.37% longer");
  inFaq("about 85.9 seconds");
});

test("must-verify reverse: 50 GB in 1 hour needs ≈ 111.1 Mbps", () => {
  near(requiredBitsPerSecond(50e9, 3600), 111_111_111.111111);
  const r = run({ mode: "speed", size: "50", sizeUnit: "GB", time: "1", timeUnit: "h" });
  assert.equal(r.bits, 4e11);
  assert.equal(r.seconds, 3600);
  near(r.nominalBps, 400e9 / 3600);
  assert.equal(r.effectiveBps, r.nominalBps);
  assert.equal(headline(r), "111.111 Mbps");
  assert.equal(formatNum(r.nominalBps / 1e6, 1), "111.1");
  assert.equal(formatNum(r.nominalBps), "111,111,111.111");
  assert.equal(formatNum(r.nominalBps, 0), "111,111,111");
  assert.deepEqual(explainSteps(r), [
    "Data: 50 GB × 1,000,000,000 = 50,000,000,000 bytes",
    "Bits: 50,000,000,000 bytes × 8 = 400,000,000,000 bits",
    "Time: 1 h × 3,600 = 3,600 s",
    "Throughput: 400,000,000,000 bits ÷ 3,600 s = 111,111,111.111 bit/s",
    "Link speed: 111,111,111.111 bit/s = 111.111 Mbps",
  ]);
  inArticle("400,000,000,000 ÷ 3,600 = 111,111,111.111 bits per second, about **111.1 Mbps**");
  inFaq("At least 111.1 Mbps");
  inFaq("400,000,000,000 ÷ 3,600 = 111,111,111 bits per second");

  // with the 94.93% efficiency preset
  const e = run({ mode: "speed", size: "50", sizeUnit: "GB", time: "1", timeUnit: "h", efficiency: "94.93" });
  near(e.effectiveBps, 400e9 / 3600);
  near(e.nominalBps, 400e9 / 3600 / 0.9493);
  assert.equal(headline(e), "117.045 Mbps");
  assert.equal(formatNum(e.nominalBps / 1e6, 2), "117.05");
  assert.equal(explainSteps(e)[4], "Link speed: 111,111,111.111 bit/s ÷ 94.93% = 117,045,308.239 bit/s = 117.045 Mbps");
  inArticle("the link has to run at 117.045 Mbps");
  inFaq("117.05 Mbps");
  // A 100 Mbps link misses the deadline.
  assert.equal(formatDuration(transferSeconds(50e9, 100e6)), "1 h 6 min 40 s");
  inFaq("1 h 6 min 40 s");
});

test("must-verify speed + time: 100 Mbps for 1 hour = 45 GB (41.91 GiB)", () => {
  assert.equal(bytesTransferred(1e8, 3600), 45e9);
  const r = run({ mode: "data", speed: "100", speedUnit: "Mbps", time: "1", timeUnit: "h" });
  assert.equal(r.bits, 360e9);
  assert.equal(r.bytes, 45e9);
  assert.equal(headline(r), "45 GB");
  assert.equal(formatSize(r.bytes, "binary").text, "41.91 GiB");
  assert.deepEqual(explainSteps(r), [
    "Link speed: 100 Mbps × 1,000,000 = 100,000,000 bit/s",
    "Time: 1 h × 3,600 = 3,600 s",
    "Bits: 100,000,000 bit/s × 3,600 s = 360,000,000,000 bits",
    "Data: 360,000,000,000 bits ÷ 8 = 45,000,000,000 bytes = 45 GB = 41.91 GiB",
  ]);
  inArticle("100,000,000 bits per second × 3,600 seconds = 360,000,000,000 bits. Divided by 8 that is 45,000,000,000 bytes: **45 GB**, or 41.91 GiB");
  inFaq("moves 45 GB an hour");
  inFaq("41.91 GiB");

  // over a day (FAQ, article)
  const day = run({ mode: "data", speed: "100", speedUnit: "Mbps", time: "24", timeUnit: "h" });
  assert.equal(day.bytes, 1.08e12);
  assert.equal(headline(day), "1.08 TB");
  assert.equal(formatNum(day.bytes / 2 ** 30, 2), "1,005.83");
  assert.equal(run({ mode: "data", speed: "100", time: "1", timeUnit: "d" }).bytes, 1.08e12);
  inFaq("1.08 TB (1,005.83 GiB)");
  inArticle("100 Mbps for 24 hours moves 1.08 TB");
});

test("efficiency lowers the throughput and lengthens the time", () => {
  const r = run({ size: "1", sizeUnit: "GB", speed: "100", efficiency: "94.93" });
  assert.equal(r.efficiency, 0.9493);
  assert.equal(r.effectiveBps, 94_930_000);
  assert.equal(formatSeconds(r.seconds), "84.273 s");
  assert.equal(formatNum(r.seconds, 1), "84.3");
  assert.equal(headline(r), "1 min 24 s");
  assert.equal(explainSteps(r)[3], "Throughput: 100,000,000 bit/s × 94.93% = 94,930,000 bit/s");
  inFaq("about 84.3 seconds");
  // halving the efficiency doubles the time; "%" may be typed
  assert.equal(run({ efficiency: "50" }).seconds, 160);
  assert.equal(run({ efficiency: "50%" }).seconds, 160);
  // data mode: efficiency scales the data moved
  assert.equal(run({ mode: "data", efficiency: "50" }).bytes, 22.5e9);
  assert.equal(explainSteps(run({ mode: "data", efficiency: "50" }))[1], "Throughput: 100,000,000 bit/s × 50% = 50,000,000 bit/s");
  assert.deepEqual(
    EFFICIENCY_PRESETS.map((p) => p.value),
    ["100", "94.93"],
  );
});

test("derived TCP/IPv4 over Ethernet ceiling: 1,460 ÷ 1,538 = 94.93%", () => {
  const f = ETHERNET_FRAME;
  assert.equal(f.mtu - f.ipv4Header - f.tcpHeader, 1460);
  assert.equal(f.mtu + f.ethernetHeader + f.fcs + f.preamble + f.interFrameGap, 1538);
  const t = tcpIpv4EthernetEfficiency();
  assert.equal(t.payload, 1460);
  assert.equal(t.wire, 1538);
  assert.equal(formatNum(t.ratio * 100, 2), "94.93");
  assert.equal(EFFICIENCY_PRESETS[1].value, formatNum(t.ratio * 100, 2));
  const ts = tcpIpv4EthernetEfficiency({ timestamps: true });
  assert.equal(ts.payload, 1448);
  assert.equal(formatNum(ts.ratio * 100, 2), "94.15");
  // the Gigabit Ethernet cap quoted in the article
  assert.equal(formatBitRate(1e9 * t.ratio).text, "949.285 Mbps");
  assert.equal(formatByteRate(1e9 * t.ratio).text, "118.661 MB/s");
  inArticle("= 1,460 bytes");
  inArticle("= 1,538 bytes");
  inArticle("1,460 ÷ 1,538 = 94.93%");
  inArticle("1,448 ÷ 1,538 = 94.15%");
  inArticle("about 949.285 Mbps, or 118.661 MB/s");
  inFaq("1,460 of every 1,538 bytes on the wire are payload, a 94.93% ceiling");
  // USB 3.2 Gen 1, 8b/10b: 5 × 8 ÷ 10 = 4 Gbps
  assert.equal((5 * 8) / 10, 4);
  inArticle("5 × 8 ÷ 10 = 4 Gbps");
});

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

test("formatDuration", () => {
  const cases: [number, string][] = [
    [0, "0 s"],
    [1e-12, "less than 1 ns"],
    [8e-7, "800 ns"],
    [0.0000015, "1.5 µs"],
    [0.08, "80 ms"],
    [0.0859, "85.9 ms"],
    [0.9999999, "1 s"],
    [9.999999e-7, "1 µs"],
    [1.6, "1.6 s"],
    [8.594, "8.59 s"],
    [59.99, "59.99 s"],
    [59.999, "1 min"],
    [60, "1 min"],
    [80, "1 min 20 s"],
    [85.89934592, "1 min 26 s"],
    [3599.6, "1 h"],
    [3600, "1 h"],
    [3660, "1 h 1 min"],
    [4000, "1 h 6 min 40 s"],
    [90061, "1 d 1 h 1 min 1 s"],
    [172805, "2 d 5 s"],
    [100000, "1 d 3 h 46 min 40 s"],
    [8e18, "about 253,504,702,512 years"],
  ];
  for (const [s, text] of cases) assert.equal(formatDuration(s), text, String(s));
  assert.equal(formatDuration(-1), "–");
  assert.equal(formatDuration(Number.NaN), "–");
});

test("formatSeconds, approxYears and durationIn", () => {
  assert.equal(formatSeconds(80), "80 s");
  assert.equal(formatSeconds(1333.3333333), "1,333.333 s");
  assert.equal(formatSeconds(0.00008), "0.00008 s");
  assert.equal(approxYears(YEAR_SECONDS - 1), null);
  assert.equal(approxYears(YEAR_SECONDS), "about 1 year");
  assert.equal(approxYears(1.5 * YEAR_SECONDS), "about 1.5 years");
  assert.equal(approxYears(40 * YEAR_SECONDS), "about 40 years");
  assert.deepEqual(
    durationIn(80).map((d) => d.text),
    ["80 s", "1.333 min", "0.02222 h", "0.0009259 d"],
  );
});

test("formatNum: separators, decimals, small and huge values", () => {
  assert.equal(formatNum(0), "0");
  assert.equal(formatNum(1234567.891), "1,234,567.891");
  assert.equal(formatNum(1234567.8915, 2), "1,234,567.89");
  assert.equal(formatNum(85.89934592, 1), "85.9");
  assert.equal(formatNum(0.93132257), "0.9313");
  assert.equal(formatNum(0.00008), "0.00008");
  assert.equal(formatNum(8e-12), "8e-12");
  assert.equal(formatNum(8e21), "8e+21");
  assert.equal(formatNum(1.5e22), "1.5e+22");
  assert.equal(formatNum(8e18), "8,000,000,000,000,000,000");
  assert.equal(formatNum(-2.5), "-2.5");
  assert.equal(formatNum(Number.NaN), "–");
  assert.equal(formatNum(Number.POSITIVE_INFINITY), "∞");
  assert.equal(formatPct(94.93), "94.93%");
  assert.equal(formatPct(100), "100%");
});

test("auto-scaled sizes and rates pick the right unit, with carry", () => {
  assert.equal(formatSize(0).text, "0 B");
  assert.equal(formatSize(0.125).text, "0.125 B");
  assert.equal(formatSize(999).text, "999 B");
  assert.equal(formatSize(1500).text, "1.5 kB");
  assert.equal(formatSize(1500, "binary").text, "1.465 KiB");
  assert.equal(formatSize(999_999_600).text, "1 GB");
  assert.equal(formatSize(1023.9999 * 1024, "binary").text, "1 MiB");
  assert.equal(formatSize(45e9).text, "45 GB");
  assert.equal(formatSize(1e18).text, "1 EB");
  assert.equal(formatSize(2 ** 60, "binary").text, "1 EiB");
  assert.equal(formatSize(3.9e23).text, "390,000 EB");
  assert.equal(formatBitRate(0.5).text, "0.5 bps");
  assert.equal(formatBitRate(1500).text, "1.5 kbps");
  assert.equal(formatBitRate(1e12).text, "1 Tbps");
  assert.equal(formatBitRate(8e21).text, "8,000,000 Pbps");
  assert.equal(formatByteRate(1e8).text, "12.5 MB/s");
  assert.equal(formatByteRate(1e8, "binary").text, "11.921 MiB/s");
  assert.equal(formatByteRate(1e9).text, "125 MB/s");
  assert.equal(formatByteRate(1e9, "binary").text, "119.209 MiB/s");
  assert.equal(formatSpeedIn(1e8, "MBps"), "12.5 MB/s");
  assert.equal(formatSpeedIn(1e8, "Gbps"), "0.1 Gbps");
  assert.deepEqual(scale(1e6, [["x", 1]] as const), { value: 1e6, unit: "x", text: "1,000,000 x" });
});

test("field hints show the exact bytes and the other unit family", () => {
  assert.equal(sizeHint(1, "GB"), "1 GB = 1,000,000,000 bytes = 0.9313 GiB");
  inArticle("`1 GB = 1,000,000,000 bytes = 0.9313 GiB`");
  assert.equal(sizeHint(1, "GiB"), "1 GiB = 1,073,741,824 bytes = 1.074 GB");
  assert.equal(sizeHint(1, "TB"), "1 TB = 1,000,000,000,000 bytes = 0.9095 TiB");
  assert.equal(sizeHint(500, "B"), "500 B = 4,000 bits");
  assert.equal(sizeHint(1500, "B"), "1,500 B = 1.5 kB = 1.465 KiB");
  assert.equal(speedHint(100, "Mbps"), "100 Mbps = 12.5 MB/s = 11.921 MiB/s");
  assert.equal(speedHint(1, "Gbps"), "1 Gbps = 125 MB/s = 119.209 MiB/s");
  assert.equal(speedHint(480, "Mbps"), "480 Mbps = 60 MB/s = 57.22 MiB/s");
  assert.equal(speedHint(50, "MBps"), "50 MB/s = 400 Mbps = 400,000,000 bit/s");
  assert.equal(timeHint(1, "h"), "1 h = 3,600 s");
  assert.equal(timeHint(1.5, "min"), "1.5 min = 90 s");
  inArticle("100 Mbps = 12.5 MB/s = 11.921 MiB/s");
  inArticle("480 Mbps = 60 MB/s");
  inArticle("1 Gbps = 125 MB/s = 119.209 MiB/s");
  inArticle("A download window showing 50 MB/s is moving 400 Mbps");
  inFaq("100 Mbps is 12.5 MB/s and 1 Gbps is 125 MB/s");
  inFaq("100 Mbps is 11.92 MiB/s");
});

test("all-units lists", () => {
  const speeds = speedInAllUnits(1e8).map((x) => x.text);
  assert.deepEqual(speeds, [
    "100,000,000 bps",
    "100,000 kbps",
    "100 Mbps",
    "0.1 Gbps",
    "12,500,000 B/s",
    "12,500 kB/s",
    "12.5 MB/s",
    "0.0125 GB/s",
    "12,207.031 KiB/s",
    "11.921 MiB/s",
    "0.01164 GiB/s",
  ]);
  const sizes = sizeInAllUnits(45e9).map((x) => x.text);
  assert.deepEqual(sizes, [
    "45,000,000,000 B",
    "45,000,000 kB",
    "45,000 MB",
    "45 GB",
    "0.045 TB",
    "0.000045 PB",
    "43,945,312.5 KiB",
    "42,915.344 MiB",
    "41.91 GiB",
    "0.04093 TiB",
    "0.00003997 PiB",
  ]);
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

test("empty fields: status empty with the missing field, in field order", () => {
  assert.deepEqual(empty({ size: "" }).missing, ["size"]);
  assert.deepEqual(empty({ size: "", speed: " " }).missing, ["size", "speed"]);
  assert.deepEqual(empty({ mode: "speed", time: "" }).missing, ["time"]);
  assert.deepEqual(empty({ mode: "data", speed: "-" }).missing, ["speed"]);
  assert.deepEqual(empty({ efficiency: "" }).missing, ["efficiency"]);
  for (const k of ["size", "speed", "time", "efficiency"] as const) assert.ok(MESSAGES[k].missing.length > 10);
});

test("zero, negative, too small and too large values each get their own message", () => {
  assert.equal(fail({ size: "0" }).errors.size, MESSAGES.size.zero);
  assert.equal(fail({ size: "-0" }).errors.size, MESSAGES.size.zero);
  assert.equal(fail({ size: "-1" }).errors.size, MESSAGES.size.negative);
  assert.equal(fail({ size: "0.1", sizeUnit: "B" }).errors.size, MESSAGES.size.small);
  assert.equal(fail({ size: "1001", sizeUnit: "PB" }).errors.size, MESSAGES.size.large);
  assert.equal(fail({ size: "889", sizeUnit: "PiB" }).errors.size, MESSAGES.size.large);
  assert.equal(fail({ speed: "0" }).errors.speed, MESSAGES.speed.zero);
  assert.equal(fail({ speed: "-100" }).errors.speed, MESSAGES.speed.negative);
  assert.equal(fail({ speed: "0.5", speedUnit: "bps" }).errors.speed, MESSAGES.speed.small);
  assert.equal(fail({ speed: "1000001", speedUnit: "Gbps" }).errors.speed, MESSAGES.speed.large);
  assert.equal(fail({ mode: "speed", time: "0" }).errors.time, MESSAGES.time.zero);
  assert.equal(fail({ mode: "speed", time: "-1" }).errors.time, MESSAGES.time.negative);
  assert.equal(fail({ mode: "data", time: "0.0001", timeUnit: "s" }).errors.time, MESSAGES.time.small);
  assert.equal(fail({ mode: "data", time: "36526", timeUnit: "d" }).errors.time, MESSAGES.time.large);
  assert.equal(fail({ efficiency: "0" }).errors.efficiency, MESSAGES.efficiency.zero);
  assert.equal(fail({ efficiency: "-5" }).errors.efficiency, MESSAGES.efficiency.negative);
  assert.equal(fail({ efficiency: "0.5" }).errors.efficiency, MESSAGES.efficiency.small);
  assert.equal(fail({ efficiency: "100.01" }).errors.efficiency, MESSAGES.efficiency.large);
  assert.equal(fail({ efficiency: "150%" }).errors.efficiency, MESSAGES.efficiency.large);
});

test("the documented range limits are accepted exactly at the edges", () => {
  assert.equal(MIN_BYTES, 0.125);
  assert.equal(MAX_BYTES, 1e18);
  assert.equal(MIN_BPS, 1);
  assert.equal(MAX_BPS, 1e15);
  assert.equal(MIN_SECONDS, 0.001);
  assert.equal(MAX_SECONDS, 3_155_760_000);
  assert.equal(MAX_SECONDS / 86400, 36525);
  assert.equal(MIN_EFFICIENCY, 1);
  assert.equal(MAX_EFFICIENCY, 100);
  assert.equal(run({ size: "0.125", sizeUnit: "B" }).bits, 1);
  assert.equal(run({ size: "1000", sizeUnit: "PB" }).bytes, 1e18);
  assert.equal(run({ speed: "1", speedUnit: "bps" }).nominalBps, 1);
  assert.equal(run({ speed: "1000000", speedUnit: "Gbps" }).nominalBps, 1e15);
  assert.equal(run({ mode: "data", time: "0.001", timeUnit: "s" }).seconds, 0.001);
  assert.equal(run({ mode: "data", time: "36525", timeUnit: "d" }).seconds, MAX_SECONDS);
  assert.equal(run({ efficiency: "1" }).efficiency, 0.01);
  inArticle("sizes from 1 bit to 1 EB, speeds from 1 bit per second to 1,000,000 Gbps, and times from 1 millisecond to 100 years");
});

test("non-numeric input shows the parser hint on the right field", () => {
  assert.equal(fail({ size: "abc" }).errors.size, INVALID_HINT);
  assert.equal(fail({ size: "1,5" }).errors.size, DECIMAL_COMMA_HINT);
  assert.equal(fail({ speed: "100 Mbps" }).errors.speed, UNIT_IN_FIELD_HINT);
  assert.equal(fail({ mode: "speed", time: "1e999" }).errors.time, TOO_LARGE_HINT);
  assert.equal(fail({ efficiency: "ninety" }).errors.efficiency, INVALID_HINT);
  const both = fail({ size: "x", speed: "0" });
  assert.deepEqual(Object.keys(both.errors).sort(), ["size", "speed"]);
});

test("each mode reads only its own fields", () => {
  assert.deepEqual(MODE_FIELDS.time, ["size", "speed", "efficiency"]);
  assert.deepEqual(MODE_FIELDS.speed, ["size", "time", "efficiency"]);
  assert.deepEqual(MODE_FIELDS.data, ["speed", "time", "efficiency"]);
  assert.equal(run({ mode: "time", time: "garbage" }).seconds, 80);
  assert.equal(run({ mode: "speed", speed: "garbage" }).seconds, 3600);
  assert.equal(run({ mode: "data", size: "garbage" }).bytes, 45e9);
  // an unknown unit in hand-edited state falls back instead of crashing
  assert.equal(run({ sizeUnit: "XB" as never }).bytes, 1e9);
});

test("normalizeFields rebuilds stored state safely", () => {
  assert.deepEqual(normalizeFields(null), DEFAULT_FIELDS);
  assert.deepEqual(normalizeFields("junk"), DEFAULT_FIELDS);
  assert.deepEqual(normalizeFields({ mode: "warp", sizeUnit: "XB", speedUnit: 7, timeUnit: "fortnight", size: { a: 1 } }), DEFAULT_FIELDS);
  assert.deepEqual(normalizeFields({ mode: "data", size: 2.5, sizeUnit: "TiB", speed: "40", speedUnit: "MiBps", time: "3", timeUnit: "d", efficiency: "90" }), {
    mode: "data",
    size: "2.5",
    sizeUnit: "TiB",
    speed: "40",
    speedUnit: "MiBps",
    time: "3",
    timeUnit: "d",
    efficiency: "90",
  });
  assert.equal(normalizeFields({ size: "1".repeat(500) }).size.length, 60);
  assert.equal(normalizeFields({ size: Number.NaN }).size, DEFAULT_FIELDS.size);
});

// ---------------------------------------------------------------------------
// Edge cases: tiny, huge and floating point
// ---------------------------------------------------------------------------

test("tiny and huge values", () => {
  const tiny = run({ size: "0.125", sizeUnit: "B", speed: "1000000", speedUnit: "Gbps" });
  assert.equal(tiny.seconds, 1e-15);
  assert.equal(headline(tiny), "less than 1 ns");
  const huge = run({ size: "1000", sizeUnit: "PB", speed: "1", speedUnit: "bps" });
  assert.equal(huge.seconds, 8e18);
  assert.equal(headline(huge), "about 253,504,702,512 years");
  assert.equal(approxYears(huge.seconds), "about 253,504,702,512 years");
  const fastest = run({ mode: "speed", size: "1000", sizeUnit: "PB", time: "0.001", timeUnit: "s", efficiency: "1" });
  assert.equal(fastest.nominalBps, 8e23);
  assert.equal(headline(fastest), "800,000,000 Pbps");
  const most = run({ mode: "data", speed: "1000000", speedUnit: "Gbps", time: "36525", timeUnit: "d" });
  assert.ok(Number.isFinite(most.bytes));
  assert.equal(headline(most), "394,470 EB");
  const least = run({ mode: "data", speed: "1", speedUnit: "bps", time: "0.001", timeUnit: "s", efficiency: "1" });
  assert.equal(least.bits, 0.00001);
  assert.equal(headline(least), "0.00000125 B");
});

test("floating point noise never reaches the result", () => {
  assert.equal(1.005 * 1e9, 1004999999.9999999); // the noise is real...
  assert.equal(toBytes(1.005, "GB"), 1.005e9); // ...and cleaned
  assert.equal(run({ size: "1.005" }).seconds, 80.4);
  assert.equal(explainSteps(run({ size: "1.005" }))[0], "Data: 1.005 GB × 1,000,000,000 = 1,005,000,000 bytes");
  assert.equal(run({ size: "1.1" }).seconds, 88);
  assert.equal(headline(run({ size: "1.1" })), "1 min 28 s");
  assert.equal(run({ size: "0.3", speed: "0.1", speedUnit: "Gbps" }).seconds, 24);
  assert.equal(run({ mode: "data", speed: "0.7", time: "0.1", timeUnit: "h" }).bytes, 31.5e6);
  assert.equal(clean(0.1 + 0.2), 0.3);
  // exact large values are left alone
  assert.equal(clean(2 ** 50), 1_125_899_906_842_624);
  assert.equal(clean(2 ** 53), 9_007_199_254_740_992);
  assert.equal(clean(3 * 2 ** 50), 3_377_699_720_527_872);
  assert.equal(explainSteps(run({ size: "1", sizeUnit: "PiB" }))[1], "Bits: 1,125,899,906,842,624 bytes × 8 = 9,007,199,254,740,992 bits");
  assert.equal(explainSteps(run({ size: "1", sizeUnit: "PiB" }))[0], "Data: 1 PiB × 1,125,899,906,842,624 = 1,125,899,906,842,624 bytes");
  assert.equal(clean(0), 0);
  assert.equal(clean(Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
  // A link exactly at the required speed meets the deadline.
  const r = run({ mode: "speed", size: "1", time: "80", timeUnit: "s" });
  assert.equal(r.nominalBps, 1e8);
  assert.equal(comparisonRows(r).find((row) => row.bps === 1e8)?.meets, true);
});

// ---------------------------------------------------------------------------
// Explanation, summary, comparison table
// ---------------------------------------------------------------------------

test("explanation lines for byte speeds, plain bytes, bps and seconds", () => {
  const r = run({ size: "500", sizeUnit: "B", speed: "50", speedUnit: "MBps" });
  assert.deepEqual(explainSteps(r).slice(0, 3), ["Data: 500 B = 500 bytes", "Bits: 500 bytes × 8 = 4,000 bits", "Link speed: 50 MB/s × 1,000,000 bytes × 8 = 400,000,000 bit/s"]);
  assert.equal(explainSteps(run({ speed: "2", speedUnit: "MiBps" }))[2], "Link speed: 2 MiB/s × 1,048,576 bytes × 8 = 16,777,216 bit/s");
  assert.equal(explainSteps(run({ speed: "9600", speedUnit: "bps" }))[2], "Link speed: 9,600 bps = 9,600 bit/s");
  assert.equal(explainSteps(run({ mode: "data", time: "90", timeUnit: "s" }))[1], "Time: 90 s");
  assert.equal(run({ speed: "50", speedUnit: "MBps" }).seconds, 20);
});

test("summary text carries inputs, answer and working", () => {
  const t = summaryText(run({}));
  assert.ok(t.startsWith("Transfer time: 1 min 20 s (80 s)\nData: 1 GB (1,000,000,000 bytes)\nLink speed: 100 Mbps (100,000,000 bit/s)\nEfficiency: 100% (full nominal rate)\n\nWorking:\n  Data: 1 GB"), t);
  const s = summaryText(run({ mode: "speed", size: "50", efficiency: "94.93" }));
  assert.ok(s.startsWith("Link speed needed: 117.045 Mbps (117,045,308.239 bit/s, 14.631 MB/s, 13.953 MiB/s)\nData: 50 GB"), s);
  assert.ok(s.includes("Time allowed: 1 h (3,600 s)"));
  assert.ok(s.includes("Efficiency: 94.93% of the nominal rate"));
  const d = summaryText(run({ mode: "data" }));
  assert.ok(d.startsWith("Data transferred: 45 GB = 41.91 GiB (45,000,000,000 bytes)\nLink speed: 100 Mbps"), d);
});

test("comparison table: 50 GB at common link speeds matches the article table", () => {
  const r = run({ size: "50", sizeUnit: "GB" });
  const rows = comparisonRows(r);
  assert.deepEqual(
    rows.map((row) => [row.label, row.note ?? "", formatDuration(row.seconds!)]),
    [
      ["10 Mbps", "", "11 h 6 min 40 s"],
      ["25 Mbps", "", "4 h 26 min 40 s"],
      ["50 Mbps", "", "2 h 13 min 20 s"],
      ["100 Mbps", "Fast Ethernet", "1 h 6 min 40 s"],
      ["300 Mbps", "", "22 min 13 s"],
      ["480 Mbps", "USB 2.0 High-Speed", "13 min 53 s"],
      ["500 Mbps", "", "13 min 20 s"],
      ["1 Gbps", "Gigabit Ethernet", "6 min 40 s"],
      ["5 Gbps", "USB 3.2 Gen 1", "1 min 20 s"],
      ["10 Gbps", "10 Gigabit Ethernet", "40 s"],
    ],
  );
  // the typed 100 Mbps is a preset, so it is marked rather than added
  assert.equal(rows.length, COMMON_LINK_SPEEDS.length);
  assert.equal(rows.find((row) => row.bps === 1e8)?.kind, "yours");

  // Parse the markdown table in content.md and compare every row with the tool.
  const section = content.split("## Transfer times for 50 GB at common link speeds")[1].split("## ")[0];
  const mdRows = section
    .split("\n")
    .filter((l) => /^\| \d/.test(l))
    .map((l) => l.split("|").map((c) => c.trim()));
  assert.equal(mdRows.length, rows.length);
  mdRows.forEach((cells, i) => {
    assert.equal(cells[1], rows[i].label);
    assert.equal(cells[2], rows[i].note ?? "");
    assert.equal(cells[3], formatDuration(rows[i].seconds!));
  });
});

test("comparison table: your own speed is inserted in order; speed mode marks the deadline", () => {
  const mine = comparisonRows(run({ speed: "75" }));
  assert.equal(mine.length, COMMON_LINK_SPEEDS.length + 1);
  const i = mine.findIndex((row) => row.kind === "yours");
  assert.equal(mine[i].label, "75 Mbps");
  assert.equal(mine[i - 1].bps, 50e6);
  assert.equal(mine[i + 1].bps, 100e6);
  assert.equal(comparisonRows(run({ speed: "20", speedUnit: "Gbps" })).at(-1)?.kind, "yours");
  assert.equal(comparisonRows(run({ speed: "1", speedUnit: "Mbps" }))[0].kind, "yours");
  // a byte-based speed that equals a preset (125 MB/s = 1 Gbps) is matched, not duplicated
  assert.equal(comparisonRows(run({ speed: "125", speedUnit: "MBps" })).find((row) => row.bps === 1e9)?.kind, "yours");

  const r = run({ mode: "speed", size: "50" });
  const rows = comparisonRows(r);
  const needed = rows.find((row) => row.kind === "needed")!;
  assert.equal(needed.label, "111.111 Mbps");
  assert.equal(needed.meets, true);
  assert.deepEqual(
    rows.filter((row) => row.kind === "preset").map((row) => [row.label, row.meets]),
    [
      ["10 Mbps", false],
      ["25 Mbps", false],
      ["50 Mbps", false],
      ["100 Mbps", false],
      ["300 Mbps", true],
      ["480 Mbps", true],
      ["500 Mbps", true],
      ["1 Gbps", true],
      ["5 Gbps", true],
      ["10 Gbps", true],
    ],
  );
  inArticle("for 50 GB in one hour, 100 Mbps falls short and 300 Mbps is comfortably inside");
});

test("comparison table in data mode and as CSV", () => {
  const r = run({ mode: "data" });
  const rows = comparisonRows(r);
  assert.equal(rows.find((row) => row.bps === 1e8)?.kind, "yours");
  assert.equal(formatSize(rows.find((row) => row.bps === 1e9)!.bytes!).text, "450 GB");
  assert.equal(formatSize(rows.find((row) => row.bps === 10e6)!.bytes!).text, "4.5 GB");
  const csv = comparisonCsv(r).split("\n");
  assert.equal(csv[0], "Link speed (nominal),Note,Data (decimal),Data (binary),Bytes");
  assert.equal(csv[4], "100 Mbps,Fast Ethernet; your speed,45 GB,41.91 GiB,45000000000");

  const t = comparisonCsv(run({ size: "50" })).split("\n");
  assert.equal(t[0], "Link speed (nominal),Note,Transfer time,Seconds");
  assert.equal(t[5], "300 Mbps,,22 min 13 s,1333.333");
  const s = comparisonCsv(run({ mode: "speed", size: "50" })).split("\n");
  assert.equal(s[0], "Link speed (nominal),Note,Transfer time,Seconds,Within deadline");
  assert.equal(s[5], "111.111 Mbps,minimum for your deadline,1 h,3600,yes");
  // cells with commas are quoted
  const big = comparisonCsv(run({ size: "1", sizeUnit: "PB", speed: "10" })).split("\n");
  assert.equal(big[1], '10 Mbps,your speed,"9,259 d 6 h 13 min 20 s",800000000');
});

test("one-click examples reproduce the article", () => {
  const byId = Object.fromEntries(EXAMPLES.map((e) => [e.id, run(e.fields)]));
  assert.equal(byId["1gb"].seconds, 80);
  assert.equal(byId["1gib"].seconds, 85.89934592);
  assert.equal(headline(byId["50gb"]), "111.111 Mbps");
  assert.equal(headline(byId["100mbps"]), "45 GB");
  for (const e of EXAMPLES) assert.equal(e.fields.efficiency, "100");
});

// ---------------------------------------------------------------------------
// Every other number in the article and FAQ
// ---------------------------------------------------------------------------

test("article: unit gap table and the 1 TB drive", () => {
  assert.deepEqual(
    UNIT_TABLE.map((r) => [r.decimal, r.binary, formatNum(r.binaryBytes), formatNum(r.gapPct, 2)]),
    [
      ["kB", "KiB", "1,024", "2.4"],
      ["MB", "MiB", "1,048,576", "4.86"],
      ["GB", "GiB", "1,073,741,824", "7.37"],
      ["TB", "TiB", "1,099,511,627,776", "9.95"],
      ["PB", "PiB", "1,125,899,906,842,624", "12.59"],
    ],
  );
  const section = content.split("The gap grows with each prefix:")[1].split("\n\n")[1];
  const mdRows = section.split("\n").filter((l) => /^\| [kMGTP]B/.test(l));
  assert.equal(mdRows.length, UNIT_TABLE.length);
  mdRows.forEach((line, i) => {
    const row = UNIT_TABLE[i];
    assert.ok(line.includes(`${row.binary} = ${formatNum(row.binaryBytes)} bytes`), line);
    assert.ok(line.endsWith(`| ${formatNum(row.gapPct, 2)}% |`), line);
  });
  assert.equal(formatNum(1e12 / 2 ** 30, 3), "931.323");
  inArticle("you get 931.323, which binary software shows as 931 GiB");
  inArticle("0.9095 TiB");
  inFaq("1,000,000,000,000 ÷ 1,073,741,824 = 931.32");
});

test("article: practical examples", () => {
  const upload = run({ size: "250", speed: "20" });
  assert.equal(upload.seconds, 100000);
  assert.equal(headline(upload), "1 d 3 h 46 min 40 s");
  inArticle("250 GB over a 20 Mbps upload takes 100,000 seconds, or 1 d 3 h 46 min 40 s");
  assert.equal(headline(run({ mode: "speed", size: "250", time: "8" })), "69.444 Mbps");
  inArticle("shows 69.444 Mbps");

  assert.equal(headline(run({ mode: "speed", size: "2", sizeUnit: "TB", time: "8" })), "555.556 Mbps");
  assert.equal(headline(run({ mode: "speed", size: "2", sizeUnit: "TB", time: "8", efficiency: "94.93" })), "585.227 Mbps");
  inArticle("Moving 2 TB in 8 hours needs 555.556 Mbps, or 585.227 Mbps at 94.93% efficiency");
  assert.equal(headline(run({ size: "2", sizeUnit: "TB", speed: "1", speedUnit: "Gbps" })), "4 h 26 min 40 s");
  assert.equal(headline(run({ size: "2", sizeUnit: "TB", speed: "1", speedUnit: "Gbps", efficiency: "94.93" })), "4 h 40 min 55 s");
  inArticle("4 h 26 min 40 s at full rate and 4 h 40 min 55 s at 94.93%");

  const backup = run({ mode: "data", speed: "1", speedUnit: "Gbps", time: "8" });
  assert.equal(headline(backup), "3.6 TB");
  assert.equal(formatSize(backup.bytes, "binary").text, "3.274 TiB");
  inArticle("1 Gbps for 8 hours moves 3.6 TB (3.274 TiB)");

  assert.equal(headline(run({ size: "16", speed: "480" })), "4 min 27 s");
  inArticle("16 GB at the 480 Mbps signalling rate is 4 min 27 s");
  assert.equal(headline(run({ size: "2", sizeUnit: "MB", speed: "10" })), "1.6 s");
  inArticle("A 2 MB photo at 10 Mbps is 1.6 s of data");
});

test("FAQ: 100 GB download times", () => {
  assert.equal(headline(run({ size: "100", speed: "25" })), "8 h 53 min 20 s");
  assert.equal(headline(run({ size: "100", speed: "100" })), "2 h 13 min 20 s");
  assert.equal(headline(run({ size: "100", speed: "1", speedUnit: "Gbps" })), "13 min 20 s");
  assert.equal(run({ size: "100" }).bits, 800e9);
  inFaq("100 GB takes 8 h 53 min 20 s at 25 Mbps, 2 h 13 min 20 s at 100 Mbps and 13 min 20 s at 1 Gbps");
  inFaq("100 GB × 8 = 800,000,000,000 bits");
});

test("meta: lengths and FAQ count", () => {
  assert.ok((meta.title ?? "").length <= 60);
  assert.ok(meta.description.length >= 120 && meta.description.length <= 160);
  assert.ok(meta.shortDescription.length <= 120);
  assert.ok(meta.faq.length >= 6 && meta.faq.length <= 8);
  assert.equal(meta.keywords[0], "data transfer calculator");
  for (const f of meta.faq) {
    const words = f.answer.split(/\s+/).length;
    assert.ok(words >= 40 && words <= 90, `${f.question}: ${words} words`);
  }
});
