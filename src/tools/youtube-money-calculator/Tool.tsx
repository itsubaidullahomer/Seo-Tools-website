"use client";

import { useMemo, type ReactNode } from "react";
import { Download, RotateCcw } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { cn, downloadText, formatDate } from "@/lib/utils";
import { Alert, Badge, Button, CopyButton, Input, Select, Stat, StatGrid, Tabs, ToolActions, ToolGrid, ToolPanel, ToolSection, Toggle } from "@/components/ui";
import {
  DEFAULT_STATE,
  EXAMPLES,
  RATES,
  buildCsv,
  buildSummary,
  count,
  evaluate,
  money,
  normalizeState,
  parseNum,
  presetIdFor,
  rate,
  rpmFromRevenue,
  stateForExample,
  viewsForGoal,
  type ChannelType,
  type Evaluation,
  type ExampleId,
  type LongBasis,
  type Period,
  type SectionResult,
  type ShortsBasis,
  type State,
  type Triplet,
} from "./logic";

const TYPE_OPTIONS: { value: ChannelType; label: string }[] = [
  { value: "long", label: "Long-form" },
  { value: "shorts", label: "Shorts" },
  { value: "both", label: "Long-form + Shorts" },
];
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "Per day" },
  { value: "month", label: "Per month" },
];
const LONG_BASIS_OPTIONS: { value: LongBasis; label: string }[] = [
  { value: "niche", label: "Niche preset" },
  { value: "rpm", label: "My RPM" },
  { value: "cpm", label: "From CPM" },
];
const SHORTS_BASIS_OPTIONS: { value: ShortsBasis; label: string }[] = [
  { value: "estimate", label: "Estimate" },
  { value: "rpm", label: "My Shorts RPM" },
];
const CUSTOM_PRESET = "custom";

