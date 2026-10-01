import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_OPTIONS,
  MAX_LINE_NUMBERS,
  copiesRemoved,
  dedupeLines,
  lineNumberText,
  makeKey,
  normalizeOptions,
  reportToCsv,
  reportToTsv,
  splitLines,
  type Options,
} from "../src/tools/remove-duplicate-lines/logic";

const opts = (p: Partial<Options> = {}): Options => ({ ...DEFAULT_OPTIONS, ...p });
const LIST = ["apple", "Banana", "apple ", "cherry", "", "banana", "Apple", "cherry", "cherry", "date"].join("\n");

test("article worked example: defaults", () => {
  const r = dedupeLines(LIST, opts());
  assert.deepEqual(r.lines, ["apple", "Banana", "cherry", "banana", "Apple", "date"]);
  assert.equal(r.linesIn, 10);
  assert.equal(r.linesOut, 6);
  assert.equal(r.removed, 4);
  assert.equal(r.filtered, 3);
  assert.equal(r.emptyRemoved, 1);
});

test("article worked example: Case-sensitive off, and its report", () => {
  const r = dedupeLines(LIST, opts({ caseSensitive: false }));
  assert.deepEqual(r.lines, ["apple", "Banana", "cherry", "date"]);
  assert.equal(r.linesOut, 4);
  assert.equal(r.removed, 6);
  assert.equal(r.filtered, 5);
  assert.equal(r.emptyRemoved, 1);
  assert.deepEqual(
    r.report.map((x) => [x.text, x.count, copiesRemoved(x, "dedupe"), lineNumberText(x)]),
    [
      ["apple", 3, 2, "1, 3, 7"],
      ["cherry", 3, 2, "4, 8, 9"],
      ["Banana", 2, 1, "2, 6"],
    ],
  );
});

test("article worked example: other rows of the settings table", () => {
  assert.deepEqual(dedupeLines(LIST, opts({ caseSensitive: false, keep: "last" })).lines, ["banana", "Apple", "cherry", "date"]);
  assert.deepEqual(dedupeLines(LIST, opts({ caseSensitive: false, mode: "duplicates" })).lines, ["apple", "Banana", "cherry"]);
  assert.deepEqual(dedupeLines(LIST, opts({ caseSensitive: false, mode: "unique" })).lines, ["date"]);
  const adj = dedupeLines(LIST, opts({ adjacentOnly: true }));
  assert.deepEqual(adj.lines, ["apple", "Banana", "apple", "cherry", "banana", "Apple", "cherry", "date"]);
  assert.equal(adj.linesOut, 8);
});

test("article: keep last turns 'a b a c' into 'b a c'", () => {
  assert.deepEqual(dedupeLines("a\nb\na\nc", opts({ keep: "last" })).lines, ["b", "a", "c"]);
  assert.deepEqual(dedupeLines("a\nb\na\nc", opts()).lines, ["a", "b", "c"]);
});

test("comparison key: invisible characters, trimming, inner spaces, Unicode forms, accents, case", () => {
  const base = { caseSensitive: true, trim: true, collapseSpaces: false, ignoreAccents: false, ignoreInvisible: true };
  assert.equal(makeKey("pe​n­﻿", base), "pen");
  assert.equal(makeKey(" \tpen ", base), "pen");
  assert.notEqual(makeKey("New  York", base), makeKey("New York", base));
  assert.equal(makeKey("New  York", { ...base, collapseSpaces: true }), "New York");
  assert.equal(makeKey("café", base), makeKey("café", base)); // always normalized
  assert.notEqual(makeKey("café", base), makeKey("cafe", base));
  assert.equal(makeKey("café", { ...base, ignoreAccents: true }), "cafe");
  assert.equal(makeKey("Apple", { ...base, caseSensitive: false }), "apple");
  // Zero-width joiner is not stripped: it changes how emoji and some scripts render.
  assert.equal(makeKey("a‍b", base), "a‍b");
});

test("trim in the result can be turned off", () => {
  assert.deepEqual(dedupeLines(" x\nx", opts({ trimOutput: false })).lines, [" x"]);
  assert.deepEqual(dedupeLines(" x\nx", opts()).lines, ["x"]);
});

test("numbers written differently are different lines", () => {
  assert.equal(dedupeLines("1.0\n1\n01", opts()).linesOut, 3);
});

test("line endings: Windows, Unix and Unicode separators all split lines; output keeps CRLF", () => {
  assert.deepEqual(splitLines("a\r\nb\rc\u000Bd\u000Ce f g\u0085h\n"), ["a", "b", "c", "d", "e", "f", "g", "h"]);
  assert.equal(dedupeLines("a\r\nb\r\na\r\n", opts()).output, "a\r\nb");
  assert.equal(dedupeLines("a\r\nb", opts({ lineEnding: "lf" })).output, "a\nb");
});

test("empty lines: remove, dedupe or leave in place", () => {
  assert.deepEqual(dedupeLines("a\n\nb\n\nc", opts({ blank: "keep" })).lines, ["a", "", "b", "", "c"]);
  assert.deepEqual(dedupeLines("a\n\nb\n\nc", opts({ blank: "dedupe" })).lines, ["a", "", "b", "c"]);
  assert.deepEqual(dedupeLines("a\n\nb\n\nc", opts()).lines, ["a", "b", "c"]);
});

test("report: line numbers capped at 25 with an ellipsis; TSV and CSV exports", () => {
  const r = dedupeLines(Array(30).fill("x").join("\n"), opts());
  assert.equal(r.report[0].count, 30);
  assert.equal(r.report[0].lineNumbers.length, MAX_LINE_NUMBERS);
  assert.ok(lineNumberText(r.report[0]).endsWith(", …"));
  const small = dedupeLines('a,"b"\na,"b"', opts()).report;
  assert.equal(reportToCsv(small, "dedupe"), 'Times found,Copies removed,Line,Found on lines\r\n2,1,"a,""b""","1, 2"\r\n');
  assert.equal(reportToTsv(small, "duplicates"), 'Times found\tLine\tFound on lines\n2\ta,"b"\t1, 2');
});

test("stored options are repaired", () => {
  assert.deepEqual(normalizeOptions({ mode: "nope", caseSensitive: "no" }), DEFAULT_OPTIONS);
});
