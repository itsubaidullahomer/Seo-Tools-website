import { siteConfig } from "@/config/site";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { OG_SIZE, renderOgImage } from "@/lib/seo/og-image";

export const dynamic = "force-static";
export const alt = "Article preview";
export const size = OG_SIZE;
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return renderOgImage({ eyebrow: "Guide", title: post?.title ?? siteConfig.name, description: post?.description ?? siteConfig.description });
}
