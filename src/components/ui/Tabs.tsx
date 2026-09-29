"use client";

import { cn } from "@/lib/utils";

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

export interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: TabOption<T>[];
  /** Accessible label for the tab list. */
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

/** Segmented control for switching modes (e.g. Encode / Decode). */
export function Tabs<T extends string>({ value, onChange, options, label = "Mode", size = "md", className }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex max-w-full overflow-x-auto rounded-lg border border-border bg-surface-2 p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md font-medium whitespace-nowrap transition-colors",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
              active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
