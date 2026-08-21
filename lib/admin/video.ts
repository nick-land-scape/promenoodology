"use client";

import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Shrinking a film in the browser, and putting it in the bucket.
 *
 * A photograph off a phone is four megabytes and there is a library for it. A
 * film off the same phone is two hundred, and there is no equivalent — the two
 * real options are ffmpeg compiled to WebAssembly, which is twenty-five
 * megabytes of download before anything happens, or re-encoding through the
 * browser's own machinery.
 *
 * The second one, for one reason: the film this is for is a muted loop behind a
 * logo. No sound, no more than a thousand-and-something pixels wide, a few
 * seconds long. Under those constraints a canvas and a MediaRecorder are a real
 * encoder — the browser's own, hardware-accelerated where the machine has it —
 * and they cost nothing to load.
 *
 * What it costs instead is time: this plays the film to re-record it, so a
 * fifteen-second clip takes fifteen seconds. That is said out loud in the
 * interface rather than hidden behind a spinner, because a minute of apparently
 * nothing is how people conclude a thing is broken.
 */

/** No wider than the front page ever draws it, allowing for a retina screen. */
const MAX_EDGE = 1280;
/** A loop, not a film. Anything longer is cut. */
const MAX_SECONDS = 20;
/** What the front page should weigh, at most. */
const MAX_BYTES = 6_000_000;
/** Rough target for the encoder. Bitrate times seconds is roughly the size. */
const BITS_PER_SECOND = 2_200_000;

export const VIDEO_ACCEPTS = "video/*,.mp4,.mov,.m4v,.webm";

export type Filmed = {
  path: string;
  posterPath: string;
  bytes: number;
  seconds: number;
  width: number;
  height: number;
  /** True when the browser could not re-encode and the original went up. */
  asItCame: boolean;
  /** Why, in that case. Empty when it was shrunk as intended. */
  why: string;
};

/** What this browser can record, in the order we would rather have. */
function bestType(): string | null {
  const wanted = [
    // Safari 17 and up. An mp4 plays everywhere without a second copy.
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  if (typeof MediaRecorder === "undefined") return null;
  return wanted.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

const extensionOf = (type: string) => (type.includes("mp4") ? "mp4" : "webm");

function withDeadline<T>(work: Promise<T>, what: string, ms: number): Promise<T> {
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

/** A <video> that has read enough of the file to be measured and played. */
function ready(file: File): Promise<{ video: HTMLVideoElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error("The browser could not read that file as a film."));
    }, 45_000);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      if (!video.videoWidth || !video.videoHeight) {
        URL.revokeObjectURL(url);
        reject(new Error("That file has no picture in it — an audio file, perhaps?"));
        return;
      }
      resolve({ video, url });
    };
    video.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      reject(
        new Error(
          `The browser cannot decode ${file.name}. Most phone films are fine; anything exotic has to be converted first.`,
        ),
      );
    };

    video.src = url;
  });
}

/** The first frame, as a JPEG, for the poster. */
async function firstFrame(video: HTMLVideoElement, width: number, height: number): Promise<Blob> {
  await new Promise<void>((resolve) => {
    const seeked = () => {
      video.removeEventListener("seeked", seeked);
      resolve();
    };
    video.addEventListener("seeked", seeked);
    // Not zero: the very first frame of a phone film is often black.
    video.currentTime = Math.min(0.2, (video.duration || 1) / 10);
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);

  return withDeadline(
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("The poster came back empty."))),
        "image/jpeg",
        0.82,
      );
    }),
    "Making the poster",
    20_000,
  );
}

/**
 * Re-record the film through a canvas, smaller.
 *
 * It runs in real time because that is what playing a film means, and it draws
 * every frame from a requestAnimationFrame loop — which the browser stops
 * running the moment the tab is not the one being looked at. That is not a
 * detail: a minute of waiting is exactly when somebody goes and reads something
 * else, and the first version of this failed on the deadline when they did, then
 * quietly put the original film up instead.
 *
 * So the tab going away pauses the work rather than losing it: the film pauses,
 * the recorder pauses, and the clock this is held to only counts the time the
 * tab was actually in front. Come back and it carries on where it stopped.
 */
