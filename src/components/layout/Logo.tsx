import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path d="M9 11h14M9 16h9M9 21h14" stroke="var(--primary-fg)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="22" cy="16" r="2" fill="var(--primary-fg)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight text-fg", className)} aria-label={`${siteConfig.name} home`}>
      <LogoMark />
      <span className="text-lg">{siteConfig.name}</span>
    </Link>
  );
}
