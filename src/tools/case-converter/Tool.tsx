"use client";

import { useMemo, useRef, useState } from "react";
import { ClipboardPaste, Download, Eraser, History, Undo2 } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Select, Stat, StatGrid, Textarea, Toggle, ToolActions, ToolPanel, ToolSection } from "@/components/ui";
import { downloadText, formatNumber } from "@/lib/utils";
import { convertCase, getStats, type ModeId, type TitleStyle } from "./logic";

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */

interface ModeDef {
  id: ModeId;
  label: string;
  hint: string;
}

const WRITING_MODES: ModeDef[] = [
  { id: "sentence", label: "Sentence case", hint: "Capitalize the first word of each sentence and line" },
  { id: "lower", label: "lower case", hint: "Make every letter lowercase" },
  { id: "upper", label: "UPPER CASE", hint: "Make every letter uppercase" },
  { id: "capitalized", label: "Capitalized Case", hint: "Capitalize the first letter of every word" },
  { id: "title", label: "Title Case", hint: "Capitalize principal words following the selected style guide" },
  { id: "alternating", label: "aLtErNaTiNg cAsE", hint: "Alternate lowercase and uppercase letters" },
  { id: "inverse", label: "iNVERSE cASE", hint: "Swap uppercase and lowercase letters" },
];

const CODE_MODES: ModeDef[] = [
  { id: "camel", label: "camelCase", hint: "firstWordLower, others capitalized, no separators" },
  { id: "pascal", label: "PascalCase", hint: "Every word capitalized, no separators" },
  { id: "snake", label: "snake_case", hint: "Lowercase words joined with underscores" },
  { id: "kebab", label: "kebab-case", hint: "Lowercase words joined with hyphens" },
  { id: "constant", label: "CONSTANT_CASE", hint: "Uppercase words joined with underscores" },
  { id: "dot", label: "dot.case", hint: "Lowercase words joined with periods" },
];

const TITLE_STYLE_OPTIONS: { value: TitleStyle; label: string }[] = [
  { value: "ap", label: "AP Stylebook (news, web)" },
  { value: "apa", label: "APA 7 (academic)" },
  { value: "chicago", label: "Chicago 18 (books)" },
  { value: "mla", label: "MLA 9 (humanities)" },
  { value: "all", label: "Capitalize every word" },
];

const TITLE_STYLE_LABEL: Record<TitleStyle, string> = { ap: "AP", apa: "APA", chicago: "Chicago", mla: "MLA", all: "every word" };
const MODE_LABEL = Object.fromEntries([...WRITING_MODES, ...CODE_MODES].map((m) => [m.id, m.label])) as Record<ModeId, string>;
const LARGE_TEXT = 100_000;
const HISTORY_LIMIT = 50;

/** True when an edit replaces most of the previous text rather than changing part of it. */
function isReplacement(prev: string, next: string): boolean {
  if (prev === "") return true;
  const max = Math.min(prev.length, next.length);
  let start = 0;
  while (start < max && prev[start] === next[start]) start++;
  let end = 0;
  while (end < max - start && prev[prev.length - 1 - end] === next[next.length - 1 - end]) end++;
  return start + end < prev.length / 2;
}

function isTitleStyle(v: string): v is TitleStyle {
  return TITLE_STYLE_OPTIONS.some((o) => o.value === v);
}

