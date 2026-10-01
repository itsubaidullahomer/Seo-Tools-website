/**
 * Pure maths, validation and formatting for the Data Transfer Calculator.
 * No React, no DOM: everything here is unit-tested in tests/data-transfer-calculator.test.ts.
 *
 *   bits             = size × bytes per unit × 8
 *   link rate        = speed × bits per second per unit        (nominal, bit/s)
 *   throughput       = link rate × efficiency                   (bit/s that carry your data)
 *   time             = bits ÷ throughput                        (mode "time")
 *   link rate needed = bits ÷ seconds ÷ efficiency              (mode "speed")
 *   data             = link rate × efficiency × seconds ÷ 8     (mode "data", in bytes)
 *
 * Size units follow the IEC convention: kB, MB, GB, TB, PB are powers of 1000 and
 * KiB, MiB, GiB, TiB, PiB are powers of 1024. Speeds in bits use decimal prefixes
 * (1 Mbps = 1,000,000 bit/s); speeds in bytes come in both families.
 */

// ---------------------------------------------------------------------------
// Number parsing
// ---------------------------------------------------------------------------

export type Parsed = { kind: "empty" } | { kind: "invalid"; hint: string } | { kind: "ok"; value: number };

export const INVALID_HINT = "Enter a number, such as 1.5 or 1,500";
export const UNIT_IN_FIELD_HINT = "Type only the number, then pick the unit from the menu next to it";
export const DECIMAL_COMMA_HINT = "Use a dot for decimals, such as 1.5. A comma can only separate thousands, as in 1,500";
export const TOO_LARGE_HINT = "This number is too large to calculate with";

/** Longer input is rejected before any pattern matching runs. */
export const MAX_INPUT_LENGTH = 60;

const PLAIN_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const GROUPED_COMMA_RE = /^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d*)?$/;
const GROUPED_SPACE_RE = /^[+-]?\d{1,3}(?: \d{3})+(?:\.\d*)?$/;
/** What a field holds half-way through typing a number: "-", "+", ".", "-.". */
const IN_PROGRESS_RE = /^[+-]?\.?$/;
/** A number followed by something that looks like a size, speed or time unit: "1.5GB", "100 Mbps", "10 MB/s", "2 hours". */
const NUMBER_WITH_UNIT_RE =
  /^[+-]?[\d.,\s]*\d[\d.,\s]*\s*(?:(?:[kmgtpe]i?)?(?:b|bits?|bytes?)(?:\/s|ps|\/sec)?|bps|secs?|seconds?|s|mins?|minutes?|m|hrs?|hours?|h|days?|d)$/i;

/**
 * Parse what a person types into a number field.
 *
 * Accepted: a dot as the decimal separator (1.5), commas or spaces as thousands
 * separators when they group digits in threes (1,500 or 1 500 or 1,500.25),
 * scientific notation (1e9), a leading + and the unicode minus sign, and, for
 * percentage fields, a trailing %. A decimal comma such as "1,5" is rejected with
 * a hint instead of being guessed at, because "1,500" would then be ambiguous.
 */
