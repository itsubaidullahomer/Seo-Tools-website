import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "__SLUG__",
  name: "__NAME__",
  // <= 60 chars, primary keyword first. Site name is appended automatically.
  title: "__NAME__ – Free Online Tool",
  // 140-160 chars, includes the primary keyword naturally, ends with a benefit.
  description:
    "Describe what the tool does, who it is for and the main benefit. Mention that it is free, instant and runs in the browser without sign-up.",
  shortDescription: "One sentence that appears under the heading and on cards.",
  category: "__CATEGORY__" as ToolMeta["category"],
  keywords: ["primary keyword", "secondary keyword", "another variation"],
  icon: "wand-2",
  datePublished: "__DATE__",
  dateModified: "__DATE__",
  related: [],
  faq: [
    {
      question: "What does this tool do?",
      answer: "A clear, complete answer of at least two sentences that would satisfy someone who only reads this FAQ.",
    },
    {
      question: "Is it free to use?",
      answer: "Yes. Explain that there are no limits, no sign-up and no watermarks, and that processing happens in the browser.",
    },
    {
      question: "Is my data safe?",
      answer: "Explain exactly what happens to the input: it stays on the device, nothing is uploaded or stored.",
    },
    {
      question: "Does it work on mobile?",
      answer: "Yes. Mention responsive layout and any touch-specific behaviour worth knowing.",
    },
  ],
};
