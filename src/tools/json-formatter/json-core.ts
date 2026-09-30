/**
 * Pure JSON helpers for the JSON Formatter & Validator (no React, no DOM).
 *
 * Instead of JSON.parse + JSON.stringify we use a small strict parser that keeps
 * every number and string exactly as written. That gives us:
 *  - the same human-readable error message, line and column in every browser
 *    (native SyntaxError messages differ between Chrome, Firefox and Safari),
 *  - lossless formatting: 12345678901234567890 stays 12345678901234567890 and
 *    "é" keeps its escape, because values are never round-tripped through
 *    JavaScript numbers,
 *  - duplicate-key detection, which JSON.parse silently hides.
 */

export type JsonNode =
  | { t: "o"; e: JsonEntry[] }
  | { t: "a"; v: JsonNode[] }
  | { t: "s"; raw: string }
  | { t: "n"; raw: string }
  | { t: "l"; raw: "true" | "false" | "null" };

export interface JsonEntry {
  /** The key exactly as written, including quotes. */
  raw: string;
  /** Decoded key, used for sorting and duplicate detection. */
  key: string;
  value: JsonNode;
}

export interface JsonStats {
  objects: number;
  arrays: number;
  keys: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  maxDepth: number;
  duplicateKeys: { key: string; pos: number }[];
  duplicateCount: number;
  unsafeNumbers: { raw: string; pos: number }[];
  unsafeCount: number;
}

export interface JsonErrorInfo {
  message: string;
  hint?: string;
  pos: number;
  line: number;
  column: number;
}

export type ParseResult = { ok: true; value: JsonNode; stats: JsonStats } | { ok: false; error: JsonErrorInfo };

class JsonSyntaxError extends Error {
  constructor(
    message: string,
    public pos: number,
    public hint?: string,
  ) {
    super(message);
  }
}

const MAX_LISTED = 10;
const NUMBER_RE = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const WORD_RE = /[A-Za-z_$][\w$]*/y;

function isWs(c: number): boolean {
  return c === 32 || c === 10 || c === 13 || c === 9;
}

function isDigit(c: number): boolean {
  return c >= 48 && c <= 57;
}

/** Friendly name for characters that are hard to see in an error message. */
export function describeChar(ch: string): string {
  switch (ch) {
    case "\n":
      return "a line break";
    case "\r":
      return "a carriage return";
    case "\t":
      return "a tab";
    case "\u00a0":
      return "a non-breaking space (U+00A0)";
    case "\ufeff":
      return "a byte order mark (U+FEFF)";
    case "\u200b":
      return "a zero-width space (U+200B)";
    case "\u2028":
    case "\u2029":
      return `a Unicode line separator (U+${ch.charCodeAt(0).toString(16).toUpperCase()})`;
  }
  const code = ch.codePointAt(0) ?? 0;
  if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) return `control character U+${code.toString(16).toUpperCase().padStart(4, "0")}`;
  return `'${ch}'`;
}

/** 1-based line and column (in UTF-16 code units) for a character offset. */
export function lineColumn(text: string, pos: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  let idx = text.indexOf("\n");
  while (idx !== -1 && idx < pos) {
    line++;
    lineStart = idx + 1;
    idx = text.indexOf("\n", lineStart);
  }
  return { line, column: pos - lineStart + 1 };
}

class Parser {
  i = 0;
  readonly n: number;
  stats: JsonStats = {
    objects: 0,
    arrays: 0,
    keys: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    maxDepth: 0,
    duplicateKeys: [],
    duplicateCount: 0,
    unsafeNumbers: [],
    unsafeCount: 0,
  };

  constructor(readonly s: string) {
    this.n = s.length;
  }

  where(pos: number): string {
    const { line, column } = lineColumn(this.s, pos);
    return `line ${line}, column ${column}`;
  }

  skipWs(): void {
    const s = this.s;
    let i = this.i;
    while (i < this.n && isWs(s.charCodeAt(i))) i++;
    this.i = i;
  }

  parseDocument(): JsonNode {
    this.skipWs();
    if (this.i >= this.n) throw new JsonSyntaxError("The input is empty or contains only whitespace.", 0);
    const value = this.parseValue(0);
    this.skipWs();
    if (this.i < this.n) {
      const ch = this.s[this.i];
      if (ch === "}" || ch === "]") {
        throw new JsonSyntaxError(`Extra closing '${ch}' after the end of the JSON.`, this.i, "Remove it, or check that every opening bracket above has exactly one matching closing bracket.");
      }
      if (ch === ",") {
        throw new JsonSyntaxError("Unexpected ',' after the end of the JSON.", this.i, "Several values must be wrapped in one array: [ value1, value2 ].");
      }
      this.unexpected("Unexpected content after the end of the JSON", "A JSON document holds exactly one value. For several records, wrap them in an array [ … ] separated by commas.");
    }
    return value;
  }

