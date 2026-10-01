import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  blocksForNumber,
  chartCsv,
  chartRows,
  convert,
  convertDate,
  isLeapYear,
  MAX_STANDARD,
  MAX_VALUE,
  OVERLINE,
  parseNumberInput,
  parseRoman,
  parseYearStart,
  segmentsFromUnicode,
  toRomanForm,
  toStandardRoman,
  withCase,
  type DateInput,
} from "../src/tools/roman-numeral-converter/logic";

const article = readFileSync(new URL("../src/tools/roman-numeral-converter/content.md", import.meta.url), "utf8");

const valid = (s: string) => {
  const r = parseRoman(s);
  assert.equal(r.kind, "valid", `${s}: ${JSON.stringify(r)}`);
  return r.kind === "valid" ? r.value : NaN;
};

test("intro: 2026 → MMXXVI and MCMXCIV → 1994", () => {
  const a = convert("2026");
  assert.ok(a.kind === "to-roman" && a.form.unicode === "MMXXVI");
  const b = convert("MCMXCIV");
  assert.ok(b.kind === "from-roman" && b.parse.kind === "valid" && b.parse.value === 1994);
  assert.equal(valid("mmxxvi"), 2026);
  assert.equal(valid("Ⅻ"), 12);
  const c = convert("2,026");
  assert.ok(c.kind === "to-roman" && c.value === 2026);
});

test("seven letters and the additive / subtractive rules", () => {
  assert.deepEqual(
    ["I", "V", "X", "L", "C", "D", "M"].map(valid),
    [1, 5, 10, 50, 100, 500, 1000],
  );
  assert.equal(valid("VIII"), 8);
  assert.equal(valid("MDC"), 1600);
  for (const [pair, v] of [
    ["IV", 4],
    ["IX", 9],
    ["XL", 40],
    ["XC", 90],
    ["CD", 400],
    ["CM", 900],
  ] as const) {
    assert.equal(valid(pair), v);
    assert.equal(toStandardRoman(v), pair);
  }
});

test("1994 step by step: M + CM + XC + IV", () => {
  const [block] = blocksForNumber(1994);
  assert.deepEqual(
    block.rows.map((r) => [r.place, r.letters, r.value]),
    [
      ["Thousands", "M", 1000],
      ["Hundreds", "CM", 900],
      ["Tens", "XC", 90],
      ["Ones", "IV", 4],
    ],
  );
  assert.equal(block.sum, 1994);
});

test("largest standard numeral is MMMCMXCIX; no zero, negatives or fractions", () => {
  assert.equal(MAX_STANDARD, 3999);
  assert.equal(toStandardRoman(3999), "MMMCMXCIX");
  assert.equal(parseNumberInput("0").kind, "error");
  assert.equal(parseNumberInput("-5").kind, "error");
  assert.equal(parseNumberInput("2.5").kind, "error");
  assert.deepEqual(parseNumberInput("2.0"), { kind: "ok", value: 2 });
});

test("above 3,999: vinculum, Unicode combining overline, repeated-M up to 9,999", () => {
  assert.equal(MAX_VALUE, 3_999_999);
  const f = toRomanForm(12_345);
  assert.deepEqual(f.segments, [
    { text: "XII", overline: true },
    { text: "CCCXLV", overline: false },
  ]);
  assert.equal(f.unicode, `X${OVERLINE}I${OVERLINE}I${OVERLINE}CCCXLV`);
  assert.equal(OVERLINE, "̅");
  assert.deepEqual(segmentsFromUnicode(f.unicode), f.segments);
  assert.equal(toRomanForm(5000).unicode, `V${OVERLINE}`);
  assert.equal(toRomanForm(1_000_000).unicode, `M${OVERLINE}`);
  assert.equal(toRomanForm(4000).repeatedM, "MMMM");
  assert.equal(toRomanForm(9999).repeatedM, "MMMMMMMMMCMXCIX");
  assert.equal(toRomanForm(10_000).repeatedM, null);
  assert.equal(valid(f.unicode), 12_345);
  const mmmm = parseRoman("MMMM");
  assert.ok(mmmm.kind === "valid" && mmmm.value === 4000 && mmmm.style === "repeated-m");
  assert.throws(() => toRomanForm(4_000_000), RangeError);
  assert.equal(convert("4000000").kind, "error");
});

test("non-standard table: rule broken, loose reading and standard form", () => {
  const rows: [string, RegExp, number, string][] = [
    ["IIII", /at most three times in a row/, 4, "IV"],
    ["XXXX", /at most three times in a row/, 40, "XL"],
    ["VV", /never repeated/, 10, "X"],
    ["VX", /V, L and D are never subtracted/, 5, "V"],
    ["IC", /I can only go in front of V or X/, 99, "XCIX"],
    ["IL", /I can only go in front of V or X/, 49, "XLIX"],
    ["XD", /X can only go in front of L or C/, 490, "CDXC"],
  ];
  for (const [input, rule, value, standard] of rows) {
    const r = parseRoman(input);
    assert.equal(r.kind, "nonstandard", input);
    if (r.kind !== "nonstandard") continue;
    assert.match(r.reason, rule, input);
    assert.equal(r.value, value, input);
    assert.equal(r.suggestion?.unicode, standard, input);
  }
});

