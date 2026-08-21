"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Thumb from "@/components/admin/Thumb";
import ImageEditor from "@/components/admin/ImageEditor";
import InHead from "@/components/admin/InHead";
import { Look } from "@/components/admin/Pick";
import Picker, { type Choice } from "@/components/admin/Picker";
import Uploader from "@/components/admin/Uploader";
import {
  Bin,
  Chosen,
  Empty,
  Field,
  Flag,
  Grip,
  Icon,
  Place,
  Problem,
  SaveBar,
  Tick,
  Word,
  moved,
  useChosen,
  useUnsaved,
  useDragOrder,
} from "@/components/admin/ui";
import { mediaUrl } from "@/lib/supabase/config";
import { addPhoto, deletePhoto, reorderPhotos, replacePhoto, savePhotos } from "./actions";

export type PhotoItem = {
  id: string;
  path: string;
  url: string;
  width: number;
  height: number;
  credit: string;
  /**
   * Who took it, when they are one of us. The name is kept in `credit` too, so
   * the site has something to print either way — but this is what makes the
   * credit follow somebody who changes their name.
   */
  person: string | null;
  year: string;
  story: string | null;
  published: boolean;
};

export type StoryOption = { tag: string; title: string };
export type PersonOption = { id: string; name: string; country: string; photo: string | null };

/** Two tags that are not stories: everything, and everything with no story. */
const ALL = "";
const LOOSE = "—";

/**
 * The years on offer.
 *
 * A text box let anybody write 20226, and nobody found out until the archive
 * grew a filter for it. The list runs from next year back to the year before the
 * oldest photograph, so it never needs touching again — and anything already in
 * the archive is included whatever it says, because a year that is there is a
 * year you must be able to pick again.
 */
function yearsFor(items: PhotoItem[]): Choice[] {
  const counted = new Map<string, number>();
  for (const item of items) {
    if (item.year) counted.set(item.year, (counted.get(item.year) ?? 0) + 1);
  }

  const now = new Date().getFullYear();
  const oldest = Math.min(now, ...[...counted.keys()].map(Number).filter(Number.isFinite));

  const range: string[] = [];
  for (let year = now + 1; year >= oldest; year -= 1) range.push(String(year));
  for (const year of counted.keys()) if (!range.includes(year)) range.push(year);

  return range.map((year) => {
    const held = counted.get(year);
    return { value: year, label: year, note: held ? `${held}` : undefined };
  });
}

/**
 * The archive.
 *
 * Editing happens here on the page and is written when you say so, not on every
 * keystroke: giving forty photographs the same photographer means typing it
 * forty times either way, but only one save.
 */
