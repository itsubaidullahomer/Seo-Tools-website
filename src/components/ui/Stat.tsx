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

/** Compact metric tile (e.g. Words / Characters / Sentences). */
export function Stat({ label, value, hint, emphasis, className }: StatProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-xl border border-border px-4 py-3",
        emphasis ? "bg-primary-soft border-primary/30" : "bg-surface-2",
        className,
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      <span className={cn("text-2xl font-semibold tabular-nums tracking-tight", emphasis ? "text-primary" : "text-fg")}>{value}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

/** Responsive grid for Stat tiles. */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", className)}>{children}</div>;
}
