"use client";

import { useMemo, useRef } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  Alert,
  Button,
  CopyButton,
  Input,
  Select,
  Slider,
  Stat,
  StatGrid,
  Tabs,
  Textarea,
  Toggle,
  ToolActions,
  ToolGrid,
  ToolPanel,
  ToolSection,
} from "@/components/ui";
import { cn, countWords } from "@/lib/utils";
import {
  DEFAULT_SETTINGS,
  MAX_MINUTES,
  MAX_PAUSES,
  MAX_PAUSE_SECONDS,
  MAX_SECONDS_FIELD,
  MAX_WORDS,
  PRESETS,
  READING_PACES,
  READ_MAX,
  READ_MIN,
  SPEAKING_PACES,
  SPEAK_MAX,
  SPEAK_MIN,
  fmt,
  forwardSummary,
  forwardTimes,
  formatClock,
  formatDuration,
  looksUnspaced,
  normalizeSettings,
  parseAmount,
  reverseSummary,
  reverseWords,
  secondsForWords,
  splitBlocks,
  timeline,
  wordsForSeconds,
  type Mode,
  type Pace,
  type Settings,
  type Source,
} from "./logic";

const SAMPLE_TEXT = `Good evening, everyone, and thank you for coming. When we first talked about turning the empty lot behind the library into a garden, most of us thought it would take years. It took eleven months.

Along the way, forty-two volunteers hauled soil, painted fences and argued cheerfully about where the tomatoes should go. A local hardware store donated the lumber, and the school across the street built every one of the raised beds.

Tonight the garden is open to anyone who wants a quiet place to sit, and to every family that wants to grow something. Please take a walk around, try the first strawberries of the season, and add your name to the watering schedule on the way out.

Thank you for making this possible.`;

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "forward", label: "Words to time" },
  { value: "reverse", label: "Time to words" },
];

const SOURCE_OPTIONS: { value: Source; label: string }[] = [
  { value: "text", label: "Paste text" },
  { value: "count", label: "Word count" },
];

const MAX_TIMELINE_ROWS = 60;

function deserializeSettings(raw: string): Settings {
  return normalizeSettings(JSON.parse(raw));
}

/** Selector plus slider for one pace. The slider is the custom option. */
function PaceCard({
  label,
  paces,
  wpm,
  min,
  max,
  onChange,
}: {
  label: string;
  paces: readonly Pace[];
  wpm: number;
  min: number;
  max: number;
  onChange: (wpm: number) => void;
}) {
  const active = paces.find((p) => p.wpm === wpm);
  const options = [
    ...paces.map((p) => ({ value: String(p.wpm), label: `${p.label} – ${p.wpm} wpm` })),
    ...(active ? [] : [{ value: "custom", label: `Custom – ${wpm} wpm` }]),
  ];
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-3.5">
      <Select
        label={label}
        options={options}
        value={active ? String(active.wpm) : "custom"}
        onChange={(e) => {
          if (e.target.value !== "custom") onChange(Number(e.target.value));
        }}
        hint={active ? active.note : "Custom pace set with the slider below."}
      />
      <Slider label="Words per minute" value={wpm} min={min} max={max} onChange={onChange} />
    </div>
  );
}

function ResultTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: [string, string, string];
  rows: { key: string; cells: [string, string, string]; highlight?: boolean }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">
              {columns[0]}
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              {columns[1]}
            </th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              {columns[2]}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.key} className={cn(r.highlight && "bg-primary-soft")}>
              <td className={cn("px-4 py-2", r.highlight ? "font-semibold text-fg" : "text-fg-secondary")}>{r.cells[0]}</td>
              <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-fg-secondary">{r.cells[1]}</td>
              <td className={cn("whitespace-nowrap px-4 py-2 text-right font-mono tabular-nums", r.highlight ? "font-semibold text-fg" : "text-fg")}>{r.cells[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WordsToTime() {
  // Settings are preferences, so they live in local storage. The pasted text is a
  // draft and stays in this tab's session storage only.
  const [settings, setSettings] = usePersistentState<Settings>("words-to-time:settings", DEFAULT_SETTINGS, {
    storage: "local",
    deserialize: deserializeSettings,
  });
  const [text, setText] = usePersistentState("words-to-time:text", "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((s) => ({ ...s, [key]: value }));
  const { mode, source, speakWpm, readWpm, pausesOn, breakMode } = settings;

  /* ---------------- inputs ---------------- */

  const textWords = useMemo(() => countWords(text), [text]);
  const blocks = useMemo(() => splitBlocks(text, breakMode), [text, breakMode]);
  const unspaced = useMemo(() => (source === "text" && mode === "forward" ? looksUnspaced(text) : false), [text, source, mode]);

  const countParsed = parseAmount(settings.wordCount, { integer: true, max: MAX_WORDS });
  const words = source === "text" ? textWords : countParsed.kind === "ok" ? countParsed.value : 0;
  const wordsError = source === "count" && countParsed.kind === "invalid" ? countParsed.message : undefined;

  const pauseSecParsed = parseAmount(settings.pauseSec, { max: MAX_PAUSE_SECONDS });
  const pauseCountParsed = parseAmount(settings.pauseCount, { integer: true, max: MAX_PAUSES });
  const pauseSec = pausesOn && pauseSecParsed.kind === "ok" ? pauseSecParsed.value : 0;
  const detectedPauses = Math.max(0, blocks.length - 1);
  const usesDetectedPauses = mode === "forward" && source === "text";
  const pauseCount = !pausesOn ? 0 : usesDetectedPauses ? detectedPauses : pauseCountParsed.kind === "ok" ? pauseCountParsed.value : 0;
  const pauseSecError = pausesOn && pauseSecParsed.kind === "invalid" ? pauseSecParsed.message : undefined;
  const pauseCountError = pausesOn && !usesDetectedPauses && pauseCountParsed.kind === "invalid" ? pauseCountParsed.message : undefined;

  const minutesParsed = parseAmount(settings.minutes, { max: MAX_MINUTES });
  const secondsParsed = parseAmount(settings.seconds, { max: MAX_SECONDS_FIELD });
  const minutesError = minutesParsed.kind === "invalid" ? minutesParsed.message : undefined;
  const secondsError = secondsParsed.kind === "invalid" ? secondsParsed.message : undefined;
  const totalSeconds =
    (minutesParsed.kind === "ok" ? minutesParsed.value * 60 : 0) + (secondsParsed.kind === "ok" ? secondsParsed.value : 0);
  const targetEntered = minutesParsed.kind !== "empty" || secondsParsed.kind !== "empty";

  /* ---------------- results ---------------- */

  const forward = useMemo(() => forwardTimes(words, speakWpm, readWpm, pauseCount, pauseSec), [words, speakWpm, readWpm, pauseCount, pauseSec]);
  const reverse = useMemo(() => reverseWords(totalSeconds, speakWpm, readWpm, pauseCount, pauseSec), [totalSeconds, speakWpm, readWpm, pauseCount, pauseSec]);
  const rows = useMemo(
    () => (mode === "forward" && source === "text" && blocks.length > 1 ? timeline(blocks, speakWpm, pauseSec) : []),
    [mode, source, blocks, speakWpm, pauseSec],
  );

  const forwardEmpty = words <= 0;
  const reverseEmpty = totalSeconds <= 0;
  const empty = mode === "forward" ? forwardEmpty : reverseEmpty;

  const activeSpeakPace = SPEAKING_PACES.find((p) => p.wpm === speakWpm);
  const activeReadPace = READING_PACES.find((p) => p.wpm === readWpm);

  const summary =
    mode === "forward"
      ? forwardSummary({ words, speakWpm, readWpm, times: forward, pauseCount, pauseSec })
      : reverseSummary({ totalSeconds, speakWpm, readWpm, result: reverse });

  const timelineCopy = rows
    .map((r) => `${formatClock(r.startSeconds)}  ${r.preview}  (${r.words} words, ${formatDuration(r.durationSeconds)})`)
    .join("\n");

  // Draft check in reverse mode: compare the text from the other tab with the target.
  const draftWords = textWords;
  const draftDiff = draftWords - reverse.speakWords;

  const sentence = (() => {
    if (empty) return "";
    if (mode === "forward") {
      return `${fmt(words)} words take about ${formatDuration(forward.speakSeconds)} to say at ${speakWpm} words per minute${
        forward.pauseSeconds > 0 ? ` (pauses included)` : ""
      }, or about ${formatDuration(forward.readSeconds)} to read silently at ${readWpm}.`;
    }
    return `${formatDuration(totalSeconds)} fits about ${fmt(reverse.speakWords)} spoken words at ${speakWpm} words per minute${
      reverse.pauseSeconds > 0 ? ` (after pauses)` : ""
    }, or about ${fmt(reverse.readWords)} words of silent reading at ${readWpm}.`;
  })();

  /* ---------------- render ---------------- */

  return (
    <ToolPanel>
      <div className="flex flex-col gap-3">
        <Tabs<Mode> label="Direction" value={mode} onChange={(v) => set("mode", v)} options={MODE_OPTIONS} />
      </div>

      {mode === "forward" ? (
        <div className="flex flex-col gap-3">
          <Tabs<Source> label="Input type" size="sm" value={source} onChange={(v) => set("source", v)} options={SOURCE_OPTIONS} />
          {source === "text" ? (
            <>
              <Textarea
                ref={textareaRef}
                label="Your script or text"
                labelAddon={`${fmt(textWords)} ${textWords === 1 ? "word" : "words"}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your speech, script or article here. Time updates as you type…"
                rows={9}
              />
              <ToolActions>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const clip = await navigator.clipboard.readText();
                      setText(clip);
                    } catch {
                      /* clipboard blocked: leave the text as it is */
                    }
                    textareaRef.current?.focus();
                  }}
                >
                  Paste
                </Button>
                <Button variant="secondary" onClick={() => setText(SAMPLE_TEXT)}>
                  Load sample
                </Button>
                <Button variant="secondary" onClick={() => setText("")} disabled={!text}>
                  Clear
                </Button>
              </ToolActions>
            </>
          ) : (
            <Input
              label="Number of words"
              inputMode="numeric"
              autoComplete="off"
              placeholder="For example 1,500"
              value={settings.wordCount}
              onChange={(e) => set("wordCount", e.target.value)}
              error={wordsError}
              hint={wordsError ? undefined : "Type the word count from your document, or any number you want to time."}
              suffix="words"
              className="pr-16"
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <ToolGrid>
            <Input
              label="Minutes"
              inputMode="decimal"
              autoComplete="off"
              placeholder="5"
              value={settings.minutes}
              onChange={(e) => set("minutes", e.target.value)}
              error={minutesError}
              suffix="min"
            />
            <Input
              label="Seconds"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={settings.seconds}
              onChange={(e) => set("seconds", e.target.value)}
              error={secondsError}
              suffix="sec"
            />
          </ToolGrid>
          <div className="flex flex-col gap-2">
            <span className="label-mono">Quick targets</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick targets">
              {PRESETS.map((p) => {
                const isActive = totalSeconds === p.seconds && targetEntered;
                return (
                  <Button
                    key={p.id}
                    size="sm"
                    variant={isActive ? "primary" : "outline"}
                    aria-pressed={isActive}
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        minutes: p.seconds >= 60 && p.seconds % 60 === 0 ? String(p.seconds / 60) : "",
                        seconds: p.seconds >= 60 && p.seconds % 60 === 0 ? "" : String(p.seconds),
                      }))
                    }
                  >
                    {p.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {unspaced && (
        <Alert variant="warning" title="This text has few spaces between words">
          Chinese, Japanese, Thai and similar scripts are not written with spaces, so the word count, and therefore the time, is not reliable. Use a character-based estimate instead.
        </Alert>
      )}

      {empty ? (
        <Alert variant="info">
          {mode === "forward"
            ? source === "text"
              ? "Paste your text above, or choose Load sample, to see how long it takes to speak and to read."
              : "Type a word count above to see how long it takes to speak and to read."
            : "Enter a target time above, or pick a quick target, to see how many words fit."}
        </Alert>
      ) : null}

      <StatGrid>
        {mode === "forward" ? (
          <>
            <Stat
              label="Speaking time"
              value={forwardEmpty ? "—" : formatDuration(forward.speakSeconds)}
              hint={forwardEmpty ? undefined : `${formatClock(forward.speakSeconds)} · ${speakWpm} wpm`}
              emphasis
            />
            <Stat
              label="Silent reading"
              value={forwardEmpty ? "—" : formatDuration(forward.readSeconds)}
              hint={forwardEmpty ? undefined : `${formatClock(forward.readSeconds)} · ${readWpm} wpm`}
            />
            <Stat label="Words" value={fmt(words)} hint={source === "text" ? `${fmt(blocks.length)} ${blocks.length === 1 ? "block" : "blocks"}` : "typed count"} />
            <Stat
              label="Pauses"
              value={pausesOn && pauseCount > 0 && pauseSec > 0 ? formatDuration(forward.pauseSeconds) : "None"}
              hint={pausesOn && pauseCount > 0 && pauseSec > 0 ? `${fmt(pauseCount)} × ${fmt(pauseSec, 2)} sec` : pausesOn ? "Set count and seconds" : "Switch on above"}
            />
          </>
        ) : (
          <>
            <Stat label="Words to speak" value={reverseEmpty ? "—" : fmt(reverse.speakWords)} hint={reverseEmpty ? undefined : `at ${speakWpm} wpm`} emphasis />
            <Stat label="Words to read silently" value={reverseEmpty ? "—" : fmt(reverse.readWords)} hint={reverseEmpty ? undefined : `at ${readWpm} wpm`} />
            <Stat
              label="Speaking range"
              value={reverseEmpty ? "—" : `${fmt(reverse.slowWords)}–${fmt(reverse.fastWords)}`}
              hint={reverseEmpty ? undefined : "from 130 to 180 wpm"}
            />
            <Stat
              label="Target time"
              value={reverseEmpty ? "—" : formatDuration(totalSeconds)}
              hint={reverseEmpty ? undefined : reverse.pauseSeconds > 0 ? `${formatDuration(reverse.pauseSeconds)} of pauses` : formatClock(totalSeconds)}
            />
          </>
        )}
      </StatGrid>

      {mode === "reverse" && !reverseEmpty && draftWords > 0 && !reverse.pausesTooLong && (
        <Alert
          variant={draftDiff > 0 ? "warning" : "success"}
          title={
            draftDiff === 0
              ? "Your text matches the target"
              : draftDiff > 0
                ? `Your text is ${fmt(draftDiff)} ${draftDiff === 1 ? "word" : "words"} over`
                : `Your text is ${fmt(-draftDiff)} ${draftDiff === -1 ? "word" : "words"} under`
          }
        >
          The text on the Words to time tab has {fmt(draftWords)} words, and {fmt(reverse.speakWords)} fit in {formatDuration(totalSeconds)} at {speakWpm} wpm
          {draftDiff !== 0 ? `, a difference of about ${formatDuration(Math.abs(secondsForWords(Math.abs(draftDiff), speakWpm)))}` : ""}.
        </Alert>
      )}

      <ToolGrid>
        <PaceCard label="Speaking pace" paces={SPEAKING_PACES} wpm={speakWpm} min={SPEAK_MIN} max={SPEAK_MAX} onChange={(v) => set("speakWpm", v)} />
        <PaceCard label="Silent reading pace" paces={READING_PACES} wpm={readWpm} min={READ_MIN} max={READ_MAX} onChange={(v) => set("readWpm", v)} />
      </ToolGrid>

      {(speakWpm > 200 || speakWpm < 110) && (
        <Alert variant="warning" title={speakWpm > 200 ? "That speaking pace is very fast" : "That speaking pace is very slow"}>
          {speakWpm > 200
            ? "Above about 200 words per minute most listeners cannot follow a talk comfortably. Treat the time as a lower bound."
            : "Below about 110 words per minute delivery can sound halting. Check that this is the pace you really use."}
        </Alert>
      )}

      <ToolSection
        title="Pauses"
        description="Breaths, slide changes and emphasis. Pauses are added to speaking time only, because silent readers do not pause between paragraphs."
      >
        <Toggle
          checked={pausesOn}
          onChange={(v) => set("pausesOn", v)}
          label="Add pause time"
          description={usesDetectedPauses ? "One pause between each paragraph or slide of your text." : "One pause per paragraph break or slide change."}
        />
        {pausesOn && (
          <ToolGrid>
            <Input
              label="Seconds per pause"
              inputMode="decimal"
              autoComplete="off"
              value={settings.pauseSec}
              onChange={(e) => set("pauseSec", e.target.value)}
              error={pauseSecError}
              suffix="sec"
            />
            {usesDetectedPauses ? (
              <Select
                label="Pause between"
                value={breakMode}
                onChange={(e) => set("breakMode", e.target.value === "line" ? "line" : "paragraph")}
                options={[
                  { value: "paragraph", label: "Paragraphs (blank line)" },
                  { value: "line", label: "Lines (every line break)" },
                ]}
                hint={`${fmt(blocks.length)} ${blocks.length === 1 ? "block" : "blocks"} found, so ${fmt(detectedPauses)} ${detectedPauses === 1 ? "pause" : "pauses"}.`}
              />
            ) : (
              <Input
                label="Number of pauses"
                inputMode="numeric"
                autoComplete="off"
                placeholder="For example 10"
                value={settings.pauseCount}
                onChange={(e) => set("pauseCount", e.target.value)}
                error={pauseCountError}
                hint={pauseCountError ? undefined : "Paragraph breaks or slide changes in your script."}
              />
            )}
          </ToolGrid>
        )}
      </ToolSection>

      {mode === "reverse" && reverse.pausesTooLong && (
        <Alert variant="warning" title="Your pauses fill the whole time">
          {fmt(pauseCount)} pauses of {fmt(pauseSec, 2)} seconds add up to {formatDuration(reverse.pauseSeconds)}, which is as long as the target. Reduce the number or length of pauses to leave room for words.
        </Alert>
      )}

      {!empty && (
        <>
          <p className="text-sm text-fg-secondary" data-testid="summary-sentence">
            {sentence}
          </p>
          <ToolActions>
            <CopyButton text={summary} label="Copy result" variant="primary" />
          </ToolActions>

          <ToolSection
            title={mode === "forward" ? "Time at every pace" : "Words at every pace"}
            description={
              mode === "forward"
                ? "The same words at each preset pace. Speaking rows include your pauses; the last row uses your silent reading pace."
                : "The same target time at each preset pace, after taking out your pauses. The last row uses your silent reading pace."
            }
          >
            {mode === "forward" ? (
              <ResultTable
                caption="Time to speak or read the same text at different paces"
                columns={["Pace", "WPM", "Time"]}
                rows={[
                  ...SPEAKING_PACES.map((p) => ({
                    key: `s${p.wpm}`,
                    cells: [p.label, String(p.wpm), formatDuration(secondsForWords(words, p.wpm) + forward.pauseSeconds)] as [string, string, string],
                    highlight: activeSpeakPace?.wpm === p.wpm,
                  })),
                  {
                    key: "read",
                    cells: [`Silent reading${activeReadPace ? ` (${activeReadPace.label.toLowerCase()})` : " (custom)"}`, String(readWpm), formatDuration(forward.readSeconds)] as [string, string, string],
                    highlight: false,
                  },
                ]}
              />
            ) : (
              <ResultTable
                caption="Words that fit the target time at different paces"
                columns={["Pace", "WPM", "Words"]}
                rows={[
                  ...SPEAKING_PACES.map((p) => ({
                    key: `s${p.wpm}`,
                    cells: [p.label, String(p.wpm), fmt(Math.round(wordsForSeconds(reverse.availableSeconds, p.wpm)))] as [string, string, string],
                    highlight: activeSpeakPace?.wpm === p.wpm,
                  })),
                  {
                    key: "read",
                    cells: [`Silent reading${activeReadPace ? ` (${activeReadPace.label.toLowerCase()})` : " (custom)"}`, String(readWpm), fmt(reverse.readWords)] as [string, string, string],
                    highlight: false,
                  },
                ]}
              />
            )}
          </ToolSection>

          {rows.length > 0 && (
            <ToolSection
              title="Timing by paragraph"
              description={`When each block starts if you speak at ${speakWpm} wpm${pauseSec > 0 ? ` with ${fmt(pauseSec, 2)}-second pauses` : ""}. Useful for marking slide changes in a script.`}
            >
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <caption className="sr-only">Start time and length of each paragraph</caption>
                  <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-2 font-medium">
                        #
                      </th>
                      <th scope="col" className="px-4 py-2 font-medium">
                        Starts at
                      </th>
                      <th scope="col" className="px-4 py-2 font-medium">
                        Opening words
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">
                        Words
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">
                        Length
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, MAX_TIMELINE_ROWS).map((r) => (
                      <tr key={r.index}>
                        <td className="px-4 py-2 tabular-nums text-muted">{r.index}</td>
                        <td className="whitespace-nowrap px-4 py-2 font-mono tabular-nums text-fg">{formatClock(r.startSeconds)}</td>
                        <td className="max-w-[16rem] truncate px-4 py-2 text-fg-secondary">{r.preview}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-fg-secondary">{fmt(r.words)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-fg-secondary">{formatDuration(r.durationSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > MAX_TIMELINE_ROWS && (
                <p className="text-xs text-muted">
                  Showing the first {MAX_TIMELINE_ROWS} of {fmt(rows.length)} blocks. The copied timings include all of them.
                </p>
              )}
              <ToolActions>
                <CopyButton text={timelineCopy} label="Copy timings" variant="outline" />
              </ToolActions>
            </ToolSection>
          )}
        </>
      )}
    </ToolPanel>
  );
}
