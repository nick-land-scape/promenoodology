"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Knocks on the mark, and how long it waits for the next one. */
const KNOCKS = 3;
const KNOCK_PAUSE = 400;

/**
 * The way in. There is no sign-in link anywhere on the site, on purpose: knock
 * three times quickly on the mark and you are asked who you are.
 *
 * Used by the menu and by the holding page, so the gesture is the same before
 * the site opens as after it.
 *
 * The mark waits a moment before doing its ordinary job, rather than doing it on
 * the first click. Without the pause the first knock carried you off to the front
 * page, the second and third landed on a different page, and the secret read as
 * broken — which is exactly how it read. The pause is shorter than a
 * double-click, so an ordinary click still feels like a click.
 *
 * The count lives in refs so it survives re-rendering. The clock on the holding
 * page re-renders every second, which would otherwise reset it constantly.
 *
 * (The logo on the front page has a knock of its own, in Hero: same gesture,
 * different door — that one opens the members' app.)
 */
export function useKnock(
  to = "/account/sign-in",
  /** Where an ordinary single click goes. Left out, it goes nowhere. */
  ordinary?: string,
) {
  const router = useRouter();
  const knocks = useRef(0);
  const waiting = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (waiting.current) clearTimeout(waiting.current);
    },
    [],
  );

  return (event: React.MouseEvent) => {
    // A middle click, or one with a modifier held, means "open it somewhere
    // else". The browser is better at that than we are.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    event.preventDefault();

    knocks.current += 1;
    if (waiting.current) clearTimeout(waiting.current);

    if (knocks.current >= KNOCKS) {
      knocks.current = 0;
      router.push(to);
      return;
    }

    waiting.current = setTimeout(() => {
      knocks.current = 0;
      if (ordinary) router.push(ordinary);
    }, KNOCK_PAUSE);
  };
}
