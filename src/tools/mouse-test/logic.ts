/**
 * Pure logic for the mouse test. Nothing in this file touches the DOM, so it is
 * server-render safe and can be unit-tested in Node.
 *
 * All times are milliseconds. Session times are relative to the first event of
 * the session (the first event is at 0 ms).
 */

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

/** MouseEvent.button values 0-4: main, auxiliary (middle), secondary, fourth (back), fifth (forward). */
export type ButtonId = 0 | 1 | 2 | 3 | 4;

export const BUTTON_IDS: readonly ButtonId[] = [0, 1, 2, 3, 4];

export const BUTTON_INFO: Record<ButtonId, { name: string; /** Bit in MouseEvent.buttons. */ bit: number }> = {
  0: { name: "Left", bit: 1 },
  1: { name: "Middle", bit: 4 },
  2: { name: "Right", bit: 2 },
  3: { name: "Back", bit: 8 },
  4: { name: "Forward", bit: 16 },
};

export function isButtonId(n: number): n is ButtonId {
  return Number.isInteger(n) && n >= 0 && n <= 4;
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

/** Two presses of the same button closer together than this are flagged. */
export const DEFAULT_THRESHOLD_MS = 80;
export const MIN_THRESHOLD_MS = 20;
export const MAX_THRESHOLD_MS = 300;

/** A scroll event in the opposite direction this soon after the previous one is counted as a direction flip. */
export const FLIP_MS = 150;

/** Wheel events of the same direction closer than this share one log line. */
export const WHEEL_MERGE_MS = 400;

export const MAX_LOG = 80;
export const MAX_GAPS = 500;

export interface Settings {
  threshold: number;
  /** Stop the page scrolling while the pointer is over the test area. */
  captureScroll: boolean;
}

export const DEFAULT_SETTINGS: Settings = { threshold: DEFAULT_THRESHOLD_MS, captureScroll: true };

export function clampThreshold(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_THRESHOLD_MS;
  return Math.min(MAX_THRESHOLD_MS, Math.max(MIN_THRESHOLD_MS, Math.round(n)));
}

/** Repair anything read back from storage so a stale or hand-edited value can never break the tool. */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const threshold = typeof r.threshold === "number" ? clampThreshold(r.threshold) : DEFAULT_THRESHOLD_MS;
  return { threshold, captureScroll: r.captureScroll !== false };
}

/* ------------------------------------------------------------------ */
/* Session state                                                       */
/* ------------------------------------------------------------------ */

export type WheelDir = "up" | "down" | "left" | "right";

/** One press that followed an earlier press of the same button. */
export interface PressGap {
  /** Session time of the press. */
  t: number;
  /** Time since the previous press of this button (down to down). */
  gap: number;
  /** Time since this button was last released (up to down), or null if it never was. */
  releaseGap: number | null;
}

export interface ButtonStat {
  down: boolean;
  downAt: number | null;
  presses: number;
  releases: number;
  lastDownAt: number | null;
  lastUpAt: number | null;
  gaps: PressGap[];
  minHold: number | null;
  maxHold: number | null;
}

export interface WheelStat {
  up: number;
  down: number;
  left: number;
  right: number;
  flips: number;
  lastDir: WheelDir | null;
  lastAt: number | null;
  last: { dx: number; dy: number; mode: number } | null;
}

export type LogKind = "down" | "up" | "wheel" | "dblclick" | "extra";

export interface LogEntry {
  id: number;
  /** Session time of the (latest) event on this line. */
  t: number;
  kind: LogKind;
  button?: ButtonId;
  /** For "down": ms since the previous press of the same button. */
  gapMs?: number | null;
  /** For "down": ms since that button was last released. */
  releaseGapMs?: number | null;
  /** For "up": how long the button was held. */
  holdMs?: number;
  dir?: WheelDir;
  /** For "wheel": how many wheel events are merged into this line. */
  count?: number;
  flip?: boolean;
  dx?: number;
  dy?: number;
  mode?: number;
  /** For "extra": the raw MouseEvent.button value. */
  raw?: number;
}

