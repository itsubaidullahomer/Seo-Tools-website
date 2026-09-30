"use client";

import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Grid3x3, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  FLASH_COLORS,
  FLASH_SAFETY_MS,
  GRID_SIZES,
  buildRampPixels,
  columnName,
  gridDimensions,
  nextGrid,
  type GridSize,
  type Pattern,
  type RampChannel,
} from "./logic";

/*
 * Full-screen overlays. They are only ever rendered after the visitor clicks a
 * button (never on the server), and they are portaled to <body> so nothing on
 * the page can sit on top of them. The injected style hides every other child
 * of <body> (site header, sidebar, ad slots, anchor ads) while a test is open.
 */

const OVERLAY_ATTR = "data-screen-test-overlay";

const HIDE_PAGE_CSS = `
html, body { overflow: hidden !important; }
body > *:not([${OVERLAY_ATTR}]) { visibility: hidden !important; }
`;

interface ShellProps extends Omit<HTMLAttributes<HTMLDivElement>, "role" | "aria-label"> {
  rootRef: RefObject<HTMLDivElement | null>;
  label: string;
  cursorHidden?: boolean;
  children: ReactNode;
}

function OverlayShell({ rootRef, label, cursorHidden, className, style, children, ...rest }: ShellProps) {
  // Focus the overlay so keys work at once, and keep the screen awake while it is open.
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
    let cancelled = false;
    let sentinel: WakeLockSentinel | null = null;
    try {
      navigator.wakeLock
        ?.request("screen")
        .then((s) => {
          if (cancelled) void s.release().catch(() => {});
          else sentinel = s;
        })
        .catch(() => {
          /* refused (battery saver, permissions): the test still works */
        });
    } catch {
      /* unsupported */
    }
    return () => {
      cancelled = true;
      void sentinel?.release().catch(() => {});
    };
  }, [rootRef]);

  return createPortal(
    <div
      ref={rootRef}
      {...{ [OVERLAY_ATTR]: "" }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      className={cn("select-none overflow-hidden outline-none", className)}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 2147483000,
        touchAction: "none",
        cursor: cursorHidden ? "none" : "default",
        visibility: "visible",
        ...style,
      }}
      {...rest}
    >
      <style>{HIDE_PAGE_CSS}</style>
      {children}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Pattern rendering                                                   */
/* ------------------------------------------------------------------ */

