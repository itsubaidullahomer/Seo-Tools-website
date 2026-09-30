"use client";

import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { Download, RotateCcw } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Button, CopyButton, Slider, Stat, StatGrid, ToolActions, ToolPanel, ToolSection, Toggle } from "@/components/ui";
import { cn, downloadText } from "@/lib/utils";
import { MouseDiagram, type PartState } from "./MouseDiagram";
import { PollingPanel } from "./PollingPanel";
import {
  BUTTON_IDS,
  BUTTON_INFO,
  DEFAULT_SETTINGS,
  FLIP_MS,
  MAX_THRESHOLD_MS,
  MIN_THRESHOLD_MS,
  buildLogText,
  buildReport,
  buildVerdict,
  clampThreshold,
  createSession,
  deltaUnit,
  describeEntry,
  formatClock,
  formatMs,
  sanitizeSettings,
  sessionReducer,
  summarizeButtons,
  totalsOf,
  wheelDirection,
  type ButtonId,
  type PollSnapshot,
  type Settings,
  type WheelDir,
} from "./logic";

const INITIAL_SESSION = createSession();
const noopSubscribe = () => () => {};

function dirLabel(dir: WheelDir | null): string {
  return dir ? dir.charAt(0).toUpperCase() + dir.slice(1) : "–";
}

