/**
 * Pure logic for the YouTube money calculator. No React, no DOM: everything
 * here is deterministic and can be unit-tested from Node.
 *
 * All rates, splits and thresholds come from ./rates.json (dated, with sources).
 */
import rawRates from "./rates.json";

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

export interface Triplet {
  low: number;
  typical: number;
  high: number;
}
export interface Niche extends Triplet {
  id: string;
  name: string;
}
export interface Region {
  id: string;
  name: string;
  examples: string;
  multiplier: number;
}
export interface AudiencePreset {
  id: string;
  name: string;
  shares: number[];
}
export interface Season {
  id: string;
  name: string;
  multiplier: number;
}
export interface RatesData {
  asOf: string;
  currency: string;
  sources: { label: string; url: string }[];
  revenueShare: { longFormCreatorPct: number; shortsCreatorPct: number; musicCutPct: number; note: string };
  partnerProgram: {
    adRevenue: { subscribers: number; watchHours: number; watchWindowDays: number; shortsViews: number; shortsWindowDays: number };
    fanFunding: { subscribers: number; uploads: number; uploadWindowDays: number; watchHours: number; shortsViews: number };
    upcoming: {
      effective: string;
      subscribers: number;
      watchHours: number;
      shortsViews: number;
      shortsPoolViews: number;
      shortsPoolWindowDays: number;
      status: string;
    };
    adsensePaymentThresholdUsd: number;
  };
  rpmBasis: string;
  rpmSourcesNote: string;
  niches: Niche[];
  regions: Region[];
  audiencePresets: AudiencePreset[];
  seasons: Season[];
  shorts: { grossPer1000: Triplet; basis: string };
  defaults: { swingPct: { long: number; shorts: number } };
}

export const RATES = rawRates as RatesData;

export const SCENARIOS = ["low", "typical", "high"] as const;
export type Scenario = (typeof SCENARIOS)[number];

const DAYS_PER_YEAR = 365;
const MONTHS_PER_YEAR = 12;
/** Largest value accepted in a views field (keeps every product finite and readable). */
export const MAX_VIEWS = 1e13;
/** More views per day than this is almost certainly a unit mistake, so we warn. */
export const HIGH_VIEWS_PER_DAY = 50_000_000;

