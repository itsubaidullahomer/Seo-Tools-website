"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { ArrowUp, Check, ClipboardPaste, Copy, Download, Eraser, FileUp, Sparkles } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Button, CopyButton, ResultBox, Select, Stat, StatGrid, Textarea, Toggle, ToolActions, ToolGrid, ToolPanel, ToolSection } from "@/components/ui";
import { cn, downloadText, formatBytes, formatNumber } from "@/lib/utils";
import {
  DEFAULT_OPTIONS,
  copiesRemoved,
  decodeTextFile,
  dedupeLines,
  lineNumberText,
  normalizeOptions,
  reportToCsv,
  reportToTsv,
  type BlankHandling,
  type Keep,
  type LineEnding,
  type Mode,
  type Options,
} from "./logic";

const MODES: { value: Mode; label: string; description: string }[] = [
  { value: "dedupe", label: "Remove duplicates", description: "Keep one copy of every line." },
  { value: "duplicates", label: "Duplicates only", description: "List each repeated line once." },
  { value: "unique", label: "Unique only", description: "Drop every line that repeats." },
];

const DOWNLOAD_NAME: Record<Mode, string> = {
  dedupe: "deduplicated-list.txt",
  duplicates: "duplicate-lines.txt",
  unique: "unique-only-lines.txt",
};

const LARGE_INPUT = 1_000_000;
/** Laying out millions of characters in a textarea freezes the tab for seconds, so huge results show a preview. */
const PREVIEW_LIMIT = 100_000;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
/** Rows drawn in the report table; copy and download always include every row. */
const REPORT_ROWS = 200;
const REPORT_LINE_NUMBERS = 8;

const SAMPLE = ["apple", "Banana", "apple ", "cherry", "", "banana", "Apple", "cherry", "cherry", "date"].join("\n");

/** Make edge whitespace visible in the report, e.g. "apple " -> "apple␣". */
function visibleEdges(text: string): string {
  return text.replace(/^[ \t]+|[ \t]+$/g, (m) => m.replace(/ /g, "␣").replace(/\t/g, "⇥"));
}

