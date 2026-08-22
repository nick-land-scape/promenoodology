"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type WithTransitions = Document & {
  startViewTransition?: (work: () => Promise<void> | void) => { finished: Promise<void> };
};

/**
 * One screen becomes the next, rather than being replaced by it.
 *
 * Tapping a tab used to swap the whole page in one frame: correct, instant, and
 * the single biggest tell that this is a web app — because nothing on a phone
 * changes like that. Every native transition tells you which way you went, and
 * that is information, not decoration: forward is new material arriving over the
 * old, back is the old material returning.
 *
 * Done with the browser's own view transitions, which WebKit has had since
 * Safari 18, so there is no animation library here and nothing to keep in step
 * with the router. Where the API is missing — an older phone, a stubborn browser
 * — every link goes back to being an ordinary link, which is the whole point of
 * doing it this way.
 *
 * The header and the bar are named in CSS, so they are treated as the same
 * objects across the change and stay exactly where they are while the screen
 * between them turns over. Naming them is what makes it read as one app moving
 * rather than two pictures dissolving.
 */
export default function Crossings() {
  const router = useRouter();
  const pathname = usePathname();
  /** Resolves once React has painted the screen we asked for. */
  const painted = useRef<(() => void) | null>(null);

  /* The other half of every transition below: the promise handed to the browser
     stays open until the new screen is actually on the page. */
  useEffect(() => {
    painted.current?.();
    painted.current = null;
  }, [pathname]);

  useEffect(() => {
    const doc = document as WithTransitions;
    if (!doc.startViewTransition) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const clicked = (event: MouseEvent) => {
      // Anything but a plain left click is somebody asking for a new tab.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as HTMLElement | null)?.closest?.("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || link.target === "_blank" || link.hasAttribute("download")) return;
      // Inside this app only. Anything that leaves is the phone's business.
      if (!href.startsWith("/app")) return;

      const now = new URL(window.location.href);
      const next = new URL(href, now);
      // A link to where we already are, or to an anchor on this screen.
      if (next.pathname === now.pathname && next.search === now.search) return;

      event.preventDefault();
      doc.startViewTransition!(
        () =>
          new Promise<void>((resolve) => {
            /* If the screen never arrives — a slow server, a refused fetch — the
               transition must not hold the page frozen. Half a second and it lets
               go, and the navigation carries on underneath as normal. */
            const giveUp = window.setTimeout(resolve, 500);
            painted.current = () => {
              window.clearTimeout(giveUp);
              resolve();
            };
            router.push(next.pathname + next.search);
          }),
      );
    };

    document.addEventListener("click", clicked);
    return () => document.removeEventListener("click", clicked);
  }, [router]);

  return null;
}
