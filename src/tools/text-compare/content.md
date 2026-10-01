## What this text compare tool does

Paste two versions of a text and the tool shows exactly what changed between them: which lines, words or characters were removed, which were added, and where. It is the quickest way to check what an editor changed in your draft, spot the one edited clause in a contract, see what a colleague changed in a config file, or confirm that two copies of a list really are the same.

Removed text is shown in red and added text in green. A summary line counts the changes and gives a similarity percentage, and you can jump from one change to the next with the arrow buttons or the **N** and **P** keys. When you are done, copy or download the differences as a standard patch file.

Everything runs in your browser. The texts are compared by a background worker on your own device, so nothing is uploaded and a very large comparison never freezes the page – you can cancel it at any time.

## How to use it

1. Paste the **original text** on the left and the **changed text** on the right. You can also click **Open file** under each box, or drag a text file onto it (plain-text formats such as .txt, .md, .csv, .json, .html or source code, up to 10 MB).
2. Choose how closely to compare: **Lines**, **Words** or **Characters**.
3. Pick a layout: **Side by side** puts the two versions in parallel columns; **Inline** shows one text with removals and additions marked in place. Narrow screens start in Inline, because two columns get cramped on a phone.
4. Tick **Ignore case** or **Ignore whitespace** if those differences don't matter to you.
5. Read the summary, then step through the changes with the arrows or the **N** / **P** keys (**J** / **K** work too).
6. Click **Copy patch** or **Download patch** to save the result.

The comparison updates as you type. Long stretches of unchanged text are folded away – three lines of context are kept around each change – so you only scroll through what matters; click a fold to open it, or tick **Show all unchanged text**.

## Lines, words or characters: which level to use

The level decides what counts as one unit of change, and it changes both the picture and the numbers. Take these meeting notes:

*Original:*

```text
Meeting notes – 3 March
Attendees: Ana, Ben, Chloe
Budget approved: $4,500
Next review in two weeks.
```

*Changed:*

```text
Meeting notes – 3 March
Attendees: Ana, Ben, Chloe, Dev
Budget approved: $5,000
Next review in two weeks.
Action: Dev to book the venue.
```

**By lines**, the tool finds **2 changes**: lines 2 and 3 were edited (one block), and a new line 5 was added. That is **2 lines removed and 3 lines added**, with 2 lines unchanged, for **44% similarity**. Edited lines are paired up and the changed words inside them are highlighted, so you still see that only ", Dev" was added to the attendee list.

**By words**, the same edit is **3 changes**: ", Dev" added, "4,500" replaced by "5,000", and the new action line added. That is **1 word removed and 8 added**, and similarity rises to **79%**, because the unchanged words on the edited lines now count as shared. Numbers keep their separators, so "4,500" is treated as one word, the way you would read it.

**By characters**, the tool finds **5 changes** and **83% similarity**. It reports the smallest possible edit, so "$4,500" becoming "$5,000" shows as removing "4," and inserting "," and "0" around the digits the two numbers share. That is exactly right, but it is harder to read than the word view.

As a rule of thumb, compare **code, data and lists by lines**, **prose by words**, and switch to **characters** when you need to find a single typo, a stray space or a changed digit.

## How the comparison works

