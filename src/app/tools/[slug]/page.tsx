import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ToolRenderer } from "@/components/tools/ToolRenderer";
import { PrivacyBadge } from "@/components/tools/PrivacyBadge";
import { FaqSection } from "@/components/tools/FaqSection";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { TableOfContents } from "@/components/tools/TableOfContents";
import { Markdown } from "@/components/content/Markdown";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/Icon";
import { getToolContent } from "@/lib/tools/content";
import { getAllTools, getRelatedTools, getToolBySlug, getToolCategory, toolPath } from "@/lib/tools/registry";
import { buildToolMetadata } from "@/lib/seo/metadata";
import { faqSchema, graph, webApplicationSchema } from "@/lib/seo/jsonld";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTools().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return buildToolMetadata(tool);
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const category = getToolCategory(tool);
  const content = await getToolContent(tool.slug);
  const related = getRelatedTools(tool, 6);
  const path = toolPath(tool.slug);

  return (
    <Container size="xl" className={`accent-${category.color} py-8 sm:py-10`}>
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: category.name, href: `/category/${category.slug}` }, { name: tool.name }]} />

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cat-soft text-cat">
          <Icon name={tool.icon} className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{tool.name}</h1>
          <p className="mt-2 max-w-3xl text-lg leading-relaxed text-muted">{tool.shortDescription}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
            <Link href={`/category/${category.slug}`}>
              <Badge variant="outline" className="hover:border-primary hover:text-primary">
                {category.name}
              </Badge>
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              Updated <time dateTime={tool.dateModified}>{formatDate(tool.dateModified)}</time>
            </span>
          </div>
        </div>
      </header>

      <section aria-label={`${tool.name} tool`} className="mt-8">
        <ToolRenderer slug={tool.slug} />
        <div className="mt-3">
          <PrivacyBadge files={tool.processesFiles} />
        </div>
      </section>

      <AdSlot minHeight={250} format="horizontal" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0">
          <Markdown>{content.markdown}</Markdown>
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-32 space-y-6">
            <TableOfContents headings={content.headings} faq={tool.faq.length > 0} />
            {related.length > 0 && (
              <nav aria-label="More tools" className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">More {category.shortName.toLowerCase()} tools</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {related.slice(0, 6).map((r) => (
                    <li key={r.slug}>
                      <Link href={toolPath(r.slug)} className="text-fg-secondary hover:text-primary">
                        {r.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <AdSlot minHeight={600} format="vertical" className="my-0" />
          </div>
        </aside>
      </div>

      <FaqSection faq={tool.faq} />
      <RelatedTools tools={related} category={category} />

      <AdSlot minHeight={250} format="horizontal" />

      <footer className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Published <time dateTime={tool.datePublished}>{formatDate(tool.datePublished)}</time> · Last updated{" "}
          <time dateTime={tool.dateModified}>{formatDate(tool.dateModified)}</time>
        </p>
        <p>
          Spotted a bug or have a feature idea?{" "}
          <Link href="/contact" className="font-medium text-primary hover:underline">
            Tell us
          </Link>
          .
        </p>
      </footer>

      <JsonLd data={graph(webApplicationSchema(tool, category, path), faqSchema(tool.faq))} />
    </Container>
  );
}
