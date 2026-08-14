"use client";

import { useState } from "react";
import type { Photo as PhotoData } from "@/lib/content";
import Lightbox from "./Lightbox";
import Photo from "./Photo";

export type Slide = {
  key: string;
  photo: PhotoData;
  caption: string;
};

/** A grid of square thumbnails; clicking one opens the photo full size. */
export default function PhotoGrid({ slides }: { slides: Slide[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (slides.length === 0) {
    return <p className="empty">No photos here yet.</p>;
  }

  return (
    <>
      <ul className="photo-grid">
        {slides.map((slide, index) => (
          <li key={slide.key} className="photo-item">
            <button
              type="button"
              className="photo-button"
              onClick={() => setOpen(index)}
              aria-label={`Open photo: ${slide.caption}`}
            >
              {/* Square crop, so the photo fills the cell rather than keeping
                  its own proportions. */}
              <Photo
                src={slide.photo.src}
                alt=""
                fill
                sizes="(max-width: 767px) 45vw, 240px"
                priority={index < 4}
                loading={index < 12 ? "eager" : "lazy"}
              />
            </button>
            <p className="photo-caption">{slide.caption}</p>
          </li>
        ))}
      </ul>

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
