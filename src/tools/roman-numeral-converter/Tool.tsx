"use client";

import { useMemo, type ReactNode } from "react";
import { ArrowLeftRight, CalendarDays, Download, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Input, Select, Tabs, ToolActions, ToolGrid, ToolPanel, ToolSection, Toggle } from "@/components/ui";
import { downloadText } from "@/lib/utils";
import {
  MAX_STANDARD,
  MAX_VALUE,
  MONTH_NAMES,
  SYMBOLS,
  chartCsv,
  chartRows,
  chartText,
  convert,
  convertDate,
  fmt,
  parseYearStart,
  segmentsFromUnicode,
  withCase,
  type BreakdownBlock,
  type ChartRow,
  type DateOrder,
  type RomanForm,
  type RomanSegment,
  type SeparatorKey,
  type YearStyle,
} from "./logic";

type Mode = "convert" | "date" | "charts";
type ChartKind = "numbers" | "years";

interface Settings {
  mode: Mode;
  input: string;
  lowercase: boolean;
  month: string;
  day: string;
  year: string;
  order: DateOrder;
  separator: SeparatorKey;
  yearStyle: YearStyle;
  chart: ChartKind;
  yearsStart: string;
}

const DEFAULTS: Settings = {
  mode: "convert",
  input: "2026",
  lowercase: false,
  month: "6",
  day: "15",
  year: "2024",
  order: "mdy",
  separator: "dot",
  yearStyle: "full",
  chart: "numbers",
  yearsStart: "2000",
};

const MODES: readonly Mode[] = ["convert", "date", "charts"];
const ORDERS: readonly DateOrder[] = ["mdy", "dmy", "ymd"];
const SEPARATOR_KEYS: readonly SeparatorKey[] = ["dot", "dash", "slash", "space", "middot", "bullet"];
const YEAR_STYLES: readonly YearStyle[] = ["full", "short", "split"];
const CHARTS: readonly ChartKind[] = ["numbers", "years"];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * Stored state comes from session storage and may be missing, outdated or hand-edited.
 * Rebuild it field by field so a bad value can never crash the tool.
 */
function normalizeSettings(stored: unknown): Settings {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const text = (key: keyof Settings): string => {
    const v = src[key];
    if (typeof v === "string") return v;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    return DEFAULTS[key] as string;
  };
  return {
    mode: pick(src.mode, MODES, DEFAULTS.mode),
    input: text("input"),
    lowercase: typeof src.lowercase === "boolean" ? src.lowercase : DEFAULTS.lowercase,
    month: /^(?:[1-9]|1[0-2])$/.test(text("month")) ? text("month") : DEFAULTS.month,
    day: text("day"),
    year: text("year"),
    order: pick(src.order, ORDERS, DEFAULTS.order),
    separator: pick(src.separator, SEPARATOR_KEYS, DEFAULTS.separator),
    yearStyle: pick(src.yearStyle, YEAR_STYLES, DEFAULTS.yearStyle),
    chart: pick(src.chart, CHARTS, DEFAULTS.chart),
    yearsStart: text("yearsStart"),
  };
}

type Update = (patch: Partial<Settings>) => void;

