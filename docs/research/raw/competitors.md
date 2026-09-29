# Raw research: competitor intelligence for free multi-tool websites

Research date: 2026-09-29
Role: competitive intelligence analyst (free online tools sites)
Model: this research run was executed on Claude Opus 5.5 (`claude-opus-5-5`).

## 0. Method, evidence quality and caveats (read first)

This run had less live web access than planned, so every claim below is tagged with its evidence type.

- **WebSearch: unavailable.** The session's search budget (200/200) had already been used by the sibling keyword researchers, so every WebSearch call was refused.
- **WebFetch and curl to competitor domains: blocked** by the environment's egress proxy. The blocked domains were smallseotools.com, prepostseo.com, 10015.io, rapidtables.com, indiehackers.com, reddit.com, web.archive.org, and 20 more checked with curl: tinywow, codebeautify, omnicalculator, calculator.net, it-tools.tech, onlinetools, pinetools, convertcase, wordcounter.net, jsonformatter, freeformatter, textfixer, iloveimg, 123apps, duplichecker, toolsaday and seomagnifier. As a result, **no competitor HTML was read directly in this run**, and the JSON-LD/schema statements in section 4 are not verified live.
- **What did work, and what this report is built on:**
  1. **[U] Cisco Umbrella Top-1M DNS popularity list** (downloaded 2026-09-29 by a sibling researcher; I re-queried it for 80 competitor domains). It gives a hard, current rank for relative size. Calibration, from sibling-captured Semrush figures: for developer-leaning domains, rank ~180-210k ≈ 1.5-4M visits/mo, ~300-450k ≈ 0.5-1.5M, and "unlisted" ≈ usually <300k. Consumer and student sites are under-ranked. For example, textfixer.com is unlisted but gets about 867K visits/mo.
  2. **[S] Semrush/Ahrefs/Similarweb figures captured verbatim from search-result snippets** by the sibling researchers earlier on 2026-09-29 (files in this folder: `seo.md`, `text-writing.md`, `converters-calculators.md`, `design-color-css.md`, `developer.md`, `image-media.md`, `social-creator.md`, `security-misc-utility.md`).
  3. **[G] GitHub-hosted research documents**, fetched with WebFetch from github.com/raw.githubusercontent.com and cloned with `git clone`:
     - `minalGoel/micro-tools/project_planning/source_files/` holds deep-research reports that cite Ahrefs/Semrush/Similarweb pages and Reddit threads. The ones used here: "SEO Reality for Tool Pages in 2026", "Real 2026 RPM Benchmarks", "RPM and Affiliate Monetization Reality", "Post-March 2026 Google Spam Update", "2026 AEO GEO Realities", "Moats in Web Tool Companies", and "User Behavior".
     - `iamadityaanjana/opentools/docs/seo/competitive-analysis.md` (SERP sampling dated 2026-07-10).
     - `ksjpswaroop/boring-sites` (YouTube-derived case studies; **low credibility**, see §5).
  4. **[OSS] Cloned source of open-source tool sites:**
     - it-tools: 90 tool folders in `src/tools`, 40.7k GitHub stars.
     - sharevb/it-tools fork: +388 tools.
     - omni-tools: 12 tool categories.
     - tiny-helpers.dev: 709 curated helpers.
  5. **[K] Analyst knowledge (training data up to mid-2026).** I used this for URL patterns and page layouts of long-established sites that could not be fetched. It is flagged wherever used, and each item should be spot-checked in a real browser before being copied.
- Every traffic figure is a **range or an as-reported snapshot with its source**. No numbers were invented. Where sources conflict, both are shown.

---

## 1. Competitor landscape: 22 free multi-tool websites

### 1.1 Size and authority snapshot

