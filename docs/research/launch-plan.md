# Launch Plan (Final): Free Online Tools Website

Date: 2026-09-29. Model note: this final plan was produced on Claude Sonnet 5.5 (claude-sonnet-5-5). It incorporates three adversarial critiques (SEO realism, AdSense policy and legal, product and engineering feasibility) into the earlier draft (`launch-plan-draft.md`). The machine-readable version is `launch-plan.json`.

## 1. Strategy in plain English

What we are building: one free tools site with 52 tools at launch (7 already built as v1 and needing a gap audit against their specs, 45 to build), every tool running inside the visitor's browser, so there are no servers, uploads or running costs. Each tool gets its own page with 1,000+ words of useful, tool-specific writing (how it works, worked examples, a reference table, honest limits), because Google's 2026 updates and AdSense reviewers punish thin widget pages and repeated boilerplate.

Honest competition mix: using a fixed rubric (count page-1 domains that are big brands or DR above 70: 0 = low, 1-3 = medium, 4 or more = high) the launch set is about 6 low, 7 low-medium, 21 medium, 7 medium-high and 11 high. That is roughly 25% low or low-medium, 40% medium and 35% medium-high or high, not the 60/30/10 originally hoped for. Five of the high ones (word counter, character counter, JSON formatter, password generator, percentage calculator) were already built, so they are sunk cost that exists for site completeness and internal linking, not for traffic forecasts. The draft's 'low' labels were too optimistic for many tools; these are corrected.

What the critiques changed: merged the title-tag and meta-description checkers (Google treats them as one intent), folded characters-to-words into the character counter, merged the YouTube Shorts calculator into the main YouTube calculator, and deferred liquid glass, Tailwind colours, keyword combiner, hours calculator, and the mic and webcam tests. Added words-to-pages, comma-separator, slug-generator, invisible-character, click-speed-test, border-radius-generator and salary-to-hourly. The PDF category is not created at launch and moves to Month 6 with five tools at once, only if the image cluster is earning links. Toolspecs now include the missing hard parts (EXIF orientation, HEIC Worker, cron dialects, deterministic pixel widths) and every 'offline', 'pixel-accurate' and 'never leaves your device' claim was removed.

Realistic expectations: a zero-authority domain will not put 26 tools in the top 10. KPIs for month 6: 8-12 top-10 rankings and 3-5 pages above 2,000 visits a month, with page 1 for at least 3 pages by month 3, reported from Search Console. Low-competition pages are structurally low-volume (about 1k-15k searches), so roughly 13 launch tools are authority and AdSense-approval pages rather than traffic pages. Authority plan: Show HN or Product Hunt for the privacy-first file tools (HEIC, EXIF, WebP), dev-community posts for SQL, cron and UUID, Discord community outreach for the timestamp and colour tools, an open-sourced engine on GitHub, and linkable data assets (a dated platform character-limit table, a pixel-width reference, a UUID version table). Before building any unbuilt tool, validate its primary keyword in Google Keyword Planner, the Ahrefs free generator and Semrush free queries, record US and UK volume separately, and drop any figure still marked 'estimate' from the page copy.

Release and AdSense: publish in two waves. Wave A is about 28 complete pages plus About (real named person), Contact, Privacy, Terms, Disclaimer, Cookie policy, Editorial and Methodology, Corrections and licence notices; apply to AdSense at 30-40 indexed pages, typically 3-8 weeks after launch. Wave B releases the rest over 2-3 weeks after a uniqueness gate (fail above about 30% shingle overlap or under 900 unique words). After launch we add 25-29 tools a month for six months (166 roadmap tools, 218 in total), finishing clusters so pages link to each other. Server-light tools (What Is My IP, meta tag analyzer, redirect checker) wait until Month 5. Expect AdSense earnings of roughly $2-$6 per 1,000 page views, concentrated in 2-5 breakout tools.

### Competition rubric (record this per tool)

Count the page-1 domains that are big brands or have DR above 70. 0 = low, 1-3 = medium, 4 or more = high. Intermediate labels (low-medium, medium-low, medium-high) mean the count sits on a boundary or the brands are only in the lower half of page 1. Store a dated SERP snapshot for each tool in the repo before building it. Cisco Umbrella rank is no longer used as evidence of a weak competitor (it measures enterprise DNS lookups, not search strength).

Launch tool split: high 11, low 6, low-medium 3, medium 21, medium-high 7, medium-low 4.

### Volume figures

Volumes are ranges with their source in brackets. Anything marked estimate or unverified must be validated (Google Keyword Planner, Ahrefs free keyword generator, Semrush free daily queries, Google Trends for trend terms) before the tool page is written. Record US and UK volume separately from global. Never quote a precise volume on a live page.

### Realistic outcomes

- Month 3: page 1 for at least 3 pages. Month 6: 8-12 top-10 rankings and 3-5 pages above 2,000 visits a month, reported from Search Console.
- Roughly 13 launch tools (low and low-medium) are structurally low volume (about 1k-15k searches a month). They are authority and AdSense-approval pages, not traffic drivers. The traffic pages are the medium-competition tools with larger clusters and the long-tail variants of the high-competition image tools.
- Revenue: about $2-$6 per 1,000 page views, concentrated in 2-5 breakout tools.

### Authority (link) plan

A zero-authority domain needs some links even where the SERP looks weak. Plan: Show HN or Product Hunt for the privacy-first file tools (HEIC, EXIF, WebP); dev-community posts for SQL formatter, cron and UUID; Discord-community and r/discordapp outreach for the timestamp and colour tools; open-source one engine (for example the pixel-width or cron scheduler) on GitHub with a backlink; and four linkable data assets: a dated platform character-limit table, a pixel-width reference, a UUID version table and a Discord timestamp format table.

## 2. Categories

| Slug | Name | Launch tools | Description |
|---|---|---|---|
| text | Text & Writing Tools | 10 | Count, clean, sort and convert text: word and character counters, case converter, line-break and duplicate removers, comma-list and slug tools, reading-time and page estimators. Your text is processed in your browser; we do not upload or store it. |
| seo | SEO Tools | 5 | On-page and technical SEO helpers that work without fetching your site: title and meta description length checker, SERP snippet preview, slug, redirect and llms.txt generators. |
| developer | Developer Tools | 6 | Formatters, validators and generators for everyday coding: JSON, SQL, UUID, hashes, cron and chmod. Input is processed in your browser; we do not upload or store it. |
| image | Image Tools | 7 | Convert, compress and inspect images on your own device: WebP, HEIC and SVG converters, target-size compression, EXIF viewer and remover. Files are processed in your browser; we do not upload or store them. |
| converters | Number & Format Converters | 5 | Conversions that show the formula: CSS units, military time, Morse code, Roman numerals and numbers to words. |
| calculators | Calculators | 5 | Everyday calculators for percentages, dates, ages and pay, each with the math shown step by step. |
| social-media | Creator & Community Tools | 5 | Discord timestamps and coloured text, YouTube earnings and watch-time estimators, and an Instagram grid maker. Independent tools, not affiliated with any platform. |
| design | Color & CSS Tools | 4 | Generators that write production-ready CSS and Tailwind code, plus an accessibility-first WCAG 2.2 colour contrast checker. |
| utilities | Utilities & Device Tests | 5 | Test your keyboard, mouse and screen, measure click speed and generate strong passwords, all in your browser. |

The PDF category does not exist at launch: no route, no nav item, no sitemap entry, no homepage card and no teaser. Category visibility is data-driven (a category renders only with at least 4 live tools) and the build fails if a public string contains Month, roadmap, coming soon, TODO or slug.

## 3. Launch tools (52)

Seven tools are already built as v1 (word-counter, character-counter, case-converter, remove-line-breaks, json-formatter, password-generator, percentage-calculator). A repo check showed v1 lacks several features named in the specs (jsonrepair, Web Worker and tree for JSON, Intl.Segmenter counting), so each built tool needs a gap audit against its spec.