export interface Session {
  startedAt: number | null;
  buttons: Record<ButtonId, ButtonStat>;
  wheel: WheelStat;
  /** Browser "dblclick" events (the operating system's own double-click rule). */
  dblclicks: number;
  /** Presses of buttons beyond the five standard ones. */
  extra: number;
  log: LogEntry[];
  nextId: number;
}

function emptyButton(): ButtonStat {
  return { down: false, downAt: null, presses: 0, releases: 0, lastDownAt: null, lastUpAt: null, gaps: [], minHold: null, maxHold: null };
}

export function createSession(): Session {
  return {
    startedAt: null,
    buttons: { 0: emptyButton(), 1: emptyButton(), 2: emptyButton(), 3: emptyButton(), 4: emptyButton() },
    wheel: { up: 0, down: 0, left: 0, right: 0, flips: 0, lastDir: null, lastAt: null, last: null },
    dblclicks: 0,
    extra: 0,
    log: [],
    nextId: 1,
  };
}

export type Action =
  | { type: "down"; button: number; ts: number }
  | { type: "up"; button: number; ts: number }
  | { type: "wheel"; ts: number; dx: number; dy: number; mode: number }
  | { type: "dblclick"; ts: number }
  /** Window lost focus: forget held buttons without counting anything. */
  | { type: "release-all" }
  | { type: "reset" };

function pushLog(session: Session, entry: Omit<LogEntry, "id">): { log: LogEntry[]; nextId: number } {
  const log = [...session.log, { ...entry, id: session.nextId }];
  if (log.length > MAX_LOG) log.splice(0, log.length - MAX_LOG);
  return { log, nextId: session.nextId + 1 };
}

function relTime(session: Session, ts: number): { startedAt: number; rel: number } {
  const startedAt = session.startedAt ?? ts;
  return { startedAt, rel: Math.max(0, ts - startedAt) };
}

export function wheelDirection(dx: number, dy: number): WheelDir | null {
  if (dy === 0 && dx === 0) return null;
  if (Math.abs(dy) >= Math.abs(dx)) return dy < 0 ? "up" : "down";
  return dx < 0 ? "left" : "right";
}

const OPPOSITE: Record<WheelDir, WheelDir> = { up: "down", down: "up", left: "right", right: "left" };

