"use client";

import { useMemo } from "react";
import { Download, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { downloadText } from "@/lib/utils";
import { Alert, Button, Checkbox, CopyButton, Input, ResultBox, Select, Tabs, Textarea, ToolActions, ToolPanel, ToolSection, Toggle } from "@/components/ui";
import {
  CURRENCIES,
  CURRENCY_CODES,
  DEFAULT_OPTIONS,
  MAX_LIST_LINES,
  convert,
  convertList,
  type CaseStyle,
  type ConvertOptions,
  type CurrencyCode,
  type DecimalMark,
  type Mode,
  type NegativeWord,
  type NumberSystem,
  type Scale,
} from "./logic";

interface State extends ConvertOptions {
  single: string;
  list: string;
  listMode: boolean;
  showNumber: boolean;
}

const DEFAULTS: State = {
  ...DEFAULT_OPTIONS,
  single: "1250.50",
  list: "1250.50\n0.05\n1,000,000\n12,34,567\n1e30",
  listMode: false,
  showNumber: true,
};

const MODES: Mode[] = ["words", "currency", "check", "ordinal"];
const SYSTEMS: NumberSystem[] = ["international", "indian"];
const SCALES: Scale[] = ["short", "long"];
const CASES: CaseStyle[] = ["lower", "sentence", "title", "upper"];
const MARKS: DecimalMark[] = [".", ","];
const NEGATIVES: NegativeWord[] = ["minus", "negative"];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Stored state can be missing, old or hand-edited, so rebuild it field by field. */
function normalize(stored: unknown): State {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);
  const text = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);
  return {
    mode: pick(src.mode, MODES, DEFAULTS.mode),
    currency: pick(src.currency, CURRENCY_CODES, DEFAULTS.currency),
    system: pick(src.system, SYSTEMS, DEFAULTS.system),
    scale: pick(src.scale, SCALES, DEFAULTS.scale),
    caseStyle: pick(src.caseStyle, CASES, DEFAULTS.caseStyle),
    british: bool(src.british, DEFAULTS.british),
    hyphen: bool(src.hyphen, DEFAULTS.hyphen),
    negativeWord: pick(src.negativeWord, NEGATIVES, DEFAULTS.negativeWord),
    decimalMark: pick(src.decimalMark, MARKS, DEFAULTS.decimalMark),
    checkCurrencyName: bool(src.checkCurrencyName, DEFAULTS.checkCurrencyName),
    onlySuffix: bool(src.onlySuffix, DEFAULTS.onlySuffix),
    single: text(src.single, DEFAULTS.single),
    list: text(src.list, DEFAULTS.list),
    listMode: bool(src.listMode, DEFAULTS.listMode),
    showNumber: bool(src.showNumber, DEFAULTS.showNumber),
  };
}

const MODE_TABS: { value: Mode; label: string }[] = [
  { value: "words", label: "Words" },
  { value: "currency", label: "Currency" },
  { value: "check", label: "Check style" },
  { value: "ordinal", label: "Ordinal" },
];

const MODE_HELP: Record<Mode, string> = {
  words: "Spells out any whole or decimal number. Decimals are read one digit at a time, so 3.14 becomes “three point one four”.",
  currency: "Reads an amount as money, with the main unit and the subunit in the correct singular or plural form.",
  check: "Writes an amount the way it appears on the words line of a check: whole units in words, cents as a fraction of 100. It converts numbers to text only; it does not print or issue checks.",
  ordinal: "Turns a whole number into its ordinal form, such as 21 = twenty-first (21st).",
};

