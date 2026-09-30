"use client";

import { useDeferredValue, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Input, Select, Stat, StatGrid, Tabs, Textarea, Toggle, ToolActions, ToolGrid, ToolPanel, ToolSection } from "@/components/ui";
import { downloadText, formatNumber } from "@/lib/utils";
import { analyzeBulk, filterResults, BULK_EXAMPLE, parseBulk, resultsToCsv, type BulkFilter, type BulkResult, type RowStatus } from "./bulk";
import { getCanvasMeasurer } from "./canvas";
import { DEFAULT_LIMITS, FONT_PX, MAX_BULK_FILE_BYTES, MAX_BULK_ROWS, MAX_FIELD_CHARS, sanitizeLimits, type Device, type Limits } from "./limits";
import {
  SEPARATORS,
  analyzeField,
  analyzeKeyword,
  composeTitle,
  descriptionChecks,
  extractFromHtml,
  metaDescriptionTag,
  pixelWidth,
  roomForPageTitle,
  titleChecks,
  titleTag,
  type BrandPosition,
} from "./logic";
import { CheckList, CutLine, EmptyNotice, FitBadges, KeywordTrack, LimitsPanel, ResultStats, SnippetPreview, WidthMeter } from "./parts";

type TabId = "title" | "description" | "bulk";

const TAB_OPTIONS: { value: TabId; label: string }[] = [
  { value: "title", label: "Title tag" },
  { value: "description", label: "Meta description" },
  { value: "bulk", label: "Bulk check" },
];
const DEVICE_OPTIONS: { value: Device; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
];
const POSITION_OPTIONS = [
  { value: "suffix", label: "After the title" },
  { value: "prefix", label: "Before the title" },
];

const EXAMPLE_TITLE = "How to Write a Meta Description That Gets Clicks: A Complete Step-by-Step Guide With Real Examples and Templates";
const EXAMPLE_DESCRIPTION = "Learn how to write a meta description that fits its width limit, reads naturally and earns the click. Pixel budgets, examples and a checklist.";
const EXAMPLE_KEYWORD = "meta description";

/** Average letter width of ordinary title text, used to turn pixels into a rough character count. */
const SAMPLE_TITLE_AVG_PX = pixelWidth("how to choose the right garden hose for your yard", FONT_PX.title) / "how to choose the right garden hose for your yard".length;

const TABS_IDS: TabId[] = ["title", "description", "bulk"];

/* The active tab lives in the URL hash (#title, #description, #bulk) so links can open a specific tab. */
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const readHash = () => window.location.hash.replace(/^#/, "");
const serverHash = () => "";
const noopSubscribe = () => () => {};
const serverMeasurer = () => null;

const clip = (s: string) => (s.length > MAX_FIELD_CHARS ? s.slice(0, MAX_FIELD_CHARS) : s);

async function readClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}

const STATUS_VARIANT: Record<RowStatus, "success" | "warning" | "danger"> = { pass: "success", warn: "warning", fail: "danger" };
const FIELD_LABEL = { empty: "missing", short: "short", long: "too long", good: "ok" } as const;

