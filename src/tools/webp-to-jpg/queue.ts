/**
 * A small external store that converts files two at a time.
 *
 * The component subscribes with useSyncExternalStore, so React state is never set
 * from an effect. The conversion itself is injected (`process`), which keeps the
 * scheduling logic testable without a browser.
 *
 * When the options change (quality, background color, size limit), finished files
 * are marked `stale` and converted again after a short pause. They keep their old
 * result until the new one is ready, so sizes update in place without flicker.
 */
import { assignOutNames, batchMessage, jpgFileName, planBatch, uniqueName, type Extension } from "./batch";
import type { SniffedFormat, WebpInfo } from "./webp";

export type RowStatus = "queued" | "working" | "done" | "error";

export interface FitInfo {
  /** Size limit in bytes the file was fitted to. */
  limit: number;
  /** Quality of the saved file. */
  quality: number;
  /** False when even the lowest allowed quality stayed over the limit. */
  fits: boolean;
}

export interface Row {
  id: number;
  /** Original file name (or pasted-image-N). */
  name: string;
  file: File;
  size: number;
  /** Unique JPG name used for downloads and inside the ZIP. */
  outName: string;
  status: RowStatus;
  /** 0 waiting, 1 reading, 2 decoding, 3 encoding / finished. */
  stage: number;
  sniff: SniffedFormat | null;
  info: WebpInfo | null;
  width: number | null;
  height: number | null;
  out: Blob | null;
  /** Small data-URL preview (no object URL to revoke). */
  thumb: string | null;
  note: string | null;
  error: string | null;
  /** True when the image had transparent pixels that were replaced by the background color. */
  flattened: boolean | null;
  /** Quality of the saved file (equals the setting unless a size limit lowered it). */
  usedQuality: number | null;
  fit: FitInfo | null;
  /** Options the current output was produced with. */
  optionsKey: string | null;
  /** Finished, but the options changed since: a new conversion is waiting or running. */
  stale: boolean;
  /** A re-conversion of a finished file is running right now. */
  refreshing: boolean;
}

export interface ConvertOptions {
  /** JPEG quality 1-100. */
  quality: number;
  /** CSS color (#rrggbb) that replaces transparent areas. */
  fillColor: string;
  /** Keep each file under this many bytes by lowering the quality, or null for no limit. */
  maxBytes: number | null;
}

export type RowUpdate = Partial<
  Pick<Row, "stage" | "sniff" | "info" | "width" | "height" | "out" | "thumb" | "note" | "flattened" | "usedQuality" | "fit">
>;

export type Processor = (file: File, options: ConvertOptions, report: (update: RowUpdate) => void) => Promise<RowUpdate>;

export const CONCURRENCY = 2;

export const DEFAULT_OPTIONS: ConvertOptions = { quality: 90, fillColor: "#ffffff", maxBytes: null };

export function optionsKey(o: ConvertOptions): string {
  return `${o.quality}|${o.fillColor}|${o.maxBytes ?? "-"}`;
}

/** Error whose message is written for the user and shown as is. Anything else gets a generic message. */
export class UserFacingError extends Error {}

function messageOf(e: unknown): string {
  if (e instanceof UserFacingError) return e.message;
  return "Something went wrong while converting this file. It may be damaged, or too large for this browser's memory.";
}

export class ConversionQueue {
  private rows: Row[] = [];
  private listeners = new Set<() => void>();
  private active = 0;
  private running = true;
  private nextId = 1;
  private options: ConvertOptions = DEFAULT_OPTIONS;
  private extension: Extension = "jpg";
  /** While true, stale rows wait (the user is still dragging a slider); new files still convert. */
  private holdRefresh = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly process: Processor;
  private readonly concurrency: number;
  private readonly debounceMs: number;
  /** Highest number of conversions that ran at the same time (for tests). */
  peakActive = 0;

  constructor(process: Processor, concurrency = CONCURRENCY, debounceMs = 300) {
    this.process = process;
    this.concurrency = concurrency;
    this.debounceMs = debounceMs;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): Row[] => this.rows;

  /** Resume after a dispose (React strict mode mounts effects twice in development). */
  start(): void {
    this.running = true;
    this.pump();
  }

  dispose(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.holdRefresh = false;
  }

  private emit(): void {
    for (const l of this.listeners) l();
  }

