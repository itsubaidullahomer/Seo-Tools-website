"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Download, Maximize2, RotateCcw, Zap } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, Checkbox, CopyButton, Input, Select, Stat, StatGrid, ToolActions, ToolGrid, ToolPanel, ToolSection } from "@/components/ui";
import { cn, downloadText, formatNumber } from "@/lib/utils";
import { FlashOverlay, TestOverlay, type FlashEnd, type FlashMode } from "./Overlay";
import {
  FLASH_MAX_SECONDS,
  FLASH_RATES,
  GRID_SIZES,
  MAX_COUNT,
  RESOLUTION_PRESETS,
  SQUARE_SIZES,
  TEST_SETS,
  buildReport,
  checkPanelSize,
  classify,
  flashIntervalMs,
  formatAllowance,
  formatMegapixels,
  parseWholeNumber,
  patternsForSet,
  totalDefects,
  type DefectCounts,
  type FlashRate,
  type GridSize,
  type Pattern,
  type TestSet,
} from "./logic";

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

interface Settings {
  set: TestSet;
  autoAdvance: number;
  grid: GridSize;
  flashMode: FlashMode;
  flashSize: number;
  flashRate: FlashRate;
}

const DEFAULT_SETTINGS: Settings = { set: "essential", autoAdvance: 0, grid: "off", flashMode: "square", flashSize: 200, flashRate: 2 };

function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const set: TestSet = r.set === "all" ? "all" : "essential";
  const autoAdvance = [0, 3, 5, 10].includes(Number(r.autoAdvance)) ? Number(r.autoAdvance) : 0;
  const grid = GRID_SIZES.some((g) => g.value === r.grid) ? (r.grid as GridSize) : "off";
  const flashMode: FlashMode = r.flashMode === "full" ? "full" : "square";
  const flashSize = [100, 200, 300].includes(Number(r.flashSize)) ? Number(r.flashSize) : 200;
  const flashRate: FlashRate = Number(r.flashRate) === 1 ? 1 : Number(r.flashRate) === 3 ? 3 : 2;
  return { set, autoAdvance, grid, flashMode, flashSize, flashRate };
}

interface Calc {
  preset: string;
  width: string;
  height: string;
  type1: string;
  type2: string;
  type3: string;
}

const DEFAULT_CALC: Calc = { preset: "1920x1080", width: "1920", height: "1080", type1: "0", type2: "0", type3: "0" };

function sanitizeCalc(raw: unknown): Calc {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string) => (typeof v === "string" && v.length <= 12 ? v : fallback);
  const preset = r.preset === "custom" || RESOLUTION_PRESETS.some((p) => p.value === r.preset) ? (r.preset as string) : DEFAULT_CALC.preset;
  return {
    preset,
    width: str(r.width, DEFAULT_CALC.width),
    height: str(r.height, DEFAULT_CALC.height),
    type1: str(r.type1, "0"),
    type2: str(r.type2, "0"),
    type3: str(r.type3, "0"),
  };
}

const AUTO_ADVANCE_OPTIONS = [
  { value: "0", label: "Off" },
  { value: "3", label: "Every 3 seconds" },
  { value: "5", label: "Every 5 seconds" },
  { value: "10", label: "Every 10 seconds" },
];

const SQUARE_OR_FULL = [
  { value: "square", label: "Small square (drag it over the pixel)" },
  { value: "full", label: "Whole screen" },
];

/* ------------------------------------------------------------------ */
/* Browser feature access (only from snapshots, effects and handlers)  */
/* ------------------------------------------------------------------ */

const noopSubscribe = () => () => {};

function subscribeResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}
const snapshotScreen = () => `${window.screen.width}x${window.screen.height}@${window.devicePixelRatio || 1}|${window.screen.colorDepth}`;

const snapshotFullscreenOk = () => Boolean(document.fullscreenEnabled);

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const snapshotReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface ScreenInfo {
  cssWidth: number;
  cssHeight: number;
  ratio: number;
  depth: number;
  nativeWidth: number;
  nativeHeight: number;
}