  /** Throw the most helpful error for a character that cannot start a value. */
  unexpected(context: string, fallbackHint?: string): never {
    const s = this.s;
    const i = this.i;
    const ch = s[i];
    if (ch === "'") throw new JsonSyntaxError(`${context}: single quote found.`, i, "JSON strings and property names must use double quotes (\"), not single quotes (').");
    if (ch === "“" || ch === "”" || ch === "‘" || ch === "’") {
      throw new JsonSyntaxError(`${context}: curly “smart” quote found.`, i, "Replace curly quotes with straight double quotes (\"). Word processors and chat apps often insert them.");
    }
    if (ch === "/" && (s[i + 1] === "/" || s[i + 1] === "*")) {
      throw new JsonSyntaxError(`${context}: comment found.`, i, "JSON does not allow comments (// or /* */). Remove them, or use “Fix common issues”.");
    }
    if (ch === "#") throw new JsonSyntaxError(`${context}: '#' found.`, i, "JSON has no comments of any kind – remove the # line.");
    if (ch === "+") throw new JsonSyntaxError(`${context}: numbers cannot start with '+'.`, i, "Write 5, not +5.");
    if (ch === "." && isDigit(s.charCodeAt(i + 1))) throw new JsonSyntaxError(`${context}: a number needs a digit before the decimal point.`, i, "Write 0.5, not .5.");
    if (ch === "\ufeff" || ch === "\u00a0" || ch === "\u200b" || ch === "\u2028" || ch === "\u2029") {
      throw new JsonSyntaxError(`${context}: invisible character – ${describeChar(ch)}.`, i, "Only spaces, tabs and line breaks are allowed between values. “Fix common issues” removes it.");
    }
    WORD_RE.lastIndex = i;
    const word = WORD_RE.exec(s)?.[0];
    if (word) {
      if (word === "True" || word === "False" || word === "None") {
        const fixed = word === "None" ? "null" : word.toLowerCase();
        throw new JsonSyntaxError(`${context}: '${word}' is not a JSON value.`, i, `JSON literals are lowercase: use ${fixed}. (${word} is Python syntax.)`);
      }
      if (word === "NaN" || word === "Infinity" || word === "undefined") {
        throw new JsonSyntaxError(`${context}: '${word}' is not a JSON value.`, i, "JSON has no NaN, Infinity or undefined. Use null, or store the value as a string.");
      }
      if (/^[tfn]/.test(word) && ["true", "false", "null"].some((lit) => lit.startsWith(word) || word.startsWith(lit))) {
        throw new JsonSyntaxError(`${context}: '${word}' is not a valid literal.`, i, "The only bare words JSON allows are true, false and null (all lowercase).");
      }
      throw new JsonSyntaxError(`${context}: unquoted text '${word.length > 30 ? word.slice(0, 30) + "…" : word}'.`, i, "Text values must be wrapped in double quotes, e.g. \"" + (word.length > 20 ? word.slice(0, 20) : word) + "\".");
    }
    if (i >= this.n) throw new JsonSyntaxError(`${context}: unexpected end of input.`, i, fallbackHint);
    throw new JsonSyntaxError(`${context}: unexpected ${describeChar(ch)}.`, i, fallbackHint);
  }

  parseValue(depth: number): JsonNode {
    this.skipWs();
    const s = this.s;
    const i = this.i;
    if (i >= this.n) throw new JsonSyntaxError("Unexpected end of input: a value was expected.", i, "The document is cut off. Check that it was copied completely.");
    const c = s.charCodeAt(i);
    if (c === 123) return this.parseObject(depth + 1);
    if (c === 91) return this.parseArray(depth + 1);
    if (c === 34) {
      this.stats.strings++;
      return { t: "s", raw: this.parseString() };
    }
    if (c === 45 || isDigit(c)) return this.parseNumber();
    if (s.startsWith("true", i) || s.startsWith("false", i) || s.startsWith("null", i)) {
      const raw = s.startsWith("true", i) ? "true" : s.startsWith("false", i) ? "false" : "null";
      const after = s.charCodeAt(i + raw.length);
      if (!((after >= 65 && after <= 90) || (after >= 97 && after <= 122) || isDigit(after) || after === 95)) {
        this.i = i + raw.length;
        if (raw === "null") this.stats.nulls++;
        else this.stats.booleans++;
        return { t: "l", raw };
      }
    }
    if (c === 125 || c === 93 || c === 44 || c === 58) {
      throw new JsonSyntaxError(`Expected a value but found '${s[i]}'.`, i, c === 44 ? "There is an extra comma, or a value is missing between two commas." : undefined);
    }
    this.unexpected("Expected a value");
  }

