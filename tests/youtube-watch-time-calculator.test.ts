import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PROJECTION_DAYS,
  RULES,
  activeTier,
  avdFromLength,
  evaluateShorts,
  formatDuration,
  goalOptions,
  hoursFromViews,
  minDailyViews,
  nextTier,
  parseCount,
  parseDuration,
  simulateTimeline,
  viewsForHours,
} from "../src/tools/youtube-watch-time-calculator/logic";

test("intro: 4,000 hours is about 66,667 views at 3:36 and 30,000 at 8:00", () => {
  assert.equal(viewsForHours(4000, 216), 66667);
  assert.equal(viewsForHours(4000, 480), 30000);
  assert.equal(4000 * 3600, 14_400_000);
});

test("examples 1 and 2: average view duration from video length", () => {
  const a = avdFromLength(8 * 60, 45);
  assert.equal(a, 216);
  assert.equal(formatDuration(a), "3:36");
  const b = avdFromLength(20 * 60, 40);
  assert.equal(b, 480);
  assert.equal(formatDuration(b), "8:00");
  // 2.5 times as long, 55% fewer views
  assert.equal(1200 / 480, 2.5);
  assert.equal(Math.round((1 - viewsForHours(4000, b) / viewsForHours(4000, a)) * 100), 55);
});

test("example 3: 500 views a day at 3:36 reaches 3,000 / 4,000 / 8,000 hours on days 100 / 134 / 267", () => {
  assert.equal(hoursFromViews(500, 216), 30);
  const sim = simulateTimeline({ dailyViews: 500, avdSeconds: 216, bankedHours: 0, growthPct: 0, expire: true, goals: [3000, 4000, 8000] });
  assert.equal(sim.hoursPerDay, 30);
  assert.deepEqual(sim.reachDays, [100, 134, 267]);
  assert.equal(133 * 30, 3990);
  assert.equal(134 * 30, 4020);
});

test("views-needed table", () => {
  const rows: [string, number, number, number][] = [
    ["1:00", 180000, 240000, 480000],
    ["2:00", 90000, 120000, 240000],
    ["3:00", 60000, 80000, 160000],
    ["3:36", 50000, 66667, 133334],
    ["5:00", 36000, 48000, 96000],
    ["8:00", 22500, 30000, 60000],
    ["10:00", 18000, 24000, 48000],
    ["15:00", 12000, 16000, 32000],
    ["20:00", 9000, 12000, 24000],
  ];
  for (const [avd, h3, h4, h8] of rows) {
    const p = parseDuration(avd);
    assert.equal(p.kind, "ok");
    if (p.kind !== "ok") continue;
    assert.deepEqual([viewsForHours(3000, p.value), viewsForHours(4000, p.value), viewsForHours(8000, p.value)], [h3, h4, h8], avd);
  }
});

test("watch-hours-from-views table", () => {
  const rows: [number, number[]][] = [
    [10000, [333, 667, 1333, 2000]],
    [50000, [1667, 3333, 6667, 10000]],
    [100000, [3333, 6667, 13333, 20000]],
    [250000, [8333, 16667, 33333, 50000]],
    [1000000, [33333, 66667, 133333, 200000]],
  ];
  for (const [views, hours] of rows) {
    assert.deepEqual(
      [120, 240, 480, 720].map((s) => Math.round(hoursFromViews(views, s))),
      hours,
      String(views),
    );
  }
});

test("365-day window: floors and a pace that never qualifies", () => {
  assert.equal((4000 / 365).toFixed(2), "10.96");
  // 10 hours a day tops out at 3,650 and never reaches 4,000
  const flat = simulateTimeline({ dailyViews: 10 * 3600 / 216, avdSeconds: 216, bankedHours: 0, growthPct: 0, expire: true, goals: [4000] });
  assert.equal(flat.reachDays[0], null);
  assert.ok(Math.abs(flat.checkpoints[flat.checkpoints.length - 1].hours - 3600) < 1e-6); // day 360
  assert.equal(minDailyViews(4000, 216), 183);
  assert.equal(minDailyViews(8000, 216), 366);
});