function parseScreen(raw: string): ScreenInfo | null {
  const m = /^(\d+)x(\d+)@([\d.]+)\|(\d+)$/.exec(raw);
  if (!m) return null;
  const cssWidth = Number(m[1]);
  const cssHeight = Number(m[2]);
  const ratio = Number(m[3]);
  if (!cssWidth || !cssHeight || !ratio) return null;
  return { cssWidth, cssHeight, ratio, depth: Number(m[4]), nativeWidth: Math.round(cssWidth * ratio), nativeHeight: Math.round(cssHeight * ratio) };
}

/* ------------------------------------------------------------------ */
/* Pattern thumbnails                                                  */
/* ------------------------------------------------------------------ */

function Thumb({ pattern }: { pattern: Pattern }) {
  const kind = pattern.kind;
  const frame = "block h-14 w-full overflow-hidden rounded-md border border-border-strong";
  if (kind.type === "solid") {
    return <span className={frame} style={{ backgroundColor: kind.color }} aria-hidden />;
  }
  if (kind.type === "steps") {
    return (
      <span className={cn(frame, "flex")} aria-hidden>
        {Array.from({ length: kind.count }, (_, i) => {
          const v = kind.from + i;
          return <span key={v} className="flex-1" style={{ backgroundColor: `rgb(${v}, ${v}, ${v})` }} />;
        })}
      </span>
    );
  }
  const ends: Record<string, string> = { gray: "#ffffff", red: "#ff0000", green: "#00ff00", blue: "#0000ff" };
  return (
    <span className={cn(frame, "flex flex-col")} aria-hidden>
      {kind.channels.map((c) => (
        <span key={c} className="flex-1" style={{ background: `linear-gradient(to right, #000000, ${ends[c]})` }} />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type Session = { kind: "test"; start: number } | { kind: "flash" } | null;
type Notice = { variant: "info" | "success" | "warning"; text: string } | null;

function parseCount(text: string): { value: number; error?: string } {
  const t = text.trim();
  if (t === "") return { value: 0 };
  const n = parseWholeNumber(t);
  if (n === null) return { value: 0, error: "Enter a whole number, 0 or more." };
  if (n > MAX_COUNT) return { value: 0, error: `Enter ${formatNumber(MAX_COUNT)} or fewer.` };
  return { value: n };
}

export default function DeadPixelTest() {
  const [settings, setSettings] = usePersistentState<Settings>("dead-pixel-test:settings", DEFAULT_SETTINGS, {
    storage: "local",
    deserialize: (raw) => sanitizeSettings(JSON.parse(raw)),
  });
  const [calc, setCalc] = usePersistentState<Calc>("dead-pixel-test:calc", DEFAULT_CALC, {
    deserialize: (raw) => sanitizeCalc(JSON.parse(raw)),
  });
  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));
  const updateCalc = (patch: Partial<Calc>) => setCalc((c) => ({ ...c, ...patch }));

  const [session, setSession] = useState<Session>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [agreed, setAgreed] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const enteredFullscreen = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  const screenRaw = useSyncExternalStore(subscribeResize, snapshotScreen, () => "");
  const fullscreenOk = useSyncExternalStore(noopSubscribe, snapshotFullscreenOk, () => true);
  const reducedMotion = useSyncExternalStore(subscribeReduced, snapshotReduced, () => false);
  const screenInfo = useMemo(() => parseScreen(screenRaw), [screenRaw]);

  const patterns = useMemo(() => patternsForSet(settings.set), [settings.set]);
  const effectiveRate = reducedMotion ? 1 : settings.flashRate;
  const intervalMs = flashIntervalMs(effectiveRate, reducedMotion);

  /* ---- starting and ending a full-screen session ---- */

  const begin = (next: Exclude<Session, null>) => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNotice(null);
    // Render the overlay synchronously so the fullscreen request still runs inside the click.
    flushSync(() => setSession(next));
    const el = overlayRef.current;
    if (el && typeof el.requestFullscreen === "function") {
      el.requestFullscreen({ navigationUI: "hide" }).catch(() => {
        /* refused: the fixed full-viewport overlay is the fallback */
      });
    }
  };

  const end = useCallback(() => {
    enteredFullscreen.current = false;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    setSession(null);
    const target = returnFocus.current;
    returnFocus.current = null;
    if (target) window.setTimeout(() => target.focus(), 0);
  }, []);

  const endFlash = (reason: FlashEnd) => {
    end();
    if (reason === "timeout") {
      setNotice({
        variant: "info",
        text: `The fixer stopped by itself after ${FLASH_MAX_SECONDS} seconds. Run the color test again and check whether the pixel has changed. It can take more than one run, and a dead pixel will not respond.`,
      });
    } else if (reason === "hidden") {
      setNotice({ variant: "info", text: "The fixer stopped because the tab was hidden." });
    }
  };

  // The browser handles Esc while a real fullscreen element is shown, so leaving fullscreen ends the session.
  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement) {
        enteredFullscreen.current = true;
      } else if (enteredFullscreen.current) {
        end();
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [end]);

  const openWarning = () => {
    setAgreed(false);
    dialogRef.current?.showModal();
  };
  const confirmFlash = () => {
    dialogRef.current?.close();
    begin({ kind: "flash" });
  };

  /* ---- defect calculator ---- */

  const preset = RESOLUTION_PRESETS.find((p) => p.value === calc.preset);
  const widthValue = preset ? preset.width : parseWholeNumber(calc.width);
  const heightValue = preset ? preset.height : parseWholeNumber(calc.height);
  const panel = checkPanelSize(widthValue, heightValue);
  const c1 = parseCount(calc.type1);
  const c2 = parseCount(calc.type2);
  const c3 = parseCount(calc.type3);
  const countsOk = !c1.error && !c2.error && !c3.error;
  const counts: DefectCounts = { type1: c1.value, type2: c2.value, type3: c3.value };
  const classification = panel.ok && countsOk ? classify(counts, panel.pixels) : null;
  const screenNote = screenInfo
    ? `${screenInfo.cssWidth} x ${screenInfo.cssHeight} CSS pixels at ${screenInfo.ratio}x (about ${screenInfo.nativeWidth} x ${screenInfo.nativeHeight} physical pixels)`
    : undefined;
  const report =
    panel.ok && countsOk && widthValue !== null && heightValue !== null ? buildReport({ width: widthValue, height: heightValue, counts, screenNote }) : "";
  const total = totalDefects(counts);

  const resolutionOptions = [...RESOLUTION_PRESETS.map((p) => ({ value: p.value, label: p.label })), { value: "custom", label: "Custom size" }];

  const summary = (() => {
    if (!classification) return null;
    const best = classification.best;
    if (total === 0) return { variant: "success" as const, title: "No defects entered", text: "With no defects the panel meets every class. Run the test, then enter what you counted." };
    if (!best) return { variant: "error" as const, title: "Over the Class IV allowance", text: "That many defects is beyond every class in the standard. A maker would normally treat this as a reject." };
    if (best.id === "I" || best.id === "II") {
      return { variant: "success" as const, title: `Within ${best.name}`, text: `These counts fit ${best.name} for a ${formatMegapixels(panel.pixels)}-pixel panel. Whether a maker accepts a return still depends on its own policy.` };
    }
    return { variant: "warning" as const, title: `Only within ${best.name}`, text: `These counts pass ${best.name} but not Class II, the class most makers quote. That can be a reason to ask for a replacement, but check the maker's pixel policy.` };
  })();

  const resetCalc = () => updateCalc({ type1: "0", type2: "0", type3: "0" });

  return (
    <ToolPanel>
      {notice && <Alert variant={notice.variant}>{notice.text}</Alert>}

      {/* ---- start ---- */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="accent" size="lg" onClick={() => begin({ kind: "test", start: 0 })} leftIcon={<Maximize2 className="h-4 w-4" aria-hidden />} data-testid="start">
            Start screen test
          </Button>
          <span className="text-sm text-fg-secondary" data-testid="screen-count">
            {patterns.length} screens, full size
          </span>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
          <span>
            <kbd className="kbd">→</kbd> <kbd className="kbd">Space</kbd> or click: next
          </span>
          <span>
            <kbd className="kbd">←</kbd> back
          </span>
          <span>
            <kbd className="kbd">G</kbd> locator grid
          </span>
          <span>
            <kbd className="kbd">1</kbd>-<kbd className="kbd">9</kbd> jump
          </span>
          <span>
            <kbd className="kbd">Esc</kbd> exit
          </span>
        </p>
        {!fullscreenOk && (
          <Alert variant="info" title="True fullscreen is not available in this browser">
            The test fills the visible page instead, and the browser bars may stay on screen. iPhone Safari works this way; its aA menu offers Hide Toolbar on recent versions. Touch: tap for next, tap the left edge for back, press and hold to exit.
          </Alert>
        )}
      </div>

      {/* ---- options ---- */}
      <ToolGrid cols={3}>
        <Select label="Screens to show" value={settings.set} onChange={(e) => update({ set: e.target.value as TestSet })} options={TEST_SETS} />
        <Select label="Auto-advance" value={String(settings.autoAdvance)} onChange={(e) => update({ autoAdvance: Number(e.target.value) })} options={AUTO_ADVANCE_OPTIONS} />
        <Select label="Locator grid" value={settings.grid} onChange={(e) => update({ grid: e.target.value as GridSize })} options={GRID_SIZES.map((g) => ({ value: g.value, label: g.label }))} />
      </ToolGrid>

      {/* ---- pattern tiles ---- */}
      <ul className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3", patterns.length <= 6 ? "lg:grid-cols-6" : "lg:grid-cols-5")} aria-label="Test screens. Choose one to start there." data-testid="tiles">
        {patterns.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => begin({ kind: "test", start: i })}
              data-pattern-tile={p.id}
              aria-label={`Start the test at ${p.label}`}
              className="flex h-full w-full flex-col gap-2 rounded-lg border border-border bg-surface-2 p-2 text-left transition-colors hover:border-border-strong hover:bg-surface"
            >
              <Thumb pattern={p} />
              <span className="px-0.5">
                <span className="block text-[13px] font-medium text-fg">{p.label}</span>
                <span className="block text-xs text-muted">{p.short}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* ---- screen info ---- */}
      <ToolSection title="Your screen, as the browser reports it" description="The native resolution is an estimate, because browser zoom and display scaling change what the page can see. Reset zoom to 100% for the best guess.">
        <StatGrid>
          <Stat label="Reported size" value={screenInfo ? `${screenInfo.cssWidth} × ${screenInfo.cssHeight}` : "–"} hint="CSS pixels" />
          <Stat label="Pixel ratio" value={screenInfo ? `${screenInfo.ratio}×` : "–"} hint="device pixels per CSS pixel" />
          <Stat label="Estimated native" value={screenInfo ? `${screenInfo.nativeWidth} × ${screenInfo.nativeHeight}` : "–"} hint="size × ratio" emphasis />
          <Stat label="Color depth" value={screenInfo ? `${screenInfo.depth}-bit` : "–"} hint="as reported, not panel depth" />
        </StatGrid>
        {screenInfo && (
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateCalc({ preset: "custom", width: String(screenInfo.nativeWidth), height: String(screenInfo.nativeHeight) })}
              data-testid="use-screen"
            >
              Use this size for the defect check below
            </Button>
          </div>
        )}
      </ToolSection>

      {/* ---- defect calculator ---- */}
      <ToolSection
        title="Count what you found and check the class"
        description="Enter how many defective pixels you counted on each test screen. The table scales the commonly cited ISO 9241-307 class limits, which are quoted per million pixels, to your panel size."
      >
        <ToolGrid cols={3}>
          <Select label="Panel resolution" value={calc.preset} onChange={(e) => updateCalc({ preset: e.target.value })} options={resolutionOptions} />
          {calc.preset === "custom" && (
            <>
              <Input label="Width (pixels)" inputMode="numeric" value={calc.width} onChange={(e) => updateCalc({ width: e.target.value })} error={widthValue === null ? "Whole number needed." : undefined} />
              <Input label="Height (pixels)" inputMode="numeric" value={calc.height} onChange={(e) => updateCalc({ height: e.target.value })} error={heightValue === null ? "Whole number needed." : undefined} />
            </>
          )}
        </ToolGrid>
        <ToolGrid cols={3}>
          <Input
            label="Type 1: always lit"
            hint="Bright or white dot on the black screen"
            inputMode="numeric"
            value={calc.type1}
            onChange={(e) => updateCalc({ type1: e.target.value })}
            error={c1.error}
            data-testid="type1"
          />
          <Input
            label="Type 2: always dark"
            hint="Black dot on the white screen"
            inputMode="numeric"
            value={calc.type2}
            onChange={(e) => updateCalc({ type2: e.target.value })}
            error={c2.error}
            data-testid="type2"
          />
          <Input
            label="Type 3: colored subpixel"
            hint="Red, green, blue, cyan, magenta or yellow dot"
            inputMode="numeric"
            value={calc.type3}
            onChange={(e) => updateCalc({ type3: e.target.value })}
            error={c3.error}
            data-testid="type3"
          />
        </ToolGrid>

        {!panel.ok && panel.error && <Alert variant="error">{panel.error}</Alert>}

        {classification && summary && (
          <div className="flex flex-col gap-3" data-testid="classification">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <Stat label="Panel pixels" value={formatNumber(panel.pixels)} hint={formatMegapixels(panel.pixels)} />
              <Stat label="Defects entered" value={total} hint={`${counts.type1} + ${counts.type2} + ${counts.type3}`} />
              <Stat label="Strictest class met" value={classification.best ? classification.best.name.replace("Class ", "") : "None"} emphasis hint="I is strictest, IV is loosest" />
            </div>
            <Alert variant={summary.variant} title={summary.title}>
              {summary.text}
            </Alert>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm" data-testid="class-table">
                <caption className="sr-only">Defects allowed per class for this panel size</caption>
                <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Class</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Type 1 up to</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Type 2 up to</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Type 3 up to</th>
                    <th scope="col" className="px-3 py-2 font-medium">Your counts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {classification.results.map((r) => (
                    <tr key={r.cls.id} data-class={r.cls.id} data-pass={r.pass}>
                      <th scope="row" className="px-3 py-2 text-left font-medium text-fg">{r.cls.name}</th>
                      <td className={cn("px-3 py-2 text-right tabular-nums", r.exceeded.includes("type1") ? "font-semibold text-danger" : "text-fg-secondary")}>{formatAllowance(r.allowed.type1)}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", r.exceeded.includes("type2") ? "font-semibold text-danger" : "text-fg-secondary")}>{formatAllowance(r.allowed.type2)}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", r.exceeded.includes("type3") ? "font-semibold text-danger" : "text-fg-secondary")}>{formatAllowance(r.allowed.type3)}</td>
                      <td className="px-3 py-2">
                        <Badge variant={r.pass ? "success" : "danger"}>{r.pass ? "within" : "over"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">
              Allowances are the per-million rates multiplied by your panel&apos;s pixel count and are not rounded, so a limit of 4.1 means four defects pass and five do not. Makers may round differently and may limit clusters of neighboring defects separately.
            </p>
          </div>
        )}

        <ToolActions>
          <CopyButton text={report} label="Copy report" variant="outline" disabled={!report} />
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadText(report, "dead-pixel-report.txt")} disabled={!report}>
            Download report
          </Button>
          <Button variant="ghost" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={resetCalc} disabled={calc.type1 === "0" && calc.type2 === "0" && calc.type3 === "0"}>
            Reset counts
          </Button>
        </ToolActions>
      </ToolSection>

      {/* ---- stuck pixel fixer ---- */}
      <ToolSection
        title="Stuck pixel fixer (flashing colors)"
        description="Cycles colors in a small square, or across the whole screen, to try to wake a stuck pixel. It cannot repair a dead pixel. It stays off until you confirm a photosensitivity warning."
      >
        <ToolGrid cols={3}>
          <Select label="Flash area" value={settings.flashMode} onChange={(e) => update({ flashMode: e.target.value as FlashMode })} options={SQUARE_OR_FULL} />
          <Select
            label="Square size"
            value={String(settings.flashSize)}
            onChange={(e) => update({ flashSize: Number(e.target.value) })}
            options={SQUARE_SIZES}
            disabled={settings.flashMode === "full"}
          />
          <Select
            label="Color changes per second"
            value={String(reducedMotion ? 1 : settings.flashRate)}
            onChange={(e) => update({ flashRate: Number(e.target.value) as FlashRate })}
            options={FLASH_RATES.map((o) => ({ ...o, disabled: reducedMotion && o.value !== "1" }))}
          />
        </ToolGrid>
        {reducedMotion && <Alert variant="info">Your system is set to reduce motion, so flashing is held to one color change per second.</Alert>}
        <ToolActions>
          <Button variant="secondary" leftIcon={<Zap className="h-4 w-4" aria-hidden />} onClick={openWarning} data-testid="open-flasher">
            Open the stuck pixel fixer
          </Button>
          <span className="text-xs text-muted">
            Up to {effectiveRate} color {effectiveRate === 1 ? "change" : "changes"} per second, never more than 3. Stops by itself after {FLASH_MAX_SECONDS} seconds.
          </span>
        </ToolActions>
      </ToolSection>

      <Alert variant="info" title="What a browser test can and cannot tell you">
        The test paints flat colors so you can see faults with your own eyes. It cannot measure brightness, color accuracy or response time, and it cannot see the panel itself. Nothing you do here is uploaded; only your settings are remembered on this device.
      </Alert>

      {/* ---- photosensitivity warning ---- */}
      <dialog
        ref={dialogRef}
        aria-labelledby="dpt-warning-title"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-auto rounded-xl border border-border-strong bg-surface p-5 text-fg shadow-card-lg backdrop:bg-black/60"
        data-testid="warning-dialog"
      >
        <h3 id="dpt-warning-title" className="text-base font-semibold text-fg">
          Photosensitivity warning
        </h3>
        <div className="mt-2 flex flex-col gap-2 text-sm text-fg-secondary">
          <p>
            The fixer flashes bright colors up to {effectiveRate} {effectiveRate === 1 ? "time" : "times"} per second, for up to {FLASH_MAX_SECONDS} seconds.
          </p>
          <p>Flashing lights can trigger seizures in people with photosensitive epilepsy, including people who have never had a seizure. Do not use it if you, or anyone near the screen, may be sensitive to flashing images.</p>
          <p>Stop at once if you feel dizzy, sick or notice anything odd. Press Esc, tap the screen or use the Stop button.</p>
        </div>
        <div className="mt-4">
          <Checkbox checked={agreed} onChange={setAgreed} label="I understand, and nobody nearby is sensitive to flashing lights" />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!agreed} onClick={confirmFlash} data-testid="confirm-flash">
            Start flashing
          </Button>
        </div>
      </dialog>

      {session?.kind === "test" && (
        <TestOverlay
          rootRef={overlayRef}
          patterns={patterns}
          startIndex={session.start}
          grid={settings.grid}
          onGridChange={(g) => update({ grid: g })}
          autoAdvanceSec={settings.autoAdvance}
          onClose={end}
        />
      )}
      {session?.kind === "flash" && (
        <FlashOverlay rootRef={overlayRef} mode={settings.flashMode} squareSize={settings.flashSize} intervalMs={intervalMs} maxSeconds={FLASH_MAX_SECONDS} onClose={endFlash} />
      )}
    </ToolPanel>
  );
}
