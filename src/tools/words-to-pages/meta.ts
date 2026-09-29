import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "words-to-pages",
  name: "Words to Pages Calculator",
  title: "How Many Pages Is 1000 Words? Words to Pages Calculator",
  description:
    "How many pages is 1000 words? Convert words to pages or pages to words by font, spacing, margins and paper size, or paste your text to measure it. Free.",
  shortDescription: "Convert words to pages and pages to words for any font, line spacing, margin and paper size, or paste your text to measure it.",
  category: "text",
  keywords: [
    "how many pages is 1000 words",
    "words to pages",
    "words to pages calculator",
    "pages to words",
    "how many pages is 500 words",
    "words per page",
    "double spaced pages calculator",
    "how many words is a page",
    "word count to page count",
  ],
  aliases: ["words to pages converter", "page count calculator", "essay length calculator", "words per page calculator", "double spaced word count"],
  icon: "file-text",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["word-counter", "words-to-time", "character-counter", "remove-line-breaks"],
  faq: [
    {
      question: "How many pages is 1000 words?",
      answer:
        "In Times New Roman 12 pt with 1 inch margins on US Letter, 1,000 words fill about 1.5 pages single-spaced and about 2.9 pages double-spaced, so a double-spaced essay of that length needs three pages. The older shortcut of 2 pages single and 4 double is based on typewriter fonts and overstates the length for Times New Roman, Arial or Calibri. Change the font or spacing above to see your own figure.",
    },
    {
      question: "How many pages is 500 words?",
      answer:
        "With the default format (Times New Roman 12 pt, 1 inch margins, US Letter), 500 words come to about 0.7 of a page single-spaced and about 1.5 pages double-spaced. In practice that is one page single-spaced or two double-spaced once you round up, because a partly filled page still counts as a page. A larger font, wider margins or Courier New push the number higher.",
    },
    {
      question: "How many words are on one page?",
      answer:
        "It depends on the format, not just the spacing. With 1 inch margins on US Letter, Times New Roman 12 pt holds about 680 words single-spaced and 340 double-spaced. Arial 11 pt holds about 720 and 355, and Courier New 12 pt about 470 and 230. The familiar 500 and 250 figures are a round rule of thumb that sits between Courier New and the proportional fonts.",
    },
    {
      question: "How many words is a 5-page paper?",
      answer:
        "At the default settings a double-spaced 5-page paper holds about 1,700 words of body text, and a single-spaced one about 3,400. Real papers usually contain fewer, because a title page, headings, block quotes, tables and a reference list take up space without adding to the word count. If your instructor gives a words-per-page figure, enter it in the optional field and the calculator will use it instead.",
    },
    {
      question: "Does the font or margin change the page count?",
      answer:
        "Yes, more than most people expect. Moving from 12 pt to 11 pt raises the words per page by roughly 14 percent, and moving from 1 inch to 1.25 inch margins lowers it by roughly 12 percent. Typeface matters too: Courier New is wider than Times New Roman, so the same essay takes about 50 percent more pages. Set the format your document actually uses.",
    },
    {
      question: "Why does Word or Google Docs show a different page count?",
      answer:
        "This calculator estimates ordinary prose with the layout rules you choose. Word and Google Docs also apply hyphenation settings, widow and orphan control, headings, spacing before and after paragraphs, tables and images, and they can substitute a font that is not installed. Longer words also fit fewer to a page. Expect a few percent of difference for plain text, and use Paste text mode for the closest match.",
    },
    {
      question: "How does the Paste text mode work?",
      answer:
        "The tool measures each word with the width of its letters in the chosen typeface, wraps the text inside your margins, stacks the lines at your line spacing and starts a new page when the next line does not fit. Every line break in your text starts a paragraph and blank lines are ignored, so choose the paragraph style that matches your document.",
    },
    {
      question: "Is my text uploaded or stored anywhere?",
      answer:
        "No. All counting and page layout happens in your browser, and nothing you type or paste is sent to a server. The tool remembers your format choices in this browser, and keeps the current text only until you close the tab, so you can refresh the page without losing your draft.",
    },
  ],
};
