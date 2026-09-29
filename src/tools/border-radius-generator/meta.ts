import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "border-radius-generator",
  name: "CSS Border Radius Generator",
  title: "Border Radius Generator – CSS, Tailwind & Blob Shapes",
  description:
    "Free border radius generator with draggable handles, 8-value elliptical corners, px or % units and pill, circle and blob presets. Copy CSS or Tailwind classes.",
  shortDescription: "Drag corner handles or use sliders to build CSS border-radius shapes, elliptical corners and blobs, then copy CSS or Tailwind.",
  category: "design",
  keywords: [
    "border radius generator",
    "css border radius generator",
    "border radius css",
    "blob shape css",
    "tailwind rounded generator",
    "elliptical border radius",
    "pill shape css",
    "css rounded corners generator",
  ],
  aliases: ["fancy border radius generator", "organic shape css", "rounded corners generator", "border-radius maker", "squircle css", "css blob generator"],
  icon: "square",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["box-shadow-generator", "percentage-calculator", "webp-to-png", "json-formatter"],
  faq: [
    {
      question: "What do the eight values in border-radius mean?",
      answer:
        "Eight values are written as two groups of up to four separated by a slash, such as 30% 70% 70% 30% / 30% 30% 70% 70%. The first group sets the horizontal radius of the top-left, top-right, bottom-right and bottom-left corners, in that clockwise order. The second group sets the vertical radius of the same corners. When a corner's two radii differ, its curve is a quarter of an ellipse instead of a quarter of a circle. Without a slash, each value sets both radii.",
    },
    {
      question: "How do I make a circle with border-radius?",
      answer:
        "Give a square element border-radius: 50%. Each corner then has a horizontal radius of half the width and a vertical radius of half the height, and the four quarter curves join into a circle. If the element is not square, the same 50% draws an ellipse, because the two radii are measured against different sides. To keep a circle, make the width equal to the height, or load the Circle preset, which also sets a square box.",
    },
    {
      question: "How do I make a pill-shaped button in CSS?",
      answer:
        "Use a very large pixel radius such as border-radius: 9999px. Browsers cannot draw radii larger than the box allows, so they scale all of them down until neighboring corners just touch, which leaves perfect semicircular ends at any width and height. Do not use 50% for a pill, because on a wide button it gives an ellipse instead. In Tailwind, rounded-full does the same job.",
    },
    {
      question: "Should I use px or % for border-radius?",
      answer:
        "Use px when the corner size should stay the same whatever the element size, which suits buttons, cards and inputs. Use % when the corner should scale with the element, which suits circles, blobs and images that change size. Percentages are relative to each side, so 20% on a 320 by 220 box is 64px wide and 44px tall, an elliptical corner. The generator converts between the two while keeping the shape, so you can compare them.",
    },
    {
      question: "How do I make a blob shape with CSS?",
      answer:
        "Use eight percentage values so every corner is an ellipse, and keep each pair of neighboring radii on a side adding up to 100%, for example top-left and top-right horizontal radii of 30% and 70%. That keeps the outline smooth with no flat edges. Start from a Blob preset, press Random blob for new variations, or drag the handles. The same rule is why 30% 70% 70% 30% / 30% 30% 70% 70% looks like a pebble.",
    },
    {
      question: "How do I use border radius in Tailwind CSS?",
      answer:
        "Copy the class from the Tailwind tab. Uniform radii map to the theme scale (rounded-lg is 8px, rounded-xl is 12px and rounded-full is a pill), and the tool shows the nearest step with the pixel difference. Anything else uses an arbitrary value such as rounded-[30%_70%_70%_30%/30%_30%_70%_70%], where underscores stand for spaces. Per-corner classes like rounded-tl-xl are listed too. Names follow Tailwind CSS v4, which renamed the small steps compared with v3.",
    },
    {
      question: "Can border-radius make a squircle?",
      answer:
        "Not a true one. border-radius always draws circular or elliptical arcs, while a squircle uses a superellipse whose curve eases in gradually, so a large radius like 30% on a square is only an approximation. The newer corner-shape: squircle property draws the real shape. When last checked in June 2026 it worked in Chrome and Edge 139 and later but not in Firefox or Safari, where it is ignored and the normal rounded corner shows.",
    },
    {
      question: "Why is my border-radius not working or smaller than I set?",
      answer:
        "The most common cause is overlap: if two radii along one side add up to more than that side, CSS scales every radius down by the same factor, and the tool tells you the factor. Other causes are a table with border-collapse: collapse, which ignores radius, and child content that pokes out of the corners because the parent lacks overflow: hidden. Negative values are invalid and make the browser drop the whole declaration.",
    },
  ],
};
