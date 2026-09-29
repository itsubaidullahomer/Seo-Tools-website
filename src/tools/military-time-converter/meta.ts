import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "military-time-converter",
  name: "Military Time Converter",
  title: "Military Time Converter – 24-Hour Chart & Printable PDF",
  description:
    "Free military time converter: switch 12-hour and 24-hour time both ways, hear how to say it, convert Zulu time and print a 24-hour chart on Letter or A4.",
  shortDescription: "Convert standard time to military time and back, hear how to say it, work with Zulu time zones, and print a 24-hour chart.",
  category: "converters",
  keywords: [
    "military time converter",
    "military time chart printable",
    "24 hour to 12 hour converter",
    "what time is 1900 in military time",
    "1700 military time",
    "how to say 0630 military time",
    "standard time to military time",
    "military time chart",
    "zulu time converter",
    "convert military time to standard time",
  ],
  aliases: [
    "24 hour clock converter",
    "military time to standard time",
    "standard to military time",
    "12 hour to 24 hour converter",
    "24 hour time chart",
    "military clock converter",
    "time to military time",
    "zulu time",
  ],
  icon: "clock",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["roman-numeral-converter", "number-to-words", "words-to-time", "hourly-to-salary-calculator", "salary-to-hourly-calculator"],
  faq: [
    {
      question: "What time is 1900 in military time?",
      answer:
        "1900 is 7:00 PM. For any military hour from 13 to 23, subtract 12 to get the PM hour: 19 minus 12 is 7. The last two digits are the minutes and never change, so 1930 is 7:30 PM. You say it as “nineteen hundred hours.” The same rule gives 1700 as 5:00 PM and 2200 as 10:00 PM, and the converter shows the working for any time you type.",
    },
    {
      question: "How do I convert standard time to military time?",
      answer:
        "Keep AM hours as they are and write them with two digits, so 6:30 AM becomes 0630. Add 12 to PM hours from 1 to 11, so 5:30 PM becomes 1730. Two exceptions catch most mistakes: 12:xx AM becomes 00xx (12:15 AM is 0015), and 12:xx PM stays 12xx (12:15 PM is 1215). Then drop the colon and the AM or PM.",
    },
    {
      question: "How do I convert military time to standard time?",
      answer:
        "Read the first two digits as the hour. Hours 01 to 11 are AM and stay the same, hour 12 is noon so it stays 12 in the PM, and hours 13 to 23 are PM after you subtract 12. Hour 00 is the midnight hour, which becomes 12 AM. So 1545 is 3:45 PM, 0005 is 12:05 AM and 1200 is 12:00 PM. The minutes never change.",
    },
    {
      question: "How do you say 0630 in military time?",
      answer:
        "Say “zero six thirty hours.” Read the hour as two digits, with “zero” in front of 01 to 09, then read the minutes as a normal number. Whole hours end in “hundred”: 0600 is “zero six hundred hours” and 1700 is “seventeen hundred hours.” Single-digit minutes get a zero, so 0605 is “zero six zero five.” Some units say “oh” for zero, and radio operators often read digit by digit.",
    },
    {
      question: "Is midnight 0000 or 2400?",
      answer:
        "Both name the same instant, but 0000 is the standard way to write it. A military day runs from 0000 to 2359, and the clock rolls from 2359 straight to 0000 as the date changes. You may see 2400 in schedules and contracts to mean the end of a day, as in “open until 2400.” The converter accepts 2400 and shows it as 0000 with a note. To avoid doubt, write 2359 or add the date.",
    },
    {
      question: "What does the Z or Zulu after a military time mean?",
      answer:
        "Z stands for Zulu, the military name for Coordinated Universal Time (UTC). So 1730Z is 17:30 UTC no matter where you are. Each military time zone has a letter: A to M run one to twelve hours ahead of UTC (skipping J), and N to Y run one to twelve hours behind. J means your own local time. Pilots, dispatchers and military units use Zulu so everyone shares one clock.",
    },
    {
      question: "Why do hospitals and the military use the 24-hour clock?",
      answer:
        "Every time has exactly one written form, so there is no AM or PM to leave out or misread. That matters most around midnight and noon, where “12:00 AM” and “12:00 PM” are easy to swap. Many hospitals, emergency services, airlines and armed forces log events this way because care and operations run around the clock. Practices differ by organization, so follow the written policy where you work.",
    },
    {
      question: "Do you write a colon in military time?",
      answer:
        "Traditional military time uses four digits with no colon, such as 0630 or 1745, and often adds the word hours or a zone letter (1745Z). The colon version, 06:30 or 17:45, is the same time and is what timetables, spreadsheets and software usually show. Always keep the leading zero: 0630 is clear, while 630 could be read as 6:30 or as the number 630. Paper forms should follow whichever style the form asks for.",
    },
  ],
};
