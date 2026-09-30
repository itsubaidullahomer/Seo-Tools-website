## What this SVG to PNG converter does

This free SVG to PNG converter redraws a vector image as a PNG at exactly the size you choose. Upload one SVG file or a batch, or paste SVG code straight from your editor, and the PNG appears with a preview you can check before downloading. Transparency is kept by default. You can also switch to a solid background, output JPG, or write a print resolution into the file.

An SVG is a set of instructions (shapes, curves, colors) rather than a grid of pixels, so it has no fixed resolution. A PNG does. Converting means deciding how many pixels the picture gets and drawing the shapes onto that grid, which is why the size controls come first here.

## How to convert SVG to PNG

1. **Add the SVG.** On **Upload SVG files**, drop files on the dashed box or click it to browse. On **Paste SVG code**, paste markup into the SVG code box, or press **Load example**. A data:image/svg+xml address works too.
2. **Pick a size.** With **Scale**, drag the slider or press 1×, 2×, 3×, 4×, 6× or 8×. 1× is the size the SVG declares. With **Exact size**, type a width and height in pixels, keep **Lock aspect ratio** on to preserve the shape, or press a square preset such as 512 or 192.
3. **Choose the format.** PNG is the default. Switch to JPG for photographic artwork and set the quality. Turn on **Fill the background with a color** to replace transparency, or press White or Black.
4. **Optional: write a DPI value.** The density menu adds a resolution to the file header for print programs. It never changes the pixel size.
5. **Check the preview.** Flip the preview background between Checker, Paper and Ink to spot white artwork. Warnings appear under any file that uses features an image cannot draw.
6. **Download.** Use **Download PNG**, **Copy image** to paste the PNG into a document, or the ZIP button for a batch. **Clear all** empties the list. Files that share a name get a -2 or -3 suffix.

## What happens to your SVG during conversion

The tool checks that the markup is valid XML and adds the xmlns declaration if it is missing, which is common in code copied from a web page. It then works out the natural size the way a browser would: width and height if both exist, otherwise the viewBox, otherwise 300 × 150 pixels with a warning.

Some browsers, notably Firefox, have failed to draw an SVG that declares only a viewBox onto a canvas, because the image reports a size of zero. So the tool removes the old width and height, makes sure a viewBox exists, and writes the final pixel size on the root element. The result is loaded as an image, drawn on a canvas at that size and encoded.

The markup is never inserted into the page. It is loaded only through an image element, which runs no scripts and fetches no outside files.

### A worked example with sizes

Take an icon with `viewBox="0 0 120 120"` and no width or height. Its natural size is 120 × 120 pixels. At 2× the PNG is 240 × 240. Pressing the 512 preset gives 512 × 512, a scale of about 4.27, and 262,144 pixels, or about 1 MiB of raw data before PNG compression.

Now a large request: a 1,000 × 1,000 SVG at 8× would be 8,000 × 8,000, or 64 million pixels. The limit is 16,777,216 pixels (4,096 × 4,096), so the tool multiplies both sides by the square root of 16,777,216 ÷ 64,000,000, which is 0.512, and produces 4,096 × 4,096. A note on the file states what you asked for and what you got.

## Choosing a size for screens and print

**For screens**, think in device pixels. A phone with a pixel ratio of 3 shows a 24-pixel icon using 72 physical pixels, so 3× keeps it sharp. Twice the display size is a safe default, which is why the tool starts at 2×.

**For print**, pixels = inches × DPI. A logo that must print 4 inches wide at 300 DPI needs 1,200 pixels. For metric sizes, divide centimeters by 2.54 first: 10 cm at 300 DPI is 10 ÷ 2.54 × 300, or 1,181 pixels.

Browsers treat 1 inch as 96 CSS pixels, so an SVG declared as `width="4in"` has a natural size of 384 pixels, and reaching 1,200 pixels means a scale of 1,200 ÷ 384 = 3.125. You can skip the arithmetic: open **Size for print**, enter the width, unit and DPI, and press the button. It fills in the pixel width and writes the same DPI into the file.

## Common PNG sizes

