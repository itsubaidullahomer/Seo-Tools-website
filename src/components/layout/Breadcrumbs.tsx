import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, type BreadcrumbItem } from "@/lib/seo/jsonld";
import { cn } from "@/lib/utils";

/**
 * Visible breadcrumb trail + BreadcrumbList JSON-LD. The first item should be
 * Home; the last item is the current page (no href).
 */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("text-sm text-muted", className)}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
                {item.href && !last ? (
                  <Link href={item.href} className="hover:text-fg">
                    {item.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-fg-secondary">
                    {item.name}
                  </span>
                )}
                {!last && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbSchema(items) }} />
    </>
  );
}
