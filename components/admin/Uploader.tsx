"use client";

import { useEffect, useRef, useState } from "react";
import { type Uploaded, uploadPhoto } from "@/lib/admin/upload";
import { Icon } from "./ui";

/**
 * A button that takes pictures off your desktop, and — where a `watch` is asked
 * for — the whole window as a place to drop them.
 *
 * Files are handled one at a time on purpose: five phone photographs at once
 * would each want a canvas the size of the picture, and a laptop will run out
 * of memory before it runs out of patience.
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
  const [queue, setQueue] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [problems, setProblems] = useState<string[]>([]);
  const [hovering, setHovering] = useState(false);

  // onDone comes from the parent's render, so it is a new function every time;
  // the worker below reads it through a ref rather than restarting on each one.
  const latest = useRef(onDone);
  useEffect(() => {
    latest.current = onDone;
  });

  function take(files: FileList | File[] | null) {
    const pictures = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (pictures.length === 0) return;
    setProblems([]);
    setDone(0);
    setQueue((rest) => [...rest, ...(many ? pictures : pictures.slice(0, 1))]);
  }

  /* One picture at a time, until the queue is empty. */
  useEffect(() => {
    if (busy || queue.length === 0) return;
    const [next, ...rest] = queue;
    let cancelled = false;

    setBusy(true);
    void (async () => {
      try {
        const uploaded = await uploadPhoto(next, folder);
        if (!cancelled) await latest.current(uploaded, next);
        if (!cancelled) setDone((count) => count + 1);
      } catch (error) {
        if (!cancelled) {
          setProblems((list) => [
            ...list,
            error instanceof Error ? error.message : `${next.name} did not go up.`,
          ]);
        }
      } finally {
        if (!cancelled) {
          setQueue(rest);
          setBusy(false);
          if (input.current) input.current.value = "";
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queue, busy, folder]);

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

  const working = busy || queue.length > 0;
  const total = done + queue.length;

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
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
          shrinking and putting {queue.length === 1 ? "it" : "them"} away — stay on this page
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

      {hovering ? (
        <div className="admin-drop">
          <div>
            <p>drop them here</p>
            <em>they are shrunk, stripped of the camera&rsquo;s notes and renamed</em>
          </div>
        </div>
      ) : null}
    </>
  );
}
