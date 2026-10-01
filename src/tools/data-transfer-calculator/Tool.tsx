"use client";

import { useMemo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Input, Select, Slider, Stat, StatGrid, Tabs, ToolActions, ToolPanel, ToolSection } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FIELDS,
  EFFICIENCY_PRESETS,
  EXAMPLES,
  MAX_INPUT_LENGTH,
  MESSAGES,
  MODES,
  MODE_FIELDS,
  MODE_INFO,
  SIZE_UNITS,
  SPEED_UNITS,
  TIME_UNITS,
  UNIT_TABLE,
  approxYears,
  comparisonCsv,
  comparisonRows,
  durationIn,
  evaluate,
  explainSteps,
  formatBitRate,
  formatByteRate,
  formatDuration,
  formatNum,
  formatPct,
  formatSeconds,
  formatSize,
  headline,
  normalizeFields,
  parseNumber,
  sizeHint,
  sizeInAllUnits,
  speedHint,
  speedInAllUnits,
  summaryText,
  timeHint,
  type Evaluation,
  type FieldErrors,
  type Fields,
  type Mode,
  type SizeUnitId,
  type SpeedUnitId,
  type TimeUnitId,
  type TransferResult,
} from "./logic";

const STORAGE_KEY = "data-transfer-calculator:v1";

const MODE_OPTIONS = MODES.map((m) => ({ value: m, label: MODE_INFO[m].label }));

const SUPERSCRIPT = ["", "", "²", "³", "⁴", "⁵"];

function powerLabel(base: number, bytes: number): string {
  const n = Math.round(Math.log(bytes) / Math.log(base));
  return n <= 1 ? `${formatNum(bytes)} B` : `${base}${SUPERSCRIPT[n]} B`;
}

function GroupLabel({ children }: { children: ReactNode }) {
  return <p className="label-mono">{children}</p>;
}

function Placeholder({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface-2 px-4 py-6 text-sm text-muted" aria-live="polite" data-testid={testId}>
      {children}
    </div>
  );
}

/** A hint line under a number + unit pair, shown only while the number is valid. */
function liveHint(raw: string, make: (value: number) => string): string | null {
  const p = parseNumber(raw);
  return p.kind === "ok" && p.value > 0 ? make(p.value) : null;
}

function NumberInput({
  label,
  value,
  onChange,
  error,
  placeholder,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder: string;
  testId: string;
}) {
  return (
    <Input
      label={label}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      maxLength={MAX_INPUT_LENGTH}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      containerClassName="min-w-0"
      data-testid={testId}
    />
  );
}

function SizeFields({ f, errors, set }: { f: Fields; errors: FieldErrors; set: Setter }) {
  const hint = errors.size ? null : liveHint(f.size, (v) => sizeHint(v, f.sizeUnit));
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 label-mono">{f.mode === "speed" ? "Data to move" : "Amount of data"}</legend>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="Size" value={f.size} onChange={set("size")} error={errors.size} placeholder="1" testId="field-size" />
        <Select label="Size unit" value={f.sizeUnit} onChange={(e) => set("sizeUnit")(e.target.value as SizeUnitId)} containerClassName="min-w-0" data-testid="select-size-unit">
          <option value="B">B – bytes</option>
          <optgroup label="Decimal, 1000-based">
            {SIZE_UNITS.filter((u) => u.family === "decimal").map((u) => (
              <option key={u.id} value={u.id}>
                {u.id} – {u.name} ({powerLabel(1000, u.bytes)})
              </option>
            ))}
          </optgroup>
          <optgroup label="Binary, 1024-based">
            {SIZE_UNITS.filter((u) => u.family === "binary").map((u) => (
              <option key={u.id} value={u.id}>
                {u.id} – {u.name} ({powerLabel(1024, u.bytes)})
              </option>
            ))}
          </optgroup>
        </Select>
      </div>
      <p className="break-words font-mono text-xs text-fg-secondary" data-testid="size-hint">
        {hint ?? "kB, MB, GB, TB are 1000-based. KiB, MiB, GiB, TiB are 1024-based."}
      </p>
    </fieldset>
  );
}

