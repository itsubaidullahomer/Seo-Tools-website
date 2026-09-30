"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Download, RotateCcw } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Button, CopyButton, Input, Select, Stat, StatGrid, Tabs, Textarea, ToolActions, ToolPanel, ToolSection } from "@/components/ui";
import { cn, downloadText } from "@/lib/utils";
import {
  DEFAULT_SETTINGS,
  FONTS,
  MARGINS,
  PAPERS,
  PARAGRAPH_STYLES,
  SIZES,
  SPACINGS,
  describeSettings,
  formatCount,
  formatInt,
  formatPages,
  geometry,
  lookupTable,
  normalizeSettings,
  pagesForWords,
  paginateAllSpacings,
  paragraphLineCounts,
  parseCustomWpp,
  parsePages,
  parseWords,
  pluralPages,
  roundWords,
  spacingColumns,
  splitParagraphs,
  textAreaInches,
  wholePages,
  wordsForPages,
  type LayoutSettings,
  type PageGeometry,
  type Parsed,
  type SpacingColumn,
  type SpacingId,
} from "./layout";
import { REFERENCE_PARAGRAPHS } from "./reference";

type Mode = "words" | "pages" | "text";
type TableKind = "words" | "pages";

const MODES: Mode[] = ["words", "pages", "text"];
const MODE_OPTIONS = [
  { value: "words" as const, label: "Words to pages" },
  { value: "pages" as const, label: "Pages to words" },
  { value: "text" as const, label: "Paste text" },
];
const TABLE_OPTIONS = [
  { value: "words" as const, label: "Words to pages" },
  { value: "pages" as const, label: "Pages to words" },
];

/** Pasted text above this length is not laid out line by line (the browser tab would stall). */
const MAX_TEXT_CHARS = 1_000_000;

const SAMPLE_TEXT = REFERENCE_PARAGRAPHS.join("\n");

/* ------------------------------------------------------------------ */
/* View model: one plain object per mode, rendered by shared pieces.    */
/* ------------------------------------------------------------------ */

interface CompareRow {
  id: SpacingId;
  label: string;
  wpp: string;
  result: string;
}

interface View {
  status: "empty" | "invalid" | "ok";
  message?: string;
  headline?: string;
  sub?: string;
  copy?: string;
  /** Fractional page count for the page strip. */
  strip?: number;
  stats?: { label: string; value: string; hint?: string; emphasis?: boolean }[];
  compareHeader?: string;
  compare?: CompareRow[];
  note?: string;
}

interface Ctx {
  settings: LayoutSettings;
  overrideWpp?: number;
  columns: SpacingColumn[];
  wpp: number;
  geo: PageGeometry;
}

const spacingShort = (id: SpacingId) => SPACINGS.find((s) => s.id === id)?.short ?? id;

function settingsLine(ctx: Ctx): string {
  return ctx.overrideWpp ? `custom ${formatCount(ctx.overrideWpp)} words per page` : describeSettings(ctx.settings);
}

function layoutStats(ctx: Ctx): { label: string; value: string; hint?: string }[] {
  const area = textAreaInches(ctx.settings);
  return [
    { label: "Words per page", value: formatInt(ctx.wpp), hint: ctx.overrideWpp ? "your custom figure" : `${spacingShort(ctx.settings.spacing).toLowerCase()} spacing` },
    { label: "Lines per page", value: String(ctx.geo.linesPerPage) },
    { label: "Text area", value: `${formatCount(area.width)} × ${formatCount(area.height)}`, hint: "inches inside the margins" },
  ];
}