The tool uses the [jsdiff](https://github.com/kpdecker/jsdiff) library's implementation of Eugene Myers' 1986 difference algorithm, the same family of algorithm behind `git diff`. It finds the smallest set of removals and additions that turns the original into the changed text – in other words, it keeps as much of the text in common as possible.

Before comparing, each text is split into units:

- **Lines** are split on any line break – Windows (CRLF), Unix (LF) or old Mac (CR). A final line break doesn't add an empty line.
- **Words** follow your browser's Unicode word rules, so punctuation and spaces are separate units and languages written without spaces, such as Chinese, Japanese and Thai, are split into words too.
- **Characters** are user-perceived characters: an accented "é", a flag such as 🇵🇰 or an emoji with a skin tone counts as one character even though each is stored as several code points.

In line mode, a block of removed lines followed by added lines is shown as edited lines paired top to bottom, with a word-level comparison inside each pair. The changed words are highlighted for line pairs of up to 4,000 characters; longer pairs are marked as whole lines.

## Ignoring case and whitespace

These two options change what counts as a difference, never the texts themselves.

- **Ignore case** treats upper- and lower-case letters as equal, so "Hello World" and "hello world" match.
- **Ignore whitespace** treats any run of spaces or tabs as one space, ignores spaces at the start and end of each line, and hides changes that only add or remove whitespace – including extra blank lines between paragraphs.

Both versions are always displayed exactly as you pasted them. In line mode, lines that match only because of these options are labelled **ignored difference**, so you can see that the originals are not literally identical. If everything matches once the options are applied, the summary says so instead of reporting that the texts are identical.

## The similarity percentage

Similarity is **2 × unchanged ÷ (2 × unchanged + removed + added)**, counted in the current unit: lines, words or characters. Two identical texts score 100%; two texts with nothing in common score 0%. This is the same formula as the `ratio()` method of Python's [difflib](https://docs.python.org/3/library/difflib.html#difflib.SequenceMatcher.ratio). In word mode, spaces are left out of the calculation so that re-spacing a text doesn't distort the score.

Because the unit changes, so does the score – 44% by lines and 79% by words for the example above. Use it to compare versions of the same document at the same level, not as a measure of meaning: two paragraphs that say the same thing in different words will score low, and the percentage is not a plagiarism check.

## Downloading a patch

**Download patch** saves the differences as a *unified diff*, the standard text format used by Git and the Unix `patch` program. For the example above it looks like this:

```diff
--- a/notes.txt
+++ b/notes.txt
@@ -1,4 +1,5 @@
 Meeting notes – 3 March
-Attendees: Ana, Ben, Chloe
-Budget approved: $4,500
+Attendees: Ana, Ben, Chloe, Dev
+Budget approved: $5,000
 Next review in two weeks.
+Action: Dev to book the venue.
```

Lines starting with `-` were removed, lines with `+` were added, and lines with a space are unchanged context. The `@@ -1,4 +1,5 @@` header says the change covers four lines starting at line 1 of the original and five lines starting at line 1 of the new version. To apply it, save the patch next to the original file and run `git apply changes.patch` or `patch -p1 < changes.patch`.

A patch has to reproduce the new text exactly, so it always contains every difference – including case, whitespace and line-ending changes you chose to ignore on screen. If you opened files, their names appear in the header; otherwise the files are called original.txt and changed.txt.

## Differences you can't see

Sometimes the tool reports a change between two lines that look identical. The usual causes are:

- a trailing space or tab at the end of a line;
- tabs on one side and spaces on the other;
- a non-breaking space, or a zero-width character copied from a web page or chat app;
- curly quotes (" ") on one side and straight quotes (") on the other;
- different line endings, which the tool reports in a note above the result.

Switch to **Characters** to find the exact character, turn on **Ignore whitespace** if spacing doesn't matter, or paste the text into the [Invisible Character tool](/tools/invisible-character) to reveal hidden characters.

## Large texts

Comparing is done by a background worker, so the page stays responsive however long it takes. For very large texts – over 200,000 characters in total – the tool waits for you to press **Compare** rather than re-comparing on every keystroke, and if a comparison takes longer than a moment you get a **Cancel** button. Word and character comparisons do far more work than line comparisons, so they have lower limits: up to 1.5 million words and symbols, or 300,000 characters, per text. If two huge texts are so different that the comparison would take more than 20 seconds, it stops with a message suggesting line mode or a smaller section.

## Limitations

- **Moved text is shown as removed and added.** If you moved a paragraph, it appears as deleted in one place and inserted in another; the tool doesn't detect moves.
- **Only plain text.** Word documents, PDFs and spreadsheets store text inside a binary format. Copy the text out of them and paste it in, or export to .txt or .csv first; the tool refuses files that look binary.
- **Line pairing is a best guess.** When a block of lines is replaced by a block of different length, lines are paired top to bottom, which isn't always how you'd match them by eye.
- **Unicode look-alikes are different characters.** An "é" typed as one character and an "é" built from "e" plus an accent look the same and both count as one character, but they are not equal to each other, so they show as a change.
