"use client";

import { useMemo, useRef, useState } from "react";
import { ClipboardPaste, Download, Eraser, History, Undo2 } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Select, Stat, StatGrid, Textarea, Toggle, ToolActions, ToolPanel, ToolSection } from "@/components/ui";
import { downloadText, formatNumber } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Pure conversion logic (no React, easy to unit test)                 */
/* ------------------------------------------------------------------ */

export type ModeId =
  | "sentence"
  | "lower"
  | "upper"
  | "capitalized"
  | "title"
  | "alternating"
  | "inverse"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot";

export type TitleStyle = "ap" | "apa" | "chicago" | "mla" | "all";

export interface ConvertOptions {
  titleStyle: TitleStyle;
  keepAcronyms: boolean;
}

/** A "word": letters/digits, optionally joined by apostrophes or internal periods (don't, e.g., U.S., 3.5, Node.js). */
const WORD_RE = /[\p{L}\p{N}]+(?:[.'’][\p{L}\p{N}]+)*/gu;
const LETTER_RE = /\p{L}/u;
const SINGLE_LETTER_RE = /^\p{L}$/u;
const PRONOUN_I_RE = /^i(?:['’](?:m|ll|ve|d))?$/u;
const ELLIPSIS_RE = /\.{2,}|…/;
/** Punctuation that, when it directly follows a short word in a title, shows the word is not a dangling preposition. */
const CLAUSE_END_RE = /^[,;:!?)\]}"”»]/;
/** Separator text that starts a subtitle (colon, dash, end punctuation). */
const SUBTITLE_RE = /[:.!?—–]|\s-\s/;

/** Words after which a period does not end a sentence. */
const ABBREVIATIONS = new Set(
  "mr mrs ms dr prof sr jr st mt ave blvd rd rev hon gen col capt sgt lt cpl pvt vs approx dept est inc ltd co corp bros misc fig vol pp ch".split(" "),
);

const ARTICLES = ["a", "an", "the"];
const COORD_SHORT = ["and", "but", "or", "nor", "for", "yet", "so"];
const PREPS_SHORT = ["as", "at", "by", "in", "of", "on", "to", "per", "via", "vs", "v"];
// "up", "down", "off", "out" and "over" are deliberately absent: in titles they are usually adverbs (Sold Out, Growing Up).
const PREPS_LONG = [
  "about", "above", "across", "after", "against", "along", "amid", "among", "around", "before", "behind", "below", "beneath",
  "beside", "between", "beyond", "despite", "during", "except", "from", "inside", "into", "like", "near", "onto", "outside",
  "past", "since", "through", "throughout", "till", "toward", "towards", "under", "underneath", "until", "unto", "upon",
  "with", "within", "without",
];

const SMALL_WORDS: Record<TitleStyle, Set<string>> = {
  // AP: articles, conjunctions and prepositions of fewer than four letters.
  ap: new Set([...ARTICLES, ...COORD_SHORT, "if", ...PREPS_SHORT]),
  // APA 7: minor words of three letters or fewer – the same threshold as AP.
  apa: new Set([...ARTICLES, ...COORD_SHORT, "if", ...PREPS_SHORT]),
  // Chicago 17: articles, coordinating conjunctions (and, but, for, or, nor), "as", "to" and prepositions of any length.
  chicago: new Set([...ARTICLES, "and", "but", "for", "or", "nor", ...PREPS_SHORT, ...PREPS_LONG]),
  // MLA 9: articles, coordinating conjunctions (incl. so, yet), "to" and prepositions of any length.
  mla: new Set([...ARTICLES, ...COORD_SHORT, ...PREPS_SHORT, ...PREPS_LONG]),
  all: new Set(),
};

const upper = (s: string) => s.toLocaleUpperCase();
const lower = (s: string) => s.toLocaleLowerCase();

/** Upper-case the first code point, lower-case the rest. */
function capitalizeFirst(word: string): string {
  const cp = word.codePointAt(0);
  if (cp === undefined) return word;
  const first = String.fromCodePoint(cp);
  return upper(first) + lower(word.slice(first.length));
}

/** True when a line is written entirely in capitals (at least two letters). */
function isShouting(line: string): boolean {
  const letters = line.match(/\p{L}/gu);
  return !!letters && letters.length >= 2 && line === upper(line) && line !== lower(line);
}

/** Acronym (NASA, HTML5, U.S) or mixed-case word (iPhone, JavaScript, McDonald's). */
function isAcronymOrMixed(word: string): boolean {
  const letters = word.match(/\p{L}/gu);
  if (!letters || letters.length < 2) return false;
  if (word === upper(word)) return true;
  // an upper-case letter anywhere after the first letter
  return letters.slice(1).some((ch) => ch !== lower(ch));
}

interface WordContext {
  index: number;
  count: number;
  /** Separator text immediately before the word. */
  before: string;
  /** Separator text between this word and the next (or end of line). */
  after: string;
}

/** Replace every word in a line, leaving separators untouched. */
function mapWords(line: string, fn: (word: string, ctx: WordContext) => string): string {
  const matches = [...line.matchAll(WORD_RE)];
  if (matches.length === 0) return line;
  let out = "";
  let pos = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index ?? 0;
    const word = m[0];
    const next = matches[i + 1];
    const before = line.slice(pos, start);
    const after = line.slice(start + word.length, next ? (next.index ?? line.length) : line.length);
    out += before + fn(word, { index: i, count: matches.length, before, after });
    pos = start + word.length;
  }
  return out + line.slice(pos);
}

/** Does the separator after `word` end a sentence? */
function endsSentence(word: string, after: string): boolean {
  if (/[!?]/.test(after)) return true;
  if (!after.includes(".")) return false;
  if (ELLIPSIS_RE.test(after)) return false;
  const w = lower(word);
  if (SINGLE_LETTER_RE.test(w)) return false; // initial: J. K. Rowling
  if (w.includes(".")) return false; // e.g., i.e., U.S., a.m.
  return !ABBREVIATIONS.has(w);
}

function sentenceCaseLine(line: string, keep: boolean): string {
  const shouting = isShouting(line);
  let atStart = true;
  return mapWords(line, (word, { after }) => {
    const preserved = keep && !shouting && isAcronymOrMixed(word);
    let result: string;
    if (preserved) result = word;
    else if (atStart) result = capitalizeFirst(word);
    else result = lower(word);
    if (!preserved && PRONOUN_I_RE.test(result)) result = "I" + result.slice(1);
    atStart = endsSentence(word, after);
    return result;
  });
}

function titleCaseLine(line: string, style: TitleStyle, keep: boolean): string {
  const shouting = isShouting(line);
  const small = SMALL_WORDS[style];
  return mapWords(line, (word, { index, count, before, after }) => {
    if (keep && !shouting && isAcronymOrMixed(word)) return word;
    const isFirst = index === 0 || SUBTITLE_RE.test(before);
    const isLast = index === count - 1;
    const w = lower(word);
    if (!isFirst && !isLast && small.has(w) && !CLAUSE_END_RE.test(after)) return w;
    return capitalizeFirst(word);
  });
}

function capitalizedCaseLine(line: string, keep: boolean): string {
  const shouting = isShouting(line);
  return mapWords(line, (word) => (keep && !shouting && isAcronymOrMixed(word) ? word : capitalizeFirst(word)));
}

function alternatingCase(text: string): string {
  let up = false;
  let out = "";
  for (const ch of text) {
    if (LETTER_RE.test(ch)) {
      out += up ? upper(ch) : lower(ch);
      up = !up;
    } else {
      out += ch;
    }
  }
  return out;
}

function inverseCase(text: string): string {
  let out = "";
  for (const ch of text) {
    const u = upper(ch);
    out += ch === u ? lower(ch) : u;
  }
  return out;
}

/** Split a line into identifier words: whitespace, punctuation, underscores, hyphens and camelCase humps are boundaries. */
export function splitIdentifierWords(line: string): string[] {
  return line
    .replace(/['’]/g, "")
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2") // fooBar -> foo Bar, html5Parser -> html5 Parser
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2") // HTTPServer -> HTTP Server
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function joinIdentifier(words: string[], mode: ModeId): string {
  switch (mode) {
    case "camel":
      return words.map((w, i) => (i === 0 ? lower(w) : capitalizeFirst(w))).join("");
    case "pascal":
      return words.map(capitalizeFirst).join("");
    case "snake":
      return words.map(lower).join("_");
    case "kebab":
      return words.map(lower).join("-");
    case "constant":
      return words.map(upper).join("_");
    case "dot":
      return words.map(lower).join(".");
    default:
      return words.join(" ");
  }
}

const perLine = (text: string, fn: (line: string) => string) => text.split("\n").map(fn).join("\n");

export function convertCase(text: string, mode: ModeId, { titleStyle, keepAcronyms }: ConvertOptions): string {
  switch (mode) {
    case "lower":
      return lower(text);
    case "upper":
      return upper(text);
    case "sentence":
      return perLine(text, (l) => sentenceCaseLine(l, keepAcronyms));
    case "title":
      return perLine(text, (l) => titleCaseLine(l, titleStyle, keepAcronyms));
    case "capitalized":
      return perLine(text, (l) => capitalizedCaseLine(l, keepAcronyms));
    case "alternating":
      return alternatingCase(text);
    case "inverse":
      return inverseCase(text);
    default:
      return perLine(text, (l) => joinIdentifier(splitIdentifierWords(l), mode));
  }
}

interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
}

function getStats(text: string): TextStats {
  const trimmed = text.trim();
  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    lines: text ? text.split("\n").length : 0,
    paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
  };
}

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
  { value: "chicago", label: "Chicago 17 (books)" },
  { value: "mla", label: "MLA 9 (humanities)" },
  { value: "all", label: "Capitalize every word" },
];

const TITLE_STYLE_LABEL: Record<TitleStyle, string> = { ap: "AP", apa: "APA", chicago: "Chicago", mla: "MLA", all: "every word" };
const MODE_LABEL = Object.fromEntries([...WRITING_MODES, ...CODE_MODES].map((m) => [m.id, m.label])) as Record<ModeId, string>;
const LARGE_TEXT = 100_000;
const HISTORY_LIMIT = 50;

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
    // A fresh paste into an empty box starts a new session for Undo / Restore original.
    if (text === "") setHistory([]);
    setText(value);
    setLastMode(null);
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
        hint="Conversions change the text in place; use Undo or Restore original to go back."
      />

      <ToolActions>
        <CopyButton text={text} disabled={!hasText} />
        <Button variant="secondary" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadText(text, fileName)} disabled={!hasText}>
          Download .txt
        </Button>
        <Button variant="secondary" leftIcon={<Undo2 className="h-4 w-4" aria-hidden />} onClick={undo} disabled={history.length === 0} title="Undo the last conversion">
          Undo
        </Button>
        <Button variant="secondary" leftIcon={<History className="h-4 w-4" aria-hidden />} onClick={restoreOriginal} disabled={history.length === 0} title="Restore the text as it was before the first conversion">
          Restore original
        </Button>
        <Button variant="secondary" leftIcon={<Eraser className="h-4 w-4" aria-hidden />} onClick={clear} disabled={!hasText}>
          Clear
        </Button>
        <Button
          variant="ghost"
          leftIcon={<ClipboardPaste className="h-4 w-4" aria-hidden />}
          onClick={async () => {
            try {
              const clip = await navigator.clipboard.readText();
              if (clip) handleChange(clip);
            } catch {
              /* clipboard permission denied – the user can paste with Ctrl/Cmd+V */
            }
            textareaRef.current?.focus();
          }}
        >
          Paste
        </Button>
        {lastLabel && (
          <Badge variant="primary" className="ml-auto">
            Applied: {lastLabel}
          </Badge>
        )}
      </ToolActions>

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
            description="Leave NASA, HTML5 and iPhone unchanged in Sentence, Title and Capitalized case. Lines written entirely in capitals are still converted."
            className="sm:pt-6"
          />
        </div>
      </ToolSection>

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
