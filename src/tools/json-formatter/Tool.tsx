"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Download, FolderOpen, Wand2 } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Select, Stat, StatGrid, Tabs, Textarea, Toggle, ToolActions, ToolPanel } from "@/components/ui";
import { cn, downloadText, formatBytes, formatNumber } from "@/lib/utils";
import {
  buildCodeFrame,
  countLines,
  escapeJsonString,
  fixCommonIssues,
  lineColumn,
  parseJson,
  stringifyJson,
  unescapeJsonString,
  utf8Length,
  type FixChange,
  type FixResult,
  type FormatStyle,
  type JsonErrorInfo,
  type ParseResult,
} from "./json-core";

type Mode = "format" | "oneline" | "minify" | "escape" | "unescape";
type Indent = "2" | "4" | "tab";

interface Settings {
  mode: Mode;
  indent: Indent;
  sortKeys: boolean;
  minifyBeforeEscape: boolean;
}

const DEFAULT_SETTINGS: Settings = { mode: "format", indent: "2", sortKeys: false, minifyBeforeEscape: false };

const MODES: { value: Mode; label: string }[] = [
  { value: "format", label: "Format" },
  { value: "oneline", label: "One line" },
  { value: "minify", label: "Minify" },
  { value: "escape", label: "Escape" },
  { value: "unescape", label: "Unescape" },
];

const OUTPUT_LABEL: Record<Mode, string> = {
  format: "Formatted JSON",
  oneline: "Single-line JSON",
  minify: "Minified JSON",
  escape: "Escaped JSON string",
  unescape: "Unescaped text",
};

/** Inputs above this size are analysed after a short pause in typing. */
const DEBOUNCE_FROM = 100_000;
/** Inputs above this size only look for fixable mistakes on request. */
const AUTO_FIX_LIMIT = 1_500_000;
/** Refuse files that would make the page itself unusable. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Longer results are previewed in the output box; copy and download still use the full text. */
const PREVIEW_CHARS = 300_000;
/** Drafts larger than this are not kept in session storage. */
const MAX_DRAFT_CHARS = 1_000_000;

const SAMPLE =
  '{"project":"Trail Map","version":"2.4.1","published":true,"maintainers":[{"name":"Ada Byron","email":"ada@example.com","roles":["owner","reviewer"]},{"name":"Lin Chen","email":"lin@example.com","roles":["developer"]}],"settings":{"units":"metric","maxZoom":18,"center":[46.5197,6.6323],"offlineTiles":null},"downloads":{"2026-07":1840,"2026-08":2315}}';

const BROKEN_SAMPLE = `{
  // exported from the admin panel
  name: 'Trail Map',
  "version": "2.4.1",
  "published": True,
  "tags": ["hiking", "offline",],
  "maxZoom": 18
  "center": [46.5197, 6.6323],
}`;

const serializeDraft = (v: string) => JSON.stringify(v.length > MAX_DRAFT_CHARS ? "" : v);

interface Analysis {
  text: string;
  empty: boolean;
  bytes: number;
  lines: number;
  parse: ParseResult | null;
  /** Fixable mistakes found in invalid input (null when valid, empty or too large to check automatically). */
  fix: FixResult | null;
  fixMakesValid: boolean;
}

function analyze(text: string): Analysis {
  const base = { text, bytes: utf8Length(text), lines: countLines(text) };
  if (!text.trim()) return { ...base, empty: true, parse: null, fix: null, fixMakesValid: false };
  const parse = parseJson(text);
  let fix: FixResult | null = null;
  let fixMakesValid = false;
  if (!parse.ok && text.length <= AUTO_FIX_LIMIT) {
    fix = fixCommonIssues(text);
    fixMakesValid = fix.total > 0 && parseJson(fix.text).ok;
  }
  return { ...base, empty: false, parse, fix, fixMakesValid };
}

interface Output {
  text: string;
  error?: JsonErrorInfo;
  /** Unescape mode: the decoded text is itself valid JSON. */
  decodedIsJson?: boolean;
}

function styleFor(mode: Mode, indent: Indent): FormatStyle {
  if (mode === "minify") return { kind: "minify" };
  if (mode === "oneline") return { kind: "oneline" };
  return { kind: "pretty", indent: indent === "tab" ? "\t" : indent === "4" ? "    " : "  " };
}

