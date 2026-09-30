import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "character-counter",
  name: "Character Counter",
  title: "Character Counter – Count Characters With & Without Spaces",
  description:
    "Free character counter that counts characters with and without spaces, words, sentences and bytes live, with limit presets for X, Instagram, LinkedIn and SEO.",
  shortDescription:
    "Count characters with and without spaces, words, sentences and bytes live, and check text against X, Instagram, LinkedIn and SEO limits.",
  category: "text",
  keywords: [
    "character counter",
    "character count",
    "count characters",
    "character counter with spaces",
    "character counter without spaces",
    "letter counter",
    "characters and words counter",
    "twitter character counter",
    "instagram caption character counter",
    "meta description character counter",
  ],
  aliases: ["char counter", "letter count", "text length checker", "count letters", "x character counter"],
  icon: "text-cursor-input",
  featured: true,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["word-counter", "case-converter", "remove-line-breaks"],
  faq: [
    {
      question: "Do spaces count as characters?",
      answer:
        "Yes, in almost every real limit. X, Instagram, LinkedIn, SMS gateways, meta descriptions and web forms all count spaces and line breaks, because to the software a space is simply another character. The “without spaces” figure exists for the few cases that exclude them, such as some translation rates and academic briefs. When a limit does not say otherwise, assume spaces count.",
    },
    {
      question: "Why does an emoji count as 2 characters on some platforms?",
      answer:
        "Most emoji live outside the first 65,536 Unicode code points, so in UTF-16, the encoding used by JavaScript, Java and many databases, one emoji occupies two 16-bit code units. Software that measures a field in code units therefore reports 2. X goes further and counts every emoji as 2, even a flag or family emoji built from several code points. This tool shows characters and code units side by side so you can see exactly where the difference comes from.",
    },
    {
      question: "How many characters can an X (Twitter) post have?",
      answer:
        "280 for a standard account and 25,000 for X Premium subscribers. X weights the count rather than counting raw characters: letters, numbers, punctuation and most Latin-script text count as 1, every emoji counts as 2, Chinese, Japanese and Korean characters count as 2, and any link is replaced by a 23-character t.co URL no matter how long or short it is. Select the X preset and the counter applies these rules for you.",
    },
    {
      question: "What is the Instagram caption character limit?",
      answer:
        "An Instagram caption can hold 2,200 characters including spaces, line breaks and hashtags, and every hashtag counts toward that total. Instagram caps the number of hashtags per post separately and has cut that cap from the old 30, so check the app. The feed shows only about the first 125 characters before the “more” link, so put the hook and any call to action at the very start. Bios are limited to 150 characters and usernames to 30. Comments use the same 2,200-character limit as captions.",
    },
    {
      question: "How long should a meta description be?",
      answer:
        "Google has no fixed character limit; it truncates snippets by pixel width, roughly 920 px on desktop and less on mobile. In practice that is about 155–160 characters on desktop and around 120 on mobile, which is why 160 is the standard target. Front-load the important words and remember that Google rewrites many descriptions anyway, so treat the number as a guide rather than a rule. Title tags are cut at about 600 px, close to 60 characters.",
    },
    {
      question: "Why is my character count different from Microsoft Word?",
      answer:
        "Two reasons. Word does not count paragraph marks, so every line break you press Enter for adds one character here and none in Word. Word stores text in UTF-16, and depending on the version an emoji or rare symbol can add 2 to its total, while this tool counts visible characters and shows the code-unit figure separately. For plain text with no emoji and a single paragraph, the numbers match exactly.",
    },
    {
      question: "How many characters is 500 words?",
      answer:
        "Roughly 2,500 to 3,000 characters with spaces for English prose. The average English word is about 4.7 letters, and each word is followed by a space or punctuation mark, so budget 5 to 6 characters per word. Text full of short function words lands at the bottom of the range; technical writing with long terms lands above it. Paste your own text and the real ratio appears as “chars/word” under the Words tile.",
    },
    {
      question: "Is my text uploaded or stored anywhere?",
      answer:
        "No. Everything is counted by JavaScript running in your browser; the page sends no request containing your text and nothing is logged. Your draft is kept in the browser’s session storage so an accidental refresh does not lose it, and it disappears when you close the tab. That makes the counter safe for contracts, unpublished posts, client copy and anything else confidential.",
    },
  ],
};
