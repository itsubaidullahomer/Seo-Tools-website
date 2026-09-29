"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Download, Eye, EyeOff, Plus, RotateCcw, Trash2 } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { cn, downloadText } from "@/lib/utils";
import { Alert, Badge, Button, CopyButton, Input, ResultBox, Slider, Tabs, ToolActions, ToolPanel, ToolSection, Toggle } from "@/components/ui";
import { formatColor, parseColor, readableInk, round, toHex6, toSrgb, type Color, type ColorFormat } from "./color";
import {
  DEFAULT_CARD,
  DEFAULT_STATE,
  LIMITS,
  NEW_LAYER,
  PRESETS,
  SMOOTH_LIMITS,
  analyze,
  buildOutput,
  fmtLen,
  nextLayerId,
  normalizeState,
  sanitizeName,
  sanitizeSmooth,
  shadowValue,
  smoothShadow,
  usableLayers,
  withIds,
  type LayerSpec,
  type OutputKind,
  type Preset,
  type PreviewMode,
  type ShadowLayer,
  type SmoothSettings,
  type ToolState,
} from "./shadow";

const STORAGE_KEY = "box-shadow-generator:v1";

type Pane = "layers" | "smooth" | "card";

const PANE_OPTIONS: { value: Pane; label: string }[] = [
  { value: "layers", label: "Layers" },
  { value: "smooth", label: "Smooth generator" },
  { value: "card", label: "Preview card" },
];