export function mapScenarios(fn: (k: Scenario) => number): Triplet {
  return { low: fn("low"), typical: fn("typical"), high: fn("high") };
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export type ChannelType = "long" | "shorts" | "both";
export type Period = "day" | "month";
export type LongBasis = "niche" | "rpm" | "cpm";
export type ShortsBasis = "estimate" | "rpm";

export interface State {
  type: ChannelType;
  period: Period;
  longViews: string;
  shortsViews: string;
  longBasis: LongBasis;
  niche: string;
  longRpm: string;
  longSwing: string;
  cpm: string;
  monetizedPct: string;
  longShare: string;
  shortsBasis: ShortsBasis;
  shortsRpm: string;
  shortsSwing: string;
  musicUse: string;
  musicCut: string;
  shortsShare: string;
  shares: string[];
  mults: string[];
  season: string;
  applyShortsRule: boolean;
  goal: string;
  rpmRevenue: string;
  rpmViews: string;
  shortsRpmRevenue: string;
  shortsRpmViews: string;
}

const REGION_COUNT = RATES.regions.length;

export const DEFAULT_STATE: State = {
  type: "long",
  period: "day",
  longViews: "10000",
  shortsViews: "100000",
  longBasis: "niche",
  niche: "technology",
  longRpm: "4",
  longSwing: String(RATES.defaults.swingPct.long),
  cpm: "12",
  monetizedPct: "60",
  longShare: String(RATES.revenueShare.longFormCreatorPct),
  shortsBasis: "estimate",
  shortsRpm: "0.05",
  shortsSwing: String(RATES.defaults.swingPct.shorts),
  musicUse: "50",
  musicCut: String(RATES.revenueShare.musicCutPct),
  shortsShare: String(RATES.revenueShare.shortsCreatorPct),
  shares: RATES.audiencePresets.find((p) => p.id === "mixed")!.shares.map(String),
  mults: RATES.regions.map((r) => String(r.multiplier)),
  season: "avg",
  applyShortsRule: false,
  goal: "1000",
  rpmRevenue: "",
  rpmViews: "",
  shortsRpmRevenue: "",
  shortsRpmViews: "",
};

export type ExampleId = "tech" | "gaming" | "shorts";

export const EXAMPLES: Record<ExampleId, { label: string; patch: Partial<State> }> = {
  tech: {
    label: "Tech channel, 10,000 views/day",
    patch: { type: "long", period: "day", longViews: "10000", longBasis: "niche", niche: "technology", season: "avg" },
  },
  gaming: {
    label: "Gaming channel, 10,000 views/day",
    patch: { type: "long", period: "day", longViews: "10000", longBasis: "niche", niche: "gaming", season: "avg" },
  },
  shorts: {
    label: "Shorts channel, 100,000 views/day",
    patch: {
      type: "shorts",
      period: "day",
      shortsViews: "100000",
      shortsBasis: "estimate",
      musicUse: "50",
      musicCut: String(RATES.revenueShare.musicCutPct),
      shortsShare: String(RATES.revenueShare.shortsCreatorPct),
      season: "avg",
    },
  },
};

/** Apply an example on top of the default audience mix so the numbers are reproducible. */
export function stateForExample(id: ExampleId, current: State): State {
  return { ...current, shares: DEFAULT_STATE.shares, mults: DEFAULT_STATE.mults, applyShortsRule: false, ...EXAMPLES[id].patch };
}

const STRING_KEYS = [
  "longViews",
  "shortsViews",
  "longRpm",
  "longSwing",
  "cpm",
  "monetizedPct",
  "longShare",
  "shortsRpm",
  "shortsSwing",
  "musicUse",
  "musicCut",
  "shortsShare",
  "goal",
  "rpmRevenue",
  "rpmViews",
  "shortsRpmRevenue",
  "shortsRpmViews",
] as const;
type StringKey = (typeof STRING_KEYS)[number];

/**
 * Stored state comes from session storage and may be missing, from an older
 * version of the page or edited by hand. Rebuild it field by field so a bad
 * value can never crash the calculator.
 */
export function normalizeState(stored: unknown): State {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const out: State = { ...DEFAULT_STATE, shares: [...DEFAULT_STATE.shares], mults: [...DEFAULT_STATE.mults] };
  const str = (k: StringKey) => {
    const v = src[k];
    if (typeof v === "string") out[k] = v;
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = String(v);
  };
  STRING_KEYS.forEach(str);
  if (src.type === "long" || src.type === "shorts" || src.type === "both") out.type = src.type;
  if (src.period === "day" || src.period === "month") out.period = src.period;
  if (src.longBasis === "niche" || src.longBasis === "rpm" || src.longBasis === "cpm") out.longBasis = src.longBasis;
  if (src.shortsBasis === "estimate" || src.shortsBasis === "rpm") out.shortsBasis = src.shortsBasis;
  if (typeof src.niche === "string" && RATES.niches.some((n) => n.id === src.niche)) out.niche = src.niche;
  if (typeof src.season === "string" && RATES.seasons.some((s) => s.id === src.season)) out.season = src.season;
  if (typeof src.applyShortsRule === "boolean") out.applyShortsRule = src.applyShortsRule;
  const arr = (v: unknown, fallback: string[]) =>
    Array.isArray(v) && v.length === REGION_COUNT
      ? v.map((x, i) => (typeof x === "string" ? x : typeof x === "number" && Number.isFinite(x) ? String(x) : fallback[i]))
      : fallback;
  out.shares = arr(src.shares, out.shares);
  out.mults = arr(src.mults, out.mults);
  return out;
}

/** Which audience preset matches the current shares exactly, or "custom". */
export function presetIdFor(shares: string[]): string {
  const nums = shares.map((s) => Number(s.trim()));
  const hit = RATES.audiencePresets.find((p) => p.shares.every((v, i) => nums[i] === v));
  return hit ? hit.id : "custom";
}

/* ------------------------------------------------------------------ */
/* Parsing and formatting                                              */
/* ------------------------------------------------------------------ */

export type Parsed = { kind: "empty" } | { kind: "invalid"; hint: string } | { kind: "ok"; value: number };

const IN_PROGRESS_RE = /^[+-]?\.?$/;
const WESTERN_GROUPED_RE = /^[+-]?\d{1,3}(,\d{3})+(\.\d*)?$/;
const INDIAN_GROUPED_RE = /^[+-]?\d{1,2}(,\d{2})*,\d{3}(\.\d*)?$/;
const PLAIN_RE = /^[+-]?(\d+\.?\d*|\.\d+)$/;

/**
 * Parse a number field. Accepts thousands separators (12,500 or Indian 1,25,000),
 * a currency symbol at either end, a trailing % and, when `suffix` is set, the
 * shorthand 10k / 1.5m / 2b that creators use for view counts. A decimal comma
 * such as 12,5 is rejected with a hint rather than guessed as 125.
 */
export function parseNum(raw: string, opts: { suffix?: boolean } = {}): Parsed {
  let s = raw.trim().replace(/[\s_]/g, "").replace(/[−–]/g, "-");
  if (s === "") return { kind: "empty" };
  s = s.replace(/^([+-]?)[$€£¥₹]/, "$1").replace(/[$€£¥₹]$/, "").replace(/%$/, "");
  if (IN_PROGRESS_RE.test(s)) return { kind: "empty" };
  let scale = 1;
  if (opts.suffix) {
    const m = /^(.*?)([kmb])$/i.exec(s);
    if (m) {
      scale = m[2].toLowerCase() === "k" ? 1e3 : m[2].toLowerCase() === "m" ? 1e6 : 1e9;
      s = m[1];
    }
  }
  if (s.includes(",")) {
    if (!WESTERN_GROUPED_RE.test(s) && !INDIAN_GROUPED_RE.test(s)) {
      return { kind: "invalid", hint: "Use a dot for decimals, e.g. 12.5 (commas only group thousands)" };
    }
    s = s.replace(/,/g, "");
  }
  if (!PLAIN_RE.test(s)) {
    return { kind: "invalid", hint: opts.suffix ? "Enter a number, e.g. 12,500, 10k or 1.5m" : "Enter a number, e.g. 4.5 or 25" };
  }
  const n = Number(s) * scale;
  if (!Number.isFinite(n)) return { kind: "invalid", hint: "This number is too large to calculate with" };
  return { kind: "ok", value: n };
}

/**
 * Round half up with a tiny nudge so 20.325 (stored as 20.32499...) shows as
 * 20.33, the way a person doing the sum by hand would round it.
 */
function roundHalfUp(n: number, digits: number): number {
  const f = 10 ** digits;
  const nudged = n * f + Math.sign(n) * 1e-7;
  return Math.round(Math.abs(nudged)) * Math.sign(nudged) / f;
}

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd3 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 3, maximumFractionDigits: 3 });
const int0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/**
 * Earnings amount: whole dollars from $1,000 up, cents below that. Pass `ref`
 * (usually the largest value in a range) so every number in a range is rounded
 * the same way.
 */
