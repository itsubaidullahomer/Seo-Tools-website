## What this character counter does

Type or paste into the box above and the character counter updates on every keystroke: characters with spaces, characters without spaces, words, sentences, lines, paragraphs, letters and the size of the text in UTF-8 bytes. Nothing is sent anywhere and there is no button to press.

What sets it apart from a plain character count is the limit checker underneath. Choose a platform from the dropdown – an X post, an Instagram caption, a LinkedIn headline, a meta description, an SMS – or type your own number, and a progress bar shows how much of the budget you have used. It turns amber at 90 percent and red when you go over, and when you are over it offers a trimmed version of your text that fits, cut at a word boundary so you can copy it straight out.

It also counts the way modern software counts. An emoji, a flag or an accented letter typed as two keystrokes is one visible character, and that is what the main number reports. When the text contains characters that take more than one UTF-16 code unit, the tool shows that figure too, because it is the number many apps, databases and X will hold you to.

## How to use the character counter

1. **Enter your text.** Type directly, or click **Paste** to insert your clipboard. The draft is kept in this tab's session storage, so a refresh does not lose it.
2. **Read the tiles.** *Characters* is the headline figure and includes spaces and line breaks. *Without spaces* removes every space, tab and line break. *Words*, *Sentences*, *Lines* and *Paragraphs* follow, then *Letters* (with digits and symbols as a hint) and *UTF-8 bytes*.
3. **Pick a limit.** Under *Check against a limit*, choose a platform from the dropdown, or type a number in the *Limit* box for a custom limit. The counter above the text box switches to `used / limit`.
4. **Watch the bar.** Blue means you have room, amber means you are within 10 percent of the limit, red means you are over, and the text box says exactly how many characters to cut.
5. **Copy the version that fits.** When you are over, a *Trimmed to fit* box shows the longest prefix of your text that fits, ending at a word boundary where possible.
6. **Copy your stats** for a brief or a client with *Copy stats*, or **Copy text** to grab the whole draft.

The *Count emoji as 2 characters* switch measures the limit in UTF-16 code units instead of visible characters, so each emoji uses 2. It is greyed out for the X and SMS presets, which apply their own rules automatically.

## How characters are actually counted

"How many characters is this?" has three honest answers, and they only agree for plain English text.

**Grapheme clusters** are what a person sees as one character. `é` is one, whether it is stored as a single code point or as `e` plus a combining accent. `👍🏽` is one. `🇺🇸` is one, although it is built from two regional-indicator symbols. The family emoji `👨‍👩‍👧‍👦` is one visible character made of seven code points joined by invisible zero-width joiners. This tool splits text into grapheme clusters with the browser's `Intl.Segmenter` (with a fallback for older browsers) and reports that number as *Characters*.

**UTF-16 code units** are what JavaScript's `length`, Java's `String.length()`, Microsoft Word and many database columns count. The first 65,536 code points fit in one 16-bit unit, so letters, digits, punctuation, accented Latin, Cyrillic, Greek, Arabic and CJK characters are 1 unit each. Almost every emoji sits above that range and needs two units, a *surrogate pair*. That is where "an emoji counts as 2" comes from.

**UTF-8 bytes** are what a file, an HTTP request or a database row actually stores. ASCII takes 1 byte, most accented letters and Cyrillic take 2, CJK characters and most symbols take 3, emoji take 4. If a field has a *byte* limit, this is the number that matters.

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

The four emoji symbols (`👍`, `🏽`, `🇺`, `🇸`) each take two code units, adding 4 to reach 24. In UTF-8, `é` is 2 bytes, `☕` is 3 and each emoji code point is 4, for 35 in total. X counts `☕`, `👍🏽` and `🇺🇸` as 2 each, so its weighted length is 21 rather than 18.

## Character limits for social media, SEO and SMS

| Platform or field | Limit | What counts |
| --- | --- | --- |
| X (Twitter) post | 280 (25,000 with Premium) | Spaces count 1; every emoji and CJK character counts 2; any URL counts 23 |
| X bio | 160 | Characters with spaces |
| Instagram caption | 2,200 | Spaces, line breaks and hashtags (max 30); feed shows ~125 before "more" |
| Instagram bio | 150 | Characters with spaces |
| Threads post | 500 | Characters with spaces |
| Bluesky post | 300 | Grapheme clusters, so each emoji is 1 |
| Facebook post | 63,206 | Characters with spaces; feed collapses after ~480 |
| LinkedIn post | 3,000 | Characters with spaces; feed truncates after ~210 with "…more" |
| LinkedIn headline / About | 220 / 2,600 | Characters with spaces |
| TikTok caption | 4,000 | Characters with spaces, including hashtags |
| YouTube title / description | 100 / 5,000 | Characters with spaces; search results cut titles at ~60–70 |
| Pinterest Pin title / description | 100 / 500 | Characters with spaces |
| Reddit post title | 300 | Characters with spaces |
| Discord message | 2,000 (4,000 with Nitro) | Characters with spaces |
| Google title tag | ~60 | Pixel width (~600 px), so wide letters shorten the budget |
| Meta description | ~155–160 desktop, ~120 mobile | Pixel width (~920 px desktop) |
| Google Ads headline / description | 30 / 90 | Characters with spaces |
| SMS | 160 GSM-7 or 70 Unicode | One emoji or curly quote switches the whole message to the 70 limit |
| Excel cell | 32,767 | Characters with spaces |

Limits change and platforms rarely announce it; check the official help page before a campaign that depends on one. The presets in the tool match this table.

## What counts on X, in an SMS and on Google

