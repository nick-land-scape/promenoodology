"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { liftTheCurtain, reloadWhenStale } from "@/lib/native";

/**
 * The curtain the app opens with: the mark on paper, and nothing else on it.
 *
 * It had a film in it, and the film was the problem. A web page cannot begin until
 * the web view has fetched it, so the earliest the film could start was about a
 * second in — by which time the screen behind was ready and the film had time for
 * half of one before it was dismissed. The app opened on three states (mark on
 * paper, film, app) where there should have been one continuous picture. A native
 * player was tried in its place and works, but it is a second copy of the same
 * opening, in another language, needing a build for every change to it.
 *
 * So: the mark, on the same paper as the launch screen, at the same size and in
 * the same position — which means the still iOS draws before this app is running
 * and the first frame of this component are the same picture. Nothing is seen
 * happening at the join. Then the ink deepens, a light crosses it, and the app is
 * underneath.
 *
 * Once a session, remembered per tab, so it is a way of opening the app rather
 * than something that happens between screens.
 */

/*
 * Decided once per page load, outside the component.
 *
 * The effect below used to read sessionStorage and write it in the same breath,
 * which is a bug the moment anything mounts twice — and React mounts everything
 * twice in development on purpose. First run: nothing seen, show the curtain,
 * write "yes". Second run, immediately after: reads its own "yes", concludes the
 * curtain has already been shown, and takes it away before a single frame of it
 * has been drawn.
 *
 * A module-scope answer survives the second mount and any remount inside the same
 * page life, and starts again from storage on a real load — which is what "once a
 * session" is supposed to mean.
 */
let decided: boolean | null = null;

export default function Splash() {
  /* Null until it is known: the answer lives in sessionStorage and reading that
     on the server would be guessing, so nothing is drawn until it is known and
     the curtain never flashes at somebody who has already seen it. */
  const [show, setShow] = useState<boolean | null>(null);
  const [going, setGoing] = useState(false);
  const [still, setStill] = useState(false);

  /* The launch screen can go the moment this is on the screen: it is the same
     mark on the same paper, so there is nothing to wait for. And come back to a
     fresh copy after a long time away — a web view keeps its page for days, so an
     app left in the background sits on a version of itself that was published
     before whatever changed. */
  useEffect(() => {
    void liftTheCurtain();
    return reloadWhenStale(30);
  }, []);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    // Already answered in this page life — including by a second mount.
    if (decided !== null) {
      setShow(decided);
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
    }
  }, []);

  /*
   * When to leave.
   *
   * Not on a clock alone. The screen behind this is fetched from the server, and
   * leaving before it has arrived shows the skeleton — so the app opened with a
   * curtain, a flash of grey blocks, and then the app. Three states where there
   * should have been one.
   *
   * So it waits for something real: a header, or the door. Bounded at both ends,
   * because neither extreme is acceptable — never less than long enough for the
   * mark to have moved, never more than two and a half seconds however slow the
   * line is.
   */
  useEffect(() => {
    if (show !== true) return;

    const ready = () =>
      Boolean(
        document.querySelector(".app-column .app-header") ||
          document.querySelector(".app-column .doorway"),
      );

    const earliest = 1100;
    const latest = 2600;
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

  return (
    <div
      className={[
        "curtain",
        going ? "curtain-going" : "",
        still ? "curtain-still" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      // A curtain, not a dialogue: the app behind it is already being read out.
      aria-hidden="true"
      // Impatience is allowed.
      onClick={() => setGoing(true)}
    >
      {/* The mark, and a light that crosses it. The light is masked to the ink
          rather than laid over the whole screen: a band travelling across paper is
          a lens flare, and this club does not own one. */}
      <span className="curtain-ink">
        <Image
          className="curtain-mark"
          src="/logo.png"
          alt=""
          width={1600}
          height={1600}
          priority
          sizes="74vmin"
        />
        <span className="curtain-sheen" aria-hidden="true" />
      </span>
    </div>
  );
}
