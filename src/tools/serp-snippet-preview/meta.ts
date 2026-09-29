import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "serp-snippet-preview",
  name: "SERP Snippet Preview Tool",
  title: "SERP Preview Tool – Snippet Preview for Desktop & Mobile",
  description:
    "Free SERP preview tool: see your title, meta description, URL, date and favicon as a search result on desktop and mobile, compare two versions, export a PNG.",
  shortDescription: "Preview a search result on desktop and mobile, compare two title and description versions side by side, and export a PNG.",
  category: "seo",
  keywords: [
    "serp preview tool",
    "serp snippet preview",
    "serp simulator",
    "google snippet preview",
    "meta title preview",
    "serp snippet optimizer",
    "search result preview",
    "title tag preview",
    "serp preview mobile",
    "how will my page look on google",
  ],
  aliases: ["serp simulator", "serp preview", "snippet preview tool", "search result preview generator", "seo snippet preview", "meta description preview", "title and description preview"],
  icon: "eye",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["title-meta-description-length-checker", "slug-generator", "character-counter", "word-counter", "case-converter"],
  faq: [
    {
      question: "What is a SERP snippet and what is it made of?",
      answer:
        "A snippet is the listing for one page on a search results page. It is made of a favicon and site name, a breadcrumb-style address, a clickable title, sometimes a date, and a short description of about two lines. The title mostly comes from your HTML title element and the description from your meta description or from text on the page. Google decides each part for the specific search, so two people can see slightly different snippets for the same URL.",
    },
    {
      question: "How do I see how my page will look in Google?",
      answer:
        "Paste your title and description into this preview, add the page URL and a sample search query, and switch between desktop and mobile. That shows how the text should be laid out and where it would be cut. To see what is actually live, search for your page in a private window, for example with site:yourdomain.com/page or an exact phrase from it. The real result can differ, because the search engine chooses the text for each query.",
    },
    {
      question: "Why does Google show a different title or description than mine?",
      answer:
        "Google has said it uses the HTML title element around 87 percent of the time, and looks at headings and other page text when a title is missing, repeated across pages, too long or a poor description of the page. Descriptions are picked per search, so a page can get a different snippet for every query. In March 2026 Google also confirmed a small test of AI-written headlines. A specific, honest title and description are rewritten least.",
    },
    {
      question: "How many pixels wide can a title and a description be?",
      answer:
        "This tool budgets 600 pixels for a title on desktop and 540 on mobile, measured at 20 px Arial, and 920 pixels for a description on desktop and 680 on mobile, measured at 14 px. Google publishes no fixed numbers. Its meta description guidance says a snippet is truncated as needed, typically to fit the device width, so these are working estimates, the same ones our length checker uses. Leave a margin of a few percent.",
    },
    {
      question: "Is the preview exactly what Google will show?",
      answer:
        "No, it is an illustration. The layout is built from Arial-compatible letter widths, which ignore kerning, bold text widths and any font or design change Google makes. The real result also depends on the query, the device and the searcher's location. Use the preview to catch text that is clearly too long, repeated or missing your keyword, and to compare two rewrites. Then check the live result after Google recrawls the page.",
    },
    {
      question: "Can I preview a date, a favicon and a site name?",
      answer:
        "Yes. Pick a date and it appears before the description, for example Sep 12, 2026, and it uses roughly 100 pixels of the description budget. Upload an image and it replaces the letter in the favicon circle. Google requires a square favicon of at least 8 by 8 pixels and recommends a larger one, such as 48 by 48 or more. The site name normally comes from WebSite structured data on your home page, so type the name you use there.",
    },
    {
      question: "Do FAQ rich results and other rich snippets still show up?",
      answer:
        "Not all of them. Google's structured data documentation says FAQ rich results stopped appearing on May 7, 2026, although FAQPage markup is still valid and can help Google understand a page. Other features such as review stars, product details, recipes and breadcrumbs still depend on your markup and on Google's choice. This preview shows the plain blue-link layout that every page has, and it does not simulate rich results.",
    },
    {
      question: "Is my text uploaded, and what does Copy link contain?",
      answer:
        "Nothing is uploaded. The preview, the checks and the PNG export all run in your browser, and the tool never fetches your page. Copy link puts your text and settings in the part of the address after the # sign, which browsers do not send to servers. An uploaded favicon is left out of the link. Your draft is kept in this tab's session storage, and your device and theme choice in local storage.",
    },
  ],
};
