"use client";

import { useMemo, type ReactNode } from "react";
import { ArrowLeftRight, RotateCcw, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Input, Tabs, ToolActions, ToolPanel } from "@/components/ui";
import {
  PRECISION_LIMIT,
  applyPercent,
  formatNum,
  paren,
  parseNumber,
  percentChange,
  percentDifference,
  percentOf,
  reversePercent,
  signed,
  whatPercent,
  type AddMode,
  type Parsed,
} from "./logic";

interface Fields {
  ofP: string;
  ofY: string;
  whatX: string;
  whatY: string;
  chFrom: string;
  chTo: string;
  diffA: string;
  diffB: string;
  addValue: string;
  addP: string;
  addMode: AddMode;
  revFinal: string;
  revP: string;
  revMode: AddMode;
}

const EXAMPLES: Fields = {
  ofP: "20",
  ofY: "150",
  whatX: "45",
  whatY: "60",
  chFrom: "80",
  chTo: "100",
  diffA: "120",
  diffB: "150",
  addValue: "80",
  addP: "8.25",
  addMode: "add",
  revFinal: "68",
  revP: "15",
  revMode: "subtract",
};

const EMPTY: Fields = {
  ofP: "",
  ofY: "",
  whatX: "",
  whatY: "",
  chFrom: "",
  chTo: "",
  diffA: "",
  diffB: "",
  addValue: "",
  addP: "",
  addMode: "add",
  revFinal: "",
  revP: "",
  revMode: "subtract",
};

/** A computed card result, or a reason it could not be computed. */
type Outcome =
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "error"; message: string }
  | { status: "ok"; headline: string; formula: string; explanation: string; copy: string; badge?: ReactNode; extra?: ReactNode; note?: string };

/** Combine parsed inputs: returns the numbers only when every field is a valid number. */
function both(...parsed: Parsed[]): number[] | "empty" | "invalid" {
  if (parsed.some((p) => p.kind === "invalid")) return "invalid";
  if (parsed.some((p) => p.kind === "empty")) return "empty";
  return parsed.map((p) => (p as { value: number }).value);
}

function precisionNote(nums: number[]): string | undefined {
  return nums.some((n) => Math.abs(n) >= PRECISION_LIMIT)
    ? "Very large inputs are stored with about 15–16 significant digits, so the last digits may be rounded."
    : undefined;
}

function calcPercentOf(pRaw: string, yRaw: string): Outcome {
  const n = both(parseNumber(pRaw), parseNumber(yRaw));
  if (n === "empty" || n === "invalid") return { status: n };
  const [p, y] = n;
  const r = percentOf(p, y);
  if (!r.ok) return { status: "error", message: r.reason };
  const res = formatNum(r.value);
  return {
    status: "ok",
    headline: res,
    formula: `${paren(p)} ÷ 100 × ${paren(y)} = ${res}`,
    explanation: `${formatNum(p)}% of ${formatNum(y)} is ${res}.`,
    copy: `${formatNum(p)}% of ${formatNum(y)} = ${res}`,
    note: precisionNote(n),
  };
}

function calcWhatPercent(xRaw: string, yRaw: string): Outcome {
  const n = both(parseNumber(xRaw), parseNumber(yRaw));
  if (n === "empty" || n === "invalid") return { status: n };
  const [x, y] = n;
  const r = whatPercent(x, y);
  if (!r.ok) return { status: "error", message: r.reason };
  const res = `${formatNum(r.value)}%`;
  return {
    status: "ok",
    headline: res,
    formula: `${paren(x)} ÷ ${paren(y)} × 100 = ${res}`,
    explanation: `${formatNum(x)} is ${res} of ${formatNum(y)}.`,
    copy: `${formatNum(x)} is ${res} of ${formatNum(y)}`,
    note: precisionNote(n),
  };
}

