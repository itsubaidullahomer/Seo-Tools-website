## What this military time converter does

This military time converter changes 12-hour clock times into military (24-hour) time and back, using one box that detects the direction. Type 5:30 PM and you get 1730. Type 0630 and you get 6:30 AM. Each answer also shows how to say the time aloud ("seventeen thirty hours"), the colon form (17:30) and a one-line explanation of the conversion.

Four tabs cover the common jobs: **Converter** for one time, **List / timesheet** for pasted times and shift ranges, **Chart & print** for a printable 24-hour chart on US Letter or A4, and **Zulu & zones** for military time zone letters. Everything runs in your browser and nothing you type is uploaded.

## How to use the converter

**Converter.**

1. Type a time. It reads 5:30 PM, 5.30pm, 17:30, 1730, 0630, 1730h, 17h30, noon and midnight. A badge shows whether it was read as 12-hour or 24-hour time, and the converted answer is highlighted. Every row has a copy button.
2. If a time such as 5:30 has no AM or PM, the tool does not guess. It shows 5:30 AM = 0530 and 5:30 PM = 1730 as two cards to click.
3. Under **Options**, pick a time from the menus, add a **time zone letter** (Z gives 1730Z) or change **How to say the time**.
4. **Show Zulu (UTC)** switches the "right now" strip to UTC and shows the date-time group. **Use this time** loads the clock reading.

**List / timesheet.** Paste one time, or one start - end range, per line. Choose **12-hour input** (times with no AM or PM are flagged) or **Military input** (5:30 is read as 0530). Rows show both formats and each range's duration, including shifts that cross midnight. Copy the results or download a CSV.

**Chart & print.** Choose By hour or By minute, a minute step and a paper size, then Print chart, Download PDF, Download CSV or Copy chart.

**Zulu & zones.** Enter a 24-hour time, pick From and To letters and read the result. A letter typed with the time (1530R) overrides From. The letters A, H and P cannot be typed after a time, because they already mean AM, hours and PM, so pick those from the menus.

**Edge cases.** 2400 is accepted and shown as 0000. "17:30 PM" is accepted with a note, but "17:30 AM" is rejected as contradictory. Seconds are ignored with a note, and hours above 23 or minutes above 59 get an explanation.

## How to convert between 12-hour and military time

The rule fits in two lines:

- **12-hour to military:** AM hours stay the same, written with two digits, except 12 AM, which becomes 00. PM hours get 12 added, except 12 PM, which stays 12.
- **Military to 12-hour:** hour 00 becomes 12 AM, hours 01 to 11 are AM, hour 12 is 12 PM, and hours 13 to 23 are PM after you subtract 12.

Minutes never change.

```
5:30 PM   5 + 12 = 17          ->  1730
6:30 AM   pad to two digits    ->  0630
12:15 AM  12 becomes 00        ->  0015
12:15 PM  12 stays 12          ->  1215
1945      19 - 12 = 7, PM      ->  7:45 PM
0005      00 becomes 12, AM    ->  12:05 AM
```

So 1700 military time is 5:00 PM, 1900 is 7:00 PM and 2200 is 10:00 PM. The exceptions exist because the 12-hour clock restarts each half-day at 12 instead of 0. Treat 12 as 0 and one formula covers everything:

```
hour24 = (hour12 mod 12) + (12 if PM, else 0)
hour12 = hour24 mod 12, shown as 12 when the result is 0
```

## How to say military time out loud

Many armed forces read the hour and the minutes as two-digit numbers, then say "hours". Conventions differ between services and countries, so treat these as common practice rather than one official rule. The converter has four styles so you can match yours.

1. Hours 00 to 09 start with "zero" (0700 begins "zero seven"). Hours 10 to 23 are numbers: "thirteen", "twenty".
2. A whole hour ends in "hundred": 0700 is "zero seven hundred hours" and 1300 is "thirteen hundred hours".
3. Minutes 10 to 59 are numbers: 0630 is "zero six thirty hours" and 1745 is "seventeen forty-five hours".
4. Minutes 01 to 09 keep a zero: 0605 is "zero six zero five hours".
5. With a zone letter, the zone name replaces "hours": 1730Z is "seventeen thirty Zulu".

| Military | Say it |
|---|---|
| 0000 | zero hundred hours |
| 0005 | zero zero zero five hours |
| 1000 | ten hundred hours |
| 2359 | twenty-three fifty-nine hours |

Some people say "oh" for zero. On radio, digits are often read one at a time, and some operators say "niner" for 9, "tree" for 3, "fower" for 4 and "fife" for 5 so digits stay clear over a noisy channel. The radio style turns 1900 into "one niner zero zero hours". To spell out ordinary numbers, use the [number to words converter](/tools/number-to-words).

## Midnight: 0000 or 2400?

Both write the same instant, but 0000 is the standard way. A military day runs from 0000 to 2359, and the date changes when the clock rolls from 2359 to 0000. So 0000 on the 15th is the first minute of the 15th.

You will still meet 2400, mostly in schedules and contracts, where it means the end of a day: a shop "open until 2400" closes as the date rolls over. It names the same instant as 0000 on the next date, which is why it causes mix-ups. The converter accepts 2400 and shows it as 0000 with a note.

On a 12-hour clock, "12 AM Friday" could mean either end of Friday, so write 0000 with a date, or 2359 for the last minute of a day.

