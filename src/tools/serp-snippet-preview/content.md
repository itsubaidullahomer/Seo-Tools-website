## What this SERP preview tool does

This SERP preview tool shows how a page could appear in search results before you publish it. Type or paste a title, a meta description and a URL, and it draws a mock result card for desktop and mobile: favicon, site name, address line, clickable title and description, with your search words in bold and an ellipsis where a long line would be cut. Switches change the card between Light and Dark and turn on a side-by-side comparison of two versions.

Most previews only draw a box. This one also measures: each field has a pixel meter for both devices, a checklist flags likely problems, and the preview exports as a PNG for a client, a ticket or a slide. It is an illustration: use it to catch long, repeated or off-keyword text, then confirm the live result later.

## How to use the preview

1. **Pick a device and a theme.** Desktop, Mobile or Both, and Light or Dark.
2. **Enter the title and description.** You can also paste a whole `<title>` or `<meta name="description" content="...">` tag, or both at once, into any field. The tool reads the text inside and decodes entities such as `&amp;`.
3. **Read the meters.** Each field shows estimated pixels against the budget for each device. Green is comfortable, amber is within 5 percent of the limit, red means the text is cut off.
4. **Add page details.** The URL builds the address line and the site name defaults to the domain. A date is optional. The search query decides which words appear in bold. A favicon upload replaces the letter in the circle and stays on your device.
5. **Compare two versions.** Turn on *Compare two versions*. Version B starts as a copy of A, so edit only what you want to test. *Load A/B example* shows a weak title and description next to a rewrite.
6. **Export or share.** *Download PNG* and *Copy image* use the devices and versions currently shown. *Copy link* stores your text in the address after the `#`, and *Copy HTML tags* gives you the escaped `<title>` and `<meta>` lines.

## Anatomy of a search result

This layout was last checked on September 29, 2026. Google changes its results page from time to time, so treat it as a snapshot.

- **Favicon and site name.** Top left of each result. Google reads the site name mainly from `WebSite` structured data on the home page (its `name` property) and also looks at other page text. For the favicon, Google requires a square (1:1) image of at least 8 by 8 pixels and recommends a larger one, such as 48 by 48 or more, so it stays sharp.
- **Address line.** On desktop it shows the protocol, the domain and the path segments separated by a small arrow. Since January 2025 mobile results show only the domain, because Google dropped breadcrumbs from mobile. The preview follows the same rule.
- **Title.** The blue link, 20 pixels tall here: one line on desktop, up to two on mobile.
- **Date.** Sometimes shown before the description, only when Google finds a clear date. You cannot force it, but you can try one here to see what it costs.
- **Description.** Gray text of about two lines on desktop and three on mobile, with the words of the search in bold.

## How the preview is laid out

Google publishes no fixed limits. Its meta description guidance says a snippet is truncated as needed, typically to fit the device width, so these budgets are working estimates, the same ones our [title tag and meta description length checker](/tools/title-meta-description-length-checker) uses. Both sum Arial-compatible letter widths from Liberation Sans, whose advance widths match Arial's.

| Field | Device | Budget | Text size | Lines in the preview |
| --- | --- | --- | --- | --- |
| Title | Desktop | 600 px | 20 px | 1 |
| Title | Mobile | 540 px | 20 px | up to 2 |
| Description | Desktop | 920 px | 14 px | up to 2 |
| Description | Mobile | 680 px | 14 px | up to 3 |

The text is cut at the budget with room left for three dots, backed up to the last whole word, then wrapped into lines. The PNG export draws those same lines on a canvas, so the image and the card break in the same places.

**Worked example.** "Sourdough Starter Feeding Schedule: Day-by-Day Guide" is 52 characters and about 506 px. It fits both budgets, although on mobile it fills 94 percent of 540 px and wraps to two lines. Add " | Crumb & Crust" and it grows to 654 px, so on desktop the card ends "Day-by-Day Guide | Crumb...". A 125-character description of 765 px fits desktop but not mobile. Adding the date "Sep 12, 2026 —" costs about 105 px more, so the mobile cut moves earlier, to "what the...".

Bold search words are drawn wider than the table assumes, so line breaking allows about 7 percent extra for them, while the budget ignores bold, as the checker does.

## What Google may rewrite, and why

