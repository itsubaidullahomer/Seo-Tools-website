import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Icon } from "@/components/Icon";
import type { Category } from "@/lib/tools/categories";
import { cn } from "@/lib/utils";

export function CategoryCard({ category, count, className }: { category: Category; count: number; className?: string }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        `accent-${category.color}`,
        "group flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-card-lg",
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-cat-soft text-cat">
        <Icon name={category.icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-fg">{category.name}</span>
        <span className="block font-mono text-[11px] text-muted">
          {count} {count === 1 ? "tool" : "tools"}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
    </Link>
  );
}
