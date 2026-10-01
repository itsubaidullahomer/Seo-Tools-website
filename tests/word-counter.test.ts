import { test } from "node:test";
import assert from "node:assert/strict";
import { analyse, splitWords } from "../src/tools/word-counter/logic";

test("unique words ignore the stop-word switch", () => {
  const on = analyse("the and the", true);
  assert.equal(on.words, 3);
  assert.equal(on.uniqueWords, 2);
  assert.equal(analyse("the and the", false).uniqueWords, 2);
});

test("unique words are case- and punctuation-insensitive", () => {
  assert.equal(analyse("The cat and the dog", true).uniqueWords, 4);
  assert.equal(analyse("Hello, hello! HELLO.", true).uniqueWords, 1);
});

test("stand-alone symbols are not words; hyphenated terms and numbers are", () => {
  assert.deepEqual(splitWords("well-known — 3.5 & done"), ["well-known", "3.5", "done"]);
  const s = analyse(" — ", true);
  assert.equal(s.words, 0);
  assert.equal(s.sentences, 0);
  assert.equal(s.paragraphs, 0);
});

test("worked example from the article", () => {
  const s = analyse("The quick brown fox jumps over the lazy dog. It was a well-known trick.", true);
  assert.equal(s.words, 14);
  assert.equal(s.sentences, 2);
  assert.equal(s.characters, 71);
  assert.equal(s.charactersNoSpaces, 58);
  assert.equal(s.readingSeconds, 4);
  assert.ok(!s.keywords.some((k) => k.word === "the"));
  assert.equal(s.keywords[0].density.toFixed(1), "7.1");
});

test("empty input", () => {
  const s = analyse("", true);
  assert.equal(s.words + s.uniqueWords + s.sentences + s.paragraphs, 0);
});
