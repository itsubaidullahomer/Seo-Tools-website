/**
 * Pure helpers for the Words to Time calculator. No DOM access, so every
 * function here can be tested in Node.
 */
import { countWords } from "@/lib/utils";

export type Mode = "forward" | "reverse";
export type Source = "text" | "count";
export type BreakMode = "paragraph" | "line";

export interface Pace {
  wpm: number;
  label: string;
  /** Where the number comes from, shown under the selector. */
  note: string;
}

/** Speaking paces. Each note says whether the figure is from a study, a standard or a rule of thumb. */
export const SPEAKING_PACES: readonly Pace[] = [
  {
    wpm: 130,
    label: "Slow",
    note: "Deliberate delivery for formal or technical talks, or for listeners who are not native speakers. A rule of thumb, not a study figure.",
  },
  {
    wpm: 150,
    label: "Average",
    note: "The commonly cited average for conversational English and a comfortable pace for presentations and voice-overs.",
  },
  {
    wpm: 155,
    label: "Audiobook narration",
    note: "ACX, the audiobook marketplace, plans finished audiobooks at 9,300 words per hour, which is 155 words per minute.",
  },
  {
    wpm: 160,
    label: "Brisk",
    note: "The top of the usual 150 to 160 range. Energetic but still clear. A rule of thumb, not a study figure.",
  },
  {
    wpm: 180,
    label: "Fast",
    note: "Lively delivery for short ad reads. Hard to keep up over a long talk. A rule of thumb, not a study figure.",
  },
  {
    wpm: 183,
    label: "Reading a text aloud",
    note: "Average oral reading rate of adults in English in Brysbaert's 2019 meta-analysis. It measures reading a page aloud, not speaking freely.",
  },
  {
    wpm: 200,
    label: "Very fast",
    note: "Listeners struggle to follow this for long. Realistic only for short passages. A rule of thumb, not a study figure.",
  },
];

/** Silent reading paces. */
export const READING_PACES: readonly Pace[] = [
  {
    wpm: 200,
    label: "Slow or technical",
    note: "An allowance for dense, technical or second-language text. A rule of thumb, not a study figure.",
  },
  {
    wpm: 238,
    label: "Average, non-fiction",
    note: "Average silent reading rate of adults reading English non-fiction in Brysbaert's 2019 meta-analysis of 190 studies.",
  },
  {
    wpm: 260,
    label: "Average, fiction",
    note: "Average silent reading rate for fiction in the same 2019 meta-analysis.",
  },
  {
    wpm: 300,
    label: "Fast reader",
    note: "A strong, practiced reader, or text you are skimming. A rule of thumb, not a study figure.",
  },
];

export const DEFAULT_SPEAK_WPM = 150;
export const DEFAULT_READ_WPM = 238;
export const SPEAK_MIN = 60;
export const SPEAK_MAX = 300;
export const READ_MIN = 100;
export const READ_MAX = 600;
export const MAX_WORDS = 1_000_000_000;
export const MAX_PAUSE_SECONDS = 600;
export const MAX_PAUSES = 100_000;
export const MAX_MINUTES = 100_000;
export const MAX_SECONDS_FIELD = 1_000_000;

/** Targets for the "Time to words" presets. */
export interface Preset {
  id: string;
  label: string;
  seconds: number;
}

export const PRESETS: readonly Preset[] = [
  { id: "vo15", label: "15-sec voice-over", seconds: 15 },
  { id: "vo30", label: "30-sec voice-over", seconds: 30 },
  { id: "vo60", label: "60-sec voice-over", seconds: 60 },
  { id: "podcast", label: "Podcast intro (45 sec)", seconds: 45 },
  { id: "toast", label: "Wedding toast (3 min)", seconds: 180 },
  { id: "speech5", label: "5-minute speech", seconds: 300 },
  { id: "talk", label: "TED-style talk (18 min)", seconds: 1080 },
];

/* ------------------------------------------------------------------ */
/* Number parsing                                                      */
/* ------------------------------------------------------------------ */

export type Parsed = { kind: "empty" } | { kind: "invalid"; message: string } | { kind: "ok"; value: number };

/** Format an integer or decimal for display, e.g. 12500 -> "12,500". */
export function fmt(n: number, maxFractionDigits = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: maxFractionDigits });
}

/**
 * Parse a user-typed non-negative number. Accepts plain digits, proper thousands
 * separators ("12,500") and decimals with a dot. Anything else is flagged
 * rather than guessed, so "12,5" is never silently read as 125.
 */
