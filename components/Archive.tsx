"use client";

import Link from "next/link";
import { useState } from "react";
import type { Quote, Slide } from "@/lib/content";
import Lightbox from "./Lightbox";
import Photo from "./Photo";
import Submenu from "./Submenu";

/** How many photographs to put between two quotes. */
const PHOTOS_PER_QUOTE = 7;

/** How many width-and-tilt variants the wall cycles through. */
const VARIANTS = 9;

export type StoryFilter = { tag: string; title: string; slug: string };

type Props = {
  slides: (Slide & { story: string | null; year: string })[];
  quotes: Quote[];
  stories: StoryFilter[];
  years: string[];
};

/**
 * Everything we keep, on one wall: photographs at whatever size and shape they
 * came in, with the things people said in between. Not a grid — the items fall
 * into columns and each one takes a slightly different width, so the eye has to
 * wander. Filters narrow it down by story and by year.
 */
export default function Archive({ slides, quotes, stories, years }: Props) {
  const [story, setStory] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const selected = stories.find((item) => item.tag === story);

  const photos = slides.filter(
    (slide) => (!story || slide.story === story) && (!year || slide.year === year),
  );
  const said = quotes.filter(
    (quote) =>
      (!story || quote.story === story) && (!year || quote.year === year),
  );

  // The lightbox steps through the photographs that are actually on the wall.
  const inLightbox = photos;
  const items = mix(photos, said);

  return (
    <>
      <Submenu section="resources">
        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">story</span>
            <button
              type="button"
              className="text-button"
              aria-pressed={story === null}
              onClick={() => setStory(null)}
            >
              all
            </button>
            {stories.map((item) => (
              <button
                key={item.tag}
                type="button"
                className="text-button"
                aria-pressed={story === item.tag}
                onClick={() => setStory(item.tag)}
              >
                {item.title}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-label">year</span>
            {years.map((value) => (
              <button
                key={value}
                type="button"
                className="text-button"
                aria-pressed={year === value}
                onClick={() =>
                  setYear((current) => (current === value ? null : value))
                }
              >
                {value}
              </button>
            ))}
          </div>

          {selected ? (
            <Link className="filter-link" href={`/stories/${selected.slug}`}>
              read {selected.title} →
            </Link>
          ) : null}
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
              (item) => item.tag === (slide as (typeof photos)[number]).story,
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
