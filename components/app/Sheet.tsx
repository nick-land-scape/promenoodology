"use client";

import { useEffect, useRef } from "react";

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
  const box = useRef<HTMLDivElement>(null);

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

  return (
    <div
      className={open ? "sheet is-open" : "sheet"}
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
            aria-label="Close"
            tabIndex={open ? 0 : -1}
          >
            ×
          </button>
        </div>

        <div className="sheet-roll">{children}</div>
      </div>
    </div>
  );
}
