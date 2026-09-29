# Technical SEO Architecture: Next.js 16 Tools Site (40 → 500+ tools)

- Date: 2026-09-29.
- Prepared by: Claude Opus 5.5 (`claude-opus-5-5`).
- Scope: URL architecture, structured data, internal linking, metadata, performance with AdSense, indexing at scale, analytics and Search Console, repo architecture, launch checklist.
- Stack: Next.js 16.3.7 (App Router, Turbopack), React 19.2.8, Tailwind v4, static output on Vercel.

---

## 0. Sources and how they were verified

This run could not reach the live web.

- **WebSearch:** the session-wide budget (200/200) was already spent by earlier research agents.
- **WebFetch and curl:** the egress proxy blocks `developers.google.com`, `nextjs.org`, `web.dev`, `seroundtable.com` and `searchengineland.com`.

The report therefore rests on these sources, in order of authority:

| Label | Source | What it covers |
|---|---|---|
| [ND] | **The Next.js 16.3.7 docs shipped with the installed package** at `node_modules/next/dist/docs/` (repo rule in `AGENTS.md`). These match the installed version exactly, so they are more reliable than memory or older web pages. | Every Next.js claim in this report. Files: upgrading/version-16, json-ld, generate-metadata (streaming metadata), generate-static-params, sitemap, opengraph-image, image-response, script, third-party-libraries, lazy-loading, mdx, cacheComponents, cli `experimental-analyze`. |
| [VD] | Vercel docs, via the Vercel MCP documentation search | `VERCEL_PROJECT_PRODUCTION_URL`, domain redirects, PPR/`use cache` on Vercel. |
| [PR] | Google Search and AdSense facts collected with live web access earlier in this project: `docs/research/raw/seo.md` §4 and `competitors.md` §2.2, §4, §5 | FAQ rich results removed for all sites on 7 May 2026; HowTo gone since 2023; June 2025 and January 2026 feature retirements; March 2026 spam and core updates hitting templated and programmatic sites; the AdSense "low value content" pattern. |
| [GK] | Long-standing, stable Google Search Central guidance | Details below. Marked so it can be re-checked when web access is back. |
| [REPO] | Direct inspection of this repo and its `.next` build output | The current implementation, audited in §10. |

The [GK] items:
- Core Web Vitals thresholds, with INP replacing FID on 12 March 2024.
- Sitemap limits: 50k URLs or 50 MB.
- Google ignores `changefreq` and `priority`.
- Sitemap ping endpoint deprecated in 2023.
- `rel=prev/next` no longer used.
- Sitelinks search box removed in November 2024.
- SoftwareApplication rich results require rating or review data.
- Do not block CSS and JS in robots.txt.
- The certified-CMP requirement for EEA/UK/CH ads, in force since January 2024.

> **Re-verify before launch** (5 minutes, once web access is available):
> 1. Search Gallery page (developers.google.com/search/docs/appearance/structured-data/search-gallery): confirm that FAQ is no longer listed.
> 2. SoftwareApplication page: confirm the required properties.
> 3. AdSense "Privacy & messaging" CMP requirements for the UK.

---

## 1. URL architecture

### 1.1 Recommendation (already scaffolded, keep it)

```
/                                   home (hub of hubs)
/tools                              A–Z index of every tool (HTML sitemap, depth-1 from everywhere)
/tools/<primary-keyword-slug>       every tool, flat, permanent
/category/<category-slug>           ~9-14 category hubs
/blog/<slug>                        guides / how-tos that feed tools
/about /contact /privacy-policy /terms /disclaimer
```

**Why use a flat `/tools/<slug>` rather than `/<category>/<slug>` or `/<slug>`:**

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| `/<slug>` at root (smallseotools, convertcase, wordcounter) | Shortest URL; category changes never break URLs | Tools, blog and legal pages share one namespace, so slug collisions are likely at 500+ tools. Harder to segment in GSC and GA. | OK, but no measurable ranking gain [PR competitors.md §5] |
| `/<category>/<slug>` (omnicalculator, rapidtables) | Topical folder signal. Easy GSC segmentation. | **Locks each tool into one category.** Every re-categorisation needs a 301 and loses some signals for weeks. Tools that belong in 2 categories (e.g. "image to base64" = image + developer) force a choice. | Avoid for a site that will reorganise as it grows |
| **`/tools/<slug>`** (10015.io, many 2025-26 indie sites) | One permanent URL per tool, whatever its category. Clean GSC segmentation (`/tools/` URL-prefix filter). No collisions with blog or legal pages. The category is expressed through breadcrumbs, hubs and internal links, not the path. | 6 extra characters | **Use this** |

Moving a tool between categories is then a one-line change to `meta.category`:
- The URL, backlinks and ranking history are untouched.
- Only the breadcrumb and hub membership change.

A secondary optional field, `alsoIn: CategorySlug[]`, lists the tool on other hubs without creating any new URL.

### 1.2 Slug rules (enforce in `scripts/validate-tools.ts`)

- Lowercase ASCII with hyphens only. Must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- The slug is the exact primary keyword:
  - Good: `px-to-rem`, `meta-description-length-checker`, `heic-to-jpg`.
  - No stop-word padding, no `free-`/`online-` prefix, no year, no `.html`.
  - Do not use a brand-new word when searchers use another one.
- Max ~5 words / 50 chars.
- **Never rename.**
  - If a rename is unavoidable, add a permanent redirect in `next.config.ts`:
    ```ts
    { source: '/tools/old', destination: '/tools/new', permanent: true }
    ```
    Next emits a 308, which Google treats like a 301.
  - Keep redirects forever.
  - Add an `aliases`/`redirectFrom` array to `meta.ts` and have `generate-registry.ts` emit the redirects, so a rename is still a one-folder change.

### 1.3 Trailing slashes, case and hosts

- **Trailing slash:** keep the Next default `trailingSlash: false`.
  - Next automatically 308-redirects `/tools/x/` to `/tools/x`.
  - Canonicals, sitemap, internal links and OG URLs must all use the no-slash form. The `absoluteUrl()` helper already strips it.
- **Case:** App Router routes are case-sensitive, so `/tools/Word-Counter` returns 404. Leave it that way.
  - Do **not** add a lowercase-redirect `proxy.ts` (Next 16 renamed `middleware` to `proxy` [ND]).
  - A proxy runs on every matched request, before the CDN cache. That turns a free static site into function invocations.
  - Enforce lowercase at the source instead (validator + all links come from the registry). A 404 on a URL nobody links to is harmless.
- **Host:**
  - Pick apex (`toolkitjar.com`) or `www` and 308-redirect the other in Vercel → Project → Domains.
  - Also redirect the production `*.vercel.app` alias to the custom domain, or at least make sure canonicals point to the custom domain. `siteConfig.url` comes from `NEXT_PUBLIC_SITE_URL`, which does this.
  - HTTPS is automatic.
