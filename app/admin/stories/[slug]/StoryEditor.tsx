"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Some } from "@/components/admin/Many";
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
  useUnsaved,
  useDragOrder,
} from "@/components/admin/ui";
import { LAYOUTS } from "@/lib/photo-layout";
import type { PhotoLayout } from "@/lib/supabase/rows";
import { saveStory, saveStoryPage, saveStoryPhotos, tagPhotos, untagPhoto } from "../actions";
import { addPhoto, deletePhoto } from "@/app/admin/photos/actions";
import AddPhotos, { type Addable } from "@/components/admin/AddPhotos";
import StoryPage, { type Block, blankBlock } from "./StoryPage";

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
  /** The page, block by block, as somebody arranged it. */
  page: Block[];
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
  archive,
  years,
}: {
  story: Draft;
  photos: PhotoLine[];
  /** Everybody who could have been there. */
  everybody: Choice[];
  organisations: Choice[];
  /** The whole archive, for the dialog that adds to this story. */
  archive: Addable[];
  years: Choice[];
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

  /* The page itself. Its own state and its own comparison, because the words and
     the arrangement are now one thing and the story's fields are another. */
  const [page, setPage] = useState<Block[]>(story.page);
  const [keptPage, setKeptPage] = useState<Block[]>(story.page);
  const pageMoved = JSON.stringify(page) !== JSON.stringify(keptPage);

  function movePhoto(from: number, to: number) {
    const next = moved(order, from, to);
    if (next !== order) setOrder(next);
  }

  const { dropProps, handleProps, stateOf } = useDragOrder(order, movePhoto);

  /* Looking at one properly, and seeing the whole thing as a reader would. */
  const [looking, setLooking] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [adding, setAdding] = useState(false);

  /*
   * A photograph on a page can meet three different ends, and they are not the
   * same act: off the page (the block goes, it stays in the story), out of the
   * story (the tag goes, it stays in the archive), or gone (the row and the file
   * go). Naming them alike would be the kindest-looking way to lose one.
   */
  function unlink(photoId: string) {
    if (!confirm("Take this photograph out of the story? It stays in the archive.")) return;
    setProblem("");
    start(async () => {
      const result = await untagPhoto(photoId);
      if (!result.ok) {
        setProblem(result.error ?? "It would not come out.");
        return;
      }
      setPage((list) => list.filter((block) => block.photoId !== photoId));
      setKeptPage((list) => list.filter((block) => block.photoId !== photoId));
      setOrder((list) => list.filter((one) => one.id !== photoId));
      setKeptOrder((list) => list.filter((one) => one.id !== photoId));
      router.refresh();
    });
  }

  function destroy(photoId: string) {
    if (!confirm("Delete this photograph? It goes to the bin for thirty days.")) {
      return;
    }
    setProblem("");
    start(async () => {
      const result = await deletePhoto(photoId);
      if (!result.ok) {
        setProblem(result.error ?? "It would not delete.");
        return;
      }
      setPage((list) => list.filter((block) => block.photoId !== photoId));
      setKeptPage((list) => list.filter((block) => block.photoId !== photoId));
      setOrder((list) => list.filter((one) => one.id !== photoId));
      setKeptOrder((list) => list.filter((one) => one.id !== photoId));
      router.refresh();
    });
  }

  /* A word before anybody walks away from this. */
  useUnsaved(dirty || photosMoved || pageMoved, "changes to this story");

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

      if (pageMoved) {
        const built = await saveStoryPage(
          draft.id,
          page.map((block) => ({
            kind: block.kind,
            words: block.words,
            photo_id: block.photoId,
            layout: block.layout,
          })),
        );
        if (!built.ok) {
          setProblem(`The story is saved, but the page is not: ${built.error ?? "it would not save"}`);
          return;
        }
        setKeptPage(page);
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
          {/* Two lists side by side rather than stacked: they are the same
              question asked of people and of organisations, and reading them
              across is how anybody would check who is missing. */}
          <Field label="who was there" hint="From the community. They keep their own names.">
            <Some
              value={draft.people}
              onChange={(next) => set("people", next)}
              options={everybody}
              add="add somebody"
              empty="nobody named yet"
            />
          </Field>
          <Field label="partners" hint="From the list under Partners in the menu.">
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

      {/*
       * One panel where there were two.
       *
       * The words were typed here as sections and paragraphs, the photographs
       * were arranged in a panel below, and the page wove the two together by a
       * rule. Two places to decide one thing, and neither of them was the page.
       */}
      <Panel
        name="the page"
        hint="Every part of it in the order a reader gets it. Drag a block, or type a number."
        action={
          <Button onClick={() => setAdding(true)}>
            <Icon name="plus" />
            add photographs
          </Button>
        }
      >
        <StoryPage
          blocks={page}
          onChange={setPage}
          photos={order.map((one) => ({
            value: one.id,
            label: [one.credit || "nobody credited", one.year].filter(Boolean).join(", "),
            note: one.width > 0 ? `${one.width}×${one.height}` : undefined,
            image: one.url,
            width: one.width,
            height: one.height,
          }))}
          cover={draft.featured}
          onCover={(id) => set("featured", id)}
          onUnlink={unlink}
          onDelete={destroy}
        />
      </Panel>

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={dirty || photosMoved || pageMoved}
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
      {adding ? (
        <AddPhotos
          photos={archive}
          people={everybody}
          years={years}
          onFromArchive={async (ids) => {
            const result = await tagPhotos(draft.tag, ids);
            if (!result.ok) return result.error ?? "They would not join the story.";
            // On the page as well as in the story: adding a photograph to a
            // story and not putting it anywhere would be a photograph nobody
            // can find.
            setPage((list) => [
              ...list,
              ...ids.map((id) => ({ ...blankBlock("photo"), photoId: id })),
            ]);
            router.refresh();
            return null;
          }}
          onUploaded={async (uploaded, credit) => {
            const written = await addPhoto({
              path: uploaded.path,
              width: uploaded.width,
              height: uploaded.height,
              credit: credit.person ? (everybody.find((one) => one.value === credit.person)?.label ?? "") : "",
              credit_profile_id: credit.person,
              year: credit.year,
              story_tag: draft.tag,
            });
            if (!written.ok || !written.id) {
              setProblem(written.error ?? "It went up but was not written down.");
              return;
            }
            setPage((list) => [...list, { ...blankBlock("photo"), photoId: written.id as string }]);
            router.refresh();
          }}
          onClose={() => setAdding(false)}
        />
      ) : null}

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
