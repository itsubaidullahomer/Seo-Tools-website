# Image & Media Tools (browser-only, Canvas / WebAssembly) — Raw Keyword Research Notes

Researcher role: senior SEO keyword researcher, "free online tools" niche. Category: image & media tools that run 100% client-side.
Date: 2026-09-29. Target: brand-new domain, zero authority, AdSense monetization, Next.js static on Vercel.

---

## 0. Method, environment limits, and how to read the numbers

**What happened in this session (be aware when reading volumes):**

- The shared `WebSearch` budget for the session was already exhausted (200/200) before this category started, so **zero live Google/Bing searches were possible**.
- The container's egress proxy **blocked every third-party domain** tried (iloveimg.com, tinywow.com, 10015.io, redketchup.io, smallseotools.com, ahrefs.com, semrush.com, bing.com, duckduckgo.com, wikipedia, reddit, squoosh.app, tinypng.com, favicon.io, realfavicongenerator.net, imagecolorpicker.com, ezgif.com, imgflip.com, similarweb.com, explodingtopics.com, keywordtool.io, wordstream.com, moz.com, freeconvert.com, cloudconvert.com, onlinepngtools.com, photopea.com, placehold.co, qr-code-generator.com, qrcode-monkey.com, barcode.tec-it.com, jimpl.com, coolors.co, canva.com, pinetools.com, imageresizer.com, resizepixel.com, suggestqueries.google.com). Only **github.com and raw.githubusercontent.com** were reachable.
- Therefore all evidence below comes from **keyword-tool exports and research documents that other builders committed to public GitHub repositories**, found with ~45 GitHub code searches and ~40 raw-file fetches, plus the sibling researchers' notes already in this folder (`seo.md`, `text-writing.md`). The most valuable finds are genuine tool exports:
  1. **Semrush US-database JSON exports** (repo `AndrewLaws/webcaretakers`, `research/_semrush-*.json`, generated ~April 2026; the repo's ROADMAP states "SEMrush set to United States / us database"). Fields: Keyword, Search Volume, CPC, Competition (paid), Trends. Files parsed: image-compressor, convert-png-to-jpg, convert-jpg-to-webp, image-cropper, photo-resizer, exif-viewer, base64-encoder, hex-to-rgb, ratio-calculator, color-contrast-checker.
  2. **Ahrefs Global-English keyword export summary** (repo `iamadityaanjana/opentools`, `docs/seo/keyword-map.md`, export dated 2026-07-10, 30,000-row workbook; volume + KD for HEIC/PNG-to-PDF/AVIF/ICO/JPEG-to-PNG rows).
  3. **seodata.dev US keyword samples** (repo `onovich/LitPng`, `research/keyword-results.us.sample.json` + `market-feasibility.md`, sampled 2026-05-31; US volume + CPC + ads competition for the compressor cluster).
  4. **Google Keyword Planner exports**: (a) `easyjpgtopdf/DocTools h1_keyword_analysis.csv` (country not stated; magnitudes look like a single large English market), (b) `narenderchaudhary/toolskaro STRATEGY.md` ("real India volumes, Google Ads, May 2026"), (c) `ColdstartLabs-ca/myimageupscaler.com docs/PRDs/tools-enhancement-keyword-driven.md` ("Google Keyword Planner research, 12,623 keywords" — magnitudes are all-locations/broad), (d) `ThatHunky/obrobka docs/seo/2026-09-25-volumes-ua.csv` (Ukraine; useful only for the *relative* ranking of conversion pairs).
  5. **Per-keyword traffic from Ahrefs-style/Semrush pages quoted in** `minalGoel/micro-tools` "SEO Reality for Tool Pages in 2026" (imageresizer.com, simpleimageresizer.com, 11zon, pdf24 keyword-level visits, DR, referring domains).
  6. Lower-credibility planning docs (`jomard44/pixeltools PRD.md`, `Divyanshu1Dubey/BlogGhar`, `amreinch/removebg-pro SEO_COMPLETE.md`, `PrashantPatil-2005/jest 02-market-research.md`, `eruo005-dev/alltoolsbase`, `arocebd/photoResizer SEO-ADSENSE-GUIDE.md`) — quoted only as secondary corroboration and flagged as such.
- **Every volume in this file is a range.** Where a hard number is cited, the source and its geography are named. Where no export existed, the figure is marked **estimate** (triangulated from adjacent exported terms, relative rankings in the Ukraine/India exports, competitor coverage, and my own prior knowledge of these SERPs) — treat those as directional.
- Competition calls are based on the competitor lists in the above docs plus prior knowledge of who ranks (flagged). "People also ask" questions are **derived** (no live SERP access) from the guide clusters in the opentools/ComplianTools docs plus typical PAA patterns for each query; writers should verify against a live SERP before publishing.

**Key structural facts learned (from micro-tools SEO-reality doc, which quotes Semrush/Ahrefs-style data):**
- imageresizer.com: DR 74, 3.3K referring domains, ~4.6M search visits/mo (Oct 2025). Ranks #1 US for "resize image" (44.8K visits/mo from that keyword) and "image resizer" (34.8K), #2 for "image compressor" (10.9K) and "image cropper" (8.2K). "meme generator" is among its top-5 keywords. Its flagship pages are minimal: tool + short "how to" + bullets. Each flagship keyword is only ~1% of site traffic → traffic is spread across many tools.
- simpleimageresizer.com: DR 63, 1.4K referring domains, ~980K visits/mo; "image resizer" #2 in India = 176K visits/mo; "resize image to 100kb" #1 India = 33K visits/mo. A single resize cluster = ~27% of its traffic.
- 11zon.com: DR 71, 893 referring domains, ~3.1M visits/mo (India-heavy); "jpg to pdf" rank 6 India = 400K visits/mo.
- Observed floor to rank top-3 globally for head image terms: **DR 60-70+ and 1,000+ referring domains**. A DR 20-30 site is "effectively invisible" for head terms within 1-2 years. → For a new domain, the plan must be long-tail + format-pair + size-target + privacy-angle pages, with head terms as hubs.
- Ranking pages are tools, not 3,000-word articles; content depth is short. Our 1,000+ words must be genuinely useful (format facts, quality/transparency/metadata caveats, platform size tables, FAQs), not filler.

---

## 1. Log of searches and fetches (in order)

WebSearch attempts (all refused — budget exhausted): "image compressor" monthly search volume keyword; "image resizer" OR "resize image" keyword search volume ahrefs semrush; "heic to jpg" search volume keyword; "png to jpg" "jpg to png" "webp to png" search volume; most searched free online tools keywords list image converter compressor 2025 2026; "favicon generator" search volume keyword difficulty.

WebFetch attempts (blocked by egress proxy): iloveimg.com, tinywow.com/tools/image, 10015.io, redketchup.io, smallseotools.com/image-editing-tools/. Google autocomplete endpoint (suggestqueries.google.com) blocked for all 30 seed terms.

GitHub code searches run (mcp github search_code):
1. "image compressor" "search volume" extension:csv → DocTools h1_keyword_analysis.csv
2. "heic to jpg" "png to jpg" volume extension:csv → obrobka UA volumes
3. "image compressor" "image resizer" "favicon generator" keywords volume extension:md → opentools keyword-map, open-utility-tools MASTER-TOOL-LIST, teamz TOOLS.md, complianttools README, pixeltools PRD, BlogGhar, simpletoolset ai-index, NoUploadTools, CodelithLabs, TriMaiTM tool-bundle
4-6. repo searches for browser image tool suites (0 results with that syntax)
7. "image to base64" volume kd → noise
8. "aspect ratio calculator" volume → rate-limited, retried
9. "exif" "search volume" metadata viewer remover → pixeltools PRD, myimageupscaler pseo-expansion-plan
10. "passport photo" "search volume" → myimageupscaler pseo plan, formready SOW
11. "svg to png" "search volume" → complianttools README, ai-passive-income build-spec, myimageupscaler
12. "color palette" image extractor "search volume" → colorSnap blog ("image color picker online" 2,400+/mo)
13. "favicon generator" "search volume" OR "monthly searches" → 0
14. "aspect ratio calculator" "search volume" OR "monthly searches" → 0
15. "qr code generator" "search volume" monthly → fighttechvn ("qr code scanner" 9,900 US Semrush via FreeQR blog), removebg-pro SEO_COMPLETE, HuyVo117/Create-QR ("wifi qr code generator" 3,800+/mo), alltoolsbase, rdb420 utility report
16. repo:iamadityaanjana/opentools path:docs/seo → keyword-map.md, competitive-analysis.md, operations.md
17. "webp to png" "png to jpg" "jpg to png" 9900 OR 12100 ... → 0
18. "meme generator" "search volume" → rate-limited x3, then 0
19. "compress image to 100kb" OR "resize image to 50kb" ... → 0 (but toolskaro STRATEGY.md has them)
20. "barcode generator" "searches/month" → removebg-pro (40K)
21. "image to base64" OR "base64 to image" "monthly searches" → 0
22. "youtube thumbnail size" OR "instagram post size" OR "resize image for instagram" "monthly searches" → 0 (photoResizer doc found later has "resize image for instagram" 12,100)
23. "video to gif" OR "gif to mp4" OR "gif maker" "monthly searches" → 0
24. "Avg. monthly searches" "png to jpg" ... extension:csv → 0
25. "heic2any" filename:package.json → 4,088 repos (feasibility signal)
26. "@ffmpeg/ffmpeg" filename:package.json gif → 652 repos (feasibility signal)
27. "iloveimg.com" visits traffic similarweb → micro-tools SEO-reality doc, myimageupscaler competitive landscape
28. "tinypng.com" OR "squoosh.app" OR "imageresizer.com" similarweb → only top-site lists (tinypng/squoosh are in Alexa/Tranco top-10k lists)
29. "placeholder image generator" "monthly searches" → 0
30. "png to jpg" "volume" "cpc" extension:json → **webcaretakers _semrush-convert-png-to-jpg.json**
31. "image compressor" OR "compress image" "cpc" volume → **LitPng research (seodata US)**, toolskaro (India), photoResizer guide, webcaretakers _semrush-image-compressor.json
32. "people also ask" heic ... → 0 (twice)
33. repo:AndrewLaws/webcaretakers path:research → 52 files incl. 10 relevant _semrush exports
34. repo:onovich/LitPng path:research → 6 files
35. "Search Volume" "CPC" "Competition" "favicon generator" OR ... extension:json → 0
36. "Search Volume" "favicon generator" extension:json → tool lists only
37. "Search Volume" "heic to jpg" → DocTools only
38. "Search Volume" "webp to png" → webcaretakers jpg-to-webp export (165,000)
39. "Search Volume" "qr code generator" "CPC" → noise
40. "Search Volume" "meme generator" OR "passport photo" OR "aspect ratio calculator" → mytulify tool list only
41. "favicon generator" volume searches keyword extension:md → pixeltools PRD (350,000 global), MarsX devhunt product-led-growth-ideas (has Global/US/SD/CPC table; not fetched)
42. "aspect ratio calculator" volume searches keyword extension:md → ksjpswaroop/boring-sites (15K-30K, Low), calccrunch backlog
43. "passport photo" volume searches keyword extension:md → myimageupscaler long-tail roadmap, cafemitra SEO plan (India queries), cropmark BLUEPRINT (DS-160 600x600 <240KB; PAN 20KB specs)
44. "svg to png" volume searches keyword extension:md → myimageupscaler tools-enhancement PRD ("svg to png" 301K/mo)
45. "image to base64" volume searches keyword extension:md → jest market research (Image to Base64 200K+ tier)
46. repo:ColdstartLabs-ca/myimageupscaler.com "K/mo" → 0 (already fetched raw)

Raw files fetched and parsed (raw.githubusercontent.com): opentools keyword-map.md / competitive-analysis.md / operations.md; DocTools h1_keyword_analysis.csv; obrobka 2026-09-25-volumes-ua.csv; pixeltools PRD.md; BlogGhar research plan; image.complianttools.com README (306KB build spec, section 24 SEO clusters); open-utility-tools MASTER-TOOL-LIST.md; teamz-lab TOOLS.md; myimageupscaler pseo-expansion-plan.md, COMPETITIVE_LANDSCAPE_ANALYSIS.md, tools-enhancement-keyword-driven.md, long-tail-keyword-roadmap.md; removebg-pro SEO_COMPLETE.md; rdb420 Utility Website Opportunity Research Report.md; alltoolsbase HIGH_DEMAND_ROADMAP.md; jest 02-market-research.md; omni-tools README; MikuTools README; webcaretakers 10x _semrush-*.json, _priorities.md, candidates.txt, README.md, ROADMAP.md; LitPng market-feasibility.md + keyword-results.us.sample.json; toolskaro STRATEGY.md; photoResizer SEO-ADSENSE-GUIDE.md; micro-tools "SEO Reality for Tool Pages in 2026"; boring-sites Boring_Utility_Sites_Making_Money_2026.md. Also GitHub page fetch of GoogleChromeLabs/squoosh (26K stars; WASM codecs mozjpeg/webp/avif/oxipng; all local).

---

## 2. Hard volume data collected (verbatim from exports)

### 2a. Semrush US database (webcaretakers exports, ~Apr 2026). Volume / CPC / paid competition
| Keyword | US vol | CPC | Comp |
|---|---:|---:|---:|
| webp to png | 165,000 | $0.85 | 0.01 |
| webp to jpg | 110,000 | $0.01 | 0.02 |
| image resizer | 110,000 | $1.04 | 0.11 |
| jpg (generic) | 74,000 | $0.22 | 0.16 |
| png (generic) | 74,000 | $0.73 | 0.01 |
| png to jpg | 49,500 | $0.66 | 0.04 |
| image compressor | 49,500 | $0.47 | 0.08 |
| resize image | 49,500 | $0.63 | 0.22 |
| file compressor | 40,500 | $0.56 | 0.13 |
| base64 decode | 40,500 | $0.97 | 0 |
| jpg to png | 33,100 | $0.32 | 0.08 |
| png converter | 33,100 | $0.95 | 0.11 |
| crop (generic) | 27,100 | $0.59 | 0.01 |
| img compressed | 27,100 | $0.47 | 0.08 |
| photo compressor | 27,100 | $0.47 | 0.08 |
| ratio calculator | 27,100 | $1.04 | 0 |
| convert to jpg | 22,200 | $0.61 | 0.06 |
| jpg converter | 22,200 | $0.66 | 0.08 |
| convert webp to jpg | 22,200 | $0.01 | 0.08 |
| compress image | 22,200 | $0.50 | 0.08 |
| crop image | 22,200 | $0.77 | 0.10 |
| tinypng (brand) | 22,200 | $0.89 | 0.11 |
| jpeg (generic) | 22,200 | $1.08 | 0.04 |
| image cropper | 18,100 | $0.80 | 0.09 |
| rgb to hex | 18,100 | $0.06 | 0.01 |
| compress (generic) | 18,100 | $1.14 | 0.29 |
| pixlr editor (brand) | 18,100 | $0.82 | 0.03 |
| change size of image | 14,800 | $0.63 | 0.22 |
| image frame size | 14,800 | $0.24 | 1.00 |
| base64 encode | 14,800 | $1.18 | 0 |
| convert png to jpg | 12,100 | $0.67 | 0.19 |
| png to webp | 12,100 | $2.39 | 0.01 |
| webp to jpeg | 12,100 | $0.01 | 0.02 |
| photo resizer | 12,100 | $0.87 | 0.31 |
| image size reducer | 12,100 | $0.72 | 0.15 |
| reduce image size | 12,100 | $0.72 | 0.15 |
| minimize pic size | 12,100 | $0.72 | 0.15 |
| image resolution decrease | 12,100 | $0.72 | 0.15 |
| webp (generic) | 9,900 | $1.44 | 0.01 |
| hex to rgb | 9,900 | $0.03 | 0.03 |
| color contrast checker | 9,900 | $3.40 | 0.01 |
| exiftool (software) | 8,100 | $0.10 | 0.01 |
| jpg to webp | 6,600 | $1.95 | 0.01 |
| metadata viewer | 6,600 | $6.82 | 0.15 |
| contrast checker | 6,600 | $2.41 | 0.01 |
| .webp to png | 5,400 | $0 | 0 |
| jpeg to webp | 5,400 | $1.95 | 0.01 |
| exif data | 4,400 | $0.71 | 0.01 |
| base64 encoder | 4,400 | $1.18 | 0 |
| exif | 2,900 | $1.14 | 0.01 |
| exif data viewer | 2,900 | $0.48 | 0.01 |
| chrome plugin color picker | 2,900 | $2.39 | 0 |
| exif viewer | 2,400 | $0.36 | 0.01 |
| exif tool | 2,400 | $0.10 | 0.01 |
| data exif | 2,400 | $0.71 | 0.01 |
| convert jpg to webp | 1,000 | $1.06 | 0.04 |
Trend note: "webp to png" trend string is flat at 1.00 for most months (steady, not seasonal); "image resizer" flat 0.30 (steady); "png to jpg" 0.81-1.00 (steady).

### 2b. seodata.dev US sample (LitPng, 2026-05-31). Volume / CPC / ads competition
image compressor 60,500 / $1.84 / 0.05 · image compression 60,500 / $1.62 · tinypng 22,200 / $3.33 · compress png 22,200 / $2.73 · png compressor 22,200 / $0.88 · compress jpg 18,100 / $3.56 · jpeg compressor 6,600 / $2.99 · compress images online 3,600 / $1.71 · online image compressor 2,400 / $1.97 · bulk image compressor 480 / $4.28 · batch image compressor 70.
(Interpretation from the same doc: head demand strong; "batch/bulk" tiny volume but high CPC; ads competition is not organic difficulty.)

### 2c. Ahrefs Global-English export (opentools, 2026-07-10). Volume / KD
how to convert HEIC to JPG 110,000 / KD 39 · PNG to PDF 110,000 / 46 · AVIF to JPG 33,100 / 44 · AVIF to PNG 27,100 / 38 · reduce PDF file size 18,100 / 61 · PNG to ICO 18,100 / 49 · PDF size reducer 12,100 / 54 · PDF to JPG 12,100 / 62 · PDF to text 9,900 / 43 · JPEG to PNG 9,900 / 32 · ICO converter 5,400 / 28 · HEIF to JPG 5,400 / 21.

### 2d. Google Keyword Planner exports
- **DocTools CSV (country unstated):** jpg to pdf 165,000 · image to pdf 90,500 · remove background 135,000 · background remover online 90,500 · compress pdf 60,500 · pdf to jpg 49,500 · exif data remove 40,500 · resize image 33,100 · resize image online free 33,100 · compress image 27,100 · image resizer 22,200 · image editor 22,200 · ai image generator 22,200 · image compressor 18,100 · image repair 18,100 · watermark image 14,800 · add watermark to image 14,800 · image cropper 14,850 · image watermark 12,100 · ocr image 12,100 · image to text converter 9,900 · photo enhancer 3,000 · (heic to jpg, webp to png, png to ico, svg to png, avif to jpg, png to webp, jpg to webp, tiff to png each shown as 500 — clearly a placeholder/floor value in that file, ignore).
- **toolskaro (India, Google Ads, May 2026):** age calculator 9.14M · jpg to pdf 7.48M · remove background 6.12M · pdf to jpg 4.09M · image resizer 1.5M (+ resize image 1.22M, photo resizer 1.22M) · qr code generator 1.22M · image compressor 1.0M (+ photo compressor 1.0M) · compress image 673K · passport size photo 550K (+ passport size photo maker 368K) · remove background from image 135K · **reduce image size in kb 110K** · signature resize 74K · **compress image to 100kb 60.5K** · **compress image to 20kb 49.5K** · **compress jpg to 50kb 33.1K** · resize photo in kb 12.1K · add date on photo 1,000. (India = large volume, low CPC; exam-form use case.)
- **myimageupscaler PRD (KP, 12,623 keywords, all-locations magnitudes):** image compressor ~1.5M (+50% YoY) · heic to jpg 1.22M (+22% YoY cluster) · heic to png 201K · svg to png 301K · pdf to jpg 9.1M · pdf to png 823K · image to pdf 3.3M · jpg to pdf 3.3M · png to pdf 301K · background remover cluster ~15M (+23%) · change picture background 673K (-18%) · image to text converter 368K (-18%) · photo quality enhancer 550K · make image transparent 40K · make background transparent 18K · collage maker 27K. Same repo's earlier plan (tier labels): image resizer 500K+, image cropper 200K+, aspect ratio calculator 100K+, dpi converter 50K+, image compressor 300K+, png to jpg 200K+, jpg to png 150K+, webp converter 100K+, heic to jpg 100K+, svg to png 50K+, image to pdf 200K+, photo collage 150K+, passport photo 100K+, image color picker 50K+, metadata viewer 50K+, image comparison slider 30K+, thumbnail generator 100K+.
- **Ukraine (obrobka, 2026-09-25) — relative ranking only:** webp to jpg 12,100 > heic to jpg 9,900 = webp to png 9,900 > jpg to png / png to jpg / png to webp 5,400 > avif to jpg 3,600 > avif to png 2,400 > heic to jpeg / heic to png / jpg to webp 1,900 > favicon 1,300 > favicon generator 880 > exif 320 > png to avif 260 > og image 170.

### 2e. Other quoted figures (secondary credibility)
- removebg-pro SEO_COMPLETE (source unstated): remove background 450K · pdf to word 350K · qr code generator 300K · compress image 200K · resize image 180K · ocr online 150K · crop image 80K · convert image 70K · watermark image 50K · barcode generator 40K.
- photoResizer SEO guide (source unstated): resize image online free 90,500 · compress image 74,000 · convert png to jpg 60,500 · remove background from image 110,000 · pdf to jpg converter 49,500 · **resize image for instagram 12,100** · **compress image without losing quality 8,100** · remove background from photo free 60,500.
- rdb420 utility report (public snippets): qr code generator 1M-3M global, CPC $0.71 (public) · qr code 500K-2M · qr generator 100K-500K · qrcode generator 100K-400K · wifi qr code generator 100K-400K · qr code maker 100K-500K · qr code for pdf 50K-200K · bulk qr code generator 10K-50K · base64 encoder 50K-150K. Similarweb: qr-code-generator.com ~7.2M visits / 3 months.
- HuyVo117/Create-QR: wifi qr code generator 3,800+/mo (single market, unstated).
- boring-sites doc: Aspect Ratio Calculator (video/social) 15K-30K, low difficulty.
- colorSnap blog: "image color picker online" 2,400+/mo.
- jest market research tiers: compress image 800K+, resize image 600K+, png to jpg 400K+, jpg to png 300K+, image to base64 200K+, webp converter 150K+, qr code generator 400K+, jpg to pdf 600K+.
- pixeltools PRD "Monthly Global Searches" (broad KP, low credibility but consistent with myimageupscaler magnitudes): image compressor 1.5M $0.80 · resize image 3.2M · png to jpg 2.8M · jpg to png 1.8M · webp to png 900K · heic to jpg 1.2M · compress png 800K · image to pdf 1.6M · crop image 1.1M · blur image 600K · meme generator 2.2M · qr code generator 3.5M $1.20 · watermark photo 400K · color picker from image 500K · favicon generator 350K $1.00 · passport photo maker 450K $1.50 · image to text 900K · gif maker 1.0M · photo filters online 700K.
- BlogGhar list (very low credibility, "500K+" style rounding): favicon generator 500K+, image to base64 500K+, image color picker 500K+, barcode generator 500K+, meme generator 2M+, placeholder image 500K+, image blur/pixelate 300K+.
- Sibling notes (seo.md): smallseotools.com ~3M visits/mo, Indonesia 21%; Coolors ~doubled US organic via "generator/maker" pages; Kapwing meme maker ~10.5K US visits/mo; Ahrefs free tools strategy: one tool page ranks for hundreds of keywords.

### 2f. Competitor traffic figures quoted in the docs
iLoveIMG 50-60M+ visits/mo (part of iLovePDF ecosystem, DR very high) · TinyPNG 10-15M+ · Remove.bg 20-25M+ · Squoosh ~5M+ · Canva 100-200M+ · Photopea ~15M · Pixlr ~10M · Convertio ~30M · CloudConvert ~8M · imageresizer.com 4.6M search visits (DR 74) · simpleimageresizer.com 980K (DR 63) · 11zon 3.1M (DR 71) · qr-code-generator.com ~2.4M/mo · pixelcut.ai 7.43M, letsenhance.io 3.36M, imgupscaler.com 5.43M (upscaler niche).

---

## 3. Competitor tool inventories observed (for topical completeness)

- **Open-source / indie browser-only suites found on GitHub** (all confirm what is buildable client-side): open-utility-tools (image converter incl. AVIF/ICO multi-res, compressor mozjpeg/oxipng/webp/ravif, resizer Lanczos, cropper, rotate/flip incl. lossless JPEG rotation, EXIF stripper w/o re-encode, EXIF viewer, color picker, image→base64, favicon generator w/ manifest, placeholder generator, SVG optimizer, SVG→PNG via resvg, image→ASCII, spritesheet, image diff, QR in image, GIF toolkit, background remover ONNX, watermark, HEIC via libheif-rs, ffmpeg.wasm media converter); ComplianTools spec (81 tools: HEIC decode-only, RAW, AVIF, WebP, JXL, SVG rasterizer, vectorizer, images→PDF, favicon, GIF maker, video→GIF, GIF splitter, base64, compress-to-target-size, web optimizer w/ srcset, lossless optimizer, 5 resize modes, bulk resize presets, crop w/ rule-of-thirds, smart crop, rotate/straighten, flip, canvas pad, enlarge (Lanczos), border/frame, round corners, collage, split/Instagram slicer, adjustments, filters, curves, color space/ICC, threshold, sharpen/blur, denoise, color picker & palette, recolor, duotone, text on image, watermark, meme generator (Anton font, user-upload only — Impact is Monotype-licensed), draw/stickers, signature, metadata viewer w/ GPS map, metadata remover (strip all / GPS only), blur/pixelate region, blur faces & plates, redact, image inspector (dimensions/aspect/DPI/color space/bit depth/est. quality), compare (SSIM/PSNR), duplicate finder, OCR (tesseract), alt-text review, pixel-art upscaler, DPI changer); PixelTools PRD (90 tools incl. profile picture maker, passport photo maker, aspect ratio calculator, image splitter, image merger, round corners, add border, add text, bulk watermark, caption maker, logo overlay, color replacer, duotone, image comparison, favicon, QR, duplicate finder, DPI changer, placeholder, GIF maker/compressor/resizer/splitter/speed).
- **Live sites named as SERP competitors** (opentools competitive analysis, July 2026): iLoveIMG, Convertio, CloudConvert, FreeConvert, TinyPNG, Squoosh, Ezgif, ImageResizer.com, Adobe Express, Canva, Watermarkly, Imgflip, PineTools, Base64.guru, CodeBeautify, Browserling, RealFaviconGenerator, favicon.io, Jimpl, Metadata2Go, MiniWebTool, Exif.tools, Picovert, ExifVoid, Ghoststrip (EXIF removers), ImageColorPicker.com, Coolors, Adobe Color, Convert Town / Clideo / Pi7 (DPI), ezyZip, Diffchecker, plus a wave of **new privacy-first entrants already on page 1 for pair/long-tail terms**: ZeroPNG, PhotoFormatLab, BulkPicTools, PixelBatch, ImageMint, LeanImg, ImagifyConvert, CrushMachine, MiniPx, PhotoResizer.in, WebToolTrix, UtiloKit, CreatorFormat. That last group is the direct evidence that pair-conversion and size-target long-tails are winnable by small new domains.
- teamz-lab (indie) image set: blur image, blur-up placeholder generator, **compress image for email**, extract colors, favicon, grayscale, compressor, cropper, resizer, rotator, image→base64, jpg→png, meme maker, png→jpg, png→webp, collage, color editor, filters, pencil sketch, social card maker, thumbnail maker, webp→png.
- omni-tools (popular OSS): image resizer, image converter, image editor, video trimmer/reverser, PDF split/merge/edit.

---

## 4. Feasibility notes (client-side)

- Decode/encode via Canvas: JPG, PNG, WebP (encode via `canvas.toBlob('image/webp')` in Chrome/Firefox/Safari 16+), GIF (first frame), BMP, AVIF **decode** (native in Chrome/Firefox/Safari 16+), SVG (draw `<img>` onto canvas; external fonts/images must be inlined). 
- HEIC/HEIF: browsers other than Safari cannot decode → use libheif WASM (`heic2any`, ~1-2MB; 4,088 package.json hits on GitHub). Decode-only; **HEIC encode is not feasible** (patents/tooling) — never offer "JPG to HEIC".
- AVIF/WebP/MozJPEG/OxiPNG encoders: `@jsquash/*` (Squoosh codecs) WASM, lazy-load per format. PNG lossy quantization: libimagequant is GPL (commercial licence needed) — use `pngquant`-free alternatives (e.g., `UPNG.js` quantization or `image-q`) to avoid licence risk.
- Compress to target KB: binary-search quality (and optionally dimensions) client-side — proven pattern (ComplianTools T21).
- EXIF: read with `exifr` (fast, all formats incl. HEIC/AVIF); strip by re-encoding via canvas (removes everything) or byte-level strip of APP1/XMP/ICC for lossless (`img-parts`-style); selective "GPS only" removal via `piexifjs`.
- DPI changer: rewrite PNG `pHYs` chunk / JPEG JFIF density bytes without re-encoding (pure JS).
- ICO: build the ICO container manually from PNG blobs (16/32/48/64/128/256), plus apple-touch-icon, manifest.json and `<link>` snippet.
- PDF: `jsPDF` or `pdf-lib` for images→PDF; `pdf.js` for PDF→image (PDF category).
- GIF: encode with `gifenc`/`gif.js`; decode frames with `gifuct-js` or the `ImageDecoder` API (Chromium). Video→GIF / GIF→MP4: `ffmpeg.wasm` (~25-30MB download; 652 GitHub package.json hits) or WebCodecs + `mp4-muxer` (Chromium/Safari 16.4+). Feasible but heavy and browser-dependent → roadmap.
- OCR: `tesseract.js` (WASM + lazy language data ~10-15MB) → feasible, heavy.
- Background removal: `@imgly/background-removal` (WASM/ONNX, 15-40MB) → feasible, heavy → roadmap.
- QR: `qrcode` / `qr-code-styling` (logo, colors, SVG/PNG). Barcode: `JsBarcode` (Code128, EAN-13, UPC-A, Code39, ITF). Both trivial.
- Placeholder images: generating & downloading is client-side; a **URL API** (`/600x400.png`) that people actually search for needs an edge function → server-light roadmap.
- Screenshot beautifier: canvas composition (gradient bg, padding, radius, shadow, browser/device frame) → trivial.
- Batch: Web Workers + concurrency limit + JSZip download. Memory: decoded RGBA = w×h×4 bytes (12MP ≈ 48MB) → stream one file at a time on mobile.

---

## 5. AdSense / platform policy review for this category

Reviewed against Google Publisher Policies (dishonest behavior, copyrighted/unauthorized content, adult, dangerous, deceptive) as understood in 2026 plus the project's hard exclusions.
- **Safe (none):** compress, resize, crop, rotate/flip, format converters (PNG/JPG/WebP/AVIF/SVG/HEIC/ICO), favicon, color picker/palette, aspect ratio & DPI calculators, EXIF viewer/remover (privacy-positive), add watermark, round corners, blur/pixelate (privacy), grayscale, base64, dimension checker, image→PDF, QR (static), barcode (add "UPC/EAN codes for retail require GS1 registration" note), screenshot beautifier, placeholder generator, bulk tools, image compare.
- **Low risk, handle carefully:**
  - *Meme generator:* user-uploaded images may be copyrighted; process client-side, **host no template gallery of copyrighted characters** (user-upload + CC0 templates only), use OFL fonts (Anton/Oswald), never "Impact" (Monotype). Keep copy free of adult/hate meme framing.
  - *Passport photo maker:* legitimate crop/print-sheet tool; **do not claim government approval, do not compose ID cards, no "fake ID"/"fake document" adjacency**; state "check your issuing authority's current specs".
  - *Social media image resizer / "YouTube thumbnail size":* size presets and resizing only — **never fetch or download thumbnails/media from YouTube/Instagram/TikTok/Facebook** (hard exclusion). Use generic platform names in copy; avoid trademark-styled logos.
  - *GIF/video tools:* local files only; no URL ingestion from video platforms.
  - *OCR (image to text):* fine; avoid "homework/exam cheating" framing.
  - *EXIF viewer:* frame as "see what your photo reveals before you share"; avoid "find where someone took this photo" stalking framing.
- **Excluded by project rules (do not build):** watermark *remover* (copyright circumvention), any platform downloader/thumbnail grabber, reverse image search (needs Google), fake receipts/IDs, "remove Getty/Shutterstock watermark", paywall/DRM anything.
- Content-quality risk: AdSense "screens without publisher content" / thin-affiliate style pages — every tool page must carry the 1,000+ words of genuinely useful content (format facts, tables, FAQs) and ads must not push the tool below the fold on mobile. Avoid doorway-page pattern for size-target pages (100kb/50kb/20kb): make each page's content distinct (use case, platform limits, worked examples).

---

## 6. Long-tail phrases and derived "People also ask" questions, per tool

(Long-tail = real variations seen in exports/competitor pages/keyword clusters. PAA = derived from guide clusters + typical SERP patterns; verify live before publishing.)

### WebP → PNG / WebP → JPG
- Long-tail: webp to png · webp to jpg · convert webp to jpg · webp to jpeg · .webp to png · webp to png converter · webp to png transparent · convert webp to png online free · webp to png bulk · webp to jpg high quality · how to open webp file · how to save webp as jpg · webp to png mac · webp to png windows 11 · change webp to jpg · webp image converter.
- PAA: How do I convert a WebP to PNG? · Why does Google/Chrome save images as WebP? · Does converting WebP to PNG lose quality? (lossless if the WebP was lossless; PNG re-encode is lossless) · Does WebP to JPG keep transparency? (no — JPG has no alpha; choose PNG) · How do I stop Chrome saving images as WebP? · Is WebP better than PNG? · Can Photoshop open WebP? · How to convert WebP to JPG on iPhone/Mac/Windows?

### HEIC → JPG (and HEIC → PNG)
- Long-tail: heic to jpg · convert heic to jpg · heic to jpeg · heic to png · heif to jpg · heic converter · iphone photo to jpg · heic to jpg windows 11 · heic to jpg mac · heic to jpg free no limit · batch heic to jpg · heic to jpg without losing quality · open heic file · what is a heic file · heic to jpg keep metadata.
- PAA: What is a HEIC file? · How do I convert HEIC to JPG for free? · How do I make my iPhone take JPG instead of HEIC? (Settings → Camera → Formats → Most Compatible) · Does converting HEIC to JPG lose quality? · How do I open HEIC on Windows 10/11? (HEIF Image Extensions) · Is HEIC better than JPG? · Can I convert HEIC to JPG on iPhone without an app? (Files app / share "Most Compatible") · Do online converters keep EXIF/location data?

### Image compressor (+ compress JPG / compress PNG / compress to KB)
- Long-tail: image compressor · compress image · compress jpeg · compress png · photo compressor · reduce image size · image size reducer · compress image online free · compress image without losing quality · compress image to 100kb · compress image to 50kb · compress image to 20kb · compress jpg to 50kb · reduce image size in kb · resize image to 100kb · compress image for email · compress image for web · bulk image compressor · compress png without losing quality · make image smaller mb · reduce photo file size iphone.
- PAA: How do I compress an image without losing quality? · How do I reduce a photo to under 100 KB? · What is the difference between compressing and resizing? · Does compressing a JPEG reduce quality? (lossy) · Is PNG or JPEG smaller? · How do I reduce image size for a website? · What is lossless vs lossy compression? · How do I compress multiple images at once? · What image size is best for email attachments?

### Image resizer / resize image (+ bulk, + social presets)
- Long-tail: image resizer · resize image · resize image online free · photo resizer · change size of image · resize image without losing quality · resize image in pixels · resize image to 1920x1080 · resize image to 1080x1080 · resize image by percentage · bulk image resizer · resize multiple images at once · resize image for instagram · resize image for facebook cover · resize photo for passport · resize image to 2x2 · image resizer in kb · picture resizer.
- PAA: How do I resize an image without losing quality? · How do I resize an image to a specific size (pixels/KB)? · What is the difference between resizing and cropping? · How do I change image dimensions on iPhone/Windows? · What is the best image size for Instagram/Facebook/YouTube? · How do I resize an image in KB? · Does resizing reduce image quality? · How do I resize multiple photos at once?

### Crop image
- Long-tail: crop image · image cropper · crop photo online · crop image to circle · crop image to 16:9 · crop image 1:1 · crop picture into a circle · crop image without losing quality · crop image to size · crop image for passport · free image cropper · crop png transparent · crop image to aspect ratio.
- PAA: How do I crop an image to a specific ratio? · How do I crop a picture into a circle? · Does cropping reduce image quality? · How do I crop an image to exact pixel dimensions? · What is the difference between crop and resize? · How do I crop a screenshot on Windows/Mac?

### PNG → JPG / JPG → PNG (+ converter hub)
- Long-tail: png to jpg · convert png to jpg · png to jpeg · jpg to png · jpeg to png · jpg to png transparent · convert to jpg · jpg converter · png converter · png to jpg without losing quality · png to jpg white background · png to jpg bulk · jpg to png transparent background · image converter · convert image format · picture converter · image converter online free.
- PAA: How do I convert PNG to JPG? · Does PNG to JPG lose quality? (yes, lossy) · Why does my PNG turn black/white when converted to JPG? (transparency fill) · Is PNG or JPG better for photos/logos/web? · Does JPG to PNG make it transparent? (no — needs background removal) · How do I convert an image to JPG on iPhone/Mac/Windows? · What is the difference between JPG and JPEG? (none) · Which is smaller, PNG or JPG?

### PNG → WebP / JPG → WebP (developer-leaning, high CPC)
- Long-tail: png to webp · jpg to webp · jpeg to webp · convert jpg to webp · image to webp · webp converter · webp compressor · png to webp bulk · webp quality settings · convert images to webp for website · webp vs png · webp vs jpeg · webp vs avif · should i use webp · how to serve webp images.
- PAA: Should I convert my images to WebP? · Is WebP better than PNG/JPEG? · Does WebP support transparency/animation? · What quality setting should I use for WebP? · Do all browsers support WebP? (yes, since Safari 14) · How much smaller is WebP than JPEG? (~25-35%) · WebP or AVIF for a website? · How do I convert all images on my site to WebP?

### AVIF → JPG / AVIF → PNG (+ to AVIF)
- Long-tail: avif to jpg · avif to png · avif converter · convert avif to jpg · open avif file · avif to jpeg · what is avif · jpg to avif · png to avif · avif to webp · avif vs webp · avif not opening windows.
- PAA: What is an AVIF file? · How do I open an AVIF file on Windows/Mac? · How do I convert AVIF to JPG? · Is AVIF better than WebP? · Does AVIF lose quality? · Why does Chrome download images as AVIF? · Can Photoshop open AVIF?

### SVG → PNG (+ SVG to JPG)
- Long-tail: svg to png · convert svg to png · svg to png transparent · svg to png high resolution · svg to png 512x512 · svg to jpg · svg to ico · svg converter · svg to png online free · svg to png without losing quality · export svg as png · svg to png batch · svg to png cricut.
- PAA: How do I convert SVG to PNG? · Does SVG to PNG lose quality? (PNG is raster; pick output size) · What resolution should I export my SVG at? · How do I keep a transparent background? · Why is my SVG blurry as PNG? · Can I convert SVG to PNG on Windows/Mac without software? · Why don't fonts/images show in the converted PNG? (external references)

### Image → PDF (JPG to PDF, PNG to PDF) — overlaps PDF category
- Long-tail: jpg to pdf · image to pdf · png to pdf · convert jpg to pdf · photo to pdf · jpeg to pdf · combine images into one pdf · multiple images to pdf · jpg to pdf without losing quality · jpg to pdf a4 · picture to pdf converter · jpg to pdf iphone · jpg to pdf under 100kb.
- PAA: How do I convert a JPG to PDF for free? · How do I combine multiple photos into one PDF? · How do I convert a picture to PDF on iPhone/Android? · How do I make a PDF smaller after converting? · What page size should I use? · Does JPG to PDF reduce quality?

### Favicon generator / PNG → ICO / ICO converter
- Long-tail: favicon generator · favicon · favicon.ico generator · png to ico · ico converter · convert png to ico · favicon size · favicon maker · favicon generator from image · favicon generator from text/emoji · apple touch icon generator · favicon for website · 16x16 icon · 32x32 favicon · favicon html code · favicon not showing · web app manifest icons · ico to png.
- PAA: What size should a favicon be? (16, 32, 48; 180 apple-touch; 192/512 manifest) · How do I create a favicon.ico from a PNG? · How do I add a favicon to my website? (`<link rel="icon">`) · Why isn't my favicon showing? (cache, path, size) · Does a favicon need to be .ico? (no; PNG/SVG supported) · What is an apple-touch-icon? · Can a favicon be SVG? · How do I make a favicon transparent?

### Image color picker / color palette from image
- Long-tail: image color picker · color picker from image · get color from image · hex color from image · pick color from image online · find hex code from image · eyedropper online · color palette from image · extract colors from image · color palette generator from photo · dominant color of image · image to color palette · rgb from image · pantone from image (hard).
- PAA: How do I find the hex code of a color in an image? · How do I pick a color from a picture online? · How do I get a color palette from a photo? · What is the difference between HEX, RGB and HSL? · How do I find the dominant color of an image? · Is there an eyedropper tool in Chrome? (EyeDropper API / DevTools) · How many colors should a palette have?

### EXIF viewer / remove EXIF (metadata)
- Long-tail: exif viewer · exif data viewer · view exif data online · image metadata viewer · photo metadata viewer · check photo metadata · exif data · exif gps location · view photo location · exif remover · remove exif data · remove metadata from photo · strip exif · remove gps from photo · remove location from photo iphone · exif data remove online · photo metadata remover · does whatsapp remove exif · does instagram remove exif.
- PAA: How do I view EXIF data of a photo? · What information is stored in EXIF? · How do I see where a photo was taken? · How do I remove EXIF data before sharing? · Does Facebook/Instagram/WhatsApp strip EXIF? (yes, mostly) · Do screenshots have EXIF? · Can EXIF data be faked? · Does removing metadata reduce quality? (no, if stripped losslessly) · How do I remove location from iPhone photos?

### Aspect ratio calculator
- Long-tail: aspect ratio calculator · aspect ratio · 16:9 calculator · 16:9 aspect ratio calculator · 4:3 aspect ratio calculator · calculate aspect ratio · aspect ratio of image · image aspect ratio calculator · ratio calculator pixels · 1920x1080 aspect ratio · 21:9 resolution · 9:16 dimensions · what aspect ratio is 1080x1350 · aspect ratio for instagram · youtube aspect ratio · aspect ratio converter · pixel dimensions calculator.
- PAA: How do I calculate aspect ratio? · What is the aspect ratio of 1920x1080? (16:9) · What is 16:9 in pixels? · What aspect ratio is Instagram (1:1, 4:5, 9:16)? · What is the best aspect ratio for YouTube (16:9) / TikTok (9:16)? · How do I change aspect ratio without cropping? (padding) · What is 4:3 vs 16:9? · What size is 9:16 in pixels?

### DPI converter / change image DPI
- Long-tail: dpi converter · change dpi of image · 300 dpi converter · convert image to 300 dpi · increase dpi of image · check image dpi · dpi changer online · 72 dpi to 300 dpi · what is dpi · image dpi checker · dpi vs ppi · print resolution calculator · how many pixels for 4x6 at 300 dpi.
- PAA: How do I change the DPI of an image? · Does changing DPI change image quality? (no — only print metadata) · How do I make an image 300 DPI? · What DPI is needed for printing? · What is the difference between DPI and PPI? · How do I check the DPI of an image? · How many pixels is 300 DPI for A4/8x10?

### Rotate / flip / mirror image
- Long-tail: rotate image · rotate picture online · rotate image 90 degrees · rotate photo · rotate image online free · straighten image · flip image · flip image horizontally · mirror image online · mirror a picture · flip photo · reverse image (ambiguous with reverse search — avoid) · rotate jpg without losing quality.
- PAA: How do I rotate a picture online? · How do I flip an image horizontally? · What is the difference between flip and rotate? · How do I mirror a photo on iPhone? · Does rotating a JPEG lose quality? (lossless if 90° with proper tools) · Why is my photo sideways when uploaded? (EXIF orientation)

### Add watermark (text/logo, batch)
- Long-tail: add watermark to photo · watermark image · image watermark · add watermark to image online free · add logo to photo · watermark maker · text watermark · batch watermark · watermark photos free no sign up · add copyright to photo · transparent watermark · tile watermark.
- PAA: How do I add a watermark to a photo for free? · How do I watermark multiple photos at once? · Where should a watermark go? · How transparent should a watermark be? · Does a watermark protect copyright? · How do I make a watermark logo transparent (PNG)?
- Exclude entirely: "remove watermark" intent.

### Round corners / circle crop / profile picture
- Long-tail: round corners image · rounded corners image online · round image corners · make image round · circle crop image · crop image into circle · circle profile picture maker · round profile picture · image border radius · rounded png · rounded logo maker.
- PAA: How do I round the corners of a picture? · How do I make a picture into a circle? · How do I make a round profile picture? · What file type keeps rounded corners transparent? (PNG/WebP) · How do I round corners in Canva/Photoshop/CSS?

### Blur image / pixelate / blur face
- Long-tail: blur image · blur picture online · blur photo · blur background · blur part of image · blur face in photo · blur text in image · pixelate image · pixelate face · censor image online · blur license plate · blur image online free · gaussian blur · blur sensitive information in screenshot.
- PAA: How do I blur part of a picture? · How do I blur a face in a photo? · Is blurring text secure? (pixelation can be reversed — use solid redaction) · How do I blur the background of a photo? · How do I pixelate an image? · How do I blur on iPhone?

### Black & white / grayscale
- Long-tail: black and white image converter · convert image to black and white · grayscale image · make picture black and white online · photo to black and white · greyscale converter · black and white filter online · desaturate image · sepia filter online.
- PAA: How do I make a picture black and white? · What is the difference between grayscale and black and white? · How do I make a photo black and white on iPhone? · Does grayscale reduce file size?

### Image → Base64 / Base64 → image (developer)
- Long-tail: image to base64 · convert image to base64 · base64 image · base64 to image · base64 image decoder · png to base64 · jpg to base64 · svg to base64 · image to data uri · base64 image css · base64 encode image online · decode base64 to png · base64 to jpg.
- PAA: How do I convert an image to Base64? · How do I use a Base64 image in HTML/CSS? · Does Base64 make images bigger? (~33%) · When should I use Base64 images? · How do I decode a Base64 string to an image? · What is a data URI?

### Image size / dimension checker (image info)
- Long-tail: image size checker · check image size · image dimensions · check image dimensions online · what size is my image · image resolution checker · find image size in pixels · image file size checker · image info · check if image is 300 dpi · check image aspect ratio.
- PAA: How do I check the pixel size of an image? · How do I find the resolution of an image? · What is the difference between file size and dimensions? · How do I check image size on iPhone/Mac/Windows?

### Social media image resizer (platform preset pages)
- Long-tail: resize image for instagram · instagram photo size · instagram post size 2026 · instagram story size · youtube thumbnail size · youtube thumbnail maker size 1280x720 · youtube banner size · facebook cover photo size · facebook profile picture size · twitter header size · x header size · linkedin banner size · tiktok video size · pinterest pin size · discord banner size · resize image for youtube thumbnail · social media image sizes.
- PAA: What size should an Instagram post be? (1080x1080 / 1080x1350) · What is the YouTube thumbnail size? (1280x720, <2MB) · What is the Facebook cover photo size? (820x312 / 851x315) · What is the Twitter/X header size? (1500x500) · What aspect ratio is Instagram Reels/Stories? (9:16, 1080x1920) · What is the LinkedIn banner size? (1584x396) · How do I resize an image for Instagram without cropping?
- Policy: presets and resizing only; no downloading from platforms.

### Passport photo maker
- Long-tail: passport photo maker · passport size photo · passport photo size · 2x2 photo · 2x2 passport photo online · make passport size photo · passport photo online free · us passport photo 2x2 · uk passport photo 35x45 · schengen visa photo 35x45 · indian passport photo 2x2 · passport photo 600x600 · ds-160 photo · passport photo print 4x6 · passport photo background white · id photo maker · visa photo maker.
- PAA: What size is a passport photo? (US 2x2 in / 600x600 px; UK/EU 35x45 mm) · Can I take my own passport photo? · How do I make a passport photo at home? · How do I print passport photos on 4x6? · What background is required? · How do I make a photo 600x600 under 240 KB (DS-160)? · What are the head-size rules?
- Policy: crop/print tool only; disclaimer that specs must be verified with the issuing authority; no ID document composition.

### QR code generator (+ WiFi / vCard / logo / SVG)
- Long-tail: qr code generator · qr code · qr generator · qr code maker · free qr code generator · qr code generator free no sign up · qr code generator png · qr code generator svg · qr code with logo · wifi qr code generator · vcard qr code generator · qr code for pdf (needs hosting — informational) · qr code for link · bulk qr code generator · qr code generator no expiration · static vs dynamic qr code · qr code size.
- PAA: How do I create a free QR code that doesn't expire? (static) · What is the difference between static and dynamic QR codes? · How do I make a QR code for WiFi? · Can a QR code have a logo? · What size should a QR code be printed? · Do QR codes expire? · How do I make a QR code for a PDF? (host the PDF; link) · Are free QR code generators safe?

### Barcode generator
- Long-tail: barcode generator · free barcode generator · barcode maker · code 128 barcode generator · ean 13 barcode generator · upc barcode generator · isbn barcode generator · barcode generator printable · barcode font · sku barcode generator · barcode generator svg · bulk barcode generator · barcode vs qr code.
- PAA: How do I make a barcode for my product? (GS1 for retail UPC/EAN) · Are barcodes free? · What is the difference between UPC and EAN? · What is Code 128 used for? · Can I print my own barcodes? · How do I generate an ISBN barcode? · Barcode or QR code?

### Meme generator
- Long-tail: meme generator · meme maker · make a meme · meme generator free no watermark · meme creator · blank meme template · add text to meme · impact font meme · meme text generator · custom meme maker · meme generator upload image.
- PAA: How do I make a meme for free? · What font do memes use? (Impact — licensed; we use Anton) · How do I make a meme without a watermark? · Where do I find meme templates? · What size should a meme be? · Is it legal to use images in memes?
- Policy: user-upload only, no copyrighted template gallery, OFL font.

### Bulk image resizer / batch tools
- Long-tail: bulk image resizer · bulk resize photos · resize multiple images at once · batch resize images · bulk image compressor · batch convert images · bulk png to jpg · resize all images to same size · bulk image resizer no upload.
- PAA: How do I resize multiple images at once? · How do I compress many photos at the same time? · How do I resize photos in bulk on Windows/Mac? · Is there a limit on how many images I can resize?

### Screenshot beautifier / mockup
- Long-tail: screenshot beautifier · screenshot mockup generator · add background to screenshot · browser mockup generator · device mockup free · make screenshot look nice · screenshot frame · mac window mockup · pretty screenshot tool · code screenshot generator (dev).
- PAA: How do I make screenshots look professional? · How do I add a background to a screenshot? · How do I put a screenshot in a browser frame? · What size should Product Hunt/Twitter screenshots be?

### Placeholder image generator
- Long-tail: placeholder image · placeholder image generator · dummy image · lorem picsum · placeholder.com alternative · 600x400 placeholder · placeholder png · gray placeholder image · placeholder image url · blur-up placeholder base64.
- PAA: What is a placeholder image? · How do I generate a placeholder image of a specific size? · Is there a placeholder image URL I can use? (server-light API) · How do I make a low-quality image placeholder (LQIP)?

### GIF tools (images→GIF, GIF→frames, video→GIF, GIF→MP4) — roadmap
- Long-tail: gif maker · make a gif · images to gif · photos to gif · gif to png · split gif into frames · extract frames from gif · gif to jpg · video to gif · mp4 to gif · gif to mp4 · gif compressor · resize gif · reverse gif · gif speed.
- PAA: How do I make a GIF from photos? · How do I turn a video into a GIF? · How do I get frames out of a GIF? · Why is my GIF so large? · How do I convert GIF to MP4? · What is the max GIF size for Discord/Twitter?

### Image → text (OCR) — roadmap, heavy
- Long-tail: image to text · image to text converter · extract text from image · ocr online · picture to text · jpg to text · png to text · screenshot to text · handwriting to text (weak) · image to word · copy text from image.
- PAA: How do I copy text from an image? · Is OCR accurate? · How do I extract text from a screenshot? · Can I convert a photo of handwriting to text? · Does Google Lens do OCR?

### Background remover — roadmap, heavy
- Long-tail: remove background · background remover · remove background from image · make image transparent · make background transparent · transparent background maker · remove white background · png maker · cut out image · remove bg free hd.
- PAA: How do I remove a background for free? · How do I make an image background transparent? · How do I remove a white background from a logo? · What file keeps transparency? · Is remove.bg free? (limited)

---

## 7. Candidate table (markdown; mirrors the structured output)

Volume column = estimated global English range (US anchor in notes). Comp = organic competition for a new domain. Feas = client-side / server-light / infeasible. Risk = AdSense risk. P = launch priority 1-10.

| # | Tool | Slug | Primary keyword | Est. global vol | Best source | Comp | Feas | Risk | P |
|---|---|---|---|---|---|---|---|---|---|
| 1 | WebP to PNG Converter | webp-to-png | webp to png | 300k-600k (US 165k) | Semrush US export | medium | client-side | none | 10 |
| 2 | WebP to JPG Converter | webp-to-jpg | webp to jpg | 200k-400k (US 110k) | Semrush US export | medium | client-side | none | 9 |
| 3 | HEIC to JPG Converter | heic-to-jpg | heic to jpg | 150k-400k (Ahrefs global "how to convert heic to jpg" 110k KD39; KP broad 1.2M) | Ahrefs global export + KP | high | client-side (libheif WASM, decode only) | none | 9 |
| 4 | Image Compressor | image-compressor | image compressor | 200k-500k (US 50k-60k) | Semrush US + seodata US | high | client-side | none | 8 |
| 5 | Image Resizer | image-resizer | image resizer | 300k-700k (US 110k) | Semrush US | high | client-side | none | 8 |
| 6 | Compress Image to 100KB (target-size cluster) | compress-image-to-100kb | compress image to 100kb | 200k-400k (India 60.5k+49.5k+33.1k+110k; US 5k-15k est) | Google Ads India export + simpleimageresizer traffic | low | client-side | none | 8 |
| 7 | JPG to PNG Converter | jpg-to-png | jpg to png | 100k-250k (US 33k; Ahrefs "jpeg to png" 9.9k KD32) | Semrush US + Ahrefs | medium | client-side | none | 8 |
| 8 | PNG to JPG Converter | png-to-jpg | png to jpg | 200k-400k (US 49.5k) | Semrush US | high | client-side | none | 7 |
| 9 | PNG/JPG to WebP Converter | png-to-webp | png to webp | 40k-80k (US 12.1k+6.6k+5.4k; CPC $1.95-2.39) | Semrush US | medium | client-side | none | 8 |
| 10 | AVIF to JPG/PNG Converter | avif-to-jpg | avif to jpg | 60k-120k (Ahrefs global 33.1k KD44 + 27.1k KD38) | Ahrefs global | medium | client-side (native decode) | none | 8 |
| 11 | SVG to PNG Converter | svg-to-png | svg to png | 100k-300k (KP broad 301k; tier 50K+) | KP (upscaler PRD) | medium | client-side | none | 8 |
| 12 | Favicon Generator | favicon-generator | favicon generator | 100k-250k (US 40k-80k est; KP broad 350k) | estimate + KP broad + UA ratio | medium | client-side | none | 8 |
| 13 | PNG to ICO Converter | png-to-ico | png to ico | 20k-40k (Ahrefs global 18.1k KD49 + "ico converter" 5.4k KD28) | Ahrefs global | medium | client-side | none | 7 |
| 14 | EXIF Data Viewer | exif-viewer | exif viewer | 40k-80k cluster (US: exif viewer 2.4k, metadata viewer 6.6k CPC $6.82, exif data 4.4k, exif 2.9k, exif data viewer 2.9k) | Semrush US | low | client-side | none | 8 |
| 15 | Remove EXIF Data | remove-exif-data | remove exif data | 20k-60k (KP "exif data remove" 40.5k one market; US 5k-15k est) | KP export + estimate | low | client-side | none | 7 |
| 16 | Aspect Ratio Calculator | aspect-ratio-calculator | aspect ratio calculator | 60k-120k (US 30k-60k est; tier 100K+; 15K-30K quoted) | estimate + 2 secondary docs | low | client-side | none | 8 |
| 17 | Crop Image | crop-image | crop image | 100k-250k (US 22.2k + image cropper 18.1k) | Semrush US | high | client-side | none | 6 |
| 18 | Image Color Picker | image-color-picker | image color picker | 50k-120k (US 10k-30k est; "image color picker online" 2.4k) | estimate + tier 50K+ | medium | client-side | none | 7 |
| 19 | Color Palette from Image | color-palette-from-image | color palette from image | 30k-80k (est) | estimate | medium | client-side | none | 6 |
| 20 | DPI Converter | dpi-converter | change dpi of image | 50k-100k (tier 50K+; US 10k-20k est) | upscaler tier + estimate | low | client-side (metadata rewrite) | none | 7 |
| 21 | Round Corners / Circle Crop | round-image-corners | round corners image | 20k-50k (est) | estimate | low | client-side | none | 7 |
| 22 | Rotate & Flip Image | rotate-image | rotate image | 50k-100k (est) | estimate + competitor coverage | medium | client-side | none | 5 |
| 23 | Add Watermark to Image | add-watermark | add watermark to photo | 60k-120k (KP 14.8k one market; 50K quoted) | KP export + secondary | medium | client-side | none | 6 |
| 24 | Blur / Pixelate Image | blur-image | blur image | 100k-300k (KP broad 600k; US 20k-40k est) | KP broad + estimate | medium | client-side | none | 6 |
| 25 | Black & White Converter | black-and-white-image | convert image to black and white | 40k-100k (est) | estimate | medium | client-side | none | 5 |
| 26 | Image to Base64 (+ decode) | image-to-base64 | image to base64 | 50k-100k (US 10k-20k est; tier 200K+) | estimate + tier | medium | client-side | none | 6 |
| 27 | Image Size Checker | image-size-checker | image size checker | 10k-30k (est) | estimate | low | client-side | none | 4 |
| 28 | Social Media Image Resizer | social-media-image-resizer | resize image for instagram | 100k-300k cluster ("resize image for instagram" 12.1k; platform size queries informational) | secondary doc + estimate | medium | client-side | low | 6 |
| 29 | Passport Photo Maker | passport-photo-maker | passport photo maker | 300k-800k (India 550k+368k; US 20k-50k est) | Google Ads India + tier | medium | client-side | low | 6 |
| 30 | Image to PDF (JPG to PDF) | image-to-pdf | jpg to pdf | 500k-1M+ (KP 165k one market; Ahrefs "PNG to PDF" 110k KD46; KP broad 3.3M) | KP + Ahrefs | high | client-side (jsPDF) | none | 6 |
| 31 | QR Code Generator (+WiFi/vCard/logo) | qr-code-generator | qr code generator | 1M-3M (US 300k-600k est; wifi qr 100k-400k) | utility report public snippets + India export | high (head) / medium (wifi, logo, svg) | client-side | none | 7 |
| 32 | Barcode Generator | barcode-generator | barcode generator | 100k-250k (US 20k-40k est; 40K quoted) | secondary + estimate | medium | client-side | none | 5 |
| 33 | Meme Generator | meme-generator | meme generator | 500k-1M+ (KP broad 2.2M; US 100k-300k est) | KP broad + imageresizer top-kw evidence | high | client-side | low | 4 |
| 34 | Bulk Image Resizer | bulk-image-resizer | bulk image resizer | 30k-60k (est; "bulk image compressor" US 480) | estimate + seodata | medium | client-side | none | 5 |
| 35 | Image Converter (hub) | image-converter | image converter | 200k-500k (70K quoted; "png converter" US 33k, "jpg converter" 22k) | Semrush US adjacent + secondary | high | client-side | none | 5 |
| 36 | Screenshot Beautifier | screenshot-beautifier | screenshot beautifier | 5k-15k (est) | estimate | low | client-side | none | 5 |
| 37 | Placeholder Image Generator | placeholder-image-generator | placeholder image generator | 20k-50k (est) | estimate | medium | client-side (download) / server-light (URL API) | none | 4 |
| 38 | GIF Maker & GIF Tools | gif-maker | gif maker | 300k-600k (KP broad 1M) | KP broad | high | client-side (gifenc; ffmpeg.wasm heavy) | low | 4 |
| 39 | Image to Text (OCR) | image-to-text | image to text converter | 300k-600k (KP broad 368k; KP 12.1k/9.9k one market) | KP exports | high | client-side (tesseract.js, heavy) | none | 5 |
| 40 | Background Remover | remove-background | remove background from image | 5M+ (KP broad 15M; KP 135k one market) | KP exports | high | client-side (ONNX WASM 15-40MB, heavy) | none | 4 |

Dropped/deferred (noted for completeness): merge/combine images (est 30k-80k, low-medium comp — good tier-3 add), split image / Instagram grid (5k-20k), image compare slider (20k-40k), photo collage maker (27K KP; Canva-dominated), add text to image (Canva/Adobe-dominated; fold into watermark/meme), TIFF/BMP/GIF→PNG pair pages (tiny volume; add under converter hub), image enlarger without AI (small), PDF→JPG (PDF category; 9.1M KP broad), watermark remover (excluded), reverse image search (infeasible), any platform downloader (excluded).

---

## 8. Launch recommendation for this category (my read)

**Launch with (tier 1, weeks 0-2):** webp-to-png, webp-to-jpg, heic-to-jpg, image-compressor (+ compress-jpg / compress-png sub-pages), image-resizer, compress-image-to-100kb (+50kb/20kb variants with distinct content), jpg-to-png, png-to-jpg, png-to-webp (+jpg-to-webp), avif-to-jpg (+avif-to-png), svg-to-png, favicon-generator (+png-to-ico), exif-viewer, remove-exif-data, aspect-ratio-calculator.
Reasoning: the WebP pair terms are the single largest exported US numbers in this whole dataset (165k/110k) with tiny paid competition and a SERP that already admits small privacy-first entrants; HEIC is +22% YoY with KD 39-21; EXIF/metadata is low competition with the highest CPC in the category ($6.82 "metadata viewer"); aspect-ratio and DPI are calculator-style pages small sites already win; size-target pages are proven traffic magnets (simpleimageresizer: 33K visits/mo from one page).

**Tier 2 (weeks 2-6):** crop-image, image-color-picker, color-palette-from-image, dpi-converter, round-image-corners, add-watermark, blur-image (+pixelate/blur-face), black-and-white-image, image-to-base64, social-media-image-resizer (per-platform preset pages), passport-photo-maker, image-to-pdf, qr-code-generator (+wifi-qr), rotate-image, bulk-image-resizer, image-converter hub.

**Tier 3 / roadmap (months 3-6):** barcode-generator, meme-generator, screenshot-beautifier, image-size-checker, placeholder-image-generator (URL API = server-light), gif tools, image-to-text OCR, background remover, merge-images, split-image, image compare.

Content strategy notes for writers: pair pages must state exactly what conversion preserves (alpha, EXIF, ICC, animation) and warn about JPG's lack of transparency; every page needs the "no upload / processed in your browser" trust block (the doc evidence says this is now a ranking-relevant differentiator competitors under-serve); use platform size tables with a "last verified" date; size-target pages need worked examples (e.g., DS-160 600x600 <240KB; Indian exam forms 20-50KB, 3.5x4.5cm); avoid doorway duplication across the 100kb/50kb/20kb set.
