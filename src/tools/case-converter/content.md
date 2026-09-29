## What this case converter does

This case converter changes the capitalization of any text in one click. Paste a paragraph, a headline, a list of labels or a column of variable names, then choose Sentence case, lower case, UPPER CASE, Capitalized Case, Title Case, aLtErNaTiNg cAsE or iNVERSE cASE. A second row converts words into the developer formats camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and dot.case. The text is converted in place, so you can chain conversions, and Undo and Restore original bring back any earlier version.

Two things separate it from a basic uppercase-to-lowercase converter. Title Case follows a real style guide – AP, APA, Chicago or MLA – so short words such as "of" and "the" stay lowercase where the guide says they should, while the first and last words are always capitalized. And Sentence case is smarter than "lowercase everything, then capitalize after a period": it leaves acronyms and brand names such as NASA and iPhone alone, keeps the pronoun "I" capitalized, and knows that "Dr." or "e.g." does not end a sentence.

Everything runs in your browser. Nothing is uploaded, line breaks and blank lines are preserved, and live counters show characters, words, lines and paragraphs as you work.

## How to use the case converter

1. **Paste or type your text** into the box. The draft is kept in this browser tab, so an accidental refresh does not lose it.
2. **Pick a writing case.** Click Sentence case, lower case, UPPER CASE, Capitalized Case, Title Case, aLtErNaTiNg cAsE or iNVERSE cASE. The text changes immediately and the button you used stays highlighted.
3. **Set the Title Case style** if you need one: AP Stylebook (the default), APA, Chicago, MLA or "Capitalize every word". The **Keep acronyms and mixed-case words** switch decides whether NASA, HTML or iPhone survive Sentence case, Title Case and Capitalized Case.
4. **Or pick a code case.** camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and dot.case turn each line into one identifier, so twenty column names become twenty identifiers in one click.
5. **Copy or download.** Copy puts the result on your clipboard and Download .txt saves it as a file. Undo steps back one conversion at a time, Restore original returns the text you started with, and Clear empties the box (Undo brings it back if you clicked by mistake).

## Sentence case, title case or capitals?

**Sentence case** capitalizes the first word of each sentence and proper nouns, nothing else. It is the default for body text and, increasingly, for headings: the BBC and The Guardian write headlines in sentence case, the Google developer documentation style guide and the Microsoft Writing Style Guide require it for headings, and Material Design uses it across app interfaces.

**Title case** capitalizes the principal words. It remains standard for book, film and song titles, for headlines in US newspapers such as The New York Times, and for headings in APA papers and Chicago-style manuscripts.

**UPPER CASE** suits acronyms, short warning labels and defined terms in contracts; long passages in capitals read slowly because every word has the same rectangular outline. **lower case** is required for email addresses, most URLs and hashtags. **Capitalized Case** is what Word calls "Capitalize Each Word": handy for name lists, but not correct title case because it also capitalizes "of" and "the".

## Title case rules by style guide

Style guides agree on the big things – capitalize the first word, nouns, verbs, adjectives, adverbs and pronouns – and disagree on the small ones. In every style the converter also capitalizes the first word after a colon, dash, question mark or period, so subtitles start correctly.

| Word type | AP Stylebook | APA 7 | Chicago 18 | MLA 9 |
| --- | --- | --- | --- | --- |
| Articles (a, an, the) | lowercase | lowercase | lowercase | lowercase |
| Coordinating conjunctions | lowercase when under 4 letters (and, but, or, nor, for, yet, so) | lowercase when 3 letters or fewer | lowercase and, but, for, or, nor; capitalize Yet, So | lowercase and, but, for, nor, or, so, yet |
| Short prepositions (at, by, in, of, on, to, per, via) | lowercase | lowercase | lowercase | lowercase |
| Four-letter prepositions (with, from, into, upon) | Capitalize | Capitalize | lowercase | lowercase |
| Longer prepositions (about, through, between) | Capitalize | Capitalize | Capitalize (5+ letters) | lowercase |
| "as" and "if" | lowercase | lowercase | "as" lowercase, "If" capitalized | "as" lowercase, "If" capitalized |
| Short verbs and pronouns (Is, Be, Are, It) | Capitalize | Capitalize | Capitalize | Capitalize |
| First and last word | Capitalize | Capitalize | Capitalize | Capitalize |
| Hyphenated compounds | Self-Esteem | Self-Esteem | Self-Esteem | Self-Esteem |

