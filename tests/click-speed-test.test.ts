import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FAST_GAP_MS,
  MAX_CUSTOM_SECONDS,
  PRESET_SECONDS,
  RESTART_COOLDOWN_MS,
  bestKey,
  buildCsv,
  buildInsight,
  buttonCounts,
  clickSource,
  cps,
  durationSeconds,
  formatCps,
  formatTally,
  liveCps,
  paceLabel,
  parseCustomSeconds,
  peakCps,
  summarize,
  tallySources,
} from "../src/tools/click-speed-test/logic";

/** n evenly spaced clicks starting at `from` ms, every `step` ms. */
const evenly = (n: number, step: number, from = 0) => Array.from({ length: n }, (_, i) => from + i * step);

test("worked example: 64 clicks in 10 seconds is 6.40 CPS", () => {
  assert.equal(formatCps(cps(64, 10)), "6.40");
  const s = summarize(evenly(64, 150), 10_000);
  assert.equal(s.clicks, 64);
  assert.equal(formatCps(s.cps), "6.40");
});

test("the first click (at 0 ms) counts and clicks after the deadline are discarded", () => {
  const s = summarize([0, 500, 999.9, 1000, 1500], 1000);
  assert.equal(s.clicks, 3);
  assert.equal(s.cps, 3);
});

test("test lengths: presets 1-60 s, custom whole seconds 1-300", () => {
  assert.deepEqual([...PRESET_SECONDS], [1, 2, 5, 10, 30, 60]);
  assert.equal(MAX_CUSTOM_SECONDS, 300);
  assert.equal(parseCustomSeconds("1"), 1);
  assert.equal(parseCustomSeconds("300"), 300);
  assert.equal(parseCustomSeconds("301"), null);
  assert.equal(parseCustomSeconds("0"), null);
  assert.equal(parseCustomSeconds("2.5"), null);
  assert.equal(durationSeconds({ length: "custom", customText: "45" }), 45);
  assert.equal(durationSeconds({ length: "10", customText: "" }), 10);
});

test("live CPS counts the last second, with a half-second floor at the start", () => {
  assert.equal(liveCps([0], 100), 2); // one click / 0.5 s, not 1 / 0.1 s
  assert.equal(liveCps(evenly(20, 100), 1950), 10); // clicks at 1000-1900 ms fall inside (950, 1950]
});

test("peak 1 s equals the total in a 1-second test", () => {
  const times = evenly(9, 100);
  assert.equal(peakCps(times, 1000), 9);
  assert.equal(summarize(times, 1000).peak, 9);
  // busiest one-second window in a longer run
  assert.equal(peakCps([0, 2000, 2100, 2200, 2300, 5000], 10_000), 4);
});

test("fastest gap and fast gaps under 30 ms", () => {
  assert.equal(FAST_GAP_MS, 30);
  const s = summarize([0, 200, 225, 500, 529.9, 560], 10_000);
  assert.equal(s.fastestGapMs, 25);
  assert.equal(s.fastGaps, 2); // 25 ms and 29.9 ms; 30.1 ms is not
});

test("fade: 34 clicks in the first 5 s and 30 in the last 5 s is about 12% slower", () => {
  const times = [...evenly(34, 5000 / 34), ...evenly(30, 5000 / 30, 5000)];
  const s = summarize(times, 10_000);
  assert.equal(s.firstHalf, 6.8);
  assert.equal(s.secondHalf, 6);
  assert.equal(Math.round(Math.abs(s.fade!) * 100), 12);
  const insight = buildInsight(s);
  assert.ok(insight.body.includes("slowed by 12%"));
});

test("fade only for tests of 5 s or longer and only at 10% or more", () => {
  assert.equal(summarize(evenly(8, 200), 2000).fade, null);
  const steady = summarize([...evenly(30, 5000 / 30), ...evenly(29, 5000 / 29, 5000)], 10_000);
  assert.ok(Math.abs(steady.fade!) < 0.1);
  assert.ok(!buildInsight(steady).body.includes("slowed"));
});

test("pace labels", () => {
  const cases: [number, string][] = [
    [2.99, "Relaxed"],
    [3, "Steady"],
    [4.99, "Steady"],
    [5, "Quick"],
    [7, "Fast"],
    [9, "Very fast"],
    [11.99, "Very fast"],
    [12, "Extreme"],
  ];
  for (const [rate, label] of cases) assert.equal(paceLabel(rate), label, String(rate));
});

test("Guinness figure: 760 clicks in a minute is about 12.7 CPS", () => {
  assert.equal(cps(760, 60).toFixed(1), "12.7");
});

test("button settings: touch and pen count as left; side buttons never count", () => {
  assert.equal(buttonCounts("left", 0, "touch"), true);
  assert.equal(buttonCounts("any", 0, "pen"), true);
  assert.equal(buttonCounts("right", 0, "touch"), false);
  assert.equal(buttonCounts("right", 2, "mouse"), true);
  assert.equal(buttonCounts("left", 2, "mouse"), false);
  assert.equal(buttonCounts("any", 1, "mouse"), true);
  assert.equal(buttonCounts("any", 3, "mouse"), false); // back
  assert.equal(buttonCounts("any", 4, "mouse"), false); // forward
});

test("per-button tally reads like 'Left 9 · Middle 3 · Right 4'", () => {
  const sources = [
    ...Array(4).fill(clickSource(2, "mouse")),
    ...Array(9).fill(clickSource(0, "mouse")),
    ...Array(3).fill(clickSource(1, "mouse")),
  ];
  assert.equal(formatTally(tallySources(sources)), "Left 9 · Middle 3 · Right 4");
});

test("restart cooldown and best-score keys", () => {
  assert.equal(RESTART_COOLDOWN_MS, 700);
  assert.equal(bestKey(10, "pointer"), "10:pointer");
  assert.equal(bestKey(45, "space"), "45:space");
});

test("click log CSV has time, gap and source for every click", () => {
  assert.equal(buildCsv([0, 150.25], ["left", "right"]), "click,time_ms,gap_ms,source\n1,0.0,,left\n2,150.3,150.3,right\n");
});