export function money(n: number, ref: number = n): string {
  if (!Number.isFinite(n)) return "n/a";
  return Math.abs(ref) >= 1000 ? usd0.format(roundHalfUp(n, 0)) : usd2.format(roundHalfUp(n, 2));
}

/** RPM or CPM: three decimals below $1 (Shorts RPM is a few cents), cents above. */
export function rate(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  return Math.abs(n) < 1 ? usd3.format(roundHalfUp(n, 3)) : usd2.format(roundHalfUp(n, 2));
}

export function count(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  return int0.format(Math.round(n));
}

function trimNum(n: number, digits = 4): string {
  return String(Number(n.toFixed(digits)));
}

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

export interface Note {
  variant: "info" | "warning";
  title?: string;
  text: string;
}

export interface SectionResult {
  label: string;
  viewsPerDay: number;
  rpm: Triplet;
  day: Triplet;
  month: Triplet;
  year: Triplet;
  /** Formula lines with the user's own numbers substituted. */
  lines: string[];
}

export interface Evaluation {
  errors: Record<string, string>;
  notes: Note[];
  /** True when at least one active section has more than zero views. */
  hasViews: boolean;
  /** Sum of the audience shares, as typed. */
  sumShares: number;
  /** Weighted audience multiplier (US = 1) when the audience mix is in use. */
  blend: number | null;
  seasonMultiplier: number;
  long: SectionResult | null;
  shorts: SectionResult | null;
  total: (Omit<SectionResult, "label" | "lines"> & { viewsPerDay: number }) | null;
  /** Shorts views in a rolling 90 days at the entered rate, when Shorts is active. */
  shorts90: number | null;
  /** True when no blocking error exists and there are views to price. */
  ok: boolean;
}

