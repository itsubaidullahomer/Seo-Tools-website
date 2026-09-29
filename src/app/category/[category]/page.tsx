import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ToolGrid } from "@/components/tools/ToolCard";
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
    <Container size="xl" className={`accent-${category.color} py-8 sm:py-10`}>
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "All tools", href: "/tools" }, { name: category.name }]} />
      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cat-soft text-cat">
          <Icon name={category.icon} className="h-7 w-7" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{category.name}</h1>
          <p className="mt-2 max-w-3xl text-lg leading-relaxed text-muted">{category.intro}</p>
          <p className="mt-2 text-sm text-muted">
            {tools.length} {tools.length === 1 ? "tool" : "tools"} · free · no sign-up
          </p>
        </div>
      </header>

      <section aria-label={`${category.name} list`} className="mt-10">
        {tools.length ? (
          <ToolGrid tools={tools.map(toSummary)} />
        ) : (
          <p className="rounded-2xl border border-dashed border-border-strong p-10 text-center text-muted">New tools for this category are on the way.</p>
        )}
      </section>

      <AdSlot minHeight={250} format="horizontal" />

      {others.length > 0 && (
        <section aria-labelledby="other-categories" className="mt-14">
          <h2 id="other-categories" className="text-xl font-semibold tracking-tight text-fg">
            Other categories
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((c) => (
              <li key={c.slug}>
                <CategoryCard category={c} count={c.count} />
              </li>
            ))}
          </ul>
        </section>
      )}

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
    </Container>
  );
}
