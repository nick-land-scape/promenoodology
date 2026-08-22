"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { PageFlip } from "page-flip";
import Linked from "./Linked";
import type { Leaf } from "@/lib/source";

/**
 * The handbook, as a book.
 *
 * This is the one piece of writing on the site that is meant to be *given* to
 * somebody — how to put on something like ours in your own street — and it had
 * the shape of everything else: a column two thousand words long that you get to
 * the end of by scrolling for a minute and remember nothing of. A book is a
 * shape people already know how to hold. You turn a page, you know roughly where
 * you are in it, and each page is a thing of a size that can be finished.
 *
 * Three things about how it is built, all of them the same decision:
 *
 * The pages are rendered on the server, as plain divs, before any of this runs.
 * The turning is put on top of them afterwards — StPageFlip takes the elements
 * that are already there. So a reader with no JavaScript, a search engine, and a
 * printer all get the whole handbook as a column of words, which is what it is;
 * everybody else gets a book. Nothing here is the only way to read it.
 *
 * Nothing is re-rendered once the library has the pages. This is not a
 * preference. The library takes the leaves out of where React put them and hangs
 * them in a structure of its own; React, on the next render, finds its children
 * somewhere unexpected and puts them back — and the book silently returns to
 * page one every time the page number underneath it changes. Which it does on
 * every turn. So the leaves are their own component, memoised on props that
 * never change, and everything that *does* change — which page you are on,
 * whether it makes a sound — lives outside them.
 *
 * And it does not turn at all for somebody who has asked their machine for less
 * movement. A page that folds over in a second is exactly the animation that
 * setting exists for.
 */
