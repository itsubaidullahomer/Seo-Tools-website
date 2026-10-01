import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyPercent,
  formatNum,
  parseNumber,
  percentChange,
  percentDifference,
  percentOf,
  reversePercent,
  whatPercent,
  type Calc,
} from "../src/tools/percentage-calculator/logic";

function val<T>(c: Calc<T>): T {
  assert.ok(c.ok, c.ok ? "" : c.reason);
  if (!c.ok) throw new Error("unreachable");
  return c.value;
}

test("1. what is X% of Y", () => {
  assert.equal(formatNum(val(percentOf(20, 86.4))), "17.28");
  const tax = val(percentOf(7.25, 249.99));
  assert.ok(Math.abs(tax - 18.124275) < 1e-9);
  assert.equal(tax.toFixed(2), "18.12");
  // FAQ: 18% of 250 = 45, and the order does not matter
  assert.equal(val(percentOf(18, 250)), 45);
  assert.equal(val(percentOf(250, 18)), 45);
  // mental math: 8% of 25 equals 25% of 8
  assert.equal(val(percentOf(8, 25)), 2);
  assert.equal(val(percentOf(25, 8)), 2);
});

test("2. X is what percent of Y", () => {
  assert.equal(formatNum(val(whatPercent(43, 52))), "82.6923");
  assert.equal(formatNum(val(whatPercent(1150, 1500))), "76.6667");
  // averaging percentages mistake: 39 of 60 is 65%
  assert.equal(val(whatPercent(9 + 30, 10 + 50)), 65);
  // markup vs margin
  assert.equal(formatNum(val(whatPercent(20, 60))), "33.3333");
  assert.equal(val(whatPercent(20, 80)), 25);
  assert.equal(whatPercent(5, 0).ok, false);
});

test("3. percentage change", () => {
  const salary = val(percentChange(58000, 61480));
  assert.equal(salary.diff, 3480);
  assert.equal(formatNum(salary.pct), "6");
  assert.equal(salary.direction, "increase");

  const share = val(percentChange(142.5, 118.3));
  assert.equal(formatNum(share.pct), "-16.9825");
  assert.equal(share.direction, "decrease");

  const loss = val(percentChange(-200, -50));
  assert.equal(loss.pct, 75);
  assert.equal(loss.direction, "increase");

  assert.equal(formatNum(val(percentChange(1840, 2160)).pct), "17.3913");
  assert.equal(formatNum(val(percentChange(2160, 1840)).pct), "-14.8148");
  assert.equal(val(percentChange(80, 100)).pct, 25);
  assert.equal(val(percentChange(100, 80)).pct, -20);
  // FAQ: rent 1,200 -> 1,290
  assert.equal(val(percentChange(1200, 1290)).pct, 7.5);
  // percentage points vs percent
  assert.equal(val(percentChange(4, 5)).pct, 25);
  assert.equal(val(percentChange(5, 6)).pct, 20);
  assert.equal(formatNum(val(percentChange(5, 5.05)).pct), "1");
  assert.equal(val(percentChange(2, 3)).pct, 50);
  // from zero has no answer
  assert.equal(percentChange(0, 50).ok, false);
});

test("4. percentage difference is symmetric", () => {
  const d = val(percentDifference(1840, 2160));
  assert.equal(d.diff, 320);
  assert.equal(d.mean, 2000);
  assert.equal(d.pct, 16);
  assert.equal(val(percentDifference(2160, 1840)).pct, 16);
});

test("5. add or subtract a percentage", () => {
  assert.equal(val(applyPercent(65, 25, "subtract")).result, 48.75);
  const taxed = val(applyPercent(250, 8.25, "add")).result;
  assert.ok(Math.abs(taxed - 270.625) < 1e-9);
  assert.equal(formatNum(taxed), "270.625");
  // FAQ: 20% off 65 is 52, a saving of 13
  const off = val(applyPercent(65, 20, "subtract"));
  assert.equal(off.result, 52);
  assert.equal(off.amount, 13);
});

