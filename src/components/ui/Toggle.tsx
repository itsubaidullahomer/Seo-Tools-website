"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Accessible switch. Prefer this over checkboxes for on/off options in tools. */
export function Toggle({ checked, onChange, label, description, disabled, className }: ToggleProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3 select-none", disabled && "cursor-not-allowed opacity-60", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          checked ? "border-primary bg-primary" : "border-border-strong bg-surface-3",
        )}
      >
        <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-[18px]" : "translate-x-[3px]")} />
      </button>
      <span className="flex flex-col">
        <span className="text-[13px] font-medium text-fg">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onChange, label, disabled, className }: CheckboxProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("inline-flex cursor-pointer items-center gap-2 text-[13px] text-fg select-none", disabled && "opacity-60", className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border-strong accent-[var(--primary)]"
      />
      {label}
    </label>
  );
}
