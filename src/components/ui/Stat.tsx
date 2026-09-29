import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  /** Highlight the primary metric. */
  emphasis?: boolean;
  className?: string;
}

/** Compact instrument-style metric tile (e.g. Words / Characters / Sentences). */
export function Stat({ label, value, hint, emphasis, className }: StatProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 overflow-hidden rounded-lg border px-3.5 py-3",
        emphasis ? "border-primary/40 bg-primary-soft" : "border-border bg-surface-2",
        className,
      )}
    >
      {emphasis && <span className="absolute inset-y-0 left-0 w-[3px] bg-accent-bright" aria-hidden />}
      <span className="label-mono">{label}</span>
      <span className={cn("font-mono text-2xl font-semibold tabular-nums tracking-tight", emphasis ? "text-primary" : "text-fg")}>{value}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

/** Responsive grid for Stat tiles. */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4", className)}>{children}</div>;
}
