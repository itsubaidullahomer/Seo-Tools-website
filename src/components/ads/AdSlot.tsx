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
  /** Which configured manual ad unit to use (see `siteConfig.adsenseSlots`). */
  placement: keyof typeof siteConfig.adsenseSlots;
  format?: "auto" | "rectangle" | "horizontal" | "vertical" | "fluid";
  /** Reserve this height so the layout never shifts when the ad loads (CLS). */
  minHeight?: number;
  className?: string;
  /** Visible label above the ad – AdSense requires ads to be distinguishable from content. */
  label?: boolean;
}

/**
 * Reserved-space manual AdSense unit. Renders NOTHING unless both the publisher ID and the
 * placement's slot ID are configured – a manual unit without `data-ad-slot` is invalid, and the
 * site must never show empty boxes or fake ads. With only the publisher ID set, the AdSense
 * script still loads (layout.tsx) and Auto ads decides placement.
 *
 * Placement rules (AdSense policy): keep ads away from tool buttons, never place
 * them where they could be mistaken for the tool's output, and never ask for clicks.
 */
export function AdSlot({ placement, format = "auto", minHeight = 280, className, label = true }: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const client = siteConfig.adsenseClient;
  const slot = siteConfig.adsenseSlots[placement];
  const enabled = Boolean(client && slot);

  useEffect(() => {
    if (!enabled || pushed.current || !ref.current) return;
    // Avoid double-push on fast refresh / re-mounts.
    if (ref.current.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blockers throw here; nothing to do.
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={cn("ad-slot my-8 flex flex-col items-center", className)} style={{ ["--ad-min-height" as string]: `${minHeight}px` }}>
      {label && <span className="mb-1 self-start text-[10px] font-medium uppercase tracking-wider text-muted">Advertisement</span>}
      <ins
        ref={ref}
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
