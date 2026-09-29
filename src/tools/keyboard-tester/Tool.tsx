"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { Download, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Select, Slider, Stat, StatGrid, ToolActions, ToolGrid, ToolPanel, ToolSection, Toggle } from "@/components/ui";
import { cn, downloadText } from "@/lib/utils";
import { BOARD_SIZES, STANDARDS, buildLayout, isCharacterCode, type BoardSize, type Platform, type Standard } from "./layouts";
import {
  COMBOS,
  buildReport,
  computeProgress,
  createSession,
  displayKey,
  formatMs,
  keyName,
  locationName,
  sessionReducer,
  summarizeChatter,
  type KeyEventInfo,
  type LogEntry,
} from "./logic";
import { KeyboardView, swatchClass, type KeyState } from "./KeyboardView";

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

type LabelSet = "auto" | Platform;

interface Settings {
  size: BoardSize;
  standard: Standard;
  labels: LabelSet;
  threshold: number;
  relabel: boolean;
}

const DEFAULT_SETTINGS: Settings = { size: "full", standard: "ansi", labels: "auto", threshold: 30, relabel: true };

function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const size = BOARD_SIZES.some((s) => s.value === r.size) ? (r.size as BoardSize) : DEFAULT_SETTINGS.size;
  const standard = STANDARDS.some((s) => s.value === r.standard) ? (r.standard as Standard) : DEFAULT_SETTINGS.standard;
  const labels: LabelSet = r.labels === "windows" || r.labels === "mac" ? r.labels : "auto";
  const t = Number(r.threshold);
  const threshold = Number.isFinite(t) ? Math.min(100, Math.max(5, Math.round(t))) : DEFAULT_SETTINGS.threshold;
  return { size, standard, labels, threshold, relabel: r.relabel !== false };
}

const LABEL_OPTIONS = [
  { value: "auto", label: "Auto-detect" },
  { value: "windows", label: "Windows / Linux" },
  { value: "mac", label: "Mac" },
];

/* ------------------------------------------------------------------ */
/* Browser feature access (only ever called from effects, handlers or  */
/* useSyncExternalStore snapshots, never while rendering on the server) */
/* ------------------------------------------------------------------ */

interface KeyboardApi {
  lock?: (codes?: string[]) => Promise<void>;
  unlock?: () => void;
  getLayoutMap?: () => Promise<{ forEach: (cb: (value: string, key: string) => void) => void }>;
}

function getKeyboardApi(): KeyboardApi | undefined {
  return (navigator as unknown as { keyboard?: KeyboardApi }).keyboard;
}

const noopSubscribe = () => () => {};

