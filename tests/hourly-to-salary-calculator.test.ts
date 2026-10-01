import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FIELDS,
  OT_MULTIPLIERS,
  QUICK_RATES,
  evaluate,
  formatMoney,
  parseNumber,
  quickTable,
  type Fields,
  type PayResult,
  type PayValues,
} from "../src/tools/hourly-to-salary-calculator/logic";

function run(overrides: Partial<Fields>): { values: PayValues; result: PayResult } {
  const ev = evaluate({ ...DEFAULT_FIELDS, ...overrides });
  assert.equal(ev.status, "ok", JSON.stringify(ev.errors));
  if (ev.status !== "ok") throw new Error("unreachable");
  return { values: ev.values, result: ev.result };
}

function period(r: PayResult, key: string): number {
  const p = r.periods.find((x) => x.key === key);
  assert.ok(p, key);
  return p.amount;
}

const near = (actual: number, expected: number, eps = 0.005) =>
  assert.ok(Math.abs(actual - expected) < eps, `expected ${expected}, got ${actual}`);

test("default schedule: $25 an hour, 40 h x 52 weeks = 2,080 hours = $52,000", () => {
  const { result } = run({});
  assert.equal(result.hoursPerYear, 2080);
  assert.equal(result.annual, 52000);
  // Mental-math shortcut from the article: x 2,000 then + 4%
  assert.equal(25 * 2000 * 1.04, 52000);
});

test("article formula example: $27.50 x 40 x 52 and every pay period", () => {
  const { result } = run({ rate: "27.50" });
  assert.equal(result.annual, 57200);
  assert.equal(formatMoney(period(result, "monthly"), "USD"), "$4,766.67");
  assert.equal(formatMoney(period(result, "semimonthly"), "USD"), "$2,383.33");
  assert.equal(formatMoney(period(result, "biweekly"), "USD"), "$2,200");
  assert.equal(formatMoney(period(result, "weekly"), "USD"), "$1,100");
  assert.equal(result.daysPerYear, 260);
  assert.equal(formatMoney(period(result, "daily"), "USD"), "$220");
});

test("2,087-hour federal convention: 52.175 weeks at $25 is $52,175 (about 0.3% more)", () => {
  const { result } = run({ weeks: "52.175" });
  near(result.hoursPerYear, 2087);
  near(result.annual, 52175);
  // weekly and biweekly still divide by 52 and 26
  near(period(result, "weekly"), 52175 / 52);
  near(period(result, "biweekly"), 52175 / 26);
  assert.equal(((2087 - 2080) / 2080 * 100).toFixed(1), "0.3");
  // a calendar year is about 52.18 weeks
  assert.equal((365.25 / 7).toFixed(2), "52.18");
});

test("a month averages 4.33 weeks, so weekly x 4 understates monthly pay by about 8%", () => {
  assert.equal((52 / 12).toFixed(2), "4.33");
  const understatement = 1 - 4 / (52 / 12);
  assert.equal(Math.round(understatement * 100), 8);
});

test("worked example: part-time 20 h at $18", () => {
  const { result } = run({ rate: "18", hours: "20" });
  assert.equal(result.annual, 18720);
  near(period(result, "monthly"), 1560);
  near(period(result, "weekly"), 360);
});

test("worked example: four-day 32 h week at $30 is a 20% cut; $37.50 matches 40 h", () => {
  const four = run({ rate: "30", hours: "32", days: "4" }).result.annual;
  const full = run({ rate: "30" }).result.annual;
  assert.equal(four, 49920);
  assert.equal(full, 62400);
  near(1 - four / full, 0.2, 1e-9);
  assert.equal(run({ rate: "37.50", hours: "32", days: "4" }).result.annual, 62400);
});

test("worked example: 37.5 h week at £15", () => {
  const { result } = run({ rate: "15", hours: "37.5", currency: "GBP" });
  assert.equal(result.annual, 29250);
  assert.equal(formatMoney(result.annual, "GBP"), "£29,250");
  assert.equal(formatMoney(period(result, "monthly"), "GBP"), "£2,437.50");
});

test("worked example: $22 with 5 overtime hours at 1.5x", () => {
  const { result } = run({ rate: "22", otHours: "5", otMult: "1.5" });
  assert.equal(result.perWorkedWeek, 1045);
  assert.equal(result.overtimeAnnual, 8580);
  assert.equal(result.annual, 54340);
  assert.equal(run({ rate: "22" }).result.annual, 45760);
  assert.equal(22 * 1.5 * 5, 165);
});

