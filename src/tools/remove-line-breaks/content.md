## What this line break remover does

Paste text into the box and this tool removes line breaks instantly, turning ragged, chopped-up lines back into normal sentences. It is built for the moment when you copy a paragraph out of a PDF, a plain-text email or a terminal window and every line arrives as a separate line, ending mid-sentence.

There are four modes. **Remove all line breaks** joins everything into one block with single spaces. **Keep paragraphs** removes only the breaks inside paragraphs and keeps the empty line between them – the mode most people actually need for PDF and email text. **Replace with…** swaps each line break for a separator you choose, such as a comma, semicolon, pipe, tab or `<br>`. **One line, no spaces** glues lines together with nothing in between, which suits wrapped URLs, Base64 strings and Chinese or Japanese text where words are not separated by spaces.

## How to remove line breaks with this tool

1. **Choose a mode** from the four cards at the top. Nothing needs to be submitted; the result updates live.
2. **Add your text.** Paste it into the left box, press **Paste**, load a `.txt`, `.md`, `.csv` or `.log` file with **Open .txt**, or press **Example** to see a wrapped email with a bulleted list.
3. **Adjust the options** below the stats if needed: collapse multiple spaces, trim each line, remove empty lines, keep list items on their own line, rejoin hyphenated words, and choose LF or CRLF for any breaks that remain.
4. **Check the numbers.** The stat tiles show how many line breaks were removed, lines and characters before and after, and which line-ending style your input used. An emoji or accented letter counts as one character; a Windows CRLF break counts as two.
5. **Copy or download** the result with the **Copy** or **Download** button above the result. **Use result as input** moves the output back into the left box so you can run a second pass with different settings.

## How it works

The tool first splits your text at every kind of line break it can find: Windows CRLF, Unix LF, the lone CR used by classic Mac OS, the vertical-tab character Word uses for Shift+Enter, form feeds, and the Unicode line and paragraph separators.

Each line is then cleaned according to your options: leading and trailing spaces are trimmed and runs of spaces or tabs are collapsed to one. Blank lines at the very start and end are always dropped, so a trailing newline never leaves a stray separator. Finally the lines are joined again: with a space, with your separator, with nothing, or – in paragraph mode – with a space inside each paragraph and one empty line between paragraphs. A paragraph break is any line that is empty or contains only whitespace, so two, three or ten blank lines in a row all become exactly one.

### Worked example

Input (5 lines, 4 line breaks, 74 characters):

```
The meeting moved to
Thursday at 3 pm.

Please bring the
signed contracts.
```

- **Remove all line breaks:** `The meeting moved to Thursday at 3 pm. Please bring the signed contracts.` – 4 breaks removed, 73 characters.
- **Keep paragraphs:** two lines separated by one empty line – 2 breaks removed, 2 kept, 74 characters.
- **Replace with… `, `** (empty lines removed): `The meeting moved to, Thursday at 3 pm., Please bring the, signed contracts.` – 76 characters; useful for lists, clearly not for prose.

A line feed is one character (a Windows CRLF is two), so a break that becomes a space leaves the length unchanged. The count drops only when blank lines, doubled spaces or CR characters disappear – here, the one empty line.

## Why unwanted line breaks appear

- **PDFs.** A PDF places each line of text at fixed coordinates. It has no idea that line 3 continues line 2, so viewers insert a hard break at the end of every visual line when you copy.
- **Plain-text email.** Many mail programs wrap plain-text messages at around 72–78 characters and insert real line breaks, and replies quote those lines again with `>` markers.
- **Terminal and log output.** Man pages, command help and fixed-width reports are laid out for an 80-column screen with real line breaks at the wrap point, and some older consoles also add a break at every visual wrap when you copy.
- **OCR.** Scanned documents are recognized line by line, and hyphenated words at line ends come through split in two.
- **Spreadsheet cells.** A column copied from Excel or Google Sheets arrives as one value per line – exactly what you want in a list, and exactly what you do not want in a sentence.

## Soft returns, hard returns, CRLF and LF

A **hard return** is what you get when you press Enter: it ends the paragraph. A **soft return** (Shift+Enter in Word or Google Docs) starts a new line but stays inside the same paragraph. Automatic word wrap is neither – it is just the display, and it vanishes when you change the page width. In plain text there are no paragraphs at all, only line-break characters, and the character depends on the system that saved the file.

| Name | Characters | Code | Where you meet it |
| --- | --- | --- | --- |
| LF (line feed) | `\n` | 10 (0x0A) | macOS, Linux, Android, iOS, most source code and Git repositories |
| CRLF | `\r\n` | 13 + 10 | Windows files, Notepad, CSV exports, many email protocols |
| CR (carriage return) | `\r` | 13 (0x0D) | Classic Mac OS files, some old exports |
| Vertical tab | `\v` | 11 | Word's manual line break (Shift+Enter) |
| Paragraph mark | ¶ | shown as `^p` in Word | Word's hard return, saved as CRLF in .txt |

