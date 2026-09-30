## What this Discord colored text generator does

Discord has no color picker for chat messages, but its code blocks can draw ANSI escape sequences, the same codes a terminal uses. This Discord colored text generator lets you type a message, select any words, choose a text color, a background color, bold or underline, and then copies the result as an `ansi` code block with the invisible escape characters already in place. Paste it into a channel and the colors show for readers whose client supports them.

The page handles the fiddly parts. You never type the escape character, because a chat box gives you no way to enter it. Every colored section is closed with a reset, sections never run across a line break, and the final message is counted against Discord's length limit. A dark and light preview helps you spot hard-to-read combinations before anyone else sees them.

This is an independent tool, not affiliated with, endorsed by or sponsored by Discord Inc. The platform behavior described below was last checked against published guides on September 30, 2026.

## How to use the generator

1. **Write your text** in box 1, or press an example button (server rules, announcement, status board). If you paste a message that already contains escape characters, the tool turns those codes back into editable styles.
2. **Select the words** to style by dragging, by holding Shift with the arrow keys, or with **Select all**. The line under the toolbar shows how many characters are selected.
3. **Click a text color, a background color, Bold or Underline.** The small number under each swatch is its ANSI code. **X** removes a color, **Clear style** removes everything from the selection, and **Reset all styles** keeps the words but drops all formatting. Bold and Underline switch off when the whole selection already has them.
4. **Check the preview.** Flip between the dark and light preview and pick a palette. If a colored section would be hard to read, a warning names an example.
5. **Choose an output format and copy.** *Paste into Discord* is the real message. *Readable codes* swaps the invisible escape character for a visible ␛ symbol so you can read the codes. *Code string* gives a quoted string for a bot. Press **Copy message** or **Download .txt**. If the browser blocks the clipboard, click the output box and press Ctrl+C (Cmd+C on a Mac).
6. **Paste into Discord and send.** Leave the first line, ` ```ansi `, exactly as it is.

Styles follow your edits. Text typed inside or right after a colored word takes its style, as in a word processor; use Clear style to undo that.

## How ANSI color codes work in Discord

An escape sequence is a short run of characters that a renderer reads as an instruction instead of text. It starts with the escape character (ESC, Unicode U+001B, decimal 27), then an opening bracket, then numbers separated by semicolons, then the letter `m`, which means "set graphic rendition": change how the following text looks. Code `0` resets everything, so `ESC[0m` ends a colored section. Code `1` is bold and `4` is underline.

The message is an ordinary code block labeled `ansi`. This is what the tool writes for *Server status: ONLINE* with ONLINE set to bold green (␛ stands for the invisible escape character):

````text
```ansi
Server status: ␛[1;32mONLINE␛[0m
```
````

Here `1` is bold, `32` is green text, `m` closes the opening sequence, and `ESC[0m` resets afterward. The tool always writes bold first, then underline, then the text color, then the background, so bold underlined red text on a dark background reads `ESC[1;4;31;40m`.

### Worked example: counting the characters

The message above has 44 characters: 8 for the opening fence and its line break, 21 for the text, 7 for `ESC[1;32m`, 4 for `ESC[0m`, and 4 for the final line break and closing fence. A single-code color such as `ESC[31m` costs 5 characters, so each colored section costs at least 9 once its reset is counted. The built-in server rules example is 150 characters of text and 271 as a message, with five colored sections.

### Why sections stop at line breaks

Rather than rely on a client carrying a style across a line break, the tool gives each line its own opening code and its own reset, at a cost of a few characters. Spaces at the edge of a section that only has a text color or bold stay outside it, since they would show nothing.

## Color code reference

We found no official specification for this feature, so these names come from community guides and the widely documented palette (checked September 30, 2026). Several guides report that the background codes changed in August 2026 and now reuse the eight text hues, with shades that depend on the reader's theme. That could not be confirmed against Discord's own documentation, so the palette menu offers both views.

| Text code | Text color | Background code | Classic background | Reported newer background |
| --- | --- | --- | --- | --- |
| 30 | Gray | 40 | Firefly dark blue | Same hue as 30 |
| 31 | Red | 41 | Orange | Same hue as 31 |
| 32 | Green | 42 | Marble blue | Same hue as 32 |
| 33 | Yellow | 43 | Greyish turquoise | Same hue as 33 |
| 34 | Blue | 44 | Gray | Same hue as 34 |
| 35 | Pink | 45 | Indigo | Same hue as 35 |
| 36 | Cyan | 46 | Light gray | Same hue as 36 |
| 37 | White | 47 | White (cream) | Same hue as 37 |

The numbers never change, so the same message is valid either way. Only how it looks can differ. The preview colors are stand-ins: use them to judge contrast and layout, not exact shades.

### Combinations worth copying

Codes can be joined with semicolons inside one sequence, and every colored section should end with `ESC[0m`. These patterns use the classic palette names from the table above.

| Sequence | What it asks for | Good for |
| --- | --- | --- |
| `ESC[1;31m` | Bold red text | Warnings and penalties |
| `ESC[1;4;33m` | Bold, underlined yellow text | Post titles |
| `ESC[36m` | Cyan text | Numbering and labels |
| `ESC[37;41m` | White text on an orange background | Status badges such as OFFLINE |
| `ESC[4;34m` | Underlined blue text | Link-like words (they are not clickable) |
| `ESC[0m` | Reset to the default look | Ending every section |

Colors inside a code block are decoration only: nothing in an `ansi` block is clickable, and mentions or emoji shortcodes typed inside a code block are not converted.

## Where colored text shows up

- **Desktop app and web browser:** guides report that ansi blocks render in color, and that this has been so since 2022.
- **iOS and Android:** reports conflict. Older guides say colors do not show; some 2026 guides say recent app versions render them. We have not tested a phone.

Both points were checked on September 30, 2026. Because some readers may see plain monospace text, write messages that still make sense without color: use words like ONLINE and OFFLINE instead of green and red alone. That also helps readers who cannot tell those hues apart.

## Why the older diff, css and yaml tricks are unreliable

Before ansi blocks, people got color by choosing a code-block language whose syntax highlighter happened to paint something. A `diff` block typically colors lines that start with a plus or minus sign, `yaml` colors the word before a colon, and `css` colors some bracketed or quoted words. Those results are side effects of how the client highlights code.

There are three problems. You get two or three colors at most, never a background. The shades come from the client's highlighting theme, so they change when that theme does. And you must bend your wording to trigger the highlighter, for example by starting every line with a minus sign. An ansi block states the color directly, which is why this tool uses it.

## Practical uses

**Server admins and moderators.** Mark a rules post title in bold yellow, number the rules in cyan and put the penalty line in red.

**Community managers.** An event post with yellow labels (When, Where, Prize) and a green call to action is easier to skim than a wall of plain text. Add the event time as a [Discord timestamp](/tools/discord-timestamp-generator) next to the block, so every reader sees it in their own time zone.

**Guild and clan officers.** A monospace block keeps columns aligned, so a roster or loot table can color the status column: green for confirmed, yellow for maybe, red for out.

**Bot developers.** The *Code string* view gives a quoted string that works as a literal in JavaScript, JSON and Python, with `\u001b` for the escape character. Send it as message content for the same colors.

## Tips and common mistakes

- **Copy, do not retype.** If you rebuild a message by hand and miss the invisible escape character, Discord shows `[31m` as plain text.
- **Keep the first line exact.** The fence must read ` ```ansi ` followed by a line break, or the block stays uncolored.
- **Mind contrast.** White text can vanish on a light theme and gray text on a dark one. Add a background color when a pale or dark text color matters, and compare both preview backgrounds. The [color contrast checker](/tools/color-contrast-checker) gives exact ratios for any pair of hex colors.
- **Watch the length.** Discord's limit was 2,000 characters, or 4,000 with Nitro, when we checked. The length tile shows the exact total, and the [character counter](/tools/character-counter) is handy for the plain text.
- **Avoid triple backticks in your text.** Three in a row would close the block early, so the tool inserts an invisible zero-width space. The [invisible character tool](/tools/invisible-character) explains such hidden characters.
- **Test before you announce.** Post in a private channel or direct message first, on desktop and on a phone.

## Privacy and limitations

Your text, colors and preview are handled by JavaScript in the open tab. The page sends no request containing your message, and there is no account. Your draft is held in session storage for the current tab, which lets a page reload bring it back. Your preview theme, palette and output format go into local storage on this device. Closing the tab ends the draft, and clearing site data removes the rest. The clipboard is used only when you press Copy, and the .txt file is created on your device.

The limits are real. The tool cannot see how any Discord client draws your message, so the preview is approximate and the palette may differ from what you see in the app. It writes only the codes the guides document: reset, bold, underline, eight text colors and eight backgrounds. It does not write italics, strikethrough or 256-color codes. Color works only inside an `ansi` code block, never in normal chat text. The editor stops at 20,000 characters. When you paste text containing escape sequences, the tool understands the documented codes, drops the rest and tells you how many it removed. Discord can change this behavior at any time, so if a message stops coloring, check the newest guides and test in a private channel.
