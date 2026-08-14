"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { Slide } from "./PhotoGrid";

type Props = {
  slides: Slide[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
};

/**
 * One photo at a time, with the same plain text controls the rest of the site
 * uses. Arrow keys and Escape work too.
 */
export default function Lightbox({ slides, index, onIndex, onClose }: Props) {
  const slide = slides[index];
  const many = slides.length > 1;
  const step = (by: number) => onIndex((index + by + slides.length) % slides.length);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!slide) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={slide.caption}
      onClick={onClose}
    >
      {/* The frame is exactly the size of the photo, so the photo itself ends up
          in the middle of the screen; everything else hangs off its corners.
          Clicks inside the frame belong to the frame, not to the backdrop. */}
      <div className="lightbox-frame" onClick={(event) => event.stopPropagation()}>
        <Image
          key={slide.photo.src}
          src={slide.photo.src}
          alt=""
          width={slide.photo.width}
          height={slide.photo.height}
          sizes="90vw"
          priority
          style={
            {
              "--limit": `${Math.round(slide.photo.width * 2.4)}px`,
              "--ar": slide.photo.width / slide.photo.height,
            } as React.CSSProperties
          }
        />

        <button
          type="button"
          className="text-button lightbox-close"
          onClick={onClose}
          autoFocus
          aria-label="Close the photo"
        >
          close ×
        </button>

        <figcaption className="lightbox-caption">{slide.caption}</figcaption>

        {many ? (
          <div className="lightbox-controls">
            <button type="button" className="text-button" onClick={() => step(-1)}>
              ← previous
            </button>
            <span className="lightbox-count">
              {index + 1} / {slides.length}
            </span>
            <button type="button" className="text-button" onClick={() => step(1)}>
              next →
            </button>
          </div>
        ) : null}
      </div>

      {/* Quietly fetch the neighbours so stepping through feels instant. */}
      {many ? (
        <div className="lightbox-preload" aria-hidden="true">
          {[-1, 1].map((by) => {
            const neighbour = slides[(index + by + slides.length) % slides.length];
            return (
              <Image
                key={`${by}-${neighbour.photo.src}`}
                src={neighbour.photo.src}
                alt=""
                width={neighbour.photo.width}
                height={neighbour.photo.height}
                sizes="90vw"
                loading="eager"
                fetchPriority="low"
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
