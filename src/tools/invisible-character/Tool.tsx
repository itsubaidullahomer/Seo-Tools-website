"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Input, ResultBox, Select, Stat, StatGrid, Tabs, Textarea, Toggle, ToolActions, ToolGrid, ToolPanel, ToolSection } from "@/components/ui";
import { cn, downloadText, formatNumber } from "@/lib/utils";
import {
  ACTION_LABELS,
  BEHAVIOR,
  BEHAVIOR_VERIFIED_ON,
  BEHAVIOR_VERIFIED_WITH,
  CATEGORIES,
  COPY_FILTER_OPTIONS,
  COPY_FORMAT_OPTIONS,
  COPY_LIST,
  MAX_REPEAT,
  QUICK_COPY,
  codePointLabel,
  copyFilterOf,
  formatForCopy,
  infoFor,
  parseRepeat,
  type CopyFilter,
  type CopyFormat,
} from "./chars";
import {
  clean,
  countByCategory,
  decodeHiddenTags,
  defaultActions,
  exampleText,
  groupByCodePoint,
  hasBidiOverrides,
  linesAffected,
  parseActions,
  scan,
  toSegments,
  uniformActions,
  type Actions,
  type Hit,
} from "./logic";

type Mode = "copy" | "detect";

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "copy", label: "Copy characters" },
  { value: "detect", label: "Detect and clean text" },
];

/** Highlight view limits, so a huge paste never floods the DOM. */
const VIEW_MAX_CHARS = 30_000;
const VIEW_MAX_CHIPS = 1_500;
/** The cleaned-text preview is capped; Copy and Download always use the full text. */
const OUTPUT_PREVIEW_CHARS = 200_000;
const LARGE_TEXT_CHARS = 1_000_000;

/* Stable parsers for persisted state (module scope so their identity never changes). */
const parseMode = (s: string): Mode => (JSON.parse(s) === "detect" ? "detect" : "copy");
const parseFormat = (s: string): CopyFormat => {
  const v = JSON.parse(s);
  return COPY_FORMAT_OPTIONS.some((o) => o.value === v) ? (v as CopyFormat) : "char";
};
const parseText = (s: string): string => {
  const v = JSON.parse(s);
  return typeof v === "string" ? v : "";
};
const parseBool = (s: string): boolean => JSON.parse(s) !== false;

