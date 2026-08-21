"use client";

import { useState } from "react";
import type { Section, Slide, StoryBlock } from "@/lib/content";
import { variantFor } from "@/lib/photo-layout";
import Lightbox from "./Lightbox";
import Photo from "./Photo";

/** How much larger than the original file a photo may be drawn. */
const MAX_SCALE = 2.2;

/* Eight layout variants, cycled through in order. Every photo lands on the same
   twelve columns, but at a different width, a different column and a slightly
   different height — chaotic to look at, completely predictable underneath,
   which is what keeps it from turning into a mess.

   A photograph given a layout in /admin borrows one of these eight rather than
   inventing geometry of its own, so a story with every picture named still looks
   like a story from this site. See lib/photo-layout. */

type Props = {
  slides: Slide[];
  sections: Section[];
  /**
   * The page as somebody arranged it. Empty means nobody has, and the old rule
   * below does the arranging instead — which is what every story looked like
   * before there was a builder, and what a story still looks like until somebody
   * moves something.
   */
  built?: StoryBlock[];
};

export default function StoryBody({ slides, sections, built = [] }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const blocks = built.length > 0 ? fromBlocks(built, slides) : interleave(slides, sections);

  return (
    <>
      <div className="story">
        {blocks.map((block, position) =>
          block.kind === "space" ? (
            // A gap somebody asked for. It is a block so that it can be dragged
            // like everything else, and nothing at all on the page.
            <span key={`gap${position}`} className="story-space" aria-hidden="true" />
          ) : block.kind === "section" ? (
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
            <figure
              key={block.slide.key}
              className="story-figure"
              data-v={variantFor(block.slide.layout, block.index)}
            >
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
  | { kind: "photo"; slide: Slide; index: number }
  | { kind: "space" };

/**
 * A hand-built page, in the order it was built.
 *
 * Headings and paragraphs become one-line sections, because that is what the
 * page already knows how to draw: a heading is a section with no paragraphs, a
 * paragraph is a section with no heading. Nothing about the look changes — only
 * who decided the order.
 *
 * The lightbox counts photographs, not blocks, so each photograph carries its
 * place among the photographs rather than its place on the page.
 */
function fromBlocks(built: StoryBlock[], slides: Slide[]): Block[] {
  const out: Block[] = [];
  let seen = 0;

  for (const block of built) {
    if (block.kind === "heading") {
      out.push({ kind: "section", section: { heading: block.words, texts: [] } });
      continue;
    }
    if (block.kind === "text") {
      out.push({ kind: "section", section: { heading: null, texts: [block.words] } });
      continue;
    }
    if (block.kind === "space") {
      out.push({ kind: "space" });
      continue;
    }
    // A photograph, matched to the slide the lightbox will open.
    const at = slides.findIndex((slide) => slide.photo.src === block.photo.src);
    out.push({
      kind: "photo",
      slide: {
        key: block.photo.src,
        photo: block.photo,
        caption: block.caption,
        layout: block.layout,
      },
      index: at === -1 ? seen : at,
    });
    seen += 1;
  }

  return out;
}

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
