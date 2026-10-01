import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  PRESETS,
  READING_PACES,
  SPEAKING_PACES,
  countWords,
  formatClock,
  formatDuration,
  forwardTimes,
  looksUnspaced,
  normalizeSettings,
  parseAmount,
  reverseWords,
  secondsForWords,
  splitBlocks,
  timeline,
  wordsForSeconds,
} from "../src/tools/words-to-time/logic";
import { splitWords } from "../src/tools/word-counter/logic";

test("defaults: 150 wpm speaking, 238 wpm silent reading", () => {
  assert.equal(DEFAULT_SETTINGS.speakWpm, 150);
  assert.equal(DEFAULT_SETTINGS.readWpm, 238);
  assert.deepEqual(
    SPEAKING_PACES.map((p) => p.wpm),
    [130, 150, 155, 160, 180, 183, 200],
  );
  assert.deepEqual(
    READING_PACES.map((p) => p.wpm),
    [200, 238, 260, 300],
  );
});

test("article example 1: 1,800 words, 12 paragraphs, 3-second pauses", () => {
  const t = forwardTimes(1800, 150, 238, 11, 3);
  assert.equal(t.talkSeconds, 720);
  assert.equal(t.pauseSeconds, 33);
  assert.equal(formatDuration(t.speakSeconds), "12 min 33 sec");
  assert.equal(Math.round(t.readSeconds), 454);
  assert.equal(formatDuration(t.readSeconds), "7 min 34 sec");
});

test("article example 2: 10 minutes with 15 four-second pauses gives 1,350 words, not 1,500", () => {
  const r = reverseWords(600, 150, 238, 15, 4);
  assert.equal(r.pauseSeconds, 60);
  assert.equal(r.availableSeconds, 540);
  assert.equal(r.speakWords, 1350);
  assert.equal(reverseWords(600, 150, 238, 0, 0).speakWords, 1500);
  assert.equal(wordsForSeconds(3, 150), 7.5); // "about 7 or 8 words" per 3-second pause
});

test("article table: words for 1 to 30 minutes", () => {
  const rows: [number, number[]][] = [
    [1, [130, 150, 180, 238]],
    [2, [260, 300, 360, 476]],
    [3, [390, 450, 540, 714]],
    [5, [650, 750, 900, 1190]],
    [10, [1300, 1500, 1800, 2380]],
    [15, [1950, 2250, 2700, 3570]],
    [20, [2600, 3000, 3600, 4760]],
    [30, [3900, 4500, 5400, 7140]],
  ];
  for (const [minutes, expected] of rows) {
    assert.deepEqual(
      [130, 150, 180, 238].map((w) => Math.round(wordsForSeconds(minutes * 60, w))),
      expected,
      `${minutes} min`,
    );
  }
});

test("article table: how long common word counts take", () => {
  const rows: [number, string[]][] = [
    [100, ["0:46", "0:40", "0:33", "0:25"]],
    [250, ["1:55", "1:40", "1:23", "1:03"]],
    [500, ["3:51", "3:20", "2:47", "2:06"]],
    [750, ["5:46", "5:00", "4:10", "3:09"]],
    [1000, ["7:42", "6:40", "5:33", "4:12"]],
    [1500, ["11:32", "10:00", "8:20", "6:18"]],
    [2000, ["15:23", "13:20", "11:07", "8:24"]],
    [3000, ["23:05", "20:00", "16:40", "12:36"]],
    [5000, ["38:28", "33:20", "27:47", "21:01"]],
    [10000, ["1:16:55", "1:06:40", "55:33", "42:01"]],
  ];
  for (const [words, expected] of rows) {
    assert.deepEqual(
      [130, 150, 180, 238].map((w) => formatClock(secondsForWords(words, w))),
      expected,
      `${words} words`,
    );
  }
});

