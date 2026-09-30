"use client";

import { useMemo, type ReactNode } from "react";
import { Download, RotateCcw } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Button, CopyButton, Input, Select, Stat, StatGrid, ToolActions, ToolGrid, ToolPanel } from "@/components/ui";
import { cn, downloadText } from "@/lib/utils";
import {
  CURRENCIES,
  CURRENCY_SYMBOLS,
  DEFAULT_FIELDS,
  OT_MULTIPLIERS,
  evaluate,
  formatMoney,
  formatMoneyExact,
  formatNum,
  formulaText,
  quickTable,
  summaryText,
  toCsv,
  type Currency,
  type Evaluation,
  type FieldErrors,
  type FieldKey,
  type Fields,
  type PayResult,
  type PayValues,
} from "./logic";

const STORAGE_KEY = "hourly-to-salary-calculator:v1";

const TEXT_KEYS = ["rate", "hours", "days", "weeks", "unpaidWeeks", "unpaidDays", "otHours"] as const;

/**
 * Stored state comes from session storage and may be missing, from an older
 * version of the page or edited by hand. Rebuild it field by field so a bad
 * value can never crash the calculator.
 */
function normalizeFields(stored: unknown): Fields {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const out: Fields = { ...DEFAULT_FIELDS };
  for (const key of TEXT_KEYS) {
    const v = src[key];
    if (typeof v === "string") out[key] = v;
    else if (typeof v === "number" && Number.isFinite(v)) out[key] = String(v);
  }
  if (typeof src.otMult === "string" && (OT_MULTIPLIERS as readonly string[]).includes(src.otMult)) out.otMult = src.otMult;
  if (typeof src.currency === "string" && (CURRENCIES as readonly string[]).includes(src.currency)) out.currency = src.currency as Currency;
  return out;
}

interface Preset {
  id: string;
  label: string;
  hours: string;
  days: string;
  weeks: string;
  unpaidWeeks: string;
}

const PRESETS: Preset[] = [
  { id: "full", label: "Full-time (40 h)", hours: "40", days: "5", weeks: "52", unpaidWeeks: "" },
  { id: "part", label: "Part-time (20 h)", hours: "20", days: "5", weeks: "52", unpaidWeeks: "" },
  { id: "4x10", label: "4 × 10-hour days", hours: "40", days: "4", weeks: "52", unpaidWeeks: "" },
  { id: "4day", label: "Four-day week (32 h)", hours: "32", days: "4", weeks: "52", unpaidWeeks: "" },
  { id: "school", label: "School year (40 weeks)", hours: "40", days: "5", weeks: "40", unpaidWeeks: "" },
  { id: "unpaid2", label: "Full-time, 2 unpaid weeks", hours: "40", days: "5", weeks: "52", unpaidWeeks: "2" },
];

function isPresetActive(f: Fields, p: Preset): boolean {
  const blank = (s: string) => s.trim() === "" || Number(s) === 0;
  const same = (a: string, b: string) => (blank(a) && blank(b)) || (a.trim() !== "" && Number(a) === Number(b));
  return same(f.hours, p.hours) && same(f.days, p.days) && same(f.weeks, p.weeks) && same(f.unpaidWeeks, p.unpaidWeeks) && blank(f.unpaidDays) && blank(f.otHours);
}

const MULTIPLIER_LABELS: Record<string, string> = {
  "1.25": "1.25x",
  "1.5": "1.5x",
  "1.75": "1.75x",
  "2": "2x",
  "2.5": "2.5x",
};

const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "USD ($)",
  GBP: "GBP (£)",
  EUR: "EUR (€)",
  CAD: "CAD (CA$)",
  AUD: "AUD (A$)",
};

function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="label-mono">{children}</p>;
}

