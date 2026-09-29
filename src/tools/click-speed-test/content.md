## What this click speed test measures

This click speed test counts how many times you can press a mouse button, tap a touchscreen or hit the spacebar inside a timed window, then reports your clicks per second (CPS). Pick a length from 1 to 60 seconds, or type your own from 1 to 300, and the timer starts on your first click. When time runs out you get your total clicks, final CPS, best one-second burst, a chart of your rhythm and a check for suspiciously close clicks.

People use a CPS test to warm up for competitive games, compare two mice or two grips, or check a used mouse for double-click faults. The number is simple, but what it means depends on the test length and the technique, so the sections below explain how to read it.

Everything runs in your browser. Nothing you click is uploaded, and the only thing saved is your best score for each setup, on your own device.

## How to use the click speed test

1. **Choose a test length.** The buttons offer 1, 2, 5, 10, 30 and 60 seconds. "Custom" accepts whole seconds from 1 to 300.
2. **Choose the input.** "Mouse or touch" counts pointer presses. "Spacebar" counts key presses instead.
3. **Choose the mouse button.** Left, right, or any. Touch and pen taps count as left clicks, so they are ignored only for "Right button".
4. **Start clicking inside the pad.** Your first click starts the timer and counts as click number one. In spacebar mode, select the pad once so it has keyboard focus, then press Space.
5. **Keep going until the time bar fills.** The large number is your click count, and the tiles below show time left, live CPS and your average so far.
6. **Read the result.** The pad shows your final CPS and a pace label. "Copy result" copies a plain-text summary, and "Download click log" saves a CSV with the time and source of every click.
7. **Try again.** Press "Try again", click the pad after a brief pause, or press Esc while the pad has focus. Changing any setting also resets the test.

The pad ignores clicks for about 0.7 seconds after the test ends. Without that pause, your last frantic clicks would restart the test and wipe your result.

## How the score is calculated

The formula is deliberately plain:

```
CPS = total clicks ÷ test length in seconds
```

Worked example: you choose 10 seconds and land 64 clicks before the bar fills. CPS = 64 ÷ 10 = 6.40. The window is fixed, so a click arriving after the deadline is discarded and cannot inflate the score. The first click both starts the clock and counts.

The other tiles use the same click times:

- **Live CPS** counts clicks in the last second. For the first half second it divides by half a second, so one early click cannot show an absurd spike.
- **Peak 1 s** slides a one-second window across the run and reports the busiest one. In a 1-second test it equals your total.
- **Fastest gap** is the shortest time between two consecutive clicks.
- **Fast gaps** counts clicks that came less than 30 ms after the previous one.
- **Fade** appears in the tip box when the second half of a test of 5 seconds or longer is at least 10 percent faster or slower than the first. With 34 clicks in the first 5 seconds (6.8 CPS) and 30 in the last 5 (6.0 CPS), the second half is about 12 percent slower. The [percentage calculator](/tools/percentage-calculator) does the same comparison for any two runs.

Each click is timed with the browser's own event timestamp rather than a timer that fires later, so a slow screen refresh does not change your score.

## Which test length should you use?

Length changes what you are measuring, so never compare a 1-second score with a 60-second one.

| Length | What it rewards | Best used for |
| --- | --- | --- |
| 1 to 2 s | Raw burst speed, no fatigue | Quick comparisons, peak technique |
| 5 s | Burst speed with a little endurance | Warm-ups, daily practice |
| 10 s | A balance of speed and rhythm | The most common benchmark |
| 30 s | Endurance and consistency | Checking how much you fade |
| 60 s | Sustained pace | Stamina and long-run scores |

Fatigue is real. A study in *Human Factors* (Ekşioğlu and İşeri, 2015; volume 57, issue 4) had 148 adults tap for one minute with each of eight fingers on a keyboard. Index and middle fingers were fastest, rates fell with age, and tapping duration significantly affected the rate. Expect your 60-second average to sit well below your 5-second one.

For scale, Guinness World Records lists "most mouse clicks in one minute" at 760, set on 10 February 2026. That is about 12.7 clicks per second held for a full minute.

## Pace labels

After each test the tool attaches a one-word label to your CPS. These bands are our own rough scale, not a population statistic or a published standard, and longer tests naturally score lower.

| CPS | Label |
| --- | --- |
| Under 3 | Relaxed |
| 3 to under 5 | Steady |
| 5 to under 7 | Quick |
| 7 to under 9 | Fast |
| 9 to under 12 | Very fast |
| 12 and above | Extreme |

Compare yourself with your own earlier scores at the same length. "Personal bests" keeps one best per preset length and input type, and the "Best" tile also covers custom lengths.

## Clicking techniques and their trade-offs

Four techniques come up whenever people discuss CPS. This tool counts what the browser reports, so it works with any of them.

