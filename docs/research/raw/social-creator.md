# Raw research notes: Social media, YouTube & creator tools (no downloaders)

- Researcher role: senior SEO keyword researcher, "free online tools" sites
- Date: 2026-09-29. Model for this run: Claude Opus 5.5 (`claude-opus-5-5`).
- Scope: Instagram, YouTube, TikTok, X/Twitter, LinkedIn, Threads/Bluesky, Discord, Twitch and Pinterest creator utilities that run in the browser. Downloaders, thumbnail grabbers, follower/like/view boosters and scrapers are out of scope.

## 0. Method, and how much to trust the numbers

- About 55 WebSearch queries were run (listed in section 2). **WebFetch was blocked by the network egress proxy for every domain tried**: ahrefstop.com, semrush.com, similarweb.com, dev.to, keywordseverywhere.com, tunepocket.com, smallseotools.com and suggestqueries.google.com. So none of the competitor pages, sitemaps or autocomplete endpoints were fetched directly. All numbers below come from **search-result snippets**. The most useful snippets were from AhrefsTop, Semrush and Similarweb, which print lines like "X ranks #1 for 'kw' in United States and receives N monthly visits from this keyword alone".
- How to turn those snippets into volume: a #1 position gets about 25-35% CTR. So "20.1K visits at #1 in the US" means roughly 60k-80k US searches a month. Global English volume is usually 2-4x the US figure for creator tools, because India, the Philippines and Indonesia are heavy users.
- Evidence labels used in the tables:
  - **[A]** a direct snippet from AhrefsTop, Semrush or Similarweb.
  - **[B]** a figure published on a tool page or blog.
  - **[E]** my estimate, based on SERP saturation (how many exact-match-domain or dedicated sites exist), competitor traffic, and experience with Ahrefs/Semrush ranges for similar terms. **Every [E] range should be checked in Ahrefs, Semrush or Keyword Planner before building starts.**
- Overlap with other categories:
  - The generic "font generator", "small text", "invisible character" and "character counter" tools are in `text-writing.md`.
  - The generic "image resizer", "image splitter" and "profile picture maker" tools are in `image-media.md`.
  - In this category I only list the **platform-specific long-tail pages**, such as "instagram fonts", "discord colored text", "twitch emote resizer" and "instagram grid maker". These should live on their own URLs and link to the generic hub, so the two pages don't cannibalize each other.

## 1. Key findings (TL;DR)

1. **The biggest traffic in this category comes from Unicode "fonts for a platform" terms.** igfonts.io ranks #1 in the US for "instagram fonts" (20.1K visits/mo from that keyword alone), "ig fonts" (13.6K), "instagram font" (4K), "ig font" (3.5K) and "instagram font generator" (3K). Its search traffic is 499K/mo, it has DR 66 and about 3K referring domains [A, AhrefsTop snippet, Apr 2026]. Google-Trends-style data shows "instagram font generator" near the top of its interest range through Jan 2026 [B, accio.com]. Competition is **medium-high**, but the SERP is made of exact-match domains and thin pages rather than brands, apart from Picsart and Creative Fabrica.
2. **Money calculators have high CPC, high US share and clear intent.** This covers YouTube, Shorts, TikTok and Instagram. The SERP is mostly SaaS "free tool" pages: Influencer Marketing Hub, Sellfy, Kajabi, The Leap, Social Blade, CollabPals, LiveReacting, Creator Hero and Plerdy. That makes competition **medium-high** for "youtube money calculator". The **long-tail versions** have far fewer dedicated pages: "youtube shorts money calculator", "youtube rpm calculator", "how much does youtube pay per 1000 views calculator", "youtube earnings by niche", "tiktok creator rewards calculator". The People Also Ask box for "how much does youtube pay per 1000 views" is full of blog posts, not tools, which is a gap for a calculator page with good content.
3. **Discord utilities are the best low-competition cluster.** The "discord timestamp" SERP is almost entirely hobby and exact-match-domain sites: hammertime.cyou, sesh.fyi, discordtimestamp.com/.org, disctimestamps.com, r.3v.fi, c.r74n.com, a UCSB personal page and a GitHub gist. hammertime.cyou gets about 446K visits/mo, but ~68% of that is direct [A, Similarweb snippet]. One indie dev writes that their brand-new site became the #1 Google result for "Discord Timestamps" [B, dev.to post snippet]. **No big brands.** The same is true of the "discord colored text generator" SERP (rebane2001, GitHub pages, gypu, textkits, markdowntools).
4. **Instagram and creator image utilities that run on Canvas are a good fit for a new domain.** These are the grid maker / 3x3 splitter, the panorama/carousel splitter, "no crop" / fit-to-square, the Twitch emote resizer (112/56/28), the YouTube banner resizer with its 1546x423 safe area, and the YouTube thumbnail previewer. Every SERP is small tool sites and SaaS lead-magnet pages (Postiz, Instasize, Post-Bridge, PostPlanify, Circleboom). **Low-medium competition, easy to build client-side, and the privacy angle ("never uploaded") is a real differentiator.**
5. **Platform character counters are easy to build but crowded with SaaS lead magnets.** charactercounter.com has a page per platform; Postiz, Nuelink, Postpone, Rybbit, Pallyy, Hopper HQ and SocialBee all have one for every network. Volume per page is small (1k-15k). The best plan is **one "Social Media Character Counter" hub with platform sub-pages**, updated with 2026 limits: Bluesky 300 graphemes, Threads 500, X 280 (25k for Premium), IG 2,200 with 125 shown before "more", LinkedIn 3,000, TikTok 4,000, YouTube title 100 / description 5,000.
6. **Generators of hashtags, names and tags are dominated by brands.** Canva, Hootsuite, vidIQ, Wix, Squarespace, Buffer and keywordtool.io are on page 1. They are also mostly AI generators, which we can't match without a paid API. We can only offer deterministic generators based on templates or curated lists. Treat these as **low priority** or as later "topical completeness" pages.
7. **Tools that need data from the platform are server-light or infeasible.** Examples: YouTube tag extractor, playlist length, tweet to image, and engagement rate *for a username*. The YouTube Data API v3 is free but needs a key and a server proxy, so those are roadmap items. X/Twitter data needs a paid API, so tweet-to-image-from-URL is infeasible. A manual-entry engagement rate calculator (you type followers, likes and comments) is fully client-side.

