<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules for AI agents and contributors

This is a free online tools website (Next.js 16 App Router, React 19, Tailwind v4, TypeScript) monetised with Google AdSense. Read `docs/ADDING_A_TOOL.md` before creating or changing a tool.

- **One folder per tool** in `src/tools/<slug>/` (`meta.ts`, `content.md`, `Tool.tsx`). Never register tools by hand – `npm run gen` generates the registry, and `npm run build` runs `scripts/validate-tools.ts` as a quality gate.
- **Everything runs in the browser.** No server code, no external APIs, no uploads. Tools must not touch `window`/`document` during render (pages are server-rendered).
- **Use the shared UI kit** (`@/components/ui`) and semantic tokens (`bg-surface`, `text-muted`, `text-primary`, …). No hard-coded colours; dark mode must work.
- **Content is the product.** Every tool page has an original 1,000+ word article and 6-8 real FAQ answers. No filler, no copied text, no keyword stuffing, no placeholders.
- **URLs are permanent.** Do not rename slugs or categories without a redirect in `next.config.ts`.
- **Do not add dependencies casually.** Prefer browser built-ins; if a small library is unavoidable, import it only inside the tool folder.
- Run `npm run check` (gen + validate + typecheck + lint) before committing.
