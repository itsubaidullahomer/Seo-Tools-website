"use client";

import { useRouter } from "next/navigation";

declare global {
  interface Window {
    googlefc?: { callbackQueue?: unknown[]; showRevocationMessage?: () => void };
  }
}

/**
 * Re-opens the Google consent message so visitors can change their choice (Privacy & Messaging
 * JavaScript API). Only rendered when AdSense is configured, because the message is served by the
 * AdSense script. If the consent tool hasn't loaded (blocked, or no message applies), fall back
 * to the cookie section of the privacy policy.
 */
export function PrivacySettingsButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const fc = window.googlefc;
        if (fc?.callbackQueue && fc.showRevocationMessage) {
          fc.callbackQueue.push(fc.showRevocationMessage);
        } else {
          router.push("/privacy-policy#cookies-we-use");
        }
      }}
    >
      Privacy settings
    </button>
  );
}
