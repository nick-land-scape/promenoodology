"use server";

import { requireAdminAction } from "@/lib/admin/guard";

/**
 * Where is that, in two numbers.
 *
 * Nobody knows a latitude by heart, and asking somebody to go and find one on
 * another website before they can put an evening on the map is how a map ends up
 * empty. So: type the place as you would say it, press find it.
 *
 * Through OpenStreetMap's own search, which needs no key and no account. Two
 * things it asks of anybody who uses it, and both are honoured here: say who you
 * are in the request, and do not hammer it — this runs when somebody presses a
 * button in the back of the house, which is a handful of times a month.
 *
 * It runs on the server rather than in the browser for the same reason: one
 * caller, one address, and no key or referrer policy to get wrong.
 */

export type Found = {
  ok: boolean;
  error?: string;
  places?: { name: string; lat: number; lng: number }[];
};

export async function findAPlace(query: string): Promise<Found> {
  await requireAdminAction();

  const asked = query.trim();
  if (asked.length < 3) return { ok: false, error: "A place name, or something like one." };

  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=0&q=" +
    encodeURIComponent(asked);

  try {
    const answer = await fetch(url, {
      headers: {
        // Asked for by their usage policy, and fair: it says who to complain to.
        "User-Agent": "promeNOODology/1.0 (info@promeNOODology.com)",
        "Accept-Language": "en",
      },
      // A search nobody is waiting on for longer than this is a search that failed.
      signal: AbortSignal.timeout(8000),
    });

    if (!answer.ok) {
      return { ok: false, error: `The map's own search answered ${answer.status}.` };
    }

    const found = (await answer.json()) as {
      display_name?: string;
      lat?: string;
      lon?: string;
    }[];

    const places = found
      .map((one) => ({
        name: one.display_name ?? asked,
        lat: Number(one.lat),
        lng: Number(one.lon),
      }))
      .filter((one) => Number.isFinite(one.lat) && Number.isFinite(one.lng));

    if (places.length === 0) {
      return {
        ok: false,
        error: `Nothing found for “${asked}”. A town and a country usually works where a street name does not.`,
      };
    }

    return { ok: true, places };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.name === "TimeoutError"
          ? "The map's own search did not answer in time. Try again in a moment."
          : "The map's own search could not be reached.",
    };
  }
}
