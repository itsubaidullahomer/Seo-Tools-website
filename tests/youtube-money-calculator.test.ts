import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_STATE,
  RATES,
  count,
  evaluate,
  money,
  parseNum,
  rate,
  rpmFromRevenue,
  stateForExample,
  viewsForGoal,
  type Evaluation,
  type State,
} from "../src/tools/youtube-money-calculator/logic";

function ev(patch: Partial<State>): Evaluation {
  const e = evaluate({ ...DEFAULT_STATE, ...patch });
  assert.ok(e.ok, JSON.stringify(e.errors));
  return e;
}
const sharesOf = (id: string) => RATES.audiencePresets.find((p) => p.id === id)!.shares.map(String);

test("mixed audience multiplier is 0.6775", () => {
  const e = ev({});
  assert.ok(Math.abs(e.blend! - 0.6775) < 1e-12);
  assert.equal(0.45 + 0.105 + 0.075 + 0.0375 + 0.01, 0.6775);
});

test("worked example: tech channel, 10,000 views a day, mixed audience", () => {
  const e = ev(stateForExample("tech", DEFAULT_STATE));
  const long = e.long!;
  assert.ok(Math.abs(long.rpm.typical - 6.0975) < 1e-9);
  assert.equal(rate(long.rpm.typical), "$6.10");
  assert.equal(money(long.day.typical), "$60.98");
  assert.equal(money(long.month.typical), "$1,855");
  assert.equal(money(long.year.typical), "$22,256");
  // $4 low and $18 high niche RPM -> monthly range
  assert.equal(money(long.month.low, long.month.high), "$824");
  assert.equal(money(long.month.high), "$3,709");
});

test("worked example: gaming channel, 10,000 views a day", () => {
  const long = ev(stateForExample("gaming", DEFAULT_STATE)).long!;
  assert.equal(rate(long.rpm.typical), "$2.03");
  assert.equal(money(long.day.typical), "$20.33");
  assert.equal(money(long.month.typical, long.month.high), "$618");
  assert.equal(money(long.year.typical), "$7,419");
});

test("worked example: Shorts channel, 100,000 views a day", () => {
  const shorts = ev(stateForExample("shorts", DEFAULT_STATE)).shorts!;
  assert.equal(rate(shorts.rpm.typical), "$0.057");
  assert.equal(money(shorts.day.typical), "$5.72");
  assert.equal(money(shorts.month.typical), "$173.87");
  assert.equal(money(shorts.year.typical), "$2,086");
  // 0.25 x 0.6775 x 0.75 x 0.45
  assert.ok(Math.abs(shorts.rpm.typical - 0.25 * 0.6775 * 0.75 * 0.45) < 1e-12);
});

test("comparisons in the worked-examples table", () => {
  const tech = ev(stateForExample("tech", DEFAULT_STATE)).long!.month.typical;
  const gaming = ev(stateForExample("gaming", DEFAULT_STATE)).long!.month.typical;
  const shorts = ev(stateForExample("shorts", DEFAULT_STATE)).shorts!.month.typical;
  assert.equal(Math.round(tech / gaming), 3); // threefold gap from niche alone
  assert.ok(shorts < gaming / 3); // ten times the views, under a third of the money
  // tech videos plus the Shorts: about $2,029 a month, Shorts under a tenth
  const both = ev({ type: "both", longViews: "10000", shortsViews: "100000" });
  assert.equal(money(both.total!.month.typical), "$2,029");
  assert.ok(both.shorts!.month.typical / both.total!.month.typical < 0.1);
});

test("From CPM: $12 x 60% x 55% = $3.96 RPM; 100,000 views earn about $396", () => {
  const e = ev({ longBasis: "cpm", cpm: "12", monetizedPct: "60", longShare: "55", period: "month", longViews: "100000" });
  assert.ok(Math.abs(e.long!.rpm.typical - 3.96) < 1e-9);
  assert.equal(Math.round((100000 / 1000) * e.long!.rpm.typical), 396);
});

test("views needed for $1,000 a month", () => {
  const rows: [number, string, string][] = [
    [1.5, "666,667", "21,918"],
    [3, "333,333", "10,959"],
    [6, "166,667", "5,479"],
    [10, "100,000", "3,288"],
    [18, "55,556", "1,826"],
  ];
  for (const [r, month, day] of rows) {
    const g = viewsForGoal(1000, { low: r, typical: r, high: r })!;
    assert.equal(count(g.perMonth.typical), month, `$${r} per month`);
    assert.equal(count(g.perDay.typical), day, `$${r} per day`);
  }
  // FAQ: $4 RPM -> 250,000 a month, about 8,200 a day
  const four = viewsForGoal(1000, { low: 4, typical: 4, high: 4 })!;
  assert.equal(four.perMonth.typical, 250000);
  assert.equal(Math.round(four.perDay.typical / 100) * 100, 8200);
});

