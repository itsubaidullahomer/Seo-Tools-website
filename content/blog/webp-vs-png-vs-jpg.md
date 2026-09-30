---
title: "WebP vs PNG vs JPG: Which Image Format Should You Use?"
description: "WebP vs PNG vs JPG: use JPG for photos that must open anywhere, PNG for text and edits, WebP for smaller web files. Backed by measured byte sizes."
date: "2026-09-30"
updated: "2026-09-30"
tags: [webp, png, jpg, image-formats, web-performance]
relatedTools: [webp-to-png, webp-to-jpg, percentage-calculator]
---
Use JPG for photographs that have to open anywhere, PNG for screenshots, text and anything you will edit again, and WebP for images on web pages you control. In this guide's tests, a lossy WebP of a photo-like image came out 23% to 37% smaller than a JPG at about the same measured quality, depending on the JPG encoder. The catch is the destination: if an upload form, editor or print lab rejects WebP, fall back to JPG or PNG.

*Last reviewed September 30, 2026.*

## Quick answer

- **Photo on a web page:** lossy WebP, with a JPG copy for older software.
- **Photo for email, print or upload forms:** JPG.
- **Screenshot, text or logo:** PNG or lossless WebP (SVG if the logo is vector).
- **Transparency:** PNG or WebP. **Animation:** animated WebP or APNG (GIF also works but is limited to 256 colors per frame). JPG does neither.
- **A file will not open:** the [WebP to PNG converter](/tools/webp-to-png) keeps every pixel and transparency; the [WebP to JPG converter](/tools/webp-to-jpg) is smaller but flattens transparency.

## What each format does differently

Three properties settle most choices: compression, transparency and animation.

| | JPG | PNG | WebP |
| --- | --- | --- | --- |
| Compression | Lossy only | Lossless only | Lossy or lossless |
| Transparency | No | Yes | Yes, in both modes |
| Animation | No | Animated PNG (APNG) | Yes |

Lossy compression discards detail the eye is unlikely to miss, so photographs shrink a lot and every re-save costs a little more. Lossless compression keeps every pixel but cannot squeeze noisy photographic detail far. WebP offers both.

As of this writing, the IETF published WebP as RFC 9649 in November 2024, with Google-affiliated authors, and the W3C's PNG Third Edition, a Recommendation since June 24, 2025, made animated PNG official.

## What the same three images cost in bytes

Method: a Node script drove headless Chromium 141 through Playwright on September 30, 2026, drew three 800 × 600 test images (480,000 pixels each) on a canvas, encoded each with `canvas.toBlob` at the stated settings and recorded every file size.

The images are synthetic, so treat the results as a demonstration, not a benchmark. One is photo-like: a gradient sky, blurred clouds, hills, specks and faint noise. One imitates a dashboard screenshot with flat panels and text. The third is a logo with a soft shadow on a transparent background, 67.7% of it fully transparent and 9.9% partly so.

| Image (bytes) | PNG | JPG q80 | WebP q80 | WebP lossless |
| --- | --- | --- | --- | --- |
| Photo-like | 939,009 | 61,556 | 38,800 | 527,770 |
| Screenshot | 73,156 | 38,953 | 20,462 | 62,932 |
| Logo, transparent | 52,383 | 15,380 (transparency lost) | 20,880 | 47,106 |

In Chromium, a canvas quality of 1 produced a lossless WebP that decoded to identical pixels. The JPG logo is not a fair comparison: JPG has no alpha channel, and its top-left corner decoded as opaque black (0, 0, 0) where PNG and WebP stayed transparent.

### Comparing at equal quality

Quality numbers are not a shared unit, so the script used PSNR, the peak signal-to-noise ratio between a decoded file and the original; higher means closer, though it ignores how eyes work. On the photo-like image JPG q80 scored 36.33 dB and WebP q80 36.36 dB, close enough to call even. The saving: 61,556 − 38,800 = 22,756 bytes, and 22,756 ÷ 61,556 = 0.37, so 37% smaller.

On the screenshot WebP q80 scored 42.33 dB against 39.88 dB for JPG. A search of WebP settings found q53 at 39.95 dB and 16,340 bytes, so at matched PSNR the saving against Chromium's JPG was (38,953 − 16,340) ÷ 38,953 = 58%. PSNR is a weak judge of text edges, so treat that as an upper bound.

The gap by setting, on the photo-like image (bytes):

| Setting | JPG | WebP | WebP smaller by |
| --- | --- | --- | --- |
| 60 | 35,998 | 23,912 | 33.6% |
| 80 | 61,556 | 38,800 | 37.0% |
| 95 | 163,565 | 149,452 | 8.6% |

PSNR was not matched in every row (WebP 0.18 dB lower at q60, 1.51 dB higher at q95), so read the table as a trend on one image. To check savings on your own files, use the [percentage calculator](/tools/percentage-calculator).

## Why the encoder matters as much as the format

Chromium's canvas PNG encoder is not tuned for the smallest output, so the 939,009-byte PNG partly measures that choice. As a cross-check, the same images went through sharp 0.35.5 in Node.js (libvips 8.18.7, libpng 1.6.58, libwebp 1.6.0, mozjpeg):

| Image | PNG, canvas | PNG, level 9 | WebP lossless, canvas | WebP lossless, effort 6 |
| --- | --- | --- | --- | --- |
| Photo-like | 939,009 | 392,110 | 527,770 | 467,788 |
| Screenshot | 73,156 | 23,615 | 62,932 | 15,042 |
| Logo, transparent | 52,383 | 20,255 | 47,106 | 17,404 |