| Site | Umbrella rank [U] | Reported traffic | Source of traffic figure |
|---|---:|---|---|
| ilovepdf.com (sister of iloveimg) | 16,702 | ~180.8M visits/mo (late 2025); DR 82, 13.7K ref. domains | [G] micro-tools, citing Ahrefs |
| calculator.net | 36,391 | ~38M organic visits/mo (Aug 2026) | [S] Semrush snippet |
| smallpdf.com | 51,516 | ~59M/mo (Jan 2026); DR 83, 19.6K RDs | [G] citing ahrefstop |
| calculatorsoup.com | 75,483 | n/a | |
| omnicalculator.com | 78,292 | ~14.3M visits/mo, 53% Google organic, AS 83 (Jun 2026) | [S] Semrush snippet |
| freeconvert.com | 84,486 | ~8M/mo | [S] |
| iloveimg.com | 113,026 | 50-60M+/mo (quoted in planning docs, medium credibility) | [S]/[G] |
| rapidtables.com | 136,866 | n/a (strong; owns number-base/unit/colour-code SERPs) | [U] |
| inchcalculator.com | 147,486 | ~4.5M/mo | [S] Ahrefs "8 websites... calculators" |
| wordcounter.net | 170,357 | 14.19M (Mar 2026, Semrush); 3.2M (Aug 2026); 4.6M (Jun 2025). ~40% US | [S] Semrush/Ahrefs snippets (numbers differ by tool/month) |
| diffchecker.com | 182,053 | 1.97M (Jan 2026) | [S] |
| dnschecker.org | 187,833 | n/a | [U] |
| jsonformatter.org | 192,323 | 2.57M (Feb 2026); AS 60; 4.33K RDs | [G] citing Semrush |
| 11zon.com | 207,100 | ~3.1M/mo (May 2025); DR 71; 893 RDs | [G] citing Ahrefs |
| 123apps.com | 217,208 | n/a (freemium app family) | [U] |
| imageresizer.com | 236,958 | 4.6M search visits (Oct 2025); DR 74; 3.3K RDs | [G] citing Ahrefs |
| convertcase.net | 238,040 | 5.02M/mo (May 2026); ~$20K/mo revenue on 2.3M pageviews (earlier report) | [S] Semrush + indiehustle.co / HN 39119230 |
| browserling.com (onlinetools family) | 284,409 (onlinetools.com 891,988) | n/a | [U] |
| capitalizemytitle.com | 289,530 | ~1.3M/mo; DR 71; 66% US | [S] |
| codebeautify.org | 318,386 | n/a (large dev tool farm) | [U] |
| gigacalculator.com | 318,524 | n/a | [U] |
| duplichecker.com | 367,054 | n/a | [U] |
| smallseotools.com | 386,948 | ~3M visits/mo (Aug 2026), 70% organic, Indonesia 21%; #6 US for "reverse image search" = 71.4K visits/mo | [S] Semrush/Similarweb snippet. **Conflict:** a YouTube-derived doc claims 40-50M/mo ([G] boring-sites); treat that as unreliable |
| tinywow.com | 432,706 | n/a | [U] |
| seoptimer.com | 434,750 | 628K-815K/mo (Aug-Sep 2026) | [S] Exploding Topics/Semrush |
| miniwebtool.com | 443,454 | n/a | [U] |
| pinetools.com | 455,236 | n/a | [U] |
| siteprice.org | 477,433 | n/a | [U] |
| editpad.org | 773,750 | n/a (leads with AI writing tools) | [U] |
| prepostseo.com | 950,845 | ~441K/mo | [S] ahrefstop snippet |
| textfixer.com | unlisted | 867K visits (Jun 2026); session 8:58; audience BD > US > IN | [S] Semrush |
| 10015.io, it-tools.tech, tiny-helpers.dev, toolsaday.com, seomagnifier.com, textmechanic.com, toolsfairy.com, allinone.tools, onlinetexttools.com, charactercounter.com, freeformatter.com | all unlisted | it-tools has 40.7k GitHub stars yet is not in the top 1M | [U]/[OSS] |

**Reading.** The traffic leaders are three kinds of site:
- **Calculator portals:** calculator.net, omni, calculatorsoup.
- **File-processing suites:** iLovePDF/iLoveIMG, Smallpdf, freeconvert, 11zon, imageresizer.
- **A few focused text/dev hubs:** wordcounter.net, convertcase.net, jsonformatter.org, rapidtables, codebeautify.

The famous "SEO tools" farms (smallseotools, prepostseo, duplichecker, seomagnifier) are now mid-to-small. smallseotools is ~3M/mo and prepostseo ~0.4M/mo, and their biggest pages rely on server/API tools: plagiarism, paraphrasing, reverse image search, DA/PA checks. A new client-side site cannot copy those tools.

### 1.2 Per-site profiles

URL patterns marked [K] come from analyst knowledge and could not be re-verified live this session.

1. **smallseotools.com.** Categories: text analysis (plagiarism, paraphraser, grammar, word count), image tools (reverse image search, image compressor, resizer), keyword tools, backlink tools, website tracking, domain tools (DA/PA, whois), meta tags, password tools, PDF tools, unit/binary converters, dev tools. Claims 100+ tools.
   - URLs: root-level slug with a trailing slash, e.g. `/plagiarism-checker/`, `/reverse-image-search/`, `/keyword-density-checker/` [K].
   - Page content: tool UI first, then a few hundred words of "how to use / features / FAQ".
   - Monetization: display ads (AdSense-style units above and below the tool) plus premium plans and an API [K].
   - Traffic: ~3M/mo, 70% organic, skewed toward Indonesia, India and Pakistan [S].
