## What this Discord timestamp generator does

This Discord timestamp generator turns a date, a time and a time zone into the short code that makes Discord show one exact moment to every reader in their own local time. You choose when something happens, copy one code and paste it into a message. A member in Karachi sees 6:00 AM, a member in New York sees 8:00 PM the evening before, and nobody has to do time zone arithmetic.

Below the picker you get all seven display styles, a preview of how each one reads for a viewer in any zone and language, countdown shortcuts such as "+1 week", a daylight saving warning, the same moment in eight cities, code for bots in JavaScript and Python, and a snowflake ID decoder that shows when an account, server or message was created. This is an independent tool. It is not affiliated with or endorsed by Discord.

## How to use it

1. Stay on the **Date & time** tab. The fields start at the next full hour in your device's time zone.
2. Choose the **Date** and the **Time**. The time field accepts seconds.
3. Set **Time zone of this date and time** to the place the clock time refers to. This is the field that matters most, because it decides which moment you mean. The hint under it shows the UTC offset that applies on that date.
4. For a countdown, press a shortcut (Now, +15 min, +1 hour, +1 day, +1 week) or type a custom amount, pick minutes, hours, days or weeks, and press **Set**. The date and time fields are filled with the moment that far from now, in the zone you selected.
5. Check the **Unix timestamp** box and the lines under it, which give the moment in your chosen zone and in UTC.
6. Under **Timestamp codes**, press Copy beside the style you want, or **Copy all seven codes**, then paste it into Discord. The two preview menus show how a viewer in another zone or language will read each style.

The **Unix time** tab works the other way. Paste seconds, milliseconds (13 digits) or a whole code such as `<t:1794704400:R>` and the tool shows the moment it stands for. The **Snowflake ID** tab decodes Discord IDs, explained below. On either tab, **Edit in the date picker** moves the result back into the first tab.

## How Discord timestamps work

A Discord timestamp is ordinary message text in the form `<t:UNIX>` or `<t:UNIX:STYLE>`. UNIX is a Unix timestamp, the number of whole seconds since 00:00:00 UTC on 1 January 1970. STYLE is a single letter. The number contains no time zone, because a Unix timestamp names one absolute moment. Each person's Discord app converts that moment to a clock reading using the time zone of their own device. According to community documentation, the viewer's Discord language decides the wording and whether times use AM and PM or a 24-hour clock.

That is why one message can show different clock readings to different people and be right for all of them. It also means the zone in this tool matters only while you type. Once the code exists, the zone is gone and only the moment remains.

The moment 1794704400 is 01:00:00 UTC on November 15, 2026. Here is how this tool previews it for two viewers:

| Style | Name | Viewer in New York, US English | Viewer in London, UK English |
|---|---|---|---|
| `t` | Short time | 8:00 PM | 01:00 |
| `T` | Long time | 8:00:00 PM | 01:00:00 |
| `d` | Short date | 11/14/2026 | 15/11/2026 |
| `D` | Long date | November 14, 2026 | 15 November 2026 |
| `f` | Short date and time | November 14, 2026 8:00 PM | 15 November 2026 01:00 |
| `F` | Long date and time | Saturday, November 14, 2026 8:00 PM | Sunday, 15 November 2026 01:00 |
| `R` | Relative time | depends on the current time | depends on the current time |

These previews come from the browser's `Intl` formatting, so treat them as close approximations. Discord draws the real text, and its punctuation can differ. A code with no style letter is displayed like `f`. Some other generators list extra letters for short date-and-time styles. This page sticks to the seven in the discord.js `TimestampStyles` list, so test anything newer before relying on it.

## A worked example: announcing an event

Say you run a game night on Saturday, November 14, 2026 at 8:00 PM New York time.

1. Enter the date 2026-11-14, the time 20:00 and the zone America/New_York. The hint reads UTC-05:00 (EST), because US clocks go back on November 1, and the Unix timestamp is 1794704400. In July the same 8:00 PM would be UTC-04:00 and a different number.
2. Copy the codes you need and write the announcement:

```
Game night: <t:1794704400:F>
Starting <t:1794704400:R>
```

3. Readers see their own clock. The "same moment around the world" list shows the result: 5:00 PM on Saturday in Los Angeles, 10:00 PM in São Paulo, 1:00 AM on Sunday in London, 2:00 AM in Berlin, 6:30 AM in Kolkata, 10:00 AM in Tokyo and 12:00 PM in Sydney.

## Countdowns and relative time

The `R` style shows the distance from now, such as "in 3 hours" or "2 days ago". Discord keeps that wording current without editing the message. Relative text is rounded, so it is never a precise figure. For anything people must be on time for, put the full date with style `F` next to it.

