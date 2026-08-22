"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type Pin = {
  id: string;
  title: string;
  where: string;
  when: string;
  lat: number;
  lng: number;
  /** A story to read, where there is one. */
  slug: string | null;
  /** Still to come, or already done. */
  ahead: boolean;
  fed: number | null;
};

/** How much of the sheet stays in sight when it is down. */
const PEEK = 128;

/**
 * Everywhere this has happened.
 *
 * Five years across Romania, the UK, Switzerland, Austria, Italy and Spain, and
 * the app could only show that as rows sorted by date — which flattens a continent
 * into "recent". A map makes the geography an argument rather than a detail.
 *
 * The map is the screen, not a box on it: it fills everything between the header
 * and the bar, the four-way switcher floats on top of it, and the places are a
 * sheet you pull up over it — the shape every map on a phone has, because a list
 * beside a map on a screen this size gives you half of each.
 *
 * Why MapLibre and not the obvious ones: no key, no account, no billing, and no
 * terms that change under you. The tiles come from OpenFreeMap, which serves
 * OpenStreetMap's own data for nothing and asks for nothing back but the
 * attribution in the corner. And the style is written here rather than bought,
 * which is the point — a map in somebody else's blue with somebody else's roads
 * in it would be the one screen in this app that belongs to a stranger.
 *
 * Pinned to MapLibre 5. Six is ESM-only and loads its tile worker as a separate
 * module chunk, which the app's bundle did not carry across: the canvas came up,
 * the pins landed, and not one tile was ever parsed — a perfectly good empty map.
 * Five carries its worker inside itself, and drew on the first try.
 *
 * It is loaded only on this screen. The library is two hundred kilobytes and the
 * other four screens have no business paying for it, so both the code and the
 * stylesheet arrive when somebody actually presses "the map".
 */
