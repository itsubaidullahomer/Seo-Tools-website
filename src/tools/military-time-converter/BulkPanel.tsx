import { useMemo } from "react";
import { Download, RotateCcw, X } from "lucide-react";
import { Alert, Badge, Button, CopyButton, Tabs, Textarea, ToolActions } from "@/components/ui";
import { downloadText } from "@/lib/utils";
import { MAX_BULK_CHARS, MAX_BULK_LINES, bulkCsv, bulkText, convertBulk, type Assume } from "./logic";
import { EXAMPLE_BULK, type Settings, type Update } from "./settings";
import { thClass } from "./shared";

const SHOWN_ROWS = 300;

const ASSUME_OPTIONS = [
  { value: "12h" as const, label: "12-hour input" },
  { value: "24h" as const, label: "Military input" },
];

export function BulkPanel({ s, update }: { s: Settings; update: Update }) {
  const result = useMemo(() => convertBulk(s.bulk, s.bulkAssume), [s.bulk, s.bulkAssume]);
  const { rows } = result;
  const ok = rows.filter((r) => r.kind === "ok").length;
  const ambiguous = rows.filter((r) => r.kind === "ambiguous").length;
  const errors = rows.filter((r) => r.kind === "error").length;

  const column = s.bulkAssume === "12h" ? "military" : "twelve";
  const converted = rows.map((r) => r[column] || "?").join("\n");
  const shown = rows.slice(0, SHOWN_ROWS);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Textarea
          label="Times to convert"
          hint="One time, or one start – end range, per line: 8:00 AM - 4:30 PM, 0800-1630, noon."
          mono
          rows={9}
          value={s.bulk}
          onChange={(e) => update({ bulk: e.target.value })}
          placeholder={"8:00 AM - 4:30 PM\n9:45 PM\n0630"}
          spellCheck={false}
        />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-fg">
              What are you pasting?
            </span>
            <Tabs label="Input format" size="sm" value={s.bulkAssume} onChange={(v: Assume) => update({ bulkAssume: v })} options={ASSUME_OPTIONS} className="self-start" />
            <p className="text-xs text-muted" data-testid="bulk-assume-note">
              {s.bulkAssume === "12h"
                ? "A time with no AM or PM, such as 5:30, is flagged instead of guessed. Times like 1730 and 0630 are always read as military time."
                : "A time with no AM or PM, such as 5:30, is read as a 24-hour time (0530). Add PM to convert it as a 12-hour time."}
            </p>
          </div>
          <p className="text-xs text-muted">
            Ranges also show the duration and note when they cross midnight. Up to {MAX_BULK_LINES.toLocaleString("en-US")} lines are converted at once.
          </p>
        </div>
      </div>

      {result.textTruncated && (
        <Alert variant="warning" title="Text was shortened">
          Only the first {MAX_BULK_CHARS.toLocaleString("en-US")} characters were converted.
        </Alert>
      )}
      {result.truncated && (
        <Alert variant="warning" title="Too many lines">
          Only the first {MAX_BULK_LINES.toLocaleString("en-US")} non-blank lines were converted. Split the list to convert the rest.
        </Alert>
      )}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-2 px-4 py-4 text-sm text-muted" aria-live="polite">
          Paste or type times above and the converted list appears here.
        </div>
      ) : (
        <div className="flex flex-col gap-2" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2" data-testid="bulk-summary">
            <Badge variant="success">{ok} converted</Badge>
            {ambiguous > 0 && <Badge variant="warning">{ambiguous} need AM or PM</Badge>}
            {errors > 0 && <Badge variant="danger">{errors} not recognized</Badge>}
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[34rem] text-sm" data-testid="bulk-table">
              <caption className="sr-only">Converted times</caption>
              <thead>
                <tr className="border-b border-border bg-surface-2">
                  <th scope="col" className={thClass}>
                    Line
                  </th>
                  <th scope="col" className={thClass}>
                    Input
                  </th>
                  <th scope="col" className={thClass}>
                    Military
                  </th>
                  <th scope="col" className={thClass}>
                    12-hour
                  </th>
                  <th scope="col" className={thClass}>
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((r) => (
                  <tr key={r.line} data-kind={r.kind}>
                    <td className="px-3 py-1.5 font-mono text-xs tabular-nums text-muted">{r.line}</td>
                    <td className="px-3 py-1.5 font-mono text-xs text-fg-secondary">{r.input}</td>
                    <td className="px-3 py-1.5 font-mono font-semibold tabular-nums text-fg">{r.military || <span className="text-muted">?</span>}</td>
                    <td className="px-3 py-1.5 font-mono tabular-nums text-fg">{r.twelve || <span className="text-muted">?</span>}</td>
                    <td className={r.kind === "ok" ? "px-3 py-1.5 text-xs text-muted" : "px-3 py-1.5 text-xs text-warning"}>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > SHOWN_ROWS && (
            <p className="text-xs text-muted">
              Showing the first {SHOWN_ROWS} of {rows.length.toLocaleString("en-US")} rows. Copy and download include every row.
            </p>
          )}
        </div>
      )}

      <ToolActions>
        <CopyButton text={converted} label={s.bulkAssume === "12h" ? "Copy military times" : "Copy 12-hour times"} disabled={rows.length === 0} />
        <CopyButton text={bulkText(rows)} label="Copy table" variant="secondary" disabled={rows.length === 0} />
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" aria-hidden />}
          disabled={rows.length === 0}
          onClick={() => downloadText(bulkCsv(rows), "military-time-conversions.csv", "text/csv;charset=utf-8")}
        >
          Download CSV
        </Button>
        <Button variant="ghost" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={() => update({ bulk: EXAMPLE_BULK })}>
          Load example
        </Button>
        <Button variant="ghost" leftIcon={<X className="h-4 w-4" aria-hidden />} onClick={() => update({ bulk: "" })} disabled={!s.bulk}>
          Clear
        </Button>
      </ToolActions>
    </div>
  );
}