export default function MouseTest() {
  const [settings, setSettings] = usePersistentState<Settings>("mouse-test:settings", DEFAULT_SETTINGS, {
    storage: "local",
    deserialize: (raw) => sanitizeSettings(JSON.parse(raw)),
  });
  const [session, dispatch] = useReducer(sessionReducer, INITIAL_SESSION);
  const [flash, setFlash] = useState<WheelDir | null>(null);
  const [inside, setInside] = useState(false);
  const [touchSeen, setTouchSeen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [poll, setPoll] = useState<PollSnapshot | null>(null);

  // Date for the report. Read through useSyncExternalStore so it never runs on the server.
  const today = useSyncExternalStore(
    noopSubscribe,
    () => new Date().toLocaleDateString("en-CA"),
    () => "",
  );

  const padRef = useRef<HTMLDivElement>(null);
  const coordRef = useRef<HTMLSpanElement>(null);
  const heldRef = useRef<Set<number>>(new Set());
  const pointerKindRef = useRef("mouse");
  const captureRef = useRef(settings.captureScroll);
  const flashTimerRef = useRef<number | null>(null);

  useEffect(() => {
    captureRef.current = settings.captureScroll;
  }, [settings.captureScroll]);

  // Native listeners: the wheel listener must be non-passive to be allowed to call preventDefault,
  // and mouseup must be heard even when the button is released outside the test area.
  useEffect(() => {
    const pad = padRef.current;
    const held = heldRef.current;

    const onWheel = (e: WheelEvent) => {
      if (captureRef.current) e.preventDefault();
      const dir = wheelDirection(e.deltaX, e.deltaY);
      if (!dir) return;
      dispatch({ type: "wheel", ts: e.timeStamp, dx: e.deltaX, dy: e.deltaY, mode: e.deltaMode });
      setFlash(dir);
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = window.setTimeout(() => setFlash(null), 220);
    };
    const onUp = (e: MouseEvent) => {
      if (!held.has(e.button)) return;
      e.preventDefault(); // stops the back and forward buttons navigating away on release
      held.delete(e.button);
      dispatch({ type: "up", button: e.button, ts: e.timeStamp });
    };
    const onBlur = () => {
      held.clear();
      dispatch({ type: "release-all" });
    };

    pad?.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      pad?.removeEventListener("wheel", onWheel);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onBlur);
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  const threshold = settings.threshold;
  const summaries = useMemo(() => summarizeButtons(session, threshold), [session, threshold]);
  const totals = useMemo(() => totalsOf(summaries), [summaries]);
  const verdict = useMemo(() => buildVerdict(summaries, threshold), [summaries, threshold]);
  const w = session.wheel;

  const partState = (id: ButtonId): PartState => (summaries[id].down ? "down" : summaries[id].tested ? "tested" : "idle");
  const states = { 0: partState(0), 1: partState(1), 2: partState(2), 3: partState(3), 4: partState(4) } as Record<ButtonId, PartState>;

  const diagramLabel = (() => {
    const held = summaries.filter((s) => s.down).map((s) => s.name);
    const tested = summaries.filter((s) => s.tested).map((s) => s.name);
    return `Mouse diagram. ${held.length ? `Held now: ${held.join(", ")}.` : "No button held."} ${tested.length ? `Registered so far: ${tested.join(", ")}.` : "No button registered yet."}`;
  })();

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointerKindRef.current = e.pointerType;
    if (e.pointerType !== "mouse") setTouchSeen(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointerKindRef.current = e.pointerType;
    const el = coordRef.current;
    if (!el || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    el.textContent = `x ${Math.round(e.clientX - rect.left)} · y ${Math.round(e.clientY - rect.top)}`;
  };

  const reset = () => {
    heldRef.current.clear();
    dispatch({ type: "reset" });
    setFlash(null);
    setAnnouncement("Test reset.");
  };

  const report = buildReport(session, threshold, poll, today);
  const hasEvents = session.log.length > 0;
  const log = [...session.log].reverse();
  const lastDelta = w.last;
  const lastHint = lastDelta
    ? w.lastDir === "left" || w.lastDir === "right"
      ? `Δx ${lastDelta.dx} ${deltaUnit(lastDelta.mode)}`
      : `Δy ${lastDelta.dy} ${deltaUnit(lastDelta.mode)}`
    : "direction of the wheel";

  return (
    <ToolPanel>
      {/* The test area has a fixed height in every state, so nothing below it ever moves. */}
      <div
        ref={padRef}
        role="group"
        aria-label="Mouse test area"
        data-testid="mouse-pad"
        onPointerEnter={(e) => e.pointerType === "mouse" && setInside(true)}
        onPointerLeave={() => setInside(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onMouseDown={(e) => {
          e.preventDefault(); // also stops middle-click autoscroll and text selection
          if (pointerKindRef.current !== "mouse") return; // ignore the mouse events browsers emulate after a tap
          heldRef.current.add(e.button);
          dispatch({ type: "down", button: e.button, ts: e.timeStamp });
          setAnnouncement(e.button in BUTTON_INFO ? `${BUTTON_INFO[e.button as ButtonId].name} button pressed.` : `Extra button ${e.button} pressed.`);
        }}
        onMouseUp={(e) => e.preventDefault()}
        onAuxClick={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onDoubleClick={(e) => {
          e.preventDefault();
          if (pointerKindRef.current === "mouse") dispatch({ type: "dblclick", ts: e.timeStamp });
        }}
        className={cn(
          "relative flex h-72 w-full flex-col items-center overflow-hidden rounded-xl border-2 px-3 pt-8 pb-2.5 select-none",
          inside ? "border-primary bg-primary-soft" : "border-dashed border-border-strong bg-surface-2",
          settings.captureScroll && "overscroll-contain",
        )}
      >
        <span
          className={cn(
            "absolute top-2.5 left-3 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase",
            inside ? "text-primary" : "text-muted",
          )}
        >
          <span aria-hidden className={cn("h-2 w-2 rounded-full", inside ? "bg-accent-bright" : "bg-border-strong")} />
          {inside ? "Listening" : "Move the pointer in"}
        </span>
        <span ref={coordRef} aria-hidden className="absolute top-2.5 right-3 font-mono text-[11px] text-muted tabular-nums" />
        <div className="flex min-h-0 w-full flex-1 justify-center">
          <MouseDiagram state={states} flash={flash} scrolled={{ up: w.up > 0, down: w.down > 0 }} label={diagramLabel} className="h-full w-auto max-w-full" />
        </div>
        <span className="mt-1 shrink-0 text-center text-xs text-muted">
          {touchSeen
            ? "Touch and pen input is ignored here. Use a mouse or trackpad."
            : "Press each button, scroll the wheel and double-click. Orange is held now, green is registered."}
        </span>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <ToolActions>
        <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={reset} disabled={!hasEvents}>
          Reset test
        </Button>
        <CopyButton variant="outline" label="Copy report" text={report} disabled={!hasEvents} />
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" aria-hidden />}
          disabled={!hasEvents}
          onClick={() => downloadText(`${report}\n\nEvent log\n${buildLogText(session, threshold)}\n`, "mouse-test-report.txt")}
        >
          Download report
        </Button>
        <Toggle
          className="sm:ml-auto"
          checked={settings.captureScroll}
          onChange={(v) => setSettings((s) => ({ ...s, captureScroll: v }))}
          label="Keep the page still while scrolling in the box"
        />
      </ToolActions>

      <p className="-mt-2 text-xs text-muted">
        This test needs a mouse or trackpad; phone taps are not counted. While the pointer is over the box, the right-click menu, middle-click scroll mode and
        the back and forward buttons are blocked so they cannot interrupt the test. Nothing is blocked outside the box.
      </p>

      <StatGrid className="sm:grid-cols-5 lg:grid-cols-5">
        {BUTTON_IDS.map((id) => {
          const s = summaries[id];
          return (
            <Stat
              key={id}
              className={id === 4 ? "col-span-2 sm:col-span-1" : undefined}
              emphasis={s.down}
              label={`${s.name} button`}
              value={s.presses}
              hint={s.down ? "Held now" : s.tested ? "Registered" : "Not tested yet"}
            />
          );
        })}
      </StatGrid>

      <StatGrid>
        <Stat label="Scroll up" value={w.up} hint="wheel steps" />
        <Stat label="Scroll down" value={w.down} hint="wheel steps" />
        <Stat label="Last scroll" value={dirLabel(w.lastDir)} hint={lastHint} />
        <Stat label="Direction flips" value={w.flips} hint={`reversal within ${FLIP_MS} ms`} />
      </StatGrid>

      <ToolSection
        title="Double-click detector"
        description="Flags two presses of the same button that arrive closer together than the limit. Measured from mouse-down to mouse-down."
      >
        <Slider
          label="Flag presses closer than (ms)"
          value={threshold}
          min={MIN_THRESHOLD_MS}
          max={MAX_THRESHOLD_MS}
          step={5}
          onChange={(v) => setSettings((s) => ({ ...s, threshold: clampThreshold(v) }))}
        />
        <Alert variant={verdict.variant} title={verdict.title} className="min-h-[8.5rem] sm:min-h-[6rem]">
          {verdict.body}
        </Alert>
        <StatGrid>
          <Stat label="Presses" value={totals.presses} hint={`${totals.tested} of 5 buttons`} />
          <Stat emphasis={totals.flagged > 0} label="Flagged presses" value={totals.flagged} hint={`under ${threshold} ms`} />
          <Stat label="Closest pair" value={totals.fastestGap === null ? "–" : formatMs(totals.fastestGap)} hint="same button" />
          <Stat label="Browser double-clicks" value={session.dblclicks} hint="system double-click rule" />
        </StatGrid>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[30rem] text-left text-xs">
            <caption className="sr-only">Timing for each mouse button</caption>
            <thead className="bg-surface-2">
              <tr>
                {["Button", "Presses", "Closest repeat", "Flagged", "Shortest hold"].map((h) => (
                  <th key={h} scope="col" className="label-mono px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summaries.map((s) => (
                <tr key={s.id} data-testid={`row-${s.id}`}>
                  <th scope="row" className="px-3 py-2 font-medium text-fg">
                    {s.name}
                  </th>
                  <td className="px-3 py-2 font-mono text-fg-secondary tabular-nums">{s.presses}</td>
                  <td className="px-3 py-2 font-mono text-fg-secondary tabular-nums">{formatMs(s.fastestGap)}</td>
                  <td className={cn("px-3 py-2 font-mono tabular-nums", s.flagged > 0 ? "font-semibold text-danger" : "text-fg-secondary")}>{s.flagged}</td>
                  <td className="px-3 py-2 font-mono text-fg-secondary tabular-nums">{formatMs(s.minHold)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ToolSection>

      <ToolSection title="Event log" description="Newest first. Flagged lines are shown in red. Mouse movement is not logged.">
        <div
          role="log"
          aria-live="off"
          aria-label="Mouse event log"
          className="scroll-thin h-48 overflow-y-auto rounded-lg border border-border bg-surface-2 p-2 font-mono text-xs"
        >
          {log.length === 0 ? (
            <p className="p-1 text-muted">Presses, releases and wheel steps appear here with their timing.</p>
          ) : (
            <ol className="flex flex-col gap-0.5">
              {log.map((entry) => {
                const d = describeEntry(entry, threshold);
                return (
                  <li key={entry.id} className="flex gap-3">
                    <span className="w-20 shrink-0 text-muted tabular-nums">{formatClock(entry.t)}</span>
                    <span className={cn("min-w-0", d.flagged ? "font-semibold text-danger" : "text-fg")}>{d.text}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </ToolSection>

      <PollingPanel onChange={setPoll} />
    </ToolPanel>
  );
}
