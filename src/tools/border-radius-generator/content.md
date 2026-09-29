## What this border radius generator does

This border radius generator lets you shape an element's corners visually and copy the CSS that produces them. Drag the eight handles around the preview or use the sliders, and the code updates as you go. You can round all four corners with one value, set each corner on its own, or switch to elliptical mode, where every corner has a separate horizontal and vertical radius. That is how organic blob shapes, leaves and eggs are made.

It also converts between px and % without changing the shape, warns you when radii overlap and the browser quietly scales them down, reads back CSS you already have, and writes Tailwind classes next to the plain CSS. The preview is drawn by your browser's own renderer, so it shows what the CSS will do.

## How to use it

1. **Start from a preset or the default.** The tiles in the *Presets* section load shapes such as Pill, Circle, Leaf, Teardrop and three Blob variants. Some also set a matching box size.
2. **Choose how the corners are linked.** *All corners* moves every value together. *Each corner* gives every corner one radius. *Elliptical (8 values)* unlocks a horizontal (x) and a vertical (y) radius for each corner.
3. **Pick the unit.** Switching between px and % converts the numbers so the shape does not change.
4. **Set the radii.** Drag the dots outside the shape's edges or type into the slider boxes. A focused handle also responds to the arrow keys (hold Shift for steps of 10), Home and End.
5. **Set the box size.** Enter a width and height in pixels. Percentages and overlap both depend on it, so use the size of your real element.
6. **Read the readout.** The four tiles under the preview show each corner's drawn width and height in pixels, and *Show corner guides* draws the ellipse each curve follows.
7. **Copy the code.** Under the controls, choose *CSS*, *Longhand* or *Tailwind*, then press the orange copy button or *Download .css*. *Reset* restores the defaults.

To edit CSS you already have, paste a declaration, the four longhand `border-top-left-radius`-style lines, a bare value or a `rounded-[...]` class into *Load existing CSS* and press *Load values*. *Random blob* makes a new organic shape. Your settings are remembered in this browser.

## The border-radius syntax: one to four values, then a slash

Corners are listed clockwise from the top-left. Fewer than four values repeat the way they do in `margin` and `padding`:

| Values | Top-left | Top-right | Bottom-right | Bottom-left |
|---|---|---|---|---|
| `a` | a | a | a | a |
| `a b` | a | b | a | b |
| `a b c` | a | b | c | b |
| `a b c d` | a | b | c | d |

A slash splits the value into two lists. Everything before it is the **horizontal** radius of each corner and everything after it is the **vertical** radius. Without a slash each value sets both.

```
border-radius: 10px 40px / 20px;

top-left      10px wide x 20px tall
top-right     40px wide x 20px tall
bottom-right  10px wide x 20px tall
bottom-left   40px wide x 20px tall
```

The generator drops the slash when both lists match and collapses each list to its shortest form, so a leaf comes out as `0 100%` rather than `0 100% 0 100%`. The *Longhand* tab writes the same shape as four `border-top-left-radius`-style lines, where two space-separated values mean horizontal then vertical.

## How the browser draws a corner

Each corner is a quarter of an ellipse whose two radii are the values you set. When they match, the quarter is a circle. When they differ, the curve is flatter in one direction, which gives leaf and egg shapes.

Radii can also be too big. If the two radii along a side add up to more than that side, browsers compute a factor for every side and multiply all eight radii by the smallest one:

```
f = min( side length / sum of the two radii on that side )
if f < 1: every radius = radius x f
```

Take a 200 x 100 box with `border-radius: 80px`. The left and right sides are 100px long but need 160px, so f = 100 / 160 = 0.625 and every corner is drawn at 50px, exactly half the height. The generator shows the factor in a notice, draws the scaled shape, and offers *Apply the scaled values* to write the real numbers back.

## Percentages versus pixels

Percentages are measured against the border box: horizontal radii against the width, vertical radii against the height. On a 320 x 220 box, `20%` is 64px wide and 44px tall, so the corner is elliptical even though you typed one number. Pixels stay the same when the element resizes.

| Goal | Use | Why |
|---|---|---|
| Buttons, inputs, cards | px | Corners keep a consistent size at any width |
| Circle or round avatar | `50%` on a square box | Both radii are half a side |
| Pill or capsule | `9999px` | Any large value is scaled down to half the height |
| Blob, leaf, egg | % | The shape scales with the element |

The pill row matters. `50%` on a wide button gives an ellipse, because the horizontal radius is half the width. A large pixel value works because of the overlap rule above.

## Building blob shapes

