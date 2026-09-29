import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/config/site";
import type { Category } from "@/lib/tools/categories";
import type { ToolMeta } from "@/lib/tools/types";

/**
 * Metadata helpers. Titles follow "Page Title | SiteName" via the root template,
 * so pass titles WITHOUT the site name.
 */

export interface PageMetaInput {
  title: string;
  description: string;
  /** Site-relative canonical path, e.g. "/about". */
  path: string;
  /** Prevent indexing (search results pages, thank-you pages…). */
  noindex?: boolean;
  keywords?: string[];
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Absolute or site-relative OG image. Defaults to the route's opengraph-image. */
  image?: string;
}

export function buildPageMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path);
  const image = input.image ? (input.image.startsWith("http") ? input.image : absoluteUrl(input.image)) : undefined;
  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: input.ogType ?? "website",
      url,
      siteName: siteConfig.name,
      title: input.title,
      description: input.description,
      locale: siteConfig.locale,
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: input.title }] } : {}),
      ...(input.ogType === "article"
        ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      ...(image ? { images: [image] } : {}),
      ...(siteConfig.social.twitter ? { site: `@${siteConfig.social.twitter.replace(/^@/, "")}` } : {}),
    },
  };
}

export function toolTitle(tool: ToolMeta): string {
  return tool.title ?? `${tool.name} – Free Online Tool`;
}

export function buildToolMetadata(tool: ToolMeta): Metadata {
  return buildPageMetadata({
    title: toolTitle(tool),
    description: tool.description,
    path: `/tools/${tool.slug}`,
    keywords: tool.keywords,
    ogType: "website",
  });
}

/** Category hubs with fewer tools than this are noindexed (thin page) until they fill up. */
export const MIN_TOOLS_FOR_INDEXED_CATEGORY = 3;

export function buildCategoryMetadata(category: Category, count: number): Metadata {
  return buildPageMetadata({
    title: count >= MIN_TOOLS_FOR_INDEXED_CATEGORY ? `${category.name} – ${count} Free Online Tools` : category.name,
    description: category.description,
    path: `/category/${category.slug}`,
    noindex: count < MIN_TOOLS_FOR_INDEXED_CATEGORY,
  });
}
