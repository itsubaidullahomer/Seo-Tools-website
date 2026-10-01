import { test } from "node:test";
import assert from "node:assert/strict";
import { BEHAVIOR, COPY_LIST, MAX_REPEAT, QUICK_COPY, classify, copyFilterOf, formatForCopy, parseRepeat } from "../src/tools/invisible-character/chars";
import {
  clean,
  countByCategory,
  decodeHiddenTags,
  defaultActions,
  exampleText,
  groupByCodePoint,
  hasBidiOverrides,
  linesAffected,
  markerFor,
  parseActions,
  scan,
  uniformActions,
} from "../src/tools/invisible-character/logic";

const c = (...cps: number[]) => String.fromCodePoint(...cps);

test("article: the copy tab offers 28 characters and four quick cards", () => {
  assert.equal(COPY_LIST.length, 28);
  assert.equal(new Set(COPY_LIST).size, 28);
  assert.deepEqual(
    QUICK_COPY.map((q) => q.cp),
    [0x200b, 0x2800, 0x3164, 0x00a0],
  );
  for (const cp of COPY_LIST) assert.notEqual(copyFilterOf(cp), "all");
});

test("article: copy formats and the 1-500 repeat range", () => {
  assert.equal(formatForCopy(0x200b, "code", 1), "U+200B");
  assert.equal(formatForCopy(0x200b, "js", 3), "\\u200B\\u200B\\u200B");
  assert.equal(formatForCopy(0x200b, "html", 1), "&#x200B;");
  assert.equal(formatForCopy(0x200b, "css", 1), "\\200B");
  assert.equal(formatForCopy(0x00a0, "css", 1), "\\00A0");
  assert.equal(formatForCopy(0x200b, "char", 2), "​​");
  assert.equal(formatForCopy(0xe0041, "js", 1), "\\u{E0041}");
  assert.equal(MAX_REPEAT, 500);
  assert.equal(parseRepeat("0"), 1);
  assert.equal(parseRepeat("abc"), 1);
  assert.equal(parseRepeat("9999"), 500);
});

test("article: worked example – 12 hidden characters; Recommended gives 6 removed, 2 replaced, 4 kept", () => {
  const text = exampleText();
  assert.ok(text.startsWith(`Order${c(0xa0)}#4821${c(0x200b)} - total:${c(0x2003)}$19.99${c(0x2800)}\n`));
  const { hits, lines } = scan(text);
  assert.equal(hits.length, 12);
  assert.equal(lines, 4);
  assert.equal(linesAffected(hits), 4);
  const r = clean(text, hits, defaultActions(), true);
  assert.equal(r.removed, 6);
  assert.equal(r.replaced, 2);
  assert.equal(r.kept, 4);
  assert.equal(r.marked, 0);
  assert.equal(r.output.split("\n")[0], "Order #4821 - total: $19.99");
  const kept = hits.filter((h) => h.legit).map((h) => h.cp);
  assert.deepEqual(kept.sort((a, b) => a - b), [0x200c, 0x200d, 0x200d, 0xfe0f]);
});

test("Mark all tags every hidden character; Remove all removes them; keepLegit off touches joiners too", () => {
  const text = exampleText();
  const { hits } = scan(text);
  const marked = clean(text, hits, uniformActions("mark"), false);
  assert.equal(marked.marked, 12);
  assert.ok(marked.output.includes(markerFor(0x200b)));
  assert.equal(markerFor(0x200b), "<U+200B>");
  const removed = clean(text, hits, uniformActions("remove"), false);
  assert.equal(removed.removed, 12);
  assert.equal(scan(removed.output).hits.length, 0);
});

test("ordinary space, tab and line breaks are not hidden characters", () => {
  assert.equal(scan("a b\tc\r\nd\n").hits.length, 0);
  assert.equal(classify(0x20), null);
  assert.equal(classify(0x0a), null);
  assert.equal(classify(0x41), null);
});

test("the 'What was found' table groups by code point with first line and column", () => {
  const { hits } = scan(`ab${c(0x200b)}\nx${c(0x200b)}${c(0xa0)}`);
  const groups = groupByCodePoint(hits);
  assert.equal(groups[0].cp, 0x200b);
  assert.equal(groups[0].count, 2);
  assert.equal(groups[0].firstLine, 1);
  assert.equal(groups[0].firstCol, 3);
  assert.deepEqual(
    countByCategory(hits).map((g) => [g.id, g.count]),
    [
      ["zero-width", 2],
      ["space", 1],
    ],
  );
});

