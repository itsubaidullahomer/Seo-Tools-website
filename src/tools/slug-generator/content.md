## What this slug generator does

This slug generator turns a page title, product name or list of headlines into clean URL slugs: lowercase words joined by hyphens, with accents, punctuation and symbols handled for you. Paste `10 Tips for Baking Sourdough Bread at Home (A Beginner’s Guide) – 2026 Update!` and you get `10-tips-for-baking-sourdough-bread-at-home-a-beginners-guide-2026-update`, with a URL preview that shows the slug length and the full address length.

It does more than swap spaces for hyphens. It transliterates accented Latin letters, Cyrillic and Greek, can remove stop words, cuts to a maximum length at a whole word, keeps apostrophes from splitting words (`don't` becomes `dont`, not `don-t`) and writes `&` as `and`. Batch mode converts a whole list, makes repeated slugs unique and exports a CSV for migrations, product imports and redirect maps.

## How to use the slug generator

1. **Pick a mode.** *Single slug* turns everything in the box into one slug. *Batch (one per line)* makes one slug per line and keeps blank lines blank, so the output lines up with your list.
2. **Enter your text.** Type or paste a title. **Load example** fills a sample and **Clear** empties the box.
3. **Read the result.** The slug appears in the output box. Single mode adds a URL preview, a length badge (Concise, A bit long or Very long) and stats for slug length, words and full URL length.
4. **Adjust the options.** Choose a hyphen or underscore, convert non-English letters to A–Z or keep them, set a maximum length, and switch lowercase, stop-word removal, German umlaut spelling, spelling out `& @ % +`, whole-word cutting and unique duplicates on or off.
5. **Set your base URL** (optional), such as `https://yoursite.com/blog/`, so previews and exports match your site. Nothing is fetched from it.
6. **Copy or download.** **Copy slug** copies the slug, **Copy URL** the full address, and in batch mode **Download CSV** saves `input`, `slug` and `url` columns.

A refresh does not lose your work: the text is kept for the current tab and the options in this browser.

## How a slug is built, step by step

Every title goes through the same steps, in this order:

1. **Clean the markup.** Real HTML tags such as `<b>` or `<span>` are removed and entities such as `&amp;` and `&eacute;` are decoded. Other angle brackets stay as text, so `Array<string>` keeps its word.
2. **Tidy numbers and apostrophes.** Thousands separators are joined (`10,000` becomes `10000`) and apostrophes are deleted without a gap.
3. **Spell out symbols** (optional). `&` becomes and, `@` at, `%` percent and `+` plus, so `Q&A` turns into `q-and-a` and `C++` into `c-plus-plus`.
4. **Transliterate** to A–Z, or keep Unicode letters.
5. **Lowercase and split into words.** Anything that is not a letter or digit is a word break, including existing hyphens, underscores, dots and slashes.
6. **Drop stop words** (optional).
7. **Join with your separator** and apply the maximum length.

**Worked example.** Starting from `10 Tips for Baking Sourdough Bread at Home (A Beginner’s Guide) – 2026 Update!`:

| Settings | Slug | Characters |
| --- | --- | --- |
| Defaults | `10-tips-for-baking-sourdough-bread-at-home-a-beginners-guide-2026-update` | 72 |
| Remove stop words (for, at, a) | `10-tips-baking-sourdough-bread-home-beginners-guide-2026-update` | 63 |
| Stop words removed, maximum 50, whole words | `10-tips-baking-sourdough-bread-home-beginners` | 45 |

The last slug is 45 characters, not 50, because the next word (`-guide`) would reach 51. With **Cut at a whole word** off, it is cut at exactly 50 and can end mid-word.

## What happens to accents and other alphabets

| You type | Default output | Note |
| --- | --- | --- |
| Café Crème | `cafe-creme` | Accents are stripped |
| Größe | `grosse` | ß always becomes ss |
| Größe, German umlaut spelling on | `groesse` | ä, ö, ü become ae, oe, ue |
| Łódź | `lodz` | Ł has no combining accent, so it is mapped directly |
| Tiếng Việt | `tieng-viet` | Vietnamese tone marks are removed |
| Привет, мир | `privet-mir` | Simplified Russian scheme |
| Щука | `shchuka` | щ becomes shch |
| Ελληνικά | `ellinika` | Simplified modern Greek |
| 東京 タワー | no slug | Skipped with a warning; **Keep as Unicode letters** gives `東京-タワー` |

The Cyrillic and Greek schemes are simplified and not tied to one official standard: the Russian hard and soft signs are dropped and Greek accents are removed first. That suits readable URLs, not documents that must follow a formal romanization standard.

## Slug best practices

- **Use readable words, not IDs.** Google's URL structure documentation recommends readable words rather than long ID numbers.
- **Use hyphens, not underscores.** Google recommends hyphens between words. Underscores conventionally join words in identifiers, so `slug_generator` can read as one word.
- **Stay lowercase.** URL paths are case-sensitive, so `/Blog` and `/blog` can be two addresses.
- **Keep it short and specific.** Three to six words, or under about 60 characters, is a practical rule of thumb. It is not a Google limit; Google publishes no target length.
- **Skip dates unless the date is the point.** A year in an evergreen slug forces a URL change or an outdated look. Keep dates for events and news; the example above keeps `2026` only to show how numbers are handled.
- **Do not stuff keywords or repeat the folder.** Under `/blog/`, the slug needs no `blog-` prefix.

