"use client";

import Link from "next/link";
import { useState } from "react";
import Lightbox from "../Lightbox";
import Photo from "../Photo";

type Told = {
  slug: string;
  title: string;
  subtitle: string;
  where: string | null;
  when: string | null;
  cover: string | null;
};

type Shot = { src: string; width: number; height: number; credit: string; year: string };

type Book = { title: string; lead: string; blocks: { kind: string; text: string }[] };

/**
 * Three ways of reading, one tab.
 *
 * Stories are a list of covers, the archive is a wall of photographs with a
 * lightbox behind it, and the handbook is the same numbered thing it is on the
 * website. The chooser is the segmented control the feed already uses, so this
 * behaves like the rest of the app rather than like a fourth idea.
 */
export default function Reading({
  stories,
  photos,
  handbook,
}: {
  stories: Told[];
  photos: Shot[];
  handbook: Book;
}) {
  const [view, setView] = useState<"stories" | "archive" | "handbook">("stories");
  /* Which photograph is open. An index rather than the photograph itself, so the
     arrows have somewhere to go. */
  const [at, setAt] = useState<number | null>(null);

  return (
    <>
      <div className="segmented segmented-three" role="tablist" aria-label="What to read">
        {(["stories", "archive", "handbook"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            onClick={() => setView(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {view === "stories" ? (
        <ul className="told">
          {stories.map((story) => (
            <li key={story.slug}>
              <Link href={`/app/read/${story.slug}`} className="told-card">
                {story.cover ? (
                  <span className="told-cover">
                    <Photo src={story.cover} alt="" fill sizes="(max-width: 560px) 100vw, 560px" />
                  </span>
                ) : null}
                <span className="told-words">
                  <span className="told-title">{story.title}</span>
                  {story.subtitle ? <span className="told-sub">{story.subtitle}</span> : null}
                  <span className="row-meta">
                    {[story.where, story.when].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {view === "archive" ? (
        <>
          <div className="app-section-head" style={{ padding: "14px var(--gutter) 8px" }}>
            <h2 className="app-h2">every photograph</h2>
            <span className="app-label">{photos.length}</span>
          </div>
          <ul className="mine-grid">
            {photos.map((photo, index) => (
              <li key={photo.src}>
                <button type="button" onClick={() => setAt(index)} aria-label="Open">
                  <Photo src={photo.src} alt="" width={photo.width} height={photo.height} sizes="33vw" />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {view === "handbook" ? (
        <div className="app-book">
          {handbook.lead ? <p className="app-book-lead">{handbook.lead}</p> : null}
          {handbook.blocks.map((block, index) =>
            block.kind === "heading" ? (
              <h2 key={index}>
                <em>
                  {String(
                    handbook.blocks.slice(0, index + 1).filter((one) => one.kind === "heading")
                      .length,
                  ).padStart(2, "0")}
                </em>
                {block.text}
              </h2>
            ) : (
              <p key={index}>{block.text}</p>
            ),
          )}
        </div>
      ) : null}

      {/* The website's own lightbox, not a second one.
          It is the same photographs, so it should be the same arrows, the same
          keys, the same caption and the same way of saving one — and a copy of it
          here would be a copy that drifts. */}
      {at !== null ? (
        <Lightbox
          slides={photos.map((photo) => ({
            key: photo.src,
            photo: { src: photo.src, width: photo.width, height: photo.height },
            caption: [photo.credit, photo.year].filter(Boolean).join(" · "),
          }))}
          index={at}
          onIndex={setAt}
          onClose={() => setAt(null)}
        />
      ) : null}
    </>
  );
}
