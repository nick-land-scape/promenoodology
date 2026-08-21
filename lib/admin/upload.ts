"use client";

import imageCompression from "browser-image-compression";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Putting a picture in the bucket, from the browser.
 *
 * It does not go through a function on the way: the storage policy already says
 * only an admin may write to the bucket, and the browser is where the picture
 * already is. That also sidesteps the platform's limit on how big a request body
 * may be, which a photograph straight off a phone runs into on its own.
 *
 * What arrives is not always what a browser can read. Four kinds of file, handled
 * four ways:
 *
 * HEIC and HEIF — what an iPhone saves by default. Safari can decode them and
 * Chrome and Firefox cannot, so they were simply refused, on the machines most
 * likely to be uploading. heic2any decodes them, and it is loaded only when one
 * actually turns up: it is two and a half megabytes of WebAssembly, and nobody
 * uploading a JPEG should pay for it.
 *
 * SVG — a drawing, not a photograph. Shrinking a vector to 1800 pixels is
 * throwing away the only thing that makes it a vector, so it goes up as it is.
 *
 * GIF — may be animated, and a canvas keeps only the first frame. Left alone.
 *
 * Everything else a browser can decode goes through browser-image-compression,
 * which does in a web worker what this file used to do by hand, and does more of
 * it: it turns the picture by its EXIF orientation before dropping the EXIF, and
 * it walks the quality down until the file is actually under the size asked for
 * rather than hoping one pass was enough.
 *
 * Every step has a deadline. A library can hang as easily as hand-written code,
 * and silence is the one outcome nobody can act on.
 */

/** No bigger than the site ever draws one. */
const MAX_EDGE = 1800;
/** What a photograph on this site should weigh, at most. */
const MAX_MB = 0.6;
/** Small enough already: leave it alone rather than re-encoding for nothing. */
const KEEP = 400_000;

const DEADLINE = 60_000;

export type Uploaded = {
  path: string;
  width: number;
  height: number;
  bytes: number;
};

function withDeadline<T>(work: PromiseLike<T>, what: string, ms = DEADLINE): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${what} did not finish within ${Math.round(ms / 1000)} seconds.`)),
      ms,
    );
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const looksLike = (file: File, ...kinds: string[]) =>
  kinds.some(
    (kind) =>
      file.type === `image/${kind}` ||
      new RegExp(`\\.${kind}$`, "i").test(file.name) ||
      (kind === "jpeg" && /\.jpg$/i.test(file.name)),
  );

/** Anything at all that this can make into a picture. */
export const ACCEPTS = "image/*,.heic,.heif,.avif";

/** What an iPhone saves, made into something every browser can read. */
async function fromHeic(file: File): Promise<File> {
  // Loaded here and nowhere else: two and a half megabytes of WebAssembly that
  // only somebody uploading an iPhone photograph should ever fetch.
  const { default: heic2any } = await import("heic2any");

  const converted = await withDeadline(
    heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 }) as Promise<Blob | Blob[]>,
    "Reading the iPhone photograph",
  );
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
}

/** How big it turned out. Asked once, of the file that is actually going up. */
async function measure(file: File): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await withDeadline(createImageBitmap(file), "Measuring the picture", 20_000);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    // An SVG has no pixel size worth recording, and nothing on the site needs
    // one: the shapes it is drawn into give it its size.
    return { width: 0, height: 0 };
  }
}

const extensionOf = (type: string, name: string) => {
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/svg+xml") return "svg";
  if (type === "image/gif") return "gif";
  if (type === "image/avif") return "avif";
  return name.split(".").pop()?.toLowerCase() || "jpg";
};

/**
 * Shrink one picture and put it in the bucket under `folder`.
 *
 * The name is thrown away and replaced with a random one — "IMG_4471.HEIC" says
 * where somebody was and what they use — and so is the EXIF block, which says it
 * more precisely.
 */
export async function uploadPhoto(file: File, folder: string): Promise<Uploaded> {
  let ready = file;

  if (looksLike(file, "heic", "heif")) {
    ready = await fromHeic(file);
  } else if (looksLike(file, "svg+xml", "svg")) {
    // A vector, left as one.
  } else if (looksLike(file, "gif")) {
    // May be animated; a canvas would keep the first frame and throw the rest.
  } else if (!file.type.startsWith("image/")) {
    throw new Error(
      `${file.name} is not a picture — this takes photographs and drawings, not ${
        file.type || "files of that kind"
      }.`,
    );
  }

  const untouched = looksLike(ready, "svg+xml", "svg", "gif") || ready.size <= KEEP;

  if (!untouched) {
    ready = await withDeadline(
      imageCompression(ready, {
        maxWidthOrHeight: MAX_EDGE,
        maxSizeMB: MAX_MB,
        useWebWorker: true,
        // webp for the size; the library falls back where it cannot encode it.
        fileType: "image/webp",
        initialQuality: 0.86,
        // The EXIF block is where the camera, the time and sometimes the
        // coordinates are. It is not kept.
        preserveExif: false,
      }),
      "Shrinking the picture",
    ).catch((error: unknown) => {
      // A picture that will not compress still belongs on the page. Its own
      // bytes are a worse outcome than a small file and a much better one than
      // no picture and an explanation nobody asked for.
      console.warn("Falling back to the original file:", error);
      return ready;
    });
  }

  const { width, height } = await measure(ready);
  const type = ready.type || file.type || "image/jpeg";
  const path = `${folder}/${crypto.randomUUID()}.${extensionOf(type, ready.name)}`;

  // Said out loud, because what upload() hands back is a thenable whose type
  // does not survive the generic above.
  const { error } = await withDeadline<{ error: { message: string } | null }>(
    supabaseBrowser().storage.from("media").upload(path, ready, {
      contentType: type,
      upsert: false,
    }),
    "The upload",
    120_000,
  );

  if (error) {
    // The one that actually happens: a session that has gone stale, so the
    // storage policy sees somebody who is not an admin.
    const stale = /jwt|unauthor|denied|policy|row-level/i.test(error.message);
    throw new Error(
      stale
        ? `${file.name} was refused — reload the page and sign in again.`
        : `${file.name}: ${error.message}`,
    );
  }

  return { path, width, height, bytes: ready.size };
}
