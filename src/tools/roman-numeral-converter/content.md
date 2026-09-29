## What this Roman numeral converter does

This Roman numeral converter turns numbers into Roman numerals and Roman numerals back into numbers, using one box that works out the direction for you. Type 2026 and you get MMXXVI; type MCMXCIV and you get 1994. It also explains exactly why an invalid numeral such as IIII, VX or IC breaks the rules, shows every step of the conversion in a table, and converts calendar dates for tattoos, invitations and cornerstones with your choice of order and separator.

The range is 1 to 3,999,999. Up to 3,999 you get a standard numeral. Above that, the converter puts a bar over the letters (the vinculum) to multiply them by 1,000. A third mode prints charts of the numerals 1 to 100 and of any run of 100 years. Everything is calculated in your browser and nothing you type is uploaded.

## How to use the converter

**Number ⇄ Roman**

1. Type into **Number or Roman numeral**. Digits (`2026` or `2,026`) give a Roman numeral. Letters in any case (`MMXXVI`, `mmxxvi`) give a number. Pasted Unicode numeral characters such as Ⅻ work too. The **Try** buttons load examples, including two invalid numerals (IIII and IC).
2. Read the result card. **Copy** copies the numeral. Above 3,999 the button reads **Copy with overline**, and from 4,000 to 9,999 you also get **Copy repeated-M form** (MMMM for 4,000). **Convert back** feeds the result into the box to check the round trip. **Lowercase letters** gives i, ii, iii for preface page numbers.
3. Open **Step by step** to see each place value and the letters that build it.
4. If a numeral breaks a rule, a warning names the rule, shows the loose reading and offers a button that swaps in the standard form.

**Date to Roman**

1. Pick a **Month**, type the **Day** and **Year** (1 to 3,999), or press **Use today**.
2. Choose the **Order**, **Separator** and **Year style**. Each part is converted on its own, and the table reads every numeral back to a number.
3. **Copy** gives one line. **Copy on separate lines** gives one part per line, for stacked designs.

**Charts**

Switch between **Numbers 1–100** and **Years**. For years, type a **First year** or press 1900s, 2000s or 2100s. **Copy chart** and **Download CSV** export whatever is on screen.

## How Roman numerals work

Seven letters carry all the values:

| Letter | I | V | X | L | C | D | M |
|---|---|---|---|---|---|---|---|
| Value | 1 | 5 | 10 | 50 | 100 | 500 | 1,000 |

Three rules turn them into numbers:

- **Add when the letters run from large to small.** VIII is 5 + 1 + 1 + 1 = 8, and MDC is 1,000 + 500 + 100 = 1,600.
- **Subtract when a small letter comes first, but only in six pairs:** IV (4), IX (9), XL (40), XC (90), CD (400) and CM (900). Only I, X and C can be subtracted, and only from the next two larger symbols.
- **Never repeat a letter more than three times in a row, and never repeat V, L or D.** Four is IV, not IIII, and ten is X, not VV.

To convert a number, split it into thousands, hundreds, tens and ones and write each place on its own. Take 1994:

```
1000 -> M
 900 -> CM
  90 -> XC
   4 -> IV
        MCMXCIV
```

To go the other way, read left to right, treat each subtractive pair as one unit and add: M (1,000) + CM (900) + XC (90) + IV (4) = 1,994.

Two limits follow. The largest standard numeral is MMMCMXCIX (3,999), because M can appear only three times in a row, and the standard system has no zero, negative numbers or fractions.

## Numbers above 3,999: the overline

A bar over a Roman numeral, called a vinculum, multiplies its value by 1,000. A barred V is 5,000 and a barred M is 1,000,000. To write 12,345, the converter writes 12 as XII with an overline and follows it with CCCXLV for the remaining 345.

On the page the bar is drawn with CSS. The copied text places the Unicode combining overline (U+0305) after each overlined letter, so it survives pasting into documents and chat. Some fonts space those marks unevenly. For print or a tattoo design, draw a real line in a design program instead. Older texts often wrote 4,000 as MMMM; the converter reads that form and offers it as a copy option up to 9,999.

## Why IIII, VX and IC are flagged

Non-standard numerals appear in old inscriptions and on clock faces, but they break the modern rules, and it is worth catching one before it lands in a homework answer, a manuscript or a tattoo. The converter names the rule, shows the value most readers would take from it and gives the standard form.

