import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "roman-numeral-converter",
  name: "Roman Numeral Converter",
  title: "Roman Numeral Converter – Numbers, Dates & Chart 1–100",
  description:
    "Free Roman numeral converter: turn numbers and dates into Roman numerals and back, with step-by-step breakdowns, error explanations and a 1–100 chart.",
  shortDescription: "Convert numbers, years and dates to Roman numerals and back, with step-by-step working, error explanations and charts.",
  category: "converters",
  keywords: [
    "roman numeral converter",
    "roman numerals",
    "roman numeral date converter",
    "roman numerals chart",
    "convert numbers to roman numerals",
    "roman numerals 1-100",
    "roman numerals tattoo date",
    "roman numerals to numbers",
    "what is 2026 in roman numerals",
  ],
  aliases: ["number to roman numerals", "roman to number", "date to roman numerals", "roman numeral translator", "roman numeral tattoo generator"],
  icon: "landmark",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["number-to-words", "military-time-converter", "case-converter", "percentage-calculator"],
  faq: [
    {
      question: "What is 2026 in Roman numerals?",
      answer:
        "2026 is MMXXVI. Split the year into places: 2000 is MM, 20 is XX and 6 is VI, and joining them from largest to smallest gives MMXXVI. The same method gives MMXXV for 2025 and MMXXVII for 2027. Type any year into the converter to see the same breakdown in a table, or use the Years chart to look up a hundred years at once.",
    },
    {
      question: "How do I convert a number to Roman numerals?",
      answer:
        "Write the thousands, hundreds, tens and ones separately, then convert each place with the symbols I, V, X, L, C, D and M. For 1994 that is M (1,000), CM (900), XC (90) and IV (4), which join as MCMXCIV. Use IV, IX, XL, XC, CD and CM for the 4s and 9s in each place, and never repeat a letter more than three times in a row.",
    },
    {
      question: "How do you write a date in Roman numerals for a tattoo?",
      answer:
        "Convert the month, day and year separately and join them with a separator such as a dot: June 15, 2024 becomes VI.XV.MMXXIV in month-day-year order. Pick the order, separator and year style in Date to Roman mode, then check that every part reads back correctly. Ask your tattoo artist to confirm the numerals and spacing before inking, because conventions vary between countries.",
    },
    {
      question: "Is 4 written IV or IIII?",
      answer:
        "The standard modern form is IV. This converter flags IIII as non-standard while still telling you it means 4. Both spellings appear in ancient inscriptions, and IIII survives on many clock and watch dials, where it balances VIII on the opposite side of the face. For documents, numbering and anything a teacher will mark, use IV.",
    },
    {
      question: "Why are VX, IC and IIII rejected?",
      answer:
        "Roman numerals follow three rules: a letter repeats at most three times in a row, V, L and D are never subtracted, and only I, X and C can go before a larger letter, in the pairs IV, IX, XL, XC, CD and CM. IIII breaks the first rule, VX breaks the second and IC breaks the third. The converter names the broken rule and shows the standard form, such as IV, V and XCIX.",
    },
    {
      question: "What is the largest Roman numeral?",
      answer:
        "In standard notation it is MMMCMXCIX, which is 3,999. To go higher, a bar (vinculum) over a letter multiplies it by 1,000, so a barred V is 5,000 and a barred M is 1,000,000. This converter writes numbers up to 3,999,999 with overlines and copies them with Unicode combining overlines, though some fonts draw those marks unevenly.",
    },
    {
      question: "Is there a zero in Roman numerals?",
      answer:
        "No. Standard Roman numerals start at I and have no symbol for zero, and the system has no negative numbers or decimals either. Medieval scholars who needed a zero in tables wrote the Latin word nulla, sometimes shortened to N. The converter explains this if you enter 0, and a date style that would need 00 falls back to the full year.",
    },
    {
      question: "Does the converter upload my numbers or dates?",
      answer:
        "No. Every conversion runs in your browser with JavaScript, so nothing you type is sent to a server. Your last inputs are kept only in this tab's session storage so a refresh does not lose them, and closing the tab clears them. That makes it safe to try personal dates such as birthdays and anniversaries for tattoo designs.",
    },
  ],
};
