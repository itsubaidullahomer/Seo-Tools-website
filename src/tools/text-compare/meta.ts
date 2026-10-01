import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "text-compare",
  name: "Text Compare",
  title: "Text Compare – Find Differences Between Two Texts",
  description:
    "Compare two texts and see every difference highlighted by line, word or character. Ignore case or whitespace, jump between changes and download a patch.",
  shortDescription: "Paste two versions and see exactly what changed – by line, word or character – with counts and a downloadable patch.",
  category: "text",
  keywords: [
    "text compare",
    "text compare online",
    "compare text",
    "diff checker",
    "compare two texts",
    "text difference checker",
    "find difference between two texts",
    "online diff tool",
    "compare two files",
    "compare documents online",
  ],
  aliases: ["diff checker", "text diff", "diffchecker", "compare text online", "difference checker", "file compare", "compare two versions"],
  icon: "file-diff",
  datePublished: "2026-10-01",
  dateModified: "2026-10-01",
  related: ["word-counter", "invisible-character", "remove-duplicate-lines", "case-converter", "json-formatter"],
  faq: [
    {
      question: "How do I compare two texts?",
      answer:
        "Paste the original version into the left box and the new version into the right box, or use Open file to load a text file on each side. The differences appear straight away: removed text is highlighted in red and added text in green. Choose Lines, Words or Characters to change how closely the texts are compared, and use the arrow buttons or the N and P keys to jump from one change to the next.",
    },
    {
      question: "Should I compare by lines, words or characters?",
      answer:
        "Lines suit code, lists, CSV data and anything where each line is a unit; changed lines are paired up and the changed words inside them are highlighted. Words suit prose such as contracts, essays and articles, because a sentence that was reworded shows just the replaced words. Characters reveal the smallest edits – a missing letter, an extra space, a changed digit – but can look fragmented on heavily rewritten text.",
    },
    {
      question: "What do Ignore case and Ignore whitespace do?",
      answer:
        "They change what counts as different, never the text itself. Ignore case treats “Hello” and “hello” as equal. Ignore whitespace treats any run of spaces or tabs as a single space, ignores spaces at the start and end of a line, and hides changes that only add or remove spaces or blank lines. Both versions are still shown exactly as you pasted them, and lines that match only because of these options are labelled “ignored difference”.",
    },
    {
      question: "How is the similarity percentage calculated?",
      answer:
        "Similarity is 2 × unchanged ÷ (2 × unchanged + removed + added), counted in lines, words or characters depending on the mode – the same formula as Python’s difflib ratio. It depends on the level you compare at: in the example on this page, changing a few words on two lines gives 44% similarity by lines but 79% by words, because a line counts as changed even if only one word in it moved. It measures how much text is shared, not how similar the meaning is, so it is not a plagiarism score.",
    },
    {
      question: "What is the patch file and how do I use it?",
      answer:
        "Download patch saves the differences as a unified diff, the standard format used by Git and the Unix patch program. Save it next to the original file and run git apply changes.patch, or patch -p1 < changes.patch, to turn the original into the new version. The patch always contains every difference between the two texts, including ones you chose to ignore on screen, so it reproduces the changed text exactly.",
    },
    {
      question: "Is my text uploaded anywhere?",
      answer:
        "No. The comparison runs in your browser, in a background worker on your own device, and nothing you paste or open is sent to a server. The two texts are kept in this tab’s session storage so they survive an accidental refresh; they disappear when you close the tab or press Clear. Your chosen options are remembered in local storage.",
    },
    {
      question: "How large can the texts be?",
      answer:
        "Each text can be up to 5 million characters, and files up to 10 MB can be opened. Word mode handles up to 1.5 million words and symbols per text and character mode up to 300,000 characters, because comparing at those levels does far more work. Texts over 200,000 characters in total are compared when you press Compare instead of on every keystroke, and a comparison that needs more than 20 seconds stops with a message rather than freezing the page. You can also cancel a running comparison.",
    },
    {
      question: "Why does it show a change I can’t see?",
      answer:
        "The texts differ in characters that look the same or don’t show at all: a trailing space, a tab instead of spaces, a non-breaking space, a zero-width character, a curly quote instead of a straight one, or Windows (CRLF) versus Unix (LF) line endings. Switch to Characters to pinpoint the exact character, turn on Ignore whitespace if spacing doesn’t matter to you, or use the Invisible Character tool to reveal hidden characters.",
    },
  ],
};
