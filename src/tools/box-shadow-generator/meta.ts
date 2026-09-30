import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "box-shadow-generator",
  name: "CSS Box Shadow Generator",
  title: "Box Shadow Generator – CSS, Tailwind & Layered Shadows",
  description:
    "Free box shadow generator with multiple layers, smooth elevation presets, inset shadows and OKLCH colors. Preview on light and dark, then copy CSS or Tailwind.",
  shortDescription: "Build layered CSS box shadows visually, preview them on light and dark, and copy the CSS, Tailwind class or custom property.",
  category: "design",
  keywords: [
    "box shadow generator",
    "css box shadow generator",
    "box shadow css",
    "tailwind shadow generator",
    "layered box shadow",
    "smooth shadow generator",
    "inset box shadow",
    "css shadow generator",
    "soft shadow css",
  ],
  aliases: ["box-shadow generator", "drop shadow generator", "inner shadow css", "css shadow maker", "material elevation shadow", "shadow palette generator"],
  icon: "layers",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["border-radius-generator", "json-formatter", "webp-to-png", "webp-to-jpg"],
  faq: [
    {
      question: "What is the CSS box-shadow syntax?",
      answer:
        "The property takes up to six values: an optional inset keyword, a horizontal offset, a vertical offset, a blur radius, a spread radius and a color. Only the two offsets are required, and the four lengths must stay in that order. For example, box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.2) moves the shadow 4px down, blurs it by 12px and shrinks it by 2px. Separate several shadows with commas, and the first one is painted on top.",
    },
    {
      question: "What is the difference between blur and spread?",
      answer:
        "Blur softens the edge of the shadow: 0 gives a hard edge and larger values fade it out over a wider area. Spread changes the size of the shadow shape before it is blurred: positive values grow it on every side and negative values shrink it. A negative spread combined with a vertical offset keeps a large soft shadow tucked under a card instead of glowing around all four sides.",
    },
    {
      question: "How do I make a smooth, realistic box shadow?",
      answer:
        "Stack several shadows instead of using one. Real shadows are tight and dark next to the object and soft and faint further away, so give each layer a larger offset and blur than the one before it and a low opacity of its own. The Smooth generator tab builds this from a single elevation value between 1 and 24. Tinting the shadow toward your background hue instead of pure black also looks more natural.",
    },
    {
      question: "How do I add a shadow to only one side of an element?",
      answer:
        "Use a negative spread equal to the blur, then push the shadow toward the side you want with the offset. For a bottom-only shadow try box-shadow: 0 10px 8px -8px rgba(0, 0, 0, 0.45). The negative spread shrinks the shadow so it hides behind the box on the other three sides, and the 10px offset lets it peek out below. Change the sign or the axis of the offset for top, left or right.",
    },
    {
      question: "What is the difference between box-shadow and filter: drop-shadow()?",
      answer:
        "box-shadow draws a shadow around the element's rectangular box, follows its border-radius and supports spread and inset. filter: drop-shadow() traces the pixels that are actually painted, so it follows the outline of a transparent PNG, an SVG icon or a speech bubble with a tail. drop-shadow has no spread or inset. Use box-shadow for cards and buttons and drop-shadow for irregular shapes.",
    },
    {
      question: "How do I use the generated shadow in Tailwind CSS?",
      answer:
        "Switch to the Tailwind class output and paste the result into a class attribute, for example shadow-[0_4px_12px_rgba(0,0,0,0.2)]. Underscores replace spaces and commas separate layers. For a reusable utility, choose the Tailwind theme output, which gives an @theme block for Tailwind v4 that creates a class such as shadow-card. In older versions, add the same value under theme.extend.boxShadow in the config file.",
    },
    {
      question: "Does box-shadow hurt performance?",
      answer:
        "A static shadow is cheap. The cost comes from painting very large blur radii and from animating the property, because the browser repaints the shadow on every frame. As a rule of thumb keep blur under about 50px, use few layers on long lists, and for hover effects put the larger shadow on a pseudo-element and transition its opacity instead. The tool warns when a layer's blur is above 100px.",
    },
    {
      question: "Why is my box shadow cut off or not showing?",
      answer:
        "Shadows are painted outside the element, so an ancestor with overflow hidden, overflow auto or a clip-path will clip them. Add padding to that ancestor or move the overflow rule inward. A shadow can also vanish because its opacity is too low against the background, especially on dark surfaces. In forced-colors mode, such as Windows High Contrast, box-shadow is removed entirely.",
    },
  ],
};
