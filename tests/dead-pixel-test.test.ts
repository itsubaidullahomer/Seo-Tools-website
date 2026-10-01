import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FLASH_COLORS,
  FLASH_MAX_PER_SECOND,
  FLASH_MAX_SECONDS,
  FLASH_SAFETY_MS,
  ISO_CLASSES,
  buildRampPixels,
  buildReport,
  cellLabel,
  checkPanelSize,
  classify,
  columnName,
  flashIntervalMs,
  formatAllowance,
  maxChangesPerSecond,
  nextGrid,
  parseWholeNumber,
  patternsForSet,
  pixelsPerStep,
  rampLevel,
  scaledAllowance,
  solidGrayLevel,
  PATTERNS,
} from "../src/tools/dead-pixel-test/logic";

test("essential set is 6 screens; full set is 15", () => {
  assert.deepEqual(
    patternsForSet("essential").map((p) => p.id),
    ["black", "white", "red", "green", "blue", "gray"],
  );
  const all = patternsForSet("all");
  assert.equal(all.length, 15);
  const extra = all.filter((p) => !patternsForSet("essential").includes(p));
  assert.equal(extra.filter((p) => ["cyan", "magenta", "yellow"].includes(p.id)).length, 3);
  assert.equal(extra.filter((p) => p.kind.type === "solid" && solidGrayLevel(p.kind) !== null).length, 2); // two more grays
  assert.equal(extra.filter((p) => p.kind.type === "steps").length, 2);
  assert.equal(extra.filter((p) => p.kind.type === "ramp").length, 2);
});

test("colours are what the article says; secondaries combine two primaries", () => {
  const hex = (id: string) => {
    const k = PATTERNS.find((p) => p.id === id)!.kind;
    return k.type === "solid" ? k.color : null;
  };
  assert.equal(hex("red"), "#ff0000");
  assert.equal(hex("green"), "#00ff00");
  assert.equal(hex("blue"), "#0000ff");
  assert.equal(hex("cyan"), "#00ffff"); // no red
  assert.equal(hex("magenta"), "#ff00ff"); // no green
  assert.equal(hex("yellow"), "#ffff00"); // no blue
  // gray 25 / 50 / 75 %
  const level = (id: string) => solidGrayLevel(PATTERNS.find((p) => p.id === id)!.kind);
  assert.deepEqual([level("gray-25"), level("gray"), level("gray-75")], [64, 128, 191]);
});

test("step charts: near-black 0-15 and near-white 240-255", () => {
  const steps = PATTERNS.filter((p) => p.kind.type === "steps").map((p) => p.kind);
  assert.deepEqual(steps, [
    { type: "steps", from: 0, count: 16 },
    { type: "steps", from: 240, count: 16 },
  ]);
});

test("gradient worked example: 7.5 px per level at 1,920 wide, 15 at 3,840", () => {
  assert.equal(pixelsPerStep(1920), 7.5);
  assert.equal(pixelsPerStep(3840), 15);
  assert.equal(rampLevel(0, 1920), 0);
  assert.equal(rampLevel(1919, 1920), 255);
  // each column gets its own level and every one of the 256 levels appears
  const px = buildRampPixels(1920, ["gray"]);
  const levels = new Set<number>();
  for (let i = 0; i < px.length; i += 4) levels.add(px[i]);
  assert.equal(levels.size, 256);
});

test("ISO class table", () => {
  assert.deepEqual(
    ISO_CLASSES.map((c) => [c.id, c.type1, c.type2, c.type3]),
    [
      ["I", 0, 0, 0],
      ["II", 2, 2, 5],
      ["III", 5, 15, 50],
      ["IV", 50, 150, 500],
    ],
  );
});

