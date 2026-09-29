## What this alphabetical order tool does

This alphabetical order tool takes any list, whether it holds names, book titles, keywords or URLs, and puts it in order as you type. Paste one item per line and the sorted list appears in the result box: A to Z by default, Z to A with one click. Comma-separated and semicolon-separated lists work as well, and the result can leave in whatever format you need.

Simple sorters compare raw character codes, which is why they put *Zebra* above *apple* and *Élan* after everything. This tool uses the dictionary rules built into your browser instead. Accented letters sit beside their base letters, *item2* comes before *item10*, and capital letters never decide the order on their own. It also covers what real lists need: sorting people by last name, skipping a leading *The*, sorting by length or by the first number in a line, shuffling, reversing and dropping duplicates. A table under the tool shows how each line was read, so you can see why it landed where it did.

## How to use it

1. **Add your list.** Paste it into **Your list**, click **Paste** or **Open .txt**, or drop a text file onto the box. **Example** loads a sample that suits the current mode.
2. **Choose Sort by.** *Alphabetical* is plain A to Z. The others are *Last name*, *Length*, *Numbers*, *Random* and *Reverse*.
3. **Set the Order.** The two buttons read *A → Z* and *Z → A*, or *Shortest first* and *Longest first* for length, or *Lowest first* and *Highest first* for numbers.
4. **Say how items are separated.** **Items are separated by** starts on *New line*. Switch it to comma, semicolon, tab, space (to sort the words in a sentence) or a custom separator; type `\n` or `\t` for a line break or tab. If your list sits on one line, the tool offers a button that splits it.
5. **Choose the output.** **Join the sorted items with** defaults to the input's separator. Change it to turn a comma list into one item per line, or the reverse.
6. **Fine-tune under Options.** Language rules, capital letters, articles, bullets and clean-up live there, apply instantly and are remembered on your device.
7. **Take the result.** **Copy** or **Download** it, or use **Use result as input** for a second pass. The counters show **Items in**, **Items out**, **Removed** and the **Order** applied.

Tick **Remove duplicates (ignores capitals)** to drop repeats before sorting. When you need to choose which copy survives or want a report of what was removed, use the [duplicate line remover](/tools/remove-duplicate-lines).

## How the sorting works

Every line first becomes *sort text*: spaces are collapsed, invisible characters such as zero-width spaces are ignored, and bullets, leading punctuation and articles are removed if those options are on. The tool then compares the sort text with your browser's built-in collation, the Unicode rules behind `Intl.Collator`. The comparison works in layers: base letters decide first, accents break ties between words with the same letters, and capitalization breaks any tie that remains. That is why *apple* comes before *Banana* even though a capital *B* has a lower character code than a lowercase *a*.

Here is one eight-line list sorted three ways:

| Setting | Result |
| --- | --- |
| Unicode order (Capital letters option) | Cherry, Zebra, apple, banana, item1, item10, item2, Élan |
| Dictionary order, natural numbers off | apple, banana, Cherry, Élan, item1, item10, item2, Zebra |
| Default settings | apple, banana, Cherry, Élan, item1, item2, item10, Zebra |

Unicode order puts every capital before every lowercase letter, and *É* last because its code is higher than any plain English letter. Dictionary order fixes both problems. Natural number order fixes the last one: runs of digits are compared as whole numbers, so 2 comes before 10.

When lines start with different kinds of characters, dictionary order arranges them in classes:

| Class | Examples | Position |
| --- | --- | --- |
| Spaces and punctuation | leading space, `_`, `-`, `(`, `#` | First |
| Currency and symbols | `$` | Next |
| Digits | 1, 9, 10 | Next |
| Latin letters | A, b, é | Next |
| Other scripts | α, я, 中 | Last in the default rules |

Natural number order reads *1.10* as 1, a dot and 10, so 1.5 comes before 1.9 and 1.10 comes last, the way version numbers behave. For decimal values choose **Sort by → Numbers**, which compares actual values and gives 1.10, 1.5, 1.9.

### Language rules

The **Language rules** menu changes where certain letters belong. English is the default, and the differences are real:

| Language | Order for a few letters |
| --- | --- |
| Swedish | a, zebra, å, ä, ö (å, ä and ö come after z) |
| German | a, ä, b (ä is treated as a variant of a) |
| Spanish | n, nube, nz, ñu, o (ñ is a letter after n) |
| Danish, Norwegian | z, æ, ø, å (the pair aa sorts with å at the end) |
| Polish | l, ł, o, ó, z, ż (marked letters follow their base letter) |
| Turkish | c, ç, d, ı, I, i, İ (dotless ı comes before i) |

## Filing rules: words, letters, articles and Mc

**Word by word or letter by letter.** Word-by-word alphabetizing stops at the first space, so nothing precedes something. Letter-by-letter alphabetizing ignores spaces and punctuation and reads the letters straight through.

| Word by word (default) | Letter by letter |
| --- | --- |
| New Haven | Newark |
| New York | New Haven |
| Newark | Newport |
| Newport | New York |

Library catalogs and many book indexes file word by word, while dictionaries and APA reference lists use letter by letter. Hyphens follow the same split: *Smith-Jones* comes before *Smithe* word by word and after it letter by letter. Switch with **Letter by letter** under Options.

**Leading articles.** Reference lists and library filing skip a leading *A*, *An* or *The* in a title, and everyday lists do not. Turn on **Ignore leading articles** and *The Hobbit* files under H. The same six titles, both ways:

| Articles counted (default) | Articles ignored |
| --- | --- |
| A Tale of Two Cities | Animal Farm |
| An Inspector Calls | Dune |
| Animal Farm | The Great Gatsby |
| Dune | The Hobbit |
| The Great Gatsby | An Inspector Calls |
| The Hobbit | A Tale of Two Cities |

Edit **Articles to skip** for other languages, for example `le, la, les, der, die, das`, and end a word with an apostrophe (`l'`) to skip contractions such as *L'Étranger*. An article is skipped only when other words follow it.

**Mc and Mac.** Older directory conventions treated *Mc* and *Mac* as the same prefix so that McDonald and MacDonald sat together. Most current rules file names exactly as spelled, which is the default. With **File Mc as Mac** on, McCoy sorts between MacArthur and Macdonald instead of after Maclean.

**Numbers and symbols.** Digits sort before letters and are not spelled out. If your style guide files *1984* as *Nineteen Eighty-Four*, type the spelled-out form.

## Sorting by last name

Choose **Last name** under Sort by and enter people as *First Last* or *Last, First*. The last word is the surname, a comma marks a surname that is already first, and first names break ties between people who share a surname. Titles such as *Dr.* and suffixes such as *Jr.*, *III* or *PhD* never decide the order. The **How each name was read** table shows what the tool did:

| You typed | Sorted under |
| --- | --- |
| Maya Angelou | Angelou, Maya |
| Grace Hopper | Hopper, Grace |
| Dr. Martin Luther King Jr. | King, Martin Luther |
| Ada Lovelace | Lovelace, Ada |
| Alan Turing | Turing, Alan |
| Ludwig van Beethoven | van Beethoven, Ludwig |

*Curie, Marie* is already in surname-first form, so it sorts as typed, between Angelou and Hopper. Style guides disagree about prefixes such as *van*, *de* and *von*, so **Keep van, de, von with the last name** is on by default and files Beethoven under V. Turn it off to file him under B, or type *Beethoven, Ludwig van* to fix the order for that one name.

Surnames that begin the same way follow the nothing-precedes-something rule: *Smith, Anna*, *Smith, Zoe*, *Smith-Jones, Kim*, *Smithe, Al*, *Smithson, Bob*. A name typed family name first, common for East Asian names such as *Wang Fang*, reads as *Fang, Wang*. Add a comma, *Wang, Fang*, and the tool files it under Wang.

## Alphabetizing in other programs

- **Google Docs.** At the time of writing there is no built-in command for sorting ordinary paragraphs. Tables can be sorted from the table toolbar, and an add-on from the Workspace Marketplace can sort a selection. The fastest route is to paste the list here and paste the result back.
- **Microsoft Word.** Select the lines and use **Home → Sort**. In the Sort Text dialog choose *Paragraphs*, *Text* and *Ascending* or *Descending*. Options covers case sensitivity and sort language. Word has no article skipping or last-name mode.
- **Excel.** **Data → Sort A to Z** sorts the range in place, and `=SORT(A2:A100)` in Excel 2021 or Microsoft 365 returns a live sorted copy.
- **Google Sheets.** **Data → Sort range**, or `=SORT(A2:A100, 1, TRUE)` for ascending and `FALSE` for descending.
- **Command line.** The `sort` command follows the rules of your locale. Running it with `LC_ALL=C` typically switches to byte order, which is the same as this tool's Unicode order.

Program and style-guide names appear here only to explain how to do the same job elsewhere. This site is not affiliated with their owners.

## Who uses it, and how

- **Teachers** sort a class roster by last name, with **Ignore bullets and list numbers** if it arrived as a numbered list.
- **Students and researchers** order a reference list with **Letter by letter**, plus **Ignore leading articles** for entries that begin with a title. Works by the same author go in date order, so check those by hand.
- **Office staff** alphabetize attendee lists, vendor names and glossary terms.
- **Developers** sort keys, tags and imports, keeping comma in and comma out, or pick Unicode order to match a language's default sort.
- **Marketers** clean keyword lists: sort, remove duplicates, and adjust capitalization with the [case converter](/tools/case-converter).

## Tips and common mistakes

- **Everything landed in one item.** The list is probably on one line. Use the button in the notice, or change **Items are separated by**. Stray line breaks in pasted text can be cleaned with the [line break remover](/tools/remove-line-breaks).
- **Two lines look identical but sort apart.** They may differ by a non-breaking space or hidden character. Check suspects with the [invisible character tool](/tools/invisible-character).
- **Capitalization differs.** By default *apple* comes before *Apple*. Choose *Ignore capitals (keep my order)* under **Capital letters** to keep equal words as typed.
- **A comma list contains names.** Commas inside names are ambiguous, so use semicolons or new lines as the separator.
- **Random** is fine for deciding who presents first, but it is not a certified draw.

## Privacy and limitations

Sorting runs in your browser and your list is never uploaded. The text is kept in this tab's session storage so a refresh does not lose it, and your settings stay on this device. Text files up to 20 MB can be opened, and results longer than 200,000 characters show a preview while Copy and Download still include everything.

Some limits are worth knowing. Comma splitting is plain and does not understand quoted CSV fields, so sort spreadsheet data in the spreadsheet. Language rules come from the browser's built-in data, so unusual languages may differ slightly between browsers and devices. Last-name detection follows sensible rules rather than knowing each person, so check unusual names. The tool sorts whole items, not the words inside them, unless you choose the space separator. For a finished bibliography or index, confirm the result against your style guide.