function section(label: string, viewsPerDay: number, rpm: Triplet, lines: string[]): SectionResult {
  const day = mapScenarios((k) => (viewsPerDay / 1000) * rpm[k]);
  return {
    label,
    viewsPerDay,
    rpm,
    day,
    month: mapScenarios((k) => (day[k] * DAYS_PER_YEAR) / MONTHS_PER_YEAR),
    year: mapScenarios((k) => day[k] * DAYS_PER_YEAR),
    lines,
  };
}

export function viewsToPerDay(value: number, period: Period): number {
  return period === "day" ? value : (value * MONTHS_PER_YEAR) / DAYS_PER_YEAR;
}

/** Accumulates field errors while parsing. */
class Reader {
  errors: Record<string, string> = {};
  read(
    key: string,
    raw: string,
    o: { min?: number; max?: number; suffix?: boolean; emptyValue?: number; unit?: string } = {},
  ): number | null {
    const { min = 0, max = Infinity, suffix = false, emptyValue = 0 } = o;
    const p = parseNum(raw, { suffix });
    if (p.kind === "empty") return emptyValue;
    if (p.kind === "invalid") {
      this.errors[key] = p.hint;
      return null;
    }
    if (p.value < min) {
      this.errors[key] = min === 0 ? "Enter zero or a positive number" : `Enter ${min} or more`;
      return null;
    }
    if (p.value > max) {
      this.errors[key] = `Enter ${int0.format(max)}${o.unit ?? ""} or less`;
      return null;
    }
    return p.value;
  }
}

function spread(center: number, swingPct: number): Triplet {
  const f = swingPct / 100;
  return { low: center * (1 - f), typical: center, high: center * (1 + f) };
}