| # | Name | Slug | Category | Primary keyword | Est. volume | Competition | Why |
|---|---|---|---|---|---|---|---|
| 1 | Word Counter | word-counter | text | word counter | 800k-1.5M (Ahrefs snippet: 'word counter' 792K US, 'word count' 214K US) | high | Already built (v1). Sunk-cost head term: it will not rank top 10 within 6 months, but it is the text hub that every other text page links to, and it collects long-tail traffic (essay word counter, word count checker). One of the head-term slots that exist for completeness, not for traffic forecasts. |
| 2 | Character Counter | character-counter | text | character counter | 300k-600k (Ahrefs snippet: 'character counter' 216K US, 'character count' 78K US) | high | Already built (v1). Second text hub. It now also owns the characters-to-words intent (folded in from the dropped standalone page), so one page serves both. Head-term slot, sunk cost. |
| 3 | Case Converter | case-converter | text | case converter | 250k-450k (Semrush snippet: 'case converter' 222,200/mo; convertcase.net 5.02M visits/mo) | medium-high | Already built (v1). Huge demand and a dev-case angle (camel, snake, kebab) that is less crowded; sentence case and uppercase-to-lowercase long-tails are the realistic entry points. Head-term slot. |
| 4 | Remove Line Breaks | remove-line-breaks | text | remove line breaks | 30k-60k (estimate from autocomplete + competitor coverage; textfixer 867K visits/mo per Semrush is a site total, not this term) | medium | Already built (v1). Frequent, repeated task (text pasted from PDFs and emails) with how-to PAA questions we can answer in depth. Page 1 includes established text-tool sites, so treat it as medium and win with long-tails. |
| 5 | Remove Duplicate Lines | remove-duplicate-lines | text | remove duplicate lines | 15k-40k (estimate from autocomplete + 10+ competitor pages; unverified) | medium | Clear intent, cheap build on the shared LineListEngine, and forms a list-cleaning cluster with line breaks, alphabetical order and comma separator. Page 1 has several established tool sites, so it is medium, not low. |
| 6 | Alphabetical Order Tool (Sort Lines A-Z) | alphabetical-order | text | alphabetical order tool | 60k-150k (estimate; unverified, validate in Keyword Planner before building) | medium-high | Common student and office task that Google Docs does not do natively (strong PAA). Page 1 includes wordcounter.net/alphabetize, textfixer and several exact-match sites, so it is a long-tail play: 'alphabetize in Google Docs' and 'alphabetize by last name'. |
| 7 | Words to Time Calculator (Reading & Speaking Time) | words-to-time | text | words to time | 80k-200k cluster (Semrush snippet: wordstotime.com 180K visits/mo, 64% Google organic; treat as an upper bound for one page) | medium | Proven demand won by a single-tool site; SERP also has voice-over and speech-coaching pages, so medium. Audience is writers and speakers, and dozens of question long-tails fit one page. Sole owner of 'reading time' and 'speech time' intents. |
| 8 | Words to Pages Calculator | words-to-pages | text | how many pages is 1000 words | 60k-150k cluster (estimate; unverified, validate in Keyword Planner) | medium | Added from the roadmap (raw research priority 8). Page 1 is mostly blog posts (Grammarly, Reedsy, OnlyOffice) plus one tool page, so a tool with a lookup table can compete. Replaces the dropped characters-to-words page as the launch conversion page. |
| 9 | Comma Separator (Column to Comma List) | comma-separator | text | comma separator | 15k-40k (estimate; unverified) | medium-low | Added from the roadmap (raw research priority 8). Page 1 mixes dev-tool vendors and small sites; cheap build that reuses the LineListEngine and serves a business and SQL audience. |
| 10 | Invisible Character (Blank Text Copy & Detect) | invisible-character | text | invisible character | 80k-200k cluster (estimate; 8+ small exact-match sites on page 1; unverified) | medium | Added from the roadmap (raw research priority 8). High volume, small exact-match competitors, trivial build. Framed for legitimate spacing, formatting and detecting hidden characters in pasted text and code. |
| 11 | Title Tag & Meta Description Length Checker (Pixel Width) | title-meta-description-length-checker | seo | meta description length checker | 3k-8k for the description checker, 3k-6k for the title checker, plus informational 'meta description length' and 'title tag length' (estimate from autocomplete; unverified, validate in Keyword Planner) | medium | Merged from two pages: live SERPs return the same combined 'title and description checker' pages for both queries, so two pages would cannibalize. Page 1 has 10+ dedicated tools (mrs.digital, SE Ranking, Semrush blog), so medium, but several are small 2026 sites and the long-tails 'meta description pixel checker' and 'title tag pixel width' are winnable. Attracts a marketer audience. |
| 12 | SERP Snippet Preview Tool (Desktop & Mobile) | serp-snippet-preview | seo | serp preview tool | 5k-12k combined across synonyms (estimate; highervisibility.com 271K visits/mo is a site total; unverified) | medium | Hub of the snippet cluster; owns preview and simulator queries while the checker owns length and pixel queries. Build gate: run a SERP check before building; if Google returns the same pages for 'serp simulator' and 'title meta description checker', demote this to a tab on the checker instead of a separate page. |
| 13 | llms.txt Generator | llms-txt-generator | seo | llms.txt generator | 1k-4k and rising (estimate from 2026 roundups; validate with Google Trends) | medium | Cheap build and link-bait for SEO newsletters, but page 1 already has SaaS lead-gen pages (DreamHost, Writesonic, WordLift). Counted as an authority and approval page, not a traffic page. Differentiator: no crawl, paste a sitemap, spec validator, honest status. |
| 14 | .htaccess & Nginx Redirect Generator | htaccess-redirect-generator | seo | htaccess redirect generator | 3k-6k combined (estimate; unverified) | low | The best true low-competition SEO tool in the set: page 1 is consultants and small utilities, multi-server output in one place is a differentiator, and the webmaster audience engages deeply. |
| 15 | URL Slug Generator | slug-generator | seo | slug generator | 10k-25k (estimate; slugify.online 290K visits/mo is a site total; unverified) | medium-low | Moved up from Month 1 (raw research priority 8). Page 1 is small tool pages and lead-gen posts, one of the few truly low-to-medium SEO tools. Fills the launch slot freed by merging the snippet checkers. Single slug page; no /url-slug-generator duplicate. |
| 16 | JSON Formatter & Validator | json-formatter | developer | json formatter | 400k-700k cluster (estimate from Ahrefs/Semrush knowledge; jsonformatter.org 2.57M visits/mo is a site total) | high | Already built (v1, 527 lines). Sunk-cost hub linking to every other JSON and data tool. The 'fix invalid json' and 'json to string' angles are softer than the head term. |
| 17 | SQL Formatter (15+ Dialects) | sql-formatter | developer | sql formatter | 50k-90k cluster (estimate; unverified) | medium-high | Real volume and a US data-analytics audience with higher ad value than most dev tools. Page 1 is database vendors (Devart, Aiven, Red Gate), so expect page 2 for the head term and win the dialect long-tails first. |
| 18 | UUID / GUID Generator (v4, v7, ULID) | uuid-generator | developer | uuid generator | 120k-220k cluster (estimate; unverified) | medium | High volume and the leading page is a single-purpose site. UUID v7 (RFC 9562, 2024) is a fresh long-tail. Zero-library build. |
| 19 | Hash Generator (MD5, SHA-256, SHA-512, CRC32) | hash-generator | developer | hash generator | 150k-300k cluster (estimate: md5 generator 40k-70k, sha256 generator 30k-50k; unverified) | medium | Large aggregated demand across algorithms; SERP is mid-DR SaaS and CDN pages. The hub carries 'md5 hash generator' and 'sha256 hash generator' as their own H2s and title variants; separate algorithm pages only after Search Console shows impressions and each can be genuinely different. |
| 20 | Cron Expression Generator & Explainer | cron-expression-generator | developer | cron expression generator | 80k-150k cluster (estimate; unverified) | medium-high | DevOps audience and high ad value. Page 1 is monitoring vendors (UptimeRobot, Cronitor's crontab.guru), so lead with dialect and schedule long-tails and expect page 2 for the head term. |
| 21 | Chmod Calculator (Linux File Permissions) | chmod-calculator | developer | chmod calculator | 30k-60k for the tool; informational 'chmod 755' style queries are answered by Stack Overflow and Wikipedia and are supporting text, not a forecast (estimate; unverified) | medium | Sysadmin audience with hosting ad value and a fast, trivial build. Tool-intent page 1 includes Omni Calculator and linuxize, so medium. |
| 22 | WebP to PNG Converter | webp-to-png | image | webp to png | 300k-600k global; US 165,000 came from a single third-party CSV export and is unverified (validate in Keyword Planner before treating this pair as the flagship) | high | Largest volume in the image set, but page 1 for the head term is CloudConvert, Cloudinary, Canva and app stores, so plan for long-tails first ('webp to png transparent', 'batch webp to png', 'open webp file') and page 2-4 for the head term at month 6. Feeds the shared ImageConverter engine. |
| 23 | WebP to JPG Converter | webp-to-jpg | image | webp to jpg | 200k-400k global; US 110,000 + 'convert webp to jpg' 22,200 + 'webp to jpeg' 12,100 (single third-party Semrush-style export, unverified; CPC in that export was about $0.01) | high | Shares the ImageConverter engine with webp-to-png at low marginal cost, and the JPEG angle (quality, flattening transparency, portals that require JPG) is distinct. Very low CPC, so counted as a volume and approval page. |
| 24 | HEIC to JPG Converter | heic-to-jpg | image | heic to jpg | 150k-400k global English (Ahrefs Global export 2026-07: 'how to convert HEIC to JPG' 110,000 KD 39, 'HEIF to JPG' 5,400 KD 21; Keyword Planner all-locations 1.22M, +22% YoY) | high | Demand is growing and iPhone-driven, and personal photos make a privacy-first tool a genuine choice. The tool alone will sit on page 2 for the head term; the traffic path is the informational cluster ('how to open HEIC on Windows 10/11', 'iPhone photo to JPG', 'convert HEIC on Mac') linking to the tool. Highest engineering risk in the image set (wave 4). |
| 25 | SVG to PNG Converter | svg-to-png | image | svg to png | 100k-300k global (Keyword Planner all-locations 301K cited by a low-credibility third-party PRD; treat as an upper bound) | high | Designer and developer audience and a trivial engine reuse, but head-term SERPs are CloudConvert, Convertio and Adobe Express. Compete on long-tails (512x512, transparent, svg code to png, high resolution). |
| 26 | Compress Image to 100KB (or Any Size) | compress-image-to-100kb | image | compress image to 100kb | 200k-400k global cluster, India-heavy; US est 5k-15k (Google Ads India export May 2026: reduce image size in kb 110,000; compress image to 100kb 60,500; compress image to 20kb 49,500) | medium-high | Proven traffic pattern, but page 1 is Zamzar, 11zon (with several per-size pages) and imagecompressor tools, the audience is India-heavy with low RPM, and it counts as a volume and approval page. The Month 1 image-compressor hub must not target the 100kb keywords. Hand-written size pages (signature 20 KB, passport photo 50 KB) come later, only where the use case and content genuinely differ. |
| 27 | EXIF Viewer (Photo Metadata Checker) | exif-viewer | image | exif viewer | 15k-40k global cluster (Semrush US export: metadata viewer 6,600, exif data 4,400, exif data viewer 2,900, exif viewer 2,400; the $6.82 CPC on 'metadata viewer' reflects asset-management advertisers, not this page) | medium | Strong privacy story that feeds the EXIF remover, and moderate competition (pics.io, Jimpl, Metadata2Go, regex.info). Small US volume; target 'check photo location metadata' first. |
| 28 | Remove EXIF Data (Strip Photo Metadata) | remove-exif-data | image | remove exif data | 20k-60k global (Keyword Planner export via third-party CSV: 'exif data remove' 40,500, country unstated; unverified) | medium-low | Small privacy-focused competitors, clear privacy value and a natural pair with the viewer. Target 'remove gps from photo' first. Engineering-risky (wave 4). |
| 29 | PX to REM Converter | px-to-rem | converters | px to rem | 15k-40k combined (estimate from SERP composition; unverified) | medium-low | The most credible early developer win in converters: SaaS free-tool pages and small apps, likely developer backlinks, cross-links with the clamp calculator. A sibling /tools/rem-to-px is Month 1 and only built if Keyword Planner shows about 10k+ for rem to px; both would share one UnitConverter component. |
| 30 | Military Time Converter (+ Printable Chart) | military-time-converter | converters | military time converter | 50k-150k (estimate from autocomplete; unverified) | medium-high | Solid US volume and an easy build, but page 1 is timesheet and payroll SaaS (Clockify, TimeCamp, Shifton), so lead with long-tails (printable chart, what time is 1900, pronunciation) and expect page 2 for the head term. |
| 31 | Morse Code Translator (with Audio) | morse-code-translator | converters | morse code translator | 150k-350k (estimate from Similarweb: morsecode.world about 470k visits/mo, 40% US; unverified) | medium | Evergreen, shareable, easy to differentiate with audio and practice features. |
| 32 | Number to Words Converter | number-to-words | converters | number to words | 60k-150k (estimate; unverified) | medium | Steady evergreen demand and a fragmented SERP. Renamed from '(Check Writing)' so it does not pattern-match the excluded cheque-writer category; the check format is one output mode only. |
| 33 | Roman Numeral Converter | roman-numeral-converter | converters | roman numeral converter | 100k-300k with February peaks (estimate; Google Trends US peak Feb 2026; unverified) | medium | Large evergreen demand with a predictable Feb spike, so it must be indexed before January. Run the SERP rubric before building (Wikipedia and established calculators are likely on page 1) and lead with date and tattoo long-tails. |
| 34 | Percentage Calculator | percentage-calculator | calculators | percentage calculator | 1M-2M, US 500k+ (estimate anchored on Ahrefs: percentagecalculator.net about 396k visits/mo from #1 US) | high | Already built (v1). Topical anchor for the calculators category and a long-tail catcher. Head-term slot, sunk cost. |
| 35 | Chronological Age Calculator (for Testing) | chronological-age-calculator | calculators | chronological age calculator | 10k-40k (estimate from autocomplete breadth; unverified) | medium-high | Professional audience (SLPs, school psychologists, teachers) skewing US/UK/CA/AU, and the engine is reused by the Month 2 age calculator. Page 1 includes Omni, Pearson and Super Duper, so it is not a quick win; target corrected age and months sub-intents and show real reviewer credentials on the page (no invented credentials). |
| 36 | Days From Today Calculator | days-from-today | calculators | days from today | Cluster 300k-700k but addressable by one page about 20k-60k because demand is split across per-N queries (estimate; unverified) | medium | Hub for date tools (days between dates, age calculator follow). Ships with 3 hand-written supporting guides (30, 60 and 90 days from today) in wave B, each 1,000+ unique words for a different use case; further N pages only if Search Console shows impressions. |
| 37 | Hourly to Salary Calculator | hourly-to-salary-calculator | calculators | hourly to salary calculator | 70k-150k cluster across both directions (search-snippet Semrush-type data: 33K and 38K US for the two directions; unverified) | medium | Employment and finance ad demand, US/UK audience and proven volumes. Owns the hourly to annual direction; salary-to-hourly is its sibling page. |
| 38 | Salary to Hourly Calculator | salary-to-hourly-calculator | calculators | salary to hourly calculator | Part of the 70k-150k pair; the plan's data shows about 38K US for this direction (unverified) | medium | Added because both directions show comparable, separate demand and different phrasing ('$50k a year is how much an hour'). Rule adopted: split when each direction has about 10k+ verified volume and a different SERP; if Keyword Planner shows under that, merge back into one page with a toggle. Costs about 0.5 day on the shared PayEngine. |
| 39 | Timestamp Generator for Discord | discord-timestamp-generator | social-media | discord timestamp generator | 30k-80k (estimate; 6+ exact-match domains and a large single leader; unverified) | low-medium | Best demand-to-competition mix in the creator category (hobby sites, exact-match domains), trivial build, room for a richer page. Competitor brand keywords are not used in titles or copy. |
| 40 | Colored Text Generator for Discord | discord-colored-text-generator | social-media | discord colored text generator | 10k-30k (estimate; unverified, validate in Keyword Planner) | low | Low competition with clear tool intent (GitHub, CodePen and hobby pages); pairs with the timestamp generator for Discord topical authority. Before writing, verify the current ANSI palette (a reported August 2026 change) and client support, and show last-verified dates. |
| 41 | Money Calculator for YouTube Creators (Long-Form & Shorts) | youtube-money-calculator | social-media | youtube money calculator | 60k-150k (estimate from SERP saturation; unverified) | high | Large, mostly Tier-1 audience with high ad value. Page 1 is Social Blade, Influencer Marketing Hub and Sellfy, so target the informational cluster ('how much does YouTube pay per 1000 views') with deep content. The separate Shorts calculator was merged in as a toggle and section (and an RPM mode) to avoid a near-duplicate page. |
| 42 | Watch Time Calculator for YouTube Monetization | youtube-watch-time-calculator | social-media | youtube watch time calculator | 5k-15k (estimate; small exact-match tools rank; unverified) | low-medium | Strong intent from aspiring creators, 10+ small dedicated pages, easy win, and it interlinks with the money calculator. A search snippet reported the YPP watch-hour bar changing (8,000 hours from 2027-02-01); this is unverified, so the page is built to switch on a dated threshold config. |
| 43 | Grid Maker for Instagram (Image Splitter) | instagram-grid-maker | social-media | instagram grid maker | 10k-30k (estimate; 10+ dedicated tools including exact-match domains; unverified) | medium | Clear intent and a privacy selling point, but page 1 includes SaaS lead-gen pages and exact-match domains. Lead with '3:4 instagram grid', '3x4 grid maker' and the 'why the 2025 profile grid change broke old splits' guide after a Google Trends check. |
| 44 | Color Contrast Checker (WCAG 2.2) | color-contrast-checker | design | color contrast checker | 40k-80k global cluster (Semrush US export Apr 2026: color contrast checker 9,900 CPC $3.40; contrast checker 6,600 CPC $2.41; color contrast 2,900 CPC $5.65) | high | Highest ad value in the design category with a stable trend. The head term is hard (WebAIM), so target auto-fix and 'fix Lighthouse insufficient contrast' long-tails. Builds the shared culori colour engine used by every later colour tool. |
| 45 | CSS Box Shadow Generator | box-shadow-generator | design | box shadow generator | 30k-70k (estimate; SERP observed 2026-09-29 with small sites on page 1; unverified) | medium | High developer demand and engagement, small sites share page 1, and better UX (layers, smooth elevation presets) is a real edge. One of the safest design picks. |
| 46 | CSS Clamp Calculator (Fluid Typography) | clamp-calculator | design | css clamp calculator | 3k-8k (estimate; utopia.fyi, clamp.font-size.app and fluid-type-scale.com rank; unverified) | low | Modern developer need with a weak SERP; links naturally to px-to-rem. Low volume, so it is an authority page. |
| 47 | CSS Border Radius Generator | border-radius-generator | design | border radius generator | 5k-15k (estimate; unverified) | low | Pulled forward from Month 3 to keep the design category at four tools after deferring the liquid-glass and Tailwind generators. Low competition, trivial build, shares the colour and copy-output components. |
| 48 | Password Generator | password-generator | utilities | password generator | 500k-1.2M (estimate reconciling conflicting planning figures; unverified) | high | Already built (v1). Needed for topical authority and the security audience; sub-intents (16 characters, no symbols) are the realistic entry points. Head-term slot, sunk cost. |
| 49 | Keyboard Tester | keyboard-tester | utilities | keyboard tester | 200k-500k (estimate; no hard figure retrievable, validate in Keyword Planner) | medium | Beatable SERP (small exact-match sites, some store apps), gamers and laptop buyers repeat-test, and it anchors the device cluster. Build effort goes here first. |
| 50 | Dead Pixel Test (Screen Test) | dead-pixel-test | utilities | dead pixel test | 40k-100k (estimate; SERP of small sites; unverified) | low | Low competition and evergreen, and it naturally carries full-screen white, black and red long-tails. |
| 51 | Mouse Test (Buttons, Scroll & Double-Click) | mouse-test | utilities | mouse test | 30k-80k (estimate; unverified) | low | Low-competition part of the device cluster with a common hardware fault (unintended double clicks) as its hook. Primary keyword corrected to 'mouse test'; 'mouse click test' belongs to click-speed-test. |
| 52 | Click Speed Test (CPS Test) | click-speed-test | utilities | click speed test | 300k-800k (estimate; small exact-match sites on page 1; unverified) | low-medium | Moved up from Month 1. Small exact-match sites dominate, it completes the device cluster (keyboard, mouse, CPS), and it is a cheap build. Owns 'mouse click test'. |

## 4. Tool specifications and content angles

### Text & Writing Tools

#### Word Counter (`/tools/word-counter`)

- Primary keyword: word counter
- Secondary keywords: word count, word count checker, essay word counter, online word counter, count words in text
- Volume: 800k-1.5M (Ahrefs snippet: 'word counter' 792K US, 'word count' 214K US)
- Competition: high
- Tool spec: Live counts of words, characters (with and without spaces), sentences, paragraphs, plus a top-keywords table. Default rule set is 'whitespace-separated tokens, like Word', with a 'Docs-style' toggle for hyphen, em dash and URL differences (we do not claim to match both apps exactly). Goal presets (Common App 650, IB Extended Essay 4,000, meta description, X post) with a progress bar and over-limit warning; each preset links to its official source and says 'check the official portal before submitting'. Last text kept in localStorage inside try/catch with a visible Clear button. Gap audit against v1 required: add Intl.Segmenter counting with a regex fast path, debounced, moved to a Worker above about 200 KB. Owns 'word counter' and 'word count' only; reading and speaking time is one line that links to /tools/words-to-time. No pop-ups, nothing above the tool except the H1, and no named-competitor comparisons in copy.
- Content angle: How word-count rules differ between Word, Google Docs and platforms (hyphens, numbers, URLs, em dashes) with a small documented test set. Reference table of common limits (college essays, abstracts, grant sections, social posts) with source links and a 'last reviewed' date. How to count words in Docs, Word, Pages and a PDF. Privacy answer worded precisely: input is processed in your browser and we do not upload or store it.
- AdSense and policy notes: Counting tool only; never offer essay writing. Use the shared precise privacy sentence, no '100% private' claims. Ad units go outside and below the tool container.

#### Character Counter (`/tools/character-counter`)

- Primary keyword: character counter
- Secondary keywords: character count, character counter with spaces, character count without spaces, letter counter, characters to words, how many words is 500 characters
- Volume: 300k-600k (Ahrefs snippet: 'character counter' 216K US, 'character count' 78K US)
- Competition: high
- Tool spec: Counts characters with and without spaces, letters only, graphemes (Intl.Segmenter, emoji and accents counted once) versus UTF-16 length, and UTF-8 bytes. SMS segments with GSM-7 (including the extension table where euro and brackets cost 2) versus UCS-2 (160/153 vs 70/67). Platform limit bars: X 280 using our own implementation of the published weighting (CJK and emoji weigh 2, URLs count 23; note edge cases), Instagram 2,200, LinkedIn 3,000, YouTube title 100, meta description about 155-160. Over-limit text highlighted. Built-in conversion section: characters to words and back with a with/without-spaces toggle, language presets, a paste-your-own-text ratio, and a 100-10,000 lookup table (UCAS 4,000, AMCAS 5,300, LinkedIn About 2,600 presets, each with source link). Gap audit against v1: Intl.Segmenter, GSM-7 table and X weighting are not yet implemented. Instagram and SMS keywords are NOT targeted here; they belong to the Month 3 platform counters.
- Content angle: Why character counts differ between tools (emoji, CJK, grapheme clusters, line breaks). Dated 2026 platform-limit table with sources. SMS encoding explained: one emoji switches a message to UCS-2 and halves the limit. Why the average English word is about 4.7 letters, giving roughly 5.5-6.5 characters per word including space and punctuation; worked examples for 250, 500, 1,000 and 4,000 characters; how application portals count spaces and line breaks (verify on the portal). Excel =LEN() and Google Docs how-tos.
- AdSense and policy notes: Do not mass-generate 'X characters to words' pages. Presets are labelled not affiliated with UCAS, AAMC or Common App.

#### Case Converter (`/tools/case-converter`)

- Primary keyword: case converter
- Secondary keywords: convert case, uppercase to lowercase, lowercase to uppercase, sentence case converter, camel case converter, snake case converter
- Volume: 250k-450k (Semrush snippet: 'case converter' 222,200/mo; convertcase.net 5.02M visits/mo)
- Competition: medium-high
- Tool spec: UPPER, lower, Sentence, Capitalized, aLtErNaTiNg, InVeRsE, plus developer cases camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, dot.case using an acronym-aware word splitter (XMLHttpRequest, userID; tested on 30 identifiers). Title case is ONE simple button (AP-style default) that links to the dedicated /tools/title-case-converter (Month 1), which owns 'title case converter', APA, Chicago and MLA; the AP/Chicago toggle is not built here. Acronym rule: if more than about 60% of letters are uppercase treat the text as shouting and lowercase it, otherwise keep tokens of 2+ capitals; a user acronym list is always honoured. Undo history, shortcuts, copy, .txt download; 1 MB+ input instant.
- Content angle: Example table of every case on one sentence. How to change case in Word (Shift+F3), Google Docs, Excel (=UPPER/LOWER/PROPER) and Mac. Naming conventions by language (JS camelCase, Python snake_case, CSS kebab-case, constants). Pitfalls: proper nouns, acronyms, Turkish dotted i and locale-aware lowercasing. Sentence case vs title case for headlines, linking to the title-case page.
- AdSense and policy notes: None.

#### Remove Line Breaks (`/tools/remove-line-breaks`)

- Primary keyword: remove line breaks
- Secondary keywords: line break remover, remove line breaks from pdf text, remove paragraph breaks, remove empty lines, join lines online, convert line breaks to spaces
- Volume: 30k-60k (estimate from autocomplete + competitor coverage; textfixer 867K visits/mo per Semrush is a site total, not this term)
- Competition: medium
- Tool spec: Modes: remove all breaks, keep paragraph breaks (double newline), replace with space, comma or custom string, or remove empty lines only. Normalises CRLF, CR and U+2028/U+2029; trims trailing spaces. Rejoining words hyphenated across lines is opt-in and default OFF, with a note that compounds such as well-known would be damaged. Built on the shared LineListEngine with distinct defaults from the sibling pages. Before/after counts, copy, download; large input processed in chunks or a Worker.
- Content angle: Why text copied from PDFs and emails has hard line breaks (fixed-width layout, soft vs hard returns). Step-by-step for Word (^p and ^l), Excel (Ctrl+H with Ctrl+J), Google Docs regex, Notepad++ and VS Code regex. Worked before/after PDF paragraph. Mentions the inverse task (adding line breaks) and links to the future Instagram line-break tool.
- AdSense and policy notes: None.

#### Remove Duplicate Lines (`/tools/remove-duplicate-lines`)

- Primary keyword: remove duplicate lines
- Secondary keywords: duplicate line remover, remove duplicates from list, dedupe list online, unique lines, find duplicate lines
- Volume: 15k-40k (estimate from autocomplete + 10+ competitor pages; unverified)
- Competition: medium
- Tool spec: Case-sensitive toggle, trim-before-compare, ignore empty lines, keep first or last occurrence, 'duplicates only' mode and a 'show removed lines with counts' panel. The A-Z sort option is NOT included (that intent belongs to /tools/alphabetical-order; a link is provided). No 'remove duplicate words' claim. Set-based, handles 100k+ lines; counts in, out and removed.
- Content angle: How-tos for Notepad++ (Line Operations), Excel (Remove Duplicates, =UNIQUE), Google Sheets, Linux sort -u / awk and VS Code. Case and whitespace pitfalls (emails with trailing spaces, Apple vs apple). Use cases: email lists, keyword lists, log files, CSV cleanup. Worked example with the removed-lines report.
- AdSense and policy notes: None.

#### Alphabetical Order Tool (Sort Lines A-Z) (`/tools/alphabetical-order`)

- Primary keyword: alphabetical order tool
- Secondary keywords: alphabetizer, put in alphabetical order, sort list alphabetically, abc order, reverse alphabetical order, alphabetize by last name
- Volume: 60k-150k (estimate; unverified, validate in Keyword Planner before building)
- Competition: medium-high
- Tool spec: A-Z and Z-A with Intl.Collator (accents sort correctly), natural numeric sort (item2 before item10), ignore leading articles (The/A/An), sort by last name, length or random. Optional case-insensitive dedupe as a small checkbox that links to /tools/remove-duplicate-lines for the full tool. Input and output separators: new line, comma, semicolon, custom. Shared LineListEngine; copy button.
- Content angle: How to alphabetize in Google Docs (no native feature; add-on and Sheets workarounds), Word, Excel and Sheets. Filing rules: letter-by-letter vs word-by-word, Mc/Mac, numbers and symbols, APA reference ordering. Worked examples of 'The' handling and last-name sorting. Why plain code-point sorting puts Zebra before apple and how this tool avoids it.
- AdSense and policy notes: None.

#### Words to Time Calculator (Reading & Speaking Time) (`/tools/words-to-time`)

- Primary keyword: words to time
- Secondary keywords: words to minutes, speech time calculator, reading time calculator, how many words is a 5 minute speech, how long does it take to read 1000 words, speaking time calculator
- Volume: 80k-200k cluster (Semrush snippet: wordstotime.com 180K visits/mo, 64% Google organic; treat as an upper bound for one page)
- Competition: medium
- Tool spec: Paste text or type a word count. One speaking-pace selector (slow 130, average 150-160, fast 180-200) and a separate silent-reading row (238 wpm), each labelled with its source; custom WPM slider. Reverse mode: words needed for N minutes. Pause time per paragraph or slide. Presets: podcast intro, wedding toast, TED-style talk, 15/30/60-second voice-over. Uses the shared word-count function.
- Content angle: Research basis (Brysbaert 2019 meta-analysis: 238 wpm silent reading; verify the aloud figure against the paper before quoting). Table converting 1, 2, 3, 5, 10 and 20 minutes into words at several paces. Voice-over script lengths for ad spots. Why technical and non-native text reads slower. Pacing tips. Goes deep on speaking; the word counter only links here.
- AdSense and policy notes: None.

#### Words to Pages Calculator (`/tools/words-to-pages`)

- Primary keyword: how many pages is 1000 words
- Secondary keywords: words to pages, pages to words, how many pages is 500 words, words per page, double spaced pages calculator
- Volume: 60k-150k cluster (estimate; unverified, validate in Keyword Planner)
- Competition: medium
- Tool spec: Words to pages and pages to words, with font (Times New Roman 12, Arial 11, Calibri 11, Courier 12), spacing (single, 1.5, double), margin and paper (Letter, A4) selectors; paste-text mode using the shared word counter; lookup table for 250 to 10,000 words generated from the same function as the tool so table and tool cannot disagree. One page only; no per-number pages.
- Content angle: Words per page by font and spacing with the layout formula explained; essay, dissertation and manuscript conventions; why page counts differ between Word, Docs and print. Any 'we measured in Word' statement must link to a committed test artifact, otherwise state the assumption. Worked examples for 500, 1,000, 2,000 and 5,000 words.
- AdSense and policy notes: Do not add programmatic 'N words to pages' pages (scaled content).

#### Comma Separator (Column to Comma List) (`/tools/comma-separator`)

- Primary keyword: comma separator
- Secondary keywords: column to comma separated list, convert list to comma separated, new line to comma, add commas to list, list to sql in clause
- Volume: 15k-40k (estimate; unverified)
- Competition: medium-low
- Tool spec: Lines to delimited list and back. Delimiter choices (comma, semicolon, pipe, tab, custom), wrap items in single or double quotes, trim, drop blanks, optional dedupe, and ready-made outputs for SQL IN (...), JSON array and Python list. Paste straight from an Excel or Sheets column. Copy and download. Handles 1M characters.
- Content angle: Why analysts need comma lists (SQL IN clauses, email lists, tags). Excel TEXTJOIN and Sheets JOIN formulas as alternatives. Quoting and escaping rules for SQL and CSV. Worked example from a pasted column to an IN clause.
- AdSense and policy notes: None.

#### Invisible Character (Blank Text Copy & Detect) (`/tools/invisible-character`)

- Primary keyword: invisible character
- Secondary keywords: blank text copy paste, empty character, zero width space copy, u+2800 braille blank, hangul filler, detect hidden characters in text
- Volume: 80k-200k cluster (estimate; 8+ small exact-match sites on page 1; unverified)
- Competition: medium
- Tool spec: One-click copy for each invisible or blank code point (U+200B, U+200C, U+200D, U+2060, U+00A0, U+2800, U+3164, U+FEFF and others) with name, code point and a where-it-renders table showing a last-verified date per platform. Second tab: paste text to highlight and count hidden characters, then remove or replace them. No claims about bypassing filters or usernames.
- Content angle: What each code point is and why it exists (joiners, word joiner, non-breaking space, Braille blank). Why hidden characters break code, CSVs and copy-pasted text, and how to find them. Rendering differences by app, listed only where verified. Explicitly not a tool for evading moderation.
- AdSense and policy notes: No 'blank name for games', 'bypass filter' or ban-evasion copy or keywords. Frame around spacing and cleaning text.

### SEO Tools

#### Title Tag & Meta Description Length Checker (Pixel Width) (`/tools/title-meta-description-length-checker`)

- Primary keyword: meta description length checker
- Secondary keywords: title tag length checker, meta description pixel checker, title tag pixel width, meta title length checker, seo title length, meta description character counter
- Volume: 3k-8k for the description checker, 3k-6k for the title checker, plus informational 'meta description length' and 'title tag length' (estimate from autocomplete; unverified, validate in Keyword Planner)
- Competition: medium
- Tool spec: Two tabs (Title, Description) sharing one width engine. Widths are computed deterministically from a bundled Arimo (Apache-2.0, metric-compatible with Arial) advance-width table for Latin-1 and common punctuation, with canvas measureText only as fallback for other scripts; output is labelled 'estimated pixel width' because Google truncates dynamically and its fonts are proprietary. Limits live in one config file (desktop title about 600 px, desktop description about 920 px, mobile about 680 px), re-verified against live SERPs and printed on the page with the check date. Live desktop and mobile preview with ellipsis position, brand-suffix builder, keyword-position indicator, title 'rewrite risk' checklist from Google's title-link documentation. Bulk mode: paste URL,title,description rows for a pass/warn/fail table with duplicate detection and CSV export.
- Content angle: Why pixels matter more than characters, worked example WWWW vs iiii. Dated, source-linked facts only: Google often rewrites titles and descriptions (cite a dated study, not one number), descriptions are not a ranking factor but influence CTR, and how AI Overviews change snippet importance. Any statement about 2026 title-rewrite tests must be checked against the primary source before publishing, or removed. Title vs H1, separators and brand placement, good vs truncated examples by page type, bulk audit workflow from a crawler export.
- AdSense and policy notes: Do not say 'pixel-accurate'. Bundle the font and list its licence on /licenses.

#### SERP Snippet Preview Tool (Desktop & Mobile) (`/tools/serp-snippet-preview`)

- Primary keyword: serp preview tool
- Secondary keywords: serp simulator, serp snippet optimizer, google snippet preview, meta title preview, how will my page look on google
- Volume: 5k-12k combined across synonyms (estimate; highervisibility.com 271K visits/mo is a site total; unverified)
- Competition: medium
- Tool spec: Generic mockup (no Google logo, no exact brand colours, no search bar) showing site name, favicon (local upload), breadcrumb URL, optional date, title and description, with query-keyword bolding, desktop and mobile widths and a dark theme. Side-by-side A/B of two versions. PNG export drawn directly on canvas with the same width table (no html-to-image), carrying a small 'Preview - not a real search result' watermark. State in the URL hash via debounced history.replaceState. Footer line: 'Illustration only. Not affiliated with or endorsed by Google.' Paste mode only; no page fetching. Reuses the shared SerpPreview and PixelMeter components.
- Content angle: Anatomy of a current Google result (site name, favicon, breadcrumb, date) with the check date. What Google may rewrite and why. Rich-result status: verify against Google Search Central before stating dates (the draft's 7 May 2026 FAQ rich result removal and the HowTo retirement must be confirmed or dropped). CTR-improvement checklist with before/after examples produced by the tool.
- AdSense and policy notes: H1 uses 'SERP Snippet Preview', not 'Google SERP'. 'Google' appears only descriptively in body copy.

#### llms.txt Generator (`/tools/llms-txt-generator`)

- Primary keyword: llms.txt generator
- Secondary keywords: llms txt generator, create llms.txt, llms.txt example, what is llms.txt, llms-full.txt, llms.txt vs robots.txt
- Volume: 1k-4k and rising (estimate from 2026 roundups; validate with Google Trends)
- Competition: medium
- Tool spec: Form fields: site name, one-paragraph summary, optional notes, repeatable sections of link plus description rows. Outputs spec-compliant Markdown (H1, blockquote summary, H2 sections, 'Optional' section) with a structural validator (absolute URLs, required H1, empty sections). Imports URLs from a pasted sitemap.xml. Downloads llms.txt and a llms-full.txt skeleton.
- Content angle: What the llms.txt proposal is (Jeremy Howard, September 2024) and an honest status: major AI providers have not confirmed they use it, so present it as low-cost and optional, not a ranking lever. llms.txt vs robots.txt vs sitemap.xml. Where to host it. Example files for a SaaS docs site, a blog and a shop. How to add it in WordPress and Next.js.
- AdSense and policy notes: State plainly that AI vendor adoption is unconfirmed; no overpromising.

#### .htaccess & Nginx Redirect Generator (`/tools/htaccess-redirect-generator`)

- Primary keyword: htaccess redirect generator
- Secondary keywords: 301 redirect generator, bulk redirect generator, htaccess generator, nginx redirect generator, http to https redirect htaccess, www to non-www redirect
- Volume: 3k-6k combined (estimate; unverified)
- Competition: low
- Tool spec: Single and bulk modes (CSV of old,new). Launch outputs: Apache (Redirect 301 and RewriteRule with RewriteCond %{QUERY_STRING} handling), Nginx (return 301, and a map block only above about 20 rules), Netlify _redirects, Vercel vercel.json and IIS web.config. Cloudflare bulk-redirect CSV is added after checking the current column spec. Per-server escape functions with golden-file tests; CI validates generated samples with nginx -t and httpd -t in Docker. Presets for HTTP to HTTPS, www to non-www, trailing slash, full domain move. Chain and loop detection on the pasted list, and a warning when the list exceeds each platform's limit.
- Content angle: 301 vs 302 vs 307 vs 308 table with when to use each. How redirects pass signals. Site-migration redirect checklist. Common .htaccess loop causes and fixes. Worked example of the same redirect on each server.
- AdSense and policy notes: None.

#### URL Slug Generator (`/tools/slug-generator`)

- Primary keyword: slug generator
- Secondary keywords: url slug generator, seo friendly url generator, slugify text, text to slug, wordpress permalink slug
- Volume: 10k-25k (estimate; slugify.online 290K visits/mo is a site total; unverified)
- Competition: medium-low
- Tool spec: Text to slug with separator (- or _), lowercase, stop-word removal toggle, max length, Latin transliteration (diacritics, optional German umlaut rules, basic Cyrillic and Greek), batch mode (one slug per line) and a URL preview with length. Copy and CSV download.
- Content angle: Slug best practices (short, hyphens, no dates unless needed) citing Google's URL structure guidance. Changing slugs safely and the redirect implications, linking to the redirect generator. Slug rules in WordPress, Shopify and Next.js. Non-Latin URLs and percent-encoding.
- AdSense and policy notes: None.

### Developer Tools

#### JSON Formatter & Validator (`/tools/json-formatter`)

- Primary keyword: json formatter
- Secondary keywords: json validator, json beautifier, json viewer, json pretty print, fix invalid json, json minify
- Volume: 400k-700k cluster (estimate from Ahrefs/Semrush knowledge; jsonformatter.org 2.57M visits/mo is a site total)
- Competition: high
- Tool spec: Gap audit required: v1 has no jsonrepair, Worker or virtualised tree. Target: format, minify (a tab, not a page), validate with a small hand-written tokenizer that reports offset, line, column and a classified error (trailing comma, single quotes, unquoted key, comment, NaN) identically in every browser. Lazy-loaded jsonrepair for a Repair button. Parse and format in a Worker above about 1 MB. Virtualised tree with click-to-copy JSONPath, first two levels expanded. Keep v1's lossless big-number handling and put it in the content. Sort keys, indent 2/4/tab, stringify/unstringify. Claim a size limit (for example 20 MB) only after benchmarking on a mid-range phone.
- Content angle: JSON syntax rules and the ten most common errors with fixes. JSON vs JSON5/JSONC. Pretty-printing in JavaScript, Python, jq, VS Code and Notepad++. Privacy: the formatter runs in your browser and we do not upload or store your input; ads and analytics make separate requests. Do not paste production secrets into any website. Practical size limits.
- AdSense and policy notes: Pure utility. Never say 'nothing leaves your device' or 'check the network tab'. Ads outside the tool container only.

#### SQL Formatter (15+ Dialects) (`/tools/sql-formatter`)

- Primary keyword: sql formatter
- Secondary keywords: sql beautifier, format sql query online, snowflake sql formatter, bigquery sql formatter, t-sql formatter, postgresql formatter
- Volume: 50k-90k cluster (estimate; unverified)
- Competition: medium-high
- Tool spec: sql-formatter library (already in package.json), dynamically imported in the tool chunk only. Dialect picker (MySQL, MariaDB, PostgreSQL, T-SQL, PL/SQL, BigQuery, Snowflake, Spark, SQLite, Redshift, DB2, Trino). Options: keyword and data-type case, indent width, commaPosition, tabularLeft (river) style, expressionWidth, lines between statements. Own minifier built on a small scanner that understands single, double, backtick and bracket quotes, dollar quoting and -- and /* */ comments (converts -- comments before joining lines). Syntax highlighting from the same scanner. Parser errors shown inline with line and column, never a silent fallback. Dialect sections carry their own H2 and title variants (Snowflake, BigQuery, T-SQL, PostgreSQL).
- Content angle: Formatting conventions (river style, leading-comma debate, keyword case). Dialect differences that affect formatting: identifier quotes, QUALIFY, TOP vs LIMIT. Formatting in SSMS, DBeaver, DataGrip and VS Code. Worked messy-CTE before and after. Formatting never changes performance.
- AdSense and policy notes: None.

#### UUID / GUID Generator (v4, v7, ULID) (`/tools/uuid-generator`)

- Primary keyword: uuid generator
- Secondary keywords: guid generator, uuid v4 generator, uuid v7 generator, bulk uuid generator, ulid generator, uuid validator
- Volume: 120k-220k cluster (estimate; unverified)
- Competition: medium
- Tool spec: Two tabs: Generate (type chips for v4 via crypto.randomUUID, v7, v1, v5 with namespace, nil/max, ULID, NanoID; count; format options uppercase, no dashes, {braces}, quoted CSV for SQL, JSON array) and Decode/validate (version, embedded timestamp for v1, v7, ULID). v1 uses a random node id with the multicast bit set and says so. v5 is async with a spinner. Bulk up to 10,000 into a textarea (not 10,000 DOM nodes). v7 strictly monotonic within a batch. Copy all, download.
- Content angle: Table of UUID versions. v4 vs v7 as database primary keys (index locality, worked example). Collision probability with real numbers. UUID vs GUID. Snippets for JavaScript, Python, Java, C#, Go, PostgreSQL (gen_random_uuid, uuidv7) and MySQL.
- AdSense and policy notes: None.

#### Hash Generator (MD5, SHA-256, SHA-512, CRC32) (`/tools/hash-generator`)

- Primary keyword: hash generator
- Secondary keywords: md5 hash generator, sha256 hash generator, sha1 hash generator, sha512 generator, file checksum calculator, crc32 calculator
- Volume: 150k-300k cluster (estimate: md5 generator 40k-70k, sha256 generator 30k-50k; unverified)
- Competition: medium
- Tool spec: Text or file hashing in MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA3-256 and CRC32. Files are read with file.stream() in a Worker and every hasher is fed from one pass; hash-wasm algorithms loaded lazily one by one. Progress bar with cancel and throughput estimate. Advertised file size is the benchmarked limit (desktop; slower on phones), not 'multi-GB'. Compare box with match/mismatch, hex or Base64 output, trailing-newline toggle, UTF-8 note. Warning: do not paste production secrets. No decrypt or lookup features, ever.
- Content angle: Hashing is one-way, not encryption. Which algorithms are broken for security (MD5, SHA-1) and which to use. Verifying a download with sha256sum, Get-FileHash and shasum. Why identical text gives different hashes (trailing newline, encoding, CRLF). Password hashing is different (bcrypt/argon2, coming later).
- AdSense and policy notes: Hashing only. Never add md5 decrypt, hash cracker or rainbow-table lookup.

#### Cron Expression Generator & Explainer (`/tools/cron-expression-generator`)

- Primary keyword: cron expression generator
- Secondary keywords: crontab generator, cron expression explained, cron every 5 minutes, quartz cron expression generator, github actions cron schedule, aws eventbridge cron
- Volume: 80k-150k cluster (estimate; unverified)
- Competition: medium-high
- Tool spec: In-house scheduler of about 150-250 lines instead of relying on cron-parser: parses fields into sets with a per-dialect weekday mapping and supports L, W, #, optional year, ? and @macros. Dialect switch: Unix 5-field, Kubernetes CronJob and GitHub Actions (same engine with notes: GitHub is UTC only, 5-minute minimum), Quartz/Spring 6-7 field, AWS EventBridge. Next 10 runs in the user's zone and UTC via Intl.DateTimeFormat with DST handling (no luxon), computed client-only after mount. cronstrue (already installed, no i18n bundle) only for the English explanation. Visual builder, presets, field-level errors. 30 expressions unit-tested against crontab.guru and the Quartz docs.
- Content angle: Field reference and special characters (* , - / L W # ?). Ten common schedules. Time-zone and DST pitfalls. Why cron jobs do not run (PATH, permissions, environment, % escaping). Differences between Unix, Quartz and cloud dialects.
- AdSense and policy notes: Keep any future schedule sub-pages to a hand-written handful.

#### Chmod Calculator (Linux File Permissions) (`/tools/chmod-calculator`)

- Primary keyword: chmod calculator
- Secondary keywords: chmod 755, chmod 777, chmod 644, linux permissions calculator, octal permissions calculator, chmod +x
- Volume: 30k-60k for the tool; informational 'chmod 755' style queries are answered by Stack Overflow and Wikipedia and are supporting text, not a forecast (estimate; unverified)
- Competition: medium
- Tool spec: Checkbox grid (owner/group/others x read/write/execute) synced both ways with octal (755) and symbolic (rwxr-xr-x). Setuid, setgid and sticky bits. Copy-ready commands including the recursive find pattern that sets directories and files differently. Presets for WordPress, Laravel storage and SSH keys (600) with a clear security warning on 777. Single-file component; the common-modes table is generated from the same functions.
- Content angle: How permission bits map to octal (worked binary math). Table of common modes (777, 755, 750, 700, 644, 640, 600, 400) with when to use each. What execute means on directories. umask. Worked fixes for Permission denied and WordPress upload errors.
- AdSense and policy notes: None.

### Image Tools

#### WebP to PNG Converter (`/tools/webp-to-png`)

- Primary keyword: webp to png
- Secondary keywords: webp to png transparent, batch webp to png, open webp file, save webp as png, convert webp to png without losing quality, webp to png converter
- Volume: 300k-600k global; US 165,000 came from a single third-party CSV export and is unverified (validate in Keyword Planner before treating this pair as the flagship)
- Competition: high
- Tool spec: Drag-drop, picker or paste (Ctrl+V; pasted files named pasted-image-N) of multiple WebP files. Decoded and encoded on canvas; copy says 'PNG keeps every pixel of the decoded image', not 'lossless conversion'. Batch via the shared ImageConverter engine, concurrency 2, per-file progress, original names kept, before/after sizes, ZIP download, object URLs revoked, batch cap 50 files or 300 MB with a friendly message. Animated WebP detected via the RIFF VP8X animation bit, with a 'first frame only' notice. No offline claim and no watermark or limits.
- Content angle: Why browsers save images as WebP. When you need PNG. PNG vs WebP comparison table. OS-native options (Mac Preview, Windows Photos/Paint) and their limits. Size differences: only quote measured numbers that link to a committed test artifact (inputs, script, results, browser version, date), otherwise explain the factors. Privacy note using the shared precise sentence.
- AdSense and policy notes: User's own local files only. No 'nothing leaves your device' or offline claims.

#### WebP to JPG Converter (`/tools/webp-to-jpg`)

- Primary keyword: webp to jpg
- Secondary keywords: convert webp to jpg, webp to jpeg, save webp as jpg, batch webp to jpg, webp to jpg without losing quality, save webp as jpg on mac
- Volume: 200k-400k global; US 110,000 + 'convert webp to jpg' 22,200 + 'webp to jpeg' 12,100 (single third-party Semrush-style export, unverified; CPC in that export was about $0.01)
- Competition: high
- Tool spec: Same engine as webp-to-png plus a JPEG quality slider with live size estimate, background-fill colour for transparent areas (white default), batch with ZIP, filename preservation, and a note that metadata is not carried over. Batch cap 50 files or 300 MB.
- Content angle: JPEG quality choices (a quality vs size table only if backed by a committed test artifact), flattening transparency, where JPG is required (government and job portals, older CMSs, photo labs), jpg vs jpeg. Different intent and copy from the PNG page.
- AdSense and policy notes: None.

#### HEIC to JPG Converter (`/tools/heic-to-jpg`)

- Primary keyword: heic to jpg
- Secondary keywords: heic to jpg converter, convert heic to jpg, heif to jpg, open heic file on windows, iphone photo to jpg, heic to jpg without uploading
- Volume: 150k-400k global English (Ahrefs Global export 2026-07: 'how to convert HEIC to JPG' 110,000 KD 39, 'HEIF to JPG' 5,400 KD 21; Keyword Planner all-locations 1.22M, +22% YoY)
- Competition: high
- Tool spec: libheif-js (or a pinned heic2any) used only inside a dedicated Web Worker, imported dynamically on the first file drop; the WASM ships as a separate unmodified lazy file. Feature-detect native HEIC first (Safari) and skip WASM when possible. Concurrency 1-2 with per-file progress. Launch behaviour: metadata is always stripped and the UI says so (a keep-metadata toggle via exifr plus piexifjs is a later version). JPG quality slider, warning that HDR/P3 profiles become sRGB, batch with ZIP, multi-image containers use the primary image. Decode only; never JPG-to-HEIC. WASM size tracked in a per-tool bundle budget.
- Content angle: What HEIC/HEIF is and why iPhones use it. Setting the iPhone to Most Compatible. Opening HEIC on Windows 10/11 (HEIF extension) and Mac (Preview export). Google Photos and email behaviour. Why uploading personal photos to converter sites is a privacy concern, with the precise privacy sentence. A quality and size comparison only if backed by a committed test artifact. Short HEIC-to-PNG section linking to the Month 1 page.
- AdSense and policy notes: LGPL and HEVC: separate unmodified library file, notices on /licenses, legal review of patent exposure before launch. No offline or network-tab claims.

#### SVG to PNG Converter (`/tools/svg-to-png`)

- Primary keyword: svg to png
- Secondary keywords: svg to png transparent, svg to png 512x512, svg code to png, convert svg to png high resolution, svg to jpg, svg to png converter
- Volume: 100k-300k global (Keyword Planner all-locations 301K cited by a low-credibility third-party PRD; treat as an upper bound)
- Competition: high
- Tool spec: Upload or paste SVG code. Parsed with DOMParser; missing width and height are injected from the viewBox (Firefox draws no-size SVGs as 0x0). Rendered only through an img blob URL, never injected into the DOM. Output clamped to about 16 MP with an explanatory message. Scale 1x-8x or exact size with aspect lock, transparent or coloured background, presets 512, 1024, favicon sizes, batch. Output PNG and JPG at launch (WebP later, since Safari canvas cannot encode it). Warns about foreignObject and external fonts, @import and url() references and explains how to inline them.
- Content angle: Vector vs raster. Resolution for web (device pixel ratio) vs print (DPI math with a worked example). Why SVG text differs (missing fonts). Exporting from Figma, Illustrator and Inkscape. Transparency and colour-profile notes.
- AdSense and policy notes: None. Never render untrusted SVG markup as HTML.

#### Compress Image to 100KB (or Any Size) (`/tools/compress-image-to-100kb`)

- Primary keyword: compress image to 100kb
- Secondary keywords: reduce image size to 100kb, compress jpg to 100kb, compress photo to 100kb, compress image to 50kb, reduce image size in kb
- Volume: 200k-400k global cluster, India-heavy; US est 5k-15k (Google Ads India export May 2026: reduce image size in kb 110,000; compress image to 100kb 60,500; compress image to 20kb 49,500)
- Competition: medium-high
- Tool spec: Target-size encoder, JPEG output only at launch (blob.type checked after every encode because Safari cannot encode WebP via toBlob). Runs in a Worker with OffscreenCanvas. Search: quality 0.5-0.92 at full size, then step dimensions down about 10% and repeat, never below a quality floor near 0.5; return the closest result at or under target, and if unreachable show 'smallest possible is X KB; reduce dimensions'. Presets 20, 50, 100, 200, 500 KB, 1 MB and custom; optional pixel or cm dimensions with DPI written by patching JFIF density bytes. Before/after zoom, sequential batch capped at 20 files.
- Content angle: Why forms impose KB limits (exam, job, visa portals, marketplaces, email). KB vs pixels vs quality with a worked example. Keeping faces and text sharp. Signature scans (10-20 KB). Compress vs resize. Generic table of typical limits with 'verify the current limit on the portal itself'.
- AdSense and policy notes: Avoid near-duplicate per-KB doorway pages.

#### EXIF Viewer (Photo Metadata Checker) (`/tools/exif-viewer`)

- Primary keyword: exif viewer
- Secondary keywords: exif data viewer, metadata viewer, photo metadata viewer, check photo location metadata, view exif online, image metadata checker
- Volume: 15k-40k global cluster (Semrush US export: metadata viewer 6,600, exif data 4,400, exif data viewer 2,900, exif viewer 2,400; the $6.82 CPC on 'metadata viewer' reflects asset-management advertisers, not this page)
- Competition: medium
- Tool spec: exifr lazily imported with an explicit segment list (tiff, xmp, icc, iptc, gps; makerNote only if serial-number extraction is kept). Formats: JPEG, HEIC, AVIF, PNG, TIFF; WebP only if we extract the RIFF EXIF chunk ourselves (about 20 lines) and hand it to exifr, otherwise drop WebP from the copy. Fixture files per claimed format in a Playwright test. Grouped table (camera, lens, exposure, dates, GPS, software). GPS as coordinates plus an OpenStreetMap link that loads nothing until clicked. Privacy summary of what the photo reveals, handoff to /tools/remove-exif-data, JSON export. XMP and IPTC strings are never rendered as HTML.
- Content angle: What EXIF, IPTC and XMP are. Which fields reveal what (location, device serial, editing history). Which platforms strip metadata on upload, dated with a verify note. Viewing metadata natively on Windows, Mac, iPhone and Android. Photographer use cases (settings, copyright fields).
- AdSense and policy notes: Frame as checking what your own photos reveal before sharing; no 'find where someone took this photo' copy.

#### Remove EXIF Data (Strip Photo Metadata) (`/tools/remove-exif-data`)

- Primary keyword: remove exif data
- Secondary keywords: remove metadata from photo, strip exif online, remove gps from photo, exif remover, delete photo location data, remove metadata from image
- Volume: 20k-60k global (Keyword Planner export via third-party CSV: 'exif data remove' 40,500, country unstated; unverified)
- Competition: medium-low
- Tool spec: JPEG: a marker walker (about 100 lines) that keeps ICC (APP2) and JFIF by default and replaces APP1 with a minimal EXIF segment holding only Orientation, so photos do not rotate; optional 'strip orientation too (re-encode)'. 'GPS only' mode uses piexifjs (or a small IFD editor) to remove the GPS IFD and pointer, tested on real Canon, Nikon and iPhone samples. PNG: drop tEXt, iTXt, zTXt, eXIf, tIME chunks. HEIC, WebP, AVIF fall back to a canvas re-encode to JPEG, labelled 're-encoded, all metadata removed'. Copyright: default removes location and device data and keeps creator and copyright fields via a visible toggle. exifr runs on the output to show a before/after diff, which doubles as the test. Batch with ZIP.
- Content angle: Removing location on iPhone (share-sheet Options), Android, Windows ('Remove Properties and Personal Information') and Mac. Lossless stripping vs re-encoding. What stripping cannot remove (landmarks, reflections). Use cases for marketplace sellers, journalists and parents. Rights note: only strip metadata from images you own or may modify; not for hiding the origin of copyrighted work.
- AdSense and policy notes: Same rights sentence in the Terms of Use. Privacy-positive framing, no infringement framing.

### Number & Format Converters

#### PX to REM Converter (`/tools/px-to-rem`)

- Primary keyword: px to rem
- Secondary keywords: px to rem converter, pixels to rem, 16px to rem, rem calculator, convert px to rem css, tailwind rem scale
- Volume: 15k-40k combined (estimate from SERP composition; unverified)
- Competition: medium-low
- Tool spec: Bidirectional px and rem with an editable root size, opening on px to rem and reachable as #rem-to-px. Live table for 1-128 px. Bulk mode converts px values in pasted CSS with a CSS-aware pass that masks comments, strings and url(), skips @media and @container params by default, honours an ignore list (1px borders, 0), preserves whitespace and rounds to 4 decimals. Copy as CSS, and as the nearest Tailwind class (p-6) with an arbitrary value fallback.
- Content angle: What px, rem and em are. Why rem respects user font-size settings (WCAG 1.4.4). Formula with worked examples, a full table, and when to keep px (borders, shadows). em vs rem compounding with nested examples. Tailwind's rem scale. Link to /tools/clamp-calculator.
- AdSense and policy notes: None.

#### Military Time Converter (+ Printable Chart) (`/tools/military-time-converter`)

- Primary keyword: military time converter
- Secondary keywords: military time chart printable, 24 hour to 12 hour converter, what time is 1900 in military time, 1700 military time, how to say 0630 military time, standard time to military time
- Volume: 50k-150k (estimate from autocomplete; unverified)
- Competition: medium-high
- Tool spec: Two-way converter that also shows how to say the time ('seventeen hundred hours'). Full 24-hour chart with minutes table; the printable Letter/A4 chart is a static PDF generated at build time and committed to /public (no PDF library shipped) plus print CSS on the page. Current time in military format rendered in an effect after mount, with an optional Z/Zulu letter. Prerendered HTML shows a fixed example.
- Content angle: How to convert (add or subtract 12, worked examples). Pronunciation rules. Midnight 0000 vs 2400. Use in healthcare charting, aviation and the military. Zulu time and military time-zone letters. Printable chart section.
- AdSense and policy notes: None.

#### Morse Code Translator (with Audio) (`/tools/morse-code-translator`)

- Primary keyword: morse code translator
- Secondary keywords: morse code decoder, text to morse code, morse code to text, morse code audio, morse code alphabet chart, sos in morse code
- Volume: 150k-350k (estimate from Similarweb: morsecode.world about 470k visits/mo, 40% US; unverified)
- Competition: medium
- Tool spec: Real-time text and Morse both ways. Web Audio playback with WPM, Farnsworth spacing and tone frequency; AudioContext resumed on first click with a note about the iPhone silent switch. WAV download via a 40-line PCM writer. Flashing-light mode is OFF by default behind a click-through photosensitivity warning, capped at 3 flashes per second (slower than the audio rate) and honours prefers-reduced-motion. Vibration mode only where navigator.vibrate exists. Tap-to-key practice input, prosigns, invalid characters flagged.
- Content angle: History (Morse and Vail, telegraph). Timing rules (dot 1, dash 3, gaps 1/3/7). Full chart with numbers, punctuation and prosigns. Learning methods (Koch, Farnsworth). Common phrases (SOS). Is Morse still used (amateur radio, aviation beacons).
- AdSense and policy notes: Photosensitivity warning before any flashing mode; no ad rendered while a flash mode runs.

#### Number to Words Converter (`/tools/number-to-words`)

- Primary keyword: number to words
- Secondary keywords: number to words converter, how to write numbers in words, amount in words, number to words in lakh crore, spell out numbers, write a check amount in words
- Volume: 60k-150k (estimate; unverified)
- Competition: medium
- Tool spec: BigInt and string-based decimal parsing (never Number) up to 10^30, with tests for 0, 1e30 and .05. Modes: plain words, currency (USD, GBP, EUR, CAD, AUD, INR with lakh/crore and correct subunits), check-style amount ('One thousand two hundred fifty and 50/100'), ordinals, case options, US vs UK 'and'. No printable check template, payee, MICR or bank fields. Copy button.
- Content angle: How to write out a check amount as education, with an illustrated example we create ourselves. Hyphenation rules (twenty-one). AP and Chicago rules for numbers in prose. Short vs long scale. Indian numbering table. Common mistakes. One sentence: this tool converts numbers to text; it does not print or issue cheques.
- AdSense and policy notes: No cheque-printing features or keywords.

#### Roman Numeral Converter (`/tools/roman-numeral-converter`)

- Primary keyword: roman numeral converter
- Secondary keywords: roman numerals, roman numeral date converter, roman numerals chart, convert numbers to roman numerals, roman numerals 1-100, roman numerals tattoo date
- Volume: 100k-300k with February peaks (estimate; Google Trends US peak Feb 2026; unverified)
- Competition: medium
- Tool spec: Two-way converter with validation that explains invalid input (IIII, VX, IC), date mode for tattoos (MM.DD.YYYY, separator choice), step-by-step breakdown, vinculum above 3,999 rendered with a CSS overline on spans (the Unicode combining form is copied separately), 1-100 chart and years table.
- Content angle: Additive and subtractive rules. A table of NFL championship game numerals may appear in the body as a factual reference only; 'Super Bowl' stays out of the title, H1, slug and meta description, with a not-affiliated-with-the-NFL note and an update before mid-January. Tattoo date formatting with 'always verify before inking'. Why clocks show IIII. Where numerals are used today.
- AdSense and policy notes: Trademark care: 'Super Bowl' only inside body text.

### Calculators

#### Percentage Calculator (`/tools/percentage-calculator`)

- Primary keyword: percentage calculator
- Secondary keywords: percent calculator, what percent of, percentage of a number, how to calculate percentage, percentage formula
- Volume: 1M-2M, US 500k+ (estimate anchored on Ahrefs: percentagecalculator.net about 396k visits/mo from #1 US)
- Competition: high
- Tool spec: Five modes on one page (X% of Y, X is what % of Y, % change, % difference, add/subtract %), each with worked steps; the page's copy and H2s target 'X% of Y' and 'what percent of' only, while 'percentage increase', 'percentage change' and 'percentage difference' keywords belong to the Month 1 /tools/percentage-increase-calculator. Keyboard-first input; shareable values in the URL hash via a shared useUrlState hook (never raw useSearchParams).
- Content angle: Formulas with worked examples per mode. Percentage vs percentage points. Excel and Sheets formulas. Common mistakes (wrong base, reversing an increase).
- AdSense and policy notes: None.

#### Chronological Age Calculator (for Testing) (`/tools/chronological-age-calculator`)

- Primary keyword: chronological age calculator
- Secondary keywords: chronological age calculator for testing, corrected age calculator, chronological age in months, slp age calculator, how to calculate chronological age
- Volume: 10k-40k (estimate from autocomplete breadth; unverified)
- Competition: medium-high
- Tool spec: Birth date plus test date (default today, set after mount) gives years;months;days in clinical notation (7;4;12) and total months. Borrowing convention toggle: 30-day borrow (most test manuals) vs calendar month, defaulting to the more common one and stating it. Rounding toggle (down, nearest month, none) with 'follow your test manual'. Corrected age from weeks premature with a configurable cut-off (commonly 24 months). Steps shown for hand verification. Built on the shared date-only util (UTC-anchored integers, tested for Feb 29 and month ends). Copy and print. Does not target 'age calculator years months days'.
- Content angle: Written for SLPs, school psychologists and teachers: the borrowing method with a worked example, why rounding differs between standardized tests, corrected age, common mistakes, a sample report line. Disclaimer: follow your test manual; not for clinical decisions on its own.
- AdSense and policy notes: Consequential-use disclaimer via the shared component with last-reviewed date.

#### Days From Today Calculator (`/tools/days-from-today`)

- Primary keyword: days from today
- Secondary keywords: 90 days from today, 60 days from today, 30 days from today, add days to date, business days from today
- Volume: Cluster 300k-700k but addressable by one page about 20k-60k because demand is split across per-N queries (estimate; unverified)
- Competition: medium
- Tool spec: Add or subtract days, weeks or months from today or any date; calendar vs business days (weekends excluded plus a user-supplied excluded-dates box; algorithmic US and England-and-Wales holiday rules are a later version); include-start-date toggle; weekday and ISO week; chips 30/60/90/120/180; shareable URL in the hash. Deterministic prerendered default (a fixed example) swapped for live values after mount. Date-only util with unit tests for leap years, month ends and DST weeks; adding 1 month to 31 January defined and explained.
- Content angle: Real uses: return windows, notice periods, visa stays, probation, payment terms (net 30/60/90), medication and warranty periods (general information). Calendar vs business-day counting with worked examples. Month-length pitfalls. Excel =WORKDAY and =EDATE. The 30/60/90 guides each take a different angle (returns and warranties, notice periods and probation, visas and payment terms).
- AdSense and policy notes: No programmatic 'N days from today' pages.

#### Hourly to Salary Calculator (`/tools/hourly-to-salary-calculator`)

- Primary keyword: hourly to salary calculator
- Secondary keywords: hourly wage calculator, $20 an hour is how much a year, hourly to annual salary, wage calculator, how much is 25 an hour per year
- Volume: 70k-150k cluster across both directions (search-snippet Semrush-type data: 33K and 38K US for the two directions; unverified)
- Competition: medium
- Tool spec: Hourly to annual, monthly, semi-monthly, biweekly, weekly, daily. Inputs: hours/week, weeks/year, unpaid time off, overtime hours at 1.5x. Quick table $15-$100/hour. Pre-tax only with a clear note (no tax tables). Shared PayEngine with the sibling page; different defaults, tables, FAQ and copy.
- Content angle: Formula (hourly x hours x weeks) and the 2,080-hour rule. Common wages to annual table. Salaried vs hourly trade-offs (overtime eligibility, PTO). Why take-home differs from gross. Worked part-time and 4-day-week examples.
- AdSense and policy notes: Disclaimer: estimates before tax, not financial or payroll advice.

#### Salary to Hourly Calculator (`/tools/salary-to-hourly-calculator`)

- Primary keyword: salary to hourly calculator
- Secondary keywords: annual salary to hourly, 50k a year is how much an hour, yearly to hourly, convert salary to hourly wage, 60000 a year is how much an hour
- Volume: Part of the 70k-150k pair; the plan's data shows about 38K US for this direction (unverified)
- Competition: medium
- Tool spec: Annual, monthly, biweekly or weekly salary to hourly, with hours/week, weeks/year, paid time off and optional overtime. Table $30k-$200k. Own defaults (salary input first), own table and FAQ; self-referencing canonical and links to the sibling page.
- Content angle: Salary to hourly formula and the 2,080-hour rule, effect of PTO and unpaid weeks, salaried exempt vs non-exempt overtime (general information, not legal advice), comparing offers, worked $50k and $80k examples. Must be at least 1,000 words of unique text, not a re-skin of the hourly page.
- AdSense and policy notes: Same finance disclaimer; not payroll, tax or legal advice.

### Creator & Community Tools

#### Timestamp Generator for Discord (`/tools/discord-timestamp-generator`)

- Primary keyword: discord timestamp generator
- Secondary keywords: discord timestamp, discord time format, discord relative timestamp, discord countdown timer, discord unix timestamp
- Volume: 30k-80k (estimate; 6+ exact-match domains and a large single leader; unverified)
- Competition: low-medium
- Tool spec: Date and time picker with a time-zone selector using a shared zonedTime() util (@date-fns/tz or a 30-line Intl offset solver) that handles DST gaps and overlaps with a warning. All 7 formats (t, T, d, D, f, F, R) with an 'approximate' live preview using Intl.DateTimeFormat and Intl.RelativeTimeFormat, and copy per format. Now + X offsets for countdowns. Snowflake ID decoder using BigInt and the Discord epoch 1420070400000. JS and Python bot snippets. Time-dependent values set after mount.
- Content angle: How Discord timestamps work (Unix seconds rendered in each viewer's local time). Format table with examples. Scheduling events across time zones. Mobile vs desktop rendering differences (only where verified). Snowflake IDs explained. Worked event announcement.
- AdSense and policy notes: H1 pattern 'for Discord'. Non-affiliation line. No logos or Discord UI clones.

#### Colored Text Generator for Discord (`/tools/discord-colored-text-generator`)

- Primary keyword: discord colored text generator
- Secondary keywords: discord color text, discord ansi color codes, how to change text color in discord, discord colored text code block, discord text colors
- Volume: 10k-30k (estimate; unverified, validate in Keyword Planner)
- Competition: low
- Tool spec: A plain textarea plus selectionStart/selectionEnd model (not contenteditable): select a range, click a colour, and state is a list of {start, end, fg, bg, bold, underline} spans rendered into a read-only preview. Outputs an ansi code block with real ESC (U+001B) characters. navigator.clipboard.writeText with the escape character is tested in Chrome, Firefox and Safari, with a select-all-in-output-box fallback. Colour set matches the verified current palette. Dark and light preview, copy. Prominent dated note on which clients render ANSI.
- Content angle: How ANSI escape codes work. Colour code table (30-37 foreground, 40-47 background; adjust to the verified palette). Limitations (code-block font, platform support, mobile). Why older diff/css/yaml code-block hacks are unreliable. Example messages for server rules and announcements.
- AdSense and policy notes: Non-affiliation note. Every platform-behaviour claim carries a check date.

#### Money Calculator for YouTube Creators (Long-Form & Shorts) (`/tools/youtube-money-calculator`)

- Primary keyword: youtube money calculator
- Secondary keywords: youtube earnings calculator, how much does youtube pay per 1000 views, youtube revenue calculator, youtube shorts money calculator, youtube rpm by niche, how much do youtubers make
- Volume: 60k-150k (estimate from SERP saturation; unverified)
- Competition: high
- Tool spec: One CreatorEarnings component. Inputs: daily or monthly views, % monetized playbacks, niche RPM presets or custom RPM, audience-country mix, and a Long-form / Shorts toggle with its own section (music-use share, creator share of the allocated pool). Outputs low/typical/high ranges per day, month and year with the formula shown. All RPM ranges, split percentages and thresholds live in one dated JSON file (asOf, source URL) that also feeds the article tables, and the page shows 'as of' dates. No channel lookup.
- Content angle: RPM vs CPM. The revenue split (verify the 55/45 long-form figure and the Shorts creator share against YouTube Help before publishing). Niche RPM table with cited, dated ranges. YPP requirements with the check date. Q4 seasonality. Income beyond AdSense. Worked examples for a 10k-views/day tech channel vs a gaming channel and a Shorts channel.
- AdSense and policy notes: Disclaimer: estimates only, not a promise or financial advice. No get-rich language. Quarterly human re-review with a visible last-reviewed date. Non-affiliation line; no logos.

#### Watch Time Calculator for YouTube Monetization (`/tools/youtube-watch-time-calculator`)

- Primary keyword: youtube watch time calculator
- Secondary keywords: 4000 watch hours calculator, how many views for 4000 watch hours, youtube watch hours calculator, youtube monetization requirements, youtube partner program calculator
- Volume: 5k-15k (estimate; small exact-match tools rank; unverified)
- Competition: low-medium
- Tool spec: Views x average view duration gives watch hours. Reverse mode: views needed for the current threshold. Timeline projection from current daily views. Thresholds for each YPP tier and the Shorts views path come from the dated JSON config (asOf, source) after checking YouTube Help; the page states which threshold it is using and the effective date. Note on what counts (public long-form views, last 12 months).
- Content angle: What counts toward watch hours and what does not (Shorts, private or deleted videos). Tier requirements as of the check date, and what changes on any announced date. Ways to raise average view duration. Worked examples for 8-minute and 20-minute videos.
- AdSense and policy notes: Non-affiliation note. No unverified threshold ever presented as fact.

#### Grid Maker for Instagram (Image Splitter) (`/tools/instagram-grid-maker`)

- Primary keyword: instagram grid maker
- Secondary keywords: instagram grid splitter, split image into 9 for instagram, 3x3 grid instagram, instagram 3:4 grid, 3x4 grid maker, split photo for instagram grid
- Volume: 10k-30k (estimate; 10+ dedicated tools including exact-match domains; unverified)
- Competition: medium
- Tool spec: Local upload; 3x1, 3x2, 3x3, 3x4 grids with 1:1, 4:5 or 3:4 tiles. Touch-friendly cropper with pointer-event drag and pinch (or react-easy-crop). Sources above about 4096 px downscaled with createImageBitmap resize options. Export tiles at 1080 px width; numbered posting order (post the last tile first); profile-grid preview as a generic mockup; per-tile download and ZIP on desktop, and navigator.share({files}) on mobile.
- Content angle: Why the 2025 profile grid change broke old 1:1 splits and how to design for 3:4 (verify against Instagram Help). Posting order explained. Size table. Pitfalls (pinned posts and later posts shift the grid). Design tips for puzzle feeds.
- AdSense and policy notes: No Instagram logos or UI clones; non-affiliation line; H1 pattern 'for Instagram'.

### Color & CSS Tools

#### Color Contrast Checker (WCAG 2.2) (`/tools/color-contrast-checker`)

- Primary keyword: color contrast checker
- Secondary keywords: contrast checker, wcag contrast checker, color contrast ratio, accessible color checker, contrast ratio calculator, fix insufficient contrast lighthouse
- Volume: 40k-80k global cluster (Semrush US export Apr 2026: color contrast checker 9,900 CPC $3.40; contrast checker 6,600 CPC $2.41; color contrast 2,900 CPC $5.65)
- Competition: high
- Tool spec: Foreground and background pickers accepting HEX, RGB, HSL and OKLCH via culori (colord stays out of new code). WCAG 2.2 ratio with AA/AAA pass/fail for normal text, large text and UI components. 'Nearest passing colour' suggestions that keep hue via a binary search on OKLCH lightness with clampChroma to stay in sRGB. Live text preview at several sizes, palette-grid mode checking every pair, swap button, shareable URL in the hash. APCA is behind a feature flag and ships only after its licence and naming rules are read and recorded; WCAG 2.2 alone is enough at launch.
- Content angle: How the WCAG ratio is calculated (relative luminance with a worked example). Thresholds table (4.5:1, 3:1, 7:1). APCA vs WCAG 2 and the status of WCAG 3. Fixing Lighthouse's 'insufficient contrast' error. Common mistakes (text on images, placeholder text, disabled states, focus rings). No legal advice on ADA or EAA.
- AdSense and policy notes: No legal-compliance claims.

#### CSS Box Shadow Generator (`/tools/box-shadow-generator`)

- Primary keyword: box shadow generator
- Secondary keywords: css box shadow generator, box shadow css, tailwind shadow generator, layered box shadow, smooth shadow generator, inset box shadow
- Volume: 30k-70k (estimate; SERP observed 2026-09-29 with small sites on page 1; unverified)
- Competition: medium
- Tool spec: Multiple layers with sliders (x, y, blur, spread, colour with alpha, inset). Smooth layered-shadow generator (elevation 1-24), presets gallery, light and dark preview on a configurable card, OKLCH colour input through the shared colour engine. Outputs CSS, a Tailwind arbitrary value and a CSS custom property with copy.
- Content angle: box-shadow syntax. Layered shadows for realism with a worked example. box-shadow vs filter: drop-shadow. Performance notes. Elevation systems (Material). Accessibility: do not rely on shadow alone for focus states.
- AdSense and policy notes: None.

#### CSS Clamp Calculator (Fluid Typography) (`/tools/clamp-calculator`)

- Primary keyword: css clamp calculator
- Secondary keywords: fluid typography calculator, clamp font size generator, css clamp generator, responsive font size calculator, fluid type scale generator
- Volume: 3k-8k (estimate; utopia.fyi, clamp.font-size.app and fluid-type-scale.com rank; unverified)
- Competition: low
- Tool spec: Min and max font size (px or rem) and min and max viewport give clamp() with a rem plus vw preferred value. Live resizable preview, multi-step mode for a whole type scale, zoom-accessibility check (rem base; enforce the 2.5x max/min ratio warning). Outputs CSS custom properties and Tailwind config.
- Content angle: Linear-interpolation formula with a worked example. Why the preferred value needs a rem component (WCAG 1.4.4 zoom). Container query units (cqi) as an alternative. Building a full fluid type scale. Link to /tools/px-to-rem.
- AdSense and policy notes: None.

#### CSS Border Radius Generator (`/tools/border-radius-generator`)

- Primary keyword: border radius generator
- Secondary keywords: css border radius generator, border radius css, blob shape css, tailwind rounded generator, elliptical border radius, pill shape css
- Volume: 5k-15k (estimate; unverified)
- Competition: low
- Tool spec: Eight-value editor (horizontal and vertical radius per corner) with linked and unlinked modes, px and % units, draggable handles on a live shape, presets (pill, circle, leaf, blob), shorthand and slash-syntax output, CSS and Tailwind (nearest rounded-* class plus arbitrary value). Notes where border-radius cannot make a true squircle.
- Content angle: The 1-4 value shorthand and the slash syntax for elliptical corners with diagrams. Percentages vs px. Building blob shapes. Tailwind rounded classes. Any mention of newer CSS such as corner-shape carries a browser-support check date.
- AdSense and policy notes: None.

### Utilities & Device Tests

#### Password Generator (`/tools/password-generator`)

- Primary keyword: password generator
- Secondary keywords: strong password generator, random password generator, secure password generator, 16 character password generator, memorable password generator, password generator without symbols
- Volume: 500k-1.2M (estimate reconciling conflicting planning figures; unverified)
- Competition: high
- Tool spec: crypto.getRandomValues, length 4-128, character sets with exclude-ambiguous, enforcement of every required class, entropy in bits with plain-English strength, bulk generation, link to the Month 2 passphrase generator. Nothing is stored. Audit v1 against this spec.
- Content angle: How entropy works with a worked example. Length vs complexity. NIST SP 800-63B guidance stated accurately (length over forced complexity, no forced rotation). Why use a password manager. FAQ on site requirements and special characters that break forms. Claims limited to 'uses the browser's Web Crypto API'.
- AdSense and policy notes: No 'unhackable' or overclaiming. Ads only outside the tool container.

#### Keyboard Tester (`/tools/keyboard-tester`)

- Primary keyword: keyboard tester
- Secondary keywords: keyboard test, key tester, test keyboard keys online, keyboard ghosting test, n-key rollover test, keyboard checker
- Volume: 200k-500k (estimate; no hard figure retrievable, validate in Keyword Planner)
- Competition: medium
- Tool spec: Layouts modelled as JSON rows of {code, label, width} generated from a base plus overrides (ANSI, ISO, Windows, Mac, 60%, TKL, full-size). preventDefault on keydown and keyup; in fullscreen on Chromium navigator.keyboard.lock() to capture Esc and the Windows key; navigator.keyboard.getLayoutMap() to relabel non-US layouts. Keys stay marked as tested; event.code, key and keyCode shown. Rollover counter for ghosting. Chatter detection uses keyup-to-keydown gaps on the same key under a configurable threshold (about 30-50 ms), ignoring event.repeat. Honest limits: Fn, PrtScn and some OS shortcuts are not visible to browsers. Touch devices get a 'needs a physical keyboard' notice. States that keystrokes are not recorded, and no keystroke data goes to analytics.
- Content angle: Diagnosing a dead key vs a software issue. Ghosting and rollover explained. Key chatter on mechanical switches. What browsers cannot detect. Fixes (drivers, cleaning, remapping) and a checklist for testing a new or used laptop.
- AdSense and policy notes: High-interaction layout rule: no ad within 300 px of the key area and no anchor or overlay ads on this page.

#### Dead Pixel Test (Screen Test) (`/tools/dead-pixel-test`)

- Primary keyword: dead pixel test
- Secondary keywords: dead pixel checker, stuck pixel test, screen test, monitor test, backlight bleed test, white screen test
- Volume: 40k-100k (estimate; SERP of small sites; unverified)
- Competition: low
- Tool spec: Fullscreen colour cycling (black, white, red, green, blue, grey) with keyboard and tap navigation and an auto-hidden cursor. Magnifier grid, backlight-bleed, uniformity and gradient-banding tests. The stuck-pixel flasher is opt-in behind an explicit confirm dialog, limited to 3 changes per second, with Esc and tap to stop and auto-stop after 60 seconds. iPhone fallback: a fixed 100dvh, 100vw overlay because Fullscreen API support is limited. Site chrome and every ad slot are hidden while a test runs.
- Content angle: Dead vs stuck vs hot pixels. How pixel-defect return policies work (ISO 9241-307 classes in general terms; check the manufacturer). Testing a new monitor, laptop or phone. Methods to try fixing stuck pixels and their honest limits.
- AdSense and policy notes: Photosensitivity warning before the flasher. No ads in fullscreen or flashing mode.

#### Mouse Test (Buttons, Scroll & Double-Click) (`/tools/mouse-test`)

- Primary keyword: mouse test
- Secondary keywords: mouse button test, mouse double click test, double click test, mouse scroll test, mouse polling rate test
- Volume: 30k-80k (estimate; unverified)
- Competition: low
- Tool spec: Visual mouse showing left, right, middle, back and forward buttons as pressed, with preventDefault on mousedown, mouseup, auxclick and contextmenu for buttons 1-4 so back and forward do not navigate away. Double-click detector flags unintended double clicks from the gap between consecutive mousedowns (default threshold 80-100 ms, configurable). Scroll direction and step counter. Polling-rate estimate uses pointerrawupdate and getCoalescedEvents where available, is labelled 'estimate, works in Chrome and Edge', capped, and hidden when unsupported.
- Content angle: Diagnosing the double-click fault (worn switches) and warranty tips. Polling rate explained. DPI vs sensitivity. Fixes to try before replacing a mouse.
- AdSense and policy notes: High-interaction layout rule: fixed-size test area, no ad within 300 px, no anchor or overlay ads.

#### Click Speed Test (CPS Test) (`/tools/click-speed-test`)

- Primary keyword: click speed test
- Secondary keywords: cps test, mouse click test, click counter, clicks per second test, butterfly clicking test, jitter click test
- Volume: 300k-800k (estimate; small exact-match sites on page 1; unverified)
- Competition: low-medium
- Tool spec: Timed modes (1, 2, 5, 10, 30, 60 seconds), a fixed-size click pad that never reflows (CLS under 0.1), live CPS, final CPS and total clicks, best score in localStorage inside try/catch with a Clear button. Touch and mouse handled with pointer events. Optional keyboard (space) mode shares code with the Month 3 spacebar counter.
- Content angle: What CPS means and how the test measures it. Technique overview (normal, jitter, butterfly, drag) with honest notes on hand strain and on games or servers that prohibit auto-click-style techniques. How to reduce double-click faults. Any average-CPS figure must cite a source.
- AdSense and policy notes: Highest accidental-click risk in the set: one ad slot only, at the bottom below the FAQ, none within 300 px of the pad, no anchor or overlay ads, no 'click here' copy near ads.

## 5. Build order and release waves

Shared engines first (each proven once in `_template` before it is copied): ImageConverter (input list, output type, quality, background fill, batch, ZIP, concurrency 2, batch cap 50 files or 300 MB), Worker plus WASM pattern (`new Worker(new URL(...))` with comlink, WASM as an asset, dynamic imports only), SerpPreview and PixelMeter with the Arimo width table, culori colour engine (`@/lib/color`), date-only util and zonedTime() (UTC-anchored integers, tested on leap years, month ends and DST weeks), LineListEngine, PayEngine, useUrlState (URL hash, never raw useSearchParams), and a shared privacy-sentence and disclaimer component. Bundle budget: tool-page first-load JS under about 150 KB gzipped excluding lazy chunks; no library above about 50 KB gzipped in the initial chunk; WASM only after a user action. Add a Playwright smoke test per tool to `npm run check`.

| Wave | Tools | Effort each |
|---|---|---|
| 1 Trivial | chmod-calculator, uuid-generator, roman-numeral-converter, number-to-words, words-to-time, words-to-pages, comma-separator, invisible-character, clamp-calculator, box-shadow-generator, border-radius-generator, military-time-converter, youtube-money-calculator, youtube-watch-time-calculator, hourly-to-salary-calculator, salary-to-hourly-calculator, slug-generator, llms-txt-generator | 0.5-1 day |
| 2 Shared engines | remove-duplicate-lines, alphabetical-order, title-meta-description-length-checker, serp-snippet-preview, webp-to-png, webp-to-jpg, keyboard-tester, dead-pixel-test, mouse-test, click-speed-test | 1-2 days |
| 3 Medium | sql-formatter, hash-generator, cron-expression-generator, compress-image-to-100kb, color-contrast-checker, svg-to-png, discord-timestamp-generator, discord-colored-text-generator, chronological-age-calculator, days-from-today, instagram-grid-maker, exif-viewer, px-to-rem, morse-code-translator | 2-3 days |
| 4 Risky | heic-to-jpg, remove-exif-data, htaccess-redirect-generator | 3-5 days |
| Built (audit) | word-counter, character-counter, case-converter, remove-line-breaks, json-formatter, password-generator, percentage-calculator | gap audit |

Estimated total: about 70-100 person-days including content for the 45 tools still to build.

Release in two waves. Wave A: about 28 complete pages (the built tools, waves 1 and 2, plus the strongest wave 3 tools) with the full trust layer live. Apply to AdSense once 30-40 pages are indexed. Wave B: the remaining tools and the three hand-written 30/60/90-day guides over 2-3 weeks. Gate every page with a uniqueness check (fail above about 30% shingle overlap with another page, or under 900 unique words), a named human editor and a visible last-reviewed date.

## 6. Six-month roadmap

Every roadmap item is client-side unless flagged server-light. Items marked conditional are built only if keyword validation supports them. Each month alternates head-term hub pages with at least two low or medium tools, and finishes clusters so pages link to each other.

### Month 1 (29 tools)

| Name | Slug | Category | Primary keyword | Est. volume | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| Image Compressor | image-compressor | image | image compressor | 200k-500k global (Semrush US 49,500-60,500) | high | client-side | Generic hub; must not target 100kb keywords; jSquash MozJPEG/OxiPNG lazy-loaded. |
| Image Resizer | image-resizer | image | image resizer | 300k-700k global (Semrush US 110,000) | high | client-side | Hub for size and social presets. |
| HEIC to PNG Converter | heic-to-png | image | heic to png | 50k-200k (KP all-locations 201K) | medium | client-side | Reuses the HEIC Worker decoder. |
| AVIF to JPG / PNG Converter | avif-to-jpg | image | avif to jpg | 60k-120k (Ahrefs global 33.1k KD 44 + avif to png 27.1k KD 38) | medium | client-side | Native AVIF decode on the ImageConverter engine. |
| PNG / JPG to WebP Converter | png-to-webp | image | png to webp | 40k-80k (Semrush US 12,100 CPC $2.39 + jpg to webp 6,600) | medium | client-side | Needs @jsquash/webp (Safari canvas cannot encode WebP). |
| JPG to PNG Converter | jpg-to-png | image | jpg to png | 100k-250k (Semrush US 33,100) | medium | client-side | Explains why JPG to PNG adds no transparency. |
| PNG to JPG Converter | png-to-jpg | image | png to jpg | 200k-400k (Semrush US 49,500) | high | client-side | Split from jpg-to-png under the direction rule; background-fill option. |
| Favicon Generator | favicon-generator | image | favicon generator | 100k-250k (triangulated estimate) | medium | client-side | ICO writer, apple-touch icon, manifest, ZIP. |
| Aspect Ratio Calculator | aspect-ratio-calculator | image | aspect ratio calculator | 60k-120k (estimate) | low | client-side | Pixel tables for 16:9, 4:3, 9:16, 4:5. |
| QR Code Generator | qr-code-generator | utilities | qr code generator | 1M-3M global (third-party report citing Semrush/Similarweb) | high | client-side | Static codes only; hub for WiFi and vCard pages. |
| WiFi QR Code Generator | wifi-qr-code-generator | utilities | wifi qr code generator | 20k-60k (estimate) | medium | client-side | Printable sign template. |
| Mic Test (Online Microphone Test) | mic-test | utilities | mic test | 200k-500k (estimate; unverified) | high | client-side | Deferred from launch; useMediaStream hook; target 'microphone not working windows 11' long-tails; no ads while a stream is active. |
| Webcam Test (Online Camera Test) | webcam-test | utilities | webcam test | 150k-400k (estimate; unverified) | high | client-side | Deferred from launch; target 'camera in use by another app' long-tails. |
| Robots.txt Generator (with AI Crawler Presets) | robots-txt-generator | seo | robots.txt generator | 10k-20k (estimate) | high | client-side | CMS presets plus AI-bot groups; links to llms.txt. |
| UTM Builder (GA4 Campaign URL Builder) | utm-builder | seo | utm builder | 15k-30k global ('utm generator' 3,600 US, CPC $15.56) | high | client-side | Highest ad value in SEO; bulk CSV mode. |
| YAML to JSON / JSON to YAML Converter | yaml-to-json | developer | yaml to json | 40k-80k cluster (estimate) | medium | client-side | One page unless JSON to YAML shows about 10k+ separately. |
| CSV to JSON Converter | csv-to-json | developer | csv to json | 60k-120k cluster (estimate) | medium | client-side | papaparse, type inference. |
| JSON to CSV / Excel Converter | json-to-csv | developer | json to csv | 50k-100k cluster (estimate) | medium | client-side | Nested-JSON flattening is the content hook. |
| LLM Token Counter | llm-token-counter | developer | llm token counter | Unknown; validate volume first (conditional item) | medium | client-side | Approximate counts for non-OpenAI tokenizers, labelled as such. |
| HEX to RGB Converter | hex-to-rgb | converters | hex to rgb | 40k-100k cluster (Semrush US 9,900 exact) | medium | client-side | One colour engine; also HSL and OKLCH. |
| RGB to HEX Converter | rgb-to-hex | converters | rgb to hex | 30k-60k (Semrush US 18,100) | medium | client-side | Distinct SERP and copy from hex-to-rgb. |
| REM to PX Converter | rem-to-px | converters | rem to px | Validate; build only if about 10k+ (conditional item) | low-medium | client-side | Same UnitConverter as px-to-rem with its own defaults, table and copy. |
| Final Grade Calculator | grade-calculator | calculators | final grade calculator | 100k-250k cluster (Ahrefs: test grade 5.9k; Omni page 61k visits) | medium | client-side | No seasonal forecast for 2026; plan the 2027 season from June. |
| Percent Off / Discount Calculator | percent-off-calculator | calculators | percent off calculator | 100k-250k (estimate) | medium | client-side | Stacked discounts plus tax; treat Black Friday 2026 as an indexing test only. |
| Percentage Increase / Change Calculator | percentage-increase-calculator | calculators | percentage increase calculator | 100k-250k (estimate) | medium | client-side | Sole owner of % change, increase, decrease and difference queries. |
| Instagram Line Break Generator | instagram-line-break-generator | social-media | instagram line break generator | 5k-15k (estimate) | medium | client-side | U+2800 spacer, 2,200 counter. |
| YouTube Timestamp Link Generator | youtube-timestamp-link-generator | social-media | youtube timestamp link generator | 5k-15k (estimate) | low | client-side | Builds links only. |
| CSS Gradient Generator | css-gradient-generator | design | css gradient generator | 60k-150k (estimate) | high | client-side | OKLCH interpolation and Tailwind output. |
| Title Case Converter (AP, APA, Chicago, MLA) | title-case-converter | text | title case converter | 60k-150k incl. 'capitalize my title' (estimate) | medium-high | client-side | Owns title case; shows which words stayed lowercase and why, so it differs from the case converter. |

### Month 2 (24 tools)

| Name | Slug | Category | Primary keyword | Est. volume | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| Text Compare (Diff Checker) | text-compare | text | text compare | 150k-300k with 'diff checker' (Semrush/Similarweb snippets) | high | client-side | Compare your own two texts only; never a web-wide plagiarism scan. |
| Strikethrough Text Generator | strikethrough-text-generator | text | strikethrough text generator | 10k-30k (low-confidence third-party data) | low | client-side | Per-platform how-tos and an accessibility warning. |
| Binary Translator (Text to Binary) | binary-translator | converters | binary translator | 60k-150k (estimate) | medium | client-side | Absorbs text-to-binary, hex and ASCII; UTF-8 aware. |
| PX to EM Converter | px-to-em | converters | px to em | 5k-15k (estimate) | low | client-side | Parent-relative compounding explained. |
| Days Between Dates Calculator | days-between-dates | calculators | days between dates | 150k-400k (estimate) | high | client-side | Date hub; business-days mode. |
| Age Calculator | age-calculator | calculators | age calculator | 500k-1.5M (estimate) | high | client-side | Reuses the age engine; consumer angle; shares no query with the chronological page. |
| Color Picker (HEX, RGB, HSL, OKLCH) | color-picker | design | color picker | 500k-1M+ (estimate; large zero-click share) | high | client-side | EyeDropper API with fallback. |
| Tailwind v4 OKLCH Palette Generator | tailwind-color-generator | design | tailwind color generator | 3k-10k (estimate) | medium-high | client-side | Deferred from launch; fit lightness and chroma curves to the real v4 palette; target 'generate tailwind colors from hex'. |
| Glassmorphism & Liquid Glass CSS Generator | glassmorphism-liquid-glass-generator | design | glassmorphism generator | 10k-25k (estimate; check Google Trends first) | medium | client-side | One merged page; frosted-glass first, Chromium-only refraction toggle; skip if the trend has faded. |
| Passphrase Generator | passphrase-generator | utilities | passphrase generator | 10k-30k (estimate) | low | client-side | EFF large wordlist; attribution required. |
| Password Strength Checker | password-strength-checker | utilities | password strength checker | 100k-250k (estimate) | high | client-side | Local zxcvbn-style estimator; nothing sent anywhere. |
| Random Team Generator | random-team-generator | utilities | random team generator | 50k-150k (estimate) | low | client-side | Teacher audience; balanced mode. |
| Meta Tag Generator | meta-tag-generator | seo | meta tag generator | 15k-30k (estimate; metatags.io 222K visits/mo) | high | client-side | SEO + OG + X tags; reuses the pixel engine. |
| Open Graph & X Card Generator | open-graph-generator | seo | open graph generator | 3k-8k combined (estimate) | medium | client-side | Paste-mode previews. |
| Robots.txt Tester & Validator | robots-txt-tester | seo | robots.txt tester | 3k-6k combined (estimate) | medium | client-side | Paste mode with Google's matching rules. |
| AI Crawler Blocker for robots.txt | block-ai-bots-robots-txt | seo | block ai crawlers robots.txt | 1k-3k (estimate) | low | client-side | Dated user-agent list. |
| Hreflang Tag Generator | hreflang-tag-generator | seo | hreflang generator | 1k-3k (estimate) | low | client-side | Validates codes and reciprocity. |
| JWT Decoder | jwt-decoder | developer | jwt decoder | 80k-150k cluster excluding brand (estimate) | high | client-side | Do-not-paste-live-tokens warning; no brute forcer. |
| Unix Timestamp / Epoch Converter | unix-timestamp-converter | developer | epoch converter | 300k-500k cluster (estimate) | high | client-side | Links to the Discord timestamp page; shared zonedTime util. |
| Regex Tester | regex-tester | developer | regex tester | 120k-200k tool cluster (estimate) | high | client-side | Hub for 4-6 hand-written pattern pages later. |
| Base64 Encode / Decode | base64-decode | developer | base64 decode | 300k-500k cluster (estimate) | high | client-side | UTF-8-safe text and file modes. |
| URL Encoder / Decoder | url-encode-decode | developer | url decoder | 100k-180k cluster (estimate) | medium | client-side | URL parser and query table. |
| HTML Entity Encoder / Decoder | html-entity-encoder | developer | html entity decoder | 30k-60k cluster (estimate) | medium | client-side | Entity reference table. |
| Image to Base64 / Base64 to Image | image-to-base64 | developer | image to base64 | 60k-120k cluster (estimate) | medium | client-side | Data URI, HTML and CSS snippets. |

### Month 3 (29 tools)

| Name | Slug | Category | Primary keyword | Est. volume | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| Social Media Character Counter | social-media-character-counter | social-media | social media character counter | 5k-15k (estimate) | medium | client-side | Hub for platform counters; 2026 limits table. |
| X (Twitter) Character Counter | twitter-character-counter | social-media | twitter character counter | 10k-30k (estimate) | medium | client-side | Weighted counting and thread splitter. |
| Instagram Caption Character Counter | instagram-character-counter | social-media | instagram character counter | 5k-15k (estimate) | medium | client-side | Owns Instagram and SMS counter keywords dropped from the generic counter. |
| YouTube Title Length Checker | youtube-title-length-checker | social-media | youtube title length checker | 3k-10k (estimate) | low | client-side | Truncation preview. |
| Engagement Rate Calculator | engagement-rate-calculator | social-media | engagement rate calculator | 15k-40k (estimate) | medium | client-side | Manual inputs, no username lookup. |
| TikTok Money Calculator | tiktok-money-calculator | social-media | tiktok money calculator | 20k-60k (estimate) | medium | client-side | Dated JSON RPM ranges; estimates disclaimer. |
| Instagram Money Calculator | instagram-money-calculator | social-media | instagram money calculator | 10k-30k (estimate) | medium | client-side | Sponsorship rate ranges by tier. |
| YouTube Subscribe Link Generator | youtube-subscribe-link-generator | social-media | youtube subscribe link generator | 3k-10k (estimate) | low | client-side | Link, QR and button snippet. |
| Instagram Carousel / Panorama Splitter | instagram-carousel-splitter | social-media | instagram carousel splitter | 5k-15k (estimate) | low | client-side | Shares code with the grid maker. |
| Instagram No Crop (Fit Photo) | instagram-no-crop | social-media | instagram no crop | 5k-20k (estimate) | low | client-side | SERP is app listings. |
| Twitch Emote Resizer | twitch-emote-resizer | social-media | twitch emote resizer | 5k-15k (estimate) | low | client-side | 112/56/28 plus badges, ZIP. |
| YouTube Banner Resizer | youtube-banner-resizer | social-media | youtube banner resizer | 3k-10k tool + 30k-60k 'youtube banner size' informational (estimate) | medium | client-side | 2560x1440 with safe-area overlay. |
| YouTube Thumbnail Previewer | youtube-thumbnail-preview | social-media | youtube thumbnail preview | 3k-10k (estimate) | low | client-side | Own upload only; generic mockup. |
| Fonts for Instagram Bios (Copy & Paste) | instagram-fonts | social-media | instagram fonts | 150k-300k (AhrefsTop snippet: igfonts.io 20.1K visits from 'instagram fonts') | high | client-side | Compatibility table and accessibility warning; genuine content required. |
| Color Palette Generator | color-palette-generator | design | color palette generator | 150k-400k (estimate) | high | client-side | OKLCH harmonies; niche variants first. |
| CSS Clip-path Generator | clip-path-generator | design | css clip path generator | 5k-15k (estimate) | low | client-side | Supports shape(). |
| Color Blindness Simulator | color-blindness-simulator | design | color blindness simulator | 5k-15k (estimate) | low | client-side | Own Machado matrices. |
| OKLCH Color Picker & Converter | oklch-color-picker | design | oklch color picker | 2k-8k rising (estimate) | low | client-side | sRGB and P3 gamut mapping. |
| HEX to RGBA & Hex Opacity Converter | hex-to-rgba | design | hex to rgba | 5k-15k (estimate) | medium | client-side | Alpha long-tail; links to hex-to-rgb. |
| Tint & Shade Generator | color-shades-generator | design | tint and shade generator | 5k-15k (estimate) | medium | client-side | Gateway to curated colour pages. |
| Spacebar Counter | spacebar-counter | utilities | spacebar counter | 30k-100k (estimate) | low | client-side | Shares code with the click speed test; same ad rules. |
| Left/Right Speaker & Headphone Test | left-right-audio-test | utilities | left right audio test | 30k-80k (estimate) | low | client-side | StereoPannerNode; no hearing-test claims. |
| Gamepad / Controller Tester | gamepad-tester | utilities | gamepad tester | 100k-250k (estimate) | medium | client-side | Stick-drift circle and vibration. |
| What Is My Screen Resolution | screen-resolution | utilities | what is my screen resolution | 50k-150k (estimate) | medium | client-side | DPR and viewport explainer. |
| QR Code Scanner (Image or Camera) | qr-code-scanner | utilities | qr code scanner online | 50k-150k (Semrush 9,900 US 'qr code scanner' + estimate) | medium | client-side | Shows the URL before opening; camera disclosures. |
| Small Text Generator | small-text-generator | text | small text generator | 40k-100k (estimate) | medium | client-side | Small caps, superscript, subscript; accessibility warning. |
| Bold Text Generator | bold-text-generator | text | bold text generator | 40k-100k (estimate) | medium | client-side | Per-platform how-tos; accessibility caveat. |
| Lorem Ipsum Generator | lorem-ipsum-generator | text | lorem ipsum generator | 100k-250k (estimate) | medium | client-side | History (Cicero) and HTML output. |
| Keyword Combiner & Match Type Wrapper | keyword-combiner | seo | keyword combiner | 2k-5k (estimate) | medium | client-side | Deferred from launch; cap combinations, Ads Editor and Microsoft CSV export, 80-character and 10-word filters. |

### Month 4 (27 tools)

| Name | Slug | Category | Primary keyword | Est. volume | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| String Escape / Unescape (JSON, JS, HTML, SQL) | string-escape | developer | json escape | 25k-50k cluster (estimate) | low | client-side | One tabbed page. |
| HMAC Generator | hmac-generator | developer | hmac generator | 8k-20k (estimate) | low | client-side | Webhook-signature examples. |
| Bcrypt Hash Generator & Verifier | bcrypt-generator | developer | bcrypt generator | 30k-60k cluster (estimate) | medium | client-side | Web Worker; cost-factor content. |
| htpasswd Generator | htpasswd-generator | developer | htpasswd generator | 10k-25k cluster (estimate) | low | client-side | bcrypt/APR1 plus Basic auth header. |
| JSONPath Tester | jsonpath-tester | developer | jsonpath online | 15k-30k cluster (estimate) | low | client-side | Click-to-copy path from the tree. |
| Markdown Table Generator | markdown-table-generator | developer | markdown table generator | 20k-40k cluster (estimate) | medium | client-side | CSV paste and prettifier. |
| Markdown to HTML Converter | markdown-to-html | developer | markdown to html | 30k-60k cluster (estimate) | medium | client-side | GFM plus DOMPurify. |
| HTML to Markdown Converter | html-to-markdown | developer | html to markdown | 15k-35k (estimate) | low | client-side | Docs and LLM workflows. |
| XML Formatter & Validator | xml-formatter | developer | xml formatter | 40k-80k cluster (estimate) | medium | client-side | Line-numbered errors. |
| HTML Formatter & Minifier | html-formatter | developer | html formatter | 40k-80k cluster (estimate) | medium | client-side | Both directions on one page. |
| Hours Calculator (Time Card & Timesheet) | hours-calculator | calculators | hours calculator | 100k-300k, US-heavy (estimate) | high | client-side | Deferred from launch (Intuit, Harvest, Rize on page 1); simple start/end/break default, weekly grid in a second tab; also targets 'minutes to decimal hours'. |
| Time Calculator (Add / Subtract Time) | time-calculator | calculators | time calculator | 100k-200k (estimate) | medium | client-side | Shares helpers with the hours calculator. |
| Day of the Week Calculator | day-of-the-week-calculator | calculators | what day of the week was i born | 20k-60k (estimate) | medium | client-side | Date-hub add-on. |
| VAT Calculator (UK) | vat-calculator | calculators | vat calculator | 100k-200k UK (estimate) | medium | client-side | Dated rates with gov.uk link. |
| Sales Tax Calculator (incl. Reverse) | sales-tax-calculator | calculators | sales tax calculator | 100k-250k US (estimate) | medium | client-side | State base rates only, dated, user-overridable. |
| Average / Mean, Median, Mode Calculator | average-calculator | calculators | average calculator | 60k-150k (estimate) | medium | client-side | Steps shown. |
| Simple Interest Calculator | simple-interest-calculator | calculators | simple interest calculator | 50k-120k (estimate) | medium | client-side | Finance disclaimer. |
| Word Frequency Counter | word-frequency-counter | text | word frequency counter | 10k-25k (estimate) | low | client-side | n-grams and CSV export. |
| Syllable Counter (Haiku Checker) | syllable-counter | text | syllable counter | 30k-80k (estimate) | medium | client-side | Per-line counts. |
| Remove Extra Spaces | remove-extra-spaces | text | remove extra spaces | 15k-40k (estimate) | low | client-side | Non-breaking spaces; Excel TRIM content. |
| Find and Replace Text Online | find-and-replace | text | find and replace text online | 5k-15k (estimate) | low | client-side | Regex mode and multiple rules. |
| Reverse & Upside Down Text Generator | reverse-text | text | reverse text generator | 20k-50k cluster (estimate) | low | client-side | Merged with upside-down text; grapheme-safe. |
| Word to HTML Converter (Clean Paste) | word-to-html | text | word to html converter | 80k-200k (Semrush: wordhtml.com 633K-820K visits/mo) | medium | client-side | Strips mso- styles. |
| Keyword Density Checker | keyword-density-checker | seo | keyword density checker | 8k-15k (estimate) | high | client-side | States honestly that density is not a ranking factor. |
| Schema Markup Generator (JSON-LD) | schema-markup-generator | seo | schema markup generator | 8k-15k hub (estimate) | high | client-side | Rich-result availability verified against Google docs. |
| XML Sitemap Generator (from URL List) | xml-sitemap-generator | seo | xml sitemap generator | 20k-40k ('sitemap generator' 127,100 per Semrush) | high | client-side | From URL list, sitemap index, validator. |
| UTM / Tracking Parameter Remover | utm-remover | seo | remove utm parameters from url | 500-1.5k (estimate) | low | client-side | Companion to the UTM builder. |

### Month 5 (28 tools)

| Name | Slug | Category | Primary keyword | Est. volume | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| Crop Image | crop-image | image | crop image | 100k-250k (Semrush US 22,200 + image cropper 18,100) | high | client-side | Aspect presets, circle crop. |
| Round Image Corners / Circle Crop | round-image-corners | image | round corners image | 20k-50k (estimate) | low | client-side | Profile-picture preset. |
| DPI Converter (Change Image DPI) | dpi-converter | image | change dpi of image | 50k-100k (estimate) | low | client-side | Lossless pHYs/JFIF rewrite. |
| Image Color Picker | image-color-picker | image | image color picker | 50k-120k (estimate) | medium | client-side | Zoom loupe. |
| Blur / Pixelate Image | blur-image | image | blur image | 100k-300k (estimate) | medium | client-side | Warns that pixelated text can be reversed. |
| Add Watermark to Image | add-watermark | image | add watermark to photo | 60k-120k (KP export 14,800 x2 + 12,100) | medium | client-side | Adding only; never removal. |
| PNG to ICO Converter | png-to-ico | image | png to ico | 20k-40k (Ahrefs 18,100 KD 49) | medium | client-side | Reuses the favicon ICO writer. |
| Social Media Image Resizer | social-media-image-resizer | image | resize image for instagram | 100k-300k cluster (estimate) | medium | client-side | Dated preset size table. |
| Passport Photo Maker | passport-photo-maker | image | passport photo maker | 300k-800k global (India-heavy) | medium | client-side | Verify with the issuing authority; no approval claims. |
| Bulk Image Resizer | bulk-image-resizer | image | bulk image resizer | 30k-60k (estimate) | medium | client-side | Rename patterns. |
| Rotate & Flip Image | rotate-image | image | rotate image | 50k-100k (estimate) | medium | client-side | EXIF-orientation fix long-tail. |
| Image Converter (Hub) | image-converter | image | image converter | 200k-500k (estimate) | high | client-side | Parent of the pair pages. |
| Color Palette from Image | color-palette-from-image | design | color palette from image | 40k-120k (estimate) | high | client-side | Palette extraction. |
| Mesh Gradient Generator | mesh-gradient-generator | design | mesh gradient generator | 5k-15k (estimate) | low | client-side | PNG export with noise. |
| CSS Grid Generator | css-grid-generator | design | css grid generator | 10k-25k (estimate) | medium | client-side | Bento presets. |
| Random Color Generator | random-color-generator | design | random color generator | 20k-50k (estimate) | medium | client-side | Internal-link feeder. |
| Color Wheel & Complementary Color Finder | color-wheel | design | complementary color finder | 100k-250k head; 2k-6k finder (estimate) | medium | client-side | RGB and RYB modes. |
| Color Mixer | color-mixer | design | color mixer | 15k-40k (estimate) | medium | client-side | spectral.js (MIT); never mixbox. |
| Data Storage Converter (KB/MB/GB/TB) | data-storage-converter | converters | mb to gb | 50k-150k cluster (estimate) | medium | client-side | 1000 vs 1024 explainer. |
| Time Zone Converter | time-zone-converter | converters | time zone converter | 200k-500k head (estimate) | high | client-side | At most 5-15 hand-written pair pages, only if they earn impressions. |
| Number Base Converter (Binary, Decimal, Hex, Octal) | binary-to-decimal | converters | binary to decimal | 600k-1M cluster (estimate) | high | client-side | One page with steps. |
| Scientific Notation Converter | scientific-notation-converter | converters | scientific notation calculator | 60k-150k (estimate) | medium | client-side | Education filler. |
| What Is My IP | what-is-my-ip | utilities | what is my ip | 1M-3M (Semrush Jan 2026: 823K + 301K + 165K variants) | high | server-light | Edge headers; IP processed only to display, not logged; disclose in Privacy Policy. |
| vCard QR Code Generator | vcard-qr-code-generator | utilities | vcard qr code generator | 5k-20k (estimate) | medium | client-side | Static code plus .vcf. |
| Online Voice Recorder | online-voice-recorder | utilities | online voice recorder | 100k-300k (estimate) | medium | client-side | Reuses mic-test hook; MP3 encoder must be licence-checked. |
| Meta Tag Analyzer (URL) | meta-tag-analyzer | seo | meta tag analyzer | 5k-12k combined (estimate) | high | server-light | Rate-limited serverless fetch. |
| Redirect Checker | redirect-checker | seo | redirect checker | 15k-30k (estimate) | high | server-light | Pairs with the redirect generator. |
| X Card & Open Graph Validator (URL) | twitter-card-validator | seo | twitter card validator | 3k-8k combined (estimate) | medium | server-light | Gap left by X's retired validator. |

### Month 6 (29 tools)

| Name | Slug | Category | Primary keyword | Est. volume | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| CSS Minifier & Beautifier | css-minifier | developer | css minifier | 40k-80k cluster (estimate) | medium | client-side | Unminify variant is the softer entry. |
| JavaScript Minifier & Beautifier | javascript-minifier | developer | javascript minifier | 50k-100k cluster (estimate) | medium | client-side | Lazy-load terser. |
| XML to JSON Converter | xml-to-json | developer | xml to json | 40k-80k cluster (estimate) | medium | client-side | Attribute and array options. |
| Mock / Test Data Generator | mock-data-generator | developer | mock data generator | 40k-80k cluster (estimate) | medium | client-side | No card numbers, SSNs or fake IDs. |
| Docker Run to Docker Compose Converter | docker-run-to-docker-compose | developer | docker run to docker compose | 8k-15k (estimate) | low | client-side | Uncontested DevOps query. |
| IPv4 / CIDR Subnet Calculator | subnet-calculator | developer | subnet calculator | 150k-250k cluster (estimate) | high | client-side | CIDR and IPv6 long-tails first. |
| JSON to TypeScript (+ Go, Zod, JSON Schema) | json-to-typescript | developer | json to typescript | 30k-60k cluster (estimate) | medium | client-side | Per-language pages only if data justifies. |
| .gitignore Generator | gitignore-generator | developer | gitignore generator | 60k-120k cluster (estimate) | medium | client-side | Bundled CC0 templates. |
| User Agent Parser (What Is My User Agent) | user-agent-parser | developer | what is my user agent | 120k-200k cluster (estimate) | medium | client-side | Client Hints explainer. |
| HTML Table Generator | html-table-generator | developer | html table generator | 40k-80k cluster (estimate) | medium | client-side | CSV/JSON import. |
| Discord Text Formatter & Fonts | discord-text-formatter | social-media | discord fonts | 10k-30k (estimate) | medium | client-side | Markdown preview plus Unicode styles. |
| Discord Emoji & Sticker Resizer | discord-emoji-resizer | social-media | discord emoji resizer | 2k-8k (estimate) | low | client-side | Reuses the emote-resizer engine. |
| Bluesky & Threads Character Counter | bluesky-character-counter | social-media | bluesky character counter | 1k-5k (estimate) | low | client-side | Grapheme counting (300) and Threads (500). |
| YouTube Playlist Length Calculator (Paste Durations) | youtube-playlist-length-calculator | social-media | youtube playlist length | 10k-30k (estimate) | low | client-side | Client-side only: user pastes durations; the API version needs a separate compliance review. |
| Heading Tag (H1-H6) Checker | heading-tag-checker | seo | h1 checker | 1k-3k (estimate) | medium | server-light | URL mode plus client-side paste-HTML mode. |
| Wheel Spinner / Random Name Picker | wheel-spinner | utilities | spin the wheel | 2M-10M (Similarweb wheelofnames 13.3M visits) | high | client-side | Classroom and letter-wheel long-tails; no raffle or casino framing. |
| Yes or No Wheel | yes-or-no-wheel | utilities | yes or no wheel | 50k-150k (estimate) | medium | client-side | Reuses the wheel component. |
| Encrypt / Decrypt Text (AES) | encrypt-decrypt-text | utilities | encrypt text online | 10k-30k (estimate) | low | client-side | AES-GCM with PBKDF2; lost-password warning. |
| Random PIN Generator | random-pin-generator | utilities | random pin generator | 5k-20k (estimate) | low | client-side | Excludes common PINs. |
| Invoice Generator | invoice-generator | utilities | invoice generator | 100k-300k (estimate) | high | client-side | Genuine transactions only; no receipts or PAID stamps. |
| Signature Generator (Your Own E-Signature) | signature-generator | utilities | signature generator | 100k-250k (estimate) | medium | client-side | Your own signature only. |
| GPA Calculator | gpa-calculator | calculators | gpa calculator | 300k-800k (estimate) | high | client-side | Weighted AP/IB. |
| Compound Interest Calculator | compound-interest-calculator | calculators | compound interest calculator | 200k-500k (estimate) | high | client-side | Finance disclaimer; long-tail first. |
| Email & URL Extractor (from Text) | email-extractor | text | extract emails from text | 15k-40k (estimate) | medium | client-side | Pasted text only. |
| Merge PDF (No Upload) | merge-pdf | pdf | merge pdf | 1M-3M (estimate) | high | client-side | PDF category is created only when all 5 PDF tools ship together, and only if the image cluster is earning links; target 'merge pdf without uploading'. |
| Split PDF / Extract / Delete Pages | split-pdf | pdf | split pdf | 200k-500k (estimate) | high | client-side | 'delete pages from pdf' is the entry point. |
| Rotate PDF | rotate-pdf | pdf | rotate pdf | 100k-300k (estimate) | medium | client-side | Simple build. |
| PDF to JPG Converter | pdf-to-jpg | pdf | pdf to jpg | 500k-2M (KP single market 49,500; all-locations 9.1M) | high | client-side | pdf.js rendering, DPI choice. |
| JPG to PDF (Images to PDF) | jpg-to-pdf | pdf | jpg to pdf | 500k-1M+ (KP 165k in one export) | high | client-side | Covers png to pdf; 'images to pdf on iPhone' long-tail. |

Roadmap total: 166 tools; with the launch set, 218 tools after six months. The Month 6 PDF tools are gated on the image cluster earning links; if it is not, swap them for more developer tools and keep the PDF category hidden.

## 7. Rejected and deferred

| Item | Reason |
|---|---|
| Grammar Checker / Paraphraser / Summarizer / Plagiarism Checker | Infeasible client-side (needs an LLM or paid search API). Essay-rewriting framing is an academic-dishonesty policy risk, and QuillBot and Grammarly own the SERP. |
| AI Humanizer / bypass AI detection / AI text detector | Policy risk (enables dishonest behaviour), unreliable claims, and needs a paid API. |
| Meta Description Generator (AI) | Needs a paid LLM API to be competitive; a template version would be low-value content. |
| LSI Keyword Generator | Would require scraping Google autocomplete or SERPs (ToS and spam-policy risk), and the concept is debunked. |
| Google rank checker / keyword volume / backlink / DA-PA checkers | Need third-party paid data or automated Google queries (machine-generated traffic). |
| Mobile-Friendly Test | Needs headless rendering; iframe checks fail on X-Frame-Options and CSP. An informational article could cover the query. |
| Keyword Grouping Tool (lexical clustering) | A lexical-only tool under-delivers against SERP-based SaaS and invites misleading-functionality complaints. |
| Internet Speed Test | Needs dedicated bandwidth servers; Google/M-Lab, Ookla and fast.com own it. |
| Currency Converter | Zero-click Google widget, XE/Wise/OANDA dominance, and it needs a live rates source. |
| Coin Flip, Online Stopwatch/Timer, Dice Roller, Tip Calculator | Google shows its own widgets so clicks are minimal, and N-minute timer page sets would be scaled-content abuse. |
| Text to Speech (browser voices) | Voices vary by OS and cannot export MP3; under-delivers against NaturalReader and ElevenLabs. |
| Typing Speed Test | Brand SERP (Monkeytype, TypingTest.com, 10FastFingers) with strong engagement signals. |
| Word Unscrambler / Anagram Solver | Brutal programmatic SERP, a large word list, and a word-game niche off-strategy for a utility brand. |
| Emoji Copy & Paste | Entrenched authority sites (getemoji, emojipedia). |
| BMI, TDEE/Calorie and Pregnancy Due Date calculators | YMYL health with AI Overviews and NHS/CDC on page 1; no medical E-E-A-T. Revisit after 12 months. |
| Loan / Mortgage / EMI Calculator | YMYL finance with KD about 81 and bank/NerdWallet dominance; compound and simple interest cover finance depth. |
| Love Calculator | Low-value entertainment traffic that dilutes the utility focus; deferred beyond month 6. |
| YouTube Tag Generator and Instagram Hashtag Generator | No real suggestion data without paid APIs; vidIQ and keywordtool.io dominate. |
| YouTube Tag Extractor | Dropped from the roadmap (policy critique): needs the YouTube Data API with its compliance audit, storage limits and required disclosures, is a low-value competitor-spying utility, and breaks the client-side rule. |
| YouTube Channel Name / Instagram Username / Twitch Name / Instagram Bio generators | Canva, Hootsuite and AI SaaS dominate, and word-list generators are thin content. |
| Fancy Text / Font Generator hub | Hopeless head term; demand is served by platform-specific pages (Instagram bios, bold, small, strikethrough). |
| Separate YouTube Shorts Money Calculator page | Merged into the YouTube money calculator as a toggle and section: same widget and overlapping copy is a near-duplicate risk. Revisit only if Search Console shows separate Shorts impressions and 600+ different words exist. |
| Separate YouTube RPM Calculator page | Merged into the YouTube money calculator as an RPM mode (same duplicate-page reasoning). |
| Separate Title Tag Length Checker page | Merged into the combined title and meta description checker: Google returns the same pages for both queries, so two pages would cannibalize. |
| Separate Characters to Words page | Folded into the character counter as a conversion section and lookup table; thin standalone intent partly answered by a Google snippet. Words to pages takes the launch slot. |
| Separate Glassmorphism page and launch-day Liquid Glass Generator | Google treats the topics as one SERP, and refraction only renders in Chromium with a vague map-generation spec. One merged page moves to Month 2, frosted-glass first, after a Trends check. |
| URL Slug Generator duplicate (/url-slug-generator) | Cannibalization: identical intent to /slug-generator. |
| Number Base Converter duplicate and standalone Text to Binary | Merged into /binary-to-decimal and /binary-translator. |
| JSON Minifier (/json-minify) and File Checksum Calculator | Merged into json-formatter (minify tab) and hash-generator (file mode). |
| Separate Upside Down Text page | Merged with reverse text; shared code and near-identical copy. |
| Programmatic preset sets (per-hex colour pages, X words to pages, N days from today, per-city time zones, per-KB compress pages) | Scaled-content abuse risk. Only a hand-written handful where the SERP shows dedicated pages and Search Console shows impressions (launch exception: three hand-written 30/60/90-day guides). |
| Broken Link Checker | Whole-site crawling is not server-light, and Ahrefs and established checkers own the SERP. |
| Text to Handwriting | Competitors frame it as faking handwritten assignments, heavy build, low ad value. |
| Meme Generator | Imgflip dominates and a bundled template gallery would be copyrighted content. |
| Background Remover, Image to Text (OCR), GIF/Video to GIF | 10-40 MB WASM models or ffmpeg.wasm, slow on phones, brand-dominated SERPs. Deferred past month 6. |
| Color Blind Test (Ishihara-style) | Health-adjacent screening claims and copyrighted plates; the simulator ships instead. |
| Hashtag Counter, YouTube Embed Code Generator, Page Size Checker | Dropped from the 6-month roadmap: 1k-5k volume each, thin pages. Backlog only. |
| Promoting text-compare, unix-timestamp-converter and password-strength-checker to launch (policy critique) | Rejected: all three are head-term SERPs led by brands, the launch set is already 52 tools with 45 to build, and they add authority late rather than early. Scheduled in Month 2 instead. The intent of the suggestion (less platform-brand share, non-hardware utilities) is met by slug-generator, comma-separator and words-to-pages. |
| Dedicated title-case-converter page at launch | Rejected: it would sit next to the case converter. It ships in Month 1 with a different tool (shows which words stayed lowercase and why), and the case converter keeps only a single Title Case button. |
| All downloaders, thumbnail grabbers, proxies, PDF unlockers, fake-document, receipt and fake-tweet generators | AdSense-forbidden or high-risk (dishonest behaviour, copyright circumvention, fake documents); project hard exclusions. |

## 8. AdSense readiness

### Trust layer (all live before applying)

About (real named person or legal entity, location, how tools are built and tested), Contact (working domain mailbox), Privacy Policy (accurate about AdSense cookies, IP handling and localStorage), Terms of Use (user responsible for files and rights, no unlawful use, no warranty), Disclaimer, Cookie Policy with a Google-certified CMP for EEA, UK, CH and US-state consent, Editorial and Methodology page, Corrections and report-an-error link, copyright and takedown contact, /licenses page generated at build time (Lucide ISC, Arimo Apache-2.0, EFF wordlist CC BY 3.0 US, libheif LGPL notices, exifr, sql-formatter, jsonrepair, cronstrue and others; CI fails on GPL, AGPL, CC-NC or unlicensed dependencies), and a site-wide trademark line: YouTube, Instagram, Discord, Google, Tailwind and other names are trademarks of their owners; this site is not affiliated with or endorsed by them. State that the site is not directed to children under 13.

### Site-wide content rules

1. Privacy wording: one shared sentence, never varied: input is processed in your browser and we do not upload or store it. Never write 100% private, nothing leaves your device, works offline or check the network tab (ads and analytics make separate requests). Lint content for those phrases.
2. First-hand claims: no we tested or we measured sentence without a committed artifact (inputs, script, results, browser version, date) under `/research/tests/<slug>/`, linked from the page. Otherwise state the formula or the assumption.
3. Dated facts (Google rich-result changes, YouTube thresholds and revenue split, Discord ANSI palette, browser support, platform character limits, portal limits) get a primary-source link and a check date, logged in a per-tool claims file. If a claim cannot be verified, remove it or mark it reported.
4. Brand names: keep the brand as the searched keyword but use the for-X pattern in H1 and title (Timestamp Generator for Discord, Grid Maker for Instagram, Money Calculator for YouTube Creators). No logos, brand colours or platform UI clones, and never a brand in the site name or domain. No named-competitor comparisons in copy. Do not use competitor brand names such as hammertime as keywords.
5. Consequential-use tools (pay, overtime, clinical age, application limits, tax, finance) use a shared disclaimer component (not legal, payroll, tax, clinical or admissions advice; verify with the official source) plus a source link and a last-reviewed date.
6. Every tool page shows its formula or method, has 1,000+ words of unique text as a floor for usefulness (never padded), and has a real reviewer line.

### Ad placement rules

- Ad units sit outside and below the tool container, never inside it. No ads while a camera or microphone stream is active, and none in fullscreen or flashing test modes.
- High-interaction pages (keyboard-tester, mouse-test, click-speed-test, later spacebar-counter and gamepad-tester): fixed-size test area that never reflows (CLS under 0.1), one ad slot at the bottom below the FAQ, none within 300 px of the pad, no anchor or overlay ads, no click here copy near ads, and never ask users to click ads. Enforce with a high-interaction list in the ad component.
- Send `Permissions-Policy: camera=(self), microphone=(self)` (already configured in next.config.ts) so ad iframes cannot request them.
- Photosensitivity: flashing features (dead-pixel flasher, Morse light mode) are off by default, behind a click-through warning, capped at 3 changes per second, with an always-visible Esc and prefers-reduced-motion support.

### Legal and licence items to close before launch

- HEIC decoder: libheif and libde265 are LGPL and HEVC has patent-pool exposure. Ship the library as a separate, unmodified, lazy-loaded file with notices on /licenses, pin the version, decode only (never JPG-to-HEIC), and get a legal review of the patent question.
- EXIF remover: default keeps creator and copyright fields (DMCA section 1202 concern), with rights wording on the page and in the Terms.
- APCA: not shipped until its licence and naming rules are read and recorded.
- No MP3 encoder (lamejs, LGPL) until licence-checked; roadmap voice recorder depends on this.
- Site name: run USPTO, UKIPO and EUIPO trademark searches (classes 9, 35, 42) before buying a domain, and never change domain after AdSense approval.
- Hard exclusions remain: no downloaders, proxies, DRM or paywall bypass, fake documents, cheque printing, hash cracking, essay writing or click-fraud tools.

## 9. What changed after critique

### Launch set: 54 to 52

| Change | Source | Decision |
|---|---|---|
| Merged title-tag-length-checker into one Title Tag & Meta Description Length Checker | SEO | Accepted. Google returns the same pages for both queries; relabelled medium. |
| serp-snippet-preview kept as a separate page with a build gate, renamed SERP Snippet Preview Tool | SEO, policy | Accepted with a gate: if a SERP check shows the same result set as the checker, demote it to a tab. |
| Dropped characters-to-words; folded into character-counter; added words-to-pages | SEO, engineering | Accepted. |
| Dropped keyword-combiner (Month 3) | SEO | Accepted. Toptal and keywordmatchtypetool.com already cover the combined use. |
| Dropped liquid-glass-generator; merged with glassmorphism into one Month 2 page, frosted-glass first | SEO, engineering | Accepted. Refraction is Chromium-only and the trend is unverified. |
| Deferred hours-calculator to Month 4 | SEO, engineering | Accepted. SERP is Intuit, Harvest and Rize; default UI becomes start/end/break. |
| Merged youtube-shorts-money-calculator into youtube-money-calculator | Policy | Accepted. Toggle plus Shorts section plus RPM mode; near-duplicate risk removed. |
| Deferred tailwind-color-generator to Month 2 | SEO, engineering | Accepted. Medium-high, subjective algorithm, small volume. |
| Deferred mic-test and webcam-test to Month 1 | SEO, policy, engineering | Partly accepted: high competition, camera and microphone ad risk during the AdSense review, and they need the shared useMediaStream hook. |
| Added words-to-pages, comma-separator, slug-generator, invisible-character, click-speed-test | SEO | Accepted. invisible-character carries strict framing rules. |
| Added salary-to-hourly-calculator | Engineering | Accepted under the direction rule (split when each direction has about 10k+ verified volume and a different SERP). Falls back to a toggle if Keyword Planner disagrees. |
| Added border-radius-generator (from Month 3) | Own decision | Needed to keep the design category at 4 tools. |
| Renamed converters to Number & Format Converters and social-media to Creator & Community Tools | Policy | Accepted. Category promise now matches contents. |
| Removed pdf from the categories list; moved PDF tools to Month 6 behind a gate | SEO, policy, engineering | Accepted. An empty category is the most avoidable AdSense rejection. |
| Removed internal text from public descriptions (Existing slug kept, Month 2, no launch tools by design) | Policy | Accepted; build check added. |

### Relabelling and evidence

- Competition labels re-rated with the rubric (see section 1). Draft split 26 low, 21 medium, 7 high; final split is in section 1.
- Removed every Cisco Umbrella competitor claim. Volumes now carry sources or an unverified flag; the top 25 keywords must be validated before their pages are written. The webp 165k US figure, the svg 301k all-locations figure and the exif 40,500 figure are explicitly flagged as single-source.
- CPC is no longer cited where it does not describe the page audience (metadata viewer, image converters, compress-to-KB).
- Removed the lowest-competition SEO term claim from the title and description checker.

### Cannibalization fixes

- One owner per intent: word-counter owns word counter; words-to-time owns reading and speech time; character-counter owns character counter and characters to words; Instagram and SMS counter keywords move to Month 3 pages.
- case-converter keeps a single Title Case button; title-case-converter ships in Month 1 with a different tool. percentage-calculator no longer targets change or difference keywords (owned by percentage-increase-calculator). chronological-age-calculator drops age calculator years months days. remove-duplicate-lines drops the A-Z sort option. mouse-test primary keyword corrected to mouse test, and mouse click test moves to click-speed-test. reverse-text and upside-down-text merged.
- Direction rule adopted: split a converter into two routes only when each direction has about 10k+ verified volume and a different SERP, sharing one component with different defaults, tables, FAQ and 1,000 unique words; otherwise one page with a toggle. rem-to-px is a conditional Month 1 item; hex/rgb, jpg/png and hourly/salary follow the rule.

### Engineering fixes written into specs

- Deterministic pixel widths from a bundled Arimo advance-width table, labelled estimated; no pixel-accurate claim.
- HEIC decoding in a Worker with dynamic import and native-decode detection; metadata always stripped at launch; Live Photo claim dropped.
- compress-image-to-100kb: JPEG only, blob.type checks, Worker plus OffscreenCanvas, dimension fallback, unreachable-target message.
- remove-exif-data: marker walker keeping ICC and an orientation-only APP1, piexifjs for GPS-only, PNG chunk removal, re-encode fallback for other formats, diff via exifr.
- cron: in-house scheduler for five dialects. hash: single-pass streaming in a Worker with a benchmarked size limit. sql-formatter: own minifier and highlighter. json-formatter: tokenizer, jsonrepair, Worker, virtualised tree.
- Colour tools standardise on culori (OKLCH); colord stays out of new code. APCA behind a flag.
- Date tools share a date-only util; shareable state uses the URL hash; anything time-dependent renders a fixed example in prerendered HTML and updates after mount.
- keyboard-tester chatter uses keyup-to-keydown gaps; mouse polling rate labelled Chromium estimate; discord-colored-text uses a textarea and span model; SVG rendering via img blob only.

### Policy fixes written into specs

- Photosensitivity handling for dead-pixel and Morse; high-interaction ad rules; no ads with active streams; precise privacy sentence; first-hand claims tied to artifacts; dated-claims log; brand for-X pattern; disclaimers on pay, clinical, finance and application-limit pages; number-to-words renamed away from check writing; Super Bowl kept out of titles and slugs; EXIF copyright toggle; HEIC and licence notices; YouTube Tag Extractor dropped and the playlist tool made client-side only.

### Critique points rejected or modified

- Promoting text-compare, unix-timestamp-converter and password-strength-checker to launch (policy): rejected; head-term brand SERPs and the launch set is already 52. Month 2.
- title-case-converter at launch (engineering): rejected; Month 1 with a differentiated tool.
- rem-to-px at launch (engineering): conditional Month 1, only if keyword validation shows about 10k+.
- llm-token-counter at launch (SEO): conditional Month 1 after volume validation; counts for non-OpenAI tokenizers would be approximate.
- Dropping the dead-pixel flasher entirely (engineering): kept opt-in with a confirm dialog, 3 changes per second cap, Esc and 60 second auto-stop.
- Merging svg-to-png into an image-converter pattern (SEO): rejected; standalone page with distinct long-tails, sharing the engine anyway.
- Keeping brand-only names (policy said reduce prominence): brand slugs kept for launch, H1s use the for-X pattern; review after 12 months.
- Three 30/60/90-day pages (SEO) versus no programmatic pages (policy): resolved as three hand-written guides with different use cases, in wave B; no more unless Search Console shows impressions.
- Seasonal claims: 2026 Black Friday and finals dropped as forecasts; treated as indexing tests.

## 10. Site name ideas

- ToolkitJar (recommended; domain availability from the draft is unverified)
- ToolCamel (availability unverified)
- Handytab (availability unverified)
- Utilnest (availability unverified)
- Pocketkit Tools (availability unverified). Before buying any name, run trademark searches (USPTO, UKIPO, EUIPO; classes 9, 35, 42) and check social handles, and never change domains after AdSense approval.
