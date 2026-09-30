import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, type BreadcrumbItem } from "@/lib/seo/jsonld";
import { cn } from "@/lib/utils";

/**
 * Path-style breadcrumb trail (mono, "home / text / word counter") plus
 * BreadcrumbList JSON-LD. First item should be Home; the last is the current page.
 */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("font-mono text-[11px] uppercase tracking-wider text-muted", className)}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => {
            const last = i === items.length - 1;
            return (
              <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
                {item.href && !last ? (
                  <Link href={item.href} className="hover:text-primary">
                    {item.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-fg-secondary">
                    {item.name}
                  </span>
                )}
                {!last && <span className="opacity-50">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbSchema(items) }} />
    </>
  );
}
