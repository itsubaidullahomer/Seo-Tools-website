/**
 * Find the highest JPEG quality whose file fits under a size limit.
 *
 * The encoder is injected, so the search is testable without a browser. JPEG
 * size grows with quality (not perfectly, but close enough for a binary search).
 */
export interface FitResult {
  blob: Blob;
  /** Quality of the returned file (an integer from the search range). */
  quality: number;
  /** False when even the lowest allowed quality is over the limit. */
  fits: boolean;
  /** How many times the encoder ran. */
  encodes: number;
}

export async function fitToSize(encode: (quality: number) => Promise<Blob>, startQuality: number, maxBytes: number, minQuality: number): Promise<FitResult> {
  let encodes = 0;
  const run = async (q: number) => {
    encodes++;
    return encode(q);
  };

  const top = await run(startQuality);
  if (top.size <= maxBytes) return { blob: top, quality: startQuality, fits: true, encodes };
  if (startQuality <= minQuality) return { blob: top, quality: startQuality, fits: false, encodes };

  const floor = await run(minQuality);
  if (floor.size > maxBytes) return { blob: floor, quality: minQuality, fits: false, encodes };

  // Invariant: `lo` fits (best holds its file), `hi` does not.
  let lo = minQuality;
  let hi = startQuality;
  let best = floor;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const blob = await run(mid);
    if (blob.size <= maxBytes) {
      lo = mid;
      best = blob;
    } else {
      hi = mid;
    }
  }
  return { blob: best, quality: lo, fits: true, encodes };
}
