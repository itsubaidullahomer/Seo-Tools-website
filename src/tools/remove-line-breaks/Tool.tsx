"use client";

import { useDeferredValue, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { ArrowUp, ClipboardPaste, Download, Eraser, FileUp, Sparkles } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  Alert,
  Button,
  Input,
  ResultBox,
  Select,
  Stat,
  StatGrid,
  Textarea,
  Toggle,
  ToolActions,
  ToolGrid,
  ToolPanel,
  ToolSection,
} from "@/components/ui";
import { cn, downloadText, formatBytes, formatNumber } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Pure logic (no React, easy to unit test)                            */
/* ------------------------------------------------------------------ */

export type Mode = "spaces" | "paragraphs" | "custom" | "none";
export type LineEnding = "lf" | "crlf";

export interface Options {
  mode: Mode;
  /** Separator used in "custom" mode. `\t` is read as a tab. */
  separator: string;
  collapseSpaces: boolean;
  trimLines: boolean;
  removeEmptyLines: boolean;
  keepLists: boolean;
  fixHyphens: boolean;
  lineEnding: LineEnding;
}

export const DEFAULT_OPTIONS: Options = {
  mode: "spaces",
  separator: ", ",
  collapseSpaces: true,
  trimLines: true,
  removeEmptyLines: true,
  keepLists: false,
  fixHyphens: false,
  lineEnding: "lf",
};

/**
 * Every character sequence treated as a line break: Windows CRLF, Unix LF, classic
 * Mac CR, vertical tab (Word's Shift+Enter), form feed (page break), NEL and the
 * Unicode line/paragraph separators.
 */
const BREAK_RE = /\r\n|[\n\r\u000B\u000C\u0085\u2028\u2029]/g;
/** A line that starts with a bullet or list number: "- ", "* ", "• ", "1. ", "2) ", "(3) ", "a) ", "(b) ". */
const LIST_RE = /^\s*(?:[-*+•◦▪‣](?:\s|$)|\d{1,3}[.)](?:\s|$)|\(\d{1,3}\)(?:\s|$)|\(?[A-Za-z]\)(?:\s|$))/;
const SPACE_RUN_RE = /[ \t\u00A0]{2,}/g;
const TRAILING_SPACE_RE = /[ \t\u00A0]+$/;
const LEADING_SPACE_RE = /^[ \t\u00A0]+/;
const HYPHEN_END_RE = /\p{L}-$/u;
const LOWER_START_RE = /^\p{Ll}/u;

export function countLineBreaks(text: string): number {
  let n = 0;
  BREAK_RE.lastIndex = 0;
  while (BREAK_RE.exec(text)) n++;
  return n;
}

export type LineEndingKind = "none" | "LF" | "CRLF" | "CR" | "other" | "mixed";

/**
 * Which line-ending convention the text uses. "other" means only vertical tabs, form
 * feeds, NEL or Unicode separators; any combination of two kinds is "mixed".
 */
export function detectLineEndings(text: string): LineEndingKind {
  const kinds = new Set<string>();
  const re = /\r\n|\n|\r|[\u000B\u000C\u0085\u2028\u2029]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    kinds.add(m[0] === "\r\n" ? "CRLF" : m[0] === "\n" ? "LF" : m[0] === "\r" ? "CR" : "other");
    if (kinds.size > 1) return "mixed";
  }
  if (kinds.size === 0) return "none";
  return [...kinds][0] as LineEndingKind;
}

/** Turn the text typed in the separator box into the real separator (`\t` = tab). */
export function decodeSeparator(raw: string): string {
  return raw.replace(/\\t/g, "\t");
}

/**
 * Characters as a person counts them: Unicode code points, so an emoji counts once
 * (String.length would count most emoji twice). A CRLF pair still counts as two.
 */
export function countChars(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    // Skip the low half of a valid surrogate pair; the high half was already counted.
    if (c >= 0xdc00 && c <= 0xdfff && i > 0) {
      const prev = text.charCodeAt(i - 1);
      if (prev >= 0xd800 && prev <= 0xdbff) continue;
    }
    n++;
  }
  return n;
}

/** Decode a text file, honoring UTF-16 byte-order marks (Windows Notepad's "Unicode"); UTF-8 otherwise. */
export function decodeTextFile(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes);
  return new TextDecoder("utf-8").decode(bytes);
}

