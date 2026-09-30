## What this title tag and meta description length checker does

This meta description length checker shows how much of a title tag or meta description will be visible in a search result before it is cut off with an ellipsis. Paste a title or description above and you get its character count, an estimated width in pixels, the exact word where the cut falls on desktop and on mobile, and a live snippet preview.

Characters are only a rough guide, because results are laid out in pixels. A title of narrow letters can hold 70 characters and still fit, while a shorter one full of capitals gets truncated. The tool measures width the way a browser would, using Arial-compatible letter widths at 20 px for titles and 14 px for descriptions.

There are three tabs. **Title tag** and **Meta description** share one measuring engine and add a keyword track, a checklist and copy buttons. **Bulk check** audits a crawl export, flags duplicates and downloads CSV.

## How to use the checker

1. **Pick a tab and a device.** The Desktop/Mobile switch changes which limit applies, and your choice is remembered.
2. **Paste or type your text.** You can also paste the whole `<title>` or `<meta name="description">` tag; the tool reads the text inside and decodes entities such as `&amp;`.
3. **Read the numbers.** *Estimated width* is the total in pixels, *Space left* (or *Over by*) is the margin, and the verdict says whether the text is empty, too short, a good fit or too long. The bar turns green, amber or red.
4. **Find the cut-off.** When text is too long, a line shows what stays visible, then the ellipsis, then the struck-through words that would be lost. Badges show desktop and mobile at once.
5. **Check the snippet preview,** which cuts your text where a results page would. Add a page URL for a breadcrumb.
6. **Add a target keyword** to see where it starts and ends inside the width budget, and whether it survives truncation.
7. **Try the brand suffix builder** on the Title tab. Enter a brand, separator and position to see how many pixels remain for the page-specific part, then switch it on to check the combined title.
8. **Work through the checklist,** then use the copy buttons. The tag buttons escape ampersands, angle brackets and quotes.

Line breaks and repeated spaces are collapsed before measuring, and input is clipped at 20,000 characters. *Adjust limits* lets you match a crawler that uses different numbers.

## Why pixels matter more than characters

Type "WWWW" and "iiii" into the title box. Both have four characters, yet at 20 px the first measures about 76 px and the second about 18 px, more than four times narrower. Thirty capital W letters take about 566 px, nearly the whole desktop budget, while thirty lowercase i letters take about 133 px.

Real titles show the same effect. "How to write a meta description that gets clicks" measures 416 px. The same 48 characters in capitals measure 570 px, about 37 percent wider. A character counter would call them identical.

## How the width is estimated

Each character has an advance width, the horizontal space a font gives it, stored in units of 1/2048 em. The tool sums the advances and scales by font size:

```
width in px = (sum of advance widths ÷ 2048) × font size
```

The widths come from a metric table for Liberation Sans, a font designed to match Arial letter for letter. Latin, Greek, Cyrillic and Hebrew text and common symbols use the table. Chinese, Japanese and Korean characters count as one em each. Emoji and other scripts are measured with your browser's canvas, or estimated if it is unavailable, and the checklist notes when that happens.

**Worked example.** "Pruning Shears: Bypass and Anvil Types Compared" measures 461 px. Adding " | Example Co" brings it to 587 px. That leaves 13 px of the 600 px desktop limit, so it fits but is flagged as a tight fit (over 95 percent). Against the 540 px mobile limit it is cut before "Example Co".

When text overflows, the tool reserves room for the ellipsis (about 17 px at 20 px) and backs up to the last whole word. It does not model kerning, which made text up to 1.5 percent narrower in our browser tests, and Google's own fonts and layout can differ, so treat the result as an estimate and keep a margin.

## Limits used and typical lengths

| Field | Device | Width budget | Measured at | Typical length |
| --- | --- | --- | --- | --- |
| Title tag | Desktop | 600 px | 20 px | about 50 to 60 characters |
| Title tag | Mobile | 540 px | 20 px | about 45 to 55 characters |
| Meta description | Desktop | 920 px | 14 px | about 140 to 155 characters |
| Meta description | Mobile | 680 px | 14 px | about 105 to 115 characters |