export default function TitleMetaDescriptionLengthChecker() {
  const hash = useSyncExternalStore(subscribeHash, readHash, serverHash);
  const tab: TabId = (TABS_IDS as string[]).includes(hash) ? (hash as TabId) : "title";
  const setTab = (t: TabId) => {
    history.replaceState(null, "", `#${t}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  const measurerFn = useSyncExternalStore(noopSubscribe, getCanvasMeasurer, serverMeasurer);
  const measurer = measurerFn ?? undefined;
  const [year] = useState(() => new Date().getFullYear());

  const [device, setDevice] = usePersistentState<Device>("title-meta-checker:device", "desktop", { storage: "local" });
  const [limitsRaw, setLimitsRaw] = usePersistentState<Limits>("title-meta-checker:limits", DEFAULT_LIMITS, { storage: "local" });
  const [title, setTitle] = usePersistentState("title-meta-checker:title", "");
  const [description, setDescription] = usePersistentState("title-meta-checker:description", "");
  const [keyword, setKeyword] = usePersistentState("title-meta-checker:keyword", "");
  const [pageUrl, setPageUrl] = usePersistentState("title-meta-checker:url", "");
  const [brand, setBrand] = usePersistentState("title-meta-checker:brand", "");
  const [separator, setSeparator] = usePersistentState("title-meta-checker:separator", " | ");
  const [brandPosition, setBrandPosition] = usePersistentState<BrandPosition>("title-meta-checker:brand-position", "suffix");
  const [brandOn, setBrandOn] = usePersistentState("title-meta-checker:brand-on", false);
  const [bulkText, setBulkText] = usePersistentState("title-meta-checker:bulk", "");

  const limits = useMemo(() => sanitizeLimits(limitsRaw), [limitsRaw]);

  /* ----------------------------- title & description ----------------------------- */
  const titleSource = useMemo(() => extractFromHtml(clip(title), "title"), [title]);
  const descriptionSource = useMemo(() => extractFromHtml(clip(description), "description"), [description]);
  const finalTitle = useMemo(
    () => (brandOn ? composeTitle(titleSource.text, brand, separator, brandPosition) : titleSource.text),
    [brandOn, titleSource.text, brand, separator, brandPosition],
  );
  const titleRes = useMemo(() => analyzeField(finalTitle, "title", device, limits, measurer), [finalTitle, device, limits, measurer]);
  const plainTitleRes = useMemo(() => analyzeField(titleSource.text, "title", device, limits, measurer), [titleSource.text, device, limits, measurer]);
  const descRes = useMemo(() => analyzeField(descriptionSource.text, "description", device, limits, measurer), [descriptionSource.text, device, limits, measurer]);
  const titleKeyword = useMemo(() => analyzeKeyword(titleRes, keyword, measurer), [titleRes, keyword, measurer]);
  const descKeyword = useMemo(() => analyzeKeyword(descRes, keyword, measurer), [descRes, keyword, measurer]);
  const titleCheckList = useMemo(
    () => titleChecks(titleRes, { keyword: titleKeyword, brand: brandOn ? brand : "", year }),
    [titleRes, titleKeyword, brandOn, brand, year],
  );
  const descCheckList = useMemo(() => descriptionChecks(descRes, { keyword: descKeyword, title: titleRes.text }), [descRes, descKeyword, titleRes.text]);

  const brandRoom = roomForPageTitle(brand, separator, limits.title[device], FONT_PX.title, measurer);
  const pageTitleAvg = plainTitleRes.chars ? plainTitleRes.avgCharPx : SAMPLE_TITLE_AVG_PX;
  const brandTaken = limits.title[device] - brandRoom;

  const setFromClipboard = async (setter: (v: string) => void) => {
    const text = await readClipboard();
    if (text !== null) setter(text);
  };

  /* ---------------------------------- bulk ---------------------------------- */
  const deferredBulk = useDeferredValue(bulkText);
  const parsed = useMemo(() => parseBulk(deferredBulk), [deferredBulk]);
  const bulk = useMemo(() => analyzeBulk(parsed.rows, device, limits, year, measurer), [parsed.rows, device, limits, year, measurer]);
  const [bulkFilter, setBulkFilter] = useState<BulkFilter>("all");
  const [bulkShown, setBulkShown] = useState(100);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => filterResults(bulk.results, bulkFilter), [bulk.results, bulkFilter]);
  const csv = useMemo(() => (bulk.results.length ? resultsToCsv(bulk.results, device) : ""), [bulk.results, device]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BULK_FILE_BYTES) {
      setBulkError(`${file.name} is larger than ${Math.round(MAX_BULK_FILE_BYTES / 1024 / 1024)} MB. Split the export into smaller files.`);
      return;
    }
    try {
      const text = (await file.text()).replace(/^﻿/, "");
      setBulkText(text);
      setBulkError(null);
      setBulkFilter("all");
      setBulkShown(100);
    } catch {
      setBulkError("That file could not be read as text. Export it as CSV and try again.");
    }
  };

  const titleClipped = title.length > MAX_FIELD_CHARS;
  const descClipped = description.length > MAX_FIELD_CHARS;

  return (
    <ToolPanel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs<TabId> value={tab} onChange={setTab} options={TAB_OPTIONS} label="Checker" />
        <Tabs<Device> value={device} onChange={setDevice} options={DEVICE_OPTIONS} label="Device" size="sm" />
      </div>

      {/* ------------------------------------------------------------------ TITLE */}
      {tab === "title" && (
        <div role="tabpanel" aria-label="Title tag checker" className="flex flex-col gap-5">
          <Textarea
            label="Title tag"
            labelAddon={`${titleRes.chars} characters, ${Math.round(titleRes.width)} px`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            placeholder="Type or paste your title, or paste the whole <title> tag"
            hint={titleSource.extracted ? "Reading the text inside your pasted <title> tag, with HTML entities decoded." : undefined}
          />
          {titleClipped && (
            <Alert variant="warning" title="Very long input">
              Only the first {formatNumber(MAX_FIELD_CHARS)} characters were analyzed. Real titles are far shorter than that.
            </Alert>
          )}
          <ToolActions>
            <Button variant="secondary" onClick={() => setFromClipboard(setTitle)}>
              Paste
            </Button>
            <Button variant="secondary" onClick={() => setTitle("")} disabled={!title}>
              Clear
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setTitle(EXAMPLE_TITLE);
                if (!keyword) setKeyword(EXAMPLE_KEYWORD);
              }}
            >
              Try an example
            </Button>
            <span className="flex flex-wrap gap-2 sm:ml-auto">
              <CopyButton text={titleRes.text} label="Copy title" variant="primary" disabled={!titleRes.text} />
              <CopyButton text={titleTag(titleRes.text)} label="Copy <title> tag" variant="outline" disabled={!titleRes.text} />
            </span>
          </ToolActions>

          {titleRes.status === "empty" ? <EmptyNotice noun="title tag" /> : (
            <>
              <ResultStats res={titleRes} />
              <WidthMeter res={titleRes} />
              <FitBadges res={titleRes} />
              <CutLine res={titleRes} />
            </>
          )}

          <SnippetPreview device={device} url={pageUrl} title={titleRes} description={descRes} keyword={keyword} />

          <ToolGrid>
            <Input label="Target keyword (optional)" hint="Checks where it sits and whether it survives the cut." value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. pruning shears" />
            <Input label="Page URL (optional)" hint="Only used for the preview breadcrumb." value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} placeholder="https://example.com/blog/post" />
          </ToolGrid>

          <ToolSection title="Keyword placement" description="Where your keyword falls in the width budget.">
            <KeywordTrack res={titleRes} kw={titleKeyword} />
          </ToolSection>

          <ToolSection title="Brand suffix builder" description="Add your site name and see how much room is left for the page-specific part of the title.">
            <Toggle
              checked={brandOn}
              onChange={setBrandOn}
              label="Add the brand to the title above"
              description="Width, preview and checks then use the combined title."
            />
            <ToolGrid cols={3}>
              <Input label="Brand name" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Example Co" />
              <Select label="Separator" value={separator} onChange={(e) => setSeparator(e.target.value)} options={SEPARATORS.map((s) => ({ value: s.value, label: s.label }))} />
              <Select label="Position" value={brandPosition} onChange={(e) => setBrandPosition(e.target.value as BrandPosition)} options={POSITION_OPTIONS} />
            </ToolGrid>
            {brand.trim() ? (
              <div className="flex flex-col gap-2 text-sm text-fg-secondary" data-testid="brand-summary">
                {brandRoom > 0 ? (
                  <p>
                    The brand and separator take {Math.round(brandTaken)} px, leaving {Math.round(brandRoom)} px (about {Math.floor(brandRoom / pageTitleAvg)} characters) for the page-specific part of the title.
                    {plainTitleRes.text && (
                      <>
                        {" "}
                        Your title text uses {Math.round(plainTitleRes.width)} px, which is{" "}
                        {Math.round(plainTitleRes.width) <= Math.round(brandRoom)
                          ? `${Math.round(brandRoom) - Math.round(plainTitleRes.width)} px inside that room.`
                          : `${Math.round(plainTitleRes.width) - Math.round(brandRoom)} px too wide once the brand is added.`}
                      </>
                    )}
                  </p>
                ) : (
                  <Alert variant="warning">The brand and separator alone are wider than the {device} limit, so no page title text would be visible.</Alert>
                )}
                {brandOn && titleRes.status === "long" && plainTitleRes.status !== "long" && plainTitleRes.text && (
                  <Alert variant="warning" title="The brand pushes this title over the limit">
                    Without the brand the title is {Math.round(plainTitleRes.width)} px and fits. Shorten the page-specific text by about {Math.round(titleRes.width - titleRes.view.limit)} px, use a shorter separator or brand, or drop the brand on this page.
                  </Alert>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Enter a brand name to see how much room it leaves.</p>
            )}
          </ToolSection>

          {titleCheckList.length > 0 && (
            <ToolSection title="Title rewrite-risk checklist" description="Based on the title-link guidance in Google's Search Central documentation. Google may still choose a different title.">
              <CheckList checks={titleCheckList} label="Title checklist" />
            </ToolSection>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ DESCRIPTION */}
      {tab === "description" && (
        <div role="tabpanel" aria-label="Meta description checker" className="flex flex-col gap-5">
          <Textarea
            label="Meta description"
            labelAddon={`${descRes.chars} characters, ${Math.round(descRes.width)} px`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder='Type or paste your meta description, or paste the whole <meta name="description"> tag'
            hint={descriptionSource.extracted ? "Reading the content of your pasted <meta> tag, with HTML entities decoded." : undefined}
          />
          {descClipped && (
            <Alert variant="warning" title="Very long input">
              Only the first {formatNumber(MAX_FIELD_CHARS)} characters were analyzed. Real descriptions are far shorter than that.
            </Alert>
          )}
          <ToolActions>
            <Button variant="secondary" onClick={() => setFromClipboard(setDescription)}>
              Paste
            </Button>
            <Button variant="secondary" onClick={() => setDescription("")} disabled={!description}>
              Clear
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDescription(EXAMPLE_DESCRIPTION);
                if (!keyword) setKeyword(EXAMPLE_KEYWORD);
              }}
            >
              Try an example
            </Button>
            <span className="flex flex-wrap gap-2 sm:ml-auto">
              <CopyButton text={descRes.text} label="Copy description" variant="primary" disabled={!descRes.text} />
              <CopyButton text={metaDescriptionTag(descRes.text)} label="Copy <meta> tag" variant="outline" disabled={!descRes.text} />
            </span>
          </ToolActions>

          {descRes.status === "empty" ? <EmptyNotice noun="meta description" /> : (
            <>
              <ResultStats res={descRes} />
              <WidthMeter res={descRes} />
              <FitBadges res={descRes} />
              <CutLine res={descRes} />
            </>
          )}

          <SnippetPreview device={device} url={pageUrl} title={titleRes} description={descRes} keyword={keyword} />

          <ToolGrid>
            <Input label="Target keyword (optional)" hint="Search engines bold matching words in the snippet." value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. pruning shears" />
            <Input label="Page URL (optional)" hint="Only used for the preview breadcrumb." value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} placeholder="https://example.com/blog/post" />
          </ToolGrid>

          <ToolSection title="Keyword placement" description="Where your keyword falls in the width budget.">
            <KeywordTrack res={descRes} kw={descKeyword} />
          </ToolSection>

          {descCheckList.length > 0 && (
            <ToolSection title="Snippet checklist" description="Google may show a different snippet for some searches, whatever your meta description says.">
              <CheckList checks={descCheckList} label="Description checklist" />
            </ToolSection>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- BULK */}
      {tab === "bulk" && (
        <div role="tabpanel" aria-label="Bulk checker" className="flex flex-col gap-5">
          <Textarea
            mono
            label="Pages to check"
            labelAddon={parsed.rows.length ? `${formatNumber(parsed.totalRows)} rows` : undefined}
            value={bulkText}
            onChange={(e) => {
              setBulkText(e.target.value);
              setBulkShown(100);
              setBulkError(null);
            }}
            rows={8}
            placeholder={'URL,Title,Meta Description\nhttps://example.com/,"Example Co: Garden Tools","Quality garden tools since 1998."'}
            hint="One page per line: URL, title, description. Comma, tab or semicolon separated. A header row is detected automatically, and so are crawler exports with Address, Title 1 and Meta Description 1 columns. Put quotes around cells that contain commas."
          />
          <ToolActions>
            <Button
              variant="secondary"
              onClick={() => {
                setBulkText(BULK_EXAMPLE);
                setBulkFilter("all");
                setBulkShown(100);
                setBulkError(null);
              }}
            >
              Load example
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              Upload CSV
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
              className="sr-only"
              aria-label="Upload a CSV or TSV file"
              tabIndex={-1}
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              variant="secondary"
              onClick={() => {
                setBulkText("");
                setBulkError(null);
              }}
              disabled={!bulkText}
            >
              Clear
            </Button>
          </ToolActions>

          {bulkError && <Alert variant="error">{bulkError}</Alert>}

          {parsed.rows.length === 0 ? (
            <Alert variant="info" title="Paste rows to audit many pages at once">
              Export titles and descriptions from your crawler or CMS, paste them above, and get a pass, warn or fail for every page, plus duplicate detection and a CSV you can download. The
              file is read in your browser and is not uploaded.
            </Alert>
          ) : (
            <>
              <p className="text-xs text-muted" data-testid="bulk-detected">
                Detected: {parsed.hasHeader ? "header row" : "no header row"}, columns {parsed.layout || "none"}, {parsed.delimiter === "\t" ? "tab" : parsed.delimiter === ";" ? "semicolon" : "comma"} separated. Measuring for {device}.
              </p>
              {parsed.capped && (
                <Alert variant="warning" title={`Only the first ${formatNumber(MAX_BULK_ROWS)} rows were checked`}>
                  Your input has {formatNumber(parsed.totalRows)} rows. Split it into batches to check the rest.
                </Alert>
              )}
              <StatGrid className="lg:grid-cols-6">
                <Stat label="Pages" value={formatNumber(bulk.summary.rows)} emphasis />
                <Stat label="Pass" value={formatNumber(bulk.summary.pass)} />
                <Stat label="Warn" value={formatNumber(bulk.summary.warn)} />
                <Stat label="Fail" value={formatNumber(bulk.summary.fail)} />
                <Stat label="Duplicate titles" value={formatNumber(bulk.summary.duplicateTitleRows)} hint="pages" />
                <Stat label="Duplicate descriptions" value={formatNumber(bulk.summary.duplicateDescriptionRows)} hint="pages" />
              </StatGrid>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Tabs<BulkFilter>
                  value={bulkFilter}
                  onChange={(f) => {
                    setBulkFilter(f);
                    setBulkShown(100);
                  }}
                  label="Filter results"
                  size="sm"
                  options={[
                    { value: "all", label: `All ${bulk.summary.rows}` },
                    { value: "fail", label: `Fail ${bulk.summary.fail}` },
                    { value: "warn", label: `Warn ${bulk.summary.warn}` },
                    { value: "pass", label: `Pass ${bulk.summary.pass}` },
                    { value: "duplicates", label: "Duplicates" },
                  ]}
                />
                <span className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => downloadText(`﻿${csv}`, "title-description-length-audit.csv", "text/csv;charset=utf-8")}>
                    Download CSV
                  </Button>
                  <CopyButton text={csv} label="Copy CSV" variant="outline" />
                </span>
              </div>

              <BulkTable results={filtered.slice(0, bulkShown)} />
              {filtered.length === 0 && <p className="text-sm text-muted">No pages match this filter.</p>}
              {filtered.length > bulkShown && (
                <div className="flex items-center justify-between gap-3 text-sm text-muted">
                  <span>
                    Showing {formatNumber(bulkShown)} of {formatNumber(filtered.length)}. The CSV always includes every row.
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => setBulkShown((n) => n + 100)}>
                    Show 100 more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <LimitsPanel limits={limits} onChange={setLimitsRaw} />
    </ToolPanel>
  );
}

function BulkTable({ results }: { results: BulkResult[] }) {
  if (!results.length) return null;
  return (
    <div className="scroll-thin overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-sm" data-testid="bulk-table">
        <caption className="sr-only">Title and description results for each page</caption>
        <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              #
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Page
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Title
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Description
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Result
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {results.map((r) => (
            <tr key={r.row.n} className="align-top" data-status={r.status}>
              <td className="px-3 py-2 font-mono text-xs text-muted">{r.row.n}</td>
              <td className="max-w-[260px] px-3 py-2">
                {r.row.url && (
                  <p className="truncate font-mono text-xs text-muted" title={r.row.url}>
                    {r.row.url}
                  </p>
                )}
                <p className="truncate text-fg-secondary" title={r.title.text}>
                  {r.title.text || <span className="text-muted">(no title)</span>}
                </p>
                <Badge variant={STATUS_VARIANT[r.status]} className="mt-1.5 md:hidden">
                  {r.status.toUpperCase()}
                </Badge>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="font-mono text-xs tabular-nums text-fg">{Math.round(r.title.width)} px</span>
                <span className="ml-1.5 text-xs text-muted">{r.title.chars} chars, {FIELD_LABEL[r.title.status]}</span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="font-mono text-xs tabular-nums text-fg">{Math.round(r.description.width)} px</span>
                <span className="ml-1.5 text-xs text-muted">{r.description.chars} chars, {FIELD_LABEL[r.description.status]}</span>
              </td>
              <td className="px-3 py-2">
                <Badge variant={STATUS_VARIANT[r.status]}>{r.status.toUpperCase()}</Badge>
                {r.issues.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 text-xs text-muted">
                    {r.issues.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