export function evaluate(s: State): Evaluation {
  const r = new Reader();
  const notes: Note[] = [];
  const wantLong = s.type !== "shorts";
  const wantShorts = s.type !== "long";
  const needsMix = (wantLong && s.longBasis === "niche") || (wantShorts && s.shortsBasis === "estimate");

  /* Audience mix and season (only when a preset estimate is in use) */
  let blend: number | null = null;
  let sumShares = 0;
  const season = RATES.seasons.find((x) => x.id === s.season) ?? RATES.seasons[0];
  const seasonMultiplier = season.multiplier;
  {
    const shares = s.shares.map((raw, i) => r.read(`share-${i}`, raw, { max: 100, unit: "%" }));
    const mults = s.mults.map((raw, i) => r.read(`mult-${i}`, raw, { max: 10, emptyValue: RATES.regions[i].multiplier }));
    if (needsMix) {
      if (shares.every((v) => v !== null) && mults.every((v) => v !== null)) {
        sumShares = (shares as number[]).reduce((a, b) => a + b, 0);
        if (sumShares <= 0) {
          r.errors.mix = "Enter at least one audience share above zero.";
        } else {
          blend = (shares as number[]).reduce((acc, v, i) => acc + v * (mults as number[])[i], 0) / sumShares;
          if (Math.abs(sumShares - 100) > 0.005) {
            notes.push({
              variant: "info",
              text: `Your audience shares add up to ${trimNum(sumShares, 2)}%, so they are scaled to 100% before the multiplier is calculated.`,
            });
          }
        }
      } else {
        sumShares = (shares as (number | null)[]).reduce<number>((a, b) => a + (b ?? 0), 0);
      }
    } else {
      // Not in use: drop any stale field errors so they cannot block the results.
      for (const k of Object.keys(r.errors)) if (k.startsWith("share-") || k.startsWith("mult-")) delete r.errors[k];
    }
  }

  const perDayFrom = (key: string, raw: string): number | null => {
    const v = r.read(key, raw, { max: MAX_VIEWS, suffix: true });
    return v === null ? null : viewsToPerDay(v, s.period);
  };

  /* Long-form */
  let long: SectionResult | null = null;
  if (wantLong) {
    const perDay = perDayFrom("longViews", s.longViews);
    let rpm: Triplet | null = null;
    let lines: string[] = [];
    if (s.longBasis === "niche") {
      const niche = RATES.niches.find((n) => n.id === s.niche) ?? RATES.niches[0];
      if (blend !== null) {
        const f = blend * seasonMultiplier;
        rpm = mapScenarios((k) => niche[k] * f);
        lines = [
          `RPM = niche RPM × audience multiplier × season = ${rate(niche.typical)} × ${trimNum(blend)} × ${seasonMultiplier.toFixed(2)} = ${rate(rpm.typical)} per 1,000 views (typical case)`,
          `Low and high cases start from the niche's ${rate(niche.low)} and ${rate(niche.high)}, giving ${rate(rpm.low)} and ${rate(rpm.high)}`,
        ];
      }
    } else if (s.longBasis === "rpm") {
      const v = r.read("longRpm", s.longRpm, { max: 10000 });
      const sw = r.read("longSwing", s.longSwing, { max: 90, unit: "%" });
      if (v !== null && sw !== null) {
        rpm = spread(v, sw);
        lines = [
          `RPM = your own figure = ${rate(v)} per 1,000 views (typical case)`,
          `Low and high cases move it by ±${trimNum(sw, 2)}%, giving ${rate(rpm.low)} and ${rate(rpm.high)}`,
        ];
        if (v > 100) notes.push({ variant: "warning", text: "An RPM above $100 per 1,000 views is extremely rare. Check that you entered revenue per 1,000 views, not total revenue." });
      }
    } else {
      const cpm = r.read("cpm", s.cpm, { max: 10000 });
      const mon = r.read("monetizedPct", s.monetizedPct, { max: 100, unit: "%" });
      const share = r.read("longShare", s.longShare, { max: 100, unit: "%" });
      const sw = r.read("longSwing", s.longSwing, { max: 90, unit: "%" });
      if (cpm !== null && mon !== null && share !== null && sw !== null) {
        const base = (cpm * (mon / 100) * share) / 100;
        rpm = spread(base, sw);
        lines = [
          `RPM = playback-based CPM × monetized playbacks × creator share = ${rate(cpm)} × ${trimNum(mon, 2)}% × ${trimNum(share, 2)}% = ${rate(base)} per 1,000 views (typical case)`,
          `Low and high cases move it by ±${trimNum(sw, 2)}%, giving ${rate(rpm.low)} and ${rate(rpm.high)}`,
        ];
      }
    }
    if (perDay !== null && rpm !== null) {
      long = section("Long-form", perDay, rpm, [...lines, `Per day = ${count(perDay)} views ÷ 1,000 × ${rate(rpm.typical)} = ${money((perDay / 1000) * rpm.typical)} (typical case)`]);
    }
  }

  /* Shorts */
  let shorts: SectionResult | null = null;
  let shorts90: number | null = null;
  if (wantShorts) {
    const perDay = perDayFrom("shortsViews", s.shortsViews);
    if (perDay !== null) shorts90 = perDay * RATES.partnerProgram.upcoming.shortsPoolWindowDays;
    let rpm: Triplet | null = null;
    let lines: string[] = [];
    if (s.shortsBasis === "estimate") {
      const music = r.read("musicUse", s.musicUse, { max: 100, unit: "%" });
      const cut = r.read("musicCut", s.musicCut, { max: 100, unit: "%" });
      const share = r.read("shortsShare", s.shortsShare, { max: 100, unit: "%" });
      if (blend !== null && music !== null && cut !== null && share !== null) {
        const keep = 1 - (music / 100) * (cut / 100);
        const f = blend * seasonMultiplier * keep * (share / 100);
        const g = RATES.shorts.grossPer1000;
        rpm = mapScenarios((k) => g[k] * f);
        lines = [
          `Shorts RPM = feed value × audience multiplier × season × (1 − music use × music cut) × creator share`,
          `Typical: ${rate(g.typical)} × ${trimNum(blend)} × ${seasonMultiplier.toFixed(2)} × (1 − ${trimNum(music, 2)}% × ${trimNum(cut, 2)}%) × ${trimNum(share, 2)}% = ${rate(rpm.typical)} per 1,000 views`,
          `Low and high cases start from feed values of ${rate(g.low)} and ${rate(g.high)}, giving ${rate(rpm.low)} and ${rate(rpm.high)}`,
        ];
      }
    } else {
      const v = r.read("shortsRpm", s.shortsRpm, { max: 1000 });
      const sw = r.read("shortsSwing", s.shortsSwing, { max: 90, unit: "%" });
      if (v !== null && sw !== null) {
        rpm = spread(v, sw);
        lines = [
          `Shorts RPM = your own figure = ${rate(v)} per 1,000 views (typical case)`,
          `Low and high cases move it by ±${trimNum(sw, 2)}%, giving ${rate(rpm.low)} and ${rate(rpm.high)}`,
        ];
      }
    }
    if (rpm !== null && perDay !== null) {
      const threshold = RATES.partnerProgram.upcoming.shortsPoolViews;
      if (s.applyShortsRule && perDay > 0 && shorts90 !== null) {
        if (shorts90 < threshold) {
          rpm = { low: 0, typical: 0, high: 0 };
          lines = [
            `Reported rule from ${RATES.partnerProgram.upcoming.effective}: a channel needs ${count(threshold)} qualified Shorts views in a rolling ${RATES.partnerProgram.upcoming.shortsPoolWindowDays} days to earn from the Shorts pool.`,
            `${count(perDay)} views/day × ${RATES.partnerProgram.upcoming.shortsPoolWindowDays} days = ${count(shorts90)}, which is below ${count(threshold)}, so Shorts revenue is set to $0.00 here.`,
          ];
          notes.push({
            variant: "warning",
            title: "Below the reported 2027 Shorts threshold",
            text: `At this rate your Shorts reach about ${count(shorts90)} views per ${RATES.partnerProgram.upcoming.shortsPoolWindowDays} days, under the ${count(threshold)} that has been reported for earning from the Shorts pool from ${RATES.partnerProgram.upcoming.effective}. Switch the rule off to see the estimate under today's rules.`,
          });
        } else {
          lines.push(`Your ${count(shorts90)} Shorts views per ${RATES.partnerProgram.upcoming.shortsPoolWindowDays} days clear the reported ${count(threshold)} threshold.`);
        }
      }
      shorts = section("Shorts", perDay, rpm, [...lines, `Per day = ${count(perDay)} views ÷ 1,000 × ${rate(rpm.typical)} = ${money((perDay / 1000) * rpm.typical)} (typical case)`]);
    }
  }

  /* Blocking errors only count for sections that are active */
  const activeErrors: Record<string, string> = {};
  const isActive = (key: string) => {
    if (key.startsWith("share-") || key.startsWith("mult-") || key === "mix") return needsMix;
    if (key === "longViews") return wantLong;
    if (key === "shortsViews") return wantShorts;
    if (["longRpm", "cpm", "monetizedPct", "longShare"].includes(key)) return wantLong && (key === "longRpm" ? s.longBasis === "rpm" : s.longBasis === "cpm");
    if (key === "longSwing") return wantLong && s.longBasis !== "niche";
    if (["musicUse", "musicCut", "shortsShare"].includes(key)) return wantShorts && s.shortsBasis === "estimate";
    if (key === "shortsRpm" || key === "shortsSwing") return wantShorts && s.shortsBasis === "rpm";
    return true;
  };
  for (const [k, v] of Object.entries(r.errors)) if (isActive(k)) activeErrors[k] = v;

  const sections = [long, shorts].filter((x): x is SectionResult => x !== null);
  const totalViews = sections.reduce((a, x) => a + x.viewsPerDay, 0);
  const expected = (wantLong ? 1 : 0) + (wantShorts ? 1 : 0);
  const complete = sections.length === expected && Object.keys(activeErrors).length === 0;
  const hasViews = totalViews > 0;

  if (complete && totalViews > HIGH_VIEWS_PER_DAY) {
    notes.push({
      variant: "warning",
      title: "Very large view count",
      text: `${count(totalViews)} views per day is far above what almost any channel gets. Check that you selected the right period (per day or per month).`,
    });
  }

  let total: Evaluation["total"] = null;
  if (complete && sections.length > 0) {
    const sum = (pick: (x: SectionResult) => Triplet): Triplet => mapScenarios((k) => sections.reduce((a, x) => a + pick(x)[k], 0));
    const day = sum((x) => x.day);
    total = {
      viewsPerDay: totalViews,
      rpm: mapScenarios((k) => (totalViews > 0 ? (day[k] / totalViews) * 1000 : 0)),
      day,
      month: sum((x) => x.month),
      year: sum((x) => x.year),
    };
  }

  return {
    errors: activeErrors,
    notes,
    hasViews,
    sumShares,
    blend,
    seasonMultiplier,
    long: complete ? long : null,
    shorts: complete ? shorts : null,
    total,
    shorts90,
    ok: complete && hasViews,
  };
}

