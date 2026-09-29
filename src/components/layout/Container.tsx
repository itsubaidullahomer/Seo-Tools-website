import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, size = "lg", ...props }: HTMLAttributes<HTMLDivElement> & { size?: "md" | "lg" | "xl" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6",
        size === "md" && "max-w-3xl",
        size === "lg" && "max-w-6xl",
        size === "xl" && "max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}
