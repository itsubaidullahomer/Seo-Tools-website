import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "word-counter",
  name: "Word Counter",
  title: "Word Counter – Count Words, Characters & Reading Time",
  description:
    "Free online word counter that counts words, characters, sentences and paragraphs as you type, with reading time, speaking time and keyword density. No sign-up.",
  shortDescription: "Count words, characters, sentences and paragraphs in real time, with reading time and keyword density.",
  category: "text",
  keywords: [
    "word counter",
    "word count",
    "character counter",
    "count words online",
    "words and characters counter",
    "sentence counter",
    "paragraph counter",
    "reading time calculator",
    "keyword density checker",
  ],
  aliases: ["word count tool", "wordcounter", "count characters"],
  icon: "whole-word",
  featured: true,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["character-counter", "case-converter", "remove-line-breaks", "reading-time-calculator"],
  faq: [
    {
      question: "How does the word counter count words?",
      answer:
        "A word is any run of characters separated by spaces, tabs or line breaks, which is the same rule Microsoft Word and Google Docs use. Hyphenated words such as “well-known” count as one word, numbers count as words, and stray punctuation on its own does not count. Because the rule matches the major editors, the number you see here will match the number your teacher, editor or client sees.",
    },
    {
      question: "Are characters counted with or without spaces?",
      answer:
        "Both. The tool shows characters including spaces (what most platform limits such as X/Twitter and meta descriptions use) and characters excluding spaces (what some academic and translation briefs use). Line breaks are counted as characters in the “with spaces” figure, the same way most text fields count them.",
    },
    {
      question: "How is reading time calculated?",
      answer:
        "Reading time divides the word count by 238 words per minute, the average silent reading speed for adults reading English found in a 2019 meta-analysis of 190 studies. Speaking time uses 150 words per minute, a comfortable pace for presentations and voice-overs. Both are estimates: technical content is read more slowly, and light fiction faster.",
    },
    {
      question: "Is my text uploaded anywhere?",
      answer:
        "No. Counting happens in your browser with JavaScript the moment you type or paste. Nothing is sent to a server, nothing is saved, and closing the tab removes the text completely. That makes the tool safe for confidential documents, unpublished manuscripts and client work.",
    },
    {
      question: "Why is my word count different from another tool?",
      answer:
        "Tools disagree on edge cases: some count “e-mail” as two words, some ignore numbers, and some count each em-dash-joined pair as one word. Differences are usually under one percent. If you are working to a strict limit, check which editor the recipient uses and leave a small margin.",
    },
    {
      question: "Can I count words in a document or PDF?",
      answer:
        "Yes – open the file, select all (Ctrl/Cmd + A), copy, and paste into the box. Formatting is discarded but the words are counted exactly. For very long documents the tool handles hundreds of thousands of words without slowing down because everything runs locally.",
    },
    {
      question: "What does keyword density mean and what should it be?",
      answer:
        "Keyword density is how often a word appears as a percentage of all words. The tool lists your most frequent words so you can spot repetition and check that important terms appear naturally. There is no magic percentage for SEO – Google does not reward a specific density – but if one word is above 2–3 percent the text usually reads as repetitive.",
    },
  ],
};
