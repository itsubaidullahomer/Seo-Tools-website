## What this px to rem converter does

This px to rem converter, which doubles as a rem calculator, turns pixel values into rem units, and rem values back into pixels, using whatever root font size your project has. Type `24` and it shows `1.5rem`. Switch to the **REM to PX** tab, type `1.5`, and it returns `24px`. The root size is editable because rem is not a fixed length. It is a multiple of the font size on the `html` element, and that is 16px in browsers only until a stylesheet or a person changes it.

Around the basic conversion you get a reference table for every whole pixel from 1 to 128, the result as a CSS declaration and a Tailwind class, and a bulk converter that converts every px length in a pasted block of CSS while leaving comments, strings, `url()` paths, selectors and media queries alone unless you ask otherwise.

## How to use it

1. **Choose a direction** with the PX to REM and REM to PX tabs. The page opens on px to rem. To bookmark the reverse direction, add `#rem-to-px` to the page address.
2. **Enter a value.** Plain numbers work, and so do `16px`, `1.5rem`, `.5` and negatives. A different unit, such as `12pt`, is flagged instead of guessed at.
3. **Check the root font size.** 16px is the usual browser default. The buttons set 10, 12, 14, 16 or 18, and any number above 0 up to 1000 is accepted.
4. **Read the result panel.** The headline is the converted value, with the arithmetic beneath it. Lines for pixels, rem, em, a CSS declaration and a Tailwind class each have a copy button.
5. **Adjust Output options** if needed: the CSS property, Tailwind version 3 or 4, decimal places (0 to 6, default 4) and the parent font size for the em line.
6. **Convert CSS in bulk** below. Paste into the left box or press *Load sample*. The converted CSS appears on the right with copy and `.css` download buttons, and four counters show what was converted, left alone or skipped.
7. **Use the reference table** for lookups. The row matching your pixel value is highlighted, and *Copy table as CSV* exports it.

## The formula, with worked examples

```
rem = px ÷ root font size
px  = rem × root font size
```

With the 16px default the arithmetic is easy to check by hand. The common case of 16px to rem is simply 1rem, because the pixel value equals the root size:

| Pixels | Working | Rem |
|---|---|---|
| 16px | 16 ÷ 16 | 1rem |
| 13px | 13 ÷ 16 | 0.8125rem |
| 15px | 15 ÷ 16 | 0.9375rem |
| 22px | 22 ÷ 16 | 1.375rem |
| 100px | 100 ÷ 16 | 6.25rem |
| 0.5px | 0.5 ÷ 16 | 0.03125rem |

Some results never terminate. With an 18px root, 10px is 10 ÷ 18 = 0.5555…rem, shown as 0.5556rem at four decimals, and the result panel says when it has rounded.

The root changes everything. At a 10px root, 24px is 2.4rem and 14px is 1.4rem, and 1.5rem is 15px instead of 24px. The same CSS value renders at different sizes depending on the root, which is why a converter needs the root as an input.

## Px, rem and em: what they measure

A **pixel** in CSS is a fixed reference length, not a physical screen dot. It does not react to a person's text preferences.

A **rem** ("root em") is relative to the computed font size of the `html` element, usually the browser default of 16px. Change the root and everything written in rem rescales at once.

An **em** is relative to the font size of the element it is used on, or to the parent's size inside `font-size` itself. In `padding` it means the element's own size, so a button with `font-size: 20px; padding: 0.5em 1em` gets 10px of vertical and 20px of horizontal padding.

Em inside `font-size` also compounds down the tree. Take three nested lists, each set to 1.2 times its surroundings, starting from 16px:

| Level | With 1.2em | With 1.2rem |
|---|---|---|
| Outer list | 19.2px | 19.2px |
| Second list | 23.04px | 19.2px |
| Third list | 27.648px | 19.2px |

Em suits components that should scale with their own text. For global sizes, rem avoids the surprise. The em line in the result panel divides by a parent size you can set, so you can compare both.

## Why rem respects font-size settings

Browsers let people choose a default text size. Sizes in rem, em, percentages or keywords follow it. A font size written in px stays put when someone raises the default to read comfortably.

This matters for accessibility. WCAG 2.x success criterion 1.4.4, Resize Text (level AA), expects text to be resizable up to 200 percent without assistive technology and without losing content or function. Browser zoom scales pixel text too, so px is not an automatic failure. What px cannot do is follow a larger default text size, and rem can. Testing at 200 percent zoom and with a larger default size are two separate checks. Size is only half of readable text, so check color pairs with the [color contrast checker](/tools/color-contrast-checker) as well.

## Common sizes at a 16px root

| Pixels | Rem | Tailwind spacing | Tailwind text |
|---|---|---|---|
| 8px | 0.5rem | `p-2` | none |
| 10px | 0.625rem | `p-2.5` | none |
| 12px | 0.75rem | `p-3` | `text-xs` |
| 14px | 0.875rem | `p-3.5` | `text-sm` |
| 16px | 1rem | `p-4` | `text-base` |
| 18px | 1.125rem | `p-4.5` (v4 only) | `text-lg` |
| 20px | 1.25rem | `p-5` | `text-xl` |
| 24px | 1.5rem | `p-6` | `text-2xl` |
| 28px | 1.75rem | `p-7` | none |
| 32px | 2rem | `p-8` | none |
| 36px | 2.25rem | `p-9` | `text-4xl` |
| 48px | 3rem | `p-12` | `text-5xl` |
| 64px | 4rem | `p-16` | none |
| 96px | 6rem | `p-24` | `text-8xl` |
| 128px | 8rem | `p-32` | `text-9xl` |