test("IIX is explained without guessing a value; MIM and IXX are not numerals", () => {
  const iix = parseRoman("IIX");
  assert.ok(iix.kind === "nonstandard" && iix.value === null);
  assert.equal(parseRoman("MIM").kind, "nonstandard");
  assert.equal(toStandardRoman(1999), "MCMXCIX");
  assert.equal(parseRoman("IXX").kind, "nonstandard");
  assert.equal(valid("XIX"), 19);
  assert.equal(parseRoman("2026X").kind, "error");
});

const date = (o: Partial<DateInput>): DateInput => ({ month: "6", day: "15", year: "2024", order: "mdy", separator: "dot", yearStyle: "full", ...o });
const dateText = (o: Partial<DateInput>) => {
  const r = convertDate(date(o));
  assert.equal(r.kind, "ok", JSON.stringify(r));
  return r.kind === "ok" ? r : null!;
};

test("date table: June 15, 2024 in each style", () => {
  assert.equal(dateText({}).roman, "VI.XV.MMXXIV");
  assert.equal(dateText({ order: "dmy" }).roman, "XV.VI.MMXXIV");
  assert.equal(dateText({ order: "ymd", separator: "dash" }).roman, "MMXXIV-VI-XV");
  assert.equal(dateText({ yearStyle: "short" }).roman, "VI.XV.XXIV");
  assert.equal(dateText({ yearStyle: "split" }).roman, "VI.XV.XX.XXIV");
  const r = dateText({});
  assert.ok(r.parts.every((p) => p.readBack === p.value));
  assert.equal(r.stacked, "VI\nXV\nMMXXIV");
});

test("dates: 00 falls back to the full year; real dates only; leap years", () => {
  const y2000 = dateText({ year: "2000", yearStyle: "short" });
  assert.equal(y2000.roman, "VI.XV.MM");
  assert.equal(y2000.notes.length, 1);
  assert.equal(convertDate(date({ month: "2", day: "30" })).kind, "error");
  assert.equal(convertDate(date({ month: "2", day: "29", year: "2000" })).kind, "ok");
  assert.equal(convertDate(date({ month: "2", day: "29", year: "1900" })).kind, "error");
  assert.ok(isLeapYear(2024) && isLeapYear(2000) && !isLeapYear(1900) && !isLeapYear(2026));
  assert.equal(convertDate(date({ year: "4000" })).kind, "error");
  assert.equal(convertDate(date({ year: "0" })).kind, "error");
});

test("separators: XIXII is ambiguous without one", () => {
  assert.equal(toStandardRoman(11) + toStandardRoman(12), "XIXII");
  assert.equal(toStandardRoman(19) + toStandardRoman(2), "XIXII");
});

test("reference table and years", () => {
  const ref: [number, string][] = [
    [1, "I"],
    [4, "IV"],
    [5, "V"],
    [9, "IX"],
    [10, "X"],
    [40, "XL"],
    [49, "XLIX"],
    [50, "L"],
    [90, "XC"],
    [99, "XCIX"],
    [100, "C"],
    [400, "CD"],
    [500, "D"],
    [900, "CM"],
    [1000, "M"],
    [1994, "MCMXCIV"],
    [2000, "MM"],
    [2025, "MMXXV"],
    [2026, "MMXXVI"],
    [3999, "MMMCMXCIX"],
    [2024, "MMXXIV"],
    [2027, "MMXXVII"],
    [2028, "MMXXVIII"],
    [2029, "MMXXIX"],
    [2030, "MMXXX"],
  ];
  for (const [n, r] of ref) {
    assert.equal(toStandardRoman(n), r);
    assert.equal(valid(r), n);
  }
});

test("every row of the article's 1–100 chart matches the converter", () => {
  const rows = article.split("\n").filter((l) => /^\| \d+–\d+ \|/.test(l));
  assert.equal(rows.length, 10);
  for (const row of rows) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    const start = Number(cells[0].split("–")[0]);
    cells.slice(1).forEach((roman, i) => assert.equal(roman, toStandardRoman(start + i), `${start + i}`));
  }
  const chart = chartRows(1, 100);
  assert.equal(chart.length, 100);
  assert.equal(chart[22].roman, "XXIII");
  assert.ok(chartCsv(chart.slice(0, 2), ["Number", "Roman"]).startsWith("Number,Roman\n1,I\n2,II\n"));
  assert.equal(parseYearStart("3900"), 3900);
  assert.equal(parseYearStart("3901"), null);
});

test("Super Bowl numbers: year played = 1966 + game number", () => {
  for (const [n, numeral, year] of [
    [1, "I", 1967],
    [5, "V", 1971],
    [10, "X", 1976],
    [20, "XX", 1986],
    [40, "XL", 2006],
    [50, "L", 2016],
    [60, "LX", 2026],
    [61, "LXI", 2027],
  ] as const) {
    assert.equal(toStandardRoman(n), numeral);
    assert.equal(1966 + n, year);
  }
  assert.equal(toStandardRoman(33), "XXXIII"); // Paris 2024 Olympiad
});

test("lowercase for preface pages", () => {
  assert.equal(withCase(toRomanForm(3), true).unicode, "iii");
  assert.equal(withCase(toRomanForm(4000), true).repeatedM, "mmmm");
});
