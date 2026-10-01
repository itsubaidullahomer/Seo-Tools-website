"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { categories, type CategorySlug } from "@/lib/tools/categories";
import type { ToolSummary } from "@/lib/tools/types";
import { searchTools } from "@/lib/tools/search";
import { ToolGrid } from "./ToolCard";
import { cn } from "@/lib/utils";

/**
 * Filterable tool directory used on /tools. The query lives in `?q=` so the header search,
 * the command palette and the WebSite SearchAction land on a pre-filtered list – and the box
 * follows the URL when it changes while the page stays mounted (e.g. a new search from the
 * palette), instead of showing the previous results.
 */
export function ToolSearch({ tools }: { tools: ToolSummary[] }) {
  const params = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [seenUrlQ, setSeenUrlQ] = useState(urlQ);
  if (urlQ !== seenUrlQ) {
    setSeenUrlQ(urlQ);
    setQ(urlQ);
  }
  const [cat, setCat] = useState<CategorySlug | "all">("all");

  const updateQuery = (value: string) => {
    setQ(value);
    // Keep the address shareable without adding a history entry per keystroke.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set("q", value);
    else next.delete("q");
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  const filtered = useMemo(() => {
    const base = cat === "all" ? tools : tools.filter((t) => t.category === cat);
    return searchTools(base, q);
  }, [tools, q, cat]);

  const grouped = useMemo(() => {
    if (q.trim()) return null;
    return categories
      .map((c) => ({ category: c, tools: filtered.filter((t) => t.category === c.slug) }))
      .filter((g) => g.tools.length > 0);
  }, [filtered, q]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">Search tools</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="Search by name, task or keyword…"
            className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-base text-fg shadow-sm placeholder:text-muted/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {q && (
            <button type="button" onClick={() => updateQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-fg">
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </label>
      </div>
      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
          All ({tools.length})
        </FilterChip>
        {categories.map((c) => {
          const n = tools.filter((t) => t.category === c.slug).length;
          if (!n) return null;
          return (
            <FilterChip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
              {c.shortName} ({n})
            </FilterChip>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "tool" : "tools"}
        {q.trim() ? ` matching “${q.trim()}”` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border-strong p-10 text-center text-muted">
          <p className="font-medium text-fg">No tools found</p>
          <p className="mt-1 text-sm">Try a different word, or browse a category above.</p>
        </div>
      ) : grouped ? (
        <div className="mt-6 space-y-12">
          {grouped.map(({ category, tools: list }) => (
            <section key={category.slug} aria-labelledby={`cat-${category.slug}`}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2 id={`cat-${category.slug}`} className="text-xl font-semibold tracking-tight text-fg">
                  {category.name}
                </h2>
                <a href={`/category/${category.slug}`} className="text-sm font-medium text-primary hover:underline">
                  Category page →
                </a>
              </div>
              <ToolGrid tools={list} />
            </section>
          ))}
        </div>
      ) : (
        <ToolGrid tools={filtered} showCategory className="mt-6" />
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-fg" : "border-border bg-surface text-fg-secondary hover:border-border-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
