## What this box shadow generator does

This box shadow generator builds a CSS shadow visually and hands you the finished code. Instead of a single shadow with four sliders, it works with layers: you can stack up to ten shadows on one element, reorder them, hide them, and tune each one's offset, blur, spread, color and opacity. A **Smooth generator** tab turns a single elevation number from 1 to 24 into a realistic multi-layer shadow, and sixteen presets give you a starting point.

Every change appears immediately on a sample card, shown on a light and a dark background side by side, and the code updates at the same moment as plain CSS, a CSS custom property, a Tailwind class or a Tailwind v4 theme entry. Colors can be entered as HEX, RGB, HSL or OKLCH.

## How to use it

1. **Start from a preset or the default.** The **Presets** strip loads a complete shadow into the editor.
2. **Select a layer** in the **Layers** tab; layer 1 is painted on top. The row buttons hide, reorder, duplicate or delete it, and **Add layer** appends a new one.
3. **Adjust the sliders** for the selected layer: **X offset**, **Y offset**, **Blur** and **Spread**, all in pixels. Type into the number box for an exact value. Switch **Inset** on to draw the shadow inside the box.
4. **Set the color.** Choose RGB, HEX, HSL or OKLCH above the field, then type a value or use the picker. OKLCH mode adds lightness, chroma and hue sliders. Opacity has its own slider.
5. **Try the Smooth generator tab** for a layered shadow from a few controls. Moving any control there rebuilds the layer stack; switch back to **Layers** to fine-tune the result.
6. **Match your design in Preview card:** set the card size and radius and the colors of the light and dark stages.
7. **Copy the code.** Choose **CSS**, **Variable**, **Tailwind** or **Theme**, then use **Copy** or **Download**. **Multi-line output** puts each layer on its own line. **Reset tool** restores the defaults.

## The box-shadow syntax

A shadow is written as up to six parts, and several shadows are separated by commas. The lengths must stay in the order offset-x, offset-y, blur, spread. The `inset` keyword and the color can each go at the start or the end of a layer, and this tool always writes `inset` first and the color last:

```css
box-shadow: inset 0 4px 12px -2px rgba(15, 23, 42, 0.2);
```

| Part | Required | What it does |
| --- | --- | --- |
| `inset` | No | Draws the shadow inside the padding edge, above the background and below the border and content. |
| X offset | Yes | Moves the shadow right (positive) or left (negative). |
| Y offset | Yes | Moves the shadow down (positive) or up (negative). |
| Blur radius | No, defaults to 0 | Softens the edge. Negative values are invalid. |
| Spread radius | No, defaults to 0 | Grows (positive) or shrinks (negative) the shadow before blurring. |
| Color | No | Any CSS color. If you leave it out, the browser uses the element's text color. |

The specification describes blur as a Gaussian blur whose standard deviation is half the blur radius, and it lets browsers approximate that, so a 24px blur fades out over roughly 24px on each side of the edge. Shadows follow `border-radius`, they never change the layout of the page, and they do not catch clicks.

### One side only

A negative spread shrinks the shadow and an offset pushes it back out on one side. `0 10px 8px -8px rgba(0, 0, 0, 0.45)` shrinks the shape by 8px on every edge, then moves it 10px down, so only the bottom edge peeks out. The **Bottom edge only** preset loads this.

## How layered shadows are built

A single shadow looks flat because real shadows are not uniform: close to an object they are small, dark and sharp, and further away they are larger, fainter and softer. Layering reproduces that by stacking shadows that grow together.

The Smooth generator uses these rules for layer *k* of *n*, with elevation *E*:

```
offset_k  = E × (k ÷ n)²      rounded to 0.5px below 10px, whole px above
blur_k    = offset_k × softness
spread_k  = −(blur_k × tuck)
alpha_k   = total opacity ÷ n
```

Squaring the index keeps the first layers tight while the last one reaches the full elevation. The defaults are elevation 12, 5 layers, total opacity 60%, softness 2 and edge tuck 15%, with a slate shadow color. That produces:

| Layer | Y offset | Blur | Spread | Opacity |
| --- | --- | --- | --- | --- |
| 1 | 0.5px | 1px | 0 | 12% |
| 2 | 2px | 4px | −0.5px | 12% |
| 3 | 4.5px | 9px | −1.5px | 12% |
| 4 | 7.5px | 15px | −2.5px | 12% |
| 5 | 12px | 24px | −3.5px | 12% |

Layer 3: (3 ÷ 5)² = 0.36, so 12 × 0.36 = 4.32, which rounds to 4.5px. Softness 2 makes the blur 9px, 15% of 9 is 1.35 and rounds to a −1.5px spread, and 60% ÷ 5 gives 12% opacity.

Two limits are worth knowing. The opacities are shared, not added, so 60% total does not mean a 60% dark edge: each layer is blurred and they overlap gradually. And very low elevations cannot hold many distinct layers, so at elevation 3 only two are used. The tool tells you when it caps the count.

## box-shadow or filter: drop-shadow()?

