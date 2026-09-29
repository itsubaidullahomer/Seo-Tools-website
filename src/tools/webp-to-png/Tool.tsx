"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Check, Copy, Download, FileArchive, RotateCcw, Trash2, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, FileDropzone, Stat, StatGrid, Toggle, ToolActions, ToolPanel } from "@/components/ui";
import { downloadBlob, formatBytes, formatNumber } from "@/lib/utils";
import { MAX_BATCH_BYTES, MAX_BATCH_FILES, isGenericClipboardName, pastedImageName, sizeDelta } from "./batch";
import { processFile } from "./convert";
import { ConversionQueue, type Row } from "./queue";
import { ZipTooLargeError, buildZip } from "./zip";
import { describeWebp, formatLabel } from "./webp";

interface Settings {
  /** Fill transparent areas with a solid color instead of keeping the alpha channel. */
  fill: boolean;
  color: string;
}

const DEFAULTS: Settings = { fill: false, color: "#ffffff" };
const NO_ROWS: Row[] = [];

/** Stored settings may be missing, hand-edited or from an older version: rebuild them field by field. */
function parseSettings(raw: string): Settings {
  try {
    const v = JSON.parse(raw) as Partial<Settings> | null;
    return {
      fill: v?.fill === true,
      color: typeof v?.color === "string" && /^#[0-9a-fA-F]{6}$/.test(v.color) ? v.color.toLowerCase() : DEFAULTS.color,
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

function kindLabel(row: Row): string {
  if (row.info) return describeWebp(row.info);
  if (row.sniff && row.sniff !== "webp") return formatLabel(row.sniff);
  return "";
}

function stagePercent(row: Row): number {
  if (row.status === "done") return 100;
  if (row.status === "queued") return 0;
  return row.stage <= 1 ? 25 : 65;
}

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

function FileRow({ row, onRemove, onRetry }: { row: Row; onRemove: () => void; onRetry: () => void }) {
  const width = row.width ?? row.info?.width ?? null;
  const height = row.height ?? row.info?.height ?? null;
  const kind = kindLabel(row);
  const animated = !!row.info?.animated;
  const filled = row.optionsKey !== null && row.optionsKey !== "transparent";
  const pct = stagePercent(row);
  const details = [
    width && height ? `${formatNumber(width)} × ${formatNumber(height)} px` : null,
    kind || null,
    row.status === "done" && row.out
      ? `${formatBytes(row.size)} → ${formatBytes(row.out.size)}${sizeDelta(row.size, row.out.size) ? ` (${sizeDelta(row.size, row.out.size)})` : ""}`
      : formatBytes(row.size),
  ].filter(Boolean);

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-surface" style={CHECKER}>
          {row.thumb && (
            // A tiny data-URL preview made in this tool: next/image adds nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.thumb} alt={`Preview of ${row.outName}`} className="h-full w-full object-contain" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm font-medium text-fg" title={row.name}>
            {row.name}
          </p>
          <p className="font-mono text-[11px] leading-snug text-muted">{details.join(" · ")}</p>
          {row.status === "done" && (
            <p className="truncate font-mono text-[11px] text-fg-secondary" title={row.outName}>
              Saves as {row.outName}
            </p>
          )}
          {(row.info?.hasAlpha || animated || (row.sniff && row.sniff !== "webp")) && row.status !== "error" && (
            <div className="flex flex-wrap gap-1.5">
              {row.info?.hasAlpha && !animated && (filled ? <Badge>Background filled</Badge> : <Badge variant="primary">Transparency kept</Badge>)}
              {animated && <Badge variant="warning">Animated · first frame only</Badge>}
              {row.sniff && row.sniff !== "webp" && <Badge variant="outline">{formatLabel(row.sniff)} input, not WebP</Badge>}
            </div>
          )}
          {row.note && row.status !== "error" && <p className="text-xs text-muted">{row.note}</p>}
          {row.status === "error" && (
            <p className="text-xs font-medium text-danger" role="alert">
              {row.error}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:w-80 sm:items-end">
        {(row.status === "queued" || row.status === "working") && (
          <div className="flex w-full flex-col gap-1.5">
            <div
              role="progressbar"
              aria-label={`Converting ${row.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
            >
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
            <span className="font-mono text-[11px] text-muted">{row.status === "queued" ? "Waiting" : row.stage <= 1 ? "Reading file" : "Converting"}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {row.status === "done" && row.out && (
            <>
              <Button size="sm" variant="primary" leftIcon={<Download className="h-3.5 w-3.5" aria-hidden />} onClick={() => downloadBlob(row.out!, row.outName)}>
                Download PNG
              </Button>
              <CopyImageButton blob={row.out} />
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

export default function WebpToPng() {
  const [queue] = useState(() => new ConversionQueue(processFile));
  const rows = useSyncExternalStore(queue.subscribe, queue.getSnapshot, () => NO_ROWS);
  const [settings, setSettings] = usePersistentState<Settings>("webp-to-png:settings", DEFAULTS, { storage: "local", deserialize: parseSettings });
  const [notice, setNotice] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const pastedCount = useRef(0);

  useEffect(() => {
    queue.start();
    return () => queue.dispose();
  }, [queue]);

  useEffect(() => {
    queue.setOptions({ fillColor: settings.fill ? settings.color : null });
  }, [queue, settings.fill, settings.color]);

  const addFiles = useCallback(
    (files: File[]) => {
      const { message } = queue.add(files.map((file) => ({ file })));
      setNotice(message);
      setZipError(null);
    },
    [queue],
  );

  // Ctrl+V / Cmd+V anywhere on the page adds images from the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/") || /\.webp$/i.test(f.name));
      if (files.length === 0) return;
      e.preventDefault();
      addFiles(
        files.map((f) => {
          if (!isGenericClipboardName(f.name)) return f;
          pastedCount.current += 1;
          return new File([f], pastedImageName(pastedCount.current), { type: f.type, lastModified: f.lastModified });
        }),
      );
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const done = rows.filter((r) => r.status === "done" && r.out);
  const pending = rows.filter((r) => r.status === "queued" || r.status === "working");
  const failed = rows.filter((r) => r.status === "error");
  const animatedCount = rows.filter((r) => r.info?.animated).length;
  const totalIn = done.reduce((sum, r) => sum + r.size, 0);
  const totalOut = done.reduce((sum, r) => sum + (r.out?.size ?? 0), 0);
  const finishedShare = rows.length ? Math.round(((rows.length - pending.length) / rows.length) * 100) : 0;

  const downloadZip = async () => {
    setZipError(null);
    setZipping(true);
    try {
      const blob = await buildZip(done.map((r) => ({ name: r.outName, blob: r.out as Blob })));
      downloadBlob(blob, "webp-to-png.zip");
    } catch (e) {
      setZipError(
        e instanceof ZipTooLargeError
          ? "These PNGs add up to more than a ZIP file can hold (4 GB). Download them one by one, or convert fewer files at a time."
          : "The ZIP file could not be built, probably because the browser ran out of memory. Download the PNGs one by one, or convert fewer files at a time.",
      );
    } finally {
      setZipping(false);
    }
  };

  const clearAll = () => {
    queue.clear();
    setNotice(null);
    setZipError(null);
  };

  return (
    <ToolPanel>
      <div className="flex flex-col gap-2">
        <FileDropzone
          multiple
          accept="image/webp,.webp"
          onFiles={addFiles}
          title="Drop WebP files here, or click to browse"
          description={`WebP · up to ${MAX_BATCH_FILES} files or ${MAX_BATCH_BYTES / 1024 / 1024} MB per batch · Ctrl+V (⌘V) pastes an image`}
        />
        <p className="text-xs text-muted">
          PNG keeps every pixel of the decoded image, so this step adds no further quality loss. Files are processed in your browser; we do not upload or store them.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        <Toggle
          checked={settings.fill}
          onChange={(fill) => setSettings((s) => ({ ...s, fill }))}
          label="Fill transparent areas with a solid color"
          description="Off: transparent pixels stay transparent in the PNG."
        />
        {settings.fill && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              aria-label="Fill color"
              value={settings.color}
              onChange={(e) => setSettings((s) => ({ ...s, color: e.target.value.toLowerCase() }))}
              className="h-9 w-14 cursor-pointer rounded-md border border-border-strong bg-surface p-1"
            />
            <span className="font-mono text-xs uppercase text-muted">{settings.color}</span>
            <Button size="sm" variant="outline" onClick={() => setSettings((s) => ({ ...s, color: "#ffffff" }))}>
              White
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSettings((s) => ({ ...s, color: "#000000" }))}>
              Black
            </Button>
          </div>
        )}
      </div>

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
      {animatedCount > 0 && (
        <Alert variant="warning" title="Animated WebP: first frame only">
          PNG cannot hold an animation, so {animatedCount === 1 ? "1 file was" : `${animatedCount} files were`} saved as a still image of the first frame. To keep the motion you
          need a GIF or APNG tool instead.
        </Alert>
      )}

      {rows.length > 0 && (
        <section aria-label="Converted files" className="flex flex-col gap-4 border-t border-border pt-5">
          <p className="sr-only" aria-live="polite">
            {done.length} of {rows.length} files converted{failed.length ? `, ${failed.length} failed` : ""}
          </p>

          <StatGrid>
            <Stat emphasis label="Converted" value={`${done.length}/${rows.length}`} hint={failed.length ? `${failed.length} failed` : pending.length ? "in progress" : "all done"} />
            <Stat label="Original size" value={done.length ? formatBytes(totalIn) : "–"} hint="files converted so far" />
            <Stat label="PNG size" value={done.length ? formatBytes(totalOut) : "–"} hint="after conversion" />
            <Stat label="Difference" value={done.length ? sizeDelta(totalIn, totalOut) || "–" : "–"} hint="PNG vs original" />
          </StatGrid>

          {pending.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div
                role="progressbar"
                aria-label="Batch progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={finishedShare}
                className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
              >
                <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${finishedShare}%` }} />
              </div>
              <span className="font-mono text-[11px] text-muted">
                {rows.length - pending.length} of {rows.length} finished, converting two files at a time
              </span>
            </div>
          )}

          <ToolActions>
            {done.length >= 2 ? (
              <Button variant="accent" size="lg" loading={zipping} leftIcon={<FileArchive className="h-4 w-4" aria-hidden />} onClick={downloadZip}>
                Download {done.length} PNGs as ZIP
              </Button>
            ) : done.length === 1 ? (
              <Button variant="accent" size="lg" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadBlob(done[0].out as Blob, done[0].outName)}>
                Download PNG
              </Button>
            ) : null}
            <Button variant="outline" size="lg" leftIcon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={clearAll}>
              Clear all
            </Button>
          </ToolActions>

          {done.length > 0 && totalOut > totalIn && (
            <p className="text-xs text-muted">
              The PNGs are larger than the originals. That is normal: a lossy WebP throws away detail to save space, while PNG stores every decoded pixel.
            </p>
          )}

          <ul className="flex flex-col gap-2.5">
            {rows.map((row) => (
              <FileRow key={row.id} row={row} onRemove={() => queue.remove(row.id)} onRetry={() => queue.retry(row.id)} />
            ))}
          </ul>
        </section>
      )}
    </ToolPanel>
  );
}