  private set(rows: Row[]): void {
    this.rows = rows;
    this.emit();
  }

  private patch(id: number, patch: Partial<Row>): void {
    let found = false;
    const next = this.rows.map((r) => {
      if (r.id !== id) return r;
      found = true;
      return { ...r, ...patch };
    });
    if (found) this.set(next);
  }

  /** Add files to the batch, respecting the file-count and total-size caps. */
  add(files: { file: File; name?: string }[]): { added: number; message: string | null } {
    const currentBytes = this.rows.reduce((sum, r) => sum + r.size, 0);
    const plan = planBatch(this.rows.length, currentBytes, files.map((f) => f.file.size));
    const taken = new Set(this.rows.map((r) => r.outName.toLowerCase()));
    const created: Row[] = plan.accepted.map((i) => {
      const { file, name } = files[i];
      const shown = name ?? file.name;
      return {
        id: this.nextId++,
        name: shown,
        file,
        size: file.size,
        outName: uniqueName(jpgFileName(shown, this.extension), taken),
        status: "queued",
        stage: 0,
        sniff: null,
        info: null,
        width: null,
        height: null,
        out: null,
        thumb: null,
        note: null,
        error: null,
        flattened: null,
        usedQuality: null,
        fit: null,
        optionsKey: null,
        stale: false,
        refreshing: false,
      };
    });
    if (created.length) this.set([...this.rows, ...created]);
    this.pump();
    return { added: created.length, message: batchMessage(plan) };
  }

  remove(id: number): void {
    this.set(this.rows.filter((r) => r.id !== id));
  }

  clear(): void {
    this.set([]);
  }

  retry(id: number): void {
    this.patch(id, { status: "queued", stage: 0, error: null, stale: false, refreshing: false });
    this.pump();
  }

  /** Change the file extension; names are recomputed so they stay unique. No re-conversion is needed. */
  setExtension(extension: Extension): void {
    if (extension === this.extension) return;
    this.extension = extension;
    if (this.rows.length === 0) return;
    const names = assignOutNames(this.rows.map((r) => r.name), extension);
    this.set(this.rows.map((r, i) => ({ ...r, outName: names[i] })));
  }

  /** Change conversion options. Finished files are marked stale at once and converted again after a short pause. */
  setOptions(options: ConvertOptions): void {
    if (optionsKey(options) === optionsKey(this.options)) return;
    this.options = options;
    this.markStale();
    this.holdRefresh = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.holdRefresh = false;
      this.pump();
    }, this.debounceMs);
  }

  /** Flag finished rows that were made with different options. */
  private markStale(): void {
    const key = optionsKey(this.options);
    let changed = false;
    const next = this.rows.map((r) => {
      if (r.status === "done" && r.optionsKey !== key && !r.stale) {
        changed = true;
        return { ...r, stale: true };
      }
      return r;
    });
    if (changed) this.set(next);
  }

  private pump(): void {
    if (!this.running) return;
    while (this.active < this.concurrency) {
      const next =
        this.rows.find((r) => r.status === "queued") ??
        (this.holdRefresh ? undefined : this.rows.find((r) => r.status === "done" && r.stale && !r.refreshing));
      if (!next) break;
      this.active++;
      this.peakActive = Math.max(this.peakActive, this.active);
      void this.run(next);
    }
  }

  private async run(row: Row): Promise<void> {
    const opts = this.options;
    const key = optionsKey(opts);
    const refresh = row.status === "done";
    this.patch(row.id, refresh ? { refreshing: true, optionsKey: key } : { status: "working", stage: 1, error: null, optionsKey: key });
    try {
      const result = await this.process(row.file, opts, (u) => {
        // Progress updates only matter for a first conversion; a refresh keeps showing the old result.
        if (!refresh) this.patch(row.id, u);
      });
      // Options may have changed while this file was converting: it needs another pass.
      this.patch(row.id, { ...result, status: "done", stage: 3, error: null, optionsKey: key, refreshing: false, stale: key !== optionsKey(this.options) });
    } catch (e) {
      this.patch(row.id, { status: "error", stage: 0, error: messageOf(e), out: null, thumb: null, refreshing: false, stale: false });
    } finally {
      this.active--;
      this.markStale();
      this.pump();
    }
  }
}