function Card({ title, subtitle, children, className }: { title: string; subtitle: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4", className)}>
      <div>
        <h3 className="text-base font-semibold text-fg">{title}</h3>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function NumField({
  label,
  value,
  onChange,
  error,
  prefix,
  suffix,
  hint,
  placeholder,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  prefix?: string;
  suffix?: string;
  hint?: ReactNode;
  placeholder?: string;
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
      hint={hint}
      error={error}
      onChange={(e) => onChange(e.target.value)}
      containerClassName="min-w-0"
    />
  );
}

/** Work out an RPM from Studio numbers and hand it back to the calculator. */
function RpmHelper({
  revenue,
  views,
  onRevenue,
  onViews,
  onUse,
  digits,
  idPrefix,
  noun,
}: {
  revenue: string;
  views: string;
  onRevenue: (v: string) => void;
  onViews: (v: string) => void;
  onUse: (rpm: string) => void;
  digits: number;
  idPrefix: string;
  noun: string;
}) {
  const rev = parseNum(revenue);
  const vw = parseNum(views, { suffix: true });
  const result = rev.kind === "ok" && vw.kind === "ok" ? rpmFromRevenue(rev.value, vw.value) : null;
  return (
    <details className="rounded-lg border border-border bg-surface-2 px-3 py-2">
      <summary className="cursor-pointer text-[13px] font-medium text-fg">Work out my RPM from Studio numbers</summary>
      <div className="mt-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <NumField
            label={`Estimated ${noun}revenue`}
            prefix="$"
            value={revenue}
            onChange={onRevenue}
            placeholder="420"
            error={rev.kind === "invalid" ? rev.hint : undefined}
          />
          <NumField
            label={`${noun ? "Shorts views" : "Views"} in the same period`}
            value={views}
            onChange={onViews}
            placeholder="100,000"
            error={vw.kind === "invalid" ? vw.hint : undefined}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite" data-testid={`${idPrefix}-helper-result`}>
          <p className="font-mono text-xs text-fg-secondary">
            {result === null ? "RPM = revenue ÷ views × 1,000" : `RPM = revenue ÷ views × 1,000 = ${rate(result)}`}
          </p>
          <Button
            size="sm"
            variant="secondary"
            disabled={result === null}
            onClick={() => result !== null && onUse(String(Number(result.toFixed(digits))))}
          >
            Use this RPM
          </Button>
        </div>
      </div>
    </details>
  );
}

function Range({ t, fmt = money }: { t: Triplet; fmt?: (n: number, ref?: number) => string }) {
  return (
    <>
      {fmt(t.low, t.high)} – {fmt(t.high, t.high)}
    </>
  );
}

function BreakdownTable({ rows, total }: { rows: SectionResult[]; total: NonNullable<Evaluation["total"]> }) {
  const cell = "py-2 pr-3 text-right font-mono tabular-nums";
  const head = "py-1.5 pr-3 text-right label-mono font-normal";
  const line = (label: string, month: Triplet, rpm: Triplet, strong?: boolean) => (
    <tr key={label} className={strong ? "border-t border-border-strong font-semibold text-fg" : "border-t border-border text-fg-secondary"}>
      <th scope="row" className="py-2 pr-3 text-left font-medium">
        {label}
      </th>
      <td className={cell}>{rate(rpm.typical)}</td>
      <td className={cell}>{money(month.low, total.month.high)}</td>
      <td className={cell}>{money(month.typical, total.month.high)}</td>
      <td className={cell}>{money(month.high, total.month.high)}</td>
    </tr>
  );
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full min-w-[30rem] border-collapse text-sm" data-testid="breakdown">
        <caption className="sr-only">Monthly earnings by content type</caption>
        <thead>
          <tr>
            <th scope="col" className="py-1.5 pr-3 text-left label-mono font-normal">
              Content
            </th>
            <th scope="col" className={head}>
              Typical RPM
            </th>
            <th scope="col" className={head}>
              Low / month
            </th>
            <th scope="col" className={head}>
              Typical / month
            </th>
            <th scope="col" className={head}>
              High / month
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => line(r.label, r.month, r.rpm))}
          {line("Total", total.month, total.rpm, true)}
        </tbody>
      </table>
    </div>
  );
}

