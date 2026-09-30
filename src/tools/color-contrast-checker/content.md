## What this color contrast checker does

This color contrast checker measures how far apart a text color and a background color are in brightness and tells you whether the pair meets the contrast criteria in WCAG 2.2. You get the exact ratio, a pass or fail for normal text, large text and user interface components at both the AA and AAA levels, and a live preview of your text at five sizes.

When a pair fails, it also suggests the nearest colors that pass. The suggestions keep your hue and change only lightness, so a brand orange becomes a slightly deeper orange instead of a random dark brown. A second tab checks every text and background combination in a whole palette at once.

## How to use it

1. **Enter the text color** in the first field, or click the swatch beside it to open your browser's color picker. Type HEX (three to eight digits, `#` optional), `rgb()`, `hsl()`, `oklch()` or a CSS name such as `tomato`.
2. **Enter the background color** the same way. Under each field, chips show the color as HEX, RGB, HSL and OKLCH; click one to copy it.
3. **Read the result.** The **Contrast ratio** tile shows the ratio. The table beneath lists Pass or Fail for normal text, large text and UI components and graphics, each with the ratio it needs.
4. **Check the preview.** Five lines show your text at 14px, 16px, 18.66px bold, 24px and 32px bold, followed by a button outline, a dot and a bar in the text color. Change the **Sample text** to match your page.
5. **Fix a failing pair.** Under **Nearest passing colors**, choose a **Goal**: AA for normal text (4.5:1), AA for large text and UI (3:1) or AAA for normal text (7:1). Each card shows a before and after, the new ratio and a **Use these colors** button. The **Closest** badge marks the smallest change.
6. **Swap, reset or try an example** with the buttons under the fields, then use **Copy report**, **Copy CSS**, **Copy share link** or **Download report** to pass the result on.

To test many colors at once, switch to **Check a palette** and paste one color per line.

## How the contrast ratio is calculated

WCAG 2 works from relative luminance, a number from 0 (black) to 1 (white) that weights the three sRGB channels by how bright the eye finds them. Each channel is first converted to linear light:

```
c = channel ÷ 255
linear = c ÷ 12.92                       if c ≤ 0.04045
linear = ((c + 0.055) ÷ 1.055) ^ 2.4     otherwise

L = 0.2126 × R + 0.7152 × G + 0.0722 × B
ratio = (L_lighter + 0.05) ÷ (L_darker + 0.05)
```

Green carries the most weight and blue the least, which is why pure blue text on white passes easily and pure green does not. Ratios run from 1:1 (identical colors) to 21:1 (black on white).

**Worked example: white text on `#c9400a`.** The orange has channels 201, 64 and 10. Their linear values are 0.5841, 0.0513 and 0.0030, so L = 0.2126 × 0.5841 + 0.7152 × 0.0513 + 0.0722 × 0.0030 = 0.1611. White has L = 1. The ratio is (1 + 0.05) ÷ (0.1611 + 0.05) = **4.97:1**, which passes AA for normal text but not the 7:1 needed for AAA.

Some copies of the standard print 0.03928 as the cutoff instead of 0.04045. No 8-bit channel value falls between the two, so HEX and RGB colors give identical results.

Transparency is resolved first: translucent text is blended over the background, and a translucent background over white. The tool shows the final measured colors when that happens.

## WCAG 2.2 contrast thresholds

The contrast criteria are the same in WCAG 2.1 and 2.2.

| Criterion | Level | Applies to | Minimum ratio |
| --- | --- | --- | --- |
| 1.4.3 Contrast (Minimum) | AA | Normal text | 4.5:1 |
| 1.4.3 Contrast (Minimum) | AA | Large text | 3:1 |
| 1.4.6 Contrast (Enhanced) | AAA | Normal text | 7:1 |
| 1.4.6 Contrast (Enhanced) | AAA | Large text | 4.5:1 |
| 1.4.11 Non-text Contrast | AA | UI components and graphics | 3:1 |

**Large text** means at least 18 point, or at least 14 point and bold. In CSS pixels that is 24px, or about 18.66px bold (14 × 96 ÷ 72). WCAG does not define a numeric weight for bold, so checkers commonly treat 700 and above as bold. The ratio is never rounded: 4.499:1 does not meet 4.5:1, so this tool will not round a failing ratio up onto a threshold.

Text that is part of a disabled control, purely decorative, or part of a logo is exempt from the text criteria.

## Real pairs and their ratios

Every value below was computed with the formula above.

| Text | Background | Ratio | Result |
| --- | --- | --- | --- |
| `#000000` | `#ffffff` | 21:1 | AAA |
| `#595959` | `#ffffff` | 7:1 (7.0047) | AAA, barely |
| `#767676` | `#ffffff` | 4.54:1 | AA, the lightest gray that passes on white |
| `#777777` | `#ffffff` | 4.48:1 | Fails normal text, passes large text |
| `#949494` | `#ffffff` | 3.03:1 | Large text and UI only |
| `#ff0000` | `#ffffff` | 4:1 (3.9985) | Fails normal text, passes large text |
| `#00ff00` | `#ffffff` | 1.37:1 | Fails everything |
| `#ffffff` | `#c9400a` | 4.97:1 | AA |
| `#ffffff` | `#ff7a00` | 2.61:1 | Fails everything |

