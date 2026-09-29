import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "click-speed-test",
  name: "Click Speed Test (CPS Test)",
  title: "Click Speed Test – Free CPS Test, 1 to 60 Seconds",
  description:
    "Free click speed test: measure your clicks per second in 1, 2, 5, 10, 30 or 60 seconds with live CPS, a click-rhythm chart and a double-click check. No sign-up.",
  shortDescription: "Measure clicks per second in 1 to 60 seconds with live CPS, a rhythm chart, saved bests and a double-click check.",
  category: "utilities",
  keywords: [
    "click speed test",
    "cps test",
    "mouse click test",
    "click counter",
    "clicks per second test",
    "butterfly clicking test",
    "jitter click test",
    "10 second click test",
    "double click test",
  ],
  aliases: ["cps tester", "click test", "clicks per second", "click speed checker", "spacebar click test", "right click cps test"],
  icon: "mouse",
  featured: false,
  highInteraction: true,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["keyboard-tester", "percentage-calculator", "password-generator"],
  faq: [
    {
      question: "How is CPS calculated in this click speed test?",
      answer:
        "CPS is your total clicks divided by the test length in seconds. Your first click starts the timer and counts, and any click that lands after the deadline is thrown away. For example, 64 clicks in a 10-second test gives 64 ÷ 10 = 6.40 CPS. Each click is timed with the browser's own event timestamp, so screen lag does not change the result.",
    },
    {
      question: "What is a good CPS score?",
      answer:
        "It depends on the test length and technique, so compare against your own past scores at the same length. As a yardstick, Guinness World Records lists 760 clicks in one minute as its record for most mouse clicks in a minute, which is about 12.7 clicks per second held for the full 60 seconds. Short 1 to 5 second bursts usually score higher than long runs because fatigue builds.",
    },
    {
      question: "Why is my score lower on the 60-second test than the 5-second test?",
      answer:
        "Fatigue and pacing. In a 2015 Human Factors study of 148 adults tapping for one minute with each finger, tapping duration had a significant effect on the rate, and index and middle fingers were fastest. Sprinting for 5 seconds is a different skill from holding a rhythm for a minute, so only compare scores from the same test length.",
    },
    {
      question: "Are jitter, butterfly and drag clicking allowed in games?",
      answer:
        "Rules vary by game and server and change over time, so read the current rules before relying on any technique. Auto-clickers and macros are commonly banned, and anti-cheat can flag very fast, very regular clicking even when done by hand. Techniques that use only your own fingers are treated differently from software, but this page cannot tell you what a particular server allows.",
    },
    {
      question: "Can clicking fast hurt my hand?",
      answer:
        "Rapid repeated clicking can tire the muscles of the hand and forearm, and jitter clicking in particular can cause cramps quickly. Keep tests short, rest between rounds, relax your grip, and stop if you feel pain, numbness or tingling. This is general information rather than medical advice, so see a professional if symptoms continue after resting.",
    },
    {
      question: "What does the Fast gaps counter mean, and could my mouse be double-clicking?",
      answer:
        "Fast gaps counts clicks that arrived less than 30 milliseconds after the previous one. One finger rarely does that on purpose, so a non-zero count during slow, steady single clicks can point to a worn switch or a debounce setting that is too short. Repeat the test to confirm. Drag and butterfly bursts also trigger it, so use one finger when checking.",
    },
    {
      question: "Does the click test work on phones and tablets?",
      answer:
        "Yes. The pad uses pointer events, so touch taps count as left clicks and each finger on the screen counts separately, which suits two-thumb tapping. The pad disables double-tap zoom and scrolling while you touch it. If you choose the right-button setting, touch taps are ignored because a screen has no right button. Spacebar mode needs a keyboard.",
    },
    {
      question: "Are my scores saved or uploaded anywhere?",
      answer:
        "Nothing is uploaded. Your last-used settings and your best score for each test length are kept in your browser's local storage so they are there next time. Use \"Clear saved bests\" to delete the scores, or clear the site's data in your browser. If storage is blocked, the test still works and simply cannot remember anything.",
    },
  ],
};