## 2. Search log (queries, sources, what was seen)

| # | Query | Key observations |
|---|---|---|
| 1 | youtube money calculator keyword search volume | Sellfy, Plerdy, LiveReacting, TunePocket calculators; keywordtool.io, ryrob and tuberanker YouTube keyword tools. No volume shown. |
| 2 | instagram font generator monthly searches ahrefs | font-generator.com #4 US for "font generator" = 24.2K visits/mo; **"font generator" volume 432K** [A, AhrefsTop snippet]. Competitors: postiz, creativefabrica, metatags.io, igfonts.io, wavegen, fontb, instafontsgen, igfonts.info. |
| 3 | discord timestamp generator | SERP: UCSB personal page, wonderchat, GitHub repo, gist, r.3v.fi, hammertime.cyou, c.r74n.com, remote3.co, discordtimestamp.org, sesh.fyi. **Hobby-grade SERP.** |
| 4 | youtube tag generator free tool | subscribr, vaizle, tunepocket, rightblogger, embarque, ryrob, **vidiq**, commentpicker, seostudio. Mostly AI tools. High competition. |
| 5 | engagement rate calculator instagram free | socialinsider, modash, slice, vaizle, heepsy, collabstr, hypeauditor, thesocialcat, **hootsuite**, **later**. All look up a username (API or scraping). A manual-input calculator is a different intent, closer to Omni Calculator and SocialBee. |
| 6 | "youtube money calculator" search volume | influencermarketinghub, sellfy, collabpals, livereacting, beamly, plerdy, ytlarge, tunepocket, pixtup. Earnings of **$1-$25 per 1,000 views** by niche. |
| 7 | "discord timestamp" keyword "search volume" | zapier blog, geeksforgeeks, 3v.fi, hammertime, discordtimestampgenerator.com blog, toolscord snowflake converter. One dev reports their site became the #1 result. |
| 8 | smallseotools most visited pages | smallseotools **3M visits Aug 2026**, 70% organic; #6 for "reverse image search" = 71.4K visits; social referrals mostly from YouTube [A]. |
| 9 | "instagram fonts" keyword volume 2025 | "instagram fonts" interest peaked Sep 2025; "instagram font generator" peaked at 92 in Jan 2026; "instagram text styles" and "instagram caption fonts" are near 0 [B, accio.com trend data]. |
| 10 | ahrefstop igfonts.io | **igfonts.io: 499.2K search visits Apr 2026, #1 US "instagram fonts" 20.1K, "ig fonts" 13.6K, "instagram font" 4K, "ig font" 3.5K, "instagram font generator" 3K; India 29.1%; DR 66, 3K ref domains** [A]. |
| 11 | hammertime.cyou traffic | Similarweb: **445.9K visits May 2026**, direct 67.6%, organic #2 source; top kws hammertime, **discord timestamp**, hammertime discord; 784 keywords [A]. |
| 12 | lingojam fancy text generator traffic | lingojam #2 US "font generator" = 144.2K visits; 5.4M search traffic [A]. |
| 13 | ahrefstop influencermarketinghub youtube money calculator | IMH calculator is described as "one of the most widely used"; also exists as a Google Sites mirror. No volume. |
| 14 | ahrefstop "ranks #1 for" "discord timestamp" | disctimestamps.com, discordtimestamp.com, discord-timestamp.org, disctimestamps.site, timestampdiscord.com. **At least 6 exact-match domains** means demand is real and there's no brand on page 1. |
| 15 | ahrefstop twitter character counter | wordcounter.net #1 "word counter" = 821.6K visits; charactercounter.com ~73.5K visits and charactercountonline.com ~179.5K visits from "character counter" [A]. X-counter SERP: postiz, bundle.social, hopperhq, pallyy, socialbee, charactercounter.com/twitter. |
| 16 | ahrefstop invisible character | Competitors: invisibletext.net, invisible-character.net, blanktext.com, invisible-characters.com; **theinvisiblecharacter.com ~74.9K monthly visits** [A, Similarweb snippet]. |
| 17 | ahrefstop "font generator" "cool fonts" | fontgenerator.cc #3 "font generator copy and paste" 1.4K visits; **fontgen.net #3 "copy and paste fonts" 12.4K visits** [A]. |
| 18 | ahrefstop instagram bio / captions | **captions.ai #1 US "instagram bio ideas" 3.8K visits** [A]. Adobe Express ranks for captions lists, and Ahrefs has an AI caption generator page. |
| 19-22 | semrush/similarweb/suggestqueries fetches | **Blocked by egress proxy.** |
| 23 | hammertime semrush "discord timestamp" | Hypestat ~26.1K visitors/day (probably inflated). |
| 24 | sesh.fyi timestamp traffic | sesh.fyi 724.8K visits over 3 months [A]. The /timestamp/ page is a lead magnet for a Discord bot. |
| 25 | discord text formatting / colored text | Guides from digitalcitizen, techpp, beebom, minitool, writebots, alphr; tools cyberchef.dev, markdowntools.io. Colours work via ```ansi blocks with ESC codes; diff/fix/yaml tricks are legacy. |
| 26 | reddit discord timestamp generator | Indie devs (DiscTimestamps, discordts) building these; "became first result for Discord Timestamps" [B]. |
| 27 | keywordtool.io instagram hashtag generator | keywordtool.io/instagram, /x, /tiktok and /youtube pages dominate "hashtag generator + platform". |
| 28 | instagram line break generator caption spacer | postiz, hopperhq, socialbee, pallyy, charactercounter.com, **textspacer.com**, **instalinebreak.com**, socialrails, socialcal, socialmediatoolshub. Uses U+2063 / U+2800. Medium-low competition. |
| 29 | free tool keywords engagement rate calculator hashtag generator | SocialBee ER formula (Likes+Comments+Shares+Saves)/Followers x 100; Keywords Everywhere has a free IG tools suite (fonts, captions, hashtags, calculators); Vaizle AI hashtag. |
| 30 | youtube tag extractor | scrapecreators, commentpicker (2 free/day), tunepocket, miniwebtool, toolsoverflow, seostudio, thunderbit, toolkitsuite, testmuai. **Needs a server fetch** (Data API `snippet.tags`). |
| 31 | youtube timestamp link generator | videodubber, socialvideoplaza, tunepocket, collabpals, seostudio, ytplaylist-len.sharats.dev, **timestamplink.org**, timestampcamera.net. Low competition, pure client-side (`?t=` param). |
| 32 | youtube money calculator volume figures | Adds vling, socialblade/youtube/calculator, youtubemoney.mes.fm, creator-hero, mediacube. |
| 33 | "hashtag generator" search volume | keywordtool shows hashtag usage like #AI 2.4M/mo on Instagram (in-app volume, not Google). |
| 34 | "engagement rate calculator" search volume | searchengineland, integrately, **omnicalculator**, poper. GA4 "engagement rate" cluster is a different intent. |
| 35 | ahrefstop socialblade | socialblade 810.4K search traffic Aug 2026; #1 "social blade" 111.5K [A]. |
| 36 | ahrefstop commentpicker | **commentpicker 463.84K visits (June 2026)**; #1 "comment picker" (2,400 vol); also ranks "flip a coin" [A]. |
| 37 | ahrefstop tunepocket | **tunepocket.com 989.56K visits (July 2026)**, ranked in India. Its free YouTube-tools suite is a proven traffic model [A]. |
| 38 | ahrefstop charactercounter / invisiblecharacter.org | No data. |
| 39 | reddit side project monthly visitors youtube tools | Nothing useful. |
| 40 | fancy/cursive font generator volume | picsart, namecheap visual, fancytextpro, textstudio, font-generator.com, creativefabrica, capitalizemytitle, glyphy. |
| 41 | instagram caption character limit 2200 counter | nuelink, postpone, methodmi, rybbit, charactercounter.com, postwing, iglinebreak, textcharactercounter. **2,200 limit; ~125 visible before "more".** |
| 42 | linkedin text formatter bold italic unicode | supergrow, nuelink, **typefully**, **taplio**, typegrow, linkedgrow, webutility, blabigo. Medium (SaaS lead magnets, DR 50-75). |
| 43 | tiktok money calculator | kajabi, thesocialcat, miniwebtool, creator-hero, **tikcalculator.com** (EMD), amworldgroup, soundcamps; TikTok /discover pages also rank. |
| 44 | youtube playlist length calculator | HN post (Nov 2025), tunepocket, youtubeplaylistlength.org, createthat, ytplaylist-len.sharats.dev, ytools.itsvg.in, Chrome extensions. **Low competition but needs the Data API (server-light).** |
| 45 | youtube subscribe link generator | entreresource, collabpals, seostudio, entendy, youtool, tubetextify, **subscribe-link-generator.com** (EMD), facelessclip, flyn.to, kattwagner. `?sub_confirmation=1` still works in 2026. Low competition. |
| 46 | youtube title length checker | socialvideoplaza, countingtools, charactercounter.com, capitalizemytitle, wordcharactercounter, bushe.co, onlinetoolix. 100-char limit, ~70 shown. Low-medium. |
| 47 | tweet to image converter | **10015.io**, superx, orshot, divbyzero, convertico, codebeautify, twittershots. Needs tweet data (paid X API or oEmbed). |
| 48 | social media image sizes 2026 | socialpilot, mainstreethost, postermywall (Jul 2026), socialbee, **sproutsocial**, **hootsuite (Sep 2026)**, nanoimage, imgscale, screensnap. The informational query is dominated by brands. |
| 49 | youtube channel name generator | **wix, canva, squarespace, vidiq, buffer**, ryrob, thesocialcat, postiz, singlegrain, tunepocket. **High.** |
| 50 | how much does youtube pay per 1000 views (PAA) | wscubetech, studiobinder, hootsuite, learningrevolution, backstage, vamp, post-bridge, stan.store. RPM $2-$10 typical; finance $12-45; Shorts $0.03-0.15; YouTube keeps 45% (long-form). |
| 51 | bluesky / threads character counter | postiz, rybbit, nuelink, brandghost, postpone, ferryman, charactercounter.com/bluesky, bulkpublish. Bluesky **300 graphemes**, bio 256, handle 18; Threads 500. |
| 52 | instagram username generator aesthetic | **canva (2 pages)**, blotato, napoleoncat, socialchamp, thesocialcat, **hootsuite**, spinxo, cuteinternet. High. |
| 53 | small text generator discord | convertcase, pixelied, symboldb, lingojam, fontgenerator.org, discordsfont.com, smalltext.io. Discord now has native `-# ` subtext (2024). |
| 54 | twitch emote resizer | instasize, tacticalliondesigns, streamergiveaway, aiimagine, **emoteresizer.net**, emotetools, realemoteresizer, twitchemote.com, socialcal, popemote. **Low-medium, fully client-side.** |
| 55 | discord colored text generator | GitHub repos, gist, circleboom, **rebane2001.com** (the original), markdowntools, gypu, monni docs, textkits, netlify app. **Low.** |
| 56 | youtube shorts money calculator | collabpals, creaticalc, standardconvert, zebracat, incomefromviews, ytface, saturaai, channelincome. Low-medium. |
| 57 | instagram money calculator | thesocialcat, influencermarketinghub, viralmango, theleap, wask, creator-hero, calculatorsphere, istantcalc. Medium. |
| 58 | instagram grid maker 3x3 | imageonline.io, squareanimage, commoninja, instagramgridmaker.org (EMD), resizebox, designhub, splitimage.im, postplanify, mysocialboutique. Low-medium. |
| 59 | instagram panorama carousel splitter | circleboom, post-bridge, postplanify, poster.ly, splitimage.im, imagesplitteronline, aimagetools, **panosplit.com**, framescrll. Low. |
| 60 | instagram no crop | Mostly Play Store/App Store apps (SquareDroid, INSTFIT, Whitagram), pixelbatch, simpleimageresizer, flexclip. **Low for web tools**, because the SERP is app listings. |
| 61 | youtube thumbnail preview tester | thumbnailtest.com, collabpals, 1of10, wayin, touhfa, thumblifyai, testthumbnail.vercel.app, thumbnailinsight. Low. |
| 62 | youtube banner resizer 2560x1440 | instasize, postiz, imresizer, resizebox, kreatli, imgresize.in, weresize, **youtubebannerresizer.com** (EMD), imagictools. Safe area 1546x423. Low-medium. |
| 63 | circle crop pfp maker | betterpic, **fotor**, capcut, uwarp, circlecropimage.com/.dev, imagy. Medium (overlaps the image category). |
| 64 | youtube watch time calculator 4000 hours | timeskip, upgrowth, collabpals, minitool, akynocalculator, youtubetoolkit, **watchtimecalculator.com** (EMD), tubepilot. Low. |
| 65 | AdSense low value content tool sites 2026 | 2026 articles: AdSense rejects thin utility sites ("information gain"); needs editorial content; AI Overviews cut CTR on informational queries (tools are affected less). |
| 66 | emoji copy and paste | getemoji.com ~2.3M visits (Semrush Aug 2026); "emoji copy and paste" CPC $1.03 [A]. High. |
| 67 | tiktok hashtag generator | nuelink, pallyy, contentstudio, oneupapp, teleprompter, hopperhq, **canva**, mention, **hootsuite**, influencermarketinghub. High. |
| 68 | twitch name generator | mention, brandsnag, codebeautify, codeitbro, geminos, **spinxo**, generaator, namegeneratorcloud, namechk, kudos. Medium. |

