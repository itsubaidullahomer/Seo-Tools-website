## What this WebP to JPG converter does

This free WebP to JPG converter turns .webp images into standard .jpg files without leaving the page. Drop a file, pick several from a folder, or paste an image with Ctrl+V, and each one is decoded and saved as a JPEG within seconds. You choose the quality, decide what color replaces transparent areas, and download one file or a batch as a ZIP. No watermark, no sign-up.

It is built for the moment a WebP will not go where you need it: a job portal, a marketplace listing, an older content management system or a photo lab. Files are processed in your browser; we do not upload or store them.

## How to convert WebP to JPG

1. **Add your files.** Drop .webp files on the dashed box, click it to browse, or press Ctrl+V (⌘V on a Mac) to paste an image. Pasted images are named pasted-image-1, pasted-image-2 and so on. A batch holds up to 50 files or 300 MB.
2. **Set the quality.** Drag the **JPG quality** slider, type a number, or press a preset: Small (70), Balanced (80), High (90) or Maximum (100). The line under the slider shows total size before and after.
3. **Choose the background** for transparent areas. White is the default; pick any color, or press White or Black. Opaque images are not affected.
4. **Optional:** pick .jpg or .jpeg as the extension, or switch on **Keep each JPG under a size limit** and enter the kilobytes.
5. **Download.** **Preview** shows the saved JPG at actual size, **Download JPG** saves one file, and **Download JPGs as ZIP** saves everything. **Clear all** frees the memory.

Changing a setting converts the finished files again after a short pause, so the sizes always match what you would download. Duplicate names get a -2 or -3 suffix, so nothing is overwritten. A file that is not really a WebP is converted anyway if the browser can decode it.

## What happens to your image during conversion

Three steps happen inside your browser tab.

1. **Decode.** The browser's own WebP decoder turns the file into a grid of red, green, blue and alpha (transparency) values. The tool also reads the header to see whether the WebP is lossy, transparent or animated.
2. **Flatten.** JPEG has no alpha channel, so the tool paints your background color across a blank canvas and draws the image on top, blending each pixel with `result = alpha × pixel + (1 − alpha) × background`.
3. **Encode.** The browser's JPEG encoder writes the canvas out at the quality you chose.

### A worked flattening example

Take one orange pixel, RGB (255, 120, 0), at 50% opacity, over the default white background:

- Red: 0.5 × 255 + 0.5 × 255 = 255
- Green: 0.5 × 120 + 0.5 × 255 = 187.5, which rounds to 188
- Blue: 0.5 × 0 + 0.5 × 255 = 127.5, which rounds to 128

The pixel becomes a soft peach, RGB (255, 188, 128). Over black it would be a dark brown, about (128, 60, 0), which is why a logo with soft edges shows a dark fringe on the wrong background. JPEG encoding adds a little rounding, so exact values can differ by a few levels.

### Does converting WebP to JPG lose quality?

Some, and no tool can avoid it. JPEG is always lossy: it works on 8 × 8 pixel blocks and discards fine detail the eye rarely notices. Higher settings discard less, but none reproduces a WebP pixel for pixel, and a lossy WebP has already been compressed once. To keep every pixel, use the [WebP to PNG converter](/tools/webp-to-png) instead.

### What is kept and what is not

The pixel dimensions and the visible picture are kept, with transparency blended into your background color. Animation beyond the first frame is not, and neither is metadata such as EXIF camera data, XMP and embedded color profiles. The JPG is written without a profile, so viewers treat it as standard sRGB. A badge such as "EXIF not copied" appears on rows whose WebP had any.

## Choosing a JPG quality

The slider runs from 10 to 100. It is an encoder setting, not a percentage of the original, so the same number gives different sizes on different pictures.

| Quality | Good for | Watch out for |
| --- | --- | --- |
| 95–100 | Files you will edit again, print or archive | Largest files, often bigger than the WebP by a wide margin |
| 85–94 | Photos where looks matter; a safe default | Little visible loss at normal size |
| 70–84 | Web pages, email, marketplace listings | Banding in skies, halos around text |
| Under 70 | Small thumbnails and previews | Visible blocks around edges |

