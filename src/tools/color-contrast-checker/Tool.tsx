"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeftRight, Check, Download, Link2, Copy, RotateCcw, X } from "lucide-react";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  Alert,
  Badge,
  Button,
  Field,
  Input,
  Select,
  Stat,
  StatGrid,
  Tabs,
  Textarea,
  Toggle,
  ToolActions,
  ToolGrid,
  ToolPanel,
  ToolSection,
  controlClass,
} from "@/components/ui";
import { cn, downloadText } from "@/lib/utils";
import {
  MAX_PALETTE,
  MAX_PALETTE_TEXT,
  REQUIRED,
  bestLevel,
  buildCsv,
  buildCss,
  buildReport,
  contrastRatio,
  decodeHash,
  effectivePair,
  encodeHash,
  evaluate,
  formatRatio,
  meets,
  parseColor,
  parsePalette,
  summarize,
  suggestFixes,
  toHex,
  toHslString,
  toOklchString,
  toRgbString,
  type CheckId,
  type Goal,
  type Level,
  type ParseResult,
  type ParsedColor,
  type Suggestion,
} from "./contrast";

type Mode = "pair" | "palette";

interface State {
  mode: Mode;
  fg: string;
  bg: string;
  sample: string;
  target: Goal;
  palette: string;
  fade: boolean;
}

const DEFAULT_PALETTE = "#1a1916\n#ffffff\n#f6f5f1\n#c9400a\n#0f766e\n#6e6a62";

const DEFAULT_STATE: State = {
  mode: "pair",
  fg: "#777777",
  bg: "#ffffff",
  sample: "The quick brown fox jumps over the lazy dog",
  target: "aa",
  palette: DEFAULT_PALETTE,
  fade: false,
};

const GOALS: { value: Goal; label: string; ratio: number }[] = [
  { value: "aa", label: "AA for normal text (4.5:1)", ratio: REQUIRED["aa-normal"] },
  { value: "aa-large", label: "AA for large text and UI (3:1)", ratio: REQUIRED["aa-large"] },
  { value: "aaa", label: "AAA for normal text (7:1)", ratio: REQUIRED["aaa-normal"] },
];

const EXAMPLES = [
  { label: "Gray on white", fg: "#777777", bg: "#ffffff" },
  { label: "White on orange", fg: "#ffffff", bg: "#ff7a00" },
  { label: "Red on white", fg: "#ff0000", bg: "#ffffff" },
  { label: "Ink on paper", fg: "#1a1916", bg: "#f6f5f1" },
];

const PREVIEW_SIZES = [
  { px: 14, weight: 400 },
  { px: 16, weight: 400 },
  { px: 18.66, weight: 700 },
  { px: 24, weight: 400 },
  { px: 32, weight: 700 },
];

/** Saved state comes from session storage and may be stale or edited; rebuild it field by field. */
function normalizeState(raw: string): State {
  let src: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") src = parsed as Record<string, unknown>;
  } catch {
    /* fall through to defaults */
  }
  const str = (v: unknown, fallback: string, max: number) => (typeof v === "string" ? v.slice(0, max) : fallback);
  return {
    mode: src.mode === "palette" ? "palette" : "pair",
    fg: str(src.fg, DEFAULT_STATE.fg, 120),
    bg: str(src.bg, DEFAULT_STATE.bg, 120),
    sample: str(src.sample, DEFAULT_STATE.sample, 140),
    target: src.target === "aa-large" || src.target === "aaa" ? src.target : "aa",
    palette: str(src.palette, DEFAULT_STATE.palette, MAX_PALETTE_TEXT),
    fade: src.fade === true,
  };
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

