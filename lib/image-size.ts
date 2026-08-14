import fs from "node:fs";

/**
 * Reads the pixel dimensions of a JPEG or PNG straight from its header.
 *
 * This runs at build time only, so we can keep the photo workflow simple:
 * drop a file into /public and it gets the right aspect ratio, no manifest
 * to update and no image library to install.
 */
export function imageSize(absolutePath: string): { width: number; height: number } {
  const fd = fs.openSync(absolutePath, "r");
  try {
    const head = Buffer.alloc(65536);
    const read = fs.readSync(fd, head, 0, head.length, 0);
    const buf = head.subarray(0, read);

    // PNG: dimensions live in the IHDR chunk at a fixed offset.
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }

    // JPEG: walk the marker segments until the first start-of-frame.
    if (buf.length > 4 && buf.readUInt16BE(0) === 0xffd8) {
      let offset = 2;
      while (offset + 9 < buf.length) {
        if (buf[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buf[offset + 1];
        // SOF0/1/2/3, SOF5-7, SOF9-11, SOF13-15 all carry the frame size.
        const isStartOfFrame =
          marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isStartOfFrame) {
          return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
        }
        offset += 2 + buf.readUInt16BE(offset + 2);
      }
    }
  } finally {
    fs.closeSync(fd);
  }

  // Unknown format: fall back to a square so the page still renders.
  return { width: 1000, height: 1000 };
}
