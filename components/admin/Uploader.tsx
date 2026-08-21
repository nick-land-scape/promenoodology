"use client";

import { useEffect, useRef, useState } from "react";
import { ACCEPTS, type Uploaded, uploadPhoto } from "@/lib/admin/upload";
import { Icon } from "./ui";

/**
 * A button that takes pictures off your desktop, and — where a `watch` is asked
 * for — the whole window as a place to drop them.
 *
 * Files are handled one at a time on purpose: five phone photographs at once
 * would each want a canvas the size of the picture, and a laptop will run out of
 * memory before it runs out of patience.
 *
 * The one-at-a-time worker is a plain async loop kicked off by a ref, and it has
 * to be. It used to be an effect that depended on `busy` and also set `busy` —
 * so it re-ran itself, its own cleanup marked the first run as cancelled, and
 * every result was thrown away behind a `!cancelled` guard. The queue stopped on
 * the first file, for ever, saying "1 of 3" whether the upload had succeeded or
 * been refused. Which is what it did: the server answered 400 and nobody was
 * ever told.
 *
 * Nothing about the loop below may depend on state it also writes.
 */
export default function Uploader({
  folder,
  label = "add photographs",
  many = true,
  watchWindow = false,
  onDone,
}: {
  /** Where in the bucket: "resources", "profiles/<id>", … */
  folder: string;
  label?: string;
  many?: boolean;
  /** Also accept files dropped anywhere on the page. */
  watchWindow?: boolean;
  /** Called once per picture, as soon as it is in the bucket. */
  onDone: (photo: Uploaded, file: File) => Promise<void> | void;
}) {
  const input = useRef<HTMLInputElement>(null);
  /** How many are still to go. Only for showing — the queue itself is a ref. */
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(0);
  const [problems, setProblems] = useState<string[]>([]);
  const [hovering, setHovering] = useState(false);

  // onDone comes from the parent's render, so it is a new function every time;
  // the worker below reads it through a ref rather than restarting on each one.
  const latest = useRef(onDone);
  useEffect(() => {
    latest.current = onDone;
  });

  /* The work itself lives in refs. State is only what the person sees. */
  const waiting = useRef<File[]>([]);
  const running = useRef(false);

  async function work() {
    if (running.current) return;
    running.current = true;

    try {
      while (waiting.current.length > 0) {
        const next = waiting.current[0];
        try {
          const uploaded = await uploadPhoto(next, folder);
          await latest.current(uploaded, next);
          setDone((count) => count + 1);
        } catch (error) {
          setProblems((list) => [
            ...list,
            error instanceof Error ? error.message : `${next.name} did not go up.`,
          ]);
        } finally {
          // Off the front whatever happened, or one bad file blocks the rest.
          waiting.current = waiting.current.slice(1);
          setLeft(waiting.current.length);
        }
      }
    } finally {
      running.current = false;
      if (input.current) input.current.value = "";
    }
  }

  function take(files: FileList | File[] | null) {
    // HEIC arrives with an empty type on some machines, so the name has to be
    // allowed to speak for it.
    const pictures = Array.from(files ?? []).filter(
      (file) =>
        file.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|avif|heic|heif|gif|svg)$/i.test(file.name),
    );
    if (pictures.length === 0) return;

    const taking = many ? pictures : pictures.slice(0, 1);
    setProblems([]);
    setDone(0);
    waiting.current = [...waiting.current, ...taking];
    setLeft(waiting.current.length);
    void work();
  }

  /* Dropping files anywhere on the page. */
  useEffect(() => {
    if (!watchWindow) return;

    let depth = 0;
    const carriesFiles = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files");

    const enter = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setHovering(true);
    };
    const over = (event: DragEvent) => {
      if (carriesFiles(event)) event.preventDefault();
    };
    const leave = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setHovering(false);
    };
    const drop = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      // Without this the browser opens the file instead.
      event.preventDefault();
      depth = 0;
      setHovering(false);
      take(event.dataTransfer?.files ?? null);
    };

    window.addEventListener("dragenter", enter);
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    };
  }, [watchWindow]);

  const working = left > 0;
  const total = done + left;

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={ACCEPTS}
        multiple={many}
        hidden
        onChange={(event) => take(event.target.files)}
      />

      <button
        type="button"
        className="admin-btn"
        disabled={working}
        onClick={() => input.current?.click()}
      >
        <Icon name="upload" />
        {working ? `${done + 1} of ${total}…` : label}
      </button>

      {working ? (
        <span className="admin-note" style={{ margin: 0 }}>
          shrinking and putting {left === 1 ? "it" : "them"} away — stay on this page
        </span>
      ) : null}

      {problems.length > 0 ? (
        <p className="admin-error">
          {problems.map((problem) => (
            <span key={problem} style={{ display: "block" }}>
              {problem}
            </span>
          ))}
        </p>
      ) : null}

      {/* The whole window, the moment a file crosses it. Dropping worked before
          this and said nothing until it had, so nobody trusted it. */}
      {hovering ? (
        <div className="admin-drop">
          <div className="admin-drop-frame">
            <p>drop it like it&rsquo;s hot</p>
            <em>shrunk, renamed, and the camera&rsquo;s notes left behind</em>
          </div>
        </div>
      ) : null}
    </>
  );
}
