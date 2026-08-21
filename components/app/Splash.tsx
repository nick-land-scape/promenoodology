"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Film } from "@/lib/source";

/**
 * The screen while the app opens.
 *
 * The same films as the front page of the website, full screen, with the logo
 * multiplied over them — the multiply is what makes it look like ink on the
 * picture rather than a sticker over it, because the white of the scan disappears
 * and only the purple stays.
 *
 * Three things it is careful about:
 *
 * It shows once a session. A splash on every navigation is a splash you learn to
 * hate, so it is remembered in sessionStorage — which is per tab and forgotten
 * when the tab closes, so opening the app tomorrow gets it again.
 *
 * It leaves on its own. The app underneath is already rendered behind it; this is
 * not waiting for anything, so it fades after a moment rather than hanging on for
 * a film to load. Pressing it also dismisses it, because being made to look at a
 * splash is the one thing worse than one you did not ask for.
 *
 * It is not shown to anybody who has asked for less movement — they get the still
 * and no fade, for the same moment.
 */
export default function Splash({ films }: { films: Film[] }) {
  /* Null until it is known: the answer lives in sessionStorage, and reading that
     on the server would be guessing. Nothing is drawn until it is known, so the
     splash never flashes at somebody who has already seen it. */
  const [show, setShow] = useState<boolean | null>(null);
  const [going, setGoing] = useState(false);
  const [at, setAt] = useState(0);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("splashed") === "yes";
      sessionStorage.setItem("splashed", "yes");
    } catch {
      // A browser with storage switched off. It gets the splash every time,
      // which is the harmless way round.
    }
    if (seen) {
      setShow(false);
      return;
    }

    setShow(true);
    if (films.length > 1) setAt(Math.floor(Math.random() * films.length));

    const leaving = window.setTimeout(() => setGoing(true), 1500);
    const gone = window.setTimeout(() => setShow(false), 2100);
    return () => {
      window.clearTimeout(leaving);
      window.clearTimeout(gone);
    };
  }, [films.length]);

  if (!show) return null;

  const film = films[at] ?? films[0];

  return (
    <div
      className={going ? "splash splash-going" : "splash"}
      // Not a dialog and not a button: it is a curtain. It says nothing to a
      // screen reader, which is already reading the app behind it.
      aria-hidden="true"
      onClick={() => setGoing(true)}
    >
      {film?.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="splash-still" src={film.poster} alt="" fetchPriority="high" />
      ) : null}

      {film ? (
        <video
          className="splash-film"
          src={film.src}
          poster={film.poster ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
        />
      ) : null}

      {/* Two copies, multiplied, exactly as the front page does it: the ink
          doubles over the busy parts of the picture and the white of the scan
          disappears. */}
      {[0, 1].map((layer) => (
        <Image
          key={layer}
          className={layer === 0 ? "splash-mark" : "splash-mark splash-mark-ink"}
          src="/logo.png"
          alt=""
          width={1600}
          height={1600}
          priority={layer === 0}
          sizes="74vmin"
        />
      ))}
    </div>
  );
}