function ReferenceTables() {
  const th = "py-1.5 pr-3 text-left label-mono font-normal";
  const td = "py-1.5 pr-3 align-top";
  const { partnerProgram: pp } = RATES;
  return (
    <details className="rounded-lg border border-border bg-surface-2 px-3 py-2" data-testid="reference">
      <summary className="cursor-pointer text-[13px] font-medium text-fg">
        Rates and rules used in this calculator (as of {formatDate(RATES.asOf)})
      </summary>
      <div className="mt-3 flex flex-col gap-5 text-sm text-fg-secondary">
        <div>
          <h4 className="mb-1 text-[13px] font-semibold text-fg">Niche RPM, US dollars per 1,000 views</h4>
          <p className="mb-2 text-xs text-muted">{RATES.rpmBasis}</p>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[22rem] border-collapse">
              <thead>
                <tr>
                  <th className={th}>Niche</th>
                  <th className={th}>Low</th>
                  <th className={th}>Typical</th>
                  <th className={th}>High</th>
                </tr>
              </thead>
              <tbody>
                {RATES.niches.map((n) => (
                  <tr key={n.id} className="border-t border-border">
                    <td className={td}>{n.name}</td>
                    <td className={`${td} font-mono tabular-nums`}>{money(n.low)}</td>
                    <td className={`${td} font-mono tabular-nums`}>{money(n.typical)}</td>
                    <td className={`${td} font-mono tabular-nums`}>{money(n.high)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">{RATES.rpmSourcesNote}</p>
        </div>
        <div>
          <h4 className="mb-1 text-[13px] font-semibold text-fg">Audience multipliers (United States = 1.00)</h4>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[22rem] border-collapse">
              <thead>
                <tr>
                  <th className={th}>Region</th>
                  <th className={th}>Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {RATES.regions.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className={td}>
                      {r.name}
                      <span className="block text-xs text-muted">{r.examples}</span>
                    </td>
                    <td className={`${td} font-mono tabular-nums`}>{r.multiplier.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">These multipliers are planning assumptions chosen for this tool, not YouTube figures. You can change them under Advanced.</p>
        </div>
        <div>
          <h4 className="mb-1 text-[13px] font-semibold text-fg">Revenue split and Partner Program thresholds</h4>
          <ul className="list-disc space-y-1 pl-5">
            <li>Long-form: the creator keeps {RATES.revenueShare.longFormCreatorPct}% of net ad revenue.</li>
            <li>
              Shorts: the creator keeps {RATES.revenueShare.shortsCreatorPct}% of the revenue allocated to them from the Shorts pool, after the music share.
            </li>
            <li>
              Ad revenue today: {count(pp.adRevenue.subscribers)} subscribers plus {count(pp.adRevenue.watchHours)} public watch hours in {pp.adRevenue.watchWindowDays} days,
              or {count(pp.adRevenue.shortsViews)} public Shorts views in {pp.adRevenue.shortsWindowDays} days.
            </li>
            <li>
              Fan-funding tier: {count(pp.fanFunding.subscribers)} subscribers, {pp.fanFunding.uploads} public uploads in {pp.fanFunding.uploadWindowDays} days, and{" "}
              {count(pp.fanFunding.watchHours)} watch hours or {count(pp.fanFunding.shortsViews)} Shorts views.
            </li>
            <li>
              Reported from {formatDate(pp.upcoming.effective)}: {count(pp.upcoming.subscribers)} subscribers plus {count(pp.upcoming.watchHours)} watch hours or{" "}
              {count(pp.upcoming.shortsViews)} Shorts views for new applicants, and {count(pp.upcoming.shortsPoolViews)} qualified Shorts views in{" "}
              {pp.upcoming.shortsPoolWindowDays} days to earn from the Shorts pool. {pp.upcoming.status}
            </li>
            <li>AdSense pays out once your balance passes the payment threshold, usually {money(pp.adsensePaymentThresholdUsd)} (it varies by currency).</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-1 text-[13px] font-semibold text-fg">Where to verify</h4>
          <ul className="list-disc space-y-1 pl-5">
            {RATES.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

export default function YouTubeMoneyCalculator() {
  const [stored, setStored] = usePersistentState<State>("youtube-money-calculator:v1", DEFAULT_STATE);
  const s = useMemo(() => normalizeState(stored), [stored]);
  const ev = useMemo(() => evaluate(s), [s]);

  const patch = (p: Partial<State>) => setStored((prev) => ({ ...normalizeState(prev), ...p }));
  const setArrayItem = (key: "shares" | "mults", i: number, v: string) =>
    setStored((prev) => {
      const cur = normalizeState(prev);
      const next = [...cur[key]];
      next[i] = v;
      return { ...cur, [key]: next };
    });

  const wantLong = s.type !== "shorts";
  const wantShorts = s.type !== "long";
  const needsMix = (wantLong && s.longBasis === "niche") || (wantShorts && s.shortsBasis === "estimate");
  const cardCount = (wantLong ? 1 : 0) + (wantShorts ? 1 : 0) + (needsMix ? 1 : 0);
  const periodWord = s.period === "day" ? "day" : "month";
  const preset = presetIdFor(s.shares);
  const niche = RATES.niches.find((n) => n.id === s.niche) ?? RATES.niches[0];

  const total = ev.total;
  const sections = [ev.long, ev.shorts].filter((x): x is SectionResult => x !== null);

  const goalParsed = parseNum(s.goal);
  const goalError = goalParsed.kind === "invalid" ? goalParsed.hint : goalParsed.kind === "ok" && goalParsed.value <= 0 ? "Enter an amount above zero" : undefined;
  const goal = total && goalParsed.kind === "ok" ? viewsForGoal(goalParsed.value, total.rpm) : null;

  const summary = buildSummary(s, ev);
  const blockingErrors = Object.entries(ev.errors).filter(([k]) => k !== "mix");

  return (
    <ToolPanel>
      {/* Controls: what kind of channel, and how views are entered */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="label-mono">Content type</span>
            <Tabs label="Content type" value={s.type} onChange={(type) => patch({ type })} options={TYPE_OPTIONS} />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="label-mono">Enter views</span>
            <Tabs label="Views period" value={s.period} onChange={(period) => patch({ period })} options={PERIOD_OPTIONS} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-mono">Try an example</span>
          {(Object.keys(EXAMPLES) as ExampleId[]).map((id) => (
            <Button key={id} size="sm" variant="secondary" onClick={() => setStored((prev) => stateForExample(id, normalizeState(prev)))}>
              {EXAMPLES[id].label}
            </Button>
          ))}
        </div>
      </div>

      <ToolGrid className={cn("items-start", cardCount === 1 && "md:grid-cols-1")}>
        {wantLong && (
          <Card title="Long-form videos" subtitle="Videos watched on the standard watch page, where ads run before, during and after.">
            <NumField
              label={`Long-form views per ${periodWord}`}
              value={s.longViews}
              onChange={(v) => patch({ longViews: v })}
              error={ev.errors.longViews}
              hint="Type 12,500, 10k or 1.5m"
              placeholder="10,000"
            />
            <Tabs label="How to set the long-form rate" size="sm" value={s.longBasis} onChange={(longBasis) => patch({ longBasis })} options={LONG_BASIS_OPTIONS} className="self-start" />
            {s.longBasis === "niche" && (
              <Select
                label="Niche"
                value={s.niche}
                onChange={(e) => patch({ niche: e.target.value })}
                options={RATES.niches.map((n) => ({ value: n.id, label: n.name }))}
                hint={`RPM for an all-US audience: ${money(niche.low)} low, ${money(niche.typical)} typical, ${money(niche.high)} high per 1,000 views.`}
              />
            )}
            {s.longBasis === "rpm" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Your RPM per 1,000 views" prefix="$" value={s.longRpm} onChange={(v) => patch({ longRpm: v })} error={ev.errors.longRpm} placeholder="4.00" />
                  <NumField label="Month-to-month swing" suffix="±%" value={s.longSwing} onChange={(v) => patch({ longSwing: v })} error={ev.errors.longSwing} />
                </div>
                <RpmHelper
                  idPrefix="long"
                  noun=""
                  revenue={s.rpmRevenue}
                  views={s.rpmViews}
                  onRevenue={(v) => patch({ rpmRevenue: v })}
                  onViews={(v) => patch({ rpmViews: v })}
                  onUse={(v) => patch({ longRpm: v })}
                  digits={2}
                />
              </>
            )}
            {s.longBasis === "cpm" && (
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  label="Playback-based CPM"
                  prefix="$"
                  value={s.cpm}
                  onChange={(v) => patch({ cpm: v })}
                  error={ev.errors.cpm}
                  hint="Per 1,000 monetized playbacks, before YouTube's share"
                />
                <NumField label="Monetized playbacks" suffix="%" value={s.monetizedPct} onChange={(v) => patch({ monetizedPct: v })} error={ev.errors.monetizedPct} hint="Share of views that ran an ad" />
                <NumField label="Creator share" suffix="%" value={s.longShare} onChange={(v) => patch({ longShare: v })} error={ev.errors.longShare} />
                <NumField label="Month-to-month swing" suffix="±%" value={s.longSwing} onChange={(v) => patch({ longSwing: v })} error={ev.errors.longSwing} />
              </div>
            )}
          </Card>
        )}

        {wantShorts && (
          <Card title="Shorts" subtitle="Vertical videos watched in the Shorts feed, paid from a shared revenue pool.">
            <NumField
              label={`Shorts views per ${periodWord}`}
              value={s.shortsViews}
              onChange={(v) => patch({ shortsViews: v })}
              error={ev.errors.shortsViews}
              hint={ev.shorts90 !== null ? `About ${count(ev.shorts90)} Shorts views per 90 days at this rate` : "Type 100,000, 100k or 1.5m"}
              placeholder="100,000"
            />
            <Tabs label="How to set the Shorts rate" size="sm" value={s.shortsBasis} onChange={(shortsBasis) => patch({ shortsBasis })} options={SHORTS_BASIS_OPTIONS} className="self-start" />
            {s.shortsBasis === "estimate" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <NumField
                  label="Views with licensed music"
                  suffix="%"
                  value={s.musicUse}
                  onChange={(v) => patch({ musicUse: v })}
                  error={ev.errors.musicUse}
                  hint="Share of your Shorts views on Shorts that use a track"
                />
                <NumField
                  label="Music share of revenue"
                  suffix="%"
                  value={s.musicCut}
                  onChange={(v) => patch({ musicCut: v })}
                  error={ev.errors.musicCut}
                  hint="Paid to music rights holders when a track is used"
                />
                <NumField
                  label="Creator share of pool"
                  suffix="%"
                  value={s.shortsShare}
                  onChange={(v) => patch({ shortsShare: v })}
                  error={ev.errors.shortsShare}
                  hint="What you keep of the amount allocated to you"
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Your Shorts RPM per 1,000 views" prefix="$" value={s.shortsRpm} onChange={(v) => patch({ shortsRpm: v })} error={ev.errors.shortsRpm} placeholder="0.05" />
                  <NumField label="Month-to-month swing" suffix="±%" value={s.shortsSwing} onChange={(v) => patch({ shortsSwing: v })} error={ev.errors.shortsSwing} />
                </div>
                <RpmHelper
                  idPrefix="shorts"
                  noun="Shorts "
                  revenue={s.shortsRpmRevenue}
                  views={s.shortsRpmViews}
                  onRevenue={(v) => patch({ shortsRpmRevenue: v })}
                  onViews={(v) => patch({ shortsRpmViews: v })}
                  onUse={(v) => patch({ shortsRpm: v })}
                  digits={4}
                />
              </>
            )}
            <Toggle
              checked={s.applyShortsRule}
              onChange={(applyShortsRule) => patch({ applyShortsRule })}
              label="Apply the reported 2027 Shorts pool threshold"
              description={`Reported from ${formatDate(RATES.partnerProgram.upcoming.effective)}: ${count(RATES.partnerProgram.upcoming.shortsPoolViews)} qualified Shorts views in a rolling ${RATES.partnerProgram.upcoming.shortsPoolWindowDays} days to earn from the pool. Off by default because it is not in force yet.`}
            />
          </Card>
        )}
        {needsMix && (
          <Card className={s.type === "both" ? "md:col-span-2" : undefined} title="Audience and season" subtitle="Where your views come from changes what advertisers pay. Enter the share of views from each region (Studio: Analytics, Audience, Geography).">
            <Select
              label="Audience preset"
              value={preset}
              onChange={(e) => {
                const p = RATES.audiencePresets.find((x) => x.id === e.target.value);
                if (p) patch({ shares: p.shares.map(String) });
              }}
              options={[...RATES.audiencePresets.map((p) => ({ value: p.id, label: p.name })), { value: CUSTOM_PRESET, label: "Custom mix" }]}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {RATES.regions.map((r, i) => (
                <NumField key={r.id} label={r.name} suffix="%" value={s.shares[i]} onChange={(v) => setArrayItem("shares", i, v)} error={ev.errors[`share-${i}`]} hint={r.examples === r.name ? undefined : r.examples} />
              ))}
              <div className="flex flex-col justify-end gap-1.5 pb-1">
                <span className="label-mono">Total and multiplier</span>
                <div className="flex flex-wrap items-center gap-2" aria-live="polite">
                  <Badge variant={Math.abs(ev.sumShares - 100) < 0.005 ? "success" : "warning"} data-testid="mix-total">
                    Total {Number(ev.sumShares.toFixed(2))}%
                  </Badge>
                  {ev.blend !== null && (
                    <Badge variant="primary" data-testid="mix-blend">
                      Audience multiplier ×{Number(ev.blend.toFixed(4))}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {ev.errors.mix && (
              <Alert variant="error" title="No audience mix">
                {ev.errors.mix}
              </Alert>
            )}
            <Select
              label="Season"
              value={s.season}
              onChange={(e) => patch({ season: e.target.value })}
              options={RATES.seasons.map((x) => ({ value: x.id, label: `${x.name} ×${x.multiplier.toFixed(2)}` }))}
              hint="Advertisers spend more in the fourth quarter and less right after the holidays. These multipliers are planning assumptions."
            />
            <details className="rounded-lg border border-border bg-surface-2 px-3 py-2">
              <summary className="cursor-pointer text-[13px] font-medium text-fg">Advanced: change the regional multipliers</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {RATES.regions.map((r, i) => (
                  <NumField key={r.id} label={`${r.name} multiplier`} value={s.mults[i]} onChange={(v) => setArrayItem("mults", i, v)} error={ev.errors[`mult-${i}`]} hint={`Default ${r.multiplier.toFixed(2)}`} />
                ))}
              </div>
            </details>
          </Card>
        )}
      </ToolGrid>

      {/* Results */}
      <section aria-labelledby="ymc-results" className="flex flex-col gap-3">
        <h3 id="ymc-results" className="text-base font-semibold text-fg">
          Estimated earnings
        </h3>

        {blockingErrors.length > 0 && (
          <Alert variant="warning" title="Fix the highlighted fields">
            The estimate appears as soon as every field holds a valid number.
          </Alert>
        )}
        {ev.notes.map((n, i) => (
          <Alert key={i} variant={n.variant} title={n.title}>
            {n.text}
          </Alert>
        ))}

        {total && ev.ok ? (
          <div className="flex flex-col gap-3" aria-live="polite">
            <StatGrid className="sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Per day" value={<span data-testid="day-typical">{money(total.day.typical, total.day.high)}</span>} hint={<span data-testid="day-range"><Range t={total.day} /></span>} />
              <Stat label="Per month" emphasis value={<span data-testid="month-typical">{money(total.month.typical, total.month.high)}</span>} hint={<span data-testid="month-range"><Range t={total.month} /></span>} />
              <Stat label="Per year" value={<span data-testid="year-typical">{money(total.year.typical, total.year.high)}</span>} hint={<span data-testid="year-range"><Range t={total.year} /></span>} />
              <Stat
                label="RPM"
                value={<span data-testid="rpm-typical">{rate(total.rpm.typical)}</span>}
                hint={<span data-testid="rpm-range"><Range t={total.rpm} fmt={(n) => rate(n)} /></span>}
              />
            </StatGrid>
            <p className="text-xs text-muted">
              Big number = typical case. The range under it runs from the low case to the high case. RPM is what you keep per 1,000 views, after YouTube&apos;s share.
            </p>
            {s.type === "both" && sections.length === 2 && <BreakdownTable rows={sections} total={total} />}
          </div>
        ) : (
          blockingErrors.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-4 text-sm text-muted" aria-live="polite" data-testid="empty-state">
              Enter your views to see estimated earnings.
            </div>
          )
        )}

        <Alert variant="info" title="Earnings start after you join the Partner Program">
          Ad revenue is paid only to channels in the YouTube Partner Program: currently {count(RATES.partnerProgram.adRevenue.subscribers)} subscribers plus{" "}
          {count(RATES.partnerProgram.adRevenue.watchHours)} public watch hours in {RATES.partnerProgram.adRevenue.watchWindowDays} days, or {count(RATES.partnerProgram.adRevenue.shortsViews)} public Shorts views in{" "}
          {RATES.partnerProgram.adRevenue.shortsWindowDays} days (checked {formatDate(RATES.asOf)}). Higher thresholds have been reported from {formatDate(RATES.partnerProgram.upcoming.effective)}, so confirm the current rules on YouTube Help.
        </Alert>
      </section>

      {total && ev.ok && (
        <ToolSection title="How this estimate was calculated" description="Your own numbers substituted into each step. The typical case is shown; low and high follow the same steps.">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-fg-secondary" data-testid="formula">
            {sections.map((sec) => (
              <div key={sec.label} className="flex flex-col gap-1">
                <p className="label-mono">{sec.label}</p>
                {sec.lines.map((l, i) => (
                  <p key={i} className="break-words">
                    {l}
                  </p>
                ))}
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <p className="label-mono">Totals</p>
              <p className="break-words">
                {s.period === "day" ? "Per month = per day × 365 ÷ 12" : "Views per day = views per month × 12 ÷ 365"}; per year = per day × 365.
              </p>
              <p className="break-words">
                Per month {money(total.month.typical, total.month.high)}, per year {money(total.year.typical, total.year.high)} (typical case).
              </p>
            </div>
          </div>
        </ToolSection>
      )}

      {total && ev.ok && (
        <ToolSection title="How many views do I need?" description="Work backwards from an income goal at your current settings.">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-start">
            <NumField label="Target income per month" prefix="$" value={s.goal} onChange={(v) => patch({ goal: v })} error={goalError} placeholder="1,000" />
            {goal ? (
              <StatGrid className="grid-cols-1 sm:grid-cols-3 lg:grid-cols-3">
                <Stat label="If RPM is low" value={<span data-testid="goal-low">{count(goal.perMonth.low)}</span>} hint={`views a month, about ${count(goal.perDay.low)} a day`} />
                <Stat label="At typical RPM" emphasis value={<span data-testid="goal-typical">{count(goal.perMonth.typical)}</span>} hint={`views a month, about ${count(goal.perDay.typical)} a day`} />
                <Stat label="If RPM is high" value={<span data-testid="goal-high">{count(goal.perMonth.high)}</span>} hint={`views a month, about ${count(goal.perDay.high)} a day`} />
              </StatGrid>
            ) : (
              <p className="text-sm text-muted" data-testid="goal-empty">
                {goalParsed.kind === "ok" && goalParsed.value > 0
                  ? "This needs an RPM above zero in every case, so it cannot be worked out for these settings."
                  : "Enter a monthly income target to see the views it needs."}
              </p>
            )}
          </div>
        </ToolSection>
      )}

      <ToolActions>
        <CopyButton text={summary} label="Copy summary" variant="primary" disabled={!summary} />
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" aria-hidden />}
          disabled={!summary}
          onClick={() => downloadText(buildCsv(s, ev), "youtube-earnings-estimate.csv", "text/csv;charset=utf-8")}
        >
          Download CSV
        </Button>
        <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={() => setStored(DEFAULT_STATE)}>
          Reset
        </Button>
      </ToolActions>

      <ReferenceTables />

      <p className="text-xs text-muted">
        Estimates only. This is not a promise of earnings and not financial advice: real revenue depends on your audience, your content, advertiser demand and YouTube&apos;s
        rules, and it varies month to month. Rates last reviewed {formatDate(RATES.asOf)}. Amounts are in US dollars. Nothing you type leaves your browser. Independent tool, not affiliated
        with, endorsed by or sponsored by YouTube or Google.
      </p>
    </ToolPanel>
  );
}
