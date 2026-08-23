"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import { signUpForDays, signUpForEvent } from "@/app/app/actions";
import { buzz } from "@/lib/native";
import { useSay } from "./Words";

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
  days,
  chosen,
  onDay,
  onClose,
  onDone,
}: {
  open: boolean;
  eventId: string;
  title: string;
  /* The programme, where there is one.
   *
   * An evening with days inside it is not something anybody comes to as a whole:
   * "Ateliers olfactifs" runs for a month and happens on five of those days. So
   * the first question stops being how many and becomes which — and the places
   * are taken a day at a time. */
  days?: { date: string; title: string; time: string; label: string }[];
  /** The days already taken, so re-opening it is editing. */
  chosen?: string[];
  /* The one day this is about, where the list has been opened out into its days.
     Not the same as `days`: that asks which of them, this *is* one of them. */
  onDay?: string | null;
  /** When it is, for the line under the title. */
  when?: string;
  /** How many places the evening has altogether, where it says. */
  spots?: number;
  /** What was said last time, so re-opening it is editing rather than starting. */
  mine?: { people: number; bringing: string; guests?: string[] } | null;
  onClose: () => void;
  onDone?: (said: string) => void;
}) {
  const say = useSay();
  const [people, setPeople] = useState(String(mine?.people ?? 1));
  const [guests, setGuests] = useState<string[]>(mine?.guests ?? []);
  const [bringing, setBringing] = useState(mine?.bringing ?? "");
  const [picked, setPicked] = useState<string[]>(chosen ?? []);
  const [busy, setBusy] = useState(false);
  const [trouble, setTrouble] = useState("");
  const programme = days ?? [];

  /* Opening it again shows what is already down for this evening rather than an
     empty form: changing three places to four is the common case, and starting
     from blank makes somebody type their own arrangements a second time. */
  useEffect(() => {
    if (!open) return;
    setPeople(String(mine?.people ?? 1));
    setGuests(mine?.guests ?? []);
    setBringing(mine?.bringing ?? "");
    setPicked(chosen ?? []);
    setTrouble("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mine?.people, mine?.bringing]);

  const many = Number(people) || 1;
  /** One field per person past yourself. */
  const asked = Math.max(0, many - 1);

  async function send() {
    setBusy(true);
    setTrouble("");
    const answer =
      programme.length > 0
        ? await signUpForDays(eventId, picked, many, bringing, guests.slice(0, asked))
        : await signUpForEvent(eventId, many, bringing, guests.slice(0, asked), onDay ?? null);
    setBusy(false);
    if (!answer.ok) {
      setTrouble(answer.error ?? say("join.didNotGoThrough"));
      return;
    }
    void buzz("medium");
    onDone?.(
      say("join.youAreDownFor")
        .replace("{n}", String(many))
        .replace("{places}", say(many === 1 ? "row.place" : "row.places")),
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
        {/* Which days, where there are days to choose. Nothing else on this form
            makes sense until this is answered, so it is first. */}
        {programme.length > 0 ? (
          <div className="field">
            <span className="field-label">{say("sheet.whichDays")}</span>
            <ul className="pick-days">
              {programme.map((day) => {
                const on = picked.includes(day.date);
                return (
                  <li key={day.date}>
                    <button
                      type="button"
                      className={on ? "pick-day is-on" : "pick-day"}
                      aria-pressed={on}
                      disabled={busy}
                      onClick={() =>
                        setPicked((current) =>
                          on
                            ? current.filter((one) => one !== day.date)
                            : [...current, day.date],
                        )
                      }
                    >
                      <span className="pick-day-tick" aria-hidden="true">
                        {on ? "✓" : ""}
                      </span>
                      <span className="pick-day-words">
                        <span className="pick-day-when">{day.label}</span>
                        {day.title ? (
                          <span className="pick-day-what">{day.title}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="join-people">{say("sheet.howMany")}</label>
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
              {asked === 1
                ? say("sheet.whoWith")
                : say("sheet.andNumber").replace("{n}", String(index + 2))}
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
              placeholder={say("sheet.firstNamePlenty")}
              autoComplete="off"
              disabled={busy}
            />
          </div>
        ))}

        <div className="field">
          <label htmlFor="join-bringing">{say("sheet.bringing")}</label>
          <input
            id="join-bringing"
            value={bringing}
            onChange={(change) => setBringing(change.target.value)}
            placeholder={say("sheet.bringingEg")}
            disabled={busy}
          />
          <em className="field-said">{say("sheet.anythingWelcome")}</em>
        </div>

        {trouble ? <p className="app-error">{trouble}</p> : null}

        <div className="form-actions">
          <button
            type="submit"
            className="pill pill-solid pill-wide"
            disabled={busy || (programme.length > 0 && picked.length === 0)}
          >
            {say(busy ? "sheet.signingUp" : "sheet.yesComing")}
          </button>
          {spots && spots > 0 ? (
            <p className="app-note">{say("sheet.altogether").replace("{n}", String(spots))}</p>
          ) : null}
        </div>
      </form>
    </Sheet>
  );
}