The table on the page runs from 1 to 128 and recalculates for your root size.

## Tailwind's rem scale

Tailwind spacing utilities use a 0.25rem step. At a 16px root one step is 4px, so dividing pixels by 4 gives the class number: 24px is `p-6` and 48px is `h-12`.

Version 4 derives spacing from one variable and accepts multiples of 0.25, so 13px is `p-3.25`. In Tailwind 4.3, `p-0.75`, `p-2.75` and `p-12.5` generate CSS while `p-0.125` and `p-0.1` do not. Version 3 has a fixed list of steps that skips values such as 13px and 15px, so the tool shows the nearest step beside an exact arbitrary class like `p-[0.8125rem]`.

Text sizes use named steps in both versions, from `text-xs` (0.75rem) to `text-9xl` (8rem), and each `text-*` class also sets a default line height. If your theme overrides the scale, treat these mappings as a starting point.

## Converting a whole stylesheet

The bulk section is pattern-based but aware of CSS structure, not a blind find and replace:

- **Protected regions.** Comments, quoted strings and `url()` contents are masked first, so `url("/img/card-16px.png")` keeps its path.
- **Selectors and names.** Only values change. A class such as `.w-16px` or a property name is never touched.
- **Media and container queries.** Conditions like `(min-width: 768px)` are skipped by default. Rem in a media query is measured against the browser's initial font size, not the root size in your CSS, so at a 10px root a converted `76.8rem` would fire at 1228.8px instead of 768px. Turn the toggle on only with a 16px root, where 768px is 48rem.
- **Ignore list.** The default `0, 1px` leaves zero and hairline borders as written. Signs are ignored, so `1` also protects `-1px`.
- **Skipped properties.** List names such as `box-shadow, border-width, outline*` to keep them in px. An asterisk matches any characters.
- **Whitespace.** Line breaks and indentation come back exactly as pasted.

Values inside `calc()`, `clamp()` and `var()` fallbacks, shorthand such as `font: 16px/24px`, custom properties and Sass or Less variables are all converted.

## A worked example: one component, before and after

Take the card from the built-in sample and convert it at a 16px root with the default settings. The border stays at `1px` because `0` and `1px` are on the ignore list, and the comment and the `url()` path are untouched.

| Declaration | Converted |
|---|---|
| `width: 320px` | `width: 20rem` |
| `padding: 24px 16px` | `padding: 1.5rem 1rem` |
| `border: 1px solid #d9d4c7` | unchanged (ignore list) |
| `border-radius: 12px` | `border-radius: 0.75rem` |
| `font: 600 24px/32px "Inter", sans-serif` | `font: 600 1.5rem/2rem "Inter", sans-serif` |
| `letter-spacing: -0.5px` | `letter-spacing: -0.0313rem` |

The last row shows the rounding trade-off. Half a pixel is exactly -0.03125rem, and four decimals shortens it to -0.0313rem, which is about 0.501px. That difference is invisible on screen. If you would rather not round at all, raise the decimal places under Output options. The `box-shadow` in the sample is converted too, so list it under skipped properties if you want shadows to stay in px.

## Tips and common mistakes

- **Set the root as a percentage.** `html { font-size: 10px; }` overrides the user's preference. Use `62.5%` (62.5% of 16 is 10, which you can confirm with the [percentage calculator](/tools/percentage-calculator)) so their setting still applies, and give the body a size such as `1.6rem`, because plain text would otherwise be 10px.
- **Keep px for hairlines and decoration.** A rem border grows and shrinks with the root, which is rarely intended for a 1px line. Small shadow offsets and images with a native pixel size can stay in px too.
- **Use em sparingly.** It compounds in nested elements, so reach for rem unless a component should follow its own font size.
- **Treat breakpoints separately.** Rem breakpoints react to a larger default text size and px ones do not. Either is valid, but convert them with a 16px root.
- **Convert fluid values with care.** In `clamp(16px, 2vw, 24px)` the px bounds can become rem, but the `vw` part stays. A rem component in the preferred value helps it respond to text zoom.
- **Round late.** Keep three or more decimals while working.

## Privacy and limitations

Conversion is plain arithmetic in this page's script, and nothing you type is sent to a server. Two small pieces of data are kept on your device. The CSS box and the two value fields are held in session storage, which survives a refresh but disappears when the tab closes. Your options (root size, decimals, Tailwind version, ignore and property lists) are saved in local storage until you press *Reset options* or clear site data.

The bulk converter is a careful pattern-based pass, not a full CSS parser. It converts `px` to `rem` or `rem` to `px` only, never `em`, `pt`, `vh` or other units. It does not evaluate expressions, so in `calc(2px * 3)` the `2px` is converted but nothing is simplified. Preprocessor syntax beyond plain `$variables`, `@variables` and `//` comments is not interpreted. The box holds up to 1,000,000 characters, values can reach 1,000,000,000, and root sizes go up to 1000px. Read the output before shipping it.

Tailwind is named only to describe its default scales. The page is not endorsed by its maintainers, and class names can change between releases, so check against your own version.