export function parseNumber(raw: string, opts: { allowPercent?: boolean } = {}): Parsed {
  let s = raw
    .replace(/[   ]/g, " ")
    .trim()
    .replace(/[−–]/g, "-");
  if (opts.allowPercent) s = s.replace(/\s*%$/, "");
  if (s === "" || IN_PROGRESS_RE.test(s)) return { kind: "empty" };
  if (s.length > MAX_INPUT_LENGTH) return { kind: "invalid", hint: INVALID_HINT };

  if (/[a-z]/i.test(s) && !PLAIN_RE.test(s)) {
    return { kind: "invalid", hint: NUMBER_WITH_UNIT_RE.test(s) ? UNIT_IN_FIELD_HINT : INVALID_HINT };
  }

  let plain = s;
  if (s.includes(",")) {
    if (!GROUPED_COMMA_RE.test(s)) return { kind: "invalid", hint: /^[+-]?[\d.,]+$/.test(s) ? DECIMAL_COMMA_HINT : INVALID_HINT };
    plain = s.replace(/,/g, "");
  } else if (s.includes(" ")) {
    if (!GROUPED_SPACE_RE.test(s)) return { kind: "invalid", hint: INVALID_HINT };
    plain = s.replace(/ /g, "");
  }
  if (!PLAIN_RE.test(plain)) return { kind: "invalid", hint: INVALID_HINT };
  const value = Number(plain);
  if (!Number.isFinite(value)) return { kind: "invalid", hint: TOO_LARGE_HINT };
  return { kind: "ok", value };
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export type SizeUnitId = "B" | "kB" | "MB" | "GB" | "TB" | "PB" | "KiB" | "MiB" | "GiB" | "TiB" | "PiB";
export type UnitFamily = "byte" | "decimal" | "binary";

export interface SizeUnit {
  id: SizeUnitId;
  name: string;
  /** Bytes in one of this unit. */
  bytes: number;
  family: UnitFamily;
}

export const SIZE_UNITS: readonly SizeUnit[] = [
  { id: "B", name: "bytes", bytes: 1, family: "byte" },
  { id: "kB", name: "kilobytes", bytes: 1e3, family: "decimal" },
  { id: "MB", name: "megabytes", bytes: 1e6, family: "decimal" },
  { id: "GB", name: "gigabytes", bytes: 1e9, family: "decimal" },
  { id: "TB", name: "terabytes", bytes: 1e12, family: "decimal" },
  { id: "PB", name: "petabytes", bytes: 1e15, family: "decimal" },
  { id: "KiB", name: "kibibytes", bytes: 2 ** 10, family: "binary" },
  { id: "MiB", name: "mebibytes", bytes: 2 ** 20, family: "binary" },
  { id: "GiB", name: "gibibytes", bytes: 2 ** 30, family: "binary" },
  { id: "TiB", name: "tebibytes", bytes: 2 ** 40, family: "binary" },
  { id: "PiB", name: "pebibytes", bytes: 2 ** 50, family: "binary" },
];

export type SpeedUnitId = "bps" | "kbps" | "Mbps" | "Gbps" | "Bps" | "kBps" | "MBps" | "GBps" | "KiBps" | "MiBps" | "GiBps";
export type SpeedFamily = "bits" | "decimal" | "binary";

export interface SpeedUnit {
  id: SpeedUnitId;
  /** How the unit is written on the page, e.g. "Mbps" or "MB/s". */
  symbol: string;
  name: string;
  /** Bits per second in one of this unit. */
  bps: number;
  family: SpeedFamily;
}

export const SPEED_UNITS: readonly SpeedUnit[] = [
  { id: "bps", symbol: "bps", name: "bits per second", bps: 1, family: "bits" },
  { id: "kbps", symbol: "kbps", name: "kilobits per second", bps: 1e3, family: "bits" },
  { id: "Mbps", symbol: "Mbps", name: "megabits per second", bps: 1e6, family: "bits" },
  { id: "Gbps", symbol: "Gbps", name: "gigabits per second", bps: 1e9, family: "bits" },
  { id: "Bps", symbol: "B/s", name: "bytes per second", bps: 8, family: "decimal" },
  { id: "kBps", symbol: "kB/s", name: "kilobytes per second", bps: 8e3, family: "decimal" },
  { id: "MBps", symbol: "MB/s", name: "megabytes per second", bps: 8e6, family: "decimal" },
  { id: "GBps", symbol: "GB/s", name: "gigabytes per second", bps: 8e9, family: "decimal" },
  { id: "KiBps", symbol: "KiB/s", name: "kibibytes per second", bps: 8 * 2 ** 10, family: "binary" },
  { id: "MiBps", symbol: "MiB/s", name: "mebibytes per second", bps: 8 * 2 ** 20, family: "binary" },
  { id: "GiBps", symbol: "GiB/s", name: "gibibytes per second", bps: 8 * 2 ** 30, family: "binary" },
];

export type TimeUnitId = "s" | "min" | "h" | "d";

export interface TimeUnit {
  id: TimeUnitId;
  name: string;
  seconds: number;
}

export const TIME_UNITS: readonly TimeUnit[] = [
  { id: "s", name: "seconds", seconds: 1 },
  { id: "min", name: "minutes", seconds: 60 },
  { id: "h", name: "hours", seconds: 3600 },
  { id: "d", name: "days", seconds: 86400 },
];

export function sizeUnit(id: string): SizeUnit | undefined {
  return SIZE_UNITS.find((u) => u.id === id);
}
export function speedUnit(id: string): SpeedUnit | undefined {
  return SPEED_UNITS.find((u) => u.id === id);
}
export function timeUnit(id: string): TimeUnit | undefined {
  return TIME_UNITS.find((u) => u.id === id);
}

/** Bytes in `value` of a size unit. */
export function toBytes(value: number, unit: SizeUnitId): number {
  return clean(value * (sizeUnit(unit)?.bytes ?? NaN));
}
/** Bits per second in `value` of a speed unit. */
export function toBitsPerSecond(value: number, unit: SpeedUnitId): number {
  return clean(value * (speedUnit(unit)?.bps ?? NaN));
}
/** Seconds in `value` of a time unit. */
export function toSeconds(value: number, unit: TimeUnitId): number {
  return clean(value * (timeUnit(unit)?.seconds ?? NaN));
}
/** Convert a size between any two size units. */
export function convertSize(value: number, from: SizeUnitId, to: SizeUnitId): number {
  return clean(toBytes(value, from) / (sizeUnit(to)?.bytes ?? NaN));
}
/** Convert a speed between any two speed units. */
export function convertSpeed(value: number, from: SpeedUnitId, to: SpeedUnitId): number {
  return clean(toBitsPerSecond(value, from) / (speedUnit(to)?.bps ?? NaN));
}

/**
 * Remove binary floating point noise such as 1.005 × 1e9 = 1004999999.9999999.
 * Integers are left alone, so exact byte and bit counts such as 1 PiB =
 * 1,125,899,906,842,624 bytes keep every digit. Other values snap to their
 * 15-significant-digit form only when the two differ by a few units in the last place.
 */
export function clean(n: number): number {
  if (!Number.isFinite(n) || n === 0 || Number.isInteger(n)) return n;
  const snapped = Number(n.toPrecision(15));
  return Math.abs(snapped - n) <= Math.abs(n) * 2 ** -50 ? snapped : n;
}

// ---------------------------------------------------------------------------
// Core formulas
// ---------------------------------------------------------------------------

/** Seconds to move `bytes` over a link of `nominalBps` when `efficiency` (0-1] of it carries data. */
export function transferSeconds(bytes: number, nominalBps: number, efficiency = 1): number {
  return clean((bytes * 8) / (nominalBps * efficiency));
}

/** Nominal link rate in bit/s needed to move `bytes` within `seconds`. */
export function requiredBitsPerSecond(bytes: number, seconds: number, efficiency = 1): number {
  return clean((bytes * 8) / seconds / efficiency);
}

/** Bytes moved by a link of `nominalBps` running for `seconds`. */
export function bytesTransferred(nominalBps: number, seconds: number, efficiency = 1): number {
  return clean((nominalBps * efficiency * seconds) / 8);
}

// ---------------------------------------------------------------------------
// Protocol overhead worked example (derived, not measured)
// ---------------------------------------------------------------------------

/** Byte counts for one full-size TCP/IPv4 segment on Ethernet with a 1500-byte MTU. */
export const ETHERNET_FRAME = {
  mtu: 1500,
  ipv4Header: 20,
  tcpHeader: 20,
  /** TCP timestamps option: 10 bytes plus 2 bytes of padding. */
  tcpTimestamps: 12,
  /** Destination MAC, source MAC, EtherType. */
  ethernetHeader: 14,
  /** Frame check sequence. */
  fcs: 4,
  /** 7-byte preamble plus 1-byte start frame delimiter. */
  preamble: 8,
  /** Minimum inter-frame gap of 96 bit times. */
  interFrameGap: 12,
} as const;

export interface OverheadExample {
  payload: number;
  wire: number;
  /** payload ÷ wire, 0-1. */
  ratio: number;
}

/**
 * Highest share of an Ethernet link's nominal rate that can carry TCP payload,
 * with full-size 1500-byte packets, no loss, and no other traffic.
 */
export function tcpIpv4EthernetEfficiency(opts: { timestamps?: boolean } = {}): OverheadExample {
  const f = ETHERNET_FRAME;
  const payload = f.mtu - f.ipv4Header - f.tcpHeader - (opts.timestamps ? f.tcpTimestamps : 0);
  const wire = f.mtu + f.ethernetHeader + f.fcs + f.preamble + f.interFrameGap;
  return { payload, wire, ratio: payload / wire };
}

// ---------------------------------------------------------------------------
// Fields, validation and evaluation
// ---------------------------------------------------------------------------

export const MODES = ["time", "speed", "data"] as const;
export type Mode = (typeof MODES)[number];

export const MODE_INFO: Record<Mode, { label: string; title: string; description: string }> = {
  time: { label: "Transfer time", title: "Transfer time", description: "Enter how much data and the link speed to see how long the transfer takes." },
  speed: { label: "Speed needed", title: "Link speed needed", description: "Enter how much data and your deadline to see the minimum link speed." },
  data: { label: "Data amount", title: "Data transferred", description: "Enter a link speed and a length of time to see how much data it can move." },
};

export type FieldKey = "size" | "speed" | "time" | "efficiency";
export type FieldErrors = Partial<Record<FieldKey, string>>;

/** The inputs each mode reads. */
export const MODE_FIELDS: Record<Mode, readonly FieldKey[]> = {
  time: ["size", "speed", "efficiency"],
  speed: ["size", "time", "efficiency"],
  data: ["speed", "time", "efficiency"],
};

/** Raw text of every input, exactly as typed, plus the chosen units. */
export interface Fields {
  mode: Mode;
  size: string;
  sizeUnit: SizeUnitId;
  speed: string;
  speedUnit: SpeedUnitId;
  time: string;
  timeUnit: TimeUnitId;
  /** Share of the nominal link rate that carries your data, in percent. */
  efficiency: string;
}

export const DEFAULT_FIELDS: Fields = {
  mode: "time",
  size: "1",
  sizeUnit: "GB",
  speed: "100",
  speedUnit: "Mbps",
  time: "1",
  timeUnit: "h",
  efficiency: "100",
};

/** One bit. */
export const MIN_BYTES = 0.125;
/** 1 EB (10^18 bytes). */
export const MAX_BYTES = 1e18;
export const MIN_BPS = 1;
/** 1 Pbit/s, i.e. 1,000,000 Gbps. */
export const MAX_BPS = 1e15;
/** One millisecond. */
export const MIN_SECONDS = 0.001;
/** A Julian year of 365.25 days, used for "about N years". */
export const YEAR_SECONDS = 365.25 * 86400;
/** 100 years. */
export const MAX_SECONDS = 100 * YEAR_SECONDS;
export const MIN_EFFICIENCY = 1;
export const MAX_EFFICIENCY = 100;

export const MESSAGES = {
  size: {
    missing: "Enter the amount of data, for example 1 GB.",
    zero: "Enter a size greater than 0.",
    negative: "A size cannot be negative.",
    small: "The smallest size accepted is 1 bit (0.125 bytes).",
    large: "The largest size accepted is 1 EB (10^18 bytes, about 888 PiB).",
  },
  speed: {
    missing: "Enter the link speed, for example 100 Mbps.",
    zero: "At a speed of 0 a transfer never finishes. Enter a speed above 0.",
    negative: "A speed cannot be negative.",
    small: "The slowest speed accepted is 1 bit per second.",
    large: "The fastest speed accepted is 1,000,000 Gbps (10^15 bit/s).",
  },
  time: {
    missing: "Enter a length of time, for example 1 hour.",
    zero: "Enter a time greater than 0.",
    negative: "A time cannot be negative.",
    small: "The shortest time accepted is 1 millisecond (0.001 s).",
    large: "The longest time accepted is 100 years (36,525 days).",
  },
  efficiency: {
    missing: "Enter an efficiency from 1 to 100%. Use 100 for the full nominal rate.",
    zero: "Efficiency must be above 0%. Use 100 for the full nominal rate.",
    negative: "Efficiency cannot be negative.",
    small: "The lowest efficiency accepted is 1%.",
    large: "Efficiency cannot be above 100%, because no link carries more than its nominal rate. If your data compresses, enter the compressed size instead.",
  },
} as const satisfies Record<FieldKey, Record<"missing" | "zero" | "negative" | "small" | "large", string>>;

export interface TransferInput {
  size?: { value: number; unit: SizeUnit };
  speed?: { value: number; unit: SpeedUnit };
  time?: { value: number; unit: TimeUnit };
  /** Efficiency as typed, in percent (1-100). */
  efficiencyPct: number;
}

export interface TransferResult {
  mode: Mode;
  input: TransferInput;
  bytes: number;
  bits: number;
  seconds: number;
  /** The link's nominal rate in bit/s (typed in "time" and "data", the answer in "speed"). */
  nominalBps: number;
  /** The part of the nominal rate that carries your data: nominal × efficiency. */
  effectiveBps: number;
  /** 0-1. */
  efficiency: number;
}

export type Evaluation =
  | { status: "empty"; errors: FieldErrors; missing: FieldKey[] }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "ok"; errors: FieldErrors; result: TransferResult };

