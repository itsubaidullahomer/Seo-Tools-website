# Launch Plan: Free Online Tools Site (Draft)

_Prepared 2026-09-29 by the Head of SEO strategy step of the research workflow (model: Claude Opus 5.5, `claude-opus-5-5`). Inputs: 315 deduplicated candidates from 8 category researchers (`docs/research/raw/*.md`), the competitor analysis and the AdSense policy analysis._

## 1. Strategy in plain English

We will launch with 54 free tools that all run inside the visitor's browser, so there are no servers, no uploads and no running costs. Seven tools are already built. The mix follows how a brand-new website actually gets traffic: about half are small, specific tools where page 1 of Google is currently thin hobby or tiny sites (for example a Discord timestamp generator, a meta description length checker, a chronological age calculator for speech therapists, a chmod calculator and an EXIF photo metadata viewer). Those are the pages that can rank within 3-6 months. About 40% are bigger tools where weaker mid-size sites rank (WebP and HEIC converters, a SQL formatter, a mic test). About 13% are famous head terms (word counter, JSON formatter, password generator) that mostly exist to make the site look complete and to link to everything else. Every tool gets its own page with 1,000+ words of genuinely useful, tool-specific writing (how it works, worked examples, a reference table, honest limitations), because Google's 2026 updates and AdSense reviewers both punish pages that are only a widget or that repeat the same template text.

After launch we add 26-29 tools a month for six months (170 in total), finishing clusters of related tools so they link to each other and build topical authority: image converters in Month 1, a PDF category and core developer encoders in Month 2, the creator/social suite in Month 3, and so on. Tools that need a small server function (What Is My IP, meta tag analyzer, redirect checker) wait until Month 5. We do not build anything that risks the AdSense account (video downloaders, AI essay rewriters, fake documents), nor tools where Google shows its own answer box (coin flip, stopwatch, currency). Apply to AdSense once 30-40 complete tool pages plus About, Contact, Privacy and Terms are live and Search Console shows them indexed, which is typically 3-8 weeks after launch. Expect traffic to concentrate in 2-5 breakout tools, and plan on roughly $2-$6 earned per 1,000 page views.

## 2. Launch set at a glance

- **54 tools at launch** (7 already built in `src/tools/`, 47 to build).
- **Competition mix:** 26 low (48%), 21 medium (38%), 7 high (12%).
  - The brief asked for roughly 60/30/10. The low share is lower because five of the seven high-competition pages are already built (word counter, character counter, percentage calculator, JSON formatter, password generator), so they cost nothing extra.
  - Every 'medium' pick has direct evidence that small or weak domains sit on page 1 today: exported Semrush/Ahrefs data for the WebP and HEIC pages, Umbrella rank checks for SQL, UUID and cron, and SERP observations for the rest.
  - If the build team has to cut scope, drop medium tools before low ones.
- **Every launch category has 5-8 tools**, so no category hub is thin.
- **The PDF category is intentionally absent at launch.** It opens in Month 2 with five tools at once, which avoids an empty or thin hub (an AdSense 'low value content' trigger).
- **All launch tools are 100% client-side** and rated AdSense risk none or low. The only mitigations needed are short disclaimers (finance/payroll estimates, creator-earnings estimates, photosensitivity, non-affiliation lines).

## 3. Categories

| Slug | Name | Icon (lucide) | Launch tools | Description |
|---|---|---|---|---|
| `text` | Text & Writing Tools | `type` | 8 | Count, clean, sort and convert text: word and character counters, case converter, line-break and duplicate removers, reading-time and page estimators. Everything runs in the browser. |
| `seo` | SEO Tools | `search` | 6 | On-page and technical SEO helpers that work without fetching your site: pixel-accurate title and meta description checkers, SERP preview, redirect, robots.txt and llms.txt generators, PPC keyword tools. |
| `developer` | Developer Tools | `code` | 6 | Formatters, validators, converters and generators for everyday coding (JSON, SQL, YAML, UUID, hashes, cron, chmod). Data is processed locally and never uploaded. |
| `image` | Image Tools | `image` | 7 | Convert, compress, resize and inspect images on your own device: WebP, HEIC, AVIF, SVG and PNG converters, target-size compression, EXIF viewer and remover. No uploads, no watermarks. |
| `converters` | Unit & Value Converters | `arrow-left-right` | 5 | Conversions that show the formula: CSS units, colour codes, military time, Morse code, Roman numerals, numbers to words and number bases. |
| `calculators` | Calculators | `calculator` | 5 | Everyday calculators for percentages, dates, ages, work hours, pay and grades, each with the math shown step by step. |
| `social-media` | Social Media & Creator Tools | `share-2` | 6 | Tools for creators and community managers: Discord timestamps and coloured text, YouTube earnings and watch-time calculators, Instagram grid and caption helpers. No downloaders, no account lookups. |
| `design` | Color & CSS Tools | `palette` | 5 | Visual generators that write production-ready CSS and Tailwind code, plus accessibility-first colour tools such as a WCAG 2.2 contrast checker and OKLCH palette generators. |
| `utilities` | Utilities & Device Tests | `shield-check` | 6 | Test your keyboard, mouse, microphone, webcam and screen, generate strong passwords and QR codes, and use other everyday helpers that run entirely in your browser. |
| `pdf` | PDF Tools | `file-text` | 0 | Merge, split, rotate and convert PDFs without uploading them. This category goes live in Month 2 with at least five tools at once, so it is never thin or empty. |

The `utilities` category keeps its existing slug, but its display name should change to **Utilities & Device Tests**. Organise its hub page with H2 groups: Device tests / Security / QR / Random pickers. Add `pdf` to `src/lib/tools/categories.ts` only in the same release that ships its first five tools.

## 4. Launch tools (summary table)

