## What this character counter does

Type or paste into the box above and the character counter updates on every keystroke: characters with spaces, characters without spaces, words, sentences, lines, paragraphs, letters and the size of the text in UTF-8 bytes. Nothing is sent anywhere and there is no button to press.

What sets it apart from a plain character count is the limit checker underneath. Choose a platform from the dropdown – an X post, an Instagram caption, a LinkedIn headline, a meta description, an SMS – or type your own number, and a progress bar shows how much of the budget you have used. It turns amber at 90 percent and red when you go over, and when you are over it offers a trimmed version of your text that fits, cut at a word boundary so you can copy it straight out.

It also counts the way modern software does. An emoji or a flag is one visible character, and that is the main number; when the text contains characters that take two UTF-16 code units, the tool shows that figure too, because many apps, databases and X will hold you to it.

## How to use the character counter

1. **Enter your text.** Type, or click **Paste** to insert your clipboard. The draft stays in this tab's session storage, so a refresh does not lose it.
2. **Read the tiles.** *Characters* includes spaces and line breaks; *Without spaces* drops every space, tab and line break. *Words*, *Sentences*, *Lines*, *Paragraphs*, *Letters* and *UTF-8 bytes* follow.
3. **Pick a limit.** Under *Check against a limit*, choose a platform or type a number in the *Limit* box. The label above the text box switches to `used / limit`.
4. **Watch the bar.** Blue means room, amber means within 10 percent, red means over – and the text box says how many characters to cut.
5. **Copy the version that fits.** When you are over, *Trimmed to fit* shows the longest prefix that fits, ending at a word boundary where possible.
6. **Copy stats or text** with the buttons under the box.

The *Count emoji as 2 characters* switch measures the limit in UTF-16 code units, so each emoji uses 2. It is grayed out for X and SMS, which apply their own rules.

## How characters are actually counted

"How many characters is this?" has three honest answers, which agree only for plain English text.

**Grapheme clusters** are what a person sees as one character. `é` is one, whether it is stored as a single code point or as `e` plus a combining accent. `👍🏽` is one. `🇺🇸` is one, although it is built from two regional-indicator symbols. The family emoji `👨‍👩‍👧‍👦` is one visible character made of seven code points joined by invisible zero-width joiners. This tool splits text into grapheme clusters with the browser's `Intl.Segmenter` (with a fallback for older browsers) and reports that number as *Characters*.

**UTF-16 code units** are what JavaScript's `length`, Java's `String.length()` and many database columns count. The first 65,536 code points fit in one 16-bit unit, so letters, digits, punctuation, accented Latin, Cyrillic, Greek, Arabic and CJK characters are 1 unit each. Most emoji sit above that range and need two units, a *surrogate pair*; a few older ones such as `☕` and `❤` fit in one. That is where "an emoji counts as 2" comes from.

**UTF-8 bytes** are what a file, an HTTP request or a database row actually stores. ASCII takes 1 byte, most accented letters and Cyrillic take 2, CJK characters and most symbols take 3, and most emoji take 4. If a field has a *byte* limit, this is the number that matters.

### Worked example

```text
Café ☕ is open! 👍🏽🇺🇸

Characters (grapheme clusters)  18
Characters without spaces       14
UTF-16 code units               24
Code points                     20
UTF-8 bytes                     35
Words                            5
Sentences                        2
X weighted length               21
```

`👍🏽` and `🇺🇸` look like two characters but are four code points (`👍`, `🏽`, `🇺`, `🇸`), which lifts 18 characters to 20 code points. Each of those four sits above U+FFFF and takes two code units, so 20 code points become 24 units. In UTF-8, `é` is 2 bytes, `☕` is 3 and each emoji code point is 4, for 35 in total. X counts `☕`, `👍🏽` and `🇺🇸` as 2 each, so its weighted length is 21 rather than 18.

## Character limits for social media, SEO and SMS

| Platform or field | Limit | What counts |
| --- | --- | --- |
| X (Twitter) post | 280 (25,000 with Premium) | Spaces count 1; every emoji and CJK character counts 2; any URL counts 23 |
| X bio | 160 | Characters with spaces |
| Instagram caption | 2,200 | Spaces, line breaks and hashtags; feed shows ~125 before "more" |
| Instagram bio | 150 | Characters with spaces |
| Threads post | 500 | Characters with spaces; a text attachment adds up to 10,000 more |
| Bluesky post | 300 | Grapheme clusters, so each emoji is 1 |
| Facebook post | 63,206 | Characters with spaces; feed collapses after ~480 |
| LinkedIn post | 3,000 | Characters with spaces; feed truncates after ~210 with "…more" |
| LinkedIn headline / About | 220 / 2,600 | Characters with spaces |
| TikTok caption | 4,000 in the app, 2,200 via schedulers | Characters with spaces, including hashtags |
| YouTube title / description | 100 / 5,000 | Characters with spaces; search results cut titles at ~60–70 |
| Pinterest Pin title / description | 100 / 500 | Characters with spaces |
| Reddit post title | 300 | Characters with spaces |
| Discord message | 2,000 (4,000 with Nitro) | Characters with spaces |
| Google title tag | ~60 | Pixel width (~600 px), so wide letters shorten the budget |
| Meta description | ~155–160 desktop, ~120 mobile | Pixel width (~920 px desktop) |
| Google Ads headline / description | 30 / 90 | Characters with spaces |
| SMS | 160 GSM-7 or 70 Unicode | One emoji or curly quote switches the whole message to the 70 limit |
| Excel cell | 32,767 | Characters with spaces |