function inRange(v: number, min: number, max: number, msg: Record<"zero" | "negative" | "small" | "large", string>): string | undefined {
  if (v === 0) return msg.zero;
  if (v < 0) return msg.negative;
  if (v < min * (1 - 1e-12)) return msg.small;
  if (v > max * (1 + 1e-12)) return msg.large;
  return undefined;
}

/** Turn the raw fields into a result, or say which field is wrong and why. Only the fields the mode uses are read. */
export function evaluate(f: Fields): Evaluation {
  const errors: FieldErrors = {};
  const missing: FieldKey[] = [];
  const wanted = MODE_FIELDS[f.mode] ?? MODE_FIELDS.time;
  const uses = (k: FieldKey) => wanted.includes(k);

  const read = (key: FieldKey, raw: string, allowPercent = false): number | undefined => {
    const p = parseNumber(raw, { allowPercent });
    if (p.kind === "empty") {
      missing.push(key);
      return undefined;
    }
    if (p.kind === "invalid") {
      errors[key] = p.hint;
      return undefined;
    }
    return p.value;
  };

  const input: TransferInput = { efficiencyPct: 100 };
  let bytes: number | undefined;
  let nominalBps: number | undefined;
  let seconds: number | undefined;

  if (uses("size")) {
    const v = read("size", f.size);
    const unit = sizeUnit(f.sizeUnit) ?? sizeUnit("GB")!;
    if (v !== undefined) {
      const b = toBytes(v, unit.id);
      const e = inRange(b, MIN_BYTES, MAX_BYTES, MESSAGES.size);
      if (e) errors.size = e;
      else {
        bytes = b;
        input.size = { value: v, unit };
      }
    }
  }
  if (uses("speed")) {
    const v = read("speed", f.speed);
    const unit = speedUnit(f.speedUnit) ?? speedUnit("Mbps")!;
    if (v !== undefined) {
      const bps = toBitsPerSecond(v, unit.id);
      const e = inRange(bps, MIN_BPS, MAX_BPS, MESSAGES.speed);
      if (e) errors.speed = e;
      else {
        nominalBps = bps;
        input.speed = { value: v, unit };
      }
    }
  }
  if (uses("time")) {
    const v = read("time", f.time);
    const unit = timeUnit(f.timeUnit) ?? timeUnit("h")!;
    if (v !== undefined) {
      const s = toSeconds(v, unit.id);
      const e = inRange(s, MIN_SECONDS, MAX_SECONDS, MESSAGES.time);
      if (e) errors.time = e;
      else {
        seconds = s;
        input.time = { value: v, unit };
      }
    }
  }
  const pct = read("efficiency", f.efficiency, true);
  if (pct !== undefined) {
    const e = inRange(pct, MIN_EFFICIENCY, MAX_EFFICIENCY, MESSAGES.efficiency);
    if (e) errors.efficiency = e;
    else input.efficiencyPct = pct;
  }

  if (Object.keys(errors).length) return { status: "invalid", errors };
  if (missing.length) return { status: "empty", errors, missing };

  const efficiency = input.efficiencyPct / 100;
  let result: TransferResult;
  if (f.mode === "speed") {
    const b = bytes!;
    const s = seconds!;
    const nominal = requiredBitsPerSecond(b, s, efficiency);
    result = { mode: "speed", input, bytes: b, bits: clean(b * 8), seconds: s, nominalBps: nominal, effectiveBps: clean((b * 8) / s), efficiency };
  } else if (f.mode === "data") {
    const n = nominalBps!;
    const s = seconds!;
    const b = bytesTransferred(n, s, efficiency);
    result = { mode: "data", input, bytes: b, bits: clean(b * 8), seconds: s, nominalBps: n, effectiveBps: clean(n * efficiency), efficiency };
  } else {
    const b = bytes!;
    const n = nominalBps!;
    result = { mode: "time", input, bytes: b, bits: clean(b * 8), seconds: transferSeconds(b, n, efficiency), nominalBps: n, effectiveBps: clean(n * efficiency), efficiency };
  }
  return { status: "ok", errors, result };
}

