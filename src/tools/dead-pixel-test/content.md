## What this dead pixel test does

This dead pixel test fills your whole screen with one flat color at a time, so a faulty pixel has nowhere to hide. Press "Start screen test" and the page goes full size and steps through black, white, red, green, blue and gray. A dark dot on white, a bright dot on black or an odd-colored dot on red, green or blue is a pixel fault.

Around the colors sit tools most screen test pages leave out: a locator grid that labels the screen like a spreadsheet, a calculator that compares your defect count with the ISO 9241-307 classes, extra screens for gradients and backlight bleed, and a stuck pixel fixer that stays off until you confirm a photosensitivity warning.

## How to use the dead pixel test

1. **Prepare the screen.** Wipe it with a dry microfiber cloth, raise the brightness, switch off night light or color filters, and dim the room for the black screen.
2. **Choose the screens.** "Screens to show" offers "Essential: 6 screens" or "Full: 15 screens", which adds cyan, magenta, yellow, two more grays, two step charts and two gradients.
3. **Start.** Press "Start screen test", or click a tile to begin on that color. The page goes fullscreen where the browser allows it.
4. **Move through the screens.** Click, tap, or press Space or the right arrow for the next one. The left arrow or a right-click goes back, keys 1 to 9 jump, and on a touch screen you tap the left edge for back or swipe.
5. **Scan slowly, corner by corner.** Press G to cycle the locator grid. Columns are lettered and rows numbered, so "C7" names one cell.
6. **Leave.** Press Esc, use the Exit button, or press and hold on a touch screen. A small bar with hints shows at the start, after each change and when the mouse moves; H pins it.
7. **Count and compare.** Enter what you found under "Count what you found and check the class". "Auto-advance" can change screens every 3, 5 or 10 seconds so you can stand back.

## Dead, stuck and hot pixels

A pixel is typically built from red, green and blue subpixels, and faults are named by what those subpixels do.

| Fault | What is wrong | What you see | ISO type |
| --- | --- | --- | --- |
| Dead pixel | All subpixels stay off | Black dot, clearest on white | Type 2 |
| Hot pixel | All three stay on | White dot, clearest on black | Type 1 |
| Stuck subpixel | One or two stay on or off | Colored dot, such as red or cyan | Type 3 |

The colors tell you which subpixel is at fault. On the red screen only red subpixels should glow, so a green, blue or white dot means another subpixel is stuck on, and a black dot means the red one is dead. Cyan, magenta and yellow each need two subpixels, so they expose a missing red, green or blue. Not every dot is a fault: dust on white looks like a dead pixel until you wipe it away.

## Backlight bleed and IPS glow

On an LCD, light can leak past the edges of a black screen, and two things cause it. Sit back in a dim room with the black screen up, then move your head slowly. A haze that shifts or fades is IPS glow, a property of the panel type. A bright patch locked to the same edge or corner is backlight bleed, which can come from uneven pressure on the panel. A little of either is common, so judge by whether it bothers you in dark scenes. OLED screens have no backlight, so use the gray screens to look for uneven wear instead.

## Gradients and banding: a worked example

The gradient screens draw a black-to-white ramp by giving each screen column its own level. Across a 1,920-pixel-wide screen an 8-bit ramp has 256 levels, so each should cover 1,920 ÷ 256 = 7.5 pixels. On a 3,840-pixel-wide screen each covers 15.

That is your yardstick. Stripes about that wide are the smallest steps the format allows; much wider stripes mean fewer than 256 levels reach your eye. Suspects are a 6-bit panel without dithering, a limited color range, a color profile or the graphics driver. Color management in your browser or operating system can also remap the ramp's exact values.

The step charts help too. "Near-black steps" shows levels 0 to 15 and "Near-white steps" shows 240 to 255. If the first three bars look identical, brightness, contrast or range settings are crushing shadow detail.

## Counting defects and the ISO classes

The ISO 9241-307 standard took over from ISO 13406-2 and sorts panels into four classes by faults allowed per million pixels. These are the figures manufacturers commonly quote; the standard's own text is sold by ISO, so read the maker's policy too.