const SYSTEM_OPTIONS = [
  { value: "international", label: "International (thousand, million, billion)" },
  { value: "indian", label: "Indian (thousand, lakh, crore)" },
];
const CASE_OPTIONS = [
  { value: "sentence", label: "Sentence case" },
  { value: "lower", label: "lowercase" },
  { value: "title", label: "Title Case" },
  { value: "upper", label: "UPPERCASE" },
];
const SCALE_OPTIONS = [
  { value: "short", label: "Short scale (billion = 10^9)" },
  { value: "long", label: "Long scale (billion = 10^12)" },
];
const NEGATIVE_OPTIONS = [
  { value: "minus", label: "“minus” (minus five)" },
  { value: "negative", label: "“negative” (negative five)" },
];
const MARK_OPTIONS = [
  { value: ".", label: "Period (1,234.56)" },
  { value: ",", label: "Comma (1.234,56)" },
];
const CURRENCY_OPTIONS = CURRENCY_CODES.map((code) => ({ value: code, label: CURRENCIES[code].label }));
const EXAMPLES = ["0.05", "1,250.50", "1,000,000", "1e30"];

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export default function NumberToWords() {
  const [stored, setStored] = usePersistentState<State>("number-to-words:v1", DEFAULTS);
  const s = useMemo(() => normalize(stored), [stored]);
  const patch = (p: Partial<State>) => setStored((prev) => ({ ...normalize(prev), ...p }));

  const single = useMemo(() => (s.listMode ? null : convert(s.single, s)), [s]);
  const list = useMemo(() => (s.listMode ? convertList(s.list, s, s.showNumber) : null), [s]);

  const showCurrency = s.mode === "currency" || s.mode === "check";
  const cur = CURRENCIES[s.currency];
  const effectiveSystem: NumberSystem = s.mode === "ordinal" ? "international" : s.system;

  const onCurrency = (code: CurrencyCode) => {
    // Switching to rupees reads amounts in lakh and crore; switching away undoes that automatic choice.
    const system: NumberSystem = code === "INR" ? "indian" : s.currency === "INR" && s.system === "indian" ? "international" : s.system;
    patch({ currency: code, system });
  };

  const words = single?.kind === "ok" ? single.text : "";
  const figures = single?.kind === "ok" ? single.formatted : "";

  return (
    <ToolPanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs label="Conversion mode" size="sm" value={s.mode} onChange={(mode) => patch({ mode })} options={MODE_TABS} />
        <Checkbox checked={s.listMode} onChange={(listMode) => patch({ listMode })} label="Convert a list (one number per line)" />
      </div>
      <p className="-mt-2 text-xs text-muted">{MODE_HELP[s.mode]}</p>

      {s.listMode ? (
        <Textarea
          label="Numbers, one per line"
          value={s.list}
          onChange={(e) => patch({ list: e.target.value })}
          rows={6}
          mono
          spellCheck={false}
          placeholder={"1250.50\n0.05\n1,000,000"}
          labelAddon={`up to ${MAX_LIST_LINES.toLocaleString("en-US")} lines`}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Input
            label="Number"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            inputSize="lg"
            value={s.single}
            onChange={(e) => patch({ single: e.target.value })}
            placeholder="1250.50"
            prefix={showCurrency ? cur.symbol : undefined}
            error={single?.kind === "error" ? single.message : undefined}
            hint="Commas, spaces and a leading currency symbol are fine. Scientific notation such as 1e30 works too."
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label-mono mr-1">Try</span>
            {EXAMPLES.map((ex) => (
              <Button key={ex} variant="secondary" size="sm" className="font-mono" onClick={() => patch({ single: ex })}>
                {ex}
              </Button>
            ))}
          </div>
        </div>
      )}

      {s.listMode && list ? (
        <div className="flex flex-col gap-3">
          <ResultBox
            label="In words"
            value={list.text}
            rows={8}
            placeholder="Add numbers above, one per line."
            actions={
              <Button variant="ghost" size="sm" leftIcon={<Download className="h-4 w-4" aria-hidden />} disabled={!list.text} onClick={() => downloadText(list.text, "numbers-in-words.txt")}>
                Download
              </Button>
            }
          />
          <p className="text-xs text-muted" aria-live="polite">
            {list.converted} {list.converted === 1 ? "number" : "numbers"} converted{list.failed ? `, ${list.failed} could not be converted` : ""}.
          </p>
          {list.failed > 0 && (
            <Alert variant="warning" title={`${list.failed} ${list.failed === 1 ? "line" : "lines"} could not be converted`}>
              <ul className="list-disc pl-4">
                {list.errors.slice(0, 3).map((e) => (
                  <li key={e.line}>
                    Line {e.line}: {e.message}
                  </li>
                ))}
                {list.errors.length > 3 && <li>…and {list.errors.length - 3} more.</li>}
              </ul>
            </Alert>
          )}
          {list.truncated && <Alert variant="info">Only the first {MAX_LIST_LINES.toLocaleString("en-US")} lines were converted.</Alert>}
          <ToolActions>
            <Button variant="secondary" leftIcon={<X className="h-4 w-4" aria-hidden />} disabled={!s.list} onClick={() => patch({ list: "" })}>
              Clear list
            </Button>
          </ToolActions>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {single?.kind === "ok" ? (
            <div className="overflow-hidden rounded-xl border border-border-strong bg-surface-2" aria-live="polite">
              <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3.5 py-2">
                <span className="label-mono">In words</span>
                <span className="font-mono text-[11px] tabular-nums text-muted">
                  {countWords(words)} {countWords(words) === 1 ? "word" : "words"} · {words.length} characters
                </span>
              </div>
              <output data-testid="result" className="block px-4 py-4 text-xl leading-snug font-medium break-words text-fg sm:text-2xl">
                {words}
              </output>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border px-4 py-2.5">
                <span className="label-mono">Figures</span>
                <span data-testid="figures" className="font-mono text-sm break-all text-fg-secondary">
                  {figures}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-2 px-4 py-6 text-sm text-muted" aria-live="polite">
              {single?.kind === "error" ? "Fix the number above to see it in words." : "Type a number above to see it in words."}
            </div>
          )}

          {single?.kind === "ok" &&
            single.notes.map((note) => (
              <Alert key={note} variant="info">
                {note}
              </Alert>
            ))}

          <ToolActions>
            <CopyButton text={words} label="Copy words" variant="accent" disabled={!words} />
            <CopyButton text={words && figures ? `${words} (${figures})` : ""} label="Copy words + figures" variant="secondary" disabled={!words} />
            <Button variant="ghost" leftIcon={<X className="h-4 w-4" aria-hidden />} disabled={!s.single} onClick={() => patch({ single: "" })}>
              Clear
            </Button>
          </ToolActions>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {showCurrency && <Select label="Currency" value={s.currency} onChange={(e) => onCurrency(e.target.value as CurrencyCode)} options={CURRENCY_OPTIONS} />}
        <Select
          label="Numbering system"
          value={effectiveSystem}
          onChange={(e) => patch({ system: e.target.value as NumberSystem })}
          options={SYSTEM_OPTIONS}
          disabled={s.mode === "ordinal"}
          hint={s.mode === "ordinal" ? "Ordinals always use the international system." : undefined}
        />
        <Select label="Text case" value={s.caseStyle} onChange={(e) => patch({ caseStyle: e.target.value as CaseStyle })} options={CASE_OPTIONS} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          checked={s.british && s.mode !== "check"}
          onChange={(british) => patch({ british })}
          disabled={s.mode === "check"}
          label="British “and”"
          description={s.mode === "check" ? "Not used in check style, where “and” is reserved for the cents." : "One hundred and five, instead of one hundred five."}
        />
        <Toggle checked={s.hyphen} onChange={(hyphen) => patch({ hyphen })} label="Hyphenate 21 to 99" description="Twenty-one, instead of twenty one." />
        {s.mode === "check" && (
          <Toggle
            checked={s.checkCurrencyName}
            onChange={(checkCurrencyName) => patch({ checkCurrencyName })}
            label="Add the currency name"
            description={`Adds “${cur.checkName}” after the fraction. Many check forms already print it.`}
          />
        )}
        {s.mode === "currency" && (
          <Toggle checked={s.onlySuffix} onChange={(onlySuffix) => patch({ onlySuffix })} label="End with “only”" description="Common on invoices and in Indian usage." />
        )}
        {s.listMode && (
          <Toggle checked={s.showNumber} onChange={(showNumber) => patch({ showNumber })} label="Show each number before its words" description="Output lines read “1250.50 = One thousand…”." />
        )}
      </div>

      <details className="group rounded-lg border border-border bg-surface-2 px-3.5 py-2.5">
        <summary className="cursor-pointer text-[13px] font-medium text-fg select-none">More options</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Select
            label="Large-number scale"
            value={s.scale}
            onChange={(e) => patch({ scale: e.target.value as Scale })}
            options={SCALE_OPTIONS}
            disabled={effectiveSystem === "indian"}
            hint={effectiveSystem === "indian" ? "Not used with the Indian system." : "Short scale is standard in the US and UK."}
          />
          <Select label="Negative numbers" value={s.negativeWord} onChange={(e) => patch({ negativeWord: e.target.value as NegativeWord })} options={NEGATIVE_OPTIONS} />
          <Select label="Decimal mark in your input" value={s.decimalMark} onChange={(e) => patch({ decimalMark: e.target.value as DecimalMark })} options={MARK_OPTIONS} />
        </div>
      </details>

          {single?.kind === "ok" && single.parts.length > 0 && (
            <ToolSection title="How this number is read" description="The whole number is split into periods. Each period is read on its own, then the pieces are joined.">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2">
                    <tr>
                      <th scope="col" className="label-mono px-3 py-2 font-normal">
                        Period
                      </th>
                      <th scope="col" className="label-mono px-3 py-2 font-normal">
                        Digits
                      </th>
                      <th scope="col" className="label-mono px-3 py-2 font-normal">
                        Read as
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {single.parts.map((p, i) => (
                      <tr key={`${p.label}-${i}`} className="border-t border-border">
                        <td className="px-3 py-2 text-fg-secondary">{p.label}</td>
                        <td className="px-3 py-2 font-mono tabular-nums break-all">{p.digits}</td>
                        <td className="px-3 py-2">
                          {p.and ? <span className="text-muted">and </span> : null}
                          {p.words}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ToolSection>
          )}

      <p className="text-xs text-muted">
        Numbers are converted in your browser as exact digit strings, so long values are not rounded. Always check the words against the figures before using them in a legal, tax or banking document.
      </p>
    </ToolPanel>
  );
}
