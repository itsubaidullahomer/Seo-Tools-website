"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { Download, RotateCcw, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { cn, downloadText } from "@/lib/utils";
import { Alert, Badge, Button, CopyButton, Input, Select, Stat, StatGrid, Tabs, Toggle, ToolActions, ToolGrid, ToolPanel } from "@/components/ui";
import {
  DAYS_PER_MONTH,
  DEFAULT_STATE,
  EMPTY_STATE,
  RULES,
  addDays,
  avdFromLength,
  avdTable,
  evaluateHours,
  evaluateShorts,
  evaluateViews,
  formatCount,
  formatDuration,
  formatHours,
  formatPercent,
  formatSeconds,
  goalOptions,
  localTodayIso,
  longDate,
  minDailyViews,
  normalizeState,
  parseCount,
  parseDuration,
  parseSigned,
  resolveGoal,
  shortDate,
  simulateTimeline,
  toCsv,
  type AvdMode,
  type Goal,
  type GoalId,
  type Parsed,
  type Period,
  type State,
  type Tab,
  type Tier,
} from "./logic";

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const subscribe = () => () => {};
/** Today's date in the viewer's time zone. Server render and hydration use the rules' check date, so markup always matches. */
function useToday(): string {
  return useSyncExternalStore(subscribe, () => localTodayIso(), () => RULES.asOf);
}

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: "hours", label: "Hours" },
  { value: "views", label: "Views needed" },
  { value: "timeline", label: "Timeline" },
  { value: "shorts", label: "Shorts" },
];
const AVD_OPTIONS: { value: AvdMode; label: string }[] = [
  { value: "length", label: "From video length" },
  { value: "direct", label: "Type it in" },
];
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "Per day" },
  { value: "month", label: "Per month" },
];

const val = (p: Parsed): number | null => (p.kind === "ok" ? p.value : null);
const err = (p: Parsed): string | undefined => (p.kind === "invalid" ? p.hint : undefined);

/** Compact form for very large counts so stat tiles never overflow. */
function big(n: number): string {
  return n >= 1e9 ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n) : formatCount(n);
}

function monthsText(days: number): string {
  if (days < 45) return `${days} day${days === 1 ? "" : "s"}`;
  return `about ${(days / DAYS_PER_MONTH).toFixed(1)} months`;
}

function tierNote(tier: Tier | undefined): string {
  if (!tier) return "";
  const uploads = tier.uploads ? ` and ${tier.uploads} public uploads in the last ${tier.uploadWindowDays} days` : "";
  return `Also needs ${formatCount(tier.subscribers)} subscribers${uploads}.`;
}

function Card({ title, subtitle, children, className }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4", className)}>
      <div>
        <h3 className="text-base font-semibold text-fg">{title}</h3>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  parsed,
  placeholder,
  suffix,
  hint,
  inputMode = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  parsed?: Parsed;
  placeholder?: string;
  suffix?: string;
  hint?: ReactNode;
  inputMode?: "text" | "decimal";
}) {
  return (
    <Input
      label={label}
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      spellCheck={false}
      value={value}
      placeholder={placeholder}
      suffix={suffix}
      hint={hint}
      onChange={(e) => onChange(e.target.value)}
      error={parsed ? err(parsed) : undefined}
      containerClassName="min-w-0"
    />
  );
}

