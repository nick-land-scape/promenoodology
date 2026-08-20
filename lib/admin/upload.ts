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
 */

const MAX_EDGE = 1800;
/** Small enough already, and no bigger than we serve: leave it alone. */
const KEEP = 400_000;

export type Uploaded = {
  path: string;
  width: number;
  height: number;
  bytes: number;
};

async function shrink(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const longest = Math.max(bitmap.width, bitmap.height);

  if (file.size <= KEEP && longest <= MAX_EDGE) {
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return { blob: file, ...size };
  }

  const scale = Math.min(1, MAX_EDGE / longest);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot resize pictures.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Drawing it into a canvas also drops the EXIF block, which is where the
  // camera, the time and sometimes the coordinates were.
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.86),
  );
  if (!blob) throw new Error("This browser could not re-save the picture.");

  // A browser that cannot encode webp hands back a PNG, which can be larger
  // than the JPEG that came in. Keep whichever is smaller.
  if (blob.size >= file.size && longest <= MAX_EDGE * 1.4) {
    return { blob: file, width: bitmap.width, height: bitmap.height };
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
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not a picture.`);
  }

  const { blob, width, height } = await shrink(file);
  const type = blob.type || "image/jpeg";
  const path = `${folder}/${crypto.randomUUID()}.${extensionOf(type, "jpg")}`;

  const { error } = await supabaseBrowser()
    .storage.from("media")
    .upload(path, blob, { contentType: type, upsert: false });

  if (error) throw new Error(`${file.name}: ${error.message}`);

  return { path, width, height, bytes: blob.size };
}
