"use client";

import { useEffect, useRef } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export interface AdSlotProps {
  /** AdSense ad unit ID (data-ad-slot). Optional while using Auto ads only. */
  slot?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical" | "fluid";
  /** Reserve this height so the layout never shifts when the ad loads (CLS). */
  minHeight?: number;
  className?: string;
  /** Visible label above the ad – AdSense requires ads to be distinguishable from content. */
  label?: boolean;
}

/**
 * Reserved-space AdSense unit. Renders NOTHING when no publisher ID is configured,
 * so the site never shows empty boxes or fake ads during the AdSense review.
 *
 * Placement rules (AdSense policy): keep ads away from tool buttons, never place
 * them where they could be mistaken for the tool's output, and never ask for clicks.
 */
export function AdSlot({ slot, format = "auto", minHeight = 280, className, label = true }: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const client = siteConfig.adsenseClient;

  useEffect(() => {
    if (!client || pushed.current || !ref.current) return;
    // Avoid double-push on fast refresh / re-mounts.
    if (ref.current.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blockers throw here; nothing to do.
    }
  }, [client]);

  if (!client) return null;

  return (
    <div className={cn("ad-slot my-8 flex flex-col items-center", className)} style={{ ["--ad-min-height" as string]: `${minHeight}px` }}>
      {label && <span className="mb-1 self-start text-[10px] font-medium uppercase tracking-wider text-muted">Advertisement</span>}
      <ins
        ref={ref}
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight }}
        data-ad-client={client}
        {...(slot ? { "data-ad-slot": slot } : {})}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
