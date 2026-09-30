import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "mouse-test",
  name: "Mouse Test (Buttons, Scroll & Double-Click)",
  title: "Mouse Test – Buttons, Double-Click, Scroll & Polling Rate",
  description:
    "Free mouse test: press every button, catch unintended double clicks, check the scroll wheel and estimate polling rate. Runs in your browser, nothing to install.",
  shortDescription: "Test left, right, middle, back and forward buttons, catch double-click faults, check the wheel and estimate polling rate.",
  category: "utilities",
  keywords: [
    "mouse test",
    "mouse button test",
    "mouse double click test",
    "double click test",
    "mouse scroll test",
    "mouse polling rate test",
    "scroll wheel test",
    "mouse side button test",
    "online mouse tester",
  ],
  aliases: ["mouse tester", "test my mouse", "mouse checker", "mouse double click problem test", "check mouse buttons", "mouse wheel test"],
  icon: "mouse",
  featured: false,
  highInteraction: true,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["click-speed-test", "keyboard-tester", "dead-pixel-test"],
  faq: [
    {
      question: "How do I test my mouse buttons online?",
      answer:
        "Move the pointer into the test area and press each button once: left, right, middle (the wheel click), and the back and forward side buttons if your mouse has them. A button turns orange while it is held and green once the browser has registered it, and its tile counts the presses. If a button never changes color, the browser never received a press from it, which points to the switch, the cable or the mouse software.",
    },
    {
      question: "How do I know if my mouse is double-clicking by itself?",
      answer:
        "Click one button slowly, about once a second, for 20 or 30 presses while you watch the double-click detector. A healthy mouse shows no gaps below the limit. A worn switch sometimes registers a second press a few dozen milliseconds after the first, and the tool flags it in red with the exact gap. Faults can be intermittent, so repeat the test on each button and on a second USB port before you decide.",
    },
    {
      question: "What limit should I use for the double-click detector?",
      answer:
        "The default is 80 ms, which equals 12.5 presses per second from a single button. Deliberate single clicks almost never come that close together, while bounce-type faults usually show up as gaps of a few milliseconds to a few tens of milliseconds. If a very fast clicker triggers flags on purpose, lower the limit toward 40 ms. To catch milder faults, raise it toward 120 ms and click slowly to avoid false alarms.",
    },
    {
      question: "How do I fix a mouse that double-clicks?",
      answer:
        "Start with the cheap checks: try another USB port or computer, update or reset the mouse software, remove macros, and raise any debounce or click-delay setting it offers. Then look at the warranty, because switches can fail early. Some people report that cleaning the switch helps for a while, but a worn contact usually returns. Past that, the switch can be replaced by someone comfortable with a soldering iron, or the mouse retired.",
    },
    {
      question: "Why don't my back and forward buttons show up?",
      answer:
        "The browser only reports them when the mouse driver sends them as standard buttons four and five. Some vendor software remaps side buttons to keyboard shortcuts or macros, so the page sees a key press or nothing at all. Try closing or disabling the vendor software and press again. On a mouse with only left, right and wheel buttons, the back and forward tiles will simply stay untested.",
    },
    {
      question: "What is polling rate and how do I check it here?",
      answer:
        "Polling rate is how many times per second the mouse reports to the computer: 125 Hz means every 8 ms, and 1,000 Hz means every 1 ms. In Chrome or Edge, the estimate box counts position updates while you circle the pointer quickly and shows the highest sustained rate, capped at 8,000 Hz. It is an estimate, and slow movement or a busy computer can read low. Other browsers lack the needed event, so the box is hidden.",
    },
    {
      question: "What is the difference between DPI and polling rate?",
      answer:
        "DPI, sometimes written CPI, is how far the cursor moves for each inch you move the mouse, so it sets pointer speed. Polling rate is how often the mouse reports that movement, so it affects smoothness and latency rather than distance. Changing one does not change the other. For example, 800 DPI with a 1,000 Hz polling rate means 800 counts per inch, reported every millisecond.",
    },
    {
      question: "Is anything I do in the mouse test recorded or uploaded?",
      answer:
        "No. The page listens to mouse events in your browser and keeps the counts in memory until you reset or close the tab. Nothing is sent to a server. Only two settings are saved in your browser's local storage: the double-click limit and the scroll option. The report you can copy or download is created on your device and contains only what you see on the page.",
    },
  ],
};