2. **prepostseo.com.** 150+ tools [S]: plagiarism, rewriter, AI detector, grammar, SEO checks, text utilities (invisible character, reverse text, text-to-handwriting), image tools.
   - URLs: root-level slugs, e.g. `/plagiarism-checker`, `/tool/…` for some [K].
   - Monetization: ads plus premium plans and an API. Traffic ~441K/mo [S].
3. **duplichecker.com.** Plagiarism-led, plus reverse image search, grammar, paraphrase and a few SEO utilities.
   - URLs: legacy `.php` style, e.g. `/reverse-image-search.php` [K].
   - Monetization: ads plus premium. Umbrella 367K.
4. **seomagnifier.com / siteprice.org / many "Atoz SEO Tools" clones.** These run on the same resold PHP script, with ~50-70 near-identical SEO/text tools at `/tool-name`.
   - Content: thin, often duplicated across clone sites.
   - Monetization: AdSense-style ads.
   - Traffic: small (unlisted or ~477K rank) [K]/[U]. **This is the pattern to avoid:** a commodity script plus duplicate text.
5. **toolsaday.com / editpad.org.** Lead with AI writing tools (paraphraser, summarizer, AI detector, grammar, essay writer) that need LLM back ends [S]. Neither is feasible for us nor safe for AdSense.
6. **10015.io.** About 70-80 tools in 7 categories (Text, Image, CSS, Coding, Color, Social Media, Misc). Examples: box-shadow, glassmorphism, text-to-handwriting, tweet-to-image, slug generator [S].
   - URLs: `/tools/<slug>` [K].
   - Content: very polished UI with short descriptions [K].
   - Traffic: unlisted in Umbrella, but ranks on page 1 for many CSS-generator terms [S].
7. **tinywow.com.** Around 200 tools claimed across PDF, image, video, "AI write" and file. Most tools process on the server.
   - URLs: category-prefixed paths [K].
   - Monetization: ad-heavy (interstitials and wait screens) [K]. Umbrella 432K.
8. **tiny-helpers.dev.** A directory (709 helpers) rather than a tool site. It closed to new submissions in 2026 because of "AI slop" [OSS]. Its tag counts show where developers look: CSS 126, Misc 88, Images 70, Color 68, SVG 63.
9. **rapidtables.com.** Math, conversion, electrical, web/colour, number-base and date/time tools.
   - URLs: deep category folders ending in `.html`, e.g. `/convert/number/binary-to-decimal.html`, `/calc/math/percentage-calculator.html` [K].
   - Content: formula, conversion table and worked examples below the tool; short to medium length [K].
   - Umbrella 137K, so strong.
10. **textfixer.com.** About 15-20 classic text tools (remove line breaks, alphabetize, word frequency, find and replace, strip HTML), all JavaScript.
    - URLs: `/tools/<name>.php` [S]/[K].
    - Content: short instructions.
    - Traffic: 867K/mo with long sessions (8:58), which signals repeat use [S].
11. **convertcase.net.** 50-100+ text tools: case, Unicode fonts, duplicate lines, reverse/mirror text, ASCII art, plus encoders and image converters [S].
    - URLs: root slug with a trailing slash, e.g. `/duplicate-line-remover/` [S].
    - Monetization: 100% programmatic display through **Adapex** (not raw AdSense), about $20K/mo on 2.3M pageviews. That implies roughly $8-9 per 1,000 pageviews [S: indiehustle.co].
    - Also has a browser extension and a mobile app.
12. **wordcounter.net.** Word/character counter hub, alphabetizer, words-per-page, random word, website word count, citation generator [S].
    - URLs: root slugs, e.g. `/alphabetize`, `/words-per-page` [S].
    - Page content: the counter shows keyword density, reading level and reading/speaking time. Competitors match these features.
13. **jsonformatter.org.** JSON/XML/YAML/CSV formatters, validators, converters and viewers.
    - URLs: root slugs, e.g. `/json-parser`, `/xml-formatter` [K].
    - Content: tool UI plus a brief description and related converters [G].
    - Metrics: AS 60, 4.33K RDs, 2.57M/mo [G].
14. **freeformatter.com.** Formatters, validators, encoders, escapers, minifiers.
    - URLs: `/<tool>.html` [K].
    - Umbrella unlisted, yet it still ranks for many formatter terms [U].
