# Raw keyword research: Color, CSS & design generator tools

- Date: 2026-09-29
- Researcher: Claude Opus 5.5 subagent (model id `claude-opus-5-5`), senior SEO keyword researcher role
- Scope: color tools (picker, palettes, contrast, color blindness, shades, mixing, naming, converters), CSS visual generators (gradient, shadow, radius, glass, clip-path, animation, layout), SVG design assets (waves, blobs, patterns), typography helpers (font pairing, type scale, clamp), Tailwind helpers.
- Site context: brand-new zero-authority domain, Next.js static on Vercel, 100% client-side at launch, AdSense monetisation.

---

## 0. Method and limitations (read this first)

**What worked**
- `WebSearch` worked for ~27 queries, then the shared session budget ran out (200/200, used up mostly by sibling researchers). Every figure below that says "Similarweb/Semrush snippet" comes from those search-result summaries.
- `git clone` of GitHub repos worked. I re-used (a) the Cisco Umbrella Top-1M list downloaded by a sibling researcher on 2026-09-29, (b) the cloned `stefanjudis/tiny-helpers` directory (708 hand-curated dev helpers, 68 tagged Color, 126 CSS, 63 SVG, 36 Fonts), (c) the cloned `sharevb/it-tools` fork, and (d) the **real Semrush US-database JSON exports** in `AndrewLaws/webcaretakers/research/_semrush-*.json` (generated ~April 2026).
- `registry.npmjs.org` worked (library/licence feasibility checks).

**What was blocked**
- `WebFetch` and `curl` to every SEO-data and competitor domain were blocked by the egress proxy: ahrefs.com, similarweb.com, analytics.explodingtopics.com, coolors.co, cssgradient.io, htmlcolorcodes.com, color-hex.com, webaim.org, 10015.io, w3schools.com, cssportal.com, html-css-js.com, rapidtables.com, omnicalculator.com, neumorphism.io, haikei.app, getwaves.io, magicpattern.design, uicolors.app, fffuel.co, joshwcomeau.com, toptal.com, tiny-helpers.dev, colorhunt.co, mycolor.space, encycolorpedia.com, colorhexa.com, Google autocomplete (`suggestqueries.google.com`), DuckDuckGo and Bing autocomplete. GitHub API search is not available in this session.
- So: **no live autocomplete and no live People-Also-Ask scraping**. The "long-tail" and "PAA" lists in §5 are built from (1) competitor page titles/snippets seen in the 27 searches, (2) tiny-helpers/it-tools tool descriptions, (3) Semrush related-keyword lists, (4) my knowledge of these very stable SERPs (training data to mid-2026). Writers should spot-check PAA boxes in a real browser before writing.

**Source tags used in this file**

| Tag | Meaning |
|---|---|
| **[SR-US]** | Real Semrush **US** database export (webcaretakers repo, ~Apr 2026). US only; global English is usually 2-3.5x for dev/design terms (India, UK, CA, AU, PH, PK add a lot). |
| **[SW]** | Similarweb / Semrush / Ahrefs traffic figure seen in a WebSearch snippet (date given). |
| **[U]** | Cisco Umbrella Top-1M DNS rank, list of 2026-09-29 (lower = more popular; enterprise/dev skew). "n/l" = not in the top 1M. |
| **[SERP]** | Who ranks, as seen in WebSearch results on 2026-09-29. |
| **[TH]** | tiny-helpers / it-tools inventory evidence (existence of many tools = proven demand; also gives real phrasing). |
| **[E]** | Estimate: my knowledge of Ahrefs/Semrush global volumes for these mature queries, cross-checked against [SR-US] anchors and competitor traffic. Medium confidence for head terms, low for long-tail. Always a range. |

---

## 1. Search / fetch log

