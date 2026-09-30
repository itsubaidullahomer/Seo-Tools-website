/**
 * Pure logic for the click speed test. Nothing in this file touches the DOM,
 * so it can be unit-tested (and it is server-render safe).
 *
 * All click times are milliseconds since the first click of the test (the
 * first click is therefore at 0 ms and is counted).
 */

export const PRESET_SECONDS = [1, 2, 5, 10, 30, 60] as const;
export const MIN_CUSTOM_SECONDS = 1;
export const MAX_CUSTOM_SECONDS = 300;

/** Two clicks closer together than this are flagged as a "fast gap". */
export const FAST_GAP_MS = 30;

/** Ignore pad clicks for this long after a test ends, so the last frantic clicks cannot restart it. */
export const RESTART_COOLDOWN_MS = 700;

/** Safety cap so a stuck or automated input device cannot grow the click log without bound. */
export const MAX_CLICKS = 50_000;

export type InputMode = "pointer" | "space";
export type ButtonMode = "left" | "right" | "any";

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export interface Settings {
  /** One of the preset lengths as a string, or "custom". */
  length: string;
  /** Text of the custom-length box, kept as typed. */
  customText: string;
  input: InputMode;
  button: ButtonMode;
}

export const DEFAULT_SETTINGS: Settings = { length: "10", customText: "15", input: "pointer", button: "left" };

/** Parse the custom-length box. Returns whole seconds, or null when the text is not a valid length. */
export function parseCustomSeconds(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d{1,4}$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n >= MIN_CUSTOM_SECONDS && n <= MAX_CUSTOM_SECONDS ? n : null;
}

/** Test length in seconds for the given settings, or null when a custom length is invalid. */
export function durationSeconds(settings: Pick<Settings, "length" | "customText">): number | null {
  if (settings.length === "custom") return parseCustomSeconds(settings.customText);
  const n = Number(settings.length);
  return (PRESET_SECONDS as readonly number[]).includes(n) ? n : null;
}

/** Repair anything read back from storage so a stale or hand-edited value can never break the tool. */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const length =
    r.length === "custom" || (typeof r.length === "string" && (PRESET_SECONDS as readonly number[]).includes(Number(r.length)))
      ? (r.length as string)
      : DEFAULT_SETTINGS.length;
  const customText = typeof r.customText === "string" && r.customText.length <= 4 ? r.customText : DEFAULT_SETTINGS.customText;
  const input: InputMode = r.input === "space" ? "space" : "pointer";
  const button: ButtonMode = r.button === "right" || r.button === "any" ? r.button : "left";
  return { length, customText, input, button };
}

/* ------------------------------------------------------------------ */
/* Personal bests                                                      */
/* ------------------------------------------------------------------ */

export interface Best {
  cps: number;
  clicks: number;
  /** ISO date, YYYY-MM-DD. */
  date: string;
}

export type Bests = Record<string, Best>;

export function bestKey(seconds: number, input: InputMode): string {
  return `${seconds}:${input}`;
}

