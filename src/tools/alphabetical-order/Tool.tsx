"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { ArrowUp, ClipboardPaste, Download, Eraser, FileUp, Shuffle, Sparkles } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Button, Checkbox, CopyButton, Input, ResultBox, Select, Stat, StatGrid, Tabs, Textarea, Toggle, ToolActions, ToolGrid, ToolPanel, ToolSection } from "@/components/ui";
import { cn, downloadText, formatBytes, formatNumber } from "@/lib/utils";
import {
  DEFAULT_OPTIONS,
  LOCALES,
  decodeTextFile,
  inputSeparatorFor,
  newSeed,
  normalizeOptions,
  sortList,
  suggestSeparator,
  type CaseMode,
  type Direction,
  type InputSeparator,
  type Options,
  type OutputSeparator,
  type SortBy,
} from "./logic";

const MODES: { value: SortBy; label: string; description: string }[] = [
  { value: "alpha", label: "Alphabetical", description: "A to Z or Z to A" },
  { value: "last", label: "Last name", description: "Sort people by surname" },
  { value: "length", label: "Length", description: "Shortest or longest first" },
  { value: "number", label: "Numbers", description: "By the first number in each line" },
  { value: "random", label: "Random", description: "Shuffle the list" },
  { value: "reverse", label: "Reverse", description: "Flip the current order" },
];

const DIRECTION_LABELS: Record<SortBy, [string, string] | null> = {
  alpha: ["A → Z", "Z → A"],
  last: ["A → Z", "Z → A"],
  length: ["Shortest first", "Longest first"],
  number: ["Lowest first", "Highest first"],
  random: null,
  reverse: null,
};

const INPUT_SEPARATORS: { value: InputSeparator; label: string }[] = [
  { value: "newline", label: "New line (one item per line)" },
  { value: "comma", label: "Comma" },
  { value: "semicolon", label: "Semicolon" },
  { value: "tab", label: "Tab" },
  { value: "space", label: "Space (sort the words)" },
  { value: "custom", label: "Custom separator…" },
];

const OUTPUT_SEPARATORS: { value: OutputSeparator; label: string }[] = [
  { value: "same", label: "Same as the input" },
  { value: "newline", label: "New line" },
  { value: "comma", label: "Comma (a,b,c)" },
  { value: "commaSpace", label: "Comma and space (a, b, c)" },
  { value: "semicolon", label: "Semicolon (a;b;c)" },
  { value: "semicolonSpace", label: "Semicolon and space (a; b; c)" },
  { value: "tab", label: "Tab" },
  { value: "space", label: "Space" },
  { value: "custom", label: "Custom separator…" },
];

const CASE_OPTIONS: { value: CaseMode; label: string }[] = [
  { value: "mixed", label: "Dictionary order (apple, then Apple)" },
  { value: "upperFirst", label: "Capitals first when words match (Apple, then apple)" },
  { value: "ignore", label: "Ignore capitals (keep my order)" },
  { value: "code", label: "Unicode order (every capital before a)" },
];

const SEPARATOR_NAMES: Record<InputSeparator, string> = {
  newline: "new lines",
  comma: "commas",
  semicolon: "semicolons",
  tab: "tabs",
  space: "spaces",
  custom: "your custom separator",
};

const LARGE_INPUT = 1_000_000;
/** Laying out millions of characters in a textarea freezes the tab for seconds, so huge results show a preview. */
const PREVIEW_LIMIT = 200_000;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

const SAMPLE_LIST = ["banana", "Zebra", "apple", "Élan", "item10", "The Great Gatsby", "item2", "Cherry", "An Inspector Calls", "item1", "apple"].join("\n");
const SAMPLE_NAMES = ["Ada Lovelace", "Grace Hopper", "Katherine Johnson", "Dr. Martin Luther King Jr.", "Ludwig van Beethoven", "Alan Turing", "Curie, Marie", "Maya Angelou"].join("\n");
const SAMPLE_NUMBERS = ["Invoice 1,250.50", "Invoice 98", "Refund -15", "Invoice 7.25", "Notes (no number here)", "Invoice 1,000"].join("\n");
const SAMPLES: Record<SortBy, string> = {
  alpha: SAMPLE_LIST,
  last: SAMPLE_NAMES,
  length: SAMPLE_LIST,
  number: SAMPLE_NUMBERS,
  random: SAMPLE_LIST,
  reverse: SAMPLE_LIST,
};

function orderSummary(o: Options): { value: string; hint: string } {
  const desc = o.direction === "desc";
  switch (o.sortBy) {
    case "alpha":
      return { value: desc ? "Z → A" : "A → Z", hint: "alphabetical" };
    case "last":
      return { value: desc ? "Z → A" : "A → Z", hint: "by last name" };
    case "length":
      return { value: desc ? "Long → short" : "Short → long", hint: "by length" };
    case "number":
      return { value: desc ? "High → low" : "Low → high", hint: "by first number" };
    case "random":
      return { value: "Random", hint: "shuffled" };
    case "reverse":
      return { value: "Reversed", hint: "last line first" };
  }
}

