"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

/** Knocks on the mark, and how long you have to make them. */
const KNOCKS = 3;
const KNOCK_WINDOW = 1500;

/**
 * The way in. There is no sign-in link anywhere on the site, on purpose: knock
 * three times quickly on the mark and you are asked who you are.
 *
 * Used by the menu and by the holding page, so the gesture is the same before
 * the site opens as after it. The first two clicks still do whatever the mark
 * normally does — go home, or nothing at all on the holding page; only the
 * third is swallowed.
 *
 * The count lives in refs so it survives re-rendering. The clock on the holding
 * page re-renders every second, which would otherwise reset it constantly.
 *
 * (The logo on the front page has a knock of its own, in Hero: same gesture,
 * different door — that one opens the members' app.)
 */
export function useKnock(to = "/account/sign-in") {
  const router = useRouter();
  const knocks = useRef(0);
  const last = useRef(0);

  return (event: React.MouseEvent) => {
    const now = Date.now();
    knocks.current = now - last.current > KNOCK_WINDOW ? 1 : knocks.current + 1;
    last.current = now;

    if (knocks.current < KNOCKS) return;

    knocks.current = 0;
    event.preventDefault();
    router.push(to);
  };
}