/** Copy button that builds its text only when clicked, so large reports cost nothing while you type. */
function CopyOnDemandButton({ getText, label }: { getText: () => string; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <Button
      size="sm"
      variant="secondary"
      aria-live="polite"
      leftIcon={copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      onClick={async () => {
        const text = getText();
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Fallback for older browsers and insecure contexts.
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
      }}
    >
      {copied ? "Copied!" : label}
    </Button>
  );
}

export default function RemoveDuplicateLines() {
  // The list lives in this tab's session storage; the options persist across visits.
  const [text, setText] = usePersistentState("remove-duplicate-lines:text", "");
  const [saved, setSaved] = usePersistentState<Partial<Options>>("remove-duplicate-lines:options", DEFAULT_OPTIONS, { storage: "local" });
  const [fileError, setFileError] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => normalizeOptions(saved), [saved]);
  const set = <K extends keyof Options>(key: K, value: Options[K]) => setSaved((prev) => ({ ...normalizeOptions(prev), [key]: value }));

  // Keep typing responsive on very large lists: the heavy work runs on deferred copies.
  const deferredText = useDeferredValue(text);
  const optionsKey = useDeferredValue(JSON.stringify(options));
  const result = useMemo(() => dedupeLines(deferredText, JSON.parse(optionsKey) as Options), [deferredText, optionsKey]);
  const mode = (JSON.parse(optionsKey) as Options).mode;

  const truncated = result.output.length > PREVIEW_LIMIT;
  const preview = truncated ? result.output.slice(0, PREVIEW_LIMIT) : result.output;
  const shownReport = useMemo(() => result.report.slice(0, REPORT_ROWS), [result.report]);
  const showRemovedColumn = mode !== "duplicates";

  const hasText = text.length > 0;
  const blankValue: BlankHandling = options.mode !== "dedupe" && options.blank === "keep" ? "remove" : options.blank;

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

  const loadFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES, 0)} – split the file and process it in parts.`);
      return;
    }
    try {
      const content = decodeTextFile(new Uint8Array(await file.arrayBuffer()));
      if (content.slice(0, 8000).includes("\u0000")) {
        setFileError(`${file.name} does not look like plain text. Open it in its own app, copy the lines and paste them here instead.`);
        return;
      }
      setFileError(null);
      setText(content);
    } catch {
      setFileError(`${file.name} could not be read.`);
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await loadFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (Array.from(e.dataTransfer.types).includes("Files")) e.preventDefault();
  };
  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    e.preventDefault();
    await loadFile(file);
  };

  const noRepeats = result.linesIn > 0 && result.distinctLines > 0 && result.repeatedLines === 0;
  const onlyBlank = result.linesIn > 0 && result.distinctLines === 0;
  const allRepeated = mode === "unique" && result.repeatedLines > 0 && result.linesOut === 0;

  return (
    <ToolPanel>
      <ToolSection title="What do you want to do with the duplicates?">
        <div role="radiogroup" aria-label="Mode" onKeyDown={onModeKey} className="grid grid-cols-3 gap-2">
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
      </ToolSection>

      <ToolGrid>
        <div className="flex min-w-0 flex-col gap-2" onDragOver={onDragOver} onDrop={onDrop}>
          <Textarea
            ref={inputRef}
            label="Your list (one item per line)"
            labelAddon={`${formatNumber(result.linesIn)} lines`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a list here, or drop a .txt file. Emails, keywords, URLs, log lines – anything with one item per line."
            rows={12}
            mono
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
            <input ref={fileRef} type="file" accept=".txt,.csv,.tsv,.log,.md,.list,.text,text/plain" className="sr-only" aria-label="Open a text file" tabIndex={-1} onChange={onFile} />
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
            value={preview}
            rows={12}
            mono
            placeholder="Your list without duplicates appears here as you type."
            copy={false}
            actions={
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Download className="h-4 w-4" aria-hidden />}
                  disabled={!result.output}
                  onClick={() => downloadText(result.output, DOWNLOAD_NAME[mode])}
                >
                  Download
                </Button>
                <CopyButton text={result.output} size="sm" variant="secondary" disabled={!result.output} />
              </>
            }
          />
          {truncated && (
            <p className="text-xs text-muted">
              Showing the first {formatNumber(PREVIEW_LIMIT)} of {formatNumber(result.output.length)} characters to keep the page responsive. Copy and Download include the full result.
            </p>
          )}
          <ToolActions>
            <Button variant="ghost" size="sm" leftIcon={<ArrowUp className="h-4 w-4" aria-hidden />} disabled={!result.output || result.output === text} onClick={() => setText(result.output)}>
              Use result as input
            </Button>
            <span className="text-xs text-muted">
              Need it sorted? Try the <Link href="/tools/alphabetical-order" className="font-medium text-primary underline-offset-2 hover:underline">alphabetical order tool</Link>.
            </span>
          </ToolActions>
        </div>
      </ToolGrid>

      {fileError && (
        <Alert variant="error" title="File not loaded">
          {fileError}
        </Alert>
      )}
      {pasteError && (
        <Alert variant="warning" title="Clipboard access was blocked">
          Your browser did not allow this page to read the clipboard. Click in the text box and press Ctrl+V (⌘V on a Mac) instead.
        </Alert>
      )}
      {hasText && deferredText.length > LARGE_INPUT && (
        <Alert variant="info" title="Large list">
          {formatNumber(deferredText.length)} characters are being processed on your device. The result may take a moment to refresh after each change.
        </Alert>
      )}
      {noRepeats && (
        <Alert variant="info" title="No duplicates found">
          {options.adjacentOnly
            ? "Only lines directly next to each other are compared. Turn off “Only compare neighboring lines” to find repeats anywhere in the list."
            : "Every line is unique with the current settings. Lines that differ only in capitalization, spacing or accents count as different lines, so try the options below if you expect matches."}
        </Alert>
      )}
      {onlyBlank && (
        <Alert variant="info" title="Only empty lines">
          The list contains nothing but empty lines, so there is nothing to compare.
        </Alert>
      )}
      {allRepeated && (
        <Alert variant="info" title="Nothing is unique">
          Every line appears more than once, so no unique lines are left. Switch to “Remove duplicates” to keep one copy of each.
        </Alert>
      )}

      <StatGrid>
        <Stat label="Lines in" value={formatNumber(result.linesIn)} />
        <Stat label="Lines out" value={formatNumber(result.linesOut)} />
        <Stat
          label="Removed"
          value={formatNumber(result.removed)}
          emphasis
          hint={
            result.linesIn === 0
              ? undefined
              : `${formatNumber(result.filtered)} ${mode === "dedupe" ? (result.filtered === 1 ? "duplicate" : "duplicates") : "filtered out"}${
                  result.emptyRemoved ? ` · ${formatNumber(result.emptyRemoved)} empty` : ""
                }`
          }
        />
        <Stat label="Repeated lines" value={formatNumber(result.repeatedLines)} hint={result.linesIn ? `of ${formatNumber(result.distinctLines)} distinct` : undefined} />
      </StatGrid>

      <ToolSection title="Options" description="Changes apply instantly and are remembered on this device.">
        <p className="label-mono">How lines are compared</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle
            checked={options.caseSensitive}
            onChange={(v) => set("caseSensitive", v)}
            label="Case-sensitive"
            description="On: Apple and apple are different lines. Off: they count as duplicates."
          />
          <Toggle
            checked={options.trim}
            onChange={(v) => set("trim", v)}
            label="Trim spaces before comparing"
            description="Ignore spaces and tabs at the start and end of each line."
          />
          <Toggle
            checked={options.trim && options.trimOutput}
            onChange={(v) => set("trimOutput", v)}
            disabled={!options.trim}
            label="Trim spaces in the result too"
            description="Remove them from the lines you keep. Turn off to keep indentation."
          />
          <Toggle
            checked={options.collapseSpaces}
            onChange={(v) => set("collapseSpaces", v)}
            label="Ignore extra spaces inside lines"
            description="“a  b” and “a b” count as the same line."
          />
          <Toggle
            checked={options.ignoreAccents}
            onChange={(v) => set("ignoreAccents", v)}
            label="Ignore accents"
            description="“café” and “cafe” count as the same line."
          />
          <Toggle
            checked={options.ignoreInvisible}
            onChange={(v) => set("ignoreInvisible", v)}
            label="Ignore invisible characters"
            description="Zero-width spaces, soft hyphens and byte order marks copied from web pages."
          />
        </div>

        <p className="label-mono mt-1">Which lines are kept</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Keep which copy"
            selectSize="sm"
            value={options.keep}
            disabled={options.mode === "unique"}
            onChange={(e) => set("keep", e.target.value as Keep)}
            hint={options.mode === "unique" ? "Not used here: every line that is kept appears only once." : "The kept line stays at the position of the copy you choose."}
            options={[
              { value: "first", label: "First occurrence" },
              { value: "last", label: "Last occurrence" },
            ]}
          />
          <Select
            label="Empty lines"
            selectSize="sm"
            value={blankValue}
            onChange={(e) => set("blank", e.target.value as BlankHandling)}
            hint="Lines with only spaces count as empty."
            options={[
              { value: "remove", label: "Remove them" },
              { value: "dedupe", label: "Treat like any other line (keep one)" },
              { value: "keep", label: "Leave them where they are", disabled: options.mode !== "dedupe" },
            ]}
          />
          <Toggle
            checked={options.adjacentOnly}
            onChange={(v) => set("adjacentOnly", v)}
            label="Only compare neighboring lines"
            description="Remove back-to-back repeats only, like the uniq command. Off: find duplicates anywhere in the list."
          />
          <Select
            label="Line endings in the result"
            selectSize="sm"
            value={options.lineEnding}
            onChange={(e) => set("lineEnding", e.target.value as LineEnding)}
            hint="Applies to Copy and Download."
            options={[
              { value: "auto", label: "Same as the input" },
              { value: "lf", label: "LF – macOS, Linux, web" },
              { value: "crlf", label: "CRLF – Windows" },
            ]}
          />
        </div>
      </ToolSection>

      <ToolSection
        title={mode === "duplicates" ? "Repeated lines" : "Removed lines"}
        description={
          mode === "duplicates"
            ? "Every line that appeared more than once, and how often. Line numbers refer to your input."
            : "Every line that appeared more than once, how often, and how many copies were removed. Line numbers refer to your input."
        }
      >
        {result.report.length > 0 ? (
          <>
            <ToolActions>
              <CopyOnDemandButton label="Copy report" getText={() => reportToTsv(result.report, mode)} />
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" aria-hidden />}
                onClick={() => downloadText(reportToCsv(result.report, mode), "duplicate-lines-report.csv", "text/csv;charset=utf-8")}
              >
                Download CSV
              </Button>
              <span className="text-xs text-muted">
                {formatNumber(result.report.length)} repeated line{result.report.length === 1 ? "" : "s"}
                {result.report.length > REPORT_ROWS ? ` – showing the ${formatNumber(REPORT_ROWS)} most frequent` : ""}
              </span>
            </ToolActions>
            <div className="max-h-[22rem] overflow-auto rounded-xl border border-border" data-testid="report">
              <table className="w-full min-w-[30rem] text-sm">
                <thead className="sticky top-0 bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Line
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Times found
                    </th>
                    {showRemovedColumn && (
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Copies removed
                      </th>
                    )}
                    <th scope="col" className="px-3 py-2 font-medium">
                      Found on lines
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shownReport.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono text-[13px] text-fg [overflow-wrap:anywhere]">
                        {r.text === "" ? <span className="font-sans italic text-muted">(empty line)</span> : visibleEdges(r.text)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-fg-secondary">{formatNumber(r.count)}</td>
                      {showRemovedColumn && <td className="px-3 py-2 text-right tabular-nums text-fg-secondary">{formatNumber(copiesRemoved(r, mode))}</td>}
                      <td className="px-3 py-2 tabular-nums text-fg-secondary">{lineNumberText(r, REPORT_LINE_NUMBERS)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">{hasText ? "No line appears more than once, so there is nothing to report." : "Paste a list above and every repeated line will be listed here with its count."}</p>
        )}
      </ToolSection>
    </ToolPanel>
  );
}