/** A button that builds its text only when clicked (so nothing touches `window` during render). */
function CopyAction({ getText, label, icon }: { getText: () => string; label: string; icon?: ReactNode }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 1800);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <Button
      variant="secondary"
      size="sm"
      aria-live="polite"
      leftIcon={done ? <Check className="h-4 w-4" aria-hidden /> : (icon ?? <Copy className="h-4 w-4" aria-hidden />)}
      onClick={async () => {
        await copyText(getText());
        setDone(true);
      }}
    >
      {done ? "Copied!" : label}
    </Button>
  );
}

function FormatChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      aria-label={`Copy ${label} value ${value}`}
      onClick={async () => {
        await copyText(value);
        setCopied(true);
      }}
      className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-left transition-colors hover:border-border-strong"
    >
      <span className="label-mono shrink-0">{label}</span>
      <span className="min-w-0 break-words text-right font-mono text-xs text-fg">{copied ? "Copied" : value}</span>
    </button>
  );
}

function ColorField({ label, value, onChange, result }: { label: string; value: string; onChange: (v: string) => void; result: ParseResult }) {
  const invalid = !result.ok && result.reason === "invalid";
  const pickerValue = result.ok ? toHex(result.color, false) : "#000000";
  const color: ParsedColor | null = result.ok ? result.color : null;
  return (
    <div className="flex flex-col gap-2.5">
      <Field
        label={label}
        error={invalid ? "Not a color this tool can read. Try #1a73e8, rgb(26 115 232), hsl(217 80% 51%), oklch(60% 0.2 260) or a name like tomato." : undefined}
      >
        {({ id, describedBy }) => (
          <div className="flex gap-2">
            <input
              type="color"
              aria-label={`${label}, color picker`}
              value={pickerValue}
              onChange={(e) => onChange(e.target.value)}
              className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-border-strong bg-surface p-1"
            />
            <input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid ? true : undefined}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              maxLength={120}
              placeholder="#1a1916, rgb(…), hsl(…) or oklch(…)"
              className={cn(controlClass, "h-11 px-3 font-mono text-sm")}
            />
          </div>
        )}
      </Field>
      {color && (
        <div className="grid grid-cols-2 gap-1.5">
          <FormatChip label="HEX" value={toHex(color)} />
          <FormatChip label="RGB" value={toRgbString(color)} />
          <FormatChip label="HSL" value={toHslString(color)} />
          <FormatChip label="OKLCH" value={toOklchString(color)} />
        </div>
      )}
      {color?.outOfGamut && (
        <p className="text-xs text-muted">This OKLCH color is outside the sRGB gamut, so its chroma was lowered to the nearest color sRGB can show. The ratio uses that adjusted color, and a browser may map the same value slightly differently.</p>
      )}
    </div>
  );
}

function ResultCell({ pass, required }: { pass: boolean; required: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={pass ? "success" : "danger"}>
        {pass ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}
        {pass ? "Pass" : "Fail"}
      </Badge>
      <span className="font-mono text-[11px] text-muted">{required}:1</span>
    </div>
  );
}

const TABLE_ROWS: { label: string; note: string; aa: CheckId; aaa: CheckId | null }[] = [
  { label: "Normal text", note: "Under 24px, or under 18.66px bold", aa: "aa-normal", aaa: "aaa-normal" },
  { label: "Large text", note: "24px and up, or 18.66px bold and up", aa: "aa-large", aaa: "aaa-large" },
  { label: "UI components and graphics", note: "Borders, icons, focus rings, chart marks", aa: "ui", aaa: null },
];

