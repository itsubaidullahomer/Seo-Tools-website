"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Input, ResultBox, Select, Stat, Tabs, ToolActions, ToolGrid, ToolPanel, ToolSection } from "@/components/ui";
import {
  COMMON_ZONES,
  EXAMPLE_SNOWFLAKE,
  LOCALES,
  STYLES,
  WORLD_CLOCK_ZONES,
  activeUnix,
  buildSnippet,
  decodeSnowflake,
  describeDelta,
  describeInstant,
  describeOffset,
  describeWorldClock,
  formatDateInput,
  formatTimeInput,
  isLocale,
  isSnippetLang,
  isStyleLetter,
  isValidTimeZone,
  isoUtc,
  nextHour,
  parseUnixInput,
  preview,
  resolveLocal,
  resolvePicker,
  tagFor,
  wallParts,
  type SnippetLang,
  type StyleLetter,
  type Wall,
} from "./logic";

type Mode = "picker" | "unix" | "snowflake";
type Fold = "earlier" | "later";

interface Stored {
  mode: Mode;
  /** null means "use the default (the next full hour)" until the person edits the field; "" means they cleared it. */
  date: string | null;
  time: string | null;
  /** "" means "this device's time zone". */
  tz: string;
  fold: Fold;
  viewerTz: string;
  lang: string;
  unix: string;
  snowflake: string;
  snippetStyle: StyleLetter;
  snippetLang: SnippetLang;
}

const DEFAULTS: Stored = {
  mode: "picker",
  date: null,
  time: null,
  tz: "",
  fold: "earlier",
  viewerTz: "",
  lang: "en-US",
  unix: "",
  snowflake: "",
  snippetStyle: "R",
  snippetLang: "js",
};

/** Stored state can be missing, old or hand-edited, so rebuild it field by field. */
function normalize(stored: unknown): Stored {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const str = (k: string, fallback: string, max = 64) => (typeof src[k] === "string" ? (src[k] as string).slice(0, max) : fallback);
  return {
    mode: src.mode === "unix" || src.mode === "snowflake" || src.mode === "picker" ? src.mode : DEFAULTS.mode,
    date: typeof src.date === "string" ? src.date.slice(0, 64) : null,
    time: typeof src.time === "string" ? src.time.slice(0, 64) : null,
    tz: str("tz", ""),
    fold: src.fold === "later" ? "later" : "earlier",
    viewerTz: str("viewerTz", ""),
    lang: isLocale(src.lang) ? src.lang : DEFAULTS.lang,
    unix: str("unix", "", 40),
    snowflake: str("snowflake", "", 40),
    snippetStyle: isStyleLetter(src.snippetStyle) ? src.snippetStyle : DEFAULTS.snippetStyle,
    snippetLang: isSnippetLang(src.snippetLang) ? src.snippetLang : DEFAULTS.snippetLang,
  };
}

/** Values that only exist in a browser: the clock, this device's zone and the full zone list. */
interface Env {
  seedNow: number;
  deviceTz: string;
  zones: string[];
}

const HOUR = 3_600_000;

function shortTime(w: Wall): string {
  const hm = `${String(w.h).padStart(2, "0")}:${String(w.mi).padStart(2, "0")}`;
  return w.s ? `${hm}:${String(w.s).padStart(2, "0")}` : hm;
}

const QUICK_OFFSETS = [
  { label: "Now", ms: 0 },
  { label: "+15 min", ms: 15 * 60_000 },
  { label: "+1 hour", ms: HOUR },
  { label: "+1 day", ms: 24 * HOUR },
  { label: "+1 week", ms: 7 * 24 * HOUR },
] as const;

const UNIT_OPTIONS = [
  { value: String(60_000), label: "minutes" },
  { value: String(HOUR), label: "hours" },
  { value: String(24 * HOUR), label: "days" },
  { value: String(7 * 24 * HOUR), label: "weeks" },
];

const MODE_OPTIONS = [
  { value: "picker" as const, label: "Date & time" },
  { value: "unix" as const, label: "Unix time" },
  { value: "snowflake" as const, label: "Snowflake ID" },
];

const SNIPPET_LANGS = [
  { value: "js" as const, label: "JavaScript" },
  { value: "python" as const, label: "Python" },
  { value: "raw" as const, label: "Plain code" },
];