/** Rebuild stored state field by field so a missing, outdated or hand-edited value can never crash the page. */
export function normalizeFields(stored: unknown): Fields {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const text = (k: "size" | "speed" | "time" | "efficiency") => {
    const v = src[k];
    if (typeof v === "string") return v.slice(0, 60);
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    return DEFAULT_FIELDS[k];
  };
  const pick = <T extends string>(v: unknown, allowed: readonly { id: T }[] | readonly T[], fallback: T): T => {
    if (typeof v !== "string") return fallback;
    const ok = (allowed as readonly (T | { id: T })[]).some((a) => (typeof a === "string" ? a === v : a.id === v));
    return ok ? (v as T) : fallback;
  };
  return {
    mode: pick(src.mode, MODES, DEFAULT_FIELDS.mode),
    size: text("size"),
    sizeUnit: pick(src.sizeUnit, SIZE_UNITS, DEFAULT_FIELDS.sizeUnit),
    speed: text("speed"),
    speedUnit: pick(src.speedUnit, SPEED_UNITS, DEFAULT_FIELDS.speedUnit),
    time: text("time"),
    timeUnit: pick(src.timeUnit, TIME_UNITS, DEFAULT_FIELDS.timeUnit),
    efficiency: text("efficiency"),
  };
}

// ---------------------------------------------------------------------------
// Number and unit formatting
// ---------------------------------------------------------------------------

