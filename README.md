# ToolkitJar – free online tools website

A fast, SEO-first collection of free browser-based tools (text, SEO, developer, image, converters, calculators, social media, design, utilities), built with Next.js 16, React 19 and Tailwind v4 and designed to scale from 50 to 500+ tools without touching shared code.

- Every tool is a self-contained folder: `src/tools/<slug>/{meta.ts,content.md,Tool.tsx}`
- Every page is statically generated with full metadata, Open Graph images, JSON-LD and a sitemap entry
- Every tool page carries a 1,000+ word original article and FAQ (what Google and AdSense reviewers want to see)
- All processing happens in the visitor's browser – no uploads, no database, no API keys

## Quick start

```bash
npm install
cp .env.example .env.local   # edit the site name / domain / email
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Regenerates the tool registry and starts the dev server |
| `npm run build` | Registry → quality validation → production build |
| `npm run new-tool -- --slug my-tool --name "My Tool" --category text` | Scaffold a new tool folder |
| `npm run validate` | Check every tool's metadata, FAQ and article length |
| `npm run check` | gen + validate + typecheck + lint |
| `node scripts/seo-audit.mjs <url>` | Crawl every sitemap URL and check titles, descriptions, canonicals, H1s, JSON-LD, FAQ markup, internal links, robots.txt, 404 handling |
| `node scripts/tool-check.mjs <slug>` | Load a tool page in headless Chromium, fail on errors, save screenshots |

## Project layout

```
content/pages/        About, Contact, Privacy Policy, Terms, Disclaimer (markdown, editable)
content/blog/         Blog posts (markdown with frontmatter)
docs/                 ADDING_A_TOOL.md, LAUNCH_CHECKLIST.md, research/
scripts/              registry codegen, validator, scaffolder, browser smoke test
src/app/              routes: /, /tools, /tools/[slug], /category/[category], /blog, legal pages,
                      sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx
src/components/       layout, ui kit, tool page building blocks, ads, SEO helpers
src/config/site.ts    brand name, domain, contact email, analytics + AdSense IDs (env-driven)
src/lib/              tool registry, categories, icons, SEO metadata + JSON-LD builders
src/tools/<slug>/     one folder per tool
```

## Adding a tool

See [docs/ADDING_A_TOOL.md](docs/ADDING_A_TOOL.md). In short: scaffold the folder, write `meta.ts`, `content.md` and `Tool.tsx`, run `npm run check`, commit. The page, sitemap entry, category listing, related-tools links and search index are all generated.

## Deploying

The site deploys on Vercel with zero configuration. Set the environment variables from `.env.example` in the Vercel project (at minimum `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SITE_NAME`). Ads only render when `NEXT_PUBLIC_ADSENSE_CLIENT` is set, so the site stays clean during the AdSense review.

See [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) for the domain, Search Console, Analytics and AdSense steps.