| Size (pixels) | Typical use |
| --- | --- |
| 16 × 16 | Classic favicon in a browser tab |
| 32 × 32 | Favicon on high-density displays, shortcuts |
| 48 × 48 | Smallest favicon size Google Search documents: a square that is a multiple of 48 pixels |
| 180 × 180 | Apple touch icon for the iPhone home screen |
| 192 × 192 | Android home-screen icon in a web app manifest |
| 512 × 512 | Large web app icon, avatars, many upload forms |
| 1024 × 1024 | Master icon, app store artwork |

Requirements change, so check the current guidance of the platform you are uploading to.

## Transparency, JPG and background colors

PNG has an alpha channel, so each pixel can be transparent, opaque or anything between, and the converter keeps that by default. JPG stores no alpha, and a canvas saved straight to JPG turns transparent areas black. The tool avoids that by painting a background first, white unless you pick another color.

If you do not know where the image will be used, keep the PNG transparent. If you must pick a color, use the one it will sit on, and check readability with the [color contrast checker](/tools/color-contrast-checker).

## Why text, fonts and images can look different

Browsers treat an SVG loaded as an image as a sealed box: scripts are disabled and files referenced by address are not loaded.

- **Fonts.** Text is drawn with fonts installed on your device. A font loaded from a web address or a linked stylesheet is ignored and another font is substituted, so letters change width and text can overflow its box.
- **Linked images.** A picture referenced by file name or web address is missing in the PNG. Pictures embedded as base64 data work.
- **Stylesheets.** An @import rule or linked stylesheet is not followed, but a style element inside the SVG is fine.

The tool scans the code and lists what it found, including font names. The dependable fixes are to convert text to paths (outlines), embed pictures as base64 data, and paste CSS into the file instead of linking it. Most design tools offer these as export options: look for outlined text in Figma, fonts-to-outlines and embedded images in Illustrator's SVG options, and Path, then Object to Path in Inkscape (menu names vary by version). Keep a viewBox on the root element so the drawing scales to any size.

## Who uses it, and for what

- **Front-end developers** make favicon and web app icons from one logo.
- **Designers** send a PNG when a client's software cannot open SVG, or place artwork in a slide or email signature.
- **Marketers** prepare images for email and social uploads, where many services take PNG and JPG but not SVG.
- **Print users** hit the exact pixel width a template or print shop asks for. For a WebP source, use the [WebP to PNG converter](/tools/webp-to-png) or [WebP to JPG converter](/tools/webp-to-jpg); for CSS sizing, [PX to REM](/tools/px-to-rem) helps.

## Tips and common mistakes

- **Choose the largest size you will need now.** Enlarging a PNG later blurs it, while the SVG can be redrawn sharp at any size. Keep it as your master.
- **A white logo can look empty.** On a light preview it is invisible. Switch the preview to Ink before assuming something broke.
- **Skip JPG for logos.** Compression leaves speckles around sharp edges.
- **Expect a bigger file.** A simple SVG is a tiny text file, while the PNG stores every pixel. Animation is not kept: the PNG captures the starting frame.

## Privacy and limitations

Your browser reads each file and draws it on your device, so the SVG and the PNG are not sent to us. Your size, format, background color and DPI choices are remembered in this browser's local storage, and pasted code is kept only until the tab closes.

The limits are real:

- Output is capped at about 16.8 million pixels and 16,384 pixels on one side. Larger requests are scaled down with a note.
- A batch holds up to 50 files or 100 MB, and one file up to 20 MB. Compressed .svgz files need a browser that can unzip them.
- Scripts, animation and externally linked fonts, pictures and stylesheets are not reproduced.
- HTML inside foreignObject depends on the browser and may fail to export.
- Colors are drawn on the browser's standard sRGB canvas, so colors outside sRGB (Display P3 values, for example) are converted to fit.
- A DPI value lives only in the file header, and whether a program honors it is up to that program.
- A file with heavy filters can be slow or fail on a phone.

Figma, Illustrator, Inkscape and other product names are trademarks of their owners and appear only to describe compatibility. This converter is independent and not affiliated with or endorsed by any of them.
