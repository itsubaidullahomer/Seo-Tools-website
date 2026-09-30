import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ToolRowList } from "@/components/tools/ToolCard";
import { CategoryCard } from "@/components/tools/CategoryCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/Icon";
import { categories, getCategory } from "@/lib/tools/categories";
import { getCategoriesWithCounts, getToolsByCategory, toolPath } from "@/lib/tools/registry";
import { toSummary } from "@/lib/tools/types";
import { buildCategoryMetadata } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/jsonld";

interface Props {
  params: Promise<{ category: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return buildCategoryMetadata(category, getToolsByCategory(category.slug).length);
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const tools = getToolsByCategory(category.slug);
  const others = getCategoriesWithCounts().filter((c) => c.slug !== category.slug && c.count > 0);

  return (
    <div className={`accent-${category.color}`}>
      <div className="bg-grid border-b border-border">
        <Container size="xl" className="pb-10 pt-6">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "All tools", href: "/tools" }, { name: category.name }]} />
          <header className="mt-6 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-cat-soft text-cat">
              <Icon name={category.icon} className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-fg sm:text-4xl">{category.name}</h1>
              <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-muted">{category.intro}</p>
              <p className="label-mono mt-3">
                {tools.length} {tools.length === 1 ? "tool" : "tools"} · free · no sign-up
              </p>
            </div>
          </header>
        </Container>
      </div>

      <Container size="xl" className="py-10">
        <section aria-label={`${category.name} list`}>
          {tools.length ? (
            <ToolRowList tools={tools.map(toSummary)} />
          ) : (
            <p className="rounded-xl border border-dashed border-border-strong p-10 text-center text-muted">New tools for this category are on the way.</p>
          )}
        </section>

        <AdSlot minHeight={250} format="horizontal" />

        {others.length > 0 && (
          <section aria-labelledby="other-categories" className="mt-14">
            <h2 id="other-categories" className="border-b border-border pb-3 text-xl font-semibold tracking-tight text-fg">
              Other categories
            </h2>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {others.map((c) => (
                <li key={c.slug}>
                  <CategoryCard category={c} count={c.count} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...collectionPageSchema({
            name: category.name,
            description: category.description,
            path: `/category/${category.slug}`,
            items: tools.map((t) => ({ name: t.name, path: toolPath(t.slug) })),
          }),
        }}
      />
    </div>
  );
}