function buildOutput(a: Analysis, s: Settings): Output {
  if (a.empty) return { text: "" };
  if (s.mode === "escape") {
    const source = s.minifyBeforeEscape && a.parse?.ok ? stringifyJson(a.parse.value, { kind: "minify" }, false) : a.text;
    return { text: escapeJsonString(source) };
  }
  if (s.mode === "unescape") {
    const r = unescapeJsonString(a.text);
    if (!r.ok) return { text: "", error: r.error };
    return { text: r.value, decodedIsJson: r.value.length < 5_000_000 && parseJson(r.value).ok };
  }
  if (!a.parse?.ok) return { text: "" };
  try {
    return { text: stringifyJson(a.parse.value, styleFor(s.mode, s.indent), s.sortKeys) };
  } catch {
    return { text: "" };
  }
}

function describeRoot(parse: ParseResult & { ok: true }): string {
  const v = parse.value;
  if (v.t === "o") return `an object with ${formatNumber(v.e.length)} ${v.e.length === 1 ? "key" : "keys"}`;
  if (v.t === "a") return `an array of ${formatNumber(v.v.length)} ${v.v.length === 1 ? "item" : "items"}`;
  if (v.t === "s") return "a single string";
  if (v.t === "n") return "a single number";
  return `the literal ${v.raw}`;
}

function outputFileName(fileName: string | null, mode: Mode): string {
  const base = fileName ? fileName.replace(/\.[^.]+$/, "") || "data" : "data";
  if (mode === "minify") return `${base}.min.json`;
  if (mode === "escape" || mode === "unescape") return `${base}.txt`;
  return `${base}.json`;
}

function linesText(lines: number[]): string {
  const shown = lines.slice(0, 6).join(", ");
  return lines.length > 6 ? `${lines.length > 1 ? "lines" : "line"} ${shown} and ${lines.length - 6} more` : `${lines.length > 1 ? "lines" : "line"} ${shown}`;
}

function CodeFrame({ text, error }: { text: string; error: JsonErrorInfo }) {
  const frame = buildCodeFrame(text, error.line, error.column);
  const width = String(frame[frame.length - 1]?.number ?? 1).length;
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface py-2 font-mono text-xs leading-5 text-fg" aria-label={`Source around line ${error.line}`}>
      {frame.map((l) => (
        <div key={l.number}>
          <div className={cn("flex px-3", l.isError && "bg-danger-soft")}>
            <span className={cn("mr-3 shrink-0 select-none text-right tabular-nums", l.isError ? "font-semibold text-danger" : "text-muted")} style={{ minWidth: `${width}ch` }}>
              {l.number}
            </span>
            <span className="whitespace-pre">{l.text || " "}</span>
          </div>
          {l.caret !== undefined && (
            <div className="flex px-3" aria-hidden>
              <span className="mr-3 shrink-0" style={{ minWidth: `${width}ch` }} />
              <span className="whitespace-pre font-bold text-danger">{l.caret}</span>
            </div>
          )}
        </div>
      ))}
    </pre>
  );
}

function ChangeList({ changes }: { changes: FixChange[] }) {
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-5">
      {changes.map((c) => (
        <li key={c.kind}>
          {c.label}
          {c.count > 1 ? ` (${formatNumber(c.count)})` : ""} – {linesText(c.lines)}
        </li>
      ))}
    </ul>
  );
}

