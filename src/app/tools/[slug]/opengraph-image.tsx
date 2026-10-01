import { siteConfig } from "@/config/site";
import { getCategory } from "@/lib/tools/categories";
import { getAllTools, getToolBySlug } from "@/lib/tools/registry";
import { OG_SIZE, renderOgImage } from "@/lib/seo/og-image";

export const dynamic = "force-static";
export const alt = "Tool preview";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllTools().map((t) => ({ slug: t.slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  return renderOgImage({
    eyebrow: tool ? getCategory(tool.category)?.shortName : undefined,
    title: tool?.name ?? siteConfig.name,
    description: tool?.shortDescription ?? siteConfig.description,
  });
}
