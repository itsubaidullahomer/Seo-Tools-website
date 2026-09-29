import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "remove-line-breaks",
  name: "Remove Line Breaks",
  title: "Remove Line Breaks – Free Online Line Break Remover",
  description:
    "Remove line breaks from text online. Join lines with spaces, keep paragraph breaks or swap newlines for commas – fixes text copied from PDFs and emails.",
  shortDescription: "Remove line breaks from copied text: join lines, keep paragraphs, or replace newlines with a comma or any separator.",
  category: "text",
  keywords: [
    "remove line breaks",
    "line break remover",
    "remove line breaks from text",
    "remove paragraph breaks",
    "remove new lines",
    "remove hard returns",
    "join lines",
    "text to single line",
    "remove extra spaces and line breaks",
    "delete line breaks online",
  ],
  aliases: ["newline remover", "remove carriage returns", "unwrap text", "fix pdf line breaks", "convert line breaks to spaces"],
  icon: "pilcrow",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["word-counter", "character-counter", "case-converter"],
  faq: [
    {
      question: "How do I remove line breaks but keep paragraphs?",
      answer:
        "Choose the “Keep paragraphs” mode. It joins lines that belong to the same paragraph with a space and keeps one empty line wherever your original text had an empty line (or several). This works whenever paragraphs are separated by a blank line, which is how most PDFs, emails and plain-text files are laid out. If your paragraphs are separated by a single line break only, add an empty line between them first.",
    },
    {
      question: "Why does text copied from a PDF have line breaks in every line?",
      answer:
        "A PDF stores text as positioned lines on a page, not as flowing paragraphs. When you copy it, most viewers insert a hard line break at the end of every visual line, so a paragraph of eight lines arrives as eight separate lines. The same happens with plain-text emails wrapped at about 72 characters, OCR output and terminal logs. Joining the lines within each paragraph restores normal text.",
    },
    {
      question: "What is the difference between a soft return and a hard return?",
      answer:
        "A hard return (pressing Enter) ends a paragraph and is stored as a paragraph mark. A soft return (Shift+Enter in Word or Google Docs) starts a new line inside the same paragraph and is stored as a separate line-break character. The automatic wrapping you see when a line reaches the edge of the page is not a character at all – it disappears as soon as the text is resized.",
    },
    {
      question: "What are CRLF and LF line endings?",
      answer:
        "They are the two common ways files mark the end of a line. Windows uses CRLF: a carriage return (CR, character 13) followed by a line feed (LF, character 10). macOS, Linux, Android and iOS use LF alone, and very old Mac software used CR alone. This tool recognizes all three, plus mixed files, so every break is removed no matter where the text came from.",
    },
    {
      question: "How do I replace line breaks with commas?",
      answer:
        "Pick the “Replace with…” mode and choose the Comma + space preset, or type any separator you like, such as a semicolon, a pipe or <br>. Type \\t for a tab. Keep “Remove empty lines” switched on so blank lines do not produce double commas. This is the quickest way to turn a column copied from a spreadsheet into a comma-separated list for an email, SQL query or tag field.",
    },
    {
      question: "How do I remove line breaks in Microsoft Word?",
      answer:
        "Press Ctrl+H to open Find and Replace. Type ^p in “Find what” to match paragraph marks (hard returns) or ^l to match manual line breaks (Shift+Enter), type a space in “Replace with”, and click Replace All. To keep paragraphs, first replace ^p^p with a placeholder such as ###, then replace ^p with a space, then replace ### with ^p.",
    },
    {
      question: "Will removing line breaks break bulleted or numbered lists?",
      answer:
        "Only if you let it. Switch on “Keep list items on their own line” and any line starting with a bullet (-, *, •) or a list number (1., 2), a), (b)) keeps the break before it, while wrapped continuation lines are still joined. Lines that merely begin with a number followed by a period can be mistaken for list items, so glance over the result.",
    },
    {
      question: "Is my text sent to a server?",
      answer:
        "No. The line breaks are removed by JavaScript running in your browser, and files you open are read locally without being uploaded. Your text is kept only in this browser tab’s session storage so a refresh does not lose it; closing the tab or pressing Clear removes it. Your preferred mode and options are remembered in local storage; they contain none of your text.",
    },
  ],
};
