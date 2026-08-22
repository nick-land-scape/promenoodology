"use client";

import { useMemo, useState, useTransition } from "react";
import Find from "@/components/admin/Find";
import { Panel, Problem, SaveBar } from "@/components/admin/ui";
import { hay, matches } from "@/lib/admin/find";
import { WHERES, type Phrase, type Where } from "@/lib/words";
import { saveFrench } from "./actions";

/**
 * The words the site says itself, in French.
 *
 * Separated by which half of the house they are in, because they are read by
 * different people for different reasons: the front is what a visitor sees and
 * is worth arguing about, and the back is what one person sees while working.
 *
 * Each phrase shows its English beside the field rather than above it — the two
 * are one thing, and what is being asked is "how would you say that", not "fill
 * this in". Left empty, the field falls back to the French the site was written
 * with, which is shown as the placeholder, so there is never a blank on the
 * site and never a mystery about what will appear.
 */
export default function Phrasebook({
  phrases,
  initial,
}: {
  phrases: Phrase[];
  /** What has been written down so far, by key. */
  initial: Record<string, string>;
}) {
  const [said, setSaid] = useState<Record<string, string>>(initial);
  const [kept, setKept] = useState<Record<string, string>>(initial);
  const [looking, setLooking] = useState("");
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  const dirty = JSON.stringify(said) !== JSON.stringify(kept);

  const found = useMemo(
    () => phrases.filter((phrase) => matches(hay(phrase.en, phrase.fr, phrase.note, phrase.key), looking)),
    [phrases, looking],
  );

  function save() {
    setProblem("");
    start(async () => {
      const result = await saveFrench(said);
      if (!result.ok) {
        setProblem(result.error ?? "That did not save.");
        return;
      }
      setKept(said);
      setJustSaved(true);
    });
  }

  /* How much of it is done. Not a progress bar — it is a fact about the site,
     and the useful version of it is "eleven of these are still in English". */
  const written = phrases.filter((phrase) => (said[phrase.key] ?? "").trim()).length;

  return (
    <>
      <Problem>{problem}</Problem>

      <Find
        value={looking}
        onChange={setLooking}
        what="a word"
        showing={found.length}
        total={phrases.length}
      />

      {WHERES.map((house) => {
        const mine = found.filter((phrase) => phrase.where === house.key);
        const any = phrases.some((phrase) => phrase.where === house.key);

        /* A half with nothing in it keeps its heading and says so: it is one of
           the two this page was asked to separate, and one that quietly
           disappeared would read as a page that had lost something. A half
           emptied by the search simply goes — that is the search working. */
        if (mine.length === 0) {
          if (any) return null;
          return (
            <Panel key={house.key} name={house.name} hint={house.blurb}>
              <p className="admin-empty" style={{ padding: "10px 14px" }}>
                Nothing in this half needs translating yet.
              </p>
            </Panel>
          );
        }

        return (
          <Panel key={house.key} name={house.name} hint={house.blurb}>
            <ul className="admin-words">
              {mine.map((phrase) => (
                <li key={phrase.key}>
                  <span className="admin-words-en">
                    <em>{phrase.en}</em>
                    {phrase.note ? <span>{phrase.note}</span> : null}
                  </span>
                  <input
                    lang="fr"
                    value={said[phrase.key] ?? ""}
                    placeholder={phrase.fr}
                    aria-label={`${phrase.en}, in French`}
                    onChange={(event) => {
                      setSaid((old) => ({ ...old, [phrase.key]: event.target.value }));
                      setJustSaved(false);
                    }}
                  />
                </li>
              ))}
            </ul>
          </Panel>
        );
      })}

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={dirty}
        saved={justSaved}
        label="keep these words"
      >
        <span className="admin-note" style={{ margin: 0 }}>
          {written} of {phrases.length} said your way; the rest use the French the site was written
          with.
        </span>
      </SaveBar>
    </>
  );
}
