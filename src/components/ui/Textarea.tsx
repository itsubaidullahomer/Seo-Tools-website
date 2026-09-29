import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Field, controlClass } from "./Field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  labelAddon?: ReactNode;
  containerClassName?: string;
  /** Use a monospace font (code, JSON, CSV). */
  mono?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, labelAddon, className, containerClassName, mono, rows = 6, ...props },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} labelAddon={labelAddon} className={containerClassName}>
      {({ id, describedBy }) => (
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(controlClass, "min-h-[7rem] resize-y px-3 py-2.5 text-sm leading-relaxed", mono && "font-mono", className)}
          spellCheck={mono ? false : props.spellCheck}
          {...props}
        />
      )}
    </Field>
  );
});
