import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FIELDS,
  EXEMPT_SALARY_FLOOR,
  SALARY_STEPS,
  compareOffers,
  evaluate,
  formatMoneyExact,
  formatPct,
  hourlyFor,
  parseNumber,
  salaryTable,
  type Fields,
  type PayResult,
  type PayValues,
} from "../src/tools/salary-to-hourly-calculator/logic";

function run(overrides: Partial<Fields>): { values: PayValues; result: PayResult } {
  const ev = evaluate({ ...DEFAULT_FIELDS, ...overrides });
  assert.equal(ev.status, "ok", JSON.stringify(ev.errors));
  if (ev.status !== "ok") throw new Error("unreachable");
  return { values: ev.values, result: ev.result };
}

const usd = (n: number) => formatMoneyExact(n, "USD");
const period = (r: PayResult, key: string) => {
  const p = r.periods.find((x) => x.key === key);
  assert.ok(p, key);
  return p.amount;
};
const std = { hours: 40, days: 5, weeks: 52, pto: 0 };

test("default: $50,000 over 2,080 hours is $24.04 an hour, with every pay period", () => {
  const { result } = run({});
  assert.equal(result.paidHours, 2080);
  assert.equal(usd(result.hourly), "$24.04");
  assert.equal(usd(period(result, "monthly")), "$4,166.67");
  assert.equal(usd(period(result, "semimonthly")), "$2,083.33");
  assert.equal(usd(period(result, "biweekly")), "$1,923.08");
  assert.equal(usd(period(result, "weekly")), "$961.54");
  assert.equal(usd(period(result, "daily")), "$192.31");
  // mental-math shortcut: 50 -> halve -> 25 -> minus about 4% -> roughly 24
  assert.equal(Math.round((50000 / 1000 / 2) * 0.96), 24);
});

test("2,087-hour OPM convention via 52.175 weeks: $23.96", () => {
  const { result } = run({ weeks: "52.175" });
  assert.ok(Math.abs(result.paidHours - 2087) < 1e-9);
  assert.equal(usd(result.hourly), "$23.96");
});

test("worked examples for $50,000", () => {
  assert.equal(usd(run({ weeks: "50" }).result.hourly), "$25.00");
  const h45 = run({ hours: "45" }).result;
  assert.equal(h45.paidHours, 2340);
  assert.equal(usd(h45.hourly), "$21.37");
  const h50 = run({ hours: "50" }).result;
  assert.equal(h50.paidHours, 2600);
  assert.equal(usd(h50.hourly), "$19.23");
});

test("worked examples for $80,000", () => {
  const std80 = run({ salary: "80000" }).result;
  assert.equal(usd(std80.hourly), "$38.46");
  assert.equal(usd(period(std80, "weekly")), "$1,538.46");
  assert.equal(usd(period(std80, "monthly")), "$6,666.67");
  assert.equal(usd(run({ salary: "80000", hours: "50" }).result.hourly), "$30.77");
  const four = run({ salary: "80000", hours: "32", days: "4" }).result;
  assert.equal(four.paidHours, 1664);
  assert.equal(usd(four.hourly), "$48.08");
});

test("worked example: non-exempt $52,000 with 5 overtime hours at 1.5x", () => {
  const { result } = run({ salary: "52000", otHours: "5", otMult: "1.5" });
  assert.equal(result.hourly, 25);
  assert.equal(result.otRate, 37.5);
  assert.equal(result.otPay, 9750);
  assert.equal(result.totalPay, 61750);
  assert.equal(result.totalWorkedHours, 2340);
  assert.equal(usd(result.effectiveHourly), "$26.39");
  assert.equal(usd(52000 / 2340), "$22.22");
});

test("salary table at 40 h x 52 weeks", () => {
  const rows: [number, string, string, string, string][] = [
    [30000, "$2,500.00", "$1,153.85", "$576.92", "$14.42"],
    [40000, "$3,333.33", "$1,538.46", "$769.23", "$19.23"],
    [50000, "$4,166.67", "$1,923.08", "$961.54", "$24.04"],
    [60000, "$5,000.00", "$2,307.69", "$1,153.85", "$28.85"],
    [70000, "$5,833.33", "$2,692.31", "$1,346.15", "$33.65"],
    [80000, "$6,666.67", "$3,076.92", "$1,538.46", "$38.46"],
    [90000, "$7,500.00", "$3,461.54", "$1,730.77", "$43.27"],
    [100000, "$8,333.33", "$3,846.15", "$1,923.08", "$48.08"],
    [120000, "$10,000.00", "$4,615.38", "$2,307.69", "$57.69"],
    [150000, "$12,500.00", "$5,769.23", "$2,884.62", "$72.12"],
    [200000, "$16,666.67", "$7,692.31", "$3,846.15", "$96.15"],
  ];
  const table = salaryTable(std, rows.map((r) => r[0]));
  rows.forEach(([annual, monthly, biweekly, weekly, hourly], i) => {
    const t = table[i];
    assert.equal(usd(t.monthly), monthly, `${annual} monthly`);
    assert.equal(usd(t.biweekly), biweekly, `${annual} biweekly`);
    assert.equal(usd(t.weekly), weekly, `${annual} weekly`);
    assert.equal(usd(t.hourly), hourly, `${annual} hourly`);
  });
  assert.equal(SALARY_STEPS[0], 30000);
  assert.equal(SALARY_STEPS[SALARY_STEPS.length - 1], 200000);
  // each extra $10,000 adds $4.81 an hour
  assert.equal(usd(run({}).result.perThousand * 10), "$4.81");
});

