import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "title-meta-description-length-checker",
  name: "Title Tag & Meta Description Length Checker",
  title: "Meta Description Length Checker & Title Tag Pixel Width",
  description:
    "Free meta description length checker with title tag pixel width: see the cut-off point on desktop and mobile, preview the snippet and audit many pages in bulk.",
  shortDescription: "Check title tag and meta description length in estimated pixels, with desktop and mobile previews, a brand builder and a bulk CSV audit.",
  category: "seo",
  keywords: [
    "meta description length checker",
    "title tag length checker",
    "meta description pixel checker",
    "title tag pixel width",
    "meta title length checker",
    "seo title length",
    "meta description character counter",
    "title and meta description checker",
  ],
  aliases: ["meta title checker", "title length checker", "meta description counter", "meta description length", "title tag character counter", "serp title length"],
  icon: "ruler",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["serp-snippet-preview", "character-counter", "word-counter", "slug-generator", "remove-duplicate-lines", "case-converter"],
  processesFiles: false,
  faq: [
    {
      question: "How long should a meta description be?",
      answer:
        "Judge it by width, not by character count. This checker uses an estimated budget of about 920 pixels on desktop and about 680 on mobile. Ordinary English prose averages roughly 6 pixels per character at that size, so that is about 140 to 155 characters on desktop and about 105 to 115 on mobile. Put the main message in the first 100 characters or so, because that part is the most likely to be visible everywhere.",
    },
    {
      question: "How many pixels wide can a title tag be?",
      answer:
        "About 600 pixels on desktop and roughly 540 on mobile, measured at the 20 px Arial-style text that results pages use. That is around 50 to 60 characters of ordinary text. Wide capitals use far more room: four capital W letters measure about 76 px while four lowercase i letters measure about 18 px. Google publishes no fixed number, so treat 600 px as an estimate and keep a margin.",
    },
    {
      question: "Why does Google show a different title or description than mine?",
      answer:
        "Google builds each result for the specific search, so it can swap in other page text. In a September 2021 post it said its systems use the HTML title element around 87 percent of the time, and look elsewhere when a title is empty, repeated across pages or a poor description of the page. Studies by Ahrefs and Portent found Google rewrote about 60 to 70 percent of meta descriptions. Write a specific title and description, then search for your page to see what is really shown.",
    },
    {
      question: "Is the meta description a ranking factor?",
      answer:
        "In 2022 Google's John Mueller said the meta description is primarily used as the snippet in search results and is not something Google uses for ranking. It still matters, because searchers read it when deciding what to click, so a clear description can raise click-through rate without changing your position. The title element is different: it helps Google understand the page and is also the clickable headline, so it deserves the most care.",
    },
    {
      question: "What happens if my title or description is too long?",
      answer:
        "Your rankings are not penalized. The text is cut at the width limit and an ellipsis is added, so any important words after the cut-off are simply not seen, and Google may choose different text instead. The fix is to move key words to the front, drop filler and shorten the brand suffix. The cut-off line and the snippet preview in this tool show exactly which words fall outside the limit.",
    },
    {
      question: "How accurate is the pixel width?",
      answer:
        "It is an estimate, not a measurement of Google. The tool adds up Arial-compatible letter widths at 20 px for titles and 14 px for descriptions and compares the total with the limits printed under the tool. It ignores kerning, and Google's fonts, device widths and layouts change, so leave at least five percent of margin. Emoji and non-Latin scripts are measured with your browser's fonts and are flagged as less certain.",
    },
    {
      question: "Is my text uploaded or stored anywhere?",
      answer:
        "No. Every calculation runs in your browser and nothing is sent to a server. What you type is kept in this tab's session storage so a refresh does not lose it, and your device and limit preferences are saved in local storage on your own device. Closing the tab clears the text. The bulk tab reads pasted text and uploaded CSV files locally too, so client page data never leaves your computer.",
    },
    {
      question: "How do I check the titles and descriptions of many pages at once?",
      answer:
        "Open the Bulk check tab and paste or upload rows in URL, title, description order, or a crawler export with columns such as Address, Title 1 and Meta Description 1. Every page gets a pass, warn or fail for the selected device, duplicate titles and descriptions are flagged, and you can filter the table and download the results as CSV. Up to 5,000 rows are checked per run.",
    },
  ],
};