  parseNumber(): JsonNode {
    const s = this.s;
    const start = this.i;
    NUMBER_RE.lastIndex = start;
    const m = NUMBER_RE.exec(s);
    if (!m) {
      throw new JsonSyntaxError("Invalid number: '-' must be followed by a digit.", start, s.startsWith("-Infinity", start) ? "JSON has no Infinity. Use null or a string." : undefined);
    }
    const raw = m[0];
    const end = start + raw.length;
    const next = s[end];
    if (next !== undefined) {
      if (/[0-9]/.test(next)) throw new JsonSyntaxError(`Invalid number '${raw}${next}…': leading zeros are not allowed.`, start, "Write 7, not 07. If the leading zero matters (ZIP codes, IDs), store the value as a string.");
      if (next === ".") throw new JsonSyntaxError(`Invalid number '${raw}.': digits are required after the decimal point.`, start, `Write ${raw}.0 or ${raw}.`);
      if (next === "e" || next === "E") throw new JsonSyntaxError(`Invalid number '${raw}${next}': the exponent needs digits.`, start, "Write 1e5 or 1.5E-3.");
      if ((next === "x" || next === "X") && raw.replace("-", "") === "0") throw new JsonSyntaxError("Hexadecimal numbers are not allowed in JSON.", start, "Convert the value to decimal, e.g. 0x1F → 31.");
    }
    this.i = end;
    this.stats.numbers++;
    // Flag numbers that JavaScript (and many other JSON parsers) cannot hold exactly.
    // Unsafe = overflows to Infinity, or is above 2^53 with more significant digits than a double keeps.
    const value = Number(raw);
    let unsafe = !Number.isFinite(value);
    if (!unsafe && Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      const digits = raw.replace(/^-/, "").replace(/[eE].*$/, "").replace(".", "").replace(/^0+/, "").replace(/0+$/, "");
      unsafe = digits.length > 15;
    }
    if (unsafe) {
      this.stats.unsafeCount++;
      if (this.stats.unsafeNumbers.length < MAX_LISTED) this.stats.unsafeNumbers.push({ raw, pos: start });
    }
    return { t: "n", raw };
  }