test("audience mix: mostly-US $2,308, mixed $1,855, mostly lower-income $814", () => {
  // the UI formats a range against its high case, so whole dollars throughout
  const month = (shares: string[]) => {
    const m = ev({ shares }).long!.month;
    return money(m.typical, m.high);
  };
  assert.equal(month(sharesOf("us-heavy")), "$2,308");
  assert.equal(month(sharesOf("mixed")), "$1,855");
  assert.equal(month(sharesOf("emerging")), "$814");
});

test("season multipliers move the tech example to $2,318 in Q4 and $1,576 in Q1", () => {
  assert.equal(money(ev({ season: "q4" }).long!.month.typical), "$2,318");
  assert.equal(money(ev({ season: "q1" }).long!.month.typical), "$1,576");
  assert.equal(RATES.seasons.find((s) => s.id === "q4")!.multiplier, 1.25);
  assert.equal(RATES.seasons.find((s) => s.id === "q1")!.multiplier, 0.85);
});

test("FAQ: one million views", () => {
  const long = ev({ period: "month", longViews: "1m" }).long!;
  assert.equal(Math.round((long.viewsPerDay / 1000) * long.rpm.typical * 365 / 12 / 100) * 100, 6100);
  const shorts = ev({ type: "shorts", period: "month", shortsViews: "1m" }).shorts!;
  assert.equal(Math.round(1000 * shorts.rpm.low), 23);
  assert.equal(Math.round(1000 * shorts.rpm.high), 126);
});

test("niche and region tables in the article match rates.json", () => {
  const niches: [string, number, number, number][] = [
    ["finance", 10, 18, 35],
    ["technology", 4, 9, 18],
    ["education", 3, 7, 14],
    ["health", 3, 7, 13],
    ["automotive", 3, 6, 12],
    ["food", 2.5, 5, 10],
    ["travel", 2, 5, 10],
    ["beauty", 2, 4.5, 9],
    ["gaming", 1, 3, 6],
    ["entertainment", 0.5, 1.5, 4],
  ];
  assert.deepEqual(
    RATES.niches.map((n) => [n.id, n.low, n.typical, n.high]),
    niches,
  );
  assert.deepEqual(
    RATES.regions.map((r) => r.multiplier),
    [1, 0.7, 0.5, 0.25, 0.1],
  );
  assert.equal(RATES.revenueShare.longFormCreatorPct, 55);
  assert.equal(RATES.revenueShare.shortsCreatorPct, 45);
  assert.equal(RATES.revenueShare.musicCutPct, 50);
  assert.equal(RATES.partnerProgram.adsensePaymentThresholdUsd, 100);
  assert.equal(RATES.asOf, "2026-09-29");
});

test("the 2027 Shorts rule is off by default and zeroes Shorts below 10M views in 90 days", () => {
  assert.equal(DEFAULT_STATE.applyShortsRule, false);
  const below = ev({ type: "shorts", shortsViews: "100000", applyShortsRule: true });
  assert.equal(below.shorts!.day.typical, 0);
  assert.equal(below.shorts90, 9_000_000);
  const above = ev({ type: "shorts", shortsViews: "200000", applyShortsRule: true });
  assert.ok(above.shorts!.day.typical > 0);
});

test("monthly views convert at 12/365 (10,000 a month is about 330 a day)", () => {
  const e = ev({ period: "month", longViews: "10000" });
  assert.equal(Math.round(e.long!.viewsPerDay), 329);
});

test("input parsing: 12,500, 10k and 1.5m; decimal comma rejected", () => {
  assert.deepEqual(parseNum("12,500", { suffix: true }), { kind: "ok", value: 12500 });
  assert.deepEqual(parseNum("10k", { suffix: true }), { kind: "ok", value: 10000 });
  assert.deepEqual(parseNum("1.5m", { suffix: true }), { kind: "ok", value: 1500000 });
  assert.equal(parseNum("12,5").kind, "invalid");
});

test("audience shares that do not add to 100% are scaled", () => {
  const e = ev({ shares: ["90", "30", "30", "30", "20"] });
  assert.ok(Math.abs(e.blend! - 0.6775) < 1e-12);
  assert.ok(e.notes.some((n) => n.text.includes("scaled to 100%")));
});

test("RPM helper: revenue / views x 1,000", () => {
  assert.equal(rpmFromRevenue(250, 50000), 5);
  assert.equal(rpmFromRevenue(10, 0), null);
});