**X (Twitter)** uses a weighted count defined by its open-source `twitter-text` library. Code points 0 to 4,351 – Latin, Greek, Cyrillic, Hebrew, Arabic and common punctuation – weigh 1; everything else weighs 2, which covers Chinese, Japanese, Korean and all emoji. An emoji is always 2 regardless of how many code points it contains, so a family emoji costs the same as a plain smiley. Every link is replaced by a t.co URL and charged 23 characters, whether the original was 15 characters or 150. The X preset applies all three rules and tells you how many links it found.

A concrete case: a post reading "Our new guide to writing better meta descriptions is live. Read it here:" followed by an 83-character URL and a rocket emoji shows 158 visible characters, but X counts 99 – the URL becomes 23, the emoji becomes 2, the rest is unchanged. You have far more room than the raw count suggests.

**SMS** is the opposite trap. A text message holds 160 characters only if every character is in the GSM-7 alphabet: basic Latin letters, digits, common punctuation and a few accented letters such as é, ü and ñ. A single curly apostrophe, em dash or emoji forces the whole message into UCS-2 encoding, where the limit drops to 70. Longer messages are split into parts of 153 (GSM-7) or 67 (UCS-2) characters, and most carriers bill each part. The SMS preset detects the encoding your text forces and reports how many parts it will send as.

**Instagram, LinkedIn, TikTok and Facebook** count spaces, line breaks and hashtags toward the limit. `#contentmarketing` costs 17 characters of a caption.

**Google** does not count characters at all. Titles and descriptions are truncated by pixel width, so a title full of wide letters like W and M is cut sooner than one full of narrow letters like i and l. The 60 and 160 figures are safe averages, not guarantees.

## Practical uses

**Social media managers** draft a post, select the platform, and know before publishing whether the emoji-heavy version fits – and whether the link really costs 23 characters or 83.

**SEO specialists and editors** paste a meta description, pick the preset, and trim to the point where it will not be cut off. The same workflow covers title tags, Google Ads headlines and YouTube titles.

**Developers and QA testers** check whether a test string will pass a `VARCHAR(255)` column or a 4,000-byte field. The UTF-8 bytes tile and the code-unit figure answer both without opening a console.

**Students and applicants** working to a strict brief – a UCAS personal statement capped at 4,000 characters, a scholarship form with a 1,500-character box – set a custom limit and write straight into the tool.

**Translators and copywriters** who quote per 1,000 characters use the *Without spaces* figure, the basis most agencies bill on.

## How to trim text to a limit without losing meaning

Cutting characters is easy; cutting them without weakening the message takes a method. Work through these in order and check the bar after each pass.

1. **Remove hedges and intensifiers**: "very", "really", "actually", "in order to", "it is important to note that".
2. **Replace phrases with words**: "at this point in time" becomes "now"; "make a decision" becomes "decide"; "in the event that" becomes "if".
3. **Cut the preamble.** The first sentence of a draft is often a run-up to the point. Delete it and see whether anything is lost.
4. **Use numerals and symbols**: "50 percent" to "50%", "and" to "&" in headlines.
5. **Drop the weakest emoji.** On X each one costs 2; in an SMS, one emoji costs 90 characters of capacity.
6. **Trim from the end last.** If you are still over, use the *Trimmed to fit* box, then rewrite the final sentence so it ends cleanly rather than shipping the automatic cut as final copy.

## Character counter vs Microsoft Word and Google Docs

Two differences cause most "why don't the numbers match?" questions.

**Paragraph marks.** Word's *Characters (with spaces)* figure does not count the paragraph mark you create by pressing Enter. This tool, like nearly every web form, counts each line break as one character, so a ten-paragraph text reads nine or ten characters higher here. If your target is a form field, trust this number.

**Emoji and rare symbols.** Word and Google Docs work in UTF-16 internally, so an emoji typically adds 2 to their count. This tool counts it as 1 visible character and shows the code-unit total separately. If the recipient measures in Word, turn on *Count emoji as 2* and the limit check matches.

Word also excludes footnotes, endnotes and text boxes unless you tick the option in its Word Count dialog. Paste exactly the text you want measured and the ambiguity disappears.

## Tips and common mistakes

- **Leave a margin.** Platforms count in code units or weighted characters, and previews are often truncated before the hard limit. Stopping 5 percent short is cheap insurance.
- **Do not use the "no spaces" figure for social posts.** Every social platform counts spaces. Use it only when a brief explicitly excludes them.
- **Watch for invisible characters.** Text copied from PDFs and web pages often carries non-breaking spaces, zero-width spaces and soft hyphens that count but do not show. If the count looks too high, clean the text with the [remove line breaks tool](/tools/remove-line-breaks) or retype the suspicious section.
- **Check meta descriptions against the mobile figure.** A 158-character description is fine on desktop and truncated on a phone; put the key phrase in the first 120 characters.
- **Hashtags and mentions count.** A 2,150-character caption with 20 hashtags will not fit if you add five more.
- **Case changes do not change the count**, but a [case converter](/tools/case-converter) helps when a platform displays titles in a fixed case and you want to preview the result.
- **Count words separately when the brief is in words.** The [word counter](/tools/word-counter) adds reading time, keyword density and sentence length to the same character figures.

## Privacy and limitations

Everything on this page runs in your browser. Your text is never uploaded, logged or stored on a server; the draft lives in your browser's session storage, which is wiped when the tab closes, and the limit settings are kept in local storage on your device only.

Known limits: the sentence count is an estimate that abbreviations such as "e.g." and decimal numbers can throw off; word counting splits on spaces, so it undercounts languages written without spaces such as Chinese, Japanese and Thai (use the character figure instead); X's URL detection is a close approximation of the official library, so unusual domains may be missed; and above one million characters the tool counts code points instead of grapheme clusters to stay responsive, which can make emoji-heavy totals slightly higher. Platform limits are correct as of the date shown on this page and are reviewed when platforms change them.