  /** Scan a double-quoted string starting at this.i and return its raw text. */
  parseString(): string {
    const s = this.s;
    const start = this.i;
    let i = start + 1;
    const n = this.n;
    while (i < n) {
      const c = s.charCodeAt(i);
      if (c === 34) {
        this.i = i + 1;
        return s.slice(start, i + 1);
      }
      if (c === 92) {
        const e = s[i + 1];
        if (e === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(s.slice(i + 2, i + 6))) {
            throw new JsonSyntaxError("Invalid \\u escape: it must be followed by exactly four hex digits.", i, "Example: \\u00e9 for é.");
          }
          i += 6;
          continue;
        }
        if (e === undefined) break;
        if ('"\\/bfnrt'.includes(e)) {
          i += 2;
          continue;
        }
        throw new JsonSyntaxError(
          `Invalid escape sequence '\\${e === "\n" ? "↵" : e}' in string.`,
          i,
          e === "'" ? "A single quote does not need escaping in JSON – write ' on its own." : "Valid escapes are \\\" \\\\ \\/ \\b \\f \\n \\r \\t and \\uXXXX. To keep a literal backslash, write \\\\.",
        );
      }
      if (c < 0x20) {
        const ch = s[i];
        throw new JsonSyntaxError(
          `Unescaped control character inside a string: ${describeChar(ch)}.`,
          i,
          ch === "\n" || ch === "\r" ? "Strings cannot span several lines. Write \\n for a line break, or check for a missing closing quote on the line above." : ch === "\t" ? "Write \\t instead of a literal tab." : "Control characters must be escaped as \\uXXXX.",
        );
      }
      i++;
    }
    throw new JsonSyntaxError("Unterminated string: the closing double quote is missing.", start, "Add the missing \" at the end of the text.");
  }

  track(depth: number): void {
    if (depth > this.stats.maxDepth) this.stats.maxDepth = depth;
  }

  parseObject(depth: number): JsonNode {
    const s = this.s;
    const open = this.i;
    this.i++;
    this.stats.objects++;
    this.track(depth);
    const entries: JsonEntry[] = [];
    let seen: Set<string> | null = null;
    this.skipWs();
    if (s.charCodeAt(this.i) === 125) {
      this.i++;
      return { t: "o", e: entries };
    }
    let commaPos = -1;
    for (;;) {
      this.skipWs();
      const i = this.i;
      const c = s.charCodeAt(i);
      if (c !== 34) {
        if (c === 125 && commaPos >= 0) {
          throw new JsonSyntaxError("Trailing comma after the last property.", commaPos, "Delete this comma – JSON does not allow a comma before }.");
        }
        if (i >= this.n) throw new JsonSyntaxError(`Unexpected end of input: the object opened at ${this.where(open)} is never closed.`, i, "Add the missing }.");
        WORD_RE.lastIndex = i;
        const word = WORD_RE.exec(s)?.[0];
        if (word && s.slice(i + word.length).trimStart().startsWith(":")) {
          throw new JsonSyntaxError(`Property name '${word}' is not in double quotes.`, i, `Write "${word}": instead of ${word}:.`);
        }
        if (c === 93) throw new JsonSyntaxError(`Mismatched bracket: found ']' but the object opened at ${this.where(open)} must be closed with '}'.`, i);
        if (c === 44) throw new JsonSyntaxError("Unexpected ',': a property name was expected.", i, "Remove the extra comma.");
        this.unexpected("Expected a property name in double quotes");
      }
      const raw = this.parseString();
      const key = raw.includes("\\") ? (JSON.parse(raw) as string) : raw.slice(1, -1);
      this.stats.keys++;
      if (entries.length >= 8) {
        if (!seen) seen = new Set(entries.map((e) => e.key));
      }
      const dup = seen ? seen.has(key) : entries.some((e) => e.key === key);
      if (dup) {
        this.stats.duplicateCount++;
        if (this.stats.duplicateKeys.length < MAX_LISTED) this.stats.duplicateKeys.push({ key, pos: i });
      }
      seen?.add(key);
      this.skipWs();
      if (s.charCodeAt(this.i) !== 58) {
        const got = s[this.i];
        if (got === "=") throw new JsonSyntaxError(`Expected ':' after property name ${raw}, found '='.`, this.i, "JSON uses a colon between name and value.");
        if (this.i >= this.n) throw new JsonSyntaxError(`Unexpected end of input after property name ${raw}.`, this.i, "The document is cut off.");
        throw new JsonSyntaxError(`Expected ':' after property name ${raw.length > 40 ? raw.slice(0, 40) + "…\"" : raw}.`, this.i, got === '"' ? "A colon or a comma is missing here." : undefined);
      }
      this.i++;
      const value = this.parseValue(depth);
      entries.push({ raw, key, value });
      const valueEnd = this.i;
      this.skipWs();
      const d = s.charCodeAt(this.i);
      if (d === 44) {
        commaPos = this.i;
        this.i++;
        continue;
      }
      if (d === 125) {
        this.i++;
        return { t: "o", e: entries };
      }
      if (this.i >= this.n) throw new JsonSyntaxError(`Unexpected end of input: the object opened at ${this.where(open)} is never closed.`, this.i, "Add the missing }.");
      if (d === 93) throw new JsonSyntaxError(`Mismatched bracket: found ']' but the object opened at ${this.where(open)} must be closed with '}'.`, this.i);
      if (d === 34 || d === 123 || d === 91 || isDigit(d) || d === 45 || d === 116 || d === 102 || d === 110) {
        throw new JsonSyntaxError("Missing comma after this property value.", valueEnd, "Add a comma between properties.");
      }
      this.unexpected("Expected ',' or '}' after a property value", "Add a comma between properties or close the object with }.");
    }
  }

  parseArray(depth: number): JsonNode {
    const s = this.s;
    const open = this.i;
    this.i++;
    this.stats.arrays++;
    this.track(depth);
    const items: JsonNode[] = [];
    this.skipWs();
    if (s.charCodeAt(this.i) === 93) {
      this.i++;
      return { t: "a", v: items };
    }
    let commaPos = -1;
    for (;;) {
      this.skipWs();
      const c = s.charCodeAt(this.i);
      if (c === 93 && commaPos >= 0) {
        throw new JsonSyntaxError("Trailing comma after the last array element.", commaPos, "Delete this comma – JSON does not allow a comma before ].");
      }
      if (this.i >= this.n) throw new JsonSyntaxError(`Unexpected end of input: the array opened at ${this.where(open)} is never closed.`, this.i, "Add the missing ].");
      items.push(this.parseValue(depth));
      const valueEnd = this.i;
      this.skipWs();
      const d = s.charCodeAt(this.i);
      if (d === 44) {
        commaPos = this.i;
        this.i++;
        continue;
      }
      if (d === 93) {
        this.i++;
        return { t: "a", v: items };
      }
      if (this.i >= this.n) throw new JsonSyntaxError(`Unexpected end of input: the array opened at ${this.where(open)} is never closed.`, this.i, "Add the missing ].");
      if (d === 125) throw new JsonSyntaxError(`Mismatched bracket: found '}' but the array opened at ${this.where(open)} must be closed with ']'.`, this.i);
      if (d === 34 || d === 123 || d === 91 || isDigit(d) || d === 45 || d === 116 || d === 102 || d === 110) {
        throw new JsonSyntaxError("Missing comma after this array element.", valueEnd, "Add a comma between array elements.");
      }
      this.unexpected("Expected ',' or ']' after an array element", "Add a comma between elements or close the array with ].");
    }
  }
}

