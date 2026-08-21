"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Mark a passage and a quotation mark appears beside it.
 *
 * The first version of this waited for somebody to press copy and then offered
 * the reference — which works and nobody would ever find, because it asks you to
 * do the thing before it tells you the thing is possible. Marking text is the
 * moment somebody has decided a sentence matters; that is when to offer.
 *
 * Pressing it puts the passage and the reference on the clipboard together. An
 * ordinary copy is left entirely alone: what you copy is what you get, and this
 * is a second, visible way of taking the words that says what it will give you.
 *
 * It stays out of the way of anything that is not reading — a couple of words is
 * somebody grabbing a name, and a selection inside a form is somebody editing.
 */

/** Below this it is not a quotation. Two or three words is nobody quoting. */
const ENOUGH = 25;

type Where = { x: number; y: number };

export default function QuoteThis({
  title,
  year,
  url,
}: {
  title: string;
  year?: string | null;
  url: string;
}) {
  const [passage, setPassage] = useState("");
  const [at, setAt] = useState<Where | null>(null);
  const [done, setDone] = useState(false);
  const [refused, setRefused] = useState(false);
  const mine = useRef(false);

  const forget = useCallback(() => {
    setPassage("");
    setAt(null);
    setDone(false);
    setRefused(false);
  }, []);

  /* What is marked, and where it ends on screen. */
  const look = useCallback(() => {
    // A press on the mark itself is not a change of selection.
    if (mine.current) return;

    const selection = window.getSelection();
    const said = selection?.toString().trim() ?? "";
    if (!selection || selection.isCollapsed || said.length < ENOUGH) {
      forget();
      return;
    }

    const node = selection.anchorNode;
    const parent = node instanceof Element ? node : node?.parentElement;
    if (parent?.closest("input, textarea, [contenteditable='true']")) {
      forget();
      return;
    }

    const boxes = selection.getRangeAt(0).getClientRects();
    const last = boxes[boxes.length - 1];
    if (!last) {
      forget();
      return;
    }

    setPassage(said);
    setDone(false);
    setRefused(false);
    // Just after the end of the marked text, which is where the pointer
    // already is. Kept inside the window: a mark half off the screen is a mark
    // nobody can press.
    setAt({
      x: Math.min(Math.max(12, last.right + 8), window.innerWidth - 130),
      y: Math.min(Math.max(12, last.bottom + 8), window.innerHeight - 52),
    });
  }, [forget]);

  useEffect(() => {
    // Both, because text is marked with a mouse and with a keyboard.
    const later = () => window.setTimeout(look, 0);
    document.addEventListener("pointerup", later);
    document.addEventListener("keyup", later);
    // Scrolling moves the text out from under the mark.
    window.addEventListener("scroll", forget, { passive: true });
    return () => {
      document.removeEventListener("pointerup", later);
      document.removeEventListener("keyup", later);
      window.removeEventListener("scroll", forget);
    };
  }, [look, forget]);

  if (!passage || !at) return null;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const reference = `promeNOODology, “${title}”${year ? `, ${year}` : ""}. ${url} (accessed ${today}).`;
  const quoted = `“${passage.replace(/\s+/g, " ")}”\n\n— ${reference}`;

  /**
   * Two ways of writing to the clipboard, because the good one is refusable.
   *
   * navigator.clipboard needs permission and is turned down in more situations
   * than one would think — an embedded view, a page that has lost focus, a
   * browser being strict. The old execCommand route needs no permission at all
   * as long as it happens inside a click, which this does. Between a deprecated
   * path and a dead button, the button loses.
   */
  async function take() {
    setRefused(false);

    try {
      await navigator.clipboard.writeText(quoted);
      setDone(true);
      return;
    } catch {
      // Fall through to the old way.
    }

    try {
      const hidden = document.createElement("textarea");
      hidden.value = quoted;
      hidden.setAttribute("readonly", "");
      hidden.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(hidden);
      hidden.select();
      const worked = document.execCommand("copy");
      hidden.remove();
      if (worked) {
        setDone(true);
        return;
      }
    } catch {
      // Nothing left to try.
    }

    // Say so rather than sit there. A button that quietly does nothing is worse
    // than one that admits it.
    setRefused(true);
  }

  return (
    <button
      type="button"
      className={["quote-mark", done ? "quote-mark-done" : "", refused ? "quote-mark-sorry" : ""]
        .filter(Boolean)
        .join(" ")}
      style={{ left: at.x, top: at.y }}
      // The press must not count as a change of selection, or the mark takes
      // itself away before it has done anything.
      onPointerDown={() => {
        mine.current = true;
        window.setTimeout(() => {
          mine.current = false;
        }, 400);
      }}
      onClick={take}
      title={
        done
          ? "The passage and the reference are on your clipboard"
          : "Copy this passage with the reference"
      }
    >
      <span aria-hidden="true" className="quote-mark-glyph">
        {done ? "✓" : refused ? "!" : "“"}
      </span>
      {done ? "copied with the source" : refused ? "your browser said no" : "quote this"}
    </button>
  );
}
