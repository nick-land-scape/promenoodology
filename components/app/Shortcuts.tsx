"use client";

import Link from "next/link";
import { useState } from "react";
import { useSay } from "./Words";

/**
 * The four rings under the card.
 *
 * They were there before and they did nothing — four buttons with no handlers,
 * one of them called "saved" for a thing this club does not have. Four again, and
 * each one goes somewhere inside the app: what is on, telling somebody about us,
 * your own details, and saying something to us.
 *
 * Telling somebody uses the phone's own share sheet where there is one, because
 * that is where the messages people actually send from live. Where there is not
 * one — a desktop browser, mostly — it falls back to an email, which is the thing
 * a share sheet would have offered anyway.
 */



export default function Shortcuts() {
  const say = useSay();
  const [said, setSaid] = useState("");

  async function tell() {
    const url = "https://promenoodology.com";
    if (navigator.share) {
      try {
        await navigator.share({ title: "promeNOODology", text: say("cut.inviteText"), url });
        return;
      } catch {
        // Dismissed, or refused. Either way, nothing to say about it.
        return;
      }
    }
    window.location.href = `mailto:?subject=${encodeURIComponent("promeNOODology")}&body=${encodeURIComponent(`${say("cut.inviteText")}\n\n${url}`)}`;
    setSaid(say("cut.openingEmail"));
  }

  return (
    <>
      <ul className="shortcuts">
        <li>
          <Link className="shortcut" href="/app/events">
            <span className="shortcut-ring" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <span>{say("cut.whatsOn")}</span>
          </Link>
        </li>

        <li>
          <button type="button" className="shortcut" onClick={() => void tell()}>
            <span className="shortcut-ring" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 16V4m0 0 4 4m-4-4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 14v5.5h14V14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <span>{say("cut.tellSomebody")}</span>
          </button>
        </li>

        <li>
          <Link className="shortcut" href="/app/account/details">
            <span className="shortcut-ring" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.8l1.9 1.1M17.2 15.1l1.9 1.1M4.9 16.2l1.9-1.1M17.2 8.9l1.9-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <span>{say("cut.yourDetails")}</span>
          </Link>
        </li>

        {/* Was "the website". Inside the app that is not a place to go: what is
            on it is in here, and a link out is a way out. */}
        <li>
          <Link className="shortcut" href="/app/contact">
            <span className="shortcut-ring" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M3.5 6h17v12h-17zM3.5 6l8.5 6.5L20.5 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              </svg>
            </span>
            <span>{say("cut.getInTouch")}</span>
          </Link>
        </li>
      </ul>

      {said ? <p className="app-note">{said}</p> : null}
    </>
  );
}
