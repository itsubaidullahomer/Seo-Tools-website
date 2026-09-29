"use client";

import { useMemo } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Input } from "@/components/ui/Input";
import { ResultBox } from "@/components/ui/ResultBox";
import { Select } from "@/components/ui/Select";
import { Stat, StatGrid } from "@/components/ui/Stat";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { ToolActions, ToolPanel, ToolSection } from "@/components/ui/ToolPanel";
import { cn, downloadText, formatNumber } from "@/lib/utils";
import {
  buildUrl,
  charLength,
  gradeSlug,
  parseMaxLength,
  slugifyLines,
  toCsv,
  type BatchRow,
  type Charset,
  type LengthGrade,
  type Separator,
  type SlugOptions,
} from "./slug-core";

type Mode = "single" | "batch";

interface Settings {
  mode: Mode;
  separator: Separator;
  charset: Charset;
  lowercase: boolean;
  stopWords: boolean;
  germanUmlauts: boolean;
  symbols: boolean;
  /** Raw text of the max-length field; empty means no limit. */
  maxLength: string;
  wholeWords: boolean;
  unique: boolean;
  baseUrl: string;
}

const DEFAULT_SETTINGS: Settings = {
  mode: "single",
  separator: "-",
  charset: "transliterate",
  lowercase: true,
  stopWords: false,
  germanUmlauts: false,
  symbols: true,
  maxLength: "",
  wholeWords: true,
  unique: true,
  baseUrl: "https://example.com/blog/",
};

const serializeSettings = (s: Settings) => JSON.stringify(s);
const parseSettings = (raw: string): Settings => {
  const v = JSON.parse(raw) as Partial<Record<keyof Settings, unknown>>;
  const bool = (x: unknown, d: boolean) => (typeof x === "boolean" ? x : d);
  return {
    mode: v.mode === "batch" ? "batch" : "single",
    separator: v.separator === "_" ? "_" : "-",
    charset: v.charset === "unicode" ? "unicode" : "transliterate",
    lowercase: bool(v.lowercase, DEFAULT_SETTINGS.lowercase),
    stopWords: bool(v.stopWords, DEFAULT_SETTINGS.stopWords),
    germanUmlauts: bool(v.germanUmlauts, DEFAULT_SETTINGS.germanUmlauts),
    symbols: bool(v.symbols, DEFAULT_SETTINGS.symbols),
    maxLength: typeof v.maxLength === "string" ? v.maxLength.slice(0, 5) : "",
    wholeWords: bool(v.wholeWords, DEFAULT_SETTINGS.wholeWords),
    unique: bool(v.unique, DEFAULT_SETTINGS.unique),
    baseUrl: typeof v.baseUrl === "string" ? v.baseUrl.slice(0, 200) : DEFAULT_SETTINGS.baseUrl,
  };
};

const MAX_LINES = 10_000;
const LIST_LIMIT = 200;

const EXAMPLE_SINGLE = "10 Tips for Baking Sourdough Bread at Home (A Beginner’s Guide) – 2026 Update!";
const EXAMPLE_BATCH = [
  "Café Crème Brûlée Recipe",
  "Größe & Gewicht: Ein Überblick",
  "Привет, мир! Как начать блог",
  "Καλημέρα κόσμε",
  "10 Tips for Baking Sourdough Bread at Home",
  "10 tips for baking sourdough bread at home",
  "Q&A: What’s New in Version 2.0?",
].join("\n");

const GRADE_INFO: Record<LengthGrade, { label: string; variant: "success" | "warning" | "danger"; note: string }> = {
  concise: { label: "Concise", variant: "success", note: "Short enough to read, say aloud and share in full." },
  long: { label: "A bit long", variant: "warning", note: "Consider removing filler words or setting a maximum length." },
  "very-long": { label: "Very long", variant: "danger", note: "Long URLs are hard to read, share and check. Try fewer words or a maximum length." },
};

function splitLines(text: string): string[] {
  const lines = text.split(/\r\n|\r|\n/);
  let end = lines.length;
  while (end > 0 && lines[end - 1].trim() === "") end--;
  return lines.slice(0, end);
}

