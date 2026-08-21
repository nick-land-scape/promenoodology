"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Some, Tags } from "@/components/admin/Many";
import { Look } from "@/components/admin/Pick";
import type { Choice } from "@/components/admin/Picker";
import Thumb from "@/components/admin/Thumb";
import StoryBody from "@/components/StoryBody";
import InHead from "@/components/admin/InHead";
import {
  Button,
  Field,
  Fields,
  Flag,
  Grip,
  Icon,
  Move,
  Panel,
  Place,
  Problem,
  SaveBar,
  Tag,
  Word,
  moved,
  useDragOrder,
} from "@/components/admin/ui";
import { LAYOUTS } from "@/lib/photo-layout";
import type { PhotoLayout } from "@/lib/supabase/rows";
import { saveStory, saveStoryPhotos } from "../actions";

/**
 * One story: what it was, and the text as it is written.
 *
 * The text keeps the shape the story files have — sections with a heading, and
 * paragraphs under each — because that shape is what the page is built out of:
 * the heading is set small and in purple, and the paragraphs are spread through
 * the photographs. Nothing here can change that; only what it says.
 */

type Draft = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  tag: string;
  place: string;
  happened: string;
  made_with: string;
  sections: { heading: string; texts: string[] }[];
  published: boolean;
  /** Which photograph stands for the story. Null: worked out from the photos. */
  featured: string | null;
  /** Labels — not the tag, which is a key the photographs look for. */
  topics: string[];
  /** Who was there. */
  people: string[];
  /** Which organisations it was made with. */
  partners: string[];
};

type PhotoLine = {
  id: string;
  url: string;
  credit: string;
  year: string;
  published: boolean;
  layout: PhotoLayout | null;
  width: number;
  height: number;
};

