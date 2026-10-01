import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_OPTIONS,
  STOP_WORD_LIST,
  buildUrl,
  charLength,
  cleanMarkup,
  gradeSlug,
  parseMaxLength,
  slugifyLines,
  slugifyOne,
  toCsv,
  transliterate,
  truncateSlug,
  type SlugOptions,
} from "../src/tools/slug-generator/slug-core";

const opts = (p: Partial<SlugOptions> = {}): SlugOptions => ({ ...DEFAULT_OPTIONS, ...p });
const slug = (s: string, p: Partial<SlugOptions> = {}) => slugifyOne(s, opts(p)).slug;
const TITLE = "10 Tips for Baking Sourdough Bread at Home (A Beginner’s Guide) – 2026 Update!";

test("article worked example table", () => {
  const def = slug(TITLE);
  assert.equal(def, "10-tips-for-baking-sourdough-bread-at-home-a-beginners-guide-2026-update");
  assert.equal(def.length, 72);
  const noStop = slugifyOne(TITLE, opts({ removeStopWords: true }));
  assert.equal(noStop.slug, "10-tips-baking-sourdough-bread-home-beginners-guide-2026-update");
  assert.equal(noStop.slug.length, 63);
  assert.equal(noStop.stopWordsRemoved, 3); // for, at, a
  const capped = slug(TITLE, { removeStopWords: true, maxLength: 50 });
  assert.equal(capped, "10-tips-baking-sourdough-bread-home-beginners");
  assert.equal(capped.length, 45);
  assert.equal(`${capped}-guide`.length, 51);
  const hard = slug(TITLE, { removeStopWords: true, maxLength: 50, wholeWords: false });
  assert.equal(hard.length, 50);
  assert.ok(hard.endsWith("-guid"));
});

test("article tip: capping without removing stop words ends on a dangling 'a'", () => {
  assert.equal(slug(TITLE, { maxLength: 50 }), "10-tips-for-baking-sourdough-bread-at-home-a");
});

test("article: accents and other alphabets table", () => {
  assert.equal(slug("Café Crème"), "cafe-creme");
  assert.equal(slug("Größe"), "grosse");
  assert.equal(slug("Größe", { germanUmlauts: true }), "groesse");
  assert.equal(slug("Łódź"), "lodz");
  assert.equal(slug("Tiếng Việt"), "tieng-viet");
  assert.equal(slug("Привет, мир"), "privet-mir");
  assert.equal(slug("Щука"), "shchuka");
  assert.equal(slug("Ελληνικά"), "ellinika");
  const cjk = slugifyOne("東京 タワー", opts());
  assert.equal(cjk.slug, "");
  assert.ok(cjk.dropped.length > 0);
  assert.equal(slug("東京 タワー", { charset: "unicode" }), "東京-タワー");
  // The Russian hard and soft signs are dropped.
  assert.equal(transliterate("подъезд мать", false).text, "podezd mat");
});

test("article: pipeline steps – markup, numbers, apostrophes, symbols, word breaks", () => {
  assert.equal(slug("<b>Bold</b> &amp; &eacute;t&eacute;"), "bold-and-ete");
  assert.equal(slug("Array<string> explained"), "array-string-explained");
  assert.equal(slug("Vec<T> in Rust"), "vec-t-in-rust");
  assert.equal(cleanMarkup("x < y and z > w"), "x < y and z > w");
  assert.equal(cleanMarkup('<span class="x">Hi</span>'), " Hi ");
  assert.equal(slug("10,000 users"), "10000-users");
  assert.equal(slug("don't stop"), "dont-stop");
  assert.equal(slug("Q&A"), "q-and-a");
  assert.equal(slug("C++"), "c-plus-plus");
  assert.equal(slug("50% off @ home"), "50-percent-off-at-home");
  assert.equal(slug("Q&A", { spellSymbols: false }), "q-a");
  assert.equal(slug("snake_case/path.name-x"), "snake-case-path-name-x");
});

