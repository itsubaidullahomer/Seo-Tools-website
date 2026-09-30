import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "webp-to-png",
  name: "WebP to PNG Converter",
  title: "WebP to PNG Converter – Batch, Keeps Transparency",
  description:
    "Convert WebP to PNG online for free. Drop, paste or pick many WebP files, keep transparency and download PNGs or a ZIP. Processed in your browser, no sign-up.",
  shortDescription: "Convert WebP images to PNG in your browser: drop or paste files, keep transparency, batch up to 50 files and download a ZIP.",
  category: "image",
  keywords: [
    "webp to png",
    "webp to png converter",
    "convert webp to png",
    "webp to png transparent",
    "batch webp to png",
    "save webp as png",
    "open webp file",
    "convert webp to png without losing quality",
    "webp to png online",
  ],
  aliases: ["webp2png", ".webp to png", "webp image converter", "change webp to png", "webp to png free"],
  icon: "file-image",
  featured: false,
  datePublished: "2026-09-29",
  dateModified: "2026-09-29",
  related: ["webp-to-jpg", "slug-generator", "border-radius-generator", "box-shadow-generator"],
  processesFiles: true,
  faq: [
    {
      question: "How do I convert a WebP file to PNG?",
      answer:
        "Drop one or more .webp files onto the box above, click it to pick them from your device, or press Ctrl+V (⌘V on a Mac) to paste an image from your clipboard. Each file converts as soon as it is added. Download a single PNG with its own button, or download several at once as a ZIP. Original file names are kept, with .png in place of .webp.",
    },
    {
      question: "Does WebP to PNG keep transparency?",
      answer:
        "Yes. A WebP with an alpha channel becomes a PNG with an alpha channel, and transparent areas stay transparent. The previews sit on a checkerboard so you can see them. If you would rather have a solid background, switch on the fill option and pick a color: the transparent areas are then painted with it before the PNG is saved.",
    },
    {
      question: "Will I lose quality when I convert WebP to PNG?",
      answer:
        "The conversion step adds no loss: the browser decodes the WebP, and PNG keeps every pixel of the decoded image. What PNG cannot do is bring back detail that a lossy WebP already discarded, so the result looks the same as the WebP did, not better. A lossless WebP and its PNG hold the same pixels.",
    },
    {
      question: "Why is my PNG bigger than the original WebP?",
      answer:
        "PNG compresses without discarding anything, while a lossy WebP is designed to be small by dropping detail the eye rarely notices. Photos in particular can grow noticeably when saved as PNG, because fine texture and noise compress poorly without loss. Flat graphics, logos and screenshots usually stay closer to their original size. The size change is shown next to every file.",
    },
    {
      question: "Can I convert many WebP files at once?",
      answer:
        "Yes. Add up to 50 files or 300 MB per batch. The tool converts two at a time and shows progress for each file. Once two or more are finished, one button downloads them all as a ZIP that keeps the original names. Files over the limit are skipped with a message: download the batch, click Clear all, then add the rest.",
    },
    {
      question: "What happens to an animated WebP?",
      answer:
        "PNG cannot store an animation, so only the first frame is saved, as a still image. The tool detects animated files by reading the WebP header and marks them with a “first frame only” badge and a notice, so it never happens silently. To keep the motion, use a tool that outputs GIF, APNG or video instead.",
    },
    {
      question: "Are my WebP files uploaded to a server?",
      answer:
        "No. Files are processed in your browser and we do not upload or store them: your browser decodes each WebP and writes the PNG on your own device. The page and its ads load over the network like any website, but the images you add are handled locally and never sent to us.",
    },
    {
      question: "How do I open a WebP file without converting it?",
      answer:
        "Current versions of Chrome, Edge, Firefox and Safari open WebP files directly: drag the file into a browser window. On a Mac, Preview opens WebP on recent versions of macOS (Big Sur and later). On Windows 11, Paint opens WebP, and the Photos app needs the free WebP Image Extensions from the Microsoft Store. If a program still refuses the file, convert it to PNG here.",
    },
  ],
};
