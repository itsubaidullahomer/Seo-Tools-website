import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "keyboard-tester",
  name: "Keyboard Tester",
  title: "Keyboard Tester – Test Every Key, Ghosting & Chatter",
  description:
    "Free online keyboard tester: press any key to see it light up, then check ghosting, n-key rollover and key chatter. Full-size, TKL, 60%, ISO and Mac layouts.",
  shortDescription: "Press any key to see it light up, and check ghosting, rollover and key chatter on full-size, TKL, 60%, ISO and Mac layouts.",
  category: "utilities",
  keywords: [
    "keyboard tester",
    "keyboard test",
    "key tester",
    "test keyboard keys online",
    "keyboard ghosting test",
    "n-key rollover test",
    "keyboard checker",
    "laptop keyboard test",
    "keyboard chatter test",
  ],
  aliases: [
    "online keyboard tester",
    "keyboard key tester",
    "mechanical keyboard tester",
    "60% keyboard tester",
    "mac keyboard tester",
    "keyboard rollover test",
    "check keyboard keys",
  ],
  icon: "keyboard",
  featured: false,
  highInteraction: true,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["click-speed-test", "password-generator", "word-counter"],
  faq: [
    {
      question: "How do I test if all my keyboard keys work?",
      answer:
        "Click the keyboard drawing until the badge says Capturing keys, then press every key on your keyboard once. Each key turns green with a check mark after it registers, and the counter shows how many are left. The Keys still to test list names anything you missed. If a key never lights up here but works in other apps, check your layout settings. If it fails everywhere, the switch or its connection is the likely cause.",
    },
    {
      question: "What is keyboard ghosting and how do I test for it?",
      answer:
        "Ghosting is when a keyboard fails to report a key you are pressing, or reports one you are not, because several keys are down at once. It comes from the switch matrix under the keys. To test it, use the combination checks: hold each set of keys together and see whether every key registers. Repeated failures on a gaming board usually mean it lacks anti-ghosting diodes or is limited to a handful of simultaneous keys.",
    },
    {
      question: "What is n-key rollover (NKRO) and how many keys should register?",
      answer:
        "N-key rollover means every key can be held at the same time and each one is reported. Many keyboards use a standard USB report with room for six regular keys plus the modifiers, called 6KRO, which is plenty for typing and most games. Hold as many keys as you can and read Most held at once. A peak of six suggests a 6-key limit, while a number matching every key you held points to NKRO.",
    },
    {
      question: "Why is one key not working on my laptop?",
      answer:
        "Work through it in order. Press the key here: if it lights up, the hardware is fine and the cause is software, such as a language layout, a remapping tool or an app shortcut. If it never lights up, restart and clean around the key with compressed air. Still dead usually means a failed switch, a damaged membrane or a loose ribbon cable, which on most laptops needs a repair or a replacement keyboard.",
    },
    {
      question: "How do I fix key chatter, where one press types twice?",
      answer:
        "Chatter is a switch contact bouncing so that one press registers two. Confirm it here first: the same key going down again within about 30 milliseconds of its release is a strong sign. Then clean the switch, because dust and residue are common causes. On a programmable keyboard, raise the debounce time in its firmware or software. Worn or failing switches need replacing, which is easy on hot-swap boards, and a warranty may cover it.",
    },
    {
      question: "Can a website detect the Fn key?",
      answer:
        "No. On almost every keyboard the Fn key is handled inside the keyboard's own firmware, which turns Fn plus another key into a different key or a media command before the computer sees anything. A web page therefore cannot tell that Fn was pressed. Print Screen, the Windows key, Esc and some system shortcuts are also restricted, although Chromium-based browsers can capture several of them in fullscreen with key lock.",
    },
    {
      question: "Does the keyboard tester record what I type?",
      answer:
        "No. Key presses are handled by JavaScript in your browser tab and shown on screen. They are not saved, uploaded or sent to analytics, and the log and test results disappear when you reset or close the page. Only your layout choices are remembered in local storage. Still, avoid typing passwords or other secrets into any tester, since they would be visible in the on-screen event log.",
    },
    {
      question: "How do I test an ISO, Mac or 60% keyboard?",
      answer:
        "Choose the keyboard size, key standard and modifier key labels above the drawing. ISO adds the extra key beside left Shift and the tall Enter, Mac swaps Windows and Alt for Command and Option, and 60% removes the function row and cursor keys. In Chrome and Edge the letters are also relabeled to match your layout. Keys your board does not have can be marked as missing so they do not count against you.",
    },
  ],
};
