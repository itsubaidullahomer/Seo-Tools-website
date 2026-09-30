import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "svg-to-png",
  name: "SVG to PNG Converter",
  title: "SVG to PNG Converter – Transparent, Any Size, Free",
  description:
    "Convert SVG to PNG online for free. Upload files or paste SVG code, keep transparency, pick 512x512 or a 1x-8x scale for high resolution. Runs in your browser.",
  shortDescription: "Turn SVG files or pasted SVG code into PNG or JPG at any size, with transparency, presets, batch ZIP and print DPI.",
  category: "image",
  keywords: [
    "svg to png",
    "svg to png converter",
    "convert svg to png",
    "svg to png transparent",
    "svg to png 512x512",
    "svg code to png",
    "convert svg to png high resolution",
    "svg to jpg",
    "svg to png online",
  ],
  aliases: ["svg2png", "svg to image", "svg to png free", "export svg as png", "vector to png", "svg to png batch"],
  icon: "file-code",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["webp-to-png", "webp-to-jpg", "px-to-rem", "color-contrast-checker", "border-radius-generator"],
  processesFiles: true,
  faq: [
    {
      question: "How do I convert an SVG to a PNG?",
      answer:
        "Drop one or more .svg files on the box above, or switch to Paste SVG code and paste the markup. Choose a scale from 1× to 8×, or open Exact size and type a width and height. The PNG appears at once with a preview, and Download PNG saves it. With several files, one button downloads everything as a ZIP.",
    },
    {
      question: "Does the PNG keep a transparent background?",
      answer:
        "Yes. By default, any area the SVG leaves empty stays transparent in the PNG, and the previews sit on a checkerboard so you can see it. If you want a solid background, switch on Fill the background with a color and pick one. JPG cannot store transparency, so JPG output is always filled, with white unless you choose otherwise.",
    },
    {
      question: "What size should I export an SVG at, for example 512x512?",
      answer:
        "Match the size to where the PNG will be shown. Open Exact size and press 512 for a 512 × 512 image, or 16, 32, 48, 180 or 192 for favicons and app icons. For screens, use at least 2× the display size so it stays sharp on high-density displays. For print, work out pixels as inches times DPI: a 4-inch width at 300 DPI needs 1,200 pixels.",
    },
    {
      question: "Will the PNG look blurry or lose quality?",
      answer:
        "The SVG itself is redrawn from its shapes at the size you choose, so a larger output is sharp rather than stretched. What stays fixed is the PNG: once saved it has a set number of pixels, and enlarging that file later will blur it. Choose the largest size you will need now, or keep the SVG as your master and convert again when a bigger size is required.",
    },
    {
      question: "Why are fonts or images missing from my PNG?",
      answer:
        "The converter draws your SVG the way a browser draws an image, and an image cannot load outside files. Web fonts, linked pictures and stylesheets referenced by address are ignored, and text falls back to fonts installed on your device. Convert text to paths in your design tool, or embed fonts and pictures inside the SVG as base64 data. The tool warns you when it spots these references.",
    },
    {
      question: "Can I convert SVG to JPG instead of PNG?",
      answer:
        "Yes. Choose JPG in the Format and background panel. JPG is smaller for photographic artwork, but it is lossy and has no transparency, so the tool paints a background first, white by default. A quality slider from 50 to 100 percent controls the size. For logos, icons and anything with sharp edges or transparency, PNG is usually the better choice.",
    },
    {
      question: "Is my SVG uploaded to a server?",
      answer:
        "No. Your browser reads the file, draws it on a canvas and encodes the PNG on your own device, so the SVG and the result are not sent to us. The page itself and its ads load over the network like any website. Your size settings are remembered in your browser's local storage, and pasted code is kept only for the current browser tab.",
    },
    {
      question: "Why was my PNG made smaller than the size I asked for?",
      answer:
        "Browsers limit how large a canvas can be, and phones limit it most. To avoid blank or failed downloads, the tool caps output at about 16.8 million pixels (4,096 × 4,096) and 16,384 pixels on one side. When a request goes over, the image keeps its proportions, shrinks to fit, and a note on the file shows the requested and actual size.",
    },
  ],
};