function ComplianceTable({ ratio }: { ratio: number }) {
  const ok = evaluate(ratio);
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">WCAG 2 contrast results for this color pair</caption>
        <thead className="bg-surface-2">
          <tr>
            <th scope="col" className="label-mono px-3 py-2 font-medium">
              Use
            </th>
            <th scope="col" className="label-mono px-3 py-2 font-medium">
              AA
            </th>
            <th scope="col" className="label-mono px-3 py-2 font-medium">
              AAA
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {TABLE_ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="px-3 py-2.5 align-top font-medium text-fg">
                {row.label}
                <span className="mt-0.5 block text-xs font-normal text-muted">{row.note}</span>
              </th>
              <td className="px-3 py-2.5 align-top">
                <ResultCell pass={ok[row.aa]} required={REQUIRED[row.aa]} />
              </td>
              <td className="px-3 py-2.5 align-top">
                {row.aaa ? <ResultCell pass={ok[row.aaa]} required={REQUIRED[row.aaa]} /> : <span className="text-xs text-muted">No AAA level</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Preview({ fgHex, bgHex, sample, onSample }: { fgHex: string; bgHex: string; sample: string; onSample: (v: string) => void }) {
  const text = sample.trim() || "Sample text";
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-border-strong" style={{ backgroundColor: bgHex, color: fgHex }}>
        <p className="sr-only">Preview of the text color on the background color at five sizes.</p>
        <div className="flex flex-col gap-2.5 p-4" aria-hidden="true">
          {PREVIEW_SIZES.map((s) => (
            <p key={`${s.px}-${s.weight}`} className="break-words" style={{ fontSize: `${s.px}px`, fontWeight: s.weight, lineHeight: 1.35 }}>
              {text}
            </p>
          ))}
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold" style={{ border: `2px solid ${fgHex}` }}>
              <Check className="h-4 w-4" aria-hidden />
              Button
            </span>
            <span className="h-6 w-6 rounded-full" style={{ backgroundColor: fgHex }} />
            <span className="h-6 w-14 rounded-sm" style={{ backgroundColor: fgHex }} />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted">
        Top to bottom: 14px, 16px, 18.66px bold, 24px and 32px bold. The last row uses the text color as a border, icon and graphic.
      </p>
      <Input label="Sample text" value={sample} maxLength={140} onChange={(e) => onSample(e.target.value)} placeholder="Type your own text to preview" />
    </div>
  );
}

function suggestionTitle(s: Suggestion): string {
  if (s.role === "both") return s.direction === "lighter" ? "Change both: text lighter, background darker" : "Change both: text darker, background lighter";
  return `Change the ${s.role === "text" ? "text color" : "background"}, ${s.direction}`;
}

function SuggestionCard({ s, current, closest, onApply }: { s: Suggestion; current: { fgHex: string; bgHex: string }; closest: boolean; onApply: () => void }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-medium text-fg">{suggestionTitle(s)}</span>
        {closest && <Badge variant="primary">Closest</Badge>}
      </div>
      <div className="rounded-md border border-border px-3 py-2 text-base font-medium" style={{ backgroundColor: s.bgHex, color: s.fgHex }}>
        Aa Sample text
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
        {s.role !== "background" && (
          <>
            <dt className="text-muted">Text</dt>
            <dd className="font-mono text-fg">
              {current.fgHex} → {s.fgHex}
            </dd>
          </>
        )}
        {s.role !== "text" && (
          <>
            <dt className="text-muted">Background</dt>
            <dd className="font-mono text-fg">
              {current.bgHex} → {s.bgHex}
            </dd>
          </>
        )}
        <dt className="text-muted">Ratio</dt>
        <dd className="font-mono tabular-nums text-fg">{formatRatio(s.ratio)}:1</dd>
        {s.lightness && (
          <>
            <dt className="text-muted">Lightness</dt>
            <dd className="font-mono tabular-nums text-fg">
              {s.lightness.from.toFixed(1)} → {s.lightness.to.toFixed(1)}
            </dd>
          </>
        )}
      </dl>
      <Button size="sm" variant="secondary" onClick={onApply}>
        Use these colors
      </Button>
    </div>
  );
}

const LEVEL_STYLE: Record<Level, string> = {
  AAA: "text-success",
  AA: "text-success",
  Large: "text-warning",
  Fail: "text-danger",
};

function levelSentence(level: Level): string {
  switch (level) {
    case "AAA":
      return "meets AAA for normal text";
    case "AA":
      return "meets AA for normal text";
    case "Large":
      return "meets the ratio for large text and UI components only";
    default:
      return "fails";
  }
}

export default function ColorContrastChecker() {
  const [state, setState, meta] = usePersistentState<State>("color-contrast-checker:state", DEFAULT_STATE, { deserialize: normalizeState });
  const touched = useRef(false);
  const hashApplied = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // A shared link is applied once, after any saved state has been restored. A link always wins.
  useEffect(() => {
    if (!meta.restored || hashApplied.current) return;
    hashApplied.current = true;
    const decoded = decodeHash(window.location.hash);
    if (!decoded) return;
    touched.current = true;
    setState((prev) => ({ ...prev, ...decoded }));
  }, [meta.restored, setState]);

  // Pasting another share link into the same tab changes only the hash, so apply it on hashchange too.
  useEffect(() => {
    if (!meta.restored) return;
    const onHashChange = () => {
      const decoded = decodeHash(window.location.hash);
      if (!decoded) return;
      touched.current = true;
      setState((prev) => ({ ...prev, ...decoded }));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [meta.restored, setState]);

  // Keep the address bar in step with the tool (debounced) so the URL is always a share link.
  useEffect(() => {
    if (!meta.restored || !touched.current) return;
    const timer = setTimeout(() => {
      const hash = encodeHash(state);
      try {
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ""}`);
      } catch {
        /* history can be unavailable in sandboxed frames */
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [state, meta.restored]);

  const patch = useCallback(
    (p: Partial<State>) => {
      touched.current = true;
      setState((prev) => ({ ...prev, ...p }));
    },
    [setState],
  );

  const fgRes = useMemo(() => parseColor(state.fg), [state.fg]);
  const bgRes = useMemo(() => parseColor(state.bg), [state.bg]);
  const goalRatio = GOALS.find((g) => g.value === state.target)?.ratio ?? 4.5;

  const pair = useMemo(() => {
    if (!fgRes.ok || !bgRes.ok) return null;
    const e = effectivePair(fgRes.color, bgRes.color);
    const ratio = contrastRatio(e.fg, e.bg);
    return { ratio, fgHex: toHex(e.fg, false), bgHex: toHex(e.bg, false), translucent: fgRes.color.a < 1 || bgRes.color.a < 1, fg: fgRes.color, bg: bgRes.color };
  }, [fgRes, bgRes]);

  const fix = useMemo(() => (fgRes.ok && bgRes.ok ? suggestFixes(fgRes.color, bgRes.color, goalRatio) : null), [fgRes, bgRes, goalRatio]);

  const palette = useMemo(() => parsePalette(state.palette), [state.palette]);

  const grid = useMemo(() => {
    const cols = palette.colors;
    let total = 0;
    let aa = 0;
    let aaa = 0;
    let large = 0;
    const rows = cols.map((t) =>
      cols.map((b) => {
        if (t === b) return null;
        const e = effectivePair(t.color, b.color);
        const ratio = contrastRatio(e.fg, e.bg);
        total++;
        if (meets(ratio, 4.5)) aa++;
        if (meets(ratio, 7)) aaa++;
        if (meets(ratio, 3)) large++;
        return { ratio, level: bestLevel(ratio), fgHex: toHex(e.fg, false), bgHex: toHex(e.bg, false) };
      }),
    );
    return { rows, total, aa, aaa, large };
  }, [palette]);

  const swap = () => patch({ fg: state.bg, bg: state.fg });
  const reset = () => patch({ fg: DEFAULT_STATE.fg, bg: DEFAULT_STATE.bg, sample: DEFAULT_STATE.sample, target: "aa" });

  const openPair = (fgHex: string, bgHex: string) => {
    patch({ mode: "pair", fg: fgHex, bg: bgHex });
    panelRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const shareLink = () => {
    const hash = encodeHash(state);
    return `${window.location.origin}${window.location.pathname}${hash ? `#${hash}` : ""}`;
  };

  const bothEmpty = !fgRes.ok && !bgRes.ok && fgRes.reason === "empty" && bgRes.reason === "empty";

  return (
    <div ref={panelRef} className="scroll-mt-20">
      <ToolPanel>
        <Tabs
          label="Checker mode"
          value={state.mode}
          onChange={(mode) => patch({ mode })}
          options={[
            { value: "pair", label: "Check a pair" },
            { value: "palette", label: "Check a palette" },
          ]}
        />

        {state.mode === "pair" && (
          <>
            <ToolGrid>
              <ColorField label="Text color" value={state.fg} onChange={(v) => patch({ fg: v })} result={fgRes} />
              <ColorField label="Background color" value={state.bg} onChange={(v) => patch({ bg: v })} result={bgRes} />
            </ToolGrid>

            <ToolActions>
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeftRight className="h-4 w-4" aria-hidden />} onClick={swap}>
                Swap colors
              </Button>
              <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={reset}>
                Reset
              </Button>
              <span className="label-mono ml-1">Try</span>
              {EXAMPLES.map((ex) => (
                <Button
                  key={ex.label}
                  variant="outline"
                  size="sm"
                  onClick={() => patch({ fg: ex.fg, bg: ex.bg })}
                  leftIcon={
                    <span
                      aria-hidden
                      className="inline-block h-3.5 w-3.5 rounded-sm border border-border-strong"
                      style={{ background: `linear-gradient(135deg, ${ex.fg} 50%, ${ex.bg} 50%)` }}
                    />
                  }
                >
                  {ex.label}
                </Button>
              ))}
            </ToolActions>

            {!pair && (
              <Alert variant={bothEmpty ? "info" : "warning"} title={bothEmpty ? "Enter two colors" : "Fix the highlighted color"}>
                {bothEmpty
                  ? "Type or pick a text color and a background color to see the contrast ratio."
                  : "The ratio appears as soon as both fields hold a color this tool can read."}
              </Alert>
            )}

            {pair && fix && (
              <>
                <ToolSection title="Result" className="pt-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <div className="flex flex-col gap-3">
                      <div aria-live="polite" aria-atomic="true">
                        <Stat emphasis label="Contrast ratio" value={`${formatRatio(pair.ratio)}:1`} hint={summarize(pair.ratio)} />
                      </div>
                      <ComplianceTable ratio={pair.ratio} />
                      <p className="text-xs text-muted">
                        Ratios are rounded to two decimals, except that a failing ratio is never rounded up onto a threshold: WCAG has no rounding rule, so 4.499 shows as 4.49 and does not meet 4.5:1.
                      </p>
                      {pair.translucent && (
                        <Alert variant="info">
                          A translucent text color is blended over the background, and a translucent background over white, before measuring. The measured colors are {pair.fgHex} on {pair.bgHex}.
                        </Alert>
                      )}
                    </div>
                    <Preview fgHex={pair.fgHex} bgHex={pair.bgHex} sample={state.sample} onSample={(v) => patch({ sample: v })} />
                  </div>
                </ToolSection>

                <ToolSection
                  title="Nearest passing colors"
                  description="Keeps the hue and chroma and moves only OKLCH lightness, so the fix stays close to your design."
                >
                  <Select
                    label="Goal"
                    value={state.target}
                    onChange={(e) => patch({ target: e.target.value as Goal })}
                    options={GOALS.map((g) => ({ value: g.value, label: g.label }))}
                    containerClassName="max-w-sm"
                  />
                  {fix.passes ? (
                    <Alert variant="success" title="Already meets this goal">
                      At {formatRatio(fix.ratio)}:1 this pair reaches {GOALS.find((g) => g.value === state.target)?.label}. Pick a stricter goal to see how far it could go.
                    </Alert>
                  ) : fix.suggestions.length === 0 ? (
                    <Alert variant="warning" title="No fix found">
                      Neither moving the text color nor the background reaches {goalRatio}:1 with these hues. Try a different goal or change both colors by hand.
                    </Alert>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {fix.suggestions.map((s, i) => (
                        <SuggestionCard
                          key={`${s.role}-${s.direction}`}
                          s={s}
                          current={{ fgHex: pair.fgHex, bgHex: pair.bgHex }}
                          closest={i === 0 && fix.suggestions.length > 1}
                          onApply={() => patch({ fg: s.fgHex, bg: s.bgHex })}
                        />
                      ))}
                    </div>
                  )}
                </ToolSection>

                <ToolActions>
                  <CopyAction label="Copy report" getText={() => buildReport(pair.fg, pair.bg)} />
                  <CopyAction label="Copy CSS" getText={() => buildCss(pair.fg, pair.bg)} />
                  <CopyAction label="Copy share link" getText={shareLink} icon={<Link2 className="h-4 w-4" aria-hidden />} />
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" aria-hidden />}
                    onClick={() => downloadText(buildReport(pair.fg, pair.bg), "contrast-report.txt")}
                  >
                    Download report
                  </Button>
                </ToolActions>
              </>
            )}
          </>
        )}

        {state.mode === "palette" && (
          <>
            <Textarea
              label="Palette colors"
              mono
              rows={6}
              value={state.palette}
              maxLength={MAX_PALETTE_TEXT}
              onChange={(e) => patch({ palette: e.target.value })}
              placeholder={"#1a1916\n#ffffff\nrgb(201 64 10)\noklch(60% 0.12 200)"}
              hint={`One color per line, or separated by commas. HEX, RGB, HSL, OKLCH and CSS names work. Up to ${MAX_PALETTE} colors.`}
              labelAddon={`${palette.colors.length} colors`}
            />
            <ToolActions>
              <Button variant="secondary" size="sm" onClick={() => patch({ palette: DEFAULT_PALETTE })}>
                Load example palette
              </Button>
              <Button variant="ghost" size="sm" onClick={() => patch({ palette: "" })} disabled={!state.palette}>
                Clear
              </Button>
            </ToolActions>

            {palette.invalid.length > 0 && (
              <Alert variant="warning" title={`Skipped ${palette.invalid.length} ${palette.invalid.length === 1 ? "entry" : "entries"} that could not be read as a color`}>
                {palette.invalid.slice(0, 6).join(", ")}
                {palette.invalid.length > 6 ? ", …" : ""}
              </Alert>
            )}
            {palette.duplicates > 0 && (
              <Alert variant="info" title={`${palette.duplicates} duplicate ${palette.duplicates === 1 ? "color was" : "colors were"} merged`}>
                Each color appears once in the grid.
              </Alert>
            )}
            {palette.truncated && (
              <Alert variant="info" title={`Only the first ${MAX_PALETTE} colors are checked`}>
                The grid holds up to {MAX_PALETTE} colors and reads the first {MAX_PALETTE_TEXT.toLocaleString("en-US")} characters of the list. Remove some colors to check the rest.
              </Alert>
            )}

            {palette.colors.length < 2 ? (
              <Alert variant="info" title="Add at least two colors">
                The grid compares every color used as text against every color used as a background.
              </Alert>
            ) : (
              <>
                <StatGrid>
                  <Stat label="Colors" value={palette.colors.length} />
                  <Stat label="Pairs checked" value={grid.total} hint="Every text and background combination" />
                  <Stat emphasis label="Meet AA" value={`${grid.aa} / ${grid.total}`} hint="Normal text, 4.5:1 or more" />
                  <Stat label="Meet AAA" value={`${grid.aaa} / ${grid.total}`} hint="Normal text, 7:1 or more" />
                </StatGrid>

                <Toggle
                  checked={state.fade}
                  onChange={(v) => patch({ fade: v })}
                  label="Fade pairs that fail AA for normal text"
                  description={`${grid.large - grid.aa} more pairs still work for large text and UI components.`}
                />

                <div className="scroll-thin overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-max border-collapse text-xs">
                    <caption className="sr-only">Contrast ratios for every text color (rows) on every background color (columns)</caption>
                    <thead>
                      <tr className="bg-surface-2">
                        <th scope="col" className="label-mono px-2 py-2 text-left font-medium">
                          Text ↓ / Background →
                        </th>
                        {palette.colors.map((c) => (
                          <th key={c.hex} scope="col" className="px-1 py-2 text-left font-medium">
                            <span className="flex items-center gap-1.5 font-mono text-[11px] text-fg">
                              <span aria-hidden className="inline-block h-3 w-3 shrink-0 rounded-sm border border-border-strong" style={{ backgroundColor: c.hex }} />
                              {c.hex}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {palette.colors.map((t, i) => (
                        <tr key={t.hex} className="border-t border-border">
                          <th scope="row" className="bg-surface-2 px-2 py-1.5 text-left font-medium">
                            <span className="flex items-center gap-1.5 font-mono text-[11px] text-fg">
                              <span aria-hidden className="inline-block h-3 w-3 shrink-0 rounded-sm border border-border-strong" style={{ backgroundColor: t.hex }} />
                              {t.hex}
                            </span>
                          </th>
                          {palette.colors.map((b, j) => {
                            const cell = grid.rows[i][j];
                            if (!cell) {
                              return (
                                <td key={b.hex} className="p-1 text-center text-muted">
                                  <span aria-label="Same color">—</span>
                                </td>
                              );
                            }
                            const failsAa = !meets(cell.ratio, 4.5);
                            return (
                              <td key={b.hex} className="p-1">
                                <button
                                  type="button"
                                  onClick={() => openPair(cell.fgHex, cell.bgHex)}
                                  aria-label={`Text ${cell.fgHex} on background ${cell.bgHex}: ratio ${formatRatio(cell.ratio)} to 1, ${levelSentence(cell.level)}. Open in the pair checker.`}
                                  className={cn(
                                    "flex w-full min-w-[76px] flex-col overflow-hidden rounded-md border border-border text-left transition-opacity hover:border-fg/40",
                                    state.fade && failsAa && "opacity-35",
                                  )}
                                >
                                  <span className="flex h-9 items-center justify-center text-base font-semibold" style={{ backgroundColor: cell.bgHex, color: cell.fgHex }}>
                                    Aa
                                  </span>
                                  <span className="flex items-center justify-between gap-1 bg-surface px-1.5 py-1 font-mono text-[11px]">
                                    <span className="tabular-nums text-fg-secondary">{formatRatio(cell.ratio)}</span>
                                    <span className={cn("font-semibold", LEVEL_STYLE[cell.level])}>{cell.level}</span>
                                  </span>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted">
                  <span className="font-semibold text-success">AAA</span> 7:1 or more · <span className="font-semibold text-success">AA</span> 4.5:1 or more ·{" "}
                  <span className="font-semibold text-warning">Large</span> 3:1 or more, so large text and UI components only ·{" "}
                  <span className="font-semibold text-danger">Fail</span> under 3:1. Select any cell to open that pair.
                </p>

                <ToolActions>
                  <CopyAction label="Copy CSV" getText={() => buildCsv(palette.colors)} />
                  <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" aria-hidden />} onClick={() => downloadText(buildCsv(palette.colors), "contrast-grid.csv", "text/csv;charset=utf-8")}>
                    Download CSV
                  </Button>
                  <CopyAction label="Copy share link" getText={shareLink} icon={<Link2 className="h-4 w-4" aria-hidden />} />
                </ToolActions>
              </>
            )}
          </>
        )}
      </ToolPanel>
    </div>
  );
}