export default function CaseConverter() {
  // The draft lives in this tab's session storage; settings are remembered across visits.
  const [text, setText] = usePersistentState("case-converter:draft", "");
  const [titleStyle, setTitleStyle] = usePersistentState<TitleStyle>("case-converter:title-style", "ap", { storage: "local" });
  const [keepAcronyms, setKeepAcronyms] = usePersistentState("case-converter:keep-acronyms", true, { storage: "local" });
  const [history, setHistory] = useState<string[]>([]);
  const [lastMode, setLastMode] = useState<ModeId | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => getStats(text), [text]);
  const hasText = text.length > 0;

  const apply = (mode: ModeId) => {
    const result = convertCase(text, mode, { titleStyle, keepAcronyms });
    if (result !== text) {
      setHistory((h) => [...h.slice(-(HISTORY_LIMIT - 1)), text]);
      setText(result);
    }
    setLastMode(mode);
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (previous === undefined) return;
    setHistory((h) => h.slice(0, -1));
    setText(previous);
    setLastMode(null);
  };

  const restoreOriginal = () => {
    const original = history[0];
    if (original === undefined) return;
    setHistory([]);
    setText(original);
    setLastMode(null);
  };

  const clear = () => {
    if (text) setHistory((h) => [...h.slice(-(HISTORY_LIMIT - 1)), text]);
    setText("");
    setLastMode(null);
    textareaRef.current?.focus();
  };

  const handleChange = (value: string) => {
    // Typing into an empty box, or pasting over most of the old text, starts a new session for Undo / Restore original.
    if (isReplacement(text, value)) setHistory([]);
    setText(value);
    setLastMode(null);
  };

  const pasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        // Replacing existing text is undoable, like a conversion.
        if (text) setHistory((h) => [...h.slice(-(HISTORY_LIMIT - 1)), text]);
        else setHistory([]);
        setText(clip);
        setLastMode(null);
      }
    } catch {
      /* clipboard permission denied or unsupported – the user can paste with Ctrl/Cmd+V */
    }
    textareaRef.current?.focus();
  };

  const lastLabel = lastMode ? (lastMode === "title" ? `Title Case (${TITLE_STYLE_LABEL[titleStyle]})` : MODE_LABEL[lastMode]) : null;
  const fileName = `text-${lastMode ?? "converted"}.txt`;

  const renderModeButtons = (modes: ModeDef[]) => (
    <div className="flex flex-wrap gap-2">
      {modes.map((m) => (
        <Button
          key={m.id}
          variant={lastMode === m.id ? "primary" : "secondary"}
          onClick={() => apply(m.id)}
          disabled={!hasText}
          title={m.hint}
          aria-pressed={lastMode === m.id}
        >
          {m.label}
        </Button>
      ))}
    </div>
  );

  return (
    <ToolPanel>
      <Textarea
        ref={textareaRef}
        label="Your text"
        labelAddon={`${formatNumber(stats.characters)} characters`}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Paste or type your text here, then click a case below. Line breaks and paragraphs are preserved…"
        rows={8}
        className="max-sm:h-40"
        hint="Conversions change the text in place; use Undo or Restore original to go back."
      />


      {stats.characters > LARGE_TEXT && (
        <Alert variant="info" title={`Large text (${formatNumber(stats.characters)} characters)`}>
          Conversions still run instantly on your device, but the editor may feel slower while you type. Everything stays in your browser.
        </Alert>
      )}

      <ToolSection title="Writing cases" description="Line breaks and paragraphs are preserved. Sentence case capitalizes after . ! ? and at the start of each line.">
        {renderModeButtons(WRITING_MODES)}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
          <Select
            label="Title case style"
            value={titleStyle}
            onChange={(e) => {
              if (isTitleStyle(e.target.value)) setTitleStyle(e.target.value);
            }}
            options={TITLE_STYLE_OPTIONS}
            selectSize="sm"
            containerClassName="sm:w-64"
          />
          <Toggle
            checked={keepAcronyms}
            onChange={setKeepAcronyms}
            label="Keep acronyms and mixed-case words"
            description="Leave NASA, HTML5 and iPhone unchanged in Sentence, Title and Capitalized case. A line or text written entirely in capitals is still converted."
            className="sm:pt-6"
          />
        </div>
      </ToolSection>

      <ToolActions>
        <CopyButton size="sm" text={text} disabled={!hasText} />
        <Button size="sm" variant="secondary" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadText(text, fileName)} disabled={!hasText}>
          Download .txt
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<Undo2 className="h-4 w-4" aria-hidden />} onClick={undo} disabled={history.length === 0} title="Undo the last conversion">
          Undo
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<History className="h-4 w-4" aria-hidden />} onClick={restoreOriginal} disabled={history.length === 0} title="Restore the text as it was before the first conversion">
          Restore original
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<Eraser className="h-4 w-4" aria-hidden />} onClick={clear} disabled={!hasText}>
          Clear
        </Button>
        <Button size="sm" variant="ghost" leftIcon={<ClipboardPaste className="h-4 w-4" aria-hidden />} onClick={pasteFromClipboard}>
          Paste
        </Button>
        {lastLabel && (
          <Badge variant="primary" className="ml-auto">
            Applied: {lastLabel}
          </Badge>
        )}
      </ToolActions>

      <ToolSection title="Code cases" description="Each line becomes one identifier. Spaces, hyphens, underscores, punctuation and camelCase humps are word boundaries.">
        {renderModeButtons(CODE_MODES)}
      </ToolSection>

      <StatGrid>
        <Stat label="Characters" value={formatNumber(stats.characters)} hint={`${formatNumber(stats.charactersNoSpaces)} without spaces`} />
        <Stat label="Words" value={formatNumber(stats.words)} />
        <Stat label="Lines" value={formatNumber(stats.lines)} />
        <Stat label="Paragraphs" value={formatNumber(stats.paragraphs)} />
      </StatGrid>
    </ToolPanel>
  );
}
