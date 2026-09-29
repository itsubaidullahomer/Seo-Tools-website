import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "invisible-character",
  name: "Invisible Character (Blank Text Copy & Detect)",
  title: "Invisible Character – Copy Blank Text & Find Hidden Chars",
  description:
    "Copy an invisible character (zero-width space, Braille blank, Hangul filler, non-breaking space) or paste text to find and remove hidden characters. Free.",
  shortDescription: "Copy invisible and blank characters with their code points, or paste text to highlight, count and remove hidden ones.",
  category: "text",
  keywords: [
    "invisible character",
    "blank text copy paste",
    "empty character",
    "zero width space copy",
    "u+2800 braille blank",
    "hangul filler",
    "detect hidden characters in text",
    "invisible text",
    "unicode blank character",
    "remove hidden characters",
  ],
  aliases: [
    "invisible text",
    "blank character",
    "zero width space",
    "invisible letter",
    "hidden character detector",
    "zero width character remover",
    "unicode blank space",
    "empty text",
  ],
  icon: "eye",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["character-counter", "word-counter", "remove-line-breaks", "case-converter", "json-formatter", "slug-generator"],
  faq: [
    {
      question: "What is an invisible character?",
      answer:
        "An invisible character is a Unicode code point that draws no visible ink. Some have zero width, such as the zero-width space (U+200B) and the word joiner (U+2060). Others are blank glyphs that usually occupy space, depending on the font, such as the Braille pattern blank (U+2800) and the Hangul filler (U+3164), or look-alike spaces such as the non-breaking space (U+00A0). Each was designed for a specific typesetting job, and each counts as a character in your text.",
    },
    {
      question: "Which invisible character should I use: U+200B, U+2800 or U+3164?",
      answer:
        "Choose by behavior, not popularity. U+200B has no width and only offers a place where a line may break. U+2800 is a Braille symbol that keeps a fixed blank width and is not whitespace, so trim() leaves it alone. U+3164 is a Korean filler letter whose width depends on the fonts installed. For a space that never wraps, use U+00A0. Always test in the exact program where you will use it, because software often strips or normalizes these characters.",
    },
    {
      question: "How do I find hidden characters in text?",
      answer:
        "Open the Detect and clean text tab and paste your text. Every hidden character is highlighted with a short label such as ZWSP or NBSP, and a table lists each code point with its name, how often it occurs and where it first appears. The scan runs entirely in your browser, so confidential text is not uploaded. Text pasted from web pages, PDFs, word processors and chat apps is the most common source of stray characters.",
    },
    {
      question: "Is it safe to remove invisible characters?",
      answer:
        "Usually, but not always. Zero-width joiners hold emoji sequences together, so stripping them turns a family emoji into separate faces. Zero-width non-joiners are part of correct Persian spelling, and joiners appear in Hindi and other Indic scripts. By default the tool keeps joiners inside emoji and those scripts, keeps emoji style selectors, and keeps direction marks in right-to-left text. Turn that option off only when you know the text is plain.",
    },
    {
      question: "Why does trim() or Excel’s TRIM not remove a space?",
      answer:
        "The character is probably not an ordinary space. Excel’s TRIM removes only the plain space, code 32, so a non-breaking space (code 160) copied from a web page survives it. JavaScript’s trim() removes non-breaking spaces and U+FEFF but not U+200B, and Python’s strip() removes non-breaking spaces but not U+FEFF. The Braille blank and Hangul filler are not whitespace anywhere. Find the exact code point first, then replace it.",
    },
    {
      question: "Do invisible characters count toward character limits?",
      answer:
        "Yes. Every invisible character is a code point, and most counters count it like any other character, so a title with three hidden characters is three characters longer than it looks. Emoji built with joiners are counted differently depending on the platform’s rules. If a limit matters, measure with the [Character Counter](/tools/character-counter) and remove hidden characters you did not intend to include.",
    },
    {
      question: "Can hidden characters be used to hide text or disguise code?",
      answer:
        "Yes, which is a good reason to scan text you did not write. Unicode tag characters (U+E0000 to U+E007F) mirror ASCII and render as nothing, so they can carry a hidden message; this tool decodes any it finds. Bidirectional override characters can make source code display in a different order than it runs, the issue catalogued as CVE-2021-42574, known as Trojan Source. Treat unexpected invisible characters in code, prompts and links as suspicious.",
    },
    {
      question: "Will an invisible character work in every app or form field?",
      answer:
        "No, and there is no guarantee. Apps, sites and games decide for themselves whether to strip, normalize or reject these characters, and they change that behavior between versions and from field to field. Many refuse blank or invisible-only usernames and messages. This tool only supplies the characters. It does not claim any will work in a given place, and using them to impersonate someone or avoid moderation breaks most platforms’ rules.",
    },
  ],
};
