/**
 * Minimal ZIP writer ("stored" entries, no compression).
 *
 * PNG data is already compressed, so deflating it again would cost CPU for no
 * gain. Writing the archive ourselves also keeps memory low: the final Blob
 * references the original PNG Blobs instead of copying their bytes, and each
 * file is only read (in slices) to compute its CRC-32.
 *
 * Layout: [local header + data] for every file, then the central directory,
 * then the end-of-central-directory record. File names are UTF-8.
 */
export interface ZipEntry {
  name: string;
  blob: Blob;
}

/** Classic ZIP (not ZIP64) limits. */
const MAX_ZIP_BYTES = 0xffffffff - 1024 * 1024;
const READ_SLICE = 8 * 1024 * 1024;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** Continue a CRC-32 over more bytes (start with prev = 0). */
export function crc32Update(prev: number, bytes: Uint8Array): number {
  let c = (prev ^ 0xffffffff) >>> 0;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function crc32OfBlob(blob: Blob): Promise<number> {
  let crc = 0;
  for (let offset = 0; offset < blob.size; offset += READ_SLICE) {
    crc = crc32Update(crc, new Uint8Array(await blob.slice(offset, offset + READ_SLICE).arrayBuffer()));
  }
  return crc;
}

function dosDateTime(d: Date): { time: number; date: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export class ZipTooLargeError extends Error {}

/** A zeroed byte array backed by a plain ArrayBuffer (accepted as a BlobPart). */
const alloc = (length: number): Uint8Array<ArrayBuffer> => new Uint8Array(new ArrayBuffer(length));

export async function buildZip(entries: ZipEntry[], now: Date = new Date()): Promise<Blob> {
  if (entries.length > 0xffff) throw new ZipTooLargeError("Too many files for one ZIP.");
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(now);
  const parts: BlobPart[] = [];
  const central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const size = entry.blob.size;
    const crc = await crc32OfBlob(entry.blob);

    const local = alloc(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed to extract
    lv.setUint16(6, 0x0800, true); // flags: names are UTF-8
    lv.setUint16(8, 0, true); // method: stored
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // compressed size
    lv.setUint32(22, size, true); // uncompressed size
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true); // extra field length
    local.set(name, 30);

    const cd = alloc(46 + name.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    // extra length, comment length, disk number, internal and external attributes stay 0
    cv.setUint32(42, offset, true); // offset of the local header
    cd.set(name, 46);
    central.push(cd);

    parts.push(local, entry.blob);
    offset += local.length + size;
    if (offset > MAX_ZIP_BYTES) throw new ZipTooLargeError("The ZIP would be larger than 4 GB.");
  }

  const cdSize = central.reduce((sum, c) => sum + c.length, 0);
  if (offset + cdSize > MAX_ZIP_BYTES) throw new ZipTooLargeError("The ZIP would be larger than 4 GB.");
  const end = alloc(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true); // entries on this disk
  ev.setUint16(10, entries.length, true); // total entries
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end], { type: "application/zip" });
}
