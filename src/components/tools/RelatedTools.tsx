import Link from "next/link";
import { ToolGrid } from "./ToolCard";
import type { Category } from "@/lib/tools/categories";
import { toSummary, type ToolMeta } from "@/lib/tools/types";

export function RelatedTools({ tools, category }: { tools: ToolMeta[]; category: Category }) {
  if (!tools.length) return null;
  return (
    <section aria-labelledby="related-tools" className="mt-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 id="related-tools" className="text-xl font-semibold tracking-tight text-fg">
          Related tools
        </h2>
        <Link href={`/category/${category.slug}`} className="text-sm font-medium text-primary hover:underline">
          All {category.shortName.toLowerCase()} tools →
        </Link>
      </div>
      <ToolGrid tools={tools.map(toSummary)} />
    </section>
  );
}
