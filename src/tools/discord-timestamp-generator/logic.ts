/**
 * Pure helpers for the Discord timestamp generator. Nothing here touches the DOM
 * or reads the clock on its own: every function that needs "now" takes it as an
 * argument, which keeps the logic easy to test and safe to import on the server.
 */

/* ------------------------------------------------------------------ constants */

export type StyleLetter = "t" | "T" | "d" | "D" | "f" | "F" | "R";

export interface StyleInfo {
  style: StyleLetter;
  name: string;
  /** Key of the TimestampStyles object exported by discord.js. */
  jsKey: string;
}

export const STYLES: readonly StyleInfo[] = [
  { style: "t", name: "Short time", jsKey: "ShortTime" },
  { style: "T", name: "Long time", jsKey: "LongTime" },
  { style: "d", name: "Short date", jsKey: "ShortDate" },
  { style: "D", name: "Long date", jsKey: "LongDate" },
  { style: "f", name: "Short date and time", jsKey: "ShortDateTime" },
  { style: "F", name: "Long date and time", jsKey: "LongDateTime" },
  { style: "R", name: "Relative time", jsKey: "RelativeTime" },
];

export function isStyleLetter(v: unknown): v is StyleLetter {
  return typeof v === "string" && STYLES.some((s) => s.style === v);
}

/** 2015-01-01T00:00:00Z in Unix milliseconds: the zero point of every snowflake ID. */
export const DISCORD_EPOCH_MS = BigInt("1420070400000");

/** Earliest and latest instants the tool accepts (Unix seconds): 1970-01-01 and 9999-12-31 23:59:59 UTC. */
export const MIN_UNIX = 0;
export const MAX_UNIX = 253402300799;

/** The Discord developer documentation's own snowflake example (worker 1, process 0, increment 7). */
export const EXAMPLE_SNOWFLAKE = "175928847299117063";

export interface Locale {
  value: string;
  label: string;
}

/** Viewer languages offered in the preview. Real Discord wording can differ slightly per language. */
export const LOCALES: readonly Locale[] = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "de-DE", label: "Deutsch" },
  { value: "fr-FR", label: "Français" },
  { value: "es-ES", label: "Español" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "ru-RU", label: "Русский" },
  { value: "tr-TR", label: "Türkçe" },
  { value: "ja-JP", label: "日本語" },
];

export function isLocale(v: unknown): v is string {
  return typeof v === "string" && LOCALES.some((l) => l.value === v);
}

export interface ZoneOption {
  id: string;
  label: string;
}

