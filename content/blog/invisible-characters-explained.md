---
title: "Invisible Characters in Text: Causes and Fixes"
description: "Invisible characters in text, such as zero-width and non-breaking spaces, arrive through copy-paste and make matching fail. Learn to find and remove each one."
date: "2026-09-30"
updated: "2026-09-30"
tags: [invisible-characters, unicode, zero-width-space, data-cleaning, copy-paste]
relatedTools: [invisible-character, remove-duplicate-lines, alphabetical-order, character-counter]
---
Invisible characters in text are Unicode code points that print no mark: the zero-width space (U+200B), the non-breaking space (U+00A0), joiners, the soft hyphen, the byte order mark and a few blank glyphs. They usually arrive by copy-paste from web pages, PDFs and word processors, and they make strings that look identical compare as different. Find them by listing code points rather than trusting your eyes, and remove them with a targeted replace, because a plain trim misses many of them.

*Last reviewed September 30, 2026.*

## Quick answer

- **Usual suspects:** the no-break space in spreadsheets and web copy, the zero-width space in copied identifiers, and the byte order mark at the top of exported files.
- **Detect:** print each code point (snippet below) or paste the text into the [invisible character tool](/tools/invisible-character), which highlights each hidden character.
- **Fix:** turn no-break spaces into plain spaces, delete zero-width characters and byte order marks, and keep joiners unless the text is plain English.

## The code points you will actually meet

Categories below were checked on September 30, 2026 with a script on Node.js 22 (Unicode 17.0 data) and Python 3.11 (Unicode 14.0 data).

| Code point | Name | Category | Typical source |
| --- | --- | --- | --- |
| U+00A0 | No-break space | Zs | Web pages (`&nbsp;`), word processors |
| U+00AD | Soft hyphen | Cf | Hyphenation hints in web text |
| U+200B | Zero width space | Cf | Line-break hints in long strings |
| U+200C | Zero width non-joiner | Cf | Persian and some Indic writing |
| U+200D | Zero width joiner | Cf | Emoji sequences, Indic scripts |
| U+2060 | Word joiner | Cf | Typeset text that must not break |
| U+FEFF | Zero width no-break space, also the BOM | Cf | Start of files saved with a signature |
| U+3164 | Hangul filler | Lo | Korean composition, "blank name" fields |

There is no "invisible" property to search on. Most of these are format characters (Cf), but the no-break space is a space separator and the Hangul filler is a letter, so one "whitespace" regex catches only part of the list.

The no-break space and soft hyphen sit at 0xA0 and 0xAD in ISO 8859-1 (Latin-1). U+FEFF does two jobs: its name describes a glue role, and it doubles as the signature at the start of a file. The word joiner, added in Unicode 3.2, gives the glue role a character of its own. In UTF-8 the BOM (bytes EF BB BF) is only a signature, which the Unicode Standard treats as neither required nor recommended, as of this writing.

## Where hidden characters come from

**Web pages and apps.** Browsers collapse runs of spaces, so authors and editors write `&nbsp;` to keep a gap. Whether it reaches your clipboard as a real U+00A0 depends on the browser and destination, but Microsoft's documentation for Excel's TRIM says this character is commonly used in web pages. Publishers also add soft hyphens (`&shy;`) and zero-width break hints so long words wrap. Chat and note apps may pass them along, but we have not checked any specific app.

**Word processors and keyboards.** Word has a shortcut for a nonbreaking space (Ctrl+Shift+Space on Windows), and Option+Space on a Mac keyboard typically types one. French typography puts a no-break space before colons and question marks, and autocorrect may insert one, either U+00A0 or, in careful typesetting, the narrow U+202F.

**PDFs.** The software that built the file decides what you copy. A hyphenated line end may paste as a hyphen, a soft hyphen or nothing, and word gaps are sometimes rebuilt from positions.

