"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Check, Copy, Download, FileArchive, RotateCcw, Trash2, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, Checkbox, FileDropzone, Input, Select, Slider, Stat, StatGrid, Tabs, Textarea, Toggle, ToolActions, ToolGrid, ToolPanel } from "@/components/ui";
import { downloadBlob, formatBytes, formatNumber } from "@/lib/utils";
import { processJob, type ConvertOptions } from "./convert";
import { ConversionStore, type Row } from "./store";
import { MAX_BATCH_BYTES, MAX_FILES, outputFileName, parseDimension, printToPixels, uniqueName, type Sizing } from "./svg";

type Format = "png" | "jpg";
type Mode = "scale" | "exact";
type Driver = "width" | "height";
type PreviewBg = "checker" | "paper" | "ink";
type InputTab = "upload" | "code";

interface Settings {
  format: Format;
  mode: Mode;
  scale: number;
  width: string;
  height: string;
  /** Keep the image's own proportions; `driver` says which field is the one you typed. */
  lock: boolean;
  driver: Driver;
  fill: boolean;
  color: string;
  /** JPEG quality, 50 to 100. */
  quality: number;
  dpi: string;
  preview: PreviewBg;
}

const DEFAULTS: Settings = {
  format: "png",
  mode: "scale",
  scale: 2,
  width: "512",
  height: "512",
  lock: true,
  driver: "width",
  fill: false,
  color: "#ffffff",
  quality: 92,
  dpi: "",
  preview: "checker",
};

const DPI_VALUES = ["", "72", "96", "150", "300", "600"];
const PRESETS = [16, 32, 48, 64, 128, 180, 192, 256, 512, 1024];
const SCALES = [1, 2, 3, 4, 6, 8];
const NO_ROWS: Row[] = [];
const DIM_ERROR = "Enter a whole number of pixels from 1 to 1,000,000.";

const EXAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff6a00"/>
      <stop offset="1" stop-color="#ffb347"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="52" fill="url(#g)"/>
  <path d="M38 62l16 16 30-36" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Stored settings may be missing, hand-edited or from an older version: rebuild them field by field. */
function parseSettings(raw: string): Settings {
  try {
    const v = JSON.parse(raw) as Partial<Settings> | null;
    const digits = (x: unknown, fallback: string) => (typeof x === "string" && /^\d{1,7}$/.test(x) ? x : fallback);
    const scale = typeof v?.scale === "number" && Number.isFinite(v.scale) ? Math.min(8, Math.max(1, Math.round(v.scale * 4) / 4)) : DEFAULTS.scale;
    const quality = typeof v?.quality === "number" && Number.isFinite(v.quality) ? Math.min(100, Math.max(50, Math.round(v.quality))) : DEFAULTS.quality;
    return {
      format: v?.format === "jpg" ? "jpg" : "png",
      mode: v?.mode === "exact" ? "exact" : "scale",
      scale,
      width: digits(v?.width, DEFAULTS.width),
      height: digits(v?.height, DEFAULTS.height),
      lock: v?.lock !== false,
      driver: v?.driver === "height" ? "height" : "width",
      fill: v?.fill === true,
      color: typeof v?.color === "string" && /^#[0-9a-fA-F]{6}$/.test(v.color) ? v.color.toLowerCase() : DEFAULTS.color,
      quality,
      dpi: typeof v?.dpi === "string" && DPI_VALUES.includes(v.dpi) ? v.dpi : "",
      preview: v?.preview === "paper" || v?.preview === "ink" ? v.preview : "checker",
    };
  } catch {
    return DEFAULTS;
  }
}

/** Checkerboard behind previews so transparent pixels are visible (uses theme tokens only). */
const CHECKER: CSSProperties = {
  backgroundImage: "conic-gradient(var(--surface-3) 25%, transparent 0 50%, var(--surface-3) 0 75%, transparent 0)",
  backgroundSize: "12px 12px",
};

