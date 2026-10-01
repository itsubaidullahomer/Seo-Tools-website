import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  const readMinutes = Math.max(1, Math.round(content.wordCount / 230));

  return (
    <div className={`accent-${category.color}`}>
      {/* Tool header + tool: the first thing on the page, above the fold. */}
      <div className="border-b border-border">
        <Container size="xl" className="pb-8 pt-6">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: category.name, href: `/category/${category.slug}` }, { name: tool.name }]} />

          <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-cat-soft text-cat">
                <Icon name={tool.icon} className="h-[22px] w-[22px]" />
              </span>
              <div className="min-w-0">
                <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.025em] text-fg sm:text-[2rem]">{tool.name}</h1>
                <p className="mt-0.5 text-[15px] leading-snug text-muted">{tool.shortDescription}</p>
              </div>
            </div>
            <ul className="flex shrink-0 flex-wrap gap-1.5 font-mono text-[11px] text-fg-secondary" aria-label="Tool properties">
              {["Free", "No sign-up", tool.processesFiles ? "No uploads" : "Runs locally"].map((b) => (
                <li key={b} className="rounded-md border border-border bg-surface px-2 py-1">
                  {b}
                </li>
              ))}
            </ul>
          </header>

          <section aria-label={`${tool.name} tool`} className="mt-6">
            <ToolRenderer slug={tool.slug} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <PrivacyBadge files={tool.processesFiles} />
              <p className="font-mono text-[11px] text-muted">
                Updated <time dateTime={tool.dateModified}>{formatDate(tool.dateModified)}</time>
              </p>
            </div>
          </section>
        </Container>
      </div>

      {/* In-page navigation */}
      <div className="sticky top-14 z-30 border-b border-border bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
        <Container size="xl">
          <nav aria-label="Page sections" className="scroll-thin -mx-1 flex gap-1 overflow-x-auto py-2 text-[13px]">
            {[
              { href: "#guide", label: "Guide", meta: `${readMinutes} min read` },
              { href: "#faq-heading", label: "FAQ", meta: String(tool.faq.length) },
              ...(related.length ? [{ href: "#related-tools", label: "Related", meta: String(related.length) }] : []),
            ].map((l) => (
              <a key={l.href} href={l.href} className="flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1 font-medium text-fg-secondary hover:bg-surface-2 hover:text-fg">
                {l.label}
                <span className="font-mono text-[11px] font-normal text-muted">{l.meta}</span>
              </a>
            ))}
          </nav>
        </Container>
      </div>

      <Container size="xl">
        {/* High-interaction tools (rapid clicking/typing) get no ad near the tool – AdSense accidental-click policy. */}
        {!tool.highInteraction && <AdSlot placement="inline" minHeight={250} format="horizontal" />}

        <div className="mt-10 grid gap-12 xl:grid-cols-[minmax(0,1fr)_220px]">
          <article id="guide" className="min-w-0 max-w-3xl scroll-mt-28">
            <Markdown>{content.markdown}</Markdown>
            <FaqSection faq={tool.faq} />
          </article>
          <aside className="hidden xl:block">
            <div className="sticky top-32 space-y-8">
              <TableOfContents headings={content.headings} faq={tool.faq.length > 0} />
              {!tool.highInteraction && <AdSlot placement="sidebar" minHeight={600} format="vertical" className="my-0" />}
            </div>
          </aside>
        </div>

        <RelatedTools tools={related} category={category} />

        <AdSlot placement="inline" minHeight={250} format="horizontal" />

        <footer className="mt-12 flex flex-col gap-2 border-t border-border pt-5 font-mono text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Published <time dateTime={tool.datePublished}>{formatDate(tool.datePublished)}</time> · Updated{" "}
            <time dateTime={tool.dateModified}>{formatDate(tool.dateModified)}</time>
          </p>
          <p>
            Found a bug or have an idea?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Tell us
            </Link>
          </p>
        </footer>
      </Container>

      <JsonLd data={graph(webApplicationSchema(tool, category, path), faqSchema(tool.faq))} />
    </div>
  );
}
