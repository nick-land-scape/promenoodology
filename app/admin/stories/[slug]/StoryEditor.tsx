"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Field,
  Fields,
  Flag,
  Grip,
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
};

type PhotoLine = {
  id: string;
  url: string;
  credit: string;
  year: string;
  published: boolean;
  layout: PhotoLayout | null;
};

export default function StoryEditor({
  story,
  photos,
}: {
  story: Draft;
  photos: PhotoLine[];
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

  const { dropProps, handleProps, dragging } = useDragOrder(order, movePhoto);

  function setLayout(id: string, layout: PhotoLayout | null) {
    setOrder((list) => list.map((one) => (one.id === id ? { ...one, layout } : one)));
  }

  function keepPhotos() {
    setProblem("");
    start(async () => {
      const result = await saveStoryPhotos(
        order.map((photo) => ({ id: photo.id, layout: photo.layout })),
      );
      if (!result.ok) setProblem(result.error ?? "The arrangement did not save.");
      else {
        setKeptOrder(order);
        router.refresh();
      }
    });
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((old) => ({ ...old, [key]: value }));
    setJustSaved(false);
  }

  function setSections(sections: Draft["sections"]) {
    set("sections", sections);
  }

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
      });

      if (!result.ok) {
        setProblem(result.error ?? "That did not save.");
        return;
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
          <Field label="with" hint="Who it was made with or within.">
            <input
              value={draft.made_with}
              onChange={(event) => set("made_with", event.target.value)}
              placeholder="EASA COMMONS"
            />
          </Field>
          <Field
            label="tag"
            hint="What its photographs and quotes look for. Change it and they are carried across with it."
          >
            <input
              value={draft.tag}
              onChange={(event) => set("tag", event.target.value)}
              placeholder="dfor500"
            />
          </Field>
          <Field
            label="address"
            hint={
              /^untitled-/.test(draft.slug)
                ? "Made from the title the first time you save, and then left alone unless you change it here."
                : "You can change it — but every link anybody has already shared stops working, and there is no redirect."
            }
          >
            <input
              value={draft.slug}
              onChange={(event) => set("slug", event.target.value)}
              spellCheck={false}
            />
          </Field>
        </Fields>
        <p className="admin-note" style={{ margin: "10px 14px 12px" }}>
          It will be read at <code>/stories/{draft.slug}</code>.
        </p>
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
        hint={`Everything in the archive tagged “${draft.tag}”, in the order they are read in. Drag a row, or use the arrows.`}
        action={
          <Link href={`/admin/photos?story=${draft.tag}`} className="admin-btn admin-btn-quiet">
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
                    dragging === photo.id ? "admin-row-dragging" : "",
                    photo.published ? "" : "admin-row-hidden",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ flexWrap: "wrap" }}
                >
                  <Grip {...handleProps(photo)} />
                  <Place index={index} total={order.length} onMove={movePhoto} />

                  <span className="admin-thumb" style={{ width: 68, height: 50 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" loading="lazy" draggable={false} />
                  </span>

                  <span className="admin-row-main" style={{ minWidth: 180 }}>
                    <span className="admin-row-meta" style={{ marginTop: 4 }}>
                      {[photo.credit, photo.year].filter(Boolean).join(", ") || "no credit"}
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

            <div className="admin-save" style={{ position: "static", margin: "0 14px 12px" }}>
              <button
                type="button"
                className="admin-btn"
                onClick={keepPhotos}
                disabled={pending || !photosMoved}
              >
                {pending ? "saving…" : "keep this arrangement"}
              </button>
              {photosMoved ? (
                <span className="admin-note" style={{ margin: 0 }}>
                  the order and the layouts are kept on their own — the cover is kept with the story
                </span>
              ) : (
                <span className="admin-note" style={{ margin: 0 }}>
                  {draft.featured
                    ? "one of them is the cover"
                    : "no cover chosen — the widest one is used"}
                </span>
              )}
            </div>
          </>
        )}
      </Panel>

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={dirty}
        saved={justSaved}
        label="keep this story"
      >
        {!draft.published ? (
          <span className="admin-note" style={{ margin: 0 }}>
            still hidden — nobody can read it yet
          </span>
        ) : null}
      </SaveBar>
    </>
  );
}
