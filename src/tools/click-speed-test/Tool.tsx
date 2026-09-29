"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Download, RotateCcw } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Input, Select, Stat, StatGrid, Tabs, ToolActions, ToolGrid, ToolPanel } from "@/components/ui";
import { cn, downloadText } from "@/lib/utils";
import {
  DEFAULT_SETTINGS,
  FAST_GAP_MS,
  MAX_CLICKS,
  MAX_CUSTOM_SECONDS,
  MIN_CUSTOM_SECONDS,
  PRESET_SECONDS,
  RESTART_COOLDOWN_MS,
  bestKey,
  buildCsv,
  buildInsight,
  buildReport,
  clickSource,
  formatTally,
  tallySources,
  buttonCounts,
  buttonModeLabel,
  durationSeconds,
  formatCps,
  formatMs,
  formatSeconds,
  liveCps,
  paceLabel,
  runningAverage,
  sanitizeBests,
  sanitizeSettings,
  summarize,
  type Bests,
  type ButtonMode,
  type InputMode,
  type Settings,
  type Summary,
} from "./logic";

type Phase = "idle" | "running" | "done";

const EMPTY_BESTS: Bests = {};

const LENGTH_OPTIONS = [...PRESET_SECONDS.map((s) => ({ value: String(s), label: `${s} s` })), { value: "custom", label: "Custom" }];
const INPUT_OPTIONS: { value: InputMode; label: string }[] = [
  { value: "pointer", label: "Mouse or touch" },
  { value: "space", label: "Spacebar" },
];
const BUTTON_OPTIONS: { value: ButtonMode; label: string }[] = [
  { value: "left", label: "Left button" },
  { value: "right", label: "Right button" },
  { value: "any", label: "Any button" },
];

/** The pointer/keyboard event clock is the same clock as performance.now(); fall back if a browser disagrees. */
function eventTime(raw: number): number {
  const now = performance.now();
  return Math.abs(raw - now) < 60_000 ? raw : now;
}

