## What this WebP to PNG converter does

This free WebP to PNG converter turns .webp images into standard .png files without leaving the page. Drop a file, pick several from a folder, or paste an image with Ctrl+V, and each one is decoded and saved as PNG within seconds. Transparent backgrounds stay transparent, original file names are kept, and one click downloads a whole batch as a ZIP.

It is built for the moment a WebP file will not open where you need it: a slide deck, an older photo editor, a marketplace upload form or an email client. PNG is understood almost everywhere, so converting removes the friction. There is no watermark and no sign-up, and the only limit is the batch size: 50 files or 300 MB at a time. Files are processed in your browser; we do not upload or store them.

## How to convert WebP to PNG

1. **Add your files.** Drop .webp files on the dashed box, click it to browse, or press Ctrl+V (⌘V on a Mac) to paste an image from the clipboard. Pasted screenshots are named pasted-image-1, pasted-image-2 and so on.
2. **Watch the queue.** Two files convert at a time. Each row shows a progress bar, then the pixel size, the WebP type and the file size before and after.
3. **Decide what happens to transparency** (optional). By default the alpha channel is kept. To paint transparent areas with a solid color instead, switch on "Fill transparent areas with a solid color", then pick a color or press White or Black. Finished files are converted again automatically.
4. **Download.** Use **Download PNG** on a row to save one file, **Copy image** to put the PNG on your clipboard for pasting into a document, or **Download PNGs as ZIP** to save everything at once. **Clear all** empties the list and frees the memory.

If a file is not really a WebP, its row says what it is and converts it anyway when the browser can decode it; otherwise the row explains why and offers Try again. Files that would end up with the same name get a -2 or -3 suffix, so nothing is overwritten.

## What happens to your image during conversion

Everything happens in three steps inside your browser tab.

1. **Inspect.** WebP is a RIFF container, and its first bytes describe the image. The tool reads them to learn whether the picture is lossy or lossless, whether it has an alpha (transparency) channel, and whether it is animated. Animation is a single flag in the extended header, which is how the "first frame only" notice can appear before anything is converted.
2. **Decode.** The browser's own WebP decoder turns the compressed data into a grid of red, green, blue and alpha values.
3. **Encode.** Those pixels are written out as a PNG, which compresses them without discarding any values.

### A worked size example

A 1,200 × 800 pixel picture contains 960,000 pixels. With four 8-bit channels per pixel that is 3,840,000 bytes, about 3.7 MiB, of raw data whatever format the file uses. A lossy WebP can squeeze it into a few dozen kilobytes by discarding fine detail. PNG cannot discard anything, so its size depends on how predictable the pixels are: a flat-color logo shrinks to almost nothing in either format, while a textured photo produces a much larger PNG. A bigger file after conversion is normal, not a sign that something went wrong.

### Does converting WebP to PNG lose quality?

The conversion step does not. PNG keeps every pixel of the decoded image, so nothing more is thrown away. What it cannot do is restore detail that was already discarded. If the WebP was lossy, the PNG looks exactly like the WebP did, compression artifacts included. If it was lossless, for example one exported from a design tool, the PNG holds the same pixels as the original.

### What is kept and what is not

- **Kept:** pixel dimensions, every decoded pixel and the alpha channel.
- **Not kept:** animation beyond the first frame, and metadata such as EXIF camera data and XMP. The PNG is written fresh from the pixels.
- **Faint transparency:** some browsers premultiply color by alpha when they draw to a canvas, which can change the stored color of nearly invisible pixels. The tool avoids that path where the browser allows it, and the visible difference is negligible.

## Why do images save as WebP?

WebP is an image format Google introduced in 2010. One format covers lossy and lossless compression, transparency and animation, and a lossy WebP is typically smaller than a JPEG of similar visual quality, so pages load faster.

You end up with a .webp file because of content negotiation. When a browser asks for an image, it sends an Accept header listing the formats it can display, and image/webp is on that list in Chrome, Edge, Firefox and Safari. A server or CDN that sees it can reply with a WebP even when the address ends in .jpg or .png. When you choose **Save image as**, you get the file the server sent; the browser converted nothing.