async function shrink(
  video: HTMLVideoElement,
  width: number,
  height: number,
  seconds: number,
  type: string,
  report: (stage: string, share: number) => void,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const paper = canvas.getContext("2d");
  if (!paper) throw new Error("The browser would not give us a canvas to draw on.");

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, {
    mimeType: type,
    videoBitsPerSecond: BITS_PER_SECOND,
  });

  const pieces: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) pieces.push(event.data);
  };

  let painting = 0;
  let watching = 0;
  let done = false;

  const stop = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(painting);
    clearInterval(watching);
    video.pause();
    if (recorder.state !== "inactive") recorder.stop();
  };

  const finished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(pieces, { type }));
    recorder.onerror = () => {
      stop();
      reject(new Error("The browser stopped recording part way through."));
    };

    /* The clock, and it only runs while somebody is watching.
     *
     * A film that has not moved on for twenty seconds of visible time is stuck;
     * a film that has not moved on because the tab is in the background is
     * simply waiting, and waiting is allowed. */
    let idle = 0;
    let furthest = 0;
    watching = window.setInterval(() => {
      if (document.hidden) return;
      if (video.currentTime > furthest + 0.05) {
        furthest = video.currentTime;
        idle = 0;
        return;
      }
      idle += 1;
      if (idle > 20) {
        stop();
        reject(new Error("The film stopped moving part way through the re-recording."));
      }
    }, 1000);
  });

  const paint = () => {
    if (done) return;
    paper.drawImage(video, 0, 0, width, height);
    report("re-recording it", Math.min(1, video.currentTime / seconds));
    // Past the cut, or the film has ended.
    if (video.currentTime >= seconds || video.ended) {
      stop();
      return;
    }
    painting = requestAnimationFrame(paint);
  };

  /** Away and back again, without losing the half that is already recorded. */
  const attention = () => {
    if (done) return;
    if (document.hidden) {
      video.pause();
      if (recorder.state === "recording") recorder.pause();
      cancelAnimationFrame(painting);
      report("waiting for you to come back to this tab", video.currentTime / seconds);
    } else {
      if (recorder.state === "paused") recorder.resume();
      void video.play();
      painting = requestAnimationFrame(paint);
    }
  };

  document.addEventListener("visibilitychange", attention);

  try {
    video.currentTime = 0;
    await video.play();
    recorder.start(1000);
    painting = requestAnimationFrame(paint);
    return await finished;
  } finally {
    stop();
    document.removeEventListener("visibilitychange", attention);
    stream.getTracks().forEach((track) => track.stop());
  }
}

/**
 * A film off somebody's machine, in the bucket, with a poster beside it.
 *
 * Every failure says which step failed and why. The one thing it will not do is
 * pretend: a browser that cannot re-encode gets told so, and the original goes
 * up only if it is already small enough to belong on a front page.
 */
export async function uploadFilm(
  file: File,
  onProgress: (stage: string, share: number) => void,
): Promise<Filmed> {
  if (!file.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm)$/i.test(file.name)) {
    throw new Error(`${file.name} is not a film.`);
  }

  onProgress("reading it", 0);
  const { video, url } = await ready(file);

  try {
    const length = Number.isFinite(video.duration) ? video.duration : MAX_SECONDS;
    const seconds = Math.min(length, MAX_SECONDS);

    // Even sides: some encoders refuse an odd number of pixels.
    const scale = Math.min(1, MAX_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const width = Math.max(2, Math.round((video.videoWidth * scale) / 2) * 2);
    const height = Math.max(2, Math.round((video.videoHeight * scale) / 2) * 2);

    onProgress("making the poster", 0);
    const poster = await firstFrame(video, width, height);

    const type = bestType();
    let film: Blob = file;
    let asItCame = true;
    /** Why it went up as it came, when it did. Said out loud, never swallowed. */
    let why = "";

    if (!type) {
      why = "this browser cannot re-encode a film";
      // Nothing to re-encode with. The original may still be fine.
      if (file.size > MAX_BYTES) {
        throw new Error(
          `This browser cannot re-encode a film, and ${file.name} is ${Math.round(
            file.size / 1_000_000,
          )}MB — too heavy for a front page. Try it in Chrome or Safari, or shrink it first.`,
        );
      }
    } else {
      onProgress("re-recording it", 0);
      try {
        film = await shrink(video, width, height, seconds, type, onProgress);
        asItCame = false;
      } catch (error) {
        why = error instanceof Error ? error.message : "the browser would not re-encode it";
        // Its own bytes are a worse outcome than a small file and a much better
        // one than no film at all — but only if they are not absurd.
        if (file.size > MAX_BYTES) {
          throw new Error(
            `Re-recording failed (${
              error instanceof Error ? error.message : "unknown"
            }) and the original is ${Math.round(file.size / 1_000_000)}MB, which is too heavy to use as it is.`,
          );
        }
        film = file;
        asItCame = true;
      }
    }

    if (film.size > MAX_BYTES) {
      throw new Error(
        `It came out at ${Math.round(film.size / 1_000_000)}MB and the limit is ${Math.round(
          MAX_BYTES / 1_000_000,
        )}MB. A shorter cut is the fix — the front page loops it, so a few seconds is plenty.`,
      );
    }

    onProgress("putting it away", 0);
    const stem = crypto.randomUUID();
    const filmPath = `hero/${stem}.${asItCame ? (file.name.split(".").pop() ?? "mp4") : extensionOf(film.type)}`;
    const posterPath = `hero/${stem}.jpg`;
    const bucket = supabaseBrowser().storage.from("media");

    const first = await withDeadline<{ error: { message: string } | null }>(
      bucket.upload(filmPath, film, { contentType: film.type || "video/mp4", upsert: false }),
      "The upload",
      300_000,
    );
    if (first.error) throw new Error(`${file.name} was refused: ${first.error.message}`);

    const second = await withDeadline<{ error: { message: string } | null }>(
      bucket.upload(posterPath, poster, { contentType: "image/jpeg", upsert: false }),
      "The poster",
      60_000,
    );
    // A film without a poster is a film; the row simply says it has none.
    if (second.error) console.warn("The poster did not go up:", second.error.message);

    return {
      path: filmPath,
      posterPath: second.error ? "" : posterPath,
      bytes: film.size,
      seconds: Math.round(seconds * 10) / 10,
      width,
      height,
      asItCame,
      why: asItCame ? why : "",
    };
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