## 3. Competitor observations

- **TunePocket** (~990K visits/mo, July 2026) and **CollabPals** have built the exact creator-tool suite we are considering: money calculators, Shorts calculator, watch-time calculator, subscribe link, timestamp link, tag generator/extractor, playlist length, channel name generator and thumbnail previewer. This is the model to copy: many small, specific YouTube tools, all interlinked.
- **SaaS lead-magnet pages** (Postiz, Nuelink, Hopper HQ, SocialBee, Pallyy, Postpone, Rybbit, PostPlanify, Circleboom, Post-Bridge, SocialCal) now occupy positions 3-10 on almost every Instagram/TikTok/X utility query. They have DR 50-80 but their pages are often thin: a widget plus 300-600 words. A 1000+ word page with a better tool can beat them on long-tail terms.
- **Exact-match domains** (igfonts.io, discordtimestamp.com, tikcalculator.com, subscribe-link-generator.com, emoteresizer.net, watchtimecalculator.com, youtubebannerresizer.com, instagramgridmaker.org) show that small single-purpose sites can reach page 1 in these niches. That is a good sign for a new domain.
- **Brands on page 1** (be realistic): Canva, Hootsuite, Wix, Squarespace, vidIQ, Buffer, Adobe and Sprout Social appear for generators (names, hashtags, captions) and for image-size guides. A new domain should not target those head terms in the first 6 months.

