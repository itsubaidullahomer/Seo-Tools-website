import { absoluteUrl, siteConfig } from "@/config/site";
import type { Category } from "@/lib/tools/categories";
import type { FaqItem, ToolMeta } from "@/lib/tools/types";

/**
 * JSON-LD builders. Keep these aligned with Google's structured data docs:
 * - Organization + WebSite (with SearchAction) on every page (via layout)
 * - BreadcrumbList on every inner page
 * - WebApplication (SoftwareApplication subtype) on tool pages
 * - FAQPage on tool pages (still valid markup; rich results are limited since 2023
 *   but it helps machines understand the page and costs nothing)
 * - CollectionPage on category / all-tools pages
 * - Article on blog posts
 */

export type JsonLd = Record<string, unknown>;

export const ORG_ID = `${siteConfig.url}/#organization`;
export const WEBSITE_ID = `${siteConfig.url}/#website`;

export function organizationSchema(): JsonLd {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon.svg"),
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: siteConfig.contactEmail,
      availableLanguage: ["English"],
    },
    ...(siteConfig.social.twitter || siteConfig.social.github
      ? {
          sameAs: [
            siteConfig.social.twitter ? `https://x.com/${siteConfig.social.twitter.replace(/^@/, "")}` : null,
            siteConfig.social.github || null,
          ].filter(Boolean),
        }
      : {}),
  };
}

export function websiteSchema(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/tools?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path, e.g. "/tools". Omit for the current page. */
  href?: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

export function faqSchema(faq: FaqItem[]): JsonLd {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function webApplicationSchema(tool: ToolMeta, category: Category, path: string): JsonLd {
  return {
    "@type": "WebApplication",
    "@id": `${absoluteUrl(path)}#app`,
    name: tool.name,
    url: absoluteUrl(path),
    description: tool.description,
    applicationCategory: applicationCategoryFor(category.slug),
    applicationSubCategory: category.name,
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Works in all modern browsers.",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    inLanguage: "en",
    datePublished: tool.datePublished,
    dateModified: tool.dateModified,
    keywords: tool.keywords.join(", "),
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    image: absoluteUrl(`${path}/opengraph-image`),
  };
}

function applicationCategoryFor(slug: string): string {
  switch (slug) {
    case "developer":
      return "DeveloperApplication";
    case "design":
    case "image":
      return "DesignApplication";
    case "seo":
    case "social-media":
      return "BusinessApplication";
    case "calculators":
    case "converters":
      return "UtilitiesApplication";
    default:
      return "UtilitiesApplication";
  }
}

export function collectionPageSchema(opts: { name: string; description: string; path: string; items: { name: string; path: string }[] }): JsonLd {
  return {
    "@type": "CollectionPage",
    "@id": absoluteUrl(opts.path),
    url: absoluteUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "en",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        url: absoluteUrl(it.path),
      })),
    },
  };
}

export function webPageSchema(opts: { name: string; description: string; path: string; dateModified?: string }): JsonLd {
  return {
    "@type": "WebPage",
    "@id": absoluteUrl(opts.path),
    url: absoluteUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: "en",
    ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
  };
}

export function articleSchema(opts: { title: string; description: string; path: string; datePublished: string; dateModified: string; image?: string }): JsonLd {
  return {
    "@type": "Article",
    "@id": absoluteUrl(opts.path),
    headline: opts.title,
    description: opts.description,
    url: absoluteUrl(opts.path),
    mainEntityOfPage: absoluteUrl(opts.path),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: { "@type": "Organization", name: siteConfig.author.name, url: absoluteUrl("/about") },
    publisher: { "@id": ORG_ID },
    image: opts.image ?? absoluteUrl(`${opts.path}/opengraph-image`),
    inLanguage: "en",
  };
}

/** Wrap one or more schema nodes into a single @graph document. */
export function graph(...nodes: JsonLd[]): JsonLd {
  return { "@context": "https://schema.org", "@graph": nodes };
}