function SpeedFields({ f, errors, set }: { f: Fields; errors: FieldErrors; set: Setter }) {
  const hint = errors.speed ? null : liveHint(f.speed, (v) => speedHint(v, f.speedUnit));
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 label-mono">Link speed (nominal)</legend>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label="Speed" value={f.speed} onChange={set("speed")} error={errors.speed} placeholder="100" testId="field-speed" />
        <Select label="Speed unit" value={f.speedUnit} onChange={(e) => set("speedUnit")(e.target.value as SpeedUnitId)} containerClassName="min-w-0" data-testid="select-speed-unit">
          <optgroup label="Bits per second">
            {SPEED_UNITS.filter((u) => u.family === "bits").map((u) => (
              <option key={u.id} value={u.id}>
                {u.symbol} – {u.name.replace(" per second", "/s")}
              </option>
            ))}
          </optgroup>
          <optgroup label="Bytes per second, 1000-based">
            {SPEED_UNITS.filter((u) => u.family === "decimal").map((u) => (
              <option key={u.id} value={u.id}>
                {u.symbol} – {u.name.replace(" per second", "/s")}
              </option>
            ))}
          </optgroup>
          <optgroup label="Bytes per second, 1024-based">
            {SPEED_UNITS.filter((u) => u.family === "binary").map((u) => (
              <option key={u.id} value={u.id}>
                {u.symbol} – {u.name.replace(" per second", "/s")}
              </option>
            ))}
          </optgroup>
        </Select>
      </div>
      <p className="break-words font-mono text-xs text-fg-secondary" data-testid="speed-hint">
        {hint ?? "Lowercase b is bits, uppercase B is bytes: 8 bits = 1 byte."}
      </p>
    </fieldset>
  );
}

function TimeFields({ f, errors, set }: { f: Fields; errors: FieldErrors; set: Setter }) {
  const hint = errors.time ? null : liveHint(f.time, (v) => timeHint(v, f.timeUnit));
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 label-mono">{f.mode === "speed" ? "Deadline" : "Time"}</legend>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput label={f.mode === "speed" ? "Finish within" : "Duration"} value={f.time} onChange={set("time")} error={errors.time} placeholder="1" testId="field-time" />
        <Select
          label="Time unit"
          value={f.timeUnit}
          onChange={(e) => set("timeUnit")(e.target.value as TimeUnitId)}
          options={TIME_UNITS.map((u) => ({ value: u.id, label: u.name }))}
          containerClassName="min-w-0"
          data-testid="select-time-unit"
        />
      </div>
      {hint && (
        <p className="font-mono text-xs text-fg-secondary" data-testid="time-hint">
          {hint}
        </p>
      )}
    </fieldset>
  );
}