export function isListLine(line: string): boolean {
  return LIST_RE.test(line);
}

const isBlank = (line: string) => line.trim() === "";

/** Join already-cleaned lines with `sep`, honoring the list and hyphen options. */
function joinLines(lines: string[], sep: string, o: Options): string {
  const parts: string[] = [];
  const trimJunction = o.collapseSpaces && sep !== "";
  const sepStartsWithSpace = /^\s/.test(sep);
  const sepEndsWithSpace = /\s$/.test(sep);
  for (let line of lines) {
    if (parts.length === 0) {
      parts.push(line);
      continue;
    }
    const last = parts.length - 1;
    if (o.keepLists && isListLine(line)) {
      parts[last] = parts[last].replace(TRAILING_SPACE_RE, "");
      parts.push("\n", line);
      continue;
    }
    if (o.fixHyphens) {
      const prev = parts[last].replace(TRAILING_SPACE_RE, "");
      const next = line.replace(LEADING_SPACE_RE, "");
      if (HYPHEN_END_RE.test(prev) && LOWER_START_RE.test(next)) {
        parts[last] = prev.slice(0, -1) + next;
        continue;
      }
    }
    if (trimJunction) {
      if (sepStartsWithSpace) parts[last] = parts[last].replace(TRAILING_SPACE_RE, "");
      if (sepEndsWithSpace) line = line.replace(LEADING_SPACE_RE, "");
    }
    parts.push(sep, line);
  }
  return parts.join("");
}

/** Remove line breaks from `input` according to `o`. Pure and deterministic. */
export function removeLineBreaks(input: string, o: Options): string {
  if (!input) return "";
  let lines = input.split(BREAK_RE);
  if (o.trimLines) lines = lines.map((l) => l.trim());
  if (o.collapseSpaces) lines = lines.map((l) => l.replace(SPACE_RUN_RE, " "));

  // A trailing newline (or leading blank lines) never produces a separator.
  let start = 0;
  let end = lines.length;
  while (start < end && isBlank(lines[start])) start++;
  while (end > start && isBlank(lines[end - 1])) end--;
  lines = lines.slice(start, end);
  if (!lines.length) return "";

  let out: string;
  if (o.mode === "paragraphs") {
    const paragraphs: string[][] = [];
    let current: string[] = [];
    for (const line of lines) {
      if (isBlank(line)) {
        if (current.length) paragraphs.push(current);
        current = [];
      } else current.push(line);
    }
    if (current.length) paragraphs.push(current);
    out = paragraphs.map((p) => joinLines(p, " ", o)).join("\n\n");
  } else {
    if (o.removeEmptyLines) lines = lines.filter((l) => !isBlank(l));
    const sep = o.mode === "spaces" ? " " : o.mode === "none" ? "" : decodeSeparator(o.separator);
    out = joinLines(lines, sep, o);
  }

  // Blank lines kept in "spaces" mode can leave double spaces behind; tidy them.
  if (o.collapseSpaces && (o.mode === "spaces" || o.mode === "paragraphs")) out = out.replace(SPACE_RUN_RE, " ");
  if (o.lineEnding === "crlf") out = out.replace(/\n/g, "\r\n");
  return out;
}

export interface Summary {
  breaksBefore: number;
  breaksAfter: number;
  removed: number;
  charsBefore: number;
  charsAfter: number;
  linesBefore: number;
  linesAfter: number;
  paragraphs: number;
  endings: LineEndingKind;
}

export function summarize(input: string, output: string): Summary {
  const breaksBefore = countLineBreaks(input);
  const breaksAfter = countLineBreaks(output);
  return {
    breaksBefore,
    breaksAfter,
    removed: Math.max(0, breaksBefore - breaksAfter),
    charsBefore: countChars(input),
    charsAfter: countChars(output),
    linesBefore: input ? breaksBefore + 1 : 0,
    linesAfter: output ? breaksAfter + 1 : 0,
    paragraphs: input.trim() ? input.split(/(?:\r\n|[\n\r\u000B\u000C\u0085\u2028\u2029])[ \t\u00A0]*(?:\r\n|[\n\r\u000B\u000C\u0085\u2028\u2029])/).filter((p) => p.trim()).length : 0,
    endings: detectLineEndings(input),
  };
}

