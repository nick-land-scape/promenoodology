"use client";

import Link from "next/link";
import { useState } from "react";
import type { Resource } from "@/lib/content";
import PhotoGrid, { type Slide } from "./PhotoGrid";

export type EventFilter = { tag: string; title: string; slug: string };

type Props = {
  resources: Resource[];
  events: EventFilter[];
  years: string[];
  /** The photos/quotes switch, rendered on the server. */
  kinds: React.ReactNode;
};

/** Everything we have photographed, filtered by project and by year. */
export default function ResourceGallery({ resources, events, years, kinds }: Props) {
  const [event, setEvent] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);

  const selected = events.find((item) => item.tag === event);

  const slides: Slide[] = resources
    .filter((item) => (!event || item.event === event) && (!year || item.year === year))
    .map((item) => ({
      key: item.file,
      photo: item.photo,
      caption: [item.credit, item.year, events.find((e) => e.tag === item.event)?.title]
        .filter(Boolean)
        .join(", "),
    }));

  return (
    <>
      <div className="filters">
        {kinds}

        <div className="filter-group">
          <button
            type="button"
            className="text-button"
            aria-pressed={event === null}
            onClick={() => setEvent(null)}
          >
            all
          </button>
          {events.map((item) => (
            <button
              key={item.tag}
              type="button"
              className="text-button"
              aria-pressed={event === item.tag}
              onClick={() => setEvent(item.tag)}
            >
              {item.title}
            </button>
          ))}
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

        {selected ? (
          <Link className="filter-link" href={`/stories/${selected.slug}`}>
            about {selected.title} →
          </Link>
        ) : null}
      </div>

      <PhotoGrid slides={slides} />
    </>
  );
}
