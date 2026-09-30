/**
 * Pure logic for the YouTube watch time calculator. No React and no DOM, so
 * everything here is deterministic and can be tested from Node.
 *
 * Every Partner Program threshold comes from ./rules.json (dated, with sources).
 */
import rawRules from "./rules.json";

/* ------------------------------------------------------------------ */
/* Rules data                                                          */
/* ------------------------------------------------------------------ */

export interface Tier {
  id: string;
  kind: "ad" | "early";
  label: string;
  /** First day the tier applies (inclusive, YYYY-MM-DD), or null for "always". */
  effectiveFrom: string | null;
  /** Last day the tier applies (inclusive), or null for "no end date". */
  effectiveUntil: string | null;
  subscribers: number;
  watchHours: number;
  shortsViews: number;
  uploads?: number;
  uploadWindowDays?: number;
  status: string;
}

export interface RulesData {
  asOf: string;
  about: string;
  verification: string;
  sources: { label: string; url: string }[];
  windows: { watchDays: number; shortsDays: number };
  tiers: Tier[];
}

export const RULES = rawRules as RulesData;

/* ------------------------------------------------------------------ */
/* Dates (all ISO strings, UTC arithmetic, no time zones involved)      */
/* ------------------------------------------------------------------ */

export function toIso(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** The viewer's local calendar date as YYYY-MM-DD. Call from the browser only. */
export function localTodayIso(now: Date = new Date()): string {
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return toIso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** "Feb 1, 2027" from an ISO date. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

/** "February 1, 2027" from an ISO date. */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/* ------------------------------------------------------------------ */
/* Tier and goal resolution                                            */
/* ------------------------------------------------------------------ */

const inForce = (t: Tier, iso: string) => (!t.effectiveFrom || t.effectiveFrom <= iso) && (!t.effectiveUntil || iso <= t.effectiveUntil);

/** The tier of this kind that applies on `iso` (the most recently started one if several do). */
export function activeTier(kind: Tier["kind"], iso: string, tiers: Tier[] = RULES.tiers): Tier | undefined {
  const ofKind = tiers.filter((t) => t.kind === kind);
  const live = ofKind.filter((t) => inForce(t, iso)).sort((a, b) => (b.effectiveFrom ?? "").localeCompare(a.effectiveFrom ?? ""));
  if (live[0]) return live[0];
  // A gap in the config: fall back to the latest tier that has already started.
  const started = ofKind.filter((t) => !t.effectiveFrom || t.effectiveFrom <= iso).sort((a, b) => (b.effectiveFrom ?? "").localeCompare(a.effectiveFrom ?? ""));
  return started[0] ?? ofKind[0];
}

/** The next tier of this kind that has been announced but has not started on `iso`. */
export function nextTier(kind: Tier["kind"], iso: string, tiers: Tier[] = RULES.tiers): Tier | undefined {
  return tiers
    .filter((t) => t.kind === kind && t.effectiveFrom && t.effectiveFrom > iso)
    .sort((a, b) => (a.effectiveFrom as string).localeCompare(b.effectiveFrom as string))[0];
}

export type GoalId = "ad" | "ad-next" | "early" | "custom";
export const GOAL_IDS: GoalId[] = ["ad", "ad-next", "early", "custom"];

export interface Goal {
  id: GoalId;
  label: string;
  hours: number;
  /** Shorts-path views for the same tier (null for a custom goal). */
  shortsViews: number | null;
  tier?: Tier;
}

const fmtInt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export function tierGoal(id: GoalId, tier: Tier, from?: string | null): Goal {
  const when = from ? ` from ${shortDate(from)}` : "";
  const name = id === "early" ? "Fan-funding early access" : `Ad revenue tier${when}`;
  const flag = id === "ad-next" ? " (announced)" : "";
  return { id, label: `${name}${flag}: ${fmtInt(tier.watchHours)} hours`, hours: tier.watchHours, shortsViews: tier.shortsViews, tier };
}

/** Goals offered in the select, resolved for the given date. "custom" is always last. */
export function goalOptions(iso: string, tiers: Tier[] = RULES.tiers): Goal[] {
  const out: Goal[] = [];
  const ad = activeTier("ad", iso, tiers);
  if (ad) out.push(tierGoal("ad", ad));
  const next = nextTier("ad", iso, tiers);
  if (next) out.push(tierGoal("ad-next", next, next.effectiveFrom));
  const early = activeTier("early", iso, tiers);
  if (early) out.push(tierGoal("early", early));
  out.push({ id: "custom", label: "Custom number of hours", hours: NaN, shortsViews: null });
  return out;
}

/** Resolve the selected goal; an "ad-next" choice that no longer exists falls back to "ad". */
export function resolveGoal(id: GoalId, customHours: number | null, iso: string, tiers: Tier[] = RULES.tiers): Goal | null {
  const options = goalOptions(iso, tiers);
  if (id === "custom") return customHours && customHours > 0 ? { id: "custom", label: `Custom goal: ${fmtInt(customHours)} hours`, hours: customHours, shortsViews: null } : null;
  const found = options.find((o) => o.id === id) ?? options.find((o) => o.id === "ad") ?? options.find((o) => o.id !== "custom");
  return found ?? null;
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

export type Parsed = { kind: "empty" } | { kind: "invalid"; hint: string } | { kind: "ok"; value: number };

const SUFFIX: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };

/** Largest count accepted in a views or hours field. */
export const MAX_COUNT = 1e13;

/**
 * Parse a count such as "25000", "25,000", "1.2k" or "3m". Commas must be
 * thousands separators, so "1,5" is rejected instead of silently read as 15.
 */
export function parseCount(raw: string, opts: { max?: number; min?: number; suffix?: boolean; percent?: boolean; noun?: string } = {}): Parsed {
  const { max = MAX_COUNT, min = 0, suffix = true, percent = false, noun = "number" } = opts;
  let s = raw.trim();
  if (!s) return { kind: "empty" };
  if (percent) s = s.replace(/\s*%$/, "");
  if (/^-/.test(s)) return { kind: "invalid", hint: `Enter a ${noun} of ${fmtInt(min)} or more.` };
  const m = /^\+?(\d{1,3}(?:,\d{3})+|\d+)?(\.\d*)?\s*([kmb])?$/i.exec(s);
  const example = percent ? "45 or 45%" : suffix ? "25000, 25,000 or 25k" : "4000 or 4,000";
  if (!m || (!m[1] && !m[2]?.slice(1))) {
    if (/^\d+,\d{1,2}(?!\d)/.test(s) || /^\d+,\d{4,}/.test(s)) return { kind: "invalid", hint: "Use a period for decimals and commas only for thousands." };
    return { kind: "invalid", hint: `Enter a ${noun} such as ${example}.` };
  }
  if (m[3] && !suffix) return { kind: "invalid", hint: `Enter a plain ${noun} such as ${example}.` };
  const digits = `${(m[1] ?? "0").replace(/,/g, "")}${m[2] ?? ""}`;
  const value = parseFloat(digits) * (m[3] ? SUFFIX[m[3].toLowerCase()] : 1);
  if (!Number.isFinite(value)) return { kind: "invalid", hint: `Enter a ${noun} such as ${example}.` };
  if (value < min) return { kind: "invalid", hint: `Enter a ${noun} of ${fmtInt(min)} or more.` };
  if (value > max) return { kind: "invalid", hint: `That is too large. The limit is ${fmtInt(max)}.` };
  return { kind: "ok", value };
}

/** Parse a signed number such as "-10", "+5" or "12.5%" inside an inclusive range. */
export function parseSigned(raw: string, min: number, max: number, noun = "number"): Parsed {
  const s = raw.trim().replace(/\s*%$/, "");
  if (!s) return { kind: "empty" };
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return { kind: "invalid", hint: `Enter a ${noun} such as 10 or -5.` };
  const value = parseFloat(s);
  if (!Number.isFinite(value) || value < min || value > max) return { kind: "invalid", hint: `Enter a ${noun} between ${min} and ${max}.` };
  return { kind: "ok", value };
}

/** Longest duration accepted for a video length or an average view duration. */
export const MAX_DURATION_SECONDS = 24 * 3600;

/**
 * Parse a duration. Accepts "4:30" and "1:02:30" (as shown in YouTube Studio),
 * a plain number of minutes ("4.5"), or unit forms such as "4m 30s", "270s" and "1h 5m".
 */
export function parseDuration(raw: string): Parsed {
  const s = raw.trim();
  if (!s) return { kind: "empty" };
  const bad = (hint = "Enter a duration such as 4:30, 4.5 (minutes) or 4m 30s.") => ({ kind: "invalid", hint }) as const;
  let seconds: number | null = null;

  const colon = /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.exec(s);
  if (colon) {
    const [, a, b, c] = colon;
    if (b.length !== 2 || (c !== undefined && c.length !== 2)) return bad("Write seconds with two digits, for example 4:05.");
    if (c === undefined) {
      if (Number(b) > 59) return bad("Seconds must be 59 or less, for example 4:30.");
      seconds = Number(a) * 60 + Number(b);
    } else {
      if (Number(b) > 59 || Number(c) > 59) return bad("Minutes and seconds must be 59 or less, for example 1:05:30.");
      seconds = Number(a) * 3600 + Number(b) * 60 + Number(c);
    }
  } else if (/^\d+(\.\d+)?$/.test(s)) {
    seconds = parseFloat(s) * 60;
  } else {
    const u = /^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?)?\s*(?:(\d+(?:\.\d+)?)\s*s(?:ec(?:ond)?s?)?)?$/i.exec(s);
    if (!u || (u[1] === undefined && u[2] === undefined && u[3] === undefined)) return bad();
    seconds = parseFloat(u[1] ?? "0") * 3600 + parseFloat(u[2] ?? "0") * 60 + parseFloat(u[3] ?? "0");
  }
  if (!Number.isFinite(seconds) || seconds <= 0) return bad("The duration must be longer than zero.");
  if (seconds > MAX_DURATION_SECONDS) return bad("That is longer than 24 hours. Check the units.");
  return { kind: "ok", value: seconds };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/** "3:36" or "1:02:30". Rounds to the nearest second. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function formatCount(n: number): string {
  return fmtInt(n);
}

/**
 * Hours for display. When a value is below the goal but would round up to it,
 * it is truncated instead so the screen never says "4,000" for 3,999.97.
 */
export function formatHours(hours: number, goal?: number): string {
  const digits = hours >= 1000 ? 0 : hours >= 10 ? 1 : 2;
  const f = 10 ** digits;
  let v = Math.round(hours * f) / f;
  if (goal !== undefined && hours < goal && v >= goal) v = Math.floor(hours * f) / f;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(v);
}

export function formatPercent(pct: number): string {
  const digits = pct >= 100 ? 0 : pct >= 10 ? 1 : 2;
  const v = Math.round(pct * 10 ** digits) / 10 ** digits;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(v)}%`;
}

/** Format a decimal number of seconds for a formula line, up to 2 decimals. */
export function formatSeconds(sec: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(sec);
}

/* ------------------------------------------------------------------ */
/* Core formulas                                                       */
/* ------------------------------------------------------------------ */

/** Watch hours = views x average view duration (seconds) / 3600. */
export function hoursFromViews(views: number, avdSeconds: number): number {
  return (views * avdSeconds) / 3600;
}

/** Views needed for a number of watch hours at a given average view duration, rounded up. */
export function viewsForHours(hours: number, avdSeconds: number): number {
  if (hours <= 0) return 0;
  const x = (hours * 3600) / avdSeconds;
  return Math.ceil(x - Math.max(1e-9, x * 1e-12));
}

/** Average view duration in seconds from a video length and the average percentage viewed. */
export function avdFromLength(lengthSeconds: number, percentViewed: number): number {
  return (lengthSeconds * percentViewed) / 100;
}

export interface HoursResult {
  hours: number;
  pct: number;
  remainingHours: number;
  viewsRemaining: number;
  reached: boolean;
}

export function evaluateHours(views: number, avdSeconds: number, goalHours: number): HoursResult {
  const hours = hoursFromViews(views, avdSeconds);
  const reached = hours >= goalHours - 1e-9;
  return {
    hours,
    pct: (hours / goalHours) * 100,
    remainingHours: reached ? 0 : goalHours - hours,
    viewsRemaining: reached ? 0 : viewsForHours(goalHours - hours, avdSeconds),
    reached,
  };
}

export interface ViewsResult {
  views: number;
  days: number;
  perDay: number;
  perWeek: number;
  perMonth: number;
  cappedDays: boolean;
}

/** Days per month used for "per month" figures (365 / 12). */
export const DAYS_PER_MONTH = 365 / 12;

/**
 * Views needed for a goal, and the pace that delivers them within `days`.
 * Hours older than the 365-day window stop counting, so longer spans are capped.
 */
export function evaluateViews(goalHours: number, avdSeconds: number, days: number, windowDays = RULES.windows.watchDays): ViewsResult {
  const views = viewsForHours(goalHours, avdSeconds);
  const span = Math.min(Math.max(1, days), windowDays);
  const perDay = views / span;
  return { views, days: span, perDay, perWeek: perDay * 7, perMonth: perDay * DAYS_PER_MONTH, cappedDays: days > windowDays };
}

/** Preset average view durations (minutes) for the comparison table. */
export const AVD_PRESET_MINUTES = [1, 2, 3, 4, 5, 8, 10, 15, 20];

export interface AvdRow {
  seconds: number;
  views: number;
  isYours: boolean;
}

/** Views needed at preset durations, with the user's own duration inserted in order. */
export function avdTable(goalHours: number, yourSeconds: number | null): AvdRow[] {
  const rows: AvdRow[] = AVD_PRESET_MINUTES.map((m) => ({ seconds: m * 60, views: viewsForHours(goalHours, m * 60), isYours: false }));
  if (yourSeconds && !rows.some((r) => Math.abs(r.seconds - yourSeconds) < 0.5)) {
    rows.push({ seconds: yourSeconds, views: viewsForHours(goalHours, yourSeconds), isYours: true });
  } else if (yourSeconds) {
    const hit = rows.find((r) => Math.abs(r.seconds - yourSeconds) < 0.5);
    if (hit) hit.isYours = true;
  }
  return rows.sort((a, b) => a.seconds - b.seconds);
}

/* ------------------------------------------------------------------ */
/* Timeline projection                                                 */
/* ------------------------------------------------------------------ */

/** Projection stops after five years. */
export const MAX_PROJECTION_DAYS = 1826;
export const CHECKPOINT_STEP_DAYS = 30;
export const CHECKPOINT_COUNT = 12;

export interface TimelineInput {
  dailyViews: number;
  avdSeconds: number;
  /** Watch hours already inside the 365-day window today. */
  bankedHours: number;
  /** Month-over-month change in daily views, in percent (may be negative). */
  growthPct: number;
  /** Drop hours from the window after 365 days (assumes banked hours were earned evenly over the past year). */
  expire: boolean;
  goals: number[];
  windowDays?: number;
  maxDays?: number;
}

export interface TimelineResult {
  hoursPerDay: number;
  /** Per goal, same order as the input: days from today, 0 if already met, null if not reached in the projection. */
  reachDays: (number | null)[];
  /** Hours in the window at day 30, 60, ... 360. */
  checkpoints: { day: number; hours: number }[];
}

export function simulateTimeline(input: TimelineInput): TimelineResult {
  const { dailyViews, avdSeconds, bankedHours, growthPct, expire, goals } = input;
  const W = input.windowDays ?? RULES.windows.watchDays;
  const maxDays = input.maxDays ?? MAX_PROJECTION_DAYS;
  const base = hoursFromViews(dailyViews, avdSeconds);
  const growth = Math.pow(Math.max(0, 1 + growthPct / 100), 12 / 365);
  const EPS = 1e-9;

  const ring = new Float64Array(W).fill(expire ? bankedHours / W : 0);
  let idx = 0;
  let sum = bankedHours;
  let dayHours = base;

  const reach: (number | null)[] = goals.map((g) => (bankedHours >= g - EPS ? 0 : null));
  const checkpoints: { day: number; hours: number }[] = [];
  const horizon = Math.max(maxDays, CHECKPOINT_STEP_DAYS * CHECKPOINT_COUNT);

  for (let t = 1; t <= horizon; t++) {
    if (expire) {
      sum += dayHours - ring[idx];
      ring[idx] = dayHours;
      idx = (idx + 1) % W;
    } else {
      sum += dayHours;
    }
    dayHours *= growth;
    for (let i = 0; i < goals.length; i++) if (reach[i] === null && sum >= goals[i] - EPS) reach[i] = t;
    if (t % CHECKPOINT_STEP_DAYS === 0 && t <= CHECKPOINT_STEP_DAYS * CHECKPOINT_COUNT) checkpoints.push({ day: t, hours: sum });
    if (t >= CHECKPOINT_STEP_DAYS * CHECKPOINT_COUNT && reach.every((r) => r !== null)) break;
  }
  return { hoursPerDay: base, reachDays: reach, checkpoints };
}

/** Smallest flat daily view count that can ever fill a goal inside a rolling window. */
export function minDailyViews(goalHours: number, avdSeconds: number, windowDays = RULES.windows.watchDays): number {
  return Math.ceil(viewsForHours(goalHours, avdSeconds) / windowDays - 1e-9);
}

/* ------------------------------------------------------------------ */
/* Shorts path                                                         */
/* ------------------------------------------------------------------ */

export interface ShortsResult {
  pct: number;
  remaining: number;
  reached: boolean;
  perDayNow: number;
  perDayNeeded: number;
}

export function evaluateShorts(viewsInWindow: number, goalViews: number, windowDays = RULES.windows.shortsDays): ShortsResult {
  const reached = viewsInWindow >= goalViews;
  return {
    pct: (viewsInWindow / goalViews) * 100,
    remaining: reached ? 0 : goalViews - viewsInWindow,
    reached,
    perDayNow: viewsInWindow / windowDays,
    perDayNeeded: Math.ceil(goalViews / windowDays),
  };
}

/* ------------------------------------------------------------------ */
/* Calculator state                                                    */
/* ------------------------------------------------------------------ */

export type Tab = "hours" | "views" | "timeline" | "shorts";
export type AvdMode = "direct" | "length";
export type Period = "day" | "month";

export interface State {
  tab: Tab;
  goal: GoalId;
  customHours: string;
  avdMode: AvdMode;
  avd: string;
  length: string;
  pctViewed: string;
  views: string;
  spanDays: string;
  daily: string;
  period: Period;
  banked: string;
  growth: string;
  expire: boolean;
  shorts: string;
}

export const DEFAULT_STATE: State = {
  tab: "hours",
  goal: "ad",
  customHours: "",
  avdMode: "length",
  avd: "3:36",
  length: "8:00",
  pctViewed: "45",
  views: "25,000",
  spanDays: "180",
  daily: "500",
  period: "day",
  banked: "0",
  growth: "0",
  expire: true,
  shorts: "2,500,000",
};

export const EMPTY_STATE: State = {
  ...DEFAULT_STATE,
  customHours: "",
  avd: "",
  length: "",
  pctViewed: "",
  views: "",
  spanDays: "",
  daily: "",
  banked: "",
  growth: "",
  shorts: "",
};

const TEXT_KEYS = ["customHours", "avd", "length", "pctViewed", "views", "spanDays", "daily", "banked", "growth", "shorts"] as const;

/** Rebuild stored state field by field so a stale or hand-edited value can never crash the page. */
export function normalizeState(stored: unknown): State {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const out: State = { ...DEFAULT_STATE };
  for (const key of TEXT_KEYS) {
    const v = src[key];
    if (typeof v === "string") out[key] = v.slice(0, 40);
    else if (typeof v === "number" && Number.isFinite(v)) out[key] = String(v);
  }
  if (src.tab === "hours" || src.tab === "views" || src.tab === "timeline" || src.tab === "shorts") out.tab = src.tab;
  if (typeof src.goal === "string" && (GOAL_IDS as string[]).includes(src.goal)) out.goal = src.goal as GoalId;
  if (src.avdMode === "direct" || src.avdMode === "length") out.avdMode = src.avdMode;
  if (src.period === "day" || src.period === "month") out.period = src.period;
  if (typeof src.expire === "boolean") out.expire = src.expire;
  return out;
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

export function toCsv(header: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}