These figures were last reviewed on September 29, 2026. Google does not publish fixed limits. Its [snippet documentation](https://developers.google.com/search/docs/appearance/snippet) says there is no limit on how long a meta description can be, but the snippet is truncated as needed, typically to fit the device width, and its [title link documentation](https://developers.google.com/search/docs/appearance/title-link) advises against unnecessarily long titles. The numbers are working estimates from published third-party measurements, and other tools use slightly different values; measurements of mobile titles in particular range from roughly 480 to 540 px, so the 540 px mobile budget is the generous end. The description budget is the width of all its lines added together.

## What Google does with your title and description

**Titles.** In a [September 17, 2021 post](https://developers.google.com/search/blog/2021/09/more-info-about-titles), Google said its systems use the HTML title element around 87 percent of the time, and look at other page text when a title is empty, identical on every page or a poor description of the page. That is why the checklist flags vague labels like "Home", repeated words, capitals and stale years.

**Descriptions.** Two third-party studies looked at how often Google showed something other than the page's own meta description. Ahrefs compared 20,000 keywords and found about 63 percent were rewritten. Portent checked 30,000 keywords and found 68 to 71 percent on the first page. These studies are a few years old, but they agree on the main point: Google often writes its own snippet from the page text. Rewriting depends on the query, so a description that answers the likely search survives more often.

**Ranking and clicks.** In April 2022, Google's John Mueller said the meta description is primarily used as the snippet in search results and is not something Google uses for ranking. Its job is to earn the click. The title element is a stronger signal and is also the headline people click.

**AI features.** Summaries now appear above some results, but people who scroll past them still choose a link by its title and snippet, so a clear, specific title and description remain worth the effort. Google's guidance for site owners has said its AI features need no special markup beyond ordinary SEO practice, but check its current documentation.

## Title vs H1, separators and brand placement

The title element is the clickable headline in search and the browser tab. The H1 is the heading on the page. They can differ, with the title tighter and carrying a brand, but should describe the same thing, because Google may draw on headings when a title is weak.

Separators cost different widths at 20 px: a pipe with spaces about 16 px, a hyphen about 18 px, an en dash about 22 px and an em dash about 31 px. Put the brand at the end for most pages, keep it short, and lead with it on your home page. If it pushes an otherwise good title over the limit, drop it on that page.

## Good and truncated titles by page type

| Page type | Too long (desktop) | Fits |
| --- | --- | --- |
| Product category | "Buy Running Shoes Online \| Best Running Shoes for Men, Women and Kids \| Cheap Running Shoes Sale \| Example Store" (1,086 px, cut after "for Men,") | "Trail Running Shoes for Wide Feet \| Example Store" (454 px) |
| Local service | "Example Plumbing in Austin: Emergency Repairs, Water Heaters, Drain Cleaning, Leak Detection and More" (954 px) | "Emergency Plumber in Austin, TX \| Example Plumbing" (483 px) |
| Blog guide | "Sourdough Starter: A Complete Beginner's Guide to Feeding, Troubleshooting, Baking and Storing Your Starter" (986 px) | "Sourdough Starter Feeding Schedule: A Day-by-Day Guide" (525 px) |

Descriptions follow the same pattern. These are measured at 14 px with the desktop and mobile limits above.

| Page type | Description | Width | Result |
| --- | --- | --- | --- |
| Product category | "Our extensive range of trail running shoes includes styles for men, women and kids in every size and colour, with free delivery on orders over $50, easy returns and a price match guarantee on every pair we sell online." | 1,344 px | Too long on both; cut after "over $50," on desktop and after "size and" on mobile |
| Product category | "Trail running shoes in wide fits, with rock plates and deep lugs. Compare grip and cushioning before you buy." | 675 px | Fits both, but tight on mobile |
| Local service | "Burst pipe or no hot water? A licensed Austin plumber can be at your door within the hour. Upfront pricing and a one-year repair guarantee." | 861 px | Fits desktop; on mobile it is cut after "Upfront pricing" |

The long example spends its space on a generic list. The shorter ones state a specific benefit and put the point of the page first, so even the mobile cut still says something useful.

## Bulk audit workflow

1. Export the address, title and meta description columns from your crawler. Names like Address, Title 1 and Meta Description 1 are recognized.
2. Open **Bulk check**, paste the rows or use *Upload CSV*, and choose Mobile first if most traffic is on phones.
3. Filter to **Fail** for missing or truncated fields, then **Duplicates**. Templated pages such as product variants are best fixed once, in the template.
4. Fix pages in order of traffic, download the CSV as a baseline, and re-run after the changes go live.

Export cells that start with `=`, `+`, `-` or `@` get a leading apostrophe so a spreadsheet does not run them as formulas. Rows are capped at 5,000 per run.

## Tips and common mistakes

- **Front-load the important words.** Anything after the cut-off is invisible.
- **Do not pad to fill the space.** A specific 45-character title beats a vague 60-character one.
- **Write for the click.** Concrete numbers or an answer to the search beat "Welcome to our website".
- **Give every page its own title and description,** and refresh year stamps.
- **Leave a margin.** Above 95 percent of a limit, a different font can tip text over.
- **Escape quotes in HTML.** The *Copy tag* buttons do it for you.

Related tools: the [SERP snippet preview](/tools/serp-snippet-preview) for a full mock result, the [character counter](/tools/character-counter) and [word counter](/tools/word-counter) for plain counts, the [slug generator](/tools/slug-generator), the [case converter](/tools/case-converter), and [remove duplicate lines](/tools/remove-duplicate-lines) for cleaning a list before a bulk check.

## Privacy and limitations

Everything runs in your browser. Titles, descriptions and uploaded CSV files are not sent to any server. Typed text stays in this tab's session storage until you close it, and device and limit preferences are stored locally.

The widths are estimates. Google's fonts, device widths, query-specific rewrites and extras such as dates, sitelinks and breadcrumbs all change what is shown. The preview is an illustration, not a screenshot of a real result. This tool is independent and not affiliated with or endorsed by Google.
