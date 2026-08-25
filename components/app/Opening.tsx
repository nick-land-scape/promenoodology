"use client";

import { useEffect } from "react";
import { liftTheCurtain, reloadWhenStale } from "@/lib/native";

/**
 * The two things the app has to do when it opens, now that it opens with nothing.
 *
 * There was a curtain here: the mark on paper, the ink deepening, a light
 * crossing it. It was drawn in the web view, which is the whole trouble with it —
 * a web view cannot draw anything until it has fetched a page, so the earliest it
 * could begin was about a second after the phone had already shown the launch
 * screen, which is the same mark on the same paper. Two openings, one after the
 * other, and the second one only exists because the first one cannot be animated.
 * The phone's own launch screen is the opening now, and it is the only one.
 *
 * What is left is the pair of jobs the curtain happened to be carrying:
 *
 * Taking the launch screen away, and not before there is something behind it. The
 * screen under this is fetched from the server, so hiding it the moment this file
 * runs would show the bones of a screen rather than a screen — the phone holding
 * its own picture a moment longer is better than that. So it waits for a header
 * or the door, and gives up waiting after two and a half seconds however slow the
 * line is. (`launchAutoHide` in capacitor.config.ts is the same idea a second
 * time, in case this never runs at all.)
 *
 * And coming back to a fresh copy after a long time away: a web view keeps its
 * page for days, so an app left in a pocket sits on a version of itself published
 * before whatever changed.
 *
 * Nothing is drawn. In a browser both calls find no bridge and do nothing.
 */
export default function Opening() {
  useEffect(() => reloadWhenStale(30), []);

  useEffect(() => {
    const ready = () =>
      Boolean(
        document.querySelector(".app-column .app-header") ||
          document.querySelector(".app-column .doorway"),
      );

    if (ready()) {
      void liftTheCurtain();
      return;
    }

    const latest = 2500;
    const from = performance.now();
    let watching = 0;

    const look = () => {
      if (ready() || performance.now() - from >= latest) {
        void liftTheCurtain();
        return;
      }
      watching = window.setTimeout(look, 90);
    };
    watching = window.setTimeout(look, 90);

    return () => window.clearTimeout(watching);
  }, []);

  return null;
}
