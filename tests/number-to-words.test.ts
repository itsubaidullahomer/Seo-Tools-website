import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cardinalToOrdinalWords,
  convert,
  convertList,
  DEFAULT_OPTIONS,
  groupDigits,
  integerParts,
  integerToWords,
  LONG_SCALE,
  MAX_INT_DIGITS,
  ordinalSuffix,
  parseNumber,
  SHORT_SCALE,
  toMoney,
  type ConvertOptions,
  type WordStyle,
} from "../src/tools/number-to-words/logic";

const base: ConvertOptions = { ...DEFAULT_OPTIONS, caseStyle: "lower" };
function words(raw: string, o: Partial<ConvertOptions> = {}): string {
  const r = convert(raw, { ...base, ...o });
  assert.equal(r.kind, "ok", `${raw}: ${JSON.stringify(r)}`);
  return r.kind === "ok" ? r.text : "";
}
const isError = (raw: string, o: Partial<ConvertOptions> = {}) => convert(raw, { ...base, ...o }).kind === "error";
const us: WordStyle = { british: false, hyphen: true, scale: "short", system: "international" };

test("intro: 1,250.50 in Words and Currency modes", () => {
  assert.equal(words("1,250.50"), "one thousand two hundred fifty point five zero");
  assert.equal(words("1,250.50", { mode: "currency" }), "one thousand two hundred fifty dollars and fifty cents");
  const r = convert("1,250.50", { ...base, mode: "currency", caseStyle: "sentence" });
  assert.ok(r.kind === "ok");
  // "Copy words + figures" joins the two as words (figures).
  assert.equal(`${r.text} (${r.formatted})`, "One thousand two hundred fifty dollars and fifty cents ($1,250.50)");
});

test("worked example: 4,207,015 by period, US and British", () => {
  const parts = integerParts("4207015", us);
  assert.deepEqual(
    parts.map((p) => [p.label, p.digits, p.words]),
    [
      ["Million", "4", "four million"],
      ["Thousand", "207", "two hundred seven thousand"],
      ["Units", "15", "fifteen"],
    ],
  );
  assert.equal(words("4,207,015"), "four million two hundred seven thousand fifteen");
  assert.equal(words("4,207,015", { british: true }), "four million two hundred and seven thousand and fifteen");
  assert.equal(words("1,000,001", { british: true }), "one million and one");
  assert.equal(words("1,050,000", { british: true }), "one million fifty thousand");
  // FAQ
  assert.equal(words("105"), "one hundred five");
  assert.equal(words("105", { british: true }), "one hundred and five");
});

test("hyphens 21–99 only between tens and units", () => {
  assert.equal(words("21"), "twenty-one");
  assert.equal(words("99"), "ninety-nine");
  assert.equal(words("20"), "twenty");
  assert.equal(words("121"), "one hundred twenty-one");
  assert.equal(words("64", { hyphen: false }), "sixty four");
});

test("decimals read digit by digit; currency rounds half up with a note", () => {
  assert.equal(words("0.05"), "zero point zero five");
  assert.equal(words("2.50"), "two point five zero");
  assert.equal(words("0.05", { mode: "currency" }), "five cents");
  const r = convert("12.345", { ...base, mode: "currency" });
  assert.ok(r.kind === "ok");
  assert.equal(r.formatted, "$12.35");
  assert.equal(r.text, "twelve dollars and thirty-five cents");
  assert.ok(r.notes.some((n) => n.startsWith("Rounded to two decimal places ($12.35)")));
  assert.deepEqual(toMoney({ negative: false, int: "0", frac: "995" }), { negative: false, major: "1", minor: 0, rounded: true });
  assert.equal(words("1.01", { mode: "currency" }), "one dollar and one cent");
  assert.equal(words("2", { mode: "currency", currency: "GBP" }), "two pounds");
  assert.equal(words("0.01", { mode: "currency", currency: "GBP" }), "one penny");
});

test("exact digits beyond 2^53 and scientific notation", () => {
  assert.equal(
    words("9,007,199,254,740,993"),
    "nine quadrillion seven trillion one hundred ninety-nine billion two hundred fifty-four million seven hundred forty thousand nine hundred ninety-three",
  );
  assert.notEqual(String(9007199254740993), "9007199254740993"); // what a Number-based converter would see
  assert.equal(words("1e30"), "one nonillion");
  assert.equal(words("1.5e3"), "one thousand five hundred");
  assert.equal(words("123456789012345678901234567890"), integerToWords("123456789012345678901234567890", us));
  assert.equal(words("2e-3"), "zero point zero zero two");
});

test("check style table", () => {
  const check = (raw: string) => words(raw, { mode: "check", caseStyle: "sentence" });
  assert.equal(check("$8.05"), "Eight and 05/100");
  assert.equal(check("$100.00"), "One hundred and 00/100");
  assert.equal(check("$1,250.50"), "One thousand two hundred fifty and 50/100");
  assert.equal(check("$12,004.99"), "Twelve thousand four and 99/100");
  assert.equal(check("$0.75"), "Zero and 75/100");
  assert.equal(check("105"), "One hundred five and 00/100");
  // British "and" is ignored, and negatives are refused.
  assert.equal(words("105", { mode: "check", british: true, caseStyle: "sentence" }), "One hundred five and 00/100");
  assert.ok(isError("-5", { mode: "check" }));
});

