"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Film } from "@/lib/source";

/** Knock this many times on the logo to be let into the members' app. */
const KNOCKS = 3;
const KNOCK_WINDOW = 1400;

/**
 * The front page: the video square in the middle, the logo multiplied over it.
 *
 * Moving the pointer nudges the two apart — the video drifts with the cursor,
 * the logo against it. A few pixels only; it should read as the page breathing,
 * not as an effect.
 *
 * Which film you get is decided here rather than on the server, and that is the
 * whole reason it can be more than one: the home page is built once and cached
 * for everybody, so a server that picked would pick once and every visitor for
 * the next minute would see the same one. Picked in the browser, the page stays
 * static and the film is still a surprise.
 *
 * With several films nothing is rendered until that choice is made — the poster
 * alone holds the page. Rendering the first one and then swapping would fetch a
 * film nobody was going to watch.
 */
export default function Hero({
  films,
  heading,
  words,
}: {
  films: Film[];
  /** The page's own title, said where a screen reader will reach it. */
  heading: string;
  /** What this place is, for anybody who cannot watch the film. */
  words: string;
}) {
  const stage = useRef<HTMLElement>(null);
  const frame = useRef(0);
  const knocks = useRef(0);
  const lastKnock = useRef(0);
  const router = useRouter();

  /* One film needs no choosing, so it is drawn straight away. */
  const [at, setAt] = useState<number | null>(films.length > 1 ? null : 0);

  useEffect(() => {
    if (films.length > 1) setAt(Math.floor(Math.random() * films.length));
  }, [films.length]);

  /** Three knocks on the logo, and the door to the members' app opens. */
  const knock = () => {
    const now = performance.now();
    knocks.current = now - lastKnock.current > KNOCK_WINDOW ? 1 : knocks.current + 1;
    lastKnock.current = now;
    if (knocks.current >= KNOCKS) {
      knocks.current = 0;
      router.push("/app");
    }
  };

  const track = useCallback((clientX: number, clientY: number) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const element = stage.current;
      if (!element) return;
      // -1 … 1 from the middle of the window in both directions.
      element.style.setProperty("--px", ((clientX / window.innerWidth) * 2 - 1).toFixed(3));
      element.style.setProperty("--py", ((clientY / window.innerHeight) * 2 - 1).toFixed(3));
    });
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (event: PointerEvent) => track(event.clientX, event.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame.current);
    };
  }, [track]);

  const film = at === null ? null : films[at];
  /* Before the choice, the first film's still: they are all the same square, and
     the page should not be blank paper while the dice are rolled. */
  const poster = film?.poster ?? films[0]?.poster ?? null;

  return (
    <main className="hero" ref={stage}>
      {/*
       * The only words on the front page, and they are not shown.
       *
       * That is not a trick played on a search engine: the film and the mark
       * carry the page for anybody who can see them, and this is what somebody
       * who cannot gets instead of a video with no soundtrack and an image with
       * an empty alt. It says the same thing the page says — which is the test —
       * and the fact that it is also the only thing a crawler can read here is a
       * consequence of the design rather than the reason for the words.
       */}
      <h1 className="visually-hidden">{heading}</h1>
      <p className="visually-hidden">{words}</p>

      {/* The still under the film, and all there is to look at until one has
          been chosen. Not next/image: it is one fixed square that wants to be
          the first thing fetched, not a set of sizes.
          eslint-disable-next-line @next/next/no-img-element */}
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="hero-poster" src={poster} alt="" aria-hidden="true" fetchPriority="high" />
      ) : null}

      {film ? (
        <video
          // A fresh element per film: changing the src of a playing video is not
          // reliably a reload, and this one only ever loads once.
          key={film.id}
          className="hero-video"
          src={film.src}
          poster={film.poster ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}

      {/* Tab once and the way into the members' app shows itself. */}
      <Link href="/app" className="hero-door">
        members’ app
      </Link>

      {/* Two multiplied copies: the ink doubles in density over busy parts of
          the picture, while the white of the scan stays invisible. */}
      {[0, 1].map((layer) => (
        <Image
          key={layer}
          onClick={layer === 0 ? knock : undefined}
          className={layer === 0 ? "hero-logo hero-knock" : "hero-logo hero-logo-ink"}
          src="/logo.png"
          alt=""
          aria-hidden="true"
          width={1600}
          height={1600}
          priority={layer === 0}
          sizes="(max-width: 767px) 74vmin, min(62vmin, 560px)"
        />
      ))}
    </main>
  );
}
