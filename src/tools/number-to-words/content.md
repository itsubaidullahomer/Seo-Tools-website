## What this number to words converter does

This number to words converter spells out any number in English as you type. The figure 1,250.50 becomes "one thousand two hundred fifty point five zero", and in Currency mode "one thousand two hundred fifty dollars and fifty cents". It handles whole numbers, decimals, negatives and values up to 36 digits, far beyond what a calculator display or spreadsheet cell shows without rounding.

Four modes cover the common needs. **Words** is plain spelling-out. **Currency** reads an amount in US dollars, British pounds, euros, Canadian dollars, Australian dollars or Indian rupees, with correct singular and plural subunits. **Check style** writes an amount the way the words line of a check is filled in, with the cents as a fraction of 100. **Ordinal** gives "twenty-first" instead of "twenty-one". Switches choose US or British "and", international grouping (million, billion) or Indian grouping (lakh, crore), short or long scale, and one of four letter cases.

## How to use the converter

1. **Pick a mode** with the tabs: Words, Currency, Check style or Ordinal. A line under the tabs describes the selected mode.
2. **Type or paste a number** into the Number box. A $, £, € or ₹ at the start or end is ignored, and commas or spaces are accepted as thousands separators when they group the digits in threes (1,234,567) or the Indian way (12,34,567). A minus sign or accounting brackets, as in (1,234.56), make it negative, and scientific notation such as 1e30 is understood. The words update on every keystroke, and the Try buttons load edge cases such as 0.05 and 1e30.
3. **Choose a currency** in Currency and Check style modes. Picking Indian rupee also switches the numbering system to Indian, so 12,34,567 is read in lakh and crore.
4. **Adjust the style.** Numbering system, Text case, British "and" and Hyphenate 21 to 99 change the wording. Check style ignores British "and" because a check reserves "and" for the cents.
5. **Open More options** for the short or long scale, "minus" or "negative", and the decimal mark of your input (choose Comma for numbers such as 1.234,56).
6. **Copy the result.** Copy words gives the text alone. Copy words + figures gives the drafting form "One thousand two hundred fifty dollars and fifty cents ($1,250.50)".
7. **Convert many numbers at once** by ticking Convert a list and pasting one number per line. Blank lines are kept so the output lines up with the input, and a line that is not a number is flagged without stopping the rest. Copy or download the results.

A "How this number is read" table under a single result shows the periods.

## How numbers are turned into words

English reads numbers in groups of three digits. The tool splits the whole part from the right, reads each group of 1 to 999 as hundreds, tens and units, and adds the group's name. Take 4,207,015:

| Period | Digits | Read as |
| --- | --- | --- |
| Million | 4 | four million |
| Thousand | 207 | two hundred seven thousand |
| Units | 15 | fifteen |

Joined together: **four million two hundred seven thousand fifteen**. With British "and" switched on, the same number is "four million two hundred and seven thousand and fifteen". The British rule used here puts "and" after the hundreds inside a group and before a final one- or two-digit group that follows larger groups: 1,000,001 is "one million and one", while 1,050,000 stays "one million fifty thousand".

**Hyphens.** Numbers from 21 to 99 are hyphenated when both tens and units are spoken: twenty-one, ninety-nine, but not twenty or one hundred. The hyphen switch removes them if your house style differs.

**Decimals.** Digits after the decimal point are read one at a time, so 0.05 is "zero point zero five". Trailing zeros are kept: 2.50 is "two point five zero". Money is different: Currency mode reads whole units plus subunits, so 0.05 dollars is "five cents". Amounts with more than two decimals are rounded half up to two (12.345 becomes $12.35) and a note tells you.

**Exact digits.** JavaScript's ordinary Number type stops being exact above 9,007,199,254,740,991, so a converter built on it can quietly misread long values. This tool never turns your input into a Number. It keeps the digits as text, reads three at a time, and uses BigInt only for currency rounding. So 9,007,199,254,740,993 is read correctly and 1e30 is "one nonillion".

## How to write a check amount in words

The words line of a check is a safeguard, because figures are easier to alter than words. The usual convention in the United States and Canada is whole dollars in words, then "and", then the cents as a two-digit fraction over 100. These examples come from Check style mode:

| Amount | Check style output |
| --- | --- |
| $8.05 | Eight and 05/100 |
| $100.00 | One hundred and 00/100 |
| $1,250.50 | One thousand two hundred fifty and 50/100 |
| $12,004.99 | Twelve thousand four and 99/100 |
| $0.75 | Zero and 75/100 |

Three habits prevent most errors:

- **Use "and" only before the cents.** "One hundred five and 00/100" is unambiguous. "One hundred and five and 00/100" makes the reader wonder where the dollars end.
- **Always write two digits over 100:** 05/100 for five cents, 00/100 for a whole amount, never 5/100.
- **Fill the rest of the line.** Start at the left edge and draw a line through leftover space so nothing can be added.

If the words and figures disagree, the words normally win. In the United States most states follow section 3-114 of the revised Uniform Commercial Code Article 3, which says words prevail over numbers (states that kept the older text put a similar rule in section 3-118, where figures win if the words are ambiguous). In the United Kingdom section 9 of the Bills of Exchange Act 1882 says the sum denoted by the words is the amount payable. Check both before you sign; this is general information, not legal advice. This tool converts numbers to text; it does not print or issue cheques (the British spelling of check).

