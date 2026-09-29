import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Outer card every tool renders into. Keeps spacing consistent across 500 tools. */
export function ToolPanel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-5 rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}

/** Row of action buttons under an input. Wraps on small screens. */
export function ToolActions({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

/** Two-column layout (stacked on mobile) for input/output or controls/preview. */
export function ToolGrid({ className, children, cols = 2, ...props }: HTMLAttributes<HTMLDivElement> & { cols?: 2 | 3 }) {
  return (
    <div className={cn("grid gap-4", cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2", className)} {...props}>
      {children}
    </div>
  );
}

/** Small labelled section inside a panel. */
export function ToolSection({ title, description, children, className }: { title?: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {(title || description) && (
        <div>
          {title && <h3 className="text-sm font-semibold text-fg">{title}</h3>}
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
