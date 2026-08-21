"use client";

import Link from "next/link";
import Photo from "./Photo";
import { useEffect, useState } from "react";
import type { Slide } from "@/lib/content";

type Props = {
  slides: Slide[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  /** Which story a photograph belongs to, if any — shown as a way through. */
  storyOf?: (slide: Slide) => { title: string; slug: string } | null;
};

/**
 * One photo at a time, with the same plain text controls the rest of the site
 * uses. Arrow keys and Escape work too.
 */
export default function Lightbox({ slides, index, onIndex, onClose, storyOf }: Props) {
  const [saving, setSaving] = useState<"" | "working" | "failed">("");
  const slide = slides[index];
  const many = slides.length > 1;
  const story = slide && storyOf ? storyOf(slide) : null;
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

  /**
   * Saving the photograph.
   *
   * Not `<a download>`: the files are on the storage host rather than on this
   * one, and a browser ignores the download attribute across origins — it would
   * open the picture in a tab and leave whoever pressed it to work out the rest.
   * Fetching the bytes and handing over a blob works because the bucket is public
   * and sends the headers for it, and it means the file arrives with a name that
   * says what it is rather than a UUID.
   */
  async function save() {
    if (!slide) return;
    setSaving("working");
    try {
      const answer = await fetch(slide.photo.src, { mode: "cors" });
      if (!answer.ok) throw new Error(String(answer.status));
      const blob = await answer.blob();
      const url = URL.createObjectURL(blob);
      const ext = slide.photo.src.split(".").pop()?.split("?")[0] ?? "jpg";
      const named = (slide.caption || "promeNOODology")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${named || "photograph"}.${ext}`;
      document.body.append(link);
      link.click();
      link.remove();
      // Given a moment to start, then let go of the bytes.
      window.setTimeout(() => URL.revokeObjectURL(url), 20_000);
      setSaving("");
    } catch {
      setSaving("failed");
    }
  }

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
        <Photo
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

        <figcaption className="lightbox-caption">
          {slide.caption}
          {slide.caption ? " · " : null}
          <button type="button" className="text-button" onClick={() => void save()}>
            {saving === "working" ? "saving…" : saving === "failed" ? "would not save" : "save it"}
          </button>
          {story ? (
            <>
              {slide.caption ? " · " : null}
              <Link href={`/stories/${story.slug}`} onClick={onClose}>
                {story.title} →
              </Link>
            </>
          ) : null}
        </figcaption>

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
              <Photo
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
