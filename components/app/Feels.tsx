"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buzz, inTheApp } from "@/lib/native";

/**
 * The two things that make a web app feel like an app: it answers your finger,
 * and it is already loaded before you ask for it.
 *
 * Both are done here, once, for the whole app rather than component by component.
 * A tap that buzzes is not decoration — on a phone it is the only confirmation
 * that a press landed at all, and its absence is most of what "this feels like a
 * website" means. Doing it by delegation rather than by adding a handler to sixty
 * buttons means nothing can be forgotten and nothing has to be remembered.
 */
export default function Feels() {
  const router = useRouter();
  const pathname = usePathname();

  /* ------------------------------------------------------------ the buzz */

  useEffect(() => {
    if (!inTheApp()) return;

    /* On pointerdown rather than on click: a phone's own buttons answer the
       moment the finger lands, not when it lifts, and the difference between
       those two is exactly the difference between a native control and a web
       page. Capture phase, so a handler that stops propagation — the map's pins
       do — cannot swallow it. */
    const felt = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest) return;

      const pressable = target.closest<HTMLElement>(
        'button, a[href], [role="tab"], input[type="checkbox"], label[for], summary, .pin',
      );
      if (!pressable) return;
      // Nothing buzzes for a press that cannot do anything.
      if (pressable.matches(":disabled") || pressable.getAttribute("aria-disabled") === "true") {
        return;
      }

      /* Two weights, and the heavier one is for the things that commit you:
         saying you are coming, posting, leaving. Everything else — tabs, chips,
         rows, links — is the lightest tap the phone can make. */
      const decisive =
        pressable.matches(
          '[type="submit"], .compose-post, .pill-solid, .row-yes-button, .leaving-go',
        ) || /^(count me in|post|send|save|that is me|sign out)/i.test(
          (pressable.textContent ?? "").trim().toLowerCase(),
        );

      void buzz(decisive ? "medium" : "light");
    };

    document.addEventListener("pointerdown", felt, { capture: true, passive: true });
    return () => document.removeEventListener("pointerdown", felt, { capture: true });
  }, []);

  /* ------------------------------------------------------ the chrome fits */

  /* Two measurements that stop the app's own furniture taking more room than it
     needs — the complaint being that the bar looked like it grew when you got to
     the bottom of a screen, and the header sat there at full height while you
     were trying to read under it. */
  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".app-shell");
    const bar = document.querySelector<HTMLElement>(".tabbar");
    if (!shell) return;

    const head = document.querySelector<HTMLElement>(".app-column .app-header");

    /* Two numbers the CSS cannot work out for itself: how much paper to leave
       under the last thing on a screen (the bar's own height, measured, safe-area
       inset and all — the number that was there before was a guess eight points
       over), and how tall the header is, which is what the pull-to-refresh
       indicator and the map's full-height stage are positioned against. */
    const fit = () => {
      if (bar) shell.style.setProperty("--bar-room", `${bar.offsetHeight}px`);
      if (head) {
        document.documentElement.style.setProperty("--app-head", `${head.offsetHeight}px`);
      }
    };
    fit();
    const watch = new ResizeObserver(fit);
    if (bar) watch.observe(bar);
    // The header changes height when it collapses, so it is watched as well.
    if (head) watch.observe(head);

    /* And the header collapses once the screen has moved. Twelve points of
       hysteresis between the two states, so a list that ends four points below
       the fold cannot flicker the title on and off. */
    /* Whether it is shrunk is read off the shell rather than remembered in here,
       and that is the fix for a header that stayed collapsed after a tab change.
       This effect runs again on every screen, so the variable started as `false`
       while the class was still on the shell from the screen before — and the
       branch that takes it off asks the variable, not the DOM. So the class stayed
       and the title never came back. The truth about a class lives on the element
       wearing it. */
    const look = () => {
      const y = window.scrollY;
      const shrunk = shell.classList.contains("is-scrolled");
      if (!shrunk && y > 16) shell.classList.add("is-scrolled");
      else if (shrunk && y < 4) shell.classList.remove("is-scrolled");
    };
    look();
    window.addEventListener("scroll", look, { passive: true });
    return () => {
      window.removeEventListener("scroll", look);
      watch.disconnect();
    };
  }, [pathname]);

  /* -------------------------------------------------- everything, warmed up */

  /* The four screens somebody has not asked for yet.
   *
   * Every tab is one server round trip away, and the round trip is the whole of
   * what "slow" means here — the screens themselves are a list and some
   * photographs. Next prefetches links in view, but the bar is fixed and its
   * links are cheap, so this asks for all four the moment the first screen is
   * quiet. After that a tab is a paint rather than a request.
   */
  const warmed = useRef<Record<string, number>>({});

  useEffect(() => {
    const rest = [
      "/app",
      "/app/events",
      "/app/read",
      "/app/connect",
      "/app/account",
    ].filter((where) => where !== pathname);

    const idle = onIdle(() => {
      for (const where of rest) {
        /* Once every few minutes, not once per screen.
         *
         * This effect runs again on every tab change, and it used to ask for all
         * four again each time — so five presses round the app was twenty screens
         * fetched, each one a full render of somebody's own account, session and
         * database and all. What was gained by the second, third and fourth ask
         * was nothing: the router keeps what it has been given for five minutes
         * (see staleTimes in next.config), so it already had them.
         *
         * Four minutes, which is just inside that, so what is warmed is always
         * still warm when it is wanted. */
        if (Date.now() - (warmed.current[where] ?? 0) < 4 * 60 * 1000) continue;
        warmed.current[where] = Date.now();
        router.prefetch(where);
      }
    });
    return () => cancelIdle(idle);
  }, [pathname, router]);

  /* The map, before the map screen.
   *
   * MapLibre is two hundred kilobytes and the style is another request, so the
   * first press of "on the map" used to be a wait with nothing on the screen.
   * Fetched on an idle moment instead, so by the time anybody presses it the
   * library is in memory and the tiles are in the browser's cache — and on a
   * phone that has said it is saving data, not fetched at all.
   */
  useEffect(() => {
    const link = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (link?.saveData) return;
    if (link?.effectiveType && /(^|-)2g$/.test(link.effectiveType)) return;

    const idle = onIdle(() => {
      void import("maplibre-gl");
      // The style's own metadata, which is the request the map makes first.
      void fetch("https://tiles.openfreemap.org/planet", { mode: "cors" }).catch(() => {});
    }, 2500);
    return () => cancelIdle(idle);
  }, []);

  return null;
}

/* requestIdleCallback where there is one, a timer where there is not — Safari
   only grew one recently and this app is mostly read on iPhones. */
function onIdle(work: () => void, after = 1200): number {
  const window_ = window as Window & {
    requestIdleCallback?: (work: () => void, options?: { timeout: number }) => number;
  };
  if (window_.requestIdleCallback) {
    return window_.requestIdleCallback(work, { timeout: after + 3000 });
  }
  return window.setTimeout(work, after);
}

function cancelIdle(handle: number) {
  const window_ = window as Window & { cancelIdleCallback?: (handle: number) => void };
  if (window_.cancelIdleCallback) window_.cancelIdleCallback(handle);
  else window.clearTimeout(handle);
}
