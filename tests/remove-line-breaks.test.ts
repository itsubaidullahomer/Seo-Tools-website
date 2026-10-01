import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_OPTIONS,
  countChars,
  countLineBreaks,
  decodeSeparator,
  decodeTextFile,
  detectLineEndings,
  isListLine,
  removeLineBreaks,
  summarize,
  type Options,
} from "../src/tools/remove-line-breaks/logic";

const opts = (p: Partial<Options> = {}): Options => ({ ...DEFAULT_OPTIONS, ...p });
const EXAMPLE = "The meeting moved to\nThursday at 3 pm.\n\nPlease bring the\nsigned contracts.";

test("article worked example: input has 5 lines, 4 breaks, 74 characters", () => {
  const s = summarize(EXAMPLE, EXAMPLE);
  assert.equal(s.linesBefore, 5);
  assert.equal(s.breaksBefore, 4);
  assert.equal(s.charsBefore, 74);
  assert.equal(s.paragraphs, 2);
});

test("article worked example: Remove all line breaks – 4 removed, 73 characters", () => {
  const out = removeLineBreaks(EXAMPLE, opts());
  assert.equal(out, "The meeting moved to Thursday at 3 pm. Please bring the signed contracts.");
  const s = summarize(EXAMPLE, out);
  assert.equal(s.removed, 4);
  assert.equal(s.charsAfter, 73);
});

test("article worked example: Keep paragraphs – 2 removed, 2 kept, 74 characters", () => {
  const out = removeLineBreaks(EXAMPLE, opts({ mode: "paragraphs" }));
  assert.equal(out, "The meeting moved to Thursday at 3 pm.\n\nPlease bring the signed contracts.");
  const s = summarize(EXAMPLE, out);
  assert.equal(s.removed, 2);
  assert.equal(s.breaksAfter, 2);
  assert.equal(s.charsAfter, 74);
});

test("article worked example: Replace with ', ' – 76 characters", () => {
  const out = removeLineBreaks(EXAMPLE, opts({ mode: "custom", separator: ", " }));
  assert.equal(out, "The meeting moved to, Thursday at 3 pm., Please bring the, signed contracts.");
  assert.equal(countChars(out), 76);
});

test("every kind of line break is recognised", () => {
  assert.equal(removeLineBreaks("a\r\nb\rc\u000Bd\u000Ce f g\u0085h", opts()), "a b c d e f g h");
  assert.equal(countLineBreaks("a\r\nb\rc\nd"), 3); // CRLF counts as one break
  assert.equal(detectLineEndings("a\r\nb"), "CRLF");
  assert.equal(detectLineEndings("a\nb"), "LF");
  assert.equal(detectLineEndings("a\rb"), "CR");
  assert.equal(detectLineEndings("a\u000Bb"), "other");
  assert.equal(detectLineEndings("a\nb\r\nc"), "mixed");
  assert.equal(detectLineEndings("abc"), "none");
});

test("characters: emoji count once, CRLF counts twice", () => {
  assert.equal(countChars("😀é"), 2);
  assert.equal(countChars("a\r\nb"), 4);
});

test("paragraph mode: whitespace-only and repeated blank lines become exactly one break", () => {
  assert.equal(removeLineBreaks("a\n  \n\n\n b\nc", opts({ mode: "paragraphs" })), "a\n\nb c");
  assert.equal(removeLineBreaks("p1 l1\np1 l2\n\np2", opts({ mode: "paragraphs", lineEnding: "crlf" })), "p1 l1 p1 l2\r\n\r\np2");
});

test("a trailing newline or leading blank lines never produce a separator", () => {
  assert.equal(removeLineBreaks("\n\na\nb\n", opts({ mode: "custom", separator: ", " })), "a, b");
});

test("one line, no spaces glues wrapped URLs together", () => {
  assert.equal(removeLineBreaks("https://exa\nmple.com/a\nb", opts({ mode: "none" })), "https://example.com/ab");
});

test("custom separators: \\t is a tab; keeping empty lines produces ', ,'", () => {
  assert.equal(decodeSeparator("\\t"), "\t");
  assert.equal(removeLineBreaks("a\nb", opts({ mode: "custom", separator: "\\t" })), "a\tb");
  assert.equal(removeLineBreaks("a\n\nb", opts({ mode: "custom", separator: ", ", removeEmptyLines: false })), "a, , b");
  assert.equal(removeLineBreaks("a\nb", opts({ mode: "custom", separator: "<br>" })), "a<br>b");
});

test("rejoin hyphenated words only before a lowercase letter", () => {
  assert.equal(removeLineBreaks("exam-\nple text", opts({ fixHyphens: true })), "example text");
  assert.equal(removeLineBreaks("self-\ncontrol", opts({ fixHyphens: true })), "selfcontrol"); // the documented caveat
  assert.equal(removeLineBreaks("self-\nControl", opts({ fixHyphens: true })), "self- Control");
  assert.equal(removeLineBreaks("exam-\nple", opts()), "exam- ple");
});

test("keep list items on their own line, joining wrapped continuation lines", () => {
  for (const line of ["- one", "* two", "• three", "1. four", "2) five", "a) six", "(b) seven"]) assert.ok(isListLine(line), line);
  assert.ok(!isListLine("plain"));
  assert.equal(removeLineBreaks("Intro:\n- one\nwrapped\n* two\n1. three", opts({ keepLists: true })), "Intro:\n- one wrapped\n* two\n1. three");
});

test("collapse multiple spaces and trim each line", () => {
  assert.equal(removeLineBreaks("  a   b  \n  c ", opts()), "a b c");
  assert.equal(removeLineBreaks("a   b", opts({ collapseSpaces: false })), "a   b");
});

test("UTF-16 files from Notepad are decoded", () => {
  const le = new Uint8Array([0xff, 0xfe, 0x61, 0x00, 0x0a, 0x00, 0x62, 0x00]);
  assert.equal(decodeTextFile(le), "a\nb");
  assert.equal(decodeTextFile(new TextEncoder().encode("é")), "é");
});

test("empty input", () => {
  assert.equal(removeLineBreaks("", opts()), "");
  assert.equal(removeLineBreaks("\n\n", opts()), "");
});
