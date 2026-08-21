"use client";

import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { useEffect, useRef, useState } from "react";
import { LIMITS, unupload, uploadPhoto, type Uploaded } from "@/lib/admin/upload";
import { Icon } from "./ui";

/**
 * Editing a photograph that is already on the site.
 *
 * Cropper.js does the hard part — the crop box, the transform, the dragging —
 * and everything around it here is about the two things that are easy to get
 * wrong and expensive to get wrong quietly.
 *
 * The first is where the pixels come from. Reading a canvas that was painted
 * with an image from another origin throws SecurityError, and it throws it at
 * the very end, after somebody has spent a minute lining up a crop. So the file
 * is fetched as bytes first and handed over as a blob: URL, which belongs to
 * this page and can never taint anything. It also means the original weight is
 * known, which is worth saying out loud next to the new one.
 *
 * The second is the result. A crop is a new photograph and has to obey the same
 * rule as any other — no bigger than 1800px on its longest edge, no heavier than
 * 600kB — so it goes up through exactly the same path as a fresh upload rather
 * than a shortcut of its own, and then the answer is checked against the rule.
 * If it is over, the file is taken back out of the bucket and the message says by
 * how much. Nothing here ever says "that did not work".
 */

/** The shapes worth having a button for. Free first: it is the common answer. */
const SHAPES: { label: string; ratio: number; note?: string }[] = [
  { label: "any shape", ratio: Number.NaN },
  { label: "as it is", ratio: 0, note: "the shape it came in" },
  { label: "square", ratio: 1, note: "1 : 1" },
  { label: "portrait", ratio: 4 / 5, note: "4 : 5" },
  { label: "tall portrait", ratio: 2 / 3, note: "2 : 3" },
  { label: "landscape", ratio: 3 / 2, note: "3 : 2" },
  { label: "wide", ratio: 16 / 9, note: "16 : 9" },
];

/** A blob from a canvas, or a named reason why not. */
function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // toBlob is allowed to never call back at all, and on a large canvas that is
    // not merely theoretical. Without this the editor would sit on "saving…".
    const timer = setTimeout(
      () => reject(new Error("The browser took more than 30 seconds to encode the crop.")),
      30_000,
    );
    try {
      canvas.toBlob(
        (blob) => {
          clearTimeout(timer);
          if (blob) resolve(blob);
          else reject(new Error("The browser returned an empty image for the crop."));
        },
        type,
        0.95,
      );
    } catch (error) {
      clearTimeout(timer);
      // The one that happens: a canvas painted from another origin.
      reject(
        new Error(
          `The browser refused to read the edited picture (${
            error instanceof Error ? error.name : "unknown"
          }). That is a cross-origin problem, not a problem with the crop.`,
        ),
      );
    }
  });
}