export default function AlphabeticalOrder() {
  // The list lives in this tab's session storage; the options persist across visits.
  const [text, setText] = usePersistentState("alphabetical-order:text", "");
  const [saved, setSaved] = usePersistentState<Partial<Options>>("alphabetical-order:options", DEFAULT_OPTIONS, { storage: "local" });
  const [seed, setSeed] = useState<number[]>(newSeed);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => normalizeOptions(saved), [saved]);
  const set = <K extends keyof Options>(key: K, value: Options[K]) => setSaved((prev) => ({ ...normalizeOptions(prev), [key]: value }));

  // Keep typing responsive on very large lists: the heavy work runs on deferred copies.
  const deferredText = useDeferredValue(text);
  const deferredOptions = useDeferredValue(options);
  const result = useMemo(() => sortList(deferredText, deferredOptions, seed), [deferredText, deferredOptions, seed]);
  const suggestion = useMemo(
    () => suggestSeparator(deferredText, deferredOptions.inputSep, deferredOptions.customInputSep),
    [deferredText, deferredOptions.inputSep, deferredOptions.customInputSep],
  );

  const truncated = result.output.length > PREVIEW_LIMIT;
  const preview = truncated ? result.output.slice(0, PREVIEW_LIMIT) : result.output;
  const hasText = text.length > 0;
  const removed = result.itemsIn - result.itemsOut;
  const order = orderSummary(deferredOptions);
  const codeOrder = options.caseMode === "code";
  const directionLabels = DIRECTION_LABELS[options.sortBy];
  const outputIsCustom = options.outputSep === "custom" || (options.outputSep === "same" && options.inputSep === "custom");

  const modeIndex = Math.max(0, MODES.findIndex((m) => m.value === options.sortBy));
  const modeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const chooseMode = (value: SortBy) => {
    if (value === "random" && options.sortBy !== "random") setSeed(newSeed());
    set("sortBy", value);
  };

  // Radio-group keyboard pattern: arrow keys move the selection, Tab leaves the group.
  const onModeKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (modeIndex + step + MODES.length) % MODES.length;
    chooseMode(MODES[next].value);
    modeRefs.current[next]?.focus();
  };

  const loadFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_BYTES, 0)} – split the file and sort it in parts.`);
      return;
    }
    try {
      const content = decodeTextFile(new Uint8Array(await file.arrayBuffer()));
      if (content.slice(0, 8000).includes(String.fromCharCode(0))) {
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

  const useResultAsInput = () => {
    setText(result.output);
    setSaved((prev) => {
      const current = normalizeOptions(prev);
      return {
        ...current,
        inputSep: inputSeparatorFor(current.outputSep, current.inputSep),
        customInputSep: current.outputSep === "custom" ? current.customOutputSep : current.customInputSep,
      };
    });
  };

  const emptyCustom = options.inputSep === "custom" && options.customInputSep === "" && hasText;

  return (
    <ToolPanel>
      <ToolSection title="Sort by" className="border-t-0 pt-0">
        <div role="radiogroup" aria-label="Sort by" onKeyDown={onModeKey} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                onClick={() => chooseMode(m.value)}
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

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {directionLabels ? (
            <div className="flex items-center gap-2.5">
              <span className="label-mono">Order</span>
              <Tabs<Direction>
                label="Sort direction"
                size="sm"
                value={options.direction}
                onChange={(v) => set("direction", v)}
                options={[
                  { value: "asc", label: directionLabels[0] },
                  { value: "desc", label: directionLabels[1] },
                ]}
              />
            </div>
          ) : options.sortBy === "random" ? (
            <Button variant="secondary" size="sm" leftIcon={<Shuffle className="h-4 w-4" aria-hidden />} onClick={() => setSeed(newSeed())}>
              Shuffle again
            </Button>
          ) : (
            <p className="text-xs text-muted">Reverse flips the list as it is, without sorting it.</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Checkbox checked={options.removeDuplicates} onChange={(v) => set("removeDuplicates", v)} label="Remove duplicates (ignores capitals)" />
            <Link href="/tools/remove-duplicate-lines" className="text-xs font-medium text-primary underline-offset-2 hover:underline">
              Full duplicate remover
            </Link>
          </div>
        </div>
      </ToolSection>

      <ToolGrid>
        <div className="flex min-w-0 flex-col gap-2" onDragOver={onDragOver} onDrop={onDrop}>
          <Textarea
            ref={inputRef}
            label="Your list"
            labelAddon={`${formatNumber(result.itemsIn)} ${result.itemsIn === 1 ? "item" : "items"}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your list here, one item per line – or drop a .txt file. Names, words, references, URLs, anything you want in order."
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
            <Button variant="ghost" size="sm" leftIcon={<Sparkles className="h-4 w-4" aria-hidden />} onClick={() => setText(SAMPLES[options.sortBy])}>
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
          <Select
            label="Items are separated by"
            selectSize="sm"
            value={options.inputSep}
            onChange={(e) => set("inputSep", e.target.value as InputSeparator)}
            options={INPUT_SEPARATORS}
          />
          {options.inputSep === "custom" && (
            <Input
              label="Custom input separator"
              inputSize="sm"
              value={options.customInputSep}
              onChange={(e) => set("customInputSep", e.target.value)}
              placeholder="for example | or //"
              hint="Type \n for a line break and \t for a tab."
              spellCheck={false}
              autoComplete="off"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <ResultBox
            label="Sorted list"
            value={preview}
            rows={12}
            mono
            placeholder="Your sorted list appears here as you type."
            copy={false}
            actions={
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Download className="h-4 w-4" aria-hidden />}
                  disabled={!result.output}
                  onClick={() => downloadText(result.output, "sorted-list.txt")}
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
            <Button variant="ghost" size="sm" leftIcon={<ArrowUp className="h-4 w-4" aria-hidden />} disabled={!result.output || result.output === text} onClick={useResultAsInput}>
              Use result as input
            </Button>
            {options.sortBy === "random" && (
              <Button variant="ghost" size="sm" leftIcon={<Shuffle className="h-4 w-4" aria-hidden />} onClick={() => setSeed(newSeed())}>
                Shuffle again
              </Button>
            )}
          </ToolActions>
          <Select
            label="Join the sorted items with"
            selectSize="sm"
            value={options.outputSep}
            onChange={(e) => set("outputSep", e.target.value as OutputSeparator)}
            options={OUTPUT_SEPARATORS}
          />
          {options.outputSep === "custom" && (
            <Input
              label="Custom output separator"
              inputSize="sm"
              value={options.customOutputSep}
              onChange={(e) => set("customOutputSep", e.target.value)}
              placeholder="for example  |  or  / "
              hint="Type \n for a line break and \t for a tab."
              spellCheck={false}
              autoComplete="off"
            />
          )}
          {outputIsCustom && options.outputSep === "same" && <p className="text-xs text-muted">The result uses the same custom separator you typed for the input.</p>}
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
      {suggestion && (
        <Alert variant="info" title={suggestion === "newline" ? "Your list is on separate lines" : "Your list looks like one long line"}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>
              {suggestion === "newline"
                ? "The current separator was not found in your text, so it counts as one item."
                : `It contains ${SEPARATOR_NAMES[suggestion]} but the tool is splitting on new lines, so it counts as one item.`}
            </span>
            <Button size="sm" variant="secondary" onClick={() => set("inputSep", suggestion)}>
              Split on {SEPARATOR_NAMES[suggestion]}
            </Button>
          </div>
        </Alert>
      )}
      {emptyCustom && (
        <Alert variant="warning" title="Type a separator">
          The custom separator is empty, so your whole text counts as one item. Enter the characters that sit between your items.
        </Alert>
      )}
      {deferredOptions.sortBy === "number" && result.withoutNumber > 0 && result.itemsOut > 0 && (
        <Alert variant="info" title="Some items have no number">
          {formatNumber(result.withoutNumber)} {result.withoutNumber === 1 ? "item contains" : "items contain"} no number and {result.withoutNumber === 1 ? "was" : "were"} placed at the end, in alphabetical order.
        </Alert>
      )}
      {hasText && deferredText.length > LARGE_INPUT && (
        <Alert variant="info" title="Large list">
          {formatNumber(deferredText.length)} characters are being sorted on your device. The result may take a moment to refresh after each change.
        </Alert>
      )}
      {hasText && result.itemsIn > 0 && result.itemsOut === 0 && (
        <Alert variant="info" title="Nothing left to sort">
          Every item was empty, so the result is empty. Turn off “Remove empty items” under Options to keep blank items.
        </Alert>
      )}

      <StatGrid>
        <Stat label="Items in" value={formatNumber(result.itemsIn)} />
        <Stat label="Items out" value={formatNumber(result.itemsOut)} />
        <Stat
          label="Removed"
          value={formatNumber(removed)}
          hint={result.itemsIn === 0 ? undefined : `${formatNumber(result.duplicatesRemoved)} duplicate${result.duplicatesRemoved === 1 ? "" : "s"} · ${formatNumber(result.emptyRemoved)} empty`}
        />
        <Stat label="Order" value={order.value} hint={order.hint} emphasis />
      </StatGrid>

      <ToolSection title="Options" description="Changes apply instantly and are remembered on this device.">
        <p className="label-mono">How words are compared</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Language rules"
            selectSize="sm"
            value={options.locale}
            disabled={codeOrder}
            onChange={(e) => set("locale", e.target.value)}
            hint="Decides where letters such as ä, å, ñ and ch belong."
            options={LOCALES}
          />
          <Select
            label="Capital letters"
            selectSize="sm"
            value={options.caseMode}
            onChange={(e) => set("caseMode", e.target.value as CaseMode)}
            hint={codeOrder ? "Plain code order: Zebra sorts before apple. The settings that depend on language rules are switched off." : "Capitals never override the alphabet: apple comes before Banana."}
            options={CASE_OPTIONS}
          />
          <Toggle
            checked={options.natural}
            onChange={(v) => set("natural", v)}
            disabled={codeOrder}
            label="Natural number order"
            description="item2 comes before item10. Off: digits are compared one by one, so item10 comes first."
          />
          <Toggle
            checked={options.letterByLetter}
            onChange={(v) => set("letterByLetter", v)}
            disabled={codeOrder}
            label="Letter by letter"
            description="Ignore spaces and punctuation, so Newark comes before New York. Off: word by word."
          />
          <Toggle
            checked={options.ignoreAccents}
            onChange={(v) => set("ignoreAccents", v)}
            disabled={codeOrder}
            label="Ignore accents"
            description="café and cafe count as equal, so their order stays as typed."
          />
          <Toggle
            checked={options.macMc}
            onChange={(v) => set("macMc", v)}
            label="File Mc as Mac"
            description="McDonald sorts as if it were spelled MacDonald."
          />
        </div>

        <p className="label-mono mt-1">Ignored at the start of a line</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Toggle
              checked={options.ignoreArticles}
              onChange={(v) => set("ignoreArticles", v)}
              label="Ignore leading articles"
              description="Sort “The Hobbit” under H. Not used for last-name sorting."
            />
            <Input
              label="Articles to skip"
              inputSize="sm"
              value={options.articles}
              disabled={!options.ignoreArticles || options.sortBy === "last"}
              onChange={(e) => set("articles", e.target.value)}
              hint="Separated by commas. End a word with an apostrophe, like l', to skip contractions."
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-4">
            <Toggle
              checked={options.ignorePunctuation}
              onChange={(v) => set("ignorePunctuation", v)}
              label="Ignore leading punctuation and symbols"
              description="Quotes, brackets, # and @ at the start of a line do not decide its place."
            />
            <Toggle
              checked={options.ignoreBullets}
              onChange={(v) => set("ignoreBullets", v)}
              label="Ignore bullets and list numbers"
              description="Skips markers such as -, •, 1. and (2) so you can re-sort a list."
            />
          </div>
        </div>

        <p className="label-mono mt-1">Names and clean-up</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Toggle
            checked={options.keepPrefixes}
            onChange={(v) => set("keepPrefixes", v)}
            disabled={options.sortBy !== "last"}
            label="Keep van, de, von with the last name"
            description="Ludwig van Beethoven sorts under V. Off: under B. Last-name sorting only."
          />
          <Toggle
            checked={options.trim}
            onChange={(v) => set("trim", v)}
            label="Trim spaces around items"
            description="Removes spaces and tabs at the start and end of every item."
          />
          <Toggle
            checked={options.removeEmpty}
            onChange={(v) => set("removeEmpty", v)}
            label="Remove empty items"
            description="Drops blank lines and empty entries. Off: they sort to the top."
          />
        </div>
      </ToolSection>

      {result.keyRowsTotal > 0 && (
        <ToolSection
          title={deferredOptions.sortBy === "last" ? "How each name was read" : "How these lines were sorted"}
          description={`The text each line was placed under, for lines where it differs from what you typed.${
            result.keyRowsTotal > result.keyRows.length ? ` Showing the first ${formatNumber(result.keyRows.length)} of ${formatNumber(result.keyRowsTotal)}.` : ""
          }`}
        >
          <div className="max-h-[22rem] overflow-auto rounded-xl border border-border" data-testid="sort-keys">
            <table className="w-full min-w-[22rem] text-sm">
              <thead className="sticky top-0 bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    You typed
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {deferredOptions.sortBy === "last" ? "Sorted under (last name, first names)" : "Sorted under"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.keyRows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-[13px] text-fg [overflow-wrap:anywhere]">{r.item}</td>
                    <td className="px-3 py-2 font-mono text-[13px] text-fg-secondary [overflow-wrap:anywhere]">{r.key}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ToolSection>
      )}
    </ToolPanel>
  );
}
