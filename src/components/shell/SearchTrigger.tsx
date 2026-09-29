"use client";

import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { openCommandPalette } from "./palette-events";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};
const isMacClient = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

function useIsMac(): boolean {
  return useSyncExternalStore(noopSubscribe, isMacClient, () => true);
}

/** Button styled like a search field; opens the ⌘K command palette. */
export function SearchTrigger({ variant = "bar", placeholder = "Search tools…", className }: { variant?: "bar" | "hero" | "icon"; placeholder?: string; className?: string }) {
  const isMac = useIsMac();
  const shortcut = isMac ? "⌘K" : "Ctrl K";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Search tools"
        className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-secondary hover:bg-surface-2 hover:text-fg", className)}
      >
        <Search className="h-[18px] w-[18px]" aria-hidden />
      </button>
    );
  }

  const hero = variant === "hero";
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Search tools"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        "group flex w-full items-center gap-2.5 border border-border-strong bg-surface text-left text-muted transition-[border-color,box-shadow] hover:border-fg/30",
        hero ? "h-14 rounded-xl px-4 text-[15px] shadow-card-lg" : "h-9 rounded-lg px-3 text-[13px]",
        className,
      )}
    >
      <Search className={cn("shrink-0", hero ? "h-5 w-5 text-primary" : "h-4 w-4")} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{placeholder}</span>
      <span className={cn("kbd", hero && "h-6 px-1.5 text-xs")} suppressHydrationWarning>
        {shortcut}
      </span>
    </button>
  );
}