function NumberField({
  id,
  label,
  value,
  onChange,
  errors,
  placeholder,
  prefix,
  suffix,
}: {
  id: FieldKey;
  label: string;
  value: string;
  onChange: (v: string) => void;
  errors: FieldErrors;
  placeholder?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}) {
  return (
    <Input
      label={label}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      value={value}
      placeholder={placeholder}
      prefix={prefix}
      suffix={suffix}
      onChange={(e) => onChange(e.target.value)}
      error={errors[id]}
      containerClassName="min-w-0"
      data-testid={`field-${id}`}
    />
  );
}

function BreakdownRow({ label, value, testId }: { label: ReactNode; value: ReactNode; testId?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-[13px] text-fg-secondary">{label}</dt>
      <dd className="text-right font-mono text-[13px] font-medium tabular-nums text-fg" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}

function Results({ ev, currency }: { ev: Evaluation; currency: Currency }) {
  if (ev.status === "empty") {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface-2 px-4 py-6 text-sm text-muted" aria-live="polite" data-testid="results-empty">
        Enter an hourly rate, hours per week, days per week and weeks per year to see the salary.
      </div>
    );
  }
  if (ev.status === "invalid") {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface-2 px-4 py-6 text-sm text-muted" aria-live="polite" data-testid="results-invalid">
        Fix the highlighted fields to see the salary.
      </div>
    );
  }
  const { values: v, result: r, notices } = ev;
  const periodAmount = (key: string) => r.periods.find((p) => p.key === key)?.amount ?? 0;
  const money = (n: number) => formatMoney(n, currency);
  const unpaid = r.unpaidWeeksTotal > 0;

  return (
    <div className="flex flex-col gap-4" aria-live="polite" data-testid="results">
      <StatGrid className="sm:grid-cols-3 lg:grid-cols-3">
        <Stat
          emphasis
          className="col-span-2 sm:col-span-3"
          label="Annual salary (gross)"
          value={<span data-testid="annual">{money(r.annual)}</span>}
          hint={
            <>
              {formulaText(v, r, currency)} = <span className="font-medium text-fg-secondary">{money(r.annual)}</span>
            </>
          }
        />
        <Stat label="Monthly" value={<span data-testid="monthly">{money(periodAmount("monthly"))}</span>} hint="annual ÷ 12" />
        <Stat label="Semi-monthly" value={<span data-testid="semimonthly">{money(periodAmount("semimonthly"))}</span>} hint="annual ÷ 24" />
        <Stat label="Biweekly" value={<span data-testid="biweekly">{money(periodAmount("biweekly"))}</span>} hint="annual ÷ 26" />
        <Stat label="Weekly" value={<span data-testid="weekly">{money(periodAmount("weekly"))}</span>} hint="annual ÷ 52" />
        <Stat label="Daily" value={<span data-testid="daily">{money(periodAmount("daily"))}</span>} hint="per day worked" />
        <Stat label="Hours per year" value={<span data-testid="hours-year">{formatNum(r.hoursPerYear)}</span>} hint={`${formatNum(r.daysPerYear)} working days`} />
      </StatGrid>

      <dl className="divide-y divide-border rounded-lg border border-border bg-surface px-3.5 py-1.5">
        <BreakdownRow label="Regular pay for the year" value={money(r.regularAnnual)} testId="regular-annual" />
        {v.otHours > 0 && <BreakdownRow label={`Overtime pay at ${formatNum(v.otMult)}x`} value={money(r.overtimeAnnual)} testId="overtime-annual" />}
        {unpaid && (
          <BreakdownRow
            label="Weeks paid after unpaid time off"
            value={`${formatNum(r.weeksWorked)} of ${formatNum(v.weeks)}`}
            testId="weeks-worked"
          />
        )}
        <BreakdownRow label="Pay in a week you work" value={money(r.perWorkedWeek)} testId="per-worked-week" />
        {v.otHours > 0 && <BreakdownRow label="Average hourly pay with overtime" value={formatMoneyExact(r.effectiveHourly, currency)} testId="effective-hourly" />}
        <BreakdownRow label={`Each extra ${formatMoney(1, currency)} an hour adds`} value={`${money(r.perDollarRaise)} a year`} testId="per-dollar" />
      </dl>

      {notices.map((n) => (
        <Alert key={n.title} variant={n.variant} title={n.title}>
          {n.text}
        </Alert>
      ))}

      <Alert variant="info" title="Gross pay, before tax">
        These figures are estimates before income tax, payroll taxes, benefits and other deductions, so your take-home pay will be lower. This is not payroll, tax or financial advice.
      </Alert>
    </div>
  );
}