const fmtPx = (n: number) => formatNumber(Number.isInteger(n) ? n : Math.round(n * 100) / 100);

function CopyImageButton({ blob }: { blob: Blob }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(t);
  }, [state]);

  const copy = async () => {
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) throw new Error("unsupported");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setState("copied");
    } catch {
      setState("error");
    }
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={copy}
      aria-live="polite"
      leftIcon={state === "copied" ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
    >
      {state === "copied" ? "Copied!" : state === "error" ? "Copy not supported" : "Copy image"}
    </Button>
  );
}

function RowCard({ row, outName, preview, onRemove, onRetry }: { row: Row; outName: string; preview: PreviewBg; onRemove: () => void; onRetry: () => void }) {
  const busy = row.status === "queued" || row.status === "working";
  const src = row.parsed?.size;
  const fmt = row.outFormat;
  const sourceLine = [src ? `SVG ${fmtPx(src.width)} × ${fmtPx(src.height)} px` : "SVG", formatBytes(row.size)].join(" · ");
  const outLine =
    row.out && row.plan && fmt
      ? [`${fmt.toUpperCase()} ${formatNumber(row.plan.width)} × ${formatNumber(row.plan.height)} px`, formatBytes(row.out.size)].join(" · ")
      : null;
  const warnings = row.parsed?.warnings ?? [];
  const previewClass = preview === "paper" ? "bg-surface" : preview === "ink" ? "bg-ink" : "";

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3 sm:flex-row">
      <div
        className={`relative flex h-28 w-28 shrink-0 items-center justify-center self-start overflow-hidden rounded-md border border-border sm:h-36 sm:w-36 ${previewClass}`}
        style={preview === "checker" ? CHECKER : undefined}
      >
        {row.thumb ? (
          // A small data-URL preview made in this tool: next/image adds nothing here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.thumb} alt={`Preview of ${outName}`} className={`h-full w-full object-contain ${busy ? "opacity-50" : ""}`} />
        ) : (
          <span className="font-mono text-[11px] text-muted">{row.status === "error" ? "No preview" : "Drawing…"}</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-sm font-medium text-fg" title={row.name}>
            {row.name}
          </p>
          <p className="font-mono text-[11px] leading-snug text-muted">{sourceLine}</p>
          {outLine && (
            <p className="font-mono text-[11px] leading-snug text-fg-secondary">
              Saves as {outName} · {outLine}
            </p>
          )}
          {busy && row.thumb && <p className="font-mono text-[11px] text-muted">Updating…</p>}
        </div>

        {row.status !== "error" && row.parsed && (
          <div className="flex flex-wrap gap-1.5">
            {row.parsed.source === "viewBox" && <Badge variant="outline">Size from viewBox</Badge>}
            {row.parsed.viewBoxAdded && row.parsed.source !== "default" && <Badge variant="outline">viewBox added</Badge>}
            {row.plan?.clamped && <Badge variant="warning">Reduced to fit browser limit</Badge>}
            {row.out && row.transparent && !row.blank && <Badge variant="primary">Transparent background</Badge>}
            {row.out && row.dpiWritten && <Badge variant="outline">{row.dpiWritten} DPI written</Badge>}
          </div>
        )}

        {row.status === "error" && (
          <p className="text-sm font-medium text-danger" role="alert">
            {row.error}
          </p>
        )}
        {row.note && row.status !== "error" && <p className="text-xs text-muted">{row.note}</p>}
        {row.parsed?.source === "default" && (
          <Alert variant="warning" title="No size found">
            This SVG has no width, height or viewBox, so its natural size is unknown. It was drawn at 300 × 150 px, the size browsers assume, and anything outside that area is cut off. Add a viewBox that matches the drawing to fix it.
          </Alert>
        )}
        {row.blank && row.status !== "error" && (
          <Alert variant="warning" title="The image looks empty">
            Every pixel is transparent. The shapes may sit outside the viewBox, have no fill or stroke, or be white on a transparent background (switch the preview background to Ink to check).
          </Alert>
        )}
        {warnings.map((w) => (
          <Alert key={w.id} variant="warning" title={w.title}>
            {w.detail}
          </Alert>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          {row.status === "done" && row.out && fmt && (
            <>
              <Button size="sm" variant="primary" leftIcon={<Download className="h-3.5 w-3.5" aria-hidden />} onClick={() => downloadBlob(row.out!, outName)}>
                Download {fmt.toUpperCase()}
              </Button>
              {fmt === "png" && <CopyImageButton blob={row.out} />}
            </>
          )}
          {row.status === "error" && (
            <Button size="sm" variant="secondary" leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />} onClick={onRetry}>
              Try again
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Remove ${row.name}`} onClick={onRemove}>
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}

export default function SvgToPng() {
  const [store] = useState(() => new ConversionStore(processJob));
  const rows = useSyncExternalStore(store.subscribe, store.getSnapshot, () => NO_ROWS);
  const [settings, setSettings] = usePersistentState<Settings>("svg-to-png:settings", DEFAULTS, { storage: "local", deserialize: parseSettings });
  const [tab, setTab] = usePersistentState<InputTab>("svg-to-png:tab", "upload");
  const [code, setCode] = usePersistentState<string>("svg-to-png:code", "");
  const [notice, setNotice] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [printValue, setPrintValue] = useState("4");
  const [printUnit, setPrintUnit] = useState<"in" | "cm" | "mm">("in");
  const [printDpi, setPrintDpi] = useState("300");

  const patchSettings = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  const wNum = parseDimension(settings.width);
  const hNum = parseDimension(settings.height);
  const { format, mode, scale, lock, driver, fill, color, quality, dpi } = settings;

  const options = useMemo<ConvertOptions | null>(() => {
    let sizing: Sizing | null;
    if (mode === "scale") sizing = { mode: "scale", scale };
    else if (lock) {
      if (driver === "width") sizing = wNum ? { mode: "exact", width: wNum, height: null } : null;
      else sizing = hNum ? { mode: "exact", width: null, height: hNum } : null;
    } else sizing = wNum && hNum ? { mode: "exact", width: wNum, height: hNum } : null;
    if (!sizing) return null;
    const background = format === "jpg" ? (fill ? color : "#ffffff") : fill ? color : null;
    return { sizing, format, background, quality: quality / 100, dpi: dpi ? Number(dpi) : null };
  }, [mode, scale, lock, driver, wNum, hNum, format, fill, color, quality, dpi]);

  useEffect(() => {
    store.start();
    return () => store.dispose();
  }, [store]);

  useEffect(() => {
    if (options) store.setOptions(options);
  }, [store, options]);

  useEffect(() => {
    store.setCode(code);
  }, [store, code]);

  const addFiles = useCallback(
    (files: File[]) => {
      const { message } = store.add(files);
      setNotice(message);
      setZipError(null);
    },
    [store],
  );

  const shown = useMemo(() => rows.filter((r) => r.origin === (tab === "code" ? "code" : "file")), [rows, tab]);
  const outNames = useMemo(() => {
    const taken = new Set<string>();
    const map = new Map<number, string>();
    for (const r of shown) map.set(r.id, uniqueName(outputFileName(r.name, r.outFormat ?? format), taken));
    return map;
  }, [shown, format]);

  const done = shown.filter((r) => r.status === "done" && r.out && r.outFormat);
  const failed = shown.filter((r) => r.status === "error");
  const pending = shown.filter((r) => r.status === "queued" || r.status === "working");
  const totalIn = done.reduce((sum, r) => sum + r.size, 0);
  const totalOut = done.reduce((sum, r) => sum + (r.out?.size ?? 0), 0);
  const totalMp = done.reduce((sum, r) => sum + (r.plan ? r.plan.width * r.plan.height : 0), 0) / 1_000_000;

  // The first parsed image sets the aspect ratio shown in the field that follows the one you typed.
  const refSize = shown.find((r) => r.parsed)?.parsed?.size;
  const refRatio = refSize ? refSize.height / refSize.width : 1;
  const derivedWidth = hNum ? String(Math.max(1, Math.round(hNum / refRatio))) : "";
  const derivedHeight = wNum ? String(Math.max(1, Math.round(wNum * refRatio))) : "";
  const widthShown = lock && driver === "height" ? derivedWidth : settings.width;
  const heightShown = lock && driver === "width" ? derivedHeight : settings.height;
  const widthError = !(lock && driver === "height") && wNum === null ? DIM_ERROR : undefined;
  const heightError = !(lock && driver === "width") && hNum === null ? DIM_ERROR : undefined;

  const printPx = printToPixels(Number(printValue), printUnit, Number(printDpi));
  const applyPrint = () => {
    if (printPx) patchSettings({ mode: "exact", lock: true, driver: "width", width: String(printPx), dpi: printDpi });
  };

  const applyPreset = (n: number) => patchSettings({ mode: "exact", lock: false, width: String(n), height: String(n) });
  const presetActive = (n: number) => mode === "exact" && !lock && settings.width === String(n) && settings.height === String(n);

  const setLock = (next: boolean) => {
    if (next) patchSettings({ lock: true });
    else patchSettings({ lock: false, width: widthShown || settings.width, height: heightShown || settings.height });
  };

  const downloadZip = async () => {
    setZipError(null);
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const r of done) zip.file(outNames.get(r.id) ?? outputFileName(r.name, r.outFormat ?? format), r.out as Blob);
      // PNG and JPEG data is already compressed, so the archive stores it as is.
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const formats = new Set(done.map((r) => r.outFormat));
      downloadBlob(blob, formats.size === 1 ? `svg-to-${[...formats][0]}.zip` : "svg-converted.zip");
    } catch {
      setZipError("The ZIP file could not be built, probably because the browser ran out of memory. Download the images one by one, or convert fewer files at a time.");
    } finally {
      setZipping(false);
    }
  };

  const clearShown = () => {
    if (tab === "code") setCode("");
    store.clear(tab === "code" ? "code" : "file");
    setNotice(null);
    setZipError(null);
  };

  const ext = format.toUpperCase();

  return (
    <ToolPanel>
      <div className="flex flex-col gap-3">
        <Tabs
          label="Input"
          value={tab}
          onChange={setTab}
          options={[
            { value: "upload", label: "Upload SVG files" },
            { value: "code", label: "Paste SVG code" },
          ]}
        />
        {tab === "upload" ? (
          <div className="flex flex-col gap-2">
            <FileDropzone
              multiple
              accept="image/svg+xml,.svg,.svgz"
              onFiles={addFiles}
              title="Drop SVG files here, or click to browse"
              description={`SVG · up to ${MAX_FILES} files or ${MAX_BATCH_BYTES / 1024 / 1024} MB per batch · files are read on this device`}
            />
            <p className="text-xs text-muted">Each SVG is drawn in your browser and turned into an image on your device. Nothing is uploaded.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Textarea
              mono
              rows={9}
              label="SVG code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">…</svg>'}
              hint="Paste SVG markup, or a data:image/svg+xml URI. The image updates as you type."
              spellCheck={false}
            />
            <ToolActions>
              <Button size="sm" variant="secondary" onClick={() => setCode(EXAMPLE_SVG)}>
                Load example
              </Button>
              <Button size="sm" variant="outline" disabled={code === ""} onClick={() => setCode("")}>
                Clear code
              </Button>
            </ToolActions>
          </div>
        )}
      </div>

      {shown.length > 0 && (
        <p className="text-xs text-muted">
          {done.length > 0 ? "Your image is ready. " : "Drawing your image. "}
          <a href="#svg-to-png-results" className="font-medium text-primary underline underline-offset-2">
            Jump to the result
          </a>{" "}
          below the size and format settings.
        </p>
      )}

      <ToolGrid>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3 sm:p-4">
          <span className="label-mono">Size</span>
          <Tabs
            label="Size mode"
            value={mode}
            onChange={(m) => patchSettings({ mode: m })}
            options={[
              { value: "scale", label: "Scale" },
              { value: "exact", label: "Exact size" },
            ]}
          />
          {mode === "scale" ? (
            <div className="flex flex-col gap-3">
              <Slider label="Scale" value={scale} onChange={(v) => patchSettings({ scale: v })} min={1} max={8} step={0.25} format={(v) => `${v}×`} />
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Scale presets">
                {SCALES.map((s) => (
                  <Button key={s} size="sm" variant={scale === s ? "primary" : "outline"} aria-pressed={scale === s} onClick={() => patchSettings({ scale: s })}>
                    {s}×
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted">1× is the size the SVG declares. 2× or more stays sharp on high-density screens.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Width"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  suffix="px"
                  value={widthShown}
                  error={widthError}
                  onChange={(e) => patchSettings({ width: e.target.value, driver: "width" })}
                />
                <Input
                  label="Height"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  suffix="px"
                  value={heightShown}
                  error={heightError}
                  onChange={(e) => patchSettings({ height: e.target.value, driver: "height" })}
                />
              </div>
              <Checkbox checked={lock} onChange={setLock} label="Lock aspect ratio" />
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-fg">Square presets</span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Square size presets">
                  {PRESETS.map((n) => (
                    <Button key={n} size="sm" variant={presetActive(n) ? "primary" : "outline"} aria-pressed={presetActive(n)} onClick={() => applyPreset(n)}>
                      {n}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  Favicons use 16, 32 and 48, the iPhone home-screen icon 180, and web app icons 192 and 512. A shape that is not square is centered and fully visible.
                </p>
              </div>
              <details className="rounded-lg border border-border bg-surface p-3">
                <summary className="cursor-pointer text-[13px] font-medium text-fg">Size for print (inches or cm × DPI)</summary>
                <div className="mt-3 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Input label="Print width" type="number" inputMode="decimal" min={0} step="any" value={printValue} onChange={(e) => setPrintValue(e.target.value)} />
                    <Select
                      label="Unit"
                      value={printUnit}
                      onChange={(e) => setPrintUnit(e.target.value as "in" | "cm" | "mm")}
                      options={[
                        { value: "in", label: "inches" },
                        { value: "cm", label: "cm" },
                        { value: "mm", label: "mm" },
                      ]}
                    />
                    <Select
                      label="DPI"
                      value={printDpi}
                      onChange={(e) => setPrintDpi(e.target.value)}
                      options={[
                        { value: "150", label: "150" },
                        { value: "300", label: "300" },
                        { value: "600", label: "600" },
                      ]}
                    />
                  </div>
                  <p className="font-mono text-xs text-fg-secondary">{printPx ? `= ${formatNumber(printPx)} px wide` : "Enter a width greater than 0."}</p>
                  <div>
                    <Button size="sm" variant="secondary" disabled={!printPx} onClick={applyPrint}>
                      Use this width and write {printDpi} DPI
                    </Button>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3 sm:p-4">
          <span className="label-mono">Format and background</span>
          <Tabs
            label="Output format"
            value={format}
            onChange={(f) => patchSettings({ format: f })}
            options={[
              { value: "png", label: "PNG" },
              { value: "jpg", label: "JPG" },
            ]}
          />
          {format === "jpg" && <Slider label="JPG quality" value={quality} onChange={(v) => patchSettings({ quality: v })} min={50} max={100} step={1} format={(v) => `${v}%`} />}
          <Toggle
            checked={format === "jpg" ? true : fill}
            disabled={format === "jpg"}
            onChange={(v) => patchSettings({ fill: v })}
            label="Fill the background with a color"
            description={format === "jpg" ? "JPG cannot store transparency, so the background is always filled. White unless you pick a color." : "Off: transparent areas stay transparent in the PNG."}
          />
          {(format === "jpg" || fill) && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                aria-label="Background color"
                value={color}
                onChange={(e) => patchSettings({ color: e.target.value.toLowerCase(), fill: true })}
                className="h-9 w-14 cursor-pointer rounded-md border border-border-strong bg-surface p-1"
              />
              <span className="font-mono text-xs uppercase text-muted">{format === "jpg" && !fill ? "#ffffff" : color}</span>
              <Button size="sm" variant="outline" onClick={() => patchSettings({ color: "#ffffff", fill: true })}>
                White
              </Button>
              <Button size="sm" variant="outline" onClick={() => patchSettings({ color: "#000000", fill: true })}>
                Black
              </Button>
            </div>
          )}
          <Select
            label="Write pixel density (DPI) into the file"
            value={dpi}
            onChange={(e) => patchSettings({ dpi: e.target.value })}
            hint="Optional. Tells Word, Photoshop or a print shop how large the image is meant to be. It does not change the pixel size."
            options={DPI_VALUES.map((v) => ({ value: v, label: v ? `${v} DPI` : "Do not write" }))}
          />
        </div>
      </ToolGrid>

      {notice && (
        <Alert variant="warning" title="Some files were not added">
          {notice}
        </Alert>
      )}
      {zipError && (
        <Alert variant="error" title="ZIP failed">
          {zipError}
        </Alert>
      )}

      {shown.length > 0 && (
        <section id="svg-to-png-results" aria-label="Converted images" className="flex scroll-mt-24 flex-col gap-4 border-t border-border pt-5">
          <p className="sr-only" aria-live="polite">
            {done.length} of {shown.length} images converted{failed.length ? `, ${failed.length} failed` : ""}
          </p>

          <StatGrid>
            <Stat emphasis label="Converted" value={`${done.length}/${shown.length}`} hint={failed.length ? `${failed.length} failed` : pending.length ? "in progress" : "all done"} />
            <Stat label="Pixels" value={done.length ? `${totalMp.toFixed(2)} MP` : "–"} hint="megapixels in total" />
            <Stat label="SVG size" value={done.length ? formatBytes(totalIn) : "–"} hint="source markup" />
            <Stat label={`${ext} size`} value={done.length ? formatBytes(totalOut) : "–"} hint="after conversion" />
          </StatGrid>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ToolActions>
              {done.length >= 2 ? (
                <Button variant="accent" size="lg" loading={zipping} leftIcon={<FileArchive className="h-4 w-4" aria-hidden />} onClick={downloadZip}>
                  Download {done.length} images as ZIP
                </Button>
              ) : done.length === 1 ? (
                <Button
                  variant="accent"
                  size="lg"
                  leftIcon={<Download className="h-4 w-4" aria-hidden />}
                  onClick={() => downloadBlob(done[0].out as Blob, outNames.get(done[0].id) ?? outputFileName(done[0].name, done[0].outFormat ?? format))}
                >
                  Download {(done[0].outFormat ?? format).toUpperCase()}
                </Button>
              ) : null}
              <Button variant="outline" size="lg" leftIcon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={clearShown}>
                {tab === "code" ? "Clear" : "Clear all"}
              </Button>
            </ToolActions>
            <Tabs
              size="sm"
              label="Preview background"
              value={settings.preview}
              onChange={(p) => patchSettings({ preview: p })}
              options={[
                { value: "checker", label: "Checker" },
                { value: "paper", label: "Paper" },
                { value: "ink", label: "Ink" },
              ]}
            />
          </div>

          <ul className="flex flex-col gap-2.5">
            {shown.map((row) => (
              <RowCard
                key={row.id}
                row={row}
                outName={outNames.get(row.id) ?? outputFileName(row.name, format)}
                preview={settings.preview}
                onRemove={() => store.remove(row.id)}
                onRetry={() => store.retry(row.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </ToolPanel>
  );
}
