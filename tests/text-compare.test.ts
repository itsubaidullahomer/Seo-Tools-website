import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPatch } from "diff";
import { compareTexts, makePatch, splitLines, splitChars, splitWords, looksBinary, describeStats, type CompareOptions, type CompareResult, type Segment } from "../src/tools/text-compare/logic";

const opts = (granularity: CompareOptions["granularity"], extra: Partial<CompareOptions> = {}): CompareOptions => ({ granularity, ignoreCase: false, ignoreWhitespace: false, ...extra });
function ok(r: CompareResult) {
  assert.equal(r.status, "ok");
  return r as Extract<CompareResult, { status: "ok" }>;
}
const lines = (r: CompareResult) => {
  const x = ok(r);
  assert.equal(x.granularity, "line");
  return x as Extract<CompareResult, { status: "ok"; granularity: "line" }>;
};
const tokens = (r: CompareResult) => {
  const x = ok(r);
  assert.notEqual(x.granularity, "line");
  return x as Extract<CompareResult, { status: "ok"; granularity: "word" | "char" }>;
};
/** Rebuilds each side from segments – proves nothing is lost or duplicated. */
function rebuild(segs: Segment[]) {
  let l = "";
  let r = "";
  for (const s of segs) {
    if (s.op === "equal") {
      l += s.left;
      r += s.right;
    } else if (s.op === "removed") l += s.text;
    else r += s.text;
  }
  return { l, r };
}

const ORIGINAL = "Meeting notes – 3 March\nAttendees: Ana, Ben, Chloe\nBudget approved: $4,500\nNext review in two weeks.\n";
const CHANGED = "Meeting notes – 3 March\nAttendees: Ana, Ben, Chloe, Dev\nBudget approved: $5,000\nNext review in two weeks.\nAction: Dev to book the venue.\n";

test("splitLines handles CRLF, CR, LF and a final line break", () => {
  assert.deepEqual(splitLines(""), []);
  assert.deepEqual(splitLines("a"), ["a"]);
  assert.deepEqual(splitLines("a\nb\n"), ["a", "b"]);
  assert.deepEqual(splitLines("a\r\nb\rc"), ["a", "b", "c"]);
  assert.deepEqual(splitLines("\n"), [""]);
  assert.deepEqual(splitLines("a\n\nb"), ["a", "", "b"]);
});

test("characters are grapheme clusters; words follow Unicode word rules", () => {
  assert.deepEqual(splitChars("é👍🏽🇵🇰a"), ["é", "👍🏽", "🇵🇰", "a"]);
  assert.deepEqual(splitWords("Hi,  you"), ["Hi", ",", "  ", "you"]);
  assert.equal(splitWords("東京タワー").join(""), "東京タワー");
});

test("worked example – line mode", () => {
  const r = lines(compareTexts(ORIGINAL, CHANGED, opts("line")));
  assert.deepEqual(r.stats, { changes: 2, removed: 2, added: 3, unchanged: 2, similarity: 4 / 9 });
  assert.deepEqual(r.rows.map((x) => x.type), ["equal", "changed", "changed", "equal", "added"]);
  assert.equal(r.rows[1].left?.no, 2);
  assert.equal(r.rows[4].right?.no, 5);
  // Word-level highlights inside the changed line: ", Dev" was added.
  const added = r.rows[1].right?.segments?.filter((s) => s.op === "added").map((s) => (s.op === "added" ? s.text : "")).join("");
  assert.equal(added, ", Dev");
  assert.equal(describeStats(r.stats, "line"), "2 changes: 2 lines removed, 3 lines added. Similarity 44%.");
});

test("worked example – word and character modes", () => {
  const w = tokens(compareTexts(ORIGINAL, CHANGED, opts("word")));
  // Numbers keep their separators, so "4,500" → "5,000" is one word replaced.
  const wordChanges = w.segments.flatMap((s) => (s.op === "equal" ? [] : [`${s.op}:${s.text}`]));
  assert.deepEqual(wordChanges, ["added:, Dev", "removed:4,500", "added:5,000", "added:Action: Dev to book the venue.\n"]);
  assert.deepEqual({ ...w.stats, similarity: Math.round(w.stats.similarity * 100) }, { changes: 3, removed: 1, added: 8, unchanged: 15, similarity: 79 });
  const c = tokens(compareTexts(ORIGINAL, CHANGED, opts("char")));
  assert.deepEqual({ ...c.stats, similarity: Math.round(c.stats.similarity * 100) }, { changes: 5, removed: 2, added: 38, unchanged: 99, similarity: 83 });
});

