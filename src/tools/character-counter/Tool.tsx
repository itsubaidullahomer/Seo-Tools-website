"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  Alert,
  Button,
  CopyButton,
  Input,
  ResultBox,
  Select,
  Stat,
  StatGrid,
  Textarea,
  Toggle,
  ToolActions,
  ToolPanel,
  ToolSection,
} from "@/components/ui";
import { cn, formatBytes, formatNumber } from "@/lib/utils";
import {
  analyzeText,
  getPreset,
  measure,
  smsInfo,
  trimToLimit,
  xWeightedLength,
  CUSTOM_PRESET_ID,
  HUGE_TEXT_UNITS,
  NO_LIMIT_PRESET_ID,
  PRESETS,
  X_URL_WEIGHT,
  type LimitRule,
} from "./count";

const GROUPS = [...new Set(PRESETS.filter((p) => p.group).map((p) => p.group))];

/** Turn "Instagram caption – 2,200" into "Instagram caption". */
function shortLabel(label: string): string {
  return label.split(" – ")[0].replace(/…$/, "");
}

function unitLabel(rule: LimitRule): string {
  switch (rule) {
    case "x":
      return "weighted characters";
    case "units":
      return "UTF-16 units";
    case "sms":
      return "characters";
    default:
      return "characters";
  }
}

