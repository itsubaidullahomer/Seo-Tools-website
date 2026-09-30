import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Markdown } from "@/components/content/Markdown";
import { TableOfContents } from "@/components/tools/TableOfContents";
import { ToolGrid } from "@/components/tools/ToolCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { getToolBySlug } from "@/lib/tools/registry";
import { toSummary, type ToolMeta } from "@/lib/tools/types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { articleSchema } from "@/lib/seo/jsonld";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    ogType: "article",
    publishedTime: post.date,
    modifiedTime: post.updated,
    keywords: post.tags,
    image: false, // src/app/blog/[slug]/opengraph-image.tsx
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const tools = post.relatedTools.map(getToolBySlug).filter((t): t is ToolMeta => Boolean(t));

  return (
    <Container size="xl" className="py-10">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }, { name: post.title }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0">
          <header>
            <p className="text-sm text-muted">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.updated !== post.date && (
                <>
                  {" "}
                  · Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                </>
              )}{" "}
              · {post.readingMinutes} min read · By {siteConfig.author.name}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">{post.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">{post.description}</p>
          </header>
          <AdSlot minHeight={250} format="horizontal" />
          <div className="mt-8">
            <Markdown>{post.markdown}</Markdown>
          </div>
          {tools.length > 0 && (
            <section aria-labelledby="post-tools" className="mt-14">
              <h2 id="post-tools" className="text-xl font-semibold tracking-tight text-fg">
                Tools mentioned in this guide
              </h2>
              <ToolGrid tools={tools.map(toSummary)} showCategory className="mt-5" />
            </section>
          )}
          <footer className="mt-10 border-t border-border pt-6 text-sm text-muted">
            <Link href="/blog" className="font-medium text-primary hover:underline">
              ← All guides
            </Link>
          </footer>
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-32 space-y-6">
            <TableOfContents headings={post.headings} />
            <AdSlot minHeight={600} format="vertical" className="my-0" />
          </div>
        </aside>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...articleSchema({ title: post.title, description: post.description, path: `/blog/${post.slug}`, datePublished: post.date, dateModified: post.updated }),
        }}
      />
    </Container>
  );
}
