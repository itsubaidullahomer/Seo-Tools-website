import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "words-to-time",
  name: "Words to Time Calculator",
  title: "Words to Time Calculator – Speaking & Reading Time",
  description:
    "Free words to time calculator: turn a word count or pasted script into speaking time and silent reading time, or find how many words fit any number of minutes.",
  shortDescription: "Convert words to speaking and reading time, or minutes to words, with adjustable pace, pauses and presets for speeches and voice-overs.",
  category: "text",
  keywords: [
    "words to time",
    "words to minutes",
    "speech time calculator",
    "reading time calculator",
    "speaking time calculator",
    "how many words is a 5 minute speech",
    "how long does it take to read 1000 words",
    "words per minute calculator",
    "voice over word count",
  ],
  aliases: ["minutes to words", "script timer", "speech length calculator", "read time estimator", "talk time calculator", "words to minutes calculator"],
  icon: "timer",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["word-counter", "words-to-pages", "character-counter", "remove-line-breaks", "case-converter"],
  faq: [
    {
      question: "How many words is a 5 minute speech?",
      answer:
        "At an average speaking pace of 150 words per minute, a 5 minute speech is about 750 words. A slow, deliberate pace of 130 words per minute gives 650 words, and a fast pace of 180 gives 900. If you plan ten 3-second pauses for breaths and slide changes, drop the script to roughly 675 words. Use the Time to words tab to set your own pace and pauses.",
    },
    {
      question: "How long does it take to read 1,000 words?",
      answer:
        "Reading silently at the 238 words per minute average found for adult non-fiction readers, 1,000 words takes about 4 minutes 12 seconds. Reading the same text aloud takes longer: about 6 minutes 40 seconds at a speaking pace of 150 words per minute, or about 5 minutes 28 seconds at the 183 words per minute average measured for oral reading.",
    },
    {
      question: "What is the average speaking speed in words per minute?",
      answer:
        "Most sources put comfortable English speech between 130 and 160 words per minute, and 150 is the figure quoted most often. Real speakers vary widely with topic, audience and personality, and conversation between friends is often faster than a prepared talk. Time yourself reading a paragraph from your own script aloud, then set the slider to that number for the most accurate estimate.",
    },
    {
      question: "What is the average reading speed, and where does 238 come from?",
      answer:
        "The 238 words per minute figure is the average silent reading rate for adults reading English non-fiction, taken from a 2019 review and meta-analysis by Marc Brysbaert covering 190 studies. The same paper reports 260 for fiction and 183 for reading aloud. These are averages, and individual readers vary widely around them.",
    },
    {
      question: "Why does my speech run longer than the calculator says?",
      answer:
        "Real talks contain time the word count does not: pauses for breath and emphasis, slide transitions, laughter, questions and small ad-libs. Difficult terms and numbers also slow most speakers down. Switch on pause time, add a second or two per paragraph, and do one timed rehearsal out loud. Then aim to finish 10 percent under your slot so a nervous start does not cost you the ending.",
    },
    {
      question: "How many words fit a 15, 30 or 60 second voice-over?",
      answer:
        "At about 150 words per minute, or roughly 2.5 words per second, a 15-second spot fits about 38 words, a 30-second spot about 75 and a 60-second spot about 150. Lively reads at 180 words per minute stretch that to 45, 90 and 180 words. Leave space for music, a brand name that needs clear delivery, and the breaths a real voice actor takes.",
    },
    {
      question: "Does this work for languages other than English?",
      answer:
        "The arithmetic works for any language whose words are separated by spaces, but the speeds do not transfer exactly. Average word length differs between languages, so typical words per minute differ too. For Spanish, German or other languages, time a sample aloud and set a custom pace. Chinese, Japanese and Thai are written without spaces, so a word count is not meaningful and a character-based estimate is better.",
    },
    {
      question: "Is my text uploaded or stored anywhere?",
      answer:
        "No. The word count and timing are calculated in your browser as you type, and nothing is sent to a server. The text you paste is kept only in this browser tab's session storage so a refresh does not lose it, and it is cleared when the tab closes. Your pace and pause settings are remembered in local storage on your device. Use the Clear button to remove the text at any time.",
    },
  ],
};