function ProgressBar({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className="h-2.5 w-full overflow-hidden rounded-full border border-border bg-surface-3"
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${clamped}%` }} />
    </div>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <p className="break-words rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-fg-secondary" data-testid="formula">
      {children}
    </p>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-4 text-sm text-muted">{children}</div>;
}

function DataTable({ head, rows, caption, highlight, wrapFirst }: { head: string[]; rows: ReactNode[][]; caption: string; highlight?: (i: number) => boolean; wrapFirst?: boolean }) {
  return (
    <div className="scroll-thin overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {head.map((h) => (
              <th key={h} scope="col" className="label-mono px-2.5 py-2 font-medium sm:px-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cn("border-b border-border last:border-0", highlight?.(i) && "bg-primary-soft")}>
              {r.map((c, j) => (
                <td key={j} className={cn("px-2.5 py-2 tabular-nums sm:px-3", !(wrapFirst && j === 0) && "whitespace-nowrap", j === 0 ? "font-medium text-fg" : "text-fg-secondary")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared input resolution                                             */
/* ------------------------------------------------------------------ */

/** Average percentage viewed: a number from above 0 up to 200 (values over 100 mean viewers rewatch). */
function parsePctViewed(raw: string): Parsed {
  const p = parseCount(raw, { suffix: false, percent: true, max: 200, noun: "percentage" });
  if (p.kind === "ok" && p.value <= 0) return { kind: "invalid", hint: "Average percentage viewed must be above 0." };
  return p;
}

interface AvdResolved {
  seconds: number | null;
  /** Human-readable derivation shown under the inputs. */
  line: string;
  /** Formula fragment used in result formulas. */
  note?: string;
  errors: { avd?: string; length?: string; pct?: string };
}

function resolveAvd(s: State): AvdResolved {
  if (s.avdMode === "direct") {
    const p = parseDuration(s.avd);
    if (p.kind !== "ok") return { seconds: null, line: "", errors: { avd: err(p) } };
    return { seconds: p.value, line: `${formatDuration(p.value)} = ${formatSeconds(p.value)} seconds per view`, errors: {} };
  }
  const len = parseDuration(s.length);
  const pct = parsePctViewed(s.pctViewed);
  const errors: AvdResolved["errors"] = { length: err(len), pct: err(pct) };
  if (len.kind === "ok" && pct.kind === "ok") {
    const sec = avdFromLength(len.value, pct.value);
    const note = pct.value > 100 ? " A value above 100% means viewers rewatch, which is unusual, so double-check it." : "";
    return { seconds: sec, line: `${formatDuration(len.value)} × ${formatSeconds(pct.value)}% = ${formatDuration(sec)} (${formatSeconds(sec)} seconds per view).${note}`, errors };
  }
  return { seconds: null, line: "", errors };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function YouTubeWatchTimeCalculator() {
  const today = useToday();
  const [stored, setState] = usePersistentState<State>("youtube-watch-time-calculator:v1", DEFAULT_STATE);
  const s = useMemo(() => normalizeState(stored), [stored]);
  const set =
    <K extends keyof State>(key: K) =>
    (value: State[K]) =>
      setState((prev) => ({ ...normalizeState(prev), [key]: value }));

  const goals = useMemo(() => goalOptions(today), [today]);
  const customP = parseCount(s.customHours, { suffix: false, noun: "number of hours" });
  const goal = useMemo(() => resolveGoal(s.goal, val(customP), today), [s.goal, customP, today]);
  const avd = useMemo(() => resolveAvd(s), [s]);
  const avdSeconds = avd.seconds;

  const goalSelectValue: GoalId = goals.some((g) => g.id === s.goal) ? s.goal : "ad";
  const goalOptionsUi = goals.map((g) => ({ value: g.id, label: g.label }));
  const usesShared = s.tab !== "shorts";

  let body: ReactNode = null;
  let copyText = "";
  let csv: { name: string; text: string } | null = null;

  const needInputs = (
    <Empty>
      {avdSeconds === null ? "Enter a valid average view duration to see results. " : ""}
      {!goal ? "Choose a goal, or enter a custom number of hours." : ""}
    </Empty>
  );

  /* ----- Tab: views -> hours ----- */
  if (s.tab === "hours") {
    const viewsP = parseCount(s.views, { noun: "number of views", integer: true });
    const views = val(viewsP);
    if (avdSeconds !== null && goal && views !== null) {
      const r = evaluateHours(views, avdSeconds, goal.hours);
      const pctText = !r.reached && r.pct > 99.99 ? "99.99%" : formatPercent(r.pct);
      copyText = [
        `${formatCount(views)} public long-form views × ${formatDuration(avdSeconds)} average view duration = ${formatHours(r.hours, goal.hours)} watch hours.`,
        `Goal: ${goal.label} (${pctText} reached).`,
        r.reached ? "The goal is met on hours." : `Still needed: ${formatHours(r.remainingHours)} hours, about ${formatCount(r.viewsRemaining)} more views at this duration.`,
      ].join("\n");
      body = (
        <div className="flex flex-col gap-3" aria-live="polite">
          <StatGrid>
            <Stat emphasis label="Estimated watch hours" value={formatHours(r.hours, goal.hours)} hint={`${formatCount(views)} views × ${formatDuration(avdSeconds)}`} />
            <Stat label="Of the goal" value={pctText} hint={`${formatCount(goal.hours)} hours`} />
            <Stat label="Hours still needed" value={r.reached ? "0" : formatHours(r.remainingHours)} />
            <Stat label="Views still needed" value={big(r.viewsRemaining)} hint={`at ${formatDuration(avdSeconds)} each`} />
          </StatGrid>
          <ProgressBar pct={r.pct} label={`Progress toward ${formatCount(goal.hours)} watch hours`} />
          <Formula>
            {formatCount(views)} views × {formatSeconds(avdSeconds)} s ÷ 3,600 = {formatHours(r.hours, goal.hours)} hours
          </Formula>
          {r.reached && (
            <Alert variant="success" title="The hours bar is covered">
              At this duration those views pass {formatCount(goal.hours)} hours. {tierNote(goal.tier)} YouTube counts only valid public watch hours from the last 365 days, so check your figure in YouTube Studio.
            </Alert>
          )}
        </div>
      );
    } else {
      body = avdSeconds === null || !goal ? needInputs : <Empty>{viewsP.kind === "invalid" ? "Fix the views field to see the result." : "Enter your number of views to see the result."}</Empty>;
    }
  }

  /* ----- Tab: views needed ----- */
  if (s.tab === "views") {
    const spanP = parseCount(s.spanDays, { suffix: false, min: 1, noun: "number of days" });
    const span = val(spanP);
    if (avdSeconds !== null && goal && span !== null) {
      const r = evaluateViews(goal.hours, avdSeconds, span);
      const rows = avdTable(goal.hours, avdSeconds);
      const yourIdx = rows.findIndex((x) => x.isYours);
      copyText = [
        `Goal: ${goal.label}.`,
        `At ${formatDuration(avdSeconds)} average view duration you need about ${formatCount(r.views)} public long-form views.`,
        `To finish within ${formatCount(r.days)} days: ${formatCount(Math.ceil(r.perDay))} views a day, ${formatCount(Math.ceil(r.perWeek))} a week, ${formatCount(Math.ceil(r.perMonth))} a month.`,
      ].join("\n");
      csv = {
        name: "views-needed-by-average-view-duration.csv",
        text: toCsv(
          ["Average view duration", "Seconds", `Views needed for ${formatCount(goal.hours)} hours`],
          rows.map((x) => [formatDuration(x.seconds), Math.round(x.seconds * 100) / 100, x.views]),
        ),
      };
      body = (
        <div className="flex flex-col gap-3" aria-live="polite">
          <StatGrid>
            <Stat emphasis label="Views needed" value={big(r.views)} hint={`${formatCount(goal.hours)} h at ${formatDuration(avdSeconds)}`} />
            <Stat label="Per day" value={big(Math.ceil(r.perDay))} hint={`over ${formatCount(r.days)} days`} />
            <Stat label="Per week" value={big(Math.ceil(r.perWeek))} />
            <Stat label="Per month" value={big(Math.ceil(r.perMonth))} hint="30.4-day months" />
          </StatGrid>
          <Formula>
            {formatCount(goal.hours)} h × 3,600 ÷ {formatSeconds(avdSeconds)} s = {formatCount(r.views)} views (rounded up)
          </Formula>
          {r.cappedDays && (
            <Alert variant="info" title="Capped at 365 days">
              Only the last 365 days count, so hours you earn today are gone a year from now. The pace above assumes the full {formatCount(r.days)} days.
            </Alert>
          )}
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-fg">How average view duration changes the number</p>
            <DataTable
              caption="Views needed for the selected goal at different average view durations"
              head={["Average view duration", `Views for ${formatCount(goal.hours)} h`]}
              rows={rows.map((x) => [x.isYours ? `${formatDuration(x.seconds)} (yours)` : formatDuration(x.seconds), formatCount(x.views)])}
              highlight={(i) => i === yourIdx}
            />
          </div>
        </div>
      );
    } else {
      body = avdSeconds === null || !goal ? needInputs : <Empty>{spanP.kind === "invalid" ? "Fix the days field to see the result." : "Enter a number of days to see the result."}</Empty>;
    }
  }

  /* ----- Tab: timeline ----- */
  if (s.tab === "timeline") {
    const dailyP = parseCount(s.daily, { noun: "number of views" });
    const bankedP = parseCount(s.banked, { noun: "number of hours" });
    const growthP = parseSigned(s.growth, -50, 200, "percentage");
    const dailyRaw = val(dailyP);
    const banked = bankedP.kind === "empty" ? 0 : val(bankedP);
    const growth = growthP.kind === "empty" ? 0 : val(growthP);
    if (avdSeconds !== null && goal && dailyRaw !== null && banked !== null && growth !== null) {
      const dailyViews = s.period === "month" ? dailyRaw / DAYS_PER_MONTH : dailyRaw;
      const list: Goal[] = goals.filter((g) => g.id !== "custom");
      if (goal.id === "custom") list.push(goal);
      const sim = simulateTimeline({ dailyViews, avdSeconds, bankedHours: banked, growthPct: growth, expire: s.expire, goals: list.map((g) => g.hours) });
      const daysFor = (g: Goal): number | null => {
        const i = list.findIndex((x) => x.id === g.id);
        return i >= 0 ? sim.reachDays[i] : null;
      };
      const selDays = daysFor(goal);
      const selDate = selDays === null ? null : addDays(today, selDays);
      const minViews = minDailyViews(goal.hours, avdSeconds);
      const after12 = sim.checkpoints[sim.checkpoints.length - 1]?.hours ?? 0;

      const rowName = (g: Goal) =>
        g.id === "early" ? "Early access" : g.id === "ad" ? "Ad revenue (today's bar)" : g.id === "ad-next" ? `Ad revenue (from ${shortDate(g.tier?.effectiveFrom ?? today)})` : "Custom goal";
      const reachText = (d: number | null) => (d === null ? "Not within 5 years" : d === 0 ? "Already met" : `${formatCount(d)} days`);
      const reachDate = (d: number | null) => (d === null ? "-" : d === 0 ? shortDate(today) : shortDate(addDays(today, d)));

      const adNow = goals.find((g) => g.id === "ad");
      const adNext = goals.find((g) => g.id === "ad-next");
      let changeAlert: ReactNode = null;
      if (adNow && adNext && adNext.tier?.effectiveFrom) {
        const E = adNext.tier.effectiveFrom;
        const dNow = daysFor(adNow);
        const dNext = daysFor(adNext);
        if (dNow !== null && addDays(today, dNow) < E) {
          changeAlert = (
            <Alert variant="info" title="Before the announced change">
              At this pace you pass {formatCount(adNow.hours)} hours on {longDate(addDays(today, dNow))}, before the higher bar starts on {longDate(E)}. You would also need {formatCount(adNow.tier?.subscribers ?? 1000)} subscribers and an application
              submitted before that date, so leave a margin.
            </Alert>
          );
        } else {
          changeAlert = (
            <Alert variant="warning" title="After the announced change">
              {dNow !== null
                ? `At this pace you pass ${formatCount(adNow.hours)} hours on ${longDate(addDays(today, dNow))}, after ${longDate(E)}. `
                : `At this pace ${formatCount(adNow.hours)} hours is not reached within five years. `}
              Applicants from {longDate(E)} are reported to need {formatCount(adNext.hours)} hours, {dNext === null ? "which this pace does not reach within five years." : `which this pace reaches on ${longDate(addDays(today, dNext))}.`}
            </Alert>
          );
        }
      }

      const cpRows = sim.checkpoints.filter((c) => [30, 60, 90, 180, 270, 360].includes(c.day));
      copyText = [
        `Pace: ${formatCount(Math.round(dailyViews))} views a day at ${formatDuration(avdSeconds)} = ${formatHours(sim.hoursPerDay)} watch hours a day${growth ? `, views changing ${growth > 0 ? "+" : ""}${growth}% a month` : ""}.`,
        `Starting hours in the 365-day window: ${formatHours(banked)}.`,
        ...list.map((g) => `${rowName(g)} (${formatCount(g.hours)} h): ${(() => { const d = daysFor(g); return d === null ? "not within five years" : d === 0 ? "already met" : `${formatCount(d)} days, ${longDate(addDays(today, d))}`; })()}`),
      ].join("\n");
      csv = {
        name: "watch-hours-projection.csv",
        text: toCsv(
          ["Day", "Date", "Watch hours in the 365-day window", `Percent of ${formatCount(goal.hours)} hours`],
          sim.checkpoints.map((c) => [c.day, addDays(today, c.day), Math.round(c.hours * 10) / 10, Math.round((c.hours / goal.hours) * 1000) / 10]),
        ),
      };

      body = (
        <div className="flex flex-col gap-3" aria-live="polite">
          <StatGrid>
            <Stat
              emphasis
              label="Time to goal"
              value={selDays === null ? "Not in 5 yrs" : selDays === 0 ? "Already met" : `${formatCount(selDays)} days`}
              hint={selDate && selDays ? `${shortDate(selDate)} (${monthsText(selDays)})` : `${formatCount(goal.hours)} hours`}
            />
            <Stat label="Watch hours per day" value={formatHours(sim.hoursPerDay)} hint={`${formatCount(Math.round(dailyViews))} views × ${formatDuration(avdSeconds)}`} />
            <Stat label="Hours after 12 months" value={formatHours(after12, goal.hours)} hint="in the 365-day window" />
            <Stat label="Minimum steady pace" value={`${big(minViews)}/day`} hint={`for ${formatCount(goal.hours)} h in 365 days`} />
          </StatGrid>
          {selDays === null && (
            <Alert variant="warning" title="Not reached in five years at this pace">
              Hours drop out of the window after 365 days. A flat pace needs at least {formatCount(minViews)} views a day at {formatDuration(avdSeconds)} to ever hold {formatCount(goal.hours)} hours.
            </Alert>
          )}
          {changeAlert}
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-fg">When each requirement is reached</p>
            <DataTable
              caption="Projected date for each watch-hour requirement"
              head={["Requirement", "Reached in", "Date"]}
              wrapFirst
              rows={list.map((g) => {
                const d = daysFor(g);
                return [
                  <>
                    {rowName(g)}
                    <span className="block text-xs font-normal text-muted">{formatCount(g.hours)} hours</span>
                  </>,
                  reachText(d),
                  reachDate(d),
                ];
              })}
              highlight={(i) => list[i].id === goal.id}
            />
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-fg">Projected hours in the 365-day window</p>
            <DataTable
              caption="Projected watch hours at 30-day checkpoints"
              head={["Day", "Date", "Hours", "Of the goal"]}
              rows={cpRows.map((c) => [`Day ${c.day}`, shortDate(addDays(today, c.day)), formatHours(c.hours, goal.hours), formatPercent((c.hours / goal.hours) * 100)])}
            />
          </div>
        </div>
      );
    } else if (avdSeconds === null || !goal) {
      body = needInputs;
    } else {
      body = <Empty>{dailyP.kind === "invalid" || bankedP.kind === "invalid" || growthP.kind === "invalid" ? "Fix the highlighted field to see the projection." : "Enter your views per day to see the projection."}</Empty>;
    }
  }

  /* ----- Tab: Shorts path ----- */
  if (s.tab === "shorts") {
    const shortsP = parseCount(s.shorts, { noun: "number of Shorts views", integer: true });
    const views = val(shortsP);
    const tiers = goals.filter((g) => g.id !== "custom" && g.shortsViews);
    if (views !== null) {
      const first = tiers[0];
      const rows = tiers.map((g) => ({ g, r: evaluateShorts(views, g.shortsViews as number) }));
      copyText = [
        `${formatCount(views)} public Shorts views in the last 90 days (${formatCount(Math.round(views / RULES.windows.shortsDays))} a day).`,
        ...rows.map(({ g, r }) => `${g.id === "early" ? "Early access" : g.id === "ad" ? "Ad revenue (today's bar)" : "Ad revenue (announced)"}: ${formatCount(g.shortsViews as number)} needed, ${formatPercent(r.pct)} reached${r.reached ? "" : `, ${formatCount(r.remaining)} to go`}.`),
      ].join("\n");
      body = (
        <div className="flex flex-col gap-3" aria-live="polite">
          <StatGrid>
            <Stat emphasis label="Shorts views, last 90 days" value={big(views)} hint={`${formatCount(Math.round(views / RULES.windows.shortsDays))} a day`} />
            {first && <Stat label={`Of ${formatCount(first.shortsViews as number)}`} value={formatPercent(evaluateShorts(views, first.shortsViews as number).pct)} hint="ad revenue tier, today's bar" />}
          </StatGrid>
          <DataTable
            caption="Shorts views path for each tier"
            wrapFirst
            head={["Tier", "Views needed", "Reached", "To go", "Per day for 90 days"]}
            rows={rows.map(({ g, r }) => [
              g.id === "early" ? "Early access" : g.id === "ad" ? "Ad revenue (today's bar)" : `Ad revenue (from ${shortDate(g.tier?.effectiveFrom ?? today)})`,
              big(g.shortsViews as number),
              formatPercent(r.pct),
              r.reached ? "Met" : big(r.remaining),
              formatCount(r.perDayNeeded),
            ])}
          />
          <Alert variant="info" title="Shorts views do not add watch hours">
            The Shorts path is a separate route: qualified public Shorts views in the last 90 days, counted on their own. Hours from the Shorts feed do not count toward the long-form watch-hour bar.
          </Alert>
        </div>
      );
    } else {
      body = <Empty>{shortsP.kind === "invalid" ? "Fix the Shorts views field to see the result." : "Enter your Shorts views from the last 90 days to see the result."}</Empty>;
    }
  }

  const applyExample = (length: string, pct: string) =>
    setState((prev) => ({ ...normalizeState(prev), avdMode: "length" as AvdMode, length, pctViewed: pct }));

  const dailyP = parseCount(s.daily, { noun: "number of views" });
  const bankedP = parseCount(s.banked, { noun: "number of hours" });
  const growthP = parseSigned(s.growth, -50, 200, "percentage");
  const viewsP = parseCount(s.views, { noun: "number of views", integer: true });
  const spanP = parseCount(s.spanDays, { suffix: false, min: 1, noun: "number of days" });
  const shortsP = parseCount(s.shorts, { noun: "number of Shorts views", integer: true });
  const lenP = parseDuration(s.length);

  const adTier = goals.find((g) => g.id === "ad")?.tier;
  const nextAd = goals.find((g) => g.id === "ad-next")?.tier;
  const earlyTier = goals.find((g) => g.id === "early")?.tier;

  return (
    <ToolPanel>
      <Tabs label="Calculator mode" size="sm" value={s.tab} onChange={set("tab")} options={TAB_OPTIONS} className="self-start" />

      {usesShared && (
        <ToolGrid>
          <Card title="Average view duration" subtitle="Find it in YouTube Studio under Analytics. Use long-form videos only.">
            <Tabs label="How to enter the average view duration" size="sm" value={s.avdMode} onChange={set("avdMode")} options={AVD_OPTIONS} className="self-start" />
            {s.avdMode === "direct" ? (
              <Field label="Average view duration" value={s.avd} onChange={set("avd")} parsed={parseDuration(s.avd)} placeholder="3:36" hint="Type 3:36 as Studio shows it, or 3.6 for minutes." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Video length" value={s.length} onChange={set("length")} parsed={lenP} placeholder="8:00" />
                <Field
                  label="Average percentage viewed"
                  value={s.pctViewed}
                  onChange={set("pctViewed")}
                  parsed={parsePctViewed(s.pctViewed)}
                  suffix="%"
                  placeholder="45"
                  inputMode="decimal"
                />
              </div>
            )}
            <p className="min-h-4 text-xs text-fg-secondary" data-testid="avd-line">
              {avd.line}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => applyExample("8:00", "45")}>
                8-minute example
              </Button>
              <Button size="sm" variant="secondary" onClick={() => applyExample("20:00", "40")}>
                20-minute example
              </Button>
            </div>
          </Card>

          <Card title="Goal" subtitle={`Requirements checked ${longDate(RULES.asOf)}.`}>
            <Select label="Watch-hour requirement" value={goalSelectValue} onChange={(e) => set("goal")(e.target.value as GoalId)} options={goalOptionsUi} />
            {goalSelectValue === "custom" && (
              <Field label="Custom goal (watch hours)" value={s.customHours} onChange={set("customHours")} parsed={customP} placeholder="4000" inputMode="decimal" />
            )}
            {goal?.tier && <p className="text-xs text-muted">{tierNote(goal.tier)} Hours must be public long-form watch time from the last 365 days.</p>}
            {goal?.id === "ad-next" && goal.tier?.effectiveFrom && (
              <p className="text-xs text-muted">Announced for applications from {longDate(goal.tier.effectiveFrom)}. Confirm the final wording on YouTube Help.</p>
            )}
          </Card>
        </ToolGrid>
      )}

      {s.tab === "hours" && (
        <Card title="Your views" subtitle="Public long-form views in the last 365 days, from YouTube Studio or your own estimate.">
          <Field label="Views" value={s.views} onChange={set("views")} parsed={viewsP} placeholder="25,000 or 25k" hint="Commas and k or m suffixes work, for example 1.2m." />
        </Card>
      )}

      {s.tab === "views" && (
        <Card title="How fast do you want to get there?" subtitle="The pace needed to collect every view inside the window.">
          <Field label="Finish within (days)" value={s.spanDays} onChange={set("spanDays")} parsed={spanP} placeholder="180" inputMode="decimal" hint="365 is the longest window that counts." />
        </Card>
      )}

      {s.tab === "timeline" && (
        <Card title="Your current pace" subtitle="Projects forward from today using the same 365-day rolling window YouTube uses.">
          <Tabs label="Views period" size="sm" value={s.period} onChange={set("period")} options={PERIOD_OPTIONS} className="self-start" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={s.period === "day" ? "Views per day" : "Views per month"} value={s.daily} onChange={set("daily")} parsed={dailyP} placeholder={s.period === "day" ? "500" : "15,000"} hint="Public long-form views." />
            <Field label="Watch hours you have now" value={s.banked} onChange={set("banked")} parsed={bankedP} placeholder="0" hint="In the last 365 days. Optional." />
            <Field label="Monthly growth in views" value={s.growth} onChange={set("growth")} parsed={growthP} suffix="%" placeholder="0" hint="Optional. Negative if views are falling." />
          </div>
          <Toggle
            checked={s.expire}
            onChange={set("expire")}
            label="Drop hours after 365 days"
            description="Assumes the hours you have now were earned evenly over the past year, so they leave the window day by day."
          />
        </Card>
      )}

      {s.tab === "shorts" && (
        <Card title="Your Shorts views" subtitle="Public Shorts views from the Shorts feed in the last 90 days. Watch hours are not used on this path.">
          <Field label="Shorts views in the last 90 days" value={s.shorts} onChange={set("shorts")} parsed={shortsP} placeholder="2,500,000 or 2.5m" hint="Commas and k or m suffixes work." />
        </Card>
      )}

      <section aria-label="Results" className="flex flex-col gap-3">
        {body}
      </section>

      <ToolActions>
        <CopyButton text={copyText} label="Copy summary" variant="primary" disabled={!copyText} />
        {csv && (
          <Button variant="secondary" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadText(csv.text, csv.name, "text/csv;charset=utf-8")}>
            Download CSV
          </Button>
        )}
        <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={() => setState(DEFAULT_STATE)}>
          Load example
        </Button>
        <Button variant="secondary" leftIcon={<X className="h-4 w-4" aria-hidden />} onClick={() => setState({ ...EMPTY_STATE, tab: s.tab })}>
          Clear all
        </Button>
      </ToolActions>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-3 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-mono">Requirements used</span>
          <Badge variant="outline">checked {shortDate(RULES.asOf)}</Badge>
          <Badge variant="outline">today: {shortDate(today)}</Badge>
        </div>
        <ul className="list-disc space-y-0.5 pl-4">
          {adTier && (
            <li>
              Ad revenue: {formatCount(adTier.subscribers)} subscribers plus {formatCount(adTier.watchHours)} public watch hours in 365 days, or {formatCount(adTier.shortsViews)} public Shorts views in 90 days
              {adTier.effectiveUntil ? ` (in force through ${shortDate(adTier.effectiveUntil)})` : ""}.
            </li>
          )}
          {nextAd && nextAd.effectiveFrom && (
            <li>
              Announced from {shortDate(nextAd.effectiveFrom)} for new applicants: {formatCount(nextAd.watchHours)} hours or {formatCount(nextAd.shortsViews)} Shorts views, with {formatCount(nextAd.subscribers)} subscribers.
            </li>
          )}
          {earlyTier && (
            <li>
              Fan-funding early access: {formatCount(earlyTier.subscribers)} subscribers, {earlyTier.uploads} public uploads in {earlyTier.uploadWindowDays} days, and {formatCount(earlyTier.watchHours)} hours or {formatCount(earlyTier.shortsViews)} Shorts
              views.
            </li>
          )}
        </ul>
        <p>
          {RULES.verification} Sources:{" "}
          {RULES.sources.map((src, i) => (
            <span key={src.url}>
              {i > 0 && ", "}
              <a href={src.url} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2 hover:text-fg">
                {src.label.replace("YouTube Help: ", "")}
              </a>
            </span>
          ))}
          .
        </p>
        <p>Estimates only, not a guarantee of approval. This tool is not affiliated with or endorsed by YouTube or Google.</p>
      </div>
    </ToolPanel>
  );
}