test("segments always rebuild both texts exactly", () => {
  const pairs: [string, string][] = [
    [ORIGINAL, CHANGED],
    ["", "new text"],
    ["old text", ""],
    ["Ünïcödé 👍🏽 text", "Unicode 👍 text"],
    ["a  b\tc", "A b c"],
    ["same same same", "same same same same"],
  ];
  for (const g of ["word", "char"] as const) {
    for (const ic of [false, true]) {
      for (const iw of [false, true]) {
        for (const [a, b] of pairs) {
          const r = tokens(compareTexts(a, b, opts(g, { ignoreCase: ic, ignoreWhitespace: iw })));
          assert.deepEqual(rebuild(r.segments), { l: a, r: b }, `${g} ${ic} ${iw}: ${a} / ${b}`);
        }
      }
    }
  }
});

test("line rows keep every original line, in order, on both sides", () => {
  const a = "one\ntwo\nthree\nfour\n";
  const b = "zero\none\nTWO\nfour\nfive";
  for (const iw of [false, true]) {
    for (const ic of [false, true]) {
      const r = lines(compareTexts(a, b, opts("line", { ignoreCase: ic, ignoreWhitespace: iw })));
      assert.deepEqual(r.rows.filter((x) => x.left).map((x) => x.left!.text), splitLines(a));
      assert.deepEqual(r.rows.filter((x) => x.right).map((x) => x.right!.text), splitLines(b));
      const leftNos = r.rows.filter((x) => x.left).map((x) => x.left!.no);
      assert.deepEqual(leftNos, leftNos.slice().sort((p, q) => p - q));
    }
  }
});

test("identical and empty inputs", () => {
  for (const g of ["line", "word", "char"] as const) {
    const same = ok(compareTexts("abc\ndef", "abc\ndef", opts(g)));
    assert.equal(same.identical, true);
    assert.equal(same.stats.changes, 0);
    assert.equal(same.stats.similarity, 1);
    const empty = ok(compareTexts("", "", opts(g)));
    assert.equal(empty.stats.changes, 0);
    assert.equal(empty.stats.similarity, 1);
  }
  const fromEmpty = lines(compareTexts("", "a\nb", opts("line")));
  assert.deepEqual(fromEmpty.stats, { changes: 1, removed: 0, added: 2, unchanged: 0, similarity: 0 });
});

test("ignore case keeps originals but stops counting the difference", () => {
  const r = lines(compareTexts("Hello World", "hello world", opts("line", { ignoreCase: true })));
  assert.equal(r.stats.changes, 0);
  assert.equal(r.rows[0].normalized, true);
  assert.equal(r.rows[0].left?.text, "Hello World");
  assert.equal(r.rows[0].right?.text, "hello world");
  assert.equal(r.identical, false);
  assert.equal(lines(compareTexts("Hello World", "hello world", opts("line"))).stats.changes, 1);
});

test("ignore whitespace: spacing, tabs, trailing spaces and blank lines", () => {
  const a = "alpha  beta\ngamma\n\ndelta";
  const b = "alpha beta \n\tgamma\n\n\n\ndelta";
  const exact = lines(compareTexts(a, b, opts("line")));
  assert.ok(exact.stats.changes > 0);
  const loose = lines(compareTexts(a, b, opts("line", { ignoreWhitespace: true })));
  assert.equal(loose.stats.changes, 0);
  assert.equal(loose.rows.filter((x) => x.type === "ignored").length, 2);
  // A blank line next to a real change still counts as part of that change.
  const mixed = lines(compareTexts("a\nb", "a\n\nc", opts("line", { ignoreWhitespace: true })));
  assert.equal(mixed.stats.changes, 1);
  // Word and character modes ignore whitespace-only insertions.
  assert.equal(tokens(compareTexts("a,b", "a, b", opts("word", { ignoreWhitespace: true }))).stats.changes, 0);
  assert.equal(tokens(compareTexts("a,b", "a, b", opts("word"))).stats.changes, 1);
  assert.equal(tokens(compareTexts("a b", "a  b", opts("char", { ignoreWhitespace: true }))).stats.changes, 0);
});