test("banked hours: 2,000 banked + 30 a day reaches 4,000 on day 67 (off) or day 82 (expiry on)", () => {
  const base = { dailyViews: 500, avdSeconds: 216, bankedHours: 2000, growthPct: 0, goals: [4000] };
  assert.equal(simulateTimeline({ ...base, expire: false }).reachDays[0], 67);
  assert.equal(simulateTimeline({ ...base, expire: true }).reachDays[0], 82);
});

test("raising average view duration from 3:36 to 4:30 cuts 66,667 views to 53,334", () => {
  assert.equal(viewsForHours(4000, 270), 53334);
  assert.equal(formatDuration(avdFromLength(20 * 60, 30)), "6:00");
  assert.equal(formatDuration(avdFromLength(10 * 60, 50)), "5:00");
});

test("who uses it: 45 videos, 9,600 podcast views, 60,000 at 4 minutes, 111,112 Shorts a day", () => {
  assert.equal(Math.ceil(viewsForHours(4000, 216) / 1500), 45);
  assert.equal(viewsForHours(4000, 25 * 60), 9600);
  assert.equal(viewsForHours(4000, 4 * 60), 60000);
  assert.equal(evaluateShorts(0, 10_000_000).perDayNeeded, 111112);
  // FAQ: 1:00 needs 240,000
  assert.equal(viewsForHours(4000, 60), 240000);
});

test("tier table and the switch on 1 February 2027", () => {
  const before = activeTier("ad", "2027-01-31");
  const after = activeTier("ad", "2027-02-01");
  assert.equal(before?.watchHours, 4000);
  assert.equal(before?.shortsViews, 10_000_000);
  assert.equal(before?.subscribers, 1000);
  assert.equal(after?.watchHours, 8000);
  assert.equal(after?.shortsViews, 20_000_000);
  assert.equal(nextTier("ad", "2026-09-29")?.effectiveFrom, "2027-02-01");
  assert.equal(nextTier("ad", "2027-02-01"), undefined);
  const early = activeTier("early", "2026-09-29");
  assert.deepEqual([early?.subscribers, early?.uploads, early?.uploadWindowDays, early?.watchHours, early?.shortsViews], [500, 3, 90, 3000, 3_000_000]);
  // before the change the announced option is offered; after it, it disappears
  assert.deepEqual(goalOptions("2026-09-29").map((g) => g.id), ["ad", "ad-next", "early", "custom"]);
  assert.deepEqual(goalOptions("2027-02-01").map((g) => g.id), ["ad", "early", "custom"]);
  assert.deepEqual(RULES.windows, { watchDays: 365, shortsDays: 90 });
});

test("projection stops at five years", () => {
  assert.equal(MAX_PROJECTION_DAYS, 1826);
});

test("parsing durations: 3:36, plain minutes and unit forms", () => {
  assert.deepEqual(parseDuration("3:36"), { kind: "ok", value: 216 });
  assert.deepEqual(parseDuration("4.5"), { kind: "ok", value: 270 });
  assert.deepEqual(parseDuration("4m 30s"), { kind: "ok", value: 270 });
  assert.deepEqual(parseDuration("1:02:30"), { kind: "ok", value: 3750 });
  assert.equal(parseDuration("4:5").kind, "invalid");
});

test("parsing counts: 25,000, 25000, 25k and 1.2m", () => {
  for (const raw of ["25,000", "25000", "25k"]) assert.deepEqual(parseCount(raw), { kind: "ok", value: 25000 }, raw);
  assert.deepEqual(parseCount("1.2m"), { kind: "ok", value: 1_200_000 });
  assert.equal(parseCount("1,5").kind, "invalid");
});
