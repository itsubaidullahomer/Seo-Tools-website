# Launch checklist

Everything in this list is something only the site owner can do (accounts, domain, verification). The code side is already done.

## 1. Domain and hosting (day 1)

- [ ] Buy the domain (e.g. `toolkitjar.com`). Namecheap, Cloudflare or Vercel all work.
- [ ] In Vercel → Project → **Settings → Domains**, add the domain. Vercel shows the DNS records to add at your registrar (an `A` record `76.76.21.21` for the root and a `CNAME` `cname.vercel-dns.com` for `www`). HTTPS is automatic.
- [ ] Decide the canonical host (`toolkitjar.com` recommended) and let Vercel redirect `www` → root.
- [ ] In Vercel → **Settings → Environment Variables** set, for Production:
  - `NEXT_PUBLIC_SITE_URL` = `https://toolkitjar.com`
  - `NEXT_PUBLIC_SITE_NAME` = `ToolkitJar`
  - `NEXT_PUBLIC_CONTACT_EMAIL` = a real mailbox you check
  - `NEXT_PUBLIC_AUTHOR_NAME` = your name or team name (shown on the About page)
- [ ] Redeploy so the sitemap, canonical URLs and Open Graph URLs use the real domain.
- [ ] Create the contact mailbox (e.g. `hello@` on your domain, or forward it to Gmail via your registrar's free email forwarding).

## 2. Google Search Console (day 1)

- [ ] Go to search.google.com/search-console → **Add property** → choose *Domain* → enter `toolkitjar.com`.
- [ ] Verify with the DNS TXT record Google shows (add it at your registrar). Alternatively use the HTML-tag method and put the token in `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
- [ ] **Sitemaps** → submit `https://toolkitjar.com/sitemap.xml`.
- [ ] Use **URL Inspection → Request indexing** for the homepage, `/tools`, and each category page.
- [ ] Check back weekly: *Pages* report (indexed vs not), *Performance* (queries bringing traffic – this tells you which tools to build next).

## 3. Google Analytics (day 1)

- [ ] analytics.google.com → create a GA4 property → Web data stream → copy the Measurement ID (`G-XXXXXXXXXX`).
- [ ] Set `NEXT_PUBLIC_GA_ID` in Vercel and redeploy. Analytics loads only when this is set.

## 4. Bing Webmaster Tools (optional, 10 minutes)

- [ ] bing.com/webmasters → import from Google Search Console. Free extra traffic from Bing/DuckDuckGo.

## 5. Before applying for AdSense (weeks 4-8)

Apply once the site has been live for a few weeks, is indexed, and receives some daily visitors. Check:

- [ ] 40+ tools live, each with its article and FAQ (the build refuses to ship a tool without them).
- [ ] At least 8-10 blog posts published.
- [ ] About, Contact, Privacy Policy, Terms and Disclaimer pages are linked in the footer (already done) and the contact email works.
- [ ] `https://toolkitjar.com/ads.txt` returns 200 (currently a comment-only placeholder – fine for review).
- [ ] No broken links (`npm run build` catches internal ones; spot-check a few pages).
- [ ] Site loads fast on mobile (PageSpeed Insights ≥ 90).
- [ ] You have **one** Google account for AdSense and have never had an AdSense account closed.

## 6. Applying for AdSense

- [ ] adsense.google.com → Get started → enter `https://toolkitjar.com`, your country and payment details.
- [ ] AdSense shows a publisher ID like `ca-pub-1234567890123456`. Set it as `NEXT_PUBLIC_ADSENSE_CLIENT` in Vercel and redeploy. This adds the AdSense script and the `google-adsense-account` meta tag on every page.
- [ ] Replace the contents of `public/ads.txt` with the line AdSense shows (`google.com, pub-…, DIRECT, f08c47fec0942fa0`) and redeploy.
- [ ] In AdSense → **Privacy & messaging**, create and publish a GDPR consent message (required for visitors from the EU/UK/Switzerland). Google's own consent tool is a certified CMP; nothing else needs to be installed.
- [ ] Click **Request review**. Typical wait: a few days to a few weeks.
- [ ] If rejected for "low value content": add more tools/articles, wait two weeks, re-apply. Do not re-apply without changing anything.

## 7. After approval

- [ ] Turn on **Auto ads** for the site in AdSense (simplest), or create ad units and pass their IDs to the `<AdSlot slot="…" />` components in `src/app/tools/[slug]/page.tsx`.
- [ ] Never click your own ads or ask others to. Never buy traffic. Never add "click the ads" text.
- [ ] Keep publishing 4-8 tools per week for the first six months; refresh `dateModified` when you improve a tool.
- [ ] At $100 balance AdSense mails a PIN to your address; enter it to unlock payments.

## 8. Ongoing growth loop

1. Every week, open Search Console → Performance → Queries. Sort by impressions.
2. Queries with many impressions but low clicks → improve that page's title/description.
3. Queries you rank #8-20 for → expand that article and add the related tool(s) from `docs/research/launch-plan.md` (roadmap section).
4. Add the new tools, commit, done – Vercel deploys automatically.
