import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ESC,
  FENCE_OVERHEAD,
  LIMIT_EXTENDED,
  LIMIT_STANDARD,
  MAX_TEXT_LENGTH,
  ZWSP,
  applyEdit,
  applyPatch,
  buildMessage,
  docFromSegments,
  parseAnsi,
  selectionInfo,
  sgrCodes,
  packStyle,
  toCodeString,
  toVisible,
} from "../src/tools/discord-colored-text-generator/logic";
import { EXAMPLES } from "../src/tools/discord-colored-text-generator/examples";
import { PALETTES, TEXT_SWATCHES } from "../src/tools/discord-colored-text-generator/palette";

test("article example: 'Server status: ONLINE' with bold green ONLINE is 44 characters", () => {
  const doc = docFromSegments([{ text: "Server status: " }, { text: "ONLINE", style: { bold: true, fg: 32 } }]);
  assert.equal(doc.text.length, 21);
  const { message } = buildMessage(doc.text, doc.spans);
  assert.equal(message, "```ansi\nServer status: " + ESC + "[1;32mONLINE" + ESC + "[0m\n```");
  assert.equal(toVisible(message), "```ansi\nServer status: ␛[1;32mONLINE␛[0m\n```");
  assert.equal(message.length, 44);
  assert.equal("```ansi\n".length, 8);
  assert.equal(`${ESC}[1;32m`.length, 7);
  assert.equal(`${ESC}[0m`.length, 4);
  assert.equal("\n```".length, 4);
});

test("cost of a colored section and the fence", () => {
  assert.equal(`${ESC}[31m`.length, 5);
  assert.equal(`${ESC}[31m`.length + `${ESC}[0m`.length, 9);
  assert.equal(FENCE_OVERHEAD, 12);
  const doc = docFromSegments([{ text: "x", style: { fg: 31 } }]);
  assert.equal(buildMessage(doc.text, doc.spans).message.length, 12 + 1 + 9);
});

test("code order is bold, underline, text color, background", () => {
  assert.equal(sgrCodes(packStyle({ bold: true, underline: true, fg: 31, bg: 40 })), "1;4;31;40");
  assert.equal(sgrCodes(packStyle({ bold: true, underline: true, fg: 33 })), "1;4;33");
  assert.equal(sgrCodes(packStyle({ fg: 37, bg: 41 })), "37;41");
  assert.equal(sgrCodes(packStyle({ underline: true, fg: 34 })), "4;34");
});

test("server rules example: 150 characters of text, 211 as a message, five sections", () => {
  const rules = EXAMPLES.find((e) => e.id === "rules");
  assert.ok(rules);
  assert.equal(rules.doc.text.length, 150);
  const { message, rendered } = buildMessage(rules.doc.text, rules.doc.spans);
  assert.equal(rendered.runs, 5);
  assert.equal(message.length, 211);
});

test("sections stop at line breaks and colour-only runs drop edge spaces", () => {
  const doc = docFromSegments([{ text: " a\nb ", style: { fg: 31 } }]);
  const { message } = buildMessage(doc.text, doc.spans);
  assert.equal(toVisible(message), "```ansi\n ␛[31ma␛[0m\n␛[31mb␛[0m \n```");
  // a background keeps the spaces inside the section
  const bg = docFromSegments([{ text: " OFF ", style: { fg: 37, bg: 41 } }]);
  assert.equal(toVisible(buildMessage(bg.text, bg.spans).message), "```ansi\n␛[37;41m OFF ␛[0m\n```");
});

test("triple backticks are broken with a zero-width space", () => {
  const { message, rendered } = buildMessage("a```b", []);
  assert.equal(rendered.fenceBreaks, 1);
  assert.equal(message, "```ansi\na``" + ZWSP + "`b\n```");
});

test("code string uses \\u001b and round-trips through JSON", () => {
  const doc = docFromSegments([{ text: "hi", style: { fg: 31 } }]);
  const { message } = buildMessage(doc.text, doc.spans);
  const code = toCodeString(message);
  assert.ok(code.includes("\\u001b[31m"));
  assert.equal(JSON.parse(code), message);
});

test("pasted escape sequences become editable styles; unknown codes are dropped and counted", () => {
  const parsed = parseAnsi("```ansi\n" + ESC + "[1;32mOK" + ESC + "[0m " + ESC + "[38;5;200mX" + ESC + "[0m\n```");
  assert.equal(parsed.text, "OK X");
  assert.deepEqual(parsed.spans, [{ start: 0, end: 2, fg: 32, bold: true }]);
  assert.equal(parsed.ignored, 1);
  // the readable ␛ form is understood too
  assert.deepEqual(parseAnsi("␛[31mred␛[0m").spans, [{ start: 0, end: 3, fg: 31 }]);
});

test("bold toggles off only when the whole selection already has it", () => {
  let spans = applyPatch([], 10, 0, 5, { bold: true });
  assert.equal(selectionInfo(spans, 10, 0, 10)?.bold, "some");
  spans = applyPatch(spans, 10, 0, 10, { bold: selectionInfo(spans, 10, 0, 10)?.bold !== "all" });
  assert.equal(selectionInfo(spans, 10, 0, 10)?.bold, "all");
  spans = applyPatch(spans, 10, 0, 10, { bold: selectionInfo(spans, 10, 0, 10)?.bold !== "all" });
  assert.equal(selectionInfo(spans, 10, 0, 10)?.bold, "none");
});

test("text typed right after a colored word takes its style", () => {
  const doc = docFromSegments([{ text: "red", style: { fg: 31 } }, { text: " plain" }]);
  const r = applyEdit(doc, "redder plain", 6);
  assert.deepEqual(r.doc.spans, [{ start: 0, end: 6, fg: 31 }]);
});

test("palette table: text 30-37 and classic backgrounds 40-47", () => {
  assert.deepEqual(
    TEXT_SWATCHES.map((s) => `${s.code} ${s.name}`),
    ["30 Gray", "31 Red", "32 Green", "33 Yellow", "34 Blue", "35 Pink", "36 Cyan", "37 White"],
  );
  assert.deepEqual(
    PALETTES.classic.background.map((s) => `${s.code} ${s.name}`),
    [
      "40 Firefly dark blue",
      "41 Orange",
      "42 Marble blue",
      "43 Greyish turquoise",
      "44 Gray",
      "45 Indigo",
      "46 Light gray",
      "47 White (cream)",
    ],
  );
  // the reported newer palette reuses the text hues
  PALETTES.matched.background.forEach((s, i) => assert.equal(s.hex, TEXT_SWATCHES[i].hex));
});

test("limits", () => {
  assert.equal(LIMIT_STANDARD, 2000);
  assert.equal(LIMIT_EXTENDED, 4000);
  assert.equal(MAX_TEXT_LENGTH, 20000);
  assert.equal(buildMessage("", []).message, "");
});
