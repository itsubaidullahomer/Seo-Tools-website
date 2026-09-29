"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { Icon } from "@/components/Icon";
import type { NavCategory } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

/** Categories stay expanded while the catalogue is small; beyond this only the active one opens. */
const EXPAND_ALL_BELOW = 90;

/**
 * Site-wide tool navigation. Every tool link is rendered in the HTML (collapsed
 * groups are only visually hidden), which gives every page a crawlable path to
 * every tool – good for users and for internal linking.
 */
export function Sidebar({ tree, onNavigate }: { tree: NavCategory[]; onNavigate?: () => void }) {
  const pathname = usePathname() ?? "/";
  const total = tree.reduce((n, c) => n + c.tools.length, 0);
  const activeCategory = tree.find((c) => pathname === `/category/${c.slug}` || c.tools.some((t) => pathname === `/tools/${t.slug}`))?.slug;

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tree.map((c) => [c.slug, total < EXPAND_ALL_BELOW || c.slug === activeCategory])),
  );

  return (
    <nav aria-label="All tools" className="flex flex-col gap-0.5 px-3 py-4 text-[13px]">
      <Link
        href="/tools"
        onClick={onNavigate}
        className={cn(
          "mb-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 font-medium",
          pathname === "/tools" ? "bg-surface text-fg shadow-card ring-1 ring-border" : "text-fg-secondary hover:bg-surface-2 hover:text-fg",
        )}
      >
        <LayoutGrid className="h-4 w-4 text-muted" aria-hidden />
        All tools
        <span className="ml-auto font-mono text-[11px] text-muted">{total}</span>
      </Link>

      {tree.map((cat) => {
        const isOpen = open[cat.slug] ?? true;
        const catActive = pathname === `/category/${cat.slug}`;
        return (
          <div key={cat.slug} className={cn(`accent-${cat.color}`, "mt-1")}>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [cat.slug]: !isOpen }))}
                aria-expanded={isOpen}
                aria-controls={`nav-${cat.slug}`}
                aria-label={`${isOpen ? "Collapse" : "Expand"} ${cat.name}`}
                className="flex h-7 w-6 shrink-0 items-center justify-center rounded text-muted hover:text-fg"
              >
                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} aria-hidden />
              </button>
              <Link
                href={`/category/${cat.slug}`}
                onClick={onNavigate}
                className={cn("label-mono flex flex-1 items-center gap-2 rounded px-1 py-1.5 hover:text-fg", catActive && "text-fg")}
              >
                {cat.shortName}
                <span className="ml-auto pr-2 text-[10px] opacity-70">{cat.tools.length}</span>
              </Link>
            </div>
            <ul id={`nav-${cat.slug}`} className={cn("ml-3 border-l border-border pl-2", !isOpen && "hidden")}>
              {cat.tools.map((t) => {
                const active = pathname === `/tools/${t.slug}`;
                return (
                  <li key={t.slug}>
                    <Link
                      href={`/tools/${t.slug}`}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-2 rounded-md px-2 py-[5px] transition-colors",
                        active ? "bg-surface font-medium text-fg shadow-card ring-1 ring-border" : "text-fg-secondary hover:bg-surface-2 hover:text-fg",
                      )}
                    >
                      {active && <span className="absolute -left-[9px] top-1.5 bottom-1.5 w-[2px] rounded-full bg-accent-bright" aria-hidden />}
                      <Icon name={t.icon} className={cn("h-3.5 w-3.5 shrink-0", active ? "text-cat" : "text-muted")} />
                      <span className="truncate">{t.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