export default function ClickSpeedTest() {
  const [settings, setSettings] = usePersistentState<Settings>("click-speed-test:settings", DEFAULT_SETTINGS, {
    storage: "local",
    deserialize: (raw) => sanitizeSettings(JSON.parse(raw)),
  });
  const [bests, setBests, { clear: clearBests }] = usePersistentState<Bests>("click-speed-test:bests", EMPTY_BESTS, {
    storage: "local",
    deserialize: (raw) => sanitizeBests(JSON.parse(raw)),
  });

  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [liveRate, setLiveRate] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tally, setTally] = useState<{ source: string; count: number }[]>([]);
  const [newBest, setNewBest] = useState(false);
  const [focused, setFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const seconds = durationSeconds(settings);
  const durationMs = (seconds ?? 0) * 1000;
  const customError =
    settings.length === "custom" && seconds === null ? `Enter a whole number of seconds from ${MIN_CUSTOM_SECONDS} to ${MAX_CUSTOM_SECONDS}.` : undefined;

  // Timing state lives in refs so pointer events never wait for a React render.
  const padRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const timesRef = useRef<number[]>([]);
  const sourcesRef = useRef<string[]>([]);
  const startRef = useRef(0);
  const doneAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  const bestsRef = useRef(bests);
  const durationMsRef = useRef(durationMs);

  useEffect(() => {
    settingsRef.current = settings;
    bestsRef.current = bests;
    durationMsRef.current = durationMs;
  }, [settings, bests, durationMs]);

  const stopTimers = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    rafRef.current = null;
    timeoutRef.current = null;
  }, []);

  useEffect(() => stopTimers, [stopTimers]);

  const reset = useCallback(() => {
    stopTimers();
    phaseRef.current = "idle";
    timesRef.current = [];
    sourcesRef.current = [];
    setPhase("idle");
    setCount(0);
    setElapsed(0);
    setLiveRate(0);
    setSummary(null);
    setTally([]);
    setNewBest(false);
    setAnnouncement("");
  }, [stopTimers]);

  const finish = useCallback(() => {
    if (phaseRef.current !== "running") return;
    stopTimers();
    phaseRef.current = "done";
    doneAtRef.current = performance.now();
    const ms = durationMsRef.current;
    const result = summarize(timesRef.current, ms);

    const key = bestKey(ms / 1000, settingsRef.current.input);
    const previous = bestsRef.current[key];
    const isBest = result.clicks > 0 && (!previous || result.cps > previous.cps);
    if (isBest) {
      setBests((prev) => ({ ...prev, [key]: { cps: result.cps, clicks: result.clicks, date: new Date().toLocaleDateString("en-CA") } }));
    }

    setSummary(result);
    setTally(tallySources(sourcesRef.current.slice(0, result.clicks)));
    setNewBest(isBest);
    setPhase("done");
    setCount(result.clicks);
    setElapsed(ms);
    setLiveRate(0);
    setAnnouncement(`Time is up. ${result.clicks} clicks, ${formatCps(result.cps)} clicks per second.`);
  }, [setBests, stopTimers]);

  /** Every counted click, from pointer or keyboard, goes through here. `raw` is the event's own timestamp. */
  const registerClick = useCallback(
    (raw: number, source = "left") => {
      const ts = eventTime(raw);
      if (phaseRef.current === "done") {
        // The pad only restarts after a short pause, so the last frantic clicks cannot wipe the result.
        if (performance.now() - doneAtRef.current >= RESTART_COOLDOWN_MS) reset();
        return;
      }
      const ms = durationMsRef.current;
      if (ms <= 0) return;

      if (phaseRef.current === "idle") {
        startRef.current = ts;
        timesRef.current = [0];
        sourcesRef.current = [source];
        phaseRef.current = "running";
        setPhase("running");
        setCount(1);
        setElapsed(0);
        setAnnouncement("Timer started.");
        timeoutRef.current = window.setTimeout(finish, Math.max(0, ms - (performance.now() - ts)));
        const tick = () => {
          if (phaseRef.current !== "running") return;
          const el = Math.min(durationMsRef.current, performance.now() - startRef.current);
          setElapsed(el);
          setLiveRate(liveCps(timesRef.current, el));
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const rel = Math.max(0, ts - startRef.current);
      if (rel >= ms) {
        finish();
        return;
      }
      if (timesRef.current.length >= MAX_CLICKS) return;
      timesRef.current.push(rel);
      sourcesRef.current.push(source);
      setCount(timesRef.current.length);
    },
    [finish, reset],
  );

  const update = (patch: Partial<Settings>) => {
    reset();
    setSettings((s) => ({ ...s, ...patch }));
  };

  const focusPad = () => padRef.current?.focus({ preventScroll: true });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    focusPad();
    if (seconds === null) return;
    if (phaseRef.current === "done") {
      registerClick(e.timeStamp);
      return;
    }
    if (settings.input !== "pointer") return;
    if (!buttonCounts(settings.button, e.button, e.pointerType)) return;
    registerClick(e.timeStamp, clickSource(e.button, e.pointerType));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      reset();
      return;
    }
    const isSpace = e.key === " " || e.code === "Space";
    if (isSpace) e.preventDefault(); // stop the page from scrolling while the pad has focus
    if (seconds === null) return;
    if (isSpace && settings.input === "space") {
      if (!e.repeat) registerClick(e.timeStamp, "space");
    } else if ((isSpace || e.key === "Enter") && phaseRef.current === "done") {
      if (!e.repeat) registerClick(e.timeStamp);
    }
  };

  const key = seconds === null ? "" : bestKey(seconds, settings.input);
  const best = bests[key];
  const insight = useMemo(() => (summary ? buildInsight(summary) : null), [summary]);
  const hasBests = Object.keys(bests).length > 0;

  const timeLeftMs = phase === "idle" ? durationMs : Math.max(0, durationMs - elapsed);
  const progress = phase === "done" ? 1 : durationMs > 0 ? Math.min(1, elapsed / durationMs) : 0;
  const averageText = phase === "done" && summary ? formatCps(summary.cps) : phase === "running" ? formatCps(runningAverage(count, elapsed)) : "–";
  const inputWord = settings.input === "space" ? "Space" : buttonModeLabel(settings.button);

  const padLabel =
    seconds === null
      ? "Click pad unavailable. Enter a valid custom length first."
      : phase === "running"
        ? "Test running."
        : phase === "done" && summary
          ? `Test finished: ${formatCps(summary.cps)} clicks per second. Activate to reset the pad.`
          : settings.input === "space"
            ? `Click pad. Focus it, then press Space to start a ${seconds} second test.`
            : `Click pad. Press the ${inputWord} on it to start a ${seconds} second test.`;

  const maxRate = summary ? Math.max(1, ...summary.buckets.map((b) => b.rate)) : 1;

  return (
    <ToolPanel>
      <ToolGrid className="items-start">
        <div className="flex flex-col gap-2">
          <span className="label-mono">Test length</span>
          <Tabs label="Test length" size="sm" value={settings.length} onChange={(v) => update({ length: v })} options={LENGTH_OPTIONS} />
          {settings.length === "custom" && (
            <Input
              label="Custom length (seconds)"
              type="number"
              inputMode="numeric"
              min={MIN_CUSTOM_SECONDS}
              max={MAX_CUSTOM_SECONDS}
              step={1}
              value={settings.customText}
              onChange={(e) => update({ customText: e.target.value.slice(0, 4) })}
              error={customError}
              inputSize="sm"
              containerClassName="max-w-[12rem]"
            />
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="label-mono">Input</span>
            <Tabs label="Input" size="sm" value={settings.input} onChange={(v) => update({ input: v })} options={INPUT_OPTIONS} />
          </div>
          <Select
            label="Mouse button counted"
            selectSize="sm"
            value={settings.button}
            onChange={(e) => update({ button: e.target.value as ButtonMode })}
            options={BUTTON_OPTIONS}
            disabled={settings.input === "space"}
            hint={settings.input === "space" ? "Not used in spacebar mode." : "Touch taps count as left clicks."}
          />
        </div>
      </ToolGrid>

      {/* The pad has a fixed height in every state, so nothing below it ever moves. */}
      <div
        ref={padRef}
        role="button"
        tabIndex={0}
        aria-label={padLabel}
        aria-disabled={seconds === null}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onMouseDown={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        data-phase={phase}
        className={cn(
          "relative flex h-60 w-full cursor-pointer touch-none flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 px-4 pb-3 text-center select-none sm:h-72",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/30",
          seconds === null && "cursor-not-allowed opacity-60",
          phase === "idle" && "border-dashed border-border-strong bg-surface-2 hover:bg-surface-3",
          phase === "running" && "border-primary bg-primary-soft",
          phase === "done" && "border-border-strong bg-surface-2",
        )}
      >
        {seconds === null ? (
          <>
            <span className="label-mono">Pad unavailable</span>
            <span className="text-lg font-semibold text-fg">Fix the custom length above</span>
          </>
        ) : phase === "idle" ? (
          <>
            <span className="label-mono">
              Ready · {seconds} s · {inputWord}
            </span>
            <span className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              {settings.input === "space" ? "Press Space to start" : "Click to start"}
            </span>
            <span className="max-w-xs text-sm text-muted">
              {settings.input === "space"
                ? focused
                  ? "The pad has keyboard focus. Your first press starts the timer."
                  : "Select the pad once so it gets keyboard focus, then press Space."
                : "The timer starts on your first click, and that click counts."}
            </span>
          </>
        ) : phase === "running" ? (
          <>
            <span className="label-mono">Keep going</span>
            <span aria-hidden className="font-mono text-7xl leading-none font-semibold tracking-tight text-primary tabular-nums sm:text-8xl">
              {count}
            </span>
            <span className="text-sm text-fg-secondary">clicks</span>
          </>
        ) : (
          <>
            <span className="label-mono">Time&apos;s up · {seconds} s</span>
            <span className="font-mono text-5xl leading-none font-semibold tracking-tight text-fg tabular-nums sm:text-6xl">
              {summary ? formatCps(summary.cps) : "0.00"}
              <span className="ml-2 text-xl font-medium text-muted">CPS</span>
            </span>
            <span className="text-sm text-fg-secondary">
              {summary?.clicks ?? 0} clicks · {summary ? paceLabel(summary.cps) : ""}
            </span>
            {settings.input === "pointer" && settings.button === "any" && tally.length > 0 && (
              <span className="font-mono text-xs text-muted">{formatTally(tally)}</span>
            )}
            <span className="flex h-6 items-center">{newBest && <Badge variant="primary">New personal best</Badge>}</span>
          </>
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-border">
          <div className="h-full origin-left bg-accent-bright" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <p className="-mt-2 text-xs text-muted">
        Clicks are timed with each event&apos;s own timestamp, so screen lag does not change your score. Press Esc while the pad has focus to reset. After a
        test the pad ignores clicks for a moment so your last clicks cannot restart it.
      </p>

      <ToolActions>
        <Button variant={phase === "done" ? "accent" : "secondary"} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={reset} disabled={phase === "idle"}>
          {phase === "done" ? "Try again" : "Reset"}
        </Button>
        <CopyButton
          variant="outline"
          label="Copy result"
          text={summary ? buildReport(summary, settings.input, settings.button, new Date().toLocaleDateString("en-CA"), tally) : ""}
          disabled={!summary}
        />
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" aria-hidden />}
          disabled={!summary}
          onClick={() => downloadText(buildCsv(timesRef.current, sourcesRef.current), "click-speed-test-log.csv", "text/csv;charset=utf-8")}
        >
          Download click log
        </Button>
        <Button variant="ghost" className="sm:ml-auto" onClick={clearBests} disabled={!hasBests}>
          Clear saved bests
        </Button>
      </ToolActions>

      <StatGrid className="sm:grid-cols-4">
        <Stat label="Time left" value={formatSeconds(timeLeftMs)} />
        <Stat label="Clicks" value={count} />
        <Stat label="Live CPS" value={phase === "running" ? formatCps(liveRate, 1) : "–"} hint="last second" />
        <Stat
          emphasis
          label={phase === "done" ? "Final CPS" : "Average CPS"}
          value={averageText}
          hint={phase === "done" ? "clicks ÷ seconds" : "so far"}
        />
        <Stat label="Peak 1 s" value={phase === "done" && summary ? formatCps(summary.peak, 1) : "–"} hint="best 1-second window" />
        <Stat label="Best" value={best ? formatCps(best.cps) : "–"} hint={seconds === null ? "" : `${seconds} s · ${settings.input === "space" ? "spacebar" : "mouse or touch"}`} />
        <Stat label="Fastest gap" value={phase === "done" && summary ? formatMs(summary.fastestGapMs) : "–"} hint="between two clicks" />
        <Stat label="Fast gaps" value={phase === "done" && summary ? summary.fastGaps : "–"} hint={`under ${FAST_GAP_MS} ms`} />
      </StatGrid>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="label-mono">Click rhythm</span>
          <span className="font-mono text-[11px] whitespace-nowrap text-muted tabular-nums">{summary ? `tallest bar ${formatCps(maxRate, 1)} CPS` : "bars show CPS"}</span>
        </div>
        <div
          role="img"
          aria-label={
            summary
              ? `Bar chart of clicks per second across the ${summary.durationMs / 1000} second test. The tallest bar is ${formatCps(maxRate, 1)} clicks per second.`
              : "Chart of clicks per second over time. It fills in after a test."
          }
          className="relative flex h-28 items-end gap-px rounded-lg border border-border bg-surface-2 p-2"
        >
          {summary ? (
            summary.buckets.map((b) => (
              <div
                key={b.start}
                className="min-w-px flex-1 rounded-t-sm bg-primary"
                style={{ height: `${b.rate > 0 ? Math.max(3, (b.rate / maxRate) * 100) : 1}%`, opacity: b.rate > 0 ? 1 : 0.3 }}
                title={`${(b.start / 1000).toFixed(2)}–${((b.start + b.width) / 1000).toFixed(2)} s: ${b.clicks} clicks (${formatCps(b.rate, 1)} CPS)`}
              />
            ))
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-muted">
              Your click rhythm appears here after the test.
            </span>
          )}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[11px] text-muted tabular-nums">
          <span>0 s</span>
          <span>{seconds === null ? "" : `${seconds} s`}</span>
        </div>
      </div>

      <div>
        <span className="label-mono" title="Saved in this browser only">
          Personal bests · {settings.input === "space" ? "spacebar" : "mouse or touch"}
        </span>
        <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PRESET_SECONDS.map((s) => {
            const b = bests[bestKey(s, settings.input)];
            return (
              <div
                key={s}
                className={cn("rounded-lg border bg-surface-2 px-2.5 py-2 text-center", seconds === s ? "border-primary/50" : "border-border")}
                title={b ? `${b.clicks} clicks${b.date ? ` on ${b.date}` : ""}` : "No score yet"}
              >
                <div className="label-mono">{s} s</div>
                <div className="font-mono text-base font-semibold text-fg tabular-nums">{b ? formatCps(b.cps) : "–"}</div>
              </div>
            );
          })}
        </div>
      </div>

      <Alert
        variant={insight ? insight.variant : "info"}
        title={insight ? insight.title : "Your result appears here"}
        className="min-h-[10rem] sm:min-h-[5.75rem]"
      >
        {insight
          ? insight.body
          : "Finish a test to see your pace, your fastest one-second burst and a warning if any clicks came suspiciously close together."}
      </Alert>
    </ToolPanel>
  );
}
