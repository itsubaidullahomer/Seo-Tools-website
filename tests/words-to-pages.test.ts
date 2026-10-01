import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  countLines,
  createMeasurer,
  formatPages,
  geometry,
  lookupTable,
  normalizeSettings,
  pagesForWords,
  paginate,
  parseCustomWpp,
  parsePages,
  parseWords,
  roundWords,
  spacingColumns,
  splitParagraphs,
  wholePages,
  wordsForPages,
  wordsPerPage,
  type LayoutSettings,
} from "../src/tools/words-to-pages/layout";
import { FONT_METRICS } from "../src/tools/words-to-pages/metrics";
import { REFERENCE_PARAGRAPHS } from "../src/tools/words-to-pages/reference";

const fmt = (p: Partial<LayoutSettings> = {}): LayoutSettings => ({ ...DEFAULT_SETTINGS, ...p });
const wpp = (p: Partial<LayoutSettings> = {}) => Math.round(wordsPerPage(fmt(p)));

test("default format is Times New Roman 12 pt, double, 1 in, US Letter, indented", () => {
  assert.deepEqual(DEFAULT_SETTINGS, { font: "times", sizePt: 12, spacing: "double", marginIn: 1, paper: "letter", paragraphStyle: "essay" });
});

test("article: text area, line height and lines per page", () => {
  const g = geometry(fmt());
  assert.equal(g.contentWidthPt, 468);
  assert.equal(g.contentHeightPt, 648);
  assert.equal(g.lineHeightPt.toFixed(1), "27.6");
  assert.equal(g.linesPerPage, 23);
  const single = geometry(fmt({ spacing: "single" }));
  assert.equal(single.lineHeightPt.toFixed(1), "13.8");
  assert.equal(single.linesPerPage, 46);
  assert.equal(FONT_METRICS.times.lineHeight.toFixed(2), "1.15");
  assert.equal(FONT_METRICS.arial.lineHeight.toFixed(2), "1.15");
  assert.equal(FONT_METRICS.calibri.lineHeight.toFixed(2), "1.22");
  assert.equal(FONT_METRICS.courier.lineHeight.toFixed(2), "1.13");
  const a4 = geometry(fmt({ paper: "a4" }));
  assert.equal(a4.contentWidthPt.toFixed(1), (((210 / 25.4) - 2) * 72).toFixed(1));
});

test("article: reference passage – six paragraphs, ~5 letters per word, ~14.8 words per line", () => {
  assert.equal(REFERENCE_PARAGRAPHS.length, 6);
  const words = REFERENCE_PARAGRAPHS.flatMap((p) => p.split(/\s+/));
  const letters = REFERENCE_PARAGRAPHS.join(" ").replace(/[^A-Za-z]/g, "").length;
  assert.ok(Math.abs(letters / words.length - 5) < 0.1);
  const g = geometry(fmt());
  const m = createMeasurer("times", 12);
  const lines = REFERENCE_PARAGRAPHS.reduce((n, p) => n + countLines(p.split(/\s+/), m, g.contentWidthPt, g.indentPt), 0);
  assert.equal((words.length / lines).toFixed(1), "14.8");
});

test("article: worked example – 1,000 words is 2.94 pages double and 1.47 single", () => {
  assert.equal(wpp(), 340);
  assert.equal(wpp({ spacing: "single" }), 680);
  assert.equal((1000 / wordsPerPage(fmt())).toFixed(2), "2.94");
  assert.equal((1000 / wordsPerPage(fmt({ spacing: "single" }))).toFixed(2), "1.47");
  assert.equal(wholePages(pagesForWords(1000, 340)), 3);
  assert.equal(wholePages(pagesForWords(1000, 680)), 2);
});

test("article: words-to-pages table", () => {
  const rows: [number, string, string, number, number][] = [
    [500, "0.74", "1.5", 2, 1],
    [1000, "1.5", "2.9", 3, 2],
    [2000, "2.9", "5.9", 6, 3],
    [5000, "7.4", "14.7", 15, 8],
  ];
  for (const [words, single, double, whole, singleWhole] of rows) {
    assert.equal(formatPages(pagesForWords(words, 680)), single, `${words} single`);
    assert.equal(formatPages(pagesForWords(words, 340)), double, `${words} double`);
    assert.equal(wholePages(pagesForWords(words, 340)), whole);
    assert.equal(wholePages(pagesForWords(words, 680)), singleWhole);
  }
  const table = lookupTable("words", fmt());
  assert.deepEqual(table.header, ["Words", "Single", "1.15", "1.5", "Double"]);
  assert.deepEqual(table.rows.find((r) => r.label === "1,000")?.cells, ["1.5", "1.7", "2.2", "2.9"]);
});

