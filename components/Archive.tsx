"use client";

import { useMemo, useState } from "react";
import type { Quote, Slide } from "@/lib/content";
import Lightbox from "./Lightbox";
import Photo from "./Photo";
import Submenu from "./Submenu";

/** How many photographs to put between two quotes. */
const PHOTOS_PER_QUOTE = 7;

/** How many width-and-tilt variants the wall cycles through. */
const VARIANTS = 9;

/** A story, for the link out of an opened photograph — not for a filter. */
export type StoryFilter = { tag: string; title: string; slug: string };

type Props = {
  slides: (Slide & { story: string | null; year: string })[];
  quotes: Quote[];
  /** Only so an opened photograph can offer the story it belongs to. */
  stories: StoryFilter[];
  years: string[];
  /**
   * What the wall is shuffled by when it arrives.
   *
   * It comes from the page rather than from here, because the server and the
   * browser have to draw the same wall on the first paint or React throws the
   * whole thing away and does it again. The page holds its copy for a minute, so
   * the order changes about that often — which is as random as a wall needs to
   * be, and steadier than one that rearranges itself under a scroll.
   */
  seed: number;
};

/**
 * Everything we keep, on one wall: photographs at whatever size and shape they
 * came in, with the things people said in between. Not a grid — the items fall
 * into columns and each one takes a slightly different width, so the eye has to
 * wander.
 *
 * Two ways in, and neither of them is a table of contents. Shuffle, for the
 * wandering this wall is for; and a year, for looking something up. There used to
 * be a filter per story as well, which turned the archive into an index of the
 * stories page — and the stories page is already better at being that.
 */
export default function Archive({ slides, quotes, stories, years, seed }: Props) {
  const [year, setYear] = useState<string | null>(null);
  // Shuffled to begin with: the wall is for wandering, and the order the
  // photographs were uploaded in is not a thought anybody had.
  const [shuffle, setShuffle] = useState(seed);
  const [open, setOpen] = useState<number | null>(null);

  const chosen = slides.filter((slide) => !year || slide.year === year);
  const said = quotes.filter((quote) => !year || quote.year === year);

  /* Always shuffled, from a number that only changes when somebody asks.
     There is no way back to the order they were uploaded in, because that was
     never an order anybody chose — it is the order the files happened to arrive
     in, which is not a thought about a wall. */
  const photos = useMemo(() => shuffled(chosen, shuffle), [chosen, shuffle]);

  // The lightbox steps through the photographs that are actually on the wall.
  const inLightbox = photos;
  const items = mix(photos, said);

  return (
    <>
      <Submenu section="archive">
        <div className="filters">
          <div className="filter-group">
            {/* An action, not a state — so no aria-pressed and nothing to
                switch back to. */}
            <button
              type="button"
              className="text-button"
              onClick={() => setShuffle((n) => n + 1)}
            >
              random
            </button>
          </div>

          <div className="filter-group">
            {years.map((value) => (
              <button
                key={value}
                type="button"
                className="text-button"
                aria-pressed={year === value}
                onClick={() => setYear((current) => (current === value ? null : value))}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </Submenu>

      {items.length === 0 ? (
        <p className="empty">Nothing here with those settings.</p>
      ) : (
        <div className="archive">
          {items.map((item, position) =>
            item.kind === "quote" ? (
              <figure
                key={item.quote.id}
                className="archive-item archive-quote"
                data-v={position % VARIANTS}
              >
                <blockquote>“{item.quote.text}”</blockquote>
                <figcaption>
                  {item.quote.who}
                  {item.quote.year ? <span>, {item.quote.year}</span> : null}
                </figcaption>
              </figure>
            ) : (
              <figure
                key={item.slide.key}
                className="archive-item archive-photo"
                data-v={position % VARIANTS}
              >
                <button
                  type="button"
                  onClick={() => setOpen(item.index)}
                  aria-label={`Open photo${item.slide.caption ? `: ${item.slide.caption}` : ""}`}
                >
                  <Photo
                    src={item.slide.photo.src}
                    alt=""
                    width={item.slide.photo.width}
                    height={item.slide.photo.height}
                    sizes="(max-width: 767px) 46vw, 22vw"
                    loading={item.index < 10 ? "eager" : "lazy"}
                  />
                </button>
                {item.slide.caption ? (
                  <figcaption>{item.slide.caption}</figcaption>
                ) : null}
              </figure>
            ),
          )}
        </div>
      )}

      {open !== null ? (
        <Lightbox
          slides={inLightbox}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          storyOf={(slide) => {
            const found = stories.find(
              (item: StoryFilter) => item.tag === (slide as (typeof photos)[number]).story,
            );
            return found ? { title: found.title, slug: found.slug } : null;
          }}
        />
      ) : null}
    </>
  );
}

type Item =
  | { kind: "quote"; quote: Quote }
  | { kind: "photo"; slide: Slide; index: number };

/** A quote dropped in every so often, so the wall has somewhere to breathe. */
function mix(photos: Slide[], quotes: Quote[]): Item[] {
  const items: Item[] = [];
  let next = 0;

  photos.forEach((slide, index) => {
    if (index > 0 && index % PHOTOS_PER_QUOTE === 0 && next < quotes.length) {
      items.push({ kind: "quote", quote: quotes[next++] });
    }
    items.push({ kind: "photo", slide, index });
  });

  while (next < quotes.length) {
    items.push({ kind: "quote", quote: quotes[next++] });
  }

  return items;
}

/**
 * A shuffle that is the same every time for the same number, so the wall does
 * not rearrange itself under somebody's scroll on every re-render. Not
 * Math.random: this has to give the same answer twice.
 */
function shuffled<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let n = seed * 2654435761;
  for (let i = out.length - 1; i > 0; i--) {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    const j = n % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