/* ------------------------------------------------------------------ */
/* UI                                                                   */
/* ------------------------------------------------------------------ */

const MODES: { value: Mode; label: string; description: string }[] = [
  { value: "spaces", label: "Remove all line breaks", description: "Join every line with a single space." },
  { value: "paragraphs", label: "Keep paragraphs", description: "Fix wrapped lines, keep blank-line paragraph breaks." },
  { value: "custom", label: "Replace with…", description: "Join lines with a comma, pipe, tab or any text." },
  { value: "none", label: "One line, no spaces", description: "Glue lines together with nothing in between." },
];

const SEPARATOR_PRESETS: { label: string; value: string }[] = [
  { label: "Comma + space", value: ", " },
  { label: "Comma", value: "," },
  { label: "Semicolon", value: "; " },
  { label: "Pipe", value: " | " },
  { label: "Tab", value: "\\t" },
  { label: "<br>", value: "<br>" },
];

const ENDING_LABEL: Record<LineEndingKind, string> = {
  none: "None",
  LF: "LF (Unix/Mac)",
  CRLF: "CRLF (Windows)",
  CR: "CR (old Mac)",
  other: "Other",
  mixed: "Mixed",
};

const LARGE_INPUT = 1_000_000;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

const SAMPLE = `Thanks for sending the quarterly figures. I had a look this
morning and the numbers mostly line up with what we saw in the
dashboard, with two exceptions that are worth a closer look be-
fore Friday's call.

The things I would like us to check:
- the refund total for the March promotion
- the currency rounding on the EU invoices
- whether the late payments were counted twice

Once those are confirmed I am happy to sign off on the report and
send it to the board.`;

/** Show a separator with visible whitespace, e.g. ", " -> ",␣". */
function visibleSeparator(raw: string): string {
  const sep = decodeSeparator(raw);
  if (!sep) return "(nothing)";
  return sep.replace(/ /g, "␣").replace(/\t/g, "⇥");
}