| You typed | Rule broken | Loose reading | Standard form |
|---|---|---|---|
| IIII | Four of the same letter in a row | 4 | IV |
| XXXX | Four of the same letter in a row | 40 | XL |
| VV | V is never repeated | 10 | X |
| VX | V is never subtracted | 5 | V |
| IC | I can only go before V or X | 99 | XCIX |
| IL | I can only go before V or X | 49 | XLIX |
| XD | X can only go before L or C | 490 | CDXC |

Shapes such as IIX can be read in more than one way (8 in some inscriptions, 10 by a simple right-to-left sum), so the converter explains the problem without guessing a value.

## Roman numeral dates and tattoos

A Roman numeral date is written part by part. The month, day and year are each converted and then joined with a separator. June 15, 2024 can become any of these:

| Style | Result |
|---|---|
| Month, day, year with dots | VI.XV.MMXXIV |
| Day, month, year with dots | XV.VI.MMXXIV |
| Year first with dashes | MMXXIV-VI-XV |
| Last two digits of the year | VI.XV.XXIV |
| Year in two halves (20 and 24) | VI.XV.XX.XXIV |

Nothing here is standardized, so each choice is about how clear the result will look on skin or paper.

- **Order.** Month-first is the US habit, day-first is common in the UK and Europe, and year-first is the ISO order. If the day is 12 or less, a reader could swap day and month. The converter warns you when that risk applies.
- **Separator.** Dots, dashes, slashes, spaces, middle dots and bullets all appear in designs. Drop the separators and the numerals blur: XIXII could be XI and XII, or XIX and II. That is why there is no "none" option.
- **Year style.** The full year is unambiguous. The shorter styles need a year without 00 in the converted part. Roman numerals have no zero, so for 2000 the converter falls back to MM and says so.
- **Real dates only.** February 30 is rejected. February 29 is accepted only in leap years: divisible by 4, except centuries not divisible by 400 (2000 yes, 1900 no).

**Always verify before inking.** Read each numeral back (the table does this for you), check the order against how other people will read it, and have your artist confirm the spelling and spacing on the stencil. A thin separator that looks fine on screen can vanish at tattoo size.

## Why clocks show IIII

Many dials with Roman numerals show four o'clock as IIII instead of IV. Ancient inscriptions used both spellings, and the subtractive style became the usual one later, so IIII is an old spelling rather than a mistake. The reasons clockmakers kept it are plausible but hard to prove: IIII balances VIII on the opposite side of the dial, it splits the face into tidy groups built around I, V and X, and it avoids confusing IV with VI at a glance. A popular story says King Louis XIV of France preferred IIII, but it is difficult to verify.

The converter treats IIII as non-standard for ordinary writing and still tells you it means 4. For the other common clock conversion, see the [military time converter](/tools/military-time-converter).

## Where Roman numerals are still used

- **Editors and typesetters** number front matter (preface, contents) in lowercase Roman numerals and the body in Arabic numerals. The **Lowercase letters** switch does that.
- **Musicians and teachers** label chords by scale degree: uppercase for major (I, IV, V) and lowercase for minor (ii, vi), as in I–vi–IV–V.
- **Event organizers and writers** meet regnal numbers (Charles III) and Olympiad numbers (Paris 2024 was the Games of the XXXIII Olympiad).
- **Film and video producers** still see copyright years on end credits in Roman numerals, such as MCMXCIV for 1994.
- **Lawyers and chemists** meet them in outlines, in the seven articles of the US Constitution and in oxidation states such as iron(III) oxide.

## Reference table: useful numbers

| Number | Roman | Number | Roman |
|---|---|---|---|
| 1 | I | 100 | C |
| 4 | IV | 400 | CD |
| 5 | V | 500 | D |
| 9 | IX | 900 | CM |
| 10 | X | 1,000 | M |
| 40 | XL | 1,994 | MCMXCIV |
| 49 | XLIX | 2,000 | MM |
| 50 | L | 2,025 | MMXXV |
| 90 | XC | 2,026 | MMXXVI |
| 99 | XCIX | 3,999 | MMMCMXCIX |

## Roman numerals 1 to 100 chart

