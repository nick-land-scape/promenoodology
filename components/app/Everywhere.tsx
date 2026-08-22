"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

/**
 * Everywhere this has happened.
 *
 * Five years across Romania, the UK, Switzerland, Austria, Italy and Spain, and
 * the app could only show that as rows sorted by date — which flattens a continent
 * into "recent". A map makes the geography an argument rather than a detail.
 *
 * Why MapLibre and not the obvious ones: no key, no account, no billing, and no
 * terms that change under you. The tiles come from OpenFreeMap, which serves
 * OpenStreetMap's own data for nothing and asks for nothing back but the
 * attribution below. And the style is written here rather than bought, which is the
 * point — a map in somebody else's blue with somebody else's roads in it would be
 * the one screen in this app that belongs to a stranger.
 *
 * It is loaded only on this screen. The library is two hundred kilobytes and the
 * other four screens have no business paying for it, so both the code and the
 * stylesheet arrive when somebody actually presses "the map".
 */
export default function Everywhere({ pins }: { pins: Pin[] }) {
  const holder = useRef<HTMLDivElement>(null);
  const [chosen, setChosen] = useState<Pin | null>(null);
  const [trouble, setTrouble] = useState("");

  useEffect(() => {
    if (!holder.current || pins.length === 0) return;
    let map: { remove: () => void } | null = null;
    let dead = false;
    let drew = false;

    void (async () => {
      try {
        const [{ Map, Marker, NavigationControl, LngLatBounds }] = await Promise.all([
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
          attributionControl: { compact: true },
          // A map inside a scrolling app: two fingers to move it, so a thumb
          // travelling down the screen does not drag Europe with it.
          cooperativeGestures: true,
        });
        map = made;
        made.addControl(new NavigationControl({ showCompass: false }), "top-right");

        const edges = new LngLatBounds();
        for (const pin of pins) {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = pin.ahead ? "pin pin-ahead" : "pin";
          dot.setAttribute("aria-label", `${pin.title}, ${pin.where}`);
          dot.addEventListener("click", (press) => {
            press.stopPropagation();
            setChosen(pin);
          });
          new Marker({ element: dot }).setLngLat([pin.lng, pin.lat]).addTo(made);
          edges.extend([pin.lng, pin.lat]);
        }

        // Everything in view, with room around the edges for the pins themselves.
        made.once("load", () => {
          if (dead) return;
          drew = true;
          made.fitBounds(edges, { padding: 56, maxZoom: 9, duration: 0 });
        });

        /* If it never draws, say so and show the places as a list.
         *
         * A map can fail in a way that leaves a perfectly good empty box: no
         * WebGL, a device too old, a network that resolves but does not deliver
         * tiles. Six seconds is longer than any of that takes to succeed. */
        window.setTimeout(() => {
          if (!dead && !drew) {
            setTrouble("The map would not draw here. The places are listed below.");
          }
        }, 6000);
      } catch (error) {
        setTrouble(
          error instanceof Error && /network|fetch/i.test(error.message)
            ? "The map needs a line to the outside. The list below works without one."
            : "The map would not open. The list below works either way.",
        );
      }
    })();

    return () => {
      dead = true;
      map?.remove();
    };
  }, [pins]);

  if (pins.length === 0) {
    return (
      <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
        Nothing is on the map yet. An evening or a story gets a pin the moment
        somebody gives it a place in the back of the house.
      </p>
    );
  }

  return (
    <div className="everywhere">
      <div className="everywhere-map" ref={holder} />

      {trouble ? (
        <>
          <p className="app-error">{trouble}</p>
          {/* The same places, without the map. Where somebody is standing matters
              more than whether the tiles arrived. */}
          <ul className="row-list">
            {pins.map((pin) => (
              <li key={pin.id}>
                <div className="row">
                  <span className="row-body">
                    <span className="row-title">{pin.title}</span>
                    <span className="row-meta">
                      {[pin.where, pin.when].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {pin.slug ? (
                    <Link className="pill pill-small" href={`/app/read/${pin.slug}`}>
                      read it
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* What was pressed. A sheet rather than a bubble on the map: a bubble on a
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
            {[chosen.where, chosen.when, chosen.fed ? `${chosen.fed} ate` : null]
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
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [
      { id: "paper", type: "background" as const, paint: { "background-color": paper } },
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
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]],
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
        paint: { "text-color": quiet, "text-halo-color": paper, "text-halo-width": 1.2 },
      },
    ],
  };
}

function read(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const found = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return found || fallback;
}
