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
  PERIODS,
  PERIOD_INFO,
  SALARY_STEPS,
  compareOffers,
  evaluate,
  explainSteps,
  formatMoney,
  formatMoneyExact,
  formatNum,
  formatPct,
  hoursTable,
  offerResult,
  periodInfo,
  salaryTable,
  summaryText,
  toCsv,
  type CompareState,
  type Currency,
  type Evaluation,
  type FieldErrors,
  type FieldKey,
  type Fields,
  type OfferResult,
  type Period,
  type Schedule,
} from "./logic";

const STORAGE_KEY = "salary-to-hourly-calculator:v1";

const TEXT_KEYS = ["salary", "hours", "days", "weeks", "pto", "otHours", "cmpSalary", "cmpHours", "cmpPto"] as const;

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
  if (typeof src.period === "string" && (PERIODS as readonly string[]).includes(src.period)) out.period = src.period as Period;
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
}

const PRESETS: Preset[] = [
  { id: "full", label: "Standard (40 h × 52 wk)", hours: "40", days: "5", weeks: "52" },
  { id: "part", label: "Part-time (20 h)", hours: "20", days: "5", weeks: "52" },
  { id: "4day", label: "32-hour week", hours: "32", days: "4", weeks: "52" },
  { id: "45", label: "45-hour week", hours: "45", days: "5", weeks: "52" },
  { id: "50", label: "50-hour week", hours: "50", days: "5", weeks: "52" },
  { id: "unpaid2", label: "50 weeks (2 unpaid)", hours: "40", days: "5", weeks: "50" },
  { id: "school", label: "School year (40 wk)", hours: "40", days: "5", weeks: "40" },
];

function sameNumber(a: string, b: string): boolean {
  const x = a.trim();
  return x !== "" && Number(x) === Number(b);
}

function isPresetActive(f: Fields, p: Preset): boolean {
  return sameNumber(f.hours, p.hours) && sameNumber(f.days, p.days) && sameNumber(f.weeks, p.weeks);
}

const SALARY_CHIPS = [30000, 40000, 50000, 60000, 80000, 100000] as const;
const PTO_CHIPS = [10, 15, 20, 25] as const;

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
  CAD: "CAD (C$)",
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

function Placeholder({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface-2 px-4 py-6 text-sm text-muted" aria-live="polite" data-testid={testId}>
      {children}
    </div>
  );
}