Level 9 is the maximum zlib setting, with adaptive filtering. It cut the photo-like PNG by 58%. Against it, lossless WebP won on the screenshot (15,042 against 23,615 bytes, 36% smaller) and the logo (14% smaller) but lost on the photo-like image, ending 19% larger. The image is synthetic, so do not generalize to real photographs. Google's WebP compression study reports lossless WebP about 26% smaller than PNG and lossy WebP 25% to 34% smaller than JPG at equal SSIM, on its own image set; this guide did not reproduce those figures.

The lossy pair shifted too. With sharp's mozjpeg option at quality 80, the photo-like image took 46,321 bytes at 36.12 dB, against 35,600 bytes at 36.24 dB for libwebp at q80: 23% smaller, not 37%. Sharp's default JPG at q80 took 61,064 bytes, so mozjpeg alone saved 24%.

## Which format for which image

| Image type | Pick | Watch out for |
| --- | --- | --- |
| Photo on a web page | Lossy WebP: 38,800 bytes against 61,556 for JPG | Keep a JPG for old software |
| Photo for email, print or a form | JPG | Repeated re-saving stacks losses |
| Screenshot or text in an image | PNG or lossless WebP | Lossless photos are huge; skip them here |
| Logo, icon, flat graphic | SVG if vector, else lossless WebP or PNG | Lossy WebP (20,880 bytes) lost to level 9 PNG (20,255) |
| Cutout or overlay | PNG for reach, WebP for size | JPG has no alpha |
| Animation | Animated WebP or APNG | Not measured here; for long clips, compare video |

## Compatibility in 2026

As of 2026, current versions of Chrome, Edge, Firefox and Safari all display WebP. The caniuse.com table lists support beginning with Chrome 32, Edge 18, Firefox 65 and Safari 14 (September 2020), with Safari 14 through 15.6 marked partial. Check caniuse.com or MDN before promising support on a very old device.

Outside the browser it is uneven. Editors, print software, email clients and upload forms added WebP on their own schedules, and some still reject it, so check the destination's accepted formats. For an old browser, HTML has a built-in fallback:

```html
<picture>
  <source srcset="photo.webp" type="image/webp">
  <img src="photo.jpg" alt="Describe the photo" width="800" height="600">
</picture>
```

## When converting helps and when it is pointless

Converting changes the container, not the past. Three conversions of the test images show why:

- **WebP to PNG.** The lossy photo-like WebP (38,800 bytes) became a 564,705-byte PNG, 14.6 times larger, with identical pixels and no quality gained. The screenshot went from 20,462 to 153,922 bytes, 2.1 times the 73,156-byte PNG made from the original, because lossy noise must be stored. Convert for compatibility, never quality, with the [WebP to PNG converter](/tools/webp-to-png).
- **WebP to JPG at q90.** The photo-like file grew to 82,895 bytes and slipped from 36.36 to 35.60 dB; the screenshot grew to 49,081 bytes and slipped from 42.33 to 40.29 dB. Transparent areas go black unless filled, so the [WebP to JPG converter](/tools/webp-to-jpg) lets you pick a fill.
- **JPG to WebP at q80.** The photo-like JPG shrank from 61,556 to 37,644 bytes (39% smaller) and the screenshot JPG from 38,953 to 22,432 (42%), but each lost 1.2 to 1.3 dB against the original. As lossless WebP, the photo-like JPG became 357,746 bytes, 5.8 times larger, because it preserves the JPG's flaws.

Convert when a destination demands a format. It is pointless when the destination already accepts your file or the goal is sharper detail.

## Common mistakes

- **PNG for photographs on web pages.** The photo-like PNG was 939,009 bytes against 61,556 for JPG q80, 15.3 times larger; even at level 9 it was 392,110 bytes, 6.4 times larger.
- **JPG for screenshots and text.** At q80, 4,476 of the screenshot's 480,000 pixels (0.93%) changed by more than 16 levels in some channel, and all of them sat in the 39% of the image within 8 pixels of a sharp edge. A lossless file changes none.
- **JPG for a transparent logo.** The transparent area turned black here, or white in tools that fill it.
- **Ignoring pixel count.** A 4,000 × 3,000 photo has 25 times the pixels of an 800 × 600 one (12,000,000 ÷ 480,000). For oversized originals, resizing to the displayed size often saves more than switching format.
- **Re-saving lossy files.** Each round adds loss. Edit a lossless master and export once.

## Frequently asked questions

### Is WebP better than PNG and JPG?

It is smaller in most lossy comparisons and covers transparency and animation in one format. In this guide's test, lossy WebP saved 23% to 37% against JPG on the photo-like image, depending on the JPG encoder. JPG and PNG still win on compatibility.

### Does WebP support transparency and animation?

Yes to both. WebP stores an alpha channel in lossy and lossless modes and includes animation, as RFC 9649 describes. JPG supports neither, and PNG animates only as APNG.

### Is PNG or JPG smaller?

For photographs, JPG is far smaller: 61,556 bytes against 939,009 here. For flat graphics the order can flip: the screenshot's level 9 PNG (23,615 bytes) was smaller than its JPG q80 (38,461 bytes with sharp), and lossless.

### Do all browsers support WebP in 2026?

Current versions of Chrome, Edge, Firefox and Safari do, according to the caniuse.com table. Gaps remain in very old browsers and in some editors, print tools and upload forms.

### Should I convert my existing JPGs to WebP?

Only when the savings matter, such as a large library. The test above saved about 39% but cost a second round of lossy compression, roughly 1.2 to 1.3 dB. Re-export from originals when you have them.

### Are JPG and JPEG the same?

Yes. Both describe one format; only the extension differs.

*This guide is independent of Google, the IETF, the W3C and the browser vendors named; none has reviewed or endorsed it. Formats and support change; confirm current details in each project's own documentation.*
