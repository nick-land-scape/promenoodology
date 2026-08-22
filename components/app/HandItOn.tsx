"use client";

import { useState } from "react";
import { buzz, inTheApp, shareNatively } from "@/lib/native";

/**
 * Hand this sheet to somebody.
 *
 * The whole point of a sheet is that it leaves: it is the one address in this
 * project anybody can open with no account, so the useful button is not "read"
 * but "send". In the app that is the phone's own share sheet — every messenger
 * somebody actually uses is in there and none of them are ours to choose. In a
 * browser it copies the address, which is the same act with fewer manners.
 *
 * Deliberately not a link to the page: following it would take a member out of
 * the app and into the website, which is the one thing the app does not do.
 */
export default function HandItOn({
  title,
  where,
}: {
  /** What is being handed on, for the message that goes with it. */
  title: string;
  /** The public address of the sheet. */
  where: string;
}) {
  const [said, setSaid] = useState("");

  async function pass() {
    void buzz("light");
    const words = `${title} — how to put one on, and what it takes: ${where}`;

    if (inTheApp()) {
      const gone = await shareNatively({
        title: `${title} — do it yourself`,
        text: words,
        url: where,
      });
      if (gone) return;
    }

    /* No share sheet: the clipboard, then. `navigator.share` is missing on most
       desktop browsers and refuses outside a gesture on some phones, and either
       way somebody who pressed this wants the address in their hand. */
    try {
      await navigator.clipboard.writeText(where);
      setSaid("Copied. Paste it anywhere.");
    } catch {
      setSaid(where);
    }
  }

  return (
    <div className="hand-on">
      <button type="button" className="pill" onClick={() => void pass()}>
        send this to somebody
      </button>
      {said ? <p className="app-note">{said}</p> : null}
      <p className="app-note">
        No account needed at the other end. That is the point of it.
      </p>
    </div>
  );
}
