"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "./Button";

export interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "children"> {
  /** Text to copy. */
  text: string;
  /** Button label; defaults to "Copy". */
  label?: string;
  copiedLabel?: string;
}

/** Writes `text` to the clipboard and shows a short confirmation. */
export function CopyButton({ text, label = "Copy", copiedLabel = "Copied!", variant = "primary", ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <Button
      variant={variant}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Fallback for older browsers / insecure contexts.
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
      }}
      leftIcon={copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      aria-live="polite"
      {...props}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
