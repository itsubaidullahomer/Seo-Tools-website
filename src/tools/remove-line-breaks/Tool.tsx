"use client";

import { useDeferredValue, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { ArrowUp, ClipboardPaste, Download, Eraser, FileUp, Sparkles } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  Alert,
  Button,
  CopyButton,
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
import {
  DEFAULT_OPTIONS,
  decodeSeparator,
  decodeTextFile,
  removeLineBreaks,
  summarize,
  type LineEnding,
  type LineEndingKind,
  type Mode,
  type Options,
} from "./logic";

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

const ENDING_LABEL: Record<LineEndingKind, { value: string; hint?: string }> = {
  none: { value: "None" },
  LF: { value: "LF", hint: "macOS, Linux, or a paste" },
  CRLF: { value: "CRLF", hint: "Windows – handled automatically" },
  CR: { value: "CR", hint: "Classic Mac OS" },
  other: { value: "Other", hint: "Vertical tab, form feed or Unicode separator" },
  mixed: { value: "Mixed", hint: "Several kinds – all handled" },
};

const LARGE_INPUT = 1_000_000;
/** Laying out millions of characters in a textarea freezes the tab for seconds, so huge results show a preview. */
const PREVIEW_LIMIT = 200_000;
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
  const truncated = output.length > PREVIEW_LIMIT;
  const preview = truncated ? output.slice(0, PREVIEW_LIMIT) : output;

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
            value={preview}
            rows={12}
            placeholder="Your text without line breaks appears here as you type."
            copy={false}
            actions={
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Download className="h-4 w-4" aria-hidden />}
                  disabled={!output}
                  onClick={() => downloadText(output, "text-without-line-breaks.txt")}
                >
                  Download
                </Button>
                <CopyButton text={output} size="sm" variant="secondary" disabled={!output} />
              </>
            }
          />
          {truncated && (
            <p className="text-xs text-muted">
              Showing the first {formatNumber(PREVIEW_LIMIT)} of {formatNumber(output.length)} characters to keep the page responsive. Copy and Download include the full result.
            </p>
          )}
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
          value={ENDING_LABEL[stats.endings].value}
          hint={ENDING_LABEL[stats.endings].hint}
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
