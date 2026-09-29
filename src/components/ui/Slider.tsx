"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Format the displayed value, e.g. (v) => `${v}px`. */
  format?: (value: number) => string;
  /** Show an editable number box next to the slider. */
  editable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Slider({ label, value, onChange, min, max, step = 1, format, editable = true, disabled, className }: SliderProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {editable ? (
          <input
            type="number"
            aria-label={`${typeof label === "string" ? label : "Value"} (number)`}
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
            }}
            className="no-spinner h-7 w-20 rounded-md border border-border bg-surface px-2 text-right text-xs tabular-nums text-fg focus:border-primary focus:outline-none"
          />
        ) : (
          <span className="text-xs tabular-nums text-muted">{format ? format(value) : value}</span>
        )}
      </div>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-3 disabled:cursor-not-allowed"
      />
    </div>
  );
}