## Lakh and crore: the Indian numbering system

Indian usage groups the first three digits together and then every two digits, and names the groups thousand, lakh and crore. Choose the Indian numbering system, or pick the rupee, and the tool reads amounts that way.

| Figure | Indian grouping | Read as |
| --- | --- | --- |
| 100,000 | 1,00,000 | one lakh |
| 1,000,000 | 10,00,000 | ten lakh |
| 10,000,000 | 1,00,00,000 | one crore |
| 1,000,000,000,000 | 10,00,00,00,00,000 | one lakh crore |

A lakh is one hundred thousand and a crore is ten million. Above 99 crore the count of crores is read the same way, which is how "lakh crore" (10^12) appears in Indian budgets and news reports. Invoices often end with "only", so Currency mode has an "End with only" switch: 123,456.78 rupees becomes "one lakh twenty-three thousand four hundred fifty-six rupees and seventy-eight paise only".

## Short scale and long scale

The same word can mean different numbers. On the short scale, used in the United States and, since 1974, by the UK government, a billion is a thousand million. On the long scale, still used in parts of continental Europe, a billion is a million million and a thousand million is a milliard.

| Value | Short scale | Long scale |
| --- | --- | --- |
| 10^9 | billion | milliard |
| 10^12 | trillion | billion |
| 10^18 | quintillion | trillion |
| 10^30 | nonillion | quintillion |

The short scale is the default. If a text may be read across the scale divide, write the digits next to the word.

Here are the names the converter uses for each period on the short scale, up to the largest value it accepts:

| Power of ten | Digits | Name |
| --- | --- | --- |
| 10^3 | 1,000 | thousand |
| 10^6 | 1,000,000 | million |
| 10^9 | 1,000,000,000 | billion |
| 10^12 | 1,000,000,000,000 | trillion |
| 10^15 | 1 followed by 15 zeros | quadrillion |
| 10^18 | 1 followed by 18 zeros | quintillion |
| 10^21 | 1 followed by 21 zeros | sextillion |
| 10^24 | 1 followed by 24 zeros | septillion |
| 10^27 | 1 followed by 27 zeros | octillion |
| 10^30 | 1 followed by 30 zeros | nonillion |
| 10^33 | 1 followed by 33 zeros | decillion |

A 36-digit number therefore reads as up to 999 decillion, followed by the smaller periods. Each name is the previous one multiplied by 1,000, so counting the digits after the first group of three tells you which name applies.

## Ordinals: first, second, third

Ordinal mode changes the last word of the number: one becomes first, two second, three third, five fifth, eight eighth, nine ninth and twelve twelfth, while words ending in y become "ieth" (twenty, twentieth). It also gives the numeric form, with th after 11, 12 and 13 but st, nd and rd after 21, 22 and 23.

## When to spell out numbers in writing

Follow the style guide your publisher or school uses. Associated Press style spells out one through nine and uses numerals for 10 and above. The Chicago Manual of Style spells out zero through one hundred, plus round multiples such as "two hundred" and "three thousand", and uses numerals for the rest. Both advise spelling out a number that begins a sentence. Words mode with the lowercase option gives text you can paste into a sentence. Names such as Henry VIII or Super Bowl LX use Roman numerals instead; the [Roman numeral converter](/tools/roman-numeral-converter) handles those.

## Who uses it

- **Bookkeepers and accountants** add an amount in words to invoices and payment vouchers so the total cannot be misread.
- **Contract drafters and paralegals** use the "words (figures)" convention, which Copy words + figures produces directly.
- **Teachers and developers** build answer keys and test fixtures from a pasted list.
- **Writers and editors** turn figures into words once the style rule is settled. The [case converter](/tools/case-converter) fixes capitalization afterwards.

## Tips and common mistakes

- **Years are not cardinals.** The year 1984 is spoken "nineteen eighty-four", but this tool reads the number 1,984 as "one thousand nine hundred eighty-four". Write years by hand.
- **Check the decimal mark.** In the US, 1.234 is a little over one; in much of Europe it means one thousand two hundred thirty-four. The tool reads the period as the decimal point unless you change Decimal mark under More options. It reports an error when a number mixes both marks in the other order, such as 1.234,56, and adds a note when a comma is followed by only one or two digits, as in 1,25.
- **Separators must sit where thousands separators belong.** Something like 1,2,3 or 1,23,4567 is refused instead of being guessed at, so a stray comma cannot quietly turn a list into one big number. To convert several numbers, use list mode and put one per line.
- **Do not put "and" inside dollar amounts on a check**, and do not skip the cents fraction.

## Privacy and limitations

Everything runs in your browser. The numbers you enter are processed there and are not uploaded to a server. Your last entry and settings stay in the tab's session storage so a refresh does not lose them; closing the tab clears them.

Limits to know: up to 36 digits (as far as decillions); English only; six currencies, all with 100 subunits; fractions such as 1/2 are not parsed; negative amounts are refused in Check style; ordinals always use the international system. Above 99 crore the Indian reading repeats "crore" rather than using older traditional names. For legal, tax or banking documents, compare the words with the figures yourself.
