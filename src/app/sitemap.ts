import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { categories } from "@/lib/tools/categories";
import { getAllTools, getToolsByCategory, toolPath } from "@/lib/tools/registry";
import { getAllPosts } from "@/lib/blog";
import { MIN_TOOLS_FOR_INDEXED_CATEGORY } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tools = getAllTools();
  const posts = await getAllPosts();

  const latest = (dates: string[]) => (dates.length ? new Date(dates.sort().at(-1)!) : new Date());
  const toolDates = tools.map((t) => t.dateModified);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: latest(toolDates), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/tools"), lastModified: latest(toolDates), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/blog"), lastModified: latest(posts.map((p) => p.updated)), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/about"), lastModified: new Date("2026-09-29"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/contact"), lastModified: new Date("2026-09-29"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/editorial-policy"), lastModified: new Date("2026-09-30"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy-policy"), lastModified: new Date("2026-09-29"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), lastModified: new Date("2026-09-29"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/disclaimer"), lastModified: new Date("2026-09-29"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories
    .filter((c) => getToolsByCategory(c.slug).length >= MIN_TOOLS_FOR_INDEXED_CATEGORY)
    .map((c) => ({
    url: absoluteUrl(`/category/${c.slug}`),
    lastModified: latest(getToolsByCategory(c.slug).map((t) => t.dateModified)),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const toolPages: MetadataRoute.Sitemap = tools.map((t) => ({
    url: absoluteUrl(toolPath(t.slug)),
    lastModified: new Date(t.dateModified),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const postPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: new Date(p.updated),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...toolPages, ...postPages];
}
