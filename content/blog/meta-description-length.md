---
title: "Meta Description Length: How Long Should It Be?"
description: "Google sets no fixed meta description length. Snippets are cut to fit the screen, roughly 920 px on desktop, and are often rewritten. See what to aim for."
date: "2026-09-30"
updated: "2026-09-30"
tags: [meta-description, on-page-seo, serp-snippets, pixel-width]
relatedTools: [title-meta-description-length-checker, serp-snippet-preview, character-counter, case-converter]
---
There is no official maximum meta description length. Google's documentation says a description can be any length but the snippet is shortened as needed, typically to fit the device width, so the cut depends on width in pixels, not on character count. As a working estimate for ordinary English text, aim for roughly 110 to 150 characters and put the main point in the first 100, which is about what a phone shows.

*Last reviewed September 30, 2026.*

## Quick answer

- **Documented by Google:** no fixed limit; the snippet is truncated to fit the device.
- **Community estimate, as of September 2026:** about 920 px on desktop and 680 px on mobile, all lines added together. For typical prose, about 148 and 110 characters.
- **Practical target:** 110 to 150 characters, checked against pixel width.
- **Expect rewrites.** Published studies found Google often shows other text.

## What Google documents and what is only estimated

| Claim | Status | Source |
| --- | --- | --- |
| No maximum length; snippet is cut to fit the device | Documented | Google Search Central, snippet documentation |
| `max-snippet:[number]` caps snippet length | Documented; confirm the unit (characters) | Google's robots meta tag documentation |
| The description is not used for ranking | Public statement | John Mueller of Google, April 2022 |
| About 920 px desktop, about 680 px mobile | Estimate | Third-party measurements; tools disagree |
| "155 to 160 characters" | Rule of thumb | Common advice; close to the desktop estimate for narrow text |
| Google rewrites roughly two thirds of descriptions | Third-party studies | Ahrefs and Portent samples, a few years old |

The last three rows are the weakest. Some checkers use a mobile budget nearer 580 px, and Google can change its layout, so leave a margin.

## Pixels, not characters

The familiar "160 characters" is shorthand for a width. At the 14 px text size the checker assumes for descriptions, a lowercase i is about 3.1 px wide, a space 3.9 px, a lowercase e or a digit 7.8 px, a capital M 11.7 px and a capital W 13.2 px. Equal character counts can differ a lot: the 126-character example below grows by about 270 px in capitals.

A stuffed 150-character description (the bike repair "before" text below) measures 926 px, over the 920 px desktop budget, so it is cut. A deliberately narrow 151-character test sentence ("Little lilies fill the still hillside in April; ...") measures 750 px and fits with 170 px spare.

Capitals show it most clearly. "Compare electric standing desks by lift speed, weight capacity and noise level, with sizes for small rooms and corner offices." is 126 characters and 770 px. In capitals it is still 126 characters but 1,038 px, 35 percent wider and over the desktop budget. If a draft is in all caps, run it through the [case converter](/tools/case-converter) first.

The six descriptions in the next section average 6.21 px per character (5,527 px over 890 characters), so 920 ÷ 6.21 ≈ 148 characters fit on desktop and 680 ÷ 6.21 ≈ 110 on mobile.

## Before and after: three descriptions measured

These pages are invented. Method: each text was run through the width logic behind this site's [title tag and meta description length checker](/tools/title-meta-description-length-checker) (Liberation Sans advance widths, which match Arial, at 14 px) against 920 px desktop and 680 px mobile budgets on September 30, 2026. The results are estimates, not Google screenshots.

| Page | Version | Characters | Width | Desktop (920 px) | Mobile (680 px) |
| --- | --- | --- | --- | --- | --- |
| Product category | Before | 205 | 1,272 px | Cut after "desk converters, with" | Cut after "corner desks," |
| Product category | After | 101 | 622 px | Fits, 298 px spare | Fits, 58 px spare |
| Blog guide | Before | 177 | 1,101 px | Cut after "why it" | Cut after "we will" |
| Blog guide | After | 132 | 821 px | Fits, 99 px spare | Cut before "so no taste is left behind." |
| Local service | Before | 150 | 926 px | Cut before final "Portland" | Cut after "Cheap bike repair" |
| Local service | After | 125 | 785 px | Fits, 135 px spare | Cut before "Monday to Saturday." |

The "after" texts, in order: "Compare electric standing desks by lift speed, weight capacity and noise, with sizes for small rooms." / "Descale an espresso machine step by step: how often to do it, how much descaler to use, and how to rinse so no taste is left behind." / "Same-day bike repair in Portland, Oregon: flat fixes, brake and gear tune-ups, and e-bike checks. Walk in Monday to Saturday." The "before" texts were: "Shop our wide selection of standing desks, including electric height-adjustable desks, corner desks, small-space desks and desk converters, with free shipping on orders over $99 and a 30-day return policy." / "Descaling is something every espresso machine owner needs to do at some point, and in this post we will talk about what descaling is, why it matters, and the many ways to do it." / "Bike repair Portland | Bike shop Portland Oregon | Best bike repair in Portland OR | Cheap bike repair Portland | Bicycle repair shop near me Portland"

