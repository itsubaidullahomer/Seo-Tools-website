import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/blog";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/jsonld";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog – Guides, Tips and How-tos",
  description: `Practical guides from ${siteConfig.name} on writing, SEO, web development, images and productivity, each paired with the free tool that gets the job done.`,
  path: "/blog",
});

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog" }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">Guides &amp; how-tos</h1>
        <p className="mt-3 text-lg text-muted">
          Short, practical articles that go deeper than a tool page: how things work, what the limits are, and how professionals approach the task.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-border-strong p-10 text-center text-muted">First articles are being written – check back soon.</p>
      ) : (
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-lg">
                <p className="text-xs text-muted">
                  <time dateTime={p.date}>{formatDate(p.date)}</time> · {p.readingMinutes} min read
                </p>
                <h2 className="mt-2 text-xl font-semibold leading-snug text-fg group-hover:text-primary">{p.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{p.description}</p>
                {p.tags.length > 0 && (
                  <p className="mt-auto pt-4 text-xs text-muted">{p.tags.map((t) => `#${t}`).join("  ")}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...collectionPageSchema({
            name: `Blog – ${siteConfig.name}`,
            description: String(metadata.description),
            path: "/blog",
            items: posts.map((p) => ({ name: p.title, path: `/blog/${p.slug}` })),
          }),
        }}
      />
    </Container>
  );
}