/** Strictly parse JSON (RFC 8259). Never throws. */
export function parseJson(text: string): ParseResult {
  const p = new Parser(text);
  try {
    const value = p.parseDocument();
    return { ok: true, value, stats: p.stats };
  } catch (e) {
    if (e instanceof JsonSyntaxError) {
      const pos = Math.max(0, Math.min(e.pos, text.length));
      return { ok: false, error: { message: e.message, hint: e.hint, pos, ...lineColumn(text, pos) } };
    }
    if (e instanceof RangeError) {
      const pos = Math.min(p.i, text.length);
      return {
        ok: false,
        error: { message: "The JSON is nested too deeply to process in the browser.", hint: "Documents nested thousands of levels deep are almost always generated by mistake.", pos, ...lineColumn(text, pos) },
      };
    }
    throw e;
  }
}

export type FormatStyle = { kind: "pretty"; indent: string } | { kind: "oneline" } | { kind: "minify" };

/** Compare by Unicode code point (not UTF-16 code unit), so emoji sort after U+FFFF like in jq and Python. */
function compareKeys(a: JsonEntry, b: JsonEntry): number {
  const x = a.key;
  const y = b.key;
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) {
    const cx = x.charCodeAt(i);
    const cy = y.charCodeAt(i);
    if (cx === cy) continue;
    // Surrogates (U+D800-DFFF) encode code points above U+FFFF, so they rank above U+E000-FFFF.
    const rx = cx >= 0xd800 && cx <= 0xdfff ? cx + 0x2000 : cx >= 0xe000 ? cx - 0x800 : cx;
    const ry = cy >= 0xd800 && cy <= 0xdfff ? cy + 0x2000 : cy >= 0xe000 ? cy - 0x800 : cy;
    return rx - ry;
  }
  return x.length - y.length;
}

/** Serialize a parsed tree. Keys keep their original spelling; sorting is by code point like jq -S. */
export function stringifyJson(node: JsonNode, style: FormatStyle, sortKeys: boolean): string {
  const pretty = style.kind === "pretty";
  const unit = pretty ? style.indent : "";
  const colon = style.kind === "minify" ? ":" : ": ";
  const sep = style.kind === "oneline" ? ", " : ",";
  const indents: string[] = [""];
  const ind = (d: number) => {
    while (indents.length <= d) indents.push(indents[indents.length - 1] + unit);
    return indents[d];
  };
  let out = "";
  const write = (n: JsonNode, depth: number): void => {
    switch (n.t) {
      case "o": {
        if (n.e.length === 0) {
          out += "{}";
          return;
        }
        const entries = sortKeys ? [...n.e].sort(compareKeys) : n.e;
        out += "{";
        for (let k = 0; k < entries.length; k++) {
          if (k > 0) out += sep;
          if (pretty) out += "\n" + ind(depth + 1);
          out += entries[k].raw + colon;
          write(entries[k].value, depth + 1);
        }
        if (pretty) out += "\n" + ind(depth);
        out += "}";
        return;
      }
      case "a": {
        if (n.v.length === 0) {
          out += "[]";
          return;
        }
        out += "[";
        for (let k = 0; k < n.v.length; k++) {
          if (k > 0) out += sep;
          if (pretty) out += "\n" + ind(depth + 1);
          write(n.v[k], depth + 1);
        }
        if (pretty) out += "\n" + ind(depth);
        out += "]";
        return;
      }
      default:
        out += n.raw;
    }
  };
  write(node, 0);
  return out;
}

/** UTF-8 byte length without allocating a buffer. */
export function utf8Length(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
      const d = text.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        bytes += 4;
        i++;
      } else bytes += 3;
    } else bytes += 3;
  }
  return bytes;
}