Platforms change limits quietly; check the official help page before a campaign that depends on one. The presets match this table.

## What counts on X, in an SMS and on Google

**X (Twitter)** uses a weighted count defined by its open-source `twitter-text` library. Code points 0 to 4,351 – Latin, Greek, Cyrillic, Hebrew, Arabic, Devanagari, Thai and ASCII punctuation – weigh 1, and so do a few typographic ranges such as curly quotes, dashes and the special spaces. Everything else weighs 2, which covers Chinese, Japanese, Korean and all emoji. X normalizes the text to Unicode NFC first, so an `é` pasted as `e` plus a combining accent still costs 1. An emoji is always 2 regardless of how many code points it contains, so a family emoji costs the same as a plain smiley. Every link is replaced by a t.co URL and charged 23 characters, whether the original was 15 characters or 150. The X preset applies all three rules and tells you how many links it found.

A concrete case: a post reading "Our new guide to writing better meta descriptions is live. Read it here:" followed by an 83-character URL and a rocket emoji shows 158 visible characters, but X counts 99 – the URL becomes 23, the emoji becomes 2, the rest is unchanged. You have far more room than the raw count suggests.

**SMS** is the opposite trap. A text message holds 160 characters only if every character is in the GSM-7 alphabet: basic Latin letters, digits, common punctuation and a few accented letters such as é, ü and ñ. A single curly apostrophe, em dash or emoji forces the whole message into UCS-2 encoding, where the limit drops to 70. Longer messages are split into parts of 153 (GSM-7) or 67 (UCS-2) characters, and most carriers bill each part. The SMS preset detects the encoding your text forces and reports how many parts it will send as.

**Instagram, LinkedIn, TikTok and Facebook** count spaces, line breaks and hashtags: `#contentmarketing` costs 17 characters of a caption. Instagram also caps the *number* of hashtags per post separately from the character limit, and it has tightened that cap from the long-standing 30, so check the current figure in the app rather than relying on an old guide. TikTok has two limits: the app accepts 4,000 characters, but captions sent through its Content Posting API, which scheduling tools use, stop at 2,200. The tool has a preset for each.

**Google** does not count characters at all. Titles and descriptions are truncated by pixel width, so a title full of W and M is cut sooner than one full of i and l. The 60 and 160 figures are safe averages, not guarantees.

## Practical uses

**Social media managers** select the platform and know before publishing whether the emoji-heavy version fits, and whether the link costs 23 characters or 83.

**SEO specialists** paste a meta description or title tag, pick the preset, and trim until it will not be cut off. The same works for Google Ads headlines and YouTube titles.

**Developers and QA testers** check whether a test string fits a `VARCHAR(255)` column or a 4,000-byte field using the UTF-8 bytes tile and the code-unit figure, without opening a console.

**Students and applicants** facing a hard cap – a UCAS personal statement at 4,000 characters, a scholarship box at 1,500 – set a custom limit and write straight into the tool.

**Translators** who quote per 1,000 characters use the *Without spaces* figure when the agreement says so; some agencies bill that way, others count spaces, so check the contract.

## How to trim text to a limit without losing meaning

Work through these in order and check the bar after each pass.

1. **Remove hedges**: "very", "really", "actually", "it is important to note that".
2. **Replace phrases with words**: "at this point in time" becomes "now"; "in the event that" becomes "if".
3. **Cut the preamble.** A draft's first sentence is often a run-up to the point. Delete it and see what is lost.
4. **Use numerals and symbols**: "50 percent" becomes "50%".
5. **Drop the weakest emoji.** On X each costs 2; in an SMS one emoji cuts capacity from 160 to 70.
6. **Trim from the end last.** Start from the *Trimmed to fit* box, then rewrite the final sentence so it ends cleanly.

## Character counter vs Microsoft Word

Two differences explain most mismatches.

**Paragraph marks.** Word's *Characters (with spaces)* ignores the mark created by pressing Enter. This tool, like nearly every web form, counts each line break as one character, so a ten-paragraph text reads about nine higher here. If your target is a form field, trust this number.

**Emoji and rare symbols.** Word stores text as UTF-16, and depending on the version an emoji can add 2 to its count. This tool counts it as 1 visible character and shows the code-unit total separately. If the recipient measures in Word, turn on *Count emoji as 2* for a matching limit check. Word also skips footnotes and text boxes unless you tick that option in its Word Count dialog.

## Tips and common mistakes

- **Leave a margin.** Previews are truncated well before hard limits, and platforms may weight characters. Stopping 5 percent short is cheap insurance.
- **Do not use the "no spaces" figure for social posts.** Every social platform counts spaces.
- **Watch for invisible characters.** Text copied from PDFs often carries non-breaking spaces, zero-width spaces and stray line breaks that count but do not show. The [remove line breaks tool](/tools/remove-line-breaks) flattens the breaks; retype any section that still looks too long.
- **Write meta descriptions for mobile.** Put the key phrase in the first 120 characters.
- **Briefs in words?** The [word counter](/tools/word-counter) adds reading time and keyword density; [case converter](/tools/case-converter) changes never alter the count.

## Privacy and limitations

Everything runs in your browser. Your text is never uploaded or logged; the draft lives in session storage, wiped when the tab closes, and the limit settings stay in local storage on your device.

Known limits: sentence counts are estimates that abbreviations like "e.g." can throw off; words are split on spaces, so Chinese, Japanese and Thai are undercounted (use characters instead); X's URL detection closely approximates the official library but may miss unusual domains; and above one million characters the tool counts code points instead of grapheme clusters to stay responsive. Platform limits are correct as of the date on this page.
