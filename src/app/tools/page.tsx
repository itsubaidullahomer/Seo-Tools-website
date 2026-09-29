import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ToolSearch } from "@/components/tools/ToolSearch";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/jsonld";
import { getAllTools, getToolSummaries, toolPath } from "@/lib/tools/registry";

export const metadata: Metadata = buildPageMetadata({
  title: "All Free Online Tools",
  description: `Browse every free tool on ${siteConfig.name}: text, SEO, developer, image, converter, calculator, social media and design tools. Search by name or task.`,
  path: "/tools",
});

export default function ToolsPage() {
  const summaries = getToolSummaries();
  const all = getAllTools();
  return (
    <Container size="xl" className="py-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "All tools" }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">All tools</h1>
        <p className="mt-3 text-lg text-muted">
          {all.length} free tools, all running in your browser. Search by what you need to do, or filter by category.
        </p>
      </header>
      <div className="mt-8">
        <Suspense fallback={null}>
          <ToolSearch tools={summaries} />
        </Suspense>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...collectionPageSchema({
            name: `All tools – ${siteConfig.name}`,
            description: String(metadata.description),
            path: "/tools",
            items: all.map((t) => ({ name: t.name, path: toolPath(t.slug) })),
          }),
        }}
      />
    </Container>
  );
}