/** Hand-picked zones shown first in the selector. The full IANA list is added after mount. */
export const COMMON_ZONES: readonly ZoneOption[] = [
  { id: "UTC", label: "UTC (Coordinated Universal Time)" },
  { id: "America/Los_Angeles", label: "Los Angeles, US Pacific" },
  { id: "America/Denver", label: "Denver, US Mountain" },
  { id: "America/Phoenix", label: "Phoenix, Arizona (no daylight saving)" },
  { id: "America/Chicago", label: "Chicago, US Central" },
  { id: "America/New_York", label: "New York, US Eastern" },
  { id: "America/Toronto", label: "Toronto, Canada Eastern" },
  { id: "America/Anchorage", label: "Anchorage, Alaska" },
  { id: "Pacific/Honolulu", label: "Honolulu, Hawaii" },
  { id: "America/Mexico_City", label: "Mexico City" },
  { id: "America/Bogota", label: "Bogotá" },
  { id: "America/Sao_Paulo", label: "São Paulo" },
  { id: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
  { id: "Europe/London", label: "London, UK" },
  { id: "Europe/Dublin", label: "Dublin" },
  { id: "Europe/Lisbon", label: "Lisbon" },
  { id: "Europe/Paris", label: "Paris, Central European" },
  { id: "Europe/Berlin", label: "Berlin, Central European" },
  { id: "Europe/Madrid", label: "Madrid" },
  { id: "Europe/Rome", label: "Rome" },
  { id: "Europe/Amsterdam", label: "Amsterdam" },
  { id: "Europe/Warsaw", label: "Warsaw" },
  { id: "Europe/Athens", label: "Athens, Eastern European" },
  { id: "Europe/Istanbul", label: "Istanbul" },
  { id: "Europe/Moscow", label: "Moscow" },
  { id: "Africa/Cairo", label: "Cairo" },
  { id: "Africa/Lagos", label: "Lagos" },
  { id: "Africa/Nairobi", label: "Nairobi" },
  { id: "Africa/Johannesburg", label: "Johannesburg" },
  { id: "Asia/Dubai", label: "Dubai" },
  { id: "Asia/Karachi", label: "Karachi, Pakistan" },
  { id: "Asia/Kolkata", label: "Kolkata, India" },
  { id: "Asia/Dhaka", label: "Dhaka" },
  { id: "Asia/Bangkok", label: "Bangkok" },
  { id: "Asia/Jakarta", label: "Jakarta" },
  { id: "Asia/Singapore", label: "Singapore" },
  { id: "Asia/Hong_Kong", label: "Hong Kong" },
  { id: "Asia/Shanghai", label: "Shanghai, China" },
  { id: "Asia/Manila", label: "Manila" },
  { id: "Asia/Seoul", label: "Seoul" },
  { id: "Asia/Tokyo", label: "Tokyo" },
  { id: "Australia/Perth", label: "Perth" },
  { id: "Australia/Adelaide", label: "Adelaide" },
  { id: "Australia/Sydney", label: "Sydney" },
  { id: "Pacific/Auckland", label: "Auckland" },
];

/** Zones used by the "same moment elsewhere" list. */
export const WORLD_CLOCK_ZONES: readonly ZoneOption[] = [
  { id: "America/Los_Angeles", label: "Los Angeles" },
  { id: "America/New_York", label: "New York" },
  { id: "America/Sao_Paulo", label: "São Paulo" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Berlin", label: "Berlin" },
  { id: "Asia/Kolkata", label: "Kolkata" },
  { id: "Asia/Tokyo", label: "Tokyo" },
  { id: "Australia/Sydney", label: "Sydney" },
];

/* ------------------------------------------------------------------- zones */

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function cachedDtf(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = dtfCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    if (dtfCache.size > 300) dtfCache.clear();
    dtfCache.set(key, f);
  }
  return f;
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock reading (what a clock on the wall shows) without any zone attached. */
export interface Wall {
  y: number;
  m: number; // 1-12
  d: number;
  h: number;
  mi: number;
  s: number;
}

/** The wall-clock reading of an instant in a zone. */
export function wallParts(utcMs: number, tz: string): Wall {
  const parts = cachedDtf("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  let h = get("hour");
  if (h === 24) h = 0;
  return { y: get("year"), m: get("month"), d: get("day"), h, mi: get("minute"), s: get("second") };
}

function wallAsUtcMs(w: Wall): number {
  return Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s);
}

/** Offset of a zone from UTC, in milliseconds, at a given instant (east of UTC is positive). */
export function tzOffsetMs(utcMs: number, tz: string): number {
  return wallAsUtcMs(wallParts(utcMs, tz)) - Math.floor(utcMs / 1000) * 1000;
}

const DAY_MS = 86_400_000;

export type Resolution =
  | { kind: "ok"; ms: number }
  | { kind: "ambiguous"; ms: number; earlier: number; later: number }
  | { kind: "gap"; ms: number; gapMinutes: number };

/**
 * Turn a wall-clock reading in a zone into an instant.
 *
 * Offsets are sampled a day either side of the reading. A candidate instant is
 * valid only if the zone really has that offset at that instant:
 *   - one valid candidate  -> normal time
 *   - two valid candidates -> the clocks went back and the reading happens twice
 *   - none                 -> the clocks jumped forward and the reading never happens
 * For a gap the reading is pushed forward by the size of the gap.
 */
export function resolveLocal(wall: Wall, tz: string, prefer: "earlier" | "later" = "earlier"): Resolution {
  const w = wallAsUtcMs(wall);
  const before = tzOffsetMs(w - DAY_MS, tz);
  const after = tzOffsetMs(w + DAY_MS, tz);
  const valid = new Set<number>();
  for (const offset of new Set([before, after])) {
    const candidate = w - offset;
    if (tzOffsetMs(candidate, tz) === offset) valid.add(candidate);
  }
  const list = [...valid].sort((a, b) => a - b);
  if (list.length === 1) return { kind: "ok", ms: list[0] };
  if (list.length >= 2) {
    const earlier = list[0];
    const later = list[list.length - 1];
    return { kind: "ambiguous", ms: prefer === "later" ? later : earlier, earlier, later };
  }
  if (before === after) return { kind: "ok", ms: w - before };
  return { kind: "gap", ms: w - before, gapMinutes: Math.round(Math.abs(after - before) / 60000) };
}

/** "UTC-05:00" style label for an offset in milliseconds. */
export function formatOffset(offsetMs: number): string {
  const total = Math.round(offsetMs / 60000);
  const sign = total < 0 ? "-" : "+";
  const abs = Math.abs(total);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

/** Short zone name such as "EST" or "GMT+5" for an instant. */
export function zoneAbbreviation(utcMs: number, tz: string): string {
  try {
    const parts = cachedDtf("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date(utcMs));
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** "UTC-05:00 (EST)" for a zone at an instant. */
export function describeOffset(utcMs: number, tz: string): string {
  const off = formatOffset(tzOffsetMs(utcMs, tz));
  const abbr = zoneAbbreviation(utcMs, tz);
  // Zones without a familiar abbreviation come back as "GMT+5"; the UTC offset already says that.
  return abbr && !/^(GMT|UTC)/.test(abbr) ? `${off} (${abbr})` : off;
}

/* ------------------------------------------------------------ input parsing */

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDateInput(w: Wall): string {
  return `${String(w.y).padStart(4, "0")}-${pad2(w.m)}-${pad2(w.d)}`;
}

export function formatTimeInput(w: Wall): string {
  return `${pad2(w.h)}:${pad2(w.mi)}:${pad2(w.s)}`;
}

export function parseDateInput(raw: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(2000, m - 1, d));
  if (m < 1 || m > 12 || d < 1) return null;
  // Use a leap year for the month-length check, then re-check the real year for 29 Feb.
  if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  if (m === 2 && d === 29 && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) return null;
  return { y, m, d };
}

export function parseTimeInput(raw: string): { h: number; mi: number; s: number } | null {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/.exec(raw.trim());
  if (!match) return null;
  const [h, mi, s] = [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
  if (h > 23 || mi > 59 || s > 59) return null;
  return { h, mi, s };
}

export type PickerOutcome =
  | { kind: "empty" }
  | { kind: "invalid"; message: string }
  | { kind: "ok"; unix: number; ms: number; wall: Wall }
  | { kind: "ambiguous"; unix: number; ms: number; wall: Wall; earlier: number; later: number; chosen: "earlier" | "later" }
  | { kind: "gap"; unix: number; ms: number; wall: Wall; gapMinutes: number; shifted: Wall };

/** Resolve the date, time and zone fields into an instant, reporting DST gaps and overlaps. */
export function resolvePicker(dateRaw: string, timeRaw: string, tz: string, prefer: "earlier" | "later"): PickerOutcome {
  if (!dateRaw.trim() || !timeRaw.trim()) return { kind: "empty" };
  const date = parseDateInput(dateRaw);
  if (!date) return { kind: "invalid", message: "Enter a valid date, for example 2026-11-14." };
  const time = parseTimeInput(timeRaw);
  if (!time) return { kind: "invalid", message: "Enter a valid time, for example 20:00." };
  if (date.y < 1970 || date.y > 9999) return { kind: "invalid", message: "Choose a year between 1970 and 9999. Discord timestamps are Unix seconds, which start in 1970." };
  if (!isValidTimeZone(tz)) return { kind: "invalid", message: "That time zone is not recognized by this browser. Pick one from the list." };
  const wall: Wall = { y: date.y, m: date.m, d: date.d, h: time.h, mi: time.mi, s: time.s };
  const res = resolveLocal(wall, tz, prefer);
  const unix = Math.floor(res.ms / 1000);
  if (unix < MIN_UNIX) return { kind: "invalid", message: "That moment is before 1 January 1970 UTC, which Unix timestamps cannot represent here. Pick a later date." };
  if (unix > MAX_UNIX) return { kind: "invalid", message: "That moment is after the year 9999. Pick an earlier date." };
  if (res.kind === "ambiguous") {
    return { kind: "ambiguous", unix, ms: res.ms, wall, earlier: res.earlier, later: res.later, chosen: prefer };
  }
  if (res.kind === "gap") {
    return { kind: "gap", unix, ms: res.ms, wall, gapMinutes: res.gapMinutes, shifted: wallParts(res.ms, tz) };
  }
  return { kind: "ok", unix, ms: res.ms, wall };
}

export type UnixParse =
  | { kind: "empty" }
  | { kind: "invalid"; message: string }
  | { kind: "ok"; seconds: number; note?: string };

/** Read a Unix timestamp. Accepts seconds, milliseconds (13 digits) and a pasted <t:...> code. */
export function parseUnixInput(raw: string): UnixParse {
  let text = raw.trim();
  if (!text) return { kind: "empty" };
  const tag = /^<t:(-?\d+)(?::[a-zA-Z])?>$/.exec(text);
  if (tag) text = tag[1];
  if (/^-/.test(text)) return { kind: "invalid", message: "Negative timestamps (before 1970) are not supported. Enter a value of 0 or more." };
  if (!/^\d+(\.\d+)?$/.test(text)) return { kind: "invalid", message: "Enter digits only, for example 1794704400. You can also paste a code such as <t:1794704400:R>." };
  const intPart = text.split(".")[0];
  const digits = intPart.replace(/^0+(?=\d)/, "").length;
  if (digits >= 16) {
    return {
      kind: "invalid",
      message: `A ${digits}-digit number looks like microseconds or nanoseconds. Divide by 1,000,000 (microseconds) or 1,000,000,000 (nanoseconds) to get seconds.`,
    };
  }
  let value = Number(text);
  let note: string | undefined;
  if (digits >= 13) {
    value = value / 1000;
    note = "This has 13 digits, so it was read as milliseconds and divided by 1,000. Discord timestamps use seconds.";
  } else if (/\./.test(text)) {
    note = "Decimals are dropped: Discord timestamps are whole seconds.";
  }
  const seconds = Math.floor(value);
  if (!Number.isFinite(seconds) || seconds > MAX_UNIX) {
    return { kind: "invalid", message: "That value is beyond the year 9999. Check that you entered seconds, not milliseconds with a digit missing." };
  }
  return { kind: "ok", seconds, note };
}

/* ----------------------------------------------------------------- snowflake */

export type SnowflakeParse =
  | { kind: "empty" }
  | { kind: "invalid"; message: string }
  | {
      kind: "ok";
      id: string;
      ms: number;
      unix: number;
      worker: number;
      process: number;
      increment: number;
      /** 64-bit binary split into the four fields. */
      bits: { timestamp: string; worker: string; process: string; increment: string };
      /** Non-blocking hints: probably-not-an-ID, future date. */
      notes: string[];
    };

// BigInt() calls instead of literals: the project compiles for ES2017, which has no literal syntax.
const MAX_U64 = (BigInt(1) << BigInt(64)) - BigInt(1);
const SHIFT_TIMESTAMP = BigInt(22);
const SHIFT_WORKER = BigInt(17);
const SHIFT_PROCESS = BigInt(12);
const MASK_WORKER = BigInt(0x3e0000);
const MASK_PROCESS = BigInt(0x1f000);
const MASK_INCREMENT = BigInt(0xfff);
const FIRST_REAL_ID = BigInt(1) << SHIFT_TIMESTAMP;

/** Decode a Discord snowflake ID with BigInt (IDs exceed the 2^53 limit of ordinary numbers). */
export function decodeSnowflake(raw: string, nowMs: number): SnowflakeParse {
  const text = raw.trim();
  if (!text) return { kind: "empty" };
  if (!/^\d+$/.test(text)) return { kind: "invalid", message: "A snowflake ID is digits only, usually 17 to 19 of them. Turn on Developer Mode in Discord and use Copy ID." };
  if (text.length > 20) return { kind: "invalid", message: "That number is too long for a 64-bit ID (the maximum is 20 digits)." };
  const id = BigInt(text);
  if (id > MAX_U64) return { kind: "invalid", message: "That number is larger than the biggest 64-bit unsigned integer, so it cannot be a snowflake ID." };
  const tsMs = (id >> SHIFT_TIMESTAMP) + DISCORD_EPOCH_MS;
  const ms = Number(tsMs);
  const binary = id.toString(2).padStart(64, "0");
  const notes: string[] = [];
  if (id < FIRST_REAL_ID) notes.push("This number is smaller than 4,194,304, so its timestamp part is zero and it decodes to the Discord epoch itself. It is probably not a real ID.");
  if (ms > nowMs + 60_000) notes.push("The decoded date is in the future, so this is probably not a real Discord ID.");
  return {
    kind: "ok",
    id: id.toString(),
    ms,
    unix: Math.floor(ms / 1000),
    worker: Number((id & MASK_WORKER) >> SHIFT_WORKER),
    process: Number((id & MASK_PROCESS) >> SHIFT_PROCESS),
    increment: Number(id & MASK_INCREMENT),
    bits: { timestamp: binary.slice(0, 42), worker: binary.slice(42, 47), process: binary.slice(47, 52), increment: binary.slice(52) },
    notes,
  };
}

/** The Unix second that the active tab currently describes, or null when its input is empty or invalid. */
export function activeUnix(mode: "picker" | "unix" | "snowflake", picker: PickerOutcome, unix: UnixParse, snow: SnowflakeParse): number | null {
  if (mode === "picker") return picker.kind === "ok" || picker.kind === "ambiguous" || picker.kind === "gap" ? picker.unix : null;
  if (mode === "unix") return unix.kind === "ok" ? unix.seconds : null;
  return snow.kind === "ok" ? snow.unix : null;
}

/* ---------------------------------------------------------------- formatting */

export function tagFor(unix: number, style?: StyleLetter): string {
  return style ? `<t:${unix}:${style}>` : `<t:${unix}>`;
}

const SPACES = /[\u202f\u00a0]/g;

function cleanSpaces(s: string): string {
  return s.replace(SPACES, " ");
}

const DATE_LONG: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };

/** 24-hour languages show a leading zero ("01:00"); 12-hour ones do not ("1:00 AM"). */
function timeShort(locale: string): Intl.DateTimeFormatOptions {
  const cycle = cachedDtf(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
}

/**
 * Approximate on-screen text of a non-relative style for a viewer with the given
 * language and time zone. Discord draws the real text itself, so wording and
 * punctuation can differ slightly; the moment in time is always identical.
 */
export function previewAbsolute(unix: number, style: Exclude<StyleLetter, "R">, locale: string, tz: string): string {
  const date = new Date(unix * 1000);
  const fmt = (options: Intl.DateTimeFormatOptions) => cleanSpaces(cachedDtf(locale, { timeZone: tz, ...options }).format(date));
  switch (style) {
    case "t":
      return fmt(timeShort(locale));
    case "T":
      return fmt({ ...timeShort(locale), second: "2-digit" });
    case "d":
      return fmt({ year: "numeric", month: "2-digit", day: "2-digit" });
    case "D":
      return fmt(DATE_LONG);
    case "f":
      return `${fmt(DATE_LONG)} ${fmt(timeShort(locale))}`;
    case "F": {
      const time = fmt(timeShort(locale));
      // English is composed piece by piece so the comma after the weekday never depends on the browser's locale data.
      if (locale.startsWith("en")) return `${fmt({ weekday: "long" })}, ${fmt(DATE_LONG)} ${time}`;
      return `${fmt({ weekday: "long", ...DATE_LONG })} ${time}`;
    }
  }
}

const SECONDS_PER_MONTH = (365.2425 / 12) * 86400;

/** Approximate "in 3 hours" / "2 months ago" text using rounding steps similar to common humanizers. */
export function previewRelative(unix: number, nowMs: number, locale: string): string {
  const diff = Math.round(unix - nowMs / 1000);
  const abs = Math.abs(diff);
  const sign = diff < 0 ? -1 : 1;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  if (abs < 45) return rtf.format(sign * abs, "second");
  if (abs < 90) return rtf.format(sign, "minute");
  const minutes = Math.round(abs / 60);
  if (minutes < 45) return rtf.format(sign * minutes, "minute");
  if (minutes < 90) return rtf.format(sign, "hour");
  const hours = Math.round(abs / 3600);
  if (hours < 22) return rtf.format(sign * hours, "hour");
  if (hours < 36) return rtf.format(sign, "day");
  const days = Math.round(abs / 86400);
  if (days < 26) return rtf.format(sign * days, "day");
  if (days < 45) return rtf.format(sign, "month");
  const months = Math.round(abs / SECONDS_PER_MONTH);
  if (months < 11) return rtf.format(sign * months, "month");
  if (months < 18) return rtf.format(sign, "year");
  return rtf.format(sign * Math.round(months / 12), "year");
}

export function preview(unix: number, style: StyleLetter, locale: string, tz: string, nowMs: number): string {
  try {
    return style === "R" ? previewRelative(unix, nowMs, locale) : previewAbsolute(unix, style, locale, tz);
  } catch {
    return "Preview unavailable";
  }
}

/** Exact countdown, e.g. "in 1d 2h 3m 4s" or "5m 10s ago". */
export function describeDelta(unix: number, nowMs: number): string {
  const diff = Math.round(unix - nowMs / 1000);
  if (diff === 0) return "right now";
  let rest = Math.abs(diff);
  const days = Math.floor(rest / 86400);
  rest -= days * 86400;
  const hours = Math.floor(rest / 3600);
  rest -= hours * 3600;
  const minutes = Math.floor(rest / 60);
  const seconds = rest - minutes * 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (days || hours) parts.push(`${hours}h`);
  if (days || hours || minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  const text = parts.join(" ");
  return diff > 0 ? `in ${text}` : `${text} ago`;
}

/** Long wall-clock description of an instant in a zone, e.g. "Saturday, November 14, 2026, 8:00:00 PM EST". */
export function describeInstant(utcMs: number, tz: string, locale = "en-US"): string {
  try {
    return cleanSpaces(
      cachedDtf(locale, {
        timeZone: tz,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      }).format(new Date(utcMs)),
    );
  } catch {
    return "";
  }
}

export function isoUtc(ms: number): string {
  return new Date(ms).toISOString().replace(".000Z", "Z");
}

/** Short local reading used in the "same moment elsewhere" list. */
export function describeWorldClock(utcMs: number, tz: string, locale: string): string {
  try {
    return cleanSpaces(
      cachedDtf(locale, {
        timeZone: tz,
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(utcMs)),
    );
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ snippets */

export type SnippetLang = "js" | "python" | "raw";

export function isSnippetLang(v: unknown): v is SnippetLang {
  return v === "js" || v === "python" || v === "raw";
}

export function buildSnippet(lang: SnippetLang, unix: number, style: StyleLetter): string {
  const info = STYLES.find((s) => s.style === style) ?? STYLES[6];
  const tag = tagFor(unix, style);
  const what = info.name.toLowerCase();
  if (lang === "raw") return tag;
  if (lang === "js") {
    return [
      `// discord.js: format a Date with the ${what} style`,
      `import { time, TimestampStyles } from "discord.js";`,
      ``,
      `const unix = ${unix}; // Unix time in seconds`,
      `const text = time(new Date(unix * 1000), TimestampStyles.${info.jsKey});`,
      `// text is "${tag}"`,
      ``,
      `// No library needed: the code is plain text`,
      "const plain = `<t:${unix}:" + style + ">`;",
    ].join("\n");
  }
  return [
    `# discord.py: format a datetime with the ${what} style`,
    `import discord`,
    `from datetime import datetime, timezone`,
    ``,
    `unix = ${unix}  # Unix time in seconds`,
    `when = datetime.fromtimestamp(unix, tz=timezone.utc)`,
    `text = discord.utils.format_dt(when, style="${style}")`,
    `# text is "${tag}"`,
    ``,
    `# No library needed: the code is plain text`,
    `plain = f"<t:{unix}:${style}>"`,
  ].join("\n");
}
