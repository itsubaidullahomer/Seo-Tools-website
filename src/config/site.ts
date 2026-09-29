/**
 * Central site configuration.
 *
 * Everything brand-specific lives here so renaming the site or changing the
 * domain is a one-file change. Values can be overridden with environment
 * variables (see .env.example) so the same code works for preview deployments.
 */
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toolkitjar.com";

export const siteConfig = {
  /** Brand name shown in the header, titles and structured data. */
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "ToolkitJar",
  /** Canonical origin without a trailing slash. */
  url: rawUrl.replace(/\/+$/, ""),
  tagline: "Free online tools that just work",
  description:
    "Fast, free and private online tools for writers, marketers, developers and designers. Everything runs in your browser – no sign-up, no uploads, no limits.",
  /** Public contact address shown on the Contact and Privacy pages. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@toolkitjar.com",
  /** Default locale for metadata and Open Graph. */
  locale: "en_US",
  /** Site owner shown on About/legal pages and in the Organization schema. */
  author: {
    name: process.env.NEXT_PUBLIC_AUTHOR_NAME ?? "ToolkitJar Team",
  },
  /** Social handles are optional; leave empty to hide the links. */
  social: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_HANDLE ?? "",
    github: process.env.NEXT_PUBLIC_GITHUB_URL ?? "",
  },
  /** Google AdSense publisher ID, e.g. "ca-pub-1234567890123456". Ads render only when set. */
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "",
  /** Google Analytics 4 measurement ID, e.g. "G-XXXXXXXXXX". Analytics loads only when set. */
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  /** Google Search Console HTML-tag verification token (optional). */
  googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  /** Year the site went live, used in the footer copyright. */
  foundedYear: 2026,
} as const;

export type SiteConfig = typeof siteConfig;

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${clean === "/" ? "" : clean}`;
}