| # | Tool | URL | Category | Primary keyword | Est. monthly searches | Competition | Status |
|---|---|---|---|---|---|---|---|
| 1 | Word Counter | `/tools/word-counter` | text | word counter | 800k-1.5M (Ahrefs snippet: 'word counter' 792K US; 'word count' 214K US) | high | built |
| 2 | Character Counter | `/tools/character-counter` | text | character counter | 300k-600k (Ahrefs snippet: 'character counter' 216K US, 'character count' 78K US) | high | built |
| 3 | Case Converter | `/tools/case-converter` | text | case converter | 250k-450k (Semrush snippet: 'case converter' 222,200/mo; convertcase.net 5.02M visits/mo) | medium | built |
| 4 | Remove Line Breaks | `/tools/remove-line-breaks` | text | remove line breaks | 30k-60k (estimate from autocomplete + competitor coverage; the flagship page on textfixer, which has 867K visits/mo per Semrush) | low | built |
| 5 | Remove Duplicate Lines | `/tools/remove-duplicate-lines` | text | remove duplicate lines | 15k-40k (estimate from autocomplete + 10+ competitor pages: convertcase, pinetools, browserling, textfixer, onlinetexttools) | low | to build |
| 6 | Alphabetical Order Tool (Sort Lines A-Z) | `/tools/alphabetical-order` | text | alphabetical order tool | 60k-150k (estimate; sortmylist.com 38K visits/mo per Similarweb snippet; alphabetizer.flap.tv ranks #1) | medium | to build |
| 7 | Words to Time Calculator (Reading & Speaking Time) | `/tools/words-to-time` | text | words to time | 80k-200k cluster (Semrush snippet: wordstotime.com 180K visits/mo, 64% Google organic; PAA cluster confirmed) | low | to build |
| 8 | Characters to Words Converter | `/tools/characters-to-words` | text | characters to words | 20k-60k cluster (estimate from PAA + dedicated competitor pages: charactercounter.com, capitalizemytitle, lettercounter.org) | low | to build |
| 9 | Meta Description Length Checker (Pixel Width) | `/tools/meta-description-length-checker` | seo | meta description length checker | 3k-8k for the tool + 10k-20k informational 'meta description length' (estimate from autocomplete + page-1 coverage) | low | to build |
| 10 | Title Tag Length Checker (Pixel Width) | `/tools/title-tag-length-checker` | seo | title tag length checker | 3k-6k for the tool + 5k-10k informational 'title tag length' (estimate from autocomplete + coverage) | low | to build |
| 11 | Google SERP Snippet Preview | `/tools/serp-snippet-preview` | seo | serp preview tool | 5k-12k combined across synonyms (estimate; highervisibility.com 271K visits/mo per Semrush snippet) | medium | to build |
| 12 | llms.txt Generator | `/tools/llms-txt-generator` | seo | llms.txt generator | 1k-4k and rising (estimate from 2026 roundups and SaaS free tools) | low | to build |
| 13 | .htaccess & Nginx Redirect Generator | `/tools/htaccess-redirect-generator` | seo | htaccess redirect generator | 3k-6k combined (estimate from coverage: consultants and small tools rank) | low | to build |
| 14 | Keyword Combiner & Match Type Wrapper | `/tools/keyword-combiner` | seo | keyword combiner | 2k-5k combined (estimate from coverage: agency micro-tools rank) | low | to build |
| 15 | JSON Formatter & Validator | `/tools/json-formatter` | developer | json formatter | 400k-700k cluster (estimate from Ahrefs/Semrush knowledge; jsonformatter.org 2.57M visits/mo) | high | built |
| 16 | SQL Formatter (15+ Dialects) | `/tools/sql-formatter` | developer | sql formatter | 50k-90k cluster (estimate; sqlformat.org, poorsql.com, sql-format.com absent from the Umbrella top 1M) | medium | to build |
| 17 | UUID / GUID Generator (v4, v7, ULID) | `/tools/uuid-generator` | developer | uuid generator | 120k-220k cluster (estimate; leader uuidgenerator.net has Umbrella rank only 664k) | medium | to build |
| 18 | Hash Generator (MD5, SHA-256, SHA-512, CRC32) | `/tools/hash-generator` | developer | hash generator | 150k-300k cluster (estimate: md5 generator 40k-70k, sha256 generator 30k-50k; the specialist domains are absent from the Umbrella top 1M) | medium | to build |
| 19 | Cron Expression Generator & Explainer | `/tools/cron-expression-generator` | developer | cron expression generator | 80k-150k cluster (estimate; crontab.guru has Umbrella rank only 631k; schedule-specific queries answered by thin pages) | medium | to build |
| 20 | Chmod Calculator (Linux File Permissions) | `/tools/chmod-calculator` | developer | chmod calculator | 30k-60k tool + 150k-300k informational (estimate; chmod-calculator.com and chmodcommand.com absent from the Umbrella top 1M) | low | to build |
| 21 | WebP to PNG Converter | `/tools/webp-to-png` | image | webp to png | 300k-600k global; US 165,000 (Semrush US export ~Apr 2026, CPC $0.85, near-zero paid competition) | medium | to build |
| 22 | WebP to JPG Converter | `/tools/webp-to-jpg` | image | webp to jpg | 200k-400k global; US 110,000 + 'convert webp to jpg' 22,200 + 'webp to jpeg' 12,100 (Semrush US export) | medium | to build |
| 23 | HEIC to JPG Converter | `/tools/heic-to-jpg` | image | heic to jpg | 150k-400k global English (Ahrefs Global export 2026-07: 'how to convert HEIC to JPG' 110,000 KD 39, 'HEIF to JPG' 5,400 KD 21; Keyword Planner all-locations 1.22M, +22% YoY) | high | to build |
| 24 | SVG to PNG Converter | `/tools/svg-to-png` | image | svg to png | 100k-300k global (Google Keyword Planner all-locations 301K per a third-party PRD) | medium | to build |
| 25 | Compress Image to 100KB (or Any Size) | `/tools/compress-image-to-100kb` | image | compress image to 100kb | 200k-400k global cluster, India-heavy; US est 5k-15k (Google Ads India export May 2026: reduce image size in kb 110,000; compress image to 100kb 60,500; compress image to 20kb 49,500) | low | to build |
| 26 | EXIF Viewer (Photo Metadata Checker) | `/tools/exif-viewer` | image | exif viewer | 40k-80k global cluster (Semrush US export: metadata viewer 6,600 CPC $6.82; exif data 4,400; exif viewer 2,400; exif data viewer 2,900) | low | to build |
| 27 | Remove EXIF Data (Strip Photo Metadata) | `/tools/remove-exif-data` | image | remove exif data | 20k-60k global (Keyword Planner export via third-party CSV: 'exif data remove' 40,500, country unstated) | low | to build |
| 28 | PX to REM Converter | `/tools/px-to-rem` | converters | px to rem | 15k-40k combined (estimate from SERP composition: SaaS free-tool pages and tiny Vercel apps) | low | to build |
| 29 | Military Time Converter (+ Printable Chart) | `/tools/military-time-converter` | converters | military time converter | 50k-150k (estimate from autocomplete + fragmented SERP: ontheclock, clockit, printable-chart sites) | low | to build |
| 30 | Morse Code Translator (with Audio) | `/tools/morse-code-translator` | converters | morse code translator | 150k-350k (estimate from Similarweb: morsecode.world ~470k visits/mo, 40% US) | medium | to build |
| 31 | Number to Words Converter (Check Writing) | `/tools/number-to-words` | converters | number to words | 60k-150k (estimate; fragmented SERP of calculatorsoup and small or mid sites) | medium | to build |
| 32 | Roman Numeral Converter | `/tools/roman-numeral-converter` | converters | roman numeral converter | 100k-300k with February peaks (estimate; Google Trends US all-time high in Feb 2026 around Super Bowl LX) | medium | to build |
| 33 | Percentage Calculator | `/tools/percentage-calculator` | calculators | percentage calculator | 1M-2M, US 500k+ (estimate anchored on Ahrefs: percentagecalculator.net gets ~396k visits/mo from #1 US) | high | built |
| 34 | Chronological Age Calculator (for Testing) | `/tools/chronological-age-calculator` | calculators | chronological age calculator | 10k-40k (estimate from autocomplete breadth + a SERP of small SLP/EMD sites) | low | to build |
| 35 | Days From Today Calculator | `/tools/days-from-today` | calculators | days from today | 300k-700k cluster (estimate from common N-day queries; SERP includes small sites such as timedatecalc and edgecalculator) | medium | to build |
| 36 | Hours Calculator (Time Card & Timesheet) | `/tools/hours-calculator` | calculators | hours calculator | 100k-300k, US-heavy (estimate; SERP full of payroll SaaS = high advertiser demand) | medium | to build |
| 37 | Hourly to Salary Calculator | `/tools/hourly-to-salary-calculator` | calculators | hourly to salary calculator | 70k-150k cluster (search-snippet Semrush-type data: 33K and 38K US for the two directions; 'salary calculator' 150K US) | medium | to build |
| 38 | Discord Timestamp Generator | `/tools/discord-timestamp-generator` | social-media | discord timestamp generator | 30k-80k (estimate; hammertime.cyou 446K visits/mo (Similarweb) with 'discord timestamp' among its top keywords; 6+ exact-match domains) | low | to build |
| 39 | Discord Colored Text Generator | `/tools/discord-colored-text-generator` | social-media | discord colored text generator | 10k-30k (estimate from SERP composition: GitHub repos, personal sites, how-to blogs) | low | to build |
| 40 | YouTube Money Calculator | `/tools/youtube-money-calculator` | social-media | youtube money calculator | 60k-150k (estimate from SERP saturation: ~15 dedicated pages; high-CPC creator-finance niche) | medium | to build |
| 41 | YouTube Shorts Money Calculator | `/tools/youtube-shorts-money-calculator` | social-media | youtube shorts money calculator | 8k-25k (estimate; ~8 dedicated pages, mostly launched 2025-26) | low | to build |
| 42 | YouTube Watch Time Calculator (4,000 Hours) | `/tools/youtube-watch-time-calculator` | social-media | youtube watch time calculator | 5k-15k (estimate; EMD watchtimecalculator.com and small tools rank) | low | to build |
| 43 | Instagram Grid Maker (Image Splitter) | `/tools/instagram-grid-maker` | social-media | instagram grid maker | 10k-30k (estimate; 10+ dedicated tools, including an EMD) | low | to build |
| 44 | Color Contrast Checker (WCAG 2.2 + APCA) | `/tools/color-contrast-checker` | design | color contrast checker | 40k-80k global cluster (Semrush US export Apr 2026: color contrast checker 9,900 CPC $3.40; contrast checker 6,600 CPC $2.41; color contrast 2,900 CPC $5.65) | high | to build |
| 45 | CSS Box Shadow Generator | `/tools/box-shadow-generator` | design | box shadow generator | 30k-70k (estimate; SERP observed 2026-09-29 with small sites on page 1) | medium | to build |
| 46 | Tailwind Color Shade Generator (v4 OKLCH) | `/tools/tailwind-color-generator` | design | tailwind color generator | 3k-10k (estimate; SERP observed 2026-09-29: magicpattern, tints.dev, small tool sites and the Tailwind docs) | low | to build |
| 47 | Liquid Glass CSS Generator | `/tools/liquid-glass-generator` | design | liquid glass css generator | 2k-10k and rising (estimate; trend since WWDC June 2025; SERP observed 2026-09-29) | low | to build |
| 48 | CSS Clamp Calculator (Fluid Typography) | `/tools/clamp-calculator` | design | css clamp calculator | 3k-8k (estimate; utopia.fyi, clamp.font-size.app and fluid-type-scale.com rank) | low | to build |
| 49 | Password Generator | `/tools/password-generator` | utilities | password generator | 500k-1.2M (estimate reconciling conflicting planning figures) | high | built |
| 50 | Keyboard Tester | `/tools/keyboard-tester` | utilities | keyboard tester | 200k-500k (estimate; small EMD sites on page 1, no hard figure retrievable) | medium | to build |
| 51 | Mic Test (Online Microphone Test) | `/tools/mic-test` | utilities | mic test | 200k-500k (estimate from SERP composition: Loom, livestorm and small single-purpose sites; remote-work demand) | medium | to build |
| 52 | Webcam Test (Online Camera Test) | `/tools/webcam-test` | utilities | webcam test | 150k-400k (estimate from SERP composition: webcamtests.com, Loom and small sites) | medium | to build |
| 53 | Dead Pixel Test (Screen Test) | `/tools/dead-pixel-test` | utilities | dead pixel test | 40k-100k (estimate; SERP of small sites only) | low | to build |
| 54 | Mouse Test (Double Click & Button Test) | `/tools/mouse-test` | utilities | mouse double click test | 30k-80k (estimate) | low | to build |

### Suggested build order for the 47 new pages

Build the lowest-competition, highest-evidence pages first, so the earliest-indexed pages are the ones that can rank:
1. **Wave A (weeks 1-2):** discord-timestamp-generator, meta-description-length-checker, title-tag-length-checker, chronological-age-calculator, webp-to-png, webp-to-jpg, exif-viewer, remove-exif-data, px-to-rem, military-time-converter, chmod-calculator, remove-duplicate-lines, words-to-time, color-contrast-checker
2. **Wave B (weeks 3-4):** heic-to-jpg, compress-image-to-100kb, svg-to-png, sql-formatter, uuid-generator, hash-generator, cron-expression-generator, youtube-money-calculator, youtube-shorts-money-calculator, youtube-watch-time-calculator, discord-colored-text-generator, instagram-grid-maker, days-from-today, hours-calculator, hourly-to-salary-calculator, roman-numeral-converter
3. **Wave C (weeks 5-6):** everything else (serp-snippet-preview, llms-txt-generator, htaccess-redirect-generator, keyword-combiner, alphabetical-order, characters-to-words, morse-code-translator, number-to-words, box-shadow-generator, tailwind-color-generator, liquid-glass-generator, clamp-calculator, keyboard-tester, mic-test, webcam-test, dead-pixel-test, mouse-test)

## 5. Launch tools (full specs for builders and writers)

### 1. Word Counter: `/tools/word-counter`

- **Category:** text | **Competition:** high | **Status:** already built
- **Primary keyword:** word counter
- **Secondary keywords:** word count, word count checker, essay word counter, online word counter, word counter with reading time, count words in text
- **Est. monthly searches:** 800k-1.5M (Ahrefs snippet: 'word counter' 792K US; 'word count' 214K US)
- **Why launch:** Already built. It is the text category's cornerstone and internal-link hub. It won't rank #1 within 6 months, but it picks up long-tail traffic (essay word counter, word counter with reading time) and supports every other text page topically. This is one of the ~10% head-term slots.
- **Tool spec (how we beat #1):** Live counts of words, characters (with and without spaces), sentences, paragraphs, and reading and speaking time, plus a top-keywords density table. Goal presets (Common App 650 words, IB Extended Essay 4,000, meta description, X post) show a progress bar and an over-limit warning. Counting rules match Microsoft Word and Google Docs, and a 'why counts differ' tooltip explains edge cases. The last text is kept in localStorage with a one-click clear. Unlike wordcounter.net, there are no pop-ups and nothing above the tool except the H1.
- **Content angle (1,000+ words):** How word-count rules differ between Word, Google Docs and platforms (hyphens, numbers, URLs, em dashes). A reference table of common limits (college essays, UCAS/AMCAS limits in characters, abstracts, grant sections, social posts). Quick words-per-page and words-per-minute facts that link to /tools/words-to-time. How to count words in Docs, Word, Pages and a PDF. A privacy answer ('your text is not uploaded').
- **AdSense notes:** Frame it as a counting tool only; never offer essay writing.

### 2. Character Counter: `/tools/character-counter`

- **Category:** text | **Competition:** high | **Status:** already built
- **Primary keyword:** character counter
- **Secondary keywords:** character count, character counter with spaces, character count without spaces, letter counter, sms character counter, instagram character counter
- **Est. monthly searches:** 300k-600k (Ahrefs snippet: 'character counter' 216K US, 'character count' 78K US)
- **Why launch:** Already built. It is the second text hub, and its platform-limit sections capture social and SEO long-tails that later get their own social-category pages. Head-term slot.
- **Tool spec (how we beat #1):** Counts characters with and without spaces, letters only, grapheme count (emoji and accented letters counted correctly via Intl.Segmenter) versus UTF-16 length, and UTF-8 bytes. SMS segments are calculated with GSM-7 vs UCS-2 detection (160/153 vs 70/67). Platform limit bars cover X 280 (weighted), Instagram 2,200, LinkedIn 3,000, YouTube title 100 and meta description ~155-160. Text beyond the chosen limit is highlighted in red.
- **Content angle (1,000+ words):** Why character counts differ between tools (emoji, CJK, grapheme clusters, line breaks). A dated 2026 platform-limit table with sources. SMS encoding explained: one emoji switches a message to UCS-2 and halves the limit. Excel =LEN() and Google Docs how-tos. A link to /tools/characters-to-words for the character-to-word ratio.
- **AdSense notes:** None.

### 3. Case Converter: `/tools/case-converter`

- **Category:** text | **Competition:** medium | **Status:** already built
- **Primary keyword:** case converter
- **Secondary keywords:** convert case, uppercase to lowercase, lowercase to uppercase, sentence case converter, camel case converter, snake case converter
- **Est. monthly searches:** 250k-450k (Semrush snippet: 'case converter' 222,200/mo; convertcase.net 5.02M visits/mo)
- **Why launch:** Already built. Demand is huge, and convertcase.net shows a solo site can earn ~$20K/mo from it. The rest of page 1 is mid and small sites, and sub-case long-tails (sentence case, uppercase to lowercase) are winnable first.
- **Tool spec (how we beat #1):** One-click UPPER, lower, Sentence, Title (AP/Chicago toggle with small-word rules), Capitalized, aLtErNaTiNg and InVeRsE cases. Developer cases: camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and dot.case. A 'preserve acronyms' option keeps NASA and URL uppercase in sentence case. Undo history, keyboard shortcuts, copy and .txt download. Works on 1MB+ text instantly.
- **Content angle (1,000+ words):** An example table for every case with the same sentence. How to change case in Word (Shift+F3), Google Docs, Excel (=UPPER/LOWER/PROPER) and on Mac. When to use sentence case vs title case for headlines and SEO. Programming naming conventions by language (JS camelCase, Python snake_case, CSS kebab-case, constants). Pitfalls: proper nouns, acronyms, and the Turkish dotted i with locale-aware lowercasing.
- **AdSense notes:** None.

### 4. Remove Line Breaks: `/tools/remove-line-breaks`

- **Category:** text | **Competition:** low | **Status:** already built
- **Primary keyword:** remove line breaks
- **Secondary keywords:** line break remover, remove line breaks from pdf text, remove paragraph breaks, remove empty lines, join lines online, convert line breaks to spaces
- **Est. monthly searches:** 30k-60k (estimate from autocomplete + competitor coverage; the flagship page on textfixer, which has 867K visits/mo per Semrush)
- **Why launch:** Already built. The task is frequent and repeated (text pasted from PDFs and emails), page 1 is thin utility pages, and the PAA box asks for how-tos we can answer in depth.
- **Tool spec (how we beat #1):** Modes: remove all breaks, keep paragraph breaks (double newline), replace with a space, comma or custom string, or remove empty lines only. Also: fix words hyphenated across lines ('exam-\nple' becomes 'example'), trim trailing spaces, and normalise \r\n, \r and U+2028/U+2029. Live before/after line and character counts, copy and download.
- **Content angle (1,000+ words):** Why text copied from PDFs and emails has hard line breaks (fixed-width layout, soft vs hard returns). Step-by-step methods for Word (^p and ^l), Excel (Ctrl+H with Ctrl+J), Google Docs regex \n, Notepad++ and VS Code regex. A worked example with a PDF paragraph before and after. Mention the inverse task (adding line breaks), which links to the social line-break tools later.
- **AdSense notes:** None.

### 5. Remove Duplicate Lines: `/tools/remove-duplicate-lines`

- **Category:** text | **Competition:** low | **Status:** to build
- **Primary keyword:** remove duplicate lines
- **Secondary keywords:** duplicate line remover, remove duplicates from list, dedupe list online, unique lines, find duplicate lines, remove duplicate words
- **Est. monthly searches:** 15k-40k (estimate from autocomplete + 10+ competitor pages: convertcase, pinetools, browserling, textfixer, onlinetexttools)
- **Why launch:** Low competition with clear intent. It shares a component with the line-break and sort tools, forming a 'list cleaning' cluster.
- **Tool spec (how we beat #1):** Case-sensitive toggle, trim-before-compare, ignore empty lines, and keep first or last occurrence. Optional A-Z sort, a 'show removed duplicates with counts' panel, and a 'duplicates only' mode. Set-based, so it handles 100k+ lines instantly. Counts of lines in, out and removed.
- **Content angle (1,000+ words):** How-tos for Notepad++ (Line Operations), Excel (Remove Duplicates, =UNIQUE), Google Sheets, Linux sort -u / awk and VS Code. Case and whitespace pitfalls (emails with trailing spaces, 'Apple' vs 'apple'). Use cases: email lists, keyword lists, log files, CSV cleanup. A worked example showing the removed-lines report.
- **AdSense notes:** None.

### 6. Alphabetical Order Tool (Sort Lines A-Z): `/tools/alphabetical-order`

- **Category:** text | **Competition:** medium | **Status:** to build
- **Primary keyword:** alphabetical order tool
- **Secondary keywords:** alphabetizer, put in alphabetical order, sort list alphabetically, abc order, reverse alphabetical order, sort lines online
- **Est. monthly searches:** 60k-150k (estimate; sortmylist.com 38K visits/mo per Similarweb snippet; alphabetizer.flap.tv ranks #1)
- **Why launch:** A common student and office task that Google Docs does not support natively (strong PAA). The current winners are tiny single-tool sites that a better page can beat within 6-12 months.
- **Tool spec (how we beat #1):** A-Z and Z-A with locale-aware collation (Intl.Collator, so accented letters sort correctly), natural numeric sort (item2 before item10), ignore leading articles (The/A/An), sort by last name, by length, or randomly. Dedupe and case-insensitive options. Input and output separators: new line, comma, semicolon or custom. One-click copy.
- **Content angle (1,000+ words):** How to alphabetize in Google Docs (no native feature; workarounds), Word, Excel and Sheets. Filing and reference-list rules: letter-by-letter vs word-by-word, 'Mc'/'Mac', numbers and symbols, APA reference ordering. Worked examples of 'The' handling and last-name sorting. Why computers sort 'Zebra' before 'apple' (ASCII order) and how this tool avoids it.
- **AdSense notes:** None.

### 7. Words to Time Calculator (Reading & Speaking Time): `/tools/words-to-time`

- **Category:** text | **Competition:** low | **Status:** to build
- **Primary keyword:** words to time
- **Secondary keywords:** words to minutes, speech time calculator, reading time calculator, how many words is a 5 minute speech, how long does it take to read 1000 words, speaking time calculator
- **Est. monthly searches:** 80k-200k cluster (Semrush snippet: wordstotime.com 180K visits/mo, 64% Google organic; PAA cluster confirmed)
- **Why launch:** Proven demand won by a tiny single-tool site. The audience is writers and speakers (US-heavy), and dozens of question long-tails fit on one page.
- **Tool spec (how we beat #1):** Paste text or type a word count. Outputs silent reading (238 wpm), reading aloud (183), presentation (130) and fast speech (160), plus a custom WPM slider. Reverse mode gives the words needed for N minutes. Options for pause time per paragraph or slide, and presets for podcast intro, wedding toast, TED-style talk and 15/30/60-second voice-over ads.
- **Content angle (1,000+ words):** The research basis (Brysbaert 2019 meta-analysis: 238 wpm silent, 183 wpm aloud). A table converting 1, 2, 3, 5, 10 and 20 minutes into word counts at several paces. Voice-over script lengths for ad spots. Why technical and non-native text reads slower. Pacing tips for speeches. Must not duplicate the word counter's short reading-time FAQ; this page goes deep on speaking.
- **AdSense notes:** None.

### 8. Characters to Words Converter: `/tools/characters-to-words`

- **Category:** text | **Competition:** low | **Status:** to build
- **Primary keyword:** characters to words
- **Secondary keywords:** how many words is 500 characters, characters to words converter, how many words is 1000 characters, words to characters, ucas 4000 characters in words, character limit to word count
- **Est. monthly searches:** 20k-60k cluster (estimate from PAA + dedicated competitor pages: charactercounter.com, capitalizemytitle, lettercounter.org)
- **Why launch:** Cheap to build and low competition. It rides the character-counter hub, and application-form intent (UCAS, AMCAS, scholarships) is Western and high-value.
- **Tool spec (how we beat #1):** Converts a character count to an estimated word range and back, with a with/without-spaces toggle and language presets (English, Spanish, German, French average word lengths). A 'paste your own writing' mode computes your personal ratio exactly. Presets: UCAS personal statement 4,000 characters, AMCAS 5,300, LinkedIn About 2,600, X post 280, meta description 160. A lookup table from 100 to 10,000 characters. One page only, with no per-number sub-pages.
- **Content angle (1,000+ words):** Why the ratio varies (average English word ~4.7 letters, plus space and punctuation, gives ~5.5-6.5 characters per word). How application portals count spaces and line breaks (UCAS counts both). A lookup table and worked examples for 250, 500, 1,000 and 4,000 characters. Tips for cutting to a character limit.
- **AdSense notes:** Do not mass-generate 'X characters to words' pages (scaled content abuse).

### 9. Meta Description Length Checker (Pixel Width): `/tools/meta-description-length-checker`

- **Category:** seo | **Competition:** low | **Status:** to build
- **Primary keyword:** meta description length checker
- **Secondary keywords:** meta description checker, meta description pixel checker, meta description character counter, meta description length 2026, google meta description length, bulk meta description checker
- **Est. monthly searches:** 3k-8k for the tool + 10k-20k informational 'meta description length' (estimate from autocomplete + page-1 coverage)
- **Why launch:** The lowest-competition high-intent SEO term researched. Brand-new 2026 sites with dated guides already rank on page 1. It anchors the SERP-snippet cluster and attracts a high-CPC marketer audience.
- **Tool spec (how we beat #1):** Measures pixel width with Canvas measureText in Google's snippet font (Arial), with separate desktop and mobile truncation markers (research notes ~920px desktop and ~580-680px mobile; re-verify against live SERPs before publishing). A live SERP preview shows the ellipsis where Google would cut. Character count is a secondary metric, and query keywords can be bolded. Bulk mode: paste 'URL,description' rows to get a pass/warn/fail table with duplicate detection and CSV export.
- **Content angle (1,000+ words):** Why pixels matter more than characters, with a worked example: 'WWWW' vs 'iiii' widths. Facts to cite with dates: Google rewrites a large share of descriptions (cite a dated study rather than one number); descriptions are not a ranking factor but affect CTR; AI Overviews change how much the snippet matters. Good vs truncated examples by page type (product, blog, local). A bulk-audit workflow using a crawler export.
- **AdSense notes:** None.

### 10. Title Tag Length Checker (Pixel Width): `/tools/title-tag-length-checker`

- **Category:** seo | **Competition:** low | **Status:** to build
- **Primary keyword:** title tag length checker
- **Secondary keywords:** title tag checker, meta title length checker, title tag pixel checker, seo title length, title tag length 2026, why did google change my title
- **Est. monthly searches:** 3k-6k for the tool + 5k-10k informational 'title tag length' (estimate from autocomplete + coverage)
- **Why launch:** Sister page of the description checker with a distinct query set. Google's March 2026 AI title-rewrite tests created fresh content demand that no big site has fully covered.
- **Tool spec (how we beat #1):** Measures title width at Google's desktop title size (~20px Arial) against a ~600px limit, with live desktop and mobile SERP rendering. A brand-suffix builder shows the space left after ' | Brand'. Includes a keyword-position indicator, bulk paste mode with CSV export, and a 'rewrite risk' checklist based on Google's title-link documentation (boilerplate, all caps, keyword repetition, mismatch with the H1). It shares the pixel engine with the description checker but has its own defaults and copy.
- **Content angle (1,000+ words):** How Google generates title links (its documentation) and the 2026 AI title-rewrite tests. Title tag vs H1. Separators (pipe vs dash) and brand placement. Emoji and special characters. Worked examples of rewritten titles and why each was rewritten. A length reference table by device.
- **AdSense notes:** None.

### 11. Google SERP Snippet Preview: `/tools/serp-snippet-preview`

- **Category:** seo | **Competition:** medium | **Status:** to build
- **Primary keyword:** serp preview tool
- **Secondary keywords:** serp simulator, google serp simulator, serp snippet optimizer, google snippet preview, meta title preview, how will my page look on google
- **Est. monthly searches:** 5k-12k combined across synonyms (estimate; highervisibility.com 271K visits/mo per Semrush snippet)
- **Why launch:** Hub of the snippet cluster: it links to both length checkers and later the meta tag generator. Several near-synonym queries (serp simulator, snippet preview, snippet optimizer) can be captured by one strong page.
- **Tool spec (how we beat #1):** Pixel-accurate desktop and mobile rendering of site name, favicon (local upload), breadcrumb URL, optional date, title and description, with query-keyword bolding and a dark-mode SERP. Side-by-side A/B of two versions, export as PNG, and state shared in the URL hash. Paste mode only; no live page fetching at launch.
- **Content angle (1,000+ words):** Anatomy of a September 2026 Google result (site name, favicon, breadcrumb, date). What Google may rewrite and why. Rich-result status: FAQ rich results removed on 7 May 2026, HowTo gone since 2023. How AI Overviews change CTR. A CTR-improvement checklist with before/after examples made with the tool.
- **AdSense notes:** Generic SERP mockup only; no Google logo. Add a non-affiliation note.

### 12. llms.txt Generator: `/tools/llms-txt-generator`

- **Category:** seo | **Competition:** low | **Status:** to build
- **Primary keyword:** llms.txt generator
- **Secondary keywords:** llms txt generator, create llms.txt, llms.txt example, what is llms.txt, llms-full.txt, llms.txt vs robots.txt
- **Est. monthly searches:** 1k-4k and rising (estimate from 2026 roundups and SaaS free tools)
- **Why launch:** A trending 2025-2026 topic with no established tool farm, cheap to build, and good link-bait. It starts the crawl-control cluster (robots.txt generator, AI-bot blocker) that follows in Months 1-2.
- **Tool spec (how we beat #1):** Form fields: site name, one-paragraph summary, optional notes, and repeatable sections of link + description rows. Outputs spec-compliant Markdown (H1, blockquote summary, H2 sections, an 'Optional' section) with a structural validator (absolute URLs, required H1, empty sections). Can import URLs from a pasted sitemap.xml. Downloads llms.txt and a llms-full.txt skeleton.
- **Content angle (1,000+ words):** What the llms.txt proposal is (Jeremy Howard, September 2024) and an honest status: major AI providers have not confirmed they use it, so present it as low-cost and optional, not a ranking lever. llms.txt vs robots.txt vs sitemap.xml. Where to host it. Example files for a SaaS docs site, a blog and a shop. How to add it in WordPress and Next.js.
- **AdSense notes:** Content must state honestly that adoption by AI vendors is unconfirmed; no overpromising.

### 13. .htaccess & Nginx Redirect Generator: `/tools/htaccess-redirect-generator`

- **Category:** seo | **Competition:** low | **Status:** to build
- **Primary keyword:** htaccess redirect generator
- **Secondary keywords:** 301 redirect generator, bulk redirect generator, htaccess generator, nginx redirect generator, http to https redirect htaccess, www to non-www redirect
- **Est. monthly searches:** 3k-6k combined (estimate from coverage: consultants and small tools rank)
- **Why launch:** Page 1 is individual consultants and small utilities. Multi-server output in one place is a differentiator nobody offers, and the webmaster audience engages deeply.
- **Tool spec (how we beat #1):** Single and bulk modes (CSV of old,new). Output tabs for Apache (Redirect 301 and RewriteRule with query-string handling), Nginx (return 301 and a map block for bulk), Netlify _redirects, Vercel vercel.json, Cloudflare bulk-redirect CSV and IIS web.config. Presets for HTTP to HTTPS, www to non-www, trailing slash and full domain moves. Detects chains and loops within the pasted list and warns.
- **Content angle (1,000+ words):** A 301 vs 302 vs 307 vs 308 table with when to use each. How redirects pass signals. A site-migration redirect checklist. Common .htaccess loop causes and fixes. A worked example of the same redirect on each server.
- **AdSense notes:** None.

### 14. Keyword Combiner & Match Type Wrapper: `/tools/keyword-combiner`

- **Category:** seo | **Competition:** low | **Status:** to build
- **Primary keyword:** keyword combiner
- **Secondary keywords:** keyword mixer, keyword wrapper, keyword match type tool, google ads keyword combiner, broad phrase exact match generator, negative keyword wrapper
- **Est. monthly searches:** 2k-5k combined (estimate from coverage: agency micro-tools rank)
- **Why launch:** The PPC audience means high-CPC ads. It is trivial to build, and combining a combiner and a wrapper in one page beats the single-purpose tools that rank today.
- **Tool spec (how we beat #1):** Cross-multiplies up to 4 lists with an optional all-orders permutation toggle and a custom joiner. Outputs broad, "phrase", [exact] and -negative syntax at once. Includes dedupe, max-words and max-characters filters (Google Ads keyword limits: 80 characters, 10 words), a result counter and warning for huge outputs, and CSV export formatted for Google Ads Editor and Microsoft Advertising.
- **Content angle (1,000+ words):** 2026 match types explained (broad, phrase, exact; modified broad retired in 2021). How many combinations are sensible per ad group. A local-service example (city x service x modifier). Negative keyword strategy. A worked example from three short lists to a clean upload file.
- **AdSense notes:** None.

### 15. JSON Formatter & Validator: `/tools/json-formatter`

- **Category:** developer | **Competition:** high | **Status:** already built
- **Primary keyword:** json formatter
- **Secondary keywords:** json validator, json beautifier, json viewer, json pretty print, fix invalid json, json minify
- **Est. monthly searches:** 400k-700k cluster (estimate from Ahrefs/Semrush knowledge; jsonformatter.org 2.57M visits/mo)
- **Why launch:** Already built. A must-have hub linking to every other JSON and data tool. The 'json fixer / repair invalid json' and 'json to string' angles are softer than the head term. Head-term slot.
- **Tool spec (how we beat #1):** Format, minify and validate with the exact line:column of each error and a plain-English explanation (trailing comma, single quotes, unquoted keys). One-click 'Repair JSON' (jsonrepair) and a collapsible tree view with click-to-copy JSONPath. Sort keys, indent 2/4/tab, and stringify/unstringify. A Web Worker handles 20MB+ files, and nothing is uploaded. Minify is a tab on this page, not a separate page.
- **Content angle (1,000+ words):** JSON syntax rules and the ten most common errors with fixes. JSON vs JSON5/JSONC. How to pretty-print in JavaScript, Python, jq, VS Code and Notepad++. Why online formatters can be a data-leak risk and how to verify that this one is local (network tab). Practical size limits.
- **AdSense notes:** Pure utility. State that processing is local.

### 16. SQL Formatter (15+ Dialects): `/tools/sql-formatter`

- **Category:** developer | **Competition:** medium | **Status:** to build
- **Primary keyword:** sql formatter
- **Secondary keywords:** sql beautifier, format sql query online, mysql formatter, postgresql formatter, t-sql formatter, snowflake sql formatter
- **Est. monthly searches:** 50k-90k cluster (estimate; sqlformat.org, poorsql.com, sql-format.com absent from the Umbrella top 1M)
- **Why launch:** Top developer opportunity. Real volume, a US data/analytics audience (higher CPC than most dev tools), and no strong specialist domain owns the term.
- **Tool spec (how we beat #1):** sql-formatter library with a dialect picker (MySQL, MariaDB, PostgreSQL, T-SQL, PL/SQL, BigQuery, Snowflake, Spark, SQLite, Redshift, DB2, Trino). Options: keyword case (upper/lower/preserve), indent width, leading vs trailing commas, lines between statements. Minify mode, syntax highlighting, before/after view, and saved preferences. Errors are shown inline rather than silently mangling the query.
- **Content angle (1,000+ words):** Formatting conventions (river style, leading-comma debate, keyword case). Dialect differences that affect formatting: identifier quotes (backticks vs brackets vs double quotes), QUALIFY, TOP vs LIMIT. How to format SQL in SSMS, DBeaver, DataGrip and VS Code. A worked example of a messy CTE query before and after. Formatting never changes performance.
- **AdSense notes:** None.

### 17. UUID / GUID Generator (v4, v7, ULID): `/tools/uuid-generator`

- **Category:** developer | **Competition:** medium | **Status:** to build
- **Primary keyword:** uuid generator
- **Secondary keywords:** guid generator, uuid v4 generator, uuid v7 generator, bulk uuid generator, ulid generator, uuid validator
- **Est. monthly searches:** 120k-220k cluster (estimate; leader uuidgenerator.net has Umbrella rank only 664k)
- **Why launch:** High volume with an unusually weak leader. UUID v7 (RFC 9562, 2024) is a fresh long-tail nobody owns.
- **Tool spec (how we beat #1):** Generates v4 (crypto.randomUUID), v7 (time-ordered), v1, v5 with a namespace, nil/max, ULID and NanoID. Bulk up to 10,000 with format options (uppercase, no dashes, {braces} for GUID, quoted and comma-separated for SQL, JSON array). A validator/decoder identifies the version and extracts the embedded timestamp from v1, v7 and ULID. Copy all and download.
- **Content angle (1,000+ words):** A table of UUID versions. v4 vs v7 as database primary keys (index locality, worked example). Collision probability explained with real numbers. UUID vs GUID. Snippets for JavaScript, Python, Java, C#, Go, PostgreSQL (gen_random_uuid, uuidv7) and MySQL.
- **AdSense notes:** None.

### 18. Hash Generator (MD5, SHA-256, SHA-512, CRC32): `/tools/hash-generator`

- **Category:** developer | **Competition:** medium | **Status:** to build
- **Primary keyword:** hash generator
- **Secondary keywords:** md5 hash generator, sha256 hash generator, sha1 hash generator, sha512 generator, file checksum calculator, crc32 calculator
- **Est. monthly searches:** 150k-300k cluster (estimate: md5 generator 40k-70k, sha256 generator 30k-50k; the specialist domains are absent from the Umbrella top 1M)
- **Why launch:** Large aggregated demand across algorithms with no authoritative specialist. The file-checksum mode serves US/UK users verifying downloads. Separate md5/sha256 pages are considered only after Search Console data (see roadmap).
- **Tool spec (how we beat #1):** Hashes text or files (streaming via hash-wasm, so multi-GB files work) in MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA3-256 and CRC32 simultaneously. A compare box checks against an expected checksum with a clear match/mismatch indicator. Hex or Base64 output, a trailing-newline toggle, and a UTF-8 input note. No 'decrypt' or lookup features ever.
- **Content angle (1,000+ words):** What hashing is: one-way, not encryption. An algorithm comparison with which ones are broken for security (MD5, SHA-1) and which to use. How to verify a download with sha256sum, Get-FileHash and shasum. Why the same text gives different hashes (trailing newline, encoding, CRLF). Password hashing is different (bcrypt/argon2, coming later).
- **AdSense notes:** Hashing only. Never add 'md5 decrypt', 'hash cracker' or rainbow-table lookups (hacking-tool policy).

### 19. Cron Expression Generator & Explainer: `/tools/cron-expression-generator`

- **Category:** developer | **Competition:** medium | **Status:** to build
- **Primary keyword:** cron expression generator
- **Secondary keywords:** crontab generator, cron expression explained, cron every 5 minutes, quartz cron expression generator, github actions cron schedule, cron next run time
- **Est. monthly searches:** 80k-150k cluster (estimate; crontab.guru has Umbrella rank only 631k; schedule-specific queries answered by thin pages)
- **Why launch:** DevOps audience, high CPC and weak incumbents. It seeds a small cluster of hand-written schedule pages later if Search Console shows demand.
- **Tool spec (how we beat #1):** Visual builder plus free-text input with a plain-English explanation (cronstrue). Shows the next 10 run times in the user's time zone and in UTC (cron-parser). Dialect switch for Unix 5-field, Quartz/Spring 6-7 field, AWS EventBridge, Kubernetes CronJob and GitHub Actions (with caveats: UTC only, 5-minute minimum). Field-level validation errors and preset buttons.
- **Content angle (1,000+ words):** A field reference table and special characters (* , - / L W # ?). Ten common schedules with expressions. Time-zone and DST pitfalls. Why cron jobs don't run (PATH, permissions, environment, % escaping). Differences between the Unix, Quartz and cloud dialects.
- **AdSense notes:** Keep any future schedule sub-pages to a hand-written handful (scaled-content caution).

### 20. Chmod Calculator (Linux File Permissions): `/tools/chmod-calculator`

- **Category:** developer | **Competition:** low | **Status:** to build
- **Primary keyword:** chmod calculator
- **Secondary keywords:** chmod 755, chmod 777, chmod 644, linux permissions calculator, octal permissions calculator, chmod +x
- **Est. monthly searches:** 30k-60k tool + 150k-300k informational (estimate; chmod-calculator.com and chmodcommand.com absent from the Umbrella top 1M)
- **Why launch:** The tool SERP is weak single-purpose domains, the sysadmin audience attracts hosting CPC, and the 755/644/777 informational cluster fits a tool-plus-explainer page.
- **Tool spec (how we beat #1):** A checkbox grid (owner/group/others x read/write/execute) synced in both directions with octal (755) and symbolic (rwxr-xr-x) inputs. Supports setuid, setgid and sticky bits. Ready-to-copy commands, including the recursive find pattern that sets directories and files differently. Presets for WordPress, Laravel storage and SSH keys (600), with a clear security warning on 777.
- **Content angle (1,000+ words):** How permission bits map to octal (worked binary math). A table of common modes (777, 755, 750, 700, 644, 640, 600, 400) with when to use each. What execute means on directories. umask. Worked examples fixing 'Permission denied' and WordPress upload errors.
- **AdSense notes:** None.

### 21. WebP to PNG Converter: `/tools/webp-to-png`

- **Category:** image | **Competition:** medium | **Status:** to build
- **Primary keyword:** webp to png
- **Secondary keywords:** convert webp to png, webp to png converter, webp to png transparent, batch webp to png, open webp file, save webp as png
- **Est. monthly searches:** 300k-600k global; US 165,000 (Semrush US export ~Apr 2026, CPC $0.85, near-zero paid competition)
- **Why launch:** The largest exported US figure in the dataset. The SERP already admits small privacy-first entrants, and demand is steady because Chrome saves images as WebP.
- **Tool spec (how we beat #1):** Drag-drop, file picker or paste (Ctrl+V) of multiple WebP files. Converted locally on canvas to lossless PNG that keeps transparency. Batch processing in a Web Worker/OffscreenCanvas with per-file progress, original filenames kept, before/after file sizes, and ZIP download. Animated WebP is detected, with a clear 'first frame only' notice. Works offline after load, with no upload, limits or watermark.
- **Content angle (1,000+ words):** Why browsers save images as WebP. When you need PNG (editing in older software, printing, upload forms that reject WebP). A PNG vs WebP comparison table (size, alpha, animation, support). OS-native options (Mac Preview, Windows Photos/Paint) and their limits. Measured size differences from our own test images. A privacy note.
- **AdSense notes:** None; the user's own local files only.

### 22. WebP to JPG Converter: `/tools/webp-to-jpg`

- **Category:** image | **Competition:** medium | **Status:** to build
- **Primary keyword:** webp to jpg
- **Secondary keywords:** convert webp to jpg, webp to jpeg, webp to jpg converter, save webp as jpg, batch webp to jpg, webp to jpg without losing quality
- **Est. monthly searches:** 200k-400k global; US 110,000 + 'convert webp to jpg' 22,200 + 'webp to jpeg' 12,100 (Semrush US export)
- **Why launch:** Second-largest exported US term. It shares one component with webp-to-png, while the content angle (JPEG quality, flattening transparency) is distinct.
- **Tool spec (how we beat #1):** Same engine as webp-to-png, plus a JPEG quality slider with a live size estimate, a background-fill colour for transparent areas (white by default), batch conversion with ZIP, and filename preservation. A note that metadata is not carried over.
- **Content angle (1,000+ words):** Different from the PNG page: JPEG compression and quality choices (a table of quality vs size vs visible artefacts from our tests), flattening transparency, and where JPG is required (government and job portals, older CMSs, photo labs). 'jpg' vs 'jpeg' explained.
- **AdSense notes:** None.

### 23. HEIC to JPG Converter: `/tools/heic-to-jpg`

- **Category:** image | **Competition:** high | **Status:** to build
- **Primary keyword:** heic to jpg
- **Secondary keywords:** heic to jpg converter, convert heic to jpg, heif to jpg, open heic file on windows, iphone photo to jpg, heic to jpg without uploading
- **Est. monthly searches:** 150k-400k global English (Ahrefs Global export 2026-07: 'how to convert HEIC to JPG' 110,000 KD 39, 'HEIF to JPG' 5,400 KD 21; Keyword Planner all-locations 1.22M, +22% YoY)
- **Why launch:** Demand is growing (+22% YoY) and iPhone-driven. Personal photos make 'never uploaded' a genuine reason to choose us over CloudConvert or Convertio. One WASM decoder later unlocks heic-to-png.
- **Tool spec (how we beat #1):** libheif WASM (heic2any) lazy-loaded only on this page. Batch conversion with progress and time per file, a JPG quality slider, a keep/strip metadata toggle with a GPS warning, and handling of multi-image HEIC containers and Live Photo stills. ZIP download. Decode only; never JPG-to-HEIC. Explicit 'processed on your device' proof: works offline after load.
- **Content angle (1,000+ words):** What HEIC/HEIF is and why iPhones use it. How to make an iPhone shoot 'Most Compatible'. How to open HEIC on Windows 10/11 (HEIF extension) and Mac (Preview export). Google Photos and email behaviour. Why uploading personal photos to converter sites is a privacy concern. A measured quality and size comparison. A short HEIC-to-PNG section linking to the future page.
- **AdSense notes:** None.

### 24. SVG to PNG Converter: `/tools/svg-to-png`

- **Category:** image | **Competition:** medium | **Status:** to build
- **Primary keyword:** svg to png
- **Secondary keywords:** svg to png converter, convert svg to png high resolution, svg to png transparent, svg to jpg, svg to png 512x512, svg code to png
- **Est. monthly searches:** 100k-300k global (Google Keyword Planner all-locations 301K per a third-party PRD)
- **Why launch:** Large demand from a designer/developer audience, a trivial build, and small dedicated sites already hold positions.
- **Tool spec (how we beat #1):** Upload or paste SVG code. Render at a scale (1x-8x) or an exact width/height with aspect lock, on a transparent or coloured background. Presets for 512, 1024 and favicon sizes. Batch conversion, and PNG/JPG/WebP output. Detects external fonts and images that won't render and explains how to inline them. Shows the intrinsic viewBox.
- **Content angle (1,000+ words):** Vector vs raster explained. Choosing resolution for web (device pixel ratio) vs print (DPI math with a worked example). Why SVG text can render differently (missing fonts). How to export from Figma, Illustrator and Inkscape. Transparency and colour-profile notes.
- **AdSense notes:** None.

### 25. Compress Image to 100KB (or Any Size): `/tools/compress-image-to-100kb`

- **Category:** image | **Competition:** low | **Status:** to build
- **Primary keyword:** compress image to 100kb
- **Secondary keywords:** reduce image size to 100kb, compress jpg to 100kb, resize image to 100kb, compress image to 50kb, compress image to 20kb, reduce image size in kb
- **Est. monthly searches:** 200k-400k global cluster, India-heavy; US est 5k-15k (Google Ads India export May 2026: reduce image size in kb 110,000; compress image to 100kb 60,500; compress image to 20kb 49,500)
- **Why launch:** A proven traffic magnet where page 1 is small and mid sites, not brands. The job is clear (upload limits on forms), and one feature can later yield a few distinct pages.
- **Tool spec (how we beat #1):** A target-size encoder: binary search over JPEG/WebP quality, then dimensions, until the output is at or under the target. Presets for 20, 50, 100, 200 and 500 KB and 1 MB, plus custom. Optional exact pixel or cm dimensions at a DPI (for exam and visa forms). Shows the achieved size and quality used, a before/after zoom compare, and batch mode. A single page with a target selector; 50kb/20kb pages only if Search Console shows demand and the content can be genuinely different.
- **Content angle (1,000+ words):** Why forms impose KB limits (exam, job and visa portals, marketplaces, email). How KB relates to pixel dimensions and quality, with a worked example. Tips to keep faces and text sharp. Signature scans (10-20 KB). Compress vs resize. A generic table of typical limits; tell users to verify the current limit on the portal itself.
- **AdSense notes:** Avoid near-duplicate doorway pages across KB variants.

### 26. EXIF Viewer (Photo Metadata Checker): `/tools/exif-viewer`

- **Category:** image | **Competition:** low | **Status:** to build
- **Primary keyword:** exif viewer
- **Secondary keywords:** exif data viewer, metadata viewer, photo metadata viewer, check photo location, view exif online, image metadata checker
- **Est. monthly searches:** 40k-80k global cluster (Semrush US export: metadata viewer 6,600 CPC $6.82; exif data 4,400; exif viewer 2,400; exif data viewer 2,900)
- **Why launch:** The lowest competition in the image category combined with its highest CPC, and a strong privacy story that feeds the EXIF remover.
- **Tool spec (how we beat #1):** exifr reads EXIF, IPTC, XMP, ICC and GPS from JPEG, HEIC, AVIF, PNG, TIFF and WebP locally. Results are grouped in a readable table (camera, lens, exposure, dates, GPS, software). GPS shows as coordinates plus an 'open in OpenStreetMap' link that loads nothing until clicked. A privacy summary ('this photo reveals: location, device serial number'), one-click handoff to /tools/remove-exif-data, and JSON export.
- **Content angle (1,000+ words):** What EXIF, IPTC and XMP are. Which fields reveal what (location, device serial, editing history). A dated table of which platforms strip metadata on upload, with a note to verify. How to view metadata natively on Windows, Mac, iPhone and Android. Photographer use cases (checking settings and copyright fields).
- **AdSense notes:** Frame it as checking what your own photos reveal before sharing; avoid 'find where someone took this photo' copy.

### 27. Remove EXIF Data (Strip Photo Metadata): `/tools/remove-exif-data`

- **Category:** image | **Competition:** low | **Status:** to build
- **Primary keyword:** remove exif data
- **Secondary keywords:** remove metadata from photo, strip exif online, remove gps from photo, exif remover, delete photo location data, remove metadata from image
- **Est. monthly searches:** 20k-60k global (Keyword Planner export via third-party CSV: 'exif data remove' 40,500, country unstated)
- **Why launch:** Low competition (small privacy-focused sites only), clear privacy value, and a natural pair with the viewer.
- **Tool spec (how we beat #1):** Lossless strip for JPEG (drops APP1/APP13/XMP segments without re-encoding, so quality is untouched) and for PNG ancillary chunks. A 'GPS only' mode keeps camera data, and orientation is applied correctly so photos don't rotate. Batch with ZIP, plus a before/after metadata diff proving what was removed.
- **Content angle (1,000+ words):** Removing location on iPhone (share-sheet Options), Android, Windows ('Remove Properties and Personal Information') and Mac. Lossless stripping vs re-encoding. What stripping cannot remove (visible landmarks, reflections). Use cases for marketplace sellers, journalists and parents.
- **AdSense notes:** None; privacy-positive.

### 28. PX to REM Converter: `/tools/px-to-rem`

- **Category:** converters | **Competition:** low | **Status:** to build
- **Primary keyword:** px to rem
- **Secondary keywords:** px to rem converter, rem to px, pixels to rem, 16px to rem, rem calculator, convert px to rem css
- **Est. monthly searches:** 15k-40k combined (estimate from SERP composition: SaaS free-tool pages and tiny Vercel apps)
- **Why launch:** A classic developer long-tail a new domain can rank for, likely to earn developer backlinks, and it cross-links with the clamp calculator.
- **Tool spec (how we beat #1):** Bidirectional px<->rem (so no separate rem-to-px page, to avoid cannibalization) with an editable root font size. A live table for 1-128px. A bulk mode converts every px value in pasted CSS, with an ignore list (1px borders, media queries). Copy as CSS or Tailwind arbitrary values.
- **Content angle (1,000+ words):** What px, rem and em are. Why rem respects user font-size settings (accessibility, WCAG 1.4.4). The formula with worked examples, a full table, and when to keep px (borders, shadows). em vs rem compounding shown with nested examples. Tailwind's rem scale. A link to /tools/clamp-calculator for fluid type.
- **AdSense notes:** None.

### 29. Military Time Converter (+ Printable Chart): `/tools/military-time-converter`

- **Category:** converters | **Competition:** low | **Status:** to build
- **Primary keyword:** military time converter
- **Secondary keywords:** military time chart, 24 hour to 12 hour converter, 1700 military time, what time is 1900 in military time, military time chart printable, standard time to military time
- **Est. monthly searches:** 50k-150k (estimate from autocomplete + fragmented SERP: ontheclock, clockit, printable-chart sites)
- **Why launch:** Solid US volume, a weak and fragmented SERP, an easy build, and plenty of unique material (pronunciation, healthcare and aviation use).
- **Tool spec (how we beat #1):** Two-way converter that also shows how to say the time ('seventeen hundred hours', 'zero six thirty'). A full 24-hour chart with a minutes table, and a printable Letter/A4 chart via print CSS plus PDF download. Current time in military format with an optional time-zone letter (Z/Zulu).
- **Content angle (1,000+ words):** How to convert (add or subtract 12, with worked examples). Pronunciation rules. Midnight 0000 vs 2400. Use in healthcare charting, aviation and the military. Zulu time and the military time-zone letters. A printable chart section.
- **AdSense notes:** None.

### 30. Morse Code Translator (with Audio): `/tools/morse-code-translator`

- **Category:** converters | **Competition:** medium | **Status:** to build
- **Primary keyword:** morse code translator
- **Secondary keywords:** morse code decoder, text to morse code, morse code to text, morse code audio, morse code alphabet chart, sos in morse code
- **Est. monthly searches:** 150k-350k (estimate from Similarweb: morsecode.world ~470k visits/mo, 40% US)
- **Why launch:** High evergreen volume, fun and shareable, and easy to differentiate with audio and visual features. Small exact-match domains rank next to the leader.
- **Tool spec (how we beat #1):** Real-time text<->Morse in both directions. Audio playback via Web Audio with WPM and Farnsworth spacing and a tone-frequency control. Flashing-light and mobile-vibration modes, WAV download, and tap-to-key practice input. Prosigns supported, and invalid characters flagged.
- **Content angle (1,000+ words):** History (Morse and Vail, telegraph). Timing rules (dot = 1 unit, dash = 3, gaps 1/3/7). A full chart with numbers, punctuation and prosigns. How to learn (Koch and Farnsworth methods). Common phrases (SOS, I love you). Is Morse still used (amateur radio, aviation beacons)?
- **AdSense notes:** None.

### 31. Number to Words Converter (Check Writing): `/tools/number-to-words`

- **Category:** converters | **Competition:** medium | **Status:** to build
- **Primary keyword:** number to words
- **Secondary keywords:** number to words converter, numbers to words for checks, how to write numbers in words, amount in words, number to words in lakh crore, spell out numbers
- **Est. monthly searches:** 60k-150k (estimate; fragmented SERP of calculatorsoup and small or mid sites)
- **Why launch:** Steady evergreen demand, a fragmented SERP, and US-heavy check-writing intent.
- **Tool spec (how we beat #1):** Converts integers and decimals up to 10^30 (BigInt) to words. Check-writing format ('One thousand two hundred fifty and 50/100 dollars'), currency modes (USD, GBP, EUR, CAD, AUD, INR with lakh/crore), sentence/title/UPPER case, ordinals (twenty-first) and US vs UK 'and' style. Copy button.
- **Content angle (1,000+ words):** How to write a check amount, with an illustrated example we make ourselves. Hyphenation rules (twenty-one). AP and Chicago rules for spelling out numbers in prose. Short vs long scale (billion). A table of the Indian numbering system. Common check-writing mistakes.
- **AdSense notes:** None.

### 32. Roman Numeral Converter: `/tools/roman-numeral-converter`

- **Category:** converters | **Competition:** medium | **Status:** to build
- **Primary keyword:** roman numeral converter
- **Secondary keywords:** roman numerals, roman numeral date converter, roman numerals chart, convert numbers to roman numerals, roman numerals 1-100, super bowl roman numerals
- **Est. monthly searches:** 100k-300k with February peaks (estimate; Google Trends US all-time high in Feb 2026 around Super Bowl LX)
- **Why launch:** Large evergreen demand with a predictable Super Bowl spike. It needs to be indexed before January, so it ships at launch.
- **Tool spec (how we beat #1):** Two-way converter with validation that explains invalid input (IIII, VX, IC). A date mode for tattoos (MM.DD.YYYY with separator choice), a step-by-step breakdown, vinculum support above 3,999, a 1-100 chart and a years table.
- **Content angle (1,000+ words):** The rules (additive and subtractive notation). A Super Bowl numbers table. Tattoo date formatting tips (always verify before inking). Why clocks show IIII. History and where numerals are used today (film copyright years, book chapters, monarchs).
- **AdSense notes:** None.

### 33. Percentage Calculator: `/tools/percentage-calculator`

- **Category:** calculators | **Competition:** high | **Status:** already built
- **Primary keyword:** percentage calculator
- **Secondary keywords:** percent calculator, what percent of, percentage of a number, percentage difference calculator, how to calculate percentage, percentage formula
- **Est. monthly searches:** 1M-2M, US 500k+ (estimate anchored on Ahrefs: percentagecalculator.net gets ~396k visits/mo from #1 US)
- **Why launch:** Already built. Topical anchor for the calculators category, catching long-tail variants early. Head-term slot.
- **Tool spec (how we beat #1):** Five modes on one page: X% of Y, X is what % of Y, % change, % difference, and add/subtract %. Each shows worked steps. Keyboard-first input, a share URL with values, and links to the percentage-increase and percent-off pages when they launch.
- **Content angle (1,000+ words):** Formulas with worked examples for each mode. Percentage vs percentage points. % change vs % difference. Excel/Sheets formulas. Common mistakes (using the wrong base, reversing a percentage increase).
- **AdSense notes:** None.

### 34. Chronological Age Calculator (for Testing): `/tools/chronological-age-calculator`

- **Category:** calculators | **Competition:** low | **Status:** to build
- **Primary keyword:** chronological age calculator
- **Secondary keywords:** chronological age calculator for testing, slp age calculator, chronological age in months, age calculator years months days, corrected age calculator, how to calculate chronological age
- **Est. monthly searches:** 10k-40k (estimate from autocomplete breadth + a SERP of small SLP/EMD sites)
- **Why launch:** The best low-competition win in the calculators category. The professional audience (speech-language pathologists, psychologists, teachers) skews US/UK/CA/AU, and the engine is reused by the age calculator later.
- **Tool spec (how we beat #1):** Birth date plus test date (default today) gives years;months;days in clinical notation (e.g. 7;4;12) and total months. A rounding toggle (round down / nearest month / none) with a note to follow the test manual. Corrected (adjusted) age for prematurity from weeks early. The borrowing-method steps are shown so users can verify by hand. Copy and print for reports.
- **Content angle (1,000+ words):** Written for SLPs, school psychologists and teachers. The borrowing method with a worked example. Why rounding conventions differ between standardized tests (tell users to check their manual). Corrected age explained. Common calculation mistakes, and a worked example of a report line.
- **AdSense notes:** None; a general 'verify with your test manual' note.

### 35. Days From Today Calculator: `/tools/days-from-today`

- **Category:** calculators | **Competition:** medium | **Status:** to build
- **Primary keyword:** days from today
- **Secondary keywords:** 90 days from today, 30 days from today, 60 days from today, add days to date, what date is 100 days from now, business days from today
- **Est. monthly searches:** 300k-700k cluster (estimate from common N-day queries; SERP includes small sites such as timedatecalc and edgecalculator)
- **Why launch:** Very high aggregate volume, small-site-friendly SERPs and evergreen demand. It is the hub for date tools (days between dates and age calculator follow).
- **Tool spec (how we beat #1):** Add or subtract days, weeks or months from today or any date. Calendar vs business days (weekends excluded, with optional US/UK public-holiday lists), and an include-start-date toggle. Shows the weekday and ISO week, quick chips (30/60/90/120/180 days), and a shareable URL. At most 3-5 hand-written preset pages later (for example 90 days from today), and only if Search Console shows impressions.
- **Content angle (1,000+ words):** Real uses: return windows, notice periods, visa stays, probation, payment terms (net 30/60/90), medication and warranty periods. Calendar vs business-day counting with worked examples. Month-length pitfalls (adding 1 month to 31 January). Excel =WORKDAY and =EDATE.
- **AdSense notes:** No mass 'N days from today' programmatic pages.

### 36. Hours Calculator (Time Card & Timesheet): `/tools/hours-calculator`

- **Category:** calculators | **Competition:** medium | **Status:** to build
- **Primary keyword:** hours calculator
- **Secondary keywords:** time card calculator, work hours calculator, timesheet calculator with lunch, hours worked calculator, overtime calculator, convert minutes to decimal hours
- **Est. monthly searches:** 100k-300k, US-heavy (estimate; SERP full of payroll SaaS = high advertiser demand)
- **Why launch:** High-CPC payroll and HR ad inventory with US volume. Lead-gen SaaS pages are beatable on UX.
- **Tool spec (how we beat #1):** Weekly timesheet grid (7 days x in/out with multiple breaks), 12h or 24h input, overnight shifts, and totals in decimal and hh:mm. Configurable overtime (after 40h/week or 8h/day). Hourly rate gives gross pay. Rounding rules (nearest 5/6/15 min). Print, CSV export, and local save of the last sheet.
- **Content angle (1,000+ words):** How to calculate hours worked, with a worked example. A minutes-to-decimal table. US FLSA overtime basics and state daily-overtime exceptions (general information, not legal advice). Rounding rules (the 7-minute rule). Paid vs unpaid breaks.
- **AdSense notes:** Add a 'not payroll or legal advice' disclaimer.

### 37. Hourly to Salary Calculator: `/tools/hourly-to-salary-calculator`

- **Category:** calculators | **Competition:** medium | **Status:** to build
- **Primary keyword:** hourly to salary calculator
- **Secondary keywords:** salary to hourly calculator, $20 an hour is how much a year, annual salary calculator, hourly wage calculator, 50k a year is how much an hour, wage calculator
- **Est. monthly searches:** 70k-150k cluster (search-snippet Semrush-type data: 33K and 38K US for the two directions; 'salary calculator' 150K US)
- **Why launch:** High-CPC employment and finance ads, a US/UK audience and proven volumes. Omni's success here shows the SERP can be won by a better page.
- **Tool spec (how we beat #1):** Two-way hourly <-> annual, monthly, semi-monthly, biweekly, weekly and daily. Inputs for hours/week, weeks/year, unpaid time off and overtime hours at 1.5x. A quick table for $15-$100/hour. Currency-neutral, and pre-tax only with a clear note (no tax tables).
- **Content angle (1,000+ words):** The formula (hourly x hours x weeks) and the 2,080-hour rule. A table of common wages to annual amounts. Salaried vs hourly trade-offs (overtime eligibility, PTO). Why take-home pay differs from gross. Worked examples for part-time and 4-day weeks.
- **AdSense notes:** Finance disclaimer: estimates before tax, not financial advice.

### 38. Discord Timestamp Generator: `/tools/discord-timestamp-generator`

- **Category:** social-media | **Competition:** low | **Status:** to build
- **Primary keyword:** discord timestamp generator
- **Secondary keywords:** discord timestamp, discord time format, discord relative timestamp, discord countdown timer, hammertime discord, discord unix timestamp
- **Est. monthly searches:** 30k-80k (estimate; hammertime.cyou 446K visits/mo (Similarweb) with 'discord timestamp' among its top keywords; 6+ exact-match domains)
- **Why launch:** The best mix of demand and weak SERP in the social category (hobby sites only; an indie dev reports reaching #1 with a new site). Trivial to build, with room for a much richer page.
- **Tool spec (how we beat #1):** Date/time picker with a time-zone selector. All 7 formats (t, T, d, D, f, F, R) with a live preview rendered the way Discord shows them in the viewer's locale, and one-click copy per format. 'Now + X' quick offsets for countdowns. A Snowflake ID to creation-date decoder. JS and Python snippets for bots.
- **Content angle (1,000+ words):** How Discord timestamps work (Unix seconds rendered in each viewer's local time). A format table with examples. Scheduling events across time zones. Mobile vs desktop rendering differences. Snowflake IDs explained. A worked example of an event announcement.
- **AdSense notes:** Add a 'not affiliated with Discord' line.

### 39. Discord Colored Text Generator: `/tools/discord-colored-text-generator`

- **Category:** social-media | **Competition:** low | **Status:** to build
- **Primary keyword:** discord colored text generator
- **Secondary keywords:** discord color text, discord ansi color codes, how to change text color in discord, discord colored text code block, discord text colors, discord ansi generator
- **Est. monthly searches:** 10k-30k (estimate from SERP composition: GitHub repos, personal sites, how-to blogs)
- **Why launch:** Low competition with clear tool intent, and it pairs with the timestamp generator to build Discord topical authority.
- **Tool spec (how we beat #1):** Rich-text editor: select text and apply 8 foreground colours, 8 background colours, bold or underline. Outputs an ```ansi code block with real ESC (U+001B) codes. Live Discord-style dark/light preview and copy button. A clear note on where ANSI renders (desktop and web clients; verify current mobile support before publishing).
- **Content angle (1,000+ words):** How ANSI escape codes work. The colour code table (30-37 foreground, 40-47 background). Limitations (code-block font, platform support). Why older diff/css/yaml code-block hacks are unreliable. Example messages for server rules and announcements.
- **AdSense notes:** None; add a non-affiliation note.

### 40. YouTube Money Calculator: `/tools/youtube-money-calculator`

- **Category:** social-media | **Competition:** medium | **Status:** to build
- **Primary keyword:** youtube money calculator
- **Secondary keywords:** youtube earnings calculator, how much does youtube pay per 1000 views, youtube revenue calculator, youtube income calculator, youtube rpm by niche, how much do youtubers make
- **Est. monthly searches:** 60k-150k (estimate from SERP saturation: ~15 dedicated pages; high-CPC creator-finance niche)
- **Why launch:** Large, mostly Tier-1 audience with high CPC. The PAA box ('how much does YouTube pay per 1000 views') is answered by blogs rather than tools, so a calculator with deep content can take it.
- **Tool spec (how we beat #1):** Inputs: daily or monthly views, % monetized playbacks, niche RPM presets (finance, tech, education, gaming, vlogs) or custom RPM, audience-country mix (US/UK/CA/AU vs global), and a long-form vs Shorts split. Outputs low/typical/high ranges per day, month and year, with the formula shown and the 55% creator share explained. No channel lookup (no scraping, privacy).
- **Content angle (1,000+ words):** RPM vs CPM. YouTube's 55/45 revenue split. A niche RPM table with dated, cited ranges. YPP requirements in 2026. Q4 seasonality. Income beyond AdSense (memberships, sponsorships). Worked examples for a 10k-views/day tech channel vs a gaming channel.
- **AdSense notes:** 'Estimates only' disclaimer; no income promises or get-rich language.

### 41. YouTube Shorts Money Calculator: `/tools/youtube-shorts-money-calculator`

- **Category:** social-media | **Competition:** low | **Status:** to build
- **Primary keyword:** youtube shorts money calculator
- **Secondary keywords:** youtube shorts earnings calculator, how much does youtube shorts pay per 1000 views, youtube shorts rpm, shorts revenue calculator, youtube shorts monetization calculator
- **Est. monthly searches:** 8k-25k (estimate; ~8 dedicated pages, mostly launched 2025-26)
- **Why launch:** A lower-competition sibling of the money calculator. It shares code and is strong for internal linking.
- **Tool spec (how we beat #1):** Views x Shorts RPM range by niche and country (cited range, roughly $0.01-$0.15 per 1,000 views; verify before publishing), a music-use toggle (reduced share when licensed music is used), the creator share of the allocated pool, and a 90-day projection toward the 10M-views YPP path. Side-by-side comparison with long-form earnings.
- **Content angle (1,000+ words):** How the Shorts revenue pool works (creator pool, music share, 45% creator share). Why Shorts RPM is far lower than long-form. A comparison table. Strategies that convert Shorts viewers into long-form viewers. Worked examples.
- **AdSense notes:** Estimates-only disclaimer.

### 42. YouTube Watch Time Calculator (4,000 Hours): `/tools/youtube-watch-time-calculator`

- **Category:** social-media | **Competition:** low | **Status:** to build
- **Primary keyword:** youtube watch time calculator
- **Secondary keywords:** 4000 watch hours calculator, how many views for 4000 watch hours, youtube watch hours calculator, youtube monetization requirements 2026, youtube partner program calculator
- **Est. monthly searches:** 5k-15k (estimate; EMD watchtimecalculator.com and small tools rank)
- **Why launch:** Strong intent from aspiring YouTubers, an easy win, and it interlinks with the money calculators.
- **Tool spec (how we beat #1):** Views x average view duration gives watch hours. Reverse mode: views needed for 4,000 hours at your average view duration. A timeline projection from current daily views. Both YPP tiers (lower fan-funding tier and full ad-revenue tier; verify the 2026 thresholds before publishing) and the Shorts 10M-views path. A note on what counts (public long-form views in the last 12 months).
- **Content angle (1,000+ words):** What counts toward watch hours and what doesn't (Shorts, private or deleted videos). Tier requirements. Ways to raise average view duration. Worked examples for 8-minute and 20-minute videos.
- **AdSense notes:** None; add a non-affiliation note.

### 43. Instagram Grid Maker (Image Splitter): `/tools/instagram-grid-maker`

- **Category:** social-media | **Competition:** low | **Status:** to build
- **Primary keyword:** instagram grid maker
- **Secondary keywords:** instagram grid splitter, split image into 9 for instagram, 3x3 grid instagram, instagram puzzle feed, split photo for instagram grid, instagram 3:4 grid
- **Est. monthly searches:** 10k-30k (estimate; 10+ dedicated tools, including an EMD)
- **Why launch:** Clear intent, a weak SERP and a privacy selling point. Supporting Instagram's 3:4 profile grid (the 2025 change) differentiates it from older 1:1 splitters.
- **Tool spec (how we beat #1):** Local upload. Choose 3x1, 3x2, 3x3 or 3x4 grids with 1:1, 4:5 or 3:4 tiles. Pan/zoom crop, numbered posting order (post the last tile first), a profile-grid preview, and per-tile or ZIP download. Nothing is uploaded.
- **Content angle (1,000+ words):** Why the 2025 profile grid change broke old 1:1 splits and how to design for 3:4. Posting order explained. A size table. Pitfalls (pinned posts and later posts shift the grid). Design tips for puzzle feeds.
- **AdSense notes:** None; no Instagram logos; add a non-affiliation note.

### 44. Color Contrast Checker (WCAG 2.2 + APCA): `/tools/color-contrast-checker`

- **Category:** design | **Competition:** high | **Status:** to build
- **Primary keyword:** color contrast checker
- **Secondary keywords:** contrast checker, wcag contrast checker, color contrast ratio, apca contrast checker, accessible color checker, contrast ratio calculator
- **Est. monthly searches:** 40k-80k global cluster (Semrush US export Apr 2026: color contrast checker 9,900 CPC $3.40; contrast checker 6,600 CPC $2.41; color contrast 2,900 CPC $5.65)
- **Why launch:** Highest CPC in the design category, with a stable trend. The head term is hard (WebAIM), but the APCA, auto-fix and Lighthouse-error long-tails are thin.
- **Tool spec (how we beat #1):** Foreground and background pickers accepting HEX, RGB, HSL and OKLCH. WCAG 2.2 ratio with AA/AAA pass/fail for normal text, large text and UI components. APCA Lc shown as informational, after its licence has been checked. Automatic 'nearest passing colour' suggestions that keep the hue (OKLCH lightness adjustment). Live text preview at several sizes, a palette-grid mode checking every pair, a swap button and a shareable URL.
- **Content angle (1,000+ words):** How the WCAG contrast ratio is calculated (relative-luminance formula with a worked example). A thresholds table (4.5:1, 3:1, 7:1). APCA vs WCAG 2 and the status of WCAG 3. How to fix Lighthouse's 'insufficient contrast' error. Common mistakes (text on images, placeholder text, disabled states, focus rings).
- **AdSense notes:** No legal advice on ADA or EAA compliance.

### 45. CSS Box Shadow Generator: `/tools/box-shadow-generator`

- **Category:** design | **Competition:** medium | **Status:** to build
- **Primary keyword:** box shadow generator
- **Secondary keywords:** css box shadow generator, box shadow css, tailwind shadow generator, layered box shadow, css shadow examples, inset box shadow
- **Est. monthly searches:** 30k-70k (estimate; SERP observed 2026-09-29 with small sites on page 1)
- **Why launch:** High developer demand and engagement, and small sites share page 1. It is winnable with better UX (layers and smooth elevation presets).
- **Tool spec (how we beat #1):** Multiple layers with sliders (x, y, blur, spread, colour with alpha, inset). A smooth layered-shadow generator (elevation 1-24), a presets gallery, light/dark preview on a configurable card, and OKLCH colour input. Outputs CSS, a Tailwind arbitrary value and a CSS custom property, with a copy button.
- **Content angle (1,000+ words):** box-shadow syntax explained. Layered shadows for realism, with a worked example. box-shadow vs filter: drop-shadow. Performance notes. Elevation systems (Material). Accessibility: don't rely on shadow alone for focus states.
- **AdSense notes:** None.

### 46. Tailwind Color Shade Generator (v4 OKLCH): `/tools/tailwind-color-generator`

- **Category:** design | **Competition:** low | **Status:** to build
- **Primary keyword:** tailwind color generator
- **Secondary keywords:** tailwind color palette generator, tailwind shades generator, tailwind v4 colors, generate tailwind colors from hex, tailwind oklch palette
- **Est. monthly searches:** 3k-10k (estimate; SERP observed 2026-09-29: magicpattern, tints.dev, small tool sites and the Tailwind docs)
- **Why launch:** Low competition, growing with Tailwind v4 adoption, and it attracts high-value developers.
- **Tool spec (how we beat #1):** Enter a brand hex to get an 11-step 50-950 scale generated in OKLCH, with an adjustable lightness curve and chroma. The input shade is locked at its natural step. Contrast badges on each step. Exports v4 @theme CSS variables, a v3 tailwind.config snippet and plain CSS, with a comparison against the default Tailwind palette.
- **Content angle (1,000+ words):** How Tailwind v4 palettes use OKLCH and why HSL scales look uneven (worked example). Choosing which step your brand colour sits on. Accessible pairings (900 text on 50 background). A v3 to v4 migration note.
- **AdSense notes:** None; add a non-affiliation note for Tailwind Labs.

### 47. Liquid Glass CSS Generator: `/tools/liquid-glass-generator`

- **Category:** design | **Competition:** low | **Status:** to build
- **Primary keyword:** liquid glass css generator
- **Secondary keywords:** liquid glass css, liquid glass effect css, liquid glass generator, glass refraction css, liquid glass tailwind
- **Est. monthly searches:** 2k-10k and rising (estimate; trend since WWDC June 2025; SERP observed 2026-09-29)
- **Why launch:** A trend keyword where page 1 is demos, GitHub and Medium, a rare fast-win chance for a new domain.
- **Tool spec (how we beat #1):** Controls for blur, refraction strength (SVG feDisplacementMap), specular highlight, tint, border and radius on a draggable panel over selectable backgrounds. Outputs HTML, CSS and the SVG filter. A frosted fallback for browsers without SVG backdrop refraction, clearly labelled, and a text-contrast warning.
- **Content angle (1,000+ words):** How the effect is built (backdrop-filter plus displacement maps). A browser-support table (verify at time of writing). Mobile performance. Accessibility criticism of the look (legibility) and mitigations. Glassmorphism vs liquid glass.
- **AdSense notes:** Use 'Liquid Glass' descriptively only; no Apple logos; add a non-affiliation line.

### 48. CSS Clamp Calculator (Fluid Typography): `/tools/clamp-calculator`

- **Category:** design | **Competition:** low | **Status:** to build
- **Primary keyword:** css clamp calculator
- **Secondary keywords:** fluid typography calculator, clamp font size generator, css clamp generator, responsive font size calculator, fluid type scale generator
- **Est. monthly searches:** 3k-8k (estimate; utopia.fyi, clamp.font-size.app and fluid-type-scale.com rank)
- **Why launch:** A modern developer need with a weak SERP. It links naturally to px-to-rem.
- **Tool spec (how we beat #1):** Min/max font size (px or rem) and min/max viewport produce clamp() with a rem + vw preferred value. A live resizable preview, multi-step mode for a whole type scale, and a zoom-accessibility check (rem base). Outputs CSS custom properties and Tailwind config.
- **Content angle (1,000+ words):** The linear-interpolation formula with a worked example. Why the preferred value needs a rem component (WCAG 1.4.4 zoom). Container query units (cqi) as an alternative. Building a full fluid type scale. A link to /tools/px-to-rem.
- **AdSense notes:** None.

### 49. Password Generator: `/tools/password-generator`

- **Category:** utilities | **Competition:** high | **Status:** already built
- **Primary keyword:** password generator
- **Secondary keywords:** strong password generator, random password generator, secure password generator, 16 character password generator, memorable password generator, password generator without symbols
- **Est. monthly searches:** 500k-1.2M (estimate reconciling conflicting planning figures)
- **Why launch:** Already built. Needed for topical authority and a high-CPC security audience; sub-intents (16 characters, no symbols) are the realistic entry points. Head-term slot.
- **Tool spec (how we beat #1):** crypto.getRandomValues, length 4-128, character sets with an exclude-ambiguous option, enforcement for sites that require every character class, entropy in bits with plain-English strength, bulk generation, and a link to the passphrase generator. Nothing is stored or sent.
- **Content angle (1,000+ words):** How entropy works, with a worked example. Length vs complexity. NIST SP 800-63B guidance (length over forced complexity, no forced rotation). Why use a password manager. A FAQ on site requirements and special characters that break forms.
- **AdSense notes:** No 'unhackable' or overclaiming language.

### 50. Keyboard Tester: `/tools/keyboard-tester`

- **Category:** utilities | **Competition:** medium | **Status:** to build
- **Primary keyword:** keyboard tester
- **Secondary keywords:** keyboard test, key tester, test keyboard keys online, keyboard ghosting test, n-key rollover test, keyboard checker
- **Est. monthly searches:** 200k-500k (estimate; small EMD sites on page 1, no hard figure retrievable)
- **Why launch:** Best mix of volume, a beatable SERP and a trivial build in utilities. Gamers and laptop buyers repeat-test, and it anchors the device-test cluster.
- **Tool spec (how we beat #1):** A full visual layout (ANSI/ISO, Windows/Mac, 60%/TKL/full-size). Keys light up on press and stay marked as tested. Shows event.code, key and keyCode for debugging, a rollover counter for ghosting tests, and chatter detection (repeat keydown within a few ms). Reset button. Notes which keys a browser cannot capture (Fn, some OS shortcuts).
- **Content angle (1,000+ words):** Diagnosing a dead key vs a software issue. Ghosting and rollover explained. Key chatter on mechanical switches. What browsers can't detect. Step-by-step fixes (drivers, cleaning, remapping), and a checklist for testing a new or used laptop.
- **AdSense notes:** None.

### 51. Mic Test (Online Microphone Test): `/tools/mic-test`

- **Category:** utilities | **Competition:** medium | **Status:** to build
- **Primary keyword:** mic test
- **Secondary keywords:** microphone test, test my mic, online mic test, mic check, microphone not working, test microphone windows 11
- **Est. monthly searches:** 200k-500k (estimate from SERP composition: Loom, livestorm and small single-purpose sites; remote-work demand)
- **Why launch:** High volume with a US/UK remote-worker audience (Zoom/Teams). Most results are small single-purpose sites, and it pairs with the webcam test.
- **Tool spec (how we beat #1):** getUserMedia with a device picker, live level meter and waveform, peak/clipping indicator, and a 5-30 second record-and-playback held in memory only. Shows the noise floor, sample rate and channels. A troubleshooting wizard detects permission denied, no device and muted track, and gives OS-specific fixes. Audio never leaves the device.
- **Content angle (1,000+ words):** Troubleshooting by OS (Windows privacy settings, macOS permissions) and browser permission resets. Zoom/Teams/Meet-specific checks. Good recording levels (around -18 to -6 dBFS). Echo and noise tips. What the meter is actually measuring.
- **AdSense notes:** None.

### 52. Webcam Test (Online Camera Test): `/tools/webcam-test`

- **Category:** utilities | **Competition:** medium | **Status:** to build
- **Primary keyword:** webcam test
- **Secondary keywords:** camera test, test my webcam, online webcam test, webcam not working, check webcam resolution, webcam mirror test
- **Est. monthly searches:** 150k-400k (estimate from SERP composition: webcamtests.com, Loom and small sites)
- **Why launch:** Same audience as the mic test, an easy build and a strong internal-link loop within the device cluster.
- **Tool spec (how we beat #1):** Device picker, live preview with a mirror toggle, and the actual resolution, FPS and aspect ratio read from the track settings. Tests requested resolutions (720p, 1080p, 4K), offers snapshot download and a lighting hint, and has a troubleshooting wizard for permission and 'device in use' errors. Video never leaves the device.
- **Content angle (1,000+ words):** Why the actual resolution differs from the advertised one. Lighting and framing tips. Fixing 'camera in use by another app'. OS privacy settings and browser permission resets. Laptop vs external webcam comparison checklist.
- **AdSense notes:** None.

### 53. Dead Pixel Test (Screen Test): `/tools/dead-pixel-test`

- **Category:** utilities | **Competition:** low | **Status:** to build
- **Primary keyword:** dead pixel test
- **Secondary keywords:** dead pixel checker, stuck pixel test, screen test, monitor test, backlight bleed test, white screen test
- **Est. monthly searches:** 40k-100k (estimate; SERP of small sites only)
- **Why launch:** Low competition and evergreen, and it naturally carries full-screen white/black/red long-tails.
- **Tool spec (how we beat #1):** Fullscreen colour cycling (black, white, red, green, blue, grey) with keyboard and tap navigation and an auto-hidden cursor. A magnifier grid. A stuck-pixel flasher for a small region, behind a photosensitivity warning. Backlight-bleed, uniformity and gradient-banding tests.
- **Content angle (1,000+ words):** Dead vs stuck vs hot pixels. How pixel-defect return policies work (ISO 9241-307 classes in general terms; check the manufacturer). How to test a new monitor, laptop or phone. Methods to try fixing stuck pixels and their honest limits.
- **AdSense notes:** Photosensitivity warning before the flasher.

### 54. Mouse Test (Double Click & Button Test): `/tools/mouse-test`

- **Category:** utilities | **Competition:** low | **Status:** to build
- **Primary keyword:** mouse double click test
- **Secondary keywords:** mouse test, mouse button test, double click test, mouse scroll test, mouse polling rate test, mouse click test
- **Est. monthly searches:** 30k-80k (estimate)
- **Why launch:** A low-competition part of the device-test cluster, with a common hardware fault (unintended double clicks) as its hook.
- **Tool spec (how we beat #1):** A visual mouse showing left, right, middle, back and forward buttons as pressed. A double-click detector flags unintended double clicks under a configurable interval (the typical worn-switch failure). A scroll-wheel direction and step counter, a polling-rate estimate from pointer events, and click counters.
- **Content angle (1,000+ words):** Diagnosing the double-click fault (worn switches) and warranty tips. Polling rate explained. DPI vs sensitivity. Fixes to try before replacing a mouse.
- **AdSense notes:** None.

## 6. Cannibalization decisions (one page per intent)

- `/px-to-rem` is bidirectional and targets 'rem to px' too; there will be no `/rem-to-px`. `/px-to-em` gets its own page in Month 2 because em is parent-relative (a different concept and different content).
- `/hex-to-rgb` and `/rgb-to-hex` are separate pages (Month 1). Each query has its own volume (Semrush US 9,900 vs 18,100) and its own SERP. `/hex-to-rgba` (design) covers the alpha/opacity long-tail and links to the converter rather than repeating it.
- `/slug-generator` (SEO) is the only slug page; the researcher's `/url-slug-generator` is dropped.
- `/binary-to-decimal` absorbs the developer 'number base converter'; `/binary-translator` absorbs text-to-binary/hex/ASCII.
- `/json-formatter` includes the minify tab (no `/json-minify`); `/hash-generator` includes file checksums (no separate checksum page). Split `/md5-generator` or `/sha256-generator` pages only if Search Console shows the hub ranking on page 2+ for those exact terms.
- `/webp-to-png` and `/webp-to-jpg` share one component but have different content angles (lossless and transparency vs JPEG quality and flattening). `/heic-to-png` follows in Month 1 with a lossless/editing angle.
- `/compress-image-to-100kb` is one page with a target selector. 50kb and 20kb pages exist only if Search Console shows impressions and the content can be genuinely distinct (e.g. signature scans at 20KB).
- `/words-to-time` goes deep on speaking and reading time; `/word-counter` keeps only a one-line reading-time output and a short FAQ that links over.
- `/character-counter` keeps generic platform limit bars; the Month 3 social counters (`/twitter-character-counter`, `/instagram-character-counter`) target platform-named queries with platform-specific rules (X weighting, 125-character 'more' cut) and link back to the hub.
- `/days-from-today`, `/days-between-dates`, `/age-calculator` and `/chronological-age-calculator` share one date engine but each serves a different query intent.
- `/image-color-picker` (pixel eyedropper, image category) and `/color-palette-from-image` (palette extraction, design category) are distinct intents; `/color-picker` (design) is the generic picker.

## 7. Six-month roadmap

Order within each month follows expected ROI. Server-light tools (they need a Vercel serverless or edge function) start in Month 5 and are flagged as such.

### Month 1 (29 tools)

| Tool | URL | Category | Primary keyword | Est. searches | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| Image Compressor | `/tools/image-compressor` | image | image compressor | 200k-500k global (Semrush US 49,500-60,500) | high | client-side | Hub for compress-image-to-100kb; jSquash MozJPEG/OxiPNG lazy-loaded; traffic comes from compress jpg/png variants first. |
| Image Resizer | `/tools/image-resizer` | image | image resizer | 300k-700k global (Semrush US 110,000) | high | client-side | Hub for size and social presets; resize by pixels, percent or print size. |
| HEIC to PNG Converter | `/tools/heic-to-png` | image | heic to png | 50k-200k (KP all-locations 201K) | medium | client-side | Reuses the HEIC decoder; content focuses on lossless and editing workflows. |
| AVIF to JPG / PNG Converter | `/tools/avif-to-jpg` | image | avif to jpg | 60k-120k (Ahrefs global 33.1k KD 44 + avif to png 27.1k KD 38) | medium | client-side | Native AVIF decode; cheap addition to the WebP engine. |
| PNG / JPG to WebP Converter | `/tools/png-to-webp` | image | png to webp | 40k-80k (Semrush US 12,100 CPC $2.39 + jpg to webp 6,600) | medium | client-side | Highest-CPC pair term; Core Web Vitals content angle. |
| JPG to PNG Converter | `/tools/jpg-to-png` | image | jpg to png | 100k-250k (Semrush US 33,100) | medium | client-side | Explains why JPG to PNG does not create transparency. |
| PNG to JPG Converter | `/tools/png-to-jpg` | image | png to jpg | 200k-400k (Semrush US 49,500) | high | client-side | Completes the pair set; background-fill and quality options. |
| Favicon Generator | `/tools/favicon-generator` | image | favicon generator | 100k-250k (triangulated estimate) | medium | client-side | ICO writer, apple-touch icon, manifest, text/emoji favicon, ZIP. |
| Aspect Ratio Calculator | `/tools/aspect-ratio-calculator` | image | aspect ratio calculator | 60k-120k (estimate) | low | client-side | Low competition; pixel tables for 16:9, 4:3, 9:16, 4:5. |
| QR Code Generator | `/tools/qr-code-generator` | utilities | qr code generator | 1M-3M global (utility report citing Semrush/Similarweb) | high | client-side | Static codes only; logo, colours, SVG/PNG/PDF; hub for WiFi and vCard pages. |
| WiFi QR Code Generator | `/tools/wifi-qr-code-generator` | utilities | wifi qr code generator | 20k-60k (estimate) | medium | client-side | Printable sign template; the password never leaves the device. |
| Click Speed Test (CPS) | `/tools/click-speed-test` | utilities | click speed test | 300k-800k (estimate) | medium | client-side | Device/gamer cluster; jitter and butterfly clicking guides. |
| Robots.txt Generator (with AI Crawler Presets) | `/tools/robots-txt-generator` | seo | robots.txt generator | 10k-20k (estimate) | high | client-side | CMS presets plus AI-bot groups; links to llms.txt. |
| URL Slug Generator | `/tools/slug-generator` | seo | slug generator | 10k-25k (estimate; slugify.online 290K visits/mo) | low | client-side | The single slug page (no /url-slug-generator duplicate). |
| UTM Builder (GA4 Campaign URL Builder) | `/tools/utm-builder` | seo | utm builder | 15k-30k global ('utm generator' 3,600 US, CPC $15.56) | high | client-side | Highest CPC in SEO; bulk CSV mode and GA4 parameters. |
| Words to Pages Calculator | `/tools/words-to-pages` | text | how many pages is 1000 words | 60k-150k cluster (estimate) | medium | client-side | One page with a lookup table; no per-number pages. |
| Comma Separator (Column to Comma List) | `/tools/comma-separator` | text | comma separator | 15k-40k (estimate) | low | client-side | SQL IN() output and quoting; business audience. |
| YAML to JSON / JSON to YAML Converter | `/tools/yaml-to-json` | developer | yaml to json | 40k-80k cluster (estimate) | medium | client-side | DevOps audience; Norway-problem content. |
| CSV to JSON Converter | `/tools/csv-to-json` | developer | csv to json | 60k-120k cluster (estimate) | medium | client-side | papaparse, type inference, Excel input. |
| JSON to CSV / Excel Converter | `/tools/json-to-csv` | developer | json to csv | 50k-100k cluster (estimate) | medium | client-side | Nested-JSON flattening is the content hook. |
| HEX to RGB Converter | `/tools/hex-to-rgb` | converters | hex to rgb | 40k-100k cluster (Semrush US 9,900 for the exact term) | medium | client-side | One colour engine; also outputs HSL and OKLCH. |
| RGB to HEX Converter | `/tools/rgb-to-hex` | converters | rgb to hex | 30k-60k (Semrush US 18,100) | medium | client-side | Separate query and SERP from hex-to-rgb; distinct design-workflow content. |
| Final Grade Calculator | `/tools/grade-calculator` | calculators | final grade calculator | 100k-250k cluster (Ahrefs: test grade 5.9k; Omni page 61k visits) | medium | client-side | Ship before December finals; weighted, final-needed and test-grade modes. |
| Percent Off / Discount Calculator | `/tools/percent-off-calculator` | calculators | percent off calculator | 100k-250k (estimate) | medium | client-side | Ship before Black Friday; stacked discounts plus tax. |
| Percentage Increase Calculator | `/tools/percentage-increase-calculator` | calculators | percentage increase calculator | 100k-250k (estimate) | medium | client-side | Increase, decrease and change; links to the percentage hub. |
| Instagram Line Break Generator | `/tools/instagram-line-break-generator` | social-media | instagram line break generator | 5k-15k (estimate) | medium | client-side | U+2800 spacer, 2,200 counter and 125-character preview. |
| YouTube Timestamp Link Generator | `/tools/youtube-timestamp-link-generator` | social-media | youtube timestamp link generator | 5k-15k (estimate) | low | client-side | Builds links only; nothing fetched from YouTube. |
| CSS Gradient Generator | `/tools/css-gradient-generator` | design | css gradient generator | 60k-150k (estimate) | high | client-side | OKLCH interpolation and Tailwind output as differentiators. |
| Tint & Shade Generator | `/tools/color-shades-generator` | design | tint and shade generator | 5k-15k (estimate) | medium | client-side | Gateway to a small curated set of colour pages later. |

### Month 2 (26 tools)

| Tool | URL | Category | Primary keyword | Est. searches | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| Merge PDF (No Upload) | `/tools/merge-pdf` | pdf | merge pdf | 1M-3M (estimate) | high | client-side | Opens the PDF category; pdf-lib; long-tails such as 'merge pdf without uploading'. |
| Split PDF / Extract / Delete Pages | `/tools/split-pdf` | pdf | split pdf | 200k-500k (estimate) | high | client-side | The 'delete pages from pdf' long-tail is the entry point. |
| Rotate PDF | `/tools/rotate-pdf` | pdf | rotate pdf | 100k-300k (estimate) | medium | client-side | Simple build; competitors' content is thin. |
| PDF to JPG Converter | `/tools/pdf-to-jpg` | pdf | pdf to jpg | 500k-2M (KP single market 49,500; KP all-locations 9.1M) | high | client-side | pdf.js rendering, DPI choice, ZIP. |
| JPG to PDF (Images to PDF) | `/tools/jpg-to-pdf` | pdf | jpg to pdf | 500k-1M+ (KP 165k in one export; Ahrefs 'PNG to PDF' 110k KD 46) | high | client-side | Covers png to pdf and 'combine images into one pdf'. |
| Meta Tag Generator | `/tools/meta-tag-generator` | seo | meta tag generator | 15k-30k (estimate; metatags.io 222K visits/mo) | high | client-side | All-in-one SEO + OG + X tags with previews; reuses the pixel engine. |
| Open Graph & X Card Generator | `/tools/open-graph-generator` | seo | open graph generator | 3k-8k combined (estimate) | medium | client-side | Paste-mode previews for Facebook, X, LinkedIn, Discord and Slack. |
| Robots.txt Tester & Validator | `/tools/robots-txt-tester` | seo | robots.txt tester | 3k-6k combined (estimate) | medium | client-side | Paste mode with Google's matching rules; URL fetch comes later (server-light). |
| AI Crawler Blocker for robots.txt | `/tools/block-ai-bots-robots-txt` | seo | block ai crawlers robots.txt | 1k-3k (estimate) | low | client-side | A distinct question intent from the generator; kept to a dated user-agent list. |
| Hreflang Tag Generator | `/tools/hreflang-tag-generator` | seo | hreflang generator | 1k-3k (estimate) | low | client-side | Validates codes and reciprocity; output for HTML head, sitemap and HTTP header. |
| JWT Decoder | `/tools/jwt-decoder` | developer | jwt decoder | 80k-150k cluster excluding jwt.io brand (estimate) | high | client-side | Privacy-first decoding, signature verification and expiry checker; no brute forcer. |
| Unix Timestamp / Epoch Converter | `/tools/unix-timestamp-converter` | developer | epoch converter | 300k-500k cluster (estimate) | high | client-side | ISO-8601 and milliseconds long-tail; links to the Discord timestamp page. |
| Regex Tester | `/tools/regex-tester` | developer | regex tester | 120k-200k tool cluster (estimate) | high | client-side | Hub for 4-6 hand-written pattern pages later (email, phone, URL). |
| Base64 Encode / Decode | `/tools/base64-decode` | developer | base64 decode | 300k-500k cluster (estimate) | high | client-side | UTF-8-safe text and file modes, plus URL-safe variant. |
| URL Encoder / Decoder | `/tools/url-encode-decode` | developer | url decoder | 100k-180k cluster (estimate) | medium | client-side | Includes a URL parser and query-parameter table. |
| Text Compare (Diff Checker) | `/tools/text-compare` | text | text compare | 150k-300k with 'diff checker' (Semrush/Similarweb traffic snippets) | medium | client-side | Privacy angle: nothing uploaded; line, word and character diff. |
| Strikethrough Text Generator | `/tools/strikethrough-text-generator` | text | strikethrough text generator | 10k-30k cluster (low-confidence third-party data) | low | client-side | Per-platform how-to content (Discord, WhatsApp, Slack, Docs). |
| Invisible Character (Blank Text) | `/tools/invisible-character` | text | invisible character | 80k-200k cluster (estimate) | medium | client-side | Explains each code point and where it renders; no 'bypass filter' copy. |
| Binary Translator (Text to Binary) | `/tools/binary-translator` | converters | binary translator | 60k-150k (estimate) | medium | client-side | Absorbs text-to-binary, hex and ASCII; UTF-8 aware. |
| PX to EM Converter | `/tools/px-to-em` | converters | px to em | 5k-15k (estimate) | low | client-side | A distinct concept (parent-relative); the content explains compounding. |
| Days Between Dates Calculator | `/tools/days-between-dates` | calculators | days between dates | 150k-400k (estimate) | high | client-side | Date-hub page with a business-days mode. |
| Age Calculator | `/tools/age-calculator` | calculators | age calculator | 500k-1.5M (estimate) | high | client-side | Reuses the chronological-age engine; a consumer angle (days old, next birthday). |
| Color Picker (HEX, RGB, HSL, OKLCH) | `/tools/color-picker` | design | color picker | 500k-1M+ (estimate; large zero-click share) | high | client-side | Hub of the colour section; EyeDropper API with a fallback. |
| Glassmorphism Generator | `/tools/glassmorphism-generator` | design | glassmorphism generator | 10k-25k (estimate) | medium | client-side | Pairs with liquid glass in an effects cluster. |
| Passphrase Generator | `/tools/passphrase-generator` | utilities | passphrase generator | 10k-30k (estimate) | low | client-side | EFF large wordlist; entropy display. |
| Random Team Generator | `/tools/random-team-generator` | utilities | random team generator | 50k-150k (estimate) | low | client-side | No Google widget; teacher audience; balanced mode. |

### Month 3 (29 tools)

| Tool | URL | Category | Primary keyword | Est. searches | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| Social Media Character Counter | `/tools/social-media-character-counter` | social-media | social media character counter | 5k-15k (estimate) | medium | client-side | Hub for the platform counters; 2026 limits table; links to the generic character counter. |
| X (Twitter) Character Counter | `/tools/twitter-character-counter` | social-media | twitter character counter | 10k-30k (estimate) | medium | client-side | twitter-text weighting (URLs = 23) and a thread splitter. |
| Instagram Caption Character Counter | `/tools/instagram-character-counter` | social-media | instagram character counter | 5k-15k (estimate) | medium | client-side | Caption, bio and hashtag limits; pairs with the line-break tool. |
| YouTube Title Length Checker | `/tools/youtube-title-length-checker` | social-media | youtube title length checker | 3k-10k (estimate) | low | client-side | Truncation preview; description and tag counters. |
| Engagement Rate Calculator | `/tools/engagement-rate-calculator` | social-media | engagement rate calculator | 15k-40k (estimate) | medium | client-side | Manual formulas by followers, reach and impressions, with 2026 benchmarks; no username lookup. |
| TikTok Money Calculator | `/tools/tiktok-money-calculator` | social-media | tiktok money calculator | 20k-60k (estimate) | medium | client-side | Creator Rewards RPM range; estimates-only disclaimer. |
| Instagram Money Calculator | `/tools/instagram-money-calculator` | social-media | instagram money calculator | 10k-30k (estimate) | medium | client-side | Sponsorship rate ranges by tier. |
| YouTube Subscribe Link Generator | `/tools/youtube-subscribe-link-generator` | social-media | youtube subscribe link generator | 3k-10k (estimate) | low | client-side | ?sub_confirmation=1 plus QR and button snippet. |
| Instagram Carousel / Panorama Splitter | `/tools/instagram-carousel-splitter` | social-media | instagram carousel splitter | 5k-15k (estimate) | low | client-side | Shares code with the grid maker. |
| Instagram No Crop (Fit Photo) | `/tools/instagram-no-crop` | social-media | instagram no crop | 5k-20k (estimate) | low | client-side | The SERP is app listings, leaving room for a strong web tool. |
| Twitch Emote Resizer | `/tools/twitch-emote-resizer` | social-media | twitch emote resizer | 5k-15k (estimate) | low | client-side | 112/56/28 plus badges, ZIP. |
| YouTube Banner Resizer | `/tools/youtube-banner-resizer` | social-media | youtube banner resizer | 3k-10k tool + 30k-60k 'youtube banner size' informational (estimate) | medium | client-side | 2560x1440 with a 1546x423 safe-area overlay. |
| YouTube Thumbnail Previewer | `/tools/youtube-thumbnail-preview` | social-media | youtube thumbnail preview | 3k-10k (estimate) | low | client-side | Own upload only; generic mockup with no logos. |
| Instagram Fonts Generator | `/tools/instagram-fonts` | social-media | instagram fonts | 150k-300k (AhrefsTop snippet: igfonts.io 20.1K visits from 'instagram fonts') | high | client-side | Biggest social demand pool; bio preview and accessibility caveat. |
| Color Palette Generator | `/tools/color-palette-generator` | design | color palette generator | 150k-400k (estimate) | high | client-side | OKLCH harmonies; niche variants (pastel, accessible) first. |
| Border Radius Generator | `/tools/border-radius-generator` | design | border radius generator | 5k-15k (estimate) | low | client-side | 8-value editor and a squircle preview. |
| CSS Clip-path Generator | `/tools/clip-path-generator` | design | css clip path generator | 5k-15k (estimate) | low | client-side | Aging competition; supports shape(). |
| Color Blindness Simulator | `/tools/color-blindness-simulator` | design | color blindness simulator | 5k-15k (estimate) | low | client-side | Own Machado matrices (the npm package is unlicensed); pairs with the contrast checker. |
| OKLCH Color Picker & Converter | `/tools/oklch-color-picker` | design | oklch color picker | 2k-8k rising (estimate) | low | client-side | Gamut mapping for sRGB and P3. |
| HEX to RGBA & Hex Opacity Converter | `/tools/hex-to-rgba` | design | hex to rgba | 5k-15k (estimate) | medium | client-side | Design-owned alpha long-tail; links to hex-to-rgb rather than duplicating it. |
| Spacebar Counter | `/tools/spacebar-counter` | utilities | spacebar counter | 30k-100k (estimate) | low | client-side | Spin-off of the CPS test. |
| Left/Right Speaker & Headphone Test | `/tools/left-right-audio-test` | utilities | left right audio test | 30k-80k (estimate) | low | client-side | StereoPannerNode; no hearing-test claims. |
| Gamepad / Controller Tester | `/tools/gamepad-tester` | utilities | gamepad tester | 100k-250k (estimate) | medium | client-side | Stick-drift circle and vibration test. |
| What Is My Screen Resolution | `/tools/screen-resolution` | utilities | what is my screen resolution | 50k-150k (estimate) | medium | client-side | Instant answer plus DPR and viewport explainer. |
| QR Code Scanner (Image or Camera) | `/tools/qr-code-scanner` | utilities | qr code scanner online | 50k-150k (Semrush 9,900 US 'qr code scanner' + estimate) | medium | client-side | Shows the URL before opening (anti-quishing). |
| Small Text Generator | `/tools/small-text-generator` | text | small text generator | 40k-100k (estimate) | medium | client-side | Unicode small caps, superscript and subscript, plus Discord -# subtext. |
| Bold Text Generator | `/tools/bold-text-generator` | text | bold text generator | 40k-100k (estimate) | medium | client-side | Per-platform bolding how-tos; accessibility caveat. |
| Lorem Ipsum Generator | `/tools/lorem-ipsum-generator` | text | lorem ipsum generator | 100k-250k (estimate) | medium | client-side | History (Cicero) and HTML output. |
| Title Case Converter (AP, APA, Chicago, MLA) | `/tools/title-case-converter` | text | title case converter | 60k-150k incl. 'capitalize my title' (estimate) | medium | client-side | Style-specific rule engines; a US writer audience. |

### Month 4 (29 tools)

| Tool | URL | Category | Primary keyword | Est. searches | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| HTML Entity Encoder / Decoder | `/tools/html-entity-encoder` | developer | html entity decoder | 30k-60k cluster (estimate) | medium | client-side | Entity reference table. |
| Image to Base64 / Base64 to Image | `/tools/image-to-base64` | developer | image to base64 | 60k-120k cluster (estimate) | medium | client-side | Data URI, HTML and CSS snippets. |
| String Escape / Unescape (JSON, JS, HTML, SQL) | `/tools/string-escape` | developer | json escape | 25k-50k cluster (estimate) | low | client-side | One tabbed page covering six queries. |
| HMAC Generator | `/tools/hmac-generator` | developer | hmac generator | 8k-20k (estimate) | low | client-side | Webhook-signature examples. |
| Bcrypt Hash Generator & Verifier | `/tools/bcrypt-generator` | developer | bcrypt generator | 30k-60k cluster (estimate) | medium | client-side | Web Worker; cost-factor content. |
| htpasswd Generator | `/tools/htpasswd-generator` | developer | htpasswd generator | 10k-25k cluster (estimate) | low | client-side | bcrypt/APR1 plus Basic auth header. |
| JSONPath Tester | `/tools/jsonpath-tester` | developer | jsonpath online | 15k-30k cluster (estimate) | low | client-side | Click-to-copy path from the tree. |
| Markdown Table Generator | `/tools/markdown-table-generator` | developer | markdown table generator | 20k-40k cluster (estimate) | medium | client-side | CSV paste and table prettifier. |
| Markdown to HTML Converter | `/tools/markdown-to-html` | developer | markdown to html | 30k-60k cluster (estimate) | medium | client-side | GFM plus DOMPurify. |
| HTML to Markdown Converter | `/tools/html-to-markdown` | developer | html to markdown | 15k-35k (estimate) | low | client-side | Rising with docs and LLM workflows. |
| XML Formatter & Validator | `/tools/xml-formatter` | developer | xml formatter | 40k-80k cluster (estimate) | medium | client-side | Well-formedness errors with line numbers. |
| HTML Formatter & Minifier | `/tools/html-formatter` | developer | html formatter | 40k-80k cluster (estimate) | medium | client-side | Both directions on one page. |
| Time Calculator (Add / Subtract Time) | `/tools/time-calculator` | calculators | time calculator | 100k-200k (estimate) | medium | client-side | Shares components with the hours calculator. |
| Day of the Week Calculator | `/tools/day-of-the-week-calculator` | calculators | what day of the week was i born | 20k-60k (estimate) | medium | client-side | Cheap date-hub add-on. |
| VAT Calculator (UK) | `/tools/vat-calculator` | calculators | vat calculator | 100k-200k UK (estimate) | medium | client-side | High-CPC UK B2B; add/remove VAT; dated rates. |
| Sales Tax Calculator (incl. Reverse) | `/tools/sales-tax-calculator` | calculators | sales tax calculator | 100k-250k US (estimate) | medium | client-side | Static state base rates, updated yearly and dated; user-overridable. |
| Average / Mean, Median, Mode Calculator | `/tools/average-calculator` | calculators | average calculator | 60k-150k (estimate) | medium | client-side | Paste a list and see the steps. |
| Simple Interest Calculator | `/tools/simple-interest-calculator` | calculators | simple interest calculator | 50k-120k (estimate) | medium | client-side | Finance disclaimer. |
| Word Frequency Counter | `/tools/word-frequency-counter` | text | word frequency counter | 10k-25k (estimate) | low | client-side | n-grams and CSV export; feeds keyword density. |
| Syllable Counter (Haiku Checker) | `/tools/syllable-counter` | text | syllable counter | 30k-80k (estimate) | medium | client-side | Per-line counts for 5-7-5. |
| Remove Extra Spaces | `/tools/remove-extra-spaces` | text | remove extra spaces | 15k-40k (estimate) | low | client-side | Non-breaking spaces and tabs; Excel TRIM content. |
| Find and Replace Text Online | `/tools/find-and-replace` | text | find and replace text online | 5k-15k (estimate) | low | client-side | Regex mode and multiple rules. |
| Reverse Text Generator | `/tools/reverse-text` | text | reverse text generator | 20k-50k (estimate) | low | client-side | Grapheme-safe; words, lines and characters. |
| Upside Down Text Generator | `/tools/upside-down-text` | text | upside down text | 20k-50k cluster (low-confidence third-party data) | low | client-side | Shares code with reverse text. |
| Word to HTML Converter (Clean Paste) | `/tools/word-to-html` | text | word to html converter | 80k-200k (Semrush: wordhtml.com 633K-820K visits/mo) | medium | client-side | Strips mso- styles; two-pane editor. |
| Keyword Density Checker | `/tools/keyword-density-checker` | seo | keyword density checker | 8k-15k (estimate) | high | client-side | States honestly that density is not a ranking factor; paste mode. |
| Schema Markup Generator (JSON-LD) | `/tools/schema-markup-generator` | seo | schema markup generator | 8k-15k hub (estimate) | high | client-side | Reflects the 2026 removals of FAQ and HowTo rich results; hand-written per-type pages later. |
| XML Sitemap Generator (from URL List) | `/tools/xml-sitemap-generator` | seo | xml sitemap generator | 20k-40k ('sitemap generator' 127,100 per Semrush) | high | client-side | Targets the 'from URL list', sitemap index and validator long-tail; crawling comes later. |
| UTM / Tracking Parameter Remover | `/tools/utm-remover` | seo | remove utm parameters from url | 500-1.5k (estimate) | low | client-side | Low-effort companion to the UTM builder. |

### Month 5 (28 tools)

| Tool | URL | Category | Primary keyword | Est. searches | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| Crop Image | `/tools/crop-image` | image | crop image | 100k-250k (Semrush US 22,200 + image cropper 18,100) | high | client-side | Aspect presets and circle crop. |
| Round Image Corners / Circle Crop | `/tools/round-image-corners` | image | round corners image | 20k-50k (estimate) | low | client-side | Profile-picture preset. |
| DPI Converter (Change Image DPI) | `/tools/dpi-converter` | image | change dpi of image | 50k-100k (estimate) | low | client-side | Lossless pHYs/JFIF rewrite; DPI vs PPI content. |
| Image Color Picker | `/tools/image-color-picker` | image | image color picker | 50k-120k (estimate) | medium | client-side | Zoom loupe; HEX/RGB/HSL/CMYK. |
| Blur / Pixelate Image | `/tools/blur-image` | image | blur image | 100k-300k (estimate) | medium | client-side | Privacy angle (faces, plates); warns that pixelated text can be reversed. |
| Add Watermark to Image | `/tools/add-watermark` | image | add watermark to photo | 60k-120k (KP export 14,800 x2 + 12,100) | medium | client-side | Adding only; never removal. |
| PNG to ICO Converter | `/tools/png-to-ico` | image | png to ico | 20k-40k (Ahrefs 18,100 KD 49; ico converter 5,400 KD 28) | medium | client-side | Reuses the favicon ICO writer. |
| Social Media Image Resizer | `/tools/social-media-image-resizer` | image | resize image for instagram | 100k-300k cluster (estimate) | medium | client-side | Dated preset size table; no downloading from platforms. |
| Passport Photo Maker | `/tools/passport-photo-maker` | image | passport photo maker | 300k-800k global (India-heavy) | medium | client-side | 'Verify with the issuing authority' disclaimer; no government-approval claims. |
| Bulk Image Resizer | `/tools/bulk-image-resizer` | image | bulk image resizer | 30k-60k (estimate) | medium | client-side | High-CPC power users; rename patterns. |
| Rotate & Flip Image | `/tools/rotate-image` | image | rotate image | 50k-100k (estimate) | medium | client-side | EXIF-orientation fix long-tail. |
| Image Converter (Hub) | `/tools/image-converter` | image | image converter | 200k-500k (estimate) | high | client-side | Canonical owner of generic converter intent; parent of the pair pages. |
| Color Palette from Image | `/tools/color-palette-from-image` | design | color palette from image | 40k-120k (estimate) | high | client-side | Palette extraction; the eyedropper stays on the image page. |
| Mesh Gradient Generator | `/tools/mesh-gradient-generator` | design | mesh gradient generator | 5k-15k (estimate) | low | client-side | PNG export with noise. |
| CSS Grid Generator | `/tools/css-grid-generator` | design | css grid generator | 10k-25k (estimate) | medium | client-side | Bento-grid presets; Tailwind output. |
| Random Color Generator | `/tools/random-color-generator` | design | random color generator | 20k-50k (estimate) | medium | client-side | Internal-link feeder. |
| Color Wheel & Complementary Color Finder | `/tools/color-wheel` | design | complementary color finder | 100k-250k head; 2k-6k finder (estimate) | medium | client-side | RGB and RYB modes. |
| Color Mixer | `/tools/color-mixer` | design | color mixer | 15k-40k (estimate) | medium | client-side | spectral.js (MIT); never mixbox (NC licence). |
| Data Storage Converter (KB/MB/GB/TB) | `/tools/data-storage-converter` | converters | mb to gb | 50k-150k cluster (estimate) | medium | client-side | 1000 vs 1024 explainer. |
| Time Zone Converter | `/tools/time-zone-converter` | converters | time zone converter | 200k-500k head (estimate) | high | client-side | Only 5-15 hand-written pair pages, and only if they earn impressions. |
| Number Base Converter (Binary, Decimal, Hex, Octal) | `/tools/binary-to-decimal` | converters | binary to decimal | 600k-1M cluster (estimate) | high | client-side | One page with steps; replaces the duplicate /number-base-converter. |
| Scientific Notation Converter | `/tools/scientific-notation-converter` | converters | scientific notation calculator | 60k-150k (estimate) | medium | client-side | Education filler. |
| What Is My IP | `/tools/what-is-my-ip` | utilities | what is my ip | 1M-3M (Semrush Jan 2026: 823K + 301K + 165K variants) | high | server-light | First serverless function (Vercel edge headers); disclose in the privacy policy. |
| Meta Tag Analyzer (URL) | `/tools/meta-tag-analyzer` | seo | meta tag analyzer | 5k-12k combined (estimate) | high | server-light | Serverless HTML fetch; rate-limited. |
| Redirect Checker | `/tools/redirect-checker` | seo | redirect checker | 15k-30k (estimate) | high | server-light | Pairs with the redirect generator. |
| X Card & Open Graph Validator (URL) | `/tools/twitter-card-validator` | seo | twitter card validator | 3k-8k combined (estimate) | medium | server-light | Fills the gap left by X's retired validator. |
| vCard QR Code Generator | `/tools/vcard-qr-code-generator` | utilities | vcard qr code generator | 5k-20k (estimate) | medium | client-side | Static code plus .vcf download. |
| Online Voice Recorder | `/tools/online-voice-recorder` | utilities | online voice recorder | 100k-300k (estimate) | medium | client-side | Reuses mic-test code; MP3 via lamejs. |

### Month 6 (29 tools)

| Tool | URL | Category | Primary keyword | Est. searches | Competition | Feasibility | Note |
|---|---|---|---|---|---|---|---|
| CSS Minifier & Beautifier | `/tools/css-minifier` | developer | css minifier | 40k-80k cluster (estimate) | medium | client-side | The unminify variant is the softer entry. |
| JavaScript Minifier & Beautifier | `/tools/javascript-minifier` | developer | javascript minifier | 50k-100k cluster (estimate) | medium | client-side | Lazy-load terser. |
| XML to JSON Converter | `/tools/xml-to-json` | developer | xml to json | 40k-80k cluster (estimate) | medium | client-side | Attribute and array options exposed. |
| Mock / Test Data Generator | `/tools/mock-data-generator` | developer | mock data generator | 40k-80k cluster (estimate) | medium | client-side | Synthetic test data only; no card numbers or fake IDs. |
| Docker Run to Docker Compose Converter | `/tools/docker-run-to-docker-compose` | developer | docker run to docker compose | 8k-15k (estimate) | low | client-side | Uncontested DevOps query. |
| IPv4 / CIDR Subnet Calculator | `/tools/subnet-calculator` | developer | subnet calculator | 150k-250k cluster (estimate) | high | client-side | CIDR and IPv6 long-tail first; IT audience CPC. |
| JSON to TypeScript (+ Go, Zod, JSON Schema) | `/tools/json-to-typescript` | developer | json to typescript | 30k-60k cluster (estimate) | medium | client-side | Per-language pages only if the data justifies them. |
| .gitignore Generator | `/tools/gitignore-generator` | developer | gitignore generator | 60k-120k cluster (estimate) | medium | client-side | Bundled github/gitignore templates (CC0). |
| User Agent Parser (What Is My User Agent) | `/tools/user-agent-parser` | developer | what is my user agent | 120k-200k cluster (estimate) | medium | client-side | Client Hints explainer. |
| HTML Table Generator | `/tools/html-table-generator` | developer | html table generator | 40k-80k cluster (estimate) | medium | client-side | CSV/JSON import angle. |
| YouTube RPM / CPM Calculator | `/tools/youtube-rpm-calculator` | social-media | youtube rpm calculator | 3k-10k (estimate) | low | client-side | Rounds out the money cluster. |
| Discord Text Formatter & Fonts | `/tools/discord-text-formatter` | social-media | discord fonts | 10k-30k (estimate) | medium | client-side | Markdown preview plus Unicode styles. |
| Discord Emoji & Sticker Resizer | `/tools/discord-emoji-resizer` | social-media | discord emoji resizer | 2k-8k (estimate) | low | client-side | Reuses the emote-resizer engine. |
| Bluesky & Threads Character Counter | `/tools/bluesky-character-counter` | social-media | bluesky character counter | 1k-5k (estimate) | low | client-side | Grapheme counting (300) and Threads (500). |
| YouTube Embed Code Generator | `/tools/youtube-embed-code-generator` | social-media | youtube embed code generator | 1k-5k (estimate) | low | client-side | Official embed, privacy-enhanced mode. |
| Hashtag Counter & Formatter | `/tools/hashtag-counter` | social-media | hashtag counter | 1k-3k (estimate) | low | client-side | Links the counters together. |
| YouTube Playlist Length Calculator | `/tools/youtube-playlist-length-calculator` | social-media | youtube playlist length | 10k-30k (estimate) | low | server-light | Official YouTube Data API v3 via a serverless proxy only. |
| YouTube Tag Extractor | `/tools/youtube-tag-extractor` | social-media | youtube tag extractor | 10k-25k (estimate) | medium | server-light | Official API only; no HTML scraping. |
| Page Size Checker | `/tools/page-size-checker` | seo | page size checker | 1k-3k (estimate) | medium | server-light | Cheap once the fetch function exists. |
| Heading Tag (H1-H6) Checker | `/tools/heading-tag-checker` | seo | h1 checker | 1k-3k (estimate) | medium | server-light | URL mode plus a client-side paste-HTML mode. |
| Wheel Spinner / Random Name Picker | `/tools/wheel-spinner` | utilities | spin the wheel | 2M-10M (Similarweb wheelofnames 13.3M visits) | high | client-side | Themed long-tails (classroom picker, letter wheel); no raffle or casino framing. |
| Yes or No Wheel | `/tools/yes-or-no-wheel` | utilities | yes or no wheel | 50k-150k (estimate; CPC $1.31 per Similarweb) | medium | client-side | Reuses the wheel component. |
| Encrypt / Decrypt Text (AES) | `/tools/encrypt-decrypt-text` | utilities | encrypt text online | 10k-30k (estimate) | low | client-side | AES-GCM with PBKDF2; the user's own key only, no cracking. |
| Random PIN Generator | `/tools/random-pin-generator` | utilities | random pin generator | 5k-20k (estimate) | low | client-side | Excludes common PINs. |
| Invoice Generator | `/tools/invoice-generator` | utilities | invoice generator | 100k-300k (estimate) | high | client-side | Genuine transactions only; no receipts or PAID stamps; add a terms note. |
| Signature Generator (Your Own E-Signature) | `/tools/signature-generator` | utilities | signature generator | 100k-250k (estimate) | medium | client-side | 'Your own signature' framing; transparent PNG/SVG. |
| GPA Calculator | `/tools/gpa-calculator` | calculators | gpa calculator | 300k-800k (estimate) | high | client-side | Pairs with the grade calculator; weighted AP/IB. |
| Compound Interest Calculator | `/tools/compound-interest-calculator` | calculators | compound interest calculator | 200k-500k (estimate) | high | client-side | YMYL finance disclaimer; long-tail first. |
| Email & URL Extractor (from Text) | `/tools/email-extractor` | text | extract emails from text | 15k-40k (estimate) | medium | client-side | Pasted text only; never 'scrape websites'. |

**Roadmap total:** 170 tools, so the site reaches about 224 tools by the end of Month 6.

Month themes:
- **Month 1:** finish the image-converter cluster and the QR hub, and ship the grade and discount calculators before the December finals and Black Friday peaks.
- **Month 2:** open the PDF category, and add core developer encoders and SEO meta generators.
- **Month 3:** the creator/social suite.
- **Month 4:** long-tail developer and text utilities.
- **Month 5:** image editing, plus the first server-light tools.
- **Month 6:** remaining developer, creator and utility tools.

**Backlog after Month 6** (valid, but lower ROI): text-to-handwriting (reframed for notes and cards), ascii-art-generator, cursive and glitch text generators, random-word-generator, text-repeater, sentence-counter, keyword-extractor, seo-content-analyzer, meta-robots-tag-generator, canonical-tag-generator, google-search-operators-builder, schema-markup-validator, og-image-generator, image-alt-text-checker (server-light), black-and-white-image, image-size-checker, barcode-generator, placeholder-image-generator, screenshot-beautifier, gif-maker, image-to-text (OCR), remove-background, meme-generator (upload-only), pace-calculator, sleep-calculator, ratio-calculator, fraction-calculator, inflation-calculator, unit-converter, golden-ratio-calculator, color-name-finder (curated only), the remaining CSS generators (flexbox, text-shadow, button, animation, loader, cubic-bezier, neumorphism, svg-wave, blob, pattern, font-pairing, type-scale, css-triangle, css-filter, css-to-tailwind, tailwind-cheat-sheet, scrollbar), color-analysis-quiz, youtube-description-generator, pomodoro-timer, online-notepad, tally-counter, bingo-card-generator, reaction-time-test, screen-recorder.

## 8. Rejected candidates

| Candidate | Why rejected |
|---|---|
| Grammar Checker / Paraphraser / Summarizer / Plagiarism Checker | Infeasible: these need an LLM or a paid web-search API and cannot run client-side. Essay-rewriting framing is an academic-dishonesty policy risk, and QuillBot/Grammarly own the SERP. |
| AI Humanizer / 'bypass AI detection' / AI text detector | Policy (enables dishonest behaviour), unreliable-claims risk, and needs a paid API. |
| Meta Description Generator (AI) | Needs a paid LLM API to be competitive; a template-based version would be low-value content. |
| LSI Keyword Generator | Would require scraping Google autocomplete or SERPs (a Google ToS and spam-policy risk), and the concept is debunked. |
| Google rank checker / keyword volume / backlink / DA-PA checkers | Need third-party paid data or automated Google queries (the spam policy's 'machine-generated traffic'). |
| Mobile-Friendly Test | Infeasible: needs headless rendering; iframe checks fail on X-Frame-Options/CSP. An informational article could cover the query later. |
| Keyword Grouping Tool (lexical clustering) | A lexical-only tool would under-deliver against SERP-based SaaS (Keyword Insights) and invite 'misleading functionality' complaints. |
| Internet Speed Test | Infeasible without dedicated bandwidth servers; Google/M-Lab, Ookla and fast.com own it. |
| Currency Converter | Zero-click Google widget, XE/Wise/OANDA dominance, and it needs a live rates source. Not worth a server-light slot in the first 6 months. |
| Coin Flip, Online Stopwatch/Timer, Dice Roller, Tip Calculator | Google shows its own interactive widgets, so clicks are minimal. 'N minute timer' page sets would also be scaled-content abuse. Revisit only for specific long-tails (flip a coin 100 times, D&D dice). |
| Text to Speech (browser voices) | Web Speech voices vary by OS and cannot export MP3; it would under-deliver against NaturalReader/ElevenLabs on a brand SERP. |
| Typing Speed Test | Brand SERP (Monkeytype, TypingTest.com, 10FastFingers) with strong engagement signals; hopeless for a new domain in 6 months. |
| Word Unscrambler / Anagram Solver | Brutal programmatic SERP (wordunscrambler, word.tips), a 1-2MB word list, and a word-game niche off-strategy for a utility brand. |
| Emoji Copy & Paste | Entrenched decade-old authority sites (getemoji, emojipedia). Low odds; may appear as an embedded widget instead. |
| BMI, TDEE/Calorie and Pregnancy Due Date calculators | YMYL health with AI Overviews on most queries and NHS/CDC/BabyCenter on page 1. A new domain without medical E-E-A-T cannot rank, and health is a sensitive, lower-RPM ad category. Revisit after 12 months. |
| Loan / Mortgage / EMI Calculator | YMYL finance with KD ~81 (Ahrefs) and bank/NerdWallet dominance. Compound and simple interest cover finance topical depth instead. |
| Love Calculator | Low-CPC entertainment traffic that dilutes the site's utility focus; deferred beyond month 6 (not a policy issue). |
| YouTube Tag Generator and Instagram Hashtag Generator | No real suggestion data without paid APIs; vidIQ/keywordtool.io dominate; curated hashtag lists need constant moderation. |
| YouTube Channel Name / Instagram Username / Twitch Name / Instagram Bio generators | Canva, Hootsuite and AI SaaS dominate page 1, and word-list generators are thin (low-value-content risk). |
| Fancy Text / Font Generator hub (/font-generator) | Hopeless head term (lingojam, fsymbols, Picsart). Its demand is served by the platform-specific pages (instagram-fonts, bold, small, strikethrough) instead. |
| URL Slug Generator duplicate (/url-slug-generator) | Cannibalization: identical intent to /slug-generator, which is kept in the SEO category. |
| Number Base Converter duplicate (/number-base-converter) and Text to Binary (/text-to-binary) | Cannibalization: merged into /binary-to-decimal and /binary-translator respectively. |
| Rem to PX as a separate page (/rem-to-px) | The bidirectional /px-to-rem page targets both queries; a second page would compete with it. |
| JSON Minifier (/json-minify) and File Checksum Calculator | Merged into json-formatter (minify tab) and hash-generator (file mode) to avoid thin near-duplicate pages. |
| Programmatic preset sets (per-hex colour pages, 'X words to pages', 'N days from today', per-city time zones) | Scaled-content abuse risk (March 2026 core update). Hand-written variants are allowed only where the SERP shows dedicated pages and Search Console shows impressions. |
| Broken Link Checker | Whole-site crawling is not server-light, and Ahrefs and established checkers own the SERP. At most a single-page status check, after month 6. |
| Text to Handwriting | Deferred: competitors frame it as faking handwritten assignments (policy optics), a heavy canvas/font build, and a low-CPC India-heavy audience. |
| Meme Generator | Deferred: Imgflip dominates, and a bundled template gallery would be copyrighted content. Upload-only is possible later. |
| Background Remover, Image to Text (OCR), GIF/Video to GIF | Deferred past month 6: 10-40MB WASM models or ffmpeg.wasm, slow on phones, and brand-dominated SERPs (remove.bg, Ezgif). |
| Color Blind Test (Ishihara-style) | Deferred: health-adjacent screening claims and copyrighted Ishihara plates; the simulator ships instead. |
| All downloaders, thumbnail grabbers, proxies, PDF unlockers, fake-document, receipt and fake-tweet generators | AdSense forbidden or high-risk categories (dishonest behaviour, copyright circumvention, fake documents); project hard exclusions. |

## 9. Site name ideas

- ToolkitJar (toolkitjar.com available; recommended, and already referenced in the AdSense setup notes)
- ToolCamel (toolcamel.com available)
- Handytab (availability unverified)
- Utilnest (availability unverified)
- Pocketkit Tools (availability unverified)

## 10. Rules every page must follow (from the AdSense and competitor research)

- The tool UI sits directly under the H1 and is fully usable at 360x640 with no ad above it or inside it. Keep ads at least 100px from action buttons, use at most 3 units per page (1-2 during review), and never place ads on processing, download-ready, error, 404 or legal pages.
- Each page needs 1,000+ words, of which at least 900 are unique. Follow the ADDING_A_TOOL.md structure: what it is, how to use it, how it works with a worked example, a reference table, use cases, tips and limits, and a FAQ built from this tool's own PAA questions. No FAQ question may be shared across pages. Enforce a build-time overlap gate of 30% or less (shingle/Jaccard).
- Shared boilerplate (privacy note, disclaimers, related tools) stays under about 15% of each page's main content.
- Never publish or link a tool that isn't built: no 'coming soon', no empty categories, no alias routes.
- YMYL-adjacent tools (hours, salary and later finance calculators) automatically get the finance disclaimer. Creator-earnings pages get an 'estimates only' disclaimer. The dead-pixel flasher gets a photosensitivity warning.
- Don't add FAQPage markup expecting rich results (removed 7 May 2026). Use WebApplication and BreadcrumbList JSON-LD, and never add a fake aggregateRating.
- Apply to AdSense once 30-40 finished tool pages, 8-12 guides, and the About, Contact, Privacy, Terms, Disclaimer and cookie pages are live and indexed. Use Google's certified CMP for EEA/UK/CH consent.
- Volumes are ranges from the sources named. Re-check the top 20 in a live keyword tool before committing writer time; treat 'estimate' rows as directional.
