"use client";

import { useRef, useState } from "react";
import { uploadFile } from "@/lib/admin/upload";
import { Icon, Word } from "./ui";

/**
 * A file that is not a picture: the flyer.
 *
 * Deliberately not the photograph uploader. That one measures a picture, shrinks
 * it and throws its EXIF away, all of which is right for a photograph and wrong
 * for a document somebody designed — the whole point of offering a flyer is that
 * it arrives exactly as it left.
 */
export default function Paper({
  path,
  url,
  folder,
  onDone,
  onClear,
}: {
  path: string | null;
  /** Where it can be looked at, for the link. */
  url: string;
  folder: string;
  onDone: (path: string) => void;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState("");

  async function take(file: File | undefined) {
    if (!file) return;
    setProblem("");
    setWorking(true);
    try {
      onDone(await uploadFile(file, folder));
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "That would not upload.");
    } finally {
      setWorking(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(event) => void take(event.target.files?.[0])}
      />

      {path ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="admin-word">
          look at it ↗
        </a>
      ) : null}

      <button
        type="button"
        className="admin-btn"
        disabled={working}
        onClick={() => input.current?.click()}
      >
        <Icon name="upload" />
        {working ? "uploading…" : path ? "another one" : "a PDF"}
      </button>

      {path ? (
        <Word danger onClick={onClear}>
          take it off
        </Word>
      ) : null}

      {problem ? <span className="admin-error">{problem}</span> : null}
    </span>
  );
}