| Class | Type 1 (always lit) | Type 2 (always dark) | Type 3 (stuck subpixel) |
| --- | --- | --- | --- |
| I | 0 | 0 | 0 |
| II | 2 | 2 | 5 |
| III | 5 | 15 | 50 |
| IV | 50 | 150 | 500 |

The calculator scales those rates to your panel. A 1920 × 1080 screen has 2,073,600 pixels, or 2.0736 million. Class II allows 2 × 2.0736 = 4.1472 Type 1 defects, so four pass and five do not; Type 3 allows 5 × 2.0736 = 10.368. Limits are not rounded, so the table shows 4.1 and 10.4. At 2560 × 1440 the Class II limits are 7.4, 7.4 and 18.4, and at 3840 × 2160 they are 16.6, 16.6 and 41.5.

Choose your size under "Panel resolution" or "Custom size", enter your counts, and each class shows "within" or "over". "Copy report" or "Download report" saves the result. The standard also limits clusters of neighboring defects, which this tool does not check, and return policies vary: some makers promise zero defects, some follow Class II.

## Testing a new monitor, laptop or phone

- **Monitor buyers.** Test on day one, inside the return window. Run all 15 screens, note grid cells such as "H6" for each fault, and photograph them.
- **Used laptop buyers.** Run the test with the seller present at full brightness. Check gray 25% for pressure marks near the hinge and edges.
- **Phone repair technicians.** After a screen swap, run the essential set in both orientations and at low brightness, where uneven tint shows most.
- **IT teams.** Run refurbished units and attach the downloaded report to the ticket.

## Can a stuck pixel be fixed?

A dead pixel almost never comes back, because the fault is in the hardware. A stuck or hot pixel sometimes does, and nobody can promise it. The stuck pixel fixer cycles red, green, blue, white and black in a small square that you drag over the faulty pixel, or across the whole screen if you pick "Whole screen".

Run it for the full minute, then recheck the color screens, and repeat a few times. If nothing changes, the fault is probably permanent and the warranty is the better route. This fixer flashes slowly for safety, so it may need more runs than faster tools, and we have no published success rate to quote. Pressing on the spot with a soft cloth is sometimes suggested, but it can cause new damage and void a warranty.

## Photosensitivity and safety

The fixer stays off until you tick the box in the warning dialog. It never changes color more than three times per second. The web accessibility guidelines (WCAG 2.3.1) say content should not flash more than three times in any one-second period unless the flashes are small or dim enough to fall under its thresholds. A flash counts as a pair of opposing changes, so three changes a second is at most about one and a half flashes. Staying under the limit lowers the risk but does not remove it.

The default flash area is a small square, the fixer stops itself after 60 seconds, and Esc, a tap or the Stop button ends it at once. It also ends if the tab is hidden, and it drops to one change per second when your system asks for reduced motion. Do not use it if you or anyone nearby may be sensitive to flashing images.

## Tips and common mistakes

- **Clean first.** Dust and fingerprints imitate dead pixels. A real fault is a sharp dot that a cloth cannot move.
- **Look closely.** One pixel on a 27-inch 2560 × 1440 monitor is about 0.23 millimeter across, so get near the glass or use a phone camera in macro mode.
- **Skip screenshots.** A screenshot captures the signal, not the panel, so a dead pixel never appears in one.
- **Retest later.** Faults can show up days after purchase, so run the test again inside the return window.
- **Check other hardware.** Try the [keyboard tester](/tools/keyboard-tester), the [mouse test](/tools/mouse-test) or the [click speed test](/tools/click-speed-test).

## Privacy and limitations

The test paints colors and reads nothing back. Your choices under "Screens to show", "Auto-advance", "Locator grid" and the fixer options are kept in this browser's local storage. The resolution and counts you enter live in session storage and vanish when the tab closes. Nothing is uploaded. The browser's screen size, pixel ratio and color depth are shown to you, and they enter a report only if you copy or download one. While a test is open the page asks the browser to keep the screen awake, where supported.

This is a visual check, not a measurement. A browser cannot read brightness, color accuracy, response time or true panel bit depth, and HDR or a television's picture processing can change how a flat color looks. Remote desktop and virtual machines show a copy of the screen, not the panel. On iPhone, Safari offers no fullscreen for a page like this, so the test fills the visible page and browser bars may remain. Class comparisons are informational, not a certified inspection.
