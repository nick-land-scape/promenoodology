"use client";

import { useState, useTransition } from "react";
import { findAPlace } from "@/app/admin/find-a-place";
import { Word } from "./ui";

/**
 * Where something is, as two numbers nobody has to know.
 *
 * The cell shows what it has — "51.3801, −1.4783", or nothing — and a way of
 * finding it: press *find it* and it looks up whatever is in the "where" field
 * beside it. Several answers come back where the name is ambiguous, because
 * "Kreis 4" is a district in one city and a word in several others, and choosing
 * from a list is safer than trusting the first hit.
 *
 * It can also be typed in by hand, for the one place a search will never find:
 * a field with no name, which is where a fair amount of this happens.
 */
export default function Placed({
  lat,
  lng,
  near,
  onPlace,
}: {
  lat: number | null;
  lng: number | null;
  /** What to look up: the row's own "where", or failing that its name. */
  near: string;
  onPlace: (lat: number | null, lng: number | null) => void;
}) {
  const [asked, setAsked] = useState("");
  const [found, setFound] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  const placed = typeof lat === "number" && typeof lng === "number";

  function look() {
    const query = asked.trim() || near;
    setTrouble("");
    setFound([]);
    start(async () => {
      const answer = await findAPlace(query);
      if (!answer.ok) {
        setTrouble(answer.error ?? "Nothing found.");
        return;
      }
      const places = answer.places ?? [];
      // One answer is an answer; several is a question.
      if (places.length === 1) {
        onPlace(places[0].lat, places[0].lng);
        return;
      }
      setFound(places);
    });
  }

  return (
    <span className="admin-placed">
      <span className="admin-placed-now">
        {placed ? (
          <>
            <code>
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </code>
            <Word danger onClick={() => onPlace(null, null)}>
              off the map
            </Word>
          </>
        ) : (
          <em>not on the map</em>
        )}
      </span>

      <span className="admin-placed-ask">
        <input
          value={asked}
          onChange={(change) => setAsked(change.target.value)}
          placeholder={near || "a town and a country"}
          aria-label="Which place to look up"
          onKeyDown={(key) => {
            if (key.key === "Enter") {
              key.preventDefault();
              look();
            }
          }}
        />
        <Word onClick={look} disabled={pending}>
          {pending ? "looking…" : "find it"}
        </Word>
      </span>

      {/* Several answers: "Kreis 4" is a district in one city and a word in
          several others, so this asks rather than guessing. */}
      {found.length > 0 ? (
        <ul className="admin-placed-found">
          {found.map((one) => (
            <li key={`${one.lat},${one.lng}`}>
              <button
                type="button"
                onClick={() => {
                  onPlace(one.lat, one.lng);
                  setFound([]);
                }}
              >
                {one.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {trouble ? <span className="admin-placed-trouble">{trouble}</span> : null}
    </span>
  );
}
