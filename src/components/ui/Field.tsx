import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Right-aligned content on the label row (e.g. a counter). */
  labelAddon?: ReactNode;
  className?: string;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}

/**
 * Label + control + hint/error wrapper that wires up accessible ids.
 * Used internally by Input, Textarea and Select; use directly for custom controls.
 */
export function Field({ label, hint, error, labelAddon, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || labelAddon) && (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <label htmlFor={id} className="text-[13px] font-medium text-fg">
              {label}
            </label>
          ) : (
            <span />
          )}
          {labelAddon && <span className="font-mono text-[11px] tabular-nums text-muted">{labelAddon}</span>}
        </div>
      )}
      {children({ id, describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const controlClass =
  "w-full rounded-lg border border-border-strong bg-surface text-fg placeholder:text-muted/70 transition-[border-color,box-shadow] " +
  "hover:border-fg/30 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 " +
  "disabled:opacity-60 disabled:cursor-not-allowed aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15";
