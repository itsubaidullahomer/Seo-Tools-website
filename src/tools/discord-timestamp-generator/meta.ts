import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "discord-timestamp-generator",
  name: "Timestamp Generator for Discord",
  title: "Discord Timestamp Generator – All 7 Formats, Any Time Zone",
  description:
    "Free Discord timestamp generator: pick a date, time and time zone, then copy all 7 formats including a live countdown. Warns about daylight saving. No sign-up.",
  shortDescription: "Pick a date, time and time zone, then copy Discord timestamp codes in all 7 formats, with countdown shortcuts and bot code.",
  category: "social-media",
  keywords: [
    "discord timestamp generator",
    "discord timestamp",
    "discord time format",
    "discord relative timestamp",
    "discord countdown timer",
    "discord unix timestamp",
    "discord time converter",
    "discord snowflake to date",
    "discord timestamp time zone",
  ],
  aliases: ["discord time converter", "discord timestamp maker", "discord date generator", "discord snowflake decoder", "discord time zone converter"],
  icon: "calendar-clock",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["discord-colored-text-generator", "military-time-converter", "uuid-generator", "words-to-time"],
  faq: [
    {
      question: "How do I make a timestamp on Discord?",
      answer:
        "Pick a date, a time and the time zone you mean, then press Copy next to the format you want. You get a short code such as `<t:1794704400:R>`. Paste it into any Discord message and send it. Discord replaces the code with a time that each reader sees in their own time zone, so you type it once no matter how many countries your community spans.",
    },
    {
      question: "What do the letters t, T, d, D, f, F and R mean?",
      answer:
        "They are the seven display styles. Lowercase t is a short time and capital T adds seconds. Lowercase d is a short date and capital D spells out the month. Lowercase f is a date with a short time, and capital F adds the weekday. R is relative time, such as “in 3 hours” or “2 days ago”. A code with no letter is shown like f. Recent discord.js versions also list s and S, which this tool does not generate.",
    },
    {
      question: "Do Discord timestamps show the right time for people in other time zones?",
      answer:
        "Yes. A timestamp stores one exact moment as Unix seconds, and each person's Discord app converts it using the time zone of their own device. A friend in Tokyo and a friend in New York see different clock readings for the same moment, and both are correct. The zone you choose in this tool only decides which moment you mean when you type a clock time.",
    },
    {
      question: "Why is my Discord timestamp showing the wrong time?",
      answer:
        "The usual cause is the wrong zone when generating it: the date and time you typed were read in a different zone than the one you had in mind. Other causes are pasting milliseconds instead of seconds, a missing angle bracket, and putting the code inside backticks or a code block, where Discord shows it as plain text. Check the zone line under the result first.",
    },
    {
      question: "How do I make a countdown in Discord?",
      answer:
        "Use the R style. Press a shortcut such as “+1 hour” or “+1 week”, or enter a custom amount, then copy the relative code. Discord keeps the wording current on its own, so a message that says “in 3 days” later reads “in 2 days”, then “in 5 hours”, without any edit. Relative text is rounded, so add the full date with style F when exactness matters.",
    },
    {
      question: "Do timestamps work in embeds, on mobile and in bot messages?",
      answer:
        "Timestamp codes are read wherever Discord renders message text, including messages that bots send. Places other than the main message body are less certain. Community reports disagree about embed titles and footers, while descriptions and field values are the usual safe choice. Always send a test message in a private channel before announcing an event, and check it on both desktop and mobile.",
    },
    {
      question: "How do I find out when a Discord account, server or message was created?",
      answer:
        "Turn on Developer Mode in Discord's advanced settings, right-click the user, server, channel or message and choose Copy ID. Paste the number into the Snowflake ID tab. Every ID carries a millisecond timestamp, counted from 1 January 2015 UTC, in its top 42 bits, so the tool can show the exact creation moment plus the worker, process and increment fields packed into the same number.",
    },
    {
      question: "Can I generate timestamps in a bot with discord.js or discord.py?",
      answer:
        "Yes. In discord.js, the `time()` helper with `TimestampStyles` builds the code from a Date. In discord.py, `discord.utils.format_dt()` does the same from a datetime. Both simply produce the text `<t:UNIX:STYLE>`, so a plain string works too. Use Unix seconds, not milliseconds. The Code for a bot section above fills in your moment and chosen style.",
    },
  ],
};