test("6. reverse percentage", () => {
  assert.equal(formatNum(val(reversePercent(68, 15, "subtract")).original), "80");
  assert.equal(formatNum(val(reversePercent(53.5, 7, "add")).original), "50");
  assert.equal(formatNum(val(reversePercent(108.25, 8.25, "add")).original), "100");
  // the wrong shortcut: adding 15% back onto 68
  assert.equal(formatNum(val(applyPercent(68, 15, "add")).result), "78.2");
  assert.equal(reversePercent(10, 100, "subtract").ok, false);
});

test("recovery table: rise needed after a fall", () => {
  const rows: [number, string][] = [
    [10, "11.1111"],
    [20, "25"],
    [25, "33.3333"],
    [50, "100"],
    [75, "300"],
  ];
  for (const [fall, rise] of rows) {
    const after = val(applyPercent(100, fall, "subtract")).result;
    assert.equal(formatNum(val(percentChange(after, 100)).pct), rise, `-${fall}%`);
  }
  // -50% then +50% ends at 75%
  assert.equal(val(applyPercent(val(applyPercent(100, 50, "subtract")).result, 50, "add")).result, 75);
});

test("reference table of common percentages", () => {
  const rows: [number, string, string, string][] = [
    [5, "0.05", "1.05", "0.95"],
    [10, "0.1", "1.1", "0.9"],
    [12.5, "0.125", "1.125", "0.875"],
    [20, "0.2", "1.2", "0.8"],
    [25, "0.25", "1.25", "0.75"],
    [100 / 3, "0.3333", "1.3333", "0.6667"],
    [50, "0.5", "1.5", "0.5"],
    [75, "0.75", "1.75", "0.25"],
  ];
  for (const [p, dec, up, down] of rows) {
    assert.equal(formatNum(p / 100), dec);
    assert.equal(formatNum(val(applyPercent(1, p, "add")).result), up);
    assert.equal(formatNum(val(applyPercent(1, p, "subtract")).result), down);
  }
});

test("mental-math shortcuts", () => {
  assert.equal(formatNum(val(percentOf(10, 386))), "38.6");
  assert.equal(formatNum(val(percentOf(5, 386))), "19.3");
  assert.equal(formatNum(val(percentOf(20, 386))), "77.2");
  assert.equal(formatNum(val(percentOf(15, 386))), "57.9");
  assert.equal(val(percentOf(1, 4250)), 42.5);
  assert.equal(val(percentOf(3, 4250)), 127.5);
  // stacked discounts: 0.80 x 0.90 = 0.72, 28% off
  const stacked = val(applyPercent(val(applyPercent(100, 20, "subtract")).result, 10, "subtract")).result;
  assert.equal(stacked, 72);
});

test("parsing: separators, currency, % and the decimal-comma guard", () => {
  assert.deepEqual(parseNumber("12,500"), { kind: "ok", value: 12500 });
  assert.deepEqual(parseNumber("1,25,000"), { kind: "ok", value: 125000 });
  assert.deepEqual(parseNumber("$1,250.75"), { kind: "ok", value: 1250.75 });
  assert.deepEqual(parseNumber("€40"), { kind: "ok", value: 40 });
  assert.deepEqual(parseNumber("+15%"), { kind: "ok", value: 15 });
  assert.deepEqual(parseNumber("−3.5"), { kind: "ok", value: -3.5 });
  assert.equal(parseNumber("12,5").kind, "invalid");
  assert.equal(parseNumber("abc").kind, "invalid");
});

test("display: at most four decimals, scientific notation for tiny and huge values", () => {
  assert.equal(formatNum(1 / 3), "0.3333");
  assert.equal(formatNum(-0), "0");
  assert.match(formatNum(0.00001), /e-5$/);
  assert.match(formatNum(2e15), /e\+15$/);
});