const weigh = (bytes: number) =>
  bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1000)} kB`;

export default function ImageEditor({
  url,
  folder,
  what = "photograph",
  onClose,
  onDone,
}: {
  /** Where the picture is now. */
  url: string;
  /** Where in the bucket the edited one should go. */
  folder: string;
  what?: string;
  onClose: () => void;
  /** The new file, already in the bucket and already within the rule. */
  onDone: (next: Uploaded) => Promise<void> | void;
}) {
  const frame = useRef<HTMLImageElement>(null);
  const cropper = useRef<Cropper | null>(null);
  const source = useRef<{ objectUrl: string; bytes: number; type: string } | null>(null);

  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState("");
  const [shapes, setShapes] = useState(false);
  const [shape, setShape] = useState("any shape");
  const [angle, setAngle] = useState(0);
  const [was, setWas] = useState(0);

  /* The bytes first, then the cropper on top of them. */
  useEffect(() => {
    let dropped = false;

    (async () => {
      let blob: Blob;
      try {
        const answer = await fetch(url);
        if (!answer.ok) {
          throw new Error(`The bucket answered ${answer.status} for this ${what}.`);
        }
        blob = await answer.blob();
      } catch (error) {
        if (!dropped) {
          setProblem(
            error instanceof Error
              ? `The picture could not be read: ${error.message}`
              : "The picture could not be read.",
          );
        }
        return;
      }
      if (dropped) return;

      const objectUrl = URL.createObjectURL(blob);
      source.current = { objectUrl, bytes: blob.size, type: blob.type || "image/jpeg" };
      setWas(blob.size);

      const image = frame.current;
      if (!image) return;
      image.src = objectUrl;

      cropper.current = new Cropper(image, {
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 1,
        background: false,
        // Off, because the source is a blob: URL of our own making; leaving it on
        // makes Cropper add crossOrigin and refetch, which is a second request
        // for bytes we already hold.
        checkCrossOrigin: false,
        movable: true,
        zoomable: true,
        toggleDragModeOnDblclick: false,
        ready: () => {
          if (!dropped) setReady(true);
        },
      });
    })();

    return () => {
      dropped = true;
      cropper.current?.destroy();
      cropper.current = null;
      if (source.current) URL.revokeObjectURL(source.current.objectUrl);
      source.current = null;
    };
  }, [url, what]);

  /* Escape closes, unless something is being written. */
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [busy, onClose]);

  const it = () => cropper.current;

  function turn(by: number) {
    it()?.rotate(by);
    setAngle((was_) => Math.round(((was_ + by) % 360 + 360) % 360));
  }

  function straighten(to: number) {
    // rotateTo is absolute, which is what a slider wants: dragging back to zero
    // has to mean upright, not "another minus five".
    it()?.rotateTo(to);
    setAngle(to);
  }

  function take(ratio: number, label: string) {
    setShape(label);
    setShapes(false);
    const cropped = it();
    if (!cropped) return;

    if (Number.isNaN(ratio)) {
      cropped.setAspectRatio(Number.NaN);
      return;
    }
    if (ratio === 0) {
      // The shape it arrived in, whatever that is.
      const data = cropped.getImageData();
      cropped.setAspectRatio(data.naturalWidth / data.naturalHeight);
      return;
    }
    cropped.setAspectRatio(ratio);
  }

  function putItBack() {
    it()?.reset();
    it()?.setAspectRatio(Number.NaN);
    setAngle(0);
    setShape("any shape");
    setProblem("");
  }

  async function keep() {
    const cropped = it();
    const original = source.current;
    if (!cropped || !original) return;

    setProblem("");
    setBusy("cutting it out");

    let uploaded: Uploaded | null = null;
    try {
      // Capped here rather than after the fact: a 45° turn on a 4000px
      // photograph asks for a canvas half again as wide as the picture, and the
      // browser will simply refuse past a certain size.
      const canvas = cropped.getCroppedCanvas({
        maxWidth: LIMITS.edge,
        maxHeight: LIMITS.edge,
        imageSmoothingQuality: "high",
        // A turned photograph has corners with nothing behind them. Paper,
        // unless the picture might have been transparent to begin with, in which
        // case leaving it transparent is the truthful answer.
        fillColor: /png|webp|avif|gif|svg/.test(original.type) ? undefined : "#fffcf6",
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error(
          "The crop came back with no pixels in it — the box may be outside the picture.",
        );
      }

      setBusy("encoding it");
      const blob = await canvasToBlob(canvas, "image/png");

      setBusy("shrinking and putting it away");
      const file = new File([blob], `edited-${Date.now()}.png`, { type: "image/png" });
      uploaded = await uploadPhoto(file, folder);

      /* The rule, checked rather than assumed. */
      const longest = Math.max(uploaded.width, uploaded.height);
      if (uploaded.bytes > LIMITS.bytes || longest > LIMITS.edge) {
        const said = [
          uploaded.bytes > LIMITS.bytes
            ? `${weigh(uploaded.bytes)}, and the limit is ${weigh(LIMITS.bytes)}`
            : "",
          longest > LIMITS.edge
            ? `${uploaded.width}×${uploaded.height}, and the longest edge may be ${LIMITS.edge}px`
            : "",
        ]
          .filter(Boolean)
          .join("; ");

        await unupload(uploaded.path);
        uploaded = null;
        throw new Error(
          `The edited ${what} came out at ${said}. It has been taken back out of the bucket and nothing has changed. Crop it smaller and try again.`,
        );
      }

      setBusy("swapping it over");
      await onDone(uploaded);
      onClose();
    } catch (error) {
      // Anything that failed after the file went up leaves nothing behind.
      if (uploaded) await unupload(uploaded.path).catch(() => {});
      setProblem(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="admin-editor" role="dialog" aria-label={`Edit this ${what}`}>
      <div className="admin-editor-sheet">
        <header className="admin-editor-head">
          <strong>editing a {what}</strong>
          <span className="admin-editor-facts">
            {was ? `${weigh(was)} now` : "reading it…"}
            {angle ? ` · turned ${angle}°` : ""}
            {shape !== "any shape" ? ` · ${shape}` : ""}
          </span>
          <button type="button" className="admin-editor-shut" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="admin-editor-stage">
          {/* Cropper replaces this element with its own furniture. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={frame} alt="" />
          {!ready && !problem ? <p className="admin-editor-waiting">reading the picture…</p> : null}
        </div>

        {problem ? <p className="admin-error admin-editor-problem">{problem}</p> : null}

        <div className="admin-editor-tools">
          {/* Looking at it. */}
          <span className="admin-editor-set" role="group" aria-label="The view">
            <button type="button" onClick={() => it()?.zoom(0.15)} title="Closer">
              <Icon name="plus" />
            </button>
            <button type="button" onClick={() => it()?.zoom(-0.15)} title="Further away">
              <Icon name="minus" />
            </button>
            <button type="button" onClick={() => it()?.zoomTo(0)} title="Fit it in the frame">
              fit
            </button>
          </span>

          {/* Turning it. */}
          <span className="admin-editor-set" role="group" aria-label="Turning">
            <button type="button" onClick={() => turn(-90)} title="A quarter turn left">
              <Icon name="turnleft" />
            </button>
            <button type="button" onClick={() => turn(90)} title="A quarter turn right">
              <Icon name="turnright" />
            </button>
            <button type="button" onClick={() => turn(-45)} title="45° left">
              45°
            </button>
          </span>

          {/* The horizon, for the degree or two that a quarter turn cannot say. */}
          <label className="admin-editor-straight">
            <span>straighten</span>
            <input
              type="range"
              min={-45}
              max={45}
              step={1}
              value={angle > 180 ? angle - 360 : angle}
              onChange={(event) => straighten(Number(event.target.value))}
            />
            <em>{angle > 180 ? angle - 360 : angle}°</em>
          </label>

          {/* Flipping it. */}
          <span className="admin-editor-set" role="group" aria-label="Flipping">
            <button
              type="button"
              onClick={() => it()?.scaleX(-(it()?.getData().scaleX ?? 1))}
              title="Mirror left to right"
            >
              <Icon name="flipx" />
            </button>
            <button
              type="button"
              onClick={() => it()?.scaleY(-(it()?.getData().scaleY ?? 1))}
              title="Mirror top to bottom"
            >
              <Icon name="flipy" />
            </button>
          </span>

          {/* The shape, behind one press: nine times in ten it is "any shape",
              and nine buttons for the tenth time is nine buttons too many. */}
          <span className="admin-editor-shape">
            <button
              type="button"
              className={shapes ? "admin-editor-open" : undefined}
              aria-expanded={shapes}
              onClick={() => setShapes((open) => !open)}
            >
              {shape} <span aria-hidden="true">▾</span>
            </button>
            {shapes ? (
              <div className="admin-editor-shapes" role="menu">
                {SHAPES.map((one) => (
                  <button
                    key={one.label}
                    type="button"
                    role="menuitem"
                    className={one.label === shape ? "admin-editor-on" : undefined}
                    onClick={() => take(one.ratio, one.label)}
                  >
                    {one.label}
                    {one.note ? <em>{one.note}</em> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </span>
        </div>

        <footer className="admin-editor-foot">
          <button type="button" className="admin-word" onClick={putItBack} disabled={Boolean(busy)}>
            put it back
          </button>
          <span className="admin-editor-gap" />
          <span className="admin-note" style={{ margin: 0 }}>
            {busy
              ? `${busy}…`
              : `kept at no more than ${LIMITS.edge}px and ${weigh(LIMITS.bytes)}`}
          </span>
          <button type="button" className="admin-word" onClick={onClose} disabled={Boolean(busy)}>
            leave it
          </button>
          <button type="button" className="admin-btn" onClick={keep} disabled={!ready || Boolean(busy)}>
            {busy ? "saving…" : "replace it"}
          </button>
        </footer>
      </div>
    </div>
  );
}
