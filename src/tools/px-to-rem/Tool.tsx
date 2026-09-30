"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardPaste, Download, FileCode2, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Alert, Badge, Button, CopyButton, Input, ResultBox, Select, Stat, StatGrid, Tabs, Textarea, ToolActions, ToolPanel, ToolSection, Toggle } from "@/components/ui";
import { cn, downloadText } from "@/lib/utils";
import {
  DEFAULT_ROOT,
  MAX_BULK_CHARS,
  MAX_DECIMALS,
  TABLE_MAX_PX,
  USE_AS,
  buildTable,
  convertCss,
  convertSingle,
  formatNum,
  modeFromHash,
  parseIgnoreList,
  parseLength,
  parseRoot,
  rootAsPercent,
  tableToCsv,
  tailwindFor,
  type Mode,
  type TwVersion,
  type UseAs,
} from "./logic";

interface Settings {
  root: string;
  decimals: number;
  useAs: UseAs;
  twVersion: TwVersion;
  parent: string;
  ignore: string;
  skipProps: string;
  convertQueries: boolean;
}

interface Draft {
  px: string;
  rem: string;
  css: string;
}

const SAMPLE_CSS = `/* Card component */
.card {
  width: 320px;
  padding: 24px 16px;
  margin: 0 auto 32px;
  border: 1px solid #d9d4c7;
  border-radius: 12px;
  font-size: 18px;
  line-height: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  background: url("/img/card-16px.png") no-repeat;
}

.card__title {
  font: 600 24px/32px "Inter", sans-serif;
  letter-spacing: -0.5px;
}

@media (min-width: 768px) {
  .card {
    width: 480px;
    padding: 32px;
  }
}
`;

const DEFAULT_SETTINGS: Settings = {
  root: String(DEFAULT_ROOT),
  decimals: 4,
  useAs: "padding",
  twVersion: "v4",
  parent: "",
  ignore: "0, 1px",
  skipProps: "",
  convertQueries: false,
};

const DEFAULT_DRAFT: Draft = { px: "16", rem: "1", css: SAMPLE_CSS };

const ROOT_PRESETS = [10, 12, 14, 16, 18];
const USE_AS_VALUES = USE_AS.map((u) => u.value) as string[];

/** Stored state may be missing, outdated or hand-edited: rebuild it field by field. */
function normalizeSettings(stored: unknown): Settings {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  const str = (k: keyof Settings, fallback: string) => (typeof src[k] === "string" ? (src[k] as string).slice(0, 400) : fallback);
  const dec = Number(src.decimals);
  return {
    root: str("root", DEFAULT_SETTINGS.root),
    decimals: Number.isInteger(dec) && dec >= 0 && dec <= MAX_DECIMALS ? dec : DEFAULT_SETTINGS.decimals,
    useAs: typeof src.useAs === "string" && USE_AS_VALUES.includes(src.useAs) ? (src.useAs as UseAs) : DEFAULT_SETTINGS.useAs,
    twVersion: src.twVersion === "v3" || src.twVersion === "v4" ? src.twVersion : DEFAULT_SETTINGS.twVersion,
    parent: str("parent", DEFAULT_SETTINGS.parent),
    ignore: str("ignore", DEFAULT_SETTINGS.ignore),
    skipProps: str("skipProps", DEFAULT_SETTINGS.skipProps),
    convertQueries: typeof src.convertQueries === "boolean" ? src.convertQueries : DEFAULT_SETTINGS.convertQueries,
  };
}

function normalizeDraft(stored: unknown): Draft {
  const src = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  return {
    px: typeof src.px === "string" ? src.px.slice(0, 60) : DEFAULT_DRAFT.px,
    rem: typeof src.rem === "string" ? src.rem.slice(0, 60) : DEFAULT_DRAFT.rem,
    css: typeof src.css === "string" ? src.css : DEFAULT_DRAFT.css,
  };
}

const DECIMAL_OPTIONS = Array.from({ length: 7 }, (_, i) => ({ value: String(i), label: i === 4 ? "4 (default)" : String(i) }));
const USE_AS_OPTIONS = USE_AS.map((u) => ({ value: u.value, label: u.label }));
const TW_OPTIONS = [
  { value: "v4", label: "v4 (any multiple of 0.25)" },
  { value: "v3", label: "v3 (default scale)" },
];
const MODE_OPTIONS = [
  { value: "px-to-rem" as const, label: "PX to REM" },
  { value: "rem-to-px" as const, label: "REM to PX" },
];

