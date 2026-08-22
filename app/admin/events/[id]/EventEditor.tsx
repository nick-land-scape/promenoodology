"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Build, { type Block, blankBlock } from "@/components/admin/Build";
import InHead from "@/components/admin/InHead";
import { Some } from "@/components/admin/Many";
import { Picker as PhotoPicker, type Pickable } from "@/components/admin/Pick";
import Dropdown, { type Choice } from "@/components/admin/Picker";
import Paper from "@/components/admin/Paper";
import Placed from "@/components/admin/Placed";
import {
  Bin,
  Button,
  Field,
  Fields,
  Flag,
  Icon,
  Panel,
  Problem,
  SaveBar,
  Word,
  useUnsaved,
} from "@/components/admin/ui";
import { mediaUrl } from "@/lib/supabase/config";
import { deleteEvent, saveEvent } from "../actions";
import Programme, { type Session, blankSession } from "./Programme";

/**
 * One evening, in full.
 *
 * It used to be a panel of eight fields in a wall of such panels. What it is
 * now is the same shape a story has: what it is, when and where, who it is with,
 * the days it runs, and a page written block by block — because an evening on a
 * flyer has all of that on it, and everything that had nowhere to go was going
 * into "anything else" as a paragraph nobody could read back.
 */

export type Draft = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  lead: string;
  happens_on: string;
  ends_on: string;
  starts_at: string;
  ends_at: string;
  place: string;
  address: string;
  lat: number | null;
  lng: number | null;
  spots: number;
  cost: string;
  sign_up_email: string;
  part_of: string;
  part_of_url: string;
  needs: string;
  note: string;
  people_fed: number | null;
  photo_path: string | null;
  flyer_path: string | null;
  partners: string[];
  story_id: string | null;
  published: boolean;
  /** The French of this evening, keyed by the column it translates. */
  fr: Record<string, string>;
};

