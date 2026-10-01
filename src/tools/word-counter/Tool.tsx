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
import { analyse, formatDuration, READING_WPM, SPEAKING_WPM } from "./logic";

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