JPEG usually stores color at half resolution (4:2:0 chroma subsampling), so saturated red or blue text on a plain background can look fuzzy at moderate quality. Browsers disagree on when to stop doing this: in a public discussion of the HTML standard, Chromium was reported to switch it off only at quality 100 and Firefox from 90 upward.

Open **Preview** and choose **Actual size** before settling on a low number: artifacts that vanish in a thumbnail are obvious at 100%.

## Getting a JPG under a size limit

Many upload forms cap file size. The US visa application photo upload, for example, has asked for a JPEG of 600 to 1,200 pixels square and no more than 240 KB; check the current instructions before uploading.

Switch on **Keep each JPG under a size limit** and enter the kilobytes. For each file the tool encodes at your chosen quality first. If that already fits, you get it. If not, it tries the lowest allowed quality (20), then narrows in on the highest quality that still fits: nine trial encodes at most. A green badge confirms the limit was met, and a note gives the final quality.

The tool does not resize. If a photo is still too big at quality 20, the row says so, and the fix is fewer pixels: halving the width and height cuts the pixel count to a quarter. The limit counts 1 KB as 1,000 bytes, so a file that fits also passes on sites that count 1,024. The [percentage calculator](/tools/percentage-calculator) shows how much smaller a file got.

## Why images save as WebP, and when you need JPG

WebP is an image format Google introduced in 2010. It covers lossy and lossless compression, transparency and animation, and Google's own comparison found lossy WebP files 25% to 34% smaller than JPEGs at the same measured quality. That is why many sites serve it, even when the address ends in .jpg: a server that sees WebP in your browser's list of supported formats may send it, and **Save image as** then saves the WebP.

JPG is still the safe choice for:

- **Job-application and government portals** that list only JPG or PDF.
- **Marketplace sellers** whose listing tools reject or badly re-compress WebP.
- **Bloggers** on older content management systems or newsletter tools.
- **Print buyers** ordering from labs that expect JPEG.

## JPG vs WebP at a glance

| | JPG | WebP |
| --- | --- | --- |
| Compression | Lossy | Lossy or lossless |
| Transparency | No | Yes |
| Animation | No | Yes |
| Support | Universal | All current major browsers, patchy in older software |
| Best for | Photos, sharing, strict upload forms | Delivering images on the web |

## Other ways to convert a WebP to JPG

- **Mac Preview.** Recent versions of macOS open WebP in Preview. Choose File, then Export, pick JPEG and drag the Quality slider. For a batch, select several images in the sidebar and use Export Selected Images. The slider has no numeric value, so results are hard to repeat.
- **Windows Paint.** Recent Windows 11 versions open WebP: File, Save as, then JPEG picture.
- **Command line.** ImageMagick, if built with WebP support: `magick input.webp -background white -flatten -quality 90 output.jpg`.

## Tips and common mistakes

- **Do not convert back and forth.** WebP to JPG to WebP compresses three times. Convert once, from your best copy.
- **Match the background to the destination.** A logo for a dark page needs a dark fill; white suits most documents and forms.
- **Use PNG for text, screenshots and flat logos.** JPEG artifacts cluster around hard edges, exactly where text lives.
- **Check the dimensions a form requires.** This tool does not resize.
- **Name files for the web.** The [slug generator](/tools/slug-generator) turns a phrase into a short, hyphenated name.

## Privacy and limitations

Decoding, flattening and JPEG encoding all run in your own browser tab, so the pictures you add never leave your device and we never see or keep them. The page itself and its ads load over the network like any website. The only thing remembered is your settings (quality, background color, extension and size limit), stored in your browser's local storage; clearing site data removes them.

Limits to know about:

- Very large images need a lot of memory, especially on a phone. If your browser cannot encode one, the row shows an error.
- Only the first frame of an animated WebP is converted.
- Your browser must be able to decode the file. Current Chrome, Edge, Firefox and Safari read WebP; HEIC photos usually work only in Safari.

WebP was developed by Google. This converter is an independent tool and is not affiliated with or endorsed by Google, Apple or Microsoft. Product names appear only to describe compatibility.
