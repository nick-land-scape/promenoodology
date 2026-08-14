"use client";

import { useState } from "react";
import type { Quote } from "@/lib/content";
import Photo from "./Photo";

type Props = {
  quotes: Quote[];
  stories: { tag: string; title: string }[];
  kinds: React.ReactNode;
};

/** Things people said, filtered by which story they said them about. */
export default function QuoteList({ quotes, stories, kinds }: Props) {
  const [story, setStory] = useState<string | null>(null);
  const shown = story ? quotes.filter((quote) => quote.story === story) : quotes;

  return (
    <>
      <div className="filters">
        {kinds}
        <div className="filter-group">
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
      </div>

      {shown.length === 0 ? (
        <p className="empty">Nothing said about this one yet.</p>
      ) : (
        <ul className="quote-list">
          {shown.map((quote) => (
            <li key={quote.id} className="quote">
              <blockquote>“{quote.text}”</blockquote>
              <figcaption className="quote-who">
                {quote.photo ? (
                  <span className="quote-face">
                    <Photo src={quote.photo.src} alt="" fill sizes="44px" />
                  </span>
                ) : null}
                <span>
                  {quote.who}
                  {[quote.where, quote.year].filter(Boolean).length > 0 ? (
                    <span className="quote-meta">
                      {[quote.where, quote.year].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                </span>
              </figcaption>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