export default function SlugGenerator() {
  const [text, setText] = usePersistentState("slug-generator:text", "");
  const [settings, setSettings] = usePersistentState<Settings>("slug-generator:settings", DEFAULT_SETTINGS, {
    storage: "local",
    serialize: serializeSettings,
    deserialize: parseSettings,
  });
  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  const batch = settings.mode === "batch";
  const max = parseMaxLength(settings.maxLength);
  const unicode = settings.charset === "unicode";

  const opts: SlugOptions = useMemo(
    () => ({
      separator: settings.separator,
      lowercase: settings.lowercase,
      removeStopWords: settings.stopWords,
      charset: settings.charset,
      germanUmlauts: settings.germanUmlauts,
      spellSymbols: settings.symbols,
      maxLength: max.value,
      wholeWords: settings.wholeWords,
    }),
    [settings.separator, settings.lowercase, settings.stopWords, settings.charset, settings.germanUmlauts, settings.symbols, max.value, settings.wholeWords],
  );

  const { rows, capped, lineCount } = useMemo(() => {
    const lines = splitLines(text);
    const nonBlank = lines.filter((l) => l.trim() !== "").length;
    if (batch) {
      const wasCapped = lines.length > MAX_LINES;
      const used = wasCapped ? lines.slice(0, MAX_LINES) : lines;
      return { rows: slugifyLines(used, opts, settings.unique), capped: wasCapped, lineCount: nonBlank };
    }
    const joined = text.trim();
    return { rows: joined ? slugifyLines([joined], opts, false) : ([] as BatchRow[]), capped: false, lineCount: nonBlank };
  }, [text, batch, opts, settings.unique]);

  const filled = rows.filter((r) => !r.blank);
  const converted = filled.filter((r) => r.slug);
  const emptyCount = filled.length - converted.length;
  const renamedCount = filled.filter((r) => r.renamed).length;
  const truncatedCount = filled.filter((r) => r.truncated).length;
  const stopRemoved = filled.reduce((sum, r) => sum + r.stopWordsRemoved, 0);
  const dropped = [...new Set(filled.flatMap((r) => r.dropped))];

  const slugText = rows.map((r) => r.slug).join("\n");
  const urlText = converted.map((r) => buildUrl(settings.baseUrl, r.slug)).join("\n");

  const one = !batch ? rows[0] : undefined;
  const slug = one?.slug ?? "";
  const urlPrefix = buildUrl(settings.baseUrl, "");
  const fullUrl = slug ? buildUrl(settings.baseUrl, slug) : "";
  const encoded = slug && fullUrl !== urlPrefix + slug;
  const grade = one ? gradeSlug(slug, one.words) : null;

  const longest = converted.reduce((best, r) => (charLength(r.slug) > charLength(best) ? r.slug : best), "");
  const shownRows = filled.slice(0, LIST_LIMIT);

  return (
    <ToolPanel>
      <Tabs<Mode>
        label="Slug mode"
        value={settings.mode}
        onChange={(mode) => set({ mode })}
        options={[
          { value: "single", label: "Single slug" },
          { value: "batch", label: "Batch (one per line)" },
        ]}
      />

      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2 md:grid-rows-[auto_1fr]">
        {/* Input */}
        <div className="flex flex-col gap-3 md:col-start-1 md:row-start-1">
          <Textarea
            label={batch ? "Titles, one per line" : "Title or text"}
            labelAddon={batch ? `${formatNumber(lineCount)} ${lineCount === 1 ? "line" : "lines"}` : `${formatNumber(text.length)} characters`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={batch ? "Paste a list of titles, one per line…" : "Type or paste a page title, e.g. 10 Tips for Baking Sourdough Bread at Home"}
            rows={batch ? 9 : 4}
            spellCheck={false}
          />
          <ToolActions>
            <Button variant="secondary" onClick={() => setText(batch ? EXAMPLE_BATCH : EXAMPLE_SINGLE)}>
              Load example
            </Button>
            <Button variant="secondary" onClick={() => setText("")} disabled={!text}>
              Clear
            </Button>
          </ToolActions>
          {!batch && lineCount > 1 && (
            <Alert variant="info" title={`Your text has ${lineCount} lines`}>
              Single mode joins them into one slug.{" "}
              <button type="button" onClick={() => set({ mode: "batch" })} className="font-medium text-primary underline underline-offset-2">
                Switch to batch mode
              </button>{" "}
              to get one slug per line.
            </Alert>
          )}
        </div>

        {/* Output */}
        <div className="flex min-w-0 flex-col gap-4 md:col-start-2 md:row-span-2 md:row-start-1">
          <ResultBox
            label={batch ? "Slugs (one per line)" : "Slug"}
            value={slugText}
            placeholder={batch ? "Your slugs appear here, one per input line" : "your-slug-appears-here"}
            mono
            copy={false}
            rows={batch ? Math.min(12, Math.max(6, rows.length + 1)) : 3}
          />
          <ToolActions>
            <CopyButton text={slugText} label={batch ? "Copy slugs" : "Copy slug"} variant="accent" disabled={!converted.length} />
            <CopyButton text={urlText} label={batch ? "Copy URLs" : "Copy URL"} variant="outline" disabled={!converted.length} />
            {batch && (
              <Button variant="secondary" disabled={!converted.length} onClick={() => downloadText(toCsv(rows, settings.baseUrl), "slugs.csv", "text/csv;charset=utf-8")}>
                Download CSV
              </Button>
            )}
          </ToolActions>

          {/* Messages */}
          {settings.mode === "single" && text.trim() !== "" && !slug && (
            <Alert variant="warning" title="No slug could be built">
              The text has no letters or numbers that can go in a URL{unicode ? "" : ". If it is written in another script, set Non-English letters to “Keep as Unicode letters”"}.
            </Alert>
          )}
          {batch && emptyCount > 0 && (
            <Alert variant="warning" title={`${formatNumber(emptyCount)} ${emptyCount === 1 ? "line" : "lines"} produced no slug`}>
              They contain no usable letters or numbers and are left blank in the output.
            </Alert>
          )}
          {dropped.length > 0 && (
            <Alert variant="warning" title="Some characters were skipped">
              No Latin equivalent is built in for {dropped.slice(0, 10).join(" ")}
              {dropped.length > 10 ? " and others" : ""}. Set Non-English letters to “Keep as Unicode letters” to keep them; browsers then percent-encode them in the address bar.
            </Alert>
          )}
          {capped && (
            <Alert variant="warning" title={`Only the first ${formatNumber(MAX_LINES)} lines were converted`}>
              Split larger lists into several batches.
            </Alert>
          )}
          {one?.onlyStopWords && (
            <Alert variant="info">Every word in this text is a stop word, so none were removed.</Alert>
          )}

          {/* Single: URL preview + stats */}
          {!batch && slug && (
            <>
              <div className="rounded-lg border border-border bg-surface-2 px-3.5 py-3">
                <p className="label-mono">URL preview</p>
                <p className="mt-1.5 break-all font-mono text-[13px] leading-relaxed text-fg-secondary">
                  {urlPrefix}
                  <span className="font-semibold text-fg">{slug}</span>
                </p>
                {encoded && (
                  <p className="mt-2 break-all font-mono text-xs leading-relaxed text-muted">
                    <span className="text-fg-secondary">Sent in the address bar:</span> {fullUrl}
                  </p>
                )}
              </div>
              {grade && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Badge variant={GRADE_INFO[grade].variant}>{GRADE_INFO[grade].label}</Badge>
                  <span className="text-xs text-muted">{GRADE_INFO[grade].note}</span>
                </div>
              )}
              <StatGrid className="sm:grid-cols-2 lg:grid-cols-2">
                <Stat label="Slug length" value={formatNumber(charLength(slug))} hint={one?.truncated ? "cut to your maximum" : "characters"} emphasis />
                <Stat label="Words" value={formatNumber(one?.words ?? 0)} hint={settings.stopWords ? `${one?.stopWordsRemoved ?? 0} stop words removed` : "in the slug"} />
                <Stat label="Full URL" value={formatNumber(fullUrl.length)} hint={encoded ? "characters, encoded" : "characters"} />
                <Stat label="Words in input" value={formatNumber(text.trim() ? text.trim().split(/\s+/).length : 0)} hint="before cleanup" />
              </StatGrid>
            </>
          )}

          {/* Batch: summary + list */}
          {batch && converted.length > 0 && (
            <>
              <StatGrid className="sm:grid-cols-2 lg:grid-cols-2">
                <Stat label="Slugs" value={formatNumber(converted.length)} hint={emptyCount ? `${formatNumber(emptyCount)} blank` : "all lines converted"} emphasis />
                <Stat label="Longest" value={formatNumber(charLength(longest))} hint="characters" />
                <Stat label="Duplicates fixed" value={formatNumber(renamedCount)} hint={settings.unique ? "suffix added" : "option is off"} />
                <Stat label={settings.stopWords ? "Stop words removed" : "Cut to length"} value={formatNumber(settings.stopWords ? stopRemoved : truncatedCount)} hint={settings.stopWords ? "across all lines" : "slugs shortened"} />
              </StatGrid>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border" aria-label="Converted slugs">
                {shownRows.map((r, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 px-3.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted" title={r.input}>
                        {r.input}
                      </p>
                      <p className={cn("break-all font-mono text-[13px]", r.slug ? "text-fg" : "text-muted")}>{r.slug || "(no slug)"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge>{charLength(r.slug)}</Badge>
                      {r.renamed && <Badge variant="primary">renamed</Badge>}
                      {r.truncated && <Badge variant="outline">cut</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
              {filled.length > LIST_LIMIT && (
                <p className="text-xs text-muted">
                  Showing the first {LIST_LIMIT} of {formatNumber(filled.length)} lines. The output box, Copy buttons and CSV include every line.
                </p>
              )}
            </>
          )}
        </div>

        {/* Options */}
        <ToolSection title="Options" description="Results update as you change them. Settings are remembered in this browser." className="md:col-start-1 md:row-start-2">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Select
              label="Separator"
              value={settings.separator}
              onChange={(e) => set({ separator: e.target.value === "_" ? "_" : "-" })}
              options={[
                { value: "-", label: "Hyphen ( - )" },
                { value: "_", label: "Underscore ( _ )" },
              ]}
              hint="Google recommends hyphens between words."
            />
            <Select
              label="Non-English letters"
              value={settings.charset}
              onChange={(e) => set({ charset: e.target.value === "unicode" ? "unicode" : "transliterate" })}
              options={[
                { value: "transliterate", label: "Convert to A–Z" },
                { value: "unicode", label: "Keep as Unicode letters" },
              ]}
              hint={unicode ? "Kept letters are percent-encoded in the address bar." : "é becomes e and Привет becomes privet."}
            />
            <Input
              label="Maximum length"
              value={settings.maxLength}
              onChange={(e) => set({ maxLength: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })}
              inputMode="numeric"
              placeholder="No limit"
              suffix="chars"
              error={max.error}
              hint={max.error ? undefined : "Leave empty for no limit. Try 50 to 75."}
              autoComplete="off"
            />
            <Input
              label="Base URL for the preview"
              value={settings.baseUrl}
              onChange={(e) => set({ baseUrl: e.target.value.slice(0, 200) })}
              placeholder="https://example.com/blog/"
              hint="Used in the preview, Copy URL and CSV. Nothing is fetched."
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Toggle checked={settings.lowercase} onChange={(lowercase) => set({ lowercase })} label="Lowercase" description="Recommended: URL paths are case-sensitive." />
            <Toggle checked={settings.stopWords} onChange={(stopWords) => set({ stopWords })} label="Remove stop words" description="Drops English filler such as the, and, of, to." />
            <Toggle
              checked={settings.germanUmlauts}
              onChange={(germanUmlauts) => set({ germanUmlauts })}
              label="German umlaut spelling"
              description="ä → ae, ö → oe, ü → ue instead of a, o, u."
              disabled={unicode}
            />
            <Toggle checked={settings.symbols} onChange={(symbols) => set({ symbols })} label="Spell out & @ % +" description="& becomes and, @ becomes at, % becomes percent, + becomes plus." />
            <Toggle
              checked={settings.wholeWords}
              onChange={(wholeWords) => set({ wholeWords })}
              label="Cut at a whole word"
              description="When over the maximum, end on a complete word."
              disabled={max.value === null}
            />
            <Toggle
              checked={settings.unique}
              onChange={(unique) => set({ unique })}
              label="Make duplicates unique"
              description="Batch mode: repeated slugs get a number suffix: -2, -3 and so on."
              disabled={!batch}
            />
          </div>
        </ToolSection>
      </div>
    </ToolPanel>
  );
}
