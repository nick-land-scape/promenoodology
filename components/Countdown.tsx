"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useKnock } from "@/lib/knock";
import { LAUNCH, launchWhereYouAre } from "@/lib/launch";

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

/**
 * The clock on the holding page.
 *
 * Nothing is shown until the browser has read its own clock. The page is built
 * long before anybody looks at it, so the server has no honest numbers to put
 * here — printing a set from build time would only flicker and correct itself.
 *
 * `when` is the moment in Swiss time, worked out on the server and handed down
 * as text so both sides of the page agree on the wording.
 */
export default function Countdown({ when }: { when: string }) {
  const [left, setLeft] = useState<number | null>(null);
  const [local, setLocal] = useState<string | null>(null);
  const knock = useKnock();

  useEffect(() => {
    const timer = setInterval(tick, 1000);

    function tick() {
      const remaining = Math.max(0, LAUNCH - Date.now());
      setLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }

    // A phone that has been asleep comes back with the wrong numbers on screen;
    // catch up the moment it wakes.
    const wake = () => {
      if (!document.hidden) tick();
    };

    tick();
    setLocal(launchWhereYouAre());
    document.addEventListener("visibilitychange", wake);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);

  const waiting = left === null;
  const arrived = left !== null && left <= 0;

  const seconds = Math.floor((left ?? 0) / 1000);
  const parts = {
    days: Math.floor(seconds / DAY),
    hours: Math.floor((seconds % DAY) / HOUR),
    minutes: Math.floor((seconds % HOUR) / MINUTE),
    seconds: seconds % MINUTE,
  };

  return (
    <main className="holding">
      <h1 className="visually-hidden">promeNOODology</h1>

      {/* The mark is painted, not drawn, so it is multiplied onto the paper —
          and it is the way in: three knocks and you are asked who you are. */}
      <Image
        className="holding-mark"
        onClick={knock}
        src="/logo.png"
        alt=""
        aria-hidden="true"
        width={1600}
        height={1600}
        priority
        sizes="min(52vmin, 420px)"
      />

      {arrived ? (
        <p className="holding-done">
          It is time. The new promeNOODology is here.
          <br />
          {/* Deliberately not a client-side link: a whole new request is what
              asks the proxy again, and the proxy is what opens the door. */}
          <a className="holding-again" href="/">
            have a look
          </a>
        </p>
      ) : (
        <>
          <p className="holding-line">A new website is on its way</p>

          {/* Hidden rather than absent until the first tick, so the page does
              not shift under anybody when the numbers arrive. */}
          <div className="holding-count" role="timer" data-ready={waiting ? "no" : "yes"}>
            {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
              <span className="holding-unit" key={unit}>
                <span className="holding-number">
                  {unit === "days" ? parts.days : String(parts[unit]).padStart(2, "0")}
                </span>
                <span className="holding-label">{unit}</span>
              </span>
            ))}
          </div>

          {when ? (
            <p className="holding-when">
              {when}
              {local ? (
                <span className="holding-zone">that is {local} where you are</span>
              ) : null}
            </p>
          ) : null}
        </>
      )}

      {/* Read out in whole minutes: the seconds would talk over everything else.
          The wording only changes once a minute, so nothing is announced in
          between even though the clock beside it is still counting. */}
      <p className="visually-hidden" aria-live="polite">
        {waiting ? "" : spoken(parts, arrived)}
      </p>

      <address className="holding-contact">
        <a href="https://www.instagram.com/promenoodology/" target="_blank" rel="noreferrer">
          @promeNOODology
        </a>
        <a href="mailto:info@promeNOODology.com">info@promeNOODology.com</a>
      </address>
    </main>
  );
}

/** How long is left, in words a screen reader can read out sensibly. */
function spoken(parts: { days: number; hours: number; minutes: number }, arrived: boolean) {
  if (arrived) return "The new promeNOODology website is here.";

  const said: string[] = [];
  if (parts.days) said.push(count(parts.days, "day"));
  if (parts.hours) said.push(count(parts.hours, "hour"));
  said.push(count(parts.minutes, "minute"));

  return `${said.join(", ")} until the new website.`;
}

function count(many: number, thing: string) {
  return `${many} ${thing}${many === 1 ? "" : "s"}`;
}
