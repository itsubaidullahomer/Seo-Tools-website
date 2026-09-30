"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { NavCategory } from "@/lib/tools/registry";
import { Sidebar } from "./Sidebar";

/** Slide-in drawer with the full tool tree for screens below `lg`. */
export function MobileNav({ tree, links }: { tree: NavCategory[]; links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-secondary hover:bg-surface-2 hover:text-fg"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-50 flex" id="mobile-drawer">
          <div className="scroll-thin h-full w-[min(20rem,85vw)] overflow-y-auto border-r border-border bg-bg shadow-card-lg">
            <nav aria-label="Site" className="flex flex-wrap gap-1.5 border-b border-border px-4 py-3">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-md border border-border bg-surface px-2.5 py-1 text-[13px] font-medium text-fg-secondary hover:text-fg">
                  {l.label}
                </Link>
              ))}
            </nav>
            <Sidebar tree={tree} onNavigate={() => setOpen(false)} />
          </div>
          <button type="button" aria-label="Close menu" className="flex-1 bg-[rgb(18_18_17/0.4)]" onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