`#767676` and `#777777` differ by one step per channel, yet that step decides whether body text passes.

## Where the gray line falls on common backgrounds

Gray is the color most often picked by feel, so it is worth knowing where the line sits. The table lists the neutral gray closest to each background that still reaches each ratio. Every value was computed with the formula above.

| Background | Passes 3:1 | Passes 4.5:1 | Passes 7:1 |
| --- | --- | --- | --- |
| `#ffffff` white | `#949494` | `#767676` | `#595959` |
| `#f6f5f1` warm paper | `#8e8e8e` | `#707070` | `#535353` |
| `#121212` near black | `#616161` | `#7d7d7d` | `#9f9f9f` |
| `#000000` black | `#5a5a5a` | `#757575` | `#959595` |

The dark rows matter for dark mode. A gray that reads as a soft secondary color on white can drop below 4.5:1 once the page inverts, so light and dark themes each need their own check. Each gray in the table is the one closest to its background that passes; one step closer and it fails.

## How the nearest passing color is found

The suggestions search in OKLCH, a color space whose lightness axis tracks perceived brightness far better than HSL does. The tool converts your color to OKLCH, holds hue and chroma fixed, and runs a binary search along lightness, toward black and toward white, for the smallest move that reaches your goal. Where sRGB cannot hold that much chroma at a given lightness, chroma is reduced only as far as needed. Each candidate is rounded to an 8-bit color and re-measured, so the ratio shown is for the color you will actually paste.

For white text on `#ff7a00` (2.61:1), the nearest background change is `#bf5900` at 4.52:1 and the nearest text change is `#373737` at 4.56:1. Both are shown, because you may have to keep either the white label or the orange.

Sometimes neither color can reach the goal alone, such as mid-gray text on a mid-gray background at 7:1. The tool then moves both colors apart by the same share and offers that as one combined change.

## Fixing Lighthouse's "insufficient contrast" error

Lighthouse's accessibility audit reports **Background and foreground colors do not have a sufficient contrast ratio** and lists each failing element. Its checks rely on the axe-core engine and on the AA thresholds above.

1. Expand the audit and select a failing element. The details usually include the foreground and background colors, the font size and weight, and the ratio it expected.
2. Paste the two colors into this tool and pick the **Goal** that fits: 4.5:1 for normal text, 3:1 only if the element is truly large text.
3. Choose the closest suggestion, copy its HEX value, and change it in your stylesheet or design token.
4. Run Lighthouse again. One token change often clears many elements at once.

When the background is an image or a gradient, automated checks often cannot compute a single ratio and flag the element for manual review instead.

## Checking a whole palette

A design system with 12 colors has 132 possible text-on-background pairs. In **Check a palette**, paste the colors and the grid shows every pair with a sample, a ratio and a level label: AAA, AA, Large (3:1 or more, so large text and UI only) or Fail. Turn on **Fade pairs that fail AA for normal text** to see which combinations are safe for body copy, then export the grid with **Copy CSV** or **Download CSV**. The palette holds up to 24 colors.

## Who this helps

- **Front-end developers** fixing a Lighthouse or axe report need the nearest passing HEX to paste into a stylesheet.
- **Designers** can test a brand accent against white, paper and dark surfaces before anything is built.
- **Accessibility testers** can document a failure with both colors and the ratio using **Copy report**.

## Common mistakes

- **Testing the wrong colors.** Hover, focus, visited and dark-mode states each need their own check.
- **Ignoring opacity.** Text at 60% opacity is blended toward its background; the blended color is what counts.
- **Placeholder text.** It is still text. Light gray placeholders are a frequent failure, because the field's own border and label may pass while the hint does not.
- **Focus rings and icons.** Indicators and icons that carry meaning need 3:1 against the color next to them.
- **Text on photos.** Check the busiest part of the image, or put a solid or semi-opaque layer behind the text.
- **Links in body text.** If color alone separates a link from the text around it, one commonly cited technique asks for 3:1 between the two plus a second cue on focus or hover.

## APCA, WCAG 3 and what this tool measures

WCAG 3.0 is a working draft, not a finished standard, and as of 2026 the contrast method it will use has not been settled. APCA is a perceptual contrast algorithm that takes font size and weight into account. It was proposed for an early WCAG 3 draft, but published reports say it was later removed from the draft, and it comes with its own license and naming rules. This tool measures only the WCAG 2 ratio, which is what the current criteria and automated tools such as Lighthouse use.

## Privacy and limitations

Your colors, palette text, sample text and goal are kept in `sessionStorage`, which belongs to the current tab and is cleared when you close it. As you work, the address bar also gains a fragment after the `#` holding the colors, and that fragment is what **Copy share link** copies. Whoever opens the link sees those colors; the page makes no network request with them.

The limits are real. The tool reads sRGB colors, so an OKLCH color outside that gamut is adjusted and flagged, and a browser may map the same value a little differently. It cannot read pixels from an image, a gradient or a live web page, and it ignores font thinness, anti-aliasing, screen brightness and color vision differences. A passing ratio shows that two colors are far enough apart, not that a page is readable or accessible. Conformance depends on the whole page, and whether a law or contract requires a particular level is a question for a qualified adviser.
