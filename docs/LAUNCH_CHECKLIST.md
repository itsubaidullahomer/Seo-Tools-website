# Launch checklist

Account, domain and verification steps that only the site owner can do. Ticked items were completed on 1 October 2026. "Done" here means the step was carried out – not that the site is guaranteed to rank or be approved; those depend on Google.

## 1. Domain and hosting

- [x] Domain `toolkitjar.com` bought (registrar: GoDaddy). Nameservers point to Cloudflare.
- [x] Hosting on **Cloudflare Pages** (free, ads allowed), project `seo-tools-website`, production branch `main`, build command `npm run build:static`, output directory `out`, env `NODE_VERSION=22` and `NEXT_PUBLIC_SITE_URL=https://toolkitjar.com`. See `docs/HOSTING.md`.
- [x] Custom domains `toolkitjar.com` and `www.toolkitjar.com` attached, SSL active.
- [ ] **Redirect `www` → root.** Cloudflare Pages can't redirect by hostname from `_redirects`, so do it once in the dashboard: Cloudflare → `toolkitjar.com` → **Rules → Redirect Rules → Create rule → template "Redirect from WWW to root"** (301, keep path and query string). Until then both hosts serve the same pages; the canonical tags already point to `toolkitjar.com`.
- [x] Contact mailbox `hello@toolkitjar.com` forwarded to Gmail with Cloudflare Email Routing (free), plus a Gmail filter so it never lands in spam.
- [ ] After each deploy that touches headers, run the SEO audit against the live site: `node scripts/seo-audit.mjs https://toolkitjar.com`. It now also checks `X-Robots-Tag` headers, image content types and the www redirect. A clean result means none of the checked problems were found; it is not proof that pages will rank.

## 2. Google Search Console

- [x] Domain property `toolkitjar.com` verified with a DNS TXT record (keep that record in Cloudflare DNS).
- [x] Sitemap submitted as the full URL `https://toolkitjar.com/sitemap.xml` (Domain properties need the full URL).
- [x] Homepage confirmed indexed with URL Inspection.
- [ ] Check weekly: **Pages** (indexed vs not) and **Performance → Queries** (what people search to find you – this decides what to build next).

## 3. Bing Webmaster Tools

- [x] Imported from Google Search Console; sitemap read successfully (65 URLs).
- [ ] Optional: turn on **IndexNow** so new pages are picked up quickly.

## 4. Google Analytics (optional)

- [ ] analytics.google.com → create a GA4 property → Web data stream → copy the Measurement ID (`G-XXXXXXXXXX`).
- [ ] Add `NEXT_PUBLIC_GA_ID` in Cloudflare Pages → Settings → Environment variables, then redeploy. Consent Mode defaults (storage denied in the EEA, UK and Switzerland until the visitor chooses) load automatically before the tag.

## 5. Before applying for AdSense

There is no official page or tool count for approval. Google looks for a site with original, useful content that complies with its policies. Apply once the site is indexed and you have checked:

- [ ] The tools work and their articles are accurate. Run `npm test`, and work through `docs/HUMAN_REVIEW_CHECKLIST.md` – every claim there should be confirmed against its source by a person.
- [ ] Search Console shows a healthy share of pages indexed.
- [ ] About, Contact, Privacy Policy, Terms and Disclaimer pages are linked in the footer and the contact email works (done).
- [ ] `https://toolkitjar.com/ads.txt` returns 200 (currently a comment-only placeholder – replace it after approval, see below).
- [ ] You have **one** Google account for AdSense and have never had an AdSense account closed.

## 6. Applying for AdSense

- [ ] adsense.google.com → Get started → enter `https://toolkitjar.com`, your country and payment details.
- [ ] AdSense shows a publisher ID like `ca-pub-1234567890123456`. Set it as `NEXT_PUBLIC_ADSENSE_CLIENT` in Cloudflare Pages and redeploy. This loads the AdSense script and adds the `google-adsense-account` meta tag on every page. No ad boxes appear yet – manual units need slot IDs (step 7).
- [ ] Replace the contents of `public/ads.txt` with the exact line AdSense shows (`google.com, pub-…, DIRECT, f08c47fec0942fa0`) and redeploy.
- [ ] **Before ads can serve to EEA/UK/Swiss visitors:** AdSense → **Privacy & messaging** → create and publish a **European regulations (GDPR)** message. Google's message is a Google-certified consent management platform; nothing else needs to be installed. Once `NEXT_PUBLIC_ADSENSE_CLIENT` is set, the footer shows a "Privacy settings" link that reopens this message.
- [ ] Click **Request review**. Typical wait: a few days to a few weeks.
- [ ] If rejected for "low value content": improve the weakest pages (accuracy, examples, usefulness), wait, then re-apply. Do not re-apply without changing anything.

## 7. After approval

- [ ] Simplest: turn on **Auto ads** for the site in AdSense. The publisher ID alone is enough for Auto ads.
- [ ] Optional manual units: create ad units in AdSense → Ads → By ad unit, then set their numeric IDs as `NEXT_PUBLIC_ADSENSE_SLOT_INLINE` and `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR` and redeploy. A placement only renders when its slot ID is set; tools marked `highInteraction` (click and keyboard tests) never show ads near the tool.
- [ ] Never click your own ads or ask others to. Never buy traffic. Never add "click the ads" text.
- [ ] Add tools when the data supports them (Search Console queries, weak competition), not to hit a quota. Refresh `dateModified` when you materially improve a tool.
- [ ] **Address verification:** when your earnings reach US$10 (or the local equivalent), AdSense posts a PIN to your payment address; enter it within four months or ads stop showing.
- [ ] **Payment:** AdSense pays once your balance reaches the payment threshold – US$100 for USD accounts – after you have also added payment details.

## 8. Ongoing growth loop

1. Every week, open Search Console → Performance → Queries. Sort by impressions.
2. Queries with many impressions but few clicks → improve that page's title and description.
3. Queries you rank about #8-30 for → improve that page (accuracy, examples, missing features) before writing anything new.
4. Queries that suggest a tool you don't have → research it (search demand, weak top results, can we build something clearly better) before building it.
5. Commit to `main` – Cloudflare Pages deploys automatically.
