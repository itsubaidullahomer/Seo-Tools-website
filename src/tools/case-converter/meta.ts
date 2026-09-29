import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "case-converter",
  name: "Case Converter",
  title: "Case Converter – Sentence, Title, Upper, Lower & camelCase",
  description:
    "Free online case converter: change text to sentence case, lowercase, UPPERCASE, Title Case (AP, APA, Chicago, MLA), camelCase and snake_case. Fast and private.",
  shortDescription:
    "Convert text to sentence case, lower, UPPER, Title Case (AP/APA/Chicago/MLA), alternating, camelCase, snake_case and kebab-case instantly.",
  category: "text",
  keywords: [
    "case converter",
    "convert case",
    "uppercase to lowercase converter",
    "lowercase to uppercase",
    "title case converter",
    "sentence case converter",
    "capitalize each word",
    "camelcase converter",
    "snake case converter",
    "text case changer",
  ],
  aliases: ["change case", "text case converter", "caps converter", "kebab case converter", "alternating case generator", "inverse case"],
  icon: "case-sensitive",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["word-counter", "character-counter", "remove-line-breaks"],
  faq: [
    {
      question: "What is the difference between sentence case and title case?",
      answer:
        "Sentence case capitalizes only the first word of each sentence plus proper nouns, exactly as you would write a normal sentence. Title case capitalizes the principal words – nouns, verbs, adjectives, adverbs and pronouns – while short articles, conjunctions and prepositions such as “a”, “and” and “of” stay lowercase unless they begin or end the title. Sentence case is standard for body text and for headings in most web style guides; title case is standard for book, film and article titles and for US newspaper headlines.",
    },
    {
      question: "Which words stay lowercase in title case?",
      answer:
        "It depends on the style guide. AP and APA lowercase articles, conjunctions and prepositions of three letters or fewer (a, an, the, and, but, or, for, at, by, in, of, on, to) and capitalize every word of four or more letters. MLA lowercases all prepositions regardless of length, so “through” stays lowercase; Chicago’s 18th edition lowercases prepositions of up to four letters, such as “with” and “from”. Every style capitalizes the first word, and verbs such as “Is” and “Be” are always capitalized even though they are short.",
    },
    {
      question: "How do I change uppercase to lowercase in Word or Google Docs?",
      answer:
        "In Microsoft Word, select the text and press Shift+F3 to cycle through lowercase, UPPERCASE and Capitalize Each Word, or use Home → Change Case (the Aa button) for Sentence case and tOGGLE cASE as well. In Google Docs, select the text and choose Format → Text → Capitalization, which offers lowercase, UPPERCASE and Title Case but no sentence case. Neither editor knows style-guide rules, so “of” and “the” get capitalized; paste the text here to get correct AP, APA, Chicago or MLA title case.",
    },
    {
      question: "What are camelCase, PascalCase, snake_case and kebab-case used for?",
      answer:
        "They are ways of joining several words into one identifier without spaces. camelCase (userName) is the JavaScript, Java and C# convention for variables and functions; PascalCase (UserName) is used for classes, types and React components; snake_case (user_name) is standard in Python, Ruby, Rust and SQL; kebab-case (user-name) is used for CSS classes, URL slugs and file names; CONSTANT_CASE (USER_NAME) marks constants and environment variables; and dot.case (user.name) appears in configuration keys and Java package names.",
    },
    {
      question: "Does the converter keep acronyms like NASA or brand names like iPhone?",
      answer:
        "Yes, when the “Keep acronyms and mixed-case words” switch is on (the default). Any word written entirely in capitals, such as NASA or HTML5, and any word with a capital letter inside it, such as iPhone or JavaScript, is left unchanged by Sentence case, Title Case and Capitalized Case. A line of two or more words written entirely in capitals is treated as shouting and converted normally, so ALL-CAPS text still becomes readable. Turn the switch off to force every word through the rules.",
    },
    {
      question: "How does sentence case know where a sentence begins?",
      answer:
        "A new sentence starts after a period, question mark or exclamation mark, at the beginning of every line, and after a list marker such as “1.” or “a)”. The converter does not start a new sentence after an ellipsis, after a single initial (J. K. Rowling), after abbreviations with internal periods (e.g., i.e., U.S., a.m.) or after common titles such as Dr., Mr., Prof., St., Inc. and vs. The pronoun “I” and its contractions (I’m, I’ll, I’ve, I’d) are always capitalized.",
    },
    {
      question: "Is my text uploaded or stored anywhere?",
      answer:
        "No. Every conversion runs as JavaScript inside your browser; the text never leaves your device and there is no server-side processing or logging. Your draft is kept in the browser tab’s session storage so an accidental refresh does not lose it, and it is removed when the tab closes. Only your two settings – the title case style and the acronym switch – are remembered between visits, in your browser’s local storage.",
    },
    {
      question: "Is there a limit on how much text I can convert?",
      answer:
        "There is no fixed limit. Conversions run locally and complete in a few milliseconds for a typical document; texts of several hundred thousand characters still convert almost instantly, although the editor itself can feel slower while you type in a very large box. Line breaks, blank lines and indentation are preserved in every writing case, and in the code cases each line becomes one identifier so you can convert hundreds of names at once.",
    },
  ],
};