export default function Everywhere({ pins, loud }: { pins: Pin[]; loud?: boolean }) {
  const holder = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const flyTo = useRef<((pin: Pin) => void) | null>(null);
  const [chosen, setChosen] = useState<Pin | null>(null);
  const [trouble, setTrouble] = useState("");
  /** Up or down. Down is the peek; up is most of the screen. */
  const [up, setUp] = useState(false);
  /** Where the sheet is while a thumb is on it, in pixels from the top of its run. */
  const [held, setHeld] = useState<number | null>(null);
  /* A running account of what the map did, shown only where it is asked for.
     Temporary, with the /maptest page it belongs to. */
  const [went, setWent] = useState<string[]>([]);
  const say = useCallback((line: string) => setWent((was) => [...was, line]), []);

  /* How tall the header actually is on this phone, so the map can be exactly the
     rest of the screen. Measured rather than guessed: the header carries the
     notch's inset, and that number is different on every device Apple sells. */
  useEffect(() => {
    const head = document.querySelector<HTMLElement>(".app-column .app-header");
    if (!head) return;
    const tell = () => {
      document.documentElement.style.setProperty(
        "--app-head",
        `${head.offsetHeight}px`,
      );
    };
    tell();
    window.addEventListener("resize", tell);
    return () => window.removeEventListener("resize", tell);
  }, []);

  useEffect(() => {
    if (!holder.current || pins.length === 0) return;
    let map: { remove: () => void } | null = null;
    let watchBox: ResizeObserver | null = null;
    let dead = false;
    let drew = false;

    /* The watchdog is set before anything is fetched, not after.
     *
     * It used to be armed inside the try, below the two imports — so the one
     * failure it could not report was the library never arriving: no map, no
     * error, no list, a blank screen and nothing to read. Six seconds from the
     * moment the screen opens, whatever is or is not loaded by then. */
    const watch = window.setTimeout(() => {
      if (!dead && !drew) {
        setTrouble(
          "The map would not draw here. The places are all still listed.",
        );
        setUp(true);
      }
    }, 6000);

    say(`starting, ${pins.length} pins`);

    void (async () => {
      try {
        const [
          { Map, Marker, NavigationControl, AttributionControl, LngLatBounds },
        ] = await Promise.all([
          import("maplibre-gl"),
          // The library's own stylesheet, fetched with it rather than bundled into
          // every page's CSS.
          import("maplibre-gl/dist/maplibre-gl.css"),
        ]);
        say("library here");
        if (dead || !holder.current) return;

        const made = new Map({
          container: holder.current,
          /* The style is a hand-written literal and the library's types are a
             discriminated union per layer, so TypeScript widens the paint objects
             into something that matches nothing. Said once, here, rather than
             scattering assertions through a drawing. */
          style: paperStyle() as never,
          center: [10, 47],
          zoom: 3.4,
          /* The map is the whole screen now, so one finger moves it: there is no
             page scrolling behind it to protect. The corner attribution moves to
             the top, where the sheet cannot sit on it. */
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
        });
        map = made;
        say(`map made in ${holder.current.clientWidth}×${holder.current.clientHeight}`);

        /* The map is told when its own box changes size.
         *
         * This is the whole bug, and it took a while to find because every part
         * of it reported success: the library arrived, the style loaded, the
         * tiles parsed, the pins went on, and the canvas was three hundred
         * pixels tall in a screen-high box — MapLibre's fallback for a container
         * that had no height when it was handed over. It watches the window for
         * resizes and nothing else, so a box that grows underneath it after the
         * first frame — which is exactly what a screen-high stage does while the
         * header is still being measured — leaves a map drawn for a box that no
         * longer exists, off the top of the screen and mostly outside it.
         *
         * An observer on the box itself fixes it for good, whatever the reason:
         * rotation, the keyboard, a font that landed late, or a header measured
         * a frame after the map was built. */
        const eye = new ResizeObserver(() => made.resize());
        eye.observe(holder.current);
        watchBox = eye;
        /* What the map says when it goes wrong, said out loud.
         *
         * The library reports a missing style, a refused source and a tile that
         * would not parse on this event and nowhere else. Left unlistened, all
         * three look identical from the outside: an empty box. */
        made.on("error", (bad: { error?: { message?: string } }) => {
          if (dead) return;
          setTrouble(
            `The map: ${bad?.error?.message ?? "something went wrong"}`,
          );
          setUp(true);
        });
        made.addControl(new AttributionControl({ compact: true }), "top-left");
        made.addControl(
          new NavigationControl({ showCompass: false }),
          "top-right",
        );

        const edges = new LngLatBounds();
        for (const pin of pins) {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = pin.ahead ? "pin pin-ahead" : "pin";
          dot.setAttribute("aria-label", `${pin.title}, ${pin.where}`);
          dot.addEventListener("click", (press) => {
            press.stopPropagation();
            setChosen(pin);
            setUp(false);
          });
          new Marker({ element: dot })
            .setLngLat([pin.lng, pin.lat])
            .addTo(made);
          edges.extend([pin.lng, pin.lat]);
        }

        /* Everything in view, with room around the edges for the pins — and for
           the sheet, which covers the bottom of the map even when it is down. */
        say(`${pins.length} markers on`);

        made.once("load", () => {
          if (dead) return;
          drew = true;
          say("drew");
          made.fitBounds(edges, {
            padding: { top: 76, right: 48, bottom: PEEK + 32, left: 48 },
            maxZoom: 9,
            duration: 0,
          });
        });

        flyTo.current = (pin) => {
          made.flyTo({ center: [pin.lng, pin.lat], zoom: 8.5, duration: 900 });
        };
      } catch (error) {
        say(`threw: ${error instanceof Error ? error.message : "?"}`);
        /* The library itself did not arrive. Which one it was matters when
           somebody has to fix it, so it is in the line rather than in a console
           nobody on a phone can open. */
        setTrouble(
          error instanceof Error && /network|fetch|load/i.test(error.message)
            ? "The map needs a line to the outside. The list works without one."
            : `The map would not open: ${error instanceof Error ? error.message : "unknown"}`,
        );
        setUp(true);
      }
    })();

    return () => {
      dead = true;
      watchBox?.disconnect();
      window.clearTimeout(watch);
      flyTo.current = null;
      map?.remove();
    };
  }, [pins]);

  /* Dragging the sheet. Pointer events rather than touch events, so a mouse on a
     desk and a thumb on a phone are the same gesture, and the pointer is captured
     so it keeps reporting after it leaves the handle. */
  const grabbed = useRef<{ from: number; at: number; now: number } | null>(
    null,
  );

  const run = useCallback(() => {
    const node = sheet.current;
    return node ? Math.max(0, node.offsetHeight - PEEK) : 0;
  }, []);

  const take = (event: React.PointerEvent) => {
    const at = up ? 0 : run();
    grabbed.current = { from: event.clientY, at, now: at };
    setHeld(at);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const move = (event: React.PointerEvent) => {
    const grab = grabbed.current;
    if (!grab) return;
    const next = Math.min(
      run(),
      Math.max(0, grab.at + (event.clientY - grab.from)),
    );
    grab.now = next;
    setHeld(next);
  };

  const letGo = () => {
    const grab = grabbed.current;
    if (!grab) return;
    grabbed.current = null;
    // Nearer the top than the bottom: it stays up. A flick counts as a decision.
    setUp(grab.now < run() / 2);
    setHeld(null);
  };

  if (pins.length === 0) {
    return (
      <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
        Nothing is on the map yet. An evening or a story gets a pin the moment
        somebody gives it a place in the back of the house.
      </p>
    );
  }

  const ahead = pins.filter((pin) => pin.ahead).length;

  return (
    <div className="everywhere">
      <div className="everywhere-map" ref={holder} />

      {loud ? (
        <pre
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 9,
            margin: 0,
            font: "11px ui-monospace, monospace",
            background: "rgba(255,255,255,0.9)",
            padding: "6px 8px",
            maxWidth: "80%",
            whiteSpace: "pre-wrap",
          }}
        >
          {went.join("\n")}
        </pre>
      ) : null}

      {/* What was pressed. Above the sheet rather than on the pin: a bubble on a
          phone covers the thing it is about. */}
      {chosen ? (
        <div className="everywhere-said">
          <button
            type="button"
            className="everywhere-shut"
            onClick={() => setChosen(null)}
            aria-label="Close"
          >
            ×
          </button>
          <p className="everywhere-what">{chosen.title}</p>
          <p className="row-meta">
            {[
              chosen.where,
              chosen.when,
              chosen.fed ? `${chosen.fed} ate` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {chosen.slug ? (
            <Link className="pill pill-small" href={`/app/read/${chosen.slug}`}>
              read it
            </Link>
          ) : chosen.ahead ? (
            <Link className="pill pill-small" href="/app/events">
              it is still to come
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* The places, as a sheet over the map. */}
      <div
        ref={sheet}
        className={`everywhere-sheet${up ? " is-up" : ""}${held === null ? "" : " is-held"}`}
        style={
          held === null ? undefined : { transform: `translateY(${held}px)` }
        }
      >
        <div
          className="everywhere-grab"
          onPointerDown={take}
          onPointerMove={move}
          onPointerUp={letGo}
          onPointerCancel={letGo}
        >
          <span className="everywhere-bar" aria-hidden="true" />
          <button
            type="button"
            className="everywhere-count"
            onClick={() => setUp((was) => !was)}
            aria-expanded={up}
          >
            <span>{pins.length} places</span>
            <span className="everywhere-of">
              {ahead ? `${ahead} still to come` : "five years of them"}
            </span>
          </button>
        </div>

        <div className="everywhere-roll">
          {trouble ? <p className="app-error">{trouble}</p> : null}
          <ul className="row-list">
            {pins.map((pin) => (
              <li key={pin.id}>
                <div className="row">
                  <button
                    type="button"
                    className="row-body everywhere-jump"
                    onClick={() => {
                      setChosen(pin);
                      setUp(false);
                      flyTo.current?.(pin);
                    }}
                  >
                    <span className="row-title">
                      {pin.title}
                      {pin.ahead ? (
                        <span className="everywhere-soon">to come</span>
                      ) : null}
                    </span>
                    <span className="row-meta">
                      {[pin.where, pin.when].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                  {pin.slug ? (
                    <Link
                      className="pill pill-small"
                      href={`/app/read/${pin.slug}`}
                    >
                      read it
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * The map, in this club's own materials.
 *
 * Paper, hairlines, purple. No shop names, no motorway shields, no points of
 * interest — a map of where somebody cooked in a square does not need a petrol
 * station on it. Written by hand because a bought style is somebody else's
 * drawing, and this is the one screen that would otherwise look like everybody
 * else's app.
 */
function paperStyle() {
  // Read off the page, so a dark screen gets a dark map and the club's own purple
  // is the club's own purple.
  const ink = read("--ink", "#000000");
  const paper = read("--paper", "#fffcf6");
  const hair = read("--hair", "rgba(0,0,0,0.14)");
  const quiet = read("--muted", "#6f6a63");

  return {
    version: 8 as const,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      osm: {
        type: "vector" as const,
        url: "https://tiles.openfreemap.org/planet",
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: "paper",
        type: "background" as const,
        paint: { "background-color": paper },
      },
      {
        id: "water",
        type: "fill" as const,
        source: "osm",
        "source-layer": "water",
        paint: { "fill-color": hair },
      },
      {
        id: "borders",
        type: "line" as const,
        source: "osm",
        "source-layer": "boundary",
        filter: ["<=", ["get", "admin_level"], 2],
        paint: { "line-color": ink, "line-width": 0.6, "line-opacity": 0.35 },
      },
      {
        id: "roads",
        type: "line" as const,
        source: "osm",
        "source-layer": "transportation",
        filter: [
          "in",
          ["get", "class"],
          ["literal", ["motorway", "trunk", "primary"]],
        ],
        paint: { "line-color": ink, "line-width": 0.4, "line-opacity": 0.18 },
      },
      {
        id: "towns",
        type: "symbol" as const,
        source: "osm",
        "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-max-width": 8,
        },
        paint: {
          "text-color": quiet,
          "text-halo-color": paper,
          "text-halo-width": 1.2,
        },
      },
    ],
  };
}

function read(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const found = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return found || fallback;
}