function EfficiencyFields({ f, errors, set }: { f: Fields; errors: FieldErrors; set: Setter }) {
  const p = parseNumber(f.efficiency, { allowPercent: true });
  const sliderValue = p.kind === "ok" && p.value >= 1 && p.value <= 100 ? p.value : 100;
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-2 label-mono">Efficiency (optional)</legend>
      <Input
        label="Share of the nominal rate that carries your data"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        maxLength={MAX_INPUT_LENGTH}
        value={f.efficiency}
        suffix="%"
        placeholder="100"
        onChange={(e) => set("efficiency")(e.target.value)}
        error={errors.efficiency}
        data-testid="field-efficiency"
      />
      <Slider label="Drag to adjust" value={sliderValue} min={1} max={100} step={1} editable={false} format={(v) => `${formatNum(v, 2)}%`} onChange={(v) => set("efficiency")(String(v))} />
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Efficiency presets">
        {EFFICIENCY_PRESETS.map((e) => {
          const active = p.kind === "ok" && p.value === Number(e.value);
          return (
            <Button key={e.value} size="sm" variant={active ? "primary" : "secondary"} aria-pressed={active} onClick={() => set("efficiency")(e.value)} title={e.description}>
              {e.label} <span className="hidden font-normal sm:inline">· {e.value === "100" ? "nominal" : "TCP/IPv4 max"}</span>
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        100% uses the link&apos;s full nominal rate, the best case. Real transfers are slower because of protocol headers, congestion, Wi-Fi conditions and disk speed. 94.93% is the ceiling for TCP over IPv4 on Ethernet with
        full 1500-byte packets: 1,460 payload bytes out of 1,538 bytes on the wire. If you have measured your real speed, enter that as the speed and keep 100%.
      </p>
    </fieldset>
  );
}

function MathBox({ r }: { r: TransferResult }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3.5 py-3">
      <p className="label-mono">The math, with your numbers</p>
      <ol className="mt-1.5 flex flex-col gap-1 font-mono text-xs leading-relaxed text-fg-secondary" data-testid="steps">
        {explainSteps(r).map((s) => (
          <li key={s} className="break-words">
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Results({ ev }: { ev: Evaluation }) {
  if (ev.status === "empty") {
    return <Placeholder testId="results-empty">{MESSAGES[ev.missing[0]].missing}</Placeholder>;
  }
  if (ev.status === "invalid") {
    return <Placeholder testId="results-invalid">Fix the highlighted field to see the result.</Placeholder>;
  }
  const r = ev.result;
  const pct = formatPct(r.input.efficiencyPct);
  const partial = r.efficiency < 1;
  const years = approxYears(r.seconds);

  return (
    <div className="flex flex-col gap-4" aria-live="polite" data-testid="results">
      {r.mode === "time" && (
        <>
          <Stat
            emphasis
            label="Transfer time"
            value={<span data-testid="headline">{formatDuration(r.seconds)}</span>}
            hint={
              <>
                <span data-testid="exact-seconds">{formatSeconds(r.seconds)}</span> exactly{years ? `, ${years}` : ""}
              </>
            }
          />
          <StatGrid className="sm:grid-cols-3 lg:grid-cols-3">
            {durationIn(r.seconds)
              .filter((d) => d.unit !== "s" && (d.unit !== "d" || r.seconds >= 86400))
              .map((d) => (
                <Stat key={d.unit} label={`In ${d.label}`} value={<span className="text-lg">{formatNum(d.value, 3)}</span>} />
              ))}
            <Stat label="Throughput" value={<span className="text-lg">{formatBitRate(r.effectiveBps).text}</span>} hint={`${formatByteRate(r.effectiveBps).text} = ${formatByteRate(r.effectiveBps, "binary").text}`} />
          </StatGrid>
          {r.seconds < 1 && (
            <Alert variant="info" title="Very short transfer">
              At this size, connection setup and latency (the delay before the first byte arrives) can take longer than the data itself. This calculator counts only the data rate.
            </Alert>
          )}
        </>
      )}

      {r.mode === "speed" && (
        <>
          <Stat
            emphasis
            label="Link speed needed"
            value={<span data-testid="headline">{formatBitRate(r.nominalBps).text}</span>}
            hint={`${formatByteRate(r.nominalBps).text} = ${formatByteRate(r.nominalBps, "binary").text} · nominal rate at ${pct} efficiency`}
          />
          {partial && (
            <Stat
              label="Throughput your data needs"
              value={<span className="text-lg">{formatBitRate(r.effectiveBps).text}</span>}
              hint={`${formatByteRate(r.effectiveBps).text}; the link must be faster because only ${pct} of it carries data`}
            />
          )}
        </>
      )}

      {r.mode === "data" && (
        <Stat
          emphasis
          label="Data transferred"
          value={<span data-testid="headline">{formatSize(r.bytes).text}</span>}
          hint={`= ${formatSize(r.bytes, "binary").text} = ${formatNum(r.bytes)} bytes`}
        />
      )}

      <MathBox r={r} />

      {partial ? (
        <Alert variant="info" title={`Assumes ${pct} of the nominal rate carries your data`}>
          Set the efficiency to 100 to see the theoretical best case.
        </Alert>
      ) : (
        <Alert variant="info" title="Best case at the full nominal rate">
          Real transfers are slower. Lower the efficiency to allow for overhead, or enter a speed you have measured.
        </Alert>
      )}
    </div>
  );
}

function UnitGroups({ groups }: { groups: { title: string; rows: string[] }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {groups.map((g) => (
        <div key={g.title} className="min-w-0 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5">
          <p className="label-mono">{g.title}</p>
          <ul className="mt-1.5 flex flex-col gap-1 font-mono text-[13px] tabular-nums text-fg">
            {g.rows.map((row) => (
              <li key={row} className="break-all">
                {row}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function OtherUnits({ r }: { r: TransferResult }) {
  if (r.mode === "time") {
    const bits = speedInAllUnits(r.effectiveBps);
    return (
      <UnitGroups
        groups={[
          { title: "Your data", rows: [formatSize(r.bytes).text, formatSize(r.bytes, "binary").text, `${formatNum(r.bytes)} bytes`, `${formatNum(r.bits)} bits`] },
          { title: "Throughput, bits", rows: bits.filter((x) => x.family === "bits").map((x) => x.text) },
          { title: "Throughput, bytes", rows: bits.filter((x) => x.family !== "bits" && x.unit.id !== "Bps").map((x) => x.text) },
        ]}
      />
    );
  }
  if (r.mode === "speed") {
    const all = speedInAllUnits(r.nominalBps);
    return (
      <UnitGroups
        groups={[
          { title: "Bits per second", rows: all.filter((x) => x.family === "bits").map((x) => x.text) },
          { title: "Bytes/s, 1000-based", rows: all.filter((x) => x.family === "decimal").map((x) => x.text) },
          { title: "Bytes/s, 1024-based", rows: all.filter((x) => x.family === "binary").map((x) => x.text) },
        ]}
      />
    );
  }
  const all = sizeInAllUnits(r.bytes);
  return (
    <UnitGroups
      groups={[
        { title: "1000-based", rows: all.filter((x) => x.family === "decimal").map((x) => x.text) },
        { title: "1024-based", rows: all.filter((x) => x.family === "binary").map((x) => x.text) },
        { title: "Bytes and bits", rows: [`${formatNum(r.bytes)} bytes`, `${formatNum(r.bits)} bits`] },
      ]}
    />
  );
}

const thClass = "px-2 py-2 font-medium sm:px-3";

function ComparisonTable({ r }: { r: TransferResult }) {
  const rows = comparisonRows(r);
  const dataMode = r.mode === "data";
  return (
    <div className="scroll-thin overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[20rem] border-collapse text-right text-[13px] tabular-nums" data-testid="comparison-table">
        <thead>
          <tr className="border-b border-border bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            <th scope="col" className={cn(thClass, "text-left")}>
              Link speed
            </th>
            <th scope="col" className={thClass}>
              {dataMode ? "Data (1000-based)" : "Transfer time"}
            </th>
            <th scope="col" className={cn(thClass, "hidden sm:table-cell")}>
              {dataMode ? "Data (1024-based)" : "Seconds"}
            </th>
            {r.mode === "speed" && (
              <th scope="col" className={thClass}>
                In time?
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.bps}-${row.kind}`} className={cn("border-b border-border last:border-b-0", row.kind !== "preset" && "bg-primary-soft")} data-testid={`compare-row-${row.bps}`}>
              <th scope="row" className="px-2 py-1.5 text-left font-normal sm:px-3">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono font-medium text-fg">{row.label}</span>
                  {row.kind === "yours" && <Badge variant="primary">your speed</Badge>}
                  {row.kind === "needed" && <Badge variant="primary">minimum</Badge>}
                </span>
                {row.note && <span className="block text-xs text-muted">{row.note}</span>}
              </th>
              <td className="px-2 py-1.5 font-medium text-fg sm:px-3">{dataMode ? formatSize(row.bytes!).text : formatDuration(row.seconds!)}</td>
              <td className="hidden px-2 py-1.5 text-fg-secondary sm:table-cell sm:px-3">{dataMode ? formatSize(row.bytes!, "binary").text : formatSeconds(row.seconds!)}</td>
              {r.mode === "speed" && <td className={cn("px-2 py-1.5 sm:px-3", row.meets ? "font-medium text-success" : "text-muted")}>{row.meets ? "Yes" : "No"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function comparisonTitle(r: TransferResult): string {
  if (r.mode === "data") return `Data moved in ${formatDuration(r.seconds)} at common link speeds`;
  const s = r.input.size!;
  const what = `${formatNum(s.value, 6)} ${s.unit.id}`;
  if (r.mode === "speed") return `Time to move ${what} at common link speeds, against your ${formatDuration(r.seconds)} deadline`;
  return `Time to move ${what} at common link speeds`;
}

function UnitTable() {
  return (
    <div className="scroll-thin overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[22rem] border-collapse text-right text-[13px] tabular-nums" data-testid="unit-table">
        <thead>
          <tr className="border-b border-border bg-surface-2 font-mono text-[11px] uppercase tracking-wide text-muted">
            <th scope="col" className={cn(thClass, "text-left")}>
              1000-based
            </th>
            <th scope="col" className={thClass}>
              Bytes
            </th>
            <th scope="col" className={cn(thClass, "text-left")}>
              1024-based
            </th>
            <th scope="col" className={thClass}>
              Bytes
            </th>
            <th scope="col" className={thClass}>
              Binary is larger by
            </th>
          </tr>
        </thead>
        <tbody>
          {UNIT_TABLE.map((row) => (
            <tr key={row.decimal} className="border-b border-border last:border-b-0">
              <th scope="row" className="px-2 py-1.5 text-left font-mono font-medium text-fg sm:px-3">
                {row.decimal}
              </th>
              <td className="px-2 py-1.5 font-mono text-fg-secondary sm:px-3">{formatNum(row.decimalBytes)}</td>
              <td className="px-2 py-1.5 text-left font-mono font-medium text-fg sm:px-3">{row.binary}</td>
              <td className="px-2 py-1.5 font-mono text-fg-secondary sm:px-3">{formatNum(row.binaryBytes)}</td>
              <td className="px-2 py-1.5 font-mono text-fg sm:px-3">{formatNum(row.gapPct, 2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Setter = <K extends keyof Fields>(key: K) => (value: Fields[K]) => void;

export default function DataTransferCalculator() {
  const [stored, setStored] = usePersistentState<Fields>(STORAGE_KEY, DEFAULT_FIELDS);
  const f = useMemo(() => normalizeFields(stored), [stored]);
  const set: Setter = (key) => (value) => setStored((prev) => ({ ...normalizeFields(prev), [key]: value }));
  const ev = useMemo(() => evaluate(f), [f]);
  const r = ev.status === "ok" ? ev.result : null;
  const uses = (k: "size" | "speed" | "time") => MODE_FIELDS[f.mode].includes(k);

  const loadExample = (fields: Partial<Fields>) => setStored((prev) => ({ ...normalizeFields(prev), ...fields }));
  const exampleActive = (fields: Partial<Fields>) => (Object.keys(fields) as (keyof Fields)[]).every((k) => f[k] === fields[k]);

  const copyResult = r ? (r.mode === "time" ? `${headline(r)} (${formatSeconds(r.seconds)})` : headline(r)) : "";

  return (
    <ToolPanel>
      <div className="flex flex-col gap-2">
        <Tabs label="What to calculate" size="sm" value={f.mode} onChange={(m: Mode) => set("mode")(m)} options={MODE_OPTIONS} className="self-start" />
        <p className="text-sm text-muted" data-testid="mode-description">
          {MODE_INFO[f.mode].description}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <GroupLabel>Worked examples</GroupLabel>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Worked examples">
          {EXAMPLES.map((e) => {
            const active = exampleActive(e.fields);
            return (
              <Button key={e.id} size="sm" variant={active ? "primary" : "secondary"} aria-pressed={active} onClick={() => loadExample(e.fields)}>
                {e.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {uses("size") && <SizeFields f={f} errors={ev.errors} set={set} />}
          {uses("speed") && <SpeedFields f={f} errors={ev.errors} set={set} />}
          {uses("time") && <TimeFields f={f} errors={ev.errors} set={set} />}
          {r && (
            <p className="rounded-lg border border-border bg-primary-soft px-3 py-2 text-sm text-fg md:hidden" data-testid="quick-result">
              {MODE_INFO[f.mode].title}: <span className="font-mono font-semibold text-primary">{headline(r)}</span>{" "}
              <a href="#dtc-results" className="text-primary underline underline-offset-2">
                Details
              </a>
            </p>
          )}
          <EfficiencyFields f={f} errors={ev.errors} set={set} />
        </div>

        <div id="dtc-results" className="flex min-w-0 scroll-mt-20 flex-col gap-4">
          <h2 className="label-mono">{MODE_INFO[f.mode].title}</h2>
          <Results ev={ev} />
        </div>
      </div>

      <ToolActions>
        <CopyButton text={copyResult} label="Copy result" variant="primary" disabled={!r} />
        <CopyButton text={r ? summaryText(r) : ""} label="Copy result with working" variant="secondary" disabled={!r} />
        <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={() => setStored(DEFAULT_FIELDS)}>
          Reset
        </Button>
      </ToolActions>

      {r && (
        <ToolSection title={`${MODE_INFO[f.mode].title} in other units`} description="Decimal units count in 1000s, binary units in 1024s. Bits are bytes × 8.">
          <OtherUnits r={r} />
        </ToolSection>
      )}

      <ToolSection
        title={r ? comparisonTitle(r) : "Common link speeds"}
        description={
          r
            ? `${r.efficiency < 1 ? `At ${formatPct(r.input.efficiencyPct)} of each nominal rate.` : "At the full nominal rate of each link."} Technology names mark nominal rates (for USB, the signalling rate); real throughput over those links is lower.`
            : undefined
        }
      >
        {r ? (
          <>
            <ComparisonTable r={r} />
            <ToolActions>
              <CopyButton text={comparisonCsv(r)} label="Copy table as CSV" variant="secondary" size="sm" />
            </ToolActions>
          </>
        ) : (
          <Placeholder>Complete the fields above to compare common link speeds.</Placeholder>
        )}
      </ToolSection>

      <ToolSection title="Units at a glance" description="Storage and file sizes come in two families. Network speeds are quoted in bits per second with 1000-based prefixes: 1 Mbps = 1,000,000 bit/s.">
        <UnitTable />
      </ToolSection>
    </ToolPanel>
  );
}