- **Preview deployments:** make `robots.ts` return `Disallow: /` unless `process.env.VERCEL_ENV === 'production'`. Vercel also sends `X-Robots-Tag: noindex` on preview URLs; confirm with `curl -I` after first deploy. This double safety net stops a preview from being indexed as a duplicate.

### 1.4 Canonicals

- Every indexable page gets `alternates.canonical` with an absolute, self-referencing URL. `metadataBase` is set in the root layout [ND: relative canonicals without `metadataBase` are a build error].
- Query-string variants (`/tools?q=json`, `/tools/x?input=...`, UTM links) are served the same static HTML. The self-canonical consolidates them, so no `noindex` is needed on static pages.
- Never canonicalise one tool to a different tool (e.g. `rem-to-px` → `px-to-rem`).
  - A canonical is for duplicates. Google ignores cross-canonicals on pages with distinct content.
  - If two pages really are duplicates, merge them and 301.
- **Pagination:** avoid it. 500 tools across ~10 hubs is ~50 per hub, which fits on one page.
  - If a hub ever exceeds ~150 tools, split it into sub-hubs (§3.4) rather than `?page=2`.
  - If pagination is ever used, each page self-canonicalises. Google stopped using `rel=prev/next` in 2019 [GK].

---

## 2. Structured data (JSON-LD) per page type

### 2.1 What still produces rich results in 2026 (relevant to us)

| Type | Rich result in Google (Sept 2026) | Use it? |
|---|---|---|
| `BreadcrumbList` | **Yes.** The breadcrumb path is shown in place of the URL (desktop). | Every inner page |
| `Organization` (home) | Knowledge panel / logo signals. No SERP feature on its own. | Home page (layout is fine) |
| `WebSite` (home) | **Site name** in results (name, alternateName, url) | Home page |
| `WebSite` + `SearchAction` | **No.** The sitelinks search box was removed in November 2024 [GK]. | Optional, harmless; drop or keep |
| `SoftwareApplication` / `WebApplication` | Only with **genuine** `aggregateRating` or `review`, plus `offers.price` [GK] | Yes, for entity understanding. **No fake ratings** (spam manual-action risk). |
| `FAQPage` | **No.** Restricted to gov/health since August 2023, then removed for all sites on 7 May 2026 [PR]. | Optional, see §2.4 |
| `HowTo` | **No.** Gone since 2023 [PR]. | Do not add |
| `Article` / `BlogPosting` | Article enhancements (headline, image, dates, author) | Blog posts |
| `ItemList` / `CollectionPage` | Carousels only for Recipe/Course/Movie/Restaurant, so none for tools | Category hubs (understanding only) |
| `VideoObject` | Yes (video thumbnails / key moments) | Only if a real how-to video is embedded |
| `Dataset`, `Product`, `Event`… | n/a | No |

Removed features [PR]:
- June 2025: Course info, Claim Review, Estimated salary, Learning video, Special announcement, Vehicle listing.
- January 2026: Practice Problem.

None of these affect us.

### 2.2 Per page type

| Page | JSON-LD nodes (one `@graph`) | Key fields |
|---|---|---|
| **Home** `/` | `WebSite`, `Organization`, `BreadcrumbList` (optional, single item), `ItemList` of featured tools (optional) | **WebSite:** `@id` `https://site/#website`, `name`, `alternateName`, `url`, `inLanguage`, `publisher → #organization`. **Organization:** `@id` `#organization`, `name`, `url`, `logo` (≥112×112 **PNG**, crawlable; prefer a 512×512 PNG over SVG), `sameAs` (real profiles only), `contactPoint`/`email`. |
| **Category hub** `/category/x` | `CollectionPage` (+ `mainEntity: ItemList` of tools), `BreadcrumbList` | `name`, `description`, `url`, `isPartOf → #website`, `ItemList.itemListElement[{position,name,url}]` |
| **All tools** `/tools` | `CollectionPage` + `ItemList`, `BreadcrumbList` | Same as the category hub |
| **Tool** `/tools/x` | `WebApplication`, `BreadcrumbList`, optional `FAQPage` | See §2.3 |
| **Blog post** `/blog/x` | `BlogPosting` (or `Article`), `BreadcrumbList` | `headline` (≤110 chars), `description`, `image` (1200 px wide, 16:9 / 4:3 / 1:1 variants ideal), `datePublished`, `dateModified`, `author` (**Person** with `url` to an author page is best for E-E-A-T; Organization is acceptable), `publisher → #organization`, `mainEntityOfPage` |
| **Blog index** | `CollectionPage` / `Blog`, `BreadcrumbList` | |
| **Legal/about/contact** | `WebPage` (or `AboutPage` / `ContactPage`), `BreadcrumbList` | `name`, `url`, `isPartOf`, `dateModified` |

Rules:
- One `<script type="application/ld+json">` per logical graph, rendered by a Server Component as a native `<script>`, not `next/script` [ND json-ld guide].
- Escape `<` as `<` [ND]. The repo's `JsonLd` component already does this.
- Markup must match visible content. The FAQ JSON-LD must mirror the visible FAQ; dates must match the visible "Updated" date.
- Only the home page needs `WebSite`/`Organization`. Emitting them site-wide from the layout (current repo) is harmless. Keeping stable `@id`s lets the other nodes reference them.

