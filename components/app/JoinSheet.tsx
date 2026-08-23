"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import { signUpForEvent } from "@/app/app/actions";
import { buzz } from "@/lib/native";

const MOST = 6;

/**
 * Saying you are coming, and who with.
 *
 * One pop-up, used by the list and by an evening's own screen — it was a small
 * form that opened underneath in two places, with two ideas about spacing and two
 * copies of the same three questions.
 *
 * The questions changed too. "How many of you" used to be the whole of it, which
 * is a number for a cook and nothing for anybody else: whoever is on the door,
 * whoever lays the table and whoever is trying to place the two strangers at the
 * end of it all want names. So every place past your own asks for one. Not
 * required — somebody bringing a colleague whose name they have forgotten should
 * still be able to say two — but asked, plainly, in a field of its own.
 */
export default function JoinSheet({
  open,
  eventId,
  title,
  when,
  spots,
  mine,
  onClose,
  onDone,
}: {
  open: boolean;
  eventId: string;
  title: string;
  /** When it is, for the line under the title. */
  when?: string;
  /** How many places the evening has altogether, where it says. */
  spots?: number;
  /** What was said last time, so re-opening it is editing rather than starting. */
  mine?: { people: number; bringing: string; guests?: string[] } | null;
  onClose: () => void;
  onDone?: (said: string) => void;
}) {
  const [people, setPeople] = useState(String(mine?.people ?? 1));
  const [guests, setGuests] = useState<string[]>(mine?.guests ?? []);
  const [bringing, setBringing] = useState(mine?.bringing ?? "");
  const [busy, setBusy] = useState(false);
  const [trouble, setTrouble] = useState("");

  /* Opening it again shows what is already down for this evening rather than an
     empty form: changing three places to four is the common case, and starting
     from blank makes somebody type their own arrangements a second time. */
  useEffect(() => {
    if (!open) return;
    setPeople(String(mine?.people ?? 1));
    setGuests(mine?.guests ?? []);
    setBringing(mine?.bringing ?? "");
    setTrouble("");
  }, [open, mine?.people, mine?.bringing, mine?.guests]);

  const many = Number(people) || 1;
  /** One field per person past yourself. */
  const asked = Math.max(0, many - 1);

  async function send() {
    setBusy(true);
    setTrouble("");
    const answer = await signUpForEvent(
      eventId,
      many,
      bringing,
      guests.slice(0, asked),
    );
    setBusy(false);
    if (!answer.ok) {
      setTrouble(answer.error ?? "That did not go through.");
      return;
    }
    void buzz("medium");
    onDone?.(
      `You are down for ${many} ${many === 1 ? "place" : "places"}.`,
    );
    onClose();
  }

  return (
    <Sheet open={open} title={title} said={when} onClose={onClose}>
      <form
        className="field-block"
        onSubmit={(submit) => {
          submit.preventDefault();
          void send();
        }}
      >
        <div className="field">
          <label htmlFor="join-people">how many of you</label>
          <select
            id="join-people"
            value={people}
            onChange={(change) => setPeople(change.target.value)}
            disabled={busy}
          >
            {Array.from({ length: MOST }, (_, index) => String(index + 1)).map(
              (count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ),
            )}
          </select>
        </div>

        {/* A field per person you are bringing. They appear as the number goes
            up, which is the only place in this app where a form grows — and it
            grows because the answer to the question above it changed the
            question below it. */}
        {Array.from({ length: asked }, (_, index) => (
          <div className="field" key={index}>
            <label htmlFor={`join-guest-${index}`}>
              {asked === 1 ? "who with you" : `and number ${index + 2}`}
            </label>
            <input
              id={`join-guest-${index}`}
              value={guests[index] ?? ""}
              onChange={(change) =>
                setGuests((current) => {
                  const next = [...current];
                  next[index] = change.target.value;
                  return next;
                })
              }
              placeholder="a first name is plenty"
              autoComplete="off"
              disabled={busy}
            />
          </div>
        ))}

        <div className="field">
          <label htmlFor="join-bringing">bringing</label>
          <input
            id="join-bringing"
            value={bringing}
            onChange={(change) => setBringing(change.target.value)}
            placeholder="a pot, a salad, a speaker…"
            disabled={busy}
          />
          <em className="field-said">
            What is still wanted is listed on the evening. Anything else is
            welcome anyway.
          </em>
        </div>

        {trouble ? <p className="app-error">{trouble}</p> : null}

        <div className="form-actions">
          <button
            type="submit"
            className="pill pill-solid pill-wide"
            disabled={busy}
          >
            {busy ? "signing you up…" : "yes, I am coming"}
          </button>
          {spots && spots > 0 ? (
            <p className="app-note">{spots} places altogether.</p>
          ) : null}
        </div>
      </form>
    </Sheet>
  );
}
