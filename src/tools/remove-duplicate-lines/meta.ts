import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "remove-duplicate-lines",
  name: "Remove Duplicate Lines",
  title: "Remove Duplicate Lines – Free Online Duplicate Line Remover",
  description:
    "Remove duplicate lines from any list online. Keep the first or last copy, ignore case and spaces, and see every removed line with its count. Free and private.",
  shortDescription: "Remove duplicate lines from a list, keep the first or last copy, ignore case and spaces, and see exactly which lines were removed.",
  category: "text",
  keywords: [
    "remove duplicate lines",
    "duplicate line remover",
    "remove duplicates from list",
    "dedupe list online",
    "unique lines",
    "find duplicate lines",
    "delete duplicate lines",
    "remove duplicate lines online",
    "remove duplicate emails from list",
    "remove repeated lines",
  ],
  aliases: ["deduplicate lines", "duplicate remover", "list deduplicator", "uniq online", "remove duplicate rows", "remove repeated lines"],
  icon: "layers",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["alphabetical-order", "remove-line-breaks", "case-converter", "word-counter", "invisible-character"],
  faq: [
    {
      question: "How do I remove duplicate lines from a list?",
      answer:
        "Paste your list into the box, one item per line, and the duplicates disappear from the result box straight away. By default the first copy of each line is kept in its original order, and spaces at the start and end of lines are ignored. Click Copy or Download to take the cleaned list with you. The Removed lines table underneath shows which lines were dropped, how often each appeared and where.",
    },
    {
      question: "Are Apple and apple treated as duplicates?",
      answer:
        "Not by default. Case-sensitive is on, so Apple and apple are two different lines, which is the way most text editors and the Linux command line compare text. Turn Case-sensitive off and they count as duplicates, with the first spelling kept. For email addresses, usernames and keyword lists, switching it off is usually what you want, because capitalization rarely makes two entries genuinely different.",
    },
    {
      question: "Why were some duplicates not removed?",
      answer:
        "Lines only count as duplicates when they match exactly, and invisible differences are the usual culprit: a trailing space, a different capitalization, a non-breaking space, or a zero-width character copied from a web page. Keep Trim spaces before comparing and Ignore invisible characters on, then try turning Case-sensitive off. Ignore extra spaces inside lines and Ignore accents cover the remaining cases.",
    },
    {
      question: "Does it keep the first or the last occurrence?",
      answer:
        "You choose. Keep which copy is set to First occurrence by default, so the earliest copy stays where it was and later repeats are dropped. Switch it to Last occurrence to keep the final copy instead, which suits logs and update lists where the newest entry wins. In both cases the surviving line keeps its position among the other lines. Nothing is sorted or reordered.",
    },
    {
      question: "How can I find duplicate lines without deleting them?",
      answer:
        "Choose Duplicates only. The result then lists each line that appears more than once, one time each, while the Repeated lines table shows how many times it occurred and on which input line numbers. Copy the report to paste it into a spreadsheet, or download it as a CSV file. Unique only does the opposite and keeps just the lines that appear exactly once.",
    },
    {
      question: "What is the difference between removing duplicates and removing consecutive duplicates?",
      answer:
        "Removing duplicates compares every line with every other line, so repeats are found wherever they sit. Removing consecutive duplicates, the behavior of the Unix uniq command, only collapses copies that touch each other. Turn on Only compare neighboring lines for that mode. On an unsorted list it leaves most repeats behind, so use it for logs with back-to-back repeated messages or for lists you have already sorted.",
    },
    {
      question: "Can it remove duplicate words inside a line?",
      answer:
        "No. The tool compares whole lines, not the words inside them. If your items are separated by commas or spaces, split them onto separate lines first, for example with Find and Replace in a text editor, then remove the duplicates here. Words repeated inside one sentence usually need editing by hand, because a repeat is sometimes intentional, as in “had had” or “that that”.",
    },
    {
      question: "Is my list private, and how large can it be?",
      answer:
        "Your list is processed in your browser and is never uploaded, so it is safe for customer emails or internal logs. The comparison handles hundreds of thousands of lines quickly, although pasting a very large list can make the page slow for a few seconds, and text files up to 20 MB can be opened or dropped onto the input box. Very large results show a preview on the page, but Copy and Download always include the full list.",
    },
  ],
};