export function sanitizeBests(raw: unknown): Bests {
  const out: Bests = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{1,3}:(pointer|space)$/.test(key) || !value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    const cps = Number(v.cps);
    const clicks = Number(v.clicks);
    if (!Number.isFinite(cps) || !Number.isFinite(clicks) || cps <= 0 || clicks <= 0 || cps > 1000) continue;
    out[key] = { cps, clicks: Math.round(clicks), date: typeof v.date === "string" ? v.date.slice(0, 10) : "" };
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Speed calculations                                                  */
/* ------------------------------------------------------------------ */

/** Clicks per second over a fixed window. */
export function cps(clicks: number, seconds: number): number {
  return seconds > 0 && clicks > 0 ? clicks / seconds : 0;
}

/**
 * The rate "right now": clicks in the last second, divided by the length of
 * that window. The window is never shorter than half a second, so the first
 * click of a test cannot show an absurd spike.
 */
export function liveCps(times: readonly number[], elapsedMs: number): number {
  if (times.length === 0 || elapsedMs <= 0) return 0;
  const windowMs = Math.min(1000, Math.max(500, elapsedMs));
  const cutoff = elapsedMs - windowMs;
  let count = 0;
  for (let i = times.length - 1; i >= 0 && times[i] > cutoff; i--) count++;
  return count / (windowMs / 1000);
}

/** Running average while a test is in progress (same half-second floor as liveCps). */
export function runningAverage(clicks: number, elapsedMs: number): number {
  if (clicks <= 0 || elapsedMs <= 0) return 0;
  return clicks / (Math.max(500, elapsedMs) / 1000);
}

/** Highest number of clicks inside any sliding window of `windowMs` (default 1 second), as a per-second rate. */
export function peakCps(times: readonly number[], durationMs: number, windowMs = 1000): number {
  if (times.length === 0) return 0;
  const w = Math.min(windowMs, durationMs);
  if (w <= 0) return 0;
  let best = 0;
  let j = 0;
  for (let i = 0; i < times.length; i++) {
    if (j < i) j = i;
    while (j < times.length && times[j] - times[i] < w) j++;
    best = Math.max(best, j - i);
  }
  return best / (w / 1000);
}

export function gaps(times: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < times.length; i++) out.push(times[i] - times[i - 1]);
  return out;
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface Bucket {
  /** Start of the bucket in ms. */
  start: number;
  /** Actual width of the bucket in ms (the last one can be shorter). */
  width: number;
  clicks: number;
  /** Clicks per second inside the bucket. */
  rate: number;
}

/** Width of one chart bar: quarter-seconds for very short tests, whole seconds up to 60 bars, then wider. */
export function bucketWidthMs(durationMs: number): number {
  if (durationMs <= 2000) return 250;
  return Math.max(1000, Math.ceil(durationMs / 60000) * 1000);
}

export function buildBuckets(times: readonly number[], durationMs: number): Bucket[] {
  const width = bucketWidthMs(durationMs);
  const count = Math.max(1, Math.ceil(durationMs / width));
  const buckets: Bucket[] = [];
  for (let i = 0; i < count; i++) {
    const start = i * width;
    const w = Math.min(width, durationMs - start);
    buckets.push({ start, width: w, clicks: 0, rate: 0 });
  }
  for (const t of times) {
    if (t < 0 || t >= durationMs) continue;
    buckets[Math.min(count - 1, Math.floor(t / width))].clicks++;
  }
  for (const b of buckets) b.rate = b.width > 0 ? b.clicks / (b.width / 1000) : 0;
  return buckets;
}

export interface Summary {
  durationMs: number;
  clicks: number;
  cps: number;
  peak: number;
  fastestGapMs: number | null;
  medianGapMs: number | null;
  /** Number of clicks that arrived less than FAST_GAP_MS after the previous one. */
  fastGaps: number;
  /** CPS in the first and second half of the test (only for tests of 5 s or longer). */
  firstHalf: number | null;
  secondHalf: number | null;
  /** Relative change from first to second half, e.g. -0.14 for a 14 percent drop. */
  fade: number | null;
  buckets: Bucket[];
}

export function summarize(times: readonly number[], durationMs: number): Summary {
  const valid = times.filter((t) => t >= 0 && t < durationMs);
  const g = gaps(valid);
  const seconds = durationMs / 1000;
  let firstHalf: number | null = null;
  let secondHalf: number | null = null;
  let fade: number | null = null;
  if (durationMs >= 5000) {
    const half = durationMs / 2;
    const a = valid.filter((t) => t < half).length;
    const b = valid.length - a;
    firstHalf = a / (half / 1000);
    secondHalf = b / (half / 1000);
    fade = a > 0 ? (secondHalf - firstHalf) / firstHalf : null;
  }
  return {
    durationMs,
    clicks: valid.length,
    cps: cps(valid.length, seconds),
    peak: peakCps(valid, durationMs),
    fastestGapMs: g.length ? Math.min(...g) : null,
    medianGapMs: median(g),
    fastGaps: g.filter((x) => x < FAST_GAP_MS).length,
    firstHalf,
    secondHalf,
    fade,
    buckets: buildBuckets(valid, durationMs),
  };
}

/* ------------------------------------------------------------------ */
/* Labels and formatting                                               */
/* ------------------------------------------------------------------ */

/** Our own rough scale, shown as a label only. It is not a population norm. */
export function paceLabel(rate: number): string {
  if (rate <= 0) return "No clicks";
  if (rate < 3) return "Relaxed";
  if (rate < 5) return "Steady";
  if (rate < 7) return "Quick";
  if (rate < 9) return "Fast";
  if (rate < 12) return "Very fast";
  return "Extreme";
}

export function formatCps(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.00";
}

export function formatMs(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "–";
  return ms < 10 ? `${ms.toFixed(1)} ms` : `${Math.round(ms)} ms`;
}

export function formatSeconds(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(2)} s`;
}

export function lengthLabel(seconds: number): string {
  return seconds === 60 ? "60 s" : `${seconds} s`;
}

/** Was this pointer press one the current button setting should count? */
export function buttonCounts(mode: ButtonMode, button: number, pointerType: string): boolean {
  // Touch and pen contacts report button 0, so they behave like a left click.
  if (pointerType === "touch" || pointerType === "pen") return mode !== "right";
  if (mode === "any") return button === 0 || button === 1 || button === 2;
  if (mode === "right") return button === 2;
  return button === 0;
}

/** Name of the source of one counted click, used for the per-button tally and the CSV log. */
export function clickSource(button: number, pointerType: string): string {
  if (pointerType === "touch") return "touch";
  if (pointerType === "pen") return "pen";
  return button === 2 ? "right" : button === 1 ? "middle" : "left";
}

const SOURCE_ORDER = ["left", "middle", "right", "touch", "pen", "space"];

/** Count clicks per source, in a fixed order, leaving out sources that were never used. */
export function tallySources(sources: readonly string[]): { source: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of sources) counts.set(s, (counts.get(s) ?? 0) + 1);
  return SOURCE_ORDER.filter((s) => counts.has(s)).map((s) => ({ source: s, count: counts.get(s) ?? 0 }));
}

export function formatTally(tally: readonly { source: string; count: number }[]): string {
  return tally.map((t) => `${t.source[0].toUpperCase()}${t.source.slice(1)} ${t.count}`).join(" · ");
}

export function buttonModeLabel(mode: ButtonMode): string {
  return mode === "right" ? "right button" : mode === "any" ? "any button" : "left button";
}

export interface Insight {
  variant: "success" | "warning";
  title: string;
  body: string;
}

/** One short, specific note about a finished test. Only the most useful observation is shown. */
export function buildInsight(s: Summary): Insight {
  const title = `${formatCps(s.cps)} CPS · ${paceLabel(s.cps)}`;
  const seconds = s.durationMs / 1000;
  if (s.fastGaps > 0) {
    const n = s.fastGaps;
    return {
      variant: "warning",
      title,
      body: `${n} ${n === 1 ? "click landed" : "clicks landed"} less than ${FAST_GAP_MS} ms after the previous one. That fits a drag or butterfly burst, a duplicate touch, or a worn switch. Repeat with one finger to tell which.`,
    };
  }
  if (s.fade !== null && s.firstHalf !== null && s.secondHalf !== null && Math.abs(s.fade) >= 0.1) {
    const pct = Math.round(Math.abs(s.fade) * 100);
    const pair = `${formatCps(s.firstHalf, 1)} then ${formatCps(s.secondHalf, 1)} CPS`;
    return {
      variant: "success",
      title,
      body:
        s.fade < 0
          ? `You slowed by ${pct}% in the second half (${pair}). A shorter test, or a slightly easier rhythm, would hold your best rate.`
          : `You sped up by ${pct}% in the second half (${pair}), so the first seconds were a warm-up. Try again for a stronger start.`,
    };
  }
  return {
    variant: "success",
    title,
    body: `${s.clicks} ${s.clicks === 1 ? "click" : "clicks"} in ${seconds} s. Your fastest 1-second window reached ${formatCps(s.peak, 1)} CPS.`,
  };
}

/** Plain-text report for the Copy button. */
export function buildReport(
  summary: Summary,
  input: InputMode,
  button: ButtonMode,
  dateIso: string,
  tally: readonly { source: string; count: number }[] = [],
): string {
  const seconds = summary.durationMs / 1000;
  const lines = [
    `Click speed test result (${dateIso})`,
    `Test length: ${seconds} s`,
    `Input: ${input === "space" ? "spacebar" : `mouse or touch, ${buttonModeLabel(button)}`}`,
    `Total clicks: ${summary.clicks}`,
    `Clicks per second (CPS): ${formatCps(summary.cps)}`,
    `Peak CPS in any 1-second window: ${formatCps(summary.peak, 1)}`,
    `Fastest gap between clicks: ${formatMs(summary.fastestGapMs)}`,
    `Median gap between clicks: ${formatMs(summary.medianGapMs)}`,
    `Gaps under ${FAST_GAP_MS} ms: ${summary.fastGaps}`,
  ];
  if (input === "pointer" && button === "any" && tally.length > 0) lines.push(`Clicks by source: ${formatTally(tally)}`);
  if (summary.fade !== null && summary.firstHalf !== null && summary.secondHalf !== null) {
    lines.push(`First half / second half CPS: ${formatCps(summary.firstHalf)} / ${formatCps(summary.secondHalf)}`);
  }
  return lines.join("\n");
}

/** CSV of every click: number, time since first click, gap since previous click, and where the click came from. */
export function buildCsv(times: readonly number[], sources: readonly string[] = []): string {
  const rows = ["click,time_ms,gap_ms,source"];
  times.forEach((t, i) => {
    rows.push(`${i + 1},${t.toFixed(1)},${i === 0 ? "" : (t - times[i - 1]).toFixed(1)},${sources[i] ?? ""}`);
  });
  return rows.join("\n") + "\n";
}