export function parseAmount(raw: string, opts: { integer?: boolean; max: number }): Parsed {
  const s0 = raw.trim();
  if (!s0) return { kind: "empty" };
  let s = s0;
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(s)) {
    if (s0.startsWith("-")) return { kind: "invalid", message: "Use a positive number." };
    if (/^\d+,\d{1,2}$/.test(s0)) return { kind: "invalid", message: "Use a dot for decimals, for example 2.5." };
    return { kind: "invalid", message: "Enter a number such as 1500 or 1,500." };
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return { kind: "invalid", message: "That number is too large." };
  if (opts.integer && !Number.isInteger(n)) return { kind: "invalid", message: "Use a whole number." };
  if (n > opts.max) return { kind: "invalid", message: `That is above the supported maximum of ${fmt(opts.max)}.` };
  return { kind: "ok", value: n };
}

/* ------------------------------------------------------------------ */
/* Core maths                                                          */
/* ------------------------------------------------------------------ */

/** Seconds needed to get through `words` at `wpm` words per minute. */
export function secondsForWords(words: number, wpm: number): number {
  if (!(wpm > 0) || !(words > 0)) return 0;
  return (words / wpm) * 60;
}

/** Words that fit into `seconds` at `wpm` words per minute (not rounded). */
export function wordsForSeconds(seconds: number, wpm: number): number {
  if (!(wpm > 0) || !(seconds > 0)) return 0;
  return (seconds / 60) * wpm;
}

export interface ForwardTimes {
  talkSeconds: number;
  pauseSeconds: number;
  /** Talking time plus pauses. */
  speakSeconds: number;
  readSeconds: number;
}

export function forwardTimes(words: number, speakWpm: number, readWpm: number, pauseCount: number, pauseSec: number): ForwardTimes {
  const talkSeconds = secondsForWords(words, speakWpm);
  const pauseSeconds = Math.max(0, pauseCount) * Math.max(0, pauseSec);
  return {
    talkSeconds,
    pauseSeconds,
    speakSeconds: talkSeconds + pauseSeconds,
    readSeconds: secondsForWords(words, readWpm),
  };
}

export interface ReverseWords {
  pauseSeconds: number;
  /** Seconds left for actual talking once pauses are taken out. */
  availableSeconds: number;
  speakWords: number;
  readWords: number;
  slowWords: number;
  fastWords: number;
  /** True when the pauses use up the whole target. */
  pausesTooLong: boolean;
}