export default function JsonFormatter() {
  const [input, setInput] = usePersistentState<string>("json-formatter:input", "", { serialize: serializeDraft });
  const [storedSettings, setSettings] = usePersistentState<Settings>("json-formatter:settings", DEFAULT_SETTINGS, { storage: "local" });
  const settings = { ...DEFAULT_SETTINGS, ...storedSettings };
  const update = (patch: Partial<Settings>) => setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...patch }));

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastFix, setLastFix] = useState<{ before: string; changes: FixChange[]; total: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Large documents are analysed after a short pause so typing stays responsive.
  const [debounced, setDebounced] = useState(input);
  useEffect(() => {
    if (input.length <= DEBOUNCE_FROM || input === debounced) return;
    const t = setTimeout(() => setDebounced(input), input.length > 1_000_000 ? 400 : 200);
    return () => clearTimeout(t);
  }, [input, debounced]);
  const source = input.length <= DEBOUNCE_FROM ? input : debounced;
  const pending = source !== input;

  const analysis = useMemo(() => analyze(source), [source]);
  const { mode, indent, sortKeys, minifyBeforeEscape } = settings;
  const output = useMemo(
    () => buildOutput(analysis, { mode, indent, sortKeys, minifyBeforeEscape }),
    [analysis, mode, indent, sortKeys, minifyBeforeEscape],
  );
  const outputBytes = useMemo(() => utf8Length(output.text), [output.text]);
  const outputLines = useMemo(() => countLines(output.text), [output.text]);
  // Browsers take seconds to lay out a textarea holding hundreds of thousands of lines,
  // so very large results are shown as a preview.
  const preview = useMemo(() => {
    if (output.text.length <= PREVIEW_CHARS) return null;
    const cut = output.text.lastIndexOf("\n", PREVIEW_CHARS);
    const text = output.text.slice(0, cut > PREVIEW_CHARS / 2 ? cut : PREVIEW_CHARS);
    return { text, lines: countLines(text), bytes: utf8Length(text) };
  }, [output.text]);

  const jsonMode = mode === "format" || mode === "oneline" || mode === "minify";
  const parse = analysis.parse;
  const error = jsonMode ? (parse && !parse.ok ? parse.error : undefined) : output.error;
  const stats = parse?.ok ? parse.stats : null;

  const replaceInput = (text: string) => {
    setInput(text);
    setLastFix(null);
    setNotice(null);
  };

  const loadFile = async (file: File) => {
    setFileError(null);
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES, 0)} – larger files are better handled with jq or python -m json.tool.`);
      return;
    }
    try {
      const text = await file.text();
      replaceInput(text.replace(/^\uFEFF/, ""));
      setFileName(file.name);
    } catch {
      setFileError(`Could not read ${file.name}. Make sure it is a text file.`);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    e.preventDefault();
    void loadFile(file);
  };

  const jumpTo = (err: JsonErrorInfo) => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.focus();
    const pos = Math.min(err.pos, ta.value.length);
    ta.setSelectionRange(pos, Math.min(pos + 1, ta.value.length));
    const style = window.getComputedStyle(ta);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const charWidth = (parseFloat(style.fontSize) || 14) * 0.6;
    ta.scrollTop = Math.max(0, (err.line - 3) * lineHeight);
    ta.scrollLeft = Math.max(0, (err.column - 30) * charWidth);
  };

  const applyFix = () => {
    const result = analysis.fix ?? fixCommonIssues(source);
    if (!result.total) {
      setNotice("No fixable common mistakes were found. Use “Go to error” and correct the problem by hand.");
      return;
    }
    setInput(result.text);
    setLastFix({ before: source, changes: result.changes, total: result.total });
    setNotice(null);
  };

  const pasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      replaceInput(clip);
      setFileName(null);
    } catch {
      inputRef.current?.focus();
    }
  };

  const duplicateLines = stats?.duplicateKeys.map((d) => ({ key: d.key, line: lineColumn(source, d.pos).line })) ?? [];
  const unsafeLines = stats?.unsafeNumbers.map((u) => ({ raw: u.raw, line: lineColumn(source, u.pos).line })) ?? [];
  const sizeChange = analysis.bytes ? Math.round(((outputBytes - analysis.bytes) / analysis.bytes) * 1000) / 10 : 0;

  return (
    <ToolPanel>
      <div onDrop={onDrop} onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}>
        <Textarea
          ref={inputRef}
          label="JSON input"
          labelAddon={analysis.empty ? "Paste, type or drop a .json file" : `${formatBytes(analysis.bytes)} · ${formatNumber(analysis.lines)} ${analysis.lines === 1 ? "line" : "lines"}`}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setLastFix(null);
            setNotice(null);
          }}
          placeholder={'Paste JSON here, e.g. {"name": "Ada", "languages": ["en", "fr"]}'}
          rows={12}
          mono
          wrap="off"
          autoCapitalize="off"
          autoCorrect="off"
          className="text-[13px] max-sm:h-56"
        />
      </div>

      <ToolActions>
        <Button variant="secondary" leftIcon={<FolderOpen className="h-4 w-4" aria-hidden />} onClick={() => fileRef.current?.click()}>
          Open file
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.jsonc,.json5,.geojson,.txt,application/json,text/plain"
          className="sr-only"
          tabIndex={-1}
          aria-label="Open a JSON file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void loadFile(file);
            e.target.value = "";
          }}
        />
        <Button variant="secondary" onClick={pasteFromClipboard}>
          Paste
        </Button>
        <Button variant="ghost" onClick={() => { replaceInput(SAMPLE); setFileName(null); }}>
          Sample
        </Button>
        <Button variant="ghost" onClick={() => { replaceInput(BROKEN_SAMPLE); setFileName(null); }}>
          Broken sample
        </Button>
        <Button variant="ghost" onClick={() => { replaceInput(""); setFileName(null); setFileError(null); }} disabled={!input}>
          Clear
        </Button>
        {fileName && <Badge variant="outline" className="max-w-full truncate">{fileName}</Badge>}
        {pending && <Badge variant="primary">Updating…</Badge>}
      </ToolActions>

      {fileError && <Alert variant="error" title="File not loaded">{fileError}</Alert>}

      {lastFix && (
        <Alert variant={parse?.ok ? "success" : "warning"} title={`Fixed ${formatNumber(lastFix.total)} ${lastFix.total === 1 ? "issue" : "issues"}${parse?.ok ? " – the JSON is now valid" : " – some errors remain"}`}>
          <ChangeList changes={lastFix.changes} />
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => { setInput(lastFix.before); setLastFix(null); }}>
            Undo fix
          </Button>
        </Alert>
      )}

      {!analysis.empty && error && (
        <Alert variant="error" title={`${jsonMode ? "Invalid JSON" : "Cannot unescape"} – line ${formatNumber(error.line)}, column ${formatNumber(error.column)}`}>
          <p className="text-fg">{error.message}</p>
          {error.hint && <p className="mt-1">{error.hint}</p>}
          <CodeFrame text={source} error={error} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => jumpTo(error)}>
              Go to error
            </Button>
            {jsonMode && (analysis.fix ? analysis.fix.total > 0 : true) && (
              <Button size="sm" leftIcon={<Wand2 className="h-4 w-4" aria-hidden />} onClick={applyFix}>
                Fix common issues{analysis.fix ? ` (${formatNumber(analysis.fix.total)})` : ""}
              </Button>
            )}
          </div>
          {jsonMode && analysis.fix && analysis.fix.total > 0 && (
            <div className="mt-3">
              <p className="font-medium text-fg">Fixes that will be applied:</p>
              <ChangeList changes={analysis.fix.changes} />
              <p className="mt-1 text-xs">
                {analysis.fixMakesValid ? "Applying these fixes makes the document valid JSON." : "Other errors will remain after these fixes; they will be shown next."} Your data values are not changed apart from the listed conversions, and you can undo.
              </p>
            </div>
          )}
          {notice && <p className="mt-2 text-xs">{notice}</p>}
        </Alert>
      )}

      {jsonMode && parse?.ok && !lastFix && (
        <Alert variant="success" title="Valid JSON">
          The document is {describeRoot(parse)}
          {stats && stats.maxDepth > 0 ? `, ${formatNumber(stats.maxDepth)} ${stats.maxDepth === 1 ? "level" : "levels"} deep` : ""}.
        </Alert>
      )}

      {mode === "unescape" && output.decodedIsJson && (
        <Alert variant="info" title="The unescaped text is valid JSON">
          <Button size="sm" variant="secondary" className="mt-1" onClick={() => { replaceInput(output.text); update({ mode: "format" }); }}>
            Format it
          </Button>
        </Alert>
      )}

      <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Output</span>
          <Tabs value={mode} onChange={(m) => update({ mode: m })} options={MODES} label="Output mode" />
        </div>
        {mode === "format" && (
          <Select
            label="Indent"
            value={indent}
            onChange={(e) => update({ indent: e.target.value as Indent })}
            options={[
              { value: "2", label: "2 spaces" },
              { value: "4", label: "4 spaces" },
              { value: "tab", label: "Tab" },
            ]}
            containerClassName="sm:w-36"
          />
        )}
        {jsonMode && (
          <Toggle checked={sortKeys} onChange={(v) => update({ sortKeys: v })} label="Sort keys A–Z" description="Recursive, by Unicode code point (like jq -S)" className="sm:pb-1" />
        )}
        {mode === "escape" && (
          <Toggle
            checked={minifyBeforeEscape}
            onChange={(v) => update({ minifyBeforeEscape: v })}
            label="Minify JSON first"
            description="Compact valid JSON before turning it into a string"
            className="sm:pb-1"
          />
        )}
      </div>

      {mode === "escape" && !analysis.empty && (
        <p className="text-xs text-muted">
          Escape wraps your text in double quotes and escapes quotes, backslashes and line breaks, so it can be embedded as a string value inside another JSON document or in code.
        </p>
      )}

      <Textarea
        label={OUTPUT_LABEL[mode]}
        labelAddon={output.text ? `${formatBytes(outputBytes)} · ${formatNumber(outputLines)} ${outputLines === 1 ? "line" : "lines"}` : undefined}
        value={preview ? preview.text : output.text}
        readOnly
        rows={14}
        mono
        wrap={mode === "format" ? "off" : "soft"}
        className="bg-surface-2 text-[13px]"
        placeholder={
          analysis.empty
            ? "The result appears here as you type."
            : error
              ? "Fix the error above to see the result."
              : ""
        }
      />

      {preview && (
        <p className="-mt-3 text-xs text-muted">
          Showing the first {formatNumber(preview.lines)} of {formatNumber(outputLines)} lines ({formatBytes(preview.bytes)} of {formatBytes(outputBytes)}) to keep the page fast. Copy and Download include the full result.
        </p>
      )}

      <ToolActions>
        <CopyButton text={output.text} disabled={!output.text} />
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" aria-hidden />}
          disabled={!output.text}
          onClick={() => downloadText(output.text, outputFileName(fileName, mode), jsonMode ? "application/json;charset=utf-8" : "text/plain;charset=utf-8")}
        >
          Download
        </Button>
        <Button
          variant="ghost"
          disabled={!output.text || output.text === input}
          onClick={() => {
            replaceInput(output.text);
            if (mode === "unescape") update({ mode: "format" });
          }}
        >
          Use as input
        </Button>
      </ToolActions>

      {jsonMode && stats && (
        <StatGrid>
          <Stat label="Output size" value={formatBytes(outputBytes)} hint={`${sizeChange > 0 ? "+" : ""}${sizeChange}% vs input (${formatBytes(analysis.bytes)})`} emphasis />
          <Stat label="Lines" value={formatNumber(outputLines)} hint={`input: ${formatNumber(analysis.lines)}`} />
          <Stat label="Depth" value={formatNumber(stats.maxDepth)} hint="levels of nesting" />
          <Stat label="Keys" value={formatNumber(stats.keys)} hint={stats.duplicateCount ? `${formatNumber(stats.duplicateCount)} duplicate` : "all unique per object"} />
          <Stat label="Objects" value={formatNumber(stats.objects)} />
          <Stat label="Arrays" value={formatNumber(stats.arrays)} />
          <Stat label="Strings" value={formatNumber(stats.strings)} />
          <Stat label="Numbers" value={formatNumber(stats.numbers)} hint={`${formatNumber(stats.booleans)} booleans · ${formatNumber(stats.nulls)} nulls`} />
        </StatGrid>
      )}

      {jsonMode && stats && stats.duplicateCount > 0 && (
        <Alert variant="warning" title={`${formatNumber(stats.duplicateCount)} duplicate ${stats.duplicateCount === 1 ? "key" : "keys"}`}>
          {duplicateLines.map((d) => `"${d.key}" (line ${d.line})`).join(", ")}
          {stats.duplicateCount > duplicateLines.length ? " and more" : ""}. The syntax is valid, but most parsers – including JavaScript&apos;s JSON.parse – keep only the last value, so earlier values are silently lost.
        </Alert>
      )}

      {jsonMode && stats && stats.unsafeCount > 0 && (
        <Alert variant="warning" title={`${formatNumber(stats.unsafeCount)} ${stats.unsafeCount === 1 ? "number" : "numbers"} too large for JavaScript`}>
          {unsafeLines.map((u) => `${u.raw.length > 30 ? u.raw.slice(0, 30) + "…" : u.raw} (line ${u.line})`).join(", ")}
          {stats.unsafeCount > unsafeLines.length ? " and more" : ""}. This formatter keeps the digits exactly, but JSON.parse in browsers and Node.js rounds numbers above 9,007,199,254,740,991 to the nearest value a double can hold, and turns anything beyond about 1.8e308 into Infinity. Store IDs like these as strings if a JavaScript app will read them.
        </Alert>
      )}
    </ToolPanel>
  );
}
