"use client";

import type { CSSProperties, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { FONT_PX, GEOMETRY, HEADER, LINE_PX, NEAR_RATIO, PALETTES, SERP_FONT, type Device, type Palette, type Theme } from "./config";
import type { Run } from "./measure";
import type { Check, CompareRow, SnippetLayout } from "./snippet";

const DEVICE_NAME: Record<Device, string> = { desktop: "Desktop", mobile: "Mobile" };
const round = (n: number) => Math.round(n);

/* -------------------------------------------------------------------------- */
/* The mock result card                                                        */
/* -------------------------------------------------------------------------- */

function RunLine({ runs, height, fontPx, palette, base, testId }: { runs: Run[]; height: number; fontPx: number; palette: Palette; base: string; testId?: string }) {
  return (
    <div data-testid={testId} style={{ height, lineHeight: `${height}px`, fontSize: fontPx, color: base, whiteSpace: "nowrap" }}>
      {runs.map((r, i) => {
        if (r.style === "bold") {
          return (
            <b key={i} style={{ color: palette.bold, fontWeight: 700 }}>
              {r.text}
            </b>
          );
        }
        if (r.style === "muted") {
          return (
            <span key={i} style={{ color: palette.muted }}>
              {r.text}
            </span>
          );
        }
        return <span key={i}>{r.text}</span>;
      })}
    </div>
  );
}

/**
 * A generic mock of one search result: favicon, site name, breadcrumb, title and
 * description. Every line comes pre-broken from buildLayout, and the PNG export draws
 * the same lines. It uses no logo, no search bar and no brand colours.
 */
export function SnippetCard({ layout, theme, favicon, id }: { layout: SnippetLayout; theme: Theme; favicon: string; id: string }) {
  const g = GEOMETRY[layout.device];
  const p = PALETTES[theme];
  const box: CSSProperties = {
    width: g.outer,
    height: layout.height,
    padding: `${g.padTop}px ${g.pad}px ${g.padBottom}px`,
    background: p.bg,
    boxShadow: `inset 0 0 0 1px ${p.border}`,
    fontFamily: SERP_FONT,
    boxSizing: "border-box",
    borderRadius: 12,
    position: "relative",
  };
  return (
    <div style={box} data-testid={`card-${id}`} data-device={layout.device} data-theme={theme}>
      <div style={{ display: "flex", alignItems: "center", height: HEADER.height, gap: HEADER.gap, paddingRight: HEADER.menu }}>
        <span
          aria-hidden
          style={{
            width: HEADER.favicon,
            height: HEADER.favicon,
            flex: "none",
            borderRadius: "50%",
            background: p.faviconBg,
            boxShadow: `inset 0 0 0 1px ${p.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: p.faviconFg,
            fontSize: 13,
            fontWeight: 700,
            overflow: "hidden",
          }}
        >
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element -- a small local data URL, not a remote image
            <img src={favicon} alt="" width={HEADER.faviconImage} height={HEADER.faviconImage} style={{ width: HEADER.faviconImage, height: HEADER.faviconImage, borderRadius: 3, objectFit: "contain" }} />
          ) : (
            layout.monogram
          )}
        </span>
        <div style={{ minWidth: 0, whiteSpace: "nowrap" }}>
          <div data-testid={`site-${id}`} style={{ fontSize: FONT_PX.site, lineHeight: `${LINE_PX.site}px`, height: LINE_PX.site, color: p.site }}>
            {layout.siteName}
          </div>
          <div data-testid={`crumb-${id}`} style={{ fontSize: FONT_PX.crumb, lineHeight: `${LINE_PX.crumb}px`, height: LINE_PX.crumb, color: p.crumb }}>
            {layout.crumb}
          </div>
        </div>
      </div>
      <span aria-hidden style={{ position: "absolute", right: g.pad - 2, top: g.padTop + HEADER.height / 2 - 8, display: "flex", flexDirection: "column", gap: 3.4 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 3.2, height: 3.2, borderRadius: "50%", background: p.dots, display: "block" }} />
        ))}
      </span>
      <div style={{ marginTop: HEADER.belowGap }}>
        {layout.titleLines.map((runs, i) => (
          <RunLine key={i} runs={runs} height={LINE_PX.title} fontPx={FONT_PX.title} palette={p} base={p.title} testId={`title-${id}-${i}`} />
        ))}
      </div>
      <div style={{ marginTop: HEADER.titleGap }}>
        {layout.descriptionLines.map((runs, i) => (
          <RunLine key={i} runs={runs} height={LINE_PX.description} fontPx={FONT_PX.description} palette={p} base={p.text} testId={`desc-${id}-${i}`} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pixel meter                                                                 */
/* -------------------------------------------------------------------------- */

/** One bar per device showing estimated pixels against that device's budget. */
export function PixelMeter({
  id,
  label,
  layouts,
  kind,
  note,
}: {
  id: string;
  label: string;
  layouts: Record<Device, SnippetLayout>;
  kind: "title" | "description";
  note?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5" role="group" aria-label={label}>
      {(["desktop", "mobile"] as Device[]).map((d) => {
        const l = layouts[d];
        const width = kind === "title" ? l.titleWidth : l.descriptionWidth;
        const limit = kind === "title" ? l.titleLimit : l.descriptionLimit;
        const cut = kind === "title" ? l.titleCut : l.descriptionCut;
        const ratio = limit ? width / limit : 0;
        const tone = cut ? "bg-danger" : ratio >= NEAR_RATIO ? "bg-warning" : "bg-success";
        const empty = width === 0;
        return (
          <div key={d} className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-2 font-mono text-[11px] text-muted" data-testid={`meter-${id}-${kind}-${d}`} data-cut={cut ? "true" : "false"}>
            <span>{DEVICE_NAME[d]}</span>
            <div
              role="meter"
              aria-label={`${label}, ${d}`}
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-valuenow={Math.round(Math.min(width, limit))}
              aria-valuetext={`${round(width)} of ${limit} pixels${cut ? ", cut off" : ""}`}
              className="h-2 overflow-hidden rounded-full border border-border bg-surface-3"
            >
              <div className={cn("h-full rounded-full transition-[width] duration-200", empty ? "bg-transparent" : tone)} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
            </div>
            <span className={cn("tabular-nums", cut ? "font-semibold text-danger" : "text-fg-secondary")}>
              {round(width)} / {limit} px
            </span>
          </div>
        );
      })}
      {note && <p className="text-[11px] leading-snug text-muted">{note}</p>}
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
/* Compare table                                                               */
/* -------------------------------------------------------------------------- */

function toneVariant(t: CompareRow["a"]["tone"]) {
  return t === "ok" ? "success" : t === "warn" ? "warning" : t === "bad" ? "danger" : "outline";
}

export function CompareTable({ rows }: { rows: CompareRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" data-testid="compare-table">
        <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-2.5 py-2 font-medium sm:px-3.5">
              Measure
            </th>
            <th scope="col" className="px-2.5 py-2 font-medium sm:px-3.5">
              Version A
            </th>
            <th scope="col" className="px-2.5 py-2 font-medium sm:px-3.5">
              Version B
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="px-2.5 py-2 text-left align-top text-[13px] font-medium text-fg sm:px-3.5 sm:text-sm">
                {r.label}
              </th>
              <td className="px-2 py-2 align-top sm:px-3.5">
                <Badge variant={toneVariant(r.a.tone)} className="whitespace-normal text-left">{r.a.text}</Badge>
              </td>
              <td className="px-2 py-2 align-top sm:px-3.5">
                <Badge variant={toneVariant(r.b.tone)} className="whitespace-normal text-left">{r.b.text}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
