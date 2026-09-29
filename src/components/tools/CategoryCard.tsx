import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Category } from "@/lib/tools/categories";
import { cn } from "@/lib/utils";

export function CategoryCard({ category, count, className }: { category: Category; count: number; className?: string }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        `accent-${category.color}`,
        "group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-lg",
        className,
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cat-soft text-cat">
        <Icon name={category.icon} className="h-6 w-6" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-fg">{category.name}</span>
        <span className="block text-sm text-muted">
          {count} {count === 1 ? "tool" : "tools"}
        </span>
      </span>
    </Link>
  );
}