test("paid time off: $50,000 with 20 paid days is $24.04 per paid hour and $26.04 per hour worked", () => {
  const { result } = run({ pto: "20" });
  assert.equal(result.ptoHours, 160);
  assert.equal(result.workedHours, 1920);
  assert.equal(usd(result.hourly), "$24.04");
  assert.equal(usd(result.perWorkedHour), "$26.04");
});

test("school-year teacher: $48,000 over 40 weeks of 40 hours", () => {
  const { result } = run({ salary: "48000", weeks: "40" });
  assert.equal(result.paidHours, 1600);
  assert.equal(usd(result.hourly), "$30.00");
  assert.equal(usd(hourlyFor(48000, std).hourly), "$23.08");
});

test("exempt salary floor: $684 a week = $35,568 a year", () => {
  assert.equal(684 * 52, 35568);
  assert.equal(EXEMPT_SALARY_FLOOR, 35568);
});

test("offer comparison: $80k at 50 h/15 PTO vs $70k at 40 h/20 PTO", () => {
  const a = run({ salary: "80000", hours: "50", pto: "15" }).values;
  const cmp = compareOffers({ ...DEFAULT_FIELDS, cmpSalary: "70000", cmpHours: "40", cmpPto: "20" }, a);
  assert.equal(cmp.status, "ok");
  if (cmp.status !== "ok") return;
  assert.equal(cmp.a.paidHours, 2600);
  assert.equal(cmp.a.workedHours, 2450);
  assert.equal(usd(cmp.a.perWorkedHour), "$32.65");
  assert.equal(cmp.b.paidHours, 2080);
  assert.equal(cmp.b.workedHours, 1920);
  assert.equal(usd(cmp.b.perWorkedHour), "$36.46");
  assert.equal(usd(cmp.diff), "$3.81");
  assert.equal(formatPct(cmp.pct), "+11.7%");
  assert.equal(cmp.winner, "b");
});

test("tips: monthly / 4 overstates weekly pay by about 8%; biweekly vs semi-monthly", () => {
  const overstatement = 52 / 12 / 4 - 1;
  assert.equal(Math.round(overstatement * 100), 8);
  assert.equal(run({ salary: "2000", period: "biweek" }).values.annual, 52000);
  assert.equal(run({ salary: "2000", period: "semimonth" }).values.annual, 48000);
  assert.equal(100 / 50, 2);
});

test("typing 50 for $50,000 triggers the below-$1-an-hour warning", () => {
  const ev = evaluate({ ...DEFAULT_FIELDS, salary: "50" });
  assert.equal(ev.status, "ok");
  if (ev.status !== "ok") return;
  assert.ok(ev.result.hourly < 1);
  assert.ok(ev.notices.some((n) => n.title.includes("less than 1 an hour")));
});

test("FAQ figures", () => {
  assert.equal(usd(run({ salary: "65000" }).result.hourly), "$31.25");
  assert.equal(usd(run({ salary: "60000" }).result.hourly), "$28.85");
  assert.equal(usd(run({ salary: "60000", hours: "45" }).result.hourly), "$25.64");
  assert.equal(usd(run({ salary: "60000", hours: "50" }).result.hourly), "$23.08");
  const monthly = run({ salary: "4000", period: "month" });
  assert.equal(monthly.values.annual, 48000);
  assert.equal(usd(monthly.result.hourly), "$23.08");
  const biweekly = run({ salary: "2000", period: "biweek" });
  assert.equal(usd(biweekly.result.hourly), "$25.00");
  assert.equal(run({}).result.workedHours, 2080);
});

test("salary input accepts 50000, 50,000, $50k and 50k/yr", () => {
  for (const raw of ["50000", "50,000", "$50k", "50k/yr", "50K per year"]) {
    assert.deepEqual(parseNumber(raw, { allowK: true }), { kind: "ok", value: 50000 }, raw);
  }
  assert.equal(parseNumber("22,5").kind, "invalid");
});

test("impossible values are rejected", () => {
  assert.equal(evaluate({ ...DEFAULT_FIELDS, hours: "169" }).status, "invalid");
  assert.equal(evaluate({ ...DEFAULT_FIELDS, pto: "260" }).status, "invalid");
});