AP and APA share the same short-word threshold, so they produce identical results here. Chicago's 18th edition (2024) changed its rule: prepositions of five or more letters are now capitalized, where the 17th edition lowercased every preposition. Input: `a beginner's guide to working with the API through node.js`

- AP or APA: **A Beginner's Guide to Working With the API Through Node.js**
- Chicago 18: **A Beginner's Guide to Working with the API Through Node.js**
- MLA: **A Beginner's Guide to Working with the API through Node.js**
- Capitalize every word: **A Beginner's Guide To Working With The API Through Node.js**

"API" survives because it is written in capitals, "Node.js" is treated as one word, and "a" is capitalized only because it comes first.

## Case conventions in code

Use the code cases to rename a list of fields when moving data between systems – for example turning `first_name` from a PostgreSQL column into `firstName` for a JavaScript API response.

| Context | Variables and functions | Classes and types | Constants | Notes |
| --- | --- | --- | --- | --- |
| JavaScript / TypeScript | camelCase | PascalCase | UPPER_SNAKE_CASE | React components are PascalCase |
| Python (PEP 8) | snake_case | PascalCase | UPPER_SNAKE_CASE | Modules and files are snake_case |
| Java / Kotlin | camelCase | PascalCase | UPPER_SNAKE_CASE | Packages are dot.case (com.example.app) |
| C# (.NET) | camelCase locals, PascalCase methods | PascalCase | PascalCase | Private fields often _camelCase |
| Go | camelCase unexported, PascalCase exported | same rule | MixedCaps, no underscores | Capitalization controls visibility |
| Rust and Ruby | snake_case | PascalCase | SCREAMING_SNAKE_CASE | Rust's compiler warns about violations |
| CSS / Sass | kebab-case classes, --kebab-case custom properties | – | – | BEM uses block__element--modifier |
| URLs and slugs | lowercase kebab-case | – | – | Google recommends hyphens over underscores |
| SQL (PostgreSQL) | snake_case tables and columns | – | – | Unquoted identifiers fold to lowercase |
| Shell and environment variables | UPPER_SNAKE_CASE | – | – | DATABASE_URL, NODE_ENV |
| Configuration and i18n keys | dot.case | – | – | spring.datasource.url, nav.home.title |

The code converter splits text into words at spaces, hyphens, underscores, dots and other punctuation, and at the "humps" of existing camelCase, so `getHTTPResponse code` becomes get, HTTP, Response and code. Acronyms are then normalized like any other word: `getHttpResponseCode`, `get_http_response_code`, `GET_HTTP_RESPONSE_CODE`. Apostrophes are dropped (`don't stop` becomes `dontStop`), digits stay attached to the preceding word (`html5 parser` becomes `html5Parser`), and each line is converted separately, so blank lines and list order are preserved.

## How the converter handles tricky text

**Sentence endings.** A new sentence begins after a period, exclamation mark or question mark – even when a closing quote or bracket follows – at the start of every line, and after a numbered list marker such as "1.".

**Abbreviations.** No new sentence starts after an ellipsis (… or ...), a single initial (J. K. Rowling), an abbreviation with internal periods (e.g., i.e., U.S., a.m., Ph.D.) or a common title such as Dr., Mr., Mrs., Ms., Prof., St., Inc., Ltd. or vs. Decimals such as 3.5 are never sentence ends. "etc." is treated as a sentence end because in most text it is one.

**Acronyms and shouting.** With the switch on, words in all capitals (NASA, HTML5) and words with an internal capital (iPhone, JavaScript, McDonald's) keep their spelling. A whole line in capitals is treated as shouting and converted anyway, which is what you want when a form has forced an address into capitals.

**Apostrophes, hyphens and particles.** "don't" is one word, so Title Case gives "Don't", not "Don'T". Hyphenated compounds are split, so "state-of-the-art" becomes "State-of-the-Art" and "mother-in-law" becomes "Mother-in-Law". "Up", "down", "off", "out" and "over" are capitalized in every style because in titles they are usually adverbs (Sold Out, Turn Down the Lights), and a short word followed by a comma or ending the title is capitalized too (What Are You Waiting For?).

**Proper nouns.** Sentence case cannot tell "Paris" from "party", so a mid-sentence name in ordinary capitalized form loses its capital, exactly as in Word's Sentence case. Skim the result for names before publishing.

## Changing case in Word, Google Docs and Excel

- **Microsoft Word:** select the text and press Shift+F3 to cycle between lowercase, UPPERCASE and Capitalize Each Word. Home → Change Case (the Aa button) lists all five options including tOGGLE cASE. On a Mac laptop you may need fn+Shift+F3.
- **Google Docs:** Format → Text → Capitalization offers lowercase, UPPERCASE and Title Case. There is no sentence case option and no default shortcut, and Title Case capitalizes every word.
- **Excel and Google Sheets:** use =UPPER(A1), =LOWER(A1) and =PROPER(A1). There is no sentence case function; the usual workaround is =UPPER(LEFT(A1,1))&LOWER(MID(A1,2,LEN(A1))).
- **VS Code:** the Command Palette has Transform to Uppercase, Lowercase, Title Case, Snake Case, Camel Case and Kebab Case, none with a default shortcut.

Those commands are fine for a single word. The reasons to paste text here instead are style-guide-aware title case, acronym handling, the code cases, and converting a whole document on any device – including a phone, where Shift+F3 does not exist.

## Tips and common mistakes

- **Capitalize Each Word is not title case.** "The Art Of The Deal" gives itself away with "Of" and "The". Use Title Case with a style selected.
- **Short verbs are capitalized.** "Is", "Be", "Are" and the pronoun "It" are often wrongly lowercased because they are short; every style guide capitalizes them.
- **Pick one style and stay with it.** Google displays title tags as written and does not rank sentence case above title case or vice versa, so consistency across a site matters more than the choice.
- **Use kebab-case for web file names.** macOS and Windows file systems are case-insensitive by default while Linux servers are not, so `Hero.png` and `hero.png` are one file locally and two files in production.
- **Check ß and dotted i.** Uppercasing follows Unicode rules: "straße" becomes "STRASSE", and the result for "i" depends on your browser's language setting, which matters for Turkish text.
- **Count as you go.** For exact limits such as meta description length, use the [character counter](/tools/character-counter) or [word counter](/tools/word-counter).

## Privacy and limitations

All conversions run as JavaScript in your browser; the text is never sent to a server, so the tool is safe for unpublished drafts and client work. Your draft lives in the tab's session storage and disappears when the tab closes; only the title case style and the acronym switch are remembered in local storage.

Known limitations: sentence case cannot recognize ordinary proper nouns; title case treats "up", "off", "out", "over" and "down" as adverbs even in the rare prepositional use ("Over the Hill"); "etc." is decided by a fixed rule rather than by meaning; and the code cases keep accented letters, so replace them first if a target system requires plain ASCII. Texts of several megabytes convert quickly, but the editor may respond slowly while you type. If your text has hard line breaks in the wrong places, run it through the [line break remover](/tools/remove-line-breaks) before converting.
