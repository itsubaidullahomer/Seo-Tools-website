import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HUGE_TEXT_UNITS,
  PRESETS,
  analyzeText,
  countGraphemes,
  measure,
  smsInfo,
  splitGraphemesFallback,
  trimToLimit,
  utf8Bytes,
  xWeightedLength,
} from "../src/tools/character-counter/count";

test("article: worked example 'Café ☕ is open! 👍🏽🇺🇸'", () => {
  const text = "Café ☕ is open! 👍🏽🇺🇸";
  const s = analyzeText(text);
  assert.equal(s.graphemes, 18);
  assert.equal(s.graphemesNoSpaces, 14);
  assert.equal(s.codeUnits, 24);
  assert.equal(s.codePoints, 20);
  assert.equal(s.bytes, 35);
  assert.equal(s.words, 5);
  assert.equal(s.sentences, 2);
  assert.equal(xWeightedLength(text).weighted, 21);
  // The fallback splitter used by browsers without Intl.Segmenter agrees.
  assert.equal(splitGraphemesFallback(text).length, 18);
});

test("article: X example – 83-character URL counts 23, rocket counts 2", () => {
  const url = "https://www.example.com/blog/2026/09/how-to-write-meta-descriptions-that-get-clicks";
  assert.equal(url.length, 83);
  const post = `Our new guide to writing better meta descriptions is live. Read it here: ${url} 🚀`;
  assert.equal(analyzeText(post).graphemes, 158);
  assert.deepEqual(xWeightedLength(post), { weighted: 99, urls: 1 });
});

test("article: grapheme clusters, code points and UTF-16 units", () => {
  const family = "👨‍👩‍👧‍👦";
  assert.equal(countGraphemes(family).count, 1);
  assert.equal([...family].length, 7);
  assert.equal(countGraphemes("é").count, 1);
  assert.equal(countGraphemes("🇺🇸").count, 1);
  assert.equal("☕".length, 1);
  assert.equal("❤".length, 1);
  assert.equal("😀".length, 2);
});

test("article: UTF-8 byte sizes", () => {
  assert.equal(utf8Bytes("a"), 1);
  assert.equal(utf8Bytes("é"), 2);
  assert.equal(utf8Bytes("я"), 2);
  assert.equal(utf8Bytes("中"), 3);
  assert.equal(utf8Bytes("☕"), 3);
  assert.equal(utf8Bytes("😀"), 4);
});

test("article/FAQ: X weighting rules", () => {
  assert.equal(xWeightedLength("😀").weighted, 2);
  assert.equal(xWeightedLength("👨‍👩‍👧‍👦").weighted, 2); // a family costs the same as a smiley
  assert.equal(xWeightedLength("é").weighted, 1); // NFC first
  assert.equal(xWeightedLength("中文").weighted, 4);
  assert.equal(xWeightedLength("Привет").weighted, 6);
  assert.equal(xWeightedLength("“quote”—").weighted, 8); // curly quotes and dashes weigh 1
  assert.deepEqual(xWeightedLength("see example.com and https://a.co/x"), { weighted: 9 + 23 + 23, urls: 2 });
});

test("article: SMS encodings, capacities and parts", () => {
  assert.deepEqual(smsInfo("a".repeat(160)), { encoding: "GSM-7", units: 160, single: 160, perSegment: 153, segments: 1 });
  assert.equal(smsInfo("a".repeat(161)).segments, 2);
  assert.equal(smsInfo("é ü ñ").encoding, "GSM-7");
  assert.equal(smsInfo("€").units, 2); // extended table character
  const curly = smsInfo("it’s");
  assert.equal(curly.encoding, "UCS-2");
  assert.equal(curly.single, 70);
  assert.equal(smsInfo("x".repeat(70) + "😀").encoding, "UCS-2");
  assert.equal(smsInfo("—" + "x".repeat(70)).segments, 2); // 71 units > 70, split into 67-unit parts
});

test("article: '#contentmarketing' costs 17 characters", () => {
  assert.equal(analyzeText("#contentmarketing").graphemes, 17);
});

test("presets match the article's limits table", () => {
  const limits = Object.fromEntries(PRESETS.map((p) => [p.id, p.limit]));
  assert.deepEqual(
    {
      x: limits["x-post"],
      xBio: limits["x-bio"],
      igCaption: limits["instagram-caption"],
      igBio: limits["instagram-bio"],
      threads: limits["threads-post"],
      bluesky: limits["bluesky-post"],
      facebook: limits["facebook-post"],
      linkedin: limits["linkedin-post"],
      headline: limits["linkedin-headline"],
      about: limits["linkedin-about"],
      tiktok: limits["tiktok-caption"],
      tiktokApi: limits["tiktok-caption-api"],
      ytTitle: limits["youtube-title"],
      ytDesc: limits["youtube-description"],
      pinTitle: limits["pinterest-title"],
      pinDesc: limits["pinterest-description"],
      reddit: limits["reddit-title"],
      discord: limits["discord-message"],
      title: limits["google-title"],
      meta: limits["meta-description"],
      adsH: limits["google-ads-headline"],
      adsD: limits["google-ads-description"],
      sms: limits.sms,
      excel: limits["excel-cell"],
    },
    {
      x: 280, xBio: 160, igCaption: 2200, igBio: 150, threads: 500, bluesky: 300, facebook: 63206, linkedin: 3000, headline: 220,
      about: 2600, tiktok: 4000, tiktokApi: 2200, ytTitle: 100, ytDesc: 5000, pinTitle: 100, pinDesc: 500, reddit: 300, discord: 2000,
      title: 60, meta: 160, adsH: 30, adsD: 90, sms: 160, excel: 32767,
    },
  );
  assert.equal(PRESETS.find((p) => p.id === "x-post")?.rule, "x");
  assert.equal(PRESETS.find((p) => p.id === "bluesky-post")?.rule, "graphemes");
});

test("'without spaces', lines, paragraphs, letters", () => {
  const s = analyzeText("One two.\n\nThree\tfour!\r\nFive");
  assert.equal(s.graphemesNoSpaces, "Onetwo.Threefour!Five".length);
  assert.equal(s.lines, 4);
  assert.equal(s.paragraphs, 2);
  assert.equal(s.letters, 19);
  assert.equal(s.words, 5);
});

test("count-emoji-as-2 measures UTF-16 units", () => {
  const text = "hi 😀";
  const stats = analyzeText(text);
  assert.equal(measure(text, "graphemes", stats), 4);
  assert.equal(measure(text, "units", stats), 5);
});

test("trimmed to fit: longest prefix within the limit, cut at a word boundary", () => {
  assert.equal(trimToLimit("The quick brown fox jumps", "graphemes", 12), "The quick");
  assert.equal(trimToLimit("short", "graphemes", 12), "short");
  const fitted = trimToLimit("😀😀😀 abc", "x", 5);
  assert.ok(xWeightedLength(fitted).weighted <= 5);
  // A single token longer than the budget is cut mid-word rather than emptied.
  assert.equal(trimToLimit("Supercalifragilistic", "graphemes", 5), "Super");
});

test("above one million code units, code points are counted instead of graphemes", () => {
  const huge = "é".repeat(Math.ceil(HUGE_TEXT_UNITS / 2) + 1);
  const r = countGraphemes(huge);
  assert.equal(r.exact, false);
  assert.equal(r.count, huge.length);
});

test("empty text", () => {
  const s = analyzeText("");
  assert.equal(s.graphemes + s.words + s.lines + s.bytes, 0);
});
