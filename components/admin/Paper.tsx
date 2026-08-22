"use client";

import { useEffect, useRef, useState } from "react";
import FlyerBook from "@/components/FlyerBook";
import { uploadFile } from "@/lib/admin/upload";
import { pagesOf } from "@/lib/pdf-pages";
import { Bin } from "./ui";

/**
 * A file that is not a picture: the flyer.
 *
 * Deliberately not the photograph uploader. That one measures a picture, shrinks
 * it and throws its EXIF away, all of which is right for a photograph and wrong
 * for a document somebody designed — the whole point of offering a flyer is that
 * it arrives exactly as it left.
 *
 * It shows the flyer rather than the word "PDF". It was three controls in a
 * column with nothing at all to say whether there *was* one or what it was:
 * "look at it" and "take it off" both pointed at something invisible, and
 * "another one" only made sense to somebody who already knew there was one. The
 * first page is drawn here, in the browser, by the same PDF.js the reader on the
 * site uses — so what an editor sees is what a reader gets — and the three acts
 * are now three separate, labelled things: look through it, replace it, bin it.
 */
export default function Paper({
  path,
  url,
  folder,
  onDone,
  onClear,
}: {
  path: string | null;
  /** Where it can be looked at. */
  url: string;
  folder: string;
  onDone: (path: string) => void;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);
  const [problem, setProblem] = useState("");
  const [cover, setCover] = useState<string | null>(null);

  /* The first page, drawn once per flyer. Only the first: this is a thumbnail,
     and drawing the rest of a twenty-page programme to show one of them would
     be work nobody asked for. */
  useEffect(() => {
    if (!url) {
      setCover(null);
      return;
    }
    let gone = false;
    void (async () => {
      try {
        const [first] = await pagesOf(url, { scale: 0.8, only: 1 });
        if (!gone) setCover(first ?? null);
      } catch {
        // A flyer that will not draw is still attached, and still downloadable.
        if (!gone) setCover(null);
      }
    })();
    return () => {
      gone = true;
    };
  }, [url]);

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

  /*
   * What to call it: the name of the file as it was uploaded, with the uuid in
   * front of it taken off — that part is ours and says nothing to anybody. Only
   * where something is left in front of the dot: ".pdf" is an extension, not a
   * name.
   */
  const named = path ? (path.split("/").pop() ?? "").replace(/^[0-9a-f-]{36}-?/i, "") : "";
  const called = /^[^.\s]/.test(named) ? named : "the flyer";

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(event) => void take(event.target.files?.[0])}
      />

      <div className="admin-paper">
        <span className="admin-paper-sheet">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" draggable={false} />
          ) : (
            <span className="admin-paper-none">{path ? "drawing it…" : "no flyer yet"}</span>
          )}
        </span>

        <span className="admin-paper-does">
          {path ? <strong>{called}</strong> : null}

          {path ? (
            <FlyerBook
              src={url}
              title={called}
              words={{
                open: "look through it",
                take: "take it as a PDF ↓",
                before: "The page before",
                after: "The next page",
              }}
            />
          ) : null}

          <span className="admin-paper-row">
            <button
              type="button"
              className="admin-btn"
              disabled={working}
              onClick={() => input.current?.click()}
            >
              {working ? "uploading…" : path ? "replace it" : "choose a PDF"}
            </button>
            {path ? <Bin what="this flyer" onClick={onClear} /> : null}
          </span>
        </span>
      </div>

      {problem ? <p className="admin-error">{problem}</p> : null}
    </>
  );
}
