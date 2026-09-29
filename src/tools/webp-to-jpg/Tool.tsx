"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Download, Eye, EyeOff, FileArchive, RotateCcw, Trash2, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, FileDropzone, Input, Slider, Stat, StatGrid, Tabs, Toggle, ToolActions, ToolPanel } from "@/components/ui";
import { downloadBlob, formatBytes, formatNumber } from "@/lib/utils";
import { MAX_BATCH_BYTES, MAX_BATCH_FILES, isGenericClipboardName, pastedImageName, sizeDelta, type Extension } from "./batch";
import { processFile } from "./convert";
import { ConversionQueue, type Row } from "./queue";
import { DEFAULT_SETTINGS, MAX_LIMIT_KB, MAX_QUALITY, MIN_FIT_QUALITY, MIN_LIMIT_KB, MIN_QUALITY, PRESETS, clampQuality, limitBytes, parseSettings, qualityHint, type Settings } from "./settings";
import { ZipTooLargeError, buildZip } from "./zip";
import { describeWebp, formatLabel } from "./webp";

const NO_ROWS: Row[] = [];

const EXTENSIONS: { value: Extension; label: string }[] = [
  { value: "jpg", label: ".jpg" },
  { value: "jpeg", label: ".jpeg" },
];

function kindLabel(row: Row): string {
  if (row.info) return describeWebp(row.info);
  if (row.sniff && row.sniff !== "webp" && row.sniff !== "unknown") return formatLabel(row.sniff);
  return "";
}

function stagePercent(row: Row): number {
  if (row.status === "done") return 100;
  if (row.status === "queued") return 0;
  return row.stage <= 1 ? 25 : 65;
}

function isUpdating(row: Row): boolean {
  return row.status === "done" && (row.stale || row.refreshing);
}

const NON_TEXT_INPUTS = new Set(["file", "range", "color", "checkbox", "radio", "button", "submit", "reset"]);

/** Pasting into a text box must paste text; a focused slider, checkbox or file input must not block image paste. */
function isTextEntry(el: HTMLElement): boolean {
  if (el.isContentEditable || el.tagName === "TEXTAREA") return true;
  return el.tagName === "INPUT" && !NON_TEXT_INPUTS.has((el as HTMLInputElement).type);
}

function formatLimit(bytes: number): string {
  return `${formatNumber(bytes / 1000)} KB`;
}

