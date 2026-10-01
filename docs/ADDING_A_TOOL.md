# Adding a tool

Every tool is a self-contained folder. Adding one never touches shared files, so
tools can be added weekly (or by many people in parallel) without risk to the
rest of the site.

```
src/tools/<slug>/
├── meta.ts      # SEO metadata, FAQ, category, related tools
├── content.md   # 1,000+ word article rendered under the tool
└── Tool.tsx     # the interactive component ("use client")
```

Run `npm run new-tool -- --slug px-to-rem --name "PX to REM Converter" --category converters`
to scaffold the folder from `src/tools/_template`, then fill in the three files.
`npm run dev` regenerates the registry automatically; `npm run build` refuses to
ship a tool that fails the quality checks in `scripts/validate-tools.ts`.

## 1. `meta.ts`

```ts
import type { ToolMeta } from "@/lib/tools/types";

export const meta: ToolMeta = {
  slug: "px-to-rem",                 // must equal the folder name
  name: "PX to REM Converter",       // H1 and card title
  title: "PX to REM Converter – Instant CSS Unit Conversion", // <= 60 chars, keyword first
  description: "…140-160 characters, primary keyword early, ends with a benefit…",
  shortDescription: "One sentence under the H1 and on cards (<= 140 chars).",
  category: "converters",            // see src/lib/tools/categories.ts
  keywords: ["px to rem", "px to rem converter", "convert pixels to rem", …], // primary first, 5-10 total
  aliases: ["pixel to rem"],         // optional, for on-site search only
  icon: "ruler",                     // key from src/lib/icons.ts
  featured: false,                   // true = shown in "Popular tools"
  datePublished: "2026-10-01",
  dateModified: "2026-10-01",        // bump when the tool or article changes meaningfully
  related: ["rem-to-px", "px-to-em"],// existing slugs only
  processesFiles: false,             // true for image/file tools (shows the files-stay-local badge)
  highInteraction: false,            // true for rapid click/type tools (keyboard test, click speed): hides ads near the tool
  faq: [ /* 5-8 items, each answer 40-90 words, genuinely useful */ ],
};
```

Rules the validator enforces: slug = folder, category exists, icon exists,
related slugs exist, 3+ keywords, 4-10 FAQ items with real answers, dates are
`YYYY-MM-DD`. It warns when the title is over 60 characters or the description is
outside 120-165 characters.

## 2. `content.md`

The article turns a bare widget into a page that answers the searcher's question.
It must be **original**, **specific to this tool**, **accurate** and **genuinely
useful**. The build requires at least 800 words, but Google has no preferred word
count – a correct worked example beats another paragraph. Every number in a worked
example must come from the tool itself: put the calculation in a pure module
(`logic.ts`) and assert the article's examples in `tests/<slug>.test.ts`
(`npm test` runs as part of `npm run check`).

Structure (use `##` for sections – the page already renders the H1):

1. **What this tool does** – 2-3 paragraphs. Use the primary keyword naturally in the first 100 words. No "In today's digital world" filler.
2. **How to use it** – numbered steps that match the actual UI, plus edge cases.
3. **How it works / the formula** – explain the logic in plain English with a worked example (real numbers, code block if there is a formula).
4. **Practical examples / use cases** – 3-5 concrete scenarios for specific roles.
5. **A reference table** where relevant (limits, conversion values, standards).
6. **Tips and common mistakes** – expert advice, platform limits, how to verify.
7. **Privacy and limitations** – everything runs in the browser; state known limits.

Write for a smart reader who wants the answer fast. Short paragraphs, specific
numbers, no marketing fluff, no keyword stuffing, no claims we cannot back up.
Link to related tools with relative links (`/tools/rem-to-px`) where natural.
Do not paste text from other websites. Do not leave TODOs or placeholders.

## 3. `Tool.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button, Textarea, CopyButton, ResultBox, ToolPanel, ToolActions } from "@/components/ui";

export default function PxToRem() {
  …
}
```

Requirements:

- Starts with `"use client"` and has a **default export**.
- Never touches `window`, `document`, `navigator` or `localStorage` **during render** – only inside event handlers or `useEffect`. The component is server-rendered for SEO, so a render-time `window` access will crash the build. Use `usePersistentState` from `@/hooks/usePersistentState` if you want to remember input or settings.
- 100% client-side. No `fetch` to third-party APIs, no uploads. Files are handled with `File`/`Blob`/Canvas in the browser.
- Uses the shared UI kit (`@/components/ui`) and semantic Tailwind tokens (`bg-surface`, `text-muted`, `border-border`, `text-primary` …). No hard-coded colours; dark mode must work automatically.
- Results update live (no "Submit" button) unless the operation is heavy.
- Copy buttons for every output; download buttons for files (`downloadBlob`/`downloadText` in `@/lib/utils`).
- Handles empty, invalid and huge input gracefully with a clear message (`<Alert>`), never a crash.
- Accessible: every input has a label, buttons have text or `aria-label`, keyboard works.
- Mobile-first: controls stack on small screens (`ToolGrid` does this for you).
- Extra dependencies: only add a package when the browser has no built-in API for the job, and prefer small, well-maintained, tree-shakeable libraries. Import them inside the tool folder only.

Icon names available: see `iconNames` in `src/lib/icons.ts`. Add new lucide icons there if needed.

## 4. Check before committing

```bash
npm run gen        # regenerate the registry
npm run validate   # content/metadata quality gate
npm run typecheck
npm run lint
npm run dev        # open http://localhost:3000/tools/<slug> and test on a phone-sized viewport
```

Then run `npm run check` and commit. Cloudflare Pages builds and deploys `main` automatically; the new page is added to
`/sitemap.xml`, the category hub, related-tools lists and site search with no
further configuration.

## Renaming or removing a tool

URLs are permanent once indexed. If you must rename a slug, add a redirect in
`next.config.ts` (`redirects()`) from the old path to the new one with
`permanent: true`. Never delete a ranking page without a redirect.
