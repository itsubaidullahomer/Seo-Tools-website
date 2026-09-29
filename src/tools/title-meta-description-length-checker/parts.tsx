"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Alert, Badge, Button, Input, Stat, StatGrid } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LIMITS,
  LIMIT_RANGE,
  LIMITS_REVIEWED,
  MIN_CHARS,
  PREVIEW_WIDTH,
  type Device,
  type Limits,
} from "./limits";
import { statusLabel, visibleChars, type Check, type FieldResult, type KeywordInfo } from "./logic";

const SERP_FONT = 'Arial, "Liberation Sans", Arimo, Helvetica, sans-serif';
const DEVICE_NAME: Record<Device, string> = { desktop: "Desktop", mobile: "Mobile" };

const px = (n: number) => `${Math.round(n)} px`;

/* -------------------------------------------------------------------------- */
/* Results: stats, meter, device badges, cut-off                               */
/* -------------------------------------------------------------------------- */

function verdictHint(res: FieldResult): string {
  if (res.status === "long") return `cut after ${visibleChars(res.view)} characters`;
  if (res.status === "short") return `aim for ${MIN_CHARS[res.kind]}+ characters`;
  if (res.near) return "leave a small margin";
  return `about ${res.fitChars} characters fit`;
}

export function ResultStats({ res }: { res: FieldResult }) {
  const over = res.view.remaining < 0;
  return (
    <StatGrid>
      <Stat label="Estimated width" value={px(res.width)} hint={`of ${res.view.limit} px, ${res.device}`} emphasis />
      <Stat label="Characters" value={res.chars} hint={`${res.words} word${res.words === 1 ? "" : "s"}`} />
      <Stat label={over ? "Over by" : "Space left"} value={px(Math.abs(res.view.remaining))} hint={over ? "will be cut off" : "before the cut-off"} />
      <Stat label="Verdict" value={statusLabel(res.status, res.near)} hint={verdictHint(res)} />
    </StatGrid>
  );
}

