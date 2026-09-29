import type { ReactNode } from "react";
import { CopyButton } from "@/components/ui";
import { cn } from "@/lib/utils";

/** A labelled result value with its own copy button. */
export function ResultRow({
  label,
  value,
  hint,
  emphasis,
  plain,
  testId,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  emphasis?: boolean;
  /** Use body text instead of large monospace (for spoken phrases). */
  plain?: boolean;
  testId?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 overflow-hidden rounded-lg border px-3.5 py-2.5",
        emphasis ? "border-primary/40 bg-primary-soft" : "border-border bg-surface-2",
      )}
    >
      {emphasis && <span className="absolute inset-y-0 left-0 w-[3px] bg-accent-bright" aria-hidden />}
      <div className="min-w-0">
        <div className="label-mono">{label}</div>
        <output
          data-testid={testId}
          className={cn(
            "block break-words",
            plain ? "text-base font-medium text-fg" : "font-mono text-2xl font-semibold tabular-nums tracking-tight",
            !plain && (emphasis ? "text-primary" : "text-fg"),
          )}
        >
          {value}
        </output>
        {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
      </div>
      <CopyButton text={value} size="sm" variant="secondary" className="shrink-0" aria-label={`Copy ${label}`} />
    </div>
  );
}

export const thClass = "label-mono px-3 py-2 text-left font-normal whitespace-nowrap";

/** Card-style container used for the option groups inside a tab. */
export function OptionCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-4", className)}>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {children}
    </section>
  );
}
