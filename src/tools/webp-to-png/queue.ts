/**
 * A small external store that converts files two at a time.
 *
 * The component subscribes with useSyncExternalStore, so React state is never set
 * from an effect. The conversion itself is injected (`process`), which keeps the
 * scheduling logic testable without a browser.
 */
import { batchMessage, planBatch, pngFileName, uniqueName } from "./batch";
import type { SniffedFormat, WebpInfo } from "./webp";

export type RowStatus = "queued" | "working" | "done" | "error";

export interface Row {
  id: number;
  /** Original file name (or pasted-image-N). */
  name: string;
  file: File;
  size: number;
  /** Unique PNG name used for downloads and inside the ZIP. */
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
  /** Options the current output was produced with. */
  optionsKey: string | null;
}

export interface ConvertOptions {
  /** CSS color used to fill transparent areas, or null to keep the alpha channel. */
  fillColor: string | null;
}

export type RowUpdate = Partial<Pick<Row, "stage" | "sniff" | "info" | "width" | "height" | "out" | "thumb" | "note">>;

export type Processor = (file: File, options: ConvertOptions, report: (update: RowUpdate) => void) => Promise<RowUpdate>;

export const CONCURRENCY = 2;

export function optionsKey(o: ConvertOptions): string {
  return o.fillColor ?? "transparent";
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
  private options: ConvertOptions = { fillColor: null };
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly process: Processor;
  private readonly concurrency: number;
  private readonly debounceMs: number;
  /** Highest number of conversions that ran at the same time (for tests). */
  peakActive = 0;

  constructor(process: Processor, concurrency = CONCURRENCY, debounceMs = 250) {
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
        outName: uniqueName(pngFileName(shown), taken),
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
        optionsKey: null,
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
    this.patch(id, { status: "queued", stage: 0, error: null });
    this.pump();
  }

  /** Change conversion options; finished files are re-converted after a short pause. */
  setOptions(options: ConvertOptions): void {
    if (optionsKey(options) === optionsKey(this.options)) return;
    this.options = options;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.requeueStale();
    }, this.debounceMs);
  }

  /** Send finished rows that were made with different options back to the queue. */
  private requeueStale(): void {
    const key = optionsKey(this.options);
    let changed = false;
    const next = this.rows.map((r) => {
      if (r.status === "done" && r.optionsKey !== key) {
        changed = true;
        return { ...r, status: "queued" as const, stage: 0, out: null };
      }
      return r;
    });
    if (changed) this.set(next);
    this.pump();
  }

  private pump(): void {
    if (!this.running) return;
    while (this.active < this.concurrency) {
      const next = this.rows.find((r) => r.status === "queued");
      if (!next) break;
      this.active++;
      this.peakActive = Math.max(this.peakActive, this.active);
      void this.run(next);
    }
  }

  private async run(row: Row): Promise<void> {
    const opts = this.options;
    const key = optionsKey(opts);
    this.patch(row.id, { status: "working", stage: 1, error: null, optionsKey: key });
    try {
      const result = await this.process(row.file, opts, (u) => {
        this.patch(row.id, u);
      });
      this.patch(row.id, { ...result, status: "done", stage: 3, error: null, optionsKey: key });
    } catch (e) {
      this.patch(row.id, { status: "error", stage: 0, error: messageOf(e), out: null });
    } finally {
      this.active--;
      // Options changed while this file was converting and no re-run is scheduled yet.
      if (!this.timer && this.rows.some((r) => r.status === "done" && r.optionsKey !== optionsKey(this.options))) this.requeueStale();
      else this.pump();
    }
  }
}