The tool treats all of these as line breaks. The "Input line endings" tile shows which one your text uses – handy when a script or Windows program misbehaves with a file. One catch: browsers convert every break to LF when you paste with Ctrl+V or type into a text box, so the tile reports the original endings only for files opened with **Open .txt** and text brought in with the **Paste** button.

## Removing line breaks in Word, Google Docs, Excel and VS Code

You can do the same job inside most editors with find and replace. The syntax differs in each one:

| Program | Find | Replace with | Notes |
| --- | --- | --- | --- |
| Microsoft Word | `^p` (paragraph mark) or `^l` (manual line break) | a space | Ctrl+H. Type a lowercase p or L, not the digit 1. |
| Google Docs | `\n` with "Match using regular expressions" ticked | a space | Edit → Find and replace. How Docs matches paragraph breaks has changed over time; if nothing is found, paste the text here instead. |
| Excel | press Ctrl+J in "Find what" | a space | Or `=SUBSTITUTE(SUBSTITUTE(A2,CHAR(13),""),CHAR(10)," ")` |
| Google Sheets | `\n` with "Search using regular expressions" | a space | Or `=REGEXREPLACE(A2,"\n"," ")` |
| VS Code | `\n` with the regex button (.*) on | a space | "Join Lines" in the Command Palette also works (Ctrl+J on macOS). |
| Notepad++ | `\r\n` in Extended mode | a space | Or Edit → Line Operations → Join Lines (Ctrl+J). |

Excel's CLEAN function also strips line breaks, but it deletes them without adding a space, so "John" and "Smith" on two lines become "JohnSmith".

## Fixing hard-wrapped text without losing paragraphs

The editors above remove every break, which flattens a multi-paragraph document into one wall of text. The classic Word workaround takes three passes: replace `^p^p` with a placeholder such as `###`, replace the remaining `^p` with a space, then replace `###` with `^p`. It goes wrong when paragraphs are separated by a line that contains spaces (the `^p^p` pair is never found) or by three returns (a stray space ends up at the start of the next paragraph).

**Keep paragraphs** mode does the same job in one step and tolerates messy input: blank lines that contain spaces, several blank lines in a row, and breaks of mixed types. Two extra options help with typical PDF text:

- **Rejoin hyphenated words** turns `exam-` at the end of one line and `ple` at the start of the next into `example`. It only fires when the next line starts with a lowercase letter.
- **Keep list items on their own line** keeps the break before lines that start with `-`, `*`, `•`, `1.`, `2)`, `a)` or `(b)`, while still joining wrapped continuation lines of a long bullet.

If your text has no blank lines at all, there is no reliable way to tell where one paragraph ends and the next begins, and the tool tells you so instead of guessing.

## Who uses it

- **Students and researchers** pasting quotations from journal PDFs into essays or reference managers.
- **Translators and editors** preparing source text for CAT tools, where every hard break becomes a separate segment and ruins sentence matching.
- **Developers and data analysts** turning a column of IDs into a comma-separated list for a SQL `IN (…)` clause, or joining a wrapped log line before searching it.
- **Marketers and social media managers** removing breaks from copy that must fit a single-line field such as a meta description or an ad headline – then checking the length with the [character counter](/tools/character-counter).

## Tips and common mistakes

- **Check hyphen joins.** With "Rejoin hyphenated words" on, a genuine compound split at a line end, such as `self-` / `control`, loses its hyphen. Leave the option off for technical text full of compounds.
- **Numbered sentences can look like lists.** A wrapped line that happens to begin with "12. " will be treated as a list item when list detection is on.
- **Use CRLF only when needed,** for example for a Windows batch file or an older Notepad; LF is right for almost everything else.
- **Remove empty lines when using a separator,** otherwise blank lines produce `, ,` in the result.
- **Tidy other formatting next.** After joining lines you may want to fix capitalization with the [case converter](/tools/case-converter) or confirm the length with the [word counter](/tools/word-counter).

## Privacy and limitations

Everything happens in your browser with JavaScript. Pasted text and opened files are never uploaded, and the draft is stored only in this tab's session storage so a refresh does not lose it; **Clear** or closing the tab removes it. Files up to 20 MB are accepted, including UTF-16 files saved by Windows Notepad as "Unicode". Inputs of several million characters work, though they take a moment to refresh after each change; for results over 200,000 characters the box shows a preview, while **Copy** and **Download** always include the full text. The tool works on plain text only: bold, italics and links from Word or a web page are lost when pasted, tables arrive as tab-separated cells, and scanned PDFs need to be run through OCR before their text can be copied at all.
