import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "color-contrast-checker",
  name: "Color Contrast Checker (WCAG 2.2)",
  title: "Color Contrast Checker – WCAG 2.2 Ratio & Auto-Fix",
  description:
    "Free color contrast checker for WCAG 2.2: test text and background colors for AA and AAA, get the nearest passing colors, and check a whole palette at once.",
  shortDescription: "Check text and background contrast against WCAG 2.2 AA and AAA, fix failing colors automatically and test a whole palette.",
  category: "design",
  keywords: [
    "color contrast checker",
    "contrast checker",
    "wcag contrast checker",
    "color contrast ratio",
    "contrast ratio calculator",
    "accessible color checker",
    "wcag aa contrast ratio",
    "wcag 2.2 contrast",
    "fix insufficient contrast lighthouse",
  ],
  aliases: ["text contrast checker", "background color contrast checker", "color contrast analyzer", "contrast ratio checker"],
  icon: "contrast",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["box-shadow-generator", "border-radius-generator", "px-to-rem", "dead-pixel-test"],
  faq: [
    {
      question: "What is a good color contrast ratio?",
      answer:
        "For normal-size text, 4.5:1 is the WCAG AA minimum and 7:1 is the stricter AAA level. Large text and user interface parts such as borders and icons need 3:1 at AA. The scale runs from 1:1 (identical colors) to 21:1 (black on white). Aim for more than the minimum on body copy, because thin fonts, small sizes and bright screens all make a borderline ratio harder to read.",
    },
    {
      question: "What contrast ratio does WCAG 2.2 require for AA and AAA?",
      answer:
        "AA (criterion 1.4.3) requires 4.5:1 for normal text and 3:1 for large text. AAA (criterion 1.4.6) requires 7:1 for normal text and 4.5:1 for large text. Non-text Contrast (1.4.11) asks for 3:1 for user interface components and meaningful graphics. WCAG 2.2 did not change these numbers from 2.1, so a pair that passed under 2.1 still passes.",
    },
    {
      question: "What counts as large text in WCAG?",
      answer:
        "Large text is at least 18 point, or at least 14 point and bold. In CSS pixels that is 24px regular or about 18.66px bold. The standard does not name a numeric font weight for bold, so most tools treat 700 and above as bold. Text below those sizes is normal text and needs 4.5:1 at AA, so a fix that only works for 24px headings will not cover body copy.",
    },
    {
      question: "How is the contrast ratio calculated?",
      answer:
        "Each color's sRGB channels are converted to linear light, then weighted as 0.2126 red, 0.7152 green and 0.0722 blue to give a relative luminance L between 0 and 1. The ratio is (L of the lighter color + 0.05) divided by (L of the darker color + 0.05). The 0.05 term stands in for ambient light. The ratio is not rounded up, so 4.499:1 fails a 4.5:1 requirement.",
    },
    {
      question: "Does contrast apply to placeholder text, disabled buttons and logos?",
      answer:
        "Placeholder text is ordinary text, so it is held to the same 4.5:1 as other text. Text in a truly inactive (disabled) control is exempt, as are purely decorative text and logotypes. A button that looks disabled but still works is not exempt. Icons and borders that carry meaning fall under the 3:1 non-text rule, including the boundary that shows where a form field is.",
    },
    {
      question: "How do I fix the Lighthouse \"insufficient contrast\" error?",
      answer:
        "Open the failing audit, note each element's foreground and background colors, and paste them into the checker. Pick the goal that matches the text size, use the closest suggested color, and change it in your CSS or design token. Re-run Lighthouse afterward. If the text sits on an image or gradient, Lighthouse often cannot decide automatically, so add a solid or semi-opaque layer behind the text and test that color.",
    },
    {
      question: "What is APCA, and will it replace the WCAG contrast ratio?",
      answer:
        "APCA is a perceptual contrast algorithm that takes text size and weight into account, where the WCAG 2 ratio does not. It was proposed for an early WCAG 3.0 draft, but as of 2026 the contrast method for WCAG 3.0 has not been settled, and the draft itself is still unfinished. The current criteria, and automated tools such as Lighthouse, use the WCAG 2 ratio, so that is what this checker measures. APCA has its own license and naming rules.",
    },
    {
      question: "Does passing here mean my site meets accessibility law?",
      answer:
        "No. A passing ratio shows that two colors are far enough apart, which is one measurable part of accessibility. Conformance depends on the whole page, including text size, states, images and content. Whether a law, contract or procurement rule requires a particular level is a legal question this page cannot answer, so ask a qualified adviser. The checker never uploads your colors; they stay in your browser.",
    },
  ],
};