## Military time chart, hour by hour

Add minutes to the hour: 1747 is 5:47 PM. The **Chart & print** tab has this table with a live "now" marker, plus a minute-by-minute version in 5, 10, 15 or 30-minute steps.

| Military | 12-hour | Military | 12-hour |
|---|---|---|---|
| 0000 | 12:00 AM (midnight) | 1200 | 12:00 PM (noon) |
| 0100 | 1:00 AM | 1300 | 1:00 PM |
| 0200 | 2:00 AM | 1400 | 2:00 PM |
| 0300 | 3:00 AM | 1500 | 3:00 PM |
| 0400 | 4:00 AM | 1600 | 4:00 PM |
| 0500 | 5:00 AM | 1700 | 5:00 PM |
| 0600 | 6:00 AM | 1800 | 6:00 PM |
| 0700 | 7:00 AM | 1900 | 7:00 PM |
| 0800 | 8:00 AM | 2000 | 8:00 PM |
| 0900 | 9:00 AM | 2100 | 9:00 PM |
| 1000 | 10:00 AM | 2200 | 10:00 PM |
| 1100 | 11:00 AM | 2300 | 11:00 PM |

**Printing.** Print chart opens the browser print dialog with a clean black-on-white, two-page document: the hour chart on page 1 and the minute chart on page 2. Download PDF builds the same pages as a file for US Letter or A4, generated in your browser with built-in fonts. If the paper size is wrong, choose it in the print dialog, since some browsers ignore a web page's size hint.

## Zulu time and military time zone letters

Military time zones use the NATO phonetic alphabet. **Z, Zulu, is Coordinated Universal Time (UTC)**, the shared clock of aviation and military operations. Letters A to M (skipping J) run one to twelve hours ahead of UTC, and N to Y run one to twelve hours behind. J, Juliet, means your own local time. Letters cover whole-hour offsets only, so India (UTC+5:30) has none.

A date-time group writes date and time together: day, four-digit time, zone letter, month, year. **291930Z SEP 26** is the 29th at 19:30 Zulu in September 2026. Airport weather reports (METARs) time-stamp observations in this style, for example 291851Z.

Daylight saving time moves a region to a different letter:

| Region | Standard | Letter | Daylight | Letter |
|---|---|---|---|---|
| US Eastern | UTC−5 | R | UTC−4 | Q |
| US Central | UTC−6 | S | UTC−5 | R |
| US Mountain | UTC−7 | T | UTC−6 | S |
| US Pacific | UTC−8 | U | UTC−7 | T |

To convert, subtract the zone's offset. 1530R is 15:30 at UTC−5, so add 5 hours: 2030Z. A flight plan for 1430Z departs at 10:30 AM in US Eastern Daylight Time (Q) but 9:30 AM in Standard Time (R). The **Zulu & zones** tab does the arithmetic for any two letters and flags a day change.

## Who uses military time, and why

**Nurses and clinicians.** Many hospitals chart in 24-hour time so 12:00 AM and 12:00 PM cannot be swapped on a medication record. A dose due every six hours from 0600 falls at 0600, 1200, 1800 and 0000. Follow your facility's policy: this page is a learning aid, not clinical guidance.

**Military, pilots and dispatchers.** Orders, logs, flight plans and weather reports use four-digit Zulu times, so a crew in Denver and a controller in Frankfurt share one clock.

**Payroll and HR.** Time clocks often use 24-hour time. The **List / timesheet** tab converts a pasted week and shows shift lengths, including 2200 - 0600. Then the [hourly to salary calculator](/tools/hourly-to-salary-calculator) turns hours into pay.

## Tips and common mistakes

- **Keep the leading zero.** 0630 is clear, while 630 could be 6:30 or the number 630. The converter treats 630 as ambiguous and asks AM or PM.
- **Do not add 12 to noon.** 12:15 PM is 1215, not 2415, and 12:15 AM is 0015, not 1215.
- **Minutes are not decimals.** 1730 is not 17.30 hours, which would be 17 hours 18 minutes. From 0800 to 1730 is 9 hours 30 minutes, or 9.5 hours, not 9.3.
- **Subtract in minutes.** From 0930 to 1415 is 855 − 570 = 285 minutes, or 4 hours 45 minutes. Plain subtraction (1415 − 930 = 485) is wrong.
- **Mental shortcut for the afternoon.** From 1300 to 2159, subtract 2 from the hour and keep only the last digit: 1700 gives 15, so 5 PM, and 2100 gives 19, so 9 PM. It fails at 2200 and 2300, which are 10 and 11 PM, so use minus 12 there.
- **Say the zone.** Write 1730Z or 1730R so nobody guesses whose clock it is.
- **Read it back.** For medication or appointment times, say it in words. "Zero six thirty hours" is hard to mishear as 1630.

## Privacy and limitations

Conversion, printing and PDF creation all happen in your browser, and the times you type are not uploaded. The tool remembers your last entries in session storage for that tab so a refresh does not lose them; closing the tab clears them.

Each entry can be up to 60 characters, and the list tab converts up to 2,000 lines. The tool works to the minute, ignores seconds and does not handle dates. Zone letters are whole-hour offsets and the converter does not know daylight saving rules, so you choose the letter that applies. The "right now" strip is only as accurate as your device clock. Military time is a way of writing time, not a legal or safety standard: for medical, aviation or payroll records, follow your organization's rules.