**Files.** Some Windows programs and spreadsheet-oriented CSV exports write a BOM. In Python, `encoding="utf-8-sig"` strips it on read; plain `utf-8` leaves U+FEFF on your first column header.

**Legitimate inserts.** Emoji keyboards add joiners on purpose. The technologist emoji 👩‍💻 is a woman, a zero width joiner and a laptop: 3 code points, yet `Intl.Segmenter` in Node.js 22 counts 1 character. Delete the joiner and 2 pictures remain.

## What they break, with numbers

### Comparisons and duplicates

Five lines all read "Maria Lopez", each with one hidden difference. Method: one script on the Node.js 22 and Python 3.11 builds above.

| Line | Hidden detail | UTF-16 length | Equals line 1 after JS `trim()` | Equals line 1 after Python `strip()` |
| --- | --- | --- | --- | --- |
| 1 | None | 11 | Yes | Yes |
| 2 | No-break space inside | 11 | No | No |
| 3 | Zero-width space at end | 12 | No | No |
| 4 | BOM at the start | 12 | Yes | No |
| 5 | Plain trailing space | 12 | Yes | Yes |

Distinct values: 5 with no cleanup, 3 after JavaScript's `trim()`, 4 after Python's `strip()`, and 1 after the cleanup shown later. `trim()` removes U+FEFF and `strip()` does not; neither touches U+200B. That is how a deduplicated list can still show one name three times. The [duplicate line remover](/tools/remove-duplicate-lines) has separate switches for invisible characters, trimmed line ends and extra inner spaces, which match rows 2 to 5.

### Sorting

In Node.js 22, `["Zed", "\u200BAnna", "Anna", "Bob"].sort()` compares code units and puts the zero-width-space Anna last, after Zed. `Intl.Collator("en")` ignores the zero-width space and treats both Annas as equal. A leading no-break space lands last in code order but first under the collator. A row at the wrong end of a sorted list usually has a hidden first character. The [alphabetical order tool](/tools/alphabetical-order) ignores invisible characters such as the zero-width space when sorting.

### Lengths and limits

A zero-width space inside "ab" takes the string from 2 UTF-16 units and 2 UTF-8 bytes to 3 and 5, and `Intl.Segmenter` counts it as its own character, so a field near its limit can reject text that looks short enough. The [character counter](/tools/character-counter) shows all three figures.

### URLs

In Node.js 22, `new URL("https://example.com/pri\u200Bcing").pathname` is `/pri%E2%80%8Bcing`, a different path from `/pricing` that normally gives a 404. In the host name the parser drops the zero-width space, and a no-break space makes the URL invalid. We did not test browsers.

### Spreadsheets

Excel's TRIM strips the ordinary space (code 32), and Microsoft's documentation, as of this writing, says it leaves the no-break space, code 160. To diagnose, `=UNICODE(RIGHT(B2,1))` returns 160 for a no-break space and 8203 for a zero-width space. To clean, use `=TRIM(SUBSTITUTE(B2,UNICHAR(160)," "))`.

## How to detect hidden characters

1. **Compare lengths.** If `LEN`, `.length` or `len()` exceeds what you can count, something is hidden.
2. **Print code points.** This lists every format character and special space with its position:

```js
for (const [i, ch] of [...text].entries()) {
  if (/[\p{Cf}\p{Zs}\u2800\u3164]/u.test(ch) && ch !== " ")
    console.log(i, "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"));
}
```

   On "Order", no-break space, "#4821", zero-width space, " - total" it prints positions 5 (U+00A0) and 11 (U+200B). Add `\p{Mn}` for combining marks such as U+FE0F.
3. **Use the shell.** With GNU `cat -A file.txt`, a zero-width space shows as `M-bM-^@M-^K`. To search, run `grep -nP '[\x{200B}-\x{200D}\x{2060}\x{FEFF}\x{00AD}\x{00A0}]' file.txt` in a UTF-8 locale with a PCRE-enabled grep. Both worked on a test file.
4. **Paste into a detector.** The [invisible character tool](/tools/invisible-character) lists each code point with its count and first position, and can mark them with visible tags such as `<U+200B>`.