test("worked example: Full HD Class II allows 4.1472 Type 1 and 10.368 Type 3", () => {
  const pixels = checkPanelSize(1920, 1080).pixels;
  assert.equal(pixels, 2_073_600);
  assert.ok(Math.abs(scaledAllowance(2, pixels) - 4.1472) < 1e-12);
  assert.ok(Math.abs(scaledAllowance(5, pixels) - 10.368) < 1e-12);
  assert.equal(formatAllowance(scaledAllowance(2, pixels)), "4.1");
  assert.equal(formatAllowance(scaledAllowance(5, pixels)), "10.4");
  const classII = (type1: number) => classify({ type1, type2: 0, type3: 0 }, pixels).results.find((r) => r.cls.id === "II")!;
  assert.equal(classII(4).pass, true);
  assert.equal(classII(5).pass, false);
});

test("Class II limits at 2560 x 1440 and 3840 x 2160", () => {
  const limits = (w: number, h: number) => {
    const ii = classify({ type1: 0, type2: 0, type3: 0 }, w * h).results.find((r) => r.cls.id === "II")!;
    return [ii.allowed.type1, ii.allowed.type2, ii.allowed.type3].map(formatAllowance);
  };
  assert.deepEqual(limits(2560, 1440), ["7.4", "7.4", "18.4"]);
  assert.deepEqual(limits(3840, 2160), ["16.6", "16.6", "41.5"]);
});

test("strictest class met and the report", () => {
  const c = classify({ type1: 1, type2: 0, type3: 3 }, 1920 * 1080);
  assert.equal(c.best?.id, "II");
  assert.equal(classify({ type1: 0, type2: 0, type3: 0 }, 1920 * 1080).best?.id, "I");
  const report = buildReport({ width: 1920, height: 1080, counts: { type1: 1, type2: 0, type3: 3 } });
  assert.ok(report.includes("2,073,600 pixels, 2.07 million"));
  assert.ok(report.includes("Class II: Type 1 up to 4.1, Type 2 up to 4.1, Type 3 up to 10.4 -> within"));
  assert.ok(report.includes("Strictest class met: Class II"));
});

test("a 27-inch 2560 x 1440 pixel is about 0.23 mm across", () => {
  const diagonalPx = Math.hypot(2560, 1440);
  assert.equal(((27 * 25.4) / diagonalPx).toFixed(2), "0.23");
});

test("flasher: at most three changes a second, one with reduced motion, 60 s cap", () => {
  assert.equal(FLASH_MAX_PER_SECOND, 3);
  assert.equal(FLASH_MAX_SECONDS, 60);
  assert.deepEqual([...FLASH_COLORS], ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000"]);
  for (const requested of [1, 2, 3, 4, 10, Infinity]) {
    const gap = flashIntervalMs(requested) + FLASH_SAFETY_MS;
    assert.ok(maxChangesPerSecond(gap) <= 3, String(requested));
    assert.ok(1000 / gap < 3);
  }
  assert.equal(flashIntervalMs(3, true), 1000);
  // three changes a second is at most one and a half flashes (a flash is a pair of opposing changes)
  assert.equal(FLASH_MAX_PER_SECOND / 2, 1.5);
});

test("locator grid: lettered columns, numbered rows, G cycles sizes", () => {
  assert.equal(columnName(0), "A");
  assert.equal(columnName(2), "C");
  assert.equal(columnName(25), "Z");
  assert.equal(columnName(26), "AA");
  // C7 on the fine 24 x 14 grid of a 2400 x 1400 screen
  assert.equal(cellLabel(250, 650, 2400, 1400, "fine"), "C7");
  assert.equal(cellLabel(10, 10, 2400, 1400, "off"), null);
  assert.equal(nextGrid("off"), "coarse");
  assert.equal(nextGrid("fine"), "off");
});

test("panel size input", () => {
  assert.equal(parseWholeNumber("1,920"), 1920);
  assert.equal(parseWholeNumber("1,5"), null);
  assert.equal(checkPanelSize(null, 1080).ok, false);
  assert.equal(checkPanelSize(20000, 1080).ok, false);
});
