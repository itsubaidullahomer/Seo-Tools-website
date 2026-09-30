/**
 * A small external store that holds the files (and the pasted code) and converts
 * them one at a time.
 *
 * The component subscribes with useSyncExternalStore, so React state is never set
 * from an effect. The conversion itself is injected (`process`), which keeps the
 * scheduling logic testable without a browser.
 *
 * Every row has a `version` that changes whenever its source changes (the pasted
 * code is edited). A conversion that finishes for an older version is discarded,
 * so a slow render can never overwrite the result for newer code.
 */
import type { ConvertOptions, Job, JobResult } from "./convert";
import type { ParsedSvg } from "./parse";
import { GENERIC_ERROR, UserFacingError, batchMessage, planBatch, type OutputPlan } from "./svg";

export type RowStatus = "queued" | "working" | "done" | "error";
export type RowOrigin = "file" | "code";

export interface Row {
  id: number;
  origin: RowOrigin;
  /** File name, or "svg-code.svg" for pasted code. */
  name: string;
  file: File | null;
  code: string | null;
  /** Size of the input in bytes. */
  size: number;
  version: number;
  status: RowStatus;
  parsed: ParsedSvg | null;
  plan: OutputPlan | null;
  out: Blob | null;
  outFormat: "png" | "jpg" | null;
  transparent: boolean;
  dpiWritten: number | null;
  /** Small data-URL preview (no object URL to revoke). */
  thumb: string | null;
  blank: boolean;
  note: string | null;
  error: string | null;
  /** Options the current output (or error) was produced with. */
  optionsKey: string | null;
}

export type Processor = (job: Job, options: ConvertOptions) => Promise<JobResult>;

export const CODE_ROW_NAME = "svg-code.svg";

export function optionsKey(o: ConvertOptions): string {
  return JSON.stringify(o);
}

/** The parsed SVG a JobFailure carries, found structurally so it works however the modules were loaded. */
function parsedOf(e: unknown): ParsedSvg | null {
  const p = (e as { parsed?: ParsedSvg } | null)?.parsed;
  return p && typeof p.template === "string" ? p : null;
}

const byteLength = (text: string) => new TextEncoder().encode(text).length;

function messageOf(e: unknown): string {
  if (e instanceof UserFacingError) return e.message;
  return GENERIC_ERROR;
}

export class ConversionStore {
  private rows: Row[] = [];
  private listeners = new Set<() => void>();
  private active = 0;
  private running = true;
  private nextId = 1;
  private options: ConvertOptions | null = null;
  private optionsTimer: ReturnType<typeof setTimeout> | null = null;
  private codeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly process: Processor;
  private readonly concurrency: number;
  private readonly debounceMs: number;

