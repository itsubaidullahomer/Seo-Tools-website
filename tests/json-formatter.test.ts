import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCodeFrame,
  countLines,
  escapeJsonString,
  fixCommonIssues,
  parseJson,
  stringifyJson,
  unescapeJsonString,
  utf8Length,
  type JsonNode,
} from "../src/tools/json-formatter/json-core";

const parsed = (text: string): JsonNode => {
  const r = parseJson(text);
  assert.ok(r.ok, `expected valid JSON: ${text}`);
  return r.value;
};
const errorOf = (text: string) => {
  const r = parseJson(text);
  assert.ok(!r.ok, `expected invalid JSON: ${text}`);
  return r.error;
};
const pretty2 = { kind: "pretty", indent: "  " } as const;

const WORKED = `{
  "id": 7,
  "tags": ["a", "b",],
  "owner": 'kim'
}`;

test("worked example: trailing comma reported at line 3, column 20 (the comma)", () => {
  const e = errorOf(WORKED);
  assert.equal(e.line, 3);
  assert.equal(e.column, 20);
  assert.equal(WORKED[e.pos], ",");
  assert.equal(e.message, "Trailing comma after the last array element.");
  // Chrome/V8 points at the bracket instead.
  assert.throws(() => JSON.parse(WORKED), /Unexpected token '\]'/);
});

test("worked example: Fix common issues makes two listed changes and the result validates", () => {
  const fix = fixCommonIssues(WORKED);
  assert.deepEqual(
    fix.changes.map((c) => `${c.label} – line ${c.lines.join(", ")}`),
    ["Removed trailing commas – line 3", "Converted single-quoted strings to double quotes – line 4"],
  );
  assert.ok(parseJson(fix.text).ok);
  assert.deepEqual(JSON.parse(fix.text), { id: 7, tags: ["a", "b"], owner: "kim" });
});

test("syntax-rules table: this tool's messages", () => {
  const rows: [string, string][] = [
    ["{name: 1}", "Property name 'name' is not in double quotes"],
    [`{"a": 'x'}`, "Expected a value: single quote found"],
    ["[1, 2,]", "Trailing comma after the last array element"],
    [`{"a": 1 "b": 2}`, "Missing comma after this property value"],
    [`{"a": 1 // note}`, "after a property value: comment found"],
    [`{"ok": True}`, "'True' is not a JSON value"],
    [`{"x": NaN}`, "'NaN' is not a JSON value"],
    [`{"zip": 02134}`, "leading zeros are not allowed"],
    [`{"a": "x\ny"}`, "Unescaped control character inside a string"],
    [`{"a":1}{"b":2}`, "Unexpected content after the end of the JSON"],
  ];
  for (const [input, msg] of rows) {
    const e = errorOf(input);
    assert.ok(e.message.toLowerCase().includes(msg.toLowerCase()), `${input}: got "${e.message}"`);
  }
});