const formatters = new Map<string, Intl.NumberFormat>();
function nf(key: string, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  let f = formatters.get(key);
  if (!f) formatters.set(key, (f = new Intl.NumberFormat("en-US", opts)));
  return f;
}

function formatExp(n: number): string {
  const [mantissa, exp] = n.toExponential(3).split("e");
  return `${mantissa.replace(/\.?0+$/, "")}e${exp}`;
}

/**
 * Format a number for display with thousands separators. Values of 1 or more get
 * up to `maxFrac` decimals; smaller values keep `maxFrac + 1` significant digits
 * so 0.0000931 does not collapse to 0. Extremes switch to e-notation.
 */
export function formatNum(n: number, maxFrac = 3): string {
  if (Number.isNaN(n)) return "–";
  if (!Number.isFinite(n)) return n > 0 ? "∞" : "-∞";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e21 || abs < 1e-6) return formatExp(n);
  if (abs >= 1) return nf(`f${maxFrac}`, { maximumFractionDigits: maxFrac }).format(n);
  return nf(`s${maxFrac}`, { maximumSignificantDigits: Math.max(1, maxFrac + 1) }).format(n);
}

/** Percentages as typed, e.g. 94.93 -> "94.93%". */
export function formatPct(pct: number): string {
  return `${formatNum(pct, 4)}%`;
}

type Ladder = readonly (readonly [string, number])[];

export const DECIMAL_SIZE_LADDER: Ladder = [
  ["B", 1],
  ["kB", 1e3],
  ["MB", 1e6],
  ["GB", 1e9],
  ["TB", 1e12],
  ["PB", 1e15],
  ["EB", 1e18],
];
export const BINARY_SIZE_LADDER: Ladder = [
  ["B", 1],
  ["KiB", 2 ** 10],
  ["MiB", 2 ** 20],
  ["GiB", 2 ** 30],
  ["TiB", 2 ** 40],
  ["PiB", 2 ** 50],
  ["EiB", 2 ** 60],
];
export const BIT_RATE_LADDER: Ladder = [
  ["bps", 1],
  ["kbps", 1e3],
  ["Mbps", 1e6],
  ["Gbps", 1e9],
  ["Tbps", 1e12],
  ["Pbps", 1e15],
];
const DECIMAL_BYTE_RATE_LADDER: Ladder = DECIMAL_SIZE_LADDER.slice(0, 6).map(([u, f]) => [`${u}/s`, f] as const);
const BINARY_BYTE_RATE_LADDER: Ladder = BINARY_SIZE_LADDER.slice(0, 6).map(([u, f]) => [`${u}/s`, f] as const);

export interface Scaled {
  value: number;
  unit: string;
  /** Ready to show, e.g. "41.91 GiB". */
  text: string;
}

function roundTo(n: number, decimals: number): number {
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}

/** Pick the largest unit in which the value is at least 1, e.g. 45e9 bytes -> 45 GB. */
export function scale(value: number, ladder: Ladder, maxFrac = 3): Scaled {
  let i = 0;
  for (let k = ladder.length - 1; k >= 0; k--) {
    if (Math.abs(value) >= ladder[k][1]) {
      i = k;
      break;
    }
  }
  // 999.9996 MB would print as "1,000 MB"; show "1 GB" instead.
  if (i < ladder.length - 1 && roundTo(Math.abs(value) / ladder[i][1], maxFrac) >= ladder[i + 1][1] / ladder[i][1]) i++;
  const v = value / ladder[i][1];
  return { value: v, unit: ladder[i][0], text: `${formatNum(v, maxFrac)} ${ladder[i][0]}` };
}

/** A byte count in decimal (kB, MB, GB…) or binary (KiB, MiB, GiB…) units. */
export function formatSize(bytes: number, family: "decimal" | "binary" = "decimal", maxFrac = 3): Scaled {
  return scale(bytes, family === "binary" ? BINARY_SIZE_LADDER : DECIMAL_SIZE_LADDER, maxFrac);
}

/** A rate in bit/s shown in bits (Mbps, Gbps…). */
export function formatBitRate(bps: number, maxFrac = 3): Scaled {
  return scale(bps, BIT_RATE_LADDER, maxFrac);
}

/** A rate in bit/s shown in bytes per second, decimal (MB/s) or binary (MiB/s). */
export function formatByteRate(bps: number, family: "decimal" | "binary" = "decimal", maxFrac = 3): Scaled {
  return scale(bps / 8, family === "binary" ? BINARY_BYTE_RATE_LADDER : DECIMAL_BYTE_RATE_LADDER, maxFrac);
}

/** A rate in a specific speed unit, e.g. formatSpeedIn(1e8, "MBps") -> "12.5 MB/s". */
export function formatSpeedIn(bps: number, unit: SpeedUnitId, maxFrac = 3): string {
  const u = speedUnit(unit)!;
  return `${formatNum(bps / u.bps, maxFrac)} ${u.symbol}`;
}

/** A size in a specific size unit, e.g. formatSizeIn(1e12, "GiB") -> "931.323 GiB". */
export function formatSizeIn(bytes: number, unit: SizeUnitId, maxFrac = 3): string {
  const u = sizeUnit(unit)!;
  return `${formatNum(bytes / u.bytes, maxFrac)} ${u.id}`;
}

/** Durations from this length on are shown as "about N years". */
export const LONG_DURATION_SECONDS = 1e9;