test("repeated text is aligned, not shifted", () => {
  const r = lines(compareTexts("x\nx\nx\n", "x\nx\nx\nx\n", opts("line")));
  assert.deepEqual(r.stats, { changes: 1, removed: 0, added: 1, unchanged: 3, similarity: 6 / 7 });
  const w = tokens(compareTexts("the the the", "the the", opts("word")));
  assert.equal(w.stats.removed, 1);
  assert.equal(w.stats.added, 0);
});

test("Unicode: accents, emoji and flags are compared as whole characters", () => {
  const r = tokens(compareTexts("café 👍🏽 🇵🇰", "cafe 👍🏻 🇵🇰", opts("char")));
  const removed = r.segments.filter((s) => s.op === "removed").map((s) => (s.op === "removed" ? s.text : ""));
  assert.deepEqual(removed, ["é", "👍🏽"]);
  assert.equal(r.stats.removed, 2);
  assert.equal(r.stats.added, 2);
});

test("notes: line endings and final line break", () => {
  const crlf = ok(compareTexts("a\r\nb\r\n", "a\nb\n", opts("line")));
  assert.equal(crlf.stats.changes, 0);
  assert.match(crlf.notes.join(" "), /Line endings differ/);
  const finalNl = ok(compareTexts("a\nb\n", "a\nb", opts("line")));
  assert.equal(finalNl.stats.changes, 0);
  assert.match(finalNl.notes.join(" "), /Only the original text ends with a line break/);
});

test("the patch is a valid unified diff that turns the original into the changed text", () => {
  const cases: [string, string][] = [
    [ORIGINAL, CHANGED],
    ["a\nb\nc", "a\nB\nc"], // no final newline
    ["a\nb\n", "a\nb"],
    ["", "new file\n"],
    ["old\n", ""],
    ["a\r\nb\r\n", "a\nb\n"],
    ["Ünïcödé 👍🏽\n", "Unicode 👍\n"],
    [Array.from({ length: 200 }, (_, k) => `line ${k}`).join("\n"), Array.from({ length: 200 }, (_, k) => (k % 37 === 0 ? `LINE ${k}` : `line ${k}`)).join("\n")],
  ];
  for (const [a, b] of cases) {
    const p = makePatch(a, b, "notes.txt", "notes.txt");
    assert.match(p, /^--- a\/notes\.txt\n\+\+\+ b\/notes\.txt\n/);
    assert.equal(applyPatch(a, p), b, `patch for ${JSON.stringify(a.slice(0, 20))}`);
  }
  assert.equal(makePatch("same", "same"), "");
  // The exact patch shown in the article.
  assert.equal(
    makePatch(ORIGINAL, CHANGED, "notes.txt", "notes.txt"),
    "--- a/notes.txt\n+++ b/notes.txt\n@@ -1,4 +1,5 @@\n Meeting notes – 3 March\n-Attendees: Ana, Ben, Chloe\n-Budget approved: $4,500\n+Attendees: Ana, Ben, Chloe, Dev\n+Budget approved: $5,000\n Next review in two weeks.\n+Action: Dev to book the venue.\n",
  );
});

test("limits return a clear message instead of hanging", () => {
  const big = "x".repeat(300_001);
  const r = compareTexts(big, "y", opts("char"));
  assert.equal(r.status, "too-large");
  const huge = "a".repeat(5_000_001);
  assert.equal(compareTexts(huge, "", opts("line")).status, "too-large");
});

test("binary detection", () => {
  assert.equal(looksBinary("PK\u0003\u0004\u0000\u0000"), true);
  assert.equal(looksBinary("plain text"), false);
});