export default function EventEditor({
  event,
  programme,
  page,
  photos,
  partners,
  told,
  coming,
}: {
  event: Draft;
  programme: Session[];
  page: Block[];
  /** The archive, to choose a picture and to put photographs on the page. */
  photos: (Pickable & Choice & { width: number; height: number })[];
  partners: Choice[];
  /** The stories, by id, for "what came of it". */
  told: { id: string; title: string }[];
  /** How many have asked to come. */
  coming: number;
}) {
  const router = useRouter();

  const [draft, setDraft] = useState<Draft>(event);
  const [kept, setKept] = useState<Draft>(event);
  const [days, setDays] = useState<Session[]>(programme);
  const [keptDays, setKeptDays] = useState<Session[]>(programme);
  const [blocks, setBlocks] = useState<Block[]>(page);
  const [keptBlocks, setKeptBlocks] = useState<Block[]>(page);

  const [picking, setPicking] = useState(false);

  /*
   * Which language you are typing in.
   *
   * One toggle for the whole evening rather than two of every field: what is
   * translated here is spread over five panels, and doubling each of them would
   * make a long page twice as long to say the same thing twice. The field stays
   * where it is and changes what it is holding, with the English showing
   * through as the placeholder — which is what the site does with it when the
   * French is left empty.
   */
  const [saying, setSaying] = useState<"en" | "fr">("en");
  const inFrench = saying === "fr";
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(kept) ||
    JSON.stringify(days) !== JSON.stringify(keptDays) ||
    JSON.stringify(blocks) !== JSON.stringify(keptBlocks);

  useUnsaved(dirty, "changes to this evening");

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((old) => ({ ...old, [key]: value }));
    setJustSaved(false);
  }

  function setFrench(key: string, value: string) {
    setDraft((old) => ({ ...old, fr: { ...old.fr, [key]: value } }));
    setJustSaved(false);
  }

  /**
   * A field that is one thing in English and another in French.
   *
   * Everything it needs to be bound: what is in it, what shows through when it
   * is empty, and where what you type goes.
   */
  function both(key: keyof Draft & string) {
    const english = String(draft[key] ?? "");
    if (!inFrench) {
      return {
        value: english,
        onChange: (event: { target: { value: string } }) =>
          set(key as keyof Draft, event.target.value as Draft[keyof Draft]),
      };
    }
    return {
      value: draft.fr[key] ?? "",
      placeholder: english,
      lang: "fr",
      onChange: (event: { target: { value: string } }) => setFrench(key, event.target.value),
    };
  }

  const pictureUrl = photos.find((photo) => photo.path === draft.photo_path)?.url ?? "";

  /* One button for all three tables. You have made one set of changes to one
     evening; being asked to keep them in three goes would be correct about the
     database and wrong about the afternoon. */
  function save() {
    setProblem("");
    start(async () => {
      const result = await saveEvent(
        {
          ...draft,
          ends_on: draft.ends_on || null,
        },
        days.map((day) => ({
          happens_on: day.happens_on,
          starts_at: day.starts_at,
          ends_at: day.ends_at,
          title: day.title,
          what: day.what,
          fr: day.fr,
        })),
        blocks.map((block) => ({
          kind: block.kind,
          words: block.words,
          photo_id: block.photoId,
          layout: block.layout,
          fr: block.fr,
        })),
      );

      if (!result.ok) {
        setProblem(result.error ?? "That did not save.");
        return;
      }

      // The address may have been minted on this very save, and the dates may
      // have been taken from the programme.
      const sorted = [...days].sort((a, b) => a.happens_on.localeCompare(b.happens_on));
      const next: Draft = {
        ...draft,
        slug: result.slug ?? draft.slug,
        happens_on: sorted[0]?.happens_on || draft.happens_on,
        ends_on:
          sorted.length > 1 ? sorted[sorted.length - 1].happens_on : draft.ends_on,
      };
      setDraft(next);
      setKept(next);
      setDays(sorted);
      setKeptDays(sorted);
      setKeptBlocks(blocks);
      setJustSaved(true);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Delete “${draft.title || "this evening"}”? It goes to the bin for thirty days.`)) {
      return;
    }
    setProblem("");
    start(async () => {
      const result = await deleteEvent(draft.id);
      if (!result.ok) {
        setProblem(result.error ?? "That did not delete.");
        return;
      }
      router.push("/admin/events");
    });
  }

  return (
    <>
      <Problem>{problem}</Problem>

      <InHead>
        <span className="admin-saying">
          {(["en", "fr"] as const).map((one) => (
            <button
              key={one}
              type="button"
              className="admin-flag"
              aria-pressed={saying === one}
              onClick={() => setSaying(one)}
              title={
                one === "en"
                  ? "The words the site is written in"
                  : "The French. Anything left empty shows the English instead."
              }
            >
              {one === "en" ? "English" : "Français"}
            </button>
          ))}
        </span>
        {draft.published && draft.slug ? (
          <a
            href={`/events/${draft.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn"
            title="Opens the evening's own page, in a new tab"
          >
            see the page ↗
          </a>
        ) : null}
      </InHead>

      <Panel
        name="what it is"
        hint="The top of its own page, and the line the members' app shows in the list."
        action={
          <Flag
            on={draft.published}
            onChange={(next) => set("published", next)}
            labels={["on the site", "hidden"]}
          />
        }
      >
        <Fields>
          <Field label="what it is called">
            <input
              {...both("title")}
              placeholder={inFrench ? draft.title : "soup and a walk"}
            />
          </Field>
          <Field label="who it is with" hint="The line under the name, as a flyer has one.">
            <input
              {...both("subtitle")}
              placeholder={inFrench ? draft.subtitle : "with the promeNOODology collective"}
            />
          </Field>
          {/* The picture is what the evening *is* as much as its name is — it
              is the first thing anybody sees of it, in the app and at the top of
              its own page — so it sits with the name rather than in a panel of
              its own five screens down. */}
          <Field
            label="the picture"
            hint="From the archive. At the top of the evening, in the app and on its own page."
          >
            <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                className="admin-logo"
                onClick={() => setPicking(true)}
                title={pictureUrl ? "Choose another" : "Choose one from the archive"}
              >
                {pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pictureUrl} alt="" draggable={false} />
                ) : (
                  <span className="admin-logo-none">no picture</span>
                )}
                <em>{pictureUrl ? "replace" : "choose one"}</em>
              </button>
              {draft.photo_path ? (
                <Bin what="this picture" onClick={() => set("photo_path", null)} />
              ) : null}
            </span>
          </Field>
          <Field
            label="the paragraph it opens with"
            hint="Two or three lines. Everything longer belongs on the page below."
            wide
          >
            <textarea
              rows={3}
              {...both("lead")}
              placeholder={inFrench ? draft.lead : "two or three lines on what it is and why"}
            />
          </Field>
        </Fields>
      </Panel>

      <Panel
        name="when"
        hint="One day and an hour for an ordinary evening. A programme for something that runs over several."
      >
        <Fields>
          <Field label="the day" hint={days.length ? "Taken from the days below." : undefined}>
            <input
              type="date"
              value={draft.happens_on}
              disabled={days.length > 0}
              onChange={(event) => set("happens_on", event.target.value)}
            />
          </Field>
          <Field label="from — until" two hint={days.length ? "Taken from the days below." : undefined}>
            <span className="admin-range">
              <input
                type="time"
                value={draft.starts_at}
                aria-label="From"
                disabled={days.length > 0}
                onChange={(event) => set("starts_at", event.target.value)}
              />
              <span aria-hidden="true">→</span>
              <input
                type="time"
                value={draft.ends_at}
                aria-label="Until"
                disabled={days.length > 0}
                onChange={(event) => set("ends_at", event.target.value)}
              />
            </span>
          </Field>
          <Field
            label="and the day it ends"
            hint="Only for something that starts and finishes on different days."
          >
            <input
              type="date"
              value={draft.ends_on}
              min={draft.happens_on || undefined}
              disabled={days.length > 0}
              onChange={(event) => set("ends_on", event.target.value)}
            />
          </Field>
        </Fields>
      </Panel>

      <Panel
        name="the programme"
        hint="The days it actually runs, each with its own name and hours. Drag them, or type a number."
      >
        <Programme
          days={days}
          inFrench={inFrench}
          onChange={(next) => {
            setDays(next);
            setJustSaved(false);
          }}
        />
      </Panel>

      <Panel name="where" hint="A name anybody would use, the street underneath, and a pin.">
        <Fields>
          <Field label="the place">
            <input
              {...both("place")}
              placeholder={inFrench ? draft.place : "the yard, Burngreave"}
            />
          </Field>
          <Field label="the street">
            <input
              {...both("address")}
              placeholder={inFrench ? draft.address : "Route de Suisse 112-114"}
            />
          </Field>
          <Field
            label="on the map"
            hint="Press find it and it looks up the place and the street. Only what has a pin is on the map."
          >
            <Placed
              lat={draft.lat}
              lng={draft.lng}
              near={[draft.address, draft.place].filter(Boolean).join(", ") || draft.title}
              onPlace={(lat, lng) => {
                set("lat", lat);
                set("lng", lng);
              }}
            />
          </Field>
        </Fields>
      </Panel>

      <Panel name="coming" hint="How anybody gets to be there.">
        <Fields>
          <Field
            label="places"
            hint={
              coming
                ? `${coming} asked so far. 0 means as many as turn up.`
                : "How many can come. 0 means as many as turn up."
            }
          >
            <input
              type="number"
              min={0}
              value={draft.spots}
              onChange={(event) => set("spots", Number(event.target.value) || 0)}
            />
          </Field>
          <Field label="what it costs" hint="Free is worth saying out loud.">
            <input
              {...both("cost")}
              placeholder={inFrench ? draft.cost : "free"}
            />
          </Field>
          <Field
            label="or write to"
            hint="For the ones somebody else takes the names for. Members can always ask in the app."
          >
            <input
              type="email"
              value={draft.sign_up_email}
              placeholder="production@least.eco"
              onChange={(event) => set("sign_up_email", event.target.value)}
            />
          </Field>
          <Field
            label="still wanted"
            hint="One per line. Shown beside what people are bringing, and it recruits itself."
            wide
          >
            <textarea
              rows={3}
              {...both("needs")}
              placeholder={inFrench ? draft.needs : "a pot big enough for forty\na table\nsomebody with a van"}
            />
          </Field>
          <Field label="anything else" hint="The practical sentence: bring a bowl." wide>
            <textarea
              rows={2}
              {...both("note")}
              placeholder={inFrench ? draft.note : "bring a bowl"}
            />
          </Field>
        </Fields>
      </Panel>

      <Panel name="who it is with" hint="And the larger thing it belongs to, if there is one.">
        <Fields>
          <Field label="partners" hint="From the list under Partners in the menu.">
            <Some
              value={draft.partners}
              onChange={(next) => set("partners", next)}
              options={partners}
              add="add a partner"
              empty="nobody yet"
            />
          </Field>
          <Field label="part of" hint="A project, a festival, a programme it happens inside.">
            <input
              {...both("part_of")}
              placeholder={inFrench ? draft.part_of : "a project, a festival, a programme"}
            />
          </Field>
          <Field label="and where to read about it">
            <input
              type="url"
              value={draft.part_of_url}
              placeholder="https://www.least.eco"
              onChange={(event) => set("part_of_url", event.target.value)}
            />
          </Field>
        </Fields>
      </Panel>

      <Panel
        name="the flyer"
        hint="The PDF itself, offered on the evening's page for printing and pinning up."
      >
        <Paper
          path={draft.flyer_path}
          url={draft.flyer_path ? mediaUrl(draft.flyer_path) : ""}
          folder="flyers"
          onDone={(path) => set("flyer_path", path)}
          onClear={() => set("flyer_path", null)}
        />
      </Panel>

      <Panel
        name="the page"
        hint="Everything a flyer would say at length, in the order somebody reads it."
        action={
          <Button onClick={() => setBlocks((list) => [...list, blankBlock("text")])}>
            <Icon name="plus" />
            add a paragraph
          </Button>
        }
      >
        <Build
          blocks={blocks}
          inFrench={inFrench}
          onChange={(next) => {
            setBlocks(next);
            setJustSaved(false);
          }}
          photos={photos}
          empty="Nothing on the page yet. The paragraph above and the programme are enough for most evenings; add a heading or a photograph for one that deserves more."
        />
      </Panel>

      <Panel name="afterwards" hint="Filled in once it has happened.">
        <Fields>
          <Field
            label="how many ate"
            hint="Roughly. It is the evidence for the whole argument, so a guess beats nothing."
          >
            <input
              inputMode="numeric"
              value={draft.people_fed ?? ""}
              placeholder="40"
              onChange={(event) =>
                set(
                  "people_fed",
                  event.target.value === "" ? null : Number(event.target.value) || 0,
                )
              }
            />
          </Field>
          <Field
            label="what came of it"
            hint="The story written about it afterwards. Several evenings may share one."
          >
            <Dropdown
              value={draft.story_id ?? ""}
              onChange={(next) => set("story_id", next || null)}
              options={told.map((one) => ({ value: one.id, label: one.title }))}
              empty="nothing written yet"
              search={told.length > 8}
              label="what came of it"
            />
          </Field>
        </Fields>
      </Panel>

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={dirty}
        saved={justSaved}
        label="save this evening"
      >
        {!draft.published ? (
          <span className="admin-note" style={{ margin: 0 }}>
            still hidden — nobody outside can see it
          </span>
        ) : null}
        <Bin what={draft.title || "this evening"} onClick={remove} disabled={pending} />
      </SaveBar>

      {picking ? (
        <PhotoPicker
          photos={photos}
          onClose={() => setPicking(false)}
          onPick={(photo) => set("photo_path", photo.path)}
        />
      ) : null}
    </>
  );
}
