import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Markdown } from "@/components/content/Markdown";
import { JsonLd } from "@/components/seo/JsonLd";
import { getStaticPage } from "@/lib/pages";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { webPageSchema } from "@/lib/seo/jsonld";
import { formatDate } from "@/lib/utils";

export async function staticPageMetadata(slug: string): Promise<Metadata> {
  const page = await getStaticPage(slug);
  return buildPageMetadata({ title: page.title, description: page.description, path: `/${slug}` });
}

export async function StaticPageLayout({ slug, children }: { slug: string; children?: React.ReactNode }) {
  const page = await getStaticPage(slug);
  return (
    <Container size="md" className="py-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: page.title }]} />
      <header className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{page.title}</h1>
        {page.description && <p className="mt-3 text-lg text-muted">{page.description}</p>}
        <p className="mt-2 text-sm text-muted">
          Last updated <time dateTime={page.updated}>{formatDate(page.updated)}</time>
        </p>
      </header>
      <div className="mt-8">
        <Markdown>{page.markdown}</Markdown>
      </div>
      {children}
      <JsonLd data={{ "@context": "https://schema.org", ...webPageSchema({ name: page.title, description: page.description, path: `/${slug}`, dateModified: page.updated }) }} />
    </Container>
  );
}
