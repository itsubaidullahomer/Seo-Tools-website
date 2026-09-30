import { useMemo, type ReactNode } from "react";
import { X } from "lucide-react";
import { Alert, Badge, Button, CopyButton, Input, Select, Toggle, ToolActions } from "@/components/ui";
import {
  SPOKEN_STYLES,
  ZONES,
  ZONE_BY_LETTER,
  dayShiftLabel,
  formatOffset,
  formatOffsetMinutes,
  pad2,
  parseTime,
  shiftZone,
  speak,
  to12h,
  toColon,
  toMilitary,
  type NowInfo,
  type SpokenStyle,
} from "./logic";
import { OptionCard, ResultRow } from "./shared";
import type { Settings, Update } from "./settings";

const TRY_EXAMPLES = ["5:30 PM", "1900", "0630", "12:00 AM", "2359", "noon", "1730Z"];

/** Zulu first, then A to Y, which is how people look these up. */
const ZONE_OPTIONS = [
  { value: "", label: "None" },
  ...[ZONE_BY_LETTER.Z, ...ZONES.filter((z) => z.letter !== "Z")].map((z) => ({
    value: z.letter,
    label: `${z.letter} – ${z.name} (${formatOffset(z.offset)})`,
  })),
];

const HOUR_OPTIONS = [{ value: "", label: "Hour", disabled: true }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))];
const MINUTE_OPTIONS = [{ value: "", label: "Min", disabled: true }, ...Array.from({ length: 60 }, (_, i) => ({ value: String(i), label: pad2(i) }))];
const MERIDIEM_OPTIONS = [
  { value: "", label: "AM/PM", disabled: true },
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

function ClockStrip({ now, s, update }: { now: NowInfo | null; s: Settings; update: Update }) {
  const t = now ? (s.zulu ? now.utc : now.local) : null;
  const zulu = ZONE_BY_LETTER.Z;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="min-w-[7.5rem]">
            <div className="label-mono">{s.zulu ? "Right now in Zulu (UTC)" : "Right now on your device"}</div>
            <output data-testid="now-military" className="block font-mono text-3xl font-semibold tabular-nums tracking-tight text-primary">
              {t ? `${toMilitary(t)}${s.zulu ? "Z" : ""}` : "----"}
            </output>
          </div>
          <div className="min-h-[2.5rem] text-sm text-fg-secondary">
            {t ? (
              <>
                <div data-testid="now-12h">
                  {to12h(t)}
                  {s.zulu ? " UTC" : ""}
                </div>
                <div className="text-xs text-muted">{speak(t, s.style, s.zulu ? zulu : undefined)}</div>
              </>
            ) : (
              <div className="text-xs text-muted">Reading your clock&hellip;</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Toggle checked={s.zulu} onChange={(zuluOn) => update({ zulu: zuluOn })} label="Show Zulu (UTC)" />
          <Button
            variant="secondary"
            size="sm"
            disabled={!now}
            onClick={() => {
              if (!now) return;
              update({ input: s.zulu ? `${toMilitary(now.utc)}Z` : toMilitary(now.local), zone: "" });
            }}
          >
            Use this time
          </Button>
        </div>
      </div>
      {now && (
        <p className="text-xs text-muted" data-testid="now-detail">
          {s.zulu
            ? `Date-time group: ${now.dtg}`
            : `Your clock is at ${formatOffsetMinutes(now.offsetMinutes)}${
                now.zone
                  ? `, which is military zone ${now.zone.letter} (${now.zone.name}).`
                  : ", which has no single-letter military zone because it is not a whole-hour offset from UTC between −12 and +12."
              }`}
        </p>
      )}
    </div>
  );
}

function ambiguousLabel(hour12: number, minute: number, mer: "AM" | "PM"): string {
  return `${hour12}:${pad2(minute)} ${mer}`;
}

export function ConvertPanel({ s, update, now }: { s: Settings; update: Update; now: NowInfo | null }) {
  const outcome = useMemo(() => parseTime(s.input), [s.input]);

  const pickValue =
    outcome.status === "ok"
      ? { h: outcome.time.hour % 12 || 12, m: outcome.time.minute, mer: outcome.time.hour < 12 ? "AM" : "PM" }
      : outcome.status === "ambiguous"
        ? { h: outcome.hour12, m: outcome.minute, mer: "" }
        : null;

  const setPick = (patch: { h?: number; m?: number; mer?: string }) => {
    const h = patch.h ?? pickValue?.h ?? 12;
    const m = patch.m ?? pickValue?.m ?? 0;
    const mer = patch.mer ?? (pickValue?.mer || "AM");
    update({ input: `${h}:${pad2(m)} ${mer}` });
  };

  const zoneLetter = outcome.status === "ok" || outcome.status === "ambiguous" ? (outcome.zone ?? (s.zone || undefined)) : undefined;
  const zone = zoneLetter ? ZONE_BY_LETTER[zoneLetter] : undefined;

  let result: ReactNode;
  let copyAll = "";

  if (outcome.status === "empty") {
    result = (
      <div className="flex min-h-[9rem] items-center rounded-lg border border-dashed border-border bg-surface-2 px-4 py-4 text-sm text-muted" aria-live="polite">
        Type a time such as 5:30 PM or 1730, and the conversion appears here.
      </div>
    );
  } else if (outcome.status === "invalid") {
    result = (
      <Alert variant="warning" title="That is not a valid time">
        <span data-testid="parse-error">{outcome.message}</span>
      </Alert>
    );
  } else if (outcome.status === "ambiguous") {
    const { hour12, minute } = outcome;
    result = (
      <div className="flex flex-col gap-3" aria-live="polite">
        <Alert variant="info" title="AM or PM?">
          <span data-testid="ambiguous-note">
            {hour12}:{pad2(minute)} has no AM or PM, so it could be either. Pick the one you mean.
          </span>
        </Alert>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["AM", outcome.am],
              ["PM", outcome.pm],
            ] as const
          ).map(([mer, t]) => (
            <button
              key={mer}
              type="button"
              data-testid={`pick-${mer.toLowerCase()}`}
              onClick={() => update({ input: `${ambiguousLabel(hour12, minute, mer)}${outcome.zone ?? ""}`.trim() })}
              className="flex flex-col items-start gap-0.5 rounded-lg border border-border-strong bg-surface px-3.5 py-3 text-left transition-colors hover:border-primary hover:bg-primary-soft"
            >
              <span className="text-sm font-medium text-fg">{ambiguousLabel(hour12, minute, mer)}</span>
              <span className="font-mono text-2xl font-semibold tabular-nums text-primary">{toMilitary(t)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  } else {
    const { time: t, source, notes, explain } = outcome;
    const military = `${toMilitary(t)}${zone?.letter ?? ""}`;
    const twelve = to12h(t);
    const spoken = speak(t, s.style, zone);
    const utc = zone && zone.offset !== null && zone.offset !== 0 ? shiftZone(t, zone.offset, 0) : null;
    copyAll = [
      `${source === "12h" ? twelve : toMilitary(t)} = ${source === "12h" ? military : twelve}`,
      `24-hour with colon: ${toColon(t)}${zone?.letter ?? ""}`,
      `Say it: ${spoken}`,
      ...(utc ? [`In Zulu (UTC): ${toMilitary(utc.time)}Z (${dayShiftLabel(utc.dayShift)})`] : []),
    ].join("\n");

    const militaryRow = (
      <ResultRow key="mil" label="Military time" value={military} emphasis={source === "12h"} testId="res-military" hint={zone ? `Zone ${zone.letter}: ${zone.name}` : undefined} />
    );
    const twelveRow = <ResultRow key="12" label="12-hour time" value={twelve} emphasis={source === "24h"} testId="res-12h" />;

    result = (
      <div className="flex flex-col gap-2.5" aria-live="polite">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" data-testid="detected">
            Read as {source === "12h" ? "12-hour" : "24-hour"} time
          </Badge>
          {outcome.zone && <Badge variant="outline">Zone letter {outcome.zone} from your input</Badge>}
        </div>
        {source === "12h" ? [militaryRow, twelveRow] : [twelveRow, militaryRow]}
        <ResultRow label="24-hour with colon" value={`${toColon(t)}${zone?.letter ?? ""}`} testId="res-colon" />
        <ResultRow label="How to say it" value={spoken} plain testId="res-spoken" />
        {utc && (
          <ResultRow
            label="In Zulu (UTC)"
            value={`${toMilitary(utc.time)}Z`}
            hint={`${dayShiftLabel(utc.dayShift)}; ${zone?.name} is ${formatOffset(zone?.offset ?? null)}`}
            testId="res-utc"
          />
        )}
        <p className="text-sm text-fg-secondary" data-testid="res-explain">
          {explain}
        </p>
        {notes.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted" data-testid="res-notes">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <ToolActions>
          <CopyButton text={copyAll} label="Copy all" size="sm" />
        </ToolActions>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ClockStrip now={now} s={s} update={update} />

      <div className="flex flex-col gap-2.5">
        <Input
          label="Time to convert"
          hint="Type a 12-hour time (5:30 PM) or a 24-hour time (1730, 17:30, 0630). The direction is detected for you."
          value={s.input}
          onChange={(e) => update({ input: e.target.value })}
          placeholder="5:30 PM or 1730"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={80}
          inputSize="lg"
          className="font-mono"
        />
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Example times">
          <span className="label-mono mr-1">Try</span>
          {TRY_EXAMPLES.map((ex) => (
            <Button key={ex} variant="secondary" size="sm" className="font-mono" onClick={() => update({ input: ex, zone: ex === "1730Z" ? "" : s.zone })}>
              {ex}
            </Button>
          ))}
          <Button variant="ghost" size="sm" leftIcon={<X className="h-3.5 w-3.5" aria-hidden />} onClick={() => update({ input: "" })} disabled={!s.input}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="min-w-0">{result}</div>
        <OptionCard title="Options">
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Pick a time">
            <Select label="Hour" options={HOUR_OPTIONS} value={pickValue ? String(pickValue.h) : ""} onChange={(e) => setPick({ h: Number(e.target.value) })} selectSize="sm" />
            <Select label="Minute" options={MINUTE_OPTIONS} value={pickValue ? String(pickValue.m) : ""} onChange={(e) => setPick({ m: Number(e.target.value) })} selectSize="sm" />
            <Select label="AM/PM" options={MERIDIEM_OPTIONS} value={pickValue?.mer ?? ""} onChange={(e) => setPick({ mer: e.target.value })} selectSize="sm" />
          </div>
          <Select
            label="Time zone letter (optional)"
            options={ZONE_OPTIONS}
            value={s.zone}
            onChange={(e) => update({ zone: e.target.value })}
            hint="Z is Zulu (UTC). Letters A to M are ahead of UTC and N to Y are behind. J means local time."
          />
          <Select
            label="How to say the time"
            options={SPOKEN_STYLES}
            value={s.style}
            onChange={(e) => update({ style: e.target.value as SpokenStyle })}
          />
        </OptionCard>
      </div>
    </div>
  );
}