The countdown shortcuts compute now plus the offset when you press the button, then store a fixed moment. A code made with "+1 day" points at one specific minute, not at "a day after whoever reads it". If a bot should post "starts in 24 hours", it has to calculate that at send time. The live Countdown box in the tool shows the exact days, hours, minutes and seconds left, which Discord's rounded text will not.

## Daylight saving: skipped and repeated times

Twice a year, zones that use daylight saving skip a block of clock time or repeat one. The tool checks this with your browser's time zone data and warns you.

- **Skipped time.** On Sunday, March 8, 2026, clocks in America/New_York jump from 2:00 AM to 3:00 AM, so 2:30 AM never happens. The tool says so and uses 3:30 AM EDT (1772955000), one hour later than you typed.
- **Repeated time.** On Sunday, November 1, 2026, 1:30 AM happens twice in New York. The first is 1:30 AM EDT (1793511000), the second is 1:30 AM EST (1793514600). A menu lets you choose. London has the same situation on Sunday, October 25, 2026.

Countries also change their clocks on different dates. In 2026 the United Kingdom goes back on October 25 and the United States on November 1, so for that week New York is four hours behind London instead of five. A weekly Saturday 8:00 PM New York event lands at midnight in London on October 31, then at 1:00 AM a week later, which is 169 hours apart instead of 168.

Because a timestamp is one fixed moment, a recurring event needs a fresh code each time, or a bot that recalculates it. In the announcement, also say in words which zone the schedule follows, for example "every Saturday at 8 PM New York time".

## Snowflake IDs

Discord identifies users, servers, channels, messages and roles with a 64-bit number called a snowflake. The top bits hold a timestamp, so every ID records when it was created.

| Bits | Field | Meaning |
|---|---|---|
| 63 to 22 | Timestamp | Milliseconds since 1 January 2015 00:00:00 UTC (1420070400000 in Unix milliseconds) |
| 21 to 17 | Worker ID | Five bits identifying the internal worker |
| 16 to 12 | Process ID | Five bits identifying the process |
| 11 to 0 | Increment | A 12-bit counter for IDs made in the same millisecond |

To recover the creation time, shift the ID right by 22 bits and add 1420070400000. IDs exceed the largest integer that ordinary JavaScript numbers hold exactly, which is why the decoder uses BigInt.

Worked example, the ID used in Discord's developer documentation: 175928847299117063 shifted right by 22 gives 41944705796. Adding 1420070400000 gives 1462015105796, which is 2016-04-30 11:18:25.796 UTC. The worker is 1, the process is 0 and the increment is 7.

An ID tells you when that object was created. For a user, that is the account's creation date. It does not say when someone joined a particular server. The decoder warns about values below 4,194,304, where the timestamp part is zero, and about dates in the future, since neither can be a real ID.

## Generating timestamps in a bot

Both major bot libraries build the same text. In discord.js, `time()` with `TimestampStyles` formats a Date. In discord.py, `discord.utils.format_dt()` formats a datetime.

```js
import { time, TimestampStyles } from "discord.js";

const unix = Math.floor(Date.now() / 1000) + 3600; // one hour from now
const text = time(new Date(unix * 1000), TimestampStyles.RelativeTime);
```

The most common bot bug is passing milliseconds. `Date.now()` returns 13 digits, while Discord expects a 10-digit value in seconds. The **Code for a bot** section fills in your own moment and style for JavaScript, Python or plain text.

## Tips and common mistakes

- **Seconds, not milliseconds.** A 13-digit number is milliseconds. The Unix time tab converts it and tells you.
- **Wrong zone.** If the result looks hours off, read the "Selected zone" line under the Unix box. It shows how your input was interpreted.
- **Code formatting.** Wrapping a code in backticks or a code block makes Discord show it as plain text.
- **Embeds.** Reports disagree about titles and footers. Descriptions and field values are the usual choice.
- **Fallback text.** Add a plain-text time where codes will not render, such as exports, logs or other apps.
- **Test first.** Send the message in a private channel and look at it on desktop and mobile.

## Privacy and limitations

The tool remembers your most recent date, time, zone, viewer language and snippet style using sessionStorage, which belongs to this one tab. Reloading keeps those choices and closing the tab discards them. No input is transmitted, and the page never contacts Discord or posts a message on your behalf.

The clock and the device time zone come from your browser. Zone names and daylight saving rules come from the time zone database built into the browser, so an out-of-date browser can be wrong about a recent rule change. The previews are approximate, and the viewer zone and language change only the preview, never the code. Dates run from 1970 through 9999, and Unix timestamps are whole seconds. The tool cannot see how a given server or client version will render a code.
