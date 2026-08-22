"use client";

import Link from "next/link";
import Photo from "../Photo";
import { buzz } from "@/lib/native";
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
  /** Something to look at in the list. */
  cover: string | null;
  /** The line under a story's title. */
  hook: string;
  /** Its first paragraph. */
  lead: string;
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
 * Pinned to MapLibre 5, which is not why it works — that was the box below, and
 * the pin was a wrong guess made while the screen was still blank. Left in place
 * anyway: 5 carries its tile worker inside itself, 6 loads it as a separate
 * module chunk, and one less moving part in a bundle is worth having.
 *
 * It is loaded only on this screen. The library is two hundred kilobytes and the
 * other four screens have no business paying for it, so both the code and the
 * stylesheet arrive when somebody actually presses "the map".
 */
export default function Everywhere({ pins }: { pins: Pin[] }) {
  const holder = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const flyTo = useRef<((pin: Pin) => void) | null>(null);
  const [chosen, setChosen] = useState<Pin | null>(null);
  const [trouble, setTrouble] = useState("");
  /* Where the sheet is resting: 0 is all the way up, 1 is halfway, 2 is the peek.
     Three stops rather than two, because two means every drag is a commitment to
     either a list or a map and there is no position where you can see both. */
  const [stop, setStop] = useState(2);
  /** Where the sheet is while a thumb is on it, in pixels from the top of its run. */
  const [held, setHeld] = useState<number | null>(null);

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
        setStop(0);
      }
    }, 6000);

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

        /* The map is told when its own box changes size.
         *
         * This is the whole bug, and it took a while to find because every part
         * of it reported success: the library arrived, the style loaded, the
         * tiles parsed, the pins went on, and the canvas was three hundred
         * pixels tall in a screen-high box — MapLibre's fallback for a container
         * with no height, which this one had, because MapLibre's own stylesheet
         * lands after this app's and sets `position: relative` on it. It watches
         * the window for
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
          setStop(0);
        });
        made.addControl(new AttributionControl({ compact: true }), "top-left");
        /* Bottom right, above the sheet. Top right put them under the paper
           gradient the floating switcher sits on, where they were a pair of grey
           ghosts nobody could see, let alone press. */
        made.addControl(
          new NavigationControl({ showCompass: false }),
          "bottom-right",
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
            setStop(2);
          });
          new Marker({ element: dot })
            .setLngLat([pin.lng, pin.lat])
            .addTo(made);
          edges.extend([pin.lng, pin.lat]);
        }

        /* Everything in view, with room around the edges for the pins — and for
           the sheet, which covers the bottom of the map even when it is down. */

        made.once("load", () => {
          if (dead) return;
          drew = true;
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
        /* The library itself did not arrive. Which one it was matters when
           somebody has to fix it, so it is in the line rather than in a console
           nobody on a phone can open. */
        setTrouble(
          error instanceof Error && /network|fetch|load/i.test(error.message)
            ? "The map needs a line to the outside. The list works without one."
            : `The map would not open: ${error instanceof Error ? error.message : "unknown"}`,
        );
        setStop(0);
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

  /* Dragging the sheet.
   *
   * Pointer events rather than touch events, so a thumb and a mouse are one
   * gesture and the pointer keeps reporting after it leaves the handle. What
   * makes it feel like an object rather than a menu is the last few
   * milliseconds: where it lands is decided by how fast it was moving, not only
   * by where it was let go. A slow drag settles at the nearest stop; a flick
   * carries to the next one in the direction it was thrown, the way every sheet
   * on this phone behaves.
   */
  const grabbed = useRef<{
    from: number;
    at: number;
    now: number;
    last: number;
    when: number;
    speed: number;
  } | null>(null);

  /** How far the sheet can travel: its own height, less the peek that stays. */
  const run = useCallback(() => {
    const node = sheet.current;
    return node ? Math.max(0, node.offsetHeight - PEEK) : 0;
  }, []);

  /** The three resting places, in pixels from the top of the run. */
  const stops = useCallback(() => {
    const far = run();
    return [0, Math.round(far * 0.46), far];
  }, [run]);

  const where = useCallback(
    (which: number) => stops()[Math.min(2, Math.max(0, which))],
    [stops],
  );

  const take = (event: React.PointerEvent) => {
    /* All the way up, the list is a list and a drag inside it scrolls. Anywhere
       else, a drag anywhere on the sheet moves the sheet — which is the only way
       a half-open sheet stops fighting the thumb that is trying to open it. */
    if (
      stop === 0 &&
      (event.target as HTMLElement).closest(".everywhere-roll")
    ) {
      return;
    }
    const at = where(stop);
    grabbed.current = {
      from: event.clientY,
      at,
      now: at,
      last: event.clientY,
      when: event.timeStamp,
      speed: 0,
    };
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
    const since = event.timeStamp - grab.when;
    // Pixels a millisecond, smoothed a little so one stuttering frame does not
    // read as a flick.
    if (since > 0) {
      const now = (event.clientY - grab.last) / since;
      grab.speed = grab.speed * 0.4 + now * 0.6;
      grab.last = event.clientY;
      grab.when = event.timeStamp;
    }
    grab.now = next;
    setHeld(next);
  };

  const letGo = () => {
    const grab = grabbed.current;
    if (!grab) return;
    grabbed.current = null;

    const places = stops();
    const nearest = places.reduce(
      (best, place, index) =>
        Math.abs(place - grab.now) < Math.abs(places[best] - grab.now)
          ? index
          : best,
      0,
    );
    // A throw of half a pixel a millisecond is a throw, not a nudge.
    const thrown = Math.abs(grab.speed) > 0.45;
    const next = thrown
      ? Math.min(2, Math.max(0, nearest + (grab.speed > 0 ? 1 : -1)))
      : nearest;

    // The sheet answers when it catches, the way a real one would.
    if (next !== stop) void buzz("light");
    setStop(next);
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

      {/* What was pressed. Above the sheet rather than on the pin: a bubble on a
          phone covers the thing it is about. It carries the whole opening of the
          story — photograph, line, first paragraph — because "read it" is a big
          ask from one tap on a dot, and this is enough to decide by. */}
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

          {chosen.cover ? (
            <span className="everywhere-said-cover">
              <Photo
                src={chosen.cover}
                alt=""
                fill
                sizes="(max-width: 833px) 100vw, 520px"
              />
            </span>
          ) : null}

          <div className="everywhere-said-words">
            <p className="everywhere-what">{chosen.title}</p>
            {chosen.hook ? (
              <p className="everywhere-hook">{chosen.hook}</p>
            ) : null}
            <p className="row-meta">
              {[
                chosen.where,
                chosen.when,
                chosen.fed ? `${chosen.fed} ate` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {chosen.lead ? (
              <p className="everywhere-lead">{chosen.lead}</p>
            ) : null}
            {chosen.slug ? (
              <Link
                className="pill pill-small"
                href={`/app/read/${chosen.slug}`}
              >
                read it
              </Link>
            ) : chosen.ahead ? (
              <Link className="pill pill-small" href="/app/events">
                it is still to come
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* The places, as a sheet over the map. */}
      <div
        ref={sheet}
        className={`everywhere-sheet at-${stop}${held === null ? "" : " is-held"}`}
        style={
          held === null
            ? { transform: `translateY(var(--stop-${stop}))` }
            : { transform: `translateY(${held}px)` }
        }
        onPointerDown={take}
        onPointerMove={move}
        onPointerUp={letGo}
        onPointerCancel={letGo}
      >
        <div className="everywhere-grab">
          <span className="everywhere-bar" aria-hidden="true" />
          <button
            type="button"
            className="everywhere-count"
            /* A tap goes to the other end rather than one stop along: a tap is
               "show me the list" or "show me the map", and the middle is
               something you only ever want by dragging to it. */
            onClick={() => setStop(stop === 2 ? 0 : 2)}
            aria-expanded={stop !== 2}
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
                {/* The photograph first, then the words: a list you read from the
                    left, where the picture is the thing that tells you which
                    evening this was before the title does. */}
                <button
                  type="button"
                  className="everywhere-row"
                  onClick={() => {
                    setChosen(pin);
                    setStop(2);
                    flyTo.current?.(pin);
                  }}
                >
                  {pin.cover ? (
                    <span className="everywhere-row-shot">
                      <Photo src={pin.cover} alt="" fill sizes="88px" />
                    </span>
                  ) : (
                    <span
                      className="everywhere-row-shot everywhere-row-none"
                      aria-hidden="true"
                    />
                  )}

                  <span className="everywhere-row-words">
                    <span className="row-title">
                      {pin.title}
                      {pin.ahead ? (
                        <span className="everywhere-soon">to come</span>
                      ) : null}
                    </span>
                    {pin.hook ? (
                      <span className="everywhere-row-hook">{pin.hook}</span>
                    ) : null}
                    <span className="row-meta">
                      {[pin.where, pin.when].filter(Boolean).join(" · ")}
                    </span>
                    {pin.lead ? (
                      <span className="everywhere-row-lead">{pin.lead}</span>
                    ) : null}
                  </span>
                </button>
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