test("article tips: stop-word caveats and version numbers", () => {
  assert.equal(slug("Log In", { removeStopWords: true }), "log");
  assert.equal(slug("Version 2.0"), "version-2-0");
  const all = slugifyOne("The And Of", opts({ removeStopWords: true }));
  assert.equal(all.slug, "the-and-of"); // if every word is a stop word, none are removed
  assert.equal(all.onlyStopWords, true);
});

test("article/FAQ: the stop-word list has 33 English function words and omits not, how, what", () => {
  assert.equal(STOP_WORD_LIST.length, 33);
  for (const w of ["a", "an", "the", "and", "of", "to", "in", "for", "is", "with"]) assert.ok(STOP_WORD_LIST.includes(w), w);
  for (const w of ["not", "how", "what"]) assert.ok(!STOP_WORD_LIST.includes(w), w);
});

test("separator and case options", () => {
  assert.equal(slug("Slug Generator", { separator: "_" }), "slug_generator");
  assert.equal(slug("Slug Generator", { lowercase: false }), "Slug-Generator");
});

test("batch: blank lines stay blank and duplicates get -2, -3 like WordPress", () => {
  const rows = slugifyLines(["Hello World", "", "Hello world", "Hello World"], DEFAULT_OPTIONS, true);
  assert.deepEqual(
    rows.map((r) => r.slug),
    ["hello-world", "", "hello-world-2", "hello-world-3"],
  );
  assert.equal(rows[1].blank, true);
  assert.deepEqual(
    slugifyLines(["a b", "a b"], DEFAULT_OPTIONS, false).map((r) => r.slug),
    ["a-b", "a-b"],
  );
  // The suffix still respects the maximum length.
  const capped = slugifyLines(["alpha beta gamma", "alpha beta gamma"], opts({ maxLength: 12 }), true);
  assert.ok(capped.every((r) => charLength(r.slug) <= 12));
});

test("article: percent-encoding – привет is 36 characters encoded", () => {
  assert.equal(buildUrl("", "привет"), "/%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82");
  assert.equal(encodeURIComponent("привет").length, 36);
  assert.equal(buildUrl("https://yoursite.com/blog/", "my-post"), "https://yoursite.com/blog/my-post");
  assert.equal(buildUrl("https://yoursite.com/blog", "my-post"), "https://yoursite.com/blog/my-post");
});

test("length grade (rule of thumb: about 60 characters / six words)", () => {
  assert.equal(gradeSlug("sourdough-starter-schedule", 3), "concise");
  assert.equal(gradeSlug(slug(TITLE), 13), "long");
  assert.equal(gradeSlug("x".repeat(101), 1), "very-long");
  assert.equal(gradeSlug("", 0), null);
});

test("truncation helper and max-length parsing", () => {
  assert.equal(truncateSlug("aaa-bbb-ccc", 7, "-", true), "aaa-bbb");
  assert.equal(truncateSlug("aaa-bbb-ccc", 6, "-", true), "aaa");
  assert.equal(truncateSlug("aaa-bbb-ccc", 6, "-", false), "aaa-bb");
  assert.deepEqual(parseMaxLength(""), { value: null });
  assert.deepEqual(parseMaxLength("50"), { value: 50 });
  assert.ok(parseMaxLength("0").error);
  assert.ok(parseMaxLength("abc").error);
});

test("CSV export: BOM, input/slug/url columns, formula injection neutralised", () => {
  const csv = toCsv(slugifyLines(["=SUM(A1)", "Café"], DEFAULT_OPTIONS, true), "https://x.com/");
  assert.ok(csv.startsWith("﻿input,slug,url\r\n"));
  assert.ok(csv.includes(`"'=SUM(A1)","sum-a1","https://x.com/sum-a1"`));
  assert.ok(csv.includes(`"Café","cafe","https://x.com/cafe"`));
});
