import type { CategorySlug } from "./categories";
import type { IconName } from "@/lib/icons";

export interface FaqItem {
  question: string;
  /** Plain text or light markdown (links, bold). Rendered on the page and in FAQPage JSON-LD. */
  answer: string;
}

/**
 * Metadata for a single tool. Lives in `src/tools/<slug>/meta.ts`.
 *
 * Keep SEO fields tight: `title` <= 60 chars, `description` 140-160 chars.
 * The build fails (scripts/validate-tools.ts) when required fields are missing.
 */
export interface ToolMeta {
  /** URL slug – must equal the folder name. Lowercase, hyphenated. */
  slug: string;
  /** Human name used as the H1 and in cards, e.g. "Word Counter". */
  name: string;
  /**
   * SEO <title> without the site name (added automatically).
   * Defaults to `${name} – Free Online Tool`. Aim for 50-60 characters.
   */
  title?: string;
  /** Meta description, 140-160 characters, includes the primary keyword naturally. */
  description: string;
  /** One-sentence summary shown under the H1 and on tool cards (<= 120 chars). */
  shortDescription: string;
  category: CategorySlug;
  /** Primary keyword first, then secondary keywords. Used for on-site search and the `keywords` meta. */
  keywords: string[];
  /** 4-8 genuinely useful questions. Rendered as an accordion and as FAQPage structured data. */
  faq: FaqItem[];
  /** Slugs of related tools to cross-link. Falls back to same-category tools. */
  related?: string[];
  /** ISO date (YYYY-MM-DD) the page was first published. */
  datePublished: string;
  /** ISO date (YYYY-MM-DD) of the last meaningful content/tool change. Drives sitemap lastmod. */
  dateModified: string;
  /** Icon shown on cards. Must be a key of `icons` in src/lib/icons.ts. */
  icon?: IconName;
  /** Featured tools appear in the homepage "Popular tools" section. */
  featured?: boolean;
  /** Alternative names people search for; used for on-site search only. */
  aliases?: string[];
  /**
   * Set when the tool processes user files (images, documents) so the page shows the
   * "Your files never leave your browser" privacy badge.
   */
  processesFiles?: boolean;
  /**
   * Set for tools where people click or type rapidly (keyboard/mouse tests, click
   * speed tests, games). Suppresses the ad slots near the tool so there are no
   * accidental ad clicks (AdSense policy); only the bottom-of-page slot remains.
   */
  highInteraction?: boolean;
}

/** Lightweight shape sent to client components (search, cards). */
export interface ToolSummary {
  slug: string;
  name: string;
  shortDescription: string;
  category: CategorySlug;
  icon?: IconName;
  keywords: string[];
  aliases?: string[];
  featured?: boolean;
}

export function toSummary(meta: ToolMeta): ToolSummary {
  return {
    slug: meta.slug,
    name: meta.name,
    shortDescription: meta.shortDescription,
    category: meta.category,
    icon: meta.icon,
    keywords: meta.keywords.slice(0, 6),
    aliases: meta.aliases,
    featured: meta.featured,
  };
}
