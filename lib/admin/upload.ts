"use client";

import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Putting a photograph in the bucket, from the browser.
 *
 * It does not go through a function on the way: the storage policy already says
 * only an admin may write to the bucket, and the browser is where the picture
 * already is. That also sidesteps the platform's limit on how big a request
 * body may be, which a photograph straight off a phone runs into on its own.
 *
 * Every picture is shrunk and re-encoded here first. The site never shows one
 * bigger than about 1200px, so keeping a 12-megapixel original would cost
 * everybody who ever looks at the page and gain nobody. The name is thrown away
 * too — "IMG_4471.HEIC" says where somebody was and what they use.
 *
 * Every step has a deadline. Not defensiveness for its own sake: canvas.toBlob
 * takes a callback and is under no obligation to call it, and when it did not,
 * the uploader sat on "shrinking and putting it away" for ever. A step that
 * cannot finish has to be able to say so — silence is the one outcome nobody can
 * act on.
 */

const MAX_EDGE = 1800;
/** Small enough already, and no bigger than we serve: leave it alone. */
const KEEP = 400_000;

/** How long any one step may take before it is called a failure. */
const DEADLINE = 45_000;

export type Uploaded = {
  path: string;
  width: number;
  height: number;
  bytes: number;
};

// PromiseLike rather than Promise: what Supabase's upload() returns is a
// thenable, not a real promise, and a Promise<T> parameter cannot see through it.
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

/** One attempt at re-encoding the canvas. Resolves to null rather than hanging. */
function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return withDeadline(
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86)),
    `Re-saving the picture as ${type.replace("image/", "")}`,
    15_000,
  ).catch(() => null);
}

async function shrink(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await withDeadline(
    createImageBitmap(file, { imageOrientation: "from-image" }),
    "Reading the picture",
  ).catch(() => {
    throw new Error(
      `This browser could not read ${file.name}. HEIC from an iPhone is the usual reason — ` +
        "export it as JPEG and try again.",
    );
  });

  // Read before closing. A closed ImageBitmap reports a width and height of
  // zero, and this used to be read after the close on one of the paths below —
  // which wrote a picture into the database as nought by nought.
  const was = { width: bitmap.width, height: bitmap.height };
  const longest = Math.max(was.width, was.height);

  if (file.size <= KEEP && longest <= MAX_EDGE) {
    bitmap.close();
    return { blob: file, ...was };
  }

  const scale = Math.min(1, MAX_EDGE / longest);
  const width = Math.max(1, Math.round(was.width * scale));
  const height = Math.max(1, Math.round(was.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("This browser cannot resize pictures.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Drawing it into a canvas also drops the EXIF block, which is where the
  // camera, the time and sometimes the coordinates were.
  //
  // webp first because it is much the smallest, then jpeg for anything that
  // cannot encode it. If neither answers, the original goes up untouched: a
  // large picture on the page is a worse outcome than a small one and a far
  // better one than no picture and no explanation.
  const blob = (await encode(canvas, "image/webp")) ?? (await encode(canvas, "image/jpeg"));

  if (!blob) return { blob: file, ...was };

  // A browser that cannot encode webp hands back a PNG, which can be larger
  // than the JPEG that came in. Keep whichever is smaller.
  if (blob.size >= file.size && longest <= MAX_EDGE * 1.4) {
    return { blob: file, ...was };
  }
  return { blob, width, height };
}

function extensionOf(type: string, fallback: string) {
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  return fallback;
}

/**
 * Shrink one picture and put it in the bucket under `folder`.
 *
 * The name is random, so uploading the same photograph twice makes two files
 * rather than quietly replacing one that something else is already pointing at.
 */
export async function uploadPhoto(file: File, folder: string): Promise<Uploaded> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|avif)$/i.test(file.name)) {
    throw new Error(`${file.name} is not a picture.`);
  }

  const { blob, width, height } = await shrink(file);
  const type = blob.type || "image/jpeg";
  const path = `${folder}/${crypto.randomUUID()}.${extensionOf(type, "jpg")}`;

  // Said out loud, because what upload() hands back is a thenable whose type
  // does not survive the generic above.
  const { error } = await withDeadline<{ error: { message: string } | null }>(
    supabaseBrowser().storage.from("media").upload(path, blob, {
      contentType: type,
      upsert: false,
    }),
    "The upload",
    90_000,
  );

  if (error) {
    // The one that actually happens: a session that has gone stale, so the
    // storage policy sees somebody who is not an admin.
    const stale = /jwt|unauthor|denied|policy/i.test(error.message);
    throw new Error(
      stale
        ? `${file.name} was refused — reload the page and sign in again.`
        : `${file.name}: ${error.message}`,
    );
  }

  return { path, width, height, bytes: blob.size };
}
