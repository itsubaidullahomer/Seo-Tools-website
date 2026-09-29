import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { siteConfig } from "@/config/site";
import { extractHeadings } from "@/lib/markdown";

/**
 * Static pages (About, Contact, Privacy Policy, Terms, Disclaimer) are markdown
 * files in content/pages/<slug>.md so the owner can edit them without touching
 * code. Placeholders {{siteName}}, {{siteUrl}}, {{contactEmail}} and {{year}}
 * are replaced at build time.
 */
export interface StaticPage {
  slug: string;
  title: string;
  description: string;
  updated: string;
  markdown: string;
  headings: { id: string; text: string }[];
}

const pagesDir = join(process.cwd(), "content", "pages");

function interpolate(text: string): string {
  return text
    .replaceAll("{{siteName}}", siteConfig.name)
    .replaceAll("{{siteUrl}}", siteConfig.url)
    .replaceAll("{{contactEmail}}", siteConfig.contactEmail)
    .replaceAll("{{authorName}}", siteConfig.author.name)
    .replaceAll("{{year}}", String(new Date().getFullYear()));
}

export async function getStaticPage(slug: string): Promise<StaticPage> {
  const raw = await readFile(join(pagesDir, `${slug}.md`), "utf8");
  const { content, data } = matter(raw);
  const markdown = interpolate(content);
  return {
    slug,
    title: interpolate(String(data.title ?? slug)),
    description: interpolate(String(data.description ?? "")),
    updated: String(data.updated ?? "2026-09-29"),
    markdown,
    headings: extractHeadings(markdown),
  };
}
