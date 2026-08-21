"use client";

import { useRef, useState } from "react";
import { type Filmed, uploadFilm, VIDEO_ACCEPTS } from "@/lib/admin/video";
import { Icon } from "./ui";

/**
 * A button that takes a film off your machine, shrinks it, and puts it away.
 *
 * It says what it is doing and how far along it is, in words, the whole time.
 * That is not politeness: shrinking a film happens in real time, so a
 * twenty-second clip takes twenty seconds of apparently nothing, and a minute of
 * apparently nothing is how people conclude a thing is broken and press it again.
 *
 * One at a time. Two films re-encoding at once would each want a canvas and a
 * decoder, and the second one would only make the first one slower.
 */
export default function VideoUploader({
  label = "add a film",
  onDone,
}: {
  label?: string;
  /** Called once the film and its poster are both in the bucket. */
  onDone: (film: Filmed, file: File) => Promise<void> | void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [doing, setDoing] = useState("");
  const [share, setShare] = useState(0);
  const [problem, setProblem] = useState("");
  /** When a film went up without being shrunk, and why. */
  const [asItCame, setAsItCame] = useState("");

  async function take(file: File | null) {
    if (!file) return;
    setProblem("");
    setAsItCame("");
    setDoing("reading it");
    setShare(0);

    try {
      const film = await uploadFilm(file, (stage, howFar) => {
        setDoing(stage);
        setShare(howFar);
      });
      if (film.asItCame) {
        // Not a failure — the film is up and it is small enough to use — but not
        // something to keep quiet either: it is heavier than it needed to be and
        // the only person who can do anything about that is the one standing here.
        setAsItCame(
          `It went up as it came (${(film.bytes / 1_000_000).toFixed(1)} MB): ${film.why}.`,
        );
      }
      await onDone(film, file);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : `${file.name} did not go up.`);
    } finally {
      setDoing("");
      setShare(0);
      if (input.current) input.current.value = "";
    }
  }

  const working = doing !== "";

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={VIDEO_ACCEPTS}
        hidden
        onChange={(event) => void take(event.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        className="admin-btn"
        disabled={working}
        onClick={() => input.current?.click()}
      >
        <Icon name="upload" />
        {working ? `${doing}${share > 0 ? ` ${Math.round(share * 100)}%` : ""}…` : label}
      </button>

      {working ? (
        <p className="admin-note" style={{ margin: 0 }}>
          {/* Said plainly, because it is true and because it is slow. */}
          shrinking a film happens in real time, so this takes about as long as
          the film itself. Stay on this page.
        </p>
      ) : null}

      {asItCame ? <p className="admin-note">{asItCame}</p> : null}

      {problem ? <p className="admin-error">{problem}</p> : null}
    </>
  );
}
