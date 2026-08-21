"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { liftTheCurtain } from "@/lib/native";
import type { Film } from "@/lib/source";

/**
 * The curtain the app opens with.
 *
 * The same films as the front page of the website, full screen, with the mark
 * multiplied over them — multiply is what makes it look like ink on the picture
 * rather than a sticker over it, because the white of the scan disappears and only
 * the purple stays.
 *
 * Why it is written the way it is:
 *
 * **It waits for the film, but not for long.** The first version held the screen
 * for a flat second and a half and then left, which on any real connection meant
 * the film had not started and nobody ever saw one — the answer to "why isn't the
 * video loading" was that it was, just not in time to be looked at. Now the
 * curtain stays until the film actually has a frame to show, and gives up after
 * two and a half seconds if it does not. An app that waits on a video is worse
 * than an app with no video.
 *
 * **It asks the film to play out loud.** Muted autoplay is allowed in a WebView,
 * but "allowed" is not "always", so play() is called and its refusal is caught
 * rather than left to be silence.
 *
 * **The ink arrives.** The mark is revealed by a sweep across it rather than faded
 * in, so it reads as being painted on — which is what it is, a scan of a brush.
 *
 * **Once a session**, remembered per tab, so it is a way of opening the app rather
 * than a thing that happens between screens.
 */
/**
 * Decided once per page load, outside the component.
 *
 * The effect below used to read sessionStorage and write it in the same breath,
 * which is a bug the moment anything mounts twice — and React mounts everything
 * twice in development on purpose. First run: nothing seen, show the curtain,
 * write "yes". Second run, immediately after: reads its own "yes", concludes the
 * curtain has already been shown, and takes it away before a single frame of it
 * has been drawn. Which is exactly what "the video isn't loading" looked like:
 * the film was fine, the curtain it lives in was being dismissed by itself.
 *
 * A module-scope answer survives the second mount and any remount inside the same
 * page life, and starts again from storage on a real load — which is what "once a
 * session" is supposed to mean.
 */
let decided: boolean | null = null;

export default function Splash({ films }: { films: Film[] }) {
  const film = useRef<HTMLVideoElement>(null);
  /* Null until it is known: the answer lives in sessionStorage and reading that on
     the server would be guessing, so nothing is drawn until it is known and the
     curtain never flashes at somebody who has already seen it. */
  const [show, setShow] = useState<boolean | null>(null);
  const [going, setGoing] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [at, setAt] = useState(0);
  const [still, setStill] = useState(false);

  /* The native launch screen is told to hide itself after a moment (see
     capacitor.config.ts). This lifts it earlier where the bridge is there —
     early, but never load-bearing. */
  useEffect(() => {
    void liftTheCurtain();
  }, []);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    // Already answered in this page life — including by a second mount.
    if (decided !== null) {
      setShow(decided);
      if (decided && films.length > 1) setAt(Math.floor(Math.random() * films.length));
      return;
    }

    let seen = false;
    try {
      seen = sessionStorage.getItem("splashed") === "yes";
    } catch {
      // Storage switched off: it shows every time, which is the harmless way round.
    }

    decided = !seen;
    setShow(decided);
    if (!seen) {
      try {
        sessionStorage.setItem("splashed", "yes");
      } catch {
        /* nothing to remember with */
      }
      if (films.length > 1) setAt(Math.floor(Math.random() * films.length));
    }
  }, [films.length]);

  /*
   * When to leave.
   *
   * Not on a clock alone. The screen behind this is fetched from the server, and
   * leaving before it has arrived shows the skeleton — so the app opened with a
   * curtain, a flash of grey blocks, and then the app. Three states where there
   * should have been one.
   *
   * So it waits for something real to be there: a header, or the door. Bounded at
   * both ends, because neither extreme is acceptable — never less than long
   * enough to see (900ms), never more than three seconds however slow the line is.
   */
  useEffect(() => {
    if (show !== true) return;

    const ready = () =>
      Boolean(
        document.querySelector(".app-column .app-header") ||
          document.querySelector(".app-column .doorway"),
      );

    const earliest = 900;
    const latest = 3000;
    const from = performance.now();

    let watching = 0;
    const look = () => {
      const waited = performance.now() - from;
      if (waited >= latest || (waited >= earliest && ready())) {
        setGoing(true);
        return;
      }
      watching = window.setTimeout(look, 90);
    };
    watching = window.setTimeout(look, earliest);

    return () => window.clearTimeout(watching);
  }, [show]);

  useEffect(() => {
    if (!going) return;
    const gone = window.setTimeout(() => setShow(false), 620);
    return () => window.clearTimeout(gone);
  }, [going]);

  if (!show) return null;

  const chosen = films[at] ?? films[0];

  return (
    <div
      className={[
        "curtain",
        going ? "curtain-going" : "",
        rolling ? "curtain-rolling" : "",
        still ? "curtain-still" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      // A curtain, not a dialogue: the app behind it is already being read out.
      aria-hidden="true"
      // Impatience is allowed.
      onClick={() => setGoing(true)}
    >
      {chosen?.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="curtain-still-frame" src={chosen.poster} alt="" fetchPriority="high" />
      ) : null}

      {chosen && !still ? (
        <video
          ref={film}
          className="curtain-film"
          src={chosen.src}
          poster={chosen.poster ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          tabIndex={-1}
          onCanPlay={() => {
            setRolling(true);
            // Asked out loud: muted autoplay is allowed in a WebView, and
            // "allowed" is not "always".
            film.current?.play().catch(() => {
              /* Refused. The still underneath is doing the job. */
            });
          }}
        />
      ) : null}

      {/* Two multiplied copies, exactly as the front page does it: the ink doubles
          over the busy parts of the picture and the white of the scan disappears. */}
      {[0, 1].map((layer) => (
        <Image
          key={layer}
          className={layer === 0 ? "curtain-mark" : "curtain-mark curtain-mark-ink"}
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
