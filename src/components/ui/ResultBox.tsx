import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CopyButton } from "./CopyButton";

export interface ResultBoxProps {
  label?: ReactNode;
  /** Text result. When empty the placeholder is shown. */
  value: string;
  placeholder?: string;
  mono?: boolean;
  /** Show a copy button in the header (default true). */
  copy?: boolean;
  /** Extra header actions (e.g. a Download button). */
  actions?: ReactNode;
  rows?: number;
  className?: string;
}

/** Read-only output area with an integrated header bar and copy button. */
export function ResultBox({ label = "Result", value, placeholder = "Result will appear here", mono, copy = true, actions, rows = 6, className }: ResultBoxProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border-strong bg-surface-2", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-1.5">
        <span className="label-mono">{label}</span>
        <div className="flex items-center gap-1.5">
          {actions}
          {copy && <CopyButton text={value} size="sm" variant="ghost" disabled={!value} />}
        </div>
      </div>
      <textarea
        readOnly
        aria-label={typeof label === "string" ? label : "Result"}
        value={value}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "block w-full resize-y bg-transparent px-3 py-2.5 text-sm leading-relaxed text-fg placeholder:text-muted/70 focus:outline-none",
          mono && "font-mono text-[13px]",
        )}
      />
    </div>
  );
}
