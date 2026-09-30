"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { RotateCcw } from "lucide-react";
import { Badge, Button, Stat, StatGrid, ToolSection } from "@/components/ui";
import { cn } from "@/lib/utils";
import { EMPTY_POLL, PollingTracker, describePolling, type PollSnapshot } from "./logic";

const noopSubscribe = () => () => {};

/** Only ever called as a useSyncExternalStore snapshot, never while rendering on the server. */
const supportsRawUpdate = () => "onpointerrawupdate" in window;
const serverSupport = () => false;

/**
 * Polling-rate estimate. It needs the pointerrawupdate event (Chromium browsers
 * such as Chrome and Edge, in secure contexts). Where the browser lacks it, the
 * whole panel is left out rather than showing a number that would be wrong.
 */
export function PollingPanel({ onChange }: { onChange: (snapshot: PollSnapshot | null) => void }) {
  const supported = useSyncExternalStore(noopSubscribe, supportsRawUpdate, serverSupport);
  if (!supported) return null;
  return <PollingBox onChange={onChange} />;
}

function PollingBox({ onChange }: { onChange: (snapshot: PollSnapshot | null) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [tracker] = useState(() => new PollingTracker());
  const [snap, setSnap] = useState<PollSnapshot>(EMPTY_POLL);
  const [inside, setInside] = useState(false);
  const timerRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const flush = () => {
      timerRef.current = null;
      const s = tracker.snapshot();
      setSnap(s);
      onChangeRef.current(s.bestHz > 0 ? s : null);
    };

    const onRaw = (event: Event) => {
      const e = event as PointerEvent;
      if (e.pointerType !== "mouse") return;
      // pointerrawupdate is not coalesced much, but getCoalescedEvents() returns every
      // sample the browser merged, each with its own timestamp, when there is more than one.
      const merged = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      if (merged.length > 1) for (const c of merged) tracker.push(c.timeStamp);
      else tracker.push(e.timeStamp);
      if (timerRef.current === null) timerRef.current = window.setTimeout(flush, 120);
    };

    box.addEventListener("pointerrawupdate", onRaw);
    return () => {
      box.removeEventListener("pointerrawupdate", onRaw);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [tracker]);

  const reset = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    tracker.reset();
    setSnap(EMPTY_POLL);
    onChangeRef.current(null);
  };

  const described = describePolling(snap);

  return (
    <ToolSection
      title={
        <span className="flex flex-wrap items-center gap-2">
          Polling rate estimate
          <Badge variant="outline">Estimate · works in Chrome and Edge</Badge>
        </span>
      }
      description="Polling rate is how many times per second the mouse reports its position. Move the pointer in fast, continuous circles inside the box for two or three seconds."
    >
      <div
        ref={boxRef}
        onPointerEnter={(e) => e.pointerType === "mouse" && setInside(true)}
        onPointerLeave={() => setInside(false)}
        data-testid="polling-box"
        className={cn(
          "flex h-36 flex-col items-center justify-center gap-1 rounded-xl border-2 px-4 text-center select-none",
          inside ? "border-primary bg-primary-soft" : "border-dashed border-border-strong bg-surface-2",
        )}
      >
        {described ? (
          <>
            <span className="label-mono">Highest sustained rate</span>
            <span data-testid="polling-headline" className="font-mono text-4xl leading-none font-semibold tracking-tight text-fg tabular-nums">
              {described.headline}
            </span>
            <span className="max-w-md text-xs text-muted">{described.detail}</span>
          </>
        ) : (
          <>
            <span className="label-mono">{inside ? "Keep moving" : "Measurement box"}</span>
            <span className="text-base font-medium text-fg">Circle the pointer quickly in here</span>
            <span className="max-w-md text-xs text-muted">Slow movement reads low, because a mouse only reports while it moves.</span>
          </>
        )}
      </div>

      <StatGrid className="sm:grid-cols-3 lg:grid-cols-3">
        <Stat label="Updates counted" value={snap.events.toLocaleString("en-US")} />
        <Stat label="Usable runs" value={snap.runs} hint="0.3 s or longer" />
        <Stat label="Latest run" value={snap.latestHz > 0 ? `${Math.round(snap.latestHz).toLocaleString("en-US")} Hz` : "–"} />
      </StatGrid>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={reset} disabled={snap.events === 0}>
          Reset estimate
        </Button>
        <span className="text-xs text-muted">Readings are capped at 8,000 Hz and use the highest run, so a low reading means the test needs faster movement.</span>
      </div>
    </ToolSection>
  );
}
