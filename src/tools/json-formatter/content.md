## What this JSON formatter does

Paste JSON into the box above and the JSON formatter validates it as you type. Valid JSON is pretty-printed with 2 spaces, 4 spaces or tabs, or collapsed to one line, or minified. If the JSON is invalid, you get the exact line and column, a plain-English explanation of what is wrong, and the surrounding lines with the problem marked. You don't get a bare "Unexpected token" message.

It is built for the moments when JSON breaks: an API response that won't parse, a hand-edited config file, a payload copied out of a log. The validator recognizes the mistakes people actually make, such as trailing commas, single quotes, unquoted keys, comments and Python's `True`/`None`. A "Fix common issues" button repairs them and lists every change it made.

Formatting is lossless. Many online beautifiers run `JSON.parse` and then `JSON.stringify`, which silently rounds `12345678901234567890` to `12345678901234567000` and rewrites `1.50` as `1.5`. This tool keeps every number and string exactly as written and changes only the whitespace between them.

## How to use the JSON formatter and validator

1. **Add your JSON.** Paste it, type it, click **Open file** to load a `.json` file, or drag a file onto the input box. **Sample** loads a valid example, and **Broken sample** loads one full of typical mistakes.
2. **Read the status.** A green "Valid JSON" panel describes the root value and how deeply it is nested. A red panel gives the line, column, message and a fix hint. **Go to error** selects the offending character in the input.
3. **Repair common mistakes** (optional). If the red panel lists fixable problems, click **Fix common issues**. The changes are listed by type and line number, and **Undo fix** puts your original text back.
4. **Choose the output.** **Format** pretty-prints, with the indent set in the **Indent** menu. **One line** gives compact but readable output such as `{"a": 1, "b": [1, 2]}`. **Minify** removes all optional whitespace. **Sort keys A–Z** reorders keys at every level.
5. **Escape or unescape.** **Escape** turns any text into a JSON string literal; **Unescape** reverses it and offers **Format it** when the result is JSON.
6. **Copy or download** the result, or click **Use as input** to chain steps.

Below the output you see size before and after, nesting depth and counts of keys, objects, arrays, strings and numbers, plus warnings for duplicate keys and numbers too large for JavaScript.

## How the validator finds the exact error

Browsers word JSON errors differently and do not always give a location, so this tool uses its own strict parser that follows the grammar in RFC 8259, the JSON standard. It reads one character at a time, tracks what it expects next (a value, a key, a colon, a comma or a closing bracket) and stops at the first character that breaks the rules. Because it knows the context, it can tell you *why* that character is wrong.

**Worked example.** Take this input:

```json
{
  "id": 7,
  "tags": ["a", "b",],
  "owner": 'kim'
}
```

The validator stops at line 3, column 20 – the comma itself – with "Trailing comma after the last array element." Chrome's `JSON.parse` reports `Unexpected token ']'`, which points at the bracket rather than the comma that needs deleting. Click **Fix common issues** and you get two changes, "Removed trailing commas – line 3" and "Converted single-quoted strings to double quotes – line 4", and the document validates.

## JSON syntax rules and the error each one produces