function wordsView(parsed: Parsed, ctx: Ctx): View {
  if (parsed.kind === "invalid") return { status: "invalid" };
  if (parsed.kind === "empty" || parsed.value === 0) return { status: "empty", message: "Enter a word count above zero to see how many pages it fills." };
  const n = parsed.value;
  const pages = pagesForWords(n, ctx.wpp);
  const sheets = wholePages(pages);
  const stats = ctx.overrideWpp
    ? [{ label: "Whole pages", value: formatInt(sheets), hint: "rounded up", emphasis: true }, { label: "Words per page", value: formatInt(ctx.wpp), hint: "your custom figure" }]
    : [{ label: "Whole pages", value: formatInt(sheets), hint: "rounded up", emphasis: true }, ...layoutStats(ctx)];
  const view: View = {
    status: "ok",
    headline: `${formatPages(pages)} ${pluralPages(pages)}`,
    sub: `${formatInt(n)} ${n === 1 ? "word" : "words"} · ${settingsLine(ctx)}`,
    copy: `${formatInt(n)} ${n === 1 ? "word" : "words"} = ${formatPages(pages)} ${pluralPages(pages)} (${settingsLine(ctx)})`,
    strip: pages,
    stats,
    compareHeader: "Pages",
    compare: ctx.overrideWpp
      ? undefined
      : ctx.columns.map((c) => ({ id: c.id, label: c.short, wpp: formatInt(c.wpp), result: formatPages(pagesForWords(n, c.wpp)) })),
    note: ctx.overrideWpp
      ? undefined
      : `The classic shortcut of 500 words per single-spaced page and 250 per double-spaced page gives ${formatPages(n / 500)} and ${formatPages(n / 250)} pages.`,
  };
  return view;
}

function pagesView(parsed: Parsed, ctx: Ctx): View {
  if (parsed.kind === "invalid") return { status: "invalid" };
  if (parsed.kind === "empty" || parsed.value === 0) return { status: "empty", message: "Enter a page count above zero to see how many words it holds." };
  const n = parsed.value;
  const words = roundWords(wordsForPages(n, ctx.wpp));
  const pagesText = `${formatCount(n)} ${n === 1 ? "page" : "pages"}`;
  const area = textAreaInches(ctx.settings);
  const paper = PAPERS.find((p) => p.id === ctx.settings.paper) ?? PAPERS[0];
  return {
    status: "ok",
    headline: `≈ ${formatInt(words)} ${words === 1 ? "word" : "words"}`,
    sub: `${pagesText} · ${settingsLine(ctx)}`,
    copy: `${pagesText} ≈ ${formatInt(words)} words (${settingsLine(ctx)})`,
    strip: n,
    stats: ctx.overrideWpp
      ? [{ label: "Words per page", value: formatInt(ctx.wpp), hint: "your custom figure", emphasis: true }]
      : [
          { label: "Words per page", value: formatInt(ctx.wpp), hint: `${spacingShort(ctx.settings.spacing).toLowerCase()} spacing`, emphasis: true },
          { label: "Lines per page", value: String(ctx.geo.linesPerPage) },
          { label: "Text area", value: `${formatCount(area.width)} × ${formatCount(area.height)}`, hint: "inches inside the margins" },
          { label: "Paper", value: paper.label, hint: paper.size },
        ],
    compareHeader: "Words",
    compare: ctx.overrideWpp
      ? undefined
      : ctx.columns.map((c) => ({ id: c.id, label: c.short, wpp: formatInt(c.wpp), result: formatInt(roundWords(wordsForPages(n, c.wpp))) })),
    note: "Answers are rounded because a page count is an estimate, not an exact measure.",
  };
}

interface TextInfo {
  words: number;
  paragraphs: number;
  huge: boolean;
  lineCounts: number[];
}