15. **browserling / onlinetools family.** Split across one domain per data type: onlinetexttools, onlinejsontools, onlinepngtools, onlineimagetools, and so on. Thousands of tiny single-action tools.
    - URLs: `/<action>`, e.g. `onlinetexttools.com/remove-duplicate-lines` [K].
    - Page content: a short intro, a "how it works" section and example cards [K].
    - Monetization: cross-promotion of Browserling (a paid cross-browser testing service) plus display ads [K].
16. **codebeautify.org.** Several hundred developer converters, viewers and formatters.
    - URLs: root slugs, e.g. `/jsonviewer`, `/sql-formatter` [K].
    - Content: short. Monetization: display ads. Umbrella 318K.
17. **omnicalculator.com.** 3,000+ calculators.
    - URLs: `/<category>/<slug>`, e.g. `/finance/margin`, `/health/bmi` [K].
    - Content: **long-form, expert-written and reviewed, with formula, examples and FAQ**; named authors and reviewers (E-E-A-T) [K].
    - Ahrefs examples: the "annual income" page gets 50.8K visits, and "test grade calculator" gets 61K visits from a 5.9K-volume head because the page ranks for many variants [S].
18. **calculator.net.** A few hundred calculators.
    - URLs: `/<name>-calculator.html` [K].
    - Content: tool plus a moderate explainer and formulas.
    - #1 for "tip calculator" (673K vol, ~273K visits) and "calorie calculator"; #2 for "bmi calculator" [S].
19. **iloveimg.com / ilovepdf.com.** Task hubs.
    - URLs: flat task slugs such as `/compress-image`, `/resize-image`, `/convert-to-jpg` [G].
    - Content: minimal ("tool UI first, short descriptive copy, then a small FAQ or feature list") [G].
    - Monetization: freemium Premium plus ads [K].
20. **123apps.com.** A family of separate brands and domains per app (video cutter, audio converter, voice recorder, PDF). Freemium [K].
21. **pinetools.com.** Hundreds of small tools: text, colour, image, math and random.
    - URLs: root slugs, e.g. `/image-color-picker` [K].
    - Content: thin (tool plus one paragraph). Appears on page 1 for many long-tail text and image terms [S].
22. **it-tools.tech / omni-tools / DevToys (open source).**
    - it-tools: 90 tools in the repo. omni-tools: 12 categories (audio, converters, csv, image, json, list, number, pdf, string, time, video, xml) [OSS].
    - URLs: `/<slug>`.
    - Content: effectively none; no ads.
    - **No meaningful organic footprint** (both unlisted in Umbrella). This is evidence that great UX without content and links does not rank.

Other relevant single-purpose competitors:
- **Text:** capitalizemytitle.com (1.3M/mo, DR 71, 66% US), charactercountonline.com (~1.15M), wordstotime.com (180K, 64% organic, one tool), sortmylist.com (38K).
- **SEO micro-sites:** xml-sitemaps.com (714K), slugify.online (290K), metatags.io (222K), opengraph.xyz (~300K), utmbuilder.net (73K, US 36%, CPC $15.56).
- **Design:** coolors.co (5.58M), htmlcolorcodes.com (2.9M), cssgradient.io (664K).
- **Creator tools:** TunePocket (~990K; creator/YouTube calculators).
- **Percentages:** percentagecalculator.net (1.3-1.6M; 396K/mo from one keyword; DR 52) [S].

### 1.3 URL structures observed (summary)

| Pattern | Who | Notes |
|---|---|---|
| `/<slug>` at root | smallseotools, prepostseo, convertcase, wordcounter, jsonformatter, codebeautify, iloveimg, pinetools, it-tools | Most common; short URLs; category changes never break URLs |
| `/tools/<slug>` | 10015.io, textfixer (`/tools/x.php`), many 2025-26 indie sites | Clean separation of tools from blog/legal pages |
| `/<category>/<slug>` | omnicalculator, rapidtables (deep and `.html`), calculatorsoup | Topical folders; fine for huge sites but locks a tool into one category |
| `.html` / `.php` suffix | calculator.net, rapidtables, freeformatter, duplichecker, textfixer | Legacy; no benefit today |
| One domain (or subdomain) per data type or app | browserling (onlinetexttools…), 123apps, 11zon (bigpdf.11zon.com) | Splits authority; not for a new brand |

---

## 2. Case studies and public write-ups

