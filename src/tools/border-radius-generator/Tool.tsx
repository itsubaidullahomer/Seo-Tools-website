"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Download, RotateCcw, Shuffle } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { cn, downloadText } from "@/lib/utils";
import { Alert, Button, CopyButton, Input, ResultBox, Slider, Tabs, ToolActions, ToolGrid, ToolPanel, ToolSection, Toggle } from "@/components/ui";
import {
  CORNER_NAMES,
  DEFAULT_STATE,
  LIMITS,
  PRESETS,
  atLeast,
  axisLength,
  bakeRadii,
  clampNum,
  convertUnit,
  cssFile,
  cssLonghand,
  cssShorthand,
  detectMode,
  fmtNum,
  fromPx,
  isOverlapping,
  normalizeState,
  parseBorderRadius,
  randomBlob,
  resolveRadii,
  round2,
  setRadius,
  shorthandValue,
  tailwindRows,
  valueMax,
  type Mode,
  type OutKind,
  type Preset,
  type Radii,
  type ToolState,
  type Unit,
} from "./radius";

const STORAGE_KEY = "border-radius-generator:v1";

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "all", label: "All corners" },
  { value: "corner", label: "Each corner" },
  { value: "ellipse", label: "Elliptical (8 values)" },
];

const MODE_HINT: Record<Mode, string> = {
  all: "One value controls every corner. Dragging any handle moves all eight together.",
  corner: "Each corner gets one radius, used for both its horizontal and vertical curve.",
  ellipse: "Each corner has a horizontal (x) and a vertical (y) radius. This is what the slash in border-radius describes.",
};

const UNIT_OPTIONS: { value: Unit; label: string }[] = [
  { value: "px", label: "px" },
  { value: "%", label: "%" },
];

const OUT_OPTIONS: { value: OutKind; label: string }[] = [
  { value: "css", label: "CSS" },
  { value: "longhand", label: "Longhand" },
  { value: "tailwind", label: "Tailwind" },
];

/** Direction each handle moves to increase its radius: [dx, dy]. Order matches the radii array. */
const DIR: [number, number][] = [
  [1, 0], // x top-left: right
  [-1, 0], // x top-right: left
  [-1, 0], // x bottom-right: left
  [1, 0], // x bottom-left: right
  [0, 1], // y top-left: down
  [0, 1], // y top-right: down
  [0, -1], // y bottom-right: up
  [0, -1], // y bottom-left: up
];

const SYNTAX_EXAMPLES: { value: string; note: string }[] = [
  { value: "24px", note: "One value: all four corners." },
  { value: "8px 32px", note: "Two values: top-left and bottom-right, then top-right and bottom-left." },
  { value: "0 40px 20px", note: "Three values: top-left, then top-right and bottom-left together, then bottom-right." },
  { value: "10px 40px / 20px", note: "Slash: horizontal radii first, vertical radii after it." },
];

const PAD = 32; // stage padding, leaves room for the handles outside the shape
const HANDLE_OFFSET = 14; // how far handles sit outside the edge
const MAX_STAGE_HEIGHT = 380;

const subscribeNothing = () => () => {};
const detectCornerShape = (): boolean | null =>
  typeof CSS !== "undefined" && typeof CSS.supports === "function" ? CSS.supports("corner-shape", "squircle") : false;
const serverCornerShape = (): boolean | null => null;

