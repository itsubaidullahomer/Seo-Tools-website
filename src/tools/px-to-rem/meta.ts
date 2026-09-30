import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "px-to-rem",
  name: "PX to REM Converter",
  title: "PX to REM Converter – Custom Root, Bulk CSS, Tailwind",
  description:
    "Free px to rem converter with an editable root font size, both directions, a 1-128px table and bulk CSS conversion. Copy the rem value, CSS or a Tailwind class.",
  shortDescription: "Convert px to rem and rem to px with any root font size, copy CSS or Tailwind classes, and convert a whole block of CSS at once.",
  category: "converters",
  keywords: [
    "px to rem",
    "px to rem converter",
    "pixels to rem",
    "16px to rem",
    "rem calculator",
    "rem to px",
    "convert px to rem css",
    "tailwind rem scale",
    "px to em",
    "css unit converter",
  ],
  aliases: ["pixel to rem", "px to rem calculator", "rem to px converter", "px2rem", "css px to rem", "convert pixels to rem"],
  icon: "ruler",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["border-radius-generator", "box-shadow-generator", "color-contrast-checker", "percentage-calculator"],
  faq: [
    {
      question: "How do I convert px to rem?",
      answer:
        "Divide the pixel value by the root font size. With the browser default of 16px, 24px is 24 ÷ 16 = 1.5rem, and 14px is 0.875rem. To go the other way, multiply: 1.25rem × 16 = 20px. If your CSS sets a different root size, use that number instead. With a 10px root, 24px becomes 2.4rem. The converter above does the division live and lets you change the root.",
    },
    {
      question: "How many pixels is 1rem?",
      answer:
        "One rem equals the font size of the root html element. Browsers default to 16px, so 1rem is 16px unless a stylesheet changes it. If CSS sets html to 62.5%, 1rem becomes 10px. People can also change their browser's default font size, and every rem value on your page then scales with it, which is the main reason to use rem for text.",
    },
    {
      question: "What is the difference between rem and em?",
      answer:
        "Rem is always measured from the root font size. Em is measured from the font size of the element itself, or from its parent when used in the font-size property, so it compounds when elements are nested. Three nested lists with font-size 1.2em give 19.2px, then 23.04px, then 27.648px from a 16px start. With 1.2rem every level stays 19.2px, which is why rem is easier to reason about.",
    },
    {
      question: "Should I use rem or px for font sizes?",
      answer:
        "Use rem for font sizes and for spacing that should grow with text, because rem follows the font size a person chose in their browser settings. Pixels are fine for details that should stay thin or fixed, such as 1px borders, hairlines and small shadow offsets. Browser zoom scales both units, so px text is not blocked from zooming, but it does ignore a larger default text size.",
    },
    {
      question: "Why does the bulk converter skip @media queries by default?",
      answer:
        "Inside a media query, rem and em are measured against the browser's initial font size, not the font size your CSS sets on html. If your root is 16px the numbers match, but with a 10px root a breakpoint converted to rem would fire at the wrong width. You can switch conversion on with the toggle, ideally with a 16px root, where 768px becomes 48rem.",
    },
    {
      question: "How do I convert px to rem in Tailwind?",
      answer:
        "Tailwind spacing steps are 0.25rem, so at a 16px root you divide pixels by 4: 24px is p-6, 16px is p-4. Tailwind v4 accepts any multiple of 0.25, such as p-3.25 for 13px. Version 3 has a fixed scale, so the tool shows the nearest class as well as an exact arbitrary class like p-[0.8125rem]. Font sizes use named steps such as text-base for 16px.",
    },
    {
      question: "Does the 62.5% root font size trick still make sense?",
      answer:
        "Setting html to 62.5% makes 1rem equal 10px, so 14px is 1.4rem and the math is easy. The catch is that any text without its own size now inherits 10px, so the body needs a size such as 1.6rem. Set it as a percentage, never as 10px, so browser text settings still apply. Many teams skip the trick and keep 16px with a converter instead.",
    },
    {
      question: "Is my CSS uploaded, and what does the bulk converter leave alone?",
      answer:
        "Nothing is uploaded. The conversion runs in your browser, and the CSS box is kept only in this tab's session storage, while your options stay in local storage. Selectors, property names, comments, strings and url() contents are never changed. Values in your ignore list, such as 0 and 1px, and properties you list to skip are also left as written.",
    },
  ],
};