Each row lists ten consecutive numbers, so the third box in the row 21–30 is 23, which is XXIII. Notice how the pattern repeats: the tens (X, XX, XXX, XL, L, LX and so on) simply sit in front of the ones from I to IX. The Charts mode in the converter prints the same list and lets you copy it or download it as a CSV file.

| Numbers | 1st | 2nd | 3rd | 4th | 5th | 6th | 7th | 8th | 9th | 10th |
|---|---|---|---|---|---|---|---|---|---|---|
| 1–10 | I | II | III | IV | V | VI | VII | VIII | IX | X |
| 11–20 | XI | XII | XIII | XIV | XV | XVI | XVII | XVIII | XIX | XX |
| 21–30 | XXI | XXII | XXIII | XXIV | XXV | XXVI | XXVII | XXVIII | XXIX | XXX |
| 31–40 | XXXI | XXXII | XXXIII | XXXIV | XXXV | XXXVI | XXXVII | XXXVIII | XXXIX | XL |
| 41–50 | XLI | XLII | XLIII | XLIV | XLV | XLVI | XLVII | XLVIII | XLIX | L |
| 51–60 | LI | LII | LIII | LIV | LV | LVI | LVII | LVIII | LIX | LX |
| 61–70 | LXI | LXII | LXIII | LXIV | LXV | LXVI | LXVII | LXVIII | LXIX | LXX |
| 71–80 | LXXI | LXXII | LXXIII | LXXIV | LXXV | LXXVI | LXXVII | LXXVIII | LXXIX | LXXX |
| 81–90 | LXXXI | LXXXII | LXXXIII | LXXXIV | LXXXV | LXXXVI | LXXXVII | LXXXVIII | LXXXIX | XC |
| 91–100 | XCI | XCII | XCIII | XCIV | XCV | XCVI | XCVII | XCVIII | XCIX | C |

### Roman numeral years

Years follow the same place-value method, so the current decade only ever changes its last letters:

| Year | Roman |
|---|---|
| 2024 | MMXXIV |
| 2025 | MMXXV |
| 2026 | MMXXVI |
| 2027 | MMXXVII |
| 2028 | MMXXVIII |
| 2029 | MMXXIX |
| 2030 | MMXXX |

The Years chart in the converter lists any 100 years in a row, from the 1900s to the 2100s or from a first year you type.

## NFL championship game numerals

The NFL numbers its championship game, commonly called the Super Bowl, with Roman numerals. The usual explanation is that a season starts in one calendar year and ends in the next, so a number avoids confusion over which year to use. Games are numbered in order, starting with I for the game played in January 1967, so the year a game is played is 1966 plus its number. For its 2016 game the league used Arabic 50 in its branding instead of L, then returned to Roman numerals.

| Game | Numeral | Played |
|---|---|---|
| 1 | I | 1967 |
| 5 | V | 1971 |
| 10 | X | 1976 |
| 20 | XX | 1986 |
| 40 | XL | 2006 |
| 50 | L | 2016 |
| 60 | LX | February 8, 2026 |
| 61 | LXI | scheduled for February 14, 2027 |

This is a factual reference only. This site is not affiliated with, endorsed by or sponsored by the NFL or any team.

## Tips and common mistakes

- **Do not write 1999 as MIM.** Subtraction happens within a place value: 1,999 is M + CM + XC + IX, so MCMXCIX. IM is not allowed.
- **Keep the order.** The larger place value always comes first. XIX is 19, but IXX is not a numeral.
- **Use ordinary letters, not the Ⅻ characters.** Unicode has dedicated Roman numeral characters, but plain Latin letters are safer for search, screen readers and fonts.
- **Change case in bulk** with the [case converter](/tools/case-converter), or spell a number out with the [number to words converter](/tools/number-to-words).

## Privacy and limitations

Every conversion runs in your browser. Nothing you type is sent to a server. Your last inputs are kept in this tab's session storage so a refresh does not lose them, and closing the tab clears them.

The converter writes whole numbers from 1 to 3,999,999. Larger values need a double bar or a box, which has no agreed text form. Dates run from year 1 to 3,999 and are checked against the Gregorian calendar, applied to early years as well. Roman numeral conventions varied across history, so the numerals here follow the modern standard forms taught in schools and used in publishing. For tattoos and engravings, confirm every numeral with the person doing the work.
