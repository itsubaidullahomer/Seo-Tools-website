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
        "group relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card transition-all",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-lg focus-visible:border-primary",
        category && `accent-${category.color}`,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cat-soft text-cat">
          <Icon name={tool.icon} className="h-5 w-5" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold leading-snug text-fg">{tool.name}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{tool.shortDescription}</p>
      </div>
      {showCategory && category && <span className="mt-auto text-xs font-medium text-cat">{category.shortName}</span>}
    </Link>
  );
}

export function ToolGrid({ tools, showCategory, className }: { tools: ToolSummary[]; showCategory?: boolean; className?: string }) {
  if (!tools.length) return null;
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {tools.map((t) => (
        <li key={t.slug}>
          <ToolCard tool={t} showCategory={showCategory} />
        </li>
      ))}
    </ul>
  );
}