### 2.3 Tool page JSON-LD example

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://toolkitjar.com/tools/px-to-rem#app",
      "name": "PX to REM Converter",
      "url": "https://toolkitjar.com/tools/px-to-rem",
      "description": "Convert pixels to rem (and back) using any root font size. Instant, free, runs in your browser.",
      "applicationCategory": "DeveloperApplication",
      "applicationSubCategory": "CSS unit converter",
      "operatingSystem": "Any",
      "browserRequirements": "Requires JavaScript. Works in all modern browsers.",
      "isAccessibleForFree": true,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "inLanguage": "en",
      "datePublished": "2026-10-01",
      "dateModified": "2026-10-14",
      "image": "https://toolkitjar.com/tools/px-to-rem/opengraph-image",
      "publisher": { "@id": "https://toolkitjar.com/#organization" },
      "isPartOf": { "@id": "https://toolkitjar.com/#website" },
      "mainEntityOfPage": "https://toolkitjar.com/tools/px-to-rem"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://toolkitjar.com" },
        { "@type": "ListItem", "position": 2, "name": "Converters", "item": "https://toolkitjar.com/category/converters" },
        { "@type": "ListItem", "position": 3, "name": "PX to REM Converter" }
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How many pixels is 1rem?",
          "acceptedAnswer": { "@type": "Answer", "text": "1rem equals the root element's font size, which is 16px in every major browser unless the user or your CSS changes it…" }
        }
      ]
    }
  ]
}
```

Notes:
- **No `aggregateRating`** until a real on-page rating system exists with visible ratings. Even then it is risky; not recommended.
- `applicationCategory`: use Google-listed values, such as `DeveloperApplication`, `DesignApplication`, `BusinessApplication`, `UtilitiesApplication`, `MultimediaApplication` and `EducationalApplication`.
- The last breadcrumb item may omit `item` (Google uses the page URL).

### 2.4 Does FAQPage still help?

- **No SERP feature.** It cannot produce a rich result for our site in 2026 [PR].
- It is still valid schema.org. It costs nothing, may help non-Google consumers (Bing, AI answer engines parse Q&A pairs), and is not a spam risk *if it mirrors a visible FAQ*.
- **What matters is the visible FAQ section.** H2/H3 questions phrased like People-Also-Ask answer long-tail queries and give AI Overviews / passage ranking clean extractable answers.
- **Decision:** keep the visible FAQ (4-8 real questions per tool). Keeping the `FAQPage` JSON-LD is optional; the current repo keeps it and that is fine.
- Never add `HowTo`.

---

## 3. Internal linking plan (500 pages, depth ≤ 3 clicks, in practice ≤ 2)

### 3.1 Link graph

```
Home (0)
 ├─ Header mega-menu: 9-14 category hubs + "All tools"          → hubs at depth 1
 ├─ "Popular tools" (12-24, curated from GSC clicks monthly)     → tools at depth 1
 ├─ "New this week" (last 6-8 tools added)                       → new tools at depth 1 (fast discovery)
 └─ Category cards → /category/*                                  (depth 1)

/tools  (A–Z of every tool, linked from header + footer on every page)
 └─ every tool                                                   → every tool at depth 2 from ANY page

/category/<c> (depth 1)
 ├─ 300-600 word intro + grouped tool grid (sub-groups as H2 sections)
 ├─ links to every tool in the category (+ tools with alsoIn: c)
 └─ 2-4 "guides" (blog posts) for the category

/tools/<slug> (depth ≤ 2)
 ├─ Breadcrumb: Home › Category › Tool
 ├─ Category badge → hub
 ├─ Sidebar "More <category> tools" (6)
 ├─ Related tools block (6-8): curated `related[]` first, auto-filled by same category + shared keywords
 ├─ 3-6 contextual in-article links (to sibling/inverse tools and the hub)
 └─ 1-2 links to relevant blog guides

/blog/<slug>
 └─ 3-10 contextual links to tools (blogs are link-equity feeders to money pages)

Footer (every page): category hubs, All tools, Blog, About/Contact/Privacy/Terms (≈20 links, NOT 500)
```

### 3.2 Rules

1. **Every tool gets at least 3 inbound internal links** from: its category hub, the `/tools` A–Z page, and at least one related-tools block on a sibling.
   - Add a validator check that computes the inbound count from all `related[]` arrays plus content links, and warns on orphans (< 2 inbound from siblings).
2. **Reciprocal inverse pairs**: `px-to-rem` ↔ `rem-to-px`, `jpg-to-png` ↔ `png-to-jpg`, `base64-encode` ↔ `base64-decode`. Always link both ways, in the related list *and* in the first screen of the article ("Need the reverse? Use REM to PX").
3. **Anchor text** is the target tool's name or primary keyword, varied naturally. Never "click here". The related-tools cards already use tool names.
4. **Header menu:** categories plus at most 5 top tools each (≈45-70 links). Keep it server-rendered HTML (not JS-only) so the links are crawlable.
5. **Popular tools** is the main equity lever. The home page is the most-crawled, most-linked URL.
   - Put your 12-24 highest-potential or best-performing tools there.
   - Rotate monthly from GSC data (clicks and impressions with position 8-20 = "striking distance").
6. **New this week** on the home page (and optionally on the category hub) gets new tools crawled within hours, not weeks.
7. **Total links per page:** keep ≤ ~150-200 unique links. There is no hard Google limit, but equity dilutes.
   - The A–Z `/tools` page at 500 links is the one deliberate exception. It is an HTML sitemap.
8. **Blog → tools** is where external backlinks will land (linkable guides, data studies). Every post links to 3-10 tools with descriptive anchors.
9. **No `nofollow` on internal links.** `nofollow` on external links in articles is fine; the current Markdown renderer adds `nofollow noopener` to external links.

### 3.3 Related tools algorithm (deterministic, no manual upkeep at 500 tools)

```ts
// lib/tools/related.ts (server-only)
export function getRelatedTools(tool: ToolMeta, n = 8): ToolMeta[] {
  const picked = new Map<string, ToolMeta>();
  for (const s of tool.related ?? []) { const t = bySlug.get(s); if (t) picked.set(s, t); }   // 1. curated
  const kw = new Set(tool.keywords.flatMap(k => k.split(" ")));
  const score = (t: ToolMeta) =>
    (t.category === tool.category ? 3 : 0) +
    (t.alsoIn?.includes(tool.category) ? 2 : 0) +
    t.keywords.flatMap(k => k.split(" ")).filter(w => kw.has(w)).length * 0.5;
  getAllTools()
    .filter(t => t.slug !== tool.slug && !picked.has(t.slug))
    .map(t => [t, score(t)] as const)
    .sort((a, b) => b[1] - a[1] || a[0].slug.localeCompare(b[0].slug))                            // stable
    .slice(0, Math.max(0, n - picked.size))
    .forEach(([t]) => picked.set(t.slug, t));
  return [...picked.values()].slice(0, n);
}
```

Keep the sort **stable**. Adding a tool should change related blocks on only a few siblings, not reshuffle 500 pages at once. Mass link churn looks like a site-wide change and slows re-evaluation.

### 3.4 When a category exceeds ~60-80 tools

- **First step:** add `subgroup` to `meta.ts` (e.g. image: Convert / Compress / Resize / Edit / Metadata). Render the hub as H2 sections with anchor IDs. This needs no new URLs.
- **Only if a subgroup has its own search demand** (e.g. "image converter" 100k+): create a curated hub page at `/category/image/converters`.
  - Give it 300-600 words of unique intro.
  - Link it from the parent hub and breadcrumbs.
  - Tool URLs do not change.

---

## 4. Metadata rules

### 4.1 Titles

- **Final rendered length is ≤ 60 characters (~580-600 px on desktop).** Keyword first, benefit second.
  - Pattern: `PX to REM Converter – Free CSS Unit Tool` or `Meta Description Length Checker (Pixel-Accurate)`.
  - Google rewrites 33-61% of titles, and 77.6% when the title contains brackets [PR]. Avoid brackets and pipes stacked with the brand.
- **Repo issue (§10 #2):** the root layout has `title.template: "%s | ToolkitJar"`, which adds 12-13 characters. The validator checks `meta.title ≤ 60` *before* the suffix, so real titles can reach ~73 characters. Fix with one of these:
  - (a) Tool pages use `title: { absolute: meta.title }`, with no brand suffix. Google shows the site name separately via `WebSite` structured data. **Recommended.**
  - (b) Keep the suffix and validate `meta.title.length + suffix.length ≤ 60`.
- The home page carries the brand first. Category titles follow `Free <Category> Tools – <N>+ Online <X> Tools | Brand`.
- Titles must be unique across the site. Add a validator duplicate check.
- `title.template` applies only to child segments. A page-level `title.absolute` bypasses it [ND].

### 4.2 Meta descriptions

- 140-160 characters (≤ ~920 px desktop; mobile shows ~120 characters) [PR]. Unique per page.
- Put the primary keyword in the first 60 characters, end with a benefit ("No sign-up, runs in your browser").
- Google rewrites ~30-35% of descriptions anyway. A description does not affect ranking, but it affects CTR.
- Validator: error if duplicate; warn outside 120-165 (already implemented).

### 4.3 Open Graph and Twitter/X

- Per page: `og:title`, `og:description`, `og:url` (= canonical), `og:type` (`website` for tools and hubs, `article` for blog), `og:site_name`, `og:locale`, `og:image` 1200×630 (+ width, height, alt). Twitter: `summary_large_image`, plus `twitter:site` if a handle exists.
- **Gotcha:** a page-level `openGraph` object *replaces* the parent's `openGraph` (shallow merge). Every page must re-specify `siteName` and `locale`. The repo's `buildPageMetadata()` already does this.
- File-based `opengraph-image.tsx` overrides `openGraph.images` from the metadata object [ND]. Rely on the file convention.
- `metadataBase` is set once in the root layout [ND].

### 4.4 Dynamic OG images (Next 16 `ImageResponse`)

```tsx
// src/app/tools/[slug]/opengraph-image.tsx  (already present – keep, with these rules)
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export const alt = "Tool preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export function generateStaticParams() { return getAllTools().map(t => ({ slug: t.slug })); }

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;                                    // Next 16: params is a Promise [ND]
  const font = await readFile(join(process.cwd(), "assets/Inter-Bold.ttf")); // ttf/otf preferred [ND]
  return new ImageResponse(<div style={{ display: "flex" /* flexbox only, no grid */ }}>…</div>,
    { ...size, fonts: [{ name: "Inter", data: font, weight: 700 }] });
}
```

Verified constraints [ND]:
- Image generation functions receive `params` (and `id`) as **Promises** in v16.
- Output is statically generated at build and cached unless request-time APIs are used.
- Flexbox and a subset of CSS only; `display: grid` is not supported.
- 500 KB bundle limit (JSX, fonts and images included).
- Fonts must be ttf, otf or woff.
- OG files must be ≤ 8 MB and Twitter images ≤ 5 MB, or the build fails.

At 500 tools, expect ~500 PNGs at build (~0.1-0.3 s each, ≈1-2 min).
- Acceptable.
- If build time matters later, switch to one OG per category (`/category/[category]/opengraph-image`) and reference it from tool metadata.

### 4.5 Favicon set and manifest

App-router file conventions, all static:

| File | Output |
|---|---|
| `src/app/favicon.ico` | 48×48 multi-size ICO (16/32/48). Google needs a favicon that is a **multiple of 48 px** square and crawlable [GK]. |
| `src/app/icon.svg` | Modern browsers |
| `src/app/icon.png` (or `icon.tsx`) | 192×192 or 512×512, for Google and Android |
| `src/app/apple-icon.tsx` / `.png` | 180×180 |
| `src/app/manifest.ts` | `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color`, `background_color`, icons 192 + 512 PNG (+ `purpose: "maskable"` 512). **The current manifest lacks 192/512 PNGs; add them.** |

The `viewport.themeColor` light/dark pair is already set.

---

## 5. Performance rules (Core Web Vitals + AdSense)

Targets at p75 on mobile field data [GK]:
- LCP ≤ 2.5 s.
- INP ≤ 200 ms (INP replaced FID on 12 March 2024).
- CLS ≤ 0.1.

### 5.1 Static generation everywhere

- Every route is prerendered at build time. `generateStaticParams` returns all slugs, with `export const dynamicParams = false`, so unknown slugs 404 and are never rendered on demand [ND]. The repo already does this for tools, categories and blog.
- Verified in `.next/prerender-manifest.json` [REPO]: `/tools/<slug>`, `/category/*`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, OG images are all prerendered.
- **No ISR, no `revalidate`.** Content ships with deploys. Vercel serves prerendered HTML from its CDN.
- **Do not enable `cacheComponents` / PPR / `"use cache"`.**
  - In v16, PPR moved from `experimental.ppr` into the opt-in `cacheComponents` flag [ND].
  - It exists to mix static shells with dynamic, request-time data. We have none.
  - It changes caching defaults (data is dynamic unless cached) and adds complexity for zero gain on a fully static site.
  - Revisit only if server-light tools ship later (§6.7).
- **Do not use `output: "export"`** on Vercel. The default output keeps `next.config` `redirects()` and `headers()`, file-based OG image routes and the sitemap. Static export would need `vercel.json` for redirects. The pages are equally static either way.
- **Streaming metadata** [ND]: for dynamically rendered pages, Next 16 may append `generateMetadata` output to `<body>`. Googlebot handles this, but HTML-limited bots block rendering.
  - For our **prerendered** pages, metadata is in `<head>`. Verified in `.next/server/app/tools/word-counter.html`: `<title>`, canonical, description and `og:image` are all in the head.
  - No `htmlLimitedBots` override is needed.
- Turbopack is the default for `next dev` **and** `next build` in v16 [ND]. A custom `webpack()` config would fail the build, so do not add one.
  - `@next/bundle-analyzer` is webpack-based. Use `npx next experimental-analyze` (Turbopack) to inspect bundles [ND cli].

### 5.2 Code-split every tool (500 tools must not bloat any page)

- **Verified constraint** [ND lazy-loading]: *"When a Server Component dynamically imports a Client Component, automatic code splitting is currently **not** supported."* So the split must happen inside a **client** module.
  - The repo does this correctly. `registry.client.generated.tsx` is a `"use client"` map of `next/dynamic(() => import("@/tools/<slug>/Tool"), { loading })`.
  - Each tool compiles to its own chunk, and a page loads only its own tool chunk.
  - `ssr` stays `true` (default), so the tool's initial UI is in the prerendered HTML. That is good for LCP and CLS, and crawlers see the tool.
- The map itself grows linearly (~120 bytes per tool of chunk-loader stubs, ≈60 KB raw / ~10 KB gzip at 500). Acceptable.
  - If it ever matters, generate one tiny client wrapper per tool (`src/tools/<slug>/Client.tsx`) and a server-side `switch` that imports only that wrapper. Measure with `next experimental-analyze` first.
- **Heavy libraries stay inside the tool folder** and are imported lazily *inside event handlers* where possible:
  ```ts
  const { default: JSZip } = await import("jszip")
  ```
  This keeps them out of even the tool's initial chunk. Candidates: jszip, sql-formatter, prettier, pdf-lib, heic2any, ffmpeg.wasm.
- **Never import `registry.generated.ts` (all metas with FAQs) into a client component.** `registry.ts` has `import "server-only"`, which enforces this. Keep that.
- **Repo issue (§10 #3):** `Header` passes `getToolSummaries()` (name, shortDescription, keywords, aliases for **every tool**) as props into the client `HeaderSearch`. That serialises the whole catalogue into the RSC payload of **every page**: ≈400-500 B × 500 tools ≈ 200-250 KB raw per HTML document. Fix:
  - Emit a static `/search-index.json` at build (route handler with `export const dynamic = "force-static"`, or a file written by `generate-registry.ts` into `public/`).
  - Fetch it on first focus of the search box.
  - Pass only the 9-14 categories plus featured tools as props.

### 5.3 AdSense script loading

**Current state [REPO]:** `next/script` with `strategy="lazyOnload"` in the root layout; `<ins>` slots push in `useEffect`.

| Strategy | Effect on CWV | Effect on revenue | When |
|---|---|---|---|
| `lazyOnload` | Best for TBT/INP. Loads after `window.onload` plus idle [ND]. | Ads fill 1-3 s later, so fewer impressions on short tool sessions (users paste, copy, leave) | **Launch, AdSense review period, first 1-2 months** |
| `afterInteractive` (default) | Loads after hydration. `adsbygoogle.js` is async, so it does not block rendering. It adds main-thread long tasks that can cost INP on low-end Android. | More viewable impressions and higher RPM | **After approval, once CrUX/RUM shows INP p75 < 200 ms with margin** |
| `beforeInteractive` | Worst | Irrelevant | Never |

Recommendation:
- Stay on `lazyOnload` until approval and baseline CWV are in hand.
- Then A/B test `afterInteractive` by env flag for 2-4 weeks, comparing RPM and INP (collected via `web-vitals` attribution → GA4 event).
- Keep whichever wins. For most tool sites `afterInteractive` wins on revenue without failing CWV, because the ad loader is async.

Script placement:
- Keep a single loader in the root layout; `crossOrigin="anonymous"` is fine.
- Push `(adsbygoogle = window.adsbygoogle || []).push({})` once per `<ins>` mount; the repo guards against double pushes.
- Client-side navigation remounts slots, so new pushes happen correctly.

### 5.4 Reserve ad space (CLS)

- Every manual unit sits in a wrapper with a **fixed `min-height`** matching the served size: 250 or 280 for in-content responsive, 90/100 for leaderboard, 600 for a sticky sidebar skyscraper. The repo uses `--ad-min-height` and an `.ad-slot` class, which is right.
  - Use media queries for different heights on mobile and desktop, e.g. 280 on mobile and 250 or 90 on desktop.
- **Never place an ad above the tool UI.** It pushes the LCP element down and risks accidental clicks, which violates AdSense placement policy.
  - Use first ad **after** the tool panel, then mid-article, then end of article, plus the desktop sticky sidebar.
- **Disable in-page Auto ads** (AdSense → Ads → By site → Auto ads → In-page formats off). They inject units with no reserved space, which is the #1 CLS source on AdSense sites. Anchor and vignette overlay formats do not shift layout and can stay on.
  - Vignettes trigger on full page loads, and interplay with Next client-side navigation is inconsistent. Test and accept that.
- Keep ads away from interactive controls and outputs; never inside `<pre>`/code output [PR].
- Label units "Advertisement" (already done).
- Only render slots once the site is approved. Separate `NEXT_PUBLIC_ADSENSE_CLIENT` (verification meta tag plus loader) from `NEXT_PUBLIC_ADS_ENABLED` (renders `<ins>`), so reviewers never see empty reserved boxes.

### 5.5 Fonts

- `next/font/google` self-hosts at build (no runtime request to Google) with `display: "swap"`. The automatic fallback metric adjustment (`adjustFontFallback`, on by default) removes font-swap CLS.
- Set `preload: false` on secondary families, e.g. `Geist_Mono`, which is used only in code blocks and some tools. Only the body font should compete with LCP.
- Maximum 2 families and variable fonts only; `subsets: ["latin"]`.

### 5.6 Images, icons and CSS

- Few images. Use `next/image` with explicit `width`/`height` (or `fill` plus a sized parent) for any article illustration.
  - v16 defaults: `images.qualities` is `[75]` only, `minimumCacheTTL` is 4 h, and local images with query strings need `localPatterns` [ND].
  - Screenshots go in `/public` as WebP or AVIF.
- Icons: lucide named imports, tree-shaken. The `Icon` component that maps names → components is server-rendered, so the icon map costs no client JS. Do not import `lib/icons.ts` from client components.
- Tailwind v4 ships a single purged CSS file (~30-60 KB raw). Do not add CSS-in-JS runtimes.
- Every tool: no `window`/`document` during render, heavy work in `useDeferredValue`/`startTransition` or a Web Worker, and debounced input handlers (≤ 150 ms). These are INP rules for text tools that recompute on each keystroke.
- React Compiler is stable in v16 [ND]. Optional; turn on (`reactCompiler: true`) once tools are stable to cut re-renders, which helps INP.

### 5.7 Measure

- Measure CrUX / PageSpeed Insights per template (home, hub, 3 tools). GSC → Core Web Vitals report groups URLs by template.
- Add RUM: `useReportWebVitals` (from `next/web-vitals`) → `sendGAEvent("web_vitals", {...})`. Field INP on your own traffic arrives weeks before CrUX has data for a new domain.

---

## 6. Indexing at scale

### 6.1 `sitemap.ts`

The repo has this. Keep these rules:

```ts
// src/app/sitemap.ts – one file is enough up to 50,000 URLs / 50 MB (we will have ~600)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: absoluteUrl("/"), lastModified: newest(tools) },
    ...categories.map(c => ({ url: absoluteUrl(`/category/${c.slug}`), lastModified: newest(toolsIn(c)) })),
    ...tools.map(t => ({ url: absoluteUrl(`/tools/${t.slug}`), lastModified: new Date(t.dateModified) })),
    ...posts.map(p => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: new Date(p.updated) })),
  ];
}
```

- `lastModified` comes from `meta.dateModified`, bumped **only on meaningful change** (new feature, rewritten section, corrected facts).
  - Never use `new Date()` for tools; it makes every URL look changed on every deploy, and Google learns to ignore your lastmod.
  - Legal pages should use a constant or their own frontmatter date, not today.
- `changeFrequency` and `priority` are ignored by Google [GK]. Harmless, but do not rely on them.
- Only include indexable, canonical, 200-status URLs: no redirects, no noindexed pages, no query URLs.
- The sitemap is prerendered and cached by default [ND].
- **`generateSitemaps` / sitemap index is not needed below 50k URLs.** If it is ever needed, note that `id` is a Promise in v16 [ND].
- Optional image sitemap entries (`images: [ogUrl]`) are supported by `MetadataRoute.Sitemap` [ND]. They add little for tools.

### 6.2 `robots.ts`

```ts
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };            // previews never indexed
  }
  return {
    rules: [{ userAgent: "*", allow: "/" }],                           // DO NOT disallow /_next/
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
```

- **Repo issue (§10 #1, critical):** the current `robots.ts` disallows `/_next/`.
  - That path holds every CSS and JS chunk (`/_next/static/…`) and the image optimizer (`/_next/image`).
  - Google renders pages with those resources. Blocking them makes Googlebot see an unstyled, tool-less page, triggers "page resources couldn't be loaded" in URL Inspection, and can hurt mobile usability and quality assessment [GK].
  - **Remove it before launch.**
- AI crawlers: decide deliberately.
  - Allowing `OAI-SearchBot`, `PerplexityBot`, `ChatGPT-User` and `ClaudeBot` can bring referral traffic from AI answer engines.
  - `Google-Extended` controls Gemini training use only; blocking it does **not** affect Search or AI Overviews.
  - Default: allow all, and revisit if bandwidth becomes an issue.

### 6.3 `noindex` policy

| URL type | Action |
|---|---|
| Tool, hub, `/tools`, blog posts, about/contact | index |
| Privacy, terms, disclaimer | index (they are trust pages for AdSense; they don't compete) |
| `/tools?q=…` (client-side filter) | static page + self-canonical to `/tools`, no special handling |
| Any server-rendered search / result page (future) | `robots: { index: false, follow: true }` via `buildPageMetadata({ noindex: true })` |
| Shareable-state URLs (`/tools/x?input=...`, `#state=`) | Prefer the **hash** (`#`) for state so it never reaches the server or index; canonical covers `?` |
| Blog tag pages / author archives (if ever) | noindex until they have unique intro content |
| 404 | real 404 status (`notFound()`, `dynamicParams = false`) — already in place |

### 6.4 Avoiding thin or duplicate pages (the biggest risk at 500 pages)

Google's March 2024 scaled-content-abuse policy is still enforced. The March 2026 core and spam updates hit templated/programmatic sites hard (−60% to −90% reported) [PR]. Guardrails:

1. **One intent → one URL.** Before creating a page, check whether the top-10 results for the two queries mostly overlap. If ≥ 6 of 10 URLs are the same for "px to rem" and "rem to px", Google treats them as one intent: build one page that handles both directions (swap button) and targets both keywords. If they diverge, build two pages.
2. **Variant pages (inverse pairs, format pairs, presets)** are allowed only when *both*:
   - (a) the variant has its own demand (≥ ~500/mo or clear autocomplete presence), and
   - (b) the page has substantially unique content: different worked examples, reverse conversion table, format-specific caveats (HEIC→JPG vs HEIC→PNG transparency and size trade-offs).
   - Share the engine component (`<UnitConverter from="px" to="rem" />`) but never the article.
   - **Never mass-generate** `/tools/x-to-y` for every combination, or number presets like "compress image to 20kb / 30kb / 40kb… / 500kb". Pick the 2-4 presets with real demand (e.g. 20 KB, 50 KB, 100 KB, 200 KB), each with genuinely different guidance.
3. **Automated duplicate gate in `validate-tools.ts`:**
   - Compute 5-word shingles for every `content.md`.
   - Fail if Jaccard similarity > 0.25 with any other tool.
   - Warn if > 0.15.
   - Also fail on duplicate titles, descriptions and H1s, and on FAQ questions reused verbatim across tools.
4. Keep the existing ≥ 800-word minimum and at least 3 `##` sections. Add checks for at least 1 table or code block (worked example) and at least 2 internal links.
5. **Content is reviewed by a human before merge** (AI drafts are fine; unedited AI at scale is what the policy targets).

### 6.5 Adding tools weekly without hurting existing rankings

- **Cadence:** 5-15 tools per week, steady. Avoid dumping 200 at once; a steady cadence reads as a maintained site, and each batch gets reviewed.
- **Stable URLs:** never rename, never restructure. New categories are fine because tool URLs don't include the category.
- **Minimal blast radius:** a new tool adds one folder.
  - Shared templates, the header, related-tool ordering (stable sort) and other tools' `dateModified` stay unchanged.
  - Global template changes (layout, content blocks rendered on all tools) should be infrequent and deliberate; don't ship them together with 50 new tools.
- `dateModified` bumps only on real edits. Show it visibly ("Updated Oct 14, 2026") and mirror it in JSON-LD and the sitemap.
- **Discovery:**
  - New tools appear in "New this week" on the home page, their category hub, `/tools` and `sitemap.xml`.
  - Request indexing in GSC URL Inspection for the most important 3-5 per week (there is a daily quota).
  - The sitemap "ping" endpoint is deprecated (2023) [GK]; Google re-reads submitted sitemaps on its own.
  - Optional: IndexNow for Bing/Yandex via a post-deploy script. Google does not use IndexNow.
- **Monitor after each batch:**
  - GSC → Pages → "Crawled – currently not indexed" and "Discovered – not indexed" for `/tools/` (a rising share = quality signal problem, so slow down and improve content).
  - Performance filtered by `/tools/` page prefix.

### 6.6 Server-light roadmap tools (later)

- Put URL-fetching tools (meta tag checker by URL, OG validator by URL) under the same `/tools/<slug>` URLs, with a Route Handler at `/api/<tool>` (Node runtime, rate-limited).
- Keep the **page** static; only the fetch is dynamic.
- Keep `/api/` out of the sitemap. Disallowing `/api/` in robots is fine, since it serves no rendering resources.

---

## 7. Analytics and Search Console setup

### 7.1 Google Search Console

1. **Domain property (recommended):** GSC → Add property → Domain → add the **DNS TXT** record at the registrar (or in Vercel DNS if using Vercel nameservers). This covers http/https, apex, www and all subdomains.
2. Optional **URL-prefix property** `https://toolkitjar.com/` via the **HTML meta tag**. `metadata.verification.google` in the root layout renders `<meta name="google-site-verification">`; the env `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is already wired. Useful for quick URL-Inspection access and for the AdSense site-ownership link. Other methods: HTML file in `/public`, GA, GTM.
3. Submit `https://toolkitjar.com/sitemap.xml` (Sitemaps report).
4. URL-Inspect the home page, one hub and 3 tools. Check that "Page resources" all load and that the rendered screenshot shows the tool.
5. Settings → Crawl stats. Check the robots.txt report (the old robots.txt Tester was retired [PR]).
6. Link GSC ↔ GA4 (GA4 Admin → Product links → Search Console).
7. **Bing Webmaster Tools:** import from GSC (one click). Bing also powers DuckDuckGo, Yahoo and parts of ChatGPT search.

### 7.2 GA4 via `@next/third-parties`

The package is already installed; the layout renders `<GoogleAnalytics gaId=… />` only when the env var is set.

```tsx
// src/app/layout.tsx
import { GoogleAnalytics } from "@next/third-parties/google";
…
{siteConfig.gaId && <GoogleAnalytics gaId={siteConfig.gaId} />}   // loads gtag after hydration [ND]
```

```tsx
// inside a tool, track real usage (drives which tools to improve / feature)
import { sendGAEvent } from "@next/third-parties/google";
sendGAEvent("event", "tool_used", { tool: "px-to-rem", action: "convert" });
```

- GA4 "Enhanced measurement → Page changes based on browser history events" must stay **on**, so Next client-side navigations count as page views.
- Key events to mark: `tool_used`, `copy_result`, `download_result`. Measure engagement per tool, not only page views.
- **Consent (UK/EEA/CH):** Google requires a Google-certified CMP to serve ads to EEA/UK/Swiss users (since January 2024) [GK].
  - Easiest: AdSense → Privacy & messaging → European regulations message (Google's own CMP, free). It sets Consent Mode v2 signals that GA4 respects.
  - Also enable the US state-regulations message.
  - Set Consent Mode defaults *before* GA loads if you add GA before the CMP.
- Web-vitals RUM → GA4 (§5.7).
- Vercel Analytics / Speed Insights are optional (paid beyond the free tier). GA4 plus CrUX is enough.

### 7.3 AdSense wiring

- Site verification: use the `google-adsense-account` meta tag (already emitted via `metadata.other` when the client ID is set), **or** the loader script, **or** `ads.txt`.
- `public/ads.txt`: replace the placeholder comment with `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` as soon as the publisher ID exists. Missing `ads.txt` limits demand. The existing header rule serves it with `max-age=3600`.
- Apply only when: ≥ 25-40 tools with full articles; About, Contact, Privacy (with AdSense/cookie disclosure), Terms and Disclaimer pages; custom domain on HTTPS; no "coming soon" or empty pages; nav works on mobile [PR].

---

## 8. Repo architecture: folder per tool with a codegen registry

### 8.1 Layout

Already in place; recommended refinements are marked ★.

```
src/
  app/
    layout.tsx                    root metadata, fonts, GA, AdSense loader, Org+WebSite JSON-LD
    page.tsx                      home (popular + new + category grid)
    tools/page.tsx                A–Z index
    tools/[slug]/page.tsx         generic tool template (generateStaticParams, dynamicParams=false)
    tools/[slug]/opengraph-image.tsx
    category/[category]/page.tsx
    blog/[slug]/page.tsx
    sitemap.ts  robots.ts  manifest.ts  icon.svg  apple-icon.tsx  favicon.ico
    search-index.json/route.ts    ★ force-static JSON for header search
  tools/
    _template/                    scaffold source for `npm run new-tool`
    <slug>/
      meta.ts                     SEO + taxonomy (small, typed)
      content.md                  long-form article (Markdown + frontmatter optional)
      faq.ts | faq in frontmatter ★ move FAQ out of meta.ts so list-level registry stays lean
      Tool.tsx                    "use client" default export (UI only)
      logic.ts                    pure functions (unit-testable, reusable by variant tools)
      logic.test.ts               ★ vitest/node:test for formulas
      assets/                     optional images for the article
  lib/tools/
    types.ts categories.ts registry.ts (server-only) related.ts search.ts content.ts
    registry.generated.ts         AUTO: imports every meta.ts
    registry.client.generated.tsx AUTO: "use client" map of next/dynamic imports
  components/{ui,layout,tools,ads,seo,content}
scripts/
  generate-registry.ts            AUTO-wires folders → registries (+ ★ redirects from meta.redirectFrom, ★ search-index)
  validate-tools.ts               quality gate (+ ★ final-title length, duplicates, shingle similarity, orphan check)
  new-tool.ts                     scaffolder
```

Principles:
- **Adding a tool touches only `src/tools/<slug>/`.** The generated files are rebuilt by `npm run gen` (pre-dev and pre-build).
  - To avoid merge conflicts when many contributors add tools in parallel, do not commit the `*.generated.*` files; generate them in CI/Vercel.
  - Alternatively, keep them committed but sorted (already the case); conflicts then resolve trivially.
- Keep **data (meta), prose (content.md), logic (logic.ts) and UI (Tool.tsx) separate**. Variant tools (`rem-to-px`) reuse `../px-to-rem/logic.ts`, or a shared `src/lib/engines/units.ts`, while keeping their own meta and content.
- The generated server registry keeps `import "server-only"`. The client registry contains only dynamic-import stubs.

### 8.2 Content format for 500 long-form articles: MDX vs Markdown vs TS objects

| Criterion | **Markdown files (`content.md`) + server render** (current) | MDX (`content.mdx` via `@next/mdx`) | TS content objects (`content.ts`) |
|---|---|---|---|
| Authoring by AI/humans | Easiest. Plain prose, no syntax traps. | Moderate. JSX in prose; `{`, `<` and unclosed tags break compilation. | Poor. Long strings, escaping and template literals; painful diffs. |
| Failure mode | Bad markdown still renders | **One typo fails the whole build** | Type errors fail the build |
| Validation (word count, headings, links, similarity) | Trivial: read the file, parse with remark | Needs MDX parse | Needs a TS import |
| Interactive embeds in articles | Via whitelisted shortcodes / custom fenced blocks mapped to server components (see below) | Native (import any component) | Native |
| Client JS cost | **Zero.** `react-markdown` runs in a Server Component at build. | Zero if components are server components | Zero |
| Build cost at 500 pages | Low (parse at prerender) | Higher: every file is compiled as a module. Turbopack supports remark/rehype plugins only with **serializable options** (string plugin names) [ND]. `@next/mdx` has **no frontmatter** support without extra plugins [ND]. | Low |
| Portability (CMS or headless later) | Excellent | Lock-in to MDX | Lock-in to code |
| Review diffs | Clean | Clean | Noisy |

**Recommendation: keep Markdown (`content.md`)**, rendered server-side with `react-markdown` + `remark-gfm` (current setup). Add a small whitelist of shortcodes for the few rich elements articles need:

````md
```callout type=tip
Use 62.5% on html only if you understand the accessibility trade-off…
```

```tool-link slug=rem-to-px
```
````

Map these in the `Markdown` component's `code` renderer to server components (callout, internal tool card, formula box).

- This keeps authoring safe for AI contributors (a typo can't break the build).
- Validation stays trivial.
- MDX-level power remains available for the 1-2% of articles that need it.

Structured, repeated data (FAQ, reference tables that the tool also uses, limits per platform) belongs in typed TS/JSON next to the tool:
- FAQ must feed both visible HTML and JSON-LD.
- Platform limits must feed both the tool logic and the article table, so they can't drift apart.

---

## 9. Launch checklist

**Before first deploy**
- [ ] Fix `robots.ts`: remove the `/_next/` disallow; add the non-production `Disallow: /` guard.
- [ ] Tool titles: switch to `title.absolute`, or validate the final length including the brand suffix (≤ 60).
- [ ] Move header search data to a lazily fetched static JSON (no per-page catalogue payload).
- [ ] Manifest: add 192/512 PNG icons (+ maskable); `favicon.ico` 48×48 multiple; Organization logo as a 512×512 PNG.
- [ ] `NEXT_PUBLIC_SITE_URL` is set to the final domain in the Vercel **Production** env. Canonicals, sitemap and OG URLs use it.
- [ ] Validator additions: slug regex, duplicate titles/descriptions/H1s, 5-gram Jaccard similarity, orphan/inbound-link check, ≥ 2 internal links per article.
- [ ] Every tool page contains: H1 = name, tool above the fold, "Updated" date, 1,000+ word article, visible FAQ, related tools, breadcrumb.
- [ ] `npm run check && npm run build`. The build output shows every route as static (○/●), not dynamic (ƒ), except OG and sitemap which are also prerendered.
- [ ] `npx next experimental-analyze`: first-load JS for `/tools/[slug]` stays under ~150 KB gzip excluding the tool chunk.

**Domain and Vercel**
- [ ] Custom domain on production. www ↔ apex 308 redirect. `*.vercel.app` production alias redirected or at least canonicalised.
- [ ] `curl -I https://domain/tools/word-counter` returns 200, `x-vercel-cache: HIT` on a repeat request, and no `x-robots-tag`.
- [ ] `curl -I https://domain/tools/word-counter/` returns 308 to the no-slash URL. `/tools/nope` returns 404.
- [ ] A preview URL returns `x-robots-tag: noindex` and/or robots `Disallow: /`.
- [ ] `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/ads.txt`, `/favicon.ico` all return 200.

**Search Console / Bing / GA**
- [ ] GSC Domain property (DNS TXT) plus a URL-prefix property (meta tag).
- [ ] Submit the sitemap.
- [ ] URL-Inspect the home page, 1 hub and 3 tools: the rendered HTML includes the tool UI, and there are no blocked resources.
- [ ] Request indexing for the home page, hubs and the top 10 tools.
- [ ] Bing Webmaster Tools import from GSC.
- [ ] GA4 property: `NEXT_PUBLIC_GA_ID` set; enhanced measurement history-change on; `tool_used` event marked as a key event; GSC linked.
- [ ] Rich Results Test on a tool URL shows BreadcrumbList valid (WebApplication "no rich result" is expected); Schema Markup Validator shows 0 errors.
- [ ] PageSpeed Insights mobile on the home page, 1 hub and 3 tools: LCP < 2.5 s, CLS < 0.1, TBT low. Fix before applying to AdSense.

**AdSense**
- [ ] ≥ 25-40 complete tools; About, Contact, Privacy (cookies/AdSense/GA disclosure), Terms and Disclaimer live and linked in the footer.
- [ ] Set `NEXT_PUBLIC_ADSENSE_CLIENT` (verification meta plus loader) with ads **display** still off. Apply.
- [ ] Privacy & messaging: EEA/UK consent message and US state message enabled.
- [ ] After approval: fill in `ads.txt`; enable manual units with reserved heights; Auto ads with in-page formats **off** and anchor/vignette on (optional).
- [ ] Two weeks later: compare CLS/INP in RUM/CrUX, then A/B `afterInteractive` vs `lazyOnload`.

**Ongoing (weekly)**
- [ ] Add 5-15 tools. Each passes the validator and has a human-reviewed article.
- [ ] Update "Popular tools" monthly from GSC.
- [ ] Watch GSC "Crawled/Discovered – not indexed" for `/tools/`. Improve or merge weak pages rather than adding more.
- [ ] Never rename slugs. Every removal gets a 301 to the closest tool.

---

## 10. Audit of the current repo (findings to act on)

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | **Critical** | `src/app/robots.ts` disallows `/_next/`, which blocks all CSS/JS chunks Googlebot needs to render pages | Remove from `disallow`; add a `VERCEL_ENV` guard for previews |
| 2 | High | `title.template "%s \| ToolkitJar"` adds ~13 characters; validator checks `meta.title` ≤ 60/65 before the suffix, so final titles can exceed 60 and get truncated or rewritten | Tool pages use `title: { absolute }`, or validate the final length |
| 3 | Medium (grows with tool count) | `Header` passes every `ToolSummary` (with keywords/aliases) into client `HeaderSearch`, so the full catalogue is serialised into every page's RSC payload (~200 KB+ raw at 500 tools) | Static `/search-index.json` fetched on focus |
| 4 | Medium | AdSense client env var both verifies the site and renders `<ins>` slots, so reviewers may see empty reserved boxes | Split into `NEXT_PUBLIC_ADSENSE_CLIENT` and `NEXT_PUBLIC_ADS_ENABLED` |
| 5 | Low | Manifest has only SVG + 180 px apple icon | Add 192/512 PNG + maskable |
| 6 | Low | `WebSite.potentialAction SearchAction` no longer yields a sitelinks search box | Optional to keep; harmless |
| 7 | Low | Sitemap static pages use a hard-coded `2026-09-29` date | Fine; use per-page frontmatter dates later |
| 8 | Info | Verified good: `generateStaticParams` + `dynamicParams=false` on tools, categories and blog; metadata in `<head>` for prerendered pages; self-canonical via `metadataBase`; per-tool OG images prerendered; JSON-LD escaped with `<`; BreadcrumbList emitted with visible breadcrumbs; client-side `next/dynamic` code-splitting per tool (the only pattern that splits, per [ND]); `server-only` on the registry; `next/font` with `display: swap`; reserved ad `min-height`; `ads.txt` header; `redirects()` hook for renames | — |