function joinList(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function oneDecimal(n: number): string {
  return String(Math.round(n * 10) / 10);
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

/** Number box that lets you type freely and only applies values inside the range. */
function NumberField({ label, value, min, max, onCommit }: { label: string; value: number; min: number; max: number; onCommit: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const n = draft === null ? null : Number(draft);
  const invalid = draft !== null && (draft.trim() === "" || n === null || !Number.isFinite(n) || n < min || n > max);
  return (
    <Input
      type="number"
      inputMode="numeric"
      label={label}
      suffix="px"
      min={min}
      max={max}
      className="no-spinner font-mono"
      value={draft ?? String(value)}
      error={invalid ? `Enter a number from ${min} to ${max}.` : undefined}
      onChange={(e) => {
        setDraft(e.target.value);
        const parsed = Number(e.target.value);
        if (e.target.value.trim() !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max) onCommit(Math.round(parsed));
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

function presetThumb(p: Preset): { w: number; h: number; radius: string } {
  const [bw, bh] = p.box ?? [240, 240];
  const s = 40 / Math.max(bw, bh);
  const radii = p.unit === "px" ? p.radii.map((v) => v * s) : p.radii;
  return { w: Math.round(bw * s), h: Math.round(bh * s), radius: shorthandValue(radii, p.unit) };
}

function PresetTile({ preset, onApply }: { preset: Preset; onApply: (p: Preset) => void }) {
  const t = presetThumb(preset);
  return (
    <button
      type="button"
      onClick={() => onApply(preset)}
      aria-label={`Load preset: ${preset.name}`}
      data-testid={`preset-${preset.id}`}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface p-2 text-center transition-colors hover:border-primary/60 hover:bg-surface-2"
    >
      <span className="flex h-12 w-full items-center justify-center rounded-md bg-surface-2">
        <span className="block border border-primary bg-primary-soft" style={{ width: t.w, height: t.h, borderRadius: t.radius }} />
      </span>
      <span className="truncate text-xs font-medium text-fg">{preset.name}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// The tool
// ---------------------------------------------------------------------------

export default function BorderRadiusGenerator() {
  const [stored, setStored] = usePersistentState<ToolState>(STORAGE_KEY, DEFAULT_STATE, { storage: "local" });
  const state = useMemo(() => normalizeState(stored), [stored]);
  const { mode, unit, width, height, radii, guides, squircle, out } = state;

  const [stageWidth, setStageWidth] = useState(0);
  const [activeHandle, setActiveHandle] = useState<number | null>(null);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | undefined>();
  const [importNote, setImportNote] = useState<string | undefined>();
  const dragRef = useRef<{ index: number; startX: number; startY: number; start: Radii } | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const cornerShapeSupported = useSyncExternalStore<boolean | null>(subscribeNothing, detectCornerShape, serverCornerShape);

  // Measure the stage so the shape can be scaled down on narrow screens.
  const stageRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => setStageWidth(Math.round(entries[0]?.contentRect.width ?? 0)));
    ro.observe(el);
    observerRef.current = ro;
  }, []);

  const update = (fn: (s: ToolState) => ToolState) => setStored((prev) => fn(normalizeState(prev)));
  const patch = (p: Partial<ToolState>) => update((s) => ({ ...s, ...p }));

  const resolved = useMemo(() => resolveRadii(radii, unit, width, height), [radii, unit, width, height]);
  const overlapping = isOverlapping(resolved);
  const cssRadius = shorthandValue(radii, unit);

  const scale =
    stageWidth > 0 ? Math.max(0.05, Math.min(1, (stageWidth - 2 * PAD) / width, (MAX_STAGE_HEIGHT - 2 * PAD) / height)) : 1;
  const shapeW = width * scale;
  const shapeH = height * scale;
  const stageHeight = Math.round(shapeH) + 2 * PAD;

  // ----- editing -----

  const setAt = (index: number, value: number) => patch({ radii: setRadius(radii, index, value, mode) });

  const changeUnit = (next: Unit) =>
    update((s) => {
      if (s.unit === next) return s;
      const converted = convertUnit(s.radii, s.unit, next, s.width, s.height);
      return { ...s, unit: next, radii: converted, mode: atLeast(s.mode, detectMode(converted)) };
    });

  const applyPreset = (p: Preset) => {
    patch({
      unit: p.unit,
      radii: [...p.radii],
      mode: detectMode(p.radii),
      ...(p.box ? { width: p.box[0], height: p.box[1] } : {}),
    });
    setImportError(undefined);
    setImportNote(undefined);
  };

  const applyBlob = () => patch({ unit: "%", radii: randomBlob(), mode: "ellipse" });

  const applyScaled = () => patch({ radii: bakeRadii(radii, unit, width, height) });

  const reset = () => {
    setStored(DEFAULT_STATE);
    setImportText("");
    setImportError(undefined);
    setImportNote(undefined);
  };

  const loadImport = () => {
    const r = parseBorderRadius(importText, width, height);
    if (!r.ok) {
      setImportError(r.error);
      setImportNote(undefined);
      return;
    }
    setImportError(undefined);
    setImportNote(r.note ?? "Loaded. Adjust the values with the handles or sliders.");
    patch({ unit: r.unit, radii: r.radii, mode: detectMode(r.radii) });
  };

  // ----- handles -----

  const onHandleDown = (e: PointerEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.focus();
    dragRef.current = { index, startX: e.clientX, startY: e.clientY, start: bakeRadii(radii, unit, width, height) };
    setActiveHandle(index);
  };

  const onHandleMove = (e: PointerEvent<HTMLDivElement>, index: number) => {
    const d = dragRef.current;
    if (!d || d.index !== index) return;
    const [sx, sy] = DIR[index];
    const deltaPx = ((e.clientX - d.startX) * sx + (e.clientY - d.startY) * sy) / scale;
    const change = unit === "%" ? (deltaPx / axisLength(index, width, height)) * 100 : deltaPx;
    const next = clampNum(Math.round(d.start[index] + change), 0, valueMax(mode, unit, index, width, height));
    patch({ radii: setRadius(d.start, index, next, mode) });
  };

  const onHandleUp = () => {
    dragRef.current = null;
    setActiveHandle(null);
  };

  const onHandleKey = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    const max = valueMax(mode, unit, index, width, height);
    const base = bakeRadii(radii, unit, width, height);
    const step = e.shiftKey ? 10 : 1;
    let v = base[index];
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        v += step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        v -= step;
        break;
      case "PageUp":
        v += 10;
        break;
      case "PageDown":
        v -= 10;
        break;
      case "Home":
        v = 0;
        break;
      case "End":
        v = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    patch({ radii: setRadius(base, index, clampNum(round2(v), 0, max), mode) });
  };

  // Handle centres in stage pixels (relative to the shape's top-left corner).
  const er = resolved.px.map((v) => v * scale);
  const handlePos: { left: number; top: number; edgeX: number; edgeY: number }[] = [
    { left: er[0], top: -HANDLE_OFFSET, edgeX: er[0], edgeY: 0 },
    { left: shapeW - er[1], top: -HANDLE_OFFSET, edgeX: shapeW - er[1], edgeY: 0 },
    { left: shapeW - er[2], top: shapeH + HANDLE_OFFSET, edgeX: shapeW - er[2], edgeY: shapeH },
    { left: er[3], top: shapeH + HANDLE_OFFSET, edgeX: er[3], edgeY: shapeH },
    { left: -HANDLE_OFFSET, top: er[4], edgeX: 0, edgeY: er[4] },
    { left: shapeW + HANDLE_OFFSET, top: er[5], edgeX: shapeW, edgeY: er[5] },
    { left: shapeW + HANDLE_OFFSET, top: shapeH - er[6], edgeX: shapeW, edgeY: shapeH - er[6] },
    { left: -HANDLE_OFFSET, top: shapeH - er[7], edgeX: 0, edgeY: shapeH - er[7] },
  ];
  // Corner ellipses drawn by the browser: [cx, cy, rx, ry]
  const ellipses: [number, number, number, number][] = [
    [er[0], er[4], er[0], er[4]],
    [shapeW - er[1], er[5], er[1], er[5]],
    [shapeW - er[2], shapeH - er[6], er[2], er[6]],
    [er[3], shapeH - er[7], er[3], er[7]],
  ];

  // ----- output -----

  const cssText = cssShorthand(radii, unit, squircle);
  const longhandText = cssLonghand(radii, unit, squircle);
  const twRows = tailwindRows(radii, unit, squircle);
  const mainCopy = out === "css" ? cssText : out === "longhand" ? longhandText : twRows[0].code;
  const copyLabel = out === "css" ? "Copy CSS" : out === "longhand" ? "Copy longhand CSS" : "Copy Tailwind class";

  const previewStyle: CSSProperties = {
    width,
    height,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    borderRadius: cssRadius,
    ...(squircle ? ({ cornerShape: "squircle" } as CSSProperties) : {}),
  };

  const sliders = (() => {
    const max = (i: number) => valueMax(mode, unit, i, width, height);
    if (mode === "all") {
      return (
        <Slider label="Radius, all corners" value={radii[0]} min={0} max={max(0)} step={1} onChange={(v) => setAt(0, v)} />
      );
    }
    if (mode === "corner") {
      return (
        <div className="flex flex-col gap-3.5">
          {CORNER_NAMES.map((name, c) => (
            <Slider key={name} label={`${name} radius`} value={radii[c]} min={0} max={max(c)} step={1} onChange={(v) => setAt(c, v)} />
          ))}
        </div>
      );
    }
    return (
      <div className="grid gap-x-5 gap-y-3.5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col gap-3.5">
          <p className="label-mono">Horizontal radius (x)</p>
          {CORNER_NAMES.map((name, c) => (
            <Slider key={name} label={`${name} x`} value={radii[c]} min={0} max={max(c)} step={1} onChange={(v) => setAt(c, v)} />
          ))}
        </div>
        <div className="flex flex-col gap-3.5">
          <p className="label-mono">Vertical radius (y)</p>
          {CORNER_NAMES.map((name, c) => (
            <Slider key={name} label={`${name} y`} value={radii[c + 4]} min={0} max={max(c + 4)} step={1} onChange={(v) => setAt(c + 4, v)} />
          ))}
        </div>
      </div>
    );
  })();

  const cornerReadout = ["TL", "TR", "BR", "BL"].map((label, c) => ({
    label,
    text: `${oneDecimal(resolved.px[c])} × ${oneDecimal(resolved.px[c + 4])}`,
  }));

  return (
    <ToolPanel>
      <ToolGrid>
        {/* ---------------- Preview ---------------- */}
        <div className="flex min-w-0 flex-col gap-3">
          <div
            ref={stageRef}
            role="group"
            aria-label="Shape preview with draggable radius handles"
            data-testid="stage"
            className="relative w-full overflow-hidden rounded-lg border border-border-strong bg-surface-2 bg-grid"
            style={{ height: stageHeight }}
          >
            <div className="absolute left-1/2" style={{ top: PAD, width: shapeW, height: shapeH, transform: "translateX(-50%)" }}>
              <div data-testid="shape" className="absolute left-0 top-0 border-2 border-primary bg-primary-soft" style={previewStyle} />
              <svg
                className="pointer-events-none absolute left-0 top-0 overflow-visible"
                width={shapeW}
                height={shapeH}
                viewBox={`0 0 ${shapeW} ${shapeH}`}
                aria-hidden
              >
                {handlePos.map((h, i) => (
                  <line key={`tick-${i}`} x1={h.edgeX} y1={h.edgeY} x2={h.left} y2={h.top} className="stroke-muted" strokeWidth={1} />
                ))}
                {guides &&
                  ellipses.map(([cx, cy, rx, ry], i) =>
                    rx > 0.5 && ry > 0.5 ? (
                      <ellipse key={`guide-${i}`} cx={cx} cy={cy} rx={rx} ry={ry} fill="none" className="stroke-muted" strokeWidth={1} strokeDasharray="4 3" />
                    ) : null,
                  )}
              </svg>
              {handlePos.map((h, i) => {
                const value = round2(fromPx(resolved.px[i], i, unit, width, height));
                return (
                  <div
                    key={i}
                    role="slider"
                    tabIndex={0}
                    aria-label={`${CORNER_NAMES[i % 4]} ${i < 4 ? "horizontal" : "vertical"} radius`}
                    aria-orientation={i < 4 ? "horizontal" : "vertical"}
                    aria-valuemin={0}
                    aria-valuemax={valueMax(mode, unit, i, width, height)}
                    aria-valuenow={value}
                    aria-valuetext={`${fmtNum(value)}${unit}`}
                    data-testid={`handle-${i}`}
                    onPointerDown={(ev) => onHandleDown(ev, i)}
                    onPointerMove={(ev) => onHandleMove(ev, i)}
                    onPointerUp={onHandleUp}
                    onPointerCancel={onHandleUp}
                    onKeyDown={(ev) => onHandleKey(ev, i)}
                    className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full active:cursor-grabbing"
                    style={{ left: h.left, top: h.top }}
                  >
                    <span
                      className={cn(
                        "block h-3.5 w-3.5 rounded-full border-2 border-surface shadow-sm ring-1 ring-border-strong transition-transform",
                        activeHandle === i ? "scale-125 bg-primary" : "bg-ink hover:scale-110",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <p className="label-mono -mb-1">Corner size as drawn (width × height, px)</p>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Corner sizes as drawn, width by height in pixels">
            {cornerReadout.map((c) => (
              <div key={c.label} className="rounded-lg border border-border bg-surface-2 px-2.5 py-2">
                <dt className="label-mono">{c.label}</dt>
                <dd className="font-mono text-[13px] tabular-nums text-fg" data-testid={`readout-${c.label}`}>
                  {c.text}
                </dd>
              </div>
            ))}
          </dl>
          {unit === "%" && (
            <p className="text-xs text-muted" data-testid="percent-note">
              {mode === "ellipse"
                ? `Percentages follow each side of the box: horizontal radii are a share of the ${width}px width and vertical radii a share of the ${height}px height.`
                : `Percentages follow each side of the box: ${fmtNum(radii[0])}% is ${oneDecimal((radii[0] / 100) * width)}px wide and ${oneDecimal((radii[4] / 100) * height)}px tall on a ${width} × ${height}px box${width !== height ? ", so a corner set with one % value is elliptical here." : "."}`}
            </p>
          )}
        </div>

        {/* ---------------- Controls ---------------- */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Tabs label="Corner linking" size="sm" value={mode} onChange={(m) => patch({ mode: m })} options={MODE_OPTIONS} />
            <Tabs label="Unit" size="sm" value={unit} onChange={changeUnit} options={UNIT_OPTIONS} />
          </div>
          <p className="-mt-1 text-xs text-muted">
            {MODE_HINT[mode]} Switching the unit converts the values so the shape stays the same.
          </p>

          {sliders}

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
            <NumberField label="Box width" value={width} min={LIMITS.boxMin} max={LIMITS.boxMax} onCommit={(n) => patch({ width: n })} />
            <NumberField label="Box height" value={height} min={LIMITS.boxMin} max={LIMITS.boxMax} onCommit={(n) => patch({ height: n })} />
          </div>
          <Toggle checked={guides} onChange={(g) => patch({ guides: g })} label="Show corner guides" description="Dashed ellipses show the curve each corner follows." />
        </div>
      </ToolGrid>

      {overlapping && (
        <Alert
          variant="info"
          title={`Radii overlap on the ${joinList(resolved.overlapping)} ${resolved.overlapping.length > 1 ? "edges" : "edge"}: the browser scales every radius by ${resolved.scale.toFixed(3)}`}
        >
          <p data-testid="overlap-note">
            Two neighboring radii add up to more than the side they share, so CSS shrinks all eight values by the same factor before drawing. The preview shows that scaled shape. It is also why a huge value such as 9999px gives a clean pill.
          </p>
          <Button size="sm" variant="secondary" className="mt-2" onClick={applyScaled}>
            Apply the scaled values
          </Button>
        </Alert>
      )}

      {/* ---------------- Output ---------------- */}
      <ToolSection title="Code">
        <Tabs label="Output format" size="sm" value={out} onChange={(o) => patch({ out: o })} options={OUT_OPTIONS} />

        {out === "css" && <ResultBox label="CSS" value={cssText} mono copy={false} rows={squircle ? 3 : 2} />}
        {out === "longhand" && <ResultBox label="CSS (longhand)" value={longhandText} mono copy={false} rows={squircle ? 5 : 4} />}
        {out === "tailwind" && (
          <div className="flex flex-col gap-2.5" data-testid="tailwind-rows">
            {twRows.map((row) => (
              <div key={row.label} className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface-2 p-3">
                <span className="label-mono">{row.label}</span>
                {row.code ? (
                  <div className="flex items-start justify-between gap-3">
                    <code className="min-w-0 break-all font-mono text-[13px] text-fg" data-testid="tailwind-code">
                      {row.code}
                    </code>
                    <CopyButton text={row.code} size="sm" variant="secondary" />
                  </div>
                ) : null}
                {row.note && <p className="text-xs text-muted">{row.note}</p>}
              </div>
            ))}
            <p className="text-xs text-muted">Class names use the default theme of Tailwind CSS v4. Version 3 calls the 2px step rounded-sm and the 4px step plain rounded.</p>
          </div>
        )}

        <ToolActions>
          <CopyButton text={mainCopy} label={copyLabel} variant="accent" />
          {out !== "tailwind" && (
            <Button
              variant="secondary"
              leftIcon={<Download className="h-4 w-4" aria-hidden />}
              onClick={() => downloadText(cssFile(out === "css" ? cssText : longhandText), "border-radius.css", "text/css;charset=utf-8")}
            >
              Download .css
            </Button>
          )}
          <Button variant="ghost" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={reset}>
            Reset
          </Button>
        </ToolActions>

        <Toggle
          checked={squircle}
          onChange={(s) => patch({ squircle: s })}
          label="Add corner-shape: squircle"
          description="border-radius can only draw circular or elliptical arcs, so it cannot make a true squircle. corner-shape can, but only some browsers support it."
        />
        {squircle && (
          <Alert variant="info" title="corner-shape support is limited">
            <p data-testid="squircle-note">
              At the last check (June 2026) corner-shape worked in Chrome and Edge 139 and later, and not in Firefox or Safari. Browsers that do not know it ignore the line and draw the normal rounded corner. Check MDN or caniuse for the current status.{" "}
              {cornerShapeSupported === null
                ? ""
                : cornerShapeSupported
                  ? "Your browser supports it, so the preview shows the squircle."
                  : "Your browser does not support it, so the preview shows the normal rounded corner."}
            </p>
          </Alert>
        )}
      </ToolSection>
      {/* ---------------- Presets ---------------- */}
      <ToolSection title="Presets" description="Start from a shape, then fine-tune it. Some presets also set a matching box size.">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          {PRESETS.map((p) => (
            <PresetTile key={p.id} preset={p} onApply={applyPreset} />
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <Button variant="secondary" leftIcon={<Shuffle className="h-4 w-4" aria-hidden />} onClick={applyBlob} className="sm:mt-[1.6rem]">
            Random blob
          </Button>
          <Input
            label="Load existing CSS or a Tailwind class"
            hint={importNote ?? "Paste a border-radius declaration, the four longhand lines, a bare value or rounded-[...] to edit it visually."}
            error={importError}
            value={importText}
            placeholder="border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%"
            spellCheck={false}
            autoComplete="off"
            className="font-mono"
            containerClassName="min-w-0 flex-1"
            onChange={(ev) => setImportText(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") loadImport();
            }}
          />
          <Button variant="secondary" onClick={loadImport} className="sm:mt-[1.6rem]">
            Load values
          </Button>
        </div>
      </ToolSection>


      {/* ---------------- Syntax reference ---------------- */}
      <ToolSection title="Syntax at a glance" description="How one to four values, and the slash, are read. Each shape is drawn by your browser on a 120 × 72 box.">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {SYNTAX_EXAMPLES.map((ex) => (
            <div key={ex.value} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
              <span className="flex h-24 items-center justify-center rounded-md bg-surface-2">
                <span className="block h-[72px] w-[120px] border border-primary bg-primary-soft" style={{ borderRadius: ex.value }} />
              </span>
              <code className="break-words font-mono text-[13px] text-fg">{ex.value}</code>
              <span className="text-xs text-muted">{ex.note}</span>
            </div>
          ))}
        </div>
      </ToolSection>
    </ToolPanel>
  );
}
