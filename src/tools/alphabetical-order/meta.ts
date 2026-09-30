import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "alphabetical-order",
  name: "Alphabetical Order Tool",
  title: "Alphabetical Order Tool – Sort Any List A to Z or Z to A",
  description:
    "Alphabetical order tool that sorts any list A to Z or Z to A. Handles accents, numbers, last names and “The”, with comma or line separators. Free and private.",
  shortDescription: "Put any list in alphabetical order, A to Z or Z to A, or sort by last name, length or number. Nothing is uploaded.",
  category: "text",
  keywords: [
    "alphabetical order tool",
    "alphabetizer",
    "put in alphabetical order",
    "sort list alphabetically",
    "abc order",
    "reverse alphabetical order",
    "alphabetize by last name",
    "alphabetize list online",
    "sort lines alphabetically",
  ],
  aliases: ["alphabetize", "alphabetize list", "sort a to z", "sort z to a", "list sorter", "sort names alphabetically", "alphabetical order generator", "sort text lines"],
  icon: "list-ordered",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["remove-duplicate-lines", "remove-line-breaks", "case-converter", "word-counter", "invisible-character", "character-counter"],
  faq: [
    {
      question: "How do I put a list in alphabetical order?",
      answer:
        "Paste the list into the box, one item per line, and the sorted list appears in the result box straight away. A to Z is the default. Switch Order to Z to A for reverse alphabetical order. Click Copy to take the result or Download to save it as a text file. If your items are separated by commas or semicolons instead of line breaks, change the Items are separated by menu.",
    },
    {
      question: "How do I alphabetize in Google Docs?",
      answer:
        "At the time of writing, Google Docs has no built-in command for sorting ordinary paragraphs or lists. It can only sort the rows of a table. The quickest workaround is to copy your list out of the document, paste it into this tool, and paste the sorted result back. You can also install a sorting add-on from the Google Workspace Marketplace, or sort the list in Google Sheets first.",
    },
    {
      question: "How do I alphabetize by last name?",
      answer:
        "Choose Last name under Sort by, then enter each person as First Last or as Last, First. The tool treats the last word as the surname, ignores titles such as Dr. and suffixes such as Jr., III or PhD, and uses first names to break ties. Prefixes like van or de stay with the surname unless you turn that option off. Type a comma after the surname to force a specific order.",
    },
    {
      question: "Why does Zebra come before apple in some sorted lists?",
      answer:
        "Basic sort routines compare character codes, and every capital letter has a lower code than every lowercase letter, so Zebra lands before apple. This tool uses the browser's dictionary collation instead. Capitals no longer override the alphabet, and accented letters such as É sit next to E. If you want the code behavior, for example to match a programming language's default sort, pick Unicode order under Capital letters.",
    },
    {
      question: "Does “The” count when alphabetizing?",
      answer:
        "It depends on the rulebook. Library catalogs, book indexes and APA reference lists skip a leading A, An or The, so The Hobbit files under H. Spreadsheets and everyday lists count every word, so it files under T. Turn on Ignore leading articles to skip them, and edit the word list for other languages, for example le, la, l' or der. The table under the result shows where each line was placed.",
    },
    {
      question: "How do I sort numbers so 2 comes before 10?",
      answer:
        "Leave Natural number order on and item2 comes before item10, because runs of digits are compared as whole numbers. To sort lines by their value instead, such as prices or invoice amounts, pick Numbers under Sort by. It uses the first number in each line, treats commas as thousands separators, understands negative numbers, and places lines that contain no number at the end.",
    },
    {
      question: "What is the difference between word-by-word and letter-by-letter alphabetizing?",
      answer:
        "Word-by-word stops at the first space, so New York comes before Newark: nothing precedes something. Letter-by-letter ignores spaces and punctuation and compares the letters straight through, so Newark comes before New York. Word-by-word is the default and the usual library convention. APA reference lists use letter-by-letter. Switch with the Letter by letter option under Options.",
    },
    {
      question: "Is my list uploaded anywhere, and how big can it be?",
      answer:
        "No. Sorting happens in your browser and your text is never sent to a server. The list is kept in this tab's session storage so a refresh does not lose it, and your settings are remembered on this device until you clear site data. Lists with hundreds of thousands of lines usually sort in a second or two, and text files up to 20 MB can be opened or dropped onto the input box.",
    },
  ],
};
