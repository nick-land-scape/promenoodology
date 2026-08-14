"use client";

import Photo from "./Photo";
import { useState } from "react";
import Lightbox from "./Lightbox";
import type { Slide } from "./PhotoGrid";

/** How much larger than the original file a photo may be drawn. */
const MAX_SCALE = 2.2;

/**
 * How many photos to place between two paragraphs. The text is spread through
 * the photographs rather than sitting in a block above them.
 */
const PHOTOS_PER_PARAGRAPH = 3;

/**
 * Twelve-column layout variants, cycled through in order. Every photo lands on
 * the grid, but at a different width, a different column and a slightly
 * different height — chaotic to look at, completely predictable underneath,
 * which is what keeps it from turning into a mess.
 */
const VARIANTS = 8;

type Props = {
  slides: Slide[];
  paragraphs: string[];
};

export default function ProjectStory({ slides, paragraphs }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const blocks = interleave(slides, paragraphs);

  return (
    <>
      <div className="story">
        {blocks.map((block, position) =>
          block.kind === "text" ? (
            <p key={`t${position}`} className="story-text" data-v={position % 3}>
              {block.text}
            </p>
          ) : (
            <figure
              key={block.slide.key}
              className="story-figure"
              data-v={block.index % VARIANTS}
            >
              <button
                type="button"
                className="story-button"
                onClick={() => setOpen(block.index)}
                aria-label={`Open photo: ${block.slide.caption}`}
                style={
                  {
                    "--limit": `${Math.round(block.slide.photo.width * MAX_SCALE)}px`,
                  } as React.CSSProperties
                }
              >
                <Photo
                  src={block.slide.photo.src}
                  alt=""
                  width={block.slide.photo.width}
                  height={block.slide.photo.height}
                  sizes="(max-width: 767px) 92vw, 45vw"
                  priority={block.index < 2}
                  loading={block.index < 6 ? "eager" : "lazy"}
                />
              </button>
              <figcaption>{block.slide.caption}</figcaption>
            </figure>
          ),
        )}
      </div>

      {open !== null ? (
        <Lightbox
          slides={slides}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}

type Block =
  | { kind: "text"; text: string }
  | { kind: "photo"; slide: Slide; index: number };

/** Paragraph, a few photos, paragraph, a few photos, then the rest. */
function interleave(slides: Slide[], paragraphs: string[]): Block[] {
  const blocks: Block[] = [];
  let paragraph = 0;

  slides.forEach((slide, index) => {
    if (index % PHOTOS_PER_PARAGRAPH === 0 && paragraph < paragraphs.length) {
      blocks.push({ kind: "text", text: paragraphs[paragraph++] });
    }
    blocks.push({ kind: "photo", slide, index });
  });

  // Any paragraphs left over (few photos, lots of text) go at the end.
  while (paragraph < paragraphs.length) {
    blocks.push({ kind: "text", text: paragraphs[paragraph++] });
  }

  return blocks;
}
