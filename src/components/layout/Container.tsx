import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Content wrapper for the main column (to the right of the sidebar). */
export function Container({ className, size = "lg", ...props }: HTMLAttributes<HTMLDivElement> & { size?: "md" | "lg" | "xl" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-10",
        size === "md" && "max-w-3xl",
        size === "lg" && "max-w-5xl",
        size === "xl" && "max-w-6xl",
        className,
      )}
      {...props}
    />
  );
}
