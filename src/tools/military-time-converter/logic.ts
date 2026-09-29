/**
 * Pure logic for the military time converter. Nothing in this file touches the
 * DOM, so it can be run and tested outside the browser.
 */

export interface ClockTime {
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
}

export type SpokenStyle = "standard" | "oh" | "digits" | "radio";
export type Assume = "12h" | "24h";

export const MAX_INPUT_LENGTH = 60;
export const MAX_BULK_LINES = 2000;
export const MAX_BULK_CHARS = 200_000;

export const pad2 = (n: number): string => String(n).padStart(2, "0");

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/** "0630" */
export const toMilitary = (t: ClockTime): string => `${pad2(t.hour)}${pad2(t.minute)}`;
/** "06:30" */
export const toColon = (t: ClockTime): string => `${pad2(t.hour)}:${pad2(t.minute)}`;
/** "6:30 AM" */
export const to12h = (t: ClockTime): string => `${t.hour % 12 || 12}:${pad2(t.minute)} ${t.hour < 12 ? "AM" : "PM"}`;
/** "6 AM" (used as a row label in the minutes chart) */
export const hourLabel12 = (hour: number): string => `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen",
  "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty"];
const RADIO_DIGITS = ["zero", "one", "two", "tree", "fower", "fife", "six", "seven", "eight", "niner"];

/** 0-59 as English words: 7 -> "seven", 45 -> "forty-five". */
export function numberWord(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]}-${ONES[ones]}` : TENS[tens];
}

export const SPOKEN_STYLES: { value: SpokenStyle; label: string }[] = [
  { value: "standard", label: "Standard (zero six thirty hours)" },
  { value: "oh", label: "With “oh” (oh six thirty hours)" },
  { value: "digits", label: "Digit by digit (zero six three zero)" },
  { value: "radio", label: "Radio digits (zero six tree zero)" },
];

/**
 * How to say a time aloud. The standard style follows the common US military
 * convention: hours 00-09 start with "zero", whole hours end in "hundred",
 * and the word "hours" closes the phrase. When a zone letter is given, its
 * name replaces "hours" ("seventeen thirty Zulu").
 */
export function speak(t: ClockTime, style: SpokenStyle, zone?: Zone): string {
  const tail = zone ? zone.name : "hours";
  if (style === "digits" || style === "radio") {
    const words = style === "radio" ? RADIO_DIGITS : ONES;
    const digits = toMilitary(t)
      .split("")
      .map((d) => words[Number(d)])
      .join(" ");
    return `${digits} ${tail}`;
  }
  const zero = style === "oh" ? "oh" : "zero";
  const digitWord = (d: number) => (d === 0 ? zero : ONES[d]);
  const hourWords = t.hour < 10 ? `${zero} ${digitWord(t.hour)}` : numberWord(t.hour);
  if (t.minute === 0) {
    const base = t.hour === 0 ? `${zero} hundred` : `${hourWords} hundred`;
    return `${base} ${tail}`;
  }
  const minuteWords = t.minute < 10 ? `${zero} ${digitWord(t.minute)}` : numberWord(t.minute);
  return `${hourWords} ${minuteWords} ${tail}`;
}

/* ------------------------------------------------------------------ */
/* Military time zones                                                 */
/* ------------------------------------------------------------------ */

export interface Zone {
  letter: string;
  name: string;
  /** Whole-hour offset from UTC, or null for J (the observer's own local time). */
  offset: number | null;
  examples: string;
}