function QuickReference({ base, rate, currency, onPick }: { base: Evaluation; rate: number | null; currency: Currency; onPick: (rate: number) => void }) {
  if (base.status !== "ok") {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface-2 px-4 py-4 text-sm text-muted">
        Fill in the hours and weeks above to see this table.
      </div>
    );
  }
  const rows = quickTable(base.values);
  return (
    <div className="scroll-thin overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[20rem] border-collapse text-right text-[13px] tabular-nums" data-testid="quick-table">
        <thead>
          <tr className="border-b border-border bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Hourly
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Weekly
            </th>
            <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">
              Biweekly
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Monthly
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Annual
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const active = rate !== null && Math.abs(rate - row.rate) < 1e-9;
            return (
              <tr key={row.rate} className={cn("border-b border-border last:border-b-0", active && "bg-primary-soft")} data-testid={`quick-row-${row.rate}`}>
                <th scope="row" className="px-3 py-1.5 text-left font-normal">
                  <button
                    type="button"
                    onClick={() => onPick(row.rate)}
                    className="rounded font-mono font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label={`Use ${formatMoney(row.rate, currency)} an hour`}
                    aria-pressed={active}
                  >
                    {formatMoney(row.rate, currency)}
                  </button>
                </th>
                <td className="px-3 py-1.5 text-fg-secondary">{formatMoney(row.weekly, currency)}</td>
                <td className="hidden px-3 py-1.5 text-fg-secondary sm:table-cell">{formatMoney(row.biweekly, currency)}</td>
                <td className="px-3 py-1.5 text-fg-secondary">{formatMoney(row.monthly, currency)}</td>
                <td className="px-3 py-1.5 font-medium text-fg">{formatMoney(row.annual, currency)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function describeUsed(v: PayValues, r: PayResult): string {
  const otText = v.otHours > 0 ? `, plus ${formatNum(v.otHours)} overtime hours a week` : "";
  return `${formatNum(v.hours)} hours a week for ${formatNum(r.weeksWorked)} paid weeks${otText}`;
}

export default function HourlyToSalaryCalculator() {
  const [stored, setStored] = usePersistentState<Fields>(STORAGE_KEY, DEFAULT_FIELDS);
  const f = useMemo(() => normalizeFields(stored), [stored]);
  const set = <K extends keyof Fields>(key: K) => (value: Fields[K]) => setStored((prev) => ({ ...normalizeFields(prev), [key]: value }));

  const ev = useMemo(() => evaluate(f), [f]);
  // The quick reference table ignores the typed rate, so validate the schedule with a placeholder rate.
  const base = useMemo(() => evaluate({ ...f, rate: "1" }), [f]);
  const currency = f.currency;
  const symbol = CURRENCY_SYMBOLS[currency];
  const rateNumber = ev.status === "ok" ? ev.values.rate : null;

  const applyPreset = (p: Preset) =>
    setStored((prev) => ({ ...normalizeFields(prev), hours: p.hours, days: p.days, weeks: p.weeks, unpaidWeeks: p.unpaidWeeks, unpaidDays: "", otHours: "" }));

  const ok = ev.status === "ok" ? ev : null;

  return (
    <ToolPanel>
      <div className="flex flex-col gap-2">
        <GroupLabel>Schedule presets</GroupLabel>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Schedule presets">
          {PRESETS.map((p) => {
            const active = isPresetActive(f, p);
            return (
              <Button key={p.id} size="sm" variant={active ? "primary" : "secondary"} aria-pressed={active} onClick={() => applyPreset(p)}>
                {p.label}
              </Button>
            );
          })}
        </div>
      </div>

      <ToolGrid className="items-start gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex flex-col gap-5">
          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="mb-2 label-mono">Pay</legend>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="rate" label="Hourly rate" value={f.rate} onChange={set("rate")} errors={ev.errors} placeholder="25" prefix={symbol} suffix="/hr" />
              <Select
                label="Currency"
                value={currency}
                onChange={(e) => set("currency")(e.target.value as Currency)}
                options={CURRENCIES.map((c) => ({ value: c, label: CURRENCY_LABELS[c] }))}
                containerClassName="min-w-0"
              />
            </div>
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="mb-2 label-mono">Schedule</legend>
            <div className="grid grid-cols-3 gap-3">
              <NumberField id="hours" label="Hours per week" value={f.hours} onChange={set("hours")} errors={ev.errors} placeholder="40" />
              <NumberField id="days" label="Days per week" value={f.days} onChange={set("days")} errors={ev.errors} placeholder="5" />
              <NumberField id="weeks" label="Weeks per year" value={f.weeks} onChange={set("weeks")} errors={ev.errors} placeholder="52" />
            </div>
            <p className="text-xs text-muted">Use 52 weeks if your paid holidays and vacation are included in your pay. Only unpaid time off comes out below.</p>
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="mb-2 label-mono">Unpaid time off (optional)</legend>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="unpaidWeeks" label="Unpaid weeks" value={f.unpaidWeeks} onChange={set("unpaidWeeks")} errors={ev.errors} placeholder="0" />
              <NumberField id="unpaidDays" label="Unpaid days" value={f.unpaidDays} onChange={set("unpaidDays")} errors={ev.errors} placeholder="0" />
            </div>
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="mb-2 label-mono">Overtime (optional)</legend>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="otHours" label="Overtime hours per week" value={f.otHours} onChange={set("otHours")} errors={ev.errors} placeholder="0" />
              <Select
                label="Overtime pay rate"
                value={f.otMult}
                onChange={(e) => set("otMult")(e.target.value)}
                options={OT_MULTIPLIERS.map((m) => ({ value: m, label: MULTIPLIER_LABELS[m] }))}
                containerClassName="min-w-0"
              />
            </div>
            <p className="text-xs text-muted">Overtime hours are extra hours on top of your regular hours, paid at your rate times the multiplier (1.5x is time and a half, 2x is double time).</p>
          </fieldset>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="label-mono shrink-0">Your pay</h2>
            {ok && <p className="text-xs text-muted sm:text-right">{describeUsed(ok.values, ok.result)}</p>}
          </div>
          <Results ev={ev} currency={currency} />
        </div>
      </ToolGrid>

      <ToolActions>
        <CopyButton text={ok ? summaryText(ok.values, ok.result, currency) : ""} label="Copy summary" variant="primary" disabled={!ok} />
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" aria-hidden />}
          disabled={!ok}
          onClick={() => ok && downloadText(toCsv(ok.values, ok.result, currency), "hourly-to-salary.csv", "text/csv;charset=utf-8")}
        >
          Download CSV
        </Button>
        <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={() => setStored(DEFAULT_FIELDS)}>
          Reset
        </Button>
      </ToolActions>

      <section className="flex flex-col gap-3 border-t border-border pt-5" aria-labelledby="h2s-quick-ref">
        <div>
          <h2 id="h2s-quick-ref" className="text-sm font-semibold text-fg">
            Quick reference: {formatMoney(15, currency)} to {formatMoney(100, currency)} an hour
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Uses the schedule, unpaid time off and overtime settings above (all before tax). Select a rate to load it into the calculator.
          </p>
        </div>
        <QuickReference base={base} rate={rateNumber} currency={currency} onPick={(r) => set("rate")(String(r))} />
      </section>
    </ToolPanel>
  );
}