function calcChange(fromRaw: string, toRaw: string): Outcome {
  const n = both(parseNumber(fromRaw), parseNumber(toRaw));
  if (n === "empty" || n === "invalid") return { status: n };
  const [from, to] = n;
  const r = percentChange(from, to);
  if (!r.ok) return { status: "error", message: r.reason };
  const { pct, diff, direction } = r.value;
  const pctText = `${signed(pct)}%`;
  const explanation =
    direction === "no change"
      ? `${formatNum(from)} and ${formatNum(to)} are equal, so there is no change.`
      : `Going from ${formatNum(from)} to ${formatNum(to)} is a ${formatNum(Math.abs(pct))}% ${direction} (${signed(diff)}).`;
  return {
    status: "ok",
    headline: pctText,
    badge: (
      <Badge variant={direction === "increase" ? "success" : direction === "decrease" ? "danger" : "default"}>{direction}</Badge>
    ),
    formula: `(${paren(to)} − ${paren(from)}) ÷ ${from < 0 ? `|${formatNum(from)}|` : formatNum(from)} × 100 = ${pctText}`,
    explanation,
    copy: `${formatNum(from)} → ${formatNum(to)}: ${pctText} (${direction}, ${signed(diff)})`,
    note: precisionNote(n),
  };
}

function calcDifference(aRaw: string, bRaw: string): Outcome {
  const n = both(parseNumber(aRaw), parseNumber(bRaw));
  if (n === "empty" || n === "invalid") return { status: n };
  const [a, b] = n;
  const r = percentDifference(a, b);
  if (!r.ok) return { status: "error", message: r.reason };
  const { pct, diff, mean } = r.value;
  const res = `${formatNum(pct)}%`;
  const meanExpr = `(${paren(a)} + ${paren(b)}) ÷ 2`;
  let extra: ReactNode;
  if (a !== 0 && b !== 0 && a !== b) {
    const ab = percentChange(a, b);
    const ba = percentChange(b, a);
    if (ab.ok && ba.ok)
      extra = (
        <>
          For comparison, percentage change is {signed(ab.value.pct)}% from {formatNum(a)} to {formatNum(b)}, but {signed(ba.value.pct)}% from{" "}
          {formatNum(b)} to {formatNum(a)}. Percentage difference gives the same answer both ways.
        </>
      );
  }
  return {
    status: "ok",
    headline: res,
    formula: `|${paren(a)} − ${paren(b)}| ÷ ${mean < 0 ? `|${meanExpr}|` : `(${meanExpr})`} × 100 = ${formatNum(diff)} ÷ ${formatNum(Math.abs(mean))} × 100 = ${res}`,
    explanation: `${formatNum(a)} and ${formatNum(b)} differ by ${formatNum(diff)}, which is ${res} of their average (${formatNum(mean)}).`,
    copy: `Percentage difference between ${formatNum(a)} and ${formatNum(b)} = ${res}`,
    extra,
    note:
      a * b < 0
        ? "One value is negative and the other positive. Percentage difference is meant for two values with the same sign, so treat this result with caution."
        : precisionNote(n),
  };
}

function calcApply(vRaw: string, pRaw: string, mode: AddMode): Outcome {
  const n = both(parseNumber(vRaw), parseNumber(pRaw));
  if (n === "empty" || n === "invalid") return { status: n };
  const [v, p] = n;
  const r = applyPercent(v, p, mode);
  if (!r.ok) return { status: "error", message: r.reason };
  const { result, amount } = r.value;
  const res = formatNum(result);
  const op = mode === "add" ? "+" : "−";
  return {
    status: "ok",
    headline: res,
    formula: `${paren(v)} × (1 ${op} ${paren(p)} ÷ 100) = ${paren(v)} ${op} ${paren(amount)} = ${res}`,
    explanation:
      mode === "add"
        ? `Adding ${formatNum(p)}% to ${formatNum(v)} adds ${formatNum(amount)}, giving ${res}.`
        : `Taking ${formatNum(p)}% off ${formatNum(v)} removes ${formatNum(amount)}, leaving ${res}.`,
    copy: `${formatNum(v)} ${op} ${formatNum(p)}% = ${res}`,
    note: precisionNote(n),
  };
}

