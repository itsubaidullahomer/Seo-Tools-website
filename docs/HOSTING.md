# Hosting: where to run the site, and what it costs

The site is **fully static**: every page is built ahead of time and every tool runs in the visitor's browser. There is no server code and no database, so hosting is just "serve files quickly", and the only cost that grows with traffic is **bandwidth**. The site can therefore run on almost any host, and moving hosts takes minutes, not a rewrite.

## The one rule that matters now

Vercel's free **Hobby** plan is for personal, non-commercial use only. Their terms list blogs with AdSense and affiliate sites as commercial use, so a site that shows ads must be on a paid plan (or another host) **before you turn ads on**. Check your plan at Vercel → Settings → Billing. Your team name ("<name>'s projects") is the default name for a personal free account, so it is probably Hobby.

## Options

| Host | Cost to start | What happens as traffic grows | Effort |
| --- | --- | --- | --- |
| **Cloudflare Pages** (recommended for launch) | $0 | Static bandwidth is free and unlimited | ~30 min, one time |
| **Vercel Pro** | $20/month | 1 TB bandwidth and 10M requests included, then about $0.15 per extra GB and $2 per extra million requests | Already set up |
| **Netlify** | Free tier with limits (about 100 GB/month at the time of writing) | Credit-based overages | ~30 min |

Prices change; confirm on each provider's pricing page.

## Rough cost and income at scale – hypothetical, not a forecast

The site currently runs on **Cloudflare Pages**, where static bandwidth costs nothing, so hosting stays at $0 at any of these volumes. The table shows what the same traffic would cost on Vercel Pro (about 0.3 MB and 12 requests per page view) and what it *could* earn at three example page RPMs (ad revenue per 1,000 page views). Real RPM depends on visitor countries, topic, ad settings and consent rates, and can be well below or above these examples. Profit is income minus costs, including your own time.

| Page views / month | On Vercel Pro | Income at $2 RPM | at $5 RPM | at $10 RPM |
| --- | --- | --- | --- | --- |
| 10,000 | $20 | $20 | $50 | $100 |
| 100,000 | $20 | $200 | $500 | $1,000 |
| 1 million | ~$24 | $2,000 | $5,000 | $10,000 |

## Deploying to Cloudflare Pages

1. Create a free Cloudflare account and add your domain (buying it at Cloudflare Registrar sells it at cost).
2. Workers & Pages → Create → Pages → Connect to Git → choose this repository and the branch you deploy from.
3. Build settings:
   - Build command: `npm run build:static`
   - Build output directory: `out`
   - Environment variables: `NODE_VERSION` = `22`, plus the `NEXT_PUBLIC_*` values from `.env.example` (at least `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SITE_NAME`).
4. Deploy, then add your custom domain under the project's Custom domains tab.
5. Check the headers: `curl -I https://<project>.pages.dev/` should show `X-Robots-Tag: noindex` (the temporary address must not be indexed) and `curl -I https://yourdomain.com/` should not.

`npm run build:static` runs the normal checks and build with `STATIC_EXPORT=1`, then copies `static-host/_headers` (security headers, long caching for hashed files, noindex for `*.pages.dev`) into `out/`. Locally you can preview it with `npx serve out`.

## What does not carry over

- `headers()` and `redirects()` in `next.config.ts` are ignored in static-export mode. Headers are covered by `static-host/_headers`. If you ever rename a tool slug, add a line to `static-host/_redirects` (`/old-slug /new-slug 301`) as well as `next.config.ts`.
- On Vercel nothing changes: the normal build is used and `next.config.ts` applies.

## Should the site be rewritten in another language or framework?

No. Hosting cost depends on bandwidth, not on the language. Pages ship about 175–195 KB of JavaScript, about 155 KB of which is React and Next.js themselves. A framework that ships less JavaScript (such as Astro) could lower bandwidth and improve speed somewhat, but the saving is small compared with the rewrite effort. Revisit only if traffic is large and bandwidth becomes the top cost.