export default function StoryEditor({
  story,
  photos,
  everybody,
  organisations,
}: {
  story: Draft;
  photos: PhotoLine[];
  /** Everybody who could have been there. */
  everybody: Choice[];
  organisations: Choice[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(story);
  const [kept, setKept] = useState(story);
  const [pending, start] = useTransition();
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(kept);

  /* The photographs are arranged here — their order and how each one sits — and
     kept on their own button. They are rows in the archive rather than parts of
     the story, so saving the story cannot save them, and pretending otherwise
     would be a save button that quietly did half its job. */
  const [order, setOrder] = useState(photos);
  const [keptOrder, setKeptOrder] = useState(photos);
  const photosMoved = JSON.stringify(order) !== JSON.stringify(keptOrder);

  function movePhoto(from: number, to: number) {
    const next = moved(order, from, to);
    if (next !== order) setOrder(next);
  }

  const { dropProps, handleProps, stateOf } = useDragOrder(order, movePhoto);

  /* Looking at one properly, and seeing the whole thing as a reader would. */
  const [looking, setLooking] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);

  function setLayout(id: string, layout: PhotoLayout | null) {
    setOrder((list) => list.map((one) => (one.id === id ? { ...one, layout } : one)));
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((old) => ({ ...old, [key]: value }));
    setJustSaved(false);
  }

  function setSections(sections: Draft["sections"]) {
    set("sections", sections);
  }

  /*
   * One button.
   *
   * The photographs used to be kept on their own, on the grounds that they are
   * rows in the archive rather than parts of the story — which is true about the
   * database and beside the point on the page: you have made one set of changes
   * to one story, and being asked to save it in two goes, with two buttons whose
   * names both began "keep", is the kind of correctness nobody thanks you for.
   * The story goes first, because it is the one that can be refused.
   */
  function save() {
    setProblem("");
    start(async () => {
      const result = await saveStory({
        id: draft.id,
        slug: draft.slug,
        title: draft.title,
        subtitle: draft.subtitle,
        featured_photo_id: draft.featured,
        tag: draft.tag,
        place: draft.place,
        happened: draft.happened,
        made_with: draft.made_with,
        sections: draft.sections.map((section) => ({
          heading: section.heading.trim() || null,
          texts: section.texts,
        })),
        published: draft.published,
        topics: draft.topics,
        people: draft.people,
        partners: draft.partners,
      });

      if (!result.ok) {
        setProblem(result.error ?? "That did not save.");
        return;
      }

      if (photosMoved) {
        const arranged = await saveStoryPhotos(
          order.map((photo) => ({ id: photo.id, layout: photo.layout })),
        );
        if (!arranged.ok) {
          setProblem(
            `The story is saved, but its photographs are not: ${
              arranged.error ?? "the order would not save"
            }`,
          );
          return;
        }
        setKeptOrder(order);
      }

      // The address may have been minted on this very save.
      const next = { ...draft, slug: result.slug ?? draft.slug };
      setDraft(next);
      setKept(next);
      setJustSaved(true);
      if (result.slug && result.slug !== draft.slug) {
        router.replace(`/admin/stories/${result.slug}`);
      }
      router.refresh();
    });
  }

  return (
    <>
      <Problem>{problem}</Problem>

      {/* Beside the title: the one thing you want from this page that is not
          typing into it. */}
      <InHead>
        <Button tone="quiet" onClick={() => setPreview(true)}>
          <Icon name="eye" />
          see the page
        </Button>
      </InHead>

      <Panel
        name="what it was"
        hint="The line under the title on the story's own page."
        action={
          <Flag
            on={draft.published}
            onChange={(next) => set("published", next)}
            labels={["on the site", "hidden"]}
          />
        }
      >
        <Fields>
          <Field label="title" hint="Shown as the heading, and as the filter button in the archive.">
            <input
              value={draft.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="dinner for 500"
            />
          </Field>
          <Field
            label="the hook"
            hint="One line under the title, above the place: why it was worth doing. Left empty it is simply not there."
            wide
          >
            <input
              value={draft.subtitle}
              onChange={(event) => set("subtitle", event.target.value)}
              placeholder="what makes somebody want to read this"
            />
          </Field>
          <Field label="where">
            <input
              value={draft.place}
              onChange={(event) => set("place", event.target.value)}
              placeholder="Sheffield, England"
            />
          </Field>
          <Field label="when" hint="Left empty, the years come from the photographs.">
            <input
              value={draft.happened}
              onChange={(event) => set("happened", event.target.value)}
              placeholder="August 2023"
            />
          </Field>
          {/*
           * "with" sat directly above "made with", and "tag" directly above
           * "tags" — the same word twice for two different things, which is a
           * naming problem rather than a duplicate field. What this one actually
           * holds is the thing a story happened inside: an assembly, a
           * festival, a programme. So it says that.
           */}
          <Field label="part of" hint="An assembly, a festival, a programme it happened inside.">
            <input
              value={draft.made_with}
              onChange={(event) => set("made_with", event.target.value)}
              placeholder="EASA COMMONS"
            />
          </Field>
          <Field
            label="photo tag"
            hint="What its photographs and quotes look for. Change it and they are carried across with it."
          >
            <input
              value={draft.tag}
              onChange={(event) => set("tag", event.target.value)}
              placeholder="dfor500"
            />
          </Field>
          {/*
           * The address is not editable any more, and that is a feature.
           *
           * It is made from the title the first time a story is saved and then
           * left alone for ever, because every link anybody has shared is a
           * promise and there is no redirect behind a change. A field that can
           * silently break every link to a page does not belong next to a field
           * for the place it happened.
           */}
          <Field label="tags" hint="What it was about, in a few words." wide>
            <Tags
              value={draft.topics}
              onChange={(next) => set("topics", next)}
              placeholder="cooking, public space… then Enter"
              empty="no tags — the story is still found by its title"
            />
          </Field>
          <Field label="who was there" hint="From the community. They keep their own names." wide>
            <Some
              value={draft.people}
              onChange={(next) => set("people", next)}
              options={everybody}
              add="add somebody"
              empty="nobody named yet"
            />
          </Field>
          <Field label="partners" hint="From the list under Partners in the menu." wide>
            <Some
              value={draft.partners}
              onChange={(next) => set("partners", next)}
              options={organisations}
              add="add a partner"
              empty="no partners on this one"
            />
          </Field>
        </Fields>
      </Panel>

      <Panel
        name="the text"
        hint="A section opens with a small purple heading; its paragraphs are spread through the photographs."
      >
        {draft.sections.length === 0 ? (
          <p className="admin-empty" style={{ padding: "16px 14px" }}>
            Nothing written yet.
          </p>
        ) : null}

        {draft.sections.map((section, index) => (
          <div className="admin-section" key={index}>
            <header className="admin-section-head">
              <input
                value={section.heading}
                onChange={(event) =>
                  setSections(
                    draft.sections.map((one, i) =>
                      i === index ? { ...one, heading: event.target.value } : one,
                    ),
                  )
                }
                placeholder="heading — or leave empty for text before any heading"
                aria-label={`Heading of section ${index + 1}`}
              />
              <Move index={index} total={draft.sections.length} onMove={(from, to) => setSections(moved(draft.sections, from, to))} />
              <Word
                danger
                onClick={() => setSections(draft.sections.filter((_, i) => i !== index))}
                aria-label={`Remove section ${index + 1}`}
              >
                remove
              </Word>
            </header>

            {section.texts.map((text, line) => (
              <div className="admin-para" key={line}>
                <textarea
                  rows={Math.min(10, Math.max(2, Math.ceil(text.length / 90)))}
                  value={text}
                  onChange={(event) =>
                    setSections(
                      draft.sections.map((one, i) =>
                        i === index
                          ? {
                              ...one,
                              texts: one.texts.map((old, j) => (j === line ? event.target.value : old)),
                            }
                          : one,
                      ),
                    )
                  }
                  placeholder="a paragraph"
                  aria-label={`Paragraph ${line + 1}`}
                />
                <span className="admin-move" style={{ paddingTop: 2 }}>
                  <Move
                    index={line}
                    total={section.texts.length}
                    onMove={(from, to) =>
                      setSections(
                        draft.sections.map((one, i) =>
                          i === index ? { ...one, texts: moved(one.texts, from, to) } : one,
                        ),
                      )
                    }
                  />
                </span>
                <Word
                  danger
                  aria-label={`Remove paragraph ${line + 1}`}
                  onClick={() =>
                    setSections(
                      draft.sections.map((one, i) =>
                        i === index
                          ? { ...one, texts: one.texts.filter((_, j) => j !== line) }
                          : one,
                      ),
                    )
                  }
                >
                  ×
                </Word>
              </div>
            ))}

            <button
              type="button"
              className="admin-add admin-add-inline"
              onClick={() =>
                setSections(
                  draft.sections.map((one, i) =>
                    i === index ? { ...one, texts: [...one.texts, ""] } : one,
                  ),
                )
              }
            >
              + paragraph
            </button>
          </div>
        ))}

        <button
          type="button"
          className="admin-add"
          onClick={() => setSections([...draft.sections, { heading: "", texts: [""] }])}
        >
          + section
        </button>
      </Panel>

      <Panel
        name="its photographs"
        hint={`Everything in the archive tagged “${draft.tag}”, in the order they are read in. Drag one, or type a number.`}
        action={
          <Link href={`/admin/photos?story=${draft.tag}`} className="admin-btn">
            add or remove them →
          </Link>
        }
      >
        {order.length === 0 ? (
          <p className="admin-empty" style={{ padding: "16px 14px" }}>
            None yet. Photographs are added in the archive and given this tag; the story picks them
            up from there.
          </p>
        ) : (
          <>
            <ul className="admin-rows" style={{ border: 0, margin: "0 14px 12px" }}>
              {order.map((photo, index) => (
                <li
                  key={photo.id}
                  {...dropProps(photo, index)}
                  className={[
                    "admin-row",
                    stateOf(photo),
                    photo.published ? "" : "admin-row-hidden",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ flexWrap: "wrap" }}
                >
                  <Grip {...handleProps(photo)} />
                  <Place index={index} total={order.length} onMove={movePhoto} />

                  {/* The thumbnail is the way to see it properly: it is the
                      only thing on the row anybody would think to click. */}
                  <button
                    type="button"
                    className="admin-thumb admin-thumb-look"
                    onClick={() => setLooking(index)}
                    title="Look at it properly"
                    aria-label="Look at it properly"
                  >
                    <Thumb
                      src={photo.url}
                      width={photo.width}
                      height={photo.height}
                      sizes="96px"
                    />
                  </button>

                  <span className="admin-row-main" style={{ minWidth: 200 }}>
                    <span className="admin-row-name" style={{ fontStyle: "normal" }}>
                      {photo.credit || "nobody credited"}
                    </span>
                    <span className="admin-row-meta">
                      {[
                        photo.year || "no year",
                        photo.width > 0 ? `${photo.width}×${photo.height}` : null,
                        photo.width > 0 && Math.max(photo.width, photo.height) < 600
                          ? "small for the page"
                          : null,
                        draft.featured === photo.id ? "the cover" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    {!photo.published ? <Tag tone="warn">hidden</Tag> : null}
                  </span>

                  <span className="admin-row-side" style={{ gap: 6 }}>
                    {/* How it sits on the page. "let the page decide" is the
                        automatic cycle, and the right answer almost always. */}
                    <button
                      type="button"
                      className="admin-flag"
                      aria-pressed={photo.layout === null}
                      onClick={() => setLayout(photo.id, null)}
                      title="The automatic layout, which never lines up and never breaks"
                    >
                      auto
                    </button>
                    {LAYOUTS.map((choice) => (
                      <button
                        key={choice.value}
                        type="button"
                        className="admin-flag"
                        aria-pressed={photo.layout === choice.value}
                        onClick={() => setLayout(photo.id, choice.value)}
                        title={choice.hint}
                      >
                        {choice.label}
                      </button>
                    ))}

                    <Move index={index} total={order.length} onMove={movePhoto} />

                    <button
                      type="button"
                      className="admin-flag"
                      aria-pressed={draft.featured === photo.id}
                      onClick={() =>
                        set("featured", draft.featured === photo.id ? null : photo.id)
                      }
                      title="The one that stands for this story in the list and in a link preview"
                    >
                      cover
                    </button>
                  </span>
                </li>
              ))}
            </ul>

            <p className="admin-note" style={{ margin: "0 14px 12px" }}>
              {photosMoved
                ? "the order and the layouts go with the story when you save it"
                : draft.featured
                  ? "one of them is the cover"
                  : "no cover chosen — the widest one is used"}
            </p>
          </>
        )}
      </Panel>

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={dirty || photosMoved}
        saved={justSaved}
        label="save this story"
      >
        {!draft.published ? (
          <span className="admin-note" style={{ margin: 0 }}>
            still hidden — nobody can read it yet
          </span>
        ) : null}
      </SaveBar>
      {/* The whole story's photographs, so the arrows walk it in the order a
          reader will see it. */}
      {looking !== null ? (
        <Look
          items={order.map((one) => ({
            id: one.id,
            url: one.url,
            width: one.width,
            height: one.height,
          }))}
          index={looking}
          onIndex={setLooking}
          onClose={() => setLooking(null)}
        />
      ) : null}

      {/*
       * The page, as a reader gets it.
       *
       * Not an impression of it: the same component the story's own page is
       * built from, given the draft instead of the database — so the layout
       * cycle, the way the paragraphs are threaded between the photographs, the
       * lightbox, all of it is the real thing rather than a second
       * implementation that would drift from the first by Friday. The only
       * difference is that the menu is not there, and unsaved changes are.
       */}
      {preview ? (
        <div className="admin-preview" role="dialog" aria-label="The story as a reader sees it">
          <div className="admin-preview-bar">
            <strong>as a reader sees it</strong>
            <span>
              {dirty || photosMoved ? "including what you have not saved yet" : "exactly as saved"}
            </span>
            <button type="button" onClick={() => setPreview(false)}>
              close ×
            </button>
          </div>

          <div className="admin-preview-page">
            <main className="page">
              <header className="story-header">
                <p className="crumb">stories</p>
                <h1 className="page-title">{draft.title || "Untitled"}</h1>
                {draft.subtitle ? <p className="story-hook">{draft.subtitle}</p> : null}
                <p className="story-meta">
                  {[
                    draft.place,
                    draft.happened || [...new Set(order.map((one) => one.year))].filter(Boolean).join(", "),
                    draft.made_with,
                    credited(order),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {draft.topics.length > 0 ? (
                  <ul className="story-topics">
                    {draft.topics.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                ) : null}
              </header>

              <StoryBody
                slides={order
                  // Hidden photographs are not on the page, so they are not in
                  // the preview either — a preview that shows what the reader
                  // will not see is worse than no preview.
                  .filter((one) => one.published)
                  .map((one) => ({
                    key: one.id,
                    photo: { src: one.url, width: one.width, height: one.height },
                    caption: [one.credit, one.year].filter(Boolean).join(", "),
                    layout: one.layout,
                  }))}
                sections={draft.sections.map((section) => ({
                  heading: section.heading.trim() || null,
                  texts: section.texts.map((text) => text.trim()).filter(Boolean),
                }))}
              />
            </main>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** "photos by …", the same sentence the story's own page prints. */
function credited(photos: { credit: string }[]): string | null {
  const names = [...new Set(photos.map((one) => one.credit).filter(Boolean))];
  if (names.length === 0) return null;
  if (names.length === 1) return `photos by ${names[0]}`;
  return `photos by ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
