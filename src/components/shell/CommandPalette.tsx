"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search } from "lucide-react";
import { Icon } from "@/components/Icon";
import { categories, getCategory } from "@/lib/tools/categories";
import type { ToolSummary } from "@/lib/tools/types";
import { searchTools } from "@/lib/tools/search";
import { readRecentTools } from "@/lib/tools/recent";
import { cn } from "@/lib/utils";
import { OPEN_PALETTE_EVENT } from "./palette-events";

type Item = { kind: "tool"; tool: ToolSummary; section: string } | { kind: "all"; query: string; section: string };

/**
 * ⌘K / Ctrl+K / "/" command palette. Searches every tool instantly on the
 * client; with an empty query it shows recently used tools and the catalogue
 * grouped by category.
 */
export function CommandPalette({ tools }: { tools: ToolSummary[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const show = useCallback(() => {
    setRecent(readRecentTools());
    setQ("");
    setActive(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) setOpen(false);
        else show();
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        show();
      }
    };
    const onOpen = () => show();
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, [open, show]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const query = q.trim();
    if (query) {
      const found: Item[] = searchTools(tools, query)
        .slice(0, 24)
        .map((tool) => ({ kind: "tool", tool, section: "Results" }));
      return [...found, { kind: "all", query, section: "Results" }];
    }
    const bySlug = new Map(tools.map((t) => [t.slug, t]));
    const recentItems: Item[] = recent
      .map((s) => bySlug.get(s))
      .filter((t): t is ToolSummary => Boolean(t))
      .slice(0, 5)
      .map((tool) => ({ kind: "tool", tool, section: "Recently used" }));
    const grouped: Item[] = categories.flatMap((c) =>
      tools.filter((t) => t.category === c.slug).map((tool) => ({ kind: "tool" as const, tool, section: c.name })),
    );
    return [...recentItems, ...grouped];
  }, [q, tools, recent]);

  const go = useCallback(
    (item: Item | undefined) => {
      if (!item) return;
      setOpen(false);
      router.push(item.kind === "tool" ? `/tools/${item.tool.slug}` : `/tools?q=${encodeURIComponent(item.query)}`);
    },
    [router],
  );

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  let lastSection = "";
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-[rgb(18_18_17/0.45)] px-3 pt-[10vh] backdrop-blur-[2px]" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        onMouseDown={(e) => e.stopPropagation()}
        className="animate-palette w-full max-w-xl overflow-hidden rounded-xl border border-border-strong bg-surface shadow-card-lg"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-primary" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(items[active]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
            placeholder="What do you need to do?"
            aria-label="Search tools"
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `palette-item-${active}` : undefined}
            role="combobox"
            aria-expanded="true"
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-fg placeholder:text-muted/80 focus:outline-none"
          />
          <button type="button" onClick={() => setOpen(false)} className="kbd hover:text-fg" aria-label="Close search">
            esc
          </button>
        </div>

        <div ref={listRef} id="palette-list" role="listbox" className="scroll-thin max-h-[min(60vh,440px)] overflow-y-auto p-1.5">
          {items.length === 1 && items[0].kind === "all" && (
            <p className="px-3 py-6 text-center text-sm text-muted">No tool matches “{q.trim()}” yet.</p>
          )}
          {items.map((item, i) => {
            const header = item.section !== lastSection ? item.section : null;
            lastSection = item.section;
            const selected = i === active;
            return (
              <div key={item.kind === "tool" ? `${item.section}-${item.tool.slug}` : "all"}>
                {header && <p className="label-mono px-3 pb-1 pt-3">{header}</p>}
                <button
                  type="button"
                  id={`palette-item-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={selected}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", selected ? "bg-surface-2" : "bg-transparent")}
                >
                  {item.kind === "tool" ? (
                    <>
                      <span className={cn(`accent-${getCategory(item.tool.category)?.color ?? "slate"}`, "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-cat-soft text-cat")}>
                        <Icon name={item.tool.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-fg">{item.tool.name}</span>
                        <span className="block truncate text-xs text-muted">{item.tool.shortDescription}</span>
                      </span>
                      {selected && <CornerDownLeft className="h-4 w-4 shrink-0 text-muted" aria-hidden />}
                    </>
                  ) : (
                    <>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-muted">
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-sm text-fg-secondary">
                        See all results for <span className="font-medium text-fg">“{item.query}”</span>
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-border bg-surface-2 px-4 py-2 font-mono text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="kbd">↑</span>
            <span className="kbd">↓</span> navigate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="kbd">↵</span> open
          </span>
          <span className="ml-auto">{tools.length} tools</span>
        </div>
      </div>
    </div>
  );
}
