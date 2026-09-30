## What this duplicate line remover does

Paste a list into the box above and this tool will remove duplicate lines the moment you stop typing. It keeps one copy of every line, leaves the survivors in their original order, and shows you a table of exactly what was thrown away: which lines, how many times each appeared, and on which input lines. Nothing is sorted, nothing is guessed, and nothing leaves your browser.

Most duplicate removers give you one button and a result you have to trust. This one lets you decide what "duplicate" means. Should *Apple* and *apple* match? Should a trailing space matter? Each answer is a switch under the boxes, and the removed-lines report lets you check the outcome before you copy it. Two extra modes turn the same engine into a duplicate finder: **Duplicates only** lists the lines that repeat, and **Unique only** keeps the lines that never do.

## How to use it

1. **Add your list.** Paste it (Ctrl/Cmd + V or the Paste button), click **Open .txt**, or drop a text file onto the input box. **Example** loads a small sample.
2. **Pick a mode.** *Remove duplicates* keeps one copy of each line. *Duplicates only* lists each repeated line once. *Unique only* drops every line that appears more than once.
3. **Read the result.** The counts under the boxes show **Lines in**, **Lines out**, **Removed** (split into duplicates and empty lines) and **Repeated lines**.
4. **Adjust the comparison** in Options. **Case-sensitive** and **Trim spaces before comparing** are the two most useful. **Keep which copy** switches between the first and last occurrence.
5. **Check the report.** The **Removed lines** table lists every repeated line with **Times found**, **Copies removed** and **Found on lines**. Use **Copy report** to paste it into a spreadsheet or **Download CSV** to keep it.
6. **Take the result.** **Copy** or **Download** the cleaned list, or use **Use result as input** to run another pass with different settings.

## How duplicates are detected

Before comparing, every line is turned into a *comparison key*, and two lines are duplicates when their keys are equal. The key is built in a fixed order:

1. Invisible characters are removed (zero-width spaces, soft hyphens, byte order marks) if **Ignore invisible characters** is on.
2. Whitespace at both ends (spaces, tabs and non-breaking spaces) is trimmed if **Trim spaces before comparing** is on.
3. Runs of whitespace inside the line become a single space if **Ignore extra spaces inside lines** is on.
4. Unicode is normalized, so an accented letter stored as one character and the same letter stored as a base letter plus a combining accent match. With **Ignore accents** on, accents are stripped too, so *café* matches *cafe*.
5. The text is lowercased if **Case-sensitive** is off.

The key is only for comparing: the line you get back is the original text, trimmed at the ends unless you turn **Trim spaces in the result too** off.

With **First occurrence**, the earliest copy stays where it was. With **Last occurrence**, the final copy stays at its own position, so `a b a c` becomes `b a c` instead of `a b c`. Lines are found across the whole list unless **Only compare neighboring lines** is on.

### Worked example

Here is a ten-line list, numbered 1 to 10: apple, Banana, apple (with a trailing space), cherry, an empty line, banana, Apple, cherry, cherry, date.

The same list under different settings:

| Settings | Result | Lines out |
| --- | --- | --- |
| Defaults | apple, Banana, cherry, banana, Apple, date | 6 |
| Case-sensitive off | apple, Banana, cherry, date | 4 |
| Case-sensitive off, keep last | banana, Apple, cherry, date | 4 |
| Duplicates only, case-sensitive off | apple, Banana, cherry | 3 |
| Unique only, case-sensitive off | date | 1 |
| Only compare neighboring lines | apple, Banana, apple, cherry, banana, Apple, cherry, date | 8 |

With defaults, the trailing space on line 3 is ignored, so `apple` is removed as a duplicate of line 1, but *Apple* and *banana* survive because capitalization differs. The empty line is dropped too: 10 lines in, 6 out, 4 removed (3 duplicates and 1 empty line). With Case-sensitive off, the report looks like this:

| Line | Times found | Copies removed | Found on lines |
| --- | --- | --- | --- |
| apple | 3 | 2 | 1, 3, 7 |
| cherry | 3 | 2 | 4, 8, 9 |
| Banana | 2 | 1 | 2, 6 |

That is 10 lines in, 4 out and 6 removed: 5 duplicate copies plus the empty line.

## The three modes

| Mode | You get | Command-line equivalent |
| --- | --- | --- |
| Remove duplicates | One copy of every line | `awk '!seen[$0]++'` (keeps order), `sort -u` (sorts too) |
| Duplicates only | Each repeated line, once | `sort \| uniq -d` |
| Unique only | Lines that never repeat | `sort \| uniq -u` |

Turn on **Only compare neighboring lines** and each mode works on runs of adjacent lines instead, which is exactly how `uniq` behaves.

## Removing duplicate lines in other tools