/** "ZERO WIDTH NO-BREAK SPACE" -> "Zero Width No-Break Space". */
function titleCase(name: string): string {
  return name.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

function widthText(w: number | undefined): string {
  if (w === undefined) return "";
  return w < 0.1 ? "0 px wide here" : `${w.toFixed(1)} px wide here`;
}

/** Measure how wide each code point renders in this browser, at the page font and 16px. Call from an effect only. */
function measureWidths(probe: HTMLElement, cps: number[]): Record<number, number> {
  probe.textContent = "||";
  const base = probe.getBoundingClientRect().width;
  const out: Record<number, number> = {};
  for (const cp of cps) {
    probe.textContent = `|${String.fromCodePoint(cp)}|`;
    out[cp] = Math.max(0, probe.getBoundingClientRect().width - base);
  }
  probe.textContent = "";
  return out;
}

const ALL_COPY_CPS = [...new Set([...COPY_LIST, ...QUICK_COPY.map((q) => q.cp)])];

/* ---------------------------------------------------------------------------
 * Root
 * ------------------------------------------------------------------------- */

export default function InvisibleCharacter() {
  const [mode, setMode] = usePersistentState<Mode>("invisible-character:mode", "copy", { deserialize: parseMode });
  const [widths, setWidths] = useState<Record<number, number>>({});
  const probeRef = useRef<HTMLSpanElement>(null);

  // Measure in this browser with this page's fonts. Done asynchronously, after fonts load.
  // The probe lives here, outside the tab panels, so it is laid out even when the Copy tab is hidden.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(document.fonts?.ready)
      .catch(() => undefined)
      .then(() => {
        const el = probeRef.current;
        if (!cancelled && el) setWidths(measureWidths(el, ALL_COPY_CPS));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ToolPanel>
      <div aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
        <span ref={probeRef} className="whitespace-pre text-base" />
      </div>
      <Tabs label="Tool mode" value={mode} onChange={setMode} options={MODE_OPTIONS} />
      <div role="tabpanel" aria-label="Copy characters" hidden={mode !== "copy"}>
        <CopyTab widths={widths} />
      </div>
      <div role="tabpanel" aria-label="Detect and clean text" hidden={mode !== "detect"}>
        <DetectTab />
      </div>
    </ToolPanel>
  );
}

/* ---------------------------------------------------------------------------
 * Copy tab
 * ------------------------------------------------------------------------- */

function CopyTab({ widths }: { widths: Record<number, number> }) {
  const [format, setFormat] = usePersistentState<CopyFormat>("invisible-character:format", "char", { storage: "local", deserialize: parseFormat });
  const [repeatRaw, setRepeatRaw] = useState("1");
  const [filter, setFilter] = useState<CopyFilter>("all");

  const repeat = parseRepeat(repeatRaw);
  const repeatAdjusted = repeatRaw.trim() !== "" && Number(repeatRaw) !== repeat;

  const visible = COPY_LIST.filter((cp) => filter === "all" || copyFilterOf(cp) === filter);

  return (
    <div className="flex flex-col gap-5">
      <Alert variant="info" title="For spacing, typesetting and testing">
        Many apps strip these characters or reject them in names and posts. Using them to impersonate people or dodge moderation breaks most platforms&rsquo; rules, and no character here is
        guaranteed to work in any specific app.
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_COPY.map((q, i) => {
          const text = formatForCopy(q.cp, format, repeat);
          return (
            <div key={q.cp} className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-2 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-fg">{q.title}</span>
                <Badge variant="primary">{codePointLabel(q.cp)}</Badge>
              </div>
              <p className="flex-1 text-xs text-muted">{q.blurb}</p>
              <p className="min-h-4 font-mono text-[11px] text-muted">{widthText(widths[q.cp])}</p>
              <CopyButton text={text} label="Copy" variant={i === 0 ? "accent" : "primary"} className="w-full" aria-label={`Copy ${q.title}`} />
            </div>
          );
        })}
      </div>

      <ToolGrid>
        <Select label="Copy as" value={format} onChange={(e) => setFormat(e.target.value as CopyFormat)} options={COPY_FORMAT_OPTIONS} hint="Applies to every Copy button on this page." />
        <Input
          label="How many"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_REPEAT}
          value={repeatRaw}
          onChange={(e) => setRepeatRaw(e.target.value)}
          className="no-spinner"
          hint={repeatAdjusted ? `Using ${repeat}. Allowed range is 1 to ${MAX_REPEAT}.` : `Copies of the character, 1 to ${MAX_REPEAT}.`}
        />
      </ToolGrid>

      <ToolSection>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-fg">
            All characters <span className="font-normal text-muted">({visible.length})</span>
          </h3>
          <Tabs size="sm" label="Filter characters" value={filter} onChange={setFilter} options={COPY_FILTER_OPTIONS} />
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {visible.map((cp) => {
            const info = infoFor(cp);
            const text = formatForCopy(cp, format, repeat);
            return (
              <li key={cp} className="flex flex-col gap-2.5 bg-surface p-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-fg">{titleCase(info.name)}</span>
                    <Badge variant="primary">{codePointLabel(cp)}</Badge>
                    <Badge variant="outline">{CATEGORIES[info.category].label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{info.note}</p>
                  {format !== "char" && <code className="mt-1 block truncate font-mono text-xs text-fg-secondary">{text.length > 60 ? `${text.slice(0, 60)}…` : text}</code>}
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="min-w-[8.5rem] font-mono text-[11px] text-muted sm:text-right">{widthText(widths[cp])}</span>
                  <span aria-hidden="true" className="rounded-md border border-dashed border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-sm text-fg-secondary">
                    |{String.fromCodePoint(cp)}|
                  </span>
                  <CopyButton text={text} label="Copy" size="sm" variant="secondary" aria-label={`Copy ${titleCase(info.name)}`} />
                </div>
              </li>
            );
          })}
        </ul>
      </ToolSection>

      <details className="rounded-xl border border-border bg-surface-2">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-fg select-none">
          How these characters behave in code <span className="font-normal text-muted">&middot; verified {BEHAVIOR_VERIFIED_ON}</span>
        </summary>
        <div className="flex flex-col gap-3 border-t border-border p-4">
          <p className="text-xs text-muted">
            Checked on {BEHAVIOR_VERIFIED_ON} with {BEHAVIOR_VERIFIED_WITH}. &ldquo;Yes&rdquo; means the character counts as whitespace, so <code className="font-mono">trim()</code> or{" "}
            <code className="font-mono">strip()</code> removes it from the ends of a string. Rendering in chat apps, games and social networks is not listed: it changes between app versions and
            fonts and cannot be verified here. The width shown beside each character above is measured live in your own browser.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Character
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Unicode whitespace
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    JavaScript trim()
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Python strip()
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {BEHAVIOR.map((row) => (
                  <tr key={row.cp}>
                    <th scope="row" className="px-3 py-2 text-left font-medium text-fg">
                      {titleCase(infoFor(row.cp).name)} <span className="font-mono text-xs font-normal text-muted">{codePointLabel(row.cp)}</span>
                    </th>
                    <td className="px-3 py-2 font-mono text-xs text-fg-secondary">{row.gc}</td>
                    <YesNo value={row.unicodeSpace} />
                    <YesNo value={row.jsTrim} />
                    <YesNo value={row.pyStrip} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}

function YesNo({ value }: { value: boolean }) {
  return (
    <td className="px-3 py-2">
      <Badge variant={value ? "success" : "default"}>{value ? "Yes" : "No"}</Badge>
    </td>
  );
}

/* ---------------------------------------------------------------------------
 * Detect tab
 * ------------------------------------------------------------------------- */

function Chip({ hit, dim }: { hit: Hit; dim: boolean }) {
  const title = `${codePointLabel(hit.cp)} ${titleCase(hit.info.name)}${hit.legit ? ` (probably intentional: ${hit.legit})` : ""}`;
  return (
    <span
      title={title}
      className={cn(
        "mx-0.5 inline-block rounded border px-1 align-baseline font-mono text-[10px] leading-4 font-semibold tracking-wide whitespace-nowrap",
        dim ? "border-border-strong bg-surface text-muted" : "border-primary/40 bg-primary-soft text-primary",
      )}
    >
      {hit.info.abbr}
    </span>
  );
}

function DetectTab() {
  const [text, setText] = usePersistentState("invisible-character:text", "", { deserialize: parseText });
  const [actions, setActions] = usePersistentState<Actions>("invisible-character:actions", defaultActions(), { storage: "local", deserialize: parseActions });
  const [keepLegit, setKeepLegit] = usePersistentState("invisible-character:keep-legit", true, { storage: "local", deserialize: parseBool });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const deferred = useDeferredValue(text);
  const result = useMemo(() => scan(deferred), [deferred]);
  const { hits } = result;

  const groups = useMemo(() => groupByCodePoint(hits), [hits]);
  const categoryCounts = useMemo(() => countByCategory(hits), [hits]);
  const cleaned = useMemo(() => clean(deferred, hits, actions, keepLegit), [deferred, hits, actions, keepLegit]);
  const view = useMemo(() => toSegments(deferred, hits, VIEW_MAX_CHARS, VIEW_MAX_CHIPS), [deferred, hits]);
  const tagMessage = useMemo(() => decodeHiddenTags(hits), [hits]);

  const bidiOverride = hasBidiOverrides(hits);
  const bomAtStart = hits.length > 0 && hits[0].index === 0 && hits[0].cp === 0xfeff;
  const legitTotal = hits.filter((h) => h.legit).length;
  const changed = cleaned.removed + cleaned.replaced + cleaned.marked;

  const output = cleaned.output;
  const outputPreview = output.length > OUTPUT_PREVIEW_CHARS ? output.slice(0, OUTPUT_PREVIEW_CHARS) : output;

  const setAction = (id: keyof Actions, value: Actions[keyof Actions]) => setActions((prev) => ({ ...prev, [id]: value }));

  return (
    <div className="flex flex-col gap-5">
      <Textarea
        ref={textareaRef}
        mono
        label="Text to check"
        labelAddon={`${formatNumber(result.codePoints)} characters`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text, code or CSV data here. Hidden characters are highlighted below as soon as you paste."
        rows={8}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
      />

      <ToolActions>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              const clip = await navigator.clipboard.readText();
              setText(clip);
            } catch {
              /* clipboard read denied: the user can paste into the box directly */
            }
            textareaRef.current?.focus();
          }}
        >
          Paste
        </Button>
        <Button variant="secondary" onClick={() => setText(exampleText())}>
          Load example
        </Button>
        <Button variant="secondary" onClick={() => setText("")} disabled={!text}>
          Clear
        </Button>
      </ToolActions>

      {!text && <p className="text-sm text-muted">Paste some text above, or load the example, to see which hidden characters it contains. Nothing you paste leaves your browser.</p>}

      {text && result.codePoints > LARGE_TEXT_CHARS && (
        <Alert variant="info" title="Large text">
          {formatNumber(result.codePoints)} characters. Everything still runs in your browser, but the highlighted view below only shows the first {formatNumber(VIEW_MAX_CHARS)} characters.
        </Alert>
      )}

      {text && hits.length === 0 && (
        <Alert variant="success" title="No hidden characters found">
          Checked {formatNumber(result.codePoints)} characters. Apart from ordinary spaces, tabs and line breaks, everything in this text is a visible character.
        </Alert>
      )}

      {hits.length > 0 && (
        <>
          <StatGrid>
            <Stat label="Hidden characters" value={formatNumber(hits.length)} emphasis hint={legitTotal ? `${formatNumber(legitTotal)} probably intentional` : undefined} />
            <Stat label="Kinds found" value={formatNumber(groups.length)} hint="distinct code points" />
            <Stat label="Lines affected" value={formatNumber(linesAffected(hits))} hint={`of ${formatNumber(result.lines)}`} />
            <Stat label="Characters" value={formatNumber(result.codePoints)} hint={`${formatNumber(result.codePoints - hits.length)} not hidden`} />
          </StatGrid>

          {bidiOverride && (
            <Alert variant="warning" title="Text-direction overrides found">
              Overrides, embeddings and isolates can make text display in a different order from the order it is stored in. They have been used to disguise source code (CVE-2021-42574,
              known as &ldquo;Trojan Source&rdquo;). Unless you are deliberately formatting right-to-left text, remove them.
            </Alert>
          )}
          {tagMessage && (
            <Alert variant="warning" title="Invisible text found in tag characters">
              Some tag characters are not part of a flag emoji. They mirror ASCII, so they can carry text that nobody can see. Decoded, they spell: &ldquo;{tagMessage}&rdquo;. If this text came from
              an untrusted source, be careful before pasting it into an AI assistant or a script.
            </Alert>
          )}
          {bomAtStart && (
            <Alert variant="info" title="Starts with a byte order mark">
              The first character is U+FEFF. UTF-8 files saved &ldquo;with BOM&rdquo; begin with one. Some programs need it and some choke on it, so remove it only if the consumer of this text does
              not expect it.
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="label-mono">Highlighted view</span>
              <span className="flex items-center gap-2 text-[11px] text-muted">
                <span className="inline-block rounded border border-primary/40 bg-primary-soft px-1 font-mono text-[10px] font-semibold text-primary">ZWSP</span> hidden
                <span className="inline-block rounded border border-border-strong bg-surface px-1 font-mono text-[10px] font-semibold text-muted">ZWJ</span> probably intentional
              </span>
            </div>
            <div
              role="region"
              tabIndex={0}
              aria-label="Your text with hidden characters highlighted"
              className="max-h-72 overflow-auto rounded-lg border border-border-strong bg-surface-2 px-3 py-2.5 font-mono text-[13px] leading-7 break-words whitespace-pre-wrap text-fg"
            >
              {view.segments.map((s, i) => (s.kind === "text" ? <span key={i}>{s.text}</span> : <Chip key={i} hit={s.hit} dim={keepLegit && s.hit.legit !== null} />))}
            </div>
            {view.truncated && (
              <p className="text-xs text-muted">
                Showing the first {formatNumber(view.shownChars)} characters. The counts, the table and the cleaned text below cover the whole input.
              </p>
            )}
          </div>

          <ToolSection title="What was found" description="One row per kind of character. Hover a highlight above for its full name.">
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs tracking-wide text-muted uppercase">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Code point
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Name
                    </th>
                    <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Count
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      First at
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {groups.map((g) => (
                    <tr key={g.cp}>
                      <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-fg">{codePointLabel(g.cp)}</td>
                      <td className="px-3 py-2 font-medium text-fg">
                        {titleCase(g.info.name)} <span className="font-mono text-[11px] font-normal text-muted">{g.info.abbr}</span>
                      </td>
                      <td className="hidden px-3 py-2 text-fg-secondary sm:table-cell">{CATEGORIES[g.info.category].label}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-fg-secondary">
                        {formatNumber(g.count)}
                        {g.legitCount > 0 && <span className="text-muted"> ({formatNumber(g.legitCount)} intentional)</span>}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-fg-secondary">
                        line {formatNumber(g.firstLine)}, col {formatNumber(g.firstCol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ToolSection>

          <ToolSection title="Clean the text" description="Choose what happens to each kind of hidden character. The result updates as you change a choice.">
            <Toggle
              checked={keepLegit}
              onChange={setKeepLegit}
              label="Keep probable legitimate uses"
              description="Leaves emoji joiners and style selectors, flag tags, joiners inside Arabic and Indic words, and direction marks in right-to-left text untouched."
            />
            <ToolActions>
              <span className="label-mono mr-1">Presets</span>
              <Button size="sm" variant="outline" onClick={() => setActions(defaultActions())}>
                Recommended
              </Button>
              <Button size="sm" variant="outline" onClick={() => setActions(uniformActions("remove"))}>
                Remove all
              </Button>
              <Button size="sm" variant="outline" onClick={() => setActions(uniformActions("mark"))}>
                Mark all
              </Button>
            </ToolActions>
            <div className="grid gap-3 sm:grid-cols-2">
              {categoryCounts.map((c) => (
                <Select
                  key={c.id}
                  selectSize="sm"
                  label={CATEGORIES[c.id].label}
                  labelAddon={`${formatNumber(c.count)} found`}
                  value={actions[c.id]}
                  onChange={(e) => setAction(c.id, e.target.value as Actions[typeof c.id])}
                  options={CATEGORIES[c.id].actions.map((a) => ({ value: a, label: ACTION_LABELS[a] }))}
                  hint={CATEGORIES[c.id].description}
                />
              ))}
            </div>

            <ResultBox
              label="Cleaned text"
              value={outputPreview}
              copy={false}
              mono
              rows={8}
              placeholder="The cleaned text appears here."
            />
            {output.length > OUTPUT_PREVIEW_CHARS && (
              <p className="text-xs text-muted">
                The box shows the first {formatNumber(OUTPUT_PREVIEW_CHARS)} characters. Copy and Download use all {formatNumber(output.length)}.
              </p>
            )}
            <ToolActions>
              <CopyButton text={output} label="Copy cleaned text" variant="accent" disabled={!output} />
              <Button variant="secondary" onClick={() => downloadText(output, "cleaned-text.txt")} disabled={!output}>
                Download .txt
              </Button>
              <span className="text-xs text-muted" role="status">
                {changed === 0 ? "Nothing changed." : `Removed ${formatNumber(cleaned.removed)}, replaced ${formatNumber(cleaned.replaced)}, marked ${formatNumber(cleaned.marked)}.`}
                {cleaned.kept > 0 && ` Kept ${formatNumber(cleaned.kept)}.`}
              </span>
            </ToolActions>
          </ToolSection>
        </>
      )}
    </div>
  );
}
