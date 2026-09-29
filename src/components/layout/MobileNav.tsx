"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({ links, categories }: { links: NavLink[]; categories: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [seenPath, setSeenPath] = useState(pathname);

  // Close the drawer when the route changes (state adjustment during render, per React docs).
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}>
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </Button>
      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-border bg-bg p-4">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2.5 text-base font-medium text-fg hover:bg-surface-2">
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted">Categories</p>
          <nav aria-label="Mobile categories" className="mt-1 flex flex-col gap-1">
            {categories.map((c) => (
              <Link key={c.href} href={c.href} className="rounded-lg px-3 py-2 text-sm text-fg-secondary hover:bg-surface-2 hover:text-fg">
                {c.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