| # | Case | Numbers | Lesson | Source / credibility |
|---|---|---|---|---|
| 1 | convertcase.net (solo founder) | ~$20K/mo, 2.3M pageviews/mo, ~$20/mo costs, 50+ tools, 100% programmatic ads via Adapex. "Traffic organically expanded after simply being submitted to Google" | Text utilities monetise well at scale. The revenue came from a header-bidding network, not bare AdSense | indiehustle.co, HN 39119230, lettersbydavey.com [S], medium-high |
| 2 | Ahrefs /writing-tools/ | Launched mid-2023 from scratch → ~1M US organic visits/mo at peak, now hundreds of thousands. "One tool can rank for hundreds of keywords" | Free-tool pages compound, but Ahrefs has DR 90+. Many of those AI-writing tools were later hit | Ahrefs blog "The Free Tools SEO Strategy" [S], high |
| 3 | Omni Calculator pages | "test grade calculator" 5.9K vol → 61K visits; "annual income" 81K vol → 50.8K visits; "wage calculator" 17K vol → 17.8K visits | A page that covers every variant of the intent out-earns its head keyword | Ahrefs blog [S], high |
| 4 | percentagecalculator.net | #1 US "percentage calculator" ≈ 396K visits/mo; DR 52; site 1.3-1.6M/mo | A single-intent exact-match site can own a mega head term | Ahrefs "8 websites... calculators" [S], high |
| 5 | Traffic concentration | simpleimageresizer: "image resizer" page ≈ 18% of 980K visits; top 5 keywords ≈ 27%. 11zon: top 5 PDF tools ≈ 37% of 3.1M. Big suites (pdf24, imageresizer): each flagship tool = 1-3% | **Expect 2-5 breakout tools to drive most early traffic** | [G] micro-tools, citing Ahrefs, medium-high |
| 6 | formatjsononline.com (failed) | DA 18, 88 referring domains, ~2.3K backlinks, "essentially zero" organic traffic | Head terms (json formatter, image resizer, compress pdf) need roughly DR 50-70 and ~1,000+ RDs. **A new domain must start on the long tail** | r/TechSEO thread 1pb3t5v via [G], medium-high |
| 7 | Head-term winners' content | Ranking tool pages for json formatter / compress pdf / image resizer carry **150-600 words**: how-to, short "what is", 3-10 FAQs. No 3,000-word articles | Authority beats word count on head terms. Long, genuinely useful content is what lets a *new* site win long-tail and pass AdSense review | [G] micro-tools, medium |
| 8 | SaaS lead-magnet pages on social-tool SERPs | Postiz, Hopper HQ, SocialBee, Pallyy and others (DR 50-80) hold positions 3-10 with a widget plus 300-600 words | A 1,000+ word page with a better tool can beat them on long-tail terms | [S] social-creator.md, medium |
| 9 | TunePocket / CollabPals | ~990K visits/mo from many small YouTube/creator calculators, all interlinked | Cluster many small, specific tools in one niche and interlink them | [S], medium |
| 10 | Single-tool micro-sites | wordstotime.com 180K (64% organic); sortmylist.com 38K; utmbuilder.net 73K (avg session 21:40); metatags.io 222K (65.6% direct) | Tool sites earn **repeat and direct traffic**. Build for bookmarking (remember inputs, keyboard-friendly, copy buttons) | [S] Semrush snippets, high |
| 11 | New 2026 entrants on page 1 | nuxtseo tools, serp.tools, wildandfreetools, lettercounter.org, gizmoop, aicrawlercheck (SEO long-tail). ZeroPNG, PhotoFormatLab, BulkPicTools, PixelBatch, ImageMint, LeanImg (image pair-conversions) | **Long-tail tool SERPs are still winnable by new domains in 2026** | [S] seo.md + [G] opentools competitive analysis (2026-07-10), medium-high |
| 12 | Indie launch posts | r/SideProject "I built 139 free browser tools, no signup"; "Made 30 free developer utility tools". r/json and r/microsaas "privacy-focused JSON formatter" posts | The "privacy-first, client-side, no signup" pitch is now common. It helps in developer communities, but it is not a moat by itself | Reddit threads cited in [G] user-behaviour report, medium |
| 13 | User behaviour | Most users click the first acceptable result and switch only when a tool fails, adds friction (limits, signups, watermarks, pop-ups) or feels unsafe with private files | Rank and snippet CTR gate everything. Privacy and speed win the minority who do switch, and they drive word of mouth | [G] micro-tools user-behaviour report (Reddit, XDA), medium |
| 14 | YouTube "boring websites" claims | wordunscrambler.me 11M visits / ~$500K/mo; calculator.net "$825K/mo"; smallseotools "40-50M visits"; Sleep Calculator $9K/mo | Numbers come from assumed RPM × guessed traffic. The smallseotools figure contradicts Semrush (~3M). **Use as directional inspiration only** | [G] ksjpswaroop/boring-sites, low |

