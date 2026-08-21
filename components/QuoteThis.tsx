"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Somebody has just copied a passage. Offer them the reference to go with it.
 *
 * The idea is a newspaper's: a quotation is not much use without the thing it
 * came from, and the moment to hand somebody the source is the moment they take
 * the words — not on a page they would have to come back to.
 *
 * It asks rather than acts. Quietly rewriting what somebody put on their
 * clipboard is the kind of helpfulness that makes people distrust a website: they
 * pressed copy, and what they get should be what they copied until they say
 * otherwise. So the copy goes through untouched, and this offers to replace it.
 *
 * It keeps out of the way of anything that is not reading: a couple of words is
 * somebody grabbing a name, not quoting, and a selection inside a form is
 * somebody editing.
 */

/** Below this, nobody is quoting. */
const ENOUGH = 40;

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
  const [done, setDone] = useState(false);
  const [refused, setRefused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forget = useCallback(() => {
    setPassage("");
    setDone(false);
    setRefused(false);
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const copied = () => {
      const said = window.getSelection()?.toString().trim() ?? "";
      if (said.length < ENOUGH) return;

      // Anything inside a form is somebody editing, not somebody quoting.
      const where = window.getSelection()?.anchorNode;
      const parent = where instanceof Element ? where : where?.parentElement;
      if (parent?.closest("input, textarea, [contenteditable='true']")) return;

      setPassage(said);
      setDone(false);
      if (timer.current) clearTimeout(timer.current);
      // Long enough to notice and read, short enough not to sit there.
      timer.current = setTimeout(() => setPassage(""), 12_000);
    };

    document.addEventListener("copy", copied);
    return () => {
      document.removeEventListener("copy", copied);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!passage) return null;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const reference = `promeNOODology, “${title}”${year ? `, ${year}` : ""}. ${url} (accessed ${today}).`;
  // Curly quotes and an em dash, because this is going into somebody's writing.
  const quoted = `“${passage.replace(/\s+/g, " ")}”\n\n— ${reference}`;

  /**
   * Two ways of writing to the clipboard, because the good one is refusable.
   *
   * navigator.clipboard needs permission and is turned down in more situations
   * than one would think — an embedded view, a page that has lost focus, a
   * browser being strict. The old execCommand route needs no permission at all
   * as long as it happens inside a click, which this does. It is deprecated and
   * it works, and between a deprecated path and a dead button the button loses.
   */
  async function take() {
    setRefused(false);
    try {
      await navigator.clipboard.writeText(quoted);
      finish();
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
        finish();
        return;
      }
    } catch {
      // Nothing left to try.
    }

    // Say so, and leave the passage on screen to be taken by hand. A button
    // that quietly does nothing is worse than one that admits it.
    setRefused(true);
  }

  function finish() {
    setDone(true);
    setRefused(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPassage(""), 2600);
  }

  const words = passage.split(/\s+/).filter(Boolean).length;

  return (
    <aside className="quoting" role="status">
      <p className="quoting-said">
        {done
          ? "Copied, with the reference underneath it."
          : refused
            ? "Your browser would not let us write to the clipboard — the reference is below, to take by hand."
            : `You have copied ${words} words. Take the reference with them?`}
      </p>

      {done ? null : (
        <p className={refused ? "quoting-shape quoting-all" : "quoting-shape"}>
          {/* Refused: the whole reference, selectable. Otherwise the tail of the
              passage, which is enough to show what is on offer. */}
          {refused ? null : <span>“…{passage.replace(/\s+/g, " ").slice(-46)}”</span>}
          <em>{refused ? reference : `— ${reference}`}</em>
        </p>
      )}

      <p className="quoting-does">
        {done || refused ? null : (
          <button type="button" className="text-button" onClick={take}>
            yes, with the reference
          </button>
        )}
        <button type="button" className="quoting-shut" onClick={forget}>
          {done || refused ? "close" : "no, thanks"}
        </button>
      </p>
    </aside>
  );
}
