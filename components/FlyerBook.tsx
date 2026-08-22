"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PageFlip } from "page-flip";
import { pagesOf } from "@/lib/pdf-pages";

/**
 * The flyer, looked through rather than downloaded.
 *
 * A PDF handed to a browser opens the browser's own reader: a grey toolbar, a
 * scroll bar, somebody else's idea of what a document is. This one is two sides
 * of a printed sheet with a drawing on the front, and the way anybody looks at
 * two sides of a printed sheet is by turning it over.
 *
 * So the same book the handbook is: the pages are drawn out of the PDF and
 * turned. What is different here is where the pages come from — PDF.js renders
 * each one to a canvas, and nothing at all is loaded until somebody asks to
 * look. A reader who only wanted the download never pays for any of it.
 *
 * The leaves are built by hand rather than rendered by React, deliberately: the
 * turning library moves those nodes into a structure of its own, and React
 * putting them back where it thinks they belong is what silently returns a book
 * to page one on every turn. Nothing React draws is ever inside the book.
 *
 * And the whole thing is hung on the body rather than where it is written. A
 * cover over the page has to be above everything on it, and z-index cannot
 * promise that from inside: any ancestor with a transform, a filter or an
 * opacity of its own makes a stacking context, and inside one a z-index of two
 * hundred competes only with its siblings. Worse, `position: fixed` inside a
 * transformed ancestor is not fixed to the window at all. On the body there is
 * nothing above it to be trapped by, on either the site or the back of the
 * house.
 */
export default function FlyerBook({
  src,
  title,
  words,
}: {
  src: string;
  title: string;
  /* Handed in rather than held here: this is a client component, and the words
     the site says are looked up on the server where the language is known. */
  words: { open: string; take: string; before: string; after: string };
}) {
  const [open, setOpen] = useState(false);
  /* Where the cover is hung. Found after the first paint, because on the server
     there is no body to hang it on. */
  const [where, setWhere] = useState<HTMLElement | null>(null);
  useEffect(() => setWhere(document.body), []);
  const [pages, setPages] = useState<string[]>([]);
  const [at, setAt] = useState(0);
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);

  const holder = useRef<HTMLDivElement>(null);
  const book = useRef<PageFlip | null>(null);
  /** Every page as a small picture, for the strip along the bottom. */
  const shots = useRef<string[]>([]);

  /* Escape closes it, which is what escape does to anything that covers the
     page, and the body stops scrolling underneath while it is open. */
  useEffect(() => {
    if (!open) return;
    const listen = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") book.current?.flipNext();
      if (event.key === "ArrowLeft") book.current?.flipPrev();
    };
    window.addEventListener("keydown", listen);
    const had = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", listen);
      document.body.style.overflow = had;
    };
  }, [open]);

  /** The PDF, page by page, as pictures. Done once and kept. */
  const draw = useCallback(async () => {
    if (shots.current.length > 0) return shots.current;
    shots.current = await pagesOf(src, { scale: 2 });
    return shots.current;
  }, [src]);

  // Drawn, then turned. Both only once somebody has asked to look.
  useEffect(() => {
    if (!open) return;
    let gone = false;

    void (async () => {
      setLoading(true);
      setProblem("");
      try {
        const drawn = await draw();
        if (gone) return;
        setPages(drawn);

        const { PageFlip: Flip } = await import("page-flip");
        const element = holder.current;
        if (gone || !element) return;

        // Built by hand: see the note at the top about why React never owns these.
        element.innerHTML = "";
        const first = new Image();
        first.src = drawn[0];
        await new Promise((done) => {
          first.onload = done;
          first.onerror = done;
        });
        if (gone) return;

        for (const shot of drawn) {
          const leaf = document.createElement("div");
          leaf.className = "flyer-leaf";
          const picture = document.createElement("img");
          picture.src = shot;
          picture.alt = "";
          picture.draggable = false;
          leaf.appendChild(picture);
          element.appendChild(leaf);
        }

        const tall = first.naturalHeight / (first.naturalWidth || 1) || 1.414;
        const wide = Math.min(520, Math.round((window.innerHeight * 0.72) / tall));

        const flip = new Flip(element, {
          width: wide,
          height: Math.round(wide * tall),
          size: "stretch",
          minWidth: 200,
          maxWidth: 620,
          minHeight: 280,
          maxHeight: 900,
          usePortrait: true,
          showCover: true,
          drawShadow: true,
          flippingTime: 650,
          maxShadowOpacity: 0.4,
          mobileScrollSupport: false,
          useMouseEvents: true,
          showPageCorners: true,
        });

        flip.on("flip", (event) => setAt(Number(event.data)));
        flip.loadFromHTML(element.querySelectorAll(".flyer-leaf"));
        book.current = flip;
      } catch (error) {
        setProblem(
          error instanceof Error
            ? `The flyer would not open here: ${error.message}`
            : "The flyer would not open here.",
        );
      } finally {
        if (!gone) setLoading(false);
      }
    })();

    return () => {
      gone = true;
      book.current?.destroy();
      book.current = null;
    };
  }, [open, draw]);

  return (
    <>
      <button type="button" className="flyer-open" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2zM12 6.5v14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {words.open}
      </button>

      {open && where
        ? createPortal(
        <div
          className="flyer-over"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — the flyer`}
        >
          {/* The ground closes it. Everything above it stops the click. */}
          <button
            type="button"
            className="flyer-ground"
            aria-label="Close the flyer"
            onClick={() => setOpen(false)}
          />

          <div className="flyer-panel">
            <header className="flyer-bar">
              <span className="flyer-name">{title}</span>
              <span className="flyer-does">
                {/* The download lives in here now rather than beside the button
                    that opens it: somebody who wants the file wants it after
                    they have looked, and two offers of the same PDF on one page
                    read as two different things. */}
                <a className="flyer-take" href={src} download target="_blank" rel="noopener noreferrer">
                  {words.take}
                </a>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                  ×
                </button>
              </span>
            </header>

            {problem ? (
              <p className="flyer-problem">
                {problem}{" "}
                <a href={src} target="_blank" rel="noopener noreferrer">
                  Open the PDF itself instead.
                </a>
              </p>
            ) : null}

            {loading ? <p className="flyer-waiting">drawing the pages…</p> : null}

            <div className="flyer-book" ref={holder} />

            {pages.length > 1 ? (
              <footer className="flyer-foot">
                <button
                  type="button"
                  onClick={() => book.current?.flipPrev()}
                  disabled={at === 0}
                  aria-label={words.before}
                >
                  ←
                </button>

                {/* The pages, small. On two sides of a sheet it is a nicety; on
                    a programme of twenty it is the only way back to the one you
                    half remember. */}
                <span className="flyer-thumbs">
                  {pages.map((shot, index) => (
                    <button
                      key={index}
                      type="button"
                      className={index === at ? "is-here" : undefined}
                      onClick={() => book.current?.turnToPage(index)}
                      aria-label={`Page ${index + 1}`}
                      aria-current={index === at}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shot} alt="" draggable={false} />
                      <em>{index + 1}</em>
                    </button>
                  ))}
                </span>

                <button
                  type="button"
                  onClick={() => book.current?.flipNext()}
                  disabled={at >= pages.length - 1}
                  aria-label={words.after}
                >
                  →
                </button>
              </footer>
            ) : null}
          </div>
        </div>,
            where,
          )
        : null}
    </>
  );
}