### 2.1 RPM for tool sites (2025-2026)

| Setup | RPM | Source |
|---|---|---|
| AdSense, cross-niche | $3-$10 page RPM; many sites plateau under $10 | Mediavine blog via [G] |
| AdSense, India-heavy traffic | ~$2.1-$2.4 (2026 India average ~$2.1; case: $365 on 154K pageviews = $2.39) | [G] citing an r/Blogging post and a 2026 India AdSense benchmark |
| AdSense, programming/dev Q&A (25% US) | ~$2.1 ($38 on ~18K visits, auto ads maxed) | [G] citing Mediavine blog |
| Tech docs site, before and after an ad-slot fix | $0.05 → $5.20 RPM; viewability 12% → 78%; CLS 0.45 → 0.02 (fixed-height slots plus IntersectionObserver lazy-load) | [G] citing Ezoic blog |
| Ezoic, mixed-geo dev content | EPMV $4-$6 | [G] |
| Journey/Mediavine | Journey average ~$11-17; Mediavine $15-$40+ (needs traffic thresholds) | [G] |
| Header bidding (convertcase via Adapex) | ≈ $8-9 per 1,000 pageviews at 2.3M PV | [S] |
| Niche guide (low credibility) | general tools $3-8, developer $8-15, health $15-30, finance $20-50 | [G] boring-sites |
| Ad-block on developer audiences | est. 30-50% of dev visitors; "64% cite intrusive ads" | [G] |

**Implications for this site:**
- Plan on **$2-$6 RPM** for mixed global tool traffic on AdSense.
- US/UK/CA/AU-skewed tools can reach roughly $6-$12: writer tools, UTM builder, finance and construction calculators, and designer tools.
- Move to a header-bidding network once traffic qualifies.
- Never place ads inside `<pre>` or code output. One dev blogger saw bounce rise from 45% to 75% when Auto Ads injected units into code.
- Reserve fixed-height ad slots to protect CLS.

### 2.2 AdSense approval and rejection signals (2025-2026)

- **"Low value content" is still the top rejection reason in 2026.** Guides explicitly cite "a calculator or converter tool that simply shows the tool interface without explaining how it works" as the failing pattern [S].
- Reviewers look for information gain, not raw word count. A common recommendation is at least ~25 quality pages before applying, plus About/Contact/Privacy/Terms pages, HTTPS and a good mobile layout [S].
- The **"Enabling dishonest behaviour"** policy bans fake documents and academic cheating. Hacking/cracking framing is risky: do not build an "MD5 decrypter", "JWT cracker" or "credit card generator" [S].
- **Google spam and core updates.**
  - The March 2024 policies are still enforced: scaled content abuse, site reputation abuse and expired-domain abuse.
  - The March 2026 spam update targeted expired domains repurposed for thin tool pages ([G]: "thin tool pages on mismatched expired domains are the exact shape Google is trying to suppress").
  - The March 2026 core update hit template/programmatic sites; sibling snippets report -60% to -90% [S].
  - Implication: use a **fresh brandable domain**, one strong page per intent, and only a hand-written handful of preset sub-pages.
- **AI Overviews:** tool and calculator queries lost only ~3% of traffic in one 2026 dataset [S], versus 34-61% CTR declines on AIO SERPs generally [G]. Interactive tools are among the most AIO-resistant page types.

---

## 3. Gaps and opportunities

1. **Privacy-first, in-browser file tools with proof.** Competitors claim "100% private" without showing a DevTools network-tab recipe or a tested capability matrix. They rarely explain WebP vs AVIF, HEIC decode limits, or low-memory failures, and their pair-format pages are thin [G opentools].
   - Build: HEIC→JPG/PNG (+22% YoY; Ahrefs global "how to convert heic to jpg" 110K, KD 39), WebP→PNG/JPG (US 165K/110K, Semrush), AVIF→JPG/PNG (33.1K/27.1K global, Ahrefs), compress-to-target-KB (100KB/50KB/20KB), EXIF viewer/remover, favicon/ICO generator, images→PDF and merge PDF "without uploading" [S image-media].
