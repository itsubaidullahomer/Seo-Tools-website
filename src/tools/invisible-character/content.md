## What this invisible character tool does

An invisible character is a Unicode code point that shows no ink on screen: a zero-width space, a joiner, a non-breaking space, or a blank glyph such as the Braille pattern blank. This page does two jobs. On the first tab you copy any of 28 of them as the raw character, a code point, or an escape sequence for JavaScript, HTML or CSS. On the second tab you paste text, see exactly which hidden characters it contains, and remove, replace or mark them.

Hidden characters cause quiet bugs. A lookup fails because one cell holds a non-breaking space. A script refuses to run because a zero-width space rode along in a copied snippet. A title is three characters longer than it looks. The tool names the exact code point behind the problem so you can fix it.

It is built for spacing, typesetting, debugging and data cleaning. It is not a tool for impersonating people or evading moderation, and nothing here promises that a character will survive in any particular app.

## How to copy an invisible character

1. **Pick a character.** The four cards at the top cover the most requested ones: zero-width space, Braille blank, Hangul filler and non-breaking space. For anything else, use the filter under **All characters** (zero-width, spaces, blank glyphs, direction marks).
2. **Choose the format** under **Copy as**: the character itself, a code point (`U+200B`), a JavaScript or JSON escape (`\u200B`), an HTML entity (`&#x200B;`) or a CSS escape (`\200B`).
3. **Set how many**, from 1 to 500. Three copies in JavaScript format give `\u200B\u200B\u200B`.
4. **Press Copy.** The button confirms with "Copied!". Format and count apply to every Copy button.
5. **Read the width note.** Each row shows how wide that character renders in your browser with your fonts right now.

Width depends on fonts. In our own check on September 29, 2026, a Linux build of Chromium with a minimal font set drew the Hangul filler U+3164 with no width, while its neighbor U+1160 was one em wide. Devices with Korean fonts can behave differently, so test where you will use the character.

## How to find and remove hidden characters

1. Open **Detect and clean text** and paste your text, or press **Load example**.
2. Read the counts: hidden characters, distinct kinds, lines affected.
3. Scan the **highlighted view**. Orange labels such as ZWSP, NBSP, BOM and SHY mark hidden characters; grey labels mark ones the tool considers probably intentional. Hover for the full name.
4. Check **What was found**: one row per code point with its type, count and first line and column.
5. Under **Clean the text**, choose an action per type: remove, replace with a space, replace with a line break, mark, or keep. Presets are Recommended, Remove all and Mark all.
6. Copy the cleaned text or download it as a `.txt` file.

**Recommended** turns look-alike spaces into ordinary spaces, unusual line separators into line breaks, and removes everything else. **Mark all** swaps each hidden character for a visible tag such as `<U+200B>`, which shows the problem in any plain-text editor or diff.

### Worked example

The built-in example has 12 hidden characters. Its first line is `Order`, NBSP, `#4821`, ZWSP, ` - total:`, EM SPACE, `$19.99`, Braille blank. With the recommended settings the two spaces become plain spaces and the ZWSP and Braille blank vanish. A stray joiner, a Hangul filler, a byte order mark and a soft hyphen are removed too. Four are kept: the two joiners in the family emoji, the style selector after the check mark, and the non-joiner in the Persian word. Result: 6 removed, 2 replaced, 4 kept.

## The characters and what each is for

| Code point | Name | Designed width | What it is for |
| --- | --- | --- | --- |
| U+200B | Zero width space | none | A place where a line may break, such as inside long URLs |
| U+200C | Zero width non-joiner | none | Stops letters joining; needed in Persian and some Indic scripts |
| U+200D | Zero width joiner | none | Requests joining; glues emoji into one picture |
| U+2060 | Word joiner | none | Forbids a line break at that spot |
| U+FEFF | Zero width no-break space | none | The byte order mark at the start of a file |
| U+00AD | Soft hyphen | none until a break | Marks where a word may be hyphenated |
| U+00A0 | No-break space | one space | Keeps "10 kg" on one line |
| U+3000 | Ideographic space | one em | The standard space in Chinese, Japanese and Korean |
| U+2800 | Braille pattern blank | one Braille cell | The Braille cell with no dots |
| U+3164 | Hangul filler | depends on the font | Placeholder in Korean syllable composition |

"Invisible" is not a Unicode category. These characters are spread across format characters (Cf), space separators (Zs), other symbols (So) and other letters (Lo), which is why no single cleanup rule catches them all. The zero-width space is not whitespace, the Braille blank is a symbol, and the Hangul filler is technically a letter.

They were not invented as tricks. The zero-width space gives scripts written without word spaces a legal break point, and joiners control how letters connect in Arabic-script and Indic writing. Emoji use the joiner to build families and professions. U+FEFF is named "zero width no-break space" for historical reasons, but the Unicode Standard says new text should use the word joiner U+2060 for that meaning and keep U+FEFF for the byte order mark.

## Better alternatives when you write markup or code