function ZoneSelect({
  label,
  value,
  onChange,
  env,
  hint,
}: {
  label: string;
  value: string;
  onChange: (tz: string) => void;
  env: Env | null;
  hint?: ReactNode;
}) {
  const device = env?.deviceTz;
  const commonIds = useMemo(() => new Set(COMMON_ZONES.map((z) => z.id)), []);
  const rest = useMemo(() => (env?.zones ?? []).filter((z) => z !== device && !commonIds.has(z)), [env, device, commonIds]);
  const missing = value && value !== device && !commonIds.has(value) && !rest.includes(value);
  return (
    <Select label={label} hint={hint} value={value} onChange={(e) => onChange(e.target.value)}>
      {device && (
        <optgroup label="This device">
          <option value={device}>{device} (this device)</option>
        </optgroup>
      )}
      {missing && <option value={value}>{value}</option>}
      <optgroup label="Common time zones">
        {COMMON_ZONES.filter((z) => z.id !== device).map((z) => (
          <option key={z.id} value={z.id}>
            {z.label} ({z.id})
          </option>
        ))}
      </optgroup>
      {rest.length > 0 && (
        <optgroup label="All other time zones">
          {rest.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </optgroup>
      )}
    </Select>
  );
}

function DetailRow({ label, children, testId }: { label: string; children: ReactNode; testId?: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="label-mono sm:w-28 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-fg" data-testid={testId}>
        {children}
      </dd>
    </div>
  );
}

export default function DiscordTimestampGenerator() {
  const [stored, setStored] = usePersistentState<Stored>("discord-timestamp-generator:v1", DEFAULTS);
  const s = useMemo(() => normalize(stored), [stored]);

  // Clock and device values are read after mount (never during render) and the clock then ticks every second.
  const [env, setEnv] = useState<Env | null>(null);
  const [now, setNow] = useState(0);
  const [offsetAmount, setOffsetAmount] = useState("2");
  const [offsetUnit, setOffsetUnit] = useState(String(HOUR));

  useEffect(() => {
    const first = setTimeout(() => {
      let deviceTz = "UTC";
      try {
        deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      } catch {
        /* keep UTC */
      }
      let zones: string[] = [];
      try {
        const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
        zones = supported ? supported("timeZone") : [];
      } catch {
        /* the common list still works */
      }
      const t = Date.now();
      setEnv({ seedNow: t, deviceTz, zones });
      setNow(t);
    }, 0);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
    };
  }, []);

  const ready = env !== null && now > 0;
  const deviceTz = env?.deviceTz ?? "UTC";
  const tz = isValidTimeZone(s.tz) ? s.tz : deviceTz;
  const viewerTz = isValidTimeZone(s.viewerTz) ? s.viewerTz : deviceTz;

  const seedDefault = useMemo(() => (env ? nextHour(env.seedNow, tz) : null), [env, tz]);
  const date = s.date ?? seedDefault?.date ?? "";
  const time = s.time ?? seedDefault?.time ?? "";

  const picker = useMemo(() => resolvePicker(date, time, tz, s.fold), [date, time, tz, s.fold]);
  const unixParse = useMemo(() => parseUnixInput(s.unix), [s.unix]);
  const snow = useMemo(() => decodeSnowflake(s.snowflake, ready ? now : Number.MAX_SAFE_INTEGER), [s.snowflake, ready, now]);

  const unix = activeUnix(s.mode, picker, unixParse, snow);
  const instantMs = unix === null ? null : unix * 1000;

  /* ------------------------------------------------------------- handlers */

  const patch = (p: Partial<Stored>) => setStored((prev) => ({ ...normalize(prev), ...p }));

  /** Edits to date, time or zone first lock in the default values so they stop following the clock. */
  const patchLocal = (p: Partial<Stored>) => patch({ date, time, ...p });

  const setFromInstant = (ms: number) => {
    const wall = wallParts(ms, tz);
    const res = resolveLocal(wall, tz);
    patch({
      mode: "picker",
      date: formatDateInput(wall),
      time: formatTimeInput(wall),
      fold: res.kind === "ambiguous" && ms >= res.later ? "later" : "earlier",
    });
  };

  const offsetMs = Number(offsetAmount) * Number(offsetUnit);
  const offsetValid = offsetAmount.trim() !== "" && Number.isFinite(offsetMs) && offsetMs >= 0 && offsetMs <= 3650 * 24 * HOUR;

  const reset = () => {
    const d = nextHour(Date.now(), tz);
    patch({ mode: "picker", date: d.date, time: d.time, fold: "earlier" });
  };

  /* ------------------------------------------------------ derived results */

  const rows = useMemo(
    () => (unix === null || !ready ? [] : STYLES.map((info) => ({ ...info, code: tagFor(unix, info.style), text: preview(unix, info.style, s.lang, viewerTz, now) }))),
    [unix, ready, s.lang, viewerTz, now],
  );
  const allCodes = rows.map((r) => r.code).join("\n");

  const world = useMemo(
    () => (unix === null || !ready ? [] : WORLD_CLOCK_ZONES.map((z) => ({ ...z, text: describeWorldClock(unix * 1000, z.id, s.lang) }))),
    [unix, ready, s.lang],
  );

  const snippet = unix === null ? "" : buildSnippet(s.snippetLang, unix, s.snippetStyle);
  const isPast = instantMs !== null && ready && instantMs < now - 1000;

  /* --------------------------------------------------------------- render */

  return (
    <ToolPanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs label="Input type" value={s.mode} onChange={(mode) => patch({ mode })} options={MODE_OPTIONS} />
        {s.mode === "picker" && (
          <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />} onClick={reset} disabled={!ready}>
            Reset to next hour
          </Button>
        )}
      </div>

      {s.mode === "picker" && (
        <div className="flex flex-col gap-4">
          <ToolGrid cols={3}>
            <Input
              label="Date"
              type="date"
              min="1970-01-01"
              max="9999-12-31"
              value={date}
              onChange={(e) => patchLocal({ date: e.target.value })}
            />
            <Input label="Time" type="time" step={1} value={time} onChange={(e) => patchLocal({ time: e.target.value })} />
            <ZoneSelect
              label="Time zone of this date and time"
              value={tz}
              env={env}
              onChange={(z) => patchLocal({ tz: z })}
              hint={instantMs !== null && ready ? `${describeOffset(instantMs, tz)} on this date` : undefined}
            />
          </ToolGrid>

          <div className="flex flex-col gap-2">
            <span className="label-mono">Countdown shortcuts: set the time to now plus</span>
            <ToolActions>
              {QUICK_OFFSETS.map((q) => (
                <Button key={q.label} variant="outline" size="sm" disabled={!ready} onClick={() => setFromInstant(Date.now() + q.ms)}>
                  {q.label}
                </Button>
              ))}
            </ToolActions>
            <div className="grid max-w-md grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
              <Input
                label="Or add a custom amount"
                type="number"
                inputMode="decimal"
                min={0}
                value={offsetAmount}
                onChange={(e) => setOffsetAmount(e.target.value)}
                error={!offsetValid && offsetAmount.trim() !== "" ? "Enter 0 or more (up to 10 years)." : undefined}
              />
              <Select aria-label="Unit for the custom amount" value={offsetUnit} onChange={(e) => setOffsetUnit(e.target.value)} options={UNIT_OPTIONS} />
              <Button variant="secondary" disabled={!ready || !offsetValid} onClick={() => setFromInstant(Date.now() + offsetMs)} className="mb-px h-11">
                Set
              </Button>
            </div>
          </div>

          {picker.kind === "invalid" && (
            <Alert variant="error" title="Check the date and time">
              {picker.message}
            </Alert>
          )}
          {picker.kind === "gap" && (
            <Alert variant="warning" title={`${shortTime(picker.wall)} does not exist in ${tz} on ${date}`}>
              The clocks skip {picker.gapMinutes} minutes that day, so that time never happens. The codes below use {shortTime(picker.shifted)} (
              {describeOffset(picker.ms, tz)}), which is {picker.gapMinutes} minutes later than the time you typed. Pick a time outside the skipped window if you
              meant something else.
            </Alert>
          )}
          {picker.kind === "ambiguous" && (
            <div className="flex flex-col gap-3">
              <Alert variant="warning" title={`${shortTime(picker.wall)} happens twice in ${tz} on ${date}`}>
                The clocks go back that day, so this reading appears on the clock two times, one hour apart in most zones. Choose which one you mean.
              </Alert>
              <Select
                label="Which occurrence?"
                value={s.fold}
                onChange={(e) => patchLocal({ fold: e.target.value === "later" ? "later" : "earlier" })}
                containerClassName="max-w-md"
                options={[
                  { value: "earlier", label: `First time (${describeOffset(picker.earlier, tz)})` },
                  { value: "later", label: `Second time (${describeOffset(picker.later, tz)})` },
                ]}
              />
            </div>
          )}
        </div>
      )}

      {s.mode === "unix" && (
        <div className="flex flex-col gap-3">
          <Input
            label="Unix timestamp"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="1794704400"
            value={s.unix}
            maxLength={40}
            onChange={(e) => patch({ unix: e.target.value })}
            error={unixParse.kind === "invalid" ? unixParse.message : undefined}
            hint="Seconds since 1 January 1970 UTC. Milliseconds (13 digits) and pasted codes such as <t:1794704400:R> are accepted."
          />
          <ToolActions>
            <Button variant="outline" size="sm" disabled={!ready} onClick={() => patch({ unix: String(Math.floor(Date.now() / 1000)) })}>
              Use the current time
            </Button>
            <Button variant="outline" size="sm" disabled={instantMs === null} onClick={() => instantMs !== null && setFromInstant(instantMs)} rightIcon={<ArrowUpRight className="h-3.5 w-3.5" aria-hidden />}>
              Edit in the date picker
            </Button>
          </ToolActions>
          {unixParse.kind === "ok" && unixParse.note && <Alert variant="info">{unixParse.note}</Alert>}
        </div>
      )}

      {s.mode === "snowflake" && (
        <div className="flex flex-col gap-3">
          <Input
            label="Discord ID (snowflake)"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="175928847299117063"
            value={s.snowflake}
            maxLength={40}
            onChange={(e) => patch({ snowflake: e.target.value })}
            error={snow.kind === "invalid" ? snow.message : undefined}
            hint="User, server, channel, message and role IDs all work. Enable Developer Mode in Discord, then right-click and choose Copy ID."
          />
          <ToolActions>
            <Button variant="outline" size="sm" onClick={() => patch({ snowflake: EXAMPLE_SNOWFLAKE })}>
              Try the example from Discord&apos;s developer docs
            </Button>
          </ToolActions>
          {snow.kind === "ok" && snow.notes.map((n) => <Alert key={n} variant="warning">{n}</Alert>)}
          {snow.kind === "ok" && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 px-3.5 py-3" data-testid="snowflake-result">
              <dl className="flex flex-col gap-2">
                <DetailRow label="Created (UTC)" testId="snow-utc">
                  {isoUtc(snow.ms)}
                </DetailRow>
                <DetailRow label="Selected zone" testId="snow-local">
                  {ready ? describeInstant(snow.ms, tz) : ""} <span className="text-muted">({tz})</span>
                </DetailRow>
                <DetailRow label="Unix seconds" testId="snow-unix">
                  {snow.unix}
                </DetailRow>
                <DetailRow label="Worker ID" testId="snow-worker">
                  {snow.worker}
                </DetailRow>
                <DetailRow label="Process ID" testId="snow-process">
                  {snow.process}
                </DetailRow>
                <DetailRow label="Increment" testId="snow-increment">
                  {snow.increment}
                </DetailRow>
              </dl>
              <div className="flex flex-col gap-1">
                <span className="label-mono">64 bits: timestamp (42) | worker (5) | process (5) | increment (12)</span>
                <p className="break-all font-mono text-xs text-fg-secondary" data-testid="snow-bits">
                  <span className="text-primary">{snow.bits.timestamp}</span> {snow.bits.worker} {snow.bits.process} {snow.bits.increment}
                </p>
              </div>
              <ToolActions>
                <Button variant="secondary" size="sm" onClick={() => setFromInstant(snow.unix * 1000)} rightIcon={<ArrowUpRight className="h-3.5 w-3.5" aria-hidden />}>
                  Edit in the date picker
                </Button>
                <CopyButton text={String(snow.unix)} label="Copy Unix seconds" size="sm" variant="secondary" />
              </ToolActions>
            </div>
          )}
        </div>
      )}

      {!ready && <p className="text-sm text-muted">Reading this device&apos;s clock and time zone…</p>}

      {ready && unix !== null && (
        <>
          {isPast && s.mode !== "snowflake" && (
            <Alert variant="info">
              This moment is in the past, so the relative style (R) reads “… ago”. For a countdown, pick a time in the future.
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative flex flex-col gap-1 overflow-hidden rounded-lg border border-primary/40 bg-primary-soft px-3.5 py-3">
              <span className="absolute inset-y-0 left-0 w-[3px] bg-accent-bright" aria-hidden />
              <span className="label-mono">Unix timestamp (seconds)</span>
              <div className="flex items-center justify-between gap-2">
                <output className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-primary" data-testid="unix-value">
                  {unix}
                </output>
                <CopyButton text={String(unix)} size="sm" variant="secondary" aria-label="Copy Unix timestamp" />
              </div>
              <span className="text-xs text-muted">{unix * 1000} ms</span>
            </div>
            <Stat label={unix * 1000 >= now ? "Countdown" : "Elapsed"} value={<span data-testid="countdown">{describeDelta(unix, now)}</span>} hint="Live, updates every second" />
          </div>

          <dl className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-3">
            <DetailRow label="Selected zone" testId="summary-local">
              {describeInstant(unix * 1000, tz)} <span className="text-muted">({tz})</span>
            </DetailRow>
            <DetailRow label="In UTC" testId="summary-utc">
              {isoUtc(unix * 1000)}
            </DetailRow>
          </dl>

          <ToolSection
            title="Timestamp codes"
            description="Copy a code and paste it into any Discord message. Every viewer sees it in their own time zone."
          >
            <ToolGrid>
              <ZoneSelect label="Preview as a viewer in" value={viewerTz} env={env} onChange={(z) => patch({ viewerTz: z })} />
              <Select label="Viewer's Discord language" value={s.lang} onChange={(e) => patch({ lang: e.target.value })} options={LOCALES.map((l) => ({ value: l.value, label: l.label }))} />
            </ToolGrid>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border-strong" data-testid="format-list">
              {rows.map((r) => (
                <li
                  key={r.style}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 bg-surface px-3 py-3 sm:grid-cols-[10rem_minmax(0,1.15fr)_minmax(0,1fr)_auto]"
                  data-testid={`row-${r.style}`}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" className="w-6 justify-center">
                      {r.style}
                    </Badge>
                    <span className="text-[13px] font-medium text-fg">{r.name}</span>
                  </div>
                  <CopyButton text={r.code} size="sm" variant="secondary" aria-label={`Copy ${r.code}`} className="sm:order-4" />
                  <code className="col-span-2 break-all rounded-md bg-surface-2 px-2 py-1 font-mono text-xs text-fg sm:order-2 sm:col-span-1" data-testid={`code-${r.style}`}>
                    {r.code}
                  </code>
                  <span className="col-span-2 text-sm text-fg-secondary sm:order-3 sm:col-span-1" data-testid={`preview-${r.style}`}>
                    {r.text}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted">
              Previews are approximate. Discord draws the real text itself, using each viewer&apos;s own language and time zone, so wording and punctuation can differ
              slightly. A code without a style letter, <span className="font-mono">{tagFor(unix)}</span>, is displayed like <span className="font-mono">f</span>.
            </p>
            <ToolActions>
              <CopyButton text={allCodes} label="Copy all seven codes" variant="primary" />
              <CopyButton text={tagFor(unix)} label="Copy code without style" variant="secondary" />
            </ToolActions>
          </ToolSection>

          <ToolSection title="The same moment around the world" description="What a viewer in each of these places sees on their clock.">
            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2" data-testid="world-clock">
              {world.map((w) => (
                <li key={w.id} className="flex items-baseline justify-between gap-3 border-b border-border py-1.5 text-sm">
                  <span className="font-medium text-fg">{w.label}</span>
                  <span className="text-right tabular-nums text-fg-secondary">{w.text}</span>
                </li>
              ))}
            </ul>
          </ToolSection>

          <ToolSection title="Code for a bot" description="Generate the same timestamp from a script. Both libraries also accept a plain string, which needs no library at all.">
            <div className="flex flex-wrap items-end gap-3">
              <Tabs label="Language" size="sm" value={s.snippetLang} onChange={(v) => patch({ snippetLang: v })} options={SNIPPET_LANGS} />
              <Select
                aria-label="Style used in the code"
                selectSize="sm"
                value={s.snippetStyle}
                onChange={(e) => patch({ snippetStyle: isStyleLetter(e.target.value) ? e.target.value : "R" })}
                options={STYLES.map((x) => ({ value: x.style, label: `${x.style} · ${x.name}` }))}
                containerClassName="w-56"
              />
            </div>
            <ResultBox label={SNIPPET_LANGS.find((l) => l.value === s.snippetLang)?.label ?? "Code"} value={snippet} mono rows={s.snippetLang === "raw" ? 2 : 9} />
          </ToolSection>
        </>
      )}

      {ready && unix === null && s.mode === "picker" && picker.kind === "empty" && (
        <Alert variant="info">Choose a date and a time to generate the timestamp codes.</Alert>
      )}
      {ready && unix === null && s.mode === "unix" && unixParse.kind === "empty" && (
        <Alert variant="info">Enter a Unix timestamp, or press “Use the current time”, to see all seven codes.</Alert>
      )}
      {ready && unix === null && s.mode === "snowflake" && snow.kind === "empty" && (
        <Alert variant="info">Paste a Discord ID to see when it was created, then turn that moment into timestamp codes.</Alert>
      )}
    </ToolPanel>
  );
}