  constructor(process: Processor, concurrency = 1, debounceMs = 200) {
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
    if (this.optionsTimer) clearTimeout(this.optionsTimer);
    if (this.codeTimer) clearTimeout(this.codeTimer);
    this.optionsTimer = null;
    this.codeTimer = null;
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

  private blank(origin: RowOrigin, name: string, size: number): Row {
    return {
      id: this.nextId++,
      origin,
      name,
      file: null,
      code: null,
      size,
      version: 1,
      status: "queued",
      parsed: null,
      plan: null,
      out: null,
      outFormat: null,
      transparent: false,
      dpiWritten: null,
      thumb: null,
      blank: false,
      note: null,
      error: null,
      optionsKey: null,
    };
  }

  /** Add uploaded files, respecting the file-count and total-size caps. */
  add(files: File[]): { added: number; message: string | null } {
    const current = this.rows.filter((r) => r.origin === "file");
    const plan = planBatch(
      current.length,
      current.reduce((sum, r) => sum + r.size, 0),
      files.map((f) => f.size),
    );
    const created = plan.accepted.map((i) => ({ ...this.blank("file", files[i].name || "image.svg", files[i].size), file: files[i] }));
    if (created.length) this.set([...this.rows, ...created]);
    this.pump();
    return { added: created.length, message: batchMessage(plan) };
  }

  /** Set the pasted SVG code. Empty text removes its row; edits are applied after a short pause. */
  setCode(text: string): void {
    if (this.codeTimer) clearTimeout(this.codeTimer);
    this.codeTimer = setTimeout(() => {
      this.codeTimer = null;
      this.applyCode(text);
    }, this.debounceMs);
  }

  private applyCode(text: string): void {
    const existing = this.rows.find((r) => r.origin === "code");
    if (text.trim() === "") {
      if (existing) this.set(this.rows.filter((r) => r.id !== existing.id));
      return;
    }
    if (existing) {
      if (existing.code === text) return;
      // Keep the old preview on screen until the new one is ready.
      this.patch(existing.id, { code: text, size: byteLength(text), version: existing.version + 1, status: "queued", parsed: null, error: null });
    } else {
      this.set([...this.rows, { ...this.blank("code", CODE_ROW_NAME, byteLength(text)), code: text }]);
    }
    this.pump();
  }

  remove(id: number): void {
    this.set(this.rows.filter((r) => r.id !== id));
  }

  /** Remove every row of one kind (the Clear all button of a tab). */
  clear(origin: RowOrigin): void {
    this.set(this.rows.filter((r) => r.origin !== origin));
  }

  retry(id: number): void {
    this.patch(id, { status: "queued", error: null });
    this.pump();
  }

  /** Change conversion options. The first call applies at once; later changes re-convert finished rows after a short pause. */
  setOptions(options: ConvertOptions): void {
    if (this.options && optionsKey(options) === optionsKey(this.options)) return;
    const first = this.options === null;
    this.options = options;
    if (first) {
      this.pump();
      return;
    }
    if (this.optionsTimer) clearTimeout(this.optionsTimer);
    this.optionsTimer = setTimeout(() => {
      this.optionsTimer = null;
      this.requeueStale();
    }, this.debounceMs);
  }

  /** Send finished (or failed) rows that were made with different options back to the queue. */
  private requeueStale(): void {
    if (!this.options) return;
    const key = optionsKey(this.options);
    let changed = false;
    const next = this.rows.map((r) => {
      if ((r.status === "done" || r.status === "error") && r.optionsKey !== key) {
        changed = true;
        return { ...r, status: "queued" as const };
      }
      return r;
    });
    if (changed) this.set(next);
    this.pump();
  }

  private pump(): void {
    if (!this.running || !this.options) return;
    while (this.active < this.concurrency) {
      const next = this.rows.find((r) => r.status === "queued");
      if (!next) break;
      this.active++;
      void this.run(next);
    }
  }

  private async run(row: Row): Promise<void> {
    const opts = this.options as ConvertOptions;
    const key = optionsKey(opts);
    const version = row.version;
    this.patch(row.id, { status: "working", error: null, optionsKey: key });
    try {
      const result = await this.process({ file: row.file, code: row.code, parsed: row.parsed }, opts);
      const current = this.rows.find((r) => r.id === row.id);
      if (current && current.version === version) {
        this.patch(row.id, { ...result, status: "done", error: null, optionsKey: key });
      }
    } catch (e) {
      const current = this.rows.find((r) => r.id === row.id);
      if (current && current.version === version) {
        this.patch(row.id, {
          status: "error",
          error: messageOf(e),
          parsed: parsedOf(e),
          out: null,
          outFormat: null,
          transparent: false,
          dpiWritten: null,
          thumb: null,
          plan: null,
          blank: false,
          note: null,
          optionsKey: key,
        });
      }
    } finally {
      this.active--;
      // Options changed while this row was converting and no re-run is scheduled yet.
      if (!this.optionsTimer && this.options && this.rows.some((r) => (r.status === "done" || r.status === "error") && r.optionsKey !== optionsKey(this.options!))) {
        this.requeueStale();
      } else {
        this.pump();
      }
    }
  }
}