test("Indian numbering: lakh and crore table, rupee example with 'only'", () => {
  const indian = { system: "indian" as const };
  assert.equal(words("100000", indian), "one lakh");
  assert.equal(words("1000000", indian), "ten lakh");
  assert.equal(words("10000000", indian), "one crore");
  assert.equal(words("1000000000000", indian), "one lakh crore");
  assert.equal(words("12,34,567", indian), "twelve lakh thirty-four thousand five hundred sixty-seven");
  assert.equal(
    words("123,456.78", { mode: "currency", currency: "INR", system: "indian", onlySuffix: true }),
    "one lakh twenty-three thousand four hundred fifty-six rupees and seventy-eight paise only",
  );
  assert.equal(groupDigits("100000", "indian"), "1,00,000");
  assert.equal(groupDigits("1000000000000", "indian"), "10,00,00,00,00,000");
  assert.equal(groupDigits("10000000", "indian"), "1,00,00,000");
});

test("short and long scale tables", () => {
  assert.deepEqual(SHORT_SCALE.slice(1), [
    "thousand",
    "million",
    "billion",
    "trillion",
    "quadrillion",
    "quintillion",
    "sextillion",
    "septillion",
    "octillion",
    "nonillion",
    "decillion",
  ]);
  const pow = (n: number) => "1" + "0".repeat(n);
  const long = { scale: "long" as const };
  assert.equal(words(pow(9), long), "one milliard");
  assert.equal(words(pow(12), long), "one billion");
  assert.equal(words(pow(18), long), "one trillion");
  assert.equal(words(pow(30), long), "one quintillion");
  assert.equal(LONG_SCALE[10], "quintillion");
  assert.equal(words(pow(9)), "one billion");
  assert.equal(words(pow(12)), "one trillion");
  assert.equal(words(pow(18)), "one quintillion");
  assert.equal(words(pow(30)), "one nonillion");
  assert.equal(words(pow(33)), "one decillion");
});

test("36-digit limit reaches 999 decillion", () => {
  assert.equal(MAX_INT_DIGITS, 36);
  assert.ok(words("9".repeat(36)).startsWith("nine hundred ninety-nine decillion"));
  assert.ok(isError("1" + "0".repeat(36)));
});

test("ordinals", () => {
  const ord = (raw: string) => {
    const r = convert(raw, { ...base, mode: "ordinal" });
    assert.ok(r.kind === "ok");
    return `${r.text} (${r.formatted})`;
  };
  assert.equal(ord("1"), "first (1st)");
  assert.equal(ord("2"), "second (2nd)");
  assert.equal(ord("3"), "third (3rd)");
  assert.equal(ord("5"), "fifth (5th)");
  assert.equal(ord("8"), "eighth (8th)");
  assert.equal(ord("9"), "ninth (9th)");
  assert.equal(ord("12"), "twelfth (12th)");
  assert.equal(ord("20"), "twentieth (20th)");
  assert.equal(ord("21"), "twenty-first (21st)");
  assert.equal(ord("100"), "one hundredth (100th)");
  assert.deepEqual(["11", "12", "13", "21", "22", "23", "111", "112"].map(ordinalSuffix), ["th", "th", "th", "st", "nd", "rd", "th", "th"]);
  assert.equal(cardinalToOrdinalWords("forty"), "fortieth");
  // Always international, even with Indian selected.
  assert.equal(convert("100000", { ...base, mode: "ordinal", system: "indian" }).kind, "ok");
  assert.equal(words("100000", { mode: "ordinal", system: "indian" }), "one hundred thousandth");
  assert.ok(isError("-1", { mode: "ordinal" }));
  assert.ok(isError("1.5", { mode: "ordinal" }));
});

test("input rules: symbols, brackets, separators, decimal mark", () => {
  assert.equal(words("$5"), "five");
  assert.equal(words("5 €"), "five");
  assert.equal(words("₹12,34,567", { system: "indian" }), "twelve lakh thirty-four thousand five hundred sixty-seven");
  assert.equal(words("(1,234.56)"), "minus one thousand two hundred thirty-four point five six");
  assert.equal(words("-3", { negativeWord: "negative" }), "negative three");
  assert.equal(words("1 234 567"), "one million two hundred thirty-four thousand five hundred sixty-seven");
  assert.ok(isError("1,2,3"));
  assert.ok(isError("1,23,4567"));
  assert.ok(isError("1.234,56"));
  assert.equal(words("1.234,56", { decimalMark: "," }), "one thousand two hundred thirty-four point five six");
  const note = parseNumber("1,25");
  assert.ok(note.kind === "ok" && note.notes.length === 1 && note.value.int === "125");
  assert.ok(isError("1/2"));
  assert.equal(words("1984"), "one thousand nine hundred eighty-four");
});

test("text case options", () => {
  assert.equal(words("21", { caseStyle: "sentence" }), "Twenty-one");
  assert.equal(words("1021", { caseStyle: "title", british: true }), "One Thousand and Twenty-One");
  assert.equal(words("21", { caseStyle: "upper" }), "TWENTY-ONE");
});

test("list mode keeps blank lines and flags bad lines without stopping", () => {
  const r = convertList("1\n\nabc\n21", base, true);
  assert.equal(r.text, "1 = one\n\nabc = (could not convert)\n21 = twenty-one");
  assert.equal(r.converted, 2);
  assert.equal(r.failed, 1);
  assert.equal(r.errors[0].line, 3);
});