| Rule | Invalid example | Message in this tool | Chrome `JSON.parse` |
| --- | --- | --- | --- |
| Keys must be double-quoted strings | `{name: 1}` | Property name 'name' is not in double quotes | Expected property name or '}' |
| Strings use double quotes only | `{"a": 'x'}` | Expected a value: single quote found | Unexpected token ''' |
| No comma after the last item | `[1, 2,]` | Trailing comma after the last array element | Unexpected token ']' |
| Items are separated by commas | `{"a": 1 "b": 2}` | Missing comma after this property value | Expected ',' or '}' after property value |
| No comments | `{"a": 1 // note}` | …after a property value: comment found | Expected ',' or '}' after property value |
| Literals are lowercase `true`, `false`, `null` | `{"ok": True}` | 'True' is not a JSON value | Unexpected token 'T' |
| No `NaN`, `Infinity` or `undefined` | `{"x": NaN}` | 'NaN' is not a JSON value | Unexpected token 'N' |
| No leading zeros or `+` signs | `{"zip": 02134}` | Leading zeros are not allowed | Unexpected number |
| Control characters must be escaped | a literal line break inside `"…"` | Unescaped control character inside a string | Bad control character in string literal |
| Exactly one top-level value | `{"a":1}{"b":2}` | Unexpected content after the end of the JSON | Unexpected non-whitespace character after JSON |

Whitespace between tokens may only be spaces, tabs, line feeds and carriage returns. A non-breaking space pasted from a web page or chat app looks normal but is invalid, and the tool names it explicitly.

## The six most common invalid-JSON mistakes

1. **Trailing commas.** They are legal in JavaScript, Python and most modern languages, so they creep into hand-written JSON. Delete the comma before `}` or `]`.
2. **Single quotes.** Python's `str(dict)` and copied JavaScript produce `'text'`. JSON requires `"text"`, and apostrophes inside the value then need no escaping.
3. **Unquoted keys.** `{id: 1}` is a JavaScript object literal, not JSON. Every key needs double quotes: `{"id": 1}`.
4. **Comments.** Config files often carry `//` notes. Strip them, or store notes in a regular field such as `"_comment"`.
5. **Missing commas after an edit.** Adding a line to the end of an object without putting a comma on the line above is the classic error. The validator points at the end of the value that needs the comma.
6. **Python or JavaScript values.** `True`, `False`, `None`, `NaN` and `undefined` are not JSON. Use `true`, `false` and `null`, and write non-finite numbers as `null` or as strings.

The first five are always repaired safely by **Fix common issues**. For the sixth, `True`/`False`/`None` are converted directly, and `NaN`/`Infinity`/`undefined` become `null`, the same thing `JSON.stringify` does.

## JSON vs JavaScript object literals

| Feature | JSON | JavaScript object literal |
| --- | --- | --- |
| Key quoting | Always double quotes | Optional for identifier names |
| String quotes | Double only | Single, double or backticks |
| Trailing commas | Not allowed | Allowed |
| Comments | Not allowed | Allowed |
| Values | string, number, object, array, `true`, `false`, `null` | Anything, including functions, `undefined`, `Date`, `NaN` |
| Number forms | Decimal only, no leading `+` or `0` | Hex, octal, binary, `.5`, `5.`, `1_000` |

Every JSON document is a valid JavaScript expression, but most object literals are not valid JSON. Never `eval()` JSON to parse it. `JSON.parse` is faster and cannot execute code.

## Pretty-print or minify? What it does to file size

Indentation is pure overhead for machines but essential for humans. We measured a real `package-lock.json` describing 650 packages, a file that is mostly short strings:

| Style | Size | vs minified | Gzipped |
| --- | --- | --- | --- |
| Minified | 263,384 bytes | – | 72,104 bytes |
| Tab indent | 310,802 bytes | +18.0% | 73,464 bytes |
| 2 spaces | 341,225 bytes | +29.6% | 73,982 bytes |
| 4 spaces | 402,071 bytes | +52.7% | 75,588 bytes |

Uncompressed, four-space indentation makes the file half again as large; after gzip the gap shrinks to 4.8%, because compression handles repeated whitespace well. So minify what you send over the network or store in bulk, and keep pretty-printed JSON in Git so diffs show the lines that really changed. Sorting keys makes two exports from different systems easy to compare.

## Validating JSON in VS Code and on the command line

**VS Code** validates `.json` files as you type and underlines errors with red squiggles. **Format Document** (Shift+Alt+F on Windows, Shift+Option+F on macOS, Ctrl+Shift+I on Linux) pretty-prints the file. Files such as `settings.json` open in "JSON with Comments" mode, which accepts comments and warns about trailing commas. That is why a file can look fine in the editor and still fail in a strict parser.

**jq** validates and formats in one step: `jq . data.json` pretty-prints, `jq -S .` sorts keys, `jq -c .` compacts, and `jq empty data.json` checks validity without output. On a trailing comma, jq 1.7 prints `parse error: Expected another array element at line 3, column 21` and exits with status 5, which makes it easy to use in scripts and CI.

**Python** ships a validator: `python -m json.tool data.json` prints formatted JSON (4 spaces by default) or an error such as `Expecting property name enclosed in double quotes: line 1 column 8 (char 7)`. Add `--sort-keys`, `--indent 2`, `--tab` or `--compact` as needed.

Use the command line for automation and huge files, and this page to see a problem, repair it and check the result without installing anything. For related clean-up, try the [line break remover](/tools/remove-line-breaks) and the [character counter](/tools/character-counter).

## Privacy and limitations

Everything runs in your browser: your JSON is never uploaded, logged or stored on a server. The draft is kept only in this tab's session storage (drafts over about 1 MB are not saved at all). Files up to 25 MB can be opened, and a document of a few megabytes formats in a second or two.

Limits worth knowing: only the first syntax error is reported. Very deeply nested documents (thousands of levels) are rejected rather than freezing the page. Sorting compares keys by Unicode code point, like `jq -S` and Python's `sort_keys`, so uppercase letters sort before lowercase. The fixer deliberately leaves ambiguous input alone, for example unquoted text values containing spaces or numbers with leading zeros, since guessing could change your data.