## How to remove them without breaking text

| Character | Usual action | Reason |
| --- | --- | --- |
| U+00A0, U+202F, U+3000 | Replace with a plain space | They are spaces; words still need a gap |
| U+200B, U+2060, U+FEFF, U+00AD | Delete | No meaning in plain text |
| U+200D, U+200C, U+FE0F | Keep, unless plain English | Emoji and Persian spelling depend on them |
| U+3164, U+2800 | Delete, unless Braille or Korean | Usually padding someone added |

In JavaScript:

```js
const cleaned = text
  .replace(/[\u200B\u2060\uFEFF\u00AD]/g, "")
  .replace(/[\u00A0\u202F\u3000]/g, " ")
  .trim();
```

Python's `re.sub` accepts the same character classes, followed by `.strip()`. On the five "Maria Lopez" lines, the JavaScript version leaves exactly 1 distinct value.

Unicode normalization is not a substitute. NFKC turns U+00A0, U+202F and U+3000 into plain spaces but leaves U+200B, the BOM and the soft hyphen alone, and it maps U+3164 to another filler, U+1160. Use it for comparison keys only. Clean first, then compare, sort or deduplicate.

## Security: look-alikes and direction tricks

A character need not be invisible to mislead. Swap the "a" in "example.com" for the Cyrillic letter U+0430 and the string still has 11 characters and looks the same, yet in Node.js it is not equal, and `url.domainToASCII` converts it to `xn--exmple-4nf.com`.

The best-known attack on source code is Trojan Source. Nicholas Boucher and Ross Anderson of the University of Cambridge showed in 2021 that bidirectional control characters such as U+202E and U+2066 can make code display in a different order than a compiler reads it. The bidi issue is CVE-2021-42574 and the look-alike issue CVE-2021-42694. Unicode tag characters (mostly U+E0020 to U+E007F) mirror ASCII and render as nothing, so they can hide text in pasted content. The advice below is defensive.

- Search outside code for U+202A to U+202E and U+2066 to U+2069 with the `grep -nP` pattern above.
- Keep tooling that flags hidden Unicode; several compilers and code hosts added warnings after 2021, so check yours.
- For usernames and domains, limit the allowed scripts instead of spotting look-alikes by eye.

This is general information, not a security audit. The [invisible character tool](/tools/invisible-character) does not detect look-alike letters, so flag any non-ASCII character in a field that should be plain ASCII. Do not use hidden characters to impersonate anyone or evade moderation.

## Common mistakes

- **Trusting a trim.** As the table showed, `trim()` and `strip()` disagree about U+FEFF and both ignore U+200B.
- **Deleting every non-ASCII character.** That also removes accents, Persian letters and emoji.
- **Stripping joiners blindly.** It splits emoji and alters spelling in some scripts.

Excel, Word, Python and Google are named only to describe behavior; this guide is independent of them.

## Frequently asked questions

### Why does Excel TRIM not remove the space?

TRIM strips only the ordinary space, code 32. The space in your cell is probably a no-break space, code 160, which commonly arrives from web pages. Replace it with `SUBSTITUTE` first, then apply TRIM.

### Is it safe to delete a zero-width joiner?

Not always. In emoji it glues several pictures into one, and in some Indic scripts it changes how letters connect. In plain English text it is usually an accident and can go.

### Can I use invisible characters for blank names or messages?

Rules belong to each platform. Some services accept blank-looking names and others reject them. We cannot verify any service's current behavior, so read its terms. Using them to impersonate people or get around moderation is commonly against the rules.

### Do invisible characters hurt SEO?

We know of no Google documentation that treats them as a ranking factor. The harm is practical: they can split a keyword inside a title, break a URL, or push a description over its length limit. Keep them out of titles, descriptions and slugs.