test("article table: voice-over, podcast, toast and talk targets", () => {
  const expected: Record<string, [number, number, number]> = {
    vo15: [38, 33, 45],
    vo30: [75, 65, 90],
    vo60: [150, 130, 180],
    podcast: [113, 98, 135],
    toast: [450, 390, 540],
    speech5: [750, 650, 900],
    talk: [2700, 2340, 3240],
  };
  for (const p of PRESETS) {
    const r = reverseWords(p.seconds, 150, 238, 0, 0);
    assert.deepEqual([r.speakWords, r.slowWords, r.fastWords], expected[p.id], p.id);
  }
  const presentation = reverseWords(600, 150, 238, 0, 0);
  assert.deepEqual([presentation.speakWords, presentation.slowWords, presentation.fastWords], [1500, 1300, 1800]);
});

test("article/FAQ: other figures", () => {
  // ACX: 9,300 words per finished hour = 155 wpm; 80,000 words ≈ 8 hr 36 min.
  assert.equal(9300 / 60, 155);
  assert.equal(formatDuration(secondsForWords(80000, 155)), "8 hr 36 min");
  // 1,000 words: 4 min 12 sec silent, 6 min 40 sec spoken (nearly 60% longer), 5 min 28 sec read aloud at 183.
  assert.equal(formatDuration(secondsForWords(1000, 238)), "4 min 12 sec");
  assert.equal(formatDuration(secondsForWords(1000, 150)), "6 min 40 sec");
  assert.equal(formatDuration(secondsForWords(1000, 183)), "5 min 28 sec");
  assert.ok(secondsForWords(1000, 150) / secondsForWords(1000, 238) > 1.55);
  // Ten 3-second pauses cost 75 words in a 5-minute talk; FAQ: "roughly 675 words".
  assert.equal(reverseWords(300, 150, 238, 10, 3).speakWords, 675);
});

test("word counting matches the Word Counter: stand-alone symbols are not words", () => {
  const text = "Ladies & gentlemen — welcome to 2026. It's a well-known fact.";
  assert.equal(countWords(text), splitWords(text).length);
  assert.equal(countWords(text), 9);
  assert.equal(countWords("  "), 0);
  assert.equal(countWords("one\ttwo\nthree"), 3);
});

test("blocks and paragraph timeline", () => {
  const text = "One two three.\n\nFour five.\n  \nSix";
  assert.deepEqual(splitBlocks(text, "paragraph"), ["One two three.", "Four five.", "Six"]);
  assert.deepEqual(splitBlocks("a\nb\n\nc", "line"), ["a", "b", "c"]);
  const rows = timeline(splitBlocks(text, "paragraph"), 60, 2);
  assert.deepEqual(
    rows.map((r) => [r.words, r.startSeconds, r.durationSeconds]),
    [
      [3, 0, 3],
      [2, 5, 2],
      [1, 9, 1],
    ],
  );
});

test("formatting and parsing", () => {
  assert.equal(formatDuration(59.4), "59 sec");
  assert.equal(formatDuration(3600), "1 hr");
  assert.equal(formatDuration(90000), "1 d 1 hr");
  assert.equal(formatClock(252), "4:12");
  assert.deepEqual(parseAmount("1,500", { integer: true, max: 1e9 }), { kind: "ok", value: 1500 });
  assert.equal(parseAmount("12,5", { max: 100 }).kind, "invalid");
  assert.equal(parseAmount("-3", { max: 100 }).kind, "invalid");
  assert.equal(parseAmount("2.5", { integer: true, max: 100 }).kind, "invalid");
});

test("unspaced scripts are detected", () => {
  assert.ok(looksUnspaced("これは日本語の文章です。単語の間にスペースがありません。とても長い文です。"));
  assert.ok(!looksUnspaced("This is an ordinary English sentence with spaces between words."));
});

test("stored settings are repaired", () => {
  const s = normalizeSettings({ speakWpm: 9999, readWpm: "abc", mode: "sideways" });
  assert.equal(s.speakWpm, 300);
  assert.equal(s.readWpm, 238);
  assert.equal(s.mode, "forward");
});