- **Notepad++.** Edit > Line Operations. Recent versions offer *Remove Duplicate Lines* and *Remove Consecutive Duplicate Lines*; older ones have only the consecutive command, so sort first.
- **VS Code.** Select the lines, open the Command Palette (Ctrl/Cmd + Shift + P) and run *Delete Duplicate Lines*. Lines are compared as they are, so trailing spaces keep them apart.
- **Excel.** Data tab > Remove Duplicates. It ignores letter case and keeps the first match, but it does not trim spaces, so "Pen" and "Pen " both survive. In Microsoft 365 and Excel 2021 or later, `=UNIQUE(TRIM(A2:A100))` cleans and dedupes in one step, and `=UNIQUE(A2:A100,,TRUE)` returns only values that appear exactly once.
- **Google Sheets.** Data > Data cleanup > Remove duplicates, or `=UNIQUE(A2:A100)`. Test how UNIQUE treats capitals on a small sample first, or use `=UNIQUE(LOWER(TRIM(A2:A100)))` when you need certainty (the output becomes lowercase).
- **Linux and macOS terminal.** `sort -u list.txt` sorts and dedupes, `awk '!seen[$0]++' list.txt` keeps the original order, and `sort list.txt | uniq -c | sort -rn` counts repeats. Plain `uniq` only collapses adjacent lines. Prefix `LC_ALL=C` to compare bytes regardless of locale.

## Practical uses

**Email marketers.** Merging exports from a webinar, a store and a newsletter creates repeats with different capitalization and stray spaces. Turn Case-sensitive off and leave trimming on. Domain names are case-insensitive, and although the part before the @ is technically case-sensitive, mainstream providers deliver *Bob@* and *bob@* to the same inbox.

**SEO specialists.** Paste keyword exports from several tools, remove duplicates for a master list, then try **Duplicates only**. If each source lists a keyword once, **Times found** tells you how many sources agree on it. To sort the cleaned list afterward, use the [alphabetical order tool](/tools/alphabetical-order).

**Developers and sysadmins.** Clean a hosts file, an allow-list or a dependency list. **Last occurrence** suits configuration where the later line wins, and **Only compare neighboring lines** collapses a log where one message repeats back to back.

**Analysts and researchers.** Clean a list of respondent IDs, then use **Unique only** to find IDs that appear exactly once, which often reveals records missing a match in another file. If your data is [joined on one line](/tools/remove-line-breaks), split it into one item per line first.

## Why duplicates survive

When two lines look the same but are not removed, something invisible differs. This table maps each cause to its fix.

| What differs | Example | Setting that handles it |
| --- | --- | --- |
| Space or tab at the ends | `pen` and `pen ` | Trim spaces before comparing |
| Capitalization | Apple and apple | Case-sensitive off ([convert case](/tools/case-converter) first if you prefer) |
| Extra or non-breaking spaces inside | `New  York` and `New York` | Ignore extra spaces inside lines |
| Zero-width space, soft hyphen, BOM | completely invisible | Ignore invisible characters |
| Accent stored two ways | é as one character or e + accent | Always normalized |
| Accent present or missing | café and cafe | Ignore accents |
| Windows and Unix line endings | invisible | Always handled |

The [invisible character page](/tools/invisible-character) explains what those hidden characters are and why they end up in copied text.

## Tips and common mistakes

- **Decide what "duplicate" means first.** *Apple Inc* and *apple inc* are one company in a customer list and two tokens in a code list.
- **Read the report after a case-insensitive pass.** The first spelling is kept; to control which capitalization survives, choose Last occurrence or fix the case with a converter.
- **Whole lines only.** Two CSV rows that differ in a single column are different lines. To dedupe by one column, extract that column first.
- **Numbers written differently are different.** `1.0`, `1` and `01` do not match.
- **Keep empty lines when structure matters.** Set **Empty lines** to *Leave them where they are* to preserve paragraph gaps.

## Privacy and limitations

Everything runs in your browser. Your list is not uploaded or sent to any server. It is saved only in your tab's session storage so an accidental refresh does not lose it, and your option choices are saved in your browser's local storage.

The tool compares whole lines exactly, after the normalizations you choose. It does not find near-duplicates such as typos (*gogle* and *google*), and it does not remove repeated words inside a line. Text files up to 20 MB can be opened; split larger ones. The comparison itself is fast, hundreds of thousands of lines in about a second on a typical computer, but browsers are slow at displaying huge text boxes, so a paste of 200,000 lines or more can make the page sluggish for a few seconds while it refreshes. Vertical tabs, form feeds and the Unicode line and paragraph separators count as line breaks too, and the result is joined with ordinary line endings. Very large results show a preview on the page while Copy and Download still return everything, and the report table shows the 200 most frequent repeated lines while the CSV contains all of them, with up to 25 line numbers each.
