"use client";

import { useEffect, useState } from "react";

/**
 * Contact us, as the only thing on the screen.
 *
 * It was a footer: three lines under a rule at the bottom of every page on a
 * phone, which is where a footer goes and also where nothing is ever read. And
 * before that it was a lane turned on its side up the left margin, costing
 * twenty-six points of a three-hundred-and-seventy-five point screen for three
 * words.
 *
 * So on a phone it is a button in the strip along the top and, when pressed, the
 * whole screen: two addresses set as large as they will go, because there are
 * only two and they are the point of the page they are on. A close in the corner,
 * and nothing else — no form, no fields, no "how can we help".
 *
 * Not a page of its own, deliberately. Getting in touch is not somewhere you go;
 * it is something you do from wherever you are, and coming back afterwards should
 * not be a navigation.
 */
export default function ContactPop({ words }: { words?: { open: string; heading: string } }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    const body = document.body;
    const was = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      body.style.overflow = was;
    };
  }, [open]);

  return (
    <>
      <button type="button" className="contact-open" onClick={() => setOpen(true)}>
        {words?.open ?? "contact"}
      </button>

      {open ? (
        <div className="contact-pop" role="dialog" aria-modal="true" aria-label="Contact us">
          <button
            type="button"
            className="contact-shut"
            onClick={() => setOpen(false)}
            aria-label="Close"
            autoFocus
          >
            ×
          </button>

          <div className="contact-pop-in">
            <p className="contact-pop-said">{words?.heading ?? "contact us"}</p>
            <a
              className="contact-pop-link"
              href="https://www.instagram.com/promenoodology/"
              target="_blank"
              rel="noreferrer"
            >
              @promeNOODology
            </a>
            <a className="contact-pop-link" href="mailto:info@promeNOODology.com">
              info@promeNOODology.com
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