/**
 * Human-readable duration: "80 ms", "8.59 s", "1 min 20 s", "2 h 13 min 20 s", "1 d 3 h 46 min 40 s".
 * From a minute up the value is rounded to whole seconds; the exact figure is shown separately.
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "–";
  if (seconds === 0) return "0 s";
  if (seconds < 1) {
    const subs: readonly (readonly [string, number])[] = [
      ["ms", 1e-3],
      ["µs", 1e-6],
      ["ns", 1e-9],
    ];
    for (let i = 0; i < subs.length; i++) {
      const [unit, factor] = subs[i];
      if (seconds >= factor) {
        const v = roundTo(seconds / factor, 2);
        if (v >= 1000) return i === 0 ? "1 s" : `1 ${subs[i - 1][0]}`;
        return `${formatNum(v, 2)} ${unit}`;
      }
    }
    return "less than 1 ns";
  }
  const r = roundTo(seconds, 2);
  if (r < 60) return `${formatNum(r, 2)} s`;
  if (seconds >= LONG_DURATION_SECONDS) return `about ${formatNum(seconds / YEAR_SECONDS, 0)} years`;
  let rest = Math.round(seconds);
  const d = Math.floor(rest / 86400);
  rest -= d * 86400;
  const h = Math.floor(rest / 3600);
  rest -= h * 3600;
  const m = Math.floor(rest / 60);
  const s = rest - m * 60;
  const parts: string[] = [];
  if (d) parts.push(`${formatNum(d, 0)} d`);
  if (h) parts.push(`${h} h`);
  if (m) parts.push(`${m} min`);
  if (s) parts.push(`${s} s`);
  return parts.join(" ");
}

/** Exact seconds, e.g. 85.89934592 -> "85.899 s". */
export function formatSeconds(seconds: number): string {
  return `${formatNum(seconds, 3)} s`;
}

/** "about 1.5 years" for durations of a year or more, otherwise null. */
export function approxYears(seconds: number): string | null {
  if (!(seconds >= YEAR_SECONDS)) return null;
  const y = seconds / YEAR_SECONDS;
  return `about ${formatNum(y, y >= 10 ? 0 : 1)} ${roundTo(y, 1) === 1 ? "year" : "years"}`;
}

/** The same duration as decimal minutes, hours and days. */
export function durationIn(seconds: number): { unit: TimeUnitId; label: string; value: number; text: string }[] {
  return TIME_UNITS.map((u) => {
    const value = seconds / u.seconds;
    return { unit: u.id, label: u.name, value, text: `${formatNum(value, 3)} ${u.id}` };
  });
}

/** Rows for "the same speed in other units", grouped by family. */
export function speedInAllUnits(bps: number): { family: SpeedFamily; unit: SpeedUnit; value: number; text: string }[] {
  return SPEED_UNITS.map((u) => ({ family: u.family, unit: u, value: bps / u.bps, text: `${formatNum(bps / u.bps, 3)} ${u.symbol}` }));
}

/** Rows for "the same amount of data in other units". Bytes are listed once, under decimal. */
export function sizeInAllUnits(bytes: number): { family: UnitFamily; unit: SizeUnit; value: number; text: string }[] {
  return SIZE_UNITS.map((u) => ({ family: u.family, unit: u, value: bytes / u.bytes, text: `${formatNum(bytes / u.bytes, 3)} ${u.id}` }));
}

/** The same-sized unit in the other family: GB <-> GiB, kB <-> KiB, and so on. */
export const COUNTERPART: Record<SizeUnitId, SizeUnitId> = {
  B: "B",
  kB: "KiB",
  MB: "MiB",
  GB: "GiB",
  TB: "TiB",
  PB: "PiB",
  KiB: "kB",
  MiB: "MB",
  GiB: "GB",
  TiB: "TB",
  PiB: "PB",
};

/** One-line explanation under the size field: "1 GB = 1,000,000,000 bytes = 0.931 GiB". */
export function sizeHint(value: number, unit: SizeUnitId): string {
  const u = sizeUnit(unit)!;
  const bytes = toBytes(value, unit);
  const head = `${formatNum(value, 6)} ${u.id}`;
  if (u.family === "byte") {
    if (Math.abs(bytes) < 1000) return `${head} = ${formatNum(bytes * 8)} bits`;
    return `${head} = ${formatSize(bytes, "decimal").text} = ${formatSize(bytes, "binary").text}`;
  }
  return `${head} = ${formatNum(bytes, 3)} bytes = ${formatSizeIn(bytes, COUNTERPART[unit])}`;
}

export interface UnitTableRow {
  decimal: string;
  decimalBytes: number;
  binary: string;
  binaryBytes: number;
  /** How much larger the binary unit is, in percent. */
  gapPct: number;
}

/** kB vs KiB up to PB vs PiB: the gap grows with every step. */
export const UNIT_TABLE: readonly UnitTableRow[] = [1, 2, 3, 4, 5].map((n) => ({
  decimal: DECIMAL_SIZE_LADDER[n][0],
  decimalBytes: 1000 ** n,
  binary: BINARY_SIZE_LADDER[n][0],
  binaryBytes: 1024 ** n,
  gapPct: ((1024 / 1000) ** n - 1) * 100,
}));

/** One-line explanation under the speed field: "100 Mbps = 12.5 MB/s = 11.921 MiB/s". */
export function speedHint(value: number, unit: SpeedUnitId): string {
  const u = speedUnit(unit)!;
  const bps = toBitsPerSecond(value, unit);
  const head = `${formatNum(value, 6)} ${u.symbol}`;
  if (u.family === "bits") return `${head} = ${formatByteRate(bps, "decimal").text} = ${formatByteRate(bps, "binary").text}`;
  return `${head} = ${formatBitRate(bps).text} = ${formatNum(bps, 3)} bit/s`;
}

/** One-line explanation under the time field: "1 h = 3,600 s". */
export function timeHint(value: number, unit: TimeUnitId): string {
  return `${formatNum(value, 6)} ${unit} = ${formatSeconds(toSeconds(value, unit))}`;
}

// ---------------------------------------------------------------------------
// Explanation, summary and comparison table
// ---------------------------------------------------------------------------

