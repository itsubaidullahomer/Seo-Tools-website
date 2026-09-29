import { useMemo, type ReactNode } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Alert, Badge, Button, CopyButton, Input, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  CONVERTIBLE_ZONES,
  ZONES,
  ZONE_BY_LETTER,
  dayShiftLabel,
  formatOffset,
  formatOffsetMinutes,
  parseTime,
  shiftZone,
  speak,
  toMilitary,
  type NowInfo,
} from "./logic";
import { ResultRow, thClass } from "./shared";
import type { Settings, Update } from "./settings";

const ZONE_OPTIONS = CONVERTIBLE_ZONES.map((z) => ({ value: z.letter, label: `${z.letter} – ${z.name} (${formatOffset(z.offset)})` }));

function dayNote(dayShift: number): string {
  return dayShift === 0 ? "" : dayShift > 0 ? " (+1 day)" : " (−1 day)";
}

export function ZonesPanel({ s, update, now }: { s: Settings; update: Update; now: NowInfo | null }) {
  const outcome = useMemo(() => parseTime(s.tzTime, { assume: "24h" }), [s.tzTime]);

  // A zone letter typed with the time ("1530R") wins over the From menu.
  const typedZone = outcome.status === "ok" && outcome.zone && ZONE_BY_LETTER[outcome.zone].offset !== null ? outcome.zone : undefined;
  const fromLetter = typedZone ?? s.tzFrom;
  const from = ZONE_BY_LETTER[fromLetter];
  const to = ZONE_BY_LETTER[s.tzTo];
  const typedJuliet = outcome.status === "ok" && outcome.zone === "J";

  let result: ReactNode;
  let moment: { time: { hour: number; minute: number }; from: number } | null = null;

  if (outcome.status === "empty") {
    result = (
      <div className="rounded-lg border border-dashed border-border bg-surface-2 px-4 py-4 text-sm text-muted" aria-live="polite">
        Enter a time, choose the zone it is in and the zone you want, and the converted time appears here.
      </div>
    );
  } else if (outcome.status === "invalid") {
    result = (
      <Alert variant="warning" title="That is not a valid time">
        <span data-testid="tz-error">{outcome.message}</span>
      </Alert>
    );
  } else if (outcome.status === "ambiguous") {
    // Cannot happen with assume: "24h", but keep the type narrowing honest.
    result = null;
  } else if (typedJuliet) {
    result = (
      <Alert variant="info" title="Juliet (J) is your own local time">
        J has no fixed UTC offset, so it cannot be converted. Use the zone letter for your region instead, for example R for US Eastern Standard Time.
      </Alert>
    );
  } else if (from.offset !== null && to.offset !== null) {
    const shifted = shiftZone(outcome.time, from.offset, to.offset);
    moment = { time: outcome.time, from: from.offset };
    const start = `${toMilitary(outcome.time)}${from.letter}`;
    const end = `${toMilitary(shifted.time)}${to.letter}`;
    const delta = to.offset - from.offset;
    const deltaText =
      delta === 0
        ? "Both letters share the same offset, so the time does not change."
        : `${from.name} is ${formatOffset(from.offset)} and ${to.name} is ${formatOffset(to.offset)}. Going from ${from.letter} to ${to.letter} ${delta > 0 ? "adds" : "subtracts"} ${Math.abs(delta)} hour${Math.abs(delta) === 1 ? "" : "s"}: ${toMilitary(outcome.time)} ${delta > 0 ? "+" : "−"} ${String(Math.abs(delta)).padStart(2, "0")}00 = ${end}${shifted.dayShift !== 0 ? `, which is on the ${dayShiftLabel(shifted.dayShift)}` : ""}.`;
    result = (
      <div className="flex flex-col gap-2.5" aria-live="polite">
        <ResultRow label={`${start} in ${to.name} time`} value={end} emphasis testId="tz-result" hint={shifted.dayShift === 0 ? "Same day" : `On the ${dayShiftLabel(shifted.dayShift)}`} />
        <ResultRow label="How to say it" value={speak(shifted.time, s.style, to)} plain testId="tz-spoken" />
        <p className="text-sm text-fg-secondary" data-testid="tz-explain">
          {deltaText}
        </p>
        {typedZone && <p className="text-xs text-muted">The zone letter {typedZone} in your time was used as the From zone.</p>}
        {outcome.notes.length > 0 && <p className="text-xs text-muted">{outcome.notes.join(" ")}</p>}
        <div>
          <CopyButton text={`${start} = ${end}${dayNote(shifted.dayShift)}`} label="Copy conversion" size="sm" />
        </div>
      </div>
    );
  }

  const localHint = now
    ? now.zone
      ? `Your device is currently at ${formatOffsetMinutes(now.offsetMinutes)}, which is zone ${now.zone.letter} (${now.zone.name}).`
      : `Your device is currently at ${formatOffsetMinutes(now.offsetMinutes)}, which has no single-letter zone.`
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto_minmax(0,1.2fr)] sm:items-end">
        <Input
          label="Time (24-hour)"
          value={s.tzTime}
          onChange={(e) => update({ tzTime: e.target.value })}
          placeholder="1530"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={80}
          className="font-mono"
          hint={typedZone ? "Zone letter typed with the time overrides From." : "Read as 24-hour, or add AM or PM. You can type a zone letter after it (1530R); A, H and P come from the menus."}
        />
        <Select label="From zone" options={ZONE_OPTIONS} value={fromLetter} disabled={Boolean(typedZone)} onChange={(e) => update({ tzFrom: e.target.value })} />
        <Button
          variant="secondary"
          size="icon"
          aria-label="Swap zones"
          title="Swap zones"
          className="justify-self-start sm:mb-[1px]"
          onClick={() => update({ tzFrom: s.tzTo, tzTo: fromLetter })}
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden />
        </Button>
        <Select label="To zone" options={ZONE_OPTIONS} value={s.tzTo} onChange={(e) => update({ tzTo: e.target.value })} />
      </div>

      {result}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-fg">All military time zone letters</h3>
          {localHint && (
            <p className="text-xs text-muted" data-testid="tz-local">
              {localHint}
            </p>
          )}
        </div>
        <div className="max-h-[34rem] overflow-auto rounded-lg border border-border">
          <table className="w-full min-w-[21rem] text-sm" data-testid="zones-table">
            <caption className="sr-only">Military time zone letters with UTC offsets{moment ? " and the same moment in each zone" : ""}</caption>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-surface-2">
                <th scope="col" className={thClass}>
                  Letter
                </th>
                <th scope="col" className={thClass}>
                  Name
                </th>
                <th scope="col" className={thClass}>
                  UTC offset
                </th>
                <th scope="col" className={cn(thClass, "hidden md:table-cell")}>
                  Example zones
                </th>
                <th scope="col" className={thClass}>
                  {moment ? `${toMilitary(moment.time)}${from.letter} in each` : "Same moment"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[ZONE_BY_LETTER.Z, ...ZONES.filter((z) => z.letter !== "Z")].map((z) => {
                const shifted = moment && z.offset !== null ? shiftZone(moment.time, moment.from, z.offset) : null;
                const selected = z.letter === fromLetter || z.letter === s.tzTo;
                return (
                  <tr key={z.letter} className={cn(selected && "bg-primary-soft")}>
                    <th scope="row" className="px-3 py-1.5 text-left font-mono text-base font-semibold text-fg">
                      {z.letter}
                    </th>
                    <td className="px-3 py-1.5 text-fg">
                      {z.name}
                      {z.letter === fromLetter && (
                        <>
                          {" "}
                          <Badge variant="outline" className="ml-1">
                            from
                          </Badge>
                        </>
                      )}
                      {z.letter === s.tzTo && z.letter !== fromLetter && (
                        <>
                          {" "}
                          <Badge variant="primary" className="ml-1">
                            to
                          </Badge>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs tabular-nums text-fg-secondary">{formatOffset(z.offset)}</td>
                    <td className="hidden px-3 py-1.5 text-xs text-muted md:table-cell">{z.examples}</td>
                    <td className="px-3 py-1.5 font-mono text-[13px] tabular-nums text-fg">
                      {shifted ? (
                        <>
                          {toMilitary(shifted.time)}
                          {z.letter}
                          <span className="text-xs text-muted">{dayNote(shifted.dayShift)}</span>
                        </>
                      ) : (
                        <span className="text-muted">{z.offset === null ? "your local time" : "–"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">
          Letters cover whole-hour offsets only. Zones such as India (UTC+5:30) and Nepal (UTC+5:45) have no single letter, and daylight saving time moves a region to the next letter for part of the year.
        </p>
      </div>
    </div>
  );
}