export function WidthMeter({ res }: { res: FieldResult }) {
  const pct = Math.min(100, res.view.ratio * 100);
  const tone = res.status === "long" ? "bg-danger" : res.status === "short" || res.near ? "bg-warning" : "bg-success";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-muted">
        <span>0 px</span>
        <span>{res.view.limit} px limit</span>
      </div>
      <div
        role="meter"
        aria-label={`Estimated pixel width of the ${res.kind}`}
        aria-valuemin={0}
        aria-valuemax={res.view.limit}
        aria-valuenow={Math.round(Math.min(res.width, res.view.limit))}
        aria-valuetext={`${px(res.width)} of ${px(res.view.limit)}`}
        className="h-3 overflow-hidden rounded-full border border-border bg-surface-3"
      >
        <div className={cn("h-full rounded-full transition-[width] duration-200", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FitBadges({ res }: { res: FieldResult }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Fit on each device">
      {(["desktop", "mobile"] as Device[]).map((d) => {
        const v = res.byDevice[d];
        return (
          <li key={d}>
            <Badge variant={v.truncated ? "danger" : "success"} data-testid={`fit-${d}`}>
              {DEVICE_NAME[d]} {v.limit} px: {v.truncated ? `cut after ${visibleChars(v)} chars` : "fits"}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

export function CutLine({ res }: { res: FieldResult }) {
  if (!res.view.truncated) return null;
  const hidden = Array.from(res.view.hidden);
  const shown = hidden.slice(0, 200).join("");
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm" data-testid="cutoff">
      <p className="label-mono">Cut-off point on {res.device}</p>
      <p className="mt-1 break-words leading-relaxed">
        <span className="text-fg">{res.view.visible}</span>
        <span className="font-semibold text-danger">...</span>{" "}
        <span className="text-muted line-through decoration-danger/60">{shown}</span>
        {hidden.length > 200 && <span className="text-muted">...</span>}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Snippet preview                                                             */
/* -------------------------------------------------------------------------- */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, keyword }: { text: string; keyword: string }) {
  const words = keyword.split(/\s+/).filter((w) => w.length > 0);
  if (!words.length) return <>{text}</>;
  // Try the whole phrase first so "meta description" is bolded as one run, then each word.
  const terms = words.length > 1 ? [words.join(" "), ...words] : words;
  const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "iu");
  return (
    <>
      {text.split(re).map((part, i) => (i % 2 === 1 ? <b key={i} className="font-semibold text-fg">{part}</b> : <span key={i}>{part}</span>))}
    </>
  );
}

/** Turn a page URL into a "host › path › segment" breadcrumb for the preview. */
export function breadcrumbFor(rawUrl: string): { host: string; crumb: string } {
  const fallback = { host: "example.com", crumb: "example.com › page" };
  const t = rawUrl.trim();
  if (!t) return fallback;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`);
    const host = u.hostname.replace(/^www\./, "");
    if (!host) return fallback;
    const segs = u.pathname
      .split("/")
      .filter(Boolean)
      .map((s) => {
        try {
          return decodeURIComponent(s);
        } catch {
          return s;
        }
      });
    return { host, crumb: [host, ...segs].join(" › ") };
  } catch {
    return fallback;
  }
}

export function SnippetPreview({
  device,
  url,
  title,
  description,
  keyword,
}: {
  device: Device;
  url: string;
  title: FieldResult;
  description: FieldResult;
  keyword: string;
}) {
  const { host, crumb } = breadcrumbFor(url);
  const titleText = title.view.truncated ? `${title.view.visible}...` : title.text;
  const descText = description.view.truncated ? `${description.view.visible}...` : description.text;
  const mobile = device === "mobile";
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3 sm:p-4">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="label-mono">Snippet preview, {device}</span>
        <span className="text-[11px] text-muted">Illustration only. Real results vary by query, device and font.</span>
      </div>
      <div className="scroll-thin overflow-x-auto rounded-lg border border-border bg-surface p-4">
        <div style={{ width: PREVIEW_WIDTH[device], maxWidth: mobile ? "100%" : undefined, fontFamily: SERP_FONT }}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[13px] font-semibold uppercase text-fg-secondary" aria-hidden>
              {host.charAt(0)}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[14px] text-fg">{host}</p>
              <p className="truncate text-[12px] text-muted">{crumb}</p>
            </div>
          </div>
          <p
            data-testid="preview-title"
            className={cn("mt-2 text-primary", title.text ? "" : "text-muted", mobile ? "break-words" : "overflow-hidden whitespace-nowrap")}
            style={{ fontSize: 20, lineHeight: 1.3 }}
          >
            {title.text ? titleText : "Your page title appears here"}
          </p>
          <p data-testid="preview-description" className="mt-1 break-words text-fg-secondary" style={{ fontSize: 14, lineHeight: 1.58 }}>
            {description.text ? <Highlight text={descText} keyword={keyword} /> : <span className="text-muted">Your meta description appears here. Without one, Google builds a snippet from the page text.</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Keyword position track                                                      */
/* -------------------------------------------------------------------------- */

export function KeywordTrack({ res, kw }: { res: FieldResult; kw: KeywordInfo | null }) {
  if (!kw) return <p className="text-sm text-muted">Enter a target keyword to see where it sits in the width budget.</p>;
  if (kw.match === "none") return <p className="text-sm text-fg-secondary">&ldquo;{kw.keyword}&rdquo; is not in the {res.kind}.</p>;
  const limit = res.view.limit;
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const textEnd = clamp((Math.min(res.width, limit) / limit) * 100);
  const left = clamp((kw.startPx / limit) * 100);
  const right = clamp((Math.min(kw.endPx, limit) / limit) * 100);
  return (
    <div>
      <div
        className="relative h-3.5 overflow-hidden rounded-full border border-border bg-surface-3"
        role="img"
        aria-label={`The keyword starts ${px(kw.startPx)} into a ${px(limit)} budget`}
        data-testid="keyword-track"
      >
        <div className="absolute inset-y-0 left-0 bg-border-strong" style={{ width: `${textEnd}%` }} />
        <div className="absolute inset-y-0 bg-primary" style={{ left: `${left}%`, width: `${Math.max(right - left, 1.5)}%` }} />
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-muted">
        starts at {px(kw.startPx)} ({Math.round(kw.startRatio * 100)}% of the limit), ends at {px(kw.endPx)}
        {kw.match === "words" ? ", words found separately" : ""}
        {!kw.visible ? ", partly cut off" : ""}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Checklist                                                                   */
/* -------------------------------------------------------------------------- */

const CHECK_ICON: Record<Check["level"], { Icon: typeof Info; className: string; label: string }> = {
  pass: { Icon: CheckCircle2, className: "text-success", label: "Pass" },
  warn: { Icon: AlertTriangle, className: "text-warning", label: "Warning" },
  fail: { Icon: XCircle, className: "text-danger", label: "Problem" },
  info: { Icon: Info, className: "text-muted", label: "Note" },
};

export function CheckList({ checks, label }: { checks: Check[]; label: string }) {
  if (!checks.length) return null;
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface" aria-label={label}>
      {checks.map((c) => {
        const { Icon, className, label: levelLabel } = CHECK_ICON[c.level];
        return (
          <li key={c.id} className="flex gap-2.5 px-3.5 py-2.5" data-check={c.id} data-level={c.level}>
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", className)} aria-hidden />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-fg">
                <span className="sr-only">{levelLabel}: </span>
                {c.label}
              </p>
              <p className="text-xs leading-relaxed text-muted">{c.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Limits panel                                                                */
/* -------------------------------------------------------------------------- */

function LimitInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  // Keep the raw text while typing so "540" is not rejected after "5".
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      label={label}
      type="number"
      inputMode="numeric"
      min={LIMIT_RANGE.min}
      max={LIMIT_RANGE.max}
      inputSize="sm"
      suffix="px"
      className="no-spinner"
      value={draft ?? String(value)}
      onFocus={() => setDraft(String(value))}
      onBlur={() => setDraft(null)}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value.trim() !== "" && Number.isFinite(n) && n >= LIMIT_RANGE.min && n <= LIMIT_RANGE.max) onChange(Math.round(n));
      }}
    />
  );
}

export function LimitsPanel({ limits, onChange }: { limits: Limits; onChange: (l: Limits) => void }) {
  const custom = JSON.stringify(limits) !== JSON.stringify(DEFAULT_LIMITS);
  const set = (kind: "title" | "description", device: Device, n: number) => onChange({ ...limits, [kind]: { ...limits[kind], [device]: n } });
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-xs leading-relaxed text-muted">
      <p>
        <span className="font-medium text-fg-secondary">Limits in use</span> (defaults reviewed {LIMITS_REVIEWED}): title {limits.title.desktop} px desktop and {limits.title.mobile} px mobile, measured at 20 px Arial; description{" "}
        {limits.description.desktop} px desktop and {limits.description.mobile} px mobile, measured at 14 px Arial. Google does not publish fixed limits. It cuts text to fit the device width, so treat every figure as an estimate.
        {custom && (
          <>
            {" "}
            <Badge variant="primary">Custom limits</Badge>
          </>
        )}
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-[13px] font-medium text-fg-secondary hover:text-fg">Adjust limits</summary>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LimitInput label="Title, desktop" value={limits.title.desktop} onChange={(n) => set("title", "desktop", n)} />
          <LimitInput label="Title, mobile" value={limits.title.mobile} onChange={(n) => set("title", "mobile", n)} />
          <LimitInput label="Description, desktop" value={limits.description.desktop} onChange={(n) => set("description", "desktop", n)} />
          <LimitInput label="Description, mobile" value={limits.description.mobile} onChange={(n) => set("description", "mobile", n)} />
        </div>
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={() => onChange(DEFAULT_LIMITS)} disabled={!custom}>
            Reset to defaults
          </Button>
        </div>
      </details>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small layout helpers                                                        */
/* -------------------------------------------------------------------------- */

export function EmptyNotice({ noun, children }: { noun: string; children?: ReactNode }) {
  return (
    <Alert variant="info" title={`Enter a ${noun} to see its width`}>
      {children ?? "The pixel width, cut-off point and checklist appear here as you type. Use the example button to see a title that gets cut off."}
    </Alert>
  );
}