Two lessons:

1. **A description inside the "150 to 160" rule can still be cut.** The keyword-string text is exactly 150 characters and loses its last word on desktop.
2. **The phone cut is consistent.** In the five mobile cuts above, the visible text ran 100 to 105 characters, so the first 100 are worth the most.

## Why Google rewrites so many descriptions

Ahrefs compared hard-coded descriptions with desktop snippets for 20,000 keywords and found 62.78 percent were rewritten. Portent examined 30,000 keywords and reported 68 percent on desktop and 71 percent on mobile for first-page results. Subtracting from 100, the written description appeared about 37 percent of the time in the Ahrefs sample and 32 and 29 percent in Portent's.

Ahrefs also reported more rewrites for long-tail keywords (65.62 percent) than for head terms (59.65 percent). One possible reason: a page ranks for many searches but has one description, so Google may pull other page text for searches the description does not cover.

Both studies are a few years old and measured Google as it behaved then, so read the numbers as "most of the time," not exact rates. Two practical points follow:

- Google's snippet documentation describes snippets as generated automatically from page content, with the meta description used when it describes the page better than the content does (check the current wording). Your opening paragraph is a second candidate, so answer first.
- Because snippets are chosen to fit the query, a description that uses the wording people actually search is a stronger candidate than a slogan.

## What decides where the text is cut

1. **Device and layout.** A phone column is narrower, and the number of lines differs.
2. **Letter widths.** Capitals, digits and wide letters use up the budget faster.
3. **Bold words.** Google bolds words that match the search, and bold letters are wider. Checkers, this site's included, measure regular weight, so keep a margin.
4. **A date prefix.** When a date shows before the description, it borrows space. "Sep 12, 2026 — " measures 101 px at 14 px, about 16 average characters.
5. **Which text Google picks.** If it swaps in page text, your length is moot for that query.
6. **Google's own changes.** Google confirmed in December 2017 that snippets could run to about 320 characters. By May 2018 they were shorter again on average, and Danny Sullivan, then Google's public liaison for Search, said there is no fixed length for snippets (as reported by trade sites). Any character rule is a snapshot.

## A decision guide: how long should yours be?

| Situation | Suggested length | Reasoning |
| --- | --- | --- |
| One page, one clear question (guide, tool, service) | 110 to 150 characters | Fits desktop; the point lands in the first 100 for phones |
| Mostly phone readers, or a local search | About 100 or fewer | The whole text fits the estimated mobile budget |
| Thousands of similar pages (products, listings) | 100 to 140, built from real fields | Unique and specific beats polished; Google's snippet guidance has described generated descriptions as acceptable for very large sites; check its current wording |
| No description | Not an error | Google builds a snippet from the page; add one only if you can beat your opening paragraph |

## Common mistakes

- **Treating 160 characters as a law.** It approximates a pixel width, and the bike shop example still gets cut at 150.
- **Padding.** Specific beats long.
- **Opening with a greeting or the brand.** It wastes the most visible characters.
- **Keyword lists.** Repeated terms and pipes read as spam.
- **Testing desktop only.** By the 148 and 110 character estimates, the phone cut arrives about 38 characters sooner.
- **Promising what the page does not deliver.** Visitors who do not find it leave.
- **Duplicate descriptions.** They do not show how pages differ.

## How to check your own descriptions

1. Paste the text into the [title tag and meta description length checker](/tools/title-meta-description-length-checker) and read the cut point for desktop and mobile.
2. View it in the [SERP snippet preview](/tools/serp-snippet-preview).
3. For a plain count, use the [character counter](/tools/character-counter).
4. After publishing, compare impressions and click-through rate in Google Search Console over several weeks.

This guide is independent and not affiliated with Google.

## Frequently asked questions

### How many characters should a meta description be?

There is no required number. For ordinary English, 110 to 150 characters is a sensible range, with the key point in the first 100. If the text has many capitals or digits, judge pixel width instead.

### Is 160 characters the limit for a meta description?

Google does not document a 160-character limit. It is a rounded rule of thumb from pixel measurements, and it fails for wide text: the 150-character keyword string above is cut on desktop. Treat it as a rough ceiling, not a target.

### Does meta description length affect rankings?

John Mueller of Google said in April 2022 that the meta description is not used for ranking. Length matters mainly because it changes what people read before clicking.

### Why does Google show a different description than mine?

It builds snippets mainly from page content and uses your description when that seems to fit the search better. Published studies found rewrites in most sampled results, more often for long-tail queries. Matching your description to the main search and strengthening your opening paragraph both help.

### What happens if my meta description is too long?

The visible part ends with an ellipsis and the rest is hidden. Google's documentation describes truncation as routine, not as an error. The practical risk is losing your call to action.
