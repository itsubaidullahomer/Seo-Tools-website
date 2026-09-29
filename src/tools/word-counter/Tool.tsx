"use client";

import { useMemo, useRef, useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Toggle } from "@/components/ui/Toggle";
import { Stat, StatGrid } from "@/components/ui/Stat";
import { ToolPanel, ToolActions, ToolSection } from "@/components/ui/ToolPanel";
import { Input } from "@/components/ui/Input";
import { formatNumber } from "@/lib/utils";

const READING_WPM = 238;
const SPEAKING_WPM = 150;

const STOP_WORDS = new Set(
  "a an and are as at be but by for from has have he her his i if in is it its me my not of on or our she so that the their them they this to was we were what when which who will with you your".split(
    " ",
  ),
);

interface Stats {
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

function analyse(text: string, ignoreStopWords: boolean): Stats {
  const trimmed = text.trim();
  const wordList = trimmed ? trimmed.split(/\s+/) : [];
  const words = wordList.length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = trimmed ? (trimmed.match(/[^.!?…]+[.!?…]+(\s|$)|[^.!?…]+$/g) ?? []).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const lines = text ? text.split(/\n/).length : 0;

  const freq = new Map<string, number>();
  let longestWord = "";
  let letters = 0;
  for (const raw of wordList) {
    const w = raw.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (!w) continue;
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
    uniqueWords: freq.size,
    avgWordLength: words ? letters / words : 0,
    avgSentenceLength: sentences ? words / sentences : 0,
    longestWord,
    readingSeconds: Math.round((words / READING_WPM) * 60),
    speakingSeconds: Math.round((words / SPEAKING_WPM) * 60),
    keywords,
  };
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m < 60) return s ? `${m} min ${s} sec` : `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} hr ${m % 60} min`;
}

export default function WordCounter() {
  // Draft survives an accidental refresh; it lives in this tab's session storage only.
  const [text, setText] = usePersistentState("word-counter:draft", "");
  const [ignoreStopWords, setIgnoreStopWords] = useState(true);
  const [limit, setLimit] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => analyse(text, ignoreStopWords), [text, ignoreStopWords]);

  const limitNumber = Number(limit);
  const hasLimit = limit !== "" && Number.isFinite(limitNumber) && limitNumber > 0;
  const overLimit = hasLimit && stats.words > limitNumber;

  const summary = [
    `Words: ${stats.words}`,
    `Characters: ${stats.characters}`,
    `Characters (no spaces): ${stats.charactersNoSpaces}`,
    `Sentences: ${stats.sentences}`,
    `Paragraphs: ${stats.paragraphs}`,
    `Reading time: ${formatDuration(stats.readingSeconds)}`,
  ].join("\n");

  return (
    <ToolPanel>
      <Textarea
        ref={textareaRef}
        label="Your text"
        labelAddon={hasLimit ? `${formatNumber(stats.words)} / ${formatNumber(limitNumber)} words` : `${formatNumber(stats.characters)} characters`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start typing or paste your text here. Counts update instantly as you write…"
        rows={10}
        autoFocus={false}
        error={overLimit ? `You are ${formatNumber(stats.words - limitNumber)} words over your limit.` : undefined}
      />

      <ToolActions>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              const clip = await navigator.clipboard.readText();
              setText(clip);
              textareaRef.current?.focus();
            } catch {
              textareaRef.current?.focus();
            }
          }}
        >
          Paste
        </Button>
        <Button variant="secondary" onClick={() => setText("")} disabled={!text}>
          Clear
        </Button>
        <CopyButton text={summary} label="Copy stats" variant="outline" disabled={!text} />
        <div className="ml-auto w-40">
          <Input
            aria-label="Word limit"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="Word limit"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            inputSize="sm"
            className="no-spinner"
          />
        </div>
      </ToolActions>

      <StatGrid>
        <Stat label="Words" value={formatNumber(stats.words)} emphasis />
        <Stat label="Characters" value={formatNumber(stats.characters)} hint={`${formatNumber(stats.charactersNoSpaces)} without spaces`} />
        <Stat label="Sentences" value={formatNumber(stats.sentences)} hint={stats.sentences ? `${stats.avgSentenceLength.toFixed(1)} words avg` : undefined} />
        <Stat label="Paragraphs" value={formatNumber(stats.paragraphs)} hint={`${formatNumber(stats.lines)} lines`} />
        <Stat label="Reading time" value={formatDuration(stats.readingSeconds)} hint={`${READING_WPM} words/min`} />
        <Stat label="Speaking time" value={formatDuration(stats.speakingSeconds)} hint={`${SPEAKING_WPM} words/min`} />
        <Stat label="Unique words" value={formatNumber(stats.uniqueWords)} />
        <Stat label="Avg word length" value={stats.words ? stats.avgWordLength.toFixed(1) : "0"} hint={stats.longestWord ? `longest: ${stats.longestWord}` : undefined} />
      </StatGrid>

      <ToolSection title="Keyword density" description="Your most frequent words and how much of the text they make up.">
        <Toggle checked={ignoreStopWords} onChange={setIgnoreStopWords} label="Ignore common words" description="Skip words like “the”, “and”, “to” so real keywords stand out." />
        {stats.keywords.length ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Word
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Count
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    Density
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.keywords.map((k) => (
                  <tr key={k.word}>
                    <td className="px-4 py-2 font-medium text-fg">{k.word}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-fg-secondary">{k.count}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-fg-secondary">{k.density.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">Type at least a few words to see keyword density.</p>
        )}
      </ToolSection>
    </ToolPanel>
  );
}
