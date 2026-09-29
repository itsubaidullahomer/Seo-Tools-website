"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { ToolSummary } from "@/lib/tools/types";
import { searchTools } from "@/lib/tools/search";
import { cn } from "@/lib/utils";

/**
 * Tool search with keyboard navigation and a "/" shortcut.
 * `large` renders the hero variant used on the homepage.
 */
export function HeaderSearch({ tools, large }: { tools: ToolSummary[]; large?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => (q.trim() ? searchTools(tools, q).slice(0, 7) : []), [tools, q]);

  useEffect(() => {
    if (large) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [large]);

  const listId = large ? "hero-search-results" : "header-search-results";

  return (
    <div className={cn("relative", large && "w-full max-w-xl")}>
      <label className="relative block">
        <span className="sr-only">Search tools</span>
        <Search
          className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted", large ? "left-4 h-5 w-5" : "left-3 h-4 w-4")}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={q}
          placeholder={large ? "What do you need to do? e.g. count words, px to rem, compress image…" : "Search tools…"}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const pick = results[active];
              if (pick) router.push(`/tools/${pick.slug}`);
              else if (q.trim()) router.push(`/tools?q=${encodeURIComponent(q.trim())}`);
              setOpen(false);
            } else if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          className={cn(
            "rounded-lg border border-border bg-surface text-fg placeholder:text-muted/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40",
            large
              ? "h-14 w-full rounded-xl pl-12 pr-4 text-base shadow-card"
              : "h-10 w-40 pl-9 pr-3 text-sm transition-[width] focus:w-64 sm:w-52 sm:focus:w-72",
          )}
        />
      </label>
      {open && q.trim() && (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface text-left shadow-card-lg",
            large ? "left-0 right-0" : "right-0 w-[min(22rem,calc(100vw-2rem))]",
          )}
        >
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">No tools match “{q}”.</li>}
          {results.map((t, i) => (
            <li key={t.slug} role="option" aria-selected={i === active}>
              <Link
                href={`/tools/${t.slug}`}
                onMouseEnter={() => setActive(i)}
                className={cn("block px-4 py-2.5 text-sm", i === active ? "bg-surface-2 text-fg" : "text-fg-secondary")}
              >
                <span className="font-medium text-fg">{t.name}</span>
                <span className="mt-0.5 block truncate text-xs text-muted">{t.shortDescription}</span>
              </Link>
            </li>
          ))}
          {results.length > 0 && (
            <li className="border-t border-border">
              <Link href={`/tools?q=${encodeURIComponent(q.trim())}`} className="block px-4 py-2.5 text-xs font-medium text-primary hover:bg-surface-2">
                See all results for “{q}” →
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