/* ------------------------------------------------------------------ */
/* Reverse calculations and helpers                                    */
/* ------------------------------------------------------------------ */

export interface GoalResult {
  /** Views per month needed to reach the target, keyed by the RPM case used. */
  perMonth: Triplet;
  perDay: Triplet;
}

/** Views needed to earn `targetPerMonth` at each RPM case. Null when any RPM is zero. */
export function viewsForGoal(targetPerMonth: number, rpm: Triplet): GoalResult | null {
  if (!(targetPerMonth > 0) || rpm.low <= 0 || rpm.typical <= 0 || rpm.high <= 0) return null;
  const perMonth = mapScenarios((k) => (targetPerMonth / rpm[k]) * 1000);
  return { perMonth, perDay: mapScenarios((k) => (perMonth[k] * MONTHS_PER_YEAR) / DAYS_PER_YEAR) };
}

/** RPM from Studio numbers: revenue ÷ views × 1,000. */
export function rpmFromRevenue(revenue: number, views: number): number | null {
  if (!(views > 0) || !(revenue >= 0)) return null;
  return (revenue / views) * 1000;
}

/** Views in a rolling 90 days from a per-day rate. */
export function rolling90(viewsPerDay: number): number {
  return viewsPerDay * RATES.partnerProgram.upcoming.shortsPoolWindowDays;
}

