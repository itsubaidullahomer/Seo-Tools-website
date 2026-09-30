## What this mouse test checks

This mouse test answers four practical questions about the mouse on your desk. Does every button send a signal? Does any button send two signals when you pressed once? Does the scroll wheel report the right direction? And roughly how often does the mouse report its position to the computer?

A drawing of a five-button mouse sits in the test area. Each part turns orange while you hold it and green once the browser has registered it. Below it you get press counts, a double-click detector with a timing table, a log of every press, release and wheel step, and, in Chrome and Edge, a polling rate estimate.

## How to use the mouse test

1. **Move the pointer into the test area.** The corner label changes to "Listening". Only events over the box are counted.
2. **Press every button.** Left, right, middle (click the wheel), and the back and forward side buttons if you have them. Each tile shows its press count.
3. **Scroll the wheel both ways.** The arrows beside the wheel light up, and the scroll tiles count steps and show the newest direction and delta.
4. **Check for double clicks.** Click one button slowly, about once a second, for 20 or 30 presses. Watch "Flagged presses" and the red lines in the event log.
5. **Adjust the limit if needed.** The slider sets how close two presses of the same button can be before they are flagged: 80 ms by default, 20 to 300 ms in range.
6. **Estimate the polling rate** in the box at the bottom, if your browser shows it.
7. **Save the result.** "Copy report" and "Download report" give a plain-text summary, and the download adds the event log. "Reset test" clears everything.

The toggle beside the buttons stops the page scrolling while the pointer is over the box.

## How each reading is measured

The browser identifies each button with a number. These are the values the tool reads.

| Button | `event.button` | Bit in `event.buttons` |
| --- | --- | --- |
| Left (main) | 0 | 1 |
| Middle (wheel click) | 1 | 4 |
| Right (secondary) | 2 | 2 |
| Back | 3 | 8 |
| Forward | 4 | 16 |

Double-click detection measures from one mouse-down to the next mouse-down of the same button. Different buttons never count against each other, so pressing left and right together is not a fault.

Worked example: you press the left button at 12.000 s, 12.050 s and 12.250 s on the session clock. The gaps are 50 ms and 200 ms. With the default 80 ms limit, the second press is flagged, the closest pair reads 50 ms, and the verdict becomes a warning. Raise the limit to 250 ms and both later presses are flagged; lower it to 40 ms and neither is. Flags are recomputed from stored timings, so moving the slider never loses data. Each log line also shows the time since the previous release, which helps separate a bouncing switch from a real double tap.

A notched wheel typically sends one wheel event per notch, and that is what "Scroll up" and "Scroll down" count. Trackpads and free-spinning wheels send many small events per gesture, so their counts run higher. A **direction flip** is a wheel event in the opposite direction less than 150 ms after the previous one. Reversing a wheel that fast is uncommon in normal use, so repeated flips while you scroll steadily in one direction can point to a dirty or worn wheel sensor. A deliberate quick flick up and down can also trigger one, so judge by repeats, not a single flip. The delta is shown in the unit the browser reports (pixels, lines or pages). Chrome and Edge usually report pixels, while Firefox can report lines, so one notch may read differently across browsers.

"Browser double-clicks" counts the browser's own double-click event, which follows the operating system's double-click rule. Windows, for example, defaults to 500 ms between the two clicks, far longer than the gap this detector flags.

## Diagnosing a double-click fault

A double-click fault means one physical press produces two presses. Most mice put a small mechanical switch under each main button, and its metal contacts close when you press. As the contacts wear, or a film builds up on them, they can part and touch again a few milliseconds apart while you are still pressing. Optical switches have no metal contacts, so this explanation does not apply to them. Spec sheets quote anywhere from a few million to tens of millions of clicks, but that does not stop an individual switch from failing early.

| What you see | Likely cause | Next step |
| --- | --- | --- |
| Flags on one button, gaps under about 40 ms | Switch contacts bouncing | Try the fixes below, then the warranty |
| Flags on every button | Software, macro or driver | Close vendor apps, test on another PC |
| Flags only when you click fast | Normal fast clicking | Lower the limit to 40 ms and repeat |
| A button drops out while held | Worn switch or loose contact | Hold it and watch its tile |
| A button never turns green | No signal reaches the browser | Check cable, receiver and remapping |

To separate hardware from software, run the same 30 slow clicks on a second USB port and, if you can, on another computer. A fault that follows the mouse is in the mouse. A fault that stays behind is in the computer.

