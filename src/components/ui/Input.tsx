import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Field, controlClass } from "./Field";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  labelAddon?: ReactNode;
  /** Text or icon shown inside the control on the left. */
  prefix?: ReactNode;
  /** Text or icon shown inside the control on the right (e.g. a unit). */
  suffix?: ReactNode;
  containerClassName?: string;
  inputSize?: "sm" | "md" | "lg";
}

const sizeClass = { sm: "h-9 text-sm", md: "h-11 text-sm", lg: "h-12 text-base" };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, labelAddon, prefix, suffix, className, containerClassName, inputSize = "md", ...props },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} labelAddon={labelAddon} className={containerClassName}>
      {({ id, describedBy }) => (
        <div className="relative flex items-center">
          {prefix && (
            <span className="pointer-events-none absolute left-3 flex items-center text-sm text-muted">{prefix}</span>
          )}
          <input
            ref={ref}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cn(controlClass, sizeClass[inputSize], "px-3", prefix && "pl-9", suffix && "pr-12", className)}
            {...props}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3 flex items-center text-sm text-muted">{suffix}</span>
          )}
        </div>
      )}
    </Field>
  );
});
