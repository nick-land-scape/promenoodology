"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buzz } from "@/lib/native";

/** How far down before it counts as an ask. */
const ENOUGH = 72;
/** Nothing moves further than this, however hard it is pulled. */
const MOST = 108;

/**
 * Pull the screen down to ask again.
 *
 * The one gesture missing from this app. On a phone, a list that cannot be pulled
 * is a list you have to distrust — there is no other way of saying "is that still
 * true?", and people try it on anything that scrolls whether or not it works.
 *
 * Written by hand rather than pulled in, and the reason is the same reason the
 * gesture has to exist at all: the whole of it is in the details. It only starts
 * at the very top of the page, it gives up the moment a finger travels sideways
 * (which is how the map's sheet and the chips keep working), it resists as it
 * goes — a pull of a hundred and eighty points moves the paper about a hundred —
 * and it buzzes once at the point where letting go would do something, so the
 * decision is made through the fingertip rather than by reading a label.
 */
export default function PullDown() {
  const router = useRouter();
  const [drawn, setDrawn] = useState(0);
  const [asking, setAsking] = useState(false);
  const grab = useRef<{ y: number; x: number; live: boolean } | null>(null);
  const rang = useRef(false);

  useEffect(() => {
    const start = (event: TouchEvent) => {
      // Only from the very top, and only when nothing else is being dragged.
      if (window.scrollY > 1 || asking) return;
      const touch = event.touches[0];
      grab.current = { y: touch.clientY, x: touch.clientX, live: false };
      rang.current = false;
    };

    const move = (event: TouchEvent) => {
      const hold = grab.current;
      if (!hold) return;
      const touch = event.touches[0];
      const down = touch.clientY - hold.y;
      const across = Math.abs(touch.clientX - hold.x);

      // A sideways drag is somebody else's gesture: a sheet, a row of chips, the
      // map. Give it up rather than fight it.
      if (!hold.live && (across > 12 || down < 0)) {
        if (across > 12 || down < -4) grab.current = null;
        return;
      }
      if (down <= 0) return;
      hold.live = true;

      /* Resistance. The paper follows the thumb at first and then increasingly
         does not, which is what tells a hand it has reached the end of something
         without anything being written down. */
      const moved = Math.min(MOST, down * 0.55);
      setDrawn(moved);

      if (!rang.current && moved >= ENOUGH) {
        rang.current = true;
        void buzz("light");
      }

      // Stop the page itself bouncing while the paper is being pulled.
      if (event.cancelable) event.preventDefault();
    };

    const end = () => {
      const hold = grab.current;
      grab.current = null;
      if (!hold?.live) return;

      setDrawn((was) => {
        if (was >= ENOUGH) {
          setAsking(true);
          void buzz("medium");
          router.refresh();
          // Long enough to be seen, short enough not to be waited for. The screen
          // underneath has already been replaced by then.
          window.setTimeout(() => {
            setAsking(false);
            setDrawn(0);
          }, 900);
          return ENOUGH;
        }
        return 0;
      });
    };

    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end, { passive: true });
    document.addEventListener("touchcancel", end, { passive: true });
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", end);
    };
  }, [asking, router]);

  const ready = drawn >= ENOUGH;

  return (
    <div
      className={`pulldown${asking ? " is-asking" : ""}${drawn > 0 ? " is-drawn" : ""}`}
      style={{ height: drawn, opacity: Math.min(1, drawn / ENOUGH) }}
      aria-hidden={!asking}
      aria-live="polite"
    >
      <span
        className="pulldown-mark"
        style={{ transform: `rotate(${asking ? 0 : Math.min(180, (drawn / ENOUGH) * 180)}deg)` }}
      >
        {asking ? <span className="pulldown-turning" /> : ready ? "↑" : "↓"}
      </span>
    </div>
  );
}