## When you need PNG instead of WebP

- **Presentations and documents.** Slide tools, word processors and older publishing programs often handle PNG better than WebP.
- **Upload forms.** Marketplaces, print shops, government portals and some content management systems accept only JPG or PNG.
- **Design and editing.** Re-saving a lossy file repeatedly compounds the loss, while a PNG can be saved again and again without further loss.
- **Logos and icons with transparency.** PNG keeps the alpha channel and is accepted wherever a "transparent image" is requested.
- **Email.** Some mail clients do not display WebP inline, while PNG is shown almost everywhere.

If the destination wants a JPG instead, use the [WebP to JPG converter](/tools/webp-to-jpg). JPG has no transparency, so pick PNG whenever the background matters.

## PNG vs WebP at a glance

| | PNG | WebP |
| --- | --- | --- |
| Compression | Lossless only | Lossy or lossless |
| Transparency | Yes, with an alpha channel | Yes, in both lossy and lossless modes |
| Animation | Not in ordinary PNG files | Yes |
| Maximum size | Far beyond practical limits | 16,383 × 16,383 pixels |
| Support | Universal | All current major browsers, patchy in older software |
| Best for | Screenshots, logos, editing masters, pixel art | Delivering photos and graphics on the web |

## Other ways to open or convert a WebP file

- **A web browser.** To simply open a WebP file, drag it into a Chrome, Edge, Firefox or Safari window (current versions of all four display WebP). This shows the image but does not give you a PNG.
- **Mac Preview.** Recent versions of macOS (Big Sur and later) can open WebP in Preview. Choose File, then Export, and pick PNG. It is one image at a time unless you open several and use Export Selected Images.
- **Windows Paint and Photos.** On Windows 11, Paint opens WebP: use File, Save as, then PNG. The Photos app and File Explorer thumbnails may need the free WebP Image Extensions from the Microsoft Store. Each file is a separate manual step.
- **Image editors.** Recent versions of Photoshop and GIMP open WebP; older versions may need a plug-in.
- **Command line.** Google's libwebp tools include `dwebp input.webp -o output.png`, and ImageMagick can do `magick input.webp output.png`. Both suit automation and very large batches.

Doing it here means nothing to install and no extension to hunt for, which matters most when you have many files.

## Tips and common mistakes

- **Do not expect sharper detail.** A PNG cannot recover what lossy compression removed; for higher quality, go back to the original.
- **Do not round-trip through JPG.** It adds a second round of lossy compression and drops transparency. Keep PNG as the intermediate format.
- **Check transparency on a checkerboard.** If a converted logo shows a black or white box in another program, that program is not displaying the alpha channel. The previews here sit on a checkerboard so you can tell the difference.
- **Keep PNG for editing, WebP for the web.** A PNG photo on a web page usually makes it slower. Convert for compatibility and keep the WebP for delivery.
- **Rename before publishing.** For a website, a short lowercase name with hyphens is easiest to manage. The [slug generator](/tools/slug-generator) turns a phrase into one.
- **Split huge batches.** A phone has far less memory than a laptop. If a large file fails, try it alone or on a desktop.

## Privacy and limitations

Files are processed in your browser; we do not upload or store them. The page and its ads load over the network like any website, but the images you add are decoded and re-encoded on your own device. The only thing remembered is the fill setting, kept in your browser's local storage.

Limits to know about:

- A batch holds up to 50 files or 300 MB. Extra files are skipped with a message.
- Very large images, up to the 16,383 × 16,383 pixel WebP maximum, need a lot of memory. If your browser cannot handle one, the row shows an error.
- Only the first frame of an animated WebP is converted.
- Metadata is not copied to the PNG.
- Your browser must be able to decode the file. Current versions of Chrome, Edge, Firefox and Safari read WebP; HEIC photos usually work only in Safari.

WebP was developed by Google. This converter is an independent tool and is not affiliated with or endorsed by Google, Apple, Microsoft or Adobe. Product names appear only to describe compatibility.
