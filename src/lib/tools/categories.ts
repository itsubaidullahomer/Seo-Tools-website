import type { IconName } from "@/lib/icons";

/**
 * Tool categories. Each category gets a hub page at /category/<slug>.
 *
 * Adding a category: append an entry here. Tool folders reference the slug in
 * their meta.ts. Removing or renaming a slug changes URLs – add a redirect in
 * next.config.ts if you ever do that.
 */
export interface Category {
  slug: string;
  name: string;
  /** Short label for navigation (<= 16 chars). */
  shortName: string;
  /** Meta description for the category page (140-160 chars). */
  description: string;
  /** One-paragraph intro shown at the top of the category page. */
  intro: string;
  icon: IconName;
  /** Tailwind color token used for the category accent. */
  color: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "teal" | "orange" | "slate";
}

export const categories = [
  {
    slug: "text",
    name: "Text & Writing Tools",
    shortName: "Text",
    description:
      "Free online text tools: count words and characters, convert case, clean up formatting, remove duplicates and more. Fast, private and no sign-up.",
    intro:
      "Everything you need to count, clean, convert and transform text. Paste your content, get an instant result, and copy it back with one click.",
    icon: "type",
    color: "indigo",
  },
  {
    slug: "seo",
    name: "SEO Tools",
    shortName: "SEO",
    description:
      "Free on-page SEO tools: preview your Google search snippet, check title tag and meta description length, and turn titles into clean URL slugs.",
    intro:
      "Practical on-page SEO tools that help you write better titles and descriptions, preview how your pages look in Google and create clean, readable URLs.",
    icon: "search",
    color: "emerald",
  },
  {
    slug: "developer",
    name: "Developer Tools",
    shortName: "Developer",
    description:
      "Free developer tools that run in your browser: format and validate JSON, generate UUIDs and GUIDs, and work out chmod file permissions. Private and instant.",
    intro:
      "Formatters, generators and calculators for everyday development work. Everything runs locally in your browser, so your data stays on your machine.",
    icon: "code",
    color: "sky",
  },
  {
    slug: "image",
    name: "Image Tools",
    shortName: "Image",
    description:
      "Free image converters that run in your browser: SVG to PNG, WebP to JPG and WebP to PNG, one file or a whole batch. No uploads and no watermarks.",
    intro:
      "Convert images without uploading them anywhere. Your files are processed on your device using your browser's built-in image engine.",
    icon: "image",
    color: "rose",
  },
  {
    slug: "converters",
    name: "Number & Format Converters",
    shortName: "Converters",
    description:
      "Free converters that show their working: px to rem, military time, Roman numerals and numbers to words. Instant, accurate and private, with no sign-up.",
    intro:
      "Quick, accurate conversions with the formula shown, so you learn the relationship instead of just getting a number.",
    icon: "arrow-left-right",
    color: "amber",
  },
  {
    slug: "calculators",
    name: "Calculators",
    shortName: "Calculators",
    description:
      "Free calculators for percentages and pay: percentage change, increase and decrease, hourly to salary and salary to hourly, with the math shown step by step.",
    intro:
      "Everyday calculators that show their work. Each one explains the formula used, so you can trust the result and reuse the method.",
    icon: "calculator",
    color: "violet",
  },
  {
    slug: "social-media",
    name: "Creator & Community Tools",
    shortName: "Creators",
    description:
      "Free tools for creators and communities: YouTube earnings and watch-time estimates, Discord timestamps and colored text. Not affiliated with any platform.",
    intro:
      "Estimate, format and plan before you publish. Independent tools for creators and community managers – not affiliated with any of the platforms mentioned.",
    icon: "share-2",
    color: "orange",
  },
  {
    slug: "design",
    name: "Color & CSS Tools",
    shortName: "Design",
    description:
      "Free color and CSS tools: build box shadows and rounded corners visually, check WCAG color contrast, and copy production-ready CSS. Private and instant.",
    intro:
      "Visual generators that write the CSS for you. Tweak the controls, preview the result live and copy production-ready code.",
    icon: "palette",
    color: "teal",
  },
  {
    slug: "utilities",
    name: "Utilities & Device Tests",
    shortName: "Utilities",
    description:
      "Free browser utilities: password generator, keyboard tester, mouse test, dead pixel test and click speed test. Nothing to install and nothing uploaded.",
    intro:
      "Test your keyboard, mouse and screen, measure your click speed and generate strong passwords – all in the browser, with nothing stored or sent to a server.",
    icon: "shield-check",
    color: "slate",
  },
] as const satisfies readonly Category[];

export type CategoryDef = (typeof categories)[number];
export type CategorySlug = CategoryDef["slug"];

export const categorySlugs = categories.map((c) => c.slug) as CategorySlug[];

export function getCategory(slug: string): CategoryDef | undefined {
  return categories.find((c) => c.slug === slug);
}

export function isCategorySlug(slug: string): slug is CategorySlug {
  return categorySlugs.includes(slug as CategorySlug);
}

export function categoryPath(slug: CategorySlug): string {
  return `/category/${slug}`;
}