A blob is an elliptical border radius with eight percentages. The rule that keeps it smooth is that the two radii meeting on each side add up to 100%. In `30% 70% 70% 30% / 30% 30% 70% 70%` on a 300 x 200 box, every side is 30% + 70%. The four corner ellipses are 90 x 60, 210 x 60, 210 x 140 and 90 x 140 pixels, and they meet edge to edge with no flat segments.

Nudge a pair below 100% and the curves stop short, leaving a straight edge. Push it above and they overlap, so the whole shape shrinks. *Random blob* only generates valid combinations. Because every value is a plain number, you can animate between two blobs with a CSS `transition` or keyframes.

## Tailwind rounded classes

The Tailwind tab always shows the **arbitrary value**, which is exact, for example `rounded-[30%_70%_70%_30%/30%_30%_70%_70%]`, where underscores stand for spaces. For uniform pixel radii it adds the **nearest scale class** and how far it is from your value. For shapes where the corners differ it adds **per-corner classes** such as `rounded-tl-xl`, using a scale name wherever one matches exactly.

| Class | Radius |
|---|---|
| `rounded-none` | 0 |
| `rounded-xs` | 0.125rem (2px) |
| `rounded-sm` | 0.25rem (4px) |
| `rounded-md` | 0.375rem (6px) |
| `rounded-lg` | 0.5rem (8px) |
| `rounded-xl` | 0.75rem (12px) |
| `rounded-2xl` | 1rem (16px) |
| `rounded-3xl` | 1.5rem (24px) |
| `rounded-4xl` | 2rem (32px) |
| `rounded-full` | `calc(infinity * 1px)`, a pill on any box |

These are the default theme values of Tailwind CSS v4. Version 3 named the small steps differently, so a class copied from an older project may not mean the same size, and a project that overrides the theme will differ from this table.

## Common shapes and their values

| Shape | Value | Box |
|---|---|---|
| Card | `12px` to `16px` | any |
| Pill | `9999px` | any |
| Circle | `50%` | square |
| Leaf | `0 100%` | square |
| Teardrop | `0 50% 50%` | square |
| Tab | `16px 16px 0 0` | wide |
| Speech bubble | `24px 24px 24px 4px` | wide |
| Egg | `50% / 60% 60% 40% 40%` | portrait |
| Blob | `30% 70% 70% 30% / 30% 30% 70% 70%` | square |

## Two worked examples

**A speech bubble.** Load the *Bubble* preset, `24px 24px 24px 4px` on a 320 x 160 box. Three corners are generous and the bottom-left corner is nearly square, so the eye reads that corner as the point the bubble speaks from. Nothing overlaps: the left side needs 24px + 4px = 28px of its 160px. Flip which corner is small to move the tail.

**An avatar that works at any size.** Give the image `aspect-ratio: 1` and `border-radius: 50%`. Both radii of every corner are half a side, so the same rule draws a circle on a 40px thumbnail and a 400px profile photo, and only the box changes. If the source image is not square, add `object-fit: cover` so it fills the circle instead of stretching.

## Squircles and corner-shape

The corners of many app icons are squircles, built from a superellipse whose curve eases into the straight edge gradually. `border-radius` can only draw circular or elliptical arcs, so no combination of values reproduces that curve, and a large radius such as 30% is only an approximation. That is why the *Soft square* preset is not called a squircle.

The CSS property `corner-shape: squircle` draws the real shape. When we checked in June 2026 it worked in Chrome and Edge 139 and later, and Firefox and Safari did not support it. The toggle under the code adds the line as progressive enhancement: browsers that do not know it ignore it and keep the normal rounded corner. Check MDN or caniuse before you rely on it.

## Tips and common mistakes

- **Clip the children.** An image or colored header inside a rounded box keeps square corners unless the parent has `overflow: hidden` or the child has its own radius.
- **Nest radii sensibly.** For a rounded box with padding, an inner radius equal to the outer radius minus the padding looks concentric. Reusing the outer number makes the gap look uneven at the corners.
- **Tables need separate borders.** Rounded corners do not show on a table whose `border-collapse` is `collapse`. Use `border-collapse: separate` with `border-spacing: 0`, and round the corner cells or wrap the table in a rounded, clipped container.
- **Negative values are invalid** and make the browser drop the whole declaration.

## Privacy and limitations

Everything runs in your browser. Nothing you enter is uploaded, and your last settings are stored only in this browser's local storage.

Pixel values are relative to the box size you enter, so a value tuned on a 320px box will look different on a larger element. Values are capped at 9999px or 100%. One declaration cannot mix units here, so imported values that combine px and % are converted to px for the current box size. Tailwind CSS is a trademark of its owner, and this site is independent and not affiliated with it.
