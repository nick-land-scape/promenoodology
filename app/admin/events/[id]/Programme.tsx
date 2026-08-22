"use client";

import When from "@/components/admin/When";
import { Bin, Field, Icon } from "@/components/admin/ui";
import { pretty } from "@/lib/admin/when";

/**
 * The days an evening actually runs.
 *
 * Some of what we do is one afternoon. Some of it is five: "Ateliers olfactifs"
 * is four Saturdays and a Sunday between August and September, each with its own
 * name, its own hours and its own sentence, all on the same piece of ground and
 * all one thing. Five rows in the list would have been five addresses, five
 * pictures and the same paragraph typed out five times.
 *
 * Deliberately not a repeat rule. "Every Saturday until the 20th" is how you
 * would *describe* these days and it is not what they are — one is a Sunday, one
 * starts at nine in the morning, one is the closing event with somebody else's
 * festival — so a rule would have to be argued with on nearly every one of them.
 *
 * They are not dragged, either. A programme has exactly one right order and the
 * days themselves say what it is: the 22nd comes before the 29th whatever anybody
 * drags. So they sort themselves, by day and then by the hour they start, and a
 * day given a new date moves to where it belongs the moment it is given one. The
 * save sorts them again on the way to the database, so the two can never
 * disagree.
 *
 * An evening with nothing here is an ordinary evening on one day, which is most
 * of them: the day and the hour up in "when" say it, and nothing down here is
 * needed to answer when it is.
 */

export type Session = {
  /** Ours, for React and for dragging. Never written down. */
  id: string;
  happens_on: string;
  starts_at: string;
  ends_at: string;
  title: string;
  what: string;
  /** The French of this day, keyed by the column it translates. */
  fr?: Record<string, string>;
};

let counter = 0;
export const blankSession = (): Session => ({
  id: `s${(counter += 1)}`,
  happens_on: "",
  starts_at: "",
  ends_at: "",
  title: "",
  what: "",
});

export default function Programme({
  days,
  onChange,
  inFrench = false,
}: {
  days: Session[];
  onChange: (next: Session[]) => void;
  /** Typing the French of these days rather than the English. */
  inFrench?: boolean;
}) {
  /** By the day, then by the hour. A day with no date yet stays at the back. */
  const inOrder = (list: Session[]) =>
    [...list].sort((a, b) => {
      if (!a.happens_on) return 1;
      if (!b.happens_on) return -1;
      return (
        a.happens_on.localeCompare(b.happens_on) || (a.starts_at || "").localeCompare(b.starts_at || "")
      );
    });

  const set = (id: string, patch: Partial<Session>) =>
    onChange(inOrder(days.map((day) => (day.id === id ? { ...day, ...patch } : day))));

  /** The French of one field of one day, kept beside the English. */
  const setFrench = (day: Session, key: string, value: string) =>
    set(day.id, { fr: { ...(day.fr ?? {}), [key]: value } });

  return (
    <>
      {days.length === 0 ? (
        <p className="admin-empty" style={{ padding: "6px 0 18px" }}>
          One day, at the hour up in “when”. Add a day below for something that runs over several.
        </p>
      ) : null}

      <ul className="admin-blocks">
        {days.map((day, index) => (
          <li key={day.id} className="admin-block admin-block-day">
            {/* The number is which day of it this is, and it is read rather than
                set: the dates decide the order, not the other way round. */}
            <span className="admin-block-hold">
              <span className="admin-block-count">{index + 1}</span>
            </span>

            <span className="admin-block-body">
              <div className="admin-fields">
                <Field label="the day">
                  <When
                    label="the day"
                    date={day.happens_on}
                    time=""
                    dayOnly
                    empty="choose a day"
                    onChange={(chosen) => set(day.id, { happens_on: chosen })}
                  />
                </Field>
                <Field label="from — until" two>
                  <span className="admin-range">
                    <input
                      type="time"
                      value={day.starts_at}
                      aria-label="From"
                      onChange={(event) => set(day.id, { starts_at: event.target.value })}
                    />
                    <span aria-hidden="true">→</span>
                    <input
                      type="time"
                      value={day.ends_at}
                      aria-label="Until"
                      onChange={(event) => set(day.id, { ends_at: event.target.value })}
                    />
                  </span>
                </Field>
                <Field label={inFrench ? "what this one is called, in French" : "what this one is called"} wide>
                  <input
                    value={inFrench ? (day.fr?.title ?? "") : day.title}
                    placeholder={inFrench ? day.title : "cooking from the scrub"}
                    lang={inFrench ? "fr" : undefined}
                    onChange={(event) =>
                      inFrench
                        ? setFrench(day, "title", event.target.value)
                        : set(day.id, { title: event.target.value })
                    }
                  />
                </Field>
                <Field label={inFrench ? "and what happens, in French" : "and what happens"} wide>
                  <textarea
                    rows={Math.min(6, Math.max(2, Math.ceil((inFrench ? (day.fr?.what ?? "") : day.what).length / 80)))}
                    value={inFrench ? (day.fr?.what ?? "") : day.what}
                    placeholder={
                      inFrench ? day.what : "a foraging walk, then cooking together, then eating what was cooked"
                    }
                    lang={inFrench ? "fr" : undefined}
                    onChange={(event) =>
                      inFrench
                        ? setFrench(day, "what", event.target.value)
                        : set(day.id, { what: event.target.value })
                    }
                  />
                </Field>
              </div>
              {day.happens_on ? (
                <p className="admin-panel-hint" style={{ marginTop: 4 }}>
                  {pretty(day.happens_on)}
                </p>
              ) : null}
            </span>

            <span className="admin-block-does">
              <Bin
                what={day.title || "this day"}
                onClick={() => onChange(days.filter((one) => one.id !== day.id))}
              />
            </span>
          </li>
        ))}
      </ul>

      <div className="admin-build-add">
        <button
          type="button"
          className="admin-btn"
          onClick={() => onChange([...days, blankSession()])}
        >
          <Icon name="plus" />
          add a day
        </button>
        <p className="admin-note" style={{ margin: "8px 0 0" }}>
          They sort themselves by day and hour, so a new one can be added anywhere and given its
          date afterwards. The first and last of them become the evening&rsquo;s own dates, so
          &ldquo;22 August to 20 September&rdquo; is never typed anywhere — it is what the days add
          up to.
        </p>
      </div>
    </>
  );
}