Both create shadows, but they measure different things.

| | `box-shadow` | `filter: drop-shadow()` |
| --- | --- | --- |
| Follows | The element's rectangular box and its `border-radius` | The painted pixels, including transparency |
| Spread and inset | Yes | No |
| Several shadows | Comma-separated list | One per function; chain several functions |
| Includes child content | No | Yes, the whole rendered element |
| Best for | Cards, buttons, inputs, modals | Transparent PNGs, SVG icons, speech bubbles |

If the shape is not a rectangle, use `drop-shadow()`. For everything else `box-shadow` is the better fit, and it is what this tool generates.

## Practical examples

- **Design-system maintainer.** Build three or four elevations, copy each as a **Variable** and name them `card`, `popover` and `dialog`. In the dark theme, override the same variables with stronger values.
- **Tailwind developer.** Use **Tailwind** for a one-off class, or **Theme** to get an `@theme` entry that creates a reusable `shadow-card` utility. Tailwind's shadow color utilities replace the color of every layer, so per-layer opacity is lost when you use them.
- **Designer handing off.** Set the card and background colors to your real surfaces in **Preview card**, then copy the OKLCH output so the shadow matches your palette. Tokens stored as JSON can be checked with the [JSON formatter](/tools/json-formatter).
- **CMS or page-builder user.** Paste the **CSS** output into a custom CSS field. It needs no prefixes.

## Small recipes worth copying

Shadows do more than lift cards. These four patterns come up constantly, and each can be rebuilt in the editor by setting the values shown:

| Goal | Value | Why it works |
| --- | --- | --- |
| Border that does not change layout | `0 0 0 1px rgba(15, 23, 42, 0.12)` | Zero offset and blur with a 1px spread draws a ring outside the box, and shadows take no space, so neighbors do not move. |
| Focus ring | `0 0 0 3px rgba(37, 99, 235, 0.5)` with `outline: 2px solid transparent` | The ring is the visible focus style, and the transparent outline shows up in forced-colors mode. |
| Top highlight on a button | `inset 0 1px 0 rgba(255, 255, 255, 0.6)` | A hard inset line at the top edge suggests a light source above. |
| Glow | `0 0 24px 2px rgba(255, 95, 31, 0.45)` | No offset, so the color spreads evenly around the box. |

The **Hairline ring** and **Orange glow** presets start from the first and last of these.

## Elevation guide

These are starting points on this tool's 1–24 scale, not a standard. Material Design defines its own elevation scale in dp and describes shadows as a combination of a key light and an ambient light, which is the same idea as tight-plus-soft layers.

| Elevation | Typical use |
| --- | --- |
| 1–2 | Inputs, chips and table rows that need a hairline of separation |
| 3–4 | Resting cards and buttons |
| 6–8 | Hovered or raised cards, sticky headers |
| 10–12 | Dropdown menus, popovers, tooltips |
| 16–24 | Dialogs, side sheets, dragged items |

Use the smallest elevation that separates the element from its background.

## Tips and common mistakes

- **Pure black looks dirty.** Use a dark tint of your background hue and keep each layer's opacity low, often 5% to 15%.
- **Do not rely on a shadow for focus.** In forced-colors modes such as Windows High Contrast, `box-shadow` is removed, so a shadow-only focus style disappears. Keep an `outline`, or add `outline: 2px solid transparent` beside the shadow; it becomes visible when forced colors are on. Aim for at least 3:1 contrast for the indicator.
- **Check the dark stage.** Shadows fade on dark surfaces. Raise the opacity, lighten the card surface or add a subtle border.
- **Shadows are clipped by ancestors.** A parent with `overflow: hidden` or a `clip-path` cuts them off. Add padding to the parent or move the overflow rule inward.
- **Do not animate large shadows directly.** Changing blur on hover repaints the shadow every frame. Put the larger shadow on a pseudo-element and transition its `opacity`. If you do transition `box-shadow`, keep the layers in the same order with the same `inset` flags in both states so each layer animates into its partner. When one list is shorter, the browser pads it with transparent shadows.
- **Blur is not free.** Keep blur under about 50px where you can and use fewer layers on long lists. The tool warns above 100px.
- **Rounded corners matter.** The shadow follows the corner radius, so settle the shape with the [border radius generator](/tools/border-radius-generator) first.

## Privacy and limitations

All calculations and the preview run in your browser. Nothing you enter is sent to a server. So that a refresh does not lose your work, the design is kept in your browser's session storage for that tab only. It is cleared when you close the tab, and **Reset tool** puts the defaults back at any time.

The preview is drawn by your own browser, and other browsers can approximate blur slightly differently. OKLCH is supported in current versions of Chrome, Edge, Safari and Firefox; choose RGB or HEX for older browsers. If an OKLCH color falls outside the sRGB range, the HEX, RGB and HSL outputs use the closest in-range color and the tool says so.

The Tailwind md and 2xl presets reproduce values from Tailwind CSS's default theme. Tailwind CSS and Material Design are trademarks of their owners, and this site is independent and not affiliated with either.