## 4. Candidate table

Legend. Comp = competition (L/M/H). Feas: CS = client-side, SL = server-light, X = infeasible. Pri = launch priority (1-10).

| # | Tool | Slug | Primary kw | Est. vol/mo (global EN) | Source | Comp | Feas | AdSense risk | Pri |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Discord Timestamp Generator | discord-timestamp-generator | discord timestamp generator | 30k-80k (cluster incl. "discord timestamp") | [A] hammertime 446K visits (kw in top list); 6+ EMDs [E] | L-M | CS | none | 10 |
| 2 | YouTube Money Calculator | youtube-money-calculator | youtube money calculator | 60k-150k | [E] ~15 dedicated pages incl. IMH, SocialBlade, Sellfy; high CPC | M-H | CS | low | 9 |
| 3 | Instagram Fonts Generator | instagram-fonts | instagram fonts | 150k-300k (cluster: ig fonts, instagram font generator) | [A] igfonts #1 US: 20.1K+13.6K+4K+3.5K+3K visits | M-H | CS | low-medium (thin-page risk) | 8 |
| 4 | Discord Colored Text Generator | discord-colored-text-generator | discord colored text generator | 10k-30k | [E] SERP = GitHub pages & hobby sites | L | CS | none | 9 |
| 5 | YouTube Shorts Money Calculator | youtube-shorts-money-calculator | youtube shorts money calculator | 8k-25k | [E] ~8 dedicated pages, mostly new (2025-26) | L-M | CS | low | 8 |
| 6 | TikTok Money Calculator | tiktok-money-calculator | tiktok money calculator | 20k-60k | [E] Kajabi, EMD tikcalculator.com, TikTok /discover pages | M | CS | low | 8 |
| 7 | Instagram Money Calculator | instagram-money-calculator | instagram money calculator | 10k-30k | [E] IMH, thesocialcat, viralmango, theleap | M | CS | low | 7 |
| 8 | Engagement Rate Calculator (manual input) | engagement-rate-calculator | engagement rate calculator | 15k-40k | [E] Omni, SocialBee, searchengineland; username lookups are a different intent | M | CS | none | 8 |
| 9 | Instagram Grid Maker (3x3 splitter) | instagram-grid-maker | instagram grid maker | 10k-30k | [E] 10+ dedicated tools incl. EMD | L-M | CS | none | 8 |
| 10 | Instagram Carousel / Panorama Splitter | instagram-carousel-splitter | instagram panorama splitter | 5k-15k | [E] panosplit, splitimage, SaaS pages | L | CS | none | 7 |
| 11 | Instagram No Crop (fit to square/4:5) | instagram-no-crop | instagram no crop | 5k-20k | [E] SERP mostly app-store listings | L | CS | none | 7 |
| 12 | Instagram Line Break Generator | instagram-line-break-generator | instagram line break generator | 5k-15k (cluster: caption spacer, IG spacing) | [E] textspacer.com, instalinebreak, SaaS | L-M | CS | none | 8 |
| 13 | Social Media Character Counter (hub) | social-media-character-counter | social media character counter | 5k-15k (hub) + sub-pages | [E] charactercounter.com, postiz, nuelink | M | CS | none | 8 |
| 14 | X (Twitter) Character Counter | twitter-character-counter | twitter character counter | 10k-30k | [E] capitalizemytitle, charactercounter.com, SaaS | M | CS | none | 7 |
| 15 | Instagram Caption Character Counter | instagram-character-counter | instagram character counter | 5k-15k | [E] nuelink, postpone, charactercounter.com | M | CS | none | 7 |
| 16 | YouTube Title Length Checker (and description counter) | youtube-title-length-checker | youtube title length checker | 3k-10k | [E] socialvideoplaza, capitalizemytitle, countingtools | L-M | CS | none | 7 |
| 17 | Bluesky / Threads Character Counter | bluesky-character-counter | bluesky character counter | 1k-5k | [E] SaaS only; grapheme counting is a real differentiator | L | CS | none | 5 |
| 18 | LinkedIn Text Formatter (bold/italic) | linkedin-text-formatter | linkedin text formatter | 8k-25k (cluster: linkedin bold text) | [E] typefully, taplio, supergrow | M | CS | low | 7 |
| 19 | YouTube Timestamp Link Generator | youtube-timestamp-link-generator | youtube timestamp link generator | 5k-15k | [E] tunepocket, collabpals, EMD timestamplink.org | L | CS | none | 8 |
| 20 | YouTube Subscribe Link Generator | youtube-subscribe-link-generator | youtube subscribe link generator | 3k-10k | [E] EMD + small tools | L | CS | none | 7 |
| 21 | YouTube Watch Time Calculator (4,000 h) | youtube-watch-time-calculator | youtube watch time calculator | 5k-15k | [E] EMD watchtimecalculator.com, tunepocket, collabpals | L | CS | none | 8 |
| 22 | YouTube RPM / CPM Calculator | youtube-rpm-calculator | youtube rpm calculator | 3k-10k | [E] Few dedicated pages; high CPC | L-M | CS | none | 6 |
| 23 | YouTube Thumbnail Previewer / Tester | youtube-thumbnail-preview | youtube thumbnail preview | 3k-10k | [E] thumbnailtest, 1of10, collabpals | L | CS | low (use generic UI mockup, no YouTube logo) | 7 |
| 24 | YouTube Banner Resizer (2560x1440 + safe area) | youtube-banner-resizer | youtube banner resizer | 3k-10k (+"youtube banner size" 30k-60k info) | [E] instasize, postiz, EMD | L-M | CS | none | 7 |
| 25 | Twitch Emote Resizer (and badge) | twitch-emote-resizer | twitch emote resizer | 5k-15k | [E] 10 dedicated sites incl. EMDs | L-M | CS | none | 7 |
| 26 | Discord Emoji / Sticker Resizer | discord-emoji-resizer | discord emoji resizer | 2k-8k | [E] Covered only as a side feature of emote resizers | L | CS | none | 5 |
| 27 | Discord Fonts / Text Formatter (markdown preview) | discord-text-formatter | discord fonts | 10k-30k (cluster: discord fonts, discord text formatting) | [E] discordsfont.com, guides from beebom/techpp | L-M | CS | low | 6 |
| 28 | YouTube Embed Code Generator | youtube-embed-code-generator | youtube embed code generator | 1k-5k | [E] small tools | L | CS | none | 5 |
| 29 | YouTube Tag Generator (deterministic) | youtube-tag-generator | youtube tag generator | 30k-80k | [E] vidIQ, keywordtool.io, tunepocket, commentpicker | H | CS (keyword permutations only) | low | 4 |
| 30 | Hashtag Generator (Instagram / TikTok, curated lists) | hashtag-generator | instagram hashtag generator | 20k-60k per platform | [E] keywordtool.io, Canva, Hootsuite | H | CS (static curated DB) | low-medium (don't promote banned/spam tags) | 4 |
| 31 | Hashtag Counter & Formatter | hashtag-counter | hashtag counter | 1k-3k | [E] few dedicated pages | L | CS | none | 5 |
| 32 | YouTube Channel Name Generator | youtube-channel-name-generator | youtube channel name generator | 20k-50k | [E] Canva, Wix, Squarespace, vidIQ, Buffer | H | CS (template combos) | low | 3 |
| 33 | Instagram Username Generator | instagram-username-generator | instagram username generator | 15k-40k | [E] Canva x2, Hootsuite, SpinXO | H | CS | low | 3 |
| 34 | Twitch Name Generator | twitch-name-generator | twitch name generator | 5k-15k | [E] spinxo, mention, codebeautify | M | CS | low | 4 |
| 35 | Instagram Bio Generator / Templates | instagram-bio-generator | instagram bio generator | 10k-30k | [A] captions.ai #1 "instagram bio ideas" 3.8K visits | M-H | CS (templates) | low | 4 |
| 36 | YouTube Description Template Generator | youtube-description-generator | youtube description generator | 3k-10k | [E] Mostly AI tools | M | CS (template builder + chapters) | none | 5 |
| 37 | YouTube Tag Extractor (roadmap) | youtube-tag-extractor | youtube tag extractor | 10k-25k | [E] tunepocket, commentpicker, seostudio | M | SL (YouTube Data API v3, free key) | low (use official API, no scraping) | 5 |
| 38 | YouTube Playlist Length Calculator (roadmap) | youtube-playlist-length-calculator | youtube playlist length | 10k-30k | [E] HN launch Nov 2025; EMDs | L-M | SL (Data API) | none | 6 |
| 39 | Emoji Picker / Copy & Paste | emoji-copy-paste | emoji copy and paste | 100k-300k | [A] getemoji 2.3M visits; CPC $1.03 | H | CS | none | 3 |
| 40 | Aesthetic Symbols / Text Symbols | aesthetic-symbols | aesthetic symbols copy and paste | 20k-60k | [E] fsymbols, coolsymbol, emojicombos | M-H | CS | none | 4 |

**Dropped or excluded:**
- **Tweet to image from a URL.** Needs paid X API or scraping. A version that builds an image from typed text is a "fake tweet generator", which carries **impersonation / misrepresentation risk** (AdSense misrepresentative content, X brand rules). If we ever build it, frame it as "Quote card maker" with no X branding and no fake handles or verified badges.
- **Username availability checker.** Needs a server to probe many platforms, and rate limits plus platform ToS make this fragile. Infeasible now.
- **Best time to post.** Content page only. Dominated by Hootsuite, Sprout, Later and Buffer (high). Can be a supporting blog post.
- **Follower / like / view "generators" or "increasers", Instagram "who viewed my profile", private Instagram viewer, story viewer.** Excluded under ToS and AdSense (deceptive or engagement fraud).
- **All downloaders:** YouTube/IG/TikTok video, reel, story, thumbnail and profile-picture downloaders. Hard exclusion.
- **YouTube/Instagram giveaway comment picker.** Needs the API. IG comments require business auth, so infeasible. YouTube version is server-light at best, and commentpicker dominates.

## 5. Per-tool content notes (for writers): People Also Ask questions and long-tail phrases

### Discord Timestamp Generator
- PAA: How do you make a timestamp on Discord? What is the Discord timestamp format? How do Discord timestamps work across time zones? What does `<t:1700000000:R>` mean? How do I get a Unix timestamp? Can bots use timestamps? Why is my Discord timestamp showing wrong? How do I make a countdown on Discord?
- Long-tail: discord timestamp generator, discord timestamp, discord time converter, discord timestamp format, discord relative time, discord countdown timestamp, hammertime alternative, discord unix timestamp, discord time zone converter, discord snowflake to date (useful sub-tool: Snowflake ID to timestamp).
- Formats to document: t (short time), T (long time), d (short date), D (long date), f (default short date/time), F (long date/time), R (relative).

### Discord Colored Text Generator / Discord Text Formatter
- PAA: How do you color text in Discord? Does colored text work on Discord mobile? (ANSI renders on desktop/web, not reliably on mobile.) How do I make red/green text in Discord? How to bold/italic/underline/strikethrough/spoiler in Discord? How to make small text in Discord (`-# `)? How to make headers in Discord (`#`, `##`, `###`)?
- Long-tail: discord color text, discord ansi colors, discord text colors, discord red text, discord markdown, discord formatting, discord code block colors, discord fonts, discord bold text, discord spoiler text, discord subtext.
- Technical notes: an ```ansi block plus ESC[31m style codes (30-37 foreground, 40-47 background, 1 bold, 4 underline); the older diff/fix/yaml/css tricks.

### YouTube Money Calculator / Shorts / RPM
- PAA: How much does YouTube pay per 1,000 views? How much does 1 million views pay? How much do YouTubers make? What is a good RPM? RPM vs CPM? How much do YouTube Shorts pay? Which niches pay the most? How many views do you need to make $1,000? When do you get paid (AdSense threshold $100)? What are the YPP requirements (1,000 subs + 4,000 h or 10M Shorts views in 90 days; the lower tier is 500 subs)?
- Long-tail: youtube earnings calculator, youtube revenue calculator, youtube income calculator, how much does youtube pay, youtube pay per view calculator, youtube cpm by niche, youtube rpm calculator, youtube shorts earnings calculator, youtube shorts rpm, 1 million views youtube money, youtube money calculator india/uk/usa.
- Data points (label them as ranges and cite sources): RPM $2-$10 typical; finance $12-$45; entertainment $0.50-$3; Shorts $0.03-$0.15; YouTube keeps 45% on long-form and 55% on Shorts' allocated pool.
- AdSense note: present these as estimates with a disclaimer. Don't promise income; that avoids "misleading claims".

### TikTok / Instagram Money Calculator
- PAA: How much does TikTok pay per 1,000 views? What is the TikTok Creator Rewards Program (1-min+ videos, 10K followers, 100K views/30 days)? How much do Instagram influencers make per post? How much should I charge for a sponsored post? How many followers do you need to get paid on Instagram?
- Long-tail: tiktok money calculator, tiktok earnings calculator, tiktok creator rewards calculator, tiktok rpm, how much does tiktok pay per million views, instagram money calculator, instagram sponsored post rate calculator, influencer rate calculator, influencer pricing calculator, how much to charge for a sponsored post.
- Rates: IG ~$10 per 1K followers per post rule of thumb; nano $10-100, micro $100-500, mid $500-5K.

### Engagement Rate Calculator
- PAA: How do you calculate engagement rate? What is a good engagement rate on Instagram/TikTok/LinkedIn/YouTube? Engagement rate by followers vs by reach vs by impressions? Does engagement rate include saves/shares? Why is my engagement rate dropping?
- Long-tail: engagement rate calculator, instagram engagement rate calculator, tiktok engagement rate calculator, engagement rate formula, how to calculate engagement rate, engagement rate by reach, average engagement rate instagram 2026, linkedin engagement rate calculator, youtube engagement rate.
- Formula: (likes + comments + shares + saves) / followers x 100. Also ERR (by reach) and by impressions.

### Instagram Fonts (and Discord / TikTok fonts variants)
- PAA: How do you change the font on Instagram bio? What fonts can you use on Instagram? How do I get fancy fonts in my Instagram bio? Are Instagram fonts safe? Why do some fonts show as boxes? Can screen readers read fancy fonts? What font does Instagram use?
- Long-tail: instagram fonts, ig fonts, instagram font generator, instagram bio fonts, instagram fonts copy and paste, cool fonts for instagram, aesthetic fonts instagram, cursive font instagram, bold font instagram, tiktok fonts, discord fonts, fonts for fortnite name.
- Must include: an accessibility caveat (screen readers) and an explanation of the Unicode Mathematical Alphanumeric Symbols block. This adds the "information gain" AdSense wants.

### Instagram Line Break Generator
- PAA: How do I add line breaks in an Instagram caption? Why does Instagram remove my spacing? How do I add space between paragraphs on Instagram? How do I center my Instagram bio? What invisible character works for line breaks?
- Long-tail: instagram line break, instagram caption spacer, instagram line spacing, instagram paragraph spacing, line break instagram bio, how to space out instagram caption, instagram enter space.

### Social Media Character Counters (hub + sub-pages)
- Limits (2026): X 280 (Premium 25,000); Instagram caption 2,200 (125 visible), bio 150, username 30; TikTok caption 4,000, bio 80; LinkedIn post 3,000 (~210 before "see more"), headline 220, about 2,600; Facebook post 63,206; YouTube title 100 (~70 shown), description 5,000, tags 500 total; Pinterest title 100, description 500; Threads 500; Bluesky 300 graphemes, bio 256, handle 18.
- PAA: What is the character limit for X / Instagram / TikTok / LinkedIn / Threads / Bluesky? Do emojis count as 2 characters on Twitter? Do links count on X (23 chars)? How long should a YouTube title be?
- Long-tail: twitter character counter, tweet length checker, x character limit, instagram caption length, instagram character limit, tiktok caption character limit, linkedin character counter, linkedin headline character limit, youtube title character limit, youtube description character limit, youtube tags character limit, pinterest description length, threads character limit, bluesky character limit.
- Differentiators: X-style weighted counting (CJK = 2, URLs = 23), grapheme counting for Bluesky, a "visible before more" preview line, and a hashtag count.

### LinkedIn Text Formatter
- PAA: How do you bold text on LinkedIn? Can you italicize on LinkedIn? Does bold text hurt LinkedIn reach? Is Unicode bold accessible? How to add bullet points on LinkedIn?
- Long-tail: linkedin bold text, linkedin italic text, linkedin text formatter, linkedin post formatter, bold text for linkedin, linkedin underline text, linkedin bullet points.

### Instagram Grid Maker / Carousel Splitter / No Crop
- PAA: How do I split a picture into 9 for Instagram? How do I post a panorama on Instagram? What size is an Instagram carousel (1080x1350)? How do I post a full picture on Instagram without cropping? How to add a white border for Instagram? Does Instagram's 2025 grid change (3:4 profile tiles) affect grids?
- Long-tail: instagram grid maker, instagram grid splitter, split image into 9, 3x3 grid instagram, instagram puzzle feed, instagram panorama, seamless carousel, carousel splitter, swipeable panorama, instagram no crop, fit whole photo instagram, white border instagram, instagram 4:5 resize.
- Note: in 2025 Instagram moved profile grid thumbnails to 3:4. Mention this and offer 3:4 and 4:5 tile options (differentiator).

### YouTube Timestamp / Subscribe / Embed links
- PAA: How do I share a YouTube video at a specific time? How do I link to a timestamp in YouTube? How do I make a subscribe link? Does sub_confirmation still work? How do I embed a YouTube video with start/end time, autoplay, loop, no controls? How do I create chapters?
- Long-tail: youtube timestamp link, youtube link at specific time, youtube start time link, youtube time link generator, youtube subscribe link, youtube auto subscribe link, youtube embed code generator, youtube embed start time, youtube chapters generator.

### YouTube Watch Time Calculator
- PAA: How many views do I need for 4,000 watch hours? Do Shorts count toward watch hours? How long does it take to get 4,000 hours? What counts as public watch time?
- Long-tail: youtube watch time calculator, 4000 hours calculator, watch hours to views, youtube monetization calculator, how many views for 4000 hours.

### YouTube Title Checker / Thumbnail Previewer / Banner Resizer
- PAA: How long should a YouTube title be? What is the YouTube thumbnail size (1280x720, 2MB)? What is the YouTube banner size (2560x1440, safe area 1546x423, 6MB)? How do I preview my thumbnail before uploading?
- Long-tail: youtube title length, youtube title checker, youtube thumbnail tester, thumbnail preview, youtube banner size, youtube banner resizer, channel art size, youtube banner safe area template.

### Twitch Emote Resizer / Discord Emoji Resizer
- PAA: What size are Twitch emotes (112/56/28, max 1MB)? Twitch sub badge size (72/36/18)? Discord emoji size (128x128, 256KB)? Discord sticker size (320x320, 512KB)?
- Long-tail: twitch emote resizer, twitch emote size, twitch badge size, discord emoji size, discord emoji resizer, discord sticker size, 7tv emote size, bttv emote size.

## 6. AdSense / platform ToS risk notes

- **Unicode font generators:** allowed, but the SERP is full of thin pages. AdSense "low value content" risk if the page is only the widget. Each page needs 1000+ words of original explanation (Unicode blocks, accessibility, platform support).
- **Money calculators:** fine. Show clear "estimate only" disclaimers. Avoid "get rich" language.
- **Anything implying fake engagement or fake posts:** excluded (fake tweet, fake follower counts, "get free followers").
- **Platform branding:** use the platform names in text (fair descriptive use). Don't use official logos or colours in a way that implies affiliation. Add a "not affiliated with ..." line.
- **Official APIs only** for roadmap SL tools (YouTube Data API v3). Never scrape YouTube or Instagram HTML.
- **Invisible character:** low risk. Don't use "bypass filters / evade bans" language.

## 7. Recommended launch set (this category)

Launch (all client-side):
1. discord-timestamp-generator
2. youtube-money-calculator
3. discord-colored-text-generator
4. instagram-fonts
5. youtube-shorts-money-calculator
6. tiktok-money-calculator
7. engagement-rate-calculator
8. instagram-grid-maker
9. instagram-line-break-generator
10. social-media-character-counter (hub)
11. youtube-timestamp-link-generator
12. youtube-watch-time-calculator

Month 2-3: instagram-money-calculator, twitter-character-counter, instagram-character-counter, youtube-title-length-checker, linkedin-text-formatter, instagram-carousel-splitter, instagram-no-crop, youtube-thumbnail-preview, youtube-banner-resizer, twitch-emote-resizer, youtube-subscribe-link-generator, youtube-rpm-calculator.

Month 4-6: discord-text-formatter (fonts), discord-emoji-resizer, bluesky-character-counter, youtube-embed-code-generator, youtube-description-generator, hashtag-counter, youtube-playlist-length-calculator (SL), youtube-tag-extractor (SL), then the brand-heavy generators for topical completeness.