function sizeStep(r: TransferResult): string {
  const s = r.input.size!;
  if (s.unit.id === "B") return `Data: ${formatNum(s.value, 6)} B = ${formatNum(r.bytes)} bytes`;
  return `Data: ${formatNum(s.value, 6)} ${s.unit.id} × ${formatNum(s.unit.bytes)} = ${formatNum(r.bytes)} bytes`;
}

function speedStep(r: TransferResult): string {
  const sp = r.input.speed!;
  const u = sp.unit;
  if (u.id === "bps") return `Link speed: ${formatNum(sp.value, 6)} bps = ${formatNum(r.nominalBps)} bit/s`;
  if (u.family === "bits") return `Link speed: ${formatNum(sp.value, 6)} ${u.symbol} × ${formatNum(u.bps)} = ${formatNum(r.nominalBps)} bit/s`;
  return `Link speed: ${formatNum(sp.value, 6)} ${u.symbol} × ${formatNum(u.bps / 8)} bytes × 8 = ${formatNum(r.nominalBps)} bit/s`;
}

function timeStep(r: TransferResult): string {
  const t = r.input.time!;
  if (t.unit.id === "s") return `Time: ${formatNum(t.value, 6)} s`;
  return `Time: ${formatNum(t.value, 6)} ${t.unit.id} × ${formatNum(t.unit.seconds)} = ${formatNum(r.seconds)} s`;
}

/** The calculation written out with the user's own numbers, one step per line. */
export function explainSteps(r: TransferResult): string[] {
  const pct = formatPct(r.input.efficiencyPct);
  const partial = r.efficiency < 1;
  const lines: string[] = [];
  if (r.mode === "time") {
    lines.push(sizeStep(r));
    lines.push(`Bits: ${formatNum(r.bytes)} bytes × 8 = ${formatNum(r.bits)} bits`);
    lines.push(speedStep(r));
    if (partial) lines.push(`Throughput: ${formatNum(r.nominalBps)} bit/s × ${pct} = ${formatNum(r.effectiveBps)} bit/s`);
    lines.push(`Time: ${formatNum(r.bits)} bits ÷ ${formatNum(r.effectiveBps)} bit/s = ${formatSeconds(r.seconds)} (${formatDuration(r.seconds)})`);
  } else if (r.mode === "speed") {
    lines.push(sizeStep(r));
    lines.push(`Bits: ${formatNum(r.bytes)} bytes × 8 = ${formatNum(r.bits)} bits`);
    lines.push(timeStep(r));
    lines.push(`Throughput: ${formatNum(r.bits)} bits ÷ ${formatNum(r.seconds)} s = ${formatNum(r.effectiveBps)} bit/s`);
    if (partial) lines.push(`Link speed: ${formatNum(r.effectiveBps)} bit/s ÷ ${pct} = ${formatNum(r.nominalBps)} bit/s = ${formatBitRate(r.nominalBps).text}`);
    else lines.push(`Link speed: ${formatNum(r.nominalBps)} bit/s = ${formatBitRate(r.nominalBps).text}`);
  } else {
    lines.push(speedStep(r));
    if (partial) lines.push(`Throughput: ${formatNum(r.nominalBps)} bit/s × ${pct} = ${formatNum(r.effectiveBps)} bit/s`);
    lines.push(timeStep(r));
    lines.push(`Bits: ${formatNum(r.effectiveBps)} bit/s × ${formatNum(r.seconds)} s = ${formatNum(r.bits)} bits`);
    lines.push(`Data: ${formatNum(r.bits)} bits ÷ 8 = ${formatNum(r.bytes)} bytes = ${formatSize(r.bytes, "decimal").text} = ${formatSize(r.bytes, "binary").text}`);
  }
  return lines;
}

/** The answer in one short string, as shown in the headline. */
export function headline(r: TransferResult): string {
  if (r.mode === "time") return formatDuration(r.seconds);
  if (r.mode === "speed") return formatBitRate(r.nominalBps).text;
  return formatSize(r.bytes, "decimal").text;
}

function describeSize(r: TransferResult): string {
  const s = r.input.size!;
  return `${formatNum(s.value, 6)} ${s.unit.id} (${formatNum(r.bytes)} bytes)`;
}
function describeSpeed(r: TransferResult): string {
  const sp = r.input.speed!;
  return `${formatNum(sp.value, 6)} ${sp.unit.symbol} (${formatNum(r.nominalBps)} bit/s)`;
}
function describeTime(r: TransferResult): string {
  const t = r.input.time!;
  return `${formatNum(t.value, 6)} ${t.unit.id} (${formatSeconds(r.seconds)})`;
}

/** Plain-text summary for the clipboard: inputs, answer and working. */
export function summaryText(r: TransferResult): string {
  const lines: string[] = [];
  const eff = `Efficiency: ${formatPct(r.input.efficiencyPct)}${r.efficiency === 1 ? " (full nominal rate)" : " of the nominal rate"}`;
  if (r.mode === "time") {
    lines.push(`Transfer time: ${formatDuration(r.seconds)} (${formatSeconds(r.seconds)})`);
    lines.push(`Data: ${describeSize(r)}`, `Link speed: ${describeSpeed(r)}`, eff);
  } else if (r.mode === "speed") {
    lines.push(`Link speed needed: ${formatBitRate(r.nominalBps).text} (${formatNum(r.nominalBps)} bit/s, ${formatByteRate(r.nominalBps, "decimal").text}, ${formatByteRate(r.nominalBps, "binary").text})`);
    lines.push(`Data: ${describeSize(r)}`, `Time allowed: ${describeTime(r)}`, eff);
  } else {
    lines.push(`Data transferred: ${formatSize(r.bytes, "decimal").text} = ${formatSize(r.bytes, "binary").text} (${formatNum(r.bytes)} bytes)`);
    lines.push(`Link speed: ${describeSpeed(r)}`, `Time: ${describeTime(r)}`, eff);
  }
  lines.push("", "Working:", ...explainSteps(r).map((l) => `  ${l}`));
  return lines.join("\n");
}