export function reverseWords(totalSeconds: number, speakWpm: number, readWpm: number, pauseCount: number, pauseSec: number): ReverseWords {
  const pauseSeconds = Math.max(0, pauseCount) * Math.max(0, pauseSec);
  const availableSeconds = Math.max(0, totalSeconds - pauseSeconds);
  return {
    pauseSeconds,
    availableSeconds,
    speakWords: Math.round(wordsForSeconds(availableSeconds, speakWpm)),
    readWords: Math.round(wordsForSeconds(totalSeconds, readWpm)),
    slowWords: Math.round(wordsForSeconds(availableSeconds, 130)),
    fastWords: Math.round(wordsForSeconds(availableSeconds, 180)),
    pausesTooLong: totalSeconds > 0 && pauseSeconds >= totalSeconds,
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/** "4 min 12 sec", "1 hr 5 min", "2 d 3 hr". Seconds are rounded to the nearest whole second. */
export function formatDuration(totalSeconds: number): string {
  const total = Math.max(0, Math.round(totalSeconds));
  if (total < 60) return `${total} sec`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes < 60) return seconds ? `${minutes} min ${seconds} sec` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours < 24) return restMinutes ? `${hours} hr ${restMinutes} min` : `${hours} hr`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${fmt(days)} d ${restHours} hr` : `${fmt(days)} d`;
}

/** Clock style: "4:12" or "1:05:00". */
export function formatClock(totalSeconds: number): string {
  const total = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${fmt(h)}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/* ------------------------------------------------------------------ */
/* Paragraphs and timing                                               */
/* ------------------------------------------------------------------ */

/** Split a script into the blocks a speaker would pause between. */
export function splitBlocks(text: string, mode: BreakMode): string[] {
  const parts = mode === "line" ? text.split(/\r?\n/) : text.split(/\r?\n[ \t]*\r?\n/);
  return parts.map((p) => p.trim()).filter(Boolean);
}

export interface TimelineRow {
  index: number;
  words: number;
  /** When this block starts, in seconds from the beginning. */
  startSeconds: number;
  durationSeconds: number;
  preview: string;
}

/** Start time and length of every block, with `pauseSec` between blocks. */
export function timeline(blocks: string[], wpm: number, pauseSec: number): TimelineRow[] {
  const rows: TimelineRow[] = [];
  let cumulativeWords = 0;
  blocks.forEach((block, i) => {
    const words = countWords(block);
    const tokens = block.split(/\s+/);
    const preview = tokens.slice(0, 8).join(" ") + (tokens.length > 8 ? "…" : "");
    rows.push({
      index: i + 1,
      words,
      startSeconds: secondsForWords(cumulativeWords, wpm) + i * pauseSec,
      durationSeconds: secondsForWords(words, wpm),
      preview,
    });
    cumulativeWords += words;
  });
  return rows;
}

/** True when most letters belong to scripts that do not put spaces between words. */
export function looksUnspaced(text: string): boolean {
  const sample = text.length > 20000 ? text.slice(0, 20000) : text;
  const letters = sample.match(/\p{L}/gu)?.length ?? 0;
  if (letters < 20) return false;
  const unspaced = sample.match(/[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯฀-๿຀-໿က-႟ក-៿]/g)?.length ?? 0;
  return unspaced / letters >= 0.3;
}

/* ------------------------------------------------------------------ */
/* Persisted settings                                                  */
/* ------------------------------------------------------------------ */

export interface Settings {
  mode: Mode;
  source: Source;
  speakWpm: number;
  readWpm: number;
  pausesOn: boolean;
  pauseSec: string;
  pauseCount: string;
  breakMode: BreakMode;
  wordCount: string;
  minutes: string;
  seconds: string;
}

export const DEFAULT_SETTINGS: Settings = {
  mode: "forward",
  source: "text",
  speakWpm: DEFAULT_SPEAK_WPM,
  readWpm: DEFAULT_READ_WPM,
  pausesOn: false,
  pauseSec: "3",
  pauseCount: "",
  breakMode: "paragraph",
  wordCount: "",
  minutes: "5",
  seconds: "",
};

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Stored settings may be missing, old or hand-edited. Rebuild them field by
 * field so a bad value can never break the calculator.
 */
export function normalizeSettings(stored: unknown): Settings {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (src.mode === "forward" || src.mode === "reverse") out.mode = src.mode;
  if (src.source === "text" || src.source === "count") out.source = src.source;
  if (src.breakMode === "paragraph" || src.breakMode === "line") out.breakMode = src.breakMode;
  if (typeof src.pausesOn === "boolean") out.pausesOn = src.pausesOn;
  out.speakWpm = clampInt(src.speakWpm, SPEAK_MIN, SPEAK_MAX, DEFAULT_SPEAK_WPM);
  out.readWpm = clampInt(src.readWpm, READ_MIN, READ_MAX, DEFAULT_READ_WPM);
  for (const key of ["pauseSec", "pauseCount", "wordCount", "minutes", "seconds"] as const) {
    const v = src[key];
    if (typeof v === "string") out[key] = v.slice(0, 20);
    else if (typeof v === "number" && Number.isFinite(v)) out[key] = String(v);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Summaries for the copy button                                       */
/* ------------------------------------------------------------------ */

export function forwardSummary(args: { words: number; speakWpm: number; readWpm: number; times: ForwardTimes; pauseCount: number; pauseSec: number }): string {
  const { words, speakWpm, readWpm, times, pauseCount, pauseSec } = args;
  const lines = [
    `Words: ${fmt(words)}`,
    `Speaking time: ${formatDuration(times.speakSeconds)} (${speakWpm} words per minute${
      times.pauseSeconds > 0 ? `, including ${fmt(pauseCount)} pause${pauseCount === 1 ? "" : "s"} of ${fmt(pauseSec, 2)} sec` : ""
    })`,
    `Silent reading time: ${formatDuration(times.readSeconds)} (${readWpm} words per minute)`,
  ];
  return lines.join("\n");
}

export function reverseSummary(args: { totalSeconds: number; speakWpm: number; readWpm: number; result: ReverseWords }): string {
  const { totalSeconds, speakWpm, readWpm, result } = args;
  return [
    `Target time: ${formatDuration(totalSeconds)}`,
    `Words to speak: ${fmt(result.speakWords)} (${speakWpm} words per minute${result.pauseSeconds > 0 ? `, after ${formatDuration(result.pauseSeconds)} of pauses` : ""})`,
    `Words to read silently: ${fmt(result.readWords)} (${readWpm} words per minute)`,
  ].join("\n");
}