test("worked example: unpaid weeks and unpaid days", () => {
  const twoWeeks = run({ unpaidWeeks: "2" }).result;
  assert.equal(twoWeeks.weeksWorked, 50);
  assert.equal(twoWeeks.annual, 50000);

  // 11 unpaid holidays at $20 = 88 hours = $1,760 less than $41,600
  const holidays = run({ rate: "20", unpaidDays: "11" }).result;
  near(holidays.annual, 39840);
  near(run({ rate: "20" }).result.annual - holidays.annual, 1760);

  // FAQ: 10 unpaid days on a five-day week equals two weeks
  assert.equal(run({ unpaidDays: "10" }).result.unpaidWeeksTotal, 2);
});

test("common wages table (40 h x 52 weeks)", () => {
  const rows: [number, string, string, string, string][] = [
    [7.25, "$290", "$580", "$1,256.67", "$15,080"],
    [12, "$480", "$960", "$2,080", "$24,960"],
    [15, "$600", "$1,200", "$2,600", "$31,200"],
    [16, "$640", "$1,280", "$2,773.33", "$33,280"],
    [18, "$720", "$1,440", "$3,120", "$37,440"],
    [20, "$800", "$1,600", "$3,466.67", "$41,600"],
    [22, "$880", "$1,760", "$3,813.33", "$45,760"],
    [25, "$1,000", "$2,000", "$4,333.33", "$52,000"],
    [30, "$1,200", "$2,400", "$5,200", "$62,400"],
    [35, "$1,400", "$2,800", "$6,066.67", "$72,800"],
    [40, "$1,600", "$3,200", "$6,933.33", "$83,200"],
    [50, "$2,000", "$4,000", "$8,666.67", "$104,000"],
    [60, "$2,400", "$4,800", "$10,400", "$124,800"],
    [75, "$3,000", "$6,000", "$13,000", "$156,000"],
    [100, "$4,000", "$8,000", "$17,333.33", "$208,000"],
  ];
  const { values } = run({});
  const table = quickTable(values, rows.map((r) => r[0]));
  rows.forEach(([rate, weekly, biweekly, monthly, annual], i) => {
    const t = table[i];
    assert.equal(formatMoney(t.weekly, "USD"), weekly, `${rate} weekly`);
    assert.equal(formatMoney(t.biweekly, "USD"), biweekly, `${rate} biweekly`);
    assert.equal(formatMoney(t.monthly, "USD"), monthly, `${rate} monthly`);
    assert.equal(formatMoney(t.annual, "USD"), annual, `${rate} annual`);
  });
  // each extra dollar an hour is worth $2,080; a $2 raise adds $4,160
  assert.equal(run({}).result.perDollarRaise, 2080);
  assert.equal(2 * run({}).result.perDollarRaise, 4160);
});

test("FAQ figures", () => {
  const twenty = run({ rate: "20" }).result;
  assert.equal(twenty.annual, 41600);
  assert.equal(Math.round(period(twenty, "monthly")), 3467);
  assert.equal(period(twenty, "biweekly"), 1600);
  assert.equal(period(twenty, "weekly"), 800);
  assert.equal(run({ rate: "32" }).result.annual, 66560);
  assert.equal(260 * 8, 2080);
});

test("quick reference spans $15 to $100 and overtime multipliers span 1.25x to 2.5x", () => {
  assert.equal(QUICK_RATES[0], 15);
  assert.equal(QUICK_RATES[QUICK_RATES.length - 1], 100);
  assert.equal(OT_MULTIPLIERS[0], "1.25");
  assert.equal(OT_MULTIPLIERS[OT_MULTIPLIERS.length - 1], "2.5");
});

test("input parsing accepts 24.50, $24.50 and 24.50/hr; rejects decimal commas", () => {
  for (const raw of ["24.50", "$24.50", "24.50/hr", " 24.50 per hour "]) {
    assert.deepEqual(parseNumber(raw), { kind: "ok", value: 24.5 }, raw);
  }
  assert.deepEqual(parseNumber("1,250"), { kind: "ok", value: 1250 });
  assert.equal(parseNumber("22,5").kind, "invalid");
  assert.equal(parseNumber("").kind, "empty");
});

test("impossible values turn the field red instead of showing a result", () => {
  const tooMany = evaluate({ ...DEFAULT_FIELDS, hours: "169" });
  assert.equal(tooMany.status, "invalid");
  assert.ok(tooMany.errors.hours);
  const unpaid = evaluate({ ...DEFAULT_FIELDS, unpaidWeeks: "52" });
  assert.equal(unpaid.status, "invalid");
  const otOver = evaluate({ ...DEFAULT_FIELDS, hours: "160", otHours: "10" });
  assert.equal(otOver.status, "invalid");
});