export interface LinkSpeed {
  bps: number;
  label: string;
  /** A technology whose nominal rate this is. */
  note?: string;
}

/** Nominal link rates for the comparison table. Technology names mark nominal (for USB, signalling) rates only. */
export const COMMON_LINK_SPEEDS: readonly LinkSpeed[] = [
  { bps: 10e6, label: "10 Mbps" },
  { bps: 25e6, label: "25 Mbps" },
  { bps: 50e6, label: "50 Mbps" },
  { bps: 100e6, label: "100 Mbps", note: "Fast Ethernet" },
  { bps: 300e6, label: "300 Mbps" },
  { bps: 480e6, label: "480 Mbps", note: "USB 2.0 High-Speed" },
  { bps: 500e6, label: "500 Mbps" },
  { bps: 1e9, label: "1 Gbps", note: "Gigabit Ethernet" },
  { bps: 5e9, label: "5 Gbps", note: "USB 3.2 Gen 1" },
  { bps: 10e9, label: "10 Gbps", note: "10 Gigabit Ethernet" },
];

export interface ComparisonRow {
  bps: number;
  label: string;
  note?: string;
  /** "yours" = the speed you typed; "needed" = the minimum speed for your deadline. */
  kind: "preset" | "yours" | "needed";
  /** Transfer time for your data ("time" and "speed" modes). */
  seconds?: number;
  /** Data moved in your time ("data" mode). */
  bytes?: number;
  /** "speed" mode: finishes within your deadline. */
  meets?: boolean;
}

/**
 * Your data at common link speeds (or, in "data" mode, your time at those speeds),
 * with the same efficiency applied. Your own speed, or the speed you need, is
 * added as an extra row unless it equals one of the presets.
 */
export function comparisonRows(r: TransferResult): ComparisonRow[] {
  const own: ComparisonRow["kind"] = r.mode === "speed" ? "needed" : "yours";
  const rows: ComparisonRow[] = COMMON_LINK_SPEEDS.map((l) => ({ ...l, kind: "preset" as const }));
  const match = rows.find((row) => Math.abs(row.bps - r.nominalBps) <= 1e-9 * r.nominalBps);
  if (match) match.kind = own;
  else {
    const extra: ComparisonRow = { bps: r.nominalBps, label: formatBitRate(r.nominalBps).text, kind: own };
    const at = rows.findIndex((row) => row.bps > r.nominalBps);
    rows.splice(at === -1 ? rows.length : at, 0, extra);
  }
  for (const row of rows) {
    if (r.mode === "data") row.bytes = bytesTransferred(row.bps, r.seconds, r.efficiency);
    else row.seconds = transferSeconds(r.bytes, row.bps, r.efficiency);
    if (r.mode === "speed") row.meets = row.seconds! <= r.seconds * (1 + 1e-12);
  }
  return rows;
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** The comparison table as CSV. Numbers are plain (no thousands separators) so spreadsheets read them. */
export function comparisonCsv(r: TransferResult, rows: ComparisonRow[] = comparisonRows(r)): string {
  const note = (row: ComparisonRow) => [row.note, row.kind === "yours" ? "your speed" : row.kind === "needed" ? "minimum for your deadline" : ""].filter(Boolean).join("; ");
  const plain = (n: number) => String(roundTo(n, 3));
  const out: string[][] = [];
  if (r.mode === "data") {
    out.push(["Link speed (nominal)", "Note", "Data (decimal)", "Data (binary)", "Bytes"]);
    for (const row of rows) out.push([row.label, note(row), formatSize(row.bytes!, "decimal").text, formatSize(row.bytes!, "binary").text, plain(row.bytes!)]);
  } else {
    const head = ["Link speed (nominal)", "Note", "Transfer time", "Seconds"];
    out.push(r.mode === "speed" ? [...head, "Within deadline"] : head);
    for (const row of rows) {
      const line = [row.label, note(row), formatDuration(row.seconds!), plain(row.seconds!)];
      out.push(r.mode === "speed" ? [...line, row.meets ? "yes" : "no"] : line);
    }
  }
  return out.map((cells) => cells.map(csvCell).join(",")).join("\n");
}

// ---------------------------------------------------------------------------
// Presets for the UI
// ---------------------------------------------------------------------------

export interface Example {
  id: string;
  label: string;
  fields: Partial<Fields>;
}

/** The worked examples from the article, one click each. */
export const EXAMPLES: readonly Example[] = [
  { id: "1gb", label: "1 GB at 100 Mbps", fields: { mode: "time", size: "1", sizeUnit: "GB", speed: "100", speedUnit: "Mbps", efficiency: "100" } },
  { id: "1gib", label: "1 GiB at 100 Mbps", fields: { mode: "time", size: "1", sizeUnit: "GiB", speed: "100", speedUnit: "Mbps", efficiency: "100" } },
  { id: "50gb", label: "50 GB in 1 hour", fields: { mode: "speed", size: "50", sizeUnit: "GB", time: "1", timeUnit: "h", efficiency: "100" } },
  { id: "100mbps", label: "100 Mbps for 1 hour", fields: { mode: "data", speed: "100", speedUnit: "Mbps", time: "1", timeUnit: "h", efficiency: "100" } },
];

/** Quick efficiency values. 94.93% is derived in tcpIpv4EthernetEfficiency(), not measured. */
export const EFFICIENCY_PRESETS: readonly { value: string; label: string; description: string }[] = [
  { value: "100", label: "100%", description: "Full nominal rate (best case)" },
  { value: "94.93", label: "94.93%", description: "TCP/IPv4 over Ethernet, 1500-byte MTU, theoretical maximum" },
];