function calcReverse(fRaw: string, pRaw: string, mode: AddMode): Outcome {
  const n = both(parseNumber(fRaw), parseNumber(pRaw));
  if (n === "empty" || n === "invalid") return { status: n };
  const [final, p] = n;
  const r = reversePercent(final, p, mode);
  if (!r.ok) return { status: "error", message: r.reason };
  const { original, amount, factor } = r.value;
  const res = formatNum(original);
  const op = mode === "add" ? "+" : "−";
  const word = mode === "add" ? "increase" : "decrease";
  return {
    status: "ok",
    headline: res,
    formula: `${paren(final)} ÷ (1 ${op} ${paren(p)} ÷ 100) = ${paren(final)} ÷ ${formatNum(factor)} = ${res}`,
    explanation: `The original value was ${res}. A ${formatNum(p)}% ${word} changes it by ${signed(amount)}, which gives ${formatNum(final)}.`,
    copy: `Original value before a ${formatNum(p)}% ${word} to ${formatNum(final)} = ${res}`,
    note: precisionNote(n),
  };
}

const MODE_OPTIONS_APPLY = [
  { value: "add" as const, label: "Add %" },
  { value: "subtract" as const, label: "Subtract %" },
];
const MODE_OPTIONS_REVERSE = [
  { value: "subtract" as const, label: "After a decrease" },
  { value: "add" as const, label: "After an increase" },
];

function Card({ id, title, question, children }: { id: string; title: string; question: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <h2 id={id} className="text-base font-semibold text-fg">
          {title}
        </h2>
        <p className="text-xs text-muted">{question}</p>
      </div>
      {children}
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
}) {
  const invalid = parseNumber(value).kind === "invalid";
  return (
    <Input
      label={label}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      value={value}
      placeholder={placeholder}
      suffix={suffix}
      onChange={(e) => onChange(e.target.value)}
      error={invalid ? "Enter a number, e.g. 25 or -3.5" : undefined}
      containerClassName="min-w-0"
    />
  );
}

function ResultArea({ outcome }: { outcome: Outcome }) {
  if (outcome.status === "error") {
    return (
      <Alert variant="warning" title="No result">
        {outcome.message}
      </Alert>
    );
  }
  if (outcome.status !== "ok") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-4 text-sm text-muted" aria-live="polite">
        {outcome.status === "invalid" ? "Fix the highlighted field to see the result." : "Enter both numbers to see the result."}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 px-3 py-3" aria-live="polite">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <output className="min-w-0 break-all text-2xl font-semibold tabular-nums tracking-tight text-primary" data-testid="result">
            {outcome.headline}
          </output>
          {outcome.badge}
        </div>
        <CopyButton text={outcome.copy} size="sm" variant="secondary" className="shrink-0" />
      </div>
      <p className="break-words font-mono text-xs text-fg-secondary" data-testid="formula">
        {outcome.formula}
      </p>
      <p className="text-sm text-fg-secondary" data-testid="explanation">
        {outcome.explanation}
      </p>
      {outcome.extra && <p className="text-xs text-muted">{outcome.extra}</p>}
      {outcome.note && <p className="text-xs text-warning">{outcome.note}</p>}
    </div>
  );
}