/* ------------------------------------------------------------------ */
/* Output text                                                         */
/* ------------------------------------------------------------------ */

const tripletRow = (label: string, t: Triplet, fmt: (n: number, ref?: number) => string) =>
  `${label}: ${fmt(t.low, t.high)} to ${fmt(t.high, t.high)} (typical ${fmt(t.typical, t.high)})`;

export function buildSummary(s: State, ev: Evaluation): string {
  if (!ev.total) return "";
  const kind = s.type === "long" ? "long-form" : s.type === "shorts" ? "Shorts" : "long-form and Shorts";
  const out: string[] = [`YouTube earnings estimate (${kind}), rates as of ${RATES.asOf}`];
  for (const sec of [ev.long, ev.shorts]) {
    if (sec) out.push(`${sec.label}: ${count(sec.viewsPerDay)} views per day at ${rate(sec.rpm.typical)} typical RPM`);
  }
  out.push(tripletRow("Per day", ev.total.day, money));
  out.push(tripletRow("Per month", ev.total.month, money));
  out.push(tripletRow("Per year", ev.total.year, money));
  out.push(tripletRow("RPM per 1,000 views", ev.total.rpm, (n) => rate(n)));
  out.push("Estimates only. Not a promise of earnings or financial advice.");
  return out.join("\n");
}

const csvCell = (v: string | number) => {
  const t = String(v);
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export function buildCsv(s: State, ev: Evaluation): string {
  if (!ev.total) return "";
  const rows: (string | number)[][] = [["Case", "RPM per 1,000 views (USD)", "Per day (USD)", "Per month (USD)", "Per year (USD)"]];
  for (const k of SCENARIOS) {
    rows.push([k, ev.total.rpm[k].toFixed(4), ev.total.day[k].toFixed(2), ev.total.month[k].toFixed(2), ev.total.year[k].toFixed(2)]);
  }
  rows.push([]);
  rows.push(["Setting", "Value"]);
  rows.push(["Rates as of", RATES.asOf]);
  rows.push(["Channel type", s.type === "long" ? "Long-form" : s.type === "shorts" ? "Shorts" : "Long-form and Shorts"]);
  rows.push(["Views per day (total)", Math.round(ev.total.viewsPerDay)]);
  if (ev.long) rows.push(["Long-form views per day", Math.round(ev.long.viewsPerDay)]);
  if (ev.shorts) rows.push(["Shorts views per day", Math.round(ev.shorts.viewsPerDay)]);
  if (ev.blend !== null) rows.push(["Audience multiplier (US = 1)", trimNum(ev.blend, 4)]);
  if (ev.blend !== null) rows.push(["Season multiplier", trimNum(ev.seasonMultiplier, 2)]);
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}
