"use client";

import { useId, useState, type ReactNode } from "react";
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
  // While the number box is focused keep the raw text so typing "20" into a
  // min=8 box doesn't snap to 8 after the first keystroke; clamp on blur/Enter.
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const commit = () => {
    if (draft === null) return;
    const n = Number(draft);
    if (draft.trim() !== "" && Number.isFinite(n)) onChange(clamp(n));
    setDraft(null);
  };
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
        </label>
        {editable ? (
          <input
            type="number"
            aria-label={`${typeof label === "string" ? label : "Value"} (number)`}
            value={draft ?? value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onFocus={() => setDraft(String(value))}
            onChange={(e) => {
              setDraft(e.target.value);
              const n = Number(e.target.value);
              if (e.target.value.trim() !== "" && Number.isFinite(n) && n >= min && n <= max) onChange(n);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commit();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="no-spinner h-7 w-20 rounded-md border border-border-strong bg-surface px-2 text-right font-mono text-xs tabular-nums text-fg focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
          />
        ) : (
          <span className="font-mono text-xs tabular-nums text-muted">{format ? format(value) : value}</span>
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
        style={{ background: `linear-gradient(to right, var(--primary) ${pct}%, var(--surface-3) ${pct}%)` }}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed"
      />
    </div>
  );
}
