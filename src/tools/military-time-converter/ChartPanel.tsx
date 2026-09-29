import { useMemo } from "react";
import { Download, FileDown, Printer } from "lucide-react";
import { Alert, Badge, Button, CopyButton, Select, Tabs, ToolActions } from "@/components/ui";
import { downloadBlob, downloadText, cn } from "@/lib/utils";
import { STEPS, chartCsv, chartText, hourRows, minuteGrid, pad2, type ChartView, type NowInfo, type Step } from "./logic";
import { PAPERS, buildChartPdf, type Paper } from "./pdf";
import { buildPrintHtml, printHtml } from "./print";
import { thClass } from "./shared";
import type { Settings, Update } from "./settings";

const VIEW_OPTIONS = [
  { value: "hours" as const, label: "By hour" },
  { value: "minutes" as const, label: "By minute" },
];

const STEP_OPTIONS = STEPS.map((n) => ({ value: String(n), label: `Every ${n} minutes` }));
const PAPER_OPTIONS = (Object.keys(PAPERS) as Paper[]).map((p) => ({ value: p, label: PAPERS[p].label }));

function HoursTable({ nowHour }: { nowHour: number | null }) {
  const rows = useMemo(() => hourRows(), []);
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[18rem] text-sm" data-testid="hours-table">
        <caption className="sr-only">Military time chart by hour, 0000 to 2300</caption>
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th scope="col" className={thClass}>
              Military
            </th>
            <th scope="col" className={thClass}>
              12-hour
            </th>
            <th scope="col" className={thClass}>
              How to say it
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => {
            const isNow = nowHour === r.hour;
            return (
              <tr key={r.hour} data-hour={r.hour} data-now={isNow ? "true" : undefined} className={cn(isNow ? "bg-primary-soft" : r.note ? "bg-surface-2" : undefined)}>
                <th scope="row" className="px-3 py-1.5 text-left font-mono text-base font-semibold tabular-nums text-fg">
                  {r.military}
                </th>
                <td className="px-3 py-1.5 text-fg">
                  {r.twelve}
                  {r.note && (
                    <>
                      {" "}
                      <span className="ml-1 text-xs text-muted">{r.note.toLowerCase()}</span>
                    </>
                  )}
                  {isNow && (
                    <>
                      {" "}
                      <Badge variant="primary" className="ml-1">
                        now
                      </Badge>
                    </>
                  )}
                </td>
                <td className="px-3 py-1.5 text-fg-secondary">{r.spoken}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MinutesTable({ step, nowHour }: { step: Step; nowHour: number | null }) {
  const grid = useMemo(() => minuteGrid(step), [step]);
  return (
    <div className="max-h-[36rem] overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[34rem] text-sm" data-testid="minutes-table">
        <caption className="sr-only">Military time chart by minute in steps of {step} minutes</caption>
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-border bg-surface-2">
            <th scope="col" className={cn(thClass, "sticky left-0 bg-surface-2")}>
              12-hour
            </th>
            {grid.columns.map((c) => (
              <th key={c} scope="col" className="label-mono px-2 py-2 text-center font-normal">
                :{pad2(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {grid.rows.map((r) => {
            const isNow = nowHour === r.hour;
            const special = r.hour === 0 || r.hour === 12;
            return (
              <tr key={r.hour} data-now={isNow ? "true" : undefined}>
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 whitespace-nowrap px-3 py-1.5 text-left text-xs font-semibold",
                    isNow ? "bg-primary-soft text-primary" : special ? "bg-surface-2 text-fg" : "bg-surface text-fg",
                  )}
                >
                  {r.label}
                </th>
                {r.cells.map((cell, i) => (
                  <td key={i} className={cn("px-2 py-1.5 text-center font-mono text-[13px] tabular-nums text-fg", isNow ? "bg-primary-soft" : special ? "bg-surface-2" : undefined)}>
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ChartPanel({ s, update, now }: { s: Settings; update: Update; now: NowInfo | null }) {
  const nowHour = now ? now.local.hour : null;
  const view: ChartView = s.chartView;

  const sourceLabel = () => (typeof window !== "undefined" ? `Free military time chart from ${window.location.host}` : "Free military time chart");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-fg">Chart</span>
          <Tabs label="Chart view" size="sm" value={view} onChange={(v: ChartView) => update({ chartView: v })} options={VIEW_OPTIONS} />
        </div>
        <Select
          label="Minute steps"
          options={STEP_OPTIONS}
          value={String(s.step)}
          onChange={(e) => update({ step: Number(e.target.value) as Step })}
          selectSize="sm"
          containerClassName="w-44"
        />
        <Select
          label="Paper size"
          options={PAPER_OPTIONS}
          value={s.paper}
          onChange={(e) => update({ paper: e.target.value as Paper })}
          selectSize="sm"
          containerClassName="w-36"
        />
      </div>

      <ToolActions>
        <Button variant="accent" leftIcon={<Printer className="h-4 w-4" aria-hidden />} onClick={() => printHtml(buildPrintHtml(s.paper, s.step, sourceLabel()))}>
          Print chart
        </Button>
        <Button
          variant="secondary"
          leftIcon={<FileDown className="h-4 w-4" aria-hidden />}
          onClick={() =>
            downloadBlob(new Blob([buildChartPdf(s.paper, s.step, sourceLabel())], { type: "application/pdf" }), `military-time-chart-${s.paper}.pdf`)
          }
        >
          Download PDF
        </Button>
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" aria-hidden />}
          onClick={() => downloadText(chartCsv(view, s.step), `military-time-chart-${view}.csv`, "text/csv;charset=utf-8")}
        >
          Download CSV
        </Button>
        <CopyButton text={chartText(view, s.step)} label="Copy chart" variant="secondary" />
      </ToolActions>

      <Alert variant="info" title="Printing and PDF include both pages">
        Page 1 is the 24-hour chart with how to say each hour. Page 2 is the minute chart in steps of {s.step} minutes (change it with Minute steps). The paper size sets
        the print page and the PDF; if your browser ignores it, choose {PAPERS[s.paper].label} in the print dialog.
      </Alert>

      {view === "hours" ? <HoursTable nowHour={nowHour} /> : <MinutesTable step={s.step} nowHour={nowHour} />}
    </div>
  );
}