function Results({ ev, currency }: { ev: Evaluation; currency: Currency }) {
  if (ev.status === "empty") {
    return <Placeholder testId="results-empty">Enter a salary, hours per week, days per week and weeks per year to see the hourly rate.</Placeholder>;
  }
  if (ev.status === "invalid") {
    return <Placeholder testId="results-invalid">Fix the highlighted fields to see the hourly rate.</Placeholder>;
  }
  const { values: v, result: r, notices } = ev;
  const money = (n: number) => formatMoney(n, currency);
  const amount = (key: string) => r.periods.find((p) => p.key === key)?.amount ?? 0;
  const hasPto = v.pto > 0;
  const hasOt = v.otHours > 0;
  const steps = explainSteps(v, r, currency);

  return (
    <div className="flex flex-col gap-4" aria-live="polite" data-testid="results">
      <Stat
        emphasis
        label="Hourly rate (gross)"
        value={<span data-testid="hourly">{formatMoneyExact(r.hourly, currency)}</span>}
        hint={
          <>
            {money(v.annual)} ÷ {formatNum(r.paidHours)} paid hours
          </>
        }
      />

      {(hasPto || hasOt) && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {hasPto && (
            <Stat
              label="Per hour worked"
              value={<span data-testid="per-worked">{formatMoneyExact(r.perWorkedHour, currency)}</span>}
              hint={`after ${formatNum(v.pto)} paid days off (${formatNum(r.workedHours)} hours worked)`}
            />
          )}
          {hasOt && (
            <Stat
              label="Average with overtime"
              value={<span data-testid="effective">{formatMoneyExact(r.effectiveHourly, currency)}</span>}
              hint={`${money(r.totalPay)} for ${formatNum(r.totalWorkedHours)} hours worked`}
            />
          )}
        </div>
      )}

      <StatGrid className="sm:grid-cols-3 lg:grid-cols-3">
        <Stat label="Annual" value={<span data-testid="annual">{money(amount("annual"))}</span>} hint="per year" />
        <Stat label="Monthly" value={<span data-testid="monthly">{money(amount("monthly"))}</span>} hint="annual ÷ 12" />
        <Stat label="Semi-monthly" value={<span data-testid="semimonthly">{money(amount("semimonthly"))}</span>} hint="annual ÷ 24" />
        <Stat label="Biweekly" value={<span data-testid="biweekly">{money(amount("biweekly"))}</span>} hint="annual ÷ 26" />
        <Stat label="Weekly" value={<span data-testid="weekly">{money(amount("weekly"))}</span>} hint="annual ÷ 52" />
        <Stat label="Daily" value={<span data-testid="daily">{money(amount("daily"))}</span>} hint="per paid working day" />
      </StatGrid>

      <div className="rounded-lg border border-border bg-surface-2 px-3.5 py-3">
        <p className="label-mono">The math</p>
        <ol className="mt-1.5 flex flex-col gap-1 font-mono text-xs leading-relaxed text-fg-secondary" data-testid="steps">
          {steps.map((s) => (
            <li key={s} className="break-words">
              {s}
            </li>
          ))}
        </ol>
      </div>

      <dl className="divide-y divide-border rounded-lg border border-border bg-surface px-3.5 py-1.5">
        <BreakdownRow label="Paid hours per year" value={formatNum(r.paidHours)} testId="paid-hours" />
        {hasPto && <BreakdownRow label="Hours worked after paid time off" value={formatNum(r.workedHours)} testId="worked-hours" />}
        {hasOt && <BreakdownRow label={`Overtime rate (${formatNum(v.otMult)}x)`} value={`${formatMoneyExact(r.otRate, currency)} an hour`} testId="ot-rate" />}
        {hasOt && <BreakdownRow label="Overtime pay per year" value={money(r.otPay)} testId="ot-pay" />}
        {hasOt && <BreakdownRow label="Total pay with overtime" value={money(r.totalPay)} testId="total-pay" />}
        <BreakdownRow label={`Each extra ${formatMoney(1000, currency)} of salary adds`} value={`${formatMoneyExact(r.perThousand, currency)} an hour`} testId="per-thousand" />
      </dl>

      {notices.map((n) => (
        <Alert key={n.title} variant={n.variant} title={n.title}>
          {n.text}
        </Alert>
      ))}

      <Alert variant="info" title="Gross pay, before tax">
        These figures are estimates before income tax, payroll taxes, benefits and other deductions, so your take-home pay will be lower. This is not payroll, tax, legal or financial advice.
      </Alert>
    </div>
  );
}

const thClass = "px-2 py-2 font-medium sm:px-3";

