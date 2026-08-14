"use client";

import { useState } from "react";
import type { Section, Slide } from "@/lib/content";
import Lightbox from "./Lightbox";
import Photo from "./Photo";

/** How much larger than the original file a photo may be drawn. */
const MAX_SCALE = 2.2;

/**
 * Eight layout variants, cycled through in order. Every photo lands on the same
 * twelve columns, but at a different width, a different column and a slightly
 * different height — chaotic to look at, completely predictable underneath,
 * which is what keeps it from turning into a mess.
 */
const VARIANTS = 8;

type Props = {
  slides: Slide[];
  sections: Section[];
};

export default function StoryBody({ slides, sections }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const blocks = interleave(slides, sections);

  return (
    <>
      <div className="story">
        {blocks.map((block, position) =>
          block.kind === "section" ? (
            <section key={`s${position}`} className="story-section" data-v={position % 3}>
              {block.section.heading ? (
                <h2 className="story-label">{block.section.heading}</h2>
              ) : null}
              {block.section.texts.map((text, index) => (
                <p key={index} className="story-text">
                  {text}
                </p>
              ))}
            </section>
          ) : (
            <figure key={block.slide.key} className="story-figure" data-v={block.index % VARIANTS}>
              <button
                type="button"
                className="story-button"
                onClick={() => setOpen(block.index)}
                aria-label={`Open photo: ${block.slide.caption || "photograph"}`}
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
              {block.slide.caption ? <figcaption>{block.slide.caption}</figcaption> : null}
            </figure>
          ),
        )}
      </div>

      {open !== null ? (
        <Lightbox slides={slides} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      ) : null}
    </>
  );
}

type Block =
  | { kind: "section"; section: Section }
  | { kind: "photo"; slide: Slide; index: number };

/**
 * A section, a handful of photographs, the next section, the rest of the
 * photographs. The text is spread through the pictures rather than stacked
 * above them.
 */
function interleave(slides: Slide[], sections: Section[]): Block[] {
  const blocks: Block[] = [];
  const perSection = Math.max(2, Math.ceil(slides.length / Math.max(sections.length, 1)));

  let photo = 0;
  sections.forEach((section) => {
    blocks.push({ kind: "section", section });
    const until = Math.min(photo + perSection, slides.length);
    for (; photo < until; photo++) {
      blocks.push({ kind: "photo", slide: slides[photo], index: photo });
    }
  });

  // Anything left over follows on.
  for (; photo < slides.length; photo++) {
    blocks.push({ kind: "photo", slide: slides[photo], index: photo });
  }

  return blocks;
}