export const ZONES: readonly Zone[] = [
  { letter: "A", name: "Alpha", offset: 1, examples: "Central European Time (winter), British Summer Time, West Africa Time" },
  { letter: "B", name: "Bravo", offset: 2, examples: "Central European Summer Time, South Africa, Eastern European Time (winter)" },
  { letter: "C", name: "Charlie", offset: 3, examples: "Moscow, East Africa Time, Arabia Standard Time" },
  { letter: "D", name: "Delta", offset: 4, examples: "Gulf Standard Time (United Arab Emirates)" },
  { letter: "E", name: "Echo", offset: 5, examples: "Pakistan Standard Time" },
  { letter: "F", name: "Foxtrot", offset: 6, examples: "Bangladesh Standard Time" },
  { letter: "G", name: "Golf", offset: 7, examples: "Indochina Time (Thailand, Vietnam)" },
  { letter: "H", name: "Hotel", offset: 8, examples: "China Standard Time, Singapore, Western Australia" },
  { letter: "I", name: "India", offset: 9, examples: "Japan Standard Time, Korea Standard Time" },
  { letter: "J", name: "Juliet", offset: null, examples: "Your own local time, wherever you are (no fixed offset)" },
  { letter: "K", name: "Kilo", offset: 10, examples: "Australian Eastern Standard Time" },
  { letter: "L", name: "Lima", offset: 11, examples: "Australian Eastern Daylight Time, Solomon Islands" },
  { letter: "M", name: "Mike", offset: 12, examples: "New Zealand Standard Time, Fiji" },
  { letter: "N", name: "November", offset: -1, examples: "Azores (standard time), Cape Verde" },
  { letter: "O", name: "Oscar", offset: -2, examples: "South Georgia and the South Sandwich Islands" },
  { letter: "P", name: "Papa", offset: -3, examples: "Brazil (Brasilia), Argentina" },
  { letter: "Q", name: "Quebec", offset: -4, examples: "Atlantic Standard Time, US Eastern Daylight Time" },
  { letter: "R", name: "Romeo", offset: -5, examples: "US Eastern Standard Time, US Central Daylight Time" },
  { letter: "S", name: "Sierra", offset: -6, examples: "US Central Standard Time, US Mountain Daylight Time" },
  { letter: "T", name: "Tango", offset: -7, examples: "US Mountain Standard Time, US Pacific Daylight Time" },
  { letter: "U", name: "Uniform", offset: -8, examples: "US Pacific Standard Time, Alaska Daylight Time" },
  { letter: "V", name: "Victor", offset: -9, examples: "Alaska Standard Time, Hawaii-Aleutian Daylight Time" },
  { letter: "W", name: "Whiskey", offset: -10, examples: "Hawaii Standard Time" },
  { letter: "X", name: "X-ray", offset: -11, examples: "American Samoa" },
  { letter: "Y", name: "Yankee", offset: -12, examples: "Baker Island (uninhabited); the westernmost zone" },
  { letter: "Z", name: "Zulu", offset: 0, examples: "UTC and GMT; the UK in winter" },
];

export const ZONE_BY_LETTER: Record<string, Zone> = Object.fromEntries(ZONES.map((z) => [z.letter, z]));

/** Zones with a real offset, in the order used by menus: Zulu first, then A to Y. */
export const CONVERTIBLE_ZONES: readonly Zone[] = [
  ZONE_BY_LETTER.Z,
  ...ZONES.filter((z) => z.offset !== null && z.letter !== "Z"),
];

export function formatOffset(offset: number | null): string {
  if (offset === null) return "local";
  if (offset === 0) return "UTC";
  return `UTC${offset > 0 ? "+" : "−"}${Math.abs(offset)}`;
}