export default function CharacterCounter() {
  // The draft lives in this tab's session storage; the limit settings are remembered across visits.
  const [text, setText] = usePersistentState("character-counter:draft", "");
  const [presetId, setPresetId] = usePersistentState("character-counter:preset", NO_LIMIT_PRESET_ID, { storage: "local" });
  const [customLimit, setCustomLimit] = usePersistentState("character-counter:custom-limit", "", { storage: "local" });
  const [countUnits, setCountUnits] = usePersistentState("character-counter:count-units", false, { storage: "local" });
  const [pasteBlocked, setPasteBlocked] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Counting runs on a deferred copy so typing stays smooth in very long documents.
  const counted = useDeferredValue(text);
  const stats = useMemo(() => analyzeText(counted), [counted]);

  const preset = useMemo(() => getPreset(presetId), [presetId]);
  const isCustom = preset.id === CUSTOM_PRESET_ID;
  const isNone = preset.id === NO_LIMIT_PRESET_ID;
  const rule: LimitRule = preset.rule === "graphemes" && countUnits ? "units" : preset.rule;

  const customNumber = Number(customLimit);
  const customValid = customLimit.trim() !== "" && Number.isInteger(customNumber) && customNumber > 0;
  const baseLimit = isCustom ? (customValid ? customNumber : 0) : preset.limit;

  // Measuring against the limit (and trimming to fit) walks the whole text for the X
  // and SMS rules, so it only reruns when the counted text or the limit settings change.
  const measured = useMemo(() => {
    const sms = rule === "sms" ? smsInfo(counted) : null;
    const xInfo = rule === "x" ? xWeightedLength(counted) : null;
    const used = xInfo ? xInfo.weighted : sms ? sms.units : measure(counted, rule, stats);
    // SMS capacity depends on the encoding the text forces (160 for GSM-7, 70 for UCS-2).
    const limit = sms ? sms.single : baseLimit;
    const hasLimit = !isNone && Number.isFinite(limit) && limit > 0;
    const over = hasLimit && used > limit;
    const fitted = over ? trimToLimit(counted, rule, limit) : "";
    return { sms, xInfo, used, limit, hasLimit, over, fitted };
  }, [counted, stats, rule, baseLimit, isNone]);
  const { sms, xInfo, used, limit, hasLimit, over, fitted } = measured;
  const near = hasLimit && !over && used >= limit * 0.9;
  const pct = hasLimit ? Math.min(100, (used / limit) * 100) : 0;

  const unitsDiffer = stats.graphemes !== stats.codeUnits;
  const avgWordLength = stats.words ? stats.graphemesNoSpaces / stats.words : 0;

  const summaryLines = [
    `Characters: ${stats.graphemes}`,
    `Characters (no spaces): ${stats.graphemesNoSpaces}`,
    `Words: ${stats.words}`,
    `Sentences: ${stats.sentences}`,
    `Paragraphs: ${stats.paragraphs}`,
    `Lines: ${stats.lines}`,
    `Letters: ${stats.letters}`,
    `UTF-8 bytes: ${stats.bytes}`,
  ];
  if (unitsDiffer) summaryLines.splice(1, 0, `UTF-16 code units: ${stats.codeUnits}`);
  if (hasLimit) summaryLines.push(`${isCustom ? "Custom limit" : shortLabel(preset.label)}: ${used} / ${limit}`);
  const summary = summaryLines.join("\n");

  const limitName = isCustom ? "your limit" : `the ${shortLabel(preset.label)} limit`;

  return (
    <ToolPanel>
      <Textarea
        ref={textareaRef}
        label="Your text"
        labelAddon={
          hasLimit
            ? `${formatNumber(used)} / ${formatNumber(limit)} ${unitLabel(rule)}`
            : `${formatNumber(stats.graphemes)} characters`
        }
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPasteBlocked(false);
        }}
        placeholder="Type or paste your text here. Characters, words, sentences and bytes are counted as you type…"
        rows={6}
        error={over ? `${formatNumber(used - limit)} ${unitLabel(rule)} over ${limitName}.` : undefined}
      />

      <ToolActions>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              const clip = await navigator.clipboard.readText();
              setText(clip);
              setPasteBlocked(false);
            } catch {
              // Clipboard read was refused or is unsupported; tell the user how to paste manually.
              setPasteBlocked(true);
            }
            textareaRef.current?.focus();
          }}
        >
          Paste
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setText("");
            textareaRef.current?.focus();
          }}
          disabled={!text}
        >
          Clear
        </Button>
        <CopyButton text={text} label="Copy text" variant="outline" disabled={!text} />
        <CopyButton text={summary} label="Copy stats" variant="outline" disabled={!text} />
      </ToolActions>

      {pasteBlocked && (
        <Alert variant="warning" title="Your browser blocked clipboard access">
          Click in the text box and press Ctrl+V (⌘V on a Mac), or long-press and choose Paste on a phone.
        </Alert>
      )}

      <StatGrid>
        <Stat
          label="Characters"
          value={formatNumber(stats.graphemes)}
          emphasis
          hint={unitsDiffer ? `${formatNumber(stats.codeUnits)} UTF-16 code units` : "including spaces"}
        />
        <Stat label="Without spaces" value={formatNumber(stats.graphemesNoSpaces)} hint={`${formatNumber(stats.spaces)} spaces`} />
        <Stat label="Words" value={formatNumber(stats.words)} hint={stats.words ? `${avgWordLength.toFixed(1)} chars/word` : undefined} />
        <Stat
          label="Sentences"
          value={formatNumber(stats.sentences)}
          hint={stats.sentences ? `${(stats.words / stats.sentences).toFixed(1)} words avg` : undefined}
        />
        <Stat label="Lines" value={formatNumber(stats.lines)} />
        <Stat label="Paragraphs" value={formatNumber(stats.paragraphs)} />
        <Stat
          label="Letters"
          value={formatNumber(stats.letters)}
          hint={`${formatNumber(stats.digits)} digits · ${formatNumber(stats.punctuation)} symbols`}
        />
        <Stat
          label="UTF-8 bytes"
          value={formatNumber(stats.bytes)}
          hint={stats.bytes >= 1024 ? formatBytes(stats.bytes) : `${formatNumber(stats.codePoints)} code points`}
        />
      </StatGrid>

      {!stats.exact && (
        <Alert variant="warning" title="Very long text">
          Above {formatNumber(HUGE_TEXT_UNITS)} characters, emoji and accented letters are counted as code points instead of visible characters
          to keep the page responsive, so the total can be slightly higher than what you see.
        </Alert>
      )}

      {stats.exact && unitsDiffer && (
        <Alert variant="info" title={`${formatNumber(stats.graphemes)} characters, but ${formatNumber(stats.codeUnits)} UTF-16 code units`}>
          Emoji, flags and some accented letters take more than one code unit. Apps that measure fields by code units, and X, which counts
          every emoji as 2, will report a higher number than the visible character count.{" "}
          {preset.rule === "x" || preset.rule === "sms"
            ? `The ${shortLabel(preset.label)} preset below already applies that platform's rule.`
            : "Turn on “Count emoji as 2” below to check a limit that way."}
        </Alert>
      )}

      <ToolSection
        title="Check against a limit"
        description="Pick a platform or type your own limit. The bar turns amber at 90% and red when you go over."
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <Select label="Platform or field" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            <option value={NO_LIMIT_PRESET_ID}>No limit</option>
            {GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {PRESETS.filter((p) => p.group === group).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <Input
            label="Limit"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="e.g. 500"
            className="no-spinner"
            value={isCustom ? customLimit : isNone ? "" : String(limit)}
            onChange={(e) => {
              setCustomLimit(e.target.value);
              setPresetId(CUSTOM_PRESET_ID);
            }}
            error={isCustom && customLimit.trim() !== "" && !customValid ? "Enter a whole number above 0." : undefined}
          />
        </div>

        {hasLimit ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <span className="font-medium tabular-nums text-fg">
                {formatNumber(used)} / {formatNumber(limit)} <span className="font-normal text-muted">{unitLabel(rule)}</span>
              </span>
              <span className={cn("tabular-nums", over ? "font-medium text-danger" : near ? "font-medium text-warning" : "text-muted")}>
                {over ? `${formatNumber(used - limit)} over the limit` : `${formatNumber(limit - used)} remaining`}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Share of the limit used"
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-valuenow={Math.min(used, limit)}
              aria-valuetext={`${used} of ${limit} ${unitLabel(rule)}`}
              className="h-2.5 w-full overflow-hidden rounded-full bg-surface-3"
            >
              <div
                className={cn("h-full rounded-full transition-[width] duration-200", over ? "bg-danger" : near ? "bg-warning" : "bg-primary")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted">
              {preset.note && <p>{preset.note}</p>}
              {xInfo && xInfo.urls > 0 && (
                <p>
                  {xInfo.urls} link{xInfo.urls === 1 ? "" : "s"} counted as {X_URL_WEIGHT} characters each, the length of an X t.co URL.
                </p>
              )}
              {sms && counted && (
                <p>
                  {sms.encoding === "GSM-7"
                    ? `GSM-7 encoding: ${sms.single} characters fit in one message, ${sms.perSegment} per part when split.`
                    : `Unicode (UCS-2) encoding because the text contains a character outside the GSM-7 alphabet: only ${sms.single} characters fit in one message, ${sms.perSegment} per part when split.`}{" "}
                  This text sends as {sms.segments} message part{sms.segments === 1 ? "" : "s"}.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">
            {isCustom ? "Enter a limit to see how much of it your text uses." : "Choose a preset or type a limit to see a progress bar and a trimmed version that fits."}
          </p>
        )}

        <Toggle
          checked={countUnits}
          onChange={setCountUnits}
          disabled={preset.rule === "x" || preset.rule === "sms"}
          label="Count emoji as 2 characters"
          description={
            preset.rule === "x" || preset.rule === "sms"
              ? `${shortLabel(preset.label)} has its own counting rule, applied automatically.`
              : "Measure the limit in UTF-16 code units, the way many apps, forms and databases do. Off: every emoji counts as 1."
          }
        />

        {over && fitted && (
          <ResultBox
            label={`Trimmed to fit ${formatNumber(limit)} ${unitLabel(rule)}`}
            value={fitted}
            rows={4}
            placeholder=""
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setText(fitted);
                  textareaRef.current?.focus();
                }}
              >
                Use this text
              </Button>
            }
          />
        )}
      </ToolSection>
    </ToolPanel>
  );
}