export default function PhotoLibrary({
  initial,
  stories,
  people,
  filter,
}: {
  initial: PhotoItem[];
  stories: StoryOption[];
  people: PersonOption[];
  filter: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [kept, setKept] = useState(initial);
  const [story, setStory] = useState(filter || ALL);
  /* Which one is open, by its place in what is on screen — the arrows walk the
     list you are actually looking at, not the whole archive. */
  const [looking, setLooking] = useState<number | null>(null);
  const [editing, setEditing] = useState<PhotoItem | null>(null);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [reordered, setReordered] = useState(false);
  const [pending, start] = useTransition();

  /* What new uploads are given, so a batch does not have to be typed twice. */
  const [credit, setCredit] = useState("");
  const [person, setPerson] = useState("");
  const [year, setYear] = useState("");

  const shown = useMemo(() => {
    if (story === ALL) return items;
    if (story === LOOSE) return items.filter((item) => !item.story);
    return items.filter((item) => item.story === story);
  }, [items, story]);

  const changed = useMemo(() => {
    const before = new Map(kept.map((item) => [item.id, item]));
    return items.filter((item) => {
      const was = before.get(item.id);
      if (!was) return false;
      return (
        was.credit !== item.credit ||
        was.person !== item.person ||
        was.year !== item.year ||
        was.story !== item.story ||
        was.published !== item.published
      );
    });
  }, [items, kept]);

  const named = useMemo(() => new Map(people.map((one) => [one.id, one.name])), [people]);

  /* The same two lists everywhere on this page: in each card, and in the bar
     that changes forty cards at once. */
  const faces: Choice[] = useMemo(
    () =>
      people.map((one) => ({
        value: one.id,
        label: one.name,
        note: one.country || undefined,
        image: one.photo ?? undefined,
      })),
    [people],
  );
  const years = useMemo(() => yearsFor(items), [items]);
  const toldStories: Choice[] = useMemo(
    () => stories.map((one) => ({ value: one.tag, label: one.title })),
    [stories],
  );

  /*
   * Naming the photographer.
   *
   * Both fields are written at once. `person` is the real answer and what the
   * site prefers, and `credit` is kept in step with it so that a caption still
   * reads properly anywhere the join is not made — and so that unpicking
   * somebody leaves their name behind as plain text rather than a blank.
   */
  function credited(id: string, personId: string) {
    const name = named.get(personId);
    if (!name) return;
    edit(id, { person: personId, credit: name });
  }

  /* A word before anybody walks away from this. */
  useUnsaved(changed.length > 0 || reordered, "changes to the archive");

  function edit(id: string, patch: Partial<PhotoItem>) {
    setItems((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    setJustSaved(false);
  }

  function save() {
    setProblem("");
    start(async () => {
      const result = await savePhotos(
        changed.map((item) => ({
          id: item.id,
          credit: item.credit,
          credit_profile_id: item.person,
          year: item.year,
          story_tag: item.story,
          published: item.published,
        })),
      );
      if (!result.ok) setProblem(result.error ?? "That did not save.");
      else {
        setKept(items);
        setJustSaved(true);
      }
    });
  }

  /* Dragging, or a typed number, reorders what is on screen; the rest of the
     archive keeps its places. */
  function move(from: number, to: number) {
    const next = moved(shown, from, to);
    if (next === shown) return;
    setItems((list) => {
      // The filtered photographs keep their slots in the full list and are
      // dealt back into them in their new order; everything else stays put.
      const queue = [...next];
      const inFilter = new Set(next.map((item) => item.id));
      return list.map((item) => (inFilter.has(item.id) ? queue.shift()! : item));
    });
    setReordered(true);
    setProblem("");
  }

  /* Dragged or told a number — both go through the same move. */
  const { dropProps, handleProps, stateOf } = useDragOrder(shown, move);

  /* Choosing several. Nothing here writes: an action changes every chosen row in
     this page's state, and the save button below writes them, so a change to
     forty photographs is as reviewable as a change to one. */
  const pick = useChosen(shown);

  /* What the whole selection already says, so the bar shows a state rather than
     offering blank fields: where they agree it says so, where they do not it
     says nothing and the first pick decides for all of them. */
  const picked = pick.picked();
  const agreed = <K extends keyof PhotoItem>(key: K): PhotoItem[K] | "" => {
    if (picked.length === 0) return "";
    const first = picked[0][key];
    return picked.every((one) => one[key] === first) ? first : ("" as PhotoItem[K]);
  };
  const theirPerson = (agreed("person") as string | null) ?? "";
  const theirYear = agreed("year") as string;
  const theirStory = (agreed("story") as string | null) ?? "";
  const allChosenShown = picked.length > 0 && picked.every((one) => one.published);

  function applyToChosen(patch: Partial<PhotoItem>) {
    setItems((list) => list.map((item) => (pick.has(item.id) ? { ...item, ...patch } : item)));
    setJustSaved(false);
  }

  function removeChosen() {
    const doomed = pick.picked();
    if (
      !confirm(
        `Delete ${doomed.length} photograph${doomed.length === 1 ? "" : "s"}? They go to the bin for thirty days.`,
      )
    ) {
      return;
    }

    setProblem("");
    start(async () => {
      const failed: string[] = [];
      for (const item of doomed) {
        const result = await deletePhoto(item.id);
        if (!result.ok) failed.push(result.error ?? "one would not delete");
        else {
          setItems((list) => list.filter((one) => one.id !== item.id));
          setKept((list) => list.filter((one) => one.id !== item.id));
        }
      }
      pick.none();
      // Only the first, or a wall of the same sentence.
      if (failed.length) setProblem(`${failed.length} could not be deleted. ${failed[0]}`);
      router.refresh();
    });
  }

  function keepOrder() {
    setProblem("");
    start(async () => {
      const result = await reorderPhotos(shown.map((item) => item.id));
      if (!result.ok) setProblem(result.error ?? "The order did not save.");
      else setReordered(false);
    });
  }

  function remove(item: PhotoItem) {
    if (!confirm("Delete this photograph? It goes to the bin for thirty days.")) return;
    setProblem("");
    start(async () => {
      const result = await deletePhoto(item.id);
      if (!result.ok) {
        setProblem(result.error ?? "That did not delete.");
        return;
      }
      setItems((list) => list.filter((one) => one.id !== item.id));
      setKept((list) => list.filter((one) => one.id !== item.id));
      router.refresh();
    });
  }

  /* An edited photograph is already in the bucket and already inside the rule by
     the time this runs; all that is left is to point the row at it. */
  function swapped(item: PhotoItem, next: { path: string; width: number; height: number }) {
    return new Promise<void>((done, fail) => {
      start(async () => {
        const result = await replacePhoto({
          id: item.id,
          path: next.path,
          width: next.width,
          height: next.height,
        });
        if (!result.ok) {
          fail(new Error(result.error ?? "The archive would not take the edited picture."));
          return;
        }

        const patch = {
          path: next.path,
          // A cache-buster is not needed — the name is new — but the row and the
          // <img> have to agree, or the card keeps showing the old crop.
          url: mediaUrl(next.path),
          width: next.width,
          height: next.height,
        };
        setItems((list) => list.map((one) => (one.id === item.id ? { ...one, ...patch } : one)));
        setKept((list) => list.map((one) => (one.id === item.id ? { ...one, ...patch } : one)));
        router.refresh();
        done();
      });
    });
  }

  /* What a photograph measures, said the same way everywhere. */
  const measured = (item: PhotoItem) =>
    item.width > 0 ? `${item.width}×${item.height}` : "size unknown";

  const label = (tag: string | null) => {
    if (!tag) return "loose";
    return stories.find((one) => one.tag === tag)?.title ?? tag;
  };

  return (
    <>
      <Problem>{problem}</Problem>

      {/* which story, and what a new batch is given */}
      <div className="admin-panel">
        <div className="admin-fields">
          <Field
            label="showing"
            aside={
              shown.length === items.length
                ? `all ${items.length}`
                : `${shown.length} of ${items.length}`
            }
          >
            <Picker
              value={story}
              onChange={setStory}
              options={[
                { value: ALL, label: "everything" },
                { value: LOOSE, label: "no story — loose in the archive" },
                ...toldStories,
              ]}
              empty={null}
              search={stories.length > 8}
              label="Which photographs to show"
            />
          </Field>
          {/* Three short things rather than three sentences: the label says
              what the field is for, so the control underneath does not have to
              say it again. */}
          <Field label="new ones are by">
            <Picker
              value={person}
              onChange={(next) => {
                setPerson(next);
                // The name comes along, so the credit reads properly even
                // before anything looks up the person.
                setCredit(named.get(next) ?? "");
              }}
              options={faces}
              empty="one of us"
              search
              label="Who took the next ones"
            />
            {/* No box to type a name into. Everybody who takes photographs for
                this site is in the community, and a typed name is a credit that
                does not follow them when they change it — the picker is the
                answer, and offering a worse one beside it only invites it. A
                name already typed on an old photograph is still shown and still
                editable on that card. */}
          </Field>
          <Field label="and from">
            <Picker
              value={year}
              onChange={setYear}
              options={years}
              empty="no year"
              label="Which year the next ones are from"
            />
          </Field>
          {/* Drawn beside the page's title, where the one thing that *makes* a
              photograph belongs — it used to sit down here among the fields that
              say which photographs you are looking at. */}
          <InHead>
              <Uploader
                folder="resources"
                watchWindow
                label="add photographs"
                onDone={async (uploaded) => {
                  const result = await addPhoto({
                    path: uploaded.path,
                    width: uploaded.width,
                    height: uploaded.height,
                    credit,
                    credit_profile_id: person || null,
                    year,
                    story_tag: story === ALL || story === LOOSE ? null : story,
                  });
                  if (!result.ok || !result.id) {
                    setProblem(result.error ?? "The picture went up but was not written down.");
                    return;
                  }
                  const fresh: PhotoItem = {
                    id: result.id,
                    path: uploaded.path,
                    url: mediaUrl(uploaded.path),
                    width: uploaded.width,
                    height: uploaded.height,
                    credit,
                    person: person || null,
                    year,
                    story: story === ALL || story === LOOSE ? null : story,
                    published: true,
                  };
                  setItems((list) => [...list, fresh]);
                  setKept((list) => [...list, fresh]);
                }}
              />
          </InHead>
        </div>
      </div>

      {reordered ? (
        <div className="admin-save" style={{ position: "static", marginTop: 0, marginBottom: 16 }}>
          <button type="button" className="admin-btn" onClick={keepOrder} disabled={pending}>
            {pending ? "saving…" : "keep this order"}
          </button>
          <span className="admin-note" style={{ margin: 0 }}>
            only these {shown.length} move; the rest of the archive stays where it is
          </span>
        </div>
      ) : null}

      {pick.count > 0 ? (
        <Chosen count={pick.count} what="photographs" onAll={pick.all} onNone={pick.none}>
          {/* No written labels on these three, so the row fits on one line: a
              story title, a face with a name and a four-figure year each say
              what they are without being told. The names are still there for
              anybody listening rather than looking. */}
          <Picker
            value={theirStory}
            onChange={(next) => applyToChosen({ story: next || null })}
            options={[{ value: LOOSE, label: "no story — loose" }, ...toldStories]}
            empty="a story"
            search={stories.length > 8}
            label="Give them all a story"
          />

          <Picker
            value={theirPerson}
            onChange={(next) => {
              const name = named.get(next);
              applyToChosen({ person: next || null, credit: name ?? "" });
            }}
            options={faces}
            empty="one of us"
            search
            label="Who took these"
          />

          <span className="admin-picker-narrow">
            <Picker
              value={theirYear}
              onChange={(next) => applyToChosen({ year: next })}
              options={years}
              empty="a year"
              label="Which year these are from"
            />
          </span>

          {/* One switch, the same one as on a card, reading the state of the
              whole selection: two words side by side made you read which of
              them you had pressed. Mixed counts as hidden, so one press shows
              the lot. */}
          <Flag
            on={allChosenShown}
            onChange={(next) => applyToChosen({ published: next })}
            labels={["shown", "hidden"]}
          />

          <Bin
            what={`these ${pick.count} photographs`}
            onClick={removeChosen}
            disabled={pending}
          />
        </Chosen>
      ) : null}

      {shown.length === 0 ? (
        <Empty>
          {items.length === 0
            ? "Nothing in the archive yet."
            : "Nothing here under that story yet."}
        </Empty>
      ) : (
        <div className="admin-photos">
          {shown.map((item, index) => (
            <figure
              key={item.id}
              {...dropProps(item, index)}
              className={[
                "admin-photo",
                item.published ? "" : "admin-photo-hidden",
                stateOf(item),
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ margin: 0 }}
            >
              <button
                type="button"
                className="admin-photo-frame"
                onClick={() => setLooking(index)}
                aria-label="Look at it properly"
              >
                <Thumb
                  src={item.url}
                  width={item.width}
                  height={item.height}
                  // Three to a row on a wide screen, two on a phone. Said
                  // properly, this is the difference between a 320px file and a
                  // 1500px one on every card.
                  sizes="(max-width: 700px) 46vw, (max-width: 1100px) 30vw, 320px"
                />

                {/* On the picture rather than under it: it is a fact about the
                    file, not a field, and there is no room in the footer for a
                    sixth control's worth of text. Sixty-two of these are
                    thumbnails somebody imported instead of the photograph, and
                    that is worth seeing without opening anything. */}
                <span
                  className={[
                    "admin-photo-size",
                    item.width > 0 && Math.max(item.width, item.height) < 600
                      ? "admin-photo-small"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {measured(item)}
                </span>
              </button>

              {/* Top left, outside the button that opens it: choosing and
                  looking are two different gestures on the same card, and a
                  checkbox belongs where a checkbox belongs. */}
              <Tick
                on={pick.has(item.id)}
                onChoose={(range) => pick.toggle(item.id, range)}
                label={`Choose photograph ${index + 1}`}
              />

              <figcaption className="admin-photo-body">
                <div className="admin-fields">
                  {/* Wide, because a name in a 90px box is a name you cannot
                      read: "Álvaro Smoolenaars García" needs the row. */}
                  <Field label="photo by" wide>
                    <Picker
                      value={item.person ?? ""}
                      onChange={(next) => {
                        if (next) credited(item.id, next);
                        else edit(item.id, { person: null });
                      }}
                      options={faces}
                      empty="typed by hand"
                      search
                      wide
                      label="Who took this one"
                    />
                    {/* Only where nobody is picked, so the two cannot disagree
                        on screen about who took the photograph. */}
                    {item.person ? null : (
                      <input
                        value={item.credit}
                        onChange={(event) => edit(item.id, { credit: event.target.value })}
                        placeholder="—"
                      />
                    )}
                  </Field>
                  <Field label="year" wide>
                    <Picker
                      value={item.year}
                      onChange={(next) => edit(item.id, { year: next })}
                      options={years}
                      empty="no year"
                      label="Which year this is from"
                    />
                  </Field>
                  <Field label="story" wide>
                    {/* The same control as the two above it: a native select
                        draws its own arrow, at its own size, and three fields in
                        a column with two different arrows looks like a mistake
                        because it is one. */}
                    <Picker
                      value={item.story ?? ""}
                      onChange={(next) => edit(item.id, { story: next || null })}
                      options={toldStories}
                      empty="no story — loose"
                      search={stories.length > 8}
                      wide
                      label="Which story this belongs to"
                    />
                  </Field>
                </div>

                {/* Left: where it sits, and how to move it. Right: what it is
                    and whether it stays. */}
                <div className="admin-photo-foot">
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Grip {...handleProps(item)} />
                    <Place index={index} total={shown.length} onMove={move} />
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Flag
                      on={item.published}
                      onChange={(next) => edit(item.id, { published: next })}
                    />
                    <Uploader
                      folder="resources"
                      many={false}
                      trigger={(open, working) => (
                        <button
                          type="button"
                          className="admin-icon-word"
                          onClick={open}
                          disabled={working}
                          title="Put a different file in its place, keeping its credit, year and story"
                          aria-label="Replace this photograph"
                        >
                          <Icon name={working ? "upload" : "swap"} />
                        </button>
                      )}
                      onDone={async (uploaded) => swapped(item, uploaded)}
                    />
                    <button
                      type="button"
                      className="admin-icon-word"
                      onClick={() => setEditing(item)}
                      title="Crop, turn or straighten it"
                      aria-label="Crop this photograph"
                    >
                      <Icon name="crop" />
                    </button>
                    <Bin what="this photograph" onClick={() => remove(item)} disabled={pending} />
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <SaveBar
          onSave={save}
          pending={pending}
          dirty={changed.length > 0}
          saved={justSaved}
          label={changed.length > 1 ? `keep ${changed.length} changes` : "keep the change"}
        >
          <span className="admin-note" style={{ margin: 0 }}>
            {story === ALL
              ? "the whole archive"
              : `showing ${label(story === LOOSE ? null : story)}`}
          </span>
        </SaveBar>
      ) : null}

      {looking !== null ? (
        <Look
          items={shown}
          index={Math.min(looking, shown.length - 1)}
          onIndex={setLooking}
          onClose={() => setLooking(null)}
          tools={(one) => {
            const found = items.find((item) => item.id === one.id);
            if (!found) return null;
            return (
              <Uploader
                key={found.id}
                folder="resources"
                many={false}
                trigger={(open, working) => (
                  <button type="button" onClick={open} disabled={working}>
                    <Icon name={working ? "upload" : "swap"} />
                    {working ? "putting it away" : "replace it"}
                  </button>
                )}
                onDone={async (uploaded) => {
                  await swapped(found, uploaded);
                  setLooking(null);
                }}
              />
            );
          }}
          onEdit={(one) => {
            const found = items.find((item) => item.id === one.id);
            if (!found) return;
            setLooking(null);
            setEditing(found);
          }}
          onDelete={(one) => {
            const found = items.find((item) => item.id === one.id);
            if (!found) return;
            // Closed first: the picture you are looking at is about to stop
            // existing, and a lightbox showing a file that has gone is a black
            // screen nobody can explain.
            setLooking(null);
            remove(found);
          }}
        />
      ) : null}

      {editing ? (
        <ImageEditor
          url={editing.url}
          folder="resources"
          onClose={() => setEditing(null)}
          onDone={(next) => swapped(editing, next)}
        />
      ) : null}
    </>
  );
}
