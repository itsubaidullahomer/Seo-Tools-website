import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "number-to-words",
  name: "Number to Words Converter",
  title: "Number to Words Converter – Amounts, Lakh & Crore",
  description:
    "Free number to words converter: spell out any number up to 36 digits, dollar and pound amounts, lakh and crore, ordinals and check-style 50/100 amounts.",
  shortDescription: "Spell out any number, currency amount or ordinal in words, with lakh/crore, British or US style and check-style fractions.",
  category: "converters",
  keywords: [
    "number to words",
    "number to words converter",
    "how to write numbers in words",
    "amount in words",
    "number to words in lakh crore",
    "spell out numbers",
    "write a check amount in words",
    "numbers to words in english",
  ],
  aliases: ["numbers to words", "number to text", "digits to words", "convert number to text", "num2words", "rupees in words"],
  icon: "hash",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["roman-numeral-converter", "percentage-calculator", "case-converter", "military-time-converter", "word-counter"],
  faq: [
    {
      question: "How do I write a check amount in words?",
      answer:
        "Write the whole dollars in words, then “and”, then the cents as a two-digit fraction over 100. For $1,250.50 that is “One thousand two hundred fifty and 50/100”, and a whole amount ends in “and 00/100”. Use “and” only before the cents, and draw a line through leftover space. If words and figures disagree, the words normally control, so check both.",
    },
    {
      question: "Do you use “and” when writing numbers in words?",
      answer:
        "In American English, “and” is normally reserved for the decimal point, so 105 is “one hundred five”. British English adds it after the hundreds: “one hundred and five”, and “one million and one” for 1,000,001. The converter has a British “and” switch. In check style it is ignored, because a check uses “and” only to introduce the cents.",
    },
    {
      question: "How do I write numbers in words in lakh and crore?",
      answer:
        "Choose the Indian numbering system, or pick the rupee, which selects it for you. After the first three digits the groups have two digits each: 12,34,567 is “twelve lakh thirty-four thousand five hundred sixty-seven”. A lakh is 100,000 and a crore is 10,000,000. Above 99 crore the count of crores is read the same way, so 10^12 is “one lakh crore”.",
    },
    {
      question: "Can it convert very large numbers exactly?",
      answer:
        "Yes, up to 36 digits, which reaches the decillions. Ordinary JavaScript numbers stop being exact above 9,007,199,254,740,991, so this tool never converts your input to one. It reads the digits as text, three at a time, so 1e30 is “one nonillion” and a 30-digit value keeps every digit. Currency rounding uses BigInt integer arithmetic.",
    },
    {
      question: "What is the difference between short scale and long scale?",
      answer:
        "On the short scale, used in the United States and by the UK government since 1974, a billion is 10^9 and a trillion is 10^12. On the long scale, still used in parts of continental Europe, a billion is 10^12 and 10^9 is a milliard. The converter defaults to the short scale; switch scales under More options when the text is meant for a long-scale reader.",
    },
    {
      question: "Should numbers like twenty-one be hyphenated?",
      answer:
        "Yes. Compound numbers from 21 to 99 take a hyphen when both the tens and the units are written: twenty-one, sixty-four, ninety-nine. The hyphen belongs only between those two words, so it is “one hundred twenty-one”, never “one-hundred-twenty-one”. If your style guide or client wants “twenty one”, turn off Hyphenate 21 to 99.",
    },
    {
      question: "When should I write a number as words instead of digits?",
      answer:
        "It depends on the style guide. Associated Press style spells out one through nine and uses numerals from 10. The Chicago Manual of Style spells out zero through one hundred and round multiples such as “three thousand”. Both advise spelling out a number that begins a sentence. Legal and financial documents often give the amount in words and in figures.",
    },
    {
      question: "Is my number sent to a server?",
      answer:
        "No. The conversion runs in your browser with JavaScript, and nothing you type is uploaded or logged by the tool. Your last entry and settings are kept in your browser tab’s session storage so a refresh does not lose them, and closing the tab clears them. Lists of numbers are converted locally as well.",
    },
  ],
};