| # | Tool | Query / target | Result |
|---|---|---|---|
| 1 | WebSearch | "color palette generator" monthly search volume | No volume. SERP: coolors.co, coolors.co/palettes, supercolorpalette.com, colors.muz.li, color.adobe.com, colormind.io, canva.com/colors/color-palette-generator, khroma.co, huemint.com, colorhuntpalette.com → **high competition (Adobe, Canva, Coolors)** |
| 2 | WebSearch | "css gradient generator" keyword volume ahrefs | No volume. SERP: elementor.com/tools/css-gradient-generator, cssportal.com, angrytools.com, joshwcomeau.com/gradient-generator, **w3schools.com/tools/tool_css_gradient.php**, creative-tim tailwind gradient, colorzilla.com/gradient-editor, learnui.design → medium-high |
| 3 | WebSearch | coolors.co monthly visits similarweb 2026 | **coolors.co 4.5M visits (Sep 2025), 5.58M (May 2026)**, bounce 33%, 17.9 pages/visit, 3:57 duration [SW] |
| 4 | WebSearch | "contrast checker" search volume WCAG | No volume. SERP: digitala11y, contrast-finder.org, atmos.style, contrastchecker.com (EMD), **webaim.org** (#1 authority), Firefox add-on, userway.org, achecks.org, Chrome store, accessibilitychecker.org ("2026" in title) |
| 5 | WebSearch | most popular CSS generator tools box shadow border radius glassmorphism | dev.to lists; **W3Schools box-shadow + glassmorphism generators**; cssgen.org (20+ generators); html-css-js.com; webcode.tools; generatorcss.vercel.app; front-end-tools.com; frontendgeek.com; 9elements fancy-border-radius |
| 6 | WebSearch | "color picker" search volume million | No volume. SERP: htmlcolorcodes.com/color-picker, development-tutorial.com, coolors.co/color-picker, getimagecolor.com, Google Play apps, Wikipedia |
| 7 | WebSearch | free online tool ideas that get traffic color tools reddit | Ahrefs competitor pages for colorhunt/coolors; dev.to color tool lists; stackshare "color tools" |
| 8-10 | WebFetch | ahrefs.com/websites/coolors.co, similarweb colorhunt, ahrefs colorhunt competitors | **Blocked** |
| 11 | WebSearch | similarweb cssgradient.io traffic | **cssgradient.io 664.2K visits (Sep 2024)**, bounce 68%, 1.54 pages/visit; listed as top-5 competitor of uigradients.com (Jul 2026) [SW] |
| 12 | WebSearch | htmlcolorcodes.com traffic semrush | **htmlcolorcodes.com ~3.1M visits/mo (Semrush via Exploding Topics, Mar 2026)**, global rank #19,305, US #15,079 [SW]; another snippet: 2.92M |
| 13 | WebSearch | "color picker" keyword difficulty "hex color picker" | SERP: atmos.style/color-picker (HEX/RGB/HSL/LCH/**OKLCH**), htmlcolorcodes, **picsart.com/colors/color-picker**, webfx.com, Wikipedia, phcode.dev, fffuel cccolor, redketchup.io, **figma.com/color-picker**, coolors → high (Figma, Picsart, WebFX brands) |
| 14 | WebSearch | "box shadow generator" monthly searches | SERP: 10015.io, **MDN box-shadow generator**, html-css-js.com, MDN box-shadow doc, cssportal, **W3Schools**, unused-css.com, webcode.tools, cssgenerator.org, box-shadow.art → medium |
| 15 | WebSearch | glassmorphism / neumorphism generator | SERP: **W3Schools glassmorphism**, coddy.tech, boogiejack.com, 10015.io, codepen, hype4.academy (original, by the man who named "glassmorphism"), medium article, **aethercss.lovable.app (Liquid Glass)**, utiltoolkits.com, codeshack.io neumorphism → medium; many small sites on page 1 |
| 16 | WebFetch | analytics.explodingtopics.com htmlcolorcodes | Blocked |
| 17 | WebSearch | "liquid glass" CSS generator | SERP: **hiredigital.com, yarinsa.medium.com, aethercss.lovable.app, css-tricks article, GitHub repo, design.dev, liquid-glass-pi.vercel.app, glasscss.com** → almost all small/new sites + a Vercel demo = **LOW competition, trend created by Apple iOS 26 "Liquid Glass" (WWDC June 2025)** |
| 18 | WebSearch | W3Schools CSS visual tools gradient glassmorphism shadow 2026 | Confirms W3Schools now runs "CSS Visual Tools": gradient, box-shadow, **text-shadow**, glassmorphism (+ others). W3Schools is [U] #27,259 and has enormous authority → raises competition on these exact-match head terms |
| 19 | WebSearch | tailwind color palette generator shades 50-950 | SERP: medium (Shader), **magicpattern.design**, **tints.dev**, v3.tailwindcss.com docs, saasykit.com, **tailwindcolor.tools (EMD)**, tailwindcss.com docs, tailkits.com, thefrontkit.com, web-toolbox.dev → mostly small/mid sites = **low-medium** (uicolors.app also known leader) |
| 20-21 | Bash/curl | 30 competitor + autocomplete endpoints | All 403 (egress policy) |
| 22 | Bash | Umbrella Top-1M ranks for 70 domains | See §2 |
| 23 | Bash | tiny-helpers helpers tagged Color/CSS/SVG/Fonts/Accessibility/Animations | See §3 |
| 24 | Bash | sibling notes (`converters-calculators.md`, `image-media.md`, `developer.md`) | Overlaps + Semrush US anchors (§2.1, §6) |
| 25 | WebSearch | "color palette generator" site:github.com search volume | No data (repos only) |
| 26 | WebSearch | "gradient generator" "box shadow generator" searches per month | No data. SERP: html-css-js, W3Schools, **toptal.com/developers/css3maker**, devtills, **alvarotrigo.com shadow-gradients**, conchwebapptech, front-end-tools, gradienty.codes, angrytools |
| 27 | WebSearch | "color picker" 1M monthly searches | No data. SERP: webfx, App Store, toolpix.pythonanywhere, Chrome store, **imagecolorpicker.com**, colorpickerweb.com, pepperland, rovelin, gifgit |
| 28 | WebSearch | "hex color" keyword volume case study | No volume; SERP: sitepoint, dev.co, lockedownseo social colors, tutorialrepublic CSS color names, elementor blog, htmlcolorcodes, hookagency "50 website color schemes 2026" |
| 29 | WebSearch | "color palette generator" 110K OR 135K ... | No volume; SERP adds **figma.com/color-palette-generator**, magicpattern, atmos, jukeboxprint, degraeve, Noun Project blog |
| 30 | WebSearch | coolors.co top organic keywords semrush | **coolors 5.58M (May 2026), global rank 10,031, US 7,260; paletton.com 175.68K visits; htmlcolorcodes.com 2.92M** [SW] |
| 31 | WebSearch | "color picker" 1.5M/823K/673K | No keyword figure |
| 32 | WebSearch | micro tools free tool traffic gradient generator case study | Generic SaaS case studies only |
| 33 | WebSearch | imagecolorpicker.com traffic | **3.1M visits (Jan 2026), 54% organic search** [SW] |
| 34 | WebSearch | color-hex.com traffic 2026 | **~2.5M visits/mo (Jul 2026)**, US category rank #105 [SW] |
| 35 | WebSearch | colorhunt.co traffic Aug 2026 | **639.6K search visits (Ahrefs, Aug 2026)**; US 128.5K, India 114.5K; 1.5M total visits over 3 months (Similarweb) [SW] |
| 36 | WebSearch | neumorphism.io / css.glass / cssgradient.io traffic | neumorphism.io global rank #714,561 (Aug 2026), **traffic -29.5% MoM**, mostly direct → declining trend [SW] |
| 37 | WebSearch | encycolorpedia / colorhexa traffic | **colorhexa.com 854K (May 2026), 1.12M (Oct 2024); encycolorpedia.com 481K (May 2026), 449K (Jun 2026)** [SW] → programmatic per-hex-code sites still pull big traffic |
| 38-42 | WebSearch | color blindness simulator; red+blue color mixer; tint/shade generator; clip-path generator; cubic-bezier generator | **Refused: session WebSearch budget exhausted (200/200)** |
| 43 | GitHub API | code search / contents | Not available in this session |
| 44 | git clone | AndrewLaws/webcaretakers | OK — only color files are `_semrush-color-contrast-checker.json` and `_semrush-hex-to-rgb.json` (§2.1) |
| 45 | npm registry | culori, chroma-js, colorjs.io, colorthief, node-vibrant, color-blind, apca-w3, blobs, bezier-easing, tinycolor2, color-namer, ntc-ts, colornames, color-name-list, spectral.js, mixbox, @tailwindcss/postcss | OK — see §4 feasibility (licence traps: **mixbox CC-BY-NC**, **apca-w3 "Limited W3 License"**, ntc-ts CC-BY-4.0) |

---

## 2. Hard numbers found

### 2.1 Semrush US database (webcaretakers exports, ~April 2026) [SR-US]

| Keyword | US vol | CPC | Paid comp | Trend (12 mo, 1.00 = peak) |
|---|---|---|---|---|
| contrast (generic) | 40,500 | $0 | 0 | — |
| **color contrast checker** | **9,900** | **$3.40** | 0.01 | 0.81-1.00, flat |
| **contrast checker** | **6,600** | **$2.41** | 0.01 | — |
| contrasting colors | 4,400 | $1.37 | 0.03 | — |
| **what is my color palette** (seasonal colour analysis intent) | **3,600** | $0.57 | 0.23 | — |
| color contrast | 2,900 | **$5.65** | 0 | — |
| chrome plugin color picker | 2,900 | $2.39 | 0 | — |
| accessibility checker | 2,900 | $3.01 | 0.48 | — |
| ada compliance checker | 5,400 | $3.63 | 0.73 | — (site-audit intent; not client-side feasible for URLs) |
| **rgb to hex** | **18,100** | $0.06 | 0.01 | — |
| **colour by hex** | **18,100** | $0 | 0 | — |
| hex to rgb | 9,900 | $0.03 | 0.03 | 0.36-0.66, **declining** |
| rgb color hexadecimal | 9,900 | $0.06 | — | — |
| rgb color in hex | 6,600 | $0.06 | — | — |
| hex converter | 5,400 | $0 | — | — |
| rgb hex / rgb to hexadecimal color | 5,400 each | ~$0.06 | — | — |
| hex code color | 4,400 | $0.03 | — | — |
| hexadecimal to rgb color / red green blue to hex | 4,400 each | — | — | — |

**Key takeaways**
1. **Contrast checking is the money keyword of this category**: CPC $2.41-$5.65 US (accessibility/ADA compliance vendors bid on it), stable trend, 16.5k US exact (color contrast checker + contrast checker) → est. **40k-80k global** for the cluster.
2. HEX/RGB conversion has volume but **near-zero CPC ($0.03-$0.06)** and a declining trend (AI Overviews + Google's own colour widget answer it). Build it for topical completeness, not revenue.
3. "what is my color palette" (3.6k US) is the seasonal colour-analysis trend: a fashion/beauty audience with broader CPCs than dev audiences.

### 2.2 Competitor traffic (demand proxy) [SW] + Umbrella ranks [U]

| Site | Main intent served | Traffic seen | Umbrella rank |
|---|---|---|---|
| coolors.co | palette generator, color picker, contrast, gradient, image palette | 4.5M (Sep 2025) → **5.58M (May 2026)** | 155,461 |
| htmlcolorcodes.com | color picker, color codes, color names, charts | **~3.1M (Mar 2026)**; 2.92M alt | 297,272 |
| imagecolorpicker.com | color from image | **3.1M (Jan 2026)**, 54% organic | 341,965 |
| color-hex.com | per-hex pages, palettes | **~2.5M (Jul 2026)** | 242,295 |
| colorhexa.com | per-hex pages, converter, blindness sim | **854K (May 2026)** | 383,061 |
| cssgradient.io | CSS gradient generator | **664K (Sep 2024)** | n/l |
| colorhunt.co | curated palettes | **640K search visits (Aug 2026)**, US 20%, India 18% | 481,002 |
| encycolorpedia.com | per-hex pages, paint matches | **481K (May 2026)** | 240,237 |
| paletton.com | colour-wheel scheme designer | **176K** | n/l |
| neumorphism.io | neumorphism generator | rank ~#714k global, **-29.5% MoM** (Aug 2026) | n/l |
| color.adobe.com | palette / colour wheel / from image | (Adobe) | 331,193 |
| webaim.org | contrast checker (#1 for "contrast checker") | — | 382,312 |
| w3schools.com | now runs CSS Visual Tools (gradient, box shadow, text shadow, glassmorphism…) | — | **27,259** |
| fonts.google.com | font preview / pairing | — | 42,588 |
| tailwindcss.com | tailwind colors docs | — | 10,394 |
| toptal.com (css3maker) | CSS3 generators | — | 273,174 |
| omnicalculator.com / rapidtables.com | golden ratio, converters | — | 78,292 / 136,866 |
| smallseotools.com (reference) | — | — | 386,948 |

Reading: color is a **proven multi-million-visit vertical** where even single-purpose sites (imagecolorpicker, color-hex) reach 2.5-3M visits/month. The CSS-generator niche is much smaller per tool (cssgradient.io ~0.66M at its best; neumorphism.io fading), but it has high engagement, many tools, and page 1 is shared with small indie sites, **which is the realistic entry point for a new domain**.

### 2.3 Low-credibility figures (recorded only for relative order; DO NOT quote)
BlogGhar tool-idea list (sibling-downloaded, rounded "500K+" style, likely all-countries broad match): Color Palette Generator 1M+, Gradient Generator 500K+, CSS Gradient Generator 500K+, Image Color Picker 500K+, Favicon Generator 500K+, Color Converter 400K+, Flexbox/Grid Generator 400K+, Box Shadow/Border Radius 300K+, Font Preview/Tester 300K+, CSS Animation Generator 300K+, Color Blindness Test 300K+, Icon Font Generator 200K+. pixeltools PRD: "color picker from image 500K". colorSnap blog: "image color picker online 2,400+/mo". These inflate [E] by roughly 5-20x for the CSS generators; the relative order (palette > gradient > flex/grid > shadow) matches my estimates.

---

## 3. Inventory evidence: what the dev community builds [TH]

tiny-helpers.dev (708 helpers, hand-curated, closed to new submissions in 2026 because of "AI slop") tag counts: **CSS 126, Misc 88, Images 70, Color 68, SVG 63, Fonts 36, Icons 35, Accessibility 27, Animations 14**. CSS + Color + SVG are the three biggest tags, so this is where developers look for small single-purpose tools.

Tool types that show up repeatedly (= validated demand, and real phrasing to reuse):
- **Color:** palette generators (Coolors, Huemint, khroma, pppalette, Palettte, Huey, couleur.io, MyColorSpace), accessible-palette builders (Accessible Palette, Harmonizer (OKLCH), InclusiveColors, Huetone, ColorBox, Primer Prism, Colorca, Color Cube, Eightshapes Contrast Grid), contrast checkers (Color.review, WhoCanUse, Contrast ratio, OddContrast, "Color contrast checker (WCAG and APCA)"), converters (Color Converter "HEX, RGB, HSL, CMYK, and OKLCH", OKLCH color converter, LCH Colour Picker, Colouris, Easy Colour), tint & shade generator ("tints and shades of a given hex color in 10% increments"), **Sorted CSS Colors** (named CSS colours), #HEXWORDS, Alphredo (translucent colour equivalent), tints.dev (Tailwind), hue.tools (mix, blend), Parametric Color Mixer, gradient tools (uiGradients, Grabient, HD Gradients, Polychroma, Vivid gradient generator "without the gray dead zone", Non Boring Gradients, Meshy / Mesher / MSHR mesh gradients).
- **CSS:** box-shadow (Box Shadows, boxshadows.xyz, Shadow Palette Generator, Shadow Elevation Editor, CSS Shadow Gradients, Beautiful CSS box-shadow examples), gradient text generator, glassmorphism generator, Neumorphism.io, Fancy-Border-Radius, Clippy (clip-path), CSS Arrow Please (triangle/arrow), CSS Stripes / Polka Dot / CSS Background Patterns, Scrollbar.app, range-input.css, skeleton-loader, Whirl (CSS loaders), Animista, cubic-bezier, Easing Wizard, easings.net, linear() generator, CSS Flex Generator, Flexbox Playground, CSS Grid Cheat Sheet, CSS Layout Generator, Clamp Calculator, Fluid Type Scale Calculator, type-scale, Modular Scale, Ratio Buddy (aspect ratio), Tailwind CSS Cheat Sheet, CSS2JS, InstaFilters (CSS filters), Filter blend (blend modes), CSS Duotone Generator, Animated Gradient Background Generator, Dashed/Dotted Border Generator, Custom Borders using Mask, Cut Corners using Mask & Clip-path, Pixelated rounded corners.
- **SVG:** GetWaves, Svg Wave, Wicked Wave Backgrounds, Curved page dividers, Custom Shape Dividers, haikei, ssshape (blobs), Hero Patterns, Pattern Monster, Doodad Pattern Generator, SVG Backgrounds, nnnoise (noise textures), ffflux, pppointed (arrows), lllove, SVG Filters builders, Color Morph (SVG gradients), SVG Favicon Maker (letter/emoji).
- **Fonts:** Fontjoy, fontpair, Fontastic Space (pairings), useFonts, GooFonts, Font Flipper (preview), Modern Font Stacks, Fallback Font Generator, type-scale, Fluid Type Scale, Modern fluid typography editor.

it-tools fork (sharevb) color/CSS set: color-converter, color-contrast-checker (keywords: color, contrast, checker, wcag), color-wheel, css-gradient-generator, css-units-converter, rem-px-converter, font-compare, svg-placeholder-generator, image-to-css.

---

## 4. Feasibility notes (all client-side unless noted)

| Need | Library / API | Licence | Notes |
|---|---|---|---|
| Colour maths, OKLCH, gamut mapping, ΔE | **culori 4.0.2**, colorjs.io 0.7.1 | MIT | culori is tree-shakable; covers OKLCH/LCH/P3/HSL/HWB/Lab |
| General colour utils | chroma-js 3.2.0 (BSD-3 + Apache-2), tinycolor2 1.6.0 (MIT) | permissive | |
| Palette from image | colorthief 3.5.0, node-vibrant 4.0.4 | MIT | Canvas getImageData + k-means/median cut; no upload to a server |
| Colour names (hex → nearest name) | color-name-list 14.51.0 (~30k names), colornames 1.1.1, color-namer 1.4.0 | MIT | **ntc-ts is CC-BY-4.0** → attribution needed; prefer color-name-list |
| WCAG 2.x contrast | own code (relative luminance formula is public) | — | trivial |
| APCA (WCAG 3 draft) | apca-w3 0.1.9 | **"Limited W3 License"** — restrictive; read before shipping or show APCA as an informational "Lc" value computed from the published formula with attribution | |
| Colour-blindness simulation | Brettel/Viénot/Machado matrices (public research); `color-blind` 0.1.3 has **no licence** → write own | — | Canvas per-pixel or SVG `feColorMatrix`; works on uploaded image locally |
| Paint-like colour mixing | **spectral.js 3.0.0 (MIT)**, Kubelka-Munk | MIT | **Do NOT use mixbox 2.0.0: CC-BY-NC-4.0 (non-commercial) = incompatible with an AdSense site** |
| Blob shapes | blobs 2.3.0-beta (MIT) or own Catmull-Rom | MIT | |
| Cubic bezier | bezier-easing 3.1.0 (MIT) | MIT | |
| Tailwind v4 shade scale (OKLCH) | own code on culori; @tailwindcss/postcss 4.3.3 not needed client-side | MIT | Output both `tailwind.config.js` (v3) and `@theme` CSS vars (v4) |
| Google Fonts preview / pairing | Google Fonts CSS API (free, no key) or self-host subset | OFL fonts | **GDPR note**: a 2022 German court fined a site for loading Google Fonts from Google servers (IP transfer). Load only after user action, or self-host a curated set of ~100 OFL fonts |
| Liquid glass | `backdrop-filter` + SVG `feDisplacementMap`/`feTurbulence` | — | Displacement inside backdrop-filter is Chromium-only as of 2026; must provide Safari/Firefox fallback (frosted blur only) and say so on page |
| Mesh gradient | layered radial-gradients (CSS) or Canvas/WebGL render to PNG | — | client-side |
| Font identification from image ("WhatTheFont") | needs ML + font DB | — | **infeasible** client-side at quality |
| URL-based checks ("check contrast of my website", "extract colors from website URL") | needs server fetch | — | **server-light roadmap only** |

---

## 5. Per-tool notes: long-tail phrases + People-Also-Ask (for content writers)

Volumes are global English monthly. **(E)** = estimate; see §0.

### 5.1 Color contrast checker (WCAG)  — `/color-contrast-checker`
- Volume: color contrast checker 9,900 US + contrast checker 6,600 US + color contrast 2,900 US [SR-US] → **40k-80k global cluster** (E). CPC $2.41-$5.65 US.
- SERP: WebAIM (strong, .org, #1), coolors.co/contrast-checker, accessibilitychecker.org, contrastchecker.com (EMD), userway.org, atmos.style, digitala11y, contrast-finder.org, achecks.org, Chrome/Firefox extension pages. Competition **medium-high on the head, low on long tail**.
- Long tail: wcag contrast checker · wcag 2.2 contrast checker · accessible color contrast checker · text contrast checker · background color contrast checker · contrast ratio calculator · contrast ratio checker · color contrast analyzer · apca contrast checker · wcag aa contrast ratio · wcag aaa contrast · contrast checker for buttons / non-text contrast 3:1 · contrast checker for links · contrast checker with suggestions (auto-fix lighter/darker) · palette contrast grid · ada color contrast checker · contrast checker chrome extension (intent: tool).
- PAA: What is a good color contrast ratio? · What is the WCAG 2.1/2.2 contrast requirement (4.5:1 AA normal text, 3:1 large text, 7:1 AAA)? · What counts as "large text" (18pt / 14pt bold ≈ 24px / 18.66px)? · How is contrast ratio calculated? (relative luminance formula) · Does WCAG contrast apply to logos? (no) · What is APCA and will it replace WCAG 2 contrast in WCAG 3? · Does contrast apply to placeholder text / disabled buttons? · Is white text on orange accessible? · How do I fix low contrast errors from Lighthouse? · Is ADA compliance required for websites (US)? (answer carefully, no legal advice).
- Differentiators: auto-suggest nearest passing colour (OKLCH lightness search), test a whole palette (grid), colour-blind preview, APCA Lc shown as informational, Lighthouse error explanation.

### 5.2 Color picker (HEX/RGB/HSL/OKLCH)  — `/color-picker`
- Volume: "color picker" **500k-1M+ global** (E), but **Google shows its own interactive colour picker** for "color picker" / "hex color picker" / "rgb color picker" → large zero-click share. "html color picker" 20k-40k, "hex color picker" 20k-50k, "rgb color picker" 10k-30k, "colour picker" (UK spelling) 20k-40k (E).
- SERP: Google widget, htmlcolorcodes.com (3.1M visits), Figma, Picsart, WebFX, coolors, atmos, redketchup. **High competition.**
- Long tail: color picker online · hex color picker · html color picker · rgb color picker · css color picker · color picker from screen (EyeDropper API, Chrome/Edge only) · color picker with opacity · oklch color picker · hsl color picker · color code finder · colour picker (UK) · pick color from screen online · color picker wheel.
- PAA: How do I find the hex code of a colour on my screen? · How do I use the eyedropper in Chrome? · What is the difference between HEX and RGB? · What is HSL? · What is OKLCH and why does Tailwind v4 use it? · How many colours are there in hex (16,777,216)? · How do I pick a colour from a website?
- Note: build as the hub of the colour section (internal links to every colour tool); expect traffic from long-tail, not the head.

### 5.3 Color palette generator  — `/color-palette-generator`
- Volume: **150k-400k global** (E) ("color palette generator", "colour palette generator", "color scheme generator", "palette generator").
- SERP: Coolors (5.6M visits), Adobe Color, Canva, Figma, MagicPattern, colors.muz.li, Colormind, Huemint, khroma, supercolorpalette. **High.**
- Long tail: random color palette generator · color scheme generator · website color palette generator · brand color palette generator · ui color palette generator · pastel color palette generator · dark mode palette generator · accessible color palette generator · color palette generator from hex · 5 color palette generator · color palette generator for logo · color combination generator · aesthetic color palette generator · ai color palette generator (intent: tool; can be done with deterministic harmony rules, do not claim AI unless real).
- PAA: How do I create a color palette for my brand/website? · What is the 60-30-10 rule? · How many colours should a website have? · What are complementary / analogous / triadic colours? · How do I choose colours that go together? · What is a monochromatic palette?
- Angle for a new domain: niche sub-pages (pastel, earthy, dark-mode, accessible, "for website") and a "preview palette on a real UI" feature (Realtime Colors style).

### 5.4 Color palette from image (image color extractor)  — `/color-palette-from-image`  (**overlap: image-media.md "image color picker"; coordinate**)
- Volume: "color palette from image" / "image color picker" / "color picker from image" / "extract colors from image" **40k-120k global cluster** (E; imagecolorpicker.com alone has 3.1M visits).
- SERP: imagecolorpicker.com, Adobe Color (create/image), Canva, Coolors image picker, redketchup, jukeboxprint, pinetools. **Medium-high.**
- Long tail: extract color palette from image · get hex code from image · color picker from image online · photo color palette generator · pick color from photo · find color in image · dominant color of image · color palette from logo · color palette from screenshot.
- PAA: How do I get the hex code of a colour in a picture? · How do I extract a colour palette from a photo? · Can I pick a colour from an image on iPhone?
- Decide ownership with the image category (one page, not two). Recommend: image category owns "image color picker" (pixel eyedropper); design category owns "palette from image" (k-means palette + export CSS/Tailwind/ASE).

### 5.5 CSS gradient generator  — `/css-gradient-generator`
- Volume: "css gradient generator" 15k-30k, "gradient generator" 30k-60k, "css gradient" 40k-80k (mix of doc intent), "gradient background generator"/"gradient maker" 10k-20k (E). Cluster **60k-150k**.
- SERP: W3Schools tool, cssgradient.io (664K visits), ColorZilla, Josh Comeau (OKLCH-aware), cssportal, angrytools, elementor, learnui.design, creative-tim (Tailwind). **Medium-high.**
- Long tail: linear gradient generator · radial gradient generator · conic gradient generator · css gradient background · gradient color generator · two color gradient · gradient hex codes · gradient without gray dead zone (OKLCH interpolation) · smooth gradient generator (easing gradients) · tailwind gradient generator · animated gradient background css · gradient to image (download PNG/wallpaper) · gradient border css · repeating linear gradient.
- PAA: How do I make a gradient in CSS? · How do I add a gradient to text in CSS? · How do I make a gradient border? · What is the difference between linear-gradient and radial-gradient? · How do I animate a gradient? · Why do my gradients look muddy/gray in the middle? (sRGB interpolation → use `in oklch`) · How do I make a transparent gradient?

### 5.6 Mesh gradient generator  — `/mesh-gradient-generator`
- Volume: **5k-15k**, rising with Figma/Apple-style wallpapers (E).
- SERP: csshero.org/mesher, meshgradient.com, MagicPattern, Figma community plugins, Meshy, MSHR. **Low-medium** (all small sites).
- Long tail: mesh gradient css · mesh gradient background · mesh gradient generator free · figma mesh gradient · aurora gradient generator · blurry gradient background · grainy gradient generator (noise) · gradient wallpaper generator 4k.
- PAA: What is a mesh gradient? · Can you make a mesh gradient in CSS? · How do I add grain/noise to a gradient?

### 5.7 CSS box shadow generator  — `/box-shadow-generator`
- Volume: "box shadow generator" 10k-25k, "css box shadow generator" 5k-12k, "css box shadow" 20k-40k (doc intent) (E). Cluster **30k-70k**.
- SERP: W3Schools, MDN generator, cssportal, html-css-js, 10015.io, cssmatic, unused-css, webcode.tools, box-shadow.art, toptal css3maker. **Medium.**
- Long tail: box shadow css generator · layered box shadow / smooth shadow generator · soft shadow css · inner shadow css (inset) · box shadow examples · material design shadow css · tailwind shadow generator · drop shadow generator · css shadow on one side · box shadow bottom only.
- PAA: How do I add a shadow to only one side? · What is the difference between box-shadow and drop-shadow()? · What does spread do? · How do I make a realistic shadow? (layered shadows) · Does box-shadow affect performance?

### 5.8 CSS text shadow generator  — `/text-shadow-generator`
- Volume: **5k-15k** (E). SERP: W3Schools, html-css-js, cssportal, css3gen, toptal. **Medium-low.**
- Long tail: text shadow css · neon text effect css · glow text generator · outline text css (text-stroke) · 3d text css · long shadow text · text shadow examples.
- PAA: How do I make glowing text in CSS? · How do I outline text in CSS? · Can text-shadow have multiple shadows?

### 5.9 Border radius generator  — `/border-radius-generator`
- Volume: **5k-15k** incl. "fancy border radius" (E). SERP: 9elements fancy-border-radius, cssportal, html-css-js, webcode.tools, W3Schools doc. **Low-medium.**
- Long tail: fancy border radius generator · css rounded corners generator · organic shape css · border radius blob · squircle css generator (smooth corners; rising with `corner-shape` CSS in Chrome 139+) · border-radius percentage vs px.
- PAA: How do I make a circle with border-radius? · What do 8-value border-radius values mean? · What is a squircle?

### 5.10 Glassmorphism generator  — `/glassmorphism-generator`
- Volume: **10k-25k** (E; peaked 2021, stable). SERP: css.glass, hype4.academy, W3Schools, 10015.io, coddy.tech, utiltoolkits, iotools.cloud, evvytools. **Medium.**
- Long tail: glassmorphism css · frosted glass effect css · backdrop filter blur css · glass card css · glassmorphism tailwind · glass ui generator.
- PAA: What is glassmorphism? · Why does backdrop-filter not work? (needs semi-transparent background; Firefox history) · Is glassmorphism accessible?

### 5.11 Liquid glass CSS generator  — `/liquid-glass-generator`  (**trend opportunity**)
- Volume: **2k-10k and rising** since Apple announced "Liquid Glass" (iOS 26, June 2025) (E).
- SERP: hiredigital.com, design.dev, glasscss.com, aethercss.lovable.app, liquid-glass-pi.vercel.app, a GitHub repo, a Medium post, CSS-Tricks article. **LOW** (no big brand has a tool yet).
- Long tail: liquid glass css · ios 26 liquid glass css · apple liquid glass effect css · liquid glass tailwind · liquid glass svg filter · liquid glass react · liquid glass figma (content only) · liquid glass generator free.
- PAA: What is Apple's Liquid Glass? · Can you make liquid glass in pure CSS? · Why does the refraction only work in Chrome? · How is liquid glass different from glassmorphism?
- Risk note: "Liquid Glass" is Apple's name for its design language. Descriptive use ("liquid glass effect") is fine; do not use Apple logos, do not imply affiliation.

### 5.12 Neumorphism generator  — `/neumorphism-generator`
- Volume: **4k-10k**, declining (neumorphism.io -29.5% MoM, Aug 2026) (E).
- SERP: neumorphism.io, codeshack, coddy, boogiejack, 10015. **Low-medium.**
- Long tail: neumorphism css · soft ui css generator · neumorphic button css · neumorphism shadow.
- Recommendation: combine with glassmorphism/"UI effects" hub, or a separate cheap page.

### 5.13 CSS button generator  — `/css-button-generator`
- Volume: **5k-15k** (E). SERP: css3buttongenerator.com, bestcssbuttongenerator.com, cssbuttons.io, uiverse.io (community examples), html-css-js. **Medium-low.**
- Long tail: css button generator · html button generator · button hover effect css · gradient button css · 3d button css · tailwind button generator · accessible button colors (links to contrast).
- PAA: How do I style a button in CSS? · How do I make a button hover effect?

### 5.14 CSS animation / keyframes generator  — `/css-animation-generator`
- Volume: **5k-15k** ("css animation generator", "keyframes generator", "css animation maker") (E). SERP: animista.net, keyframes.app, webcode.tools, angrytools, cssanimate. **Low-medium.**
- Long tail: css keyframe animation generator · fade in animation css · bounce animation css · css hover animation · text animation css generator · css loading animation (see 5.15).
- PAA: How do I create a keyframe animation? · What is the difference between transition and animation? · How do I make an animation loop / pause?

### 5.15 CSS loader / spinner generator  — `/css-loader-generator`
- Volume: **3k-10k** (E). SERP: loading.io (strong, freemium), cssloaders.github.io, Whirl, uiverse. **Medium-low.**
- Long tail: css spinner · pure css loader · loading animation css · skeleton loader css · svg spinner generator.

### 5.16 Cubic-bezier / easing generator  — `/cubic-bezier-generator`
- Volume: **3k-8k** (E). SERP: cubic-bezier.com (Lea Verou), easings.net, Easing Wizard, MDN. **Low-medium.**
- Long tail: css easing functions · ease in out cubic bezier · css linear() easing generator · spring easing css · bounce easing css · easing cheat sheet.
- PAA: What does cubic-bezier(0.25, 0.1, 0.25, 1) mean? · What is ease vs ease-in-out? · What is the CSS linear() function?

### 5.17 CSS clip-path generator  — `/clip-path-generator`
- Volume: **5k-15k** (E). SERP: Clippy (bennettfeely.com, strong but old), cssportal, css-generators, MDN. **Low-medium.**
- Long tail: clip path maker · css polygon generator · css shapes generator · clip-path circle · clip-path triangle · svg to clip-path · css shape() function generator (new).
- PAA: How do I cut a shape in CSS? · How do I clip an image into a circle/hexagon? · clip-path vs mask?

### 5.18 CSS triangle / arrow / tooltip generator  — `/css-triangle-generator`
- Volume: **2k-6k** (E). SERP: css-tricks article, cssarrowplease, cssportal, triangle generators on small sites. **Low.**
- Long tail: css triangle · css arrow · tooltip arrow css · speech bubble css generator · css chevron.

### 5.19 Flexbox generator / playground  — `/flexbox-generator`
- Volume: **5k-15k** tool intent (E) ("flexbox generator", "css flexbox generator", "flexbox playground"); "flexbox" head is doc/game intent (css-tricks guide, Flexbox Froggy).
- SERP: loading.io/flexbox, angrytools, flexbox.help, CSS-Tricks guide, MDN. **Medium-low.**
- Long tail: flexbox cheat sheet · css flexbox center · flex wrap gap · tailwind flex generator.
- PAA: How do I center a div with flexbox? · Flexbox vs grid? · What does flex: 1 mean?

### 5.20 CSS grid generator  — `/css-grid-generator`
- Volume: **10k-25k** (E). SERP: cssgrid-generator.netlify.app (Sarah Drasner), layoutit.com/grid, grid.layoutit, angrytools. **Medium-low.**
- Long tail: css grid layout generator · grid template areas generator · responsive grid generator · tailwind grid generator · bento grid generator (trend) · masonry grid css.
- PAA: How do I make a responsive grid without media queries? (`repeat(auto-fit, minmax())`) · What is grid-template-areas? · grid vs flexbox?

### 5.21 Color blindness simulator  — `/color-blindness-simulator`
- Volume: **5k-15k** ("color blindness simulator", "color blind simulator", "coblis") (E).
- SERP: Coblis (color-blindness.com), pilestone, colorhexa (blindness view), Adobe/Figma docs. **Low-medium.**
- Long tail: color blind filter for images · protanopia simulator · deuteranopia simulator · tritanopia simulator · see through color blind eyes · color blind friendly palette checker.
- PAA: What do colour-blind people see? · What are the types of colour blindness? · How do I design for colour-blind users? · Which colours should I avoid together (red/green)?

### 5.22 Color blind test (screening)  — `/color-blind-test`  (**health-adjacent, disclaimer required**)
- Volume: **100k-300k global** ("color blind test", "colour blindness test", "am I color blind") (E).
- SERP: EnChroma (brand, commercial), colormax, colorlitelens, colorblindnesstest.org, eyewear sites, health sites. **Medium-high.**
- Feasibility: procedurally generated Ishihara-style dot plates (do NOT copy the copyrighted Ishihara book scans); client-side.
- AdSense risk: **low-medium**. Health-adjacent → must say "screening only, not a medical diagnosis, see an optometrist"; no medical claims.

### 5.23 Tint & shade generator / color shades  — `/color-shades-generator`
- Volume: tool intent **5k-15k** ("tint and shade generator", "color shades generator", "lighten color hex"); informational "shades of X" pages are huge (e.g. "shades of blue/green/pink/purple" each **50k-200k global**) but served by Canva/blogs/image-heavy SERPs (E).
- SERP (tool): maketintsandshades.com, htmlcolorcodes, colorhexa, w3schools color shades. **Low-medium.**
- Long tail: lighten hex color · darken hex color · color tints · color shades · hex color lighter · monochromatic color generator · shades of [colour] with hex codes · tints and shades of a color.
- pSEO option: ~20-40 hand-built "Shades of <Color> (hex codes)" pages with real value (swatches, names, palettes, contrast). **Do not mass-generate thousands** (see §7).

### 5.24 Color name finder / hex color lookup  — `/color-name-finder` (+ curated `/colors/<name>` pages)
- Volume: "color name finder" / "hex to color name" / "what color is this hex" / "name that color" **10k-30k** (E); per-hex lookups ("#000080", "#ff6347 color") form a huge long tail that color-hex.com (2.5M), colorhexa (854K), encycolorpedia (481K) monetize.
- SERP: color-name.com, chir.ag "Name that Color", colorhexa, encycolorpedia, htmlcolorcodes. **Medium.**
- Long tail: color name from hex · find color name · what is the name of this color · hex code to name · css color names list · html color names · named colors · 140 css colors.
- PAA: What are the 140 CSS colour names? · What colour is #xxxxxx? · How do I find the name of a colour?
- Risk: 16.7M per-hex pages = scaled content abuse (§7). Launch only a finder tool + CSS named colours (148) + a few hundred curated colour pages.

### 5.25 Color wheel & harmony (complementary, analogous, triadic)  — `/color-wheel`
- Volume: "color wheel" **100k-250k** global (art education + tool), "complementary color" 30k-60k (informational), "complementary color calculator/finder" 2k-6k, "color scheme generator" in 5.3 (E).
- SERP: Canva color wheel, Adobe Color, paletton (176K), sessions.edu, colordesigner, Wikipedia. **High on head, low on "complementary color calculator".**
- Long tail: complementary color finder · complementary color of [hex] · opposite color finder · split complementary · triadic color scheme · analogous colors · color harmony generator · rgb color wheel · ryb color wheel (painters).
- PAA: What is the complementary colour of blue/green/purple? · What is a triadic colour scheme? · RYB vs RGB colour wheel? · What colours go well with X?

### 5.26 Color mixer / "what colors make X"  — `/color-mixer`
- Volume: "color mixer" 15k-40k; "mix colors online" 3k-8k; informational "what colors make purple/brown/green/pink/grey…" each **10k-60k** (E).
- SERP: trycolors.com (strong), colordesigner.io mixer, Canva/blog articles; AI Overviews answer "what colors make X". **Medium.**
- Feasibility: paint (subtractive) mixing via **spectral.js (MIT)**; light (additive) via RGB averaging. **Avoid mixbox (CC-BY-NC).**
- Long tail: paint color mixer · color mixing calculator · mix two colors hex · blend colors css (`color-mix()`) · what color do blue and yellow make · color mixing chart.
- PAA: What two colours make purple? · How do you make brown/grey? · Why does mixing paint differ from mixing light? · What is CSS color-mix()?

### 5.27 HEX ↔ RGB(A) ↔ HSL ↔ CMYK ↔ OKLCH color converter  — `/color-converter`  (**owned by converters category; keep one page**)
- Volume: rgb to hex 18,100 US, colour by hex 18,100 US, hex to rgb 9,900 US [SR-US] → cluster 100k-200k global (E). CPC tiny ($0.03-$0.06).
- Design-side long tails that are lower competition: **hex to rgba** / **rgba to hex** / **8-digit hex (#RRGGBBAA)** / **hex opacity table** ("hex color transparency", "hex alpha values") 5k-15k combined (E); **oklch converter / hex to oklch** 2k-8k rising (E; Tailwind v4 default palette is OKLCH).
- PAA: How do I add transparency to a hex colour? · What is 50% opacity in hex (80)? · How do I convert hex to OKLCH? · What is the 8-digit hex code?

### 5.28 Tailwind color palette / shade generator  — `/tailwind-color-generator`
- Volume: **3k-10k** combined ("tailwind color generator", "tailwind color palette generator", "tailwind shade generator", "tailwind colors") (E); plus "tailwind colors" doc intent 10k-30k.
- SERP: uicolors.app, tints.dev, MagicPattern, tailwindcolor.tools, thefrontkit, tailkits, saasykit, web-toolbox.dev, tailwindcss.com docs. **Low-medium.**
- Long tail: tailwind custom color palette · tailwind v4 oklch colors · tailwind 50-950 shades · tailwind color to hex · hex to tailwind color (nearest class) · tailwind colors list · shadcn theme generator (adjacent, rising).
- PAA: How do I add custom colours in Tailwind v4 (`@theme`)? · How do I generate 50-950 shades? · Why did Tailwind switch to OKLCH?

### 5.29 CSS to Tailwind converter  — `/css-to-tailwind`
- Volume: **3k-10k** (E). SERP: transform.tools, tailwind-converter sites, small tools. **Low-medium.**
- Long tail: convert css to tailwind · tailwind to css converter · html css to tailwind online.
- Feasibility: rule mapping client-side; imperfect for complex CSS — be honest in UI.

### 5.30 Tailwind CSS cheat sheet (searchable)  — `/tailwind-cheat-sheet`
- Volume: **8k-20k** (E). SERP: nerdcave, flowbite, tailwindcomponents, Tailwind docs. **Medium-low.**
- Note: must track Tailwind v4 classes (v3 cheat sheets are outdated = opportunity).

### 5.31 Font pairing generator  — `/font-pairing-generator`
- Volume: "font pairing" / "font pairings" / "font combinations" / "google font pairings" **10k-30k** (E).
- SERP: Fontjoy, fontpair.co, Canva font combinations, Typewolf, Google Fonts (pairings feature). **Medium.**
- Long tail: font pairing generator · google font pairings · best font combinations for website · serif and sans serif pairing · font pairing for logo · heading and body font combinations.
- Risk: fonts must be OFL (Google Fonts) — never ship commercial fonts. GDPR loading note (§4).

### 5.32 Font preview / font tester  — `/font-previewer`
- Volume: 5k-15k ("font previewer", "font tester", "test fonts online", "preview google fonts") (E). SERP: Google Fonts itself, fontsquirrel, wordmark.it (tests installed fonts via Local Font Access). **Medium-high** (Google owns it).
- Angle: "preview your installed fonts" (Local Font Access API, Chromium) = wordmark.it style.

### 5.33 Type scale generator + fluid typography (clamp) calculator  — `/type-scale-generator`, `/clamp-calculator`
- Volume: type scale 3k-8k; clamp calculator / fluid typography calculator / "css clamp generator" 3k-8k (E).
- SERP: typescale.com, type-scale.com, utopia.fyi, clamp.font-size.app, fluid-type-scale.com, modularscale. **Low.**
- Long tail: modular scale calculator · typographic scale · font size scale generator · golden ratio typography · responsive font size css · css clamp font size · fluid spacing calculator.
- PAA: What is a type scale? · What ratio should I use (1.25 major third)? · How does clamp() work? · How do I make font size responsive?

### 5.34 Golden ratio calculator  — `/golden-ratio-calculator`  (**check converters-calculators ownership**)
- Volume: **10k-30k** (E). SERP: omnicalculator, calculator.net, goldennumber.net, grtcalculator (typography). **Medium.**
- Long tail: golden ratio typography calculator · golden ratio for design / logo · phi calculator · golden rectangle calculator · 1.618 calculator.

### 5.35 SVG wave / shape divider generator  — `/svg-wave-generator`
- Volume: **5k-15k** ("wave generator" is ambiguous with audio; "svg wave generator", "css wave", "wave background", "shape divider") (E).
- SERP: getwaves.io, haikei.app, svgwave.in, shapedivider.app, softr wave generator. **Low-medium.**
- Long tail: wave background svg · css wave animation · section divider svg · curved section css · layered waves generator.

### 5.36 Blob generator  — `/blob-generator`
- Volume: **5k-12k** (E). SERP: blobmaker.app, haikei, lokesh-coder blobs, softr. **Low-medium.**
- Long tail: svg blob generator · random blob shape · organic shape svg · animated blob css · blob background.

### 5.37 SVG / CSS background pattern generator  — `/pattern-generator`
- Volume: **5k-15k** ("pattern generator", "svg pattern generator", "background pattern generator", "css background patterns") (E).
- SERP: heropatterns.com, pattern.monster, MagicPattern, doodad.dev, svgbackgrounds.com, patternico. **Low-medium.**
- Long tail: seamless pattern generator · polka dot css · stripe pattern css · checkerboard css · grid background css · dot grid background · noise texture generator.

### 5.38 CSS filter generator + hex-to-CSS-filter  — `/css-filter-generator`
- Volume: "css filter generator" 2k-6k; "hex to css filter" / "svg color change css filter" 2k-6k (E). SERP: codepen (sosuke), isotropic.co, angel-rs, small sites. **Low.**
- Long tail: change svg color with css filter · css filter color · image filter css generator · instagram filters css.

### 5.39 CSS scrollbar generator  — `/scrollbar-generator`
- Volume: **2k-6k** (E). SERP: scrollbar.app, cssportal, w3schools how-to. **Low.**
- Long tail: custom scrollbar css · hide scrollbar css · scrollbar color css · thin scrollbar css.

### 5.40 Random color generator  — `/random-color-generator`
- Volume: **20k-50k** ("random color generator", "random color", "random hex color") (E). SERP: randomcolor sites, Google (random number widget only), coolors, htmlcolorcodes. **Medium-low.**
- Long tail: random color picker · random hex color · random color wheel spinner (games) · random color palette.
- Great internal-link feeder; trivially client-side.

### 5.41 Seasonal color analysis quiz ("what is my color palette")  — `/color-analysis-quiz`  (**roadmap; fashion audience**)
- Volume: "what is my color palette" 3,600 US [SR-US]; "color analysis quiz" / "seasonal color analysis" / "what season am I" **30k-100k global** (E; TikTok-driven trend 2024-2026).
- SERP: style blogs, colorwise.me, apps, "Dressing Your Truth"-type brands. **Medium.**
- Feasibility: questionnaire + optional local photo eyedropper for skin/hair/eye tone; no upload.
- Risk: low (fashion). Keep privacy copy ("photo never leaves your device").

---

## 6. Cross-category overlaps (coordinate with sibling files)

| Tool | Owned by | Note |
|---|---|---|
| HEX↔RGB / colour converter | converters-calculators.md (#32, est. 40k-100k) | Design pages link to it; design owns the **hex-to-rgba / 8-digit hex / OKLCH** long-tail variants |
| PX↔REM, CSS units | converters-calculators.md (#31, priority 9) | Link from typography tools |
| Aspect ratio calculator | converters-calculators.md (#40) | Don't duplicate |
| Image color picker (eyedropper) | image-media.md | Design owns "palette from image" |
| Favicon generator | image-media.md | Don't duplicate |
| Placeholder image generator | image-media.md | Don't duplicate |
| CSS minifier/beautifier | developer.md | Don't duplicate |

---

## 7. AdSense / policy / legal risk notes (2026)

- **All core tools in this category are AdSense-safe** (utilities with original explanatory content, no user-generated content, no restricted verticals).
- **Scaled content abuse** (Google spam policy since March 2024, still enforced in 2026) + AdSense "low-value content": do **not** auto-generate 16.7M hex-code pages or thousands of "shades of X"/"what colors make X" pages with templated text. colorhexa/encycolorpedia survive on 15+ years of authority; a new domain doing this risks a manual action or AdSense rejection. Use a curated set (≤ a few hundred pages, each with unique data: swatches, palettes, contrast, blindness preview, names) and noindex the long tail of arbitrary hex values if a lookup route exists.
- **Pantone / RAL / paint-brand colour matching** (Pantone to hex, Sherwin-Williams to hex, Benjamin Moore to hex): Pantone colour data is proprietary and licensed; paint-brand names are trademarks. **Exclude** from launch.
- **Colour-blind test:** health-adjacent. Needs a "screening only, not a diagnosis" disclaimer; generate our own plates (Ishihara book plates are copyrighted material).
- **Liquid Glass:** Apple's trademarked design language name. Use descriptively only, no Apple logos/branding.
- **Fonts:** only OFL/Apache fonts; Google Fonts loading needs a GDPR-aware approach for EU visitors.
- **Libraries:** mixbox (CC-BY-NC) is non-commercial → forbidden on an ad site; apca-w3 has a restrictive licence → review before use; ntc-ts needs attribution.
- No downloader/proxy/cheating/fake-document risk exists in this category.

---

## 8. Candidate table

Priority 10 = must launch with. Competition is realistic **for a brand-new domain**.

| # | Tool | Slug | Primary keyword | Est. global vol. | Source | Comp. | Feasibility | AdSense risk | Priority |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Color Contrast Checker (WCAG + APCA) | color-contrast-checker | color contrast checker | 40k-80k cluster (16.5k US exact) | [SR-US] + E | high head / low long-tail | client | none | 10 |
| 2 | CSS Gradient Generator | css-gradient-generator | css gradient generator | 60k-150k cluster | E + [SW] cssgradient.io 664K | medium-high | client | none | 9 |
| 3 | Color Palette Generator | color-palette-generator | color palette generator | 150k-400k | E + [SW] coolors 5.58M | high | client | none | 8 |
| 4 | Box Shadow Generator | box-shadow-generator | box shadow generator | 30k-70k cluster | E | medium | client | none | 9 |
| 5 | Color Picker (HEX/RGB/HSL/OKLCH) hub | color-picker | color picker | 500k-1M+ (big zero-click) | E + [SW] htmlcolorcodes 3.1M | high | client | none | 8 |
| 6 | Tailwind Color Shade Generator | tailwind-color-generator | tailwind color generator | 3k-10k (+10k-30k "tailwind colors") | E + [SERP] | low-medium | client | none | 8 |
| 7 | Liquid Glass CSS Generator | liquid-glass-generator | liquid glass css generator | 2k-10k rising | E + [SERP] | low | client | low (trademark wording) | 8 |
| 8 | Glassmorphism Generator | glassmorphism-generator | glassmorphism generator | 10k-25k | E + [SERP] | medium | client | none | 7 |
| 9 | Tint & Shade Generator | color-shades-generator | tint and shade generator | 5k-15k tool (+huge "shades of X") | E | low-medium | client | low if not mass-generated | 8 |
| 10 | Color Palette from Image | color-palette-from-image | color palette from image | 40k-120k cluster | E + [SW] imagecolorpicker 3.1M | medium-high | client | none | 7 |
| 11 | Color Blindness Simulator | color-blindness-simulator | color blindness simulator | 5k-15k | E | low-medium | client | none | 7 |
| 12 | Color Blind Test | color-blind-test | color blind test | 100k-300k | E | medium-high | client | low-medium (health disclaimer) | 6 |
| 13 | Color Wheel & Harmony / Complementary | color-wheel | color wheel | 100k-250k (+complementary 30k-60k) | E + [SW] paletton 176K | high head / low calculator | client | none | 7 |
| 14 | Color Mixer | color-mixer | color mixer | 15k-40k (+ "what colors make X") | E | medium | client | none | 7 |
| 15 | Color Name Finder / Hex Lookup | color-name-finder | color name finder | 10k-30k (+per-hex long tail) | E + [SW] color-hex 2.5M | medium | client | medium if programmatic at scale | 7 |
| 16 | HEX to RGBA / Hex Opacity | hex-to-rgba | hex to rgba | 5k-15k | E + [SR-US] cluster | low-medium | client | none | 7 |
| 17 | OKLCH Color Converter/Picker | oklch-color-picker | oklch color picker | 2k-8k rising | E | low | client | none | 7 |
| 18 | Random Color Generator | random-color-generator | random color generator | 20k-50k | E | medium-low | client | none | 7 |
| 19 | CSS Grid Generator | css-grid-generator | css grid generator | 10k-25k | E | medium-low | client | none | 7 |
| 20 | Flexbox Generator | flexbox-generator | flexbox generator | 5k-15k | E | medium-low | client | none | 6 |
| 21 | Border Radius Generator | border-radius-generator | border radius generator | 5k-15k | E | low-medium | client | none | 7 |
| 22 | Text Shadow Generator | text-shadow-generator | text shadow generator | 5k-15k | E | medium-low | client | none | 6 |
| 23 | CSS Clip-path Generator | clip-path-generator | css clip path generator | 5k-15k | E | low-medium | client | none | 7 |
| 24 | CSS Button Generator | css-button-generator | css button generator | 5k-15k | E | medium-low | client | none | 6 |
| 25 | CSS Animation Generator | css-animation-generator | css animation generator | 5k-15k | E | low-medium | client | none | 6 |
| 26 | CSS Loader Generator | css-loader-generator | css loader generator | 3k-10k | E | medium-low | client | none | 5 |
| 27 | Cubic Bezier Generator | cubic-bezier-generator | cubic bezier generator | 3k-8k | E | low-medium | client | none | 6 |
| 28 | Mesh Gradient Generator | mesh-gradient-generator | mesh gradient generator | 5k-15k rising | E | low-medium | client | none | 7 |
| 29 | Neumorphism Generator | neumorphism-generator | neumorphism generator | 4k-10k declining | E + [SW] | low-medium | client | none | 5 |
| 30 | SVG Wave Generator | svg-wave-generator | svg wave generator | 5k-15k | E | low-medium | client | none | 6 |
| 31 | Blob Generator | blob-generator | blob generator | 5k-12k | E | low-medium | client | none | 6 |
| 32 | Pattern Generator | pattern-generator | svg pattern generator | 5k-15k | E | low-medium | client | none | 6 |
| 33 | Font Pairing Generator | font-pairing-generator | font pairing | 10k-30k | E | medium | client | low (GDPR font loading) | 6 |
| 34 | Type Scale Generator | type-scale-generator | type scale generator | 3k-8k | E | low | client | none | 6 |
| 35 | CSS Clamp Calculator | clamp-calculator | css clamp calculator | 3k-8k | E | low | client | none | 7 |
| 36 | CSS Triangle Generator | css-triangle-generator | css triangle generator | 2k-6k | E | low | client | none | 5 |
| 37 | CSS Filter Generator / Hex to Filter | css-filter-generator | hex to css filter | 2k-6k | E | low | client | none | 6 |
| 38 | CSS to Tailwind Converter | css-to-tailwind | css to tailwind converter | 3k-10k | E | low-medium | client | none | 6 |
| 39 | Tailwind CSS Cheat Sheet | tailwind-cheat-sheet | tailwind cheat sheet | 8k-20k | E | medium-low | client | none | 5 |
| 40 | Golden Ratio Calculator | golden-ratio-calculator | golden ratio calculator | 10k-30k | E | medium | client | none | 5 |
| — | Scrollbar generator, font previewer, seasonal colour analysis quiz | (roadmap) | see §5.32, 5.39, 5.41 | 2k-100k | E | low-medium | client | low | 4-5 |

**Excluded:** Pantone/paint-brand colour matching (proprietary data/trademarks), font identifier from image (infeasible client-side), "extract colours from website URL" and "check contrast of a URL" (server-light roadmap only), per-hex programmatic pages at scale (scaled content abuse).

---

## 9. Recommended build order for this category

- **Launch (week 0):** Color Contrast Checker, CSS Gradient Generator, Box Shadow Generator, Color Palette Generator, Color Picker hub, Tailwind Color Shade Generator, Liquid Glass Generator, Tint & Shade Generator.
- **Wave 2 (month 1-2):** Glassmorphism, Border Radius, Clip-path, CSS Grid, Mesh Gradient, Color Blindness Simulator, Palette from Image, OKLCH picker, Hex to RGBA / opacity, Random Color, Color Mixer, Color Wheel / complementary, CSS Clamp Calculator.
- **Wave 3 (month 3-6):** Text Shadow, Flexbox, Button, Animation, Cubic Bezier, Loader, Neumorphism, Wave, Blob, Pattern, Font Pairing, Type Scale, Triangle, CSS Filter, CSS→Tailwind, Tailwind Cheat Sheet, Color Name Finder + curated colour pages, Color Blind Test, Golden Ratio, Seasonal Colour Analysis quiz.
- Internal-link design: a **Color hub** (picker → palette → shades → contrast → blindness → converter) and a **CSS Generators hub** (gradient → shadow → radius → glass → clip-path → animation → layout). Every generator should output plain CSS **and** Tailwind classes. That one feature sets us apart from W3Schools/cssportal and matches the long tails people type ("tailwind shadow generator", "tailwind gradient generator").