function subscribeTouch(cb: () => void) {
  const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const snapshotTouch = () => window.matchMedia("(hover: none) and (pointer: coarse)").matches;

function subscribeFullscreen(cb: () => void) {
  document.addEventListener("fullscreenchange", cb);
  return () => document.removeEventListener("fullscreenchange", cb);
}
const snapshotFullscreen = () => Boolean(document.fullscreenElement);
const snapshotFullscreenSupported = () => Boolean(document.fullscreenEnabled);

function snapshotPlatform(): Platform {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const p = nav.userAgentData?.platform || navigator.platform || navigator.userAgent;
  return /mac|iphone|ipad|ipod/i.test(p) ? "mac" : "windows";
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function toKeyEventInfo(ev: KeyboardEvent): KeyEventInfo {
  return {
    type: ev.type === "keyup" ? "up" : "down",
    code: ev.code || `key:${ev.key}`,
    key: ev.key,
    keyCode: ev.keyCode,
    location: ev.location,
    repeat: ev.repeat,
    time: ev.timeStamp,
    shift: ev.shiftKey,
    ctrl: ev.ctrlKey,
    alt: ev.altKey,
    meta: ev.metaKey,
  };
}

/** Use the layout map's character for a key cap when it is a single letter, digit or symbol. */
function capFromLayoutMap(value: string | undefined, fallback: string): string {
  if (!value || [...value].length !== 1) return fallback;
  const upper = value.toUpperCase();
  return [...upper].length === 1 ? upper : value;
}

function modifierText(e: { shift: boolean; ctrl: boolean; alt: boolean; meta: boolean }): string {
  const parts = [e.ctrl && "Ctrl", e.alt && "Alt", e.shift && "Shift", e.meta && "Meta"].filter(Boolean);
  return parts.length ? parts.join(" + ") : "none";
}

function logLine(l: LogEntry): string {
  const extra = l.type === "up" ? (l.held !== null ? ` held=${Math.round(l.held)}ms` : "") : l.gap !== null && l.gap < 5000 ? ` gap=${formatMs(l.gap)}` : "";
  return `${(l.time / 1000).toFixed(3)}s ${l.type === "down" ? "keydown" : "keyup  "} code=${l.code} key=${JSON.stringify(l.key)} keyCode=${l.keyCode}${extra}`;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function KeyboardTester() {
  const [settings, setSettings] = usePersistentState<Settings>("keyboard-tester:settings", DEFAULT_SETTINGS, {
    storage: "local",
    deserialize: (raw) => sanitizeSettings(JSON.parse(raw)),
  });
  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  const [session, dispatch] = useReducer(sessionReducer, undefined, createSession);
  const [skipped, setSkipped] = useState<Record<string, true>>({});
  const [focused, setFocused] = useState(false);
  const [lockActive, setLockActive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [layoutMap, setLayoutMap] = useState<Record<string, string> | null>(null);

  const touchOnly = useSyncExternalStore(subscribeTouch, snapshotTouch, () => false);
  const fullscreen = useSyncExternalStore(subscribeFullscreen, snapshotFullscreen, () => false);
  const fullscreenSupported = useSyncExternalStore(noopSubscribe, snapshotFullscreenSupported, () => false);
  const detectedPlatform = useSyncExternalStore(noopSubscribe, snapshotPlatform, (): Platform => "windows");

  const platform: Platform = settings.labels === "auto" ? detectedPlatform : settings.labels;
  const mac = platform === "mac";

  const stageRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const visibleRef = useRef(false);
  const escTimer = useRef<number | null>(null);
  const configRef = useRef({ threshold: settings.threshold, mac });

  useEffect(() => {
    configRef.current = { threshold: settings.threshold, mac };
  }, [settings.threshold, mac]);

  const loadLayoutMap = useCallback(() => {
    const api = getKeyboardApi();
    if (!api?.getLayoutMap) return;
    api
      .getLayoutMap()
      .then((map) => {
        const out: Record<string, string> = {};
        map.forEach((value, key) => {
          out[key] = value;
        });
        setLayoutMap(out);
      })
      .catch(() => {
        /* blocked (for example inside a cross-origin frame): fall back to learned labels */
      });
  }, []);

  useEffect(() => {
    loadLayoutMap();
  }, [loadLayoutMap]);

  // Track whether the keyboard is on screen, so keys still register (without
  // blocking scrolling or shortcuts) before the visitor clicks into the tester.
  useEffect(() => {
    const el = areaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries.some((en) => en.isIntersecting);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Key listeners on window (capture phase) so nothing on the page can swallow a key first.
  useEffect(() => {
    const clearEscTimer = () => {
      if (escTimer.current !== null) {
        window.clearTimeout(escTimer.current);
        escTimer.current = null;
      }
    };
    const handle = (ev: KeyboardEvent) => {
      const inFullscreen = Boolean(document.fullscreenElement) && document.fullscreenElement === stageRef.current;
      const capturing = focusedRef.current || inFullscreen;
      if (!capturing && (!visibleRef.current || isEditableTarget(ev.target))) return;
      if (capturing) {
        // Stop the browser acting on the key (scrolling, tabbing, F5, Ctrl+F ...).
        ev.preventDefault();
        ev.stopPropagation();
        // Escape hatch so keyboard-only visitors are never trapped: hold Esc for two seconds.
        if (ev.code === "Escape" && !inFullscreen) {
          if (ev.type === "keydown" && !ev.repeat && escTimer.current === null) {
            escTimer.current = window.setTimeout(() => {
              escTimer.current = null;
              areaRef.current?.blur();
            }, 2000);
          } else if (ev.type === "keyup") {
            clearEscTimer();
          }
        }
      }
      const { threshold, mac: isMac } = configRef.current;
      dispatch({ kind: "key", e: toKeyEventInfo(ev), threshold, mac: isMac });
    };
    const release = () => {
      clearEscTimer();
      dispatch({ kind: "release" });
    };
    const onVisibility = () => {
      if (document.hidden) release();
    };
    window.addEventListener("keydown", handle, true);
    window.addEventListener("keyup", handle, true);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", handle, true);
      window.removeEventListener("keyup", handle, true);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", onVisibility);
      clearEscTimer();
    };
  }, []);

  // Release the keyboard lock whenever fullscreen ends, however it ended.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) {
        getKeyboardApi()?.unlock?.();
        setLockActive(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enterFullscreen = async () => {
    const el = stageRef.current;
    if (!el?.requestFullscreen) return;
    setNotice(null);
    try {
      await el.requestFullscreen({ navigationUI: "hide" });
    } catch {
      setNotice("Your browser did not allow fullscreen. The tester still works in the page.");
      return;
    }
    const api = getKeyboardApi();
    if (api?.lock) {
      try {
        await api.lock();
        setLockActive(true);
      } catch {
        setLockActive(false);
      }
    }
    areaRef.current?.focus();
  };

  const exitFullscreen = () => {
    getKeyboardApi()?.unlock?.();
    setLockActive(false);
    if (document.fullscreenElement) void document.exitFullscreen();
  };

  const layout = useMemo(() => buildLayout(settings.size, settings.standard, platform), [settings.size, settings.standard, platform]);
  const sizeLabel = BOARD_SIZES.find((s) => s.value === settings.size)?.label.replace(/ \(.*\)$/, "") ?? "";
  const layoutName = `${sizeLabel}, ${settings.standard.toUpperCase()}, ${mac ? "Mac" : "Windows/Linux"} labels`;

  const labels = useMemo(() => {
    const out: Record<string, string> = {};
    for (const def of layout.keys) {
      if (settings.relabel && isCharacterCode(def.code)) {
        out[def.code] = layoutMap ? capFromLayoutMap(layoutMap[def.code], def.label) : (session.learned[def.code] ?? def.label);
      } else {
        out[def.code] = def.label;
      }
    }
    return out;
  }, [layout, settings.relabel, layoutMap, session.learned]);

  const progress = useMemo(() => computeProgress(layout.keys, session.seen, skipped), [layout, session.seen, skipped]);
  const heldSet = useMemo(() => new Set(session.held), [session.held]);
  const chatterSet = useMemo(() => new Set(session.chatter.map((c) => c.code)), [session.chatter]);
  const chatterRows = useMemo(() => summarizeChatter(session.chatter), [session.chatter]);
  const extras = useMemo(() => {
    const known = new Set(layout.keys.map((k) => k.code));
    return Object.entries(session.seen).filter(([code]) => !known.has(code));
  }, [layout, session.seen]);
  const report = useMemo(
    () => buildReport({ layoutName, keys: layout.keys, session, skipped, threshold: settings.threshold }),
    [layoutName, layout, session, skipped, settings.threshold],
  );
  const logText = useMemo(() => session.log.map(logLine).join("\n"), [session.log]);
  const logRows = useMemo(() => [...session.log].reverse().slice(0, 50), [session.log]);

  const hasData = session.log.length > 0 || Object.keys(session.seen).length > 0;
  const capturing = focused || fullscreen;
  const last = session.last;
  const labelFor = (code: string) => {
    const def = layout.keys.find((k) => k.code === code);
    return def ? (labels[code] ?? def.label) : code;
  };
  const peakKeys = session.peak.filter((c) => !["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight"].includes(c));
  const needsIso = settings.standard === "ansi" && extras.some(([code]) => code === "IntlBackslash");

  const reset = () => {
    dispatch({ kind: "reset" });
    areaRef.current?.focus();
  };

  const legend: { state: KeyState; text: string }[] = [
    { state: "untested", text: "Not tested yet" },
    { state: "pressed", text: "Down now" },
    { state: "tested", text: "Tested ✓" },
    { state: "chatter", text: "Possible chatter !" },
    { state: "skipped", text: "Not on my keyboard" },
  ];

  return (
    <ToolPanel>
      {touchOnly && (
        <Alert variant="info" title="This tester needs a physical keyboard">
          A phone or tablet&apos;s on-screen keyboard does not send physical key codes. Connect a Bluetooth or USB keyboard, tap the keyboard below, then press keys.
        </Alert>
      )}

      <ToolGrid cols={3}>
        <Select label="Keyboard size" value={settings.size} onChange={(e) => update({ size: e.target.value as BoardSize })} options={BOARD_SIZES} />
        <Select label="Key standard" value={settings.standard} onChange={(e) => update({ standard: e.target.value as Standard })} options={STANDARDS} />
        <Select label="Modifier key labels" value={settings.labels} onChange={(e) => update({ labels: e.target.value as LabelSet })} options={LABEL_OPTIONS} />
      </ToolGrid>

      <div ref={stageRef} className={cn("flex flex-col gap-3", fullscreen && "h-full justify-center overflow-auto bg-bg p-6")}>
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={capturing ? "primary" : "default"} data-testid="status">
              {capturing ? "● Capturing keys" : "○ Not capturing"}
            </Badge>
            {lockActive && <Badge variant="success">Key lock on</Badge>}
            <span className="font-mono text-xs text-muted" data-testid="progress-inline">
              {progress.tested} of {progress.total} keys tested
            </span>
          </div>
          {fullscreenSupported &&
            (fullscreen ? (
              <Button size="sm" variant="secondary" onClick={exitFullscreen} leftIcon={<Minimize2 className="h-4 w-4" aria-hidden />}>
                Exit fullscreen
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={enterFullscreen} leftIcon={<Maximize2 className="h-4 w-4" aria-hidden />}>
                Fullscreen + key lock
              </Button>
            ))}
        </div>

        <div
          ref={areaRef}
          tabIndex={0}
          role="group"
          aria-label="Keyboard test area. Focus here, then press any key on your keyboard."
          data-testid="area"
          onFocus={() => {
            focusedRef.current = true;
            setFocused(true);
            loadLayoutMap();
          }}
          onBlur={() => {
            focusedRef.current = false;
            setFocused(false);
            dispatch({ kind: "release" });
          }}
          className={cn(
            "cursor-pointer rounded-xl border-2 bg-surface-2 p-2 outline-none transition-colors select-none sm:p-3",
            capturing ? "border-primary" : "border-border-strong hover:border-fg/30",
            "focus-visible:ring-[3px] focus-visible:ring-primary/25",
          )}
        >
          <KeyboardView layout={layout} labels={labels} held={heldSet} seen={session.seen} chatter={chatterSet} skipped={skipped} fullscreen={fullscreen} />
        </div>

        <p className="min-h-12 text-center text-xs text-muted md:min-h-8 xl:min-h-5" data-testid="hint">
          {capturing
            ? fullscreen && !lockActive
              ? "Fullscreen is on. This browser cannot lock keys, so Esc exits fullscreen and system keys may still act."
              : fullscreen
                ? "Key lock is on: Esc, Tab and the Windows key are captured. Hold Esc for two seconds to leave fullscreen."
                : "Capturing every key, so Tab, F5 and Ctrl+F will not reach the browser. Hold Esc for two seconds, or click outside, to stop."
            : "Click the keyboard, then press any key. Keys also register while the tester is on screen, but only clicking it blocks browser shortcuts."}
        </p>

        <p className="min-h-6 text-center font-mono text-xs text-fg-secondary" data-testid="last-line">
          {last ? (
            <>
              key <span className="text-fg">{displayKey(last.key)}</span> · code <span className="text-fg">{last.code}</span> · keyCode <span className="text-fg">{last.keyCode}</span>
            </>
          ) : (
            "Last key: none yet"
          )}
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-fg-secondary" aria-label="Key colors">
          {legend.map((l) => (
            <li key={l.state} className="flex items-center gap-1.5">
              <span className={swatchClass(l.state)} aria-hidden />
              {l.text}
            </li>
          ))}
        </ul>
      </div>

      {notice && <Alert variant="warning">{notice}</Alert>}
      <p className="sr-only" aria-live="polite">
        {last && !last.repeat ? `${last.type === "down" ? "Pressed" : "Released"} ${displayKey(last.key)}, code ${last.code}` : ""}
      </p>

      <StatGrid>
        <Stat label="Keys tested" value={`${progress.tested} / ${progress.total}`} emphasis hint={progress.untested.length ? `${progress.untested.length} left` : "All tested"} />
        <Stat label="Down right now" value={session.held.length} hint={session.held.length ? session.held.map(labelFor).join(" ") : "Hold several keys"} />
        <Stat label="Most held at once" value={session.maxHeld} hint="modifiers counted separately" />
        <Stat label="Chatter events" value={session.chatter.length} hint={`re-press under ${settings.threshold} ms`} />
      </StatGrid>

      <ToolActions>
        <Button variant="secondary" onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} disabled={!hasData}>
          Reset test
        </Button>
        <CopyButton text={report} label="Copy report" variant="outline" disabled={!hasData} />
        <Button variant="outline" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadText(report, "keyboard-test-report.txt")} disabled={!hasData}>
          Download report
        </Button>
        <div className="w-full sm:ml-auto sm:w-auto">
          <Toggle
            checked={settings.relabel}
            onChange={(v) => update({ relabel: v })}
            label="Show letters from my keyboard layout"
            description={layoutMap ? "Uses your browser's layout map." : "Learns key caps as you press them."}
          />
        </div>
      </ToolActions>

      {needsIso && <Alert variant="info">A key called IntlBackslash was detected. Your keyboard looks like an ISO board, so switch “Key standard” to ISO (UK / Europe) to see it on the drawing.</Alert>}

      <ToolGrid>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-4">
          <span className="label-mono">Last key event</span>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              className={cn(
                "flex h-20 w-full shrink-0 sm:w-28 items-center justify-center overflow-hidden rounded-lg border border-border-strong bg-surface px-2 font-mono font-semibold text-fg",
                last && [...displayKey(last.key)].length > 3 ? "text-lg" : "text-4xl",
              )}
              data-testid="glyph"
            >
              {last ? displayKey(last.key) : "—"}
            </div>
            <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ["event.key", last ? JSON.stringify(last.key) : "—"],
                ["event.code", last ? last.code : "—"],
                ["keyCode (legacy)", last ? String(last.keyCode) : "—"],
                ["location", last ? locationName(last.location) : "—"],
                ["event", last ? (last.type === "down" ? "keydown" : "keyup") : "—"],
                ["repeat", last ? (last.repeat ? "true (auto-repeat)" : "false") : "—"],
                ["modifiers", last ? modifierText(last) : "—"],
                [last?.type === "up" ? "held for" : "since release", last ? (last.type === "up" ? (last.held !== null ? formatMs(last.held) : "—") : last.gap !== null && last.gap < 5000 ? formatMs(last.gap) : "—") : "—"],
              ].map(([term, value]) => (
                <div key={term} className="min-w-0">
                  <dt className="label-mono break-words">{term}</dt>
                  <dd className="truncate font-mono text-[13px] text-fg" title={value}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border-strong bg-surface-2">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-1.5">
            <span className="label-mono">Event log (newest first)</span>
            <CopyButton text={logText} size="sm" variant="ghost" label="Copy log" disabled={!logText} />
          </div>
          <div className="scroll-thin h-52 overflow-auto" role="log" aria-label="Key event log" tabIndex={0}>
            {logRows.length ? (
              <table className="w-full text-left font-mono text-xs">
                <thead className="sticky top-0 bg-surface-2 text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-1.5 font-medium">Time</th>
                    <th scope="col" className="px-2 py-1.5 font-medium">Event</th>
                    <th scope="col" className="px-2 py-1.5 font-medium">Code</th>
                    <th scope="col" className="px-2 py-1.5 font-medium">Key</th>
                    <th scope="col" className="px-2 py-1.5 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logRows.map((l) => (
                    <tr key={l.id} className={l.type === "down" ? "text-fg" : "text-muted"}>
                      <td className="px-3 py-1 tabular-nums">{(l.time / 1000).toFixed(2)}s</td>
                      <td className="px-2 py-1">{l.type === "down" ? "down" : "up"}</td>
                      <td className="px-2 py-1">{l.code}</td>
                      <td className="max-w-[6rem] truncate px-2 py-1">{displayKey(l.key)}</td>
                      <td className="whitespace-nowrap px-2 py-1 tabular-nums">
                        {l.type === "up" ? (l.held !== null ? `held ${Math.round(l.held)} ms` : "") : l.gap !== null && l.gap < 5000 ? `gap ${formatMs(l.gap)}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-4 text-sm text-muted">Every key-down and key-up appears here with its timing. Nothing is stored or sent anywhere.</p>
            )}
          </div>
        </div>
      </ToolGrid>

      <ToolSection title="Ghosting and rollover checks" description="Hold each set of keys at the same moment. A check passes once every key in it was down together. Failing one points to blocking or a 6-key limit.">
        <ul className="grid gap-2 sm:grid-cols-2" data-testid="combos">
          {COMBOS.map((c) => {
            const done = Boolean(session.combos[c.id]);
            return (
              <li key={c.id} data-combo={c.id} data-passed={done} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                <span className="text-fg-secondary">{c.label}</span>
                <Badge variant={done ? "success" : "outline"}>{done ? "passed" : "not yet"}</Badge>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-fg-secondary" data-testid="peak">
          {session.maxHeld
            ? `The most keys seen down at once: ${session.maxHeld}${peakKeys.length ? ` (${peakKeys.map(labelFor).join(", ")})` : ""}. If you held more than that, the keyboard or the operating system dropped the extra keys.`
            : "Hold as many keys as you can. The highest number the browser saw appears here."}
        </p>
      </ToolSection>

      <ToolSection title="Key chatter" description="Chatter is one press registering twice. It shows up as the same key going down again a few milliseconds after it was released.">
        <Slider label="Chatter threshold" value={settings.threshold} onChange={(v) => update({ threshold: v })} min={5} max={100} step={1} format={(v) => `${v} ms`} />
        {chatterRows.length ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm" data-testid="chatter-table">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Key</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Double registrations</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Shortest gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chatterRows.map((r) => (
                  <tr key={r.code}>
                    <td className="px-4 py-2 font-medium text-fg">{labelFor(r.code)} <span className="font-mono text-xs text-muted">{r.code}</span></td>
                    <td className="px-4 py-2 text-right tabular-nums text-fg-secondary">{r.count}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-fg-secondary">{formatMs(r.shortest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted" data-testid="no-chatter">
            No chatter detected{session.presses ? ` in ${session.presses} ${session.presses === 1 ? "press" : "presses"}` : " yet"}. Type normally, or tap each suspect key slowly a few times.
          </p>
        )}
      </ToolSection>

      <ToolSection title="Keys still to test" description="Click a listed key to mark it as not on your keyboard, for example a missing numpad or Print Screen key. It is then left out of the count.">
        {!hasData && progress.skipped.length === 0 ? (
          <p className="text-sm text-muted" data-testid="untested-hint">
            Start pressing keys and the ones you have not reached yet will be listed here.
          </p>
        ) : progress.untested.length ? (
          <div className="flex flex-wrap gap-1.5" data-testid="untested">
            {progress.untested.map((key) => (
              <button
                key={key.code}
                type="button"
                title={`${key.code}: mark as not on my keyboard`}
                onClick={() => setSkipped((s) => ({ ...s, [key.code]: true }))}
                className="rounded-md border border-border-strong bg-surface px-2 py-1 font-mono text-xs text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {keyName({ code: key.code, label: labels[key.code] ?? key.label })}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-success" data-testid="all-tested">Every key on this layout has been tested.</p>
        )}
        {progress.skipped.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5" data-testid="skipped">
            <span className="label-mono mr-1">Marked as not on my keyboard</span>
            {progress.skipped.map((key) => (
              <button
                key={key.code}
                type="button"
                title="Put this key back in the test"
                onClick={() =>
                  setSkipped((s) => {
                    const next = { ...s };
                    delete next[key.code];
                    return next;
                  })
                }
                className="rounded-md border border-dashed border-border-strong px-2 py-1 font-mono text-xs text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {labels[key.code] ?? key.label} · undo
              </button>
            ))}
          </div>
        )}
        {extras.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5" data-testid="extras">
            <span className="label-mono mr-1">Other keys detected</span>
            {extras.map(([code, key]) => (
              <Badge key={code} variant="outline">
                {code}
                {key && key !== code ? ` · ${displayKey(key)}` : ""}
              </Badge>
            ))}
          </div>
        )}
      </ToolSection>

      <Alert variant="info" title="What the browser cannot see">
        Fn and most firmware keys never reach a web page, Print Screen and some media keys may send only a key-up or nothing, and shortcuts such as Ctrl+Alt+Delete or Alt+Tab belong to the operating system. Nothing you press is recorded or sent anywhere, and the log disappears when you leave the page.
      </Alert>
    </ToolPanel>
  );
}
