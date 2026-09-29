import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Icon } from "@/components/Icon";
import { getCategory } from "@/lib/tools/categories";
import type { ToolSummary } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, showCategory = false, className }: { tool: ToolSummary; showCategory?: boolean; className?: string }) {
  const category = getCategory(tool.category);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        category && `accent-${category.color}`,
        "group relative flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-[border-color,box-shadow]",
        "hover:border-border-strong hover:shadow-card-lg",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-cat-soft text-cat">
          <Icon name={tool.icon} className="h-[18px] w-[18px]" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted transition-[transform,color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-fg">{tool.name}</h3>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">{tool.shortDescription}</p>
      </div>
      {showCategory && category && <span className="label-mono mt-auto !text-cat">{category.shortName}</span>}
    </Link>
  );
}

export function ToolGrid({ tools, showCategory, className }: { tools: ToolSummary[]; showCategory?: boolean; className?: string }) {
  if (!tools.length) return null;
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {tools.map((t) => (
        <li key={t.slug}>
          <ToolCard tool={t} showCategory={showCategory} />
        </li>
      ))}
    </ul>
  );
}

/** Dense row list – used on category pages where scanning many tools matters. */
export function ToolRowList({ tools, className }: { tools: ToolSummary[]; className?: string }) {
  if (!tools.length) return null;
  return (
    <ol className={cn("divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface", className)}>
      {tools.map((t, i) => {
        const category = getCategory(t.category);
        return (
          <li key={t.slug}>
            <Link href={`/tools/${t.slug}`} className={cn(category && `accent-${category.color}`, "group flex items-center gap-4 px-4 py-3.5 hover:bg-surface-2")}>
              <span className="hidden w-6 font-mono text-[11px] text-muted sm:block">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-cat-soft text-cat">
                <Icon name={t.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold tracking-tight text-fg group-hover:text-primary">{t.name}</span>
                <span className="block text-[13px] leading-relaxed text-muted">{t.shortDescription}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted group-hover:text-primary" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