2. **Social/creator utilities where page 1 is SaaS lead-magnets.** Those pages are 300-600 words from Postiz, Hopper HQ and similar [S].
   - Build: character counters per platform (X, Threads, Bluesky, LinkedIn, Instagram caption), bio/line-break formatters, hashtag counters, image-size and aspect-ratio helpers, grid/carousel splitters, YouTube title/description length checkers, and the TunePocket-style calculator cluster.
   - Threads (500 chars) and Bluesky (300 graphemes) are still under-served; demand is an estimate [K].
   - **No downloaders or thumbnail grabbers** (hard exclusion).
3. **Text "utility fixes" and question-intent calculators.** Page 1 is thin pages from pinetools, textfixer, codebeautify and onlinetexttools.
   - Build: remove line breaks, dedupe lines, sort/alphabetize, column→comma list, extra-space remover, slug generator, words↔pages, reading/speaking time, characters↔words [S text-writing].
4. **Developer long-tail with no strong specialist domain** [U/S developer.md].
   - Build: SQL formatter, hash/HMAC/bcrypt, cron builder, UUID/ULID, JSON→TypeScript/Zod/JSON Schema, YAML↔JSON, JSONPath tester, docker-run→compose, chmod calculator, string escape/unescape, Markdown table generator.
   - The heads (json formatter, regex, epoch, jwt, diff) belong to brand-tier domains. Build those as hubs, not for early traffic.
5. **AI-adjacent client-side tools (2025-2026 demand)** [K + S]. Estimates only; no hard volume was captured this session.
   - LLM token counter/tokenizer (GPT/Claude/Llama-style BPE via js-tiktoken or gpt-tokenizer, with a cost estimator). Current SERP: OpenAI's own tokenizer page plus many small sites (estimate).
   - Prompt template and variable filler.
   - "Remove Markdown / clean ChatGPT output" formatter.
   - Hidden and invisible character inspector. Frame it as text hygiene and debugging, **not** as "bypass AI detection".
   - llms.txt generator (1K-4K, rising; honest about adoption).
   - robots.txt generator with AI-crawler presets: GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot and others. Keywords Everywhere and aicrawlercheck (248+ bot presets) use this as their differentiator [S].
   - **Exclude "AI humanizer" and "AI detector bypass":** they need an LLM and carry academic-dishonesty and policy risk.
   - AI detector, paraphraser and summarizer are not client-side feasible.
6. **SEO snippet tools with 2026 specifics** [S].
   - Pixel-width title and description checkers (600px / 920px desktop, ~580px mobile), a SERP preview that notes Google's AI title rewrites (tested since March 2026), and an Open Graph / X card preview in paste mode. The X Card Validator is effectively gone; URL fetch is a server-light roadmap item.
   - UTM builder: US 36% of audience, CPC $15.56, the best-RPM SEO tool.
7. **Design/CSS with modern color spaces.** Tools that are OKLCH/APCA-aware: contrast checker with WCAG 2.2 + APCA, OKLCH converter, tints/shades, gradient generator with OKLCH interpolation. Page 1 is shared with small indie sites [S design-color-css].
8. **Content-quality gap across the board.** Legacy farms (smallseotools clones, pinetools, onlinetools, codebeautify) ship tool plus 1-3 paragraphs.
   - A page with worked examples, format facts, edge cases, comparison tables and genuine FAQs clears AdSense's "low value" bar and is the lever a zero-authority domain can pull.
   - Omni's expert-reviewed content is the model on calculators.

---

## 4. Content patterns of pages ranking #1-3 for tool keywords

This section is synthesised from the [G] SERP-leader analysis, sibling snippet observations and [K]. HTML was not fetched live this session.

**Layout that ranks:**
1. H1 = primary keyword plus a benefit ("Free Online X — No Sign-up"). A one-line subhead.
2. **Tool UI above the fold** (every leader).
3. A short "How to use" (3-5 numbered steps).
4. A "What is X / how it works" explainer. On calculators, a formula block and worked example(s).
5. Features/benefits bullets. Privacy leaders add "files never leave your device".
6. Reference tables: conversion tables, platform limits, size charts, keyboard shortcuts.
7. FAQ, typically 3-10 questions phrased like People Also Ask.
8. **Related tools** block (4-12 links), usually a grid of sibling tools in the same category. Header mega-menu and footer category lists supply site-wide internal links.

**Word counts:**
- Head-term leaders with high authority: **150-600 words** (jsonformatter, jsonlint, pdf24, iLovePDF, imageresizer, simpleimageresizer) [G].
- SaaS lead-magnet tool pages: 300-600 [S].
- Omni and calculator.net-type calculators: roughly 800-2,500 with formulas and examples [K].
- New-domain winners on long-tail in 2026 pair the tool with **long-form, 2026-dated guides** [S].
- Recommendation for us: 1,000-1,800 words under the tool. Keep the tool first and the text scannable (H2 per question, tables, examples).