For titles, Google said in a September 2021 [post about titles](https://developers.google.com/search/blog/2021/09/more-info-about-titles) that its systems use the HTML title element around 87 percent of the time. It looks at headings, prominent text and link text when a title is empty, repeated across pages, stuffed with keywords or a poor description of the page. In March 2026 Google also confirmed a limited test of AI-written headlines, so a preview shows what you wrote, not a promise of what appears.

For descriptions, Google's [snippet documentation](https://developers.google.com/search/docs/appearance/snippet) says it mainly builds the snippet from page content and uses the meta description when it describes the page better. That choice can vary by query. A description that answers the likely search, in words that match the page, survives more often.

## Rich results and what a preview cannot show

This preview draws the plain result every page has and does not simulate rich results. As of the check date, Google's structured data documentation says FAQ rich results stopped appearing on May 7, 2026. They had been limited to well-known government and health sites since August 2023, and `FAQPage` markup remains valid. HowTo rich results were removed in 2023, first on mobile and then on desktop. Review stars, product details and recipes still depend on markup and on Google's choice, so check them with Google's Rich Results Test.

## Before and after: a click checklist

These pairs were run through the tool. Widths are estimated at desktop text sizes.

| Page type | Before | Width | After | Width |
| --- | --- | --- | --- | --- |
| Blog guide | "Home \| Best Sourdough Bread Recipes and Baking Tips for Beginners and Experts Alike \| Crumb & Crust" | 933 px, cut after "for" | "Sourdough Starter Feeding Schedule: Day-by-Day Guide" | 506 px |
| Local service | "Plumber Austin TX \| Austin Plumbers \| Emergency Plumber Austin \| Best Plumbing Services Austin Texas" | 936 px, cut after "Emergency Plumber" | "Emergency Plumber in Austin, TX \| Bluebonnet Plumbing" | 507 px |
| Description | "Welcome to our website! We have lots of recipes and articles about bread, baking and much more. Click here to read our latest posts and find out more about us and what we do." | 1,100 px, cut after "find out" | "Follow this 7-day sourdough starter schedule: exact flour and water ratios, what the bubbles mean, and fixes for a slow rise." | 765 px |

What the better versions share:

1. **They lead with the words the searcher typed,** so the match is obvious at a glance and survives shortening.
2. **The brand comes last and stays short.** Drop it on pages where it pushes the title over.
3. **Each description makes one concrete promise:** a number, a time, a price, a guarantee or a method.
4. **They repeat nothing.** Four mentions of a city read as stuffing, and "Home" tells nobody anything.
5. **They are true.** A promise the page does not keep costs the click twice.
6. **Both devices were checked.** Mobile cuts sooner and has no path in the address line.

No preview can predict click-through rate. After a change is live and Google has recrawled the page, compare impressions and click-through rate for the query in Search Console over several weeks.

## Comparing two versions and controlling the result

Use compare mode for a rewrite, a new brand suffix or a different word order. The A/B table flags each width as fine, close or cut on both devices and counts the query words each version uses. The [case converter](/tools/case-converter) fixes a title typed in capitals, which are wide and use up the budget quickly, and the [character counter](/tools/character-counter) and [word counter](/tools/word-counter) give plain counts.

To influence what Google shows, give every page its own title element, close to its H1, and write one meta description per page. It is used for the snippet, not for ranking. The robots controls `nosnippet`, `max-snippet:[number]` and `data-nosnippet` stop a snippet, cap its length or exclude a section, and Google's [robots meta documentation](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) lists the exact rules. A short, readable slug helps the address line, and the [slug generator](/tools/slug-generator) builds one.

## Tips and common mistakes

- Leave a margin. Text at 98 percent of a budget can spill over in another font.
- Refresh year stamps and prices in titles, or the preview looks current while the page is stale.
- Check the live result in a private window, with `site:` or an exact phrase, before deciding a rewrite failed.

## Privacy and limitations

Everything runs in your browser. The tool never fetches your page, and titles, descriptions and uploaded favicons are not sent to a server. Your draft stays in this tab's session storage, and your device and theme choices in local storage. A shared link keeps your text after the `#`, which browsers do not send to servers, and leaves out the favicon.

The preview is an estimate: Google's fonts, device widths, query-specific choices and extras such as sitelinks change the real result. Illustration only. This tool is independent and not affiliated with or endorsed by Google.