function textView(info: TextInfo, ctx: Ctx, perSpacing: ReturnType<typeof paginateAllSpacings> | null): View {
  if (info.words === 0) return { status: "empty", message: "Paste or type your text to measure how many pages it fills." };
  const { words } = info;
  const wordsText = `${formatInt(words)} ${words === 1 ? "word" : "words"}`;
  const paraText = info.huge ? "" : ` · ${formatInt(info.paragraphs)} ${info.paragraphs === 1 ? "paragraph" : "paragraphs"}`;
  const selected = perSpacing?.find((p) => p.id === ctx.settings.spacing)?.pagination;

  // Custom words-per-page, or text too long to lay out: fall back to the word count.
  if (ctx.overrideWpp || info.huge || !selected) {
    const wpp = ctx.overrideWpp ?? ctx.wpp;
    const pages = pagesForWords(words, wpp);
    return {
      status: "ok",
      headline: `${formatPages(pages)} ${pluralPages(pages)}`,
      sub: `${wordsText}${paraText} · ${ctx.overrideWpp ? settingsLine(ctx) : `estimated at ${formatInt(wpp)} words per page`}`,
      copy: `${wordsText} = ${formatPages(pages)} ${pluralPages(pages)} (${ctx.overrideWpp ? settingsLine(ctx) : describeSettings(ctx.settings)})`,
      strip: pages,
      stats: [
        { label: "Whole pages", value: formatInt(wholePages(pages)), hint: "rounded up", emphasis: true },
        { label: "Words", value: formatInt(words) },
        { label: "Words per page", value: formatInt(wpp), hint: ctx.overrideWpp ? "your custom figure" : "from the word count" },
      ],
    };
  }

  const p = selected;
  return {
    status: "ok",
    headline: `${formatPages(p.pages)} ${pluralPages(p.pages)}`,
    sub: `${wordsText}${paraText} · ${describeSettings(ctx.settings)}`,
    copy: `${wordsText} = ${formatPages(p.pages)} ${pluralPages(p.pages)} (${describeSettings(ctx.settings)})`,
    strip: p.pages,
    stats: [
      { label: "Whole pages", value: formatInt(p.sheets), hint: "rounded up", emphasis: true },
      { label: "Words", value: formatInt(words) },
      { label: "Paragraphs", value: formatInt(info.paragraphs) },
      { label: "Lines", value: formatInt(p.lines), hint: `${ctx.geo.linesPerPage} lines fit a page` },
    ],
    compareHeader: "Pages",
    compare: (perSpacing ?? []).map((s) => ({
      id: s.id,
      label: s.short,
      wpp: s.pagination.pages > 0 ? formatInt(words / s.pagination.pages) : "–",
      result: formatPages(s.pagination.pages),
    })),
    note: "Measured from your text: every line break starts a new paragraph, blank lines are ignored.",
  };
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                          */
/* ------------------------------------------------------------------ */

const STRIP_MAX = 12;

function PageStrip({ pages, aspect }: { pages: number; aspect: number }) {
  const total = wholePages(pages);
  const shown = Math.min(total, STRIP_MAX);
  const fullPages = Math.floor(pages + 1e-9);
  const partial = Math.max(0, pages - fullPages);
  const items = Array.from({ length: shown }, (_, i) => (i < fullPages ? 1 : partial));
  const percent = Math.max(1, Math.round(partial * 100));
  const label =
    fullPages === 0
      ? `${percent} percent of one page`
      : partial > 1e-6
        ? `${fullPages} full ${fullPages === 1 ? "page" : "pages"} and ${percent} percent of the next`
        : `${fullPages} full ${fullPages === 1 ? "page" : "pages"}`;
  return (
    <div role="img" aria-label={label} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-end gap-1.5" aria-hidden>
        {items.map((fill, i) => (
          <div key={i} className="relative w-7 overflow-hidden rounded-[3px] border border-border-strong bg-surface" style={{ aspectRatio: `1 / ${aspect}` }}>
            <div className="absolute inset-x-0 top-0 bg-primary/35" style={{ height: `${Math.round(fill * 100)}%` }} />
          </div>
        ))}
        {total > STRIP_MAX && <span className="pb-1 text-xs text-muted">+{formatInt(total - STRIP_MAX)} more</span>}
      </div>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function DataTable({ header, selectedColumn, rows, caption }: { header: string[]; selectedColumn: number; rows: { label: string; cells: string[] }[]; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            {header.map((h, i) => (
              <th key={h} scope="col" className={cn("px-3 py-2 font-medium", i > 0 && "text-right", i === selectedColumn && "text-primary")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="px-3 py-2 text-left font-medium tabular-nums text-fg">
                {r.label}
              </th>
              {r.cells.map((c, i) => (
                <td key={i} className={cn("px-3 py-2 text-right tabular-nums", i + 1 === selectedColumn ? "bg-primary-soft font-semibold text-primary" : "text-fg-secondary")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompareTable({ header, rows, selected }: { header: string; rows: CompareRow[]; selected: SpacingId }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm" data-testid="compare">
        <caption className="sr-only">Same document at each line spacing</caption>
        <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Line spacing
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Words per page
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              {header}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className={r.id === selected ? "bg-primary-soft" : undefined} data-selected={r.id === selected ? "true" : undefined}>
              <th scope="row" className={cn("px-3 py-2 text-left font-medium", r.id === selected ? "text-primary" : "text-fg")}>
                {r.label}
              </th>
              <td className="px-3 py-2 text-right tabular-nums text-fg-secondary">{r.wpp}</td>
              <td className={cn("px-3 py-2 text-right tabular-nums", r.id === selected ? "font-semibold text-primary" : "text-fg-secondary")}>{r.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex min-w-0 flex-col gap-4", className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Tool                                                                 */
/* ------------------------------------------------------------------ */

export default function WordsToPages() {
  const [modeRaw, setMode] = usePersistentState<string>("words-to-pages:mode", "words");
  const [wordsRaw, setWords] = usePersistentState<string>("words-to-pages:words", "1000");
  const [pagesRaw, setPages] = usePersistentState<string>("words-to-pages:pages", "5");
  const [textRaw, setText] = usePersistentState<string>("words-to-pages:text", "");
  const [customRaw, setCustom] = usePersistentState<string>("words-to-pages:custom-wpp", "");
  const [stored, setStored] = usePersistentState<LayoutSettings>("words-to-pages:settings:v1", DEFAULT_SETTINGS, { storage: "local" });
  const [tablePref, setTablePref] = useState<TableKind | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Stored values come from browser storage and may be stale or hand-edited.
  const mode: Mode = MODES.includes(modeRaw as Mode) ? (modeRaw as Mode) : "words";
  const words = typeof wordsRaw === "string" ? wordsRaw : "";
  const pages = typeof pagesRaw === "string" ? pagesRaw : "";
  const text = typeof textRaw === "string" ? textRaw : "";
  const customText = typeof customRaw === "string" ? customRaw : "";
  const settings = useMemo(() => normalizeSettings(stored), [stored]);

  const setSetting = <K extends keyof LayoutSettings>(key: K, value: LayoutSettings[K]) =>
    setStored((prev) => ({ ...normalizeSettings(prev), [key]: value }));

  // The lookup table follows the calculator mode until the visitor picks a table explicitly.
  const tableKind: TableKind = tablePref ?? (mode === "pages" ? "pages" : "words");

  const custom = parseCustomWpp(customText);
  const overrideWpp = custom.kind === "ok" ? custom.value : undefined;
  const columns = useMemo(() => spacingColumns(settings, overrideWpp), [settings, overrideWpp]);
  const geo = useMemo(() => geometry(settings), [settings]);
  const wpp = (columns.find((c) => c.id === settings.spacing) ?? columns[0]).wpp;
  const ctx: Ctx = { settings, overrideWpp, columns, wpp, geo };

  // Paste-text mode: wrap once per typeface/margin combination, paginate per spacing.
  const huge = text.length > MAX_TEXT_CHARS;
  const paragraphs = useMemo(() => (mode === "text" && !huge ? splitParagraphs(text) : []), [mode, huge, text]);
  const lineCounts = useMemo(
    () =>
      paragraphLineCounts(paragraphs, {
        font: settings.font,
        sizePt: settings.sizePt,
        spacing: "single",
        marginIn: settings.marginIn,
        paper: settings.paper,
        paragraphStyle: settings.paragraphStyle,
      }),
    [paragraphs, settings.font, settings.sizePt, settings.marginIn, settings.paper, settings.paragraphStyle],
  );
  const textWords = useMemo(() => {
    if (mode !== "text") return 0;
    if (huge) return text.trim() ? text.trim().split(/\s+/).length : 0;
    return paragraphs.reduce((n, p) => n + p.length, 0);
  }, [mode, huge, text, paragraphs]);
  const perSpacing = useMemo(
    () => (mode === "text" && !huge && textWords > 0 ? paginateAllSpacings(lineCounts, settings) : null),
    [mode, huge, textWords, lineCounts, settings],
  );

  const shortLines = mode === "text" && !huge && paragraphs.length >= 8 && textWords / paragraphs.length < 14;

  const parsedWords = parseWords(words);
  const parsedPages = parsePages(pages);

  const view: View =
    mode === "words"
      ? wordsView(parsedWords, ctx)
      : mode === "pages"
        ? pagesView(parsedPages, ctx)
        : textView({ words: textWords, paragraphs: paragraphs.length, huge, lineCounts }, ctx, perSpacing);

  const table = useMemo(() => lookupTable(tableKind, settings, overrideWpp), [tableKind, settings, overrideWpp]);
  const tableText = [table.header.join("\t"), ...table.rows.map((r) => [r.label, ...r.cells].join("\t"))].join("\n");
  const tableCsv = [table.header.join(","), ...table.rows.map((r) => [r.label, ...r.cells].map((c) => c.replace(/,/g, "")).join(","))].join("\n");
  const paper = PAPERS.find((p) => p.id === settings.paper) ?? PAPERS[0];
  const settingsChanged = JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS) || customText !== "";

  return (
    <ToolPanel>
      <Tabs label="Calculator mode" value={mode} onChange={setMode} options={MODE_OPTIONS} className="self-start [&>button]:px-2.5 max-[380px]:[&>button]:px-1.5 sm:[&>button]:px-3.5" />

      <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
        {/* 1. Input */}
        <Block className="lg:col-start-1 lg:row-start-1">
          {mode === "words" && (
            <Input
              label="Number of words"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="1000"
              suffix="words"
              hint="Type a count such as 1000, 1,500 or 80k."
              error={parsedWords.kind === "invalid" ? parsedWords.hint : undefined}
            />
          )}
          {mode === "pages" && (
            <Input
              label="Number of pages"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="5"
              suffix="pages"
              hint="Decimals work: 2.5 means two and a half pages."
              error={parsedPages.kind === "invalid" ? parsedPages.hint : undefined}
            />
          )}
          {mode === "text" && (
            <>
              <Textarea
                ref={textareaRef}
                label="Your text"
                labelAddon={`${formatInt(textWords)} ${textWords === 1 ? "word" : "words"}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your essay, article or chapter here. Pages are measured from the real line breaks and paragraphs of your text…"
                rows={9}
              />
              <ToolActions>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      setText(await navigator.clipboard.readText());
                    } catch {
                      /* clipboard blocked: the user can paste with the keyboard */
                    }
                    textareaRef.current?.focus();
                  }}
                >
                  Paste
                </Button>
                <Button variant="secondary" onClick={() => setText(SAMPLE_TEXT)}>
                  Sample text
                </Button>
                <Button variant="secondary" onClick={() => setText("")} disabled={!text}>
                  Clear
                </Button>
              </ToolActions>
              {shortLines && (
                <Alert variant="info" title="Lots of short paragraphs">
                  Your text has {formatInt(paragraphs.length)} paragraphs averaging {Math.round(textWords / paragraphs.length)} words. If it came from a PDF or an email that breaks every line, remove the line breaks first with the{" "}
                  <Link href="/tools/remove-line-breaks" className="font-medium text-fg underline underline-offset-2">
                    remove line breaks tool
                  </Link>
                  , or the page count will be too high. Lists and poems can be ignored.
                </Alert>
              )}
              {huge && (
                <Alert variant="warning" title="Very long text">
                  This text has more than 1 million characters, so pages are estimated from the word count and the words-per-page figure instead of measured line by line.
                </Alert>
              )}
            </>
          )}
        </Block>

        {/* 2. Headline answer (right column on desktop, directly under the input on mobile) */}
        <Block className="lg:col-start-2 lg:row-start-1">
          {view.status === "ok" ? (
            <div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary-soft px-4 py-3.5" aria-live="polite">
              <div className="flex items-start justify-between gap-3">
                <output className="min-w-0 break-words text-3xl font-semibold tabular-nums tracking-tight text-primary" data-testid="result">
                  {view.headline}
                </output>
                <CopyButton text={view.copy ?? ""} label="Copy result" size="sm" variant="secondary" className="shrink-0" />
              </div>
              <p className="text-sm text-fg-secondary" data-testid="result-sub">
                {view.sub}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface-2 px-4 py-4 text-sm text-muted" aria-live="polite" data-testid="result-empty">
              {view.status === "invalid" ? "Fix the highlighted field to see the result." : view.message}
            </div>
          )}
        </Block>

        {/* 3. Document settings */}
        <Block className="lg:col-start-1 lg:row-start-2">
          <ToolSection title="Document format" description="Match these to your document. Everything updates live." className="gap-3 pt-4">
            <div className="grid grid-cols-6 gap-3">
              <Select
                label="Typeface"
                value={settings.font}
                onChange={(e) => setSetting("font", e.target.value as LayoutSettings["font"])}
                options={FONTS.map((f) => ({ value: f.id, label: f.label }))}
                containerClassName="col-span-4 min-w-0"
              />
              <Select
                label="Font size"
                value={String(settings.sizePt)}
                onChange={(e) => setSetting("sizePt", Number(e.target.value))}
                options={SIZES.map((s) => ({ value: String(s), label: `${s} pt` }))}
                containerClassName="col-span-2 min-w-0"
              />
              <Select
                label="Line spacing"
                value={settings.spacing}
                onChange={(e) => setSetting("spacing", e.target.value as SpacingId)}
                options={SPACINGS.map((s) => ({ value: s.id, label: s.label }))}
                containerClassName="col-span-3 min-w-0"
              />
              <Select
                label="Margins (all sides)"
                value={String(settings.marginIn)}
                onChange={(e) => setSetting("marginIn", Number(e.target.value))}
                options={MARGINS.map((m) => ({ value: String(m.value), label: m.label }))}
                containerClassName="col-span-3 min-w-0"
              />
              <Select
                label="Paper"
                value={settings.paper}
                onChange={(e) => setSetting("paper", e.target.value as LayoutSettings["paper"])}
                options={PAPERS.map((p) => ({ value: p.id, label: p.label }))}
                containerClassName="col-span-3 min-w-0"
              />
              <Input
                label="Words per page (optional)"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                value={customText}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="auto"
                error={custom.kind === "invalid" ? custom.hint : undefined}
                containerClassName="col-span-3 min-w-0"
              />
              <Select
                label="Paragraph style"
                value={settings.paragraphStyle}
                onChange={(e) => setSetting("paragraphStyle", e.target.value as LayoutSettings["paragraphStyle"])}
                options={PARAGRAPH_STYLES.map((p) => ({ value: p.id, label: p.label }))}
                containerClassName="col-span-6 min-w-0"
              />
            </div>
            <p className="text-xs text-muted">
              A custom words-per-page figure, such as the one in your assignment brief, replaces the layout model.
            </p>
            <ToolActions>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}
                onClick={() => {
                  setStored(DEFAULT_SETTINGS);
                  setCustom("");
                }}
                disabled={!settingsChanged}
              >
                Reset format
              </Button>
            </ToolActions>
          </ToolSection>
        </Block>

        {/* 4. Detail: stats, page strip, comparison */}
        <Block className="lg:col-start-2 lg:row-start-2">
          {view.status === "ok" && (
            <>
              {view.stats && <StatGrid className="sm:grid-cols-2 lg:grid-cols-2">{view.stats.map((s) => <Stat key={s.label} label={s.label} value={s.value} hint={s.hint} emphasis={s.emphasis} />)}</StatGrid>}
              {view.strip !== undefined && <PageStrip pages={view.strip} aspect={paper.heightIn / paper.widthIn} />}
              {view.compare && view.compareHeader && <CompareTable header={view.compareHeader} rows={view.compare} selected={settings.spacing} />}
              {view.note && <p className="text-xs text-muted">{view.note}</p>}
            </>
          )}
        </Block>
      </div>

      <ToolSection
        title="Lookup table"
        description={`Common lengths at the format above (${overrideWpp ? `custom ${formatCount(overrideWpp)} words per page` : describeSettings(settings)}). The table and the calculator use the same calculation.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Tabs label="Table type" size="sm" value={tableKind} onChange={setTablePref} options={TABLE_OPTIONS} />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <CopyButton text={tableText} label="Copy table" size="sm" variant="secondary" />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" aria-hidden />}
              onClick={() => downloadText(tableCsv, tableKind === "words" ? "words-to-pages.csv" : "pages-to-words.csv", "text/csv;charset=utf-8")}
            >
              Download CSV
            </Button>
          </div>
        </div>
        <div data-testid="lookup">
          <DataTable
            header={table.header}
            selectedColumn={table.selectedColumn}
            rows={table.rows}
            caption={tableKind === "words" ? "Pages for common word counts at each line spacing" : "Words for common page counts at each line spacing"}
          />
        </div>
      </ToolSection>

      <p className="text-xs text-muted">
        Estimates for ordinary English prose. Headings, block quotes, tables, images, hyphenation and widow control change a real document&apos;s page count, so check the final number in your own word processor before a deadline. Your text stays in your browser.
      </p>
    </ToolPanel>
  );
}
