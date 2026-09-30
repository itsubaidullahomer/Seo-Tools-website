import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "slug-generator",
  name: "URL Slug Generator",
  title: "Slug Generator – Turn Any Title into a Clean URL Slug",
  description:
    "Free slug generator: turn any title into a clean, SEO-friendly URL slug. Removes accents and symbols, trims stop words, caps length and converts lists in bulk.",
  shortDescription:
    "Turn titles into clean URL slugs: transliterates accents, Cyrillic and Greek, trims stop words, caps length and converts whole lists.",
  category: "seo",
  keywords: [
    "slug generator",
    "url slug generator",
    "seo friendly url generator",
    "slugify text",
    "text to slug",
    "wordpress permalink slug",
    "title to url",
    "permalink generator",
    "convert title to slug",
    "slug maker",
  ],
  aliases: ["slugify", "slug maker online", "url slug maker", "permalink slug", "title to slug", "bulk slug generator"],
  icon: "link",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: [
    "serp-snippet-preview",
    "title-meta-description-length-checker",
    "case-converter",
    "remove-duplicate-lines",
    "remove-line-breaks",
    "word-counter",
  ],
  faq: [
    {
      question: "What is a URL slug?",
      answer:
        "A URL slug is the part of a web address that identifies one page in readable words, usually the last segment. In https://example.com/blog/how-to-bake-bread the slug is how-to-bake-bread. It is normally built from the page title: lowercased, spaces replaced by hyphens and punctuation removed. A good slug tells people and search engines what the page is about before it loads.",
    },
    {
      question: "What makes a slug SEO-friendly?",
      answer:
        "Google's URL guidance favors readable words over long ID numbers and hyphens between words. In practice that means a short, descriptive, lowercase slug that matches the page topic, with no punctuation, tracking parameters or filler. Google does not publish a target slug length or a keyword bonus, so treat these as usability rules: clear, short and stable beats clever.",
    },
    {
      question: "Should I use hyphens or underscores in a URL?",
      answer:
        "Use hyphens. Google recommends hyphens to separate words in URLs because they help both people and search engines see the individual words, while underscores are conventionally used to join words into one identifier, such as a function name. A slug like slug-generator reads as two words; slug_generator can read as one. This tool defaults to hyphens and offers underscores only for systems that require them.",
    },
    {
      question: "Should I remove stop words like “the” and “and” from slugs?",
      answer:
        "It is optional. Dropping words such as a, the, and, of and to shortens a slug, but it can also blur the meaning, so this tool's list is deliberately short and leaves out words like not, how and what. Switch the toggle on for long titles, then read the result aloud. If the slug still makes sense to a stranger, keep it.",
    },
    {
      question: "How long should a URL slug be?",
      answer:
        "There is no official limit from Google, so aim for what people can take in at a glance: usually three to six words, or under about 60 characters. Platforms do set ceilings: WordPress, for example, stores slugs in a 200-character field. Use Maximum length to cut at a whole word, and remember that percent-encoded non-Latin letters take three characters per byte in the final URL.",
    },
    {
      question: "Can I change a slug after the page is published?",
      answer:
        "Yes, but treat it as a URL move. Set a permanent 301 redirect from the old address to the new one, update internal links and the sitemap, and avoid chains where an old slug points to another old slug. Changing a slug only to add a keyword rarely pays back, so do it when the current slug is wrong, misleading or badly formatted.",
    },
    {
      question: "How does the tool handle accents, Cyrillic, Greek and other alphabets?",
      answer:
        "By default it converts letters to A–Z: accents are stripped (café becomes cafe), ß becomes ss, and Cyrillic and Greek use simplified schemes, so Привет becomes privet. An optional German mode writes ä, ö and ü as ae, oe and ue. Alphabets without a built-in scheme, such as Chinese, Japanese or Arabic, are skipped with a warning; choose Keep as Unicode letters to preserve them.",
    },
    {
      question: "Is the text I enter sent to a server?",
      answer:
        "No. Slugs are generated with JavaScript in your browser as you type, so draft headlines, product names and client titles are not uploaded. The tool remembers your text for the current tab and your option settings in this browser's storage so a refresh does not lose them. The Clear button removes the text at any time.",
    },
  ],
};
