import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Mark: an ink "jar" with a signal-orange lid tab. Works at 16px and at 512px. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden="true">
      <rect x="2" y="6" width="28" height="24" rx="6" fill="var(--ink)" />
      <rect x="9" y="2" width="14" height="6" rx="2" fill="var(--accent-bright)" />
      <path d="M9 15h14M9 21h9" stroke="var(--ink-fg)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-semibold tracking-tight text-fg", className)} aria-label={`${siteConfig.name} home`}>
      <LogoMark />
      <span className="text-[17px]">{siteConfig.name}</span>
    </Link>
  );
}