You can check how a slug, title and description look together in the [SERP snippet preview](/tools/serp-snippet-preview), and confirm the title fits with the [title and meta description length checker](/tools/title-meta-description-length-checker).

## Changing a slug safely

Changing a live URL is a page move:

1. **Decide it is worth it.** Change a slug when it is wrong, misleading, has a stale date or breaks your convention. Changing it only to add a keyword rarely pays back.
2. **Add a permanent redirect** (301 or 308) from the old address to the new one, in a single hop.
3. **Update what you control:** internal links, the canonical tag, the XML sitemap and hreflang annotations, so the redirect only serves outside links.
4. **Avoid chains.** If `/a` once redirected to `/b` and the page now moves to `/c`, point `/a` straight to `/c`.
5. **Redirect to the closest equivalent page,** not the home page, and keep the redirect for a long time. Google's site-move guidance advises at least a year.

For a bulk change, paste the new titles into Batch mode and download the CSV, then pair its `url` column with your old addresses to build the redirect map.

## Slug rules in WordPress, Shopify and Next.js

**WordPress.** The slug is generated from the title (lowercase, hyphens, punctuation removed) when a post is published or scheduled, and you can edit it in the post settings first. Editing the title later does not change a slug that is already set. When two posts collide, WordPress appends `-2`, which is what **Make duplicates unique** imitates. The database field holds up to 200 characters, and non-Latin slugs are stored percent-encoded, so they use that budget faster. WordPress often redirects a post's previous slug on its own, but that does not cover every change, such as a new permalink structure, so click the old URL after any change and set up an explicit 301 if it does not land on the new page.

**Shopify.** Product, collection and page URLs use a handle generated from the title: lowercase letters, digits and hyphens. You can edit it in the search listing section of the admin, which typically offers to redirect the old URL. Tick that option.

**Next.js.** A dynamic segment such as `app/blog/[slug]/page.tsx` receives the URL segment through the `params` prop, which is a promise in current versions, so read it with `const { slug } = await params`. Generate slugs when you write the content, store them with it and return them from `generateStaticParams`. To change a live slug, add an entry with `permanent: true` to `redirects` in `next.config`, which sends a 308. With Unicode slugs, test whether your version passes the encoded or decoded form before comparing.

## Non-Latin URLs and percent-encoding

URLs travel in a limited set of ASCII characters. Anything else is written as its UTF-8 bytes, each byte as `%` plus two hexadecimal digits. The Russian word `привет` has six letters and twelve bytes, so it is 36 characters when encoded: `%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82`. Browsers usually show the readable form, but emails, server logs and analytics reports often show the encoded one. Google's URL documentation says characters outside the ASCII range should be percent-encoded when you link to them.

**Convert to A–Z** when your audience is international, links are shared in chat or print, you want short URLs, or your CMS handles Unicode poorly. **Keep as Unicode letters** when readers search in and recognize the native script, as on a Russian-language or Greek-language site. Pick one approach for the whole site. The preview shows the address as it is sent, which matters because the sitemap protocol allows fewer than 2,048 characters per URL.

## Tips and common mistakes

- **Remove stop words before you cap the length.** Cutting the example title to 50 characters without removing stop words leaves `10-tips-for-baking-sourdough-bread-at-home-a`, which ends on a dangling *a*.
- **Read the result aloud.** Removing `in` from `Log In` leaves `log`. Stop-word removal is a shortcut, not an editor.
- **Version numbers lose their dot.** `Version 2.0` becomes `version-2-0`; write `v2` for less.
- **Duplicates are checked inside your list only,** not against slugs already on your site.

Clean long lists first with [remove duplicate lines](/tools/remove-duplicate-lines) and [remove line breaks](/tools/remove-line-breaks). The [case converter](/tools/case-converter) gives you title case and the [word counter](/tools/word-counter) checks headline length.

## Privacy and limitations

Everything runs in your browser. Your text is not uploaded and there is no account. Only your text for the current tab and your option settings are remembered, in this browser.

- **The stop-word list is English only** and short: 33 function words such as a, an, the, and, of, to, in, for, is and with. If every word is a stop word, none are removed.
- **Chinese, Japanese, Korean, Arabic, Hebrew, Thai and Devanagari are not transliterated.** Their letters are skipped with a warning; use Keep as Unicode letters to preserve them.
- **Batch mode converts up to 10,000 lines at a time.** The list on screen shows the first 200; the output box, Copy buttons and CSV include all of them.
- **The tool cannot know what your CMS will do** with a slug. Some systems add suffixes, shorten long slugs or reject characters, so check the final URL on your site.

WordPress, Shopify and Next.js are trademarks of their respective owners. This tool is independent and is not affiliated with them.