The test cannot read intent: if you tap twice in under 80 ms on purpose, it flags you. Slow, deliberate clicks make the result meaningful.

## Fixes to try before replacing a mouse

1. **Rule out software.** Quit vendor apps, autoclickers and macro tools, then retest. Some gaming mice have a debounce or click-delay setting, and raising it slightly can mask a mild fault at a small cost in responsiveness.
2. **Swap the connection.** Try another port without a hub, another cable if it detaches, or the wireless receiver on an extension lead.
3. **Retest on a second computer.** It settles the software question in two minutes.
4. **Read the warranty.** Terms vary by maker and country, and a switch that fails early may be covered. The copied report lists the flagged presses and their gaps.
5. **Decide on repair or retirement.** Replacing a switch takes soldering skill and opening the mouse may void the warranty, so it rarely pays off on a cheap model.

## Polling rate explained

Polling rate is how many times per second the mouse reports to the computer. Each report carries the movement since the previous one, so a higher rate means smaller steps between cursor updates. The interval is 1,000 divided by the hertz.

| Rate | Time between reports |
| --- | --- |
| 125 Hz | 8 ms |
| 500 Hz | 2 ms |
| 1,000 Hz | 1 ms |
| 2,000 Hz | 0.5 ms |
| 4,000 Hz | 0.25 ms |
| 8,000 Hz | 0.125 ms |

The estimate uses the browser's `pointerrawupdate` event, which reports pointer changes as soon as the browser receives them. It exists in Chromium browsers such as Chrome and Edge, on secure (HTTPS) pages only. Where it is missing, the box is hidden rather than showing a guess. The tool finds runs of continuous movement lasting at least 0.3 seconds, divides the updates in each run by its length, and keeps the highest.

Worked example: a run lasts 0.8 seconds and contains 801 updates. That is 800 intervals, so 800 ÷ 0.8 = 1,000 updates per second, which matches a 1,000 Hz setting. The figure snaps to a common rate within 15 percent of one, runs above 8,800 Hz are ignored as timing artifacts, and the estimate is capped at 8,000 Hz.

Slow movement reads low, because a mouse reports only while it moves. A busy computer, power saving and a weak wireless link can also delay reports, so take the highest reading from several fast runs.

## DPI, sensitivity and polling rate

| Term | What it controls | Changing it affects |
| --- | --- | --- |
| DPI (or CPI) | Sensor counts per inch of movement | How far the cursor travels |
| Sensitivity (game or system) | A multiplier applied after the sensor | How far the cursor or view travels |
| Polling rate | How often reports are sent | Smoothness and latency |

A common shorthand multiplies DPI by in-game sensitivity. At 800 DPI and a sensitivity of 0.5, the product is 400, and in the same game 400 DPI at 1.0 gives a similar speed. Pointer acceleration, such as Windows' "Enhance pointer precision", varies speed with movement and breaks such comparisons.

## Who uses a mouse test

- **Used-mouse buyers** run 30 slow clicks on every button and scroll both ways before paying.
- **IT support staff** test a reported sticky button on a spare computer to see whether the fault follows the mouse.
- **Gamers** confirm side buttons register after installing software and compare their polling rate with the setting they chose. Each button needs its own test, because a clean left button says nothing about the right one.

## Tips and common mistakes

- **Click slowly for the double-click check.** Fast clicking belongs in the [click speed test](/tools/click-speed-test).
- **Mind swapped buttons.** If you switched the primary button in system settings, the browser normally reports the swap, so the physical right button may show as Left.
- **Expect missing side buttons after remapping.** Vendor software that turns them into shortcuts hides them from the page.
- **Test the rest of the desk.** The [keyboard tester](/tools/keyboard-tester) catches keys that double-type, and the [dead pixel test](/tools/dead-pixel-test) checks the monitor.

## Privacy and limitations

The page reacts only to events over the test area and keeps the counts in memory, so closing the tab erases them. Only the detector limit and the scroll toggle are saved, in your browser's local storage.

The browser sees what the operating system and driver pass on, not the raw switch signal, so a fault hidden by the mouse's own firmware will not show. Browsers may round timestamps, so gaps of a few milliseconds are approximate. Back and forward blocking applies while the pointer is over the box and can vary by browser and driver. Touch input is ignored. This page is not affiliated with any mouse maker or browser vendor.