**Headings commonly seen:**
- "How to [verb] [object]"
- "What is [X]?"
- "Why use our [X]?" or "Features"
- "[X] formula" with "Example"
- "[Format A] vs [Format B]"
- "Tips / Common mistakes"
- "Frequently Asked Questions"
- "Related tools"

**Schema markup (JSON-LD), with state as of Sept 2026:**
- Common on tool pages: `WebApplication` or `SoftwareApplication` (`applicationCategory`, `operatingSystem: "Web"`, `offers.price: 0`), `BreadcrumbList`, `FAQPage`, and `Organization`/`WebSite` on the home page. `HowTo` appears on older pages [K/G].
- Rich-result reality:
  - FAQ rich results were removed for all sites on 7 May 2026 [S]. The markup is still valid but gives no SERP feature.
  - HowTo rich results have been gone since 2023.
  - BreadcrumbList still shows.
  - WebApplication/SoftwareApplication only earns a snippet when ratings are present. Do **not** add fake `aggregateRating`: that is a structured-data spam risk.
- Recommendation: WebApplication + BreadcrumbList + FAQPage (for machine understanding and AEO) on tools, and Organization + WebSite on the home page. The repo already does this (`src/lib/seo/jsonld.ts`).

**Engagement and trust signals:**
- Remember last inputs in localStorage, copy/download buttons, keyboard shortcuts, dark mode. Direct-traffic shares of 60-65% show that users bookmark these sites.
- A clear privacy statement for file tools.
- Visible last-updated date.
- An author/about page (E-E-A-T; Omni-style reviewer lines on calculators).

---

## 5. URL structure recommendation

Keep the scaffolded **flat `/tools/<keyword-slug>`**, with **category hubs at `/category/<category>`** and guides at `/blog/<slug>`.
- **Slug = exact primary keyword**, lowercase and hyphenated, with no `.html` suffix and no year. Examples: `/tools/heic-to-jpg`, `/tools/word-counter`, `/tools/px-to-rem-converter`.
- **Do not nest the category in the tool URL.** A tool can then sit in several categories and be re-categorised without redirects.
- `/tools/` cleanly separates tools from blog and legal pages. Root-level slugs (smallseotools/convertcase style) offer no measurable ranking advantage.
- Pair-format tools each get their own URL only when the content is genuinely distinct (for example `heic-to-jpg` and `heic-to-png` can share one engine but need distinct pages). Never generate hundreds of templated pair or preset pages; that is the scaled-content-abuse risk.
- Canonicalise trailing-slash variants.
- Each category hub carries 300-600 words of intro plus the tool grid, with breadcrumbs `Home > Category > Tool`.
- Use one brand domain; do not split into per-type domains or subdomains the way browserling and 123apps do.

---

## 6. Top traffic tools repeatedly seen across competitors

| Tool | Evidence | Launch feasibility |
|---|---|---|
| word counter / character counter | wordcounter.net 821K visits/mo from "word counter" (792K US vol); "character counter" 216K vol | client, hub page (high competition) |
| case converter | convertcase.net 5M/mo; "case converter" 222K (Semrush) | client |
| percentage calculator | percentagecalculator.net 396K/mo from one keyword | client |
| tip / BMI / calorie / age calculators | calculator.net #1-2; "tip calculator" 673K | client (YMYL on health) |
| image resizer / image compressor | imageresizer 4.6M; "image resizer" 110K US; "image compressor" 49.5-60.5K US | client (Canvas/WASM) |
| webp→png / webp→jpg / heic→jpg / png↔jpg | 165K/110K US; HEIC +22% YoY | client |
| compress / merge PDF, jpg→pdf | pdf24 / 11zon 250-400K visits per keyword | client for merge and images→pdf; compression is weak client-side (roadmap) |
| json formatter/validator | jsonformatter.org 2.57M/mo | client (hub; slow to rank) |
| QR code generator | qr-code-generator.com ~2.4M/mo; 1M-3M global | client |
| color picker / palette / hex↔rgb | coolors 5.58M; htmlcolorcodes 2.9M | client |
| binary translator / number base | rapidtables; 400K-1M cluster (estimate) | client |
| reverse image search / plagiarism / paraphraser / grammar | smallseotools' biggest pages (#6 reverse image = 71K visits) | **not feasible** (third-party APIs or LLM) |
| sitemap generator / meta tag generator | xml-sitemaps 714K; metatags.io 222K | client (paste mode); crawl = server-light |