| Technique | How it works | Things to know |
| --- | --- | --- |
| Normal | One finger presses and releases the button | Lowest strain, easiest to keep steady |
| Jitter | Tensing the arm so the finger vibrates on the button | Can tire the forearm and wrist quickly |
| Butterfly | Two fingers alternate on the same button | Needs practice; overlapping presses can merge |
| Drag | A fingertip is dragged across the button so it bounces over the switch | Hard on fingertips and mouse coating |

Two caveats. A mouse switch only reports a press when the button goes from up to down, so if butterfly fingers overlap and the button never fully releases, the browser sees one press. And while one button is held, the browser sends no new press event for a second button, so overlapping left and right clicks may be undercounted.

Fast repeated clicking can tire the muscles of the hand and forearm. Stop if you feel pain, numbness or tingling, take breaks, and treat this page as a game, not medical or exercise advice.

Rules differ by game and server and change over time. Multiplayer servers commonly ban auto-clickers and macros, and anti-cheat systems can flag very fast, very regular clicking even when it is done by hand. Read the current rules before relying on any technique. A CPS test shows what you can do, not what is allowed.

## Practical uses

- **Competitive players** run a 5-second test as a warm-up and a 30-second test weekly to see whether stamina or rhythm changes after switching grip or mouse.
- **Mouse buyers and sellers** run a slow 10-second test with steady single clicks. Any count in "Fast gaps" suggests a switch that registers twice, which is worth knowing before paying for a used mouse or filing a warranty claim.
- **Streamers and community hosts** set the same custom length for everyone and use "Copy result" so entries are comparable.

## Reducing double-click faults

A double-click fault means one physical press registers as two. It usually comes from a worn or oxidized switch, or a debounce setting so short that the natural bounce of the contact is read as a second click.

To check, run a 10-second test, click slowly with one finger at a steady pace, and read "Fast gaps". Zero is healthy. One or more means clicks arrived less than 30 ms apart, which one finger rarely does deliberately. Repeat the test to confirm. If the fault is real, try these in order:

1. Update the mouse firmware and software, then raise any debounce setting a few milliseconds.
2. Try a different USB port or cable, and remove any macro or remapping that could send extra clicks.
3. Check the warranty. Switches can fail well before their rated life.
4. Replace the switch, or the mouse, if it persists.

A keyboard can develop the same fault on individual keys. The [keyboard tester](/tools/keyboard-tester) has a chatter detector for that case.

## Using it as a mouse click test

To check that every button works, set "Mouse button counted" to "Any button", start a 5-second test and press the left, middle (wheel) and right buttons in turn. When time is up the pad lists how many clicks each source registered, for example "Left 9 · Middle 3 · Right 4". "Copy result" includes the same breakdown, and the click log CSV has a source column for every click. A button that is missing from the list never sent a press to the browser.

Two limits apply. Side buttons (back and forward) are not counted, and wheel scrolling is not a click. The pad also blocks the right-click menu and the browser's middle-click scroll mode so a test is not interrupted, which only applies inside the pad.

## How to improve your click speed

1. **Set a baseline.** Run three 5-second tests with a pause between them and note your best. Use the same length every time you compare.
2. **Fix the setup first.** Sit so your forearm is roughly level with the desk, rest your wrist lightly, and hold the mouse without squeezing. Tension slows the finger and tires the forearm sooner.
3. **Train in short sets.** Several 5-second sets with a minute of rest between them teach speed without the strain of a long test. Save 30 and 60 seconds for checking stamina.
4. **Read the rhythm chart.** A flat row of bars beats one tall bar followed by a collapse. If the "Fade" note says you slowed in the second half, lower your pace slightly and see whether the total goes up.
5. **Retest weekly.** Your "Best" tile and the personal bests grid track each setup separately, so you can see whether a new grip or mouse actually helped.

Stop if your hand hurts, goes numb or tingles. A higher score is not worth an injury.

Common mistakes to avoid:

- **Comparing across devices or sites.** Trackpads, phones and gaming mice behave differently, and other testers may start the clock or count the first click differently.
- **Holding the spacebar.** Holding the key does not count as repeated presses. Every count needs a fresh press.
- **Judging from one attempt.** Your first test of the day is rarely your best, so warm up and use the best of a few tries.

## Privacy and limitations

The test runs entirely in your browser and no click data is sent to a server. Your last-used settings and best scores are stored in your browser's local storage. "Clear saved bests" removes the scores, and clearing site data removes everything. If storage is blocked, the test still works; it just cannot remember anything.

Accuracy has limits. Browsers can round timestamps to protect privacy, and mouse polling and operating-system input handling add small delays, so the fastest gaps are approximate at the millisecond level. There is no leaderboard or server-side check, so treat the score as personal, not official.

Names of games and servers appear only to describe how people use click testers. This page is not affiliated with any game, server or mouse maker.