/** "UTC\u221205:00" style label for an exact offset in minutes east of UTC. */
export function formatOffsetMinutes(minutesEast: number): string {
  if (minutesEast === 0) return "UTC";
  const abs = Math.abs(minutesEast);
  return `UTC${minutesEast > 0 ? "+" : "\u2212"}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

export function isZoneLetter(v: unknown): v is string {
  return typeof v === "string" && v.length === 1 && v in ZONE_BY_LETTER;
}

/** The zone whose whole-hour offset matches `minutesEast`, or undefined for half-hour and 13+ offsets. */
export function zoneForOffsetMinutes(minutesEast: number): Zone | undefined {
  if (!Number.isFinite(minutesEast) || minutesEast % 60 !== 0) return undefined;
  const hours = minutesEast / 60;
  return ZONES.find((z) => z.offset === hours);
}

export interface ShiftResult {
  time: ClockTime;
  /** -1 = previous day, 0 = same day, 1 = next day */
  dayShift: number;
}

/** Re-express a clock time given in one whole-hour zone in another. */
export function shiftZone(t: ClockTime, fromOffset: number, toOffset: number): ShiftResult {
  const total = t.hour * 60 + t.minute + (toOffset - fromOffset) * 60;
  const dayShift = Math.floor(total / 1440);
  const within = ((total % 1440) + 1440) % 1440;
  return { time: { hour: Math.floor(within / 60), minute: within % 60 }, dayShift };
}

export function dayShiftLabel(dayShift: number): string {
  if (dayShift === 0) return "same day";
  return dayShift > 0 ? "next day" : "previous day";
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export interface NowInfo {
  local: ClockTime;
  utc: ClockTime;
  /** Date-time group in Zulu, e.g. "291935Z SEP 26". */
  dtg: string;
  /** The military zone that matches this device's current UTC offset, if there is one. */
  zone?: Zone;
  offsetMinutes: number;
}

/** Describe a moment given as whole minutes since the Unix epoch. */
export function describeNow(epochMinute: number): NowInfo {
  const d = new Date(epochMinute * 60_000);
  const offsetMinutes = -d.getTimezoneOffset();
  return {
    local: { hour: d.getHours(), minute: d.getMinutes() },
    utc: { hour: d.getUTCHours(), minute: d.getUTCMinutes() },
    dtg: `${pad2(d.getUTCDate())}${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}Z ${MONTHS[d.getUTCMonth()]} ${pad2(d.getUTCFullYear() % 100)}`,
    zone: zoneForOffsetMinutes(offsetMinutes),
    offsetMinutes: offsetMinutes === 0 ? 0 : offsetMinutes,
  };
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

export type ParseOutcome =
  | { status: "empty" }
  | { status: "invalid"; message: string }
  | {
      status: "ambiguous";
      hour12: number;
      minute: number;
      zone?: string;
      am: ClockTime;
      pm: ClockTime;
    }
  | {
      status: "ok";
      time: ClockTime;
      /** Which notation the user typed: a 12-hour clock time or a 24-hour one. */
      source: "12h" | "24h";
      zone?: string;
      notes: string[];
      explain: string;
    };

export const FORMAT_HINT = "Try 5:30 PM, 17:30, 1730, 0630 or noon.";

const invalid = (message: string): ParseOutcome => ({ status: "invalid", message });

function explainFrom12h(hour12: number, minute: number, mer: "am" | "pm"): string {
  const mm = pad2(minute);
  const label = `${hour12}:${mm} ${mer.toUpperCase()}`;
  if (mer === "am") {
    return hour12 === 12
      ? `${label}: 12 AM is the first hour of the day, so 12 becomes 00, giving 00${mm}.`
      : `${label}: AM hours stay the same, written with two digits, giving ${pad2(hour12)}${mm}.`;
  }
  return hour12 === 12
    ? `${label}: 12 PM is noon, so 12 stays 12, giving 12${mm}.`
    : `${label}: PM hours add 12 (${hour12} + 12 = ${hour12 + 12}), giving ${hour12 + 12}${mm}.`;
}

function explainFrom24h(hour: number, minute: number): string {
  const mm = pad2(minute);
  const src = `${pad2(hour)}${mm}`;
  if (hour === 0) return `${src}: hour 00 is the midnight hour, so it becomes 12 AM, giving 12:${mm} AM.`;
  if (hour < 12) return `${src}: hours 01 to 11 are AM and stay the same, giving ${hour}:${mm} AM.`;
  if (hour === 12) return `${src}: hour 12 is the noon hour and stays 12, in the PM, giving 12:${mm} PM.`;
  return `${src}: hours 13 to 23 are PM, so subtract 12 (${hour} − 12 = ${hour - 12}), giving ${hour - 12}:${mm} PM.`;
}

/**
 * Read a time typed in almost any common notation: 5:30 PM, 5.30pm, 530 pm,
 * 17:30, 1730, 0630, 1730h, 17h30, 1730Z, noon, midnight.
 *
 * A time with no AM/PM whose hour is 1-12 and has no leading zero (5:30, 12:15,
 * 930) could be either clock, so it is reported as "ambiguous" unless the
 * caller says which clock to assume.
 */
export function parseTime(raw: string, opts: { assume?: Assume } = {}): ParseOutcome {
  if (raw.length > MAX_INPUT_LENGTH) {
    return invalid(`That is too long to be a single time (limit ${MAX_INPUT_LENGTH} characters). ${FORMAT_HINT}`);
  }
  let s = raw.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return { status: "empty" };
  s = s.replace(/\b([ap])\s?\.\s?m\.?/g, "$1m");

  const keyword = /^(?:12 ?)?(midnight|noon|midday)$/.exec(s);
  if (keyword) {
    if (keyword[1] === "midnight") {
      return {
        status: "ok",
        time: { hour: 0, minute: 0 },
        source: "12h",
        notes: ["Midnight is 0000, the first minute of a new day. 2400 names the same instant at the end of the day that is finishing."],
        explain: "Midnight is 12:00 AM, the first hour of the day, so 12 becomes 00, giving 0000.",
      };
    }
    return {
      status: "ok",
      time: { hour: 12, minute: 0 },
      source: "12h",
      notes: ["Noon is 1200. There is no 12 AM or 12 PM ambiguity in 24-hour time."],
      explain: "Noon is 12:00 PM, so 12 stays 12, giving 1200.",
    };
  }

  let zone: string | undefined;
  const zoneMatch = /^(.*\d)\s*(zulu|utc|gmt|[b-gi-oq-z])$/.exec(s);
  if (zoneMatch) {
    zone = ["zulu", "utc", "gmt"].includes(zoneMatch[2]) ? "Z" : zoneMatch[2].toUpperCase();
    s = zoneMatch[1].trim();
  }

  let mer: "am" | "pm" | undefined;
  let hoursMark = false;
  const merMatch = /^(.*\d)\s*(am|pm|a|p)$/.exec(s);
  if (merMatch) {
    mer = merMatch[2].startsWith("a") ? "am" : "pm";
    s = merMatch[1].trim();
  } else {
    const hoursMatch = /^(.*\d)\s*(hours?|hrs?|h)$/.exec(s);
    if (hoursMatch) {
      hoursMark = true;
      s = hoursMatch[1].trim();
    }
  }

  let hourStr: string;
  let minuteStr: string | undefined;
  let secondStr: string | undefined;
  let compact = false;
  let m: RegExpExecArray | null;
  if ((m = /^(\d{1,2})\s*[:.h]\s*(\d{2})(?:\s*[:.]\s*(\d{2}))?$/.exec(s))) {
    [, hourStr, minuteStr, secondStr] = m;
  } else if ((m = /^(\d{3,4})$/.exec(s))) {
    hourStr = m[1].slice(0, m[1].length - 2);
    minuteStr = m[1].slice(-2);
    compact = m[1].length === 4;
  } else if ((m = /^(\d{1,2})$/.exec(s))) {
    hourStr = m[1];
  } else if (/^\d{5,}$/.test(s)) {
    return invalid("Enter the time as four digits (HHMM), such as 1730, or with a colon, such as 17:30. Seconds are not supported.");
  } else {
    return invalid(`Could not read that as a time. ${FORMAT_HINT}`);
  }

  const hour = Number(hourStr);
  const minute = minuteStr === undefined ? 0 : Number(minuteStr);
  const mm = pad2(minute);
  const notes: string[] = [];

  if (minute > 59) return invalid(`Minutes must be between 00 and 59, but this has ${minuteStr}.`);
  if (secondStr !== undefined) {
    if (Number(secondStr) > 59) return invalid(`Seconds must be between 00 and 59, but this has ${secondStr}.`);
    notes.push("Seconds were ignored: this converter works to the minute.");
  }

  const done = (h24: number, source: "12h" | "24h", explain: string): ParseOutcome => ({
    status: "ok",
    time: { hour: h24, minute },
    source,
    zone,
    notes,
    explain,
  });

  // An explicit AM or PM.
  if (mer) {
    if (hour >= 1 && hour <= 12) {
      return done((hour % 12) + (mer === "pm" ? 12 : 0), "12h", explainFrom12h(hour, minute, mer));
    }
    if (hour === 0) {
      if (mer === "pm") return invalid(`0:${mm} PM is not a valid time. 12-hour times run from 12:00 AM to 11:59 PM.`);
      notes.push("AM is not needed with hour 0: it was read as 00, the midnight hour.");
      return done(0, "24h", explainFrom24h(0, minute));
    }
    if (hour <= 23) {
      if (mer === "am") {
        return invalid(`${hour}:${mm} AM is not valid, because hours above 12 already belong to the 24-hour clock. Use PM, or drop the AM.`);
      }
      notes.push(`PM is redundant here: ${hour}:${mm} is already a 24-hour time.`);
      return done(hour, "24h", explainFrom24h(hour, minute));
    }
    return invalid(`${hour} is not a valid hour. With AM or PM, hours run from 1 to 12.`);
  }

  // No AM/PM.
  if (hour > 24 || (hour === 24 && minute > 0)) {
    return invalid(`${hourStr}${minuteStr !== undefined ? `:${mm}` : ""} is not a valid time. Military time runs from 0000 to 2359 (2400 means the end of the day).`);
  }
  if (hour === 24) {
    notes.push("2400 means the end of the day: the same instant as 0000 at the start of the next day. It is shown here as 0000.");
    return done(0, "24h", "2400 is the end of the day, and 24 becomes 00 on the next date, giving 0000.");
  }

  const leadingZero = hourStr.length === 2 && hourStr.startsWith("0");
  const clearlyMilitary = hoursMark || zone !== undefined || compact || leadingZero || hour === 0 || hour >= 13;
  if (clearlyMilitary) return done(hour, "24h", explainFrom24h(hour, minute));

  // Hour 1-12, no AM/PM, no other clue.
  if (opts.assume === "24h") {
    notes.push("There was no AM or PM, so this was read as a 24-hour time.");
    return done(hour, "24h", explainFrom24h(hour, minute));
  }
  return {
    status: "ambiguous",
    hour12: hour,
    minute,
    zone,
    am: { hour: hour % 12, minute },
    pm: { hour: (hour % 12) + 12, minute },
  };
}

/* ------------------------------------------------------------------ */
/* Chart data                                                          */
/* ------------------------------------------------------------------ */

export interface HourRow {
  hour: number;
  military: string;
  twelve: string;
  spoken: string;
  note: string;
}

export function hourRows(style: SpokenStyle = "standard"): HourRow[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const t = { hour, minute: 0 };
    return {
      hour,
      military: toMilitary(t),
      twelve: to12h(t),
      spoken: speak(t, style),
      note: hour === 0 ? "Midnight" : hour === 12 ? "Noon" : "",
    };
  });
}

export const STEPS = [5, 10, 15, 30] as const;
export type Step = (typeof STEPS)[number];

export function isStep(n: number): n is Step {
  return (STEPS as readonly number[]).includes(n);
}

export interface MinuteGrid {
  columns: number[];
  rows: { hour: number; label: string; cells: string[] }[];
}

export function minuteGrid(step: Step): MinuteGrid {
  const columns: number[] = [];
  for (let m = 0; m < 60; m += step) columns.push(m);
  return {
    columns,
    rows: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: hourLabel12(hour),
      cells: columns.map((minute) => toMilitary({ hour, minute })),
    })),
  };
}

function csvCell(v: string): string {
  // Guard against spreadsheet formula injection as well as quoting.
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export type ChartView = "hours" | "minutes";

function chartMatrix(view: ChartView, step: Step): string[][] {
  if (view === "hours") {
    return [["Military", "12-hour", "How to say it"], ...hourRows().map((r) => [r.military, r.twelve, r.spoken])];
  }
  const g = minuteGrid(step);
  return [["12-hour", ...g.columns.map((c) => `:${pad2(c)}`)], ...g.rows.map((r) => [r.label, ...r.cells])];
}

export function chartCsv(view: ChartView, step: Step): string {
  return chartMatrix(view, step)
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
}

export function chartText(view: ChartView, step: Step): string {
  return chartMatrix(view, step)
    .map((row) => row.join("\t"))
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* Bulk conversion                                                     */
/* ------------------------------------------------------------------ */

export interface BulkRow {
  /** 1-based line number in the pasted text. */
  line: number;
  input: string;
  kind: "ok" | "ambiguous" | "error";
  military: string;
  twelve: string;
  note: string;
}

export interface BulkResult {
  rows: BulkRow[];
  truncated: boolean;
  textTruncated: boolean;
}

function durationLabel(start: ClockTime, end: ClockTime): { label: string; crossesMidnight: boolean } {
  const s = start.hour * 60 + start.minute;
  const e = end.hour * 60 + end.minute;
  const diff = (e - s + 1440) % 1440;
  return { label: `${Math.floor(diff / 60)}h ${pad2(diff % 60)}m`, crossesMidnight: e < s };
}

export function convertLine(line: string, assume: Assume): Omit<BulkRow, "line"> {
  const input = line.trim();
  const parts = input.split(/\s*(?:[-–—]|\bto\b)\s*/i);
  if (parts.length > 2 || parts.some((p) => p === "")) {
    return {
      input,
      kind: "error",
      military: "",
      twelve: "",
      note: parts.length > 2 ? "Use one time, or one start – end range, per line." : "A range needs a time on both sides.",
    };
  }
  const outcomes = parts.map((p) => parseTime(p, { assume }));
  const bad = outcomes.find((o) => o.status === "invalid");
  if (bad && bad.status === "invalid") return { input, kind: "error", military: "", twelve: "", note: bad.message };
  const amb = outcomes.find((o) => o.status === "ambiguous");
  if (amb && amb.status === "ambiguous") {
    return {
      input,
      kind: "ambiguous",
      military: "",
      twelve: "",
      note: `Add AM or PM: ${amb.hour12}:${pad2(amb.minute)} could be ${toMilitary(amb.am)} or ${toMilitary(amb.pm)}.`,
    };
  }
  const oks = outcomes.filter((o): o is Extract<ParseOutcome, { status: "ok" }> => o.status === "ok");
  if (oks.length === 0) return { input, kind: "error", military: "", twelve: "", note: "Nothing to convert." };
  const military = oks.map((o) => `${toMilitary(o.time)}${o.zone ?? ""}`).join(" - ");
  const twelve = oks.map((o) => `${to12h(o.time)}${o.zone ? ` ${o.zone}` : ""}`).join(" - ");
  const notes = oks.flatMap((o) => o.notes.filter((n) => !n.startsWith("Midnight") && !n.startsWith("Noon")));
  if (oks.length === 2) {
    const d = durationLabel(oks[0].time, oks[1].time);
    notes.unshift(`Duration ${d.label}${d.crossesMidnight ? " (crosses midnight)" : ""}`);
  }
  return { input, kind: "ok", military, twelve, note: notes.join(" ") };
}

export function convertBulk(text: string, assume: Assume): BulkResult {
  const textTruncated = text.length > MAX_BULK_CHARS;
  const lines = (textTruncated ? text.slice(0, MAX_BULK_CHARS) : text).split(/\r?\n/);
  const rows: BulkRow[] = [];
  let truncated = false;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    if (rows.length >= MAX_BULK_LINES) {
      truncated = true;
      break;
    }
    rows.push({ line: i + 1, ...convertLine(lines[i], assume) });
  }
  return { rows, truncated, textTruncated };
}

export function bulkCsv(rows: BulkRow[]): string {
  const header = ["Input", "Military", "12-hour", "Note"];
  return [header, ...rows.map((r) => [r.input, r.military, r.twelve, r.note])]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
}

export function bulkText(rows: BulkRow[]): string {
  return [["Input", "Military", "12-hour"], ...rows.map((r) => [r.input, r.military || "?", r.twelve || "?"])].map((row) => row.join("\t")).join("\n");
}