test("article: words per page by typeface", () => {
  const expected: [LayoutSettings["font"], number, number, number, number][] = [
    ["times", 12, 680, 458, 340],
    ["times", 11, 788, 525, 386],
    ["arial", 12, 615, 414, 307],
    ["arial", 11, 723, 482, 355],
    ["calibri", 12, 624, 411, 312],
    ["calibri", 11, 741, 494, 371],
    ["courier", 12, 467, 308, 228],
  ];
  for (const [font, sizePt, single, oneHalf, double] of expected) {
    const cols = Object.fromEntries(spacingColumns(fmt({ font, sizePt })).map((c) => [c.id, c.wpp]));
    assert.deepEqual([cols.single, cols["1.5"], cols.double], [single, oneHalf, double], `${font} ${sizePt}`);
  }
});

test("article: how much each setting matters", () => {
  assert.equal(wpp({ sizePt: 11 }), 386);
  assert.equal(wpp({ sizePt: 13 }), 286);
  assert.equal(wpp({ marginIn: 0.75 }), 371);
  assert.equal(wpp({ marginIn: 1.25 }), 300);
  assert.equal(wpp({ paper: "a4" }), 348);
  assert.equal(wpp({ paragraphStyle: "block" }), 325);
  assert.equal(wpp({ paragraphStyle: "blank" }), 302);
});

test("article/FAQ: derived claims (Courier, novels, APA, percentages)", () => {
  const times = wpp();
  const courier = wpp({ font: "courier" });
  assert.equal(formatPages(1000 / courier), "4.4");
  assert.ok(Math.abs(courier / times - 2 / 3) < 0.02); // "about a third fewer"
  assert.ok(Math.abs(times / courier - 1.5) < 0.02); // "about 50 percent more pages"
  assert.equal(Math.round(80000 / times), 235);
  assert.ok(Math.abs(80000 / courier - 350) < 2);
  assert.equal(5 * times, 1700);
  assert.equal(5 * wpp({ spacing: "single" }), 3400);
  const apa = [times, wpp({ font: "calibri", sizePt: 11 }), wpp({ font: "arial", sizePt: 11 })].map((w) => 5 * w);
  assert.ok(Math.min(...apa) >= 1700 && Math.max(...apa) <= 1860);
  assert.ok(Math.abs(wpp({ sizePt: 11 }) / times - 1.14) < 0.01); // 11 pt: about +14%
  assert.ok(Math.abs(1 - wpp({ marginIn: 1.25 }) / times - 0.12) < 0.01); // 1.25 in: about -12%
});

test("pagination: fractional pages, whole pages and last-page fill", () => {
  const g = geometry(fmt());
  const p = paginate([23, 10], g);
  assert.equal(p.sheets, 2);
  assert.equal(p.lines, 33);
  assert.ok(Math.abs(p.pages - (1 + 10 / 23)) < 1e-9);
  assert.equal(paginate([], g).pages, 0);
  assert.equal(wholePages(3.01), 4);
  assert.equal(wholePages(4), 4);
  assert.equal(wholePages(0), 0);
});

test("paste mode: every line break starts a paragraph, blank lines ignored", () => {
  assert.deepEqual(splitParagraphs("one two\n\n  three\r\nfour  five\n"), [["one", "two"], ["three"], ["four", "five"]]);
});

test("input parsing: 1000, 1,500, 80k, decimals for pages, custom words per page", () => {
  assert.deepEqual(parseWords("1000"), { kind: "ok", value: 1000 });
  assert.deepEqual(parseWords("1,500"), { kind: "ok", value: 1500 });
  assert.deepEqual(parseWords("80k"), { kind: "ok", value: 80000 });
  assert.equal(parseWords("1.000").kind, "invalid");
  assert.deepEqual(parsePages("2.5"), { kind: "ok", value: 2.5 });
  assert.deepEqual(parseCustomWpp("300"), { kind: "ok", value: 300 });
  assert.equal(parseCustomWpp("").kind, "empty");
  assert.equal(parseCustomWpp("5").kind, "invalid");
  // A custom figure replaces the layout model in every column.
  assert.ok(spacingColumns(fmt(), 250).every((c) => c.wpp === 250));
  assert.equal(formatPages(pagesForWords(1000, 250)), "4.0");
});

test("pages to words is rounded for display", () => {
  assert.equal(roundWords(wordsForPages(5, 340)), 1700);
  assert.equal(roundWords(wordsForPages(2.5, 341)), 855); // 852.5 to the nearest 5
  assert.equal(roundWords(97.4), 97);
});

test("stored settings are repaired", () => {
  assert.deepEqual(normalizeSettings({ font: "comic", sizePt: 99, spacing: "triple" }), DEFAULT_SETTINGS);
  assert.equal(normalizeSettings({ font: "arial" }).font, "arial");
});
