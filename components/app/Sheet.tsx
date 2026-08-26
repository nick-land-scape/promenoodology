"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { inTheApp, whenTheKeyboard } from "@/lib/native";
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
   * The shell has no transform of its own, so fixed still means fixed.
   *
   * Into a node of its own inside the shell, rather than into the shell itself.
   * The shell is React's: React keeps a list of what is in it and puts that list
   * back whenever the screen changes. A portalled node is not on that list, so
   * moving between tabs ended in "the node to be removed is not a child of this
   * node" and the pop-up vanished from the document altogether. This node is made
   * here, by hand, and React has never heard of it. */
  const [into, setInto] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const host = document.createElement("div");
    host.className = "sheet-host";
    (document.querySelector(".app-shell") ?? document.body).append(host);
    setInto(host);
    return () => host.remove();
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
   * the keyboard rather than a full-height one behind it.
   *
   * Belt as well as braces, though, because that measurement cannot be relied on:
   * this is a web view inside an app, not Safari, and what it reports when a
   * keyboard comes up is the web view's business. So the sheet also comes to the
   * top of the screen while somebody is typing in it — see `typing` below. If the
   * measurement arrives, the sheet is exactly as tall as the room above the
   * keyboard; if it does not, the sheet is at the top of the screen and its own
   * scroller reaches the rest, which is the difference between cramped and gone. */
  const [covered, setCovered] = useState(0);
  /* Whether a keyboard is up at all. Inside the app this is all the plugin is
     asked for: how *tall* it is belongs to the web view, which has already been
     made that much shorter. */
  const [keyboard, setKeyboard] = useState(false);

  /* The phone's own number — and inside the app it is *not* the number to keep
   * clear at the foot of the sheet, which is the whole of this bug.
   *
   * This is the measurement `visualViewport` cannot give inside the app, and it is
   * the *only* one now: the keyboard plugin is set to `resize: "none"` (see
   * capacitor.config.ts), so the web view keeps the whole screen and a keyboard
   * arriving changes nothing the page can otherwise read. The plugin says how tall
   * it is, twice — as it starts coming up and again when it is up — and the first
   * of those is what lets the sheet move *with* the keyboard rather than after it.
   *
   * For a day this was wrong in the other direction: the plugin was left on its
   * `native` default, which shortens the web view, and the sheet went on keeping
   * the same three hundred points clear as well. Two mechanisms accounting for one
   * strip of glass, and the sheet was pushed until its head left the top of the
   * screen. One mechanism now, and it is this one.
   *
   * Whether a keyboard is up is worth knowing separately: it is what tells the
   * sheet not to fall back on leaping to the top. */
  useEffect(() => {
    if (!open) return;
    return whenTheKeyboard((height) => {
      setKeyboard(height > 0);
      setCovered(Math.round(height));
    });
  }, [open]);

  /* And the browser's own, where that is the right answer — but only there.
   *
   * One of the two, never both: inside the app the visual viewport reads nothing
   * however tall the keyboard is, and letting it write that nothing would undo
   * what the phone had just said on the next pixel of movement. */
  useEffect(() => {
    const seen = window.visualViewport;
    if (!open || !seen || inTheApp()) {
      if (!open) setCovered(0);
      return;
    }

    const measure = () =>
      setCovered(
        Math.max(0, Math.round(window.innerHeight - seen.height - seen.offsetTop)),
      );

    measure();
    seen.addEventListener("resize", measure);
    seen.addEventListener("scroll", measure);
    return () => {
      seen.removeEventListener("resize", measure);
      seen.removeEventListener("scroll", measure);
    };
  }, [open]);

  /* Whether the sheet has to get out of the way, and this is the fiddliest thing
   * in the file.
   *
   * A sheet resting on the bottom edge of the window is the right place for it
   * until something is standing on that edge. Two things can be: a keyboard, and
   * iOS's own wheel for a `<select>`.
   *
   * The wheel is not our problem. It is the operating system's, it is drawn over
   * everything, and it goes away by itself — a sheet that leapt to the top of the
   * screen because somebody tapped "how many of you" and leapt back when they let
   * go is a sheet that jumps for no reason. So only a field somebody can *type*
   * into counts, which is a text input or a textarea and not a select.
   *
   * And the leap is a last resort, not the first move. If the web view tells us
   * how tall the keyboard is — see `--covered` above — then the sheet simply keeps
   * that much clear at its foot and stays where it is, which is what a native
   * sheet does and the only version of this with no jump in it at all. The leap is
   * for the case where nothing is reported, which cannot be ruled out inside an
   * app: a third of a second after the field takes focus, if nothing has moved,
   * the sheet goes to the top of the screen where nothing can be over it. */
  const [typing, setTyping] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!open) {
      setFocused(false);
      return;
    }

    const box = wall.current;

    const raisesAKeyboard = (what: Element | null) => {
      if (!what || !box?.contains(what)) return false;
      if (what.tagName === "TEXTAREA") return true;
      if (what.tagName !== "INPUT") return false;
      const kind = (what as HTMLInputElement).type;
      return !["checkbox", "radio", "range", "button", "submit", "file", "color"].includes(kind);
    };

    const look = () => setFocused(raisesAKeyboard(document.activeElement));

    /* Asked as well as listened for. Whoever opens this focuses a field in the
       same breath as the press — that is the whole reason the sheet stays mounted
       — so by the time this runs the focus has already happened and there is no
       event left to hear. */
    look();
    box?.addEventListener("focusin", look);
    /* Focus out is asked a beat later on purpose: moving from the words to the
       place is a focusout and a focusin, and reading `activeElement` between them
       says "nothing", which would drop the sheet and raise it again on every
       field. */
    const off = () => window.setTimeout(look, 0);
    box?.addEventListener("focusout", off);
    return () => {
      box?.removeEventListener("focusin", look);
      box?.removeEventListener("focusout", off);
    };
  }, [open]);

  /* And the leap, which is the last resort and knows it.
   *
   * If the web view says how tall the keyboard is, the sheet keeps that much clear
   * at its foot and does not move — a native sheet riding up with the keyboard,
   * and the only version of this with no jump in it. Inside an app it may say
   * nothing at all: with `contentInset: never` the visual viewport does not shrink
   * for a keyboard, and 120 points is the line between "told us something useful"
   * and "told us about a toolbar, or nothing".
   *
   * Then, a third of a second in — long enough for the keyboard to have finished
   * arriving and said its piece — the sheet goes to the top of the screen, where
   * nothing can be over it. And it comes straight back down the moment a real
   * measurement does arrive, which is why this watches `covered` rather than
   * deciding once. */
  useEffect(() => {
    /* Inside the app there is nothing to leap over, ever. The web view is made
       shorter by the keyboard, so the bottom of this window *is* the top of the
       keyboard and a sheet resting there is already clear of it.
     *
     * Waiting for the plugin to confirm that was the flicker: for a third of a
     * second after the field took focus, nothing had said a keyboard was coming,
     * the timer below fired, and the sheet leapt to the top of the screen — then
     * came straight back down when the keyboard announced itself. A jump and a
     * jump back, in the moment somebody is looking at it hardest. The condition
     * for leaping is "the web view will not tell us", and inside the app it always
     * tells us, by shortening itself. */
    if (!focused || covered >= 120 || inTheApp()) {
      setTyping(false);
      return;
    }
    const waiting = window.setTimeout(() => setTyping(true), 340);
    return () => window.clearTimeout(waiting);
  }, [focused, covered, keyboard]);

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

    /* And held there, which `overflow: hidden` alone does not do inside an app.
     *
     * When a field takes focus, iOS scrolls whatever it is in until it can see it
     * — and it does that to the web view's own scroll view, which has never heard
     * of `overflow: hidden`. The field here is inside something fixed to the
     * window, so there was nothing to reveal and it scrolled anyway: the screen
     * behind slid up by the height of the keyboard's own toolbar and the header
     * printed itself across the clock. Whatever the page was showing when the
     * sheet opened, it goes on showing. */
    const held = window.scrollY;
    const hold = () => {
      if (window.scrollY !== held) window.scrollTo(0, held);
    };
    window.addEventListener("scroll", hold);

    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("scroll", hold);
      body.style.overflow = was;
    };
  }, [open, onClose]);

  if (!into) return null;

  return createPortal(
    <div
      className={
        open ? (typing ? "sheet is-open is-typing" : "sheet is-open") : "sheet"
      }
      ref={wall}
      style={{ "--covered": `${covered}px` } as React.CSSProperties}
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
