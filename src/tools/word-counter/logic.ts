/** Pure counting logic for the Word Counter – no React, no DOM, so it can be unit-tested. */

export const READING_WPM = 238;
export const SPEAKING_WPM = 150;

export const STOP_WORDS = new Set(
  "a an and are as at be but by for from has have he her his i if in is it its me my not of on or our she so that the their them they this to was we were what when which who will with you your".split(
    " ",
  ),
);

/** A whitespace-separated chunk counts as a word only if it contains a letter or a digit. */
const HAS_WORD_CHAR = /[\p{L}\p{N}]/u;
const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

export interface Stats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  uniqueWords: number;
  avgWordLength: number;
  avgSentenceLength: number;
  longestWord: string;
  readingSeconds: number;
  speakingSeconds: number;
  keywords: { word: string; count: number; density: number }[];
}

/** Lower-cases a word and strips punctuation from both ends ("Dog." → "dog", "“Hi,”" → "hi"). */
export function normaliseWord(raw: string): string {
  return raw.toLowerCase().replace(EDGE_PUNCTUATION, "");
}

/**
 * Splits text into words: runs of non-whitespace that contain at least one letter or number.
 * Hyphenated terms ("well-known") and numbers ("3.5") are one word; a stand-alone symbol such
 * as "—" or "&" is not a word.
 */
export function splitWords(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).filter((chunk) => HAS_WORD_CHAR.test(chunk));
}

export function analyse(text: string, ignoreStopWords: boolean): Stats {
  const trimmed = text.trim();
  const wordList = splitWords(text);
  const words = wordList.length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = words
    ? (trimmed.match(/[^.!?…]+[.!?…]+(\s|$)|[^.!?…]+$/g) ?? []).filter((s) => HAS_WORD_CHAR.test(s)).length
    : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => HAS_WORD_CHAR.test(p)).length : 0;
  const lines = text ? text.split(/\n/).length : 0;

  // Unique words are counted across every word; the stop-word switch only affects the keyword table.
  const distinct = new Set<string>();
  const freq = new Map<string, number>();
  let longestWord = "";
  let letters = 0;
  for (const raw of wordList) {
    const w = normaliseWord(raw);
    if (!w) continue;
    distinct.add(w);
    letters += w.length;
    if (w.length > longestWord.length) longestWord = w;
    if (ignoreStopWords && STOP_WORDS.has(w)) continue;
    if (w.length < 2 && !/\p{N}/u.test(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([word, count]) => ({ word, count, density: words ? (count / words) * 100 : 0 }));

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    uniqueWords: distinct.size,
    avgWordLength: words ? letters / words : 0,
    avgSentenceLength: sentences ? words / sentences : 0,
    longestWord,
    readingSeconds: Math.round((words / READING_WPM) * 60),
    speakingSeconds: Math.round((words / SPEAKING_WPM) * 60),
    keywords,
  };
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m < 60) return s ? `${m} min ${s} sec` : `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} hr ${m % 60} min`;
}