export function sessionReducer(session: Session, action: Action): Session {
  switch (action.type) {
    case "reset":
      return createSession();

    case "release-all": {
      const buttons = { ...session.buttons };
      for (const id of BUTTON_IDS) {
        if (buttons[id].down) buttons[id] = { ...buttons[id], down: false, downAt: null };
      }
      return { ...session, buttons };
    }

    case "down": {
      if (!Number.isFinite(action.ts)) return session;
      const { startedAt, rel } = relTime(session, action.ts);
      if (!isButtonId(action.button)) {
        const l = pushLog(session, { t: rel, kind: "extra", raw: action.button });
        return { ...session, startedAt, extra: session.extra + 1, ...l };
      }
      const id = action.button;
      const prev = session.buttons[id];
      const gap = prev.lastDownAt !== null ? rel - prev.lastDownAt : null;
      const releaseGap = prev.lastUpAt !== null ? rel - prev.lastUpAt : null;
      const gaps = gap !== null ? [...prev.gaps, { t: rel, gap, releaseGap }].slice(-MAX_GAPS) : prev.gaps;
      const stat: ButtonStat = { ...prev, down: true, downAt: rel, presses: prev.presses + 1, lastDownAt: rel, gaps };
      const l = pushLog(session, { t: rel, kind: "down", button: id, gapMs: gap, releaseGapMs: releaseGap });
      return { ...session, startedAt, buttons: { ...session.buttons, [id]: stat }, ...l };
    }

    case "up": {
      if (!Number.isFinite(action.ts) || !isButtonId(action.button)) return session;
      const id = action.button;
      const prev = session.buttons[id];
      if (!prev.down || prev.downAt === null) return session; // press started elsewhere; nothing to close
      const { startedAt, rel } = relTime(session, action.ts);
      const hold = Math.max(0, rel - prev.downAt);
      const stat: ButtonStat = {
        ...prev,
        down: false,
        downAt: null,
        releases: prev.releases + 1,
        lastUpAt: rel,
        minHold: prev.minHold === null ? hold : Math.min(prev.minHold, hold),
        maxHold: prev.maxHold === null ? hold : Math.max(prev.maxHold, hold),
      };
      const l = pushLog(session, { t: rel, kind: "up", button: id, holdMs: hold });
      return { ...session, startedAt, buttons: { ...session.buttons, [id]: stat }, ...l };
    }

    case "wheel": {
      if (!Number.isFinite(action.ts)) return session;
      const dir = wheelDirection(action.dx, action.dy);
      if (!dir) return session;
      const { startedAt, rel } = relTime(session, action.ts);
      const w = session.wheel;
      const flip = w.lastDir !== null && w.lastAt !== null && w.lastDir === OPPOSITE[dir] && rel - w.lastAt < FLIP_MS;
      const wheel: WheelStat = {
        ...w,
        [dir]: w[dir] + 1,
        flips: w.flips + (flip ? 1 : 0),
        lastDir: dir,
        lastAt: rel,
        last: { dx: action.dx, dy: action.dy, mode: action.mode },
      };
      const tail = session.log[session.log.length - 1];
      if (!flip && tail && tail.kind === "wheel" && !tail.flip && tail.dir === dir && rel - tail.t < WHEEL_MERGE_MS) {
        const merged: LogEntry = { ...tail, t: rel, count: (tail.count ?? 1) + 1, dx: action.dx, dy: action.dy, mode: action.mode };
        return { ...session, startedAt, wheel, log: [...session.log.slice(0, -1), merged] };
      }
      const l = pushLog(session, { t: rel, kind: "wheel", dir, count: 1, flip, dx: action.dx, dy: action.dy, mode: action.mode });
      return { ...session, startedAt, wheel, ...l };
    }

    case "dblclick": {
      if (!Number.isFinite(action.ts)) return session;
      const { startedAt, rel } = relTime(session, action.ts);
      const l = pushLog(session, { t: rel, kind: "dblclick" });
      return { ...session, startedAt, dblclicks: session.dblclicks + 1, ...l };
    }

    default:
      return session;
  }
}

/* ------------------------------------------------------------------ */
/* Derived numbers                                                     */
/* ------------------------------------------------------------------ */

export interface ButtonSummary {
  id: ButtonId;
  name: string;
  down: boolean;
  presses: number;
  tested: boolean;
  /** Shortest gap between two presses of this button, or null if it was pressed fewer than twice. */
  fastestGap: number | null;
  /** Presses that came less than `threshold` ms after the previous press of the same button. */
  flagged: number;
  minHold: number | null;
  maxHold: number | null;
}

export function summarizeButtons(session: Session, threshold: number): ButtonSummary[] {
  return BUTTON_IDS.map((id) => {
    const s = session.buttons[id];
    let fastest: number | null = null;
    let flagged = 0;
    for (const g of s.gaps) {
      if (fastest === null || g.gap < fastest) fastest = g.gap;
      if (g.gap < threshold) flagged++;
    }
    return {
      id,
      name: BUTTON_INFO[id].name,
      down: s.down,
      presses: s.presses,
      tested: s.presses > 0,
      fastestGap: fastest,
      flagged,
      minHold: s.minHold,
      maxHold: s.maxHold,
    };
  });
}

export interface Totals {
  presses: number;
  flagged: number;
  fastestGap: number | null;
  tested: number;
}