export default function Handbook({
  leaves,
  title,
  paper,
  numbers,
  offerSound,
  words,
}: {
  leaves: Leaf[];
  /** What is written on the cover, under the mark. */
  title: string;
  /** "site" | "warm" | "white" — see the handbook's settings in /admin. */
  paper: string;
  numbers: boolean;
  offerSound: boolean;
  /* Handed in rather than held here: the words the site says are looked up on
     the server, where the language is known. */
  words: {
    cover: string;
    of: string;
    soundOn: string;
    soundOff: string;
    before: string;
    after: string;
  };
}) {
  const holder = useRef<HTMLDivElement>(null);
  const book = useRef<PageFlip | null>(null);
  const noise = useRef<AudioContext | null>(null);

  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const [spread, setSpread] = useState(false);
  const [sound, setSound] = useState(false);
  /* The same answer, where the book can reach it. The library is handed one
     turn-handler at mount and keeps it for ever, so a handler that closed over
     the state would be for ever hearing the answer the reader gave before they
     were asked. */
  const wanted = useRef(false);

  /* Whether the last turn was asked for by the reader. The library fires "flip"
     for its own first layout as well, and a book that greets you with a rustle
     is a book that made a noise nobody asked for. */
  const turning = useRef(false);

  /** A page of paper, made rather than downloaded: a short burst of noise that
      fades, band-passed to the frequencies paper actually moves at. It is one
      small function and no file to fetch, which for a sound this incidental is
      the whole argument. */
  const rustle = useCallback(() => {
    if (!wanted.current) return;
    try {
      const context =
        noise.current ??
        (noise.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());
      if (context.state === "suspended") void context.resume();

      const seconds = 0.3;
      const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
      const wave = buffer.getChannelData(0);
      for (let i = 0; i < wave.length; i += 1) {
        const through = i / wave.length;
        // Quick in, long out: the sound of one sheet passing another.
        wave[i] = (Math.random() * 2 - 1) * (1 - through) ** 2.4 * Math.min(1, through * 30);
      }

      const source = context.createBufferSource();
      source.buffer = buffer;

      const band = context.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 1800;
      band.Q.value = 0.7;

      const level = context.createGain();
      level.gain.value = 0.16;

      source.connect(band).connect(level).connect(context.destination);
      source.start();
    } catch {
      // A browser that will not make a sound is not a broken handbook.
    }
  }, []);

  useEffect(() => {
    // What the reader asked their machine for, before anything else.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (leaves.length < 2) return;

    let gone = false;

    void (async () => {
      const { PageFlip: Flip } = await import("page-flip");
      const element = holder.current;
      if (gone || !element) return;

      const pages = element.querySelectorAll<HTMLElement>(".handbook-leaf");
      if (pages.length === 0) return;

      const flip = new Flip(element, {
        // The proportions of a small printed handbook rather than a screen. The
        // real size comes from "stretch" and the bounds underneath.
        width: 420,
        height: 580,
        size: "stretch",
        minWidth: 260,
        maxWidth: 620,
        minHeight: 380,
        maxHeight: 820,
        // One page where the window is narrow — which is a phone, and the whole
        // of the app. Two where there is room, which is a real open book.
        usePortrait: true,
        /* There is a cover, and it is a real one: the mark, and the name of the
           thing under it in the same hand the mark is drawn in. It stands alone
           on the right the way a closed book does, and it is stiff — see
           data-density on it below — because a cover that folds like a page is
           the one detail that gives the whole illusion away. */
        showCover: true,
        drawShadow: true,
        flippingTime: 700,
        maxShadowOpacity: 0.35,
        // Otherwise a finger meant for the page underneath turns the page.
        mobileScrollSupport: true,
        /*
         * Pages are turned with the buttons, the arrow keys and a finger — not
         * by dragging with a mouse.
         *
         * The library starts a drag on mousedown anywhere on a page, which is
         * also how somebody selects a sentence: pressing on the words and moving
         * turned the leaf instead of marking anything, so "quote this" could
         * never appear in the one piece of writing here that exists to be quoted
         * and handed on. Dragging is the nicer gesture; being able to take the
         * words is the point of the book.
         */
        useMouseEvents: false,
        showPageCorners: true,
      });

      flip.on("flip", (event) => {
        setAt(Number(event.data));
        if (turning.current) rustle();
        turning.current = false;
      });
      flip.on("changeOrientation", (event) => setSpread(event.data === "landscape"));

      flip.loadFromHTML(pages);
      book.current = flip;
      setSpread(flip.getOrientation() === "landscape");
      setOpen(true);
    })();

    return () => {
      gone = true;
      book.current?.destroy();
      book.current = null;
      void noise.current?.close();
      noise.current = null;
    };
    // Mounted once, on purpose: see the note at the top about not re-rendering
    // pages the library is holding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaves.length]);

  const go = useCallback((where: "back" | "on") => {
    turning.current = true;
    if (where === "on") book.current?.flipNext();
    else book.current?.flipPrev();
  }, []);

  // The arrow keys, because it is a book and that is what people press.
  useEffect(() => {
    if (!open) return;
    const listen = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go("on");
      if (event.key === "ArrowLeft") go("back");
    };
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, [open, go]);

  // What the reader said last time about the sound.
  useEffect(() => {
    const on = window.localStorage.getItem("handbook-sound") === "on";
    setSound(on);
    wanted.current = on;
  }, []);

  /* The cover is a page as far as the book is concerned and not a page as far
     as a reader is concerned, so the count says "cover" for the first one and
     numbers the rest from one. */
  const total = leaves.length;
  const sheets = total + 1;

  return (
    <div className={["handbook-book", open ? "is-open" : "", `paper-${paper}`].filter(Boolean).join(" ")}>
      <Leaves leaves={leaves} title={title} numbers={numbers} holder={holder} />

      {/* Only once the book is really a book. Until then the pages above are the
          handbook, and buttons that turned nothing would be a lie. */}
      {open ? (
        <div className="handbook-controls">
          <button type="button" onClick={() => go("back")} disabled={at === 0} aria-label={words.before}>
            ←
          </button>

          <span className="handbook-where" aria-live="polite">
            {numbers
              ? at === 0
                ? words.cover
                : spread && at + 1 <= total
                  ? `${at}–${Math.min(at + 1, total)} ${words.of} ${total}`
                  : `${at} ${words.of} ${total}`
              : null}
          </span>

          <button
            type="button"
            onClick={() => go("on")}
            disabled={at >= sheets - (spread ? 2 : 1)}
            aria-label={words.after}
          >
            →
          </button>

          {offerSound ? (
            <button
              type="button"
              className={sound ? "handbook-sound is-on" : "handbook-sound"}
              aria-pressed={sound}
              onClick={() => {
                const next = !sound;
                setSound(next);
                wanted.current = next;
                window.localStorage.setItem("handbook-sound", next ? "on" : "off");
                // Pressing it is the gesture a browser wants before it will
                // make any sound at all, so the first one is made here.
                if (next) rustle();
              }}
              title={sound ? "Turning a page makes a sound" : "Turning a page is silent"}
            >
              {sound ? words.soundOn : words.soundOff}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The pages themselves, drawn once and then left alone.
 *
 * Memoised on props that do not change, which is what makes "left alone" true
 * rather than hopeful: the parent re-renders on every turn, and without this
 * React would reconcile these nodes against the ones the library has moved and
 * quietly wind the book back to the beginning.
 */
const Leaves = memo(function Leaves({
  leaves,
  title,
  numbers,
  holder,
}: {
  leaves: Leaf[];
  title: string;
  numbers: boolean;
  holder: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="handbook-leaves" ref={holder}>
      {/* The cover. "hard" is the library's word for a leaf that does not bend,
          which is what a cover is. Before the book exists it is simply the top of
          the page, which is no worse than the heading it replaces. */}
      <div className="handbook-leaf handbook-cover" data-density="hard">
        <div className="handbook-leaf-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="promeNOODology" width={600} height={582} />
          <span className="handbook-cover-name">{title}</span>
        </div>
      </div>

      {leaves.map((leaf, index) => (
        <div className="handbook-leaf" key={leaf.id} data-density="soft">
          <div className="handbook-leaf-in">
            {leaf.blocks.map((block, at) =>
              block.kind === "heading" ? (
                <h2 key={at} className="handbook-heading">
                  <span className="handbook-number">{String(index + 1).padStart(2, "0")}</span>
                  {block.text}
                </h2>
              ) : (
                <p key={at} className="handbook-text">
                  <Linked>{block.text}</Linked>
                </p>
              ),
            )}
            {numbers ? <span className="handbook-folio">{index + 1}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
});
