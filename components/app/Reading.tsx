"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Everywhere, { type Pin } from "./Everywhere";
import Lightbox from "../Lightbox";
import Photo from "../Photo";
import { useSay } from "./Words";

type Told = {
  slug: string;
  title: string;
  subtitle: string;
  where: string | null;
  when: string | null;
  cover: string | null;
  /** The story's first paragraph, so the list says what it is about. */
  lead: string;
};

type Shot = {
  src: string;
  width: number;
  height: number;
  credit: string;
  year: string;
};

type Book = {
  title: string;
  lead: string;
  blocks: { kind: string; text: string }[];
};

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
  pins,
  openAt,
}: {
  stories: Told[];
  photos: Shot[];
  handbook: Book;
  pins: Pin[];
  /** Which view to open on, when something linked straight to one. */
  openAt?: "stories" | "archive" | "handbook" | "map";
}) {
  /* Three ways of reading. The map used to be a fourth, which put "where" beside
     "the handbook" as if they were the same kind of question — and made a row of
     four tabs out of a row of three. It belongs inside the stories: a story and
     its place are one thing looked at two ways. */
  const say = useSay();
  const [view, setView] = useState<"stories" | "archive" | "handbook">(
    openAt === "map" || openAt === undefined ? "stories" : openAt,
  );
  /** Stories as a list, or the same stories as pins. */
  const [asMap, setAsMap] = useState(openAt === "map");
  /* Which photograph is open. An index rather than the photograph itself, so the
     arrows have somewhere to go. */
  const [at, setAt] = useState<number | null>(null);

  /* The archive's own two filters, the same two the website has: a year, and a
     shuffle. The wall is for wandering, so it is shuffled to begin with — the
     order the files happened to arrive in is not a thought anybody had about a
     wall. As chips rather than a row of text buttons, because this is a thumb.
   */
  const [year, setYear] = useState<string | null>(null);
  const [shuffle, setShuffle] = useState(1);

  const years = useMemo(
    () =>
      [...new Set(photos.map((photo) => photo.year).filter(Boolean))]
        .sort()
        .reverse(),
    [photos],
  );

  const wall = useMemo(() => {
    const chosen = photos.filter((photo) => !year || photo.year === year);
    /* Shuffled from a number that only changes when somebody asks, so a rebuild
       of the screen does not reshuffle under them. */
    const order = [...chosen];
    let seed = shuffle * 9301 + 49297;
    for (let index = order.length - 1; index > 0; index -= 1) {
      seed = (seed * 9301 + 49297) % 233280;
      const swap = Math.floor((seed / 233280) * (index + 1));
      [order[index], order[swap]] = [order[swap], order[index]];
    }
    return order;
  }, [photos, year, shuffle]);

  /* Held in a variable because on the map it does not sit above the screen — it
     floats on it, and the map runs underneath. Same buttons either way: a second
     copy of them for the map would be a second copy that drifts. */
  const chooser = (
    <div className="segmented" role="tablist" aria-label={say("read.whatToRead")}>
      {(["stories", "archive", "handbook"] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={view === option}
          onClick={() => setView(option)}
        >
          {say(`read.${option}`)}
        </button>
      ))}
    </div>
  );

  /* The two ways of looking at the stories, and one of them takes the whole
     screen: header above it, bar below it, nothing else. A map in a box on a
     scrolling page is a picture of a map. */
  /* Not a second pill switch under the first one: two pills of the same shape
     stacked read as two equal choices, and these are not equal — the one above
     chooses what you are looking at, this one only chooses how. So it is two
     words with a line under the one you are on. */
  const bothWays = (
    <div className="reading-how" role="tablist" aria-label={say("read.storiesHow")}>
      <button
        type="button"
        role="tab"
        aria-selected={!asMap}
        onClick={() => setAsMap(false)}
      >
        {say("read.asAList")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={asMap}
        onClick={() => setAsMap(true)}
      >
        {say("read.onTheMap")}
      </button>
    </div>
  );

  if (view === "stories" && asMap) {
    return (
      <div className="reading-stage">
        <Everywhere pins={pins} />
        <div className="reading-over">
          {chooser}
          {bothWays}
        </div>
      </div>
    );
  }

  return (
    <>
      {chooser}

      {view === "stories" ? bothWays : null}

      {view === "stories" ? (
        <ul className="told">
          {stories.map((story) => (
            <li key={story.slug}>
              {/* Fetched when it is pressed: seven stories in a list is seven
                  whole screens worked out for the one that gets read. */}
              <Link href={`/app/read/${story.slug}`} className="told-card" prefetch={false}>
                {story.cover ? (
                  <span className="told-cover">
                    <Photo
                      src={story.cover}
                      alt=""
                      fill
                      sizes="(max-width: 560px) 100vw, 560px"
                    />
                  </span>
                ) : null}
                <span className="told-words">
                  <span className="told-title">{story.title}</span>
                  {story.subtitle ? (
                    <span className="told-sub">{story.subtitle}</span>
                  ) : null}
                  <span className="row-meta">
                    {[story.where, story.when].filter(Boolean).join(" · ")}
                  </span>
                  {/* Two lines of the story itself. A list of covers and titles
                      is a shelf; this is a list you can choose from. */}
                  {story.lead ? (
                    <span className="told-lead">{story.lead}</span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {view === "archive" ? (
        <>
          <div
            className="app-section-head"
            style={{ padding: "14px var(--gutter) 8px" }}
          >
            <h2 className="app-h2">{say("read.everyPhotograph")}</h2>
            <span className="app-label">{wall.length}</span>
          </div>

          <div
            className="app-scroll app-scroll-flush"
            role="group"
            aria-label={say("read.whichYear")}
          >
            <button
              type="button"
              className="chip"
              onClick={() => setShuffle((n) => n + 1)}
            >
              {say("read.shuffle")}
            </button>
            <button
              type="button"
              className="chip"
              aria-pressed={year === null}
              onClick={() => setYear(null)}
            >
              {say("read.everyYear")}
            </button>
            {years.map((value) => (
              <button
                key={value}
                type="button"
                className="chip"
                aria-pressed={year === value}
                onClick={() =>
                  setYear((current) => (current === value ? null : value))
                }
              >
                {value}
              </button>
            ))}
          </div>

          {/* The wall the website has, in the app.
              Columns rather than rows, so every photograph keeps the shape it
              arrived in and each one falls into whatever gap is above it. The
              nine widths are the website's own — a wall of identical rectangles
              is a contact sheet — and each carries who took it and when, which
              is half of what an archive is for. */}
          <ul className="arch-wall">
            {wall.map((photo, index) => (
              <li key={photo.src} data-v={index % 9}>
                <button
                  type="button"
                  onClick={() => setAt(index)}
                  aria-label={say("read.open")}
                >
                  <Photo
                    src={photo.src}
                    alt=""
                    width={photo.width}
                    height={photo.height}
                    sizes="(max-width: 833px) 50vw, 33vw"
                  />
                </button>
                {photo.credit || photo.year ? (
                  <span className="arch-wall-said">
                    {[photo.credit, photo.year].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* The invitation, at the top of the handbook rather than at the end of it.
          The handbook is how this club does it; a sheet is how you do it, and
          somebody reading the handbook has already asked that question. */}
      {view === "handbook" ? (
        <Link className="wide-row wide-row-loud" href="/app/do-it-yourself">
          <span>
            {say("read.putOneOn")}
            <span className="wide-row-under">{say("read.putOneOnUnder")}</span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
      ) : null}

      {view === "handbook" ? (
        <div className="app-book">
          {handbook.lead ? (
            <p className="app-book-lead">{handbook.lead}</p>
          ) : null}
          {handbook.blocks.map((block, index) =>
            block.kind === "heading" ? (
              <h2 key={index}>
                <em>
                  {String(
                    handbook.blocks
                      .slice(0, index + 1)
                      .filter((one) => one.kind === "heading").length,
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
          slides={wall.map((photo) => ({
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