export function countLines(text: string): number {
  if (!text) return 0;
  let lines = 1;
  let idx = text.indexOf("\n");
  while (idx !== -1) {
    lines++;
    idx = text.indexOf("\n", idx + 1);
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/* Escape / unescape                                                    */
/* ------------------------------------------------------------------ */

/** Turn any text into a JSON string literal (what JSON.stringify does to a string). */
export function escapeJsonString(text: string): string {
  return JSON.stringify(text);
}

export type UnescapeResult = { ok: true; value: string } | { ok: false; error: JsonErrorInfo };

/**
 * Decode a JSON string literal. Accepts the literal with or without its
 * surrounding double quotes, e.g. "{\"a\":1}" or {\"a\":1}.
 */
export function unescapeJsonString(text: string): UnescapeResult {
  const trimmed = text.trim();
  const lead = text.length - text.trimStart().length;
  const quoted = trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"');
  const literal = quoted ? trimmed : `"${trimmed}"`;
  const offset = quoted ? lead : lead - 1;
  const p = new Parser(literal);
  try {
    p.parseString();
    if (p.i !== literal.length) {
      throw new JsonSyntaxError("Unescaped double quote inside the string.", p.i - 1, 'Inside a JSON string a double quote must be written as \\".');
    }
    return { ok: true, value: JSON.parse(literal) as string };
  } catch (e) {
    if (e instanceof JsonSyntaxError) {
      const pos = Math.max(0, Math.min(e.pos + offset, text.length));
      return { ok: false, error: { message: e.message, hint: e.hint, pos, ...lineColumn(text, pos) } };
    }
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* Repair of common mistakes                                            */
/* ------------------------------------------------------------------ */

export type FixKind =
  | "bom"
  | "invisible"
  | "comment"
  | "trailingComma"
  | "extraComma"
  | "missingComma"
  | "singleQuote"
  | "smartQuote"
  | "unquotedKey"
  | "pythonLiteral"
  | "nonJsonValue"
  | "number"
  | "controlChar";

export const FIX_LABELS: Record<FixKind, string> = {
  bom: "Removed byte order mark at the start",
  invisible: "Replaced invisible characters (non-breaking or zero-width spaces)",
  comment: "Removed comments",
  trailingComma: "Removed trailing commas",
  extraComma: "Removed doubled commas",
  missingComma: "Added missing commas",
  singleQuote: "Converted single-quoted strings to double quotes",
  smartQuote: "Replaced curly “smart” quotes with straight quotes",
  unquotedKey: "Added double quotes around property names",
  pythonLiteral: "Converted True / False / None to true / false / null",
  nonJsonValue: "Replaced NaN / Infinity / undefined with null",
  number: "Normalized number formats (+1, .5, 5., hex)",
  controlChar: "Escaped raw line breaks or tabs inside strings",
};

export interface FixChange {
  kind: FixKind;
  label: string;
  count: number;
  lines: number[];
}

export interface FixResult {
  text: string;
  changes: FixChange[];
  total: number;
}

type TokType = "ws" | "comment" | "punct" | "string" | "word";
interface Tok {
  type: TokType;
  start: number;
  out: string;
  /** For words: the original text. */
  src?: string;
}

const WS_EXTRA = /[\u00a0\u200b\u2028\u2029\ufeff\u2000-\u200a\u202f\u205f\u3000]/;
const WORD_CHAR_STOP = /[\s{}[\]:,"'“”‘’/\u200b\ufeff]/;

function decodeLooseString(body: string): string {
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const e = body[++i];
    if (e === undefined) {
      out += "\\";
      break;
    }
    const simple: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", "0": "\0" };
    if (e in simple) out += simple[e];
    else if (e === "u" && /^[0-9a-fA-F]{4}$/.test(body.slice(i + 1, i + 5))) {
      out += String.fromCharCode(parseInt(body.slice(i + 1, i + 5), 16));
      i += 4;
    } else if (e === "x" && /^[0-9a-fA-F]{2}$/.test(body.slice(i + 1, i + 3))) {
      out += String.fromCharCode(parseInt(body.slice(i + 1, i + 3), 16));
      i += 2;
    } else if (e === "\n") {
      /* line continuation */
    } else out += e;
  }
  return out;
}

function isWordStop(c: number): boolean {
  // whitespace, { } [ ] : , " ' / and the Unicode quotes / invisible characters handled elsewhere
  return (
    c <= 32 ||
    c === 123 || c === 125 || c === 91 || c === 93 || c === 58 || c === 44 || c === 34 || c === 39 || c === 47 ||
    (c >= 0x80 && WORD_CHAR_STOP.test(String.fromCharCode(c)))
  );
}

function tokenize(text: string, note: (kind: FixKind, pos: number) => void): Tok[] {
  const toks: Tok[] = [];
  const n = text.length;
  let i = 0;
  while (i < n) {
    const ch = text[i];
    const code = text.charCodeAt(i);
    const start = i;
    if (code === 32 || code === 10 || code === 13 || code === 9) {
      while (i < n && isWs(text.charCodeAt(i))) i++;
      if (i >= n || !(/\s/.test(text[i]) || text[i] === "\u200b")) {
        toks.push({ type: "ws", start, out: text.slice(start, i) });
        continue;
      }
      i = start;
    }
    if (/\s/.test(ch) || ch === "\u200b") {
      let ws = "";
      while (i < n && (/\s/.test(text[i]) || text[i] === "\u200b")) {
        const w = text[i];
        if (WS_EXTRA.test(w)) {
          if (w === "\ufeff" && i === 0) note("bom", i);
          else note("invisible", i);
          if (w !== "\ufeff" && w !== "\u200b") ws += w === "\u2028" || w === "\u2029" ? "\n" : " ";
        } else ws += w;
        i++;
      }
      toks.push({ type: "ws", start, out: ws });
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      const end = text.indexOf("\n", i);
      i = end === -1 ? n : end;
      toks.push({ type: "comment", start, out: "" });
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      toks.push({ type: "comment", start, out: "" });
      continue;
    }
    if ("{}[]:,".includes(ch)) {
      toks.push({ type: "punct", start, out: ch });
      i++;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      let fixed = false;
      for (; j < n; j++) {
        const c = text.charCodeAt(j);
        if (c === 34) break;
        if (c === 92) j++;
        else if (c < 0x20) fixed = true;
      }
      if (j >= n) {
        // Unterminated: leave the rest untouched so the validator can report it.
        toks.push({ type: "string", start, out: text.slice(i) });
        i = n;
        continue;
      }
      let raw = text.slice(i, j + 1);
      if (fixed) {
        note("controlChar", start);
        raw = raw.replace(/[\u0000-\u001f]/g, (c) => (c === "\n" ? "\\n" : c === "\r" ? "\\r" : c === "\t" ? "\\t" : "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")));
      }
      toks.push({ type: "string", start, out: raw });
      i = j + 1;
      continue;
    }
    if (ch === "'" || ch === "“" || ch === "‘" || ch === "”" || ch === "’") {
      const closers = ch === "'" ? "'" : ch === "‘" || ch === "’" ? "’'" : "”“\"";
      let j = i + 1;
      while (j < n && !closers.includes(text[j])) {
        if (text[j] === "\\" && ch === "'") j++;
        j++;
      }
      if (j >= n) {
        toks.push({ type: "string", start, out: text.slice(i) });
        i = n;
        continue;
      }
      const body = text.slice(i + 1, j);
      note(ch === "'" ? "singleQuote" : "smartQuote", start);
      toks.push({ type: "string", start, out: JSON.stringify(ch === "'" ? decodeLooseString(body) : body) });
      i = j + 1;
      continue;
    }
    let j = i;
    while (j < n && !isWordStop(text.charCodeAt(j))) j++;
    if (j === i) j = i + 1; // a lone character we cannot classify (e.g. '/')
    const word = text.slice(i, j);
    toks.push({ type: "word", start, out: word, src: word });
    i = j;
  }
  return toks;
}

const JSON_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

function fixValueWord(word: string): { out: string; kind?: FixKind } {
  if (word === "true" || word === "false" || word === "null" || JSON_NUMBER.test(word)) return { out: word };
  if (word === "True" || word === "False") return { out: word.toLowerCase(), kind: "pythonLiteral" };
  if (word === "None") return { out: "null", kind: "pythonLiteral" };
  if (word === "NaN" || word === "Infinity" || word === "-Infinity" || word === "+Infinity" || word === "undefined") return { out: "null", kind: "nonJsonValue" };
  if (/^[-+]?0[xX][0-9a-fA-F]+$/.test(word)) {
    const neg = word.startsWith("-");
    const v = BigInt(word.replace(/^[-+]/, ""));
    return { out: (neg ? "-" : "") + v.toString(), kind: "number" };
  }
  const m = /^([-+]?)(\d*)(?:\.(\d*))?([eE][+-]?\d+)?$/.exec(word);
  if (m && (m[2] || m[3])) {
    const sign = m[1] === "-" ? "-" : "";
    let intPart = m[2] || "0";
    if (intPart.length > 1 && intPart.startsWith("0")) return { out: word }; // leading zeros are ambiguous; leave them
    const frac = m[3] ? "." + m[3] : "";
    intPart = intPart || "0";
    const out = sign + intPart + frac + (m[4] ?? "");
    if (JSON_NUMBER.test(out) && out !== word) return { out, kind: "number" };
  }
  return { out: word };
}

type Frame = { type: "o" | "a" | "top"; state: "key" | "colon" | "value" | "after" };

/**
 * Repair the most common hand-written JSON mistakes without guessing at data:
 * comments, trailing/doubled/missing commas, single or curly quotes, unquoted
 * keys, Python literals, NaN/Infinity, JavaScript number forms, raw control
 * characters in strings and invisible whitespace. Valid JSON is returned unchanged.
 */
export function fixCommonIssues(text: string): FixResult {
  const positions = new Map<FixKind, number[]>();
  const note = (kind: FixKind, pos: number) => {
    const list = positions.get(kind);
    if (list) list.push(pos);
    else positions.set(kind, [pos]);
  };
  const toks = tokenize(text, note);
  const out: string[] = toks.map((t) => t.out);
  const sig: number[] = [];
  toks.forEach((t, k) => {
    if (t.type !== "ws" && t.type !== "comment") sig.push(k);
  });

  // Comments: drop them and the spaces before a line comment.
  toks.forEach((t, k) => {
    if (t.type !== "comment") return;
    note("comment", t.start);
    const prev = toks[k - 1];
    if (prev?.type === "ws") out[k - 1] = out[k - 1].replace(/[ \t]+$/, "");
  });

  const stack: Frame[] = [{ type: "top", state: "value" }];
  let prevSig = -1;
  const isAtom = (v: string) => v === "true" || v === "false" || v === "null" || JSON_NUMBER.test(v);
  /** Did the previous significant token cleanly finish a value? */
  const cleanEnd = () => {
    if (prevSig < 0) return false;
    const t = toks[prevSig];
    if (t.type === "string") return out[prevSig].length >= 2 && out[prevSig].endsWith('"');
    if (t.type === "punct") return t.out === "}" || t.out === "]";
    return isAtom(out[prevSig]);
  };
  /** Insert a comma before token k when a value follows another value in a container. */
  const separate = () => {
    const f = stack[stack.length - 1];
    if (f.state === "after" && f.type !== "top" && cleanEnd()) {
      out[prevSig] += ",";
      note("missingComma", toks[prevSig].start);
      f.state = f.type === "o" ? "key" : "value";
    }
  };

  for (let s = 0; s < sig.length; s++) {
    const k = sig[s];
    const t = toks[k];
    const f = stack[stack.length - 1];
    const nextTok = sig[s + 1] !== undefined ? toks[sig[s + 1]] : undefined;
    const next = nextTok?.type === "punct" ? nextTok.out : undefined;
    if (t.type === "punct") {
      const p = t.out;
      if (p === ",") {
        if (f.type !== "top" && (next === "}" || next === "]")) {
          out[k] = "";
          note("trailingComma", t.start);
          continue;
        }
        if (f.type !== "top" && (next === "," || (f.state !== "after" && prevSig >= 0 && (toks[prevSig].out === "[" || toks[prevSig].out === "{")))) {
          out[k] = "";
          note("extraComma", t.start);
          continue;
        }
        if (f.type === "o") f.state = "key";
        else if (f.type === "a") f.state = "value";
      } else if (p === ":") {
        if (f.type === "o" && f.state === "colon") f.state = "value";
      } else if (p === "{" || p === "[") {
        if (f.type === "a") separate();
        stack.push({ type: p === "{" ? "o" : "a", state: p === "{" ? "key" : "value" });
      } else {
        const want = p === "}" ? "o" : "a";
        if (f.type === want) {
          stack.pop();
          stack[stack.length - 1].state = "after";
        }
      }
      prevSig = k;
      continue;
    }
    // A string or bare word.
    if (f.type === "o" && next === ":" && (f.state === "key" || f.state === "after")) {
      separate();
      if (t.type === "word") {
        out[k] = JSON.stringify(t.src);
        note("unquotedKey", t.start);
      }
      f.state = "colon";
    } else {
      let clean = t.type === "string";
      if (t.type === "word" && t.src !== undefined) {
        const fixed = fixValueWord(t.src);
        clean = isAtom(fixed.out);
        if (clean && fixed.kind) {
          out[k] = fixed.out;
          note(fixed.kind, t.start);
        }
      }
      if (clean && f.type === "a") separate();
      f.state = "after";
    }
    prevSig = k;
  }

  const fixedText = out.join("");
  const lineStarts: number[] = [0];
  for (let i = text.indexOf("\n"); i !== -1; i = text.indexOf("\n", i + 1)) lineStarts.push(i + 1);
  const lineOf = (pos: number) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  const order = Object.keys(FIX_LABELS) as FixKind[];
  const changes: FixChange[] = order
    .filter((kind) => positions.has(kind))
    .map((kind) => {
      const list = positions.get(kind)!;
      const lines = [...new Set(list.map(lineOf))].sort((a, b) => a - b);
      return { kind, label: FIX_LABELS[kind], count: list.length, lines };
    });
  const total = changes.reduce((sum, c) => sum + c.count, 0);
  return { text: total ? fixedText : text, changes, total };
}

/* ------------------------------------------------------------------ */
/* Code frame for error display                                        */
/* ------------------------------------------------------------------ */

export interface FrameLine {
  number: number;
  text: string;
  isError: boolean;
  /** Caret prefix (tabs preserved so the ^ lines up) for the error line. */
  caret?: string;
}

const FRAME_WIDTH = 72;

/** Lines around the error, with very long lines windowed around the column. */
export function buildCodeFrame(text: string, line: number, column: number, context = 2): FrameLine[] {
  const lines: FrameLine[] = [];
  const first = Math.max(1, line - context);
  let start = 0;
  for (let l = 1; l < first; l++) {
    const idx = text.indexOf("\n", start);
    if (idx === -1) break;
    start = idx + 1;
  }
  for (let l = first; l <= line + 1; l++) {
    if (start > text.length) break;
    const idx = text.indexOf("\n", start);
    const end = idx === -1 ? text.length : idx;
    let content = text.slice(start, end).replace(/\r$/, "");
    const isError = l === line;
    let col = column - 1;
    let from = 0;
    if (content.length > FRAME_WIDTH) {
      from = isError ? Math.max(0, Math.min(col - Math.floor(FRAME_WIDTH / 2), content.length - FRAME_WIDTH)) : 0;
      const slice = content.slice(from, from + FRAME_WIDTH);
      content = (from > 0 ? "…" : "") + slice + (from + FRAME_WIDTH < content.length ? "…" : "");
      col = col - from + (from > 0 ? 1 : 0);
    }
    const frame: FrameLine = { number: l, text: content, isError };
    if (isError) frame.caret = content.slice(0, Math.max(0, col)).replace(/[^\t]/g, " ") + "^";
    lines.push(frame);
    if (idx === -1) break;
    start = idx + 1;
  }
  return lines;
}