Before reaching for a hidden character in a web page or document, check whether a purpose-built tool already does the job. It is easier to maintain, and screen readers and search engines treat it predictably.

| You want to | Hidden character | Usually better |
| --- | --- | --- |
| Let a long URL or file path wrap | Zero-width space (`&#x200B;`) | The `<wbr>` element, or the CSS rule `overflow-wrap: anywhere` |
| Keep "10 kg" or "Mr. Smith" on one line | No-break space (`&nbsp;`) | This one is fine as is; `white-space: nowrap` on a span also works |
| Add horizontal space | Em space, Braille blank, Hangul filler | CSS `margin`, `padding` or `gap` |
| Give an empty inline element a width | No-break space | CSS `min-width` or `display: inline-block` with a set width |
| Stop a line break inside a phone number | Word joiner (U+2060) | `white-space: nowrap` on the number |

The copy formats above exist for exactly these cases. Choose **HTML entity** for markup, **CSS escape** for a `content:` property, and **JavaScript or JSON** for strings in code, so the character is visible in your source instead of being an invisible surprise for the next person to edit the file.

## Where hidden characters cause real problems

**Developers.** Python stops with `SyntaxError: invalid non-printable character U+200B` when a zero-width space sits in source code, and JavaScript reports `Invalid or unexpected token`. Node.js 22's `JSON.parse` rejects text that starts with a byte order mark, and on Linux a shell script that begins with a BOM prints an error for its first line. If a payload will not parse, check it here, then run it through the [JSON Formatter](/tools/json-formatter).

**Spreadsheet and data users.** Web tables often carry non-breaking spaces. Excel's `TRIM` removes only the plain space (code 32), so `=TRIM(SUBSTITUTE(A2,CHAR(160)," "))` is the usual fix, and `=SUBSTITUTE(A2,UNICHAR(8203),"")` strips zero-width spaces. Lookups that look identical but do not match are almost always this.

**SEO and content teams.** Titles, meta descriptions and slugs can pick up invisible characters from documents. They count toward length limits (check with the [Character Counter](/tools/character-counter) or [Word Counter](/tools/word-counter)), can split a keyword so an exact search misses it, and break links inside a URL. The [Slug Generator](/tools/slug-generator) drops them from slugs.

**Security reviewers.** Bidirectional override characters can reorder how source code is displayed relative to how it runs, the Trojan Source issue (CVE-2021-42574). Unicode tag characters, U+E0000 to U+E007F, mirror ASCII and render as nothing, so they can smuggle invisible text into a document or a prompt. The detector flags both and decodes hidden tag text.

**Typographers.** The legitimate uses are why these characters exist: a no-break space between a number and its unit, a word joiner in a phone number, a zero-width space so a long URL can wrap.

## What we verified

On September 29, 2026 we checked the following with Node.js 22 (Unicode 17.0 data) and Python 3.11 (Unicode 14.0 data). The full table is in the tool under "How these characters behave in code".

- JavaScript's `trim()` and `\s` remove the no-break space, other space separators and U+FEFF. They leave U+200B, U+200C, U+200D, U+2060, the soft hyphen, U+0085, the Braille blank and the Hangul filler.
- Python's `strip()` removes the no-break space, other space separators and U+0085. It leaves U+FEFF, the zero-width characters, the Braille blank and the Hangul filler.
- Unicode compatibility normalization (NFKC) turns the no-break space and ideographic space into an ordinary space. It leaves the zero-width space, BOM, soft hyphen and Braille blank alone, and maps U+3164 to another filler, U+1160, not to nothing.

Rendering inside chat apps, games and social networks is deliberately not listed. It changes with app versions and fonts, and we cannot verify it.

## Tips and common mistakes

- **Do not strip joiners blindly.** Removing U+200D breaks emoji sequences, and removing U+200C changes Persian spelling. Keep "Keep probable legitimate uses" on unless the text is plain English.
- **Do not use blank characters for layout.** Margins, padding and `white-space` are reliable and accessible. Some screen readers announce blank characters or pause on them.
- **Use Mark all to investigate.** The `<U+XXXX>` tags survive in editors, tickets and version control, so a colleague sees what you see.
- **Search your own files.** In a JavaScript or Python regular expression, `[\u200B-\u200D\u2060\uFEFF]` finds the common zero-width set.
- **Keep the BOM if the consumer needs it.** Some spreadsheet programs rely on it to open UTF-8 CSV files correctly.

## Privacy and limitations

Everything runs in your browser. Your text and the characters you copy are not uploaded. Pasted text is kept in this tab's session storage so a refresh does not lose it, and it disappears when you press Clear or close the tab. Your cleaning choices are saved in local storage on your device.

Detection follows the Unicode properties built into your browser, which can differ slightly between versions. The highlighted view shows at most 30,000 characters and 1,500 labels; counts, the table and the cleaned text always cover the whole input. "Probably intentional" is a heuristic. The tool does not detect look-alike letters, trailing spaces or double spaces, and it cannot tell you whether a specific app will keep or reject a character. Product names such as Excel and Python belong to their owners and appear only to describe behavior.
