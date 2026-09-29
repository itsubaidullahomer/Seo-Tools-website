import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolGrid } from "./ToolCard";
import type { Category } from "@/lib/tools/categories";
import { toSummary, type ToolMeta } from "@/lib/tools/types";

export function RelatedTools({ tools, category }: { tools: ToolMeta[]; category: Category }) {
  if (!tools.length) return null;
  return (
    <section aria-labelledby="related-tools" className="mt-16 scroll-mt-20">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <h2 id="related-tools" className="text-xl font-semibold tracking-tight text-fg">
          Related tools
        </h2>
        <Link href={`/category/${category.slug}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-fg-secondary hover:text-primary">
          All {category.shortName.toLowerCase()} tools <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <ToolGrid tools={tools.map(toSummary)} className="mt-5" />
    </section>
  );
}
