/**
 * Pure helpers for batches: size caps, output file names and size deltas.
 * No DOM access, so everything here can be tested in Node.
 */

export const MAX_BATCH_FILES = 50;
export const MAX_BATCH_BYTES = 300 * 1024 * 1024;

export interface BatchPlan {
  /** Indexes (into the incoming list) that fit in the batch, in order. */
  accepted: number[];
  /** Skipped because the batch already holds the maximum number of files. */
  skippedForCount: number;
  /** Skipped because the batch would go over the total size cap. */
  skippedForSize: number;
  /** Skipped because the single file is larger than the whole cap. */
  skippedTooLarge: number;
}

/**
 * Decide which incoming files fit. Files are considered in order; a file that
 * does not fit is skipped and a later, smaller one may still be accepted.
 */
export function planBatch(currentCount: number, currentBytes: number, sizes: number[]): BatchPlan {
  const plan: BatchPlan = { accepted: [], skippedForCount: 0, skippedForSize: 0, skippedTooLarge: 0 };
  let count = currentCount;
  let bytes = currentBytes;
  sizes.forEach((size, i) => {
    if (size > MAX_BATCH_BYTES) plan.skippedTooLarge++;
    else if (count >= MAX_BATCH_FILES) plan.skippedForCount++;
    else if (bytes + size > MAX_BATCH_BYTES) plan.skippedForSize++;
    else {
      plan.accepted.push(i);
      count++;
      bytes += size;
    }
  });
  return plan;
}

/** Friendly explanation when some files were skipped, or null when everything fit. */
export function batchMessage(plan: BatchPlan): string | null {
  const skipped = plan.skippedForCount + plan.skippedForSize + plan.skippedTooLarge;
  if (skipped === 0) return null;
  const added = plan.accepted.length;
  const files = (n: number) => `${n} file${n === 1 ? "" : "s"}`;
  const limit = `${MAX_BATCH_FILES} files or ${MAX_BATCH_BYTES / 1024 / 1024} MB in total`;
  if (plan.skippedTooLarge > 0 && plan.skippedForCount + plan.skippedForSize === 0) {
    return `${files(plan.skippedTooLarge)} ${plan.skippedTooLarge === 1 ? "is" : "are"} larger than the ${MAX_BATCH_BYTES / 1024 / 1024} MB batch limit and ${plan.skippedTooLarge === 1 ? "was" : "were"} skipped.`;
  }
  const head = added > 0 ? `Added ${added} of ${added + skipped} files.` : `No files were added.`;
  return `${head} A batch can hold ${limit}, so ${files(skipped)} ${skipped === 1 ? "was" : "were"} skipped. Download this batch, click Clear all, then add the rest.`;
}

/** Replace characters that are not allowed in file names on common systems. */
export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[\u0000-\u001f\u007f/\\:*?"<>|]/g, "_").replace(/^\.+/, "").trim();
  return cleaned || "image";
}

/** "photo.webp" -> "photo.png", "archive.tar.webp" -> "archive.tar.png", "pasted-image-1" -> "pasted-image-1.png". */
export function pngFileName(original: string): string {
  const base = sanitizeFileName(original.split(/[/\\]/).pop() ?? original);
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 && /^[A-Za-z0-9]{1,5}$/.test(base.slice(dot + 1)) ? base.slice(0, dot) : base;
  return `${stem || "image"}.png`;
}

/**
 * Make a file name unique among the names in `taken` (compared case-insensitively):
 * photo.png, photo-2.png, photo-3.png ... The chosen name is added to `taken`.
 */
export function uniqueName(name: string, taken: Set<string>): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let candidate = name;
  let n = 2;
  while (taken.has(candidate.toLowerCase())) {
    candidate = `${stem}-${n}${ext}`;
    n++;
  }
  taken.add(candidate.toLowerCase());
  return candidate;
}

/** Clipboard images arrive with placeholder names such as "image.png". */
export function isGenericClipboardName(name: string): boolean {
  return name.trim() === "" || /^image\.[a-z0-9]{2,5}$/i.test(name.trim()) || /^blob$/i.test(name.trim());
}

/** Name used for a pasted image: pasted-image-1, pasted-image-2, ... */
export function pastedImageName(n: number): string {
  return `pasted-image-${n}`;
}

/** Signed percentage change from the original size to the PNG size, e.g. "+173%" or "-15%". */
export function sizeDelta(inBytes: number, outBytes: number): string {
  if (!(inBytes > 0)) return "";
  const pct = Math.round(((outBytes - inBytes) / inBytes) * 100);
  if (pct === 0) return "same size";
  return `${pct > 0 ? "+" : "-"}${Math.abs(pct)}%`;
}