function SalaryTable({
  schedule,
  currentAnnual,
  currency,
  onPick,
}: {
  schedule: Schedule | null;
  currentAnnual: number | null;
  currency: Currency;
  onPick: (annual: number) => void;
}) {
  if (!schedule) {
    return <Placeholder>Fill in the hours and weeks above to see this table.</Placeholder>;
  }
  const rows = salaryTable(schedule);
  const showWorked = schedule.pto > 0;
  return (
    <div className="scroll-thin overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-right text-[13px] tabular-nums" data-testid="salary-table">
        <thead>
          <tr className="border-b border-border bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            <th scope="col" className={cn(thClass, "text-left")}>
              Salary
            </th>
            <th scope="col" className={cn(thClass, "hidden sm:table-cell")}>
              Monthly
            </th>
            <th scope="col" className={cn(thClass, "hidden sm:table-cell")}>
              Biweekly
            </th>
            <th scope="col" className={thClass}>
              Weekly
            </th>
            <th scope="col" className={thClass}>
              Hourly
            </th>
            {showWorked && (
              <th scope="col" className={thClass}>
                Per hour worked
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const active = currentAnnual !== null && Math.abs(currentAnnual - row.annual) < 0.005;
            return (
              <tr key={row.annual} className={cn("border-b border-border last:border-b-0", active && "bg-primary-soft")} data-testid={`salary-row-${row.annual}`}>
                <th scope="row" className="px-2 py-1.5 sm:px-3 text-left font-normal">
                  <button
                    type="button"
                    onClick={() => onPick(row.annual)}
                    className="rounded font-mono font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label={`Use a salary of ${formatMoney(row.annual, currency)} a year`}
                    aria-pressed={active}
                  >
                    {formatMoney(row.annual, currency)}
                  </button>
                </th>
                <td className="hidden px-2 py-1.5 sm:px-3 text-fg-secondary sm:table-cell">{formatMoneyExact(row.monthly, currency)}</td>
                <td className="hidden px-2 py-1.5 sm:px-3 text-fg-secondary sm:table-cell">{formatMoneyExact(row.biweekly, currency)}</td>
                <td className="px-2 py-1.5 sm:px-3 text-fg-secondary">{formatMoneyExact(row.weekly, currency)}</td>
                <td className="px-2 py-1.5 sm:px-3 font-medium text-fg">{formatMoneyExact(row.hourly, currency)}</td>
                {showWorked && <td className="px-2 py-1.5 sm:px-3 text-fg-secondary">{formatMoneyExact(row.perWorkedHour, currency)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HoursTable({ ev, currency, onPick }: { ev: Evaluation; currency: Currency; onPick: (hours: number) => void }) {
  if (ev.status !== "ok") {
    return <Placeholder>Enter a salary and your schedule above to see how the hourly rate changes with weekly hours.</Placeholder>;
  }
  const rows = hoursTable(ev.values);
  return (
    <div className="scroll-thin overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[18rem] border-collapse text-right text-[13px] tabular-nums" data-testid="hours-table">
        <thead>
          <tr className="border-b border-border bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            <th scope="col" className={cn(thClass, "text-left")}>
              Hours per week
            </th>
            <th scope="col" className={thClass}>
              Hourly rate
            </th>
            <th scope="col" className={thClass}>
              Versus 40 hours
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const active = Math.abs(row.hours - ev.values.hours) < 1e-9;
            return (
              <tr key={row.hours} className={cn("border-b border-border last:border-b-0", active && "bg-primary-soft")} data-testid={`hours-row-${row.hours}`}>
                <th scope="row" className="px-2 py-1.5 sm:px-3 text-left font-normal">
                  <button
                    type="button"
                    onClick={() => onPick(row.hours)}
                    className="rounded font-mono font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label={`Use ${formatNum(row.hours)} hours a week`}
                    aria-pressed={active}
                  >
                    {formatNum(row.hours)} h
                  </button>
                </th>
                <td className="px-2 py-1.5 sm:px-3 font-medium text-fg">{formatMoneyExact(row.hourly, currency)}</td>
                <td className={cn("px-2 py-1.5 sm:px-3", Math.abs(row.versus40) < 0.0005 ? "text-muted" : "text-fg-secondary")}>
                  {Math.abs(row.versus40) < 0.0005 ? "same" : formatPct(row.versus40)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OfferRows({ offer, currency, prefix }: { offer: { annual: number; hours: number; pto: number; workedHours: number; hourly: number; perWorkedHour: number }; currency: Currency; prefix: string }) {
  return (
    <dl className="divide-y divide-border rounded-lg border border-border bg-surface px-3.5 py-1">
      <BreakdownRow label="Annual salary" value={formatMoney(offer.annual, currency)} testId={`${prefix}-annual`} />
      <BreakdownRow label="Hours per week" value={formatNum(offer.hours)} />
      <BreakdownRow label="Paid days off" value={formatNum(offer.pto)} />
      <BreakdownRow label="Hours worked per year" value={formatNum(offer.workedHours)} testId={`${prefix}-worked-hours`} />
      <BreakdownRow label="Hourly (paid hours)" value={formatMoneyExact(offer.hourly, currency)} testId={`${prefix}-hourly`} />
      <BreakdownRow label={<span className="font-medium text-fg">Per hour worked</span>} value={formatMoneyExact(offer.perWorkedHour, currency)} testId={`${prefix}-worked`} />
    </dl>
  );
}

function Verdict({ cmp, currency }: { cmp: Extract<CompareState, { status: "ok" }>; currency: Currency }) {
  if (cmp.winner === "tie") {
    return (
      <Alert variant="info" title="Same pay per hour worked">
        <span data-testid="cmp-verdict">Both offers pay {formatMoneyExact(cmp.a.perWorkedHour, currency)} for every hour you work.</span>
      </Alert>
    );
  }
  const hi = cmp.winner === "a" ? cmp.a : cmp.b;
  const lo = cmp.winner === "a" ? cmp.b : cmp.a;
  const label = cmp.winner === "a" ? "Offer A" : "Offer B";
  const other = cmp.winner === "a" ? "Offer B" : "Offer A";
  const diff = hi.perWorkedHour - lo.perWorkedHour;
  const pct = diff / lo.perWorkedHour;
  return (
    <Alert variant="success" title={`${label} pays more per hour worked`}>
      <span data-testid="cmp-verdict">
        {label} pays {formatMoneyExact(diff, currency)} more for every hour worked ({formatPct(pct)} compared with {other}).
      </span>{" "}
      Annual salary and hours differ, so compare both the yearly total and the hourly figure before you decide.
    </Alert>
  );
}

function Compare({
  cmp,
  offerA,
  f,
  errors,
  symbol,
  currency,
  set,
}: {
  cmp: CompareState;
  offerA: OfferResult | null;
  f: Fields;
  errors: FieldErrors;
  symbol: string;
  currency: Currency;
  set: <K extends keyof Fields>(key: K) => (value: Fields[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <GroupLabel>Offer A (from the calculator above)</GroupLabel>
          {offerA ? (
            <OfferRows offer={offerA} currency={currency} prefix="cmp-a" />
          ) : (
            <Placeholder testId="cmp-a-empty">Fill in the calculator above to use it as Offer A. Overtime is left out of this comparison.</Placeholder>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <GroupLabel>Offer B</GroupLabel>
          <div className="grid grid-cols-3 gap-3">
            <NumberField id="cmpSalary" label="Annual salary" value={f.cmpSalary} onChange={set("cmpSalary")} errors={errors} placeholder="62,000" prefix={symbol} />
            <NumberField id="cmpHours" label="Hours per week" value={f.cmpHours} onChange={set("cmpHours")} errors={errors} placeholder="40" />
            <NumberField id="cmpPto" label="Paid days off" value={f.cmpPto} onChange={set("cmpPto")} errors={errors} placeholder="0" />
          </div>
          {cmp.status === "ok" ? (
            <OfferRows offer={cmp.b} currency={currency} prefix="cmp-b" />
          ) : (
            <Placeholder testId="cmp-empty">
              {cmp.status === "invalid"
                ? "Fix the highlighted field to compare the offers."
                : offerA
                  ? "Enter Offer B's annual salary and weekly hours to compare it with Offer A."
                  : "Offer B is compared once the calculator above has a valid salary and schedule."}
            </Placeholder>
          )}
        </div>
      </div>
      {cmp.status === "ok" && <Verdict cmp={cmp} currency={currency} />}
    </div>
  );
}

export default function SalaryToHourlyCalculator() {
  const [stored, setStored] = usePersistentState<Fields>(STORAGE_KEY, DEFAULT_FIELDS);
  const f = useMemo(() => normalizeFields(stored), [stored]);
  const set = <K extends keyof Fields>(key: K) => (value: Fields[K]) => setStored((prev) => ({ ...normalizeFields(prev), [key]: value }));

  const currency = f.currency;
  const symbol = CURRENCY_SYMBOLS[currency];
  const ev = useMemo(() => evaluate(f), [f]);
  const ok = ev.status === "ok" ? ev : null;

  // The salary table ignores the typed salary and overtime, so validate the schedule with a placeholder salary.
  const base = useMemo(() => evaluate({ ...f, salary: "1", period: "year", otHours: "" }), [f]);
  const schedule: Schedule | null = base.status === "ok" ? { hours: base.values.hours, days: base.values.days, weeks: base.values.weeks, pto: base.values.pto } : null;

  const okValues = ok ? ok.values : null;
  const cmp = useMemo(() => compareOffers(f, okValues), [f, okValues]);
  const offerA = useMemo(
    () => (okValues ? offerResult({ annual: okValues.annual, hours: okValues.hours, pto: okValues.pto }, okValues.days, okValues.weeks) : null),
    [okValues],
  );
  const cmpErrors: FieldErrors = cmp.status === "invalid" ? cmp.errors : {};
  const fieldErrors: FieldErrors = { ...ev.errors, ...cmpErrors };

  const applyPreset = (p: Preset) => setStored((prev) => ({ ...normalizeFields(prev), hours: p.hours, days: p.days, weeks: p.weeks }));
  const pickSalary = (annual: number) => setStored((prev) => ({ ...normalizeFields(prev), salary: String(annual), period: "year" }));

  const activePeriod = periodInfo(f.period);
  const describeInput = ok ? `${formatMoney(ok.values.salary, currency)} ${activePeriod.unit}, ${formatNum(ok.values.hours)} hours a week, ${formatNum(ok.values.weeks)} weeks` : null;

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
            <legend className="mb-2 label-mono">Salary</legend>
            <NumberField id="salary" label="Salary" value={f.salary} onChange={set("salary")} errors={fieldErrors} placeholder="50,000" prefix={symbol} />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Pay period"
                value={f.period}
                onChange={(e) => set("period")(e.target.value as Period)}
                options={PERIOD_INFO.map((p) => ({ value: p.value, label: p.label }))}
                containerClassName="min-w-0"
                data-testid="select-period"
              />
              <Select
                label="Currency"
                value={currency}
                onChange={(e) => set("currency")(e.target.value as Currency)}
                options={CURRENCIES.map((c) => ({ value: c, label: CURRENCY_LABELS[c] }))}
                containerClassName="min-w-0"
                data-testid="select-currency"
              />
            </div>
            <p className="text-xs text-muted">Semi-monthly means twice a month (24 paychecks a year). Biweekly means every two weeks (26 paychecks a year).</p>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Common yearly salaries">
              <span className="text-xs text-muted">Yearly:</span>
              {SALARY_CHIPS.map((n) => (
                <Button key={n} size="sm" variant="ghost" className="h-7 px-2 font-mono text-xs" onClick={() => pickSalary(n)} aria-label={`Use ${formatMoney(n, currency)} a year`}>
                  {formatMoney(n / 1000, currency)}k
                </Button>
              ))}
            </div>
            {ok && (
              <p className="rounded-lg border border-border bg-primary-soft px-3 py-2 text-sm text-fg md:hidden" data-testid="quick-result">
                Hourly rate: <span className="font-mono font-semibold text-primary">{formatMoneyExact(ok.result.hourly, currency)}</span>{" "}
                <a href="#s2h-results" className="text-primary underline underline-offset-2">
                  See full results
                </a>
              </p>
            )}
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="mb-2 label-mono">Schedule</legend>
            <div className="grid grid-cols-3 gap-3">
              <NumberField id="hours" label="Hours per week" value={f.hours} onChange={set("hours")} errors={fieldErrors} placeholder="40" />
              <NumberField id="days" label="Days per week" value={f.days} onChange={set("days")} errors={fieldErrors} placeholder="5" />
              <NumberField id="weeks" label="Weeks per year" value={f.weeks} onChange={set("weeks")} errors={fieldErrors} placeholder="52" />
            </div>
            <p className="text-xs text-muted">Enter the hours you really work. Lower the weeks only for weeks you do not work at all, such as 50 with two unpaid weeks or 40 for a school-year job.</p>
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="mb-2 label-mono">Paid time off (optional)</legend>
            <NumberField id="pto" label="Paid days off per year" value={f.pto} onChange={set("pto")} errors={fieldErrors} placeholder="0" suffix="days" />
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Common paid time off amounts">
              <span className="text-xs text-muted">Quick fill:</span>
              {PTO_CHIPS.map((n) => (
                <Button key={n} size="sm" variant="ghost" className="h-7 px-2 font-mono text-xs" onClick={() => set("pto")(String(n))} aria-label={`Use ${n} paid days off`}>
                  {n} days
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted">Vacation, holidays and sick days you are paid for. They stay in your salary, and they show your rate per hour you actually work.</p>
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="mb-2 label-mono">Overtime on top of salary (optional)</legend>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="otHours" label="Overtime hours per week" value={f.otHours} onChange={set("otHours")} errors={fieldErrors} placeholder="0" />
              <Select
                label="Overtime pay rate"
                value={f.otMult}
                onChange={(e) => set("otMult")(e.target.value)}
                options={OT_MULTIPLIERS.map((m) => ({ value: m, label: MULTIPLIER_LABELS[m] }))}
                containerClassName="min-w-0"
                data-testid="select-otMult"
              />
            </div>
            <p className="text-xs text-muted">For non-exempt roles paid extra for overtime: the hourly rate above covers your regular hours, and overtime hours are paid at that rate times the multiplier (1.5x is time and a half, 2x is double time). If your salary is meant to cover every hour you work, enter all of them under Hours per week and leave this empty.</p>
          </fieldset>
        </div>

        <div id="s2h-results" className="flex min-w-0 scroll-mt-20 flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="label-mono shrink-0">Your hourly rate</h2>
            {describeInput && <p className="text-xs text-muted sm:text-right">{describeInput}</p>}
          </div>
          <Results ev={ev} currency={currency} />
        </div>
      </ToolGrid>

      <ToolActions>
        <CopyButton text={ok ? summaryText(ok.values, ok.result, currency) : ""} label="Copy summary" variant="primary" disabled={!ok} />
        <CopyButton text={ok ? formatMoneyExact(ok.result.hourly, currency) : ""} label="Copy hourly rate" variant="secondary" disabled={!ok} />
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" aria-hidden />}
          disabled={!ok}
          onClick={() => ok && downloadText(toCsv(ok.values, ok.result, currency), "salary-to-hourly.csv", "text/csv;charset=utf-8")}
        >
          Download CSV
        </Button>
        <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={() => setStored(DEFAULT_FIELDS)}>
          Reset
        </Button>
      </ToolActions>

      <section className="flex flex-col gap-3 border-t border-border pt-5" aria-labelledby="s2h-salary-table">
        <div>
          <h2 id="s2h-salary-table" className="text-sm font-semibold text-fg">
            Salary to hourly table: {formatMoney(SALARY_STEPS[0], currency)} to {formatMoney(SALARY_STEPS[SALARY_STEPS.length - 1], currency)} a year
          </h2>
          <p className="mt-0.5 text-xs text-muted">Uses the schedule and paid time off above (all before tax). Select a salary to load it into the calculator.</p>
        </div>
        <SalaryTable schedule={schedule} currentAnnual={ok ? ok.values.annual : null} currency={currency} onPick={pickSalary} />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-5" aria-labelledby="s2h-hours-table">
        <div>
          <h2 id="s2h-hours-table" className="text-sm font-semibold text-fg">
            Same salary, different weekly hours
          </h2>
          <p className="mt-0.5 text-xs text-muted">A salary does not grow when the week does, so every extra hour lowers your effective hourly rate. Select a row to try those hours.</p>
        </div>
        <HoursTable ev={ev} currency={currency} onPick={(h) => set("hours")(String(h))} />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-5" aria-labelledby="s2h-compare">
        <div>
          <h2 id="s2h-compare" className="text-sm font-semibold text-fg">
            Compare two offers by pay per hour worked
          </h2>
          <p className="mt-0.5 text-xs text-muted">Offer A is your salary, hours and paid days off from above. Offer B uses your days per week and weeks per year.</p>
        </div>
        <Compare cmp={cmp} offerA={offerA} f={f} errors={fieldErrors} symbol={symbol} currency={currency} set={set} />
      </section>
    </ToolPanel>
  );
}
