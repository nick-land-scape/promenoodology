"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/*
 * The five screens the bar switches between. Only these remember where you were,
 * and the distinction is the whole design: a tab is a place you keep coming back
 * to, and coming back to the top of it every time is the app forgetting what you
 * were doing. An evening, a story, somebody's page — those are things you open,
 * and a thing you open starts at its beginning.
 */
const TABS = ["/app", "/app/events", "/app/read", "/app/connect", "/app/account"];

/** Where the app keeps this, and for how long: one run of the app. */
const KEY = "where-you-were";

/**
 * Where you were on each tab.
 *
 * The web's answer to navigation is to go to the top, which is right for a link
 * and wrong for a tab bar. Scroll halfway down what's on, look something up under
 * read, come back — and on a phone you expect to be exactly where you left off,
 * because that is what every native tab bar has done since there were tab bars.
 * Ours put you back at the top of a screen you had already read half of.
 *
 * Two halves, and the fiddly one is the second.
 *
 * **Remembering** happens as you scroll rather than as you leave. Saving on the
 * way out sounds tidier and does not work: by the time this knows the screen has
 * changed, the framework has already scrolled the window to the top, so what
 * there is to save is zero. A position written on every scroll is always the last
 * one that was true.
 *
 * **Putting it back** has to wait for the screen to be tall enough to hold it.
 * The new screen arrives from the server, so for a frame or two it is a hundred
 * points of header and nothing else — scrolling to six hundred at that moment
 * does nothing at all, and the framework's own scroll-to-top lands after it
 * anyway. So it asks on every frame, until the page is long enough, and gives up
 * after two thirds of a second rather than fighting somebody who has started
 * scrolling themselves.
 */
export default function Keeps() {
  const pathname = usePathname();
  /* The screen we are on, as the saving code sees it. A ref rather than the
     variable itself: the scroll listener is set up once and would otherwise keep
     writing the first screen's name for ever. */
  const here = useRef(pathname);
  here.current = pathname;

  /* Remembering. */
  useEffect(() => {
    let waiting = 0;
    const keep = () => {
      waiting = 0;
      if (!TABS.includes(here.current)) return;
      try {
        const all = read();
        all[here.current] = Math.round(window.scrollY);
        sessionStorage.setItem(KEY, JSON.stringify(all));
      } catch {
        // No storage, no memory. Nothing else here depends on it.
      }
    };

    /* Once a frame at most. A scroll event fires more often than that and none of
       the extra ones say anything new. */
    const onScroll = () => {
      if (!waiting) waiting = window.requestAnimationFrame(keep);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (waiting) window.cancelAnimationFrame(waiting);
    };
  }, []);

  /* Putting it back. */
  useEffect(() => {
    if (!TABS.includes(pathname)) return;

    let at = 0;
    try {
      at = read()[pathname] ?? 0;
    } catch {
      return;
    }
    if (at < 40) return; // Near enough the top to be the top.

    const from = performance.now();
    let asking = 0;
    /* Somebody who starts scrolling has answered the question themselves. */
    let theirs = false;
    const mine = () => {
      theirs = true;
    };
    window.addEventListener("touchstart", mine, { passive: true, once: true });
    window.addEventListener("wheel", mine, { passive: true, once: true });

    const put = () => {
      asking = 0;
      if (theirs) return;
      const room = document.documentElement.scrollHeight - window.innerHeight;
      if (room >= at) {
        window.scrollTo(0, at);
        /* Once is not enough: the framework's own scroll to the top can land in a
           later frame than this one. Keep asking until the deadline, and stop the
           moment we are where we asked to be and have stayed there. */
        if (Math.abs(window.scrollY - at) < 2 && performance.now() - from > 260) return;
      }
      if (performance.now() - from < 700) asking = window.requestAnimationFrame(put);
    };
    asking = window.requestAnimationFrame(put);

    return () => {
      if (asking) window.cancelAnimationFrame(asking);
      window.removeEventListener("touchstart", mine);
      window.removeEventListener("wheel", mine);
    };
  }, [pathname]);

  return null;
}

/** What is remembered, or nothing at all. */
function read(): Record<string, number> {
  const said = sessionStorage.getItem(KEY);
  if (!said) return {};
  const found = JSON.parse(said);
  return found && typeof found === "object" ? found : {};
}