export default function PercentageCalculator() {
  const [f, setF] = usePersistentState<Fields>("percentage-calculator:v1", EXAMPLES);
  const set = <K extends keyof Fields>(key: K) => (value: Fields[K]) => setF((prev) => ({ ...prev, [key]: value }));

  const results = useMemo(
    () => ({
      of: calcPercentOf(f.ofP, f.ofY),
      what: calcWhatPercent(f.whatX, f.whatY),
      change: calcChange(f.chFrom, f.chTo),
      diff: calcDifference(f.diffA, f.diffB),
      apply: calcApply(f.addValue, f.addP, f.addMode),
      reverse: calcReverse(f.revFinal, f.revP, f.revMode),
    }),
    [f],
  );

  const allResults = [
    results.of,
    results.what,
    results.change,
    results.diff,
    results.apply,
    results.reverse,
  ]
    .filter((r): r is Extract<Outcome, { status: "ok" }> => r.status === "ok")
    .map((r) => r.copy)
    .join("\n");

  const isEmpty = Object.entries(f).every(([k, v]) => k.endsWith("Mode") || v === "");

  return (
    <ToolPanel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card id="pc-percent-of" title="What is X% of Y?" question="Find a percentage of a number, e.g. a 20% tip on a 150 bill.">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Percentage (X)" value={f.ofP} onChange={set("ofP")} suffix="%" placeholder="20" />
            <NumberField label="Of number (Y)" value={f.ofY} onChange={set("ofY")} placeholder="150" />
          </div>
          <ResultArea outcome={results.of} />
        </Card>

        <Card id="pc-what-percent" title="X is what percent of Y?" question="Turn a part and a whole into a percentage, e.g. 45 correct answers out of 60.">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Part (X)" value={f.whatX} onChange={set("whatX")} placeholder="45" />
            <NumberField label="Whole (Y)" value={f.whatY} onChange={set("whatY")} placeholder="60" />
          </div>
          <ResultArea outcome={results.what} />
        </Card>

        <Card id="pc-change" title="Percentage change (increase / decrease)" question="How much did a value rise or fall from an old value to a new one?">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <NumberField label="From (old)" value={f.chFrom} onChange={set("chFrom")} placeholder="80" />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Swap old and new values"
              title="Swap"
              onClick={() => setF((prev) => ({ ...prev, chFrom: prev.chTo, chTo: prev.chFrom }))}
              className="mb-0.5"
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden />
            </Button>
            <NumberField label="To (new)" value={f.chTo} onChange={set("chTo")} placeholder="100" />
          </div>
          <ResultArea outcome={results.change} />
        </Card>

        <Card id="pc-difference" title="Percentage difference" question="Compare two values when neither one is the starting point, e.g. two store prices.">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Value A" value={f.diffA} onChange={set("diffA")} placeholder="120" />
            <NumberField label="Value B" value={f.diffB} onChange={set("diffB")} placeholder="150" />
          </div>
          <ResultArea outcome={results.diff} />
        </Card>

        <Card id="pc-apply" title="Add or subtract a percentage" question="Price plus sales tax, salary plus a raise, or price minus a discount.">
          <Tabs label="Add or subtract" size="sm" value={f.addMode} onChange={set("addMode")} options={MODE_OPTIONS_APPLY} className="self-start" />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Starting value" value={f.addValue} onChange={set("addValue")} placeholder="80" />
            <NumberField label={f.addMode === "add" ? "Percent to add" : "Percent to subtract"} value={f.addP} onChange={set("addP")} suffix="%" placeholder="8.25" />
          </div>
          <ResultArea outcome={results.apply} />
        </Card>

        <Card id="pc-reverse" title="Reverse percentage (find the original)" question="Work backwards from a final value, e.g. the price before a 15% discount.">
          <Tabs label="Direction of the change" size="sm" value={f.revMode} onChange={set("revMode")} options={MODE_OPTIONS_REVERSE} className="self-start" />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Final value" value={f.revFinal} onChange={set("revFinal")} placeholder="68" />
            <NumberField label={f.revMode === "add" ? "Increase applied" : "Decrease applied"} value={f.revP} onChange={set("revP")} suffix="%" placeholder="15" />
          </div>
          <ResultArea outcome={results.reverse} />
        </Card>
      </div>

      <ToolActions>
        <CopyButton text={allResults} label="Copy all results" variant="primary" disabled={!allResults} />
        <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={() => setF(EXAMPLES)}>
          Load examples
        </Button>
        <Button variant="secondary" leftIcon={<X className="h-4 w-4" aria-hidden />} onClick={() => setF(EMPTY)} disabled={isEmpty}>
          Clear all
        </Button>
      </ToolActions>

      <p className="text-xs text-muted">
        Results are rounded to 4 decimal places for display. Financial results (prices, tax, discounts, pay) are estimates for informational purposes only.
      </p>
    </ToolPanel>
  );
}