/** Roman text with a CSS overline on the segments that carry a vinculum. */
function RomanText({ segments }: { segments: RomanSegment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.overline ? (
          <span key={i} className="mr-[0.08em] overline decoration-2" data-overline="true">
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

function describeForm(form: RomanForm): string {
  return form.segments.map((s) => (s.overline ? `${s.text} with an overline` : s.text)).join(", then ");
}

function equationFor(blocks: BreakdownBlock[], total: number): string {
  const parts = blocks.map((b) => {
    const expr = b.rows.map((r) => fmt(r.value)).join(" + ");
    return b.multiplier > 1 ? (b.rows.length > 1 ? `(${expr}) × ${fmt(b.multiplier)}` : `${expr} × ${fmt(b.multiplier)}`) : expr;
  });
  return `${parts.join(" + ")} = ${fmt(total)}`;
}

function BreakdownTables({ blocks }: { blocks: BreakdownBlock[] }) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, bi) => (
        <div key={bi} className="overflow-hidden rounded-lg border border-border">
          {block.title && <p className="border-b border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-fg-secondary">{block.title}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[19rem] table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th scope="col" className="label-mono w-[27%] px-3 py-1.5 text-left font-normal">
                    Place
                  </th>
                  <th scope="col" className="label-mono w-[25%] px-3 py-1.5 text-left font-normal">
                    Letters
                  </th>
                  <th scope="col" className="label-mono w-[26%] px-3 py-1.5 text-left font-normal">
                    Parts
                  </th>
                  <th scope="col" className="label-mono w-[22%] px-3 py-1.5 text-right font-normal">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {block.rows.map((row) => (
                  <tr key={row.place}>
                    <td className="px-3 py-1.5 text-fg-secondary">{row.place}</td>
                    <td className="px-3 py-1.5 font-mono font-semibold text-fg">
                      {block.overline ? <span className="overline decoration-2">{row.letters}</span> : row.letters}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs text-muted">{row.how}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-fg">{fmt(row.value)}</td>
                  </tr>
                ))}
              </tbody>
              {block.multiplier > 1 && (
                <tfoot>
                  <tr className="border-t border-border-strong bg-surface-2">
                    <td colSpan={3} className="px-3 py-1.5 text-xs text-fg-secondary">
                      {fmt(block.sum)} × {fmt(block.multiplier)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-semibold tabular-nums text-fg">{fmt(block.sum * block.multiplier)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

const TRY_EXAMPLES = ["2026", "1994", "3999", "4000", "XLII", "MCMXCIV", "IIII", "IC"];

const SYMBOL_CHIPS = (
  <div className="flex flex-wrap items-center gap-1.5" role="list" aria-label="Roman numeral symbols and their values">
    <span className="label-mono mr-1">Symbols</span>
    {SYMBOLS.map((s) => (
      <span key={s.letter} role="listitem" className="inline-flex items-baseline gap-1.5 rounded-md border border-border bg-surface-2 px-2 py-1">
        <span className="font-mono text-sm font-semibold text-fg">{s.letter}</span>
        <span className="font-mono text-xs tabular-nums text-muted">{fmt(s.value)}</span>
      </span>
    ))}
  </div>
);

function ResultPlaceholder({ children }: { children: string }) {
  return (
    <div className="flex min-h-[9rem] items-center rounded-lg border border-dashed border-border bg-surface-2 px-4 py-4 text-sm text-muted" aria-live="polite">
      {children}
    </div>
  );
}

function ConvertMode({ s, update }: { s: Settings; update: Update }) {
  const result = useMemo(() => convert(s.input), [s.input]);

  let resultArea: ReactNode;
  let steps: ReactNode = null;

  if (result.kind === "empty") {
    resultArea = <ResultPlaceholder>{`Type a number from 1 to ${fmt(MAX_VALUE)}, or a Roman numeral, and the conversion appears here.`}</ResultPlaceholder>;
  } else if (result.kind === "error") {
    resultArea = (
      <Alert variant="error" title={result.source === "number" ? "That number cannot be converted" : "That is not a valid Roman numeral"}>
        {result.message}
      </Alert>
    );
  } else if (result.kind === "to-roman") {
    const form = withCase(result.form, s.lowercase);
    resultArea = (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-4" aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <span className="label-mono">Roman numeral</span>
          <Badge variant="outline">= {fmt(form.value)}</Badge>
        </div>
        <output
          data-testid="roman-result"
          aria-label={`${fmt(form.value)} in Roman numerals: ${describeForm(form)}`}
          className="block break-all font-mono text-3xl font-semibold tracking-wide text-primary sm:text-4xl"
        >
          <RomanText segments={form.segments} />
        </output>
        <ToolActions>
          <CopyButton text={form.unicode} label={form.value > MAX_STANDARD ? "Copy with overline" : "Copy"} size="sm" />
          {form.repeatedM && <CopyButton text={form.repeatedM} label="Copy repeated-M form" variant="secondary" size="sm" />}
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeftRight className="h-4 w-4" aria-hidden />} onClick={() => update({ input: form.unicode })}>
            Convert back
          </Button>
        </ToolActions>
        {form.value > MAX_STANDARD && (
          <p className="text-xs text-muted" data-testid="vinculum-note">
            Standard numerals stop at {fmt(MAX_STANDARD)}. Above that, an overline multiplies the letters under it by 1,000. It is drawn with CSS here; the copied text adds a
            Unicode combining overline (U+0305) after each overlined letter, which some fonts draw unevenly.
            {form.repeatedM && <> Older texts also repeat M instead ({form.repeatedM}).</>}
          </p>
        )}
      </div>
    );
    steps = (
      <ToolSection title="Step by step" description="Each place value (thousands, hundreds, tens, ones) is written on its own, then the pieces are joined from largest to smallest.">
        <BreakdownTables blocks={result.blocks} />
        <p className="break-words font-mono text-xs text-fg-secondary" data-testid="equation">
          {equationFor(result.blocks, result.value)}
        </p>
      </ToolSection>
    );
  } else {
    const p = result.parse;
    if (p.kind === "valid") {
      const styleLabel = p.style === "standard" ? "Standard numeral" : p.style === "overline" ? "Overline (vinculum) numeral" : "Repeated-M numeral";
      resultArea = (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-4" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <span className="label-mono">Number</span>
            <Badge variant="success">{styleLabel}</Badge>
          </div>
          <output data-testid="number-result" className="block break-all font-mono text-3xl font-semibold tabular-nums tracking-tight text-primary sm:text-4xl">
            {fmt(p.value)}
          </output>
          <p className="break-all font-mono text-sm text-fg-secondary">
            <RomanText segments={segmentsFromUnicode(p.display)} /> = {fmt(p.value)}
          </p>
          <ToolActions>
            <CopyButton text={String(p.value)} label="Copy number" size="sm" />
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeftRight className="h-4 w-4" aria-hidden />} onClick={() => update({ input: String(p.value) })}>
              Convert back
            </Button>
          </ToolActions>
          {p.style === "repeated-m" && (
            <p className="text-xs text-muted">
              Repeating M is an older way to go past 3,999. The overline form of {fmt(p.value)} is <span className="font-mono text-fg">{p.canonical.unicode}</span>.
            </p>
          )}
        </div>
      );
      steps = (
        <ToolSection title="Step by step" description="Each group of letters is read on its own, then the values are added. A smaller letter in front of a larger one is subtracted.">
          <BreakdownTables blocks={p.blocks} />
          <p className="break-words font-mono text-xs text-fg-secondary" data-testid="equation">
            {equationFor(p.blocks, p.value)}
          </p>
        </ToolSection>
      );
    } else {
      const suggestion = p.suggestion;
      resultArea = (
        <div className="flex flex-col gap-3" aria-live="polite">
          <Alert variant="warning" title={`${p.display} is not a standard Roman numeral`}>
            <span data-testid="nonstandard-reason">{p.reason}</span>
          </Alert>
          {p.value !== null ? (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="label-mono">Loose reading</span>
                <Badge variant="warning">Non-standard</Badge>
              </div>
              <output data-testid="loose-result" className="block break-all font-mono text-3xl font-semibold tabular-nums tracking-tight text-fg">
                {fmt(p.value)}
              </output>
              {suggestion ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-fg-secondary">
                    The standard form of {fmt(p.value)} is <span className="font-mono font-semibold text-fg">{suggestion.unicode}</span>.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => update({ input: suggestion.unicode })}>
                    Use {suggestion.unicode}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-fg-secondary">These letters already spell the standard form, but in a way the rules do not allow.</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted">These letters can be read in more than one way, so no value is shown. Rewrite the amount from the largest value to the smallest.</p>
          )}
        </div>
      );
    }
  }

  return (
    <>
      <ToolGrid>
        <div className="flex flex-col gap-3">
          <Input
            label="Number or Roman numeral"
            hint={`Digits give a Roman numeral (1 to ${fmt(MAX_VALUE)}). Letters give a number.`}
            value={s.input}
            onChange={(e) => update({ input: e.target.value })}
            placeholder="2026 or MMXXVI"
            inputSize="lg"
            className="font-mono"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label-mono mr-1">Try</span>
            {TRY_EXAMPLES.map((ex) => (
              <Button key={ex} variant="secondary" size="sm" className="font-mono" aria-label={`Try ${ex}`} onClick={() => update({ input: ex })}>
                {ex}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Toggle label="Lowercase letters" description="i, ii, iii for preface pages" checked={s.lowercase} onChange={(lowercase) => update({ lowercase })} />
            <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" aria-hidden />} onClick={() => update({ input: "" })} disabled={!s.input}>
              Clear
            </Button>
          </div>
        </div>
        <div className="min-w-0">{resultArea}</div>
      </ToolGrid>
      {steps}
      {SYMBOL_CHIPS}
    </>
  );
}

const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => ({ value: String(i + 1), label: `${i + 1} – ${name}` }));
const ORDER_OPTIONS: { value: DateOrder; label: string }[] = [
  { value: "mdy", label: "Month, day, year (US)" },
  { value: "dmy", label: "Day, month, year (UK, EU)" },
  { value: "ymd", label: "Year, month, day (ISO)" },
];
const SEPARATOR_OPTIONS: { value: SeparatorKey; label: string }[] = [
  { value: "dot", label: "Dot ( . )" },
  { value: "dash", label: "Dash ( - )" },
  { value: "slash", label: "Slash ( / )" },
  { value: "space", label: "Space" },
  { value: "middot", label: "Middle dot ( · )" },
  { value: "bullet", label: "Bullet ( • )" },
];
const YEAR_STYLE_OPTIONS: { value: YearStyle; label: string }[] = [
  { value: "full", label: "Full year (2024 = MMXXIV)" },
  { value: "short", label: "Last two digits (24 = XXIV)" },
  { value: "split", label: "Two halves (20 and 24 = XX, XXIV)" },
];

function DateMode({ s, update }: { s: Settings; update: Update }) {
  const result = useMemo(
    () => convertDate({ month: s.month, day: s.day, year: s.year, order: s.order, separator: s.separator, yearStyle: s.yearStyle }),
    [s.month, s.day, s.year, s.order, s.separator, s.yearStyle],
  );

  const useToday = () => {
    const now = new Date();
    update({ month: String(now.getMonth() + 1), day: String(now.getDate()), year: String(now.getFullYear()) });
  };

  const ambiguous = result.kind === "ok" && s.order !== "ymd" && Number(s.day) <= 12 && Number(s.day) !== Number(s.month);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <Select label="Month" options={MONTH_OPTIONS} value={s.month} onChange={(e) => update({ month: e.target.value })} containerClassName="col-span-2 sm:col-span-1" />
        <Input label="Day" inputMode="numeric" autoComplete="off" placeholder="15" value={s.day} onChange={(e) => update({ day: e.target.value })} containerClassName="min-w-0" />
        <Input label="Year" inputMode="numeric" autoComplete="off" placeholder="2024" value={s.year} onChange={(e) => update({ year: e.target.value })} containerClassName="min-w-0" />
        <Button variant="secondary" className="col-span-2 sm:col-span-1" leftIcon={<CalendarDays className="h-4 w-4" aria-hidden />} onClick={useToday}>
          Use today
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Select label="Order" options={ORDER_OPTIONS} value={s.order} onChange={(e) => update({ order: e.target.value as DateOrder })} />
        <Select label="Separator" options={SEPARATOR_OPTIONS} value={s.separator} onChange={(e) => update({ separator: e.target.value as SeparatorKey })} />
        <Select label="Year style" options={YEAR_STYLE_OPTIONS} value={s.yearStyle} onChange={(e) => update({ yearStyle: e.target.value as YearStyle })} />
      </div>

      {result.kind === "empty" && <ResultPlaceholder>Enter a day and a year (1 to 3,999) to see the date in Roman numerals.</ResultPlaceholder>}
      {result.kind === "error" && (
        <Alert variant="error" title="That date cannot be converted">
          {result.message}
        </Alert>
      )}
      {result.kind === "ok" && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-surface-2 p-4" aria-live="polite">
            <div className="flex items-center justify-between gap-2">
              <span className="label-mono">Roman numeral date</span>
              <Badge variant="outline">{result.arabic}</Badge>
            </div>
            <output data-testid="date-result" className="block whitespace-pre-wrap break-words font-mono text-2xl font-semibold tracking-wide text-primary sm:text-3xl">
              {result.roman}
            </output>
            <ToolActions>
              <CopyButton text={result.roman} label="Copy" size="sm" />
              <CopyButton text={result.stacked} label="Copy on separate lines" variant="secondary" size="sm" />
            </ToolActions>
            {ambiguous && (
              <p className="text-xs text-warning" data-testid="ambiguity-note">
                The day is 12 or less, so a reader could take the first two numerals as day and month or as month and day. Year-first order or a spelled-out month avoids the
                mix-up.
              </p>
            )}
            {result.notes.map((note) => (
              <p key={note} className="text-xs text-warning">
                {note}
              </p>
            ))}
          </div>
          <div className="min-w-0 overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[17rem] text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th scope="col" className="label-mono px-3 py-1.5 text-left font-normal">
                      Part
                    </th>
                    <th scope="col" className="label-mono px-3 py-1.5 text-right font-normal">
                      Number
                    </th>
                    <th scope="col" className="label-mono px-3 py-1.5 text-left font-normal">
                      Roman
                    </th>
                    <th scope="col" className="label-mono px-3 py-1.5 text-right font-normal">
                      Reads back
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.parts.map((part) => (
                    <tr key={part.label}>
                      <td className="px-3 py-1.5 text-fg-secondary">{part.label}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums text-fg">{part.arabic}</td>
                      <td className="px-3 py-1.5 font-mono font-semibold text-fg">{part.roman}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums text-muted">{part.readBack === null ? "?" : part.readBack}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <Alert variant="info" title="Check before you ink">
        Confirm the order, separator and every numeral with your tattoo artist, and read each part back before the design is finalized. Roman dates are written differently
        from country to country, so a design that looks right to you may read differently to someone else.
      </Alert>
    </>
  );
}

function ChartTables({ rows, numberHeading, caption }: { rows: ChartRow[]; numberHeading: string; caption: string }) {
  const per = Math.ceil(rows.length / 4);
  const columns = [0, 1, 2, 3].map((i) => rows.slice(i * per, (i + 1) * per)).filter((c) => c.length > 0);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {columns.map((col, ci) => (
        <div key={ci} className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">{`${caption}, ${col[0].n} to ${col[col.length - 1].n}`}</caption>
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th scope="col" className="label-mono px-3 py-1.5 text-left font-normal">
                  {numberHeading}
                </th>
                <th scope="col" className="label-mono px-3 py-1.5 text-left font-normal">
                  Roman
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {col.map((row) => (
                <tr key={row.n}>
                  <td className="px-3 py-1 font-mono tabular-nums text-muted">{row.n}</td>
                  <td className="px-3 py-1 font-mono font-medium text-fg">{row.roman}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

const YEAR_PRESETS = [1900, 2000, 2100];
const NUMBER_ROWS = chartRows(1, 100);

function ChartMode({ s, update }: { s: Settings; update: Update }) {
  const start = parseYearStart(s.yearsStart);
  const yearRows = useMemo(() => (start === null ? [] : chartRows(start, start + 99)), [start]);
  const rows = s.chart === "numbers" ? NUMBER_ROWS : yearRows;
  const filename = s.chart === "numbers" ? "roman-numerals-1-100.csv" : `roman-numeral-years-${start ?? "range"}.csv`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          label="Chart"
          value={s.chart}
          onChange={(chart) => update({ chart })}
          options={[
            { value: "numbers", label: "Numbers 1–100" },
            { value: "years", label: "Years" },
          ]}
        />
      </div>

      {s.chart === "years" && (
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="First year"
            hint="Shows 100 years in a row, from 1 to 3,999."
            inputMode="numeric"
            autoComplete="off"
            value={s.yearsStart}
            onChange={(e) => update({ yearsStart: e.target.value })}
            containerClassName="w-44"
            error={start === null && s.yearsStart.trim() !== "" ? "Enter a year from 1 to 3,900." : undefined}
          />
          <div className="flex flex-wrap items-center gap-1.5 pb-[1.55rem]">
            {YEAR_PRESETS.map((y) => (
              <Button key={y} variant="secondary" size="sm" className="font-mono" onClick={() => update({ yearsStart: String(y) })}>
                {y}s
              </Button>
            ))}
          </div>
        </div>
      )}

      {rows.length > 0 ? (
        <>
          <ChartTables rows={rows} numberHeading={s.chart === "numbers" ? "No." : "Year"} caption={s.chart === "numbers" ? "Roman numerals 1 to 100" : "Roman numeral years"} />
          <ToolActions>
            <CopyButton text={chartText(rows)} label="Copy chart" size="sm" />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="h-4 w-4" aria-hidden />}
              onClick={() => downloadText(chartCsv(rows, [s.chart === "numbers" ? "number" : "year", "roman"]), filename, "text/csv;charset=utf-8")}
            >
              Download CSV
            </Button>
          </ToolActions>
        </>
      ) : (
        <Alert variant="warning" title="Enter a first year">
          Type a year from 1 to 3,900 to list that year and the 99 after it.
        </Alert>
      )}
    </>
  );
}

export default function RomanNumeralConverter() {
  const [stored, setStored] = usePersistentState<Settings>("roman-numeral-converter:v1", DEFAULTS);
  const s = useMemo(() => normalizeSettings(stored), [stored]);
  const update: Update = (patch) => setStored((prev) => ({ ...normalizeSettings(prev), ...patch }));

  return (
    <ToolPanel>
      <Tabs
        label="Converter mode"
        value={s.mode}
        onChange={(mode) => update({ mode })}
        className="self-start"
        options={[
          { value: "convert", label: "Number ⇄ Roman" },
          { value: "date", label: "Date to Roman" },
          { value: "charts", label: "Charts" },
        ]}
      />
      {s.mode === "convert" && <ConvertMode s={s} update={update} />}
      {s.mode === "date" && <DateMode s={s} update={update} />}
      {s.mode === "charts" && <ChartMode s={s} update={update} />}
    </ToolPanel>
  );
}