/** The finished JPG at its real size, so compression artifacts can be judged before downloading. */
function RowPreview({ blob, name }: { blob: Blob; name: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState<"fit" | "actual">("fit");

  useEffect(() => {
    // The object URL is created and revoked here and handed to the <img> directly, so no state is needed.
    const url = URL.createObjectURL(blob);
    if (imgRef.current) imgRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label-mono">Preview of the saved JPG</span>
        <Tabs
          size="sm"
          label="Preview zoom"
          value={zoom}
          onChange={setZoom}
          options={[
            { value: "fit", label: "Fit" },
            { value: "actual", label: "Actual size" },
          ]}
        />
      </div>
      <div className="max-h-[28rem] overflow-auto rounded-md border border-border bg-surface-3 p-1">
        {/* An object URL for a file the visitor just converted: next/image cannot optimize it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} alt={`Full-size preview of ${name}`} className={zoom === "fit" ? "mx-auto h-auto max-w-full" : "max-w-none"} />
      </div>
      <p className="text-xs text-muted">Compression artifacts show up around sharp edges and text, so look at &ldquo;Actual size&rdquo; before choosing a low quality.</p>
    </div>
  );
}

function FileRow({
  row,
  fillColor,
  requestedQuality,
  previewOpen,
  onTogglePreview,
  onRemove,
  onRetry,
}: {
  row: Row;
  fillColor: string;
  requestedQuality: number;
  previewOpen: boolean;
  onTogglePreview: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const width = row.width ?? row.info?.width ?? null;
  const height = row.height ?? row.info?.height ?? null;
  const kind = kindLabel(row);
  const animated = !!row.info?.animated;
  const updating = isUpdating(row);
  const pct = stagePercent(row);
  const dropped = row.info ? [row.info.hasExif && "EXIF", row.info.hasXmp && "XMP", row.info.hasIcc && "color profile"].filter(Boolean) : [];
  const details = [
    width && height ? `${formatNumber(width)} × ${formatNumber(height)} px` : null,
    kind || null,
    row.status === "done" && row.out
      ? `${formatBytes(row.size)} → ${formatBytes(row.out.size)}${sizeDelta(row.size, row.out.size) ? ` (${sizeDelta(row.size, row.out.size)})` : ""}`
      : formatBytes(row.size),
    row.status === "done" && row.usedQuality ? `quality ${row.usedQuality}` : null,
  ].filter(Boolean);
  const showBadges = row.status !== "error" && (row.flattened || animated || dropped.length > 0 || row.fit || (row.sniff && row.sniff !== "webp"));

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-surface">
            {row.thumb && (
              // A tiny data-URL preview made in this tool: next/image adds nothing here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.thumb} alt={`Thumbnail of ${row.outName}`} className="h-full w-full object-contain" />
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
            {showBadges && (
              <div className="flex flex-wrap gap-1.5">
                {row.flattened && (
                  <Badge>
                    <span className="inline-block h-2.5 w-2.5 rounded-sm border border-border-strong" style={{ backgroundColor: fillColor }} aria-hidden />
                    Transparency filled
                  </Badge>
                )}
                {animated && <Badge variant="warning">Animated · first frame only</Badge>}
                {dropped.length > 0 && <Badge variant="outline">{dropped.join(" + ")} not copied</Badge>}
                {row.fit && row.fit.fits && <Badge variant="success">Under {formatLimit(row.fit.limit)}</Badge>}
                {row.fit && !row.fit.fits && <Badge variant="danger">Over {formatLimit(row.fit.limit)}</Badge>}
                {row.sniff && row.sniff !== "webp" && <Badge variant="outline">{formatLabel(row.sniff)} input, not WebP</Badge>}
              </div>
            )}
            {row.fit && row.status === "done" && !updating && row.fit.fits && row.fit.quality < requestedQuality && (
              <p className="text-xs text-muted">
                Quality was lowered from {requestedQuality} to {row.fit.quality} to fit the limit.
              </p>
            )}
            {row.fit && !row.fit.fits && row.status === "done" && !updating && (
              <p className="text-xs text-danger">
                Even at quality {row.fit.quality} this file is {formatBytes(row.out?.size ?? 0)}. Make the picture smaller in pixels first, or raise the limit.
              </p>
            )}
            {row.note && row.status !== "error" && <p className="text-xs text-muted">{row.note}</p>}
            {row.status === "error" && (
              <p className="text-xs font-medium text-danger" role="alert">
                {row.error}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:w-72 sm:items-end">
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
          {updating && <span className="font-mono text-[11px] text-muted">Updating with the new settings…</span>}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {row.status === "done" && row.out && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={updating}
                  leftIcon={<Download className="h-3.5 w-3.5" aria-hidden />}
                  onClick={() => downloadBlob(row.out!, row.outName)}
                >
                  Download JPG
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-expanded={previewOpen}
                  leftIcon={previewOpen ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                  onClick={onTogglePreview}
                >
                  {previewOpen ? "Hide preview" : "Preview"}
                </Button>
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
      </div>
      {previewOpen && row.status === "done" && row.out && <RowPreview blob={row.out} name={row.outName} />}
    </li>
  );
}

export default function WebpToJpg() {
  const [queue] = useState(() => new ConversionQueue(processFile));
  const rows = useSyncExternalStore(queue.subscribe, queue.getSnapshot, () => NO_ROWS);
  const [settings, setSettings] = usePersistentState<Settings>("webp-to-jpg:settings", DEFAULT_SETTINGS, { storage: "local", deserialize: parseSettings });
  const [notice, setNotice] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const pastedCount = useRef(0);

  const maxBytes = settings.limitOn ? limitBytes(settings.limitKb) : null;
  const limitInvalid = settings.limitOn && maxBytes === null;

  useEffect(() => {
    queue.start();
    return () => queue.dispose();
  }, [queue]);

  useEffect(() => {
    queue.setOptions({ quality: settings.quality, fillColor: settings.color, maxBytes });
  }, [queue, settings.quality, settings.color, maxBytes]);

  useEffect(() => {
    queue.setExtension(settings.extension);
  }, [queue, settings.extension]);

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
      if (target && isTextEntry(target)) return;
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
  const updating = rows.filter(isUpdating);
  const failed = rows.filter((r) => r.status === "error");
  const busy = pending.length > 0 || updating.length > 0;
  const animatedCount = rows.filter((r) => r.info?.animated).length;
  const totalIn = done.reduce((sum, r) => sum + r.size, 0);
  const totalOut = done.reduce((sum, r) => sum + (r.out?.size ?? 0), 0);
  const finishedShare = rows.length ? Math.round(((rows.length - pending.length) / rows.length) * 100) : 0;

  const liveLine = (() => {
    if (limitInvalid) return "The size limit is not a valid number, so no limit is applied yet.";
    if (rows.length === 0) return "Add a file to see how big it is at this quality.";
    if (busy) return "Updating sizes…";
    if (done.length === 0) return "";
    const delta = sizeDelta(totalIn, totalOut);
    return `${formatBytes(totalIn)} → ${formatBytes(totalOut)}${delta ? ` (${delta})` : ""}${maxBytes !== null ? " with the size limit" : ` at quality ${settings.quality}`}`;
  })();

  const downloadZip = async () => {
    setZipError(null);
    setZipping(true);
    try {
      const blob = await buildZip(done.map((r) => ({ name: r.outName, blob: r.out as Blob })));
      downloadBlob(blob, "webp-to-jpg.zip");
    } catch (e) {
      setZipError(
        e instanceof ZipTooLargeError
          ? "These JPGs add up to more than a ZIP file can hold (4 GB). Download them one by one, or convert fewer files at a time."
          : "The ZIP file could not be built, probably because the browser ran out of memory. Download the JPGs one by one, or convert fewer files at a time.",
      );
    } finally {
      setZipping(false);
    }
  };

  const clearAll = () => {
    queue.clear();
    setNotice(null);
    setZipError(null);
    setPreviewId(null);
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
        <p className="text-xs text-muted">Files are processed in your browser; we do not upload or store them. JPG cannot hold transparency, so transparent areas are filled with the color below.</p>
      </div>

      <div className="grid gap-5 rounded-lg border border-border bg-surface-2 p-4 md:grid-cols-2 md:gap-6">
        <div className="flex flex-col gap-3">
          <Slider label="JPG quality" value={settings.quality} min={MIN_QUALITY} max={MAX_QUALITY} onChange={(quality) => setSettings((s) => ({ ...s, quality: clampQuality(quality) }))} />
          <div role="group" aria-label="Quality presets" className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <Button
                key={p.quality}
                size="sm"
                variant={settings.quality === p.quality ? "primary" : "outline"}
                aria-pressed={settings.quality === p.quality}
                onClick={() => setSettings((s) => ({ ...s, quality: p.quality }))}
              >
                {p.label} · {p.quality}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted">{qualityHint(settings.quality)}</p>
          <p className="font-mono text-xs text-fg-secondary" aria-live="polite">
            {liveLine}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-fg" id="jpg-bg-label">
              Background for transparent areas
            </span>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="jpg-bg-label">
              <input
                type="color"
                aria-label="Background color"
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
            <p className="text-xs text-muted">Used only where the image is see-through. Opaque images are not affected.</p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-fg">
              File extension
            </span>
            <Tabs size="sm" className="self-start" label="File extension" value={settings.extension} onChange={(extension) => setSettings((s) => ({ ...s, extension }))} options={EXTENSIONS} />
          </div>

          <div className="flex flex-col gap-2.5">
            <Toggle
              checked={settings.limitOn}
              onChange={(limitOn) => setSettings((s) => ({ ...s, limitOn }))}
              label="Keep each JPG under a size limit"
              description={`Starts at the quality above and lowers it just enough, down to ${MIN_FIT_QUALITY}.`}
            />
            {settings.limitOn && (
              <Input
                label="Maximum size per file"
                inputSize="sm"
                inputMode="numeric"
                autoComplete="off"
                suffix="KB"
                value={settings.limitKb}
                onChange={(e) => setSettings((s) => ({ ...s, limitKb: e.target.value.replace(/[^\d]/g, "").slice(0, 5) }))}
                error={limitInvalid ? `Enter a whole number from ${MIN_LIMIT_KB} to ${formatNumber(MAX_LIMIT_KB)}.` : undefined}
                hint="1 KB is counted as 1,000 bytes, so the file also fits a site that counts 1,024."
              />
            )}
          </div>
        </div>
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
          JPG cannot hold an animation, so {animatedCount === 1 ? "1 file was" : `${animatedCount} files were`} saved as a still image of the first frame. To keep the motion you need a GIF
          or video tool instead.
        </Alert>
      )}

      {rows.length > 0 && (
        <section aria-label="Converted files" className="flex flex-col gap-4 border-t border-border pt-5">
          <p className="sr-only" aria-live="polite">
            {done.length} of {rows.length} files converted{failed.length ? `, ${failed.length} failed` : ""}
          </p>

          <StatGrid>
            <Stat emphasis label="Converted" value={`${done.length}/${rows.length}`} hint={failed.length ? `${failed.length} failed` : busy ? "in progress" : "all done"} />
            <Stat label="Original size" value={done.length ? formatBytes(totalIn) : "–"} hint="files converted so far" />
            <Stat label="JPG size" value={done.length ? formatBytes(totalOut) : "–"} hint={maxBytes !== null ? "with the size limit" : `at quality ${settings.quality}`} />
            <Stat label="Difference" value={done.length ? sizeDelta(totalIn, totalOut) || "–" : "–"} hint="JPG vs original" />
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
              <Button variant="accent" size="lg" disabled={busy} loading={zipping} leftIcon={<FileArchive className="h-4 w-4" aria-hidden />} onClick={downloadZip}>
                Download {done.length} JPGs as ZIP
              </Button>
            ) : done.length === 1 ? (
              <Button variant="accent" size="lg" disabled={busy} leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadBlob(done[0].out as Blob, done[0].outName)}>
                Download JPG
              </Button>
            ) : null}
            <Button variant="outline" size="lg" leftIcon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={clearAll}>
              Clear all
            </Button>
            {busy && done.length > 0 && <span className="font-mono text-[11px] text-muted">Downloads unlock when every file has finished.</span>}
          </ToolActions>

          {!busy && done.length > 0 && totalOut > totalIn && (
            <p className="text-xs text-muted">
              The JPGs are larger than the originals. That is normal: WebP usually needs fewer bytes than JPEG for the same look.{" "}
              {maxBytes !== null ? "Lower the size limit or the quality to shrink them further." : "Lower the quality or set a size limit to shrink them."}
            </p>
          )}

          <ul className="flex flex-col gap-2.5">
            {rows.map((row) => (
              <FileRow
                key={row.id}
                row={row}
                fillColor={settings.color}
                requestedQuality={settings.quality}
                previewOpen={previewId === row.id}
                onTogglePreview={() => setPreviewId((id) => (id === row.id ? null : row.id))}
                onRemove={() => {
                  queue.remove(row.id);
                  setPreviewId((id) => (id === row.id ? null : id));
                }}
                onRetry={() => queue.retry(row.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </ToolPanel>
  );
}