function OutRow({ label, value, note, testId, copyLabel }: { label: string; value: string; note?: string; testId: string; copyLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="label-mono">{label}</p>
        <p className="break-all font-mono text-sm text-fg" data-testid={testId}>
          {value}
        </p>
        {note && <p className="text-xs text-muted">{note}</p>}
      </div>
      <CopyButton text={value} size="sm" variant="ghost" aria-label={copyLabel} className="shrink-0" />
    </div>
  );
}

export default function PxToRem() {
  const [mode, setMode] = useState<Mode>("px-to-rem");
  const [storedSettings, setStoredSettings] = usePersistentState<Settings>("px-to-rem:settings:v1", DEFAULT_SETTINGS, { storage: "local" });
  const [storedDraft, setStoredDraft] = usePersistentState<Draft>("px-to-rem:draft:v1", DEFAULT_DRAFT);
  const s = useMemo(() => normalizeSettings(storedSettings), [storedSettings]);
  const d = useMemo(() => normalizeDraft(storedDraft), [storedDraft]);

  const setS = <K extends keyof Settings>(key: K, value: Settings[K]) => setStoredSettings((prev) => ({ ...normalizeSettings(prev), [key]: value }));
  const setD = <K extends keyof Draft>(key: K, value: Draft[K]) => setStoredDraft((prev) => ({ ...normalizeDraft(prev), [key]: value }));

  // Open on the direction named in the URL hash (#rem-to-px); default is px to rem.
  useEffect(() => {
    const apply = () => {
      const m = modeFromHash(window.location.hash);
      if (m) setMode(m);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const changeMode = (m: Mode) => {
    setMode(m);
    try {
      window.history.replaceState(null, "", `#${m}`);
    } catch {
      /* history unavailable: the tab still works */
    }
  };

  const from = mode === "px-to-rem" ? "px" : "rem";
  const to = mode === "px-to-rem" ? "rem" : "px";

  const rootP = useMemo(() => parseRoot(s.root), [s.root]);
  const root = rootP.kind === "ok" ? rootP.value : null;
  const parentP = useMemo(() => (s.parent.trim() === "" ? null : parseRoot(s.parent)), [s.parent]);
  const parent = parentP === null ? root : parentP.kind === "ok" ? parentP.value : null;

  const valueRaw = mode === "px-to-rem" ? d.px : d.rem;
  const valueP = useMemo(() => parseLength(valueRaw, from), [valueRaw, from]);

  const single = useMemo(() => {
    if (root === null || valueP.kind !== "ok") return null;
    const conv = convertSingle(valueP.value, mode, root, parent ?? root);
    const target = to === "rem" ? conv.rem : conv.px;
    const headline = `${formatNum(target, s.decimals)}${to}`;
    const pxText = `${formatNum(conv.px, s.decimals)}px`;
    const remText = `${formatNum(conv.rem, s.decimals)}rem`;
    const emText = parent === null ? null : `${formatNum(conv.em, s.decimals)}em`;
    const tw = tailwindFor(conv.rem, conv.px, s.useAs, s.twVersion, s.decimals);
    const cssProp = s.useAs;
    const formula =
      mode === "px-to-rem"
        ? `${formatNum(conv.px, MAX_DECIMALS)} px ÷ ${formatNum(root, MAX_DECIMALS)} px = ${formatNum(conv.rem, s.decimals)} rem`
        : `${formatNum(conv.rem, MAX_DECIMALS)} rem × ${formatNum(root, MAX_DECIMALS)} px = ${formatNum(conv.px, s.decimals)} px`;
    const shown = Number(formatNum(target, s.decimals));
    const rounded = Math.abs(shown - target) > 1e-12 * Math.max(1, Math.abs(target));
    return { conv, headline, pxText, remText, emText, tw, css: `${cssProp}: ${headline};`, formula, rounded };
  }, [root, parent, valueP, mode, to, s.decimals, s.useAs, s.twVersion]);

  const table = useMemo(() => (root === null ? null : buildTable(root, s.decimals, s.useAs, s.twVersion)), [root, s.decimals, s.useAs, s.twVersion]);
  const twHeader = `Tailwind ${USE_AS.find((u) => u.value === s.useAs)?.prefix ?? "p"}-*`;
  const highlightPx = single && Number.isInteger(single.conv.px) && single.conv.px >= 1 && single.conv.px <= TABLE_MAX_PX ? single.conv.px : null;

  const cssTooLarge = d.css.length > MAX_BULK_CHARS;
  const bulk = useMemo(() => {
    if (root === null || cssTooLarge || !d.css.trim()) return null;
    return convertCss(d.css, { from, root, decimals: s.decimals, convertQueries: s.convertQueries, ignore: s.ignore, skipProps: s.skipProps });
  }, [root, cssTooLarge, d.css, from, s.decimals, s.convertQueries, s.ignore, s.skipProps]);
  const ignoreCheck = useMemo(() => parseIgnoreList(s.ignore, from), [s.ignore, from]);

  const pasteCss = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setD("css", clip);
    } catch {
      /* clipboard read blocked: the person can paste into the box directly */
    }
  };

  const resetSettings = () => setStoredSettings(DEFAULT_SETTINGS);
  const settingsChanged = JSON.stringify(s) !== JSON.stringify(DEFAULT_SETTINGS);

  return (
    <>
      <span id="rem-to-px" aria-hidden className="block h-0 scroll-mt-28" />
      <ToolPanel>
        <Tabs label="Conversion direction" value={mode} onChange={changeMode} options={MODE_OPTIONS} className="self-start" />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-4">
            <Input
              label={mode === "px-to-rem" ? "Pixels (px)" : "Rems (rem)"}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              inputSize="lg"
              value={valueRaw}
              suffix={from}
              placeholder={mode === "px-to-rem" ? "16" : "1"}
              onChange={(e) => setD(mode === "px-to-rem" ? "px" : "rem", e.target.value)}
              error={valueP.kind === "invalid" ? valueP.hint : undefined}
            />

            <div className="flex flex-col gap-2">
              <Input
                label="Root font size (html)"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                value={s.root}
                suffix="px"
                placeholder="16"
                onChange={(e) => setS("root", e.target.value)}
                error={rootP.kind === "invalid" ? rootP.hint : rootP.kind === "empty" ? "Enter the root font size, for example 16." : undefined}
              />
              <div role="group" aria-label="Common root font sizes" className="flex flex-wrap items-center gap-1.5">
                {ROOT_PRESETS.map((n) => (
                  <Button key={n} size="sm" variant={root === n ? "primary" : "secondary"} aria-pressed={root === n} onClick={() => setS("root", String(n))}>
                    {n}px
                  </Button>
                ))}
              </div>
              {root !== null && (
                <p className="text-xs text-muted">
                  {root === DEFAULT_ROOT ? (
                    <>16px is the usual browser default, so this is the right choice unless your CSS changes the root size.</>
                  ) : (
                    <>
                      That is {rootAsPercent(root)}% of the 16px default. Set it in CSS as a percentage (<span className="font-mono">html {"{"} font-size: {rootAsPercent(root)}%; {"}"}</span>), not in px, so people who raise their
                      browser text size still get larger text.
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-border bg-surface-2 p-4" aria-live="polite">
            {rootP.kind !== "ok" ? (
              <Alert variant="warning" title="Set a root font size first">
                Rem is a multiple of the root font size, so a valid number above 0 is needed in the box on the left.
              </Alert>
            ) : valueP.kind === "empty" ? (
              <p className="text-sm text-muted">Enter a value in {from} to convert it to {to}.</p>
            ) : valueP.kind === "invalid" || !single ? (
              <p className="text-sm text-muted">Fix the highlighted field to see the result.</p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="label-mono">{mode === "px-to-rem" ? "REM result" : "PX result"}</p>
                    <output className="block break-all text-3xl font-semibold tabular-nums tracking-tight text-primary" data-testid="headline">
                      {single.headline}
                    </output>
                  </div>
                  <CopyButton text={single.headline} variant="accent" size="sm" className="shrink-0" />
                </div>
                <p className="mt-1 break-words font-mono text-xs text-fg-secondary" data-testid="formula">
                  {single.formula}
                </p>
                {single.rounded && (
                  <p className="mt-1 text-xs text-muted">
                    Rounded to {s.decimals} decimal {s.decimals === 1 ? "place" : "places"}. Change this under Output options.
                  </p>
                )}

                <div className="mt-4">
                  <OutRow label="Pixels" value={single.pxText} testId="out-px" copyLabel="Copy pixel value" />
                  <OutRow label="Rem" value={single.remText} testId="out-rem" copyLabel="Copy rem value" />
                  <OutRow
                    label="Em"
                    value={single.emText ?? "n/a"}
                    note={parent === null ? "Fix the parent size under Output options." : `if the parent font size is ${formatNum(parent, MAX_DECIMALS)}px`}
                    testId="out-em"
                    copyLabel="Copy em value"
                  />
                  <OutRow label="CSS" value={single.css} testId="out-css" copyLabel="Copy CSS declaration" />
                  {!single.tw.applicable ? (
                    <div className="border-t border-border py-2.5">
                      <p className="label-mono">Tailwind</p>
                      <p className="text-xs text-muted" data-testid="out-tw-na">
                        {single.tw.reason}
                      </p>
                    </div>
                  ) : single.tw.exact ? (
                    <OutRow
                      label={`Tailwind ${s.twVersion}`}
                      value={single.tw.exact}
                      note={s.useAs === "font-size" ? "Exact match. text-* classes also set a default line-height." : "Exact match on the default scale."}
                      testId="out-tw"
                      copyLabel="Copy Tailwind class"
                    />
                  ) : (
                    <>
                      <OutRow
                        label={`Tailwind ${s.twVersion}, arbitrary value`}
                        value={single.tw.arbitrary}
                        note="Not on the default scale, so this class keeps the exact value."
                        testId="out-tw-arb"
                        copyLabel="Copy Tailwind arbitrary class"
                      />
                      {single.tw.nearest && (
                        <OutRow
                          label="Nearest scale class"
                          value={single.tw.nearest.className}
                          note={`${formatNum(single.tw.nearest.rem, 4)}rem, ${formatNum(Math.abs(single.tw.nearest.rem - single.conv.rem), 4)}rem (${formatNum(Math.abs(single.tw.nearest.rem - single.conv.rem) * (root ?? DEFAULT_ROOT), 3)}px) ${
                            single.tw.nearest.rem > single.conv.rem ? "larger" : "smaller"
                          }`}
                          testId="out-tw-near"
                          copyLabel="Copy nearest Tailwind class"
                        />
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <ToolSection title="Output options" description="These control the CSS and Tailwind lines above and the table below.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="Use the result as" options={USE_AS_OPTIONS} value={s.useAs} onChange={(e) => setS("useAs", e.target.value as UseAs)} />
            <Select label="Tailwind version" options={TW_OPTIONS} value={s.twVersion} onChange={(e) => setS("twVersion", e.target.value as TwVersion)} />
            <Select label="Decimal places" options={DECIMAL_OPTIONS} value={String(s.decimals)} onChange={(e) => setS("decimals", Number(e.target.value))} />
            <Input
              label="Parent size for em"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={s.parent}
              suffix="px"
              placeholder={rootP.kind === "ok" ? formatNum(rootP.value, MAX_DECIMALS) : "16"}
              hint="Leave empty to use the root size."
              onChange={(e) => setS("parent", e.target.value)}
              error={parentP && parentP.kind === "invalid" ? parentP.hint : undefined}
            />
          </div>
          <ToolActions>
            <Button variant="secondary" size="sm" onClick={resetSettings} disabled={!settingsChanged}>
              Reset options
            </Button>
          </ToolActions>
        </ToolSection>

        <ToolSection
          title={`Convert a block of CSS (${from} to ${to})`}
          description={`Paste a stylesheet, one rule or a bare value. Every ${from} length is converted with the root size above; comments, strings, url() and selectors are left alone. The direction follows the tabs at the top.`}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <Textarea
                label="CSS to convert"
                mono
                rows={14}
                value={d.css}
                onChange={(e) => setD("css", e.target.value)}
                placeholder={`.card { padding: 24px; }`}
                labelAddon={`${d.css.length.toLocaleString("en-US")} chars`}
                className="min-h-[18rem] whitespace-pre"
                wrap="off"
              />
              <ToolActions>
                <Button variant="secondary" size="sm" leftIcon={<ClipboardPaste className="h-4 w-4" aria-hidden />} onClick={pasteCss}>
                  Paste
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<FileCode2 className="h-4 w-4" aria-hidden />} onClick={() => setD("css", SAMPLE_CSS)}>
                  Load sample
                </Button>
                <Button variant="secondary" size="sm" leftIcon={<X className="h-4 w-4" aria-hidden />} onClick={() => setD("css", "")} disabled={!d.css}>
                  Clear
                </Button>
              </ToolActions>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <ResultBox
                label="Converted CSS"
                value={bulk?.output ?? ""}
                mono
                rows={14}
                placeholder={rootP.kind !== "ok" ? "Set a valid root font size to convert." : "The converted CSS appears here."}
                className="flex flex-1 flex-col [&_textarea]:min-h-[18rem] [&_textarea]:flex-1 [&_textarea]:whitespace-pre"
                actions={
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Download className="h-4 w-4" aria-hidden />}
                    disabled={!bulk}
                    onClick={() => bulk && downloadText(bulk.output, "converted.css", "text/css;charset=utf-8")}
                  >
                    .css
                  </Button>
                }
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Leave these values alone"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={s.ignore}
              placeholder="0, 1px"
              hint="Numbers separated by commas. Signs are ignored, so 1 keeps 1px and -1px."
              onChange={(e) => setS("ignore", e.target.value)}
              error={ignoreCheck.invalid.length ? `Not numbers, so ignored: ${ignoreCheck.invalid.slice(0, 5).join(", ")}` : undefined}
            />
            <Input
              label="Leave these properties alone"
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={s.skipProps}
              placeholder="box-shadow, border-width, outline*"
              hint="Property names separated by commas. * matches any characters."
              onChange={(e) => setS("skipProps", e.target.value)}
            />
          </div>
          <Toggle
            checked={s.convertQueries}
            onChange={(v) => setS("convertQueries", v)}
            label="Also convert @media and @container conditions"
            description="Off by default. Rem inside a media query is measured against the browser's default font size, not your html font-size."
          />

          {cssTooLarge && (
            <Alert variant="warning" title="That is a lot of CSS">
              The box holds up to {MAX_BULK_CHARS.toLocaleString("en-US")} characters at once. Split the file into parts and convert them one at a time.
            </Alert>
          )}
          {s.convertQueries && root !== null && root !== DEFAULT_ROOT && (
            <Alert variant="info" title="Check your breakpoints">
              Media queries ignore the html font-size in your CSS, so a breakpoint converted with a {formatNum(root, MAX_DECIMALS)}px root will not line up with the same breakpoint written for a 16px browser default. Use 16 as the root for
              breakpoints.
            </Alert>
          )}
          {bulk && (
            <>
              <StatGrid className="sm:grid-cols-4">
                <Stat label="Converted" value={bulk.converted} emphasis />
                <Stat label="Left alone" value={bulk.ignored} hint="in the values list" />
                <Stat label="In queries" value={bulk.skippedQueries} hint="@media, @container" />
                <Stat label="In properties" value={bulk.skippedProps} hint="in the properties list" />
              </StatGrid>
              {bulk.converted === 0 && (
                <Alert variant="info" title={`No ${from} values were converted`}>
                  {bulk.ignored + bulk.skippedQueries + bulk.skippedProps > 0
                    ? "Every match was covered by the ignore list, the skipped properties or the query setting."
                    : `Nothing in the input is written in ${from}. Values in other units, and ${from} inside comments, strings and url(), are never changed.`}
                </Alert>
              )}
            </>
          )}
        </ToolSection>

        <ToolSection
          title={`Reference table: 1 to ${TABLE_MAX_PX} px at a ${root === null ? "?" : formatNum(root, MAX_DECIMALS)}px root`}
          description="Follows the root size and the output options. The row matching your current pixel value is highlighted."
        >
          {table === null ? (
            <p className="text-sm text-muted">Enter a valid root font size to see the table.</p>
          ) : (
            <>
              <div
                tabIndex={0}
                role="region"
                aria-label="px to rem reference table"
                className="scroll-thin max-h-96 overflow-auto rounded-lg border border-border-strong focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
              >
                <table className="w-full min-w-[20rem] border-collapse text-sm" data-testid="ref-table">
                  <thead className="sticky top-0 z-10 bg-surface-2 text-left">
                    <tr>
                      <th scope="col" className="label-mono border-b border-border-strong px-3 py-2">
                        px
                      </th>
                      <th scope="col" className="label-mono border-b border-border-strong px-3 py-2">
                        rem
                      </th>
                      <th scope="col" className="label-mono border-b border-border-strong px-3 py-2">
                        {twHeader}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((r) => (
                      <tr key={r.px} className={cn("border-b border-border last:border-b-0", highlightPx === r.px && "bg-primary-soft")} data-px={r.px}>
                        <td className="px-3 py-1.5 font-mono tabular-nums text-fg">{r.px}px</td>
                        <td className="px-3 py-1.5 font-mono tabular-nums text-fg">{r.rem}rem</td>
                        <td className="whitespace-nowrap px-3 py-1.5 font-mono text-fg-secondary">{r.tailwind}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ToolActions>
                <CopyButton text={tableToCsv(table, twHeader.replace(/ /g, "_"))} label="Copy table as CSV" variant="secondary" size="sm" />
                {highlightPx !== null && <Badge variant="primary">{highlightPx}px highlighted</Badge>}
              </ToolActions>
            </>
          )}
        </ToolSection>

        <p className="text-xs text-muted">
          Results are rounded for display only. Tailwind classes assume the default theme; a project that overrides its spacing or type scale needs its own values.
        </p>
      </ToolPanel>
    </>
  );
}