export function totalsOf(summaries: ButtonSummary[]): Totals {
  let fastest: number | null = null;
  let presses = 0;
  let flagged = 0;
  let tested = 0;
  for (const s of summaries) {
    presses += s.presses;
    flagged += s.flagged;
    if (s.tested) tested++;
    if (s.fastestGap !== null && (fastest === null || s.fastestGap < fastest)) fastest = s.fastestGap;
  }
  return { presses, flagged, fastestGap: fastest, tested };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/**
 * 7.83 -> "7.8 ms", 79.9 -> "79.9 ms", 84 -> "84 ms", 1234 -> "1,234 ms".
 * Below 100 ms one decimal is kept (without a trailing .0), so a gap of 79.9 ms that is
 * flagged against an 80 ms limit never reads as "80 ms".
 */
export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "–";
  if (ms < 10) return `${ms.toFixed(1)} ms`;
  if (ms < 100) return `${Number(ms.toFixed(1))} ms`;
  return `${Math.round(ms).toLocaleString("en-US")} ms`;
}

export function formatClock(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(3)} s`;
}

function formatDelta(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function deltaUnit(mode: number): string {
  return mode === 1 ? "lines" : mode === 2 ? "pages" : "px";
}

export function describeEntry(entry: LogEntry, threshold: number): { text: string; flagged: boolean } {
  switch (entry.kind) {
    case "down": {
      const name = BUTTON_INFO[entry.button ?? 0].name;
      const gap = entry.gapMs ?? null;
      const flagged = gap !== null && gap < threshold;
      let text = `${name} pressed`;
      if (gap !== null) {
        text += ` · ${formatMs(gap)} after the previous press`;
        if (entry.releaseGapMs !== null && entry.releaseGapMs !== undefined) text += ` (${formatMs(entry.releaseGapMs)} after release)`;
      }
      if (flagged) text += " · FLAGGED";
      return { text, flagged };
    }
    case "up":
      return { text: `${BUTTON_INFO[entry.button ?? 0].name} released · held ${formatMs(entry.holdMs ?? 0)}`, flagged: false };
    case "wheel": {
      const axis = entry.dir === "left" || entry.dir === "right" ? "x" : "y";
      const delta = axis === "x" ? entry.dx ?? 0 : entry.dy ?? 0;
      const count = entry.count ?? 1;
      let text = `Wheel ${entry.dir}${count > 1 ? ` ×${count}` : ""} · last Δ${axis} ${formatDelta(delta)} ${deltaUnit(entry.mode ?? 0)}`;
      if (entry.flip) text += " · DIRECTION FLIP";
      return { text, flagged: !!entry.flip };
    }
    case "dblclick":
      return { text: "Double-click event (browser)", flagged: false };
    case "extra":
      return { text: `Extra button ${entry.raw} pressed`, flagged: false };
    default:
      return { text: "", flagged: false };
  }
}

/* ------------------------------------------------------------------ */
/* Verdict for the double-click detector                               */
/* ------------------------------------------------------------------ */

export interface Verdict {
  variant: "info" | "success" | "warning";
  title: string;
  body: string;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function buildVerdict(summaries: ButtonSummary[], threshold: number): Verdict {
  const totals = totalsOf(summaries);
  if (totals.presses === 0) {
    return {
      variant: "info",
      title: "Waiting for clicks",
      body: `Click inside the test area, slowly and once at a time, about one press per second. Two presses of the same button closer together than ${threshold} ms will be flagged.`,
    };
  }
  const bad = summaries.filter((s) => s.flagged > 0);
  if (bad.length > 0) {
    const worst = [...bad].sort((a, b) => b.flagged - a.flagged)[0];
    const names = joinNames(bad.map((s) => s.name));
    return {
      variant: "warning",
      title: `Possible double-click fault: ${names} ${bad.length === 1 ? "button" : "buttons"}`,
      body: `${worst.flagged} of ${worst.presses} presses on the ${worst.name} button came less than ${threshold} ms after the previous press (fastest ${formatMs(worst.fastestGap)}). If you were clicking slowly, that points to a worn switch or a debounce setting that is too short. Repeat with deliberate single clicks to confirm.`,
    };
  }
  if (totals.presses < 10) {
    return {
      variant: "info",
      title: `No fast repeats yet (${totals.presses} ${totals.presses === 1 ? "press" : "presses"})`,
      body: "Keep clicking slowly. A failing switch may double-register only one press in twenty or more, so a handful of clicks proves little.",
    };
  }
  return {
    variant: "success",
    title: "No unintended double clicks detected",
    body: `${totals.presses} presses, and no two presses of the same button came less than ${threshold} ms apart. The closest pair was ${formatMs(totals.fastestGap)}. That is a good sign, but faults can be intermittent, so repeat the test if the mouse still misbehaves.`,
  };
}

/* ------------------------------------------------------------------ */
/* Polling rate estimate                                               */
/* ------------------------------------------------------------------ */

/** A gap longer than this ends a run of continuous movement (125 Hz mice send every 8 ms). */
export const POLL_RUN_GAP_MS = 25;
/** A run must last at least this long, and hold this many events, before it counts. */
export const POLL_MIN_RUN_MS = 300;
export const POLL_MIN_EVENTS = 20;
/** The estimate is capped here. */
export const POLL_MAX_RATE = 8000;
/** A run measuring above this is treated as a timing artifact and ignored. */
export const POLL_BOGUS_RATE = 8800;

export const STANDARD_RATES: readonly number[] = [125, 250, 500, 1000, 2000, 4000, 8000];

export interface PollSnapshot {
  /** Events counted so far. */
  events: number;
  /** Runs of continuous movement long enough to count. */
  runs: number;
  /** Most recent measurement, events per second. */
  latestHz: number;
  /** Highest measurement, capped at POLL_MAX_RATE. This is the estimate. */
  bestHz: number;
  /** Runs discarded because they measured implausibly high. */
  discarded: number;
}

export const EMPTY_POLL: PollSnapshot = { events: 0, runs: 0, latestHz: 0, bestHz: 0, discarded: 0 };

/**
 * Turns a stream of pointer update timestamps into a polling-rate estimate.
 *
 * A mouse only reports while it moves, so the tracker looks for runs of
 * continuous movement (no gap over POLL_RUN_GAP_MS) that last at least
 * POLL_MIN_RUN_MS, measures events per second inside each run, and keeps the
 * highest reading. Slow movement reads low; fast circles read closest to the
 * hardware setting.
 */
export class PollingTracker {
  private events = 0;
  private runs = 0;
  private latestHz = 0;
  private bestHz = 0;
  private discarded = 0;
  private runStart = 0;
  private last = 0;
  private count = 0;
  private qualified = false;

  push(ts: number): void {
    if (!Number.isFinite(ts)) return;
    if (this.count > 0 && ts < this.last) return; // out of order: ignore
    this.events++;
    if (this.count === 0) {
      this.startRun(ts);
      return;
    }
    if (ts - this.last > POLL_RUN_GAP_MS) {
      this.endRun();
      this.startRun(ts);
      return;
    }
    this.count++;
    this.last = ts;
    const dur = this.last - this.runStart;
    if (dur >= POLL_MIN_RUN_MS && this.count >= POLL_MIN_EVENTS) {
      const hz = (this.count - 1) / (dur / 1000);
      if (hz > POLL_BOGUS_RATE) {
        this.discarded++;
        return;
      }
      this.qualified = true;
      this.latestHz = hz;
      this.bestHz = Math.max(this.bestHz, Math.min(hz, POLL_MAX_RATE));
    }
  }

  reset(): void {
    this.events = 0;
    this.runs = 0;
    this.latestHz = 0;
    this.bestHz = 0;
    this.discarded = 0;
    this.runStart = 0;
    this.last = 0;
    this.count = 0;
    this.qualified = false;
  }

  private startRun(ts: number): void {
    this.runStart = ts;
    this.last = ts;
    this.count = 1;
    this.qualified = false;
  }

  private endRun(): void {
    if (this.qualified) this.runs++;
    this.count = 0;
    this.qualified = false;
  }

  snapshot(): PollSnapshot {
    return {
      events: this.events,
      runs: this.runs + (this.qualified ? 1 : 0),
      latestHz: this.latestHz,
      bestHz: this.bestHz,
      discarded: this.discarded,
    };
  }
}

/** The common setting closest to `hz`, or null when the reading is not within 15 percent of any of them. */
export function snapRate(hz: number): number | null {
  if (!Number.isFinite(hz) || hz <= 0) return null;
  let best: number | null = null;
  let bestErr = Infinity;
  for (const r of STANDARD_RATES) {
    const err = Math.abs(hz - r) / r;
    if (err < bestErr) {
      bestErr = err;
      best = r;
    }
  }
  return bestErr <= 0.15 ? best : null;
}

/** Milliseconds between updates at a given rate. */
export function intervalMs(hz: number): number {
  return hz > 0 ? 1000 / hz : 0;
}

export function describePolling(snap: PollSnapshot): { headline: string; detail: string } | null {
  if (snap.bestHz <= 0) return null;
  const nominal = snapRate(snap.bestHz);
  const shown = nominal ?? Math.max(1, Math.round(snap.bestHz / 10) * 10);
  const capped = snap.bestHz >= POLL_MAX_RATE;
  const headline = `≈ ${shown.toLocaleString("en-US")} Hz${capped ? " (cap)" : ""}`;
  const detail = `Peak measured ${Math.round(snap.bestHz).toLocaleString("en-US")} updates per second, about ${intervalMs(nominal ?? snap.bestHz).toFixed(2)} ms between updates.`;
  return { headline, detail };
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

export function buildReport(session: Session, threshold: number, poll: PollSnapshot | null, date: string): string {
  const summaries = summarizeButtons(session, threshold);
  const totals = totalsOf(summaries);
  const verdict = buildVerdict(summaries, threshold);
  const w = session.wheel;
  const lines: string[] = [];
  lines.push("Mouse test report");
  if (date) lines.push(`Date: ${date}`);
  lines.push("");
  lines.push(`Buttons (${totals.tested} of 5 registered)`);
  for (const s of summaries) {
    lines.push(
      s.presses === 0
        ? `  ${s.name}: not tested`
        : `  ${s.name}: ${s.presses} press${s.presses === 1 ? "" : "es"}, fastest repeat ${formatMs(s.fastestGap)}, flagged ${s.flagged}, shortest hold ${formatMs(s.minHold)}`,
    );
  }
  if (session.extra > 0) lines.push(`  Extra buttons: ${session.extra} press${session.extra === 1 ? "" : "es"}`);
  lines.push("");
  lines.push(`Double-click detector (threshold ${threshold} ms)`);
  lines.push(`  ${verdict.title}`);
  lines.push(`  Flagged presses: ${totals.flagged} of ${totals.presses}`);
  lines.push(`  Browser double-click events: ${session.dblclicks}`);
  lines.push("");
  lines.push("Scroll wheel");
  lines.push(`  Up ${w.up}, down ${w.down}, left ${w.left}, right ${w.right}`);
  lines.push(`  Direction flips (opposite direction within ${FLIP_MS} ms): ${w.flips}`);
  if (poll && poll.bestHz > 0) {
    const d = describePolling(poll);
    lines.push("");
    lines.push("Polling rate (estimate)");
    lines.push(`  ${d?.headline ?? ""} · ${d?.detail ?? ""}`);
  }
  return lines.join("\n");
}

export function buildLogText(session: Session, threshold: number): string {
  return session.log
    .map((e) => {
      const d = describeEntry(e, threshold);
      return `${formatClock(e.t).padStart(10)}  ${d.text}`;
    })
    .join("\n");
}