function RampCanvas({ channels }: { channels: RampChannel[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => {
      const canvas = ref.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const width = Math.min(8192, Math.max(2, Math.round(window.innerWidth * dpr)));
      canvas.width = width;
      canvas.height = channels.length;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const image = ctx.createImageData(width, channels.length);
      image.data.set(buildRampPixels(width, channels));
      ctx.putImageData(image, 0, 0);
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [channels]);
  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" style={{ imageRendering: "pixelated" }} data-testid="ramp-canvas" />;
}

function PatternView({ pattern }: { pattern: Pattern }) {
  const kind = pattern.kind;
  if (kind.type === "solid") {
    return <div className="absolute inset-0" style={{ backgroundColor: kind.color }} data-testid="pattern" data-pattern={pattern.id} />;
  }
  if (kind.type === "steps") {
    return (
      <div className="absolute inset-0 flex" data-testid="pattern" data-pattern={pattern.id}>
        {Array.from({ length: kind.count }, (_, i) => {
          const level = kind.from + i;
          return (
            <div key={level} className="relative flex-1" style={{ backgroundColor: `rgb(${level}, ${level}, ${level})` }} data-level={level}>
              <span className="absolute inset-x-0 bottom-4 text-center font-mono text-[11px]" style={{ color: level < 128 ? "#ffffff" : "#000000", opacity: 0.7 }}>
                {level}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="absolute inset-0" data-testid="pattern" data-pattern={pattern.id}>
      <RampCanvas channels={kind.channels} />
    </div>
  );
}

/** Thin black-and-white double lines stay visible on any color, including mid-gray. */
function GridOverlay({ size }: { size: GridSize }) {
  const { cols, rows } = gridDimensions(size);
  if (!cols || !rows) return null;
  const vertical = Array.from({ length: cols - 1 }, (_, i) => ((i + 1) / cols) * 100);
  const horizontal = Array.from({ length: rows - 1 }, (_, i) => ((i + 1) / rows) * 100);
  const labelStyle = { color: "#ffffff", textShadow: "0 0 2px #000000, 0 0 2px #000000, 0 0 4px #000000" } as const;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden data-testid="grid" data-grid={size}>
      <svg className="absolute inset-0 h-full w-full" shapeRendering="crispEdges">
        {vertical.map((p) => (
          <g key={`v${p}`}>
            <line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="#000000" strokeWidth="1" />
            <line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="#ffffff" strokeWidth="1" transform="translate(1 0)" />
          </g>
        ))}
        {horizontal.map((p) => (
          <g key={`h${p}`}>
            <line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="#000000" strokeWidth="1" />
            <line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="#ffffff" strokeWidth="1" transform="translate(0 1)" />
          </g>
        ))}
      </svg>
      {Array.from({ length: cols }, (_, c) => (
        <span key={`c${c}`} className="absolute top-1 -translate-x-1/2 font-mono text-[11px] font-bold" style={{ left: `${((c + 0.5) / cols) * 100}%`, ...labelStyle }}>
          {columnName(c)}
        </span>
      ))}
      {Array.from({ length: rows }, (_, r) => (
        <span key={`r${r}`} className="absolute left-1 -translate-y-1/2 font-mono text-[11px] font-bold" style={{ top: `${((r + 0.5) / rows) * 100}%`, ...labelStyle }}>
          {r + 1}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Test overlay                                                        */
/* ------------------------------------------------------------------ */

export interface TestOverlayProps {
  patterns: Pattern[];
  startIndex: number;
  grid: GridSize;
  onGridChange: (grid: GridSize) => void;
  autoAdvanceSec: number;
  onClose: () => void;
  rootRef: RefObject<HTMLDivElement | null>;
}

interface Press {
  type: string;
  x: number;
  y: number;
  long: boolean;
  timer: number | null;
}

const LONG_PRESS_MS = 700;
const SWIPE_PX = 60;

export function TestOverlay({ patterns, startIndex, grid, onGridChange, autoAdvanceSec, onClose, rootRef }: TestOverlayProps) {
  const n = patterns.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(0, startIndex), Math.max(0, n - 1)));
  const [barVisible, setBarVisible] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);
  const barTimer = useRef<number | null>(null);
  const cursorTimer = useRef<number | null>(null);
  const pinnedRef = useRef(false);
  const press = useRef<Press | null>(null);

  const scheduleBarHide = useCallback((ms: number) => {
    if (barTimer.current !== null) window.clearTimeout(barTimer.current);
    barTimer.current = window.setTimeout(() => {
      barTimer.current = null;
      if (!pinnedRef.current) setBarVisible(false);
    }, ms);
  }, []);

  const scheduleCursorHide = useCallback(() => {
    if (cursorTimer.current !== null) window.clearTimeout(cursorTimer.current);
    cursorTimer.current = window.setTimeout(() => {
      cursorTimer.current = null;
      setCursorHidden(true);
    }, 2000);
  }, []);

  const showBar = useCallback(
    (ms: number) => {
      setBarVisible(true);
      scheduleBarHide(ms);
    },
    [scheduleBarHide],
  );

  // The bar starts visible so first-time visitors see the controls, then fades away.
  useEffect(() => {
    scheduleBarHide(4500);
    scheduleCursorHide();
    return () => {
      if (barTimer.current !== null) window.clearTimeout(barTimer.current);
      if (cursorTimer.current !== null) window.clearTimeout(cursorTimer.current);
    };
  }, [scheduleBarHide, scheduleCursorHide]);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + n) % n);
      showBar(1800);
    },
    [n, showBar],
  );

  const jump = useCallback(
    (i: number) => {
      if (i < 0 || i >= n) return;
      setIndex(i);
      showBar(1800);
    },
    [n, showBar],
  );

  const togglePin = useCallback(() => {
    const next = !pinnedRef.current;
    pinnedRef.current = next;
    setPinned(next);
    if (next) setBarVisible(true);
    else scheduleBarHide(1200);
  }, [scheduleBarHide]);

  // Optional slideshow. The shortest delay is 3 seconds, far below any flash limit.
  useEffect(() => {
    if (!autoAdvanceSec) return;
    const t = window.setTimeout(() => go(1), autoAdvanceSec * 1000);
    return () => window.clearTimeout(t);
  }, [autoAdvanceSec, index, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const onButton = e.target instanceof HTMLElement && Boolean(e.target.closest("button"));
      const key = e.key;
      let handled = true;
      if (key === "Escape") onClose();
      else if (key === "ArrowRight" || key === "ArrowDown" || key === "PageDown" || key === "n" || ((key === " " || key === "Enter") && !onButton)) go(1);
      else if (key === "ArrowLeft" || key === "ArrowUp" || key === "PageUp" || key === "Backspace" || key === "p") go(-1);
      else if (key === "Home") jump(0);
      else if (key === "End") jump(n - 1);
      else if (key === "g" || key === "G") onGridChange(nextGrid(grid));
      else if (key === "h" || key === "H" || key === "?") togglePin();
      else if (key === "Tab") {
        if (!pinnedRef.current) togglePin();
        handled = false;
      } else if (/^[1-9]$/.test(key)) jump(Number(key) - 1);
      else handled = false;
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [go, jump, onClose, onGridChange, grid, n, togglePin]);

  const clearPress = () => {
    const p = press.current;
    if (p?.timer) window.clearTimeout(p.timer);
    press.current = null;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 2) return;
    const p: Press = { type: e.pointerType, x: e.clientX, y: e.clientY, long: false, timer: null };
    if (e.pointerType === "touch") {
      p.timer = window.setTimeout(() => {
        p.long = true;
        p.timer = null;
        onClose();
      }, LONG_PRESS_MS);
    }
    press.current = p;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (p && p.type === "touch" && p.timer && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 12) {
      window.clearTimeout(p.timer);
      p.timer = null;
    }
    if (e.pointerType === "mouse") {
      setCursorHidden(false);
      showBar(2500);
      scheduleCursorHide();
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = press.current;
    clearPress();
    if (!p || p.long) return;
    if (e.pointerType === "mouse" && e.button === 2) {
      go(-1);
      return;
    }
    const dx = e.clientX - p.x;
    if (p.type === "touch" && Math.abs(dx) > SWIPE_PX) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    const leftEdge = e.clientX < window.innerWidth * 0.2;
    go(p.type === "touch" && leftEdge ? -1 : 1);
  };

  const pattern = patterns[index] ?? patterns[0];
  const gridLabel = GRID_SIZES.find((g) => g.value === grid)?.label.split(":")[0] ?? "Off";
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return (
    <OverlayShell
      rootRef={rootRef}
      label="Screen test"
      cursorHidden={cursorHidden}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={clearPress}
      onContextMenu={(e) => e.preventDefault()}
    >
      <PatternView pattern={pattern} />
      <GridOverlay size={grid} />

      <p className="sr-only" aria-live="polite" data-testid="announce">
        {`Screen ${index + 1} of ${n}: ${pattern.label}`}
      </p>

      <div
        className={cn("pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 transition-opacity duration-150", barVisible ? "opacity-100" : "opacity-0")}
        data-testid="bar"
        data-visible={barVisible}
      >
        <div
          inert={!barVisible}
          onPointerDown={stop}
          onPointerUp={stop}
          onPointerMove={stop}
          className={cn("max-w-xl rounded-xl border border-white/30 bg-black/85 p-3 text-white shadow-lg", barVisible && "pointer-events-auto")}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="font-mono text-xs text-white/70" data-testid="counter">
              {index + 1} / {n}
            </span>
            <strong className="text-sm font-semibold" data-testid="pattern-name">
              {pattern.label}
            </strong>
          </div>
          <p className="mt-1 text-xs leading-snug text-white/80">{pattern.help}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => go(-1)} leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden />}>
              Back
            </Button>
            <Button size="sm" variant="secondary" onClick={() => go(1)} rightIcon={<ChevronRight className="h-4 w-4" aria-hidden />}>
              Next
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onGridChange(nextGrid(grid))} leftIcon={<Grid3x3 className="h-4 w-4" aria-hidden />} aria-label={`Locator grid: ${gridLabel}. Press to change.`}>
              Grid: {gridLabel}
            </Button>
            <Button size="sm" variant="danger" onClick={onClose} leftIcon={<X className="h-4 w-4" aria-hidden />}>
              Exit
            </Button>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-white/60">
            Click, tap or Space: next. Right-click or left edge tap: back. G: grid. H: {pinned ? "unpin" : "pin"} this bar. Esc exits; on touch, press and hold.
          </p>
        </div>
      </div>
    </OverlayShell>
  );
}

/* ------------------------------------------------------------------ */
/* Stuck pixel flasher overlay                                         */
/* ------------------------------------------------------------------ */

export type FlashMode = "square" | "full";
export type FlashEnd = "user" | "timeout" | "hidden";

export interface FlashOverlayProps {
  mode: FlashMode;
  squareSize: number;
  intervalMs: number;
  maxSeconds: number;
  onClose: (reason: FlashEnd) => void;
  rootRef: RefObject<HTMLDivElement | null>;
}

export function FlashOverlay({ mode, squareSize, intervalMs, maxSeconds, onClose, rootRef }: FlashOverlayProps) {
  const [colorIndex, setColorIndex] = useState(0);
  const [remaining, setRemaining] = useState(maxSeconds);
  // Square center as a fraction of the viewport, so nothing here reads window while rendering.
  const [pos, setPos] = useState({ fx: 0.5, fy: 0.5 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Color changes are scheduled one at a time, each at least `gap` after the previous one, and never early,
  // so the rate stays under the cap even if a timer fires early or a render is late.
  useEffect(() => {
    const gap = intervalMs + FLASH_SAFETY_MS;
    const start = performance.now();
    let last = start;
    let index = 0;
    let changeTimer = 0;
    const step = () => {
      const now = performance.now();
      const wait = gap - (now - last);
      if (wait > 0) {
        changeTimer = window.setTimeout(step, Math.ceil(wait));
        return;
      }
      last = now;
      index = (index + 1) % FLASH_COLORS.length;
      setColorIndex(index);
      changeTimer = window.setTimeout(step, gap);
    };
    changeTimer = window.setTimeout(step, gap);
    const countdown = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil(maxSeconds - (performance.now() - start) / 1000)));
    }, 250);
    const autoStop = window.setTimeout(() => onCloseRef.current("timeout"), maxSeconds * 1000);
    const onVisibility = () => {
      if (document.hidden) onCloseRef.current("hidden");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(changeTimer);
      window.clearInterval(countdown);
      window.clearTimeout(autoStop);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, maxSeconds]);

  const half = squareSize / 2;
  const moveBy = useCallback(
    (dxPx: number, dyPx: number) => {
      setPos((p) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const x = Math.min(w - half, Math.max(half, p.fx * w + dxPx));
        const y = Math.min(h - half, Math.max(half, p.fy * h + dyPx));
        return { fx: x / w, fy: y / h };
      });
    },
    [half],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current("user");
        return;
      }
      if (mode !== "square") return;
      const step = e.shiftKey ? 1 : 10;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const m = moves[e.key];
      if (m) {
        e.preventDefault();
        moveBy(m[0], m[1]);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [mode, moveBy]);

  const color = FLASH_COLORS[colorIndex];
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  const barAtTop = mode === "full" || pos.fy > 0.5;

  const onSquareDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - pos.fx * window.innerWidth, dy: e.clientY - pos.fy * window.innerHeight };
  };
  const onSquareMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = Math.min(w - half, Math.max(half, e.clientX - d.dx));
    const y = Math.min(h - half, Math.max(half, e.clientY - d.dy));
    setPos({ fx: x / w, fy: y / h });
  };
  const onSquareUp = () => {
    drag.current = null;
  };

  return (
    <OverlayShell
      rootRef={rootRef}
      label="Stuck pixel fixer. Colors are flashing. Press Escape to stop."
      cursorHidden={false}
      style={{ backgroundColor: mode === "full" ? color : "#000000" }}
      onPointerDown={() => onClose("user")}
    >
      {mode === "square" && (
        <div
          role="presentation"
          data-testid="flash-square"
          onPointerDown={onSquareDown}
          onPointerMove={onSquareMove}
          onPointerUp={onSquareUp}
          onPointerCancel={onSquareUp}
          className="absolute cursor-move"
          style={{
            width: squareSize,
            height: squareSize,
            left: `clamp(0px, calc(${pos.fx * 100}% - ${half}px), calc(100% - ${squareSize}px))`,
            top: `clamp(0px, calc(${pos.fy * 100}% - ${half}px), calc(100% - ${squareSize}px))`,
            backgroundColor: color,
            outline: "1px solid #666666",
            outlineOffset: 2,
          }}
        />
      )}

      <div className={cn("pointer-events-none absolute inset-x-0 flex justify-center p-3", barAtTop ? "top-0" : "bottom-0")}>
        <div
          onPointerDown={stop}
          onPointerUp={stop}
          className="pointer-events-auto max-w-xl rounded-xl border border-white/30 bg-black/85 p-3 text-white shadow-lg"
          data-testid="flash-bar"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <strong className="text-sm font-semibold">Stuck pixel fixer</strong>
            <span className="font-mono text-xs text-white/80" data-testid="flash-remaining" aria-live="off">
              stops in {remaining} s
            </span>
            <Button size="sm" variant="danger" onClick={() => onClose("user")} leftIcon={<X className="h-4 w-4" aria-hidden />}>
              Stop
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-white/70">
            {mode === "square"
              ? "Drag the square over the stuck pixel, or nudge it with the arrow keys (Shift for 1 px). Press Esc or tap outside the square to stop."
              : "Press Esc or tap anywhere to stop."}
          </p>
        </div>
      </div>
    </OverlayShell>
  );
}
