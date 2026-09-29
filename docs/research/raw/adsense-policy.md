# AdSense policy and approval research for a free-tools site (Sept 2026)

- Role: Google AdSense policy and approval specialist
- Date: 2026-09-29
- Site: ToolkitJar (placeholder brand from `docs/LAUNCH_CHECKLIST.md`), Next.js static site on Vercel, all tools client-side, brand-new domain
- Model: this research pass ran on Claude Opus 5.5 (`claude-opus-5-5`)

---

## 0. Method and how reliable each source is

**Network limits.** The egress proxy blocked every Google domain: support.google.com, developers.google.com, blog.google, betterads.org, web.archive.org, reddit.com, seroundtable, cookieyes and termsfeed. The session's WebSearch budget (200 calls) had already been used by sibling researchers. Sibling notes (`developer.md` §7, `text-writing.md` §6) hit the same blocks.

**Workaround: Google's own wording, captured in public GitHub repositories.** GitHub code search plus `raw.githubusercontent.com` were reachable. Several 2026 repos contain **verbatim markdown captures of Google help pages**. I used these as the primary source for Google's wording:

| Tag | What it is | Capture date / reliability |
|---|---|---|
| **[GPP]** | *Google Publisher Policies* (answer 10502938), full text. Sources: `ChinmayOnGithub/tools/policies/*.md` (en and en-GB captures), `huamanraj/aitoolbox.software/docs/adsense/Google Publisher Policies.md`, `PeterPari/brawlrank/improvements/adsense-policy.md` | 2025-2026 captures, verbatim. High reliability. |
| **[APP]** | *AdSense Program policies* (answer 48182), footer "Last updated: August 16, 2024", plus *Google AdSense content and user experience* (answer 10015918) and the Search Console *Manual actions report* help page. Source: brawlrank capture (©2026 footer) | Verbatim. High reliability. |
| **[SPAM]** | *Spam policies for Google web search*, full text. Source: `lesishu/seo-guide-skill/references-google/spam-policies-full.md` (a copy of developers.google.com `essentials-spam-policies.txt`) | Verbatim. High reliability. It includes the newer "Back button hijacking" item. |
| **[CMP]** | Consent requirements snapshot "reviewed on 2026-04-11" against Google answers 13554116, 7670013, 10961068, 14126816 and others. Source: `Starraider/typo3-skills/skills/google-cmp-adsense/references/google-requirements.md` | A secondary summary with dates and citations. Medium-high reliability. |
| **[GATE]** | AdSense policy gate table with the ads.txt line, age, languages, enforcement ladder and payments. Source: `Firzus/agent-skills/skills/web/adsense/policy-gate.md` | A secondary summary with a citation on every row. Medium-high reliability. |
| **[TCF23]** | "TCF v2.3 is mandatory for TC strings generated after 1 March 2026" (Google answers 9999955 and 16088460). Sources: `psycholog1sts/NovaTools/docs/adsense-growth-operating-plan-2026-08-04.md` and `raiderj77/text-converter/docs/ADSENSE_READINESS.md` | Two independent 2026 repos agree. Medium-high reliability. |
| **[COMM]** | Real 2026 tool and calculator sites that were rejected or remediated: Calcuzy (low value content → resubmission), calculatorsallinone.com (rejected 2026-09-08 for low value content), Koobrain/ToolNest audit (2026-04-17), CalcuMake (rejected for low value content), ZenPDF readiness (2026-08), roznamcha audit (2026-08-19), TORQYX audit (2026-09-20), formatho ad-placement spec (2026-09-14), battersea-dynamics notes, the-last-dance SDD-003 (rejected 2026-07) | Primary evidence of what happened to real tool sites. Reliable as anecdote, not as policy. |
| **[SIB]** | Sibling research files in this folder (`text-writing.md` §6, `seo.md` §4, `developer.md` §7, `security-misc-utility.md` §2, `converters-calculators.md`) | Earlier WebSearch snippets from adsenseaudit.net, adstimate.com and Medium "AdSense Rejection Fixes 2026". |
| **[K]** | Standing knowledge of long-stable Google policy (Better Ads Standards list, ad placement article, privacy template wording) | Flagged wherever it is used. Re-check it live before launch. |

**Items I could not re-verify live, and must be re-checked in a normal browser before applying:**

1. Whether the "6-month site age for China/India" rule is still in force (§1.6).
2. The exact current Better Ads thresholds page.
3. The exact wording of the AdSense "Ad placement policies" article (1346295).

---

## 1. Approval requirements (what AdSense checks in 2026)

### 1.1 Who can apply (hard eligibility)

- **Age:** 18+. A parent or guardian can apply for a minor with their own Google Account. [GATE, answer 14230]
- **Site ownership:** you must own the **root domain** and be able to edit the HTML. Platform subdomains such as `*.vercel.app`, `*.netlify.app` and `*.github.io` fail the ownership check before content is ever reviewed. [COMM: ZenPDF] → Apply only with `toolkitjar.com`, never a preview URL. [COMM: NovaTools]
- **Language:** content must be primarily in a supported language. English is supported. Machine-translated locale copies count as thin pages. [GPP "Unsupported languages"]
- **Sanctions:** publishers in, or acting for parties in, Crimea, Cuba, the so-called DNR/LNR, Iran or North Korea are ineligible. [GPP]
- **One account per payee.** A previously disabled account blocks new ones. [K, LAUNCH_CHECKLIST]
- **Honest declarations:** payee details, ads.txt and ad-request URLs must be accurate. "Information provided about a publisher's website (e.g., in the ads.txt file) … is inaccurate" is a policy violation. [GPP "Dishonest declarations"]

### 1.2 Minimum content (official wording versus community numbers)

The official text, verbatim [APP, answer 10015918]:

> "For your site to be ready to show AdSense ads, make sure that your pages have **enough unique content so that we can determine what your site is about**. You should provide content that gives your users a reason to visit and return to your site."
> "…ask yourself if it provides **substantial value and originality when compared to other sites covering similar subjects**."
> "If you have many pages that are similar or have very similar content, consider **expanding each page or consolidating the pages into one**. Also, try to minimize repeating long segments of text in different pages of your site…"

The Publisher Policies say [GPP "Inventory value"]:

> "We do not allow Google-served ads on screens: without publisher-content or with low-value content, that are under construction, that are used for alerts, navigation or other behavioral purposes."
> "…with more ads or other paid promotional material than publisher-content."
> "…with embedded or copied content from others without additional commentary, curation, or otherwise adding value to that content."

**Google publishes no official page count or word count.** Community consensus for 2025-2026 [COMM: battersea, HowGamersGame, SIB]:

- 15-25+ substantive pages.
- A tool page with only the widget and no explanation is the classic "low value content" failure. Google's own guidance says it expects "how the calculation works, who should use the tool, examples, and guidance" [SIB: adsenseaudit/adstimate].
- Reviewers look for **information gain, not word count** [SIB security-misc #22].

**Recommendation for this site at the moment of applying:**

- 30-40 fully built tool pages, each with 1,000-1,800 words of tool-specific content (§4). Every page must be complete; no stubs.
- Plus 8-12 standalone guides of 800-1,500 words each, linked both ways with the tools. [COMM: ZenPDF shipped 12 guides of 792-1,123 words specifically for review]
- Plus About, Contact, Privacy, Terms, Disclaimer and Cookie pages.
- Hold AI-drafted text back until a human has read it. "AI-flavoured filler is exactly the rejection vector a human read is the cheap defence against." [COMM: ZenPDF]

### 1.3 Required and expected pages

| Page | Status | Must contain |
|---|---|---|
| **Privacy Policy** | **Mandatory by policy** [GPP "Privacy disclosures"] | It must "clearly disclose any data collection, sharing, and usage that takes place as a consequence of your use of Google products… including… cookies, web beacons, IP addresses, or other identifiers", and it must disclose "that third parties may be placing and reading cookies on your users' browsers, or using web beacons or IP addresses to collect information as a result of ad serving". Google offers the option of "a prominent link to *How Google uses data when you use our partners' sites or apps*". Full draft in §5. |
| **About** | Expected (E-E-A-T, "misleading representation" policy) | Who runs the site (a real name or legal entity), why it exists, how tools are built and tested, the editorial and review process, country. A two-sentence About page is a known failure. [COMM: battersea] |
| **Contact** | Expected | A working mailbox on your own domain (not a decorative form), expected response time, and a postal/business country if possible. [COMM: Koobrain flagged its "decorative" contact form] |
| **Terms of Use** | Strongly recommended | Acceptable use, no warranty, limitation of liability, IP, governing law. |
| **Disclaimer** | Strongly recommended for a tools site (YMYL calculators) | General "as-is" wording plus health, finance and entertainment sections (§5). |
| **Cookie Policy / "Privacy choices" link** | Recommended (EEA/UK/US-state) | Cookie list, CMP re-open link, CCPA "Do Not Sell or Share" link if the US-states message is enabled. |
| **Custom 404** | Recommended | Carries no ads, links back to categories. |
| **Category hubs + /tools index** | Expected (navigation) | Unique intro of 150-400 words per category. No duplicate aliases rendering the home page. [COMM: Koobrain lost points for `/tools`, `/pdf` and `/calculator` all rendering Home] |

**Hard-code the "Last updated" dates.** Dynamic `new Date()` legal dates "look automated". [COMM: Koobrain]

### 1.4 Navigation and user experience (checked at review)

From [APP 10015918], verbatim points:

- An accessible navigation bar, checked for "Alignment, Readability, Functionality, Accuracy".
- "Make sure that your site provides the information and service promised and does not have links that lead to: false claims of downloadable or streaming content; missing pages; irrelevant or misleading pages; text on a page not related to the theme or business model of the site."
- "Ensure that your site appears correctly in different browsers."

[APP "Site behavior"]: "Sites showing Google ads should be easy for users to navigate. Sites may not change user preferences, redirect users to unwanted websites, initiate downloads, include malware or contain pop-ups or pop-unders that interfere with site navigation."

[SPAM "Malicious practices"], new since the 2025-26 wording: **"Back button hijacking is when a site interferes with user browser navigation by manipulating the browser history…"** → never use `history.pushState` tricks or "are you sure you want to leave" traps on tool pages.

Practical checklist:

- Zero broken internal links.
- No "coming soon" tools in the nav or sitemap.
- No login walls.
- Every sitemap URL returns 200 and is linked from somewhere.
- Crawlable server-rendered prose. Static generation is fine; text that appears only after hydration can read as empty. [COMM: ZenPDF, the-last-dance]

### 1.5 Site age: myths and facts

- **Fact:** Google states no global minimum site age. The official flow is: add the site → connect → "Request review" → "The review process usually takes a few days", and results are reported in the account [APP 10015918]. Community reports put decisions at 1-3 weeks, sometimes longer. [COMM: battersea]
- **Myth:** "the domain must be 6 months old everywhere". This is not in any current Google policy text I retrieved.
- **Practical fact:** a site that Google has not yet indexed gives the reviewer little to evaluate. Tool sites in 2026 consistently report better results after waiting for indexing:
  - Calcuzy waited 7-14 days after requesting indexing.
  - the-last-dance waited 2-4 weeks after restructuring.
  - ZenPDF: "Applying the week the content ships is a known way to collect this rejection."
- **Recommendation:** apply once Search Console shows **≥25-30 content URLs indexed** and some organic impressions. That is typically 3-8 weeks after launch for a new domain.

### 1.6 Country-specific rule (6-month rule)

- **Historical Google rule [K]:** for publishers in **China and India**, Google required the site to have been "active for at least 6 months" before approval. Community pages written in 2025-2026 still repeat it ("Some regions require domains to be registered for at least 6 months (e.g., India/China)", chloeekk.github.io post found via GitHub search).
- **Status on 2026-09-29: UNVERIFIED.** The live eligibility page (support.google.com/adsense/answer/9724 and related) could not be fetched. Treat it as **possibly still enforced**.
- **Action:**
  - If the payee address is in India or China, plan for a domain/site at least 6 months old, or verify the current wording in AdSense Help from a normal browser before applying.
  - Other countries, including Pakistan, US, UK, CA, AU and EU, have no age rule in the retrieved text. Reviews of sites from high-application-volume countries are anecdotally stricter, so apply only with a complete site.

### 1.7 Traffic expectations

- **Officially there is no traffic minimum.** [COMM: ZenPDF, "no traffic minimum"]
- Traffic **quality** is enforced from day one [APP]:
  - "Publishers may not click their own ads or use any means to inflate impressions and/or clicks artificially, including manual methods."
  - "…may not participate in paid-to-click programs, send unwanted emails or display ads as the result of the action of any software application."
- Do not buy traffic, use traffic exchanges or autosurf, or ask friends to click.
- **Ad serving limits** can hit brand-new accounts while Google assesses traffic. They lift only with continued valid traffic. Swapping ad code or opening a new account makes it worse. [GATE, answer 9437976]

### 1.8 ads.txt

- The exact line, from the AdSense account:
  ```
  google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
  ```
  It must be served at `https://toolkitjar.com/ads.txt` (root domain, HTTP 200, text/plain, crawlable). [GATE, answer 12171612]
- Google calls it "highly recommended", not mandatory for approval. **Once a domain publishes ads.txt**, "You must not place Google-served ads on a domain that uses ads.txt where you are not included as an authorized seller." [GPP "Authorized inventory"]
- A missing, stale or malformed file silently removes demand. Changes take "several days", and up to about a month on low-traffic sites. After the file is stable, press "Check for updates" once rather than rotating lines. [GATE; COMM: TORQYX]
- A comment-only placeholder ads.txt before approval is acceptable (current project state). Replace it with the real line the day the publisher ID exists. Accuracy matters: a wrong ID counts as a "dishonest declaration". [GPP]
- Optional: `OWNERDOMAIN=toolkitjar.com`. Add `MANAGERDOMAIN` only if a real manager exists. [COMM: FlipMyCase]

### 1.9 Consent (CMP) for EEA, UK and Switzerland, plus US states

Facts [CMP]:

- **EEA + UK:** a **Google-certified CMP integrated with the IAB TCF** has been required to serve *personalized* ads since **16 Jan 2024**.
- **Switzerland:** the same requirement since **31 Jul 2024**.
- Traffic without a certified CMP falls back to non-personalized or limited ads, which means much lower revenue. The Policy Center shows warnings such as "No CMP", "CMP not certified" or "Low coverage". [COMM: NovaTools]
- **TCF v2.3:** TC strings generated after **1 Mar 2026** must follow TCF v2.3. [TCF23] Google's own CMP handles this automatically. A self-built banner cannot.
- **Google's own CMP** (AdSense → Privacy & messaging → European regulations) **is a Google-certified CMP and satisfies Google's requirement.** It is free, and it loads through the AdSense tag, so no extra script is needed. The project's LAUNCH_CHECKLIST statement is correct.
  - Caveat: "Google explicitly says its CMP certification does **not** prove full compliance with the TCF or with applicable privacy laws." [CMP] Legal responsibility for the message stays with the publisher.
- **A custom "Accept/Decline" banner is NOT a certified CMP.** It must not claim to control ad consent. Use it only for non-ad purposes (for example analytics), or better, drop it and let Google's CMP message cover both. Showing two banners that both ask about ads is a known bad pattern. [COMM: roznamcha, NovaTools]
- **Consent Mode v2** (`ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`) is needed if GA4 or Google Ads tags run. The defaults must be set to *denied* before any tag in the EEA/UK/CH. Google's CMP can drive Consent Mode (answer 16088460). [CMP]
- **US states:** Privacy & messaging can show a US-state-regulations message ("Do Not Sell or Share"). Google does *not* require it, but a US-heavy traffic target (CA, CO, VA, CT and others) makes it prudent. GPP is not accepted as a substitute for TCF in the EEA. [CMP]
- **Message design:** keep "Consent / Do not consent / Manage options" all visible. No pre-ticked boxes. "Continuing to browse is not consent". [CMP; COMM: NovaTools]
- **Test** the EEA message with `?fc=alwaysshow&fctype=gdpr`. [CMP]
- **Children:** the site is a general audience, not directed at under-13s. State that in the privacy policy. If a section is ever child-directed, tag it for child-directed treatment (COPPA). [GPP]

### 1.10 What "Low value content" means in practice for tool pages

It is the dominant rejection for tool and calculator sites in 2025-2026 [SIB; COMM: Calcuzy, calculatorsallinone, CalcuMake, the-last-dance, Koobrain]. Observed causes:

1. **A UI-only tool page**: widget, 2 lines of text, FAQ.
2. **Near-duplicate template pages**, for example 12 state electricity pages or "X to Y" pairs sharing 90% of their text. calculatorsallinone consolidated 12 into 1.
3. **Thin list/aggregation pages**, such as holiday countdowns, quote lists and name lists. Calcuzy noindexed them.
4. **Duplicate routes**: several URLs rendering the same page.
5. **Few pages overall**. CalcuMake had about 5 public pages.
6. **Machine-generated subdomains/pages indexed**: coverage reports, storybook, docs mirrors.
7. **Inaccurate or overclaiming copy**. Calcuzy removed "cryptographically secure" claims that were not true. calculatorsallinone removed invented tax assumptions and "AdSense-readiness" copy.
8. **Weak trust signals**: no real About or Contact, no author.

Fixes the remediators used successfully:

- Consolidate and noindex the weak pages.
- Add formulas, worked examples, limitations and authoritative sources.
- Keep one ad slot per page until approved.
- Add YMYL disclaimers.
- Add a founder identity on the About page.
- Wait for a recrawl, then request review **once**. Premature re-requests "waste review cycles". [COMM: the-last-dance]

### 1.11 What the other rejection notices usually mean for a tool site on Vercel

| Notice | Typical real cause on a Next.js/Vercel tool site | Fix |
|---|---|---|
| **Site down or unavailable** | 1. Wrong URL submitted (www vs root mismatch, http, trailing path). 2. Vercel Firewall / Attack Challenge Mode / bot protection blocking `Mediapartners-Google` or `Google-Display-Ads-Bot`. 3. `robots.txt` disallowing Google's ad crawler. 4. DNS not propagated, or an expired or unconfigured domain. 5. 5xx under concurrent crawler load (roznamcha saw 503s when 5 agents hit at once). 6. Geo-blocking. 7. Deployment Protection accidentally on the production domain. | `curl -A "Mediapartners-Google" https://toolkitjar.com/` must return 200 with full HTML. Keep `robots.txt` open (optionally an explicit `User-agent: Mediapartners-Google` / `Allow: /`). Don't enable challenge modes during review. [COMM: Koobrain, roznamcha, TORQYX] |
| **Not found / couldn't verify site** | AdSense code or `google-adsense-account` meta tag missing on the submitted domain. A subdomain submitted. ads.txt verification pending. | Put the meta tag in `<head>` on every page. The meta tag alone sets no cookies. Submit the root domain. |
| **Policy violation(s)** | Content in a prohibited category (§2): video downloaders, "unlock/crack" tools, fake document generators, copyrighted media galleries, misleading functionality (a tool that doesn't work, or leads users to ads instead of the promised function). | Remove or noindex the offending tool entirely (not just its ads), then request review. |
| **Site behaviour: navigation** | Broken menu on mobile, dead links, missing pages, "coming soon". | Link check. Remove unbuilt tools from nav and sitemap. |
| **Valuable inventory: no content / under construction** | Pages with only UI, empty category pages, placeholder copy. | See §4. |
| **Low value content** | See §1.10. | See §1.10. |

---

## 2. Risky or forbidden tool types

Policy anchors [GPP], verbatim:

- **Enabling dishonest behavior:**
  - "helps users to mislead others. Examples: **Creating fake or false documents such as passports, diplomas, or accreditation; sale or distribution of term papers, paper-writing or exam-taking services**; information or products for passing drug tests"
  - "promotes any form of **hacking or cracking** and/or provides users with instructions, equipment, or software that tampers with or provides unauthorized access to devices, software, servers, or websites. Examples: …products or services that **bypass copyright protection, including circumvention of digital rights management** technologies; …pages that **assist or enable users to download streaming videos if prohibited by the content provider**"
  - "enables a user… to **track or monitor another person** or their activities without their authorization"
- **Misleading representation:** "falsely implies having an affiliation with, or endorsement by, another individual, organization, product, or service. Examples: Impersonating Google products, misusing company logos"
- **Unreliable and harmful claims:** "promotes harmful health claims, or relates to a current, major health crisis and contradicts authoritative scientific consensus"
- **Sexually explicit:** "…site or app that claims to generate **deepfake pornography**"
- **IP abuse:** "infringes copyright"
- **Search spam policies apply to monetized screens** [GPP]. [SPAM "Misleading functionality"]: "A site with a **fake generator that claims to provide app store credit**…" and "A site that claims to provide certain functionality (for example, **PDF merge, countdown timer**, online dictionary service), but intentionally leads users to deceptive ads rather than providing the claimed services"
- **[SPAM "Machine-generated traffic"]:** "scraping results for rank-checking purposes or other types of automated access to Google Search conducted without express permission" violates the policies and the Google ToS.
- **Restricted (not prohibited)** [GATE, answer 10437795]: gambling, alcohol, tobacco, recreational drugs, prescription drugs, weapons and some sexual/shocking themes get fewer ads or none.
- **Sensitive categories for personalized ads** [GPP "Personalized advertising"]: health, negative financial status, sexual orientation and others. Pages on these topics get lower-paying, contextual-only demand.

| Tool type | Risk | Why | Mitigation / framing |
|---|---|---|---|
| YouTube / Instagram / TikTok / Facebook video, reel, story or audio downloader | **forbidden** | GPP: "pages that assist or enable users to download streaming videos if prohibited by the content provider". Also platform ToS. | Do not build. Project hard exclusion. |
| YouTube / social thumbnail downloader or "profile picture viewer" | **high** | Copyrighted images fetched from third parties. Platform ToS. Scraping. | Exclude. Offer a **thumbnail *size checker / previewer* for the user's own upload** instead. |
| Proxies, unblockers, "watch blocked sites", VPN-in-browser | **forbidden** | Circumvention; abusive traffic; hacking/cracking. | Do not build. |
| Paywall remover, "read Medium/NYT free", Chegg/Course Hero unlocker | **forbidden** | DRM/copyright circumvention plus academic dishonesty. | Do not build. |
| PDF password remover / "unlock PDF" | **high** (medium if tightly framed) | Reads as "cracking". | Only "remove a password **you know** from your own PDF" (the user types the password). Never brute-force. Defer past approval. |
| MD5/SHA "decrypt", hash cracker, JWT secret brute-forcer, WiFi password tools, port scanner, ping/DDoS "stress tester" | **forbidden / high** | Hacking/cracking. | Offer hash **generation**, JWT **decoding** and password **strength** tools only. [SIB developer.md] |
| Fake ID, fake passport, diploma/degree, doctor's note, fake bank statement, fake pay stub | **forbidden** | Fake documents (verbatim GPP example). | Do not build. |
| Receipt generator, cheque/check writer, fake invoice "for reimbursement" | **high → exclude** | Widely used for expense fraud. | Exclude receipts and cheques. A plain **invoice generator for your own business** is low-medium; see below. |
| Invoice / quote generator (own business) | **low-medium** | Legitimate SMB use. | Do not market it as "fake" or "novelty". Add "for your own genuine transactions" in the terms and page copy. No brand templates (no Amazon/Uber look-alikes). |
| Fake tweet / iMessage / WhatsApp chat / Instagram post generator | **high** | Misrepresentation, impersonation, trademark misuse. | Skip. At most a brand-free "quote card maker". [SIB social-creator.md] |
| Signature generator | **medium** | Forgery framing risk. | Frame it as "create your own e-signature image for documents you sign". Never "copy someone's signature". |
| Essay writer, "do my homework", paper generator, exam answers | **forbidden** | "sale or distribution of term papers, paper-writing or exam-taking services". | Do not build. |
| AI paraphraser marketed as "bypass AI detectors / Turnitin", "AI humanizer / undetectable AI" | **high** | Enabling dishonest behavior. Also needs a paid API, so infeasible at launch. | Skip. Any rewriting tool must be framed for one's own text and clarity, never evasion. |
| AI content generators (article writer, blog generator) | **medium** (roadmap only) | Needs a paid API. Encourages scaled content. Output pages could be "low value". | If ever built: generate for the user only, never publish generated pages on our site, and add "review before use" copy. |
| AI text detector | **medium** | "Unreliable claims": detectors are inaccurate, and high-stakes misuse (accusing students) is likely. Infeasible client-side. | Skip at launch. If built later: prominent accuracy disclaimer, "never use as sole evidence". |
| Plagiarism checker (web search) | **infeasible** (paid API) | n/a | Build a client-side **"compare two texts / similarity checker"** instead (low risk). Never claim a web-wide plagiarism scan. |
| Grammar / spell checker | **low** | Allowed. The only risk is overclaiming accuracy. | A client-side dictionary or rules engine. State its limits. Don't claim "Grammarly-level". |
| Text to handwriting | **medium if mis-framed** | Competitors market it as "make assignments look handwritten". | Frame it as notes, cards, mockups and font demos. |
| Password generator / passphrase / PIN / strength checker | **low** | Legitimate security tools. | Use `crypto.getRandomValues`. Say "generated locally, never sent". Don't overclaim "unhackable". Calcuzy was flagged for a false "cryptographically secure" claim. |
| What is my IP / IP lookup | **low policy risk** (server-light) | Needs an external service. It displays the user's own IP. | Roadmap. Disclose in the privacy policy that the IP is processed to show it. Show only coarse geo. |
| WHOIS / RDAP / DNS lookup | **low** (server-light) | Legit domain tools. | Roadmap. Show only registrar/RDAP data. Redact personal registrant data. Rate-limit. |
| Email extractor | **medium** (web) / **low** (pasted text) | Harvesting-for-spam framing. | Only extract from text the user pastes. Never "scrape emails from websites". |
| Phone number / email "owner lookup", people finder, GPS / phone tracker | **forbidden / high** | Tracking another person without authorization (GPP). | Do not build. |
| Fake name / fake address / credit-card number generator | **medium-high** | Fraud adjacency ("fake credit card", "fake address for verification"). | Build a **"Test / Mock Data Generator"** for developers only. No card generator. A Luhn **validator** is fine. [SIB developer.md] |
| "Free followers / likes / Robux / V-Bucks / gift card / app-store credit generator" | **forbidden** | Search spam "fake generator" plus deceptive practices. | Never. A neutral Robux↔USD **converter** is medium (trademark); add a "not affiliated with Roblox" note and no logos. |
| Instagram/TikTok follower counters, engagement calculators needing scraping | **high** (ToS) | Scraping platforms. | Only calculators that use numbers the user types in (engagement-rate calculator = low). |
| Rank checker, Google SERP scraper, keyword volume scraper, index checker, autocomplete scraper | **high** (Google ToS; spam policy "machine-generated traffic") | Automated queries to Google. | Do not build. SERP **preview** from pasted text is low risk. [SIB seo.md] |
| Backlink generator / "backlink maker", link cloaker, URL shortener | **medium-high** | Link-spam facilitation; shorteners are abused for phishing and need a server. | Skip. |
| Temp mail / disposable email | **high** | Needs a server. Abuse and fraud vector. | Skip. |
| Face swap, deepfake, "nudify", "remove clothes" | **forbidden** (sexual deepfake) / **high** (general face swap) | GPP sexually explicit plus misrepresentation. | Never. A background remover or blur-face (privacy) tool is fine. |
| Meme generator with copyrighted template gallery | **medium** | IP / copyright. | User-upload only, no bundled copyrighted images. [SIB image-media.md] |
| Lottery number generator, betting odds / parlay / arbitrage calculator, casino tools | **high** (restricted → few or no ads) | Gambling is a restricted category; personalized ads are barred on gambling sites. | Exclude. Keep a neutral "random number generator". Never frame it as "lucky numbers". [SIB] |
| Crypto profit / mining / "get rich" calculators | **medium** | "Get Rich Quick" deceptive-claims examples; crypto ads are restricted. | Plain maths only (percentage gain, DCA average). No return promises. Finance disclaimer. |
| BMI, calorie, TDEE, body fat, macro, water intake, sleep, heart-rate zone | **low-medium** (YMYL) | Must avoid "harmful health claims". Health is a sensitive category, so personalized ads are limited and RPM is lower. Eating-disorder risk (very-low-calorie targets). | Health disclaimer (§5). Cite WHO/CDC/NIH formulas. Floor calorie targets (never output < 1,200 kcal women / 1,500 men without a warning). Neutral language. No "lose 10 kg in a week". |
| Pregnancy due date | **low** | Normal pregnancy resources are not in the sensitive fertility category. [SIB converters-calculators.md] | Health disclaimer. |
| Ovulation / fertility calculator | **medium** | Fertility is a sensitive category, so fewer and lower-paying ads. | Defer, or strict disclaimer. No contraception claims. |
| Loan, mortgage, EMI, compound interest, retirement, tax, salary, VAT/GST, inflation | **low-medium** (YMYL) | Accuracy matters. Personalized ads for credit are restricted in the US/CA, but contextual ads pay well. | Finance disclaimer (§5). Show the formula and assumptions. Date the tax rules. Let users enter the rates. No invented tax tables. [COMM: calculatorsallinone] |
| Love calculator, fortune / tarot / yes-no oracle | **low** | Entertainment. | "For entertainment only". Don't store names. |
| Screen / voice recorder | **low** | Legit. | No "record streams / DRM video / others without consent" language. |
| Media converters (MP4→MP3 of *user's own files*), image tools, PDF merge/split | **low** | Legit and client-side. | Process local files only. Never accept URLs of streaming platforms. The tool must actually work (spam "misleading functionality"). |
| EXIF viewer/remover | **low** | Privacy-positive. | Location data is shown locally and never uploaded; say so. |
| QR code generator / scanner, barcode | **low** | Legit. | Barcode: note that retail UPC/EAN requires GS1 registration. |
| Invisible character, fancy fonts, Zalgo, text repeater | **low** | Legit, but thin-content risk. | Explanatory content. No "spam your friends" or "bypass filters" copy. [SIB text-writing.md] |
| ID/passport photo maker | **low** | Crop tool. | "Verify requirements with the issuing authority". No document composition. [SIB image-media.md] |

---

## 3. Ad placement rules for tool pages

### 3.1 Policy text that matters (verbatim)

- **Ads interfering** [GPP]: "We do not allow Google-served ads that:
  - overlay or are **adjacent to navigational or other action items** and may lead to unintended ad interactions,
  - severely interfere with consumption of content including overlaying the content or **pushing the content off the display**,
  - are placed on a **'dead end' screen** where the user is not able to exit the screen without clicking the ad."
- **Encouraging clicks** [APP]: "publishers may not ask others to click or view their ads or use deceptive implementation methods to obtain clicks or views. This includes… offering compensation to users for viewing ads… or **placing images next to individual ads**."
- **Deceptive site navigation** [APP]: "Publishers may not use deceptive implementation methods that place ads in a way that might be **mistaken for menu, navigation or download links**… This includes… False claims of streaming content, or downloads… **Pages where ads are implemented in placements that are intuitively meant for navigation.**"
- **Ad placement** [APP]: "AdSense code may not be placed in inappropriate places such as **pop-ups, emails or software**."
- **Ad behavior** [APP]: modifications to ad code are allowed only if they do not "artificially inflate ad performance or harm advertisers". This rules out auto-refresh on timers, hidden or overlapped units and forced clicks. [GATE, answer 1354736]
- **Inventory value** [GPP]: no ads on screens "used for alerts, navigation or other behavioral purposes". For tools this means **no ads on "Processing…", "Your file is ready", confirmation, error or empty-state screens**. [COMM: formatho spec]
- **More ads than content** [GPP]: prohibited per screen.
- **Better Ads Standards** [GPP requires conformance; list from [K]; betterads.org was blocked]:
  - **Desktop:** pop-up ads; auto-playing video ads with sound; prestitial ads with countdown; large sticky ads (more than about 30% of the screen).
  - **Mobile:** pop-up ads; prestitial ads; **ad density over 30%** of the main content's vertical length; flashing animated ads; auto-playing video with sound; postitial ads with countdown; full-screen scrollover ads; large sticky ads (more than 30% of the screen).
  - Chrome's built-in ad filter enforces these standards against non-compliant sites.
- **Ad placement policies article (1346295)** [K, re-check live]:
  - Ads must not be placed under misleading headings such as "Resources" or "Useful links".
  - Label ads only as "Advertisements" or "Sponsored links".
  - Don't place ads in a way that pushes content below the fold on mobile.
  - No ads floating over content.
  - A 300×250 above the fold on mobile is allowed only when real content is still visible. [COMM: battersea]
- **Google Search "intrusive interstitials"** [K]: ranking demotion for mobile interstitials that hide content. Google's own Auto-ads vignettes (shown between page loads, dismissible) are designed to comply, but disable them until after approval.

### 3.2 Specific don'ts for interactive tools

1. **No ad between the input and the output**, or anywhere inside the tool card.
2. **No ad within ~100 px (minimum 48 px) of an action control**: Convert, Generate, Copy, Download, Upload/dropzone, Reset, file pickers, tabs, pagination. Google's rule is qualitative ("adjacent… may lead to unintended interactions"). Use 100 px on mobile to be safe. [COMM: formatho uses 48 px; NovaTools: "no ads near input, dropzone, copy, download, run buttons"]
3. **No ad directly under a "Download" button**, and no ad unit that appears where the result appears after processing (layout shift turns the next tap into an ad click). Reserve ad heights with CSS `min-height` so there is no CLS.
4. **No ad styled like, or sitting beside, text such as "Download", "Start", "Next", "Continue", "Click here".** No arrows or icons pointing at ads. No "support us by clicking our sponsors".
5. **No ads in modals, dialogs, toasts, the result-download screen, the processing spinner, 404/error pages, or the empty state.**
6. **No ads on legal/trust pages** (Privacy, Terms, Cookie, Contact, About, Disclaimer). Use AdSense *Page exclusions* if Auto ads are on. [COMM: NovaTools, formatho, Koobrain]
7. **No auto-refresh, no ads in iframes, no ads in `position: fixed` custom containers.** Let Google's anchor format handle sticky ads, if any.
8. **SPA navigation (Next.js):** push a new `adsbygoogle` slot once per real page view. Never re-push on a timer or on every tool interaction.
9. **Never click your own ads.** In development use `data-adtest="on"` on units.
10. **Do not hide ad containers with CSS** after the ad code runs. Render the container only when the slot ID exists and the page is eligible. [COMM: formatho, NovaTools]

### 3.3 Recommended safe layout for a tool page

**Phase A: during review and the first 2-4 weeks after approval.** One or two manual units, or Auto ads at a low setting with anchor, vignette, side rail and intent-driven formats off. [COMM: Calcuzy used max 1 slot/page until approved; NovaTools: low/medium load, anchor/vignette off initially]

```
DESKTOP (≥1024px)                                  MOBILE (<768px)
┌──────────── header / nav ────────────┐           ┌──── header / nav ────┐
│ breadcrumb                            │           │ breadcrumb            │
│ H1 + one-sentence summary             │           │ H1 + summary          │
│ ┌───────── TOOL CARD ──────────────┐  │           │ ┌──── TOOL CARD ────┐ │
│ │ inputs · options · [Action]      │  │           │ │ inputs · [Action] │ │
│ │ output · [Copy] [Download]       │  │           │ │ output · [Copy]   │ │
│ └──────────────────────────────────┘  │           │ └───────────────────┘ │
│   ≥100px gap / "How to use" steps     │           │ "How to use" (≥1 para)│
│ ┌ "Advertisement" label ───────────┐  │           │ ┌ Advertisement ────┐ │
│ │ AD 1: responsive horizontal      │  │           │ │ AD 1: responsive  │ │
│ └──────────────────────────────────┘  │           │ └───────────────────┘ │
│ What it is / how it works             │           │ What it is / how...   │
│ Worked examples · reference table     │           │ Examples · table      │
│ ┌ Advertisement ───────────────────┐  │           │ Use cases · tips      │
│ │ AD 2: in-article (after ~50%)    │  │           │ ┌ Advertisement ────┐ │
│ └──────────────────────────────────┘  │           │ │ AD 2: in-article  │ │
│ Use cases · tips · limitations        │           │ └───────────────────┘ │
│ FAQ · disclaimer · sources            │           │ FAQ · disclaimer      │
│ Related tools (plain links)           │           │ Related tools         │
│ AD 3 (optional, multiplex) above foot │           │ (AD 3 only if article │
└──────────── footer ───────────────────┘           │  > ~1,500 words)      │
                                                    └──── footer ───────────┘
```

Rules for this layout:

- **Nothing above the tool.** The tool is the content users came for. It stays fully visible without scrolling at 360×640.
- **Maximum 3 manual units per tool page.** Keep at least 1 full mobile viewport of prose (about 400 px or more) between units. Keep mobile ad density well under 30%. [COMM: formatho]
- Every unit gets the small grey label **"Advertisement"** (allowed wording) and a neutral background. The label must not match the site's primary button colour or the result-card style.
- Related-tools blocks are plain internal links, visually distinct from ad units, and never interleaved with ads.
- **Phase B (after about 2 weeks of clean data):**
  - Optionally enable Auto ads anchor (mobile). It is Google-built and designed for <30% of the screen.
  - Optionally add a non-sticky desktop right-rail 300×600, below the fold of the tool column.
  - Change one variable at a time and watch Core Web Vitals and tool-completion rate. [COMM: NovaTools]
- **Vignettes/interstitials:** leave off for tool pages. A user who finishes a tool and navigates to the next tool is exactly when a vignette annoys.

---

## 4. Content guidelines (spam policies, helpful content, E-E-A-T, templates at scale)

### 4.1 Policies that apply to a 40-500-page tools site

- **Scaled content abuse** [SPAM, verbatim]: "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users. This abusive practice is typically focused on creating large amounts of unoriginal content that provides little to no value to users, **no matter how it's created**." Examples:
  - "Using generative AI tools or other similar tools to generate many pages without adding value for users"
  - "Scraping feeds, search results… (including through automated transformations like synonymizing, translating…)"
  - "Stitching or combining content from different web pages without adding value"
  - "Creating multiple sites with the intent of hiding the scaled nature of the content"
  - "Creating many pages where the content makes little or no sense to a reader but contains search keywords"
- **Doorway abuse** [SPAM]: many pages targeting near-identical queries that funnel to one destination. Example: 200 "X kb to Y kb" pages that all host the same compressor with swapped numbers.
- **Misleading functionality** [SPAM]: every tool must actually work. Don't publish pages for tools that aren't built yet.
- **Thin content manual action** [APP / Search Console help]: "Google has detected low-quality pages or shallow pages… Thin affiliate pages; content from other sources… Doorways". Fixing only some pages does not lift it.
- **Enforcement context 2025-2026** [SIB]: waves in Jan 2025, the Aug 2025 spam update, and the **March 2026 core update**. Template-heavy sites were reported losing 50-90% of traffic.
- **AdSense duplicate-content guidance** [APP 10015918]: "Also ensure that the same content is not duplicated in the same page or across multiple pages of your site… **instead of including lengthy copyright text on the bottom of every page, include a very brief summary and then link to a page with more details.**" This applies directly to the repeated privacy and disclaimer blocks on tool pages. Keep them short and link out.

### 4.2 Helpful-content and E-E-A-T signals for a tools site

**Who** (visible authorship):

- A real person or entity named on the About page, a short "Built and reviewed by …" line on each tool page, and an author page. The roznamcha audit warned that expertise claims must be real and verifiable. Never invent credentials. Fake authors, diplomas, reviews or ratings are a deceptive practice. [COMM: NovaTools "forbidden methods"]

**How** (process transparency):

- A "How we build and test our tools" section on the About page, covering: runs in your browser, test cases, formula sources, and a changelog.
- On each tool: "Formula/standard used", "Last reviewed <date>", "Report an error" link.

**Why** (people-first):

- Each page answers the searcher's full task: do it, understand it, avoid mistakes, what next.
- No filler intros ("In today's digital world…").

**Experience**:

- Original screenshots or diagrams of *this* tool.
- Real worked examples computed by the tool.
- Test cases, edge cases actually encountered, and comparisons against the spec (for example the RFC or the ISO standard).

**Trust**:

- HTTPS, a working contact mailbox on the domain, an accurate privacy policy (no "we collect nothing" if AdSense runs), a disclaimer, fast pages (LCP ≤2.5 s, INP <200 ms, CLS <0.1).
- No overclaims ("100% accurate", "military-grade").

**Freshness**:

- Change `dateModified` only on real edits. Automated "today" dates look fake. [COMM: Koobrain]

### 4.3 Making 40-500 templated pages NOT read as thin or duplicative

1. **Shared boilerplate stays under about 15% of each page's main content.** Privacy note, disclaimer and related-tools are short components that link out.
2. **Every page has unique, tool-specific data**: formulas, spec tables, limits (for example platform character limits), unit definitions, algorithm steps, error messages. Generic sentences with the tool name swapped in are the failure pattern.
3. **Every page's FAQ comes from that tool's own People-Also-Ask questions and long-tails** (see `text-writing.md` §5, `seo.md` §5). No shared FAQ questions across pages.
4. **Worked examples use real values computed by the tool.** At least 2 per page, different inputs, showing edge cases.
5. **One strong page per intent.** Variants (for example "compress image to 100kb") get their own page **only** when the SERP shows dedicated pages ranking **and** the page has distinct content (use case, platform limits, a different default preset). Cap this at a hand-written handful per tool, and noindex or consolidate the rest. [SIB converters-calculators.md; COMM: calculatorsallinone consolidated 12→1]
6. **No programmatic pages at scale** (per-hex-colour, per-number, per-city). Curate a few hundred at most, each with unique data. [SIB design-color-css.md]
7. **AI-assisted drafting is allowed only with human edit and fact-check.** Google's rule is method-agnostic; the value is what counts. Add first-hand test notes that an LLM couldn't know, for example "we tested 50 JPGs from an iPhone 15…".
8. **Publishing cadence:** steady quality beats volume. The LAUNCH_CHECKLIST suggestion of "4-8 tools per week" is fine only if each meets the full template. Never bulk-publish 100 pages in a day on a new domain.
9. **Category hubs** get unique 200-400-word intros plus curated tool lists. No near-empty category pages.
10. **Keep a uniqueness check in the build.** Compute shingle/Jaccard similarity of each tool article's main content against all others. Fail the build above about 30% overlap, and fail it if unique words are below 900.

### 4.4 Recommended per-page structure (tool page)

| # | Section | Purpose | Target words | Must be unique? |
|---|---|---|---|---|
| 1 | H1 + one-sentence summary (what it does, for whom, "runs in your browser") | Intent match, SERP snippet | 25-50 | Yes |
| 2 | Tool widget (labels, placeholders, sample-input button, clear errors) | The service promised | UI text | Yes (tool-specific UI) |
| 3 | How to use [tool] (numbered steps, 3-6) | Task completion | 80-150 | Yes |
| 4 | What is [X] / how the tool works (formula, algorithm, standard, spec reference) | Expertise, information gain | 200-350 | Yes |
| 5 | Worked examples (2-3, real inputs → outputs, one edge case) | Experience, verifiability | 150-300 | Yes |
| 6 | Reference table (limits, conversions, platform specs, common values) | Unique data, featured snippets | 80-200 (table) | Yes |
| 7 | Common use cases / who uses it | People-first relevance | 100-180 | Yes |
| 8 | Tips, common mistakes, limitations and accuracy notes | Trust, honesty | 100-200 | Yes |
| 9 | Comparison / alternatives (for example "X vs Y", when to use another tool on our site) | Internal linking, completeness | 60-150 | Yes |
| 10 | Privacy note ("processed locally; nothing uploaded"), linking to the privacy policy | Trust | 25-50 | No (short shared component) |
| 11 | FAQ, 4-6 questions from this tool's PAA | Long-tail coverage | 200-350 | Yes |
| 12 | Disclaimer (YMYL tools only: health, finance) | Policy/YMYL safety | 40-80 | Template (short) plus 1 tool-specific sentence |
| 13 | Sources and "Last reviewed <date> by <name>" | E-E-A-T | 15-60 | Yes |
| 14 | Related tools (3-6 curated links, not random) | Navigation | links only | No |
| | **Total unique prose** | | **≈1,100-1,800** | ≥85% unique |

Ad slots go only at the places marked in §3.3 (after section 3, mid-way through sections 4-8, optionally before the footer).

---

## 5. Draft disclosures (ready to adapt)

Replace `ToolkitJar`, `toolkitjar.com`, `hello@toolkitjar.com`, `[Owner name / legal entity]`, `[Country]` and `[DATE]`. Hard-code the date. The drafts are written for Google's requirements. **They are not legal advice.** Have them reviewed if you target the EEA/UK heavily or collect any personal data beyond what is described.

### 5.1 Privacy Policy (full draft)

```markdown
# Privacy Policy

Last updated: [DATE]

This Privacy Policy explains how ToolkitJar ("we", "us"), operated by [Owner name / legal entity], [Country], handles information when you visit https://toolkitjar.com (the "Site"). Contact: hello@toolkitjar.com.

## 1. The short version
- Our tools run **in your browser**. Text, files, images and numbers you enter into a tool are processed on your device and are **not uploaded to or stored on our servers**.
- We show ads served by **Google AdSense**. Google and its partners use cookies and similar technologies to serve and measure ads, as explained below.
- Visitors in the EEA, the UK and Switzerland are asked for consent through a Google-certified consent tool before cookies are used for personalised advertising.

## 2. Information we do not collect
We do not require accounts, and we do not collect the content you process with our tools. Some tools save your last settings in your browser's local storage for convenience. That data stays on your device and you can clear it at any time in your browser settings.

## 3. Information collected automatically
Like most websites, our hosting provider (Vercel Inc.) processes technical data needed to deliver the Site, such as IP address, browser type, device type, referring page and time of request, in server logs used for security and reliability. [If analytics is enabled:] We use [Google Analytics 4 / Vercel Web Analytics] to understand aggregate usage, such as which tools are popular. [GA4: Google Analytics uses cookies. Where consent is required, it runs only after you consent.] [Vercel Web Analytics: it does not use cookies.]

## 4. Advertising and cookies (Google AdSense)
We use Google AdSense to display advertisements. In connection with ad serving:
- **Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.**
- **Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this Site and/or other sites on the Internet.**
- Third parties, including Google, may place and read cookies on your browser, or use web beacons, IP addresses or other identifiers, to collect information as a result of ad serving on this Site. This information is used for purposes such as ad personalisation (where permitted), frequency capping, measurement, fraud and invalid-traffic prevention, and reporting.
- Even when ads are not personalised, cookies or other identifiers may still be used for frequency capping, aggregated reporting and combating fraud and abuse.
- Learn how Google uses information from sites that use its services: **How Google uses data when you use our partners' sites or apps** — https://policies.google.com/technologies/partner-sites
- More about Google's advertising technologies: https://policies.google.com/technologies/ads

### Your choices
- You can opt out of personalised advertising from Google by visiting **Google Ads Settings / My Ad Center**: https://adssettings.google.com (now at https://myadcenter.google.com).
- You can opt out of some third-party vendors' use of cookies for personalised advertising at **www.aboutads.info/choices** (https://optout.aboutads.info/) and the NAI opt-out page (https://optout.networkadvertising.org/).
- In the EU/EEA and UK, you can also use **www.youronlinechoices.eu** (https://www.youronlinechoices.eu/). In Canada: https://youradchoices.ca/choices.
- Other third-party vendors or ad networks may also serve ads on this Site. Their names and privacy links are listed in our consent tool (the "Manage options" / vendor list), and you may visit those vendors' websites to opt out of their use of cookies for personalised advertising where they offer it.
- You can block or delete cookies in your browser settings. Blocking cookies may affect how ads are shown.

## 5. Consent for visitors in the EEA, UK and Switzerland
We use a Google-certified consent management platform that is integrated with the IAB Transparency & Consent Framework. It asks for your consent before cookies or local storage are used for personalised advertising and related purposes. You can change or withdraw your choice at any time using the **"Privacy & cookie settings"** link in the footer of every page. If you do not consent, you may still see non-personalised or limited ads.
Legal bases (GDPR / UK GDPR): consent for advertising cookies and personalised ads; legitimate interests for site security, fraud prevention and basic, privacy-friendly service analytics where no consent is legally required.

## 6. US state privacy rights (for example California, Colorado, Virginia, Connecticut)
Advertising cookies may be considered a "sale" or "sharing" of personal information under some US state laws. You can opt out using the **"Do Not Sell or Share My Personal Information"** link in our footer [if the Google US-state message is enabled], through your browser's Global Privacy Control signal where supported, or through the opt-out links in Section 4. We do not knowingly sell personal information of consumers under 16.

## 7. Children
The Site is intended for a general audience and is not directed at children under 13 (or under 16 in the EEA/UK). We do not knowingly collect personal information from children.

## 8. Data retention and transfers
Server logs are kept by our hosting provider for a limited period for security purposes. Google and its partners retain advertising data according to their own policies. Data may be processed in the United States and other countries where our providers operate.

## 9. Your rights
Depending on where you live, you may have rights to access, correct, delete or restrict the processing of your personal data, to object to processing, and to withdraw consent. Because we do not keep accounts or tool inputs, we usually hold no personal data about you. For data held by Google, use the tools linked above. Contact us at hello@toolkitjar.com with any request. EEA/UK residents may also complain to their local data-protection authority.

## 10. External links
Our pages may link to other websites. We are not responsible for their privacy practices.

## 11. Changes
We will update this page when our practices change and revise the "Last updated" date above.
```

**Minimum Google-required elements, in case the policy is shortened:**

- The two bold sentences in §4.
- The web beacons / IP addresses / third-party cookies sentence.
- The partner-sites link.
- The opt-out links: Ads Settings, aboutads.info and youronlinechoices.

### 5.2 Cookie consent note (site-side text; the banner itself = Google Privacy & messaging)

Short footer and cookie-page text:

```text
Privacy & cookie settings — We and our advertising partners, including Google, use cookies and similar technologies to show and measure ads, and, with your consent where required, to personalise them. Our tools run in your browser; what you type or upload is not sent to our servers. You can change your choices at any time. [Manage settings] · [Privacy Policy]
```

Wire the footer link "Privacy & cookie settings" to re-open Google's CMP (`googlefc.callbackQueue.push(googlefc.showRevocationMessage)`). Do not build a second ad-consent banner.

Suggested wording for the Google Privacy & messaging EEA message, entered in the AdSense UI:

- Title: "ToolkitJar asks for your consent to use your personal data to:"
- Keep Google's standard purposes.
- Buttons: "Consent", "Do not consent", "Manage options", all visible.

### 5.3 General disclaimer (site-wide page, plus a 1-line version on tool pages)

```markdown
# Disclaimer

Last updated: [DATE]

The tools and content on ToolkitJar are provided free of charge for general information and convenience only. We work hard to make every tool accurate and we test them against published standards and worked examples, but we make no warranties, express or implied, about the completeness, accuracy, reliability or suitability of any result. Results depend on the inputs you provide and on the assumptions described on each page.

Always double-check important results before relying on them, and keep your own backups of any file you process. Any reliance you place on the Site is strictly at your own risk. To the fullest extent permitted by law, ToolkitJar and its operator are not liable for any loss or damage arising from the use of, or inability to use, the Site or its tools.

ToolkitJar is an independent website. Product names, logos and brands mentioned (for example Google, Instagram, YouTube or Microsoft) are the property of their respective owners and are used only to describe compatibility. Their use does not imply endorsement or affiliation.

The Site displays advertising from Google AdSense. Ads are clearly labelled "Advertisement" and are not endorsements.
```

One-line version for tool pages (a shared component, then link):

```text
Results are provided for general information only — please verify anything important. See our full [Disclaimer].
```

### 5.4 Health disclaimer (BMI, calorie, TDEE, body fat, due date, water, sleep, heart rate)

```text
Health information disclaimer: This calculator provides general estimates based on widely used formulas ([e.g., the Mifflin-St Jeor equation / the WHO BMI classification]). It is not medical advice and is not a substitute for diagnosis or treatment by a qualified healthcare professional. Individual needs vary with age, sex, body composition, pregnancy, medical conditions and medications. Do not start, stop or change a diet, exercise or medical plan based only on this result — talk to your doctor or a registered dietitian first. If you think you may have a medical emergency, contact your local emergency number immediately.
```

Add for calorie and weight-loss tools:

```text
Very-low-calorie diets can be harmful and should only be followed under medical supervision. If you are struggling with eating, support is available from organisations such as NEDA (US), Beat (UK) or your local health service.
```

For the pregnancy due-date tool:

```text
Due dates are estimates; only about 1 in 20 babies arrive on their estimated due date. Your midwife or doctor will confirm your dates, usually with an ultrasound scan.
```

### 5.5 Finance disclaimer (loan, mortgage, EMI, interest, tax, salary, retirement, crypto maths)

```text
Financial information disclaimer: This calculator is for illustration and educational purposes only and does not constitute financial, investment, tax, legal or credit advice. Results are estimates based on the figures and assumptions you enter (for example a fixed interest rate and on-time payments) and may not reflect fees, taxes, insurance, rate changes, rounding or lender-specific rules. Tax figures reflect the rules stated on this page as of [DATE] and may change. Actual loan offers, returns and tax liabilities will differ. Before making financial decisions, consult a licensed financial adviser, tax professional or your lender. Past performance does not guarantee future results.
```

Crypto add-on:

```text
Cryptocurrency prices are highly volatile and you can lose all of the money you invest. This tool performs arithmetic only and does not predict prices or returns.
```

### 5.6 Entertainment disclaimer (love calculator, yes/no wheel, name generators, fortune-style tools)

```text
For entertainment only. Results are generated at random or by a simple formula and have no scientific basis. Please don't make real-life decisions based on them. Names you enter are processed in your browser and are not stored.
```

### 5.7 Tool privacy note (shared component on every tool)

```text
Private by design: this tool runs entirely in your browser. Your [text / files / images] are processed on your device and are never uploaded to our servers. [Learn more in our Privacy Policy]
```

Only say this if it is literally true for that tool. Any server-light roadmap tool must say instead: "Your [URL/domain] is sent to our server only to fetch the result and is not stored."

---

## 6. Pre-application go/no-go checklist (synthesised)

- [ ] Production root domain on HTTPS. www→root redirect. No preview URLs submitted.
- [ ] 30-40 complete tool pages meeting §4.4, plus 8-12 guides, plus trust pages. No stubs, "coming soon" pages, duplicate routes or empty categories.
- [ ] No tool from the forbidden/high rows of §2 on the domain, including noindexed ones. Reviewers can still reach them.
- [ ] Search Console: sitemap "Success", ≥25-30 content URLs indexed, no manual actions, no security issues.
- [ ] `curl -A "Mediapartners-Google"` and `-A "Google-Display-Ads-Bot"` return 200 for home, a tool page and a category page. No Vercel challenge mode. `robots.txt` open.
- [ ] Privacy (with §5.1 wording), About (real identity), Contact (working domain mailbox), Terms, Disclaimer and Cookie pages are in the footer with hard-coded dates.
- [ ] `google-adsense-account` meta tag on all pages. ads.txt present (placeholder before the ID exists, exact line after).
- [ ] The custom cookie banner does not claim ad consent. Google Privacy & messaging EEA/UK/CH message is ready to publish; the US-states message is optional but recommended.
- [ ] YMYL tools carry the §5.4/§5.5 disclaimers, cite sources, and have no overclaims.
- [ ] Ad slots are disabled or limited to 1 per page until "Ready". Legal pages are excluded.
- [ ] Mobile check at 360 px and 414 px: tool fully visible, no overlap, CLS <0.1.
- [ ] Traffic is organic only. Nobody clicks the ads.
- [ ] After a rejection: record the exact wording and date, fix the root cause, wait for a recrawl (2-4 weeks), then request review **once**.

---

## 7. Notes on the existing project docs

- `docs/LAUNCH_CHECKLIST.md` §6: "Google's own consent tool is a certified CMP; nothing else needs to be installed" is **correct** for Google's requirement. Add a note that it is not a legal-compliance guarantee, and that any site-side banner must not duplicate ad consent.
- `docs/LAUNCH_CHECKLIST.md` §6: `NEXT_PUBLIC_ADSENSE_CLIENT` "adds the AdSense script … on every page". **Exclude** legal, contact and 404 pages from ad *units* (Page exclusions). The script itself may load site-wide because Google's CMP is delivered through it.
- `docs/LAUNCH_CHECKLIST.md` §7: "Keep publishing 4-8 tools per week". This is fine only if every page passes the §4.4 template and the uniqueness check (§4.3 point 10).
- Add to `ADDING_A_TOOL.md`: a YMYL flag that auto-inserts the health/finance disclaimer, a `lastReviewed` date field that is set only by humans, and a build-time duplicate-content check.