test("article: character table – abbreviations and categories", () => {
  assert.equal(classify(0x200b)?.abbr, "ZWSP");
  assert.equal(classify(0x00a0)?.abbr, "NBSP");
  assert.equal(classify(0xfeff)?.abbr, "BOM");
  assert.equal(classify(0x00ad)?.abbr, "SHY");
  assert.equal(classify(0x2800)?.category, "blank");
  assert.equal(classify(0x3164)?.category, "blank");
  assert.equal(classify(0x3000)?.category, "space");
});

test("article: 'invisible' spans Cf, Zs, So and Lo; BEHAVIOR table matches this runtime", () => {
  const gc = (cp: number) => ["Cf", "Zs", "So", "Lo", "Zl", "Cc"].find((g) => new RegExp(`^\\p{gc=${g}}$`, "u").test(c(cp)));
  for (const row of BEHAVIOR) {
    const ch = c(row.cp);
    assert.equal(gc(row.cp), row.gc, `gc of U+${row.cp.toString(16)}`);
    assert.equal(/^\p{White_Space}$/u.test(ch), row.unicodeSpace, `White_Space of U+${row.cp.toString(16)}`);
    assert.equal(ch.trim() === "", row.jsTrim, `trim() of U+${row.cp.toString(16)}`);
    assert.equal(/\s/.test(ch), row.jsTrim, `\\s of U+${row.cp.toString(16)}`);
  }
});

test("article: what we verified – JavaScript trim() and NFKC", () => {
  for (const cp of [0x00a0, 0x2003, 0x3000, 0xfeff]) assert.equal(c(cp).trim(), "");
  for (const cp of [0x200b, 0x200c, 0x200d, 0x2060, 0x00ad, 0x0085, 0x2800, 0x3164]) assert.equal(c(cp).trim(), c(cp));
  assert.equal(c(0x00a0).normalize("NFKC"), " ");
  assert.equal(c(0x3000).normalize("NFKC"), " ");
  for (const cp of [0x200b, 0xfeff, 0x00ad, 0x2800]) assert.equal(c(cp).normalize("NFKC"), c(cp));
  assert.equal(c(0x3164).normalize("NFKC"), c(0x1160));
});

test("article: JSON.parse rejects a leading BOM; a ZWSP in JS source is a syntax error", () => {
  assert.throws(() => JSON.parse("﻿{}"));
  assert.throws(() => new Function("let x​ = 1"), /Invalid or unexpected token/);
});

test("article: the regex [\\u200B-\\u200D\\u2060\\uFEFF] finds the common zero-width set", () => {
  const re = /[​-‍⁠﻿]/g;
  assert.equal(`a${c(0x200b)}b${c(0x200c)}${c(0x200d)}${c(0x2060)}${c(0xfeff)}`.match(re)?.length, 5);
});

test("security: bidi overrides are flagged and hidden tag text is decoded", () => {
  assert.ok(hasBidiOverrides(scan(`if (a${c(0x202e)}b)`).hits));
  assert.ok(!hasBidiOverrides(scan(`a${c(0x200b)}b`).hits));
  const hidden = [..."hi"].map((ch) => 0xe0000 + ch.charCodeAt(0));
  assert.equal(decodeHiddenTags(scan(`ok${c(...hidden)}`).hits), "hi");
  // A flag emoji (England) uses tags legitimately and is not decoded.
  const england = c(0x1f3f4, 0xe0067, 0xe0062, 0xe0065, 0xe006e, 0xe0067, 0xe007f);
  const { hits } = scan(england);
  assert.ok(hits.every((h) => h.legit === "tags of a flag emoji"));
  assert.equal(decodeHiddenTags(hits), "");
});

test("direction marks are legitimate only on right-to-left lines", () => {
  assert.equal(scan(`abc${c(0x200f)}`).hits[0].legit, null);
  assert.notEqual(scan(`שלום${c(0x200f)}`).hits[0].legit, null);
});

test("stored actions are sanitised", () => {
  assert.deepEqual(parseActions("not json"), defaultActions());
  assert.equal(parseActions(JSON.stringify({ space: "newline" })).space, "space"); // not an allowed action for spaces
  assert.equal(parseActions(JSON.stringify({ space: "remove" })).space, "remove");
});
