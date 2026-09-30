import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "discord-colored-text-generator",
  name: "Colored Text Generator for Discord",
  title: "Discord Colored Text Generator – ANSI Color Codes",
  description:
    "Discord colored text generator: select words, pick text and background colors, and copy a ready-to-paste ANSI code block. Free, private, with live preview.",
  shortDescription: "Select words, pick text and background colors, and copy an ansi code block for Discord. Live preview, no sign-up.",
  category: "social-media",
  keywords: [
    "discord colored text generator",
    "discord color text",
    "discord ansi color codes",
    "how to change text color in discord",
    "discord colored text code block",
    "discord text colors",
    "discord text color generator",
    "discord red text",
    "ansi color code generator",
  ],
  aliases: ["discord ansi generator", "discord color text maker", "colored text for discord", "discord rainbow text"],
  icon: "palette",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["discord-timestamp-generator", "invisible-character", "character-counter", "color-contrast-checker", "case-converter"],
  faq: [
    {
      question: "How do I change text color in Discord?",
      answer:
        "Discord has no color button. Colors come from code blocks: start a block with three backticks and the word ansi, then put escape codes before the words you want colored. Typing the invisible escape character by hand is impractical, so this tool writes the codes for you. Select words, pick colors, press Copy message, and paste it into Discord on desktop or the web. Phones may not show colors.",
    },
    {
      question: "Why does my colored text show up as plain text or strange symbols?",
      answer:
        "Usually one of four things: you are reading on a phone or an older app that does not render ansi blocks, the first line is not exactly ```ansi, the invisible escape character was lost when pasting, or the message was edited afterward. Paste again from the Copy button, check the first line, and view the message in the desktop app or a browser before changing anything else.",
    },
    {
      question: "Does Discord colored text work on mobile?",
      answer:
        "Sources disagree. Older guides say the mobile apps do not show ANSI colors, while some 2026 guides say recent iOS and Android versions do. We checked guides on September 30, 2026 and could not test a phone ourselves. Update the app, post a test in a private channel first, and assume some readers may still see plain monospace text.",
    },
    {
      question: "What are the Discord ANSI color codes?",
      answer:
        "Text colors are 30 to 37: gray, red, green, yellow, blue, pink, cyan and white in the widely documented palette. Backgrounds are 40 to 47. Code 1 is bold, 4 is underline and 0 resets everything. A code sits between ESC[ and m, for example ESC[31m for red text, and several codes can be joined with semicolons, such as ESC[1;4;31m for bold, underlined red.",
    },
    {
      question: "Did Discord change its ANSI colors in 2026?",
      answer:
        "Several guides report that Discord changed the palette in August 2026: the background codes 40 to 47 now use the same eight hues as the text codes, and the exact shades follow the reader's theme. We could not confirm this against Discord's own documentation on September 30, 2026, so the preview here is approximate. The code numbers are the same, so a message still works; only its look can differ.",
    },
    {
      question: "Do the diff, css and yaml code-block tricks still work?",
      answer:
        "Sometimes, but they are accidents of syntax highlighting, not a color feature. A diff block colors lines that start with + or -, and css or yaml blocks color certain tokens. You get two or three colors, no backgrounds, and the result depends on the client's highlighter, which can change without notice. ansi blocks give eight text colors and eight backgrounds, which is why this tool uses them.",
    },
    {
      question: "Is there a character limit for colored messages?",
      answer:
        "Yes. A Discord message is limited to 2,000 characters, or 4,000 with Nitro, as of September 30, 2026. The fence around the block adds 12 characters, and every color change costs at least nine more: an opening code such as ESC[31m takes 5 characters and the reset ESC[0m takes 4. The tool shows the exact message length as you edit.",
    },
    {
      question: "Is my text sent anywhere?",
      answer:
        "No. The text, colors and preview are handled by JavaScript in your browser tab. Nothing is uploaded and there is no account. Your draft lives in session storage for the current tab, so a reload brings it back, and your preview theme and palette choices are stored on this device. Closing the tab removes the draft, and clearing site data removes the rest.",
    },
  ],
};