const PREVIEW_OPTIONS: { value: PreviewMode; label: string }[] = [
  { value: "both", label: "Light + dark" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const FORMAT_OPTIONS: { value: ColorFormat; label: string }[] = [
  { value: "rgb", label: "RGB" },
  { value: "hex", label: "HEX" },
  { value: "hsl", label: "HSL" },
  { value: "oklch", label: "OKLCH" },
];

const OUTPUT_OPTIONS: { value: OutputKind; label: string }[] = [
  { value: "css", label: "CSS" },
  { value: "variable", label: "Variable" },
  { value: "tailwind", label: "Tailwind" },
  { value: "theme", label: "Theme" },
];

const OUTPUT_META: Record<OutputKind, { label: string; copy: string; file: string; mime: string; hint: string }> = {
  css: {
    label: "CSS",
    copy: "Copy CSS",
    file: "box-shadow.css",
    mime: "text/css;charset=utf-8",
    hint: "Paste the declaration into any rule. Vendor prefixes are not needed in current browsers.",
  },
  variable: {
    label: "CSS custom property",
    copy: "Copy variable",
    file: "shadow-variable.css",
    mime: "text/css;charset=utf-8",
    hint: "Define the shadow once as a token and reuse it with var(). Override the variable in a dark theme scope.",
  },
  tailwind: {
    label: "Tailwind arbitrary value",
    copy: "Copy class",
    file: "shadow-class.txt",
    mime: "text/plain;charset=utf-8",
    hint: "Underscores stand for spaces. Tailwind's shadow color utilities replace the color of every layer, so per-layer opacity is lost when you use them.",
  },
  theme: {
    label: "Tailwind v4 theme",
    copy: "Copy theme",
    file: "shadow-theme.css",
    mime: "text/css;charset=utf-8",
    hint: "Place this in your main CSS file after the Tailwind import to get a reusable shadow utility.",
  },
};

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function layerSummary(l: LayerSpec): string {
  const parts = [fmtLen(l.x), fmtLen(l.y), fmtLen(l.blur)];
  if (l.spread !== 0) parts.push(fmtLen(l.spread));
  return `${l.inset ? "inset " : ""}${parts.join(" ")}`;
}

function opaque(c: Color): string {
  return formatColor({ ...c, a: 1 }, "rgb");
}

const WHITE: Color = { l: 1, c: 0, h: 0, a: 1 };

/** Colour for a stored six-digit hex value (card and background settings). */
function hexColor(hex: string): Color {
  const p = parseColor(hex);
  return p.ok ? p.color : WHITE;
}

interface ColorControlProps {
  label: string;
  color: Color;
  format: ColorFormat;
  onChange: (color: Color) => void;
  /** Show the RGB / HEX / HSL / OKLCH switch. */
  onFormatChange?: (format: ColorFormat) => void;
  /** Show lightness, chroma and hue sliders when the format is OKLCH. */
  sliders?: boolean;
}

/**
 * Colour picker, text field and (for OKLCH) sliders. Text is applied live; an
 * opacity typed as part of a HEX value is applied on blur or Enter so that
 * partial input such as "#0f17" cannot overwrite the opacity slider.
 */
function ColorControl({ label, color, format, onChange, onFormatChange, sliders = true }: ColorControlProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const parsed = draft !== null ? parseColor(draft) : null;
  const error = parsed && !parsed.ok ? parsed.error : undefined;
  const text = draft ?? formatColor(color, format, { alpha: false });
  const srgb = toSrgb(color);

  const commit = () => {
    if (draft !== null) {
      const p = parseColor(draft);
      if (p.ok && p.hasAlpha) onChange(p.color);
    }
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
        </label>
        {onFormatChange && <Tabs size="sm" label="Color format" value={format} onChange={onFormatChange} options={FORMAT_OPTIONS} />}
      </div>
      <div className="flex items-start gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={toHex6(color)}
          onChange={(e) => {
            const p = parseColor(e.target.value);
            if (p.ok) onChange({ ...p.color, a: color.a });
            setDraft(null);
          }}
          className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-border-strong bg-surface p-1"
        />
        <Input
          id={id}
          value={text}
          spellCheck={false}
          autoComplete="off"
          className="font-mono"
          containerClassName="min-w-0 flex-1"
          error={error}
          onChange={(e) => {
            const value = e.target.value;
            setDraft(value);
            const p = parseColor(value);
            if (!p.ok) return;
            const hexLike = /^#?[0-9a-f]+$/i.test(value.trim());
            onChange({ ...p.color, a: p.hasAlpha && !hexLike ? p.color.a : color.a });
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
        />
      </div>
      {format === "oklch" && sliders && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3">
          <Slider label="Lightness (%)" value={round(color.l * 100, 1)} min={0} max={100} step={0.1} onChange={(v) => onChange({ ...color, l: v / 100 })} />
          <Slider label="Chroma" value={round(color.c, 3)} min={0} max={0.4} step={0.001} onChange={(v) => onChange({ ...color, c: v })} />
          <Slider label="Hue (degrees)" value={round(color.h, 1)} min={0} max={360} step={1} onChange={(v) => onChange({ ...color, h: v })} />
        </div>
      )}
      {!srgb.inGamut && (
        <p className="text-xs text-warning">
          This color is outside the sRGB range. HEX, RGB and HSL output use the closest in-range color and the preview shows it; OKLCH output keeps your exact values.
        </p>
      )}
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Button variant="ghost" size="sm" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="h-8 w-8 shrink-0 px-0">
      {children}
    </Button>
  );
}

function inkRgba(ink: "dark" | "light", alpha: number): string {
  return ink === "dark" ? `rgba(17, 24, 39, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
}

interface StageProps {
  theme: "light" | "dark";
  bg: string;
  cardBg: string;
  width: number;
  height: number;
  radius: number;
  shadow: string;
}

function Stage({ theme, bg, cardBg, width, height, radius, shadow }: StageProps) {
  const parsed = parseColor(cardBg);
  const ink = parsed.ok ? readableInk(parsed.color) : "dark";
  return (
    <div
      data-testid={`stage-${theme}`}
      className="relative flex min-h-[160px] items-center justify-center overflow-hidden rounded-lg border border-border-strong p-3 pt-8 sm:min-h-[260px] sm:p-6"
      style={{ background: bg }}
    >
      <Badge className="absolute left-2 top-2 z-10">{theme === "light" ? "Light" : "Dark"}</Badge>
      <div
        data-testid={`card-${theme}`}
        className="flex flex-col justify-center gap-2.5 overflow-hidden px-5"
        style={{ width, maxWidth: "100%", height, borderRadius: radius, background: cardBg, boxShadow: shadow }}
      >
        <span className="block h-2.5 w-2/5 rounded-full" style={{ background: inkRgba(ink, 0.8) }} />
        <span className="block h-2 w-4/5 rounded-full" style={{ background: inkRgba(ink, 0.22) }} />
        <span className="block h-2 w-3/5 rounded-full" style={{ background: inkRgba(ink, 0.22) }} />
      </div>
    </div>
  );
}

function PresetTile({ preset, onApply, cardLight, bgLight }: { preset: Preset; onApply: (p: Preset) => void; cardLight: string; bgLight: string }) {
  const bg = preset.card?.lightBg ?? bgLight;
  const cardBg = preset.card?.lightCard ?? cardLight;
  return (
    <button
      type="button"
      onClick={() => onApply(preset)}
      aria-label={`Load preset: ${preset.name}`}
      data-testid={`preset-${preset.id}`}
      className="flex w-[6.25rem] shrink-0 flex-col gap-1.5 rounded-lg border border-border bg-surface p-1.5 text-left transition-colors hover:border-primary/60 hover:bg-surface-2 xl:w-auto"
    >
      <span className="flex h-16 items-center justify-center overflow-hidden rounded-md border border-border" style={{ background: bg }}>
        <span className="block h-8 w-11" style={{ borderRadius: 8, background: cardBg, boxShadow: shadowValue(preset.layers, "rgb") }} />
      </span>
      <span className="truncate px-0.5 text-xs font-medium text-fg">{preset.name}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// The tool
// ---------------------------------------------------------------------------

export default function BoxShadowGenerator() {
  const [stored, setStored] = usePersistentState<ToolState>(STORAGE_KEY, DEFAULT_STATE);
  const state = useMemo(() => normalizeState(stored), [stored]);
  const [pane, setPane] = useState<Pane>("layers");
  const [outKind, setOutKind] = useState<OutputKind>("css");

  const update = (fn: (s: ToolState) => ToolState) => setStored((prev) => fn(normalizeState(prev)));
  const patch = (p: Partial<ToolState>) => update((s) => ({ ...s, ...p }));

  const { layers, activeId, format, card, smooth } = state;
  const active = layers.find((l) => l.id === activeId) ?? null;
  const atCap = layers.length >= LIMITS.maxLayers;

  const updateLayer = (id: string, p: Partial<LayerSpec>) =>
    update((s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? { ...l, ...p } : l)) }));

  const addLayer = () =>
    update((s) => {
      if (s.layers.length >= LIMITS.maxLayers) return s;
      const id = nextLayerId(s.layers);
      return { ...s, layers: [...s.layers, { ...NEW_LAYER, id }], activeId: id };
    });

  const duplicateLayer = (id: string) =>
    update((s) => {
      if (s.layers.length >= LIMITS.maxLayers) return s;
      const idx = s.layers.findIndex((l) => l.id === id);
      if (idx < 0) return s;
      const copy: ShadowLayer = { ...s.layers[idx], id: nextLayerId(s.layers) };
      const next = [...s.layers.slice(0, idx + 1), copy, ...s.layers.slice(idx + 1)];
      return { ...s, layers: next, activeId: copy.id };
    });

  const removeLayer = (id: string) =>
    update((s) => {
      const idx = s.layers.findIndex((l) => l.id === id);
      if (idx < 0) return s;
      const next = s.layers.filter((l) => l.id !== id);
      const activeId = s.activeId === id ? (next[Math.min(idx, next.length - 1)]?.id ?? "") : s.activeId;
      return { ...s, layers: next, activeId };
    });

  const moveLayer = (id: string, dir: -1 | 1) =>
    update((s) => {
      const idx = s.layers.findIndex((l) => l.id === id);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= s.layers.length) return s;
      const next = [...s.layers];
      [next[idx], next[to]] = [next[to], next[idx]];
      return { ...s, layers: next };
    });

  const updateSmooth = (p: Partial<SmoothSettings>) =>
    update((s) => {
      const nextSmooth = sanitizeSmooth({ ...s.smooth, ...p });
      const nextLayers = withIds(smoothShadow(nextSmooth), "s");
      return { ...s, smooth: nextSmooth, layers: nextLayers, activeId: nextLayers[nextLayers.length - 1].id };
    });

  const applyPreset = (preset: Preset) => {
    update((s) => {
      const nextLayers = withIds(preset.layers, "p");
      // A preset that ships its own surface colors (neumorphic) must not leave them behind for the next one.
      const wasSurfacePreset = PRESETS.some((q) => q.card && s.card.lightBg === q.card.lightBg && s.card.lightCard === q.card.lightCard);
      const base = wasSurfacePreset ? { ...s.card, lightBg: DEFAULT_CARD.lightBg, lightCard: DEFAULT_CARD.lightCard, radius: DEFAULT_CARD.radius } : s.card;
      return { ...s, layers: nextLayers, activeId: nextLayers[0]?.id ?? "", card: preset.card ? { ...base, ...preset.card } : base };
    });
    setPane("layers");
  };

  const updateCard = (p: Partial<ToolState["card"]>) => update((s) => ({ ...s, card: { ...s.card, ...p } }));

  const shadow = useMemo(() => shadowValue(layers, "rgb"), [layers]);
  const output = useMemo(() => buildOutput(outKind, layers, format, state.multiline, state.name), [outKind, layers, format, state.multiline, state.name]);
  const notes = useMemo(() => analyze(layers), [layers]);
  const outMeta = OUTPUT_META[outKind];
  const outRows = Math.min(14, Math.max(3, output.split("\n").length));
  const usable = usableLayers(smooth.elevation, smooth.layers);

  const showLight = state.preview !== "dark";
  const showDark = state.preview !== "light";

  return (
    <ToolPanel>
      {/* Presets */}
      <section aria-labelledby="bsg-presets" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 id="bsg-presets" className="label-mono">
            Presets
          </h2>
          <span className="text-xs text-muted">Click one to load it into the editor</span>
        </div>
        <div className="scroll-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5 xl:grid xl:grid-cols-8 xl:overflow-visible xl:pb-0">
          {PRESETS.map((p) => (
            <PresetTile key={p.id} preset={p} onApply={applyPreset} cardLight={DEFAULT_CARD.lightCard} bgLight={DEFAULT_CARD.lightBg} />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-5 border-t border-border pt-5 xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:grid-rows-[auto_1fr] xl:gap-x-6">
        {/* Preview */}
        <section
          aria-labelledby="bsg-preview"
          className="flex min-w-0 flex-col gap-3 max-xl:sticky max-xl:top-[3.75rem] max-xl:z-20 max-xl:-mx-1 max-xl:rounded-lg max-xl:border-b max-xl:border-border max-xl:bg-surface max-xl:px-1 max-xl:pb-3 max-xl:pt-2 xl:col-start-2 xl:row-start-1"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="bsg-preview" className="label-mono">
              Live preview
            </h2>
            <Tabs size="sm" label="Preview background" value={state.preview} onChange={(v) => patch({ preview: v })} options={PREVIEW_OPTIONS} />
          </div>
          <div className={cn("grid gap-2 sm:gap-3", state.preview === "both" && "grid-cols-2")}>
            {showLight && (
              <Stage theme="light" bg={card.lightBg} cardBg={card.lightCard} width={card.width} height={card.height} radius={card.radius} shadow={shadow} />
            )}
            {showDark && (
              <Stage theme="dark" bg={card.darkBg} cardBg={card.darkCard} width={card.width} height={card.height} radius={card.radius} shadow={shadow} />
            )}
          </div>
          {showDark && <p className="text-xs text-muted max-xl:hidden">Both stages use the same shadow. Shadows fade on dark surfaces, so check the dark stage before you ship.</p>}
        </section>

        {/* Controls */}
        <section aria-label="Shadow controls" className="flex min-w-0 flex-col gap-4 xl:col-start-1 xl:row-span-2 xl:row-start-1">
          <Tabs label="Editor section" value={pane} onChange={setPane} options={PANE_OPTIONS} />

          {pane === "layers" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-fg">
                    Layers{" "}
                    <span className="font-mono text-xs font-normal text-muted" data-testid="layer-count">
                      {layers.length}/{LIMITS.maxLayers}
                    </span>
                  </h3>
                  <p className="text-xs text-muted">Layer 1 is painted on top of the others.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={addLayer} disabled={atCap} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
                  Add layer
                </Button>
              </div>

              {layers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-strong bg-surface-2 px-3 py-6 text-center text-sm text-muted">
                  No layers, so the output is <code className="font-mono">box-shadow: none</code>. Add a layer or load a preset.
                </div>
              ) : (
                <ul className="flex flex-col gap-1.5" aria-label="Shadow layers">
                  {layers.map((l, i) => {
                    const isActive = l.id === activeId;
                    return (
                      <li
                        key={l.id}
                        data-testid="layer-row"
                        className={cn(
                          "flex flex-wrap items-center gap-0.5 rounded-lg border p-1 sm:flex-nowrap",
                          isActive ? "border-primary bg-primary-soft" : "border-border bg-surface-2",
                          !l.visible && "opacity-60",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => patch({ activeId: l.id })}
                          aria-current={isActive ? "true" : undefined}
                          aria-label={`Edit layer ${i + 1}`}
                          className="flex min-w-0 basis-full items-center gap-2 rounded-md px-1.5 py-1 text-left sm:flex-1 sm:basis-0"
                        >
                          <span className="h-5 w-5 shrink-0 rounded border border-border-strong" style={{ background: opaque(l.color) }} aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-mono text-xs text-fg">{layerSummary(l)}</span>
                            <span className="label-mono block">
                              Layer {i + 1} · {round(l.color.a * 100, 1)}%{l.inset ? " · inset" : ""}
                            </span>
                          </span>
                        </button>
                        <div className="flex w-full justify-end gap-0.5 sm:w-auto">
                          <IconButton label={l.visible ? `Hide layer ${i + 1}` : `Show layer ${i + 1}`} onClick={() => updateLayer(l.id, { visible: !l.visible })}>
                            {l.visible ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
                          </IconButton>
                          <IconButton label={`Move layer ${i + 1} up`} onClick={() => moveLayer(l.id, -1)} disabled={i === 0}>
                            <ArrowUp className="h-4 w-4" aria-hidden />
                          </IconButton>
                          <IconButton label={`Move layer ${i + 1} down`} onClick={() => moveLayer(l.id, 1)} disabled={i === layers.length - 1}>
                            <ArrowDown className="h-4 w-4" aria-hidden />
                          </IconButton>
                          <IconButton label={`Duplicate layer ${i + 1}`} onClick={() => duplicateLayer(l.id)} disabled={atCap}>
                            <Copy className="h-4 w-4" aria-hidden />
                          </IconButton>
                          <IconButton label={`Delete layer ${i + 1}`} onClick={() => removeLayer(l.id)}>
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </IconButton>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {atCap && <p className="text-xs text-muted">You have reached the limit of {LIMITS.maxLayers} layers. Delete one to add another.</p>}

              {active && (
                <ToolSection title={`Edit layer ${layers.indexOf(active) + 1}`} className="gap-4">
                  <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                    <Slider label="X offset (px)" value={active.x} min={-LIMITS.offset} max={LIMITS.offset} onChange={(v) => updateLayer(active.id, { x: v })} />
                    <Slider label="Y offset (px)" value={active.y} min={-LIMITS.offset} max={LIMITS.offset} onChange={(v) => updateLayer(active.id, { y: v })} />
                    <Slider label="Blur (px)" value={active.blur} min={0} max={LIMITS.blur} onChange={(v) => updateLayer(active.id, { blur: v })} />
                    <Slider label="Spread (px)" value={active.spread} min={-LIMITS.spread} max={LIMITS.spread} onChange={(v) => updateLayer(active.id, { spread: v })} />
                  </div>
                  <Toggle
                    label="Inset"
                    description="Draw the shadow inside the box instead of outside it."
                    checked={active.inset}
                    onChange={(v) => updateLayer(active.id, { inset: v })}
                  />
                  <ColorControl
                    key={active.id}
                    label="Shadow color"
                    color={active.color}
                    format={format}
                    onFormatChange={(f) => patch({ format: f })}
                    onChange={(c) => updateLayer(active.id, { color: c })}
                  />
                  <Slider
                    label="Opacity (%)"
                    value={round(active.color.a * 100, 1)}
                    min={0}
                    max={100}
                    onChange={(v) => updateLayer(active.id, { color: { ...active.color, a: v / 100 } })}
                  />
                </ToolSection>
              )}
            </div>
          )}

          {pane === "smooth" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-fg-secondary">
                Builds a stack of layers that each get bigger and softer than the last, with the opacity shared between them. Moving a control rebuilds the layer stack;
                switch to <strong>Layers</strong> afterwards to fine-tune it.
              </p>
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <Slider label="Elevation" value={smooth.elevation} min={SMOOTH_LIMITS.elevation[0]} max={SMOOTH_LIMITS.elevation[1]} onChange={(v) => updateSmooth({ elevation: v })} />
                <Slider label="Layers" value={smooth.layers} min={SMOOTH_LIMITS.layers[0]} max={SMOOTH_LIMITS.layers[1]} onChange={(v) => updateSmooth({ layers: v })} />
                <Slider label="Total opacity (%)" value={smooth.opacity} min={SMOOTH_LIMITS.opacity[0]} max={SMOOTH_LIMITS.opacity[1]} onChange={(v) => updateSmooth({ opacity: v })} />
                <Slider label="Softness" value={smooth.softness} min={SMOOTH_LIMITS.softness[0]} max={SMOOTH_LIMITS.softness[1]} step={0.1} onChange={(v) => updateSmooth({ softness: v })} />
                <Slider label="Light lean (%)" value={smooth.lean} min={SMOOTH_LIMITS.lean[0]} max={SMOOTH_LIMITS.lean[1]} onChange={(v) => updateSmooth({ lean: v })} />
                <Slider label="Edge tuck (%)" value={smooth.tuck} min={SMOOTH_LIMITS.tuck[0]} max={SMOOTH_LIMITS.tuck[1]} onChange={(v) => updateSmooth({ tuck: v })} />
              </div>
              <p className="text-xs text-muted" data-testid="smooth-note">
                {usable < smooth.layers
                  ? `At elevation ${smooth.elevation} only ${usable} distinct layers fit, so ${usable} are used. Raise the elevation to use more.`
                  : `${usable} layers used. Softness is blur radius divided by offset. Light lean shifts every layer sideways by that percentage of its vertical offset. Edge tuck pulls larger layers inward with negative spread.`}
              </p>
              <ColorControl
                key="smooth-color"
                label="Shadow color"
                color={smooth.color}
                format={format}
                onFormatChange={(f) => patch({ format: f })}
                onChange={(c) => updateSmooth({ color: { ...c, a: 1 } })}
              />
              <ToolActions>
                <Button variant="secondary" size="sm" onClick={() => updateSmooth({})}>
                  Rebuild layers from these settings
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPane("layers")}>
                  Edit layers
                </Button>
              </ToolActions>
            </div>
          )}

          {pane === "card" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-fg-secondary">Shape the sample card and the two backgrounds to match your design. Wider cards shrink to fit a narrow stage.</p>
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <Slider label="Card width (px)" value={card.width} min={60} max={320} onChange={(v) => updateCard({ width: v })} />
                <Slider label="Card height (px)" value={card.height} min={40} max={300} onChange={(v) => updateCard({ height: v })} />
                <Slider label="Radius (px)" value={card.radius} min={0} max={120} onChange={(v) => updateCard({ radius: v })} />
              </div>
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <ColorControl label="Light background" color={hexColor(card.lightBg)} format="hex" onChange={(c) => updateCard({ lightBg: toHex6(c) })} />
                <ColorControl label="Light card" color={hexColor(card.lightCard)} format="hex" onChange={(c) => updateCard({ lightCard: toHex6(c) })} />
                <ColorControl label="Dark background" color={hexColor(card.darkBg)} format="hex" onChange={(c) => updateCard({ darkBg: toHex6(c) })} />
                <ColorControl label="Dark card" color={hexColor(card.darkCard)} format="hex" onChange={(c) => updateCard({ darkCard: toHex6(c) })} />
              </div>
              <ToolActions>
                <Button variant="secondary" size="sm" onClick={() => patch({ card: DEFAULT_CARD })} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
                  Reset card
                </Button>
              </ToolActions>
            </div>
          )}
        </section>

        {/* Code */}
        <section aria-labelledby="bsg-code" className="flex min-w-0 flex-col gap-3 xl:col-start-2 xl:row-start-2 xl:self-start">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="bsg-code" className="label-mono">
              Code
            </h2>
            <Tabs size="sm" label="Output type" value={outKind} onChange={setOutKind} options={OUTPUT_OPTIONS} />
          </div>

          {notes.map((n) => (
            <Alert key={n.text} variant={n.level === "warning" ? "warning" : "info"}>
              {n.text}
            </Alert>
          ))}

          <ResultBox label={outMeta.label} value={output} mono copy={false} rows={outRows} />
          <p className="text-xs text-muted">{outMeta.hint}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-fg">Color format</span>
              <Tabs size="sm" label="Output color format" value={format} onChange={(f) => patch({ format: f })} options={FORMAT_OPTIONS} className="self-start" />
            </div>
            <Toggle
              label="Multi-line output"
              description="Put each layer on its own line."
              checked={state.multiline}
              onChange={(v) => patch({ multiline: v })}
              className="sm:justify-self-end"
            />
          </div>

          {(outKind === "variable" || outKind === "theme") && (
            <Input
              label="Token name"
              prefix="--shadow-"
              className="pl-[4.75rem] font-mono"
              value={state.name}
              spellCheck={false}
              autoComplete="off"
              hint={`Becomes --shadow-${sanitizeName(state.name)}`}
              onChange={(e) => patch({ name: e.target.value })}
            />
          )}

          <ToolActions>
            <CopyButton variant="accent" text={output} label={outMeta.copy} />
            <Button variant="secondary" onClick={() => downloadText(output, outMeta.file, outMeta.mime)} leftIcon={<Download className="h-4 w-4" aria-hidden />}>
              Download
            </Button>
            <Button variant="ghost" onClick={() => setStored(DEFAULT_STATE)} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
              Reset tool
            </Button>
          </ToolActions>
        </section>
      </div>
    </ToolPanel>
  );
}