export default function RemoveLineBreaks() {
  // The draft lives in this tab's session storage; preferences persist across visits.
  const [text, setText] = usePersistentState("remove-line-breaks:text", "");
  const [saved, setSaved] = usePersistentState<Partial<Options>>("remove-line-breaks:options", DEFAULT_OPTIONS, { storage: "local" });
  const [fileError, setFileError] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const merged: Options = { ...DEFAULT_OPTIONS, ...saved };
  // Guard against a stored value from an older version (unknown mode or line ending).
  const options: Options = {
    ...merged,
    mode: MODES.some((m) => m.value === merged.mode) ? merged.mode : DEFAULT_OPTIONS.mode,
    lineEnding: merged.lineEnding === "crlf" ? "crlf" : "lf",
    separator: typeof merged.separator === "string" ? merged.separator : DEFAULT_OPTIONS.separator,
  };
  const set = <K extends keyof Options>(key: K, value: Options[K]) => setSaved((prev) => ({ ...DEFAULT_OPTIONS, ...prev, [key]: value }));

  // Keep typing responsive on very large inputs. The options are deferred as a string so
  // an equal-but-new object on every render does not schedule extra background renders.
  const deferredText = useDeferredValue(text);
  const optionsKey = useDeferredValue(JSON.stringify(options));

  const output = useMemo(
    () => removeLineBreaks(deferredText, JSON.parse(optionsKey) as Options),
    [deferredText, optionsKey],
  );
  const stats = useMemo(() => summarize(deferredText, output), [deferredText, output]);

  const hasText = text.length > 0;
  const isParagraphs = options.mode === "paragraphs";
  const isCustom = options.mode === "custom";

  const modeIndex = Math.max(0, MODES.findIndex((m) => m.value === options.mode));
  const modeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Radio-group keyboard pattern: arrow keys move the selection, Tab leaves the group.
  const onModeKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (modeIndex + step + MODES.length) % MODES.length;
    set("mode", MODES[next].value);
    modeRefs.current[next]?.focus();
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES, 0)} – split the file and process it in parts.`);
      return;
    }
    try {
      const content = decodeTextFile(new Uint8Array(await file.arrayBuffer()));
      if (content.slice(0, 8000).includes("\u0000")) {
        setFileError(`${file.name} does not look like plain text. Open it in its own app, copy the text and paste it here instead.`);
        return;
      }
      setFileError(null);
      setText(content);
    } catch {
      setFileError(`${file.name} could not be read.`);
    }
  };

  return (
    <ToolPanel>
      <ToolSection title="What should happen to the line breaks?">
        <div role="radiogroup" aria-label="Mode" onKeyDown={onModeKey} className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {MODES.map((m, i) => {
            const active = i === modeIndex;
            return (
              <button
                key={m.value}
                ref={(el) => {
                  modeRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => set("mode", m.value)}
                className={cn(
                  "flex flex-col gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:py-2.5",
                  active ? "border-primary/40 bg-primary-soft" : "border-border bg-surface-2 hover:border-border-strong",
                )}
              >
                <span className={cn("text-sm font-semibold", active ? "text-primary" : "text-fg")}>{m.label}</span>
                <span className="sr-only text-xs text-muted sm:not-sr-only">{m.description}</span>
              </button>
            );
          })}
        </div>

        {isCustom && (
          <div className="flex flex-col gap-2">
            <Input
              label="Replace each line break with"
              value={options.separator}
              onChange={(e) => set("separator", e.target.value)}
              placeholder="e.g. , or ; or |"
              hint={`Spaces count. Type \\t for a tab. Current separator: ${visibleSeparator(options.separator)}`}
              inputSize="sm"
              spellCheck={false}
              className="font-mono"
            />
            <div className="flex flex-wrap gap-1.5" aria-label="Separator presets">
              {SEPARATOR_PRESETS.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant={options.separator === p.value ? "outline" : "ghost"}
                  aria-pressed={options.separator === p.value}
                  onClick={() => set("separator", p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </ToolSection>

      <ToolGrid>
        <div className="flex min-w-0 flex-col gap-2">
          <Textarea
            ref={inputRef}
            label="Text with line breaks"
            labelAddon={`${formatNumber(stats.linesBefore)} lines · ${formatNumber(stats.charsBefore)} chars`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text copied from a PDF, email, terminal or OCR scan…"
            rows={12}
            spellCheck={false}
          />
          <ToolActions>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ClipboardPaste className="h-4 w-4" aria-hidden />}
              onClick={async () => {
                try {
                  setText(await navigator.clipboard.readText());
                  setPasteError(false);
                } catch {
                  setPasteError(true);
                }
                inputRef.current?.focus();
              }}
            >
              Paste
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<FileUp className="h-4 w-4" aria-hidden />} onClick={() => fileRef.current?.click()}>
              Open .txt
            </Button>
            <input ref={fileRef} type="file" accept=".txt,.md,.csv,.tsv,.log,.srt,.text,text/plain" className="sr-only" aria-label="Open a text file" tabIndex={-1} onChange={onFile} />
            <Button variant="ghost" size="sm" leftIcon={<Sparkles className="h-4 w-4" aria-hidden />} onClick={() => setText(SAMPLE)}>
              Example
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Eraser className="h-4 w-4" aria-hidden />}
              onClick={() => {
                setText("");
                setFileError(null);
                setPasteError(false);
              }}
              disabled={!hasText}
            >
              Clear
            </Button>
          </ToolActions>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <ResultBox
            label="Result"
            value={output}
            rows={12}
            placeholder="Your text without line breaks appears here as you type."
            actions={
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" aria-hidden />}
                disabled={!output}
                onClick={() => downloadText(output, "text-without-line-breaks.txt")}
              >
                Download
              </Button>
            }
          />
          <ToolActions>
            <Button variant="ghost" size="sm" leftIcon={<ArrowUp className="h-4 w-4" aria-hidden />} disabled={!output || output === text} onClick={() => setText(output)}>
              Use result as input
            </Button>
          </ToolActions>
        </div>
      </ToolGrid>

      {fileError && <Alert variant="error" title="File not loaded">{fileError}</Alert>}
      {pasteError && (
        <Alert variant="warning" title="Clipboard access was blocked">
          Your browser did not allow this page to read the clipboard. Click in the text box and press Ctrl+V (⌘V on a Mac) instead.
        </Alert>
      )}
      {hasText && deferredText.length > LARGE_INPUT && (
        <Alert variant="info" title="Large text">
          {formatNumber(deferredText.length)} characters are being processed on your device. The result may take a moment to refresh after each change.
        </Alert>
      )}
      {hasText && stats.breaksBefore === 0 && (
        <Alert variant="info" title="No line breaks found">
          This text is already on one line, so there is nothing to remove.
          {output !== deferredText ? " Spaces were still tidied according to your options." : ""}
        </Alert>
      )}
      {hasText && isParagraphs && stats.breaksBefore > 0 && stats.paragraphs <= 1 && (
        <Alert variant="info" title="No blank lines, so no paragraphs to keep">
          Paragraphs are detected by empty lines between them. Your text has none, so it was joined into a single paragraph. If your paragraphs are separated by a single line break, there is no reliable way to tell them apart
          from wrapped lines – add an empty line where each paragraph should start and the result updates instantly.
        </Alert>
      )}
      {isCustom && decodeSeparator(options.separator) === "" && hasText && (
        <Alert variant="warning">The separator is empty, so lines are glued together with nothing between them.</Alert>
      )}

      <StatGrid>
        <Stat label="Line breaks removed" value={formatNumber(stats.removed)} hint={`${formatNumber(stats.breaksBefore)} before · ${formatNumber(stats.breaksAfter)} after`} emphasis />
        <Stat label="Lines" value={`${formatNumber(stats.linesBefore)} → ${formatNumber(stats.linesAfter)}`} hint={`${formatNumber(stats.paragraphs)} paragraph${stats.paragraphs === 1 ? "" : "s"} in input`} />
        <Stat
          label="Characters"
          value={`${formatNumber(stats.charsBefore)} → ${formatNumber(stats.charsAfter)}`}
          hint={
            !stats.charsBefore
              ? undefined
              : stats.charsBefore === stats.charsAfter
                ? "Same length"
                : `${stats.charsBefore > stats.charsAfter ? "−" : "+"}${formatNumber(Math.abs(stats.charsBefore - stats.charsAfter))} characters`
          }
        />
        <Stat
          label="Input line endings"
          value={ENDING_LABEL[stats.endings]}
          hint={
            stats.endings === "other"
              ? "Vertical tab, form feed or Unicode separator"
              : stats.endings === "CRLF" || stats.endings === "mixed"
                ? "Handled automatically"
                : undefined
          }
        />
      </StatGrid>

      <ToolSection title="Options" description="Changes apply instantly and are remembered on this device.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle checked={options.collapseSpaces} onChange={(v) => set("collapseSpaces", v)} label="Collapse multiple spaces" description="Turn runs of spaces and tabs into a single space." />
          <Toggle checked={options.trimLines} onChange={(v) => set("trimLines", v)} label="Trim each line" description="Strip spaces and tabs at the start and end of every line first." />
          <Toggle
            checked={isParagraphs || options.removeEmptyLines}
            onChange={(v) => set("removeEmptyLines", v)}
            disabled={isParagraphs}
            label="Remove empty lines"
            description={isParagraphs ? "Paragraph mode uses empty lines as paragraph breaks and keeps exactly one." : "Skip blank lines so they do not create double separators."}
          />
          <Toggle
            checked={options.keepLists}
            onChange={(v) => set("keepLists", v)}
            label="Keep list items on their own line"
            description="Lines starting with -, *, •, 1. or a) keep the line break before them."
          />
          <Toggle
            checked={options.fixHyphens}
            onChange={(v) => set("fixHyphens", v)}
            label="Rejoin hyphenated words"
            description="“exam-” + “ple” becomes “example” when a line ends in a hyphen."
          />
          <Select
            label="Line breaks in the result"
            selectSize="sm"
            value={options.lineEnding}
            onChange={(e) => set("lineEnding", e.target.value as LineEnding)}
            hint="Applies to the paragraph and list breaks that are kept."
            options={[
              { value: "lf", label: "LF – macOS, Linux, web" },
              { value: "crlf", label: "CRLF – Windows (Notepad, CSV)" },
            ]}
          />
        </div>
      </ToolSection>
    </ToolPanel>
  );
}