test("syntax-rules table: Chrome/V8 JSON.parse wording", () => {
  const rows: [string, RegExp][] = [
    ["{name: 1}", /Expected property name or '\}'/],
    [`{"a": 'x'}`, /Unexpected token '''/],
    ["[1, 2,]", /Unexpected token '\]'/],
    [`{"a": 1 "b": 2}`, /Expected ',' or '\}' after property value/],
    [`{"a": 1 // note}`, /Expected ',' or '\}' after property value/],
    [`{"ok": True}`, /Unexpected token 'T'/],
    [`{"x": NaN}`, /Unexpected token 'N'/],
    [`{"zip": 02134}`, /Unexpected number/],
    [`{"a": "x\ny"}`, /Bad control character in string literal/],
    [`{"a":1}{"b":2}`, /Unexpected non-whitespace character after JSON/],
    // FAQ: a trailing comma in an object
    [`{"a":1,}`, /Expected double-quoted property name/],
  ];
  for (const [input, re] of rows) assert.throws(() => JSON.parse(input), re, input);
});

test("non-breaking space between tokens is invalid and named", () => {
  const e = errorOf('{"a": 1}');
  assert.match(e.message, /non-breaking space/);
});

test("duplicate keys are valid but flagged with their position", () => {
  const r = parseJson('{"a": 1,\n "a": 2}');
  assert.ok(r.ok);
  assert.equal(r.stats.duplicateCount, 1);
  assert.equal(r.stats.duplicateKeys[0].key, "a");
  // JSON.parse keeps the last value.
  assert.equal(JSON.parse('{"a": 1, "a": 2}').a, 2);
});

test("lossless formatting keeps numbers and escapes exactly as written", () => {
  const src = '{"big":12345678901234567890,"price":1.50,"name":"caf\\u00e9"}';
  const out = stringifyJson(parsed(src), pretty2, false);
  assert.equal(out, '{\n  "big": 12345678901234567890,\n  "price": 1.50,\n  "name": "caf\\u00e9"\n}');
  // What the article says JSON.parse + JSON.stringify does instead:
  assert.equal(JSON.stringify(JSON.parse("12345678901234567890")), "12345678901234567000");
  assert.equal(JSON.stringify(JSON.parse("1.50")), "1.5");
  const r = parseJson(src);
  assert.ok(r.ok);
  assert.equal(r.stats.unsafeCount, 1);
});

test("output styles: pretty (2, 4, tab), one line, minify", () => {
  const node = parsed('{ "a" : 1 , "b" : [ 1 , 2 ] }');
  assert.equal(stringifyJson(node, { kind: "oneline" }, false), '{"a": 1, "b": [1, 2]}');
  assert.equal(stringifyJson(node, { kind: "minify" }, false), '{"a":1,"b":[1,2]}');
  assert.equal(stringifyJson(node, pretty2, false), JSON.stringify({ a: 1, b: [1, 2] }, null, 2));
  assert.equal(stringifyJson(node, { kind: "pretty", indent: "    " }, false), JSON.stringify({ a: 1, b: [1, 2] }, null, 4));
  assert.equal(stringifyJson(node, { kind: "pretty", indent: "\t" }, false), JSON.stringify({ a: 1, b: [1, 2] }, null, "\t"));
});

test("sort keys A–Z by code point at every level (uppercase before lowercase)", () => {
  const node = parsed('{"b":1,"a":{"z":1,"Z":2,"y":3},"B":0}');
  assert.equal(stringifyJson(node, { kind: "minify" }, true), '{"B":0,"a":{"Z":2,"y":3,"z":1},"b":1}');
});

test("fixer: Python literals, NaN/Infinity/undefined, comments, unquoted keys, missing commas", () => {
  const fix = fixCommonIssues(`{
  // a note
  name: 'Kim', "ok": True, "x": None,
  "n": NaN, "i": Infinity, "u": undefined,
  "list": [1 2],
}`);
  assert.ok(parseJson(fix.text).ok, fix.text);
  assert.deepEqual(JSON.parse(fix.text), { name: "Kim", ok: true, x: null, n: null, i: null, u: null, list: [1, 2] });
  const kinds = fix.changes.map((c) => c.kind).sort();
  assert.deepEqual(kinds, ["comment", "missingComma", "nonJsonValue", "pythonLiteral", "singleQuote", "trailingComma", "unquotedKey"].sort());
});

test("fixer escapes raw line breaks in strings and leaves ambiguous input alone", () => {
  const fix = fixCommonIssues('{"a": "x\ny"}');
  assert.equal(fix.text, '{"a": "x\\ny"}');
  assert.equal(fixCommonIssues('{"zip": 02134}').total, 0);
  assert.equal(fixCommonIssues('{"a": hello world}').total, 0);
  const valid = '{"a": [1, 2]}';
  assert.deepEqual(fixCommonIssues(valid), { text: valid, changes: [], total: 0 });
});

test("escape / unescape round trip", () => {
  const text = 'He said "hi"\nC:\\path';
  const lit = escapeJsonString(text);
  assert.equal(lit, '"He said \\"hi\\"\\nC:\\\\path"');
  const back = unescapeJsonString(lit);
  assert.ok(back.ok);
  assert.equal(back.value, text);
  const bare = unescapeJsonString('{\\"a\\":1}');
  assert.ok(bare.ok);
  assert.equal(bare.value, '{"a":1}');
});

test("deep nesting is rejected instead of crashing", () => {
  const deep = "[".repeat(200_000) + "]".repeat(200_000);
  const r = parseJson(deep);
  assert.ok(!r.ok);
  assert.match(r.error.message, /nested too deeply/);
});

test("stats, sizes and code frame", () => {
  const r = parseJson('{"a":[1,"x",true,null],"b":{"c":2}}');
  assert.ok(r.ok);
  assert.equal(r.stats.objects, 2);
  assert.equal(r.stats.arrays, 1);
  assert.equal(r.stats.keys, 3);
  assert.equal(r.stats.strings, 1);
  assert.equal(r.stats.numbers, 2);
  assert.equal(r.stats.maxDepth, 2);
  assert.equal(utf8Length("é€😀"), 2 + 3 + 4);
  assert.equal(countLines("a\nb\nc"), 3);
  const e = errorOf(WORKED);
  const frame = buildCodeFrame(WORKED, e.line, e.column);
  const errLine = frame.find((l) => l.isError)!;
  assert.equal(errLine.number, 3);
  assert.equal(errLine.caret, " ".repeat(19) + "^");
});

test("size-table percentages are consistent with the byte counts", () => {
  const min = 263_384;
  const pct = (n: number) => (((n - min) / min) * 100).toFixed(1);
  assert.equal(pct(310_802), "18.0");
  assert.equal(pct(341_225), "29.6");
  assert.equal(pct(402_071), "52.7");
  assert.equal((((75_588 - 72_104) / 72_104) * 100).toFixed(1), "4.8");
});
