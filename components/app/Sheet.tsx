"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSay } from "./Words";

/**
 * The one pop-up in this app.
 *
 * Everything that used to open *underneath* something opens in here instead: the
 * form for saying you are coming, the box for saying something to everyone. In a
 * row that is a hundred points tall, an inline form pushes the thing it belongs
 * to off the screen and leaves you filling in a box with no idea what it is for.
 * A sheet comes up over the lot, says at the top which evening it is about, and
 * takes the whole width for the questions.
 *
 * Written once, and this is the point of it. Two inline forms had two ideas about
 * spacing, two ways of closing, and neither of them stopped the page behind from
 * scrolling. One component means one answer to all of that, and the next thing
 * that needs a form does not get a third.
 *
 * Two things it does that are easy to leave out and impossible to add later:
 *
 * **It stays mounted.** `open` toggles classes, not existence — because a field
 * that does not exist cannot be focused, and on iOS a field focused any later
 * than the tap that asked for it gets a caret and no keyboard. Whoever opens this
 * can therefore focus something inside it in the same breath as the press.
 *
 * **The page behind holds still.** Without that, opening a sheet on a long screen
 * and closing it again puts you somewhere else entirely.
 */
export default function Sheet({
  open,
  title,
  said,
  onClose,
  children,
}: {
  open: boolean;
  /** What this is about, in the sheet's own header. */
  title: string;
  /** One quiet line under it, where there is something worth saying. */
  said?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const say = useSay();
  const box = useRef<HTMLDivElement>(null);
  const wall = useRef<HTMLDivElement>(null);
  /* Rendered at the top of the app rather than where it is written.
   *
   * `position: fixed` is only fixed to the window while no ancestor has a
   * transform — and every screen in this app arrives with one, because each child
   * of the column is animated in. A sheet written inside a row therefore fixed
   * itself to the row, which on the front screen meant a form appearing over the
   * evening it belonged to instead of over the screen.
   *
   * Into the shell and not into the body, though, and that part is not a detail:
   * the app's own measurements — the gutter, the hairline, the grey, the height of
   * a button — are declared on `.app-shell`, so a sheet parked on the body
   * inherits none of them. It looked like it worked, because most of what it
   * declares does not depend on them; what it actually did was quietly drop every
   * `border: 1px solid var(--hair)` in the pop-up, which is how the days you were
   * meant to be choosing between arrived as five lines of unboxed text with no
   * tick beside them. A shorthand holding an undefined variable is invalid at
   * computed-value time, and an invalid border is no border at all.
   *
   * The shell has no transform of its own, so fixed still means fixed. */
  const [into, setInto] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setInto(document.querySelector<HTMLElement>(".app-shell") ?? document.body);
  }, []);

  /* Room for the keyboard.
   *
   * A sheet is fixed to the window, and the window does not know the keyboard
   * exists: iOS puts three hundred points of it over the bottom of the screen and
   * every measurement stays exactly as it was, so the field somebody is typing
   * into, the send button and half the form end up underneath it. The visual
   * viewport is the only thing that does know — it is the part of the window you
   * can actually see — so the difference between it and the window is the height
   * of whatever is covering the rest. The sheet keeps that much clear at its foot
   * and gives up as much of its own height, so it is a shorter sheet sitting on
   * the keyboard rather than a full-height one behind it. */
  useEffect(() => {
    const seen = window.visualViewport;
    if (!open || !seen) return;

    const measure = () => {
      const covered = Math.max(
        0,
        window.innerHeight - seen.height - seen.offsetTop,
      );
      wall.current?.style.setProperty("--covered", `${Math.round(covered)}px`);
    };

    measure();
    seen.addEventListener("resize", measure);
    seen.addEventListener("scroll", measure);
    return () => {
      seen.removeEventListener("resize", measure);
      seen.removeEventListener("scroll", measure);
      wall.current?.style.removeProperty("--covered");
    };
  }, [open]);

  /* Escape closes it, and the page behind does not move while it is open. */
  useEffect(() => {
    if (!open) return;

    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);

    const body = document.body;
    const was = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", key);
      body.style.overflow = was;
    };
  }, [open, onClose]);

  if (!into) return null;

  return createPortal(
    <div
      className={open ? "sheet is-open" : "sheet"}
      ref={wall}
      /* Hidden from everything, not only from the eye, when it is shut — but
         still in the document, so what is inside it can take focus the instant it
         is opened. */
      aria-hidden={!open}
      onClick={(press) => {
        // Only the paper behind it closes it, not a press inside the sheet.
        if (press.target === press.currentTarget) onClose();
      }}
    >
      <div
        className="sheet-box"
        ref={box}
        role="dialog"
        aria-modal={open}
        aria-label={title}
      >
        <div className="sheet-head">
          <span className="sheet-bar" aria-hidden="true" />
          <div className="sheet-titled">
            <p className="sheet-title">{title}</p>
            {said ? <p className="sheet-said">{said}</p> : null}
          </div>
          <button
            type="button"
            className="sheet-shut"
            onClick={onClose}
            aria-label={say("sheet.close")}
            tabIndex={open ? 0 : -1}
          >
            ×
          </button>
        </div>

        <div className="sheet-roll">{children}</div>
      </div>
    </div>,
    into,
  );
}
