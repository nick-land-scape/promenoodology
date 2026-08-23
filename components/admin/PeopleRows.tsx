"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Find from "@/components/admin/Find";
import Picker from "@/components/admin/Picker";
import { Field } from "@/components/admin/ui";
import { matches } from "@/lib/admin/find";

export type PersonRow = {
  id: string;
  name: string;
  /** The line under the name: where they are, since when. */
  meta: string;
  /** Everything the search should look through, joined up by the page above. */
  hay: string;
  /** Their portrait, where they have one. */
  photo: string | null;
  initials: string;
  /** The three things worth knowing at a glance, as words. */
  marks: string[];
  /* What the orders sort on. Kept as strings and numbers rather than worked out
     here, so the list sorts on what the database said rather than on what a row
     happens to be displaying. */
  sortName: string;
  joinedOn: string;
  memberNo: number;
};

/* How to order sixty-six people.
 *
 * By name is how you find somebody you already know about. By newest is how you
 * see who has just arrived, which is the other reason anybody opens this. The
 * number is the club's own order — who has been here longest — and it is the one
 * an admin uses when they are looking at the list as a history rather than as an
 * address book. */
const ORDERS = [
  { value: "name", label: "by name" },
  { value: "newest", label: "newest first" },
  { value: "oldest", label: "longest here" },
  { value: "number", label: "by number" },
] as const;

/**
 * Everybody, as a list of names.
 *
 * It was sixty-six open forms on one page: every field of every person, all at
 * once, saved in one go. That is a page nobody can read, a save nobody can
 * predict, and — with a portrait each — half a megabyte of pictures to look at a
 * list of names. So it is a list now, like the evenings and the notes are, and a
 * person is edited on their own page.
 *
 * Which means the list has to say enough to be worth scanning. Three things go
 * beside each name because they are the three an admin is actually looking for:
 * whether somebody can get into the back of the house, whether they are on the
 * community page, and whether they have ever been given a way in at all.
 */
export default function PeopleRows({ people }: { people: PersonRow[] }) {
  const [looking, setLooking] = useState("");
  const [order, setOrder] = useState<string>("name");

  const shown = useMemo(() => {
    const found = people.filter((one) => matches(one.hay, looking));
    const sorted = [...found];
    switch (order) {
      case "newest":
        sorted.sort((a, b) => b.joinedOn.localeCompare(a.joinedOn));
        break;
      case "oldest":
        sorted.sort((a, b) => a.joinedOn.localeCompare(b.joinedOn));
        break;
      case "number":
        sorted.sort((a, b) => a.memberNo - b.memberNo);
        break;
      default:
        sorted.sort((a, b) => a.sortName.localeCompare(b.sortName));
    }
    return sorted;
  }, [people, looking, order]);

  return (
    <>
      {/* The same line to type into that every other list in here has, and the
          order beside it — because a list of sixty-six people is read two ways:
          looking for somebody, and looking at who has just arrived. */}
      <div className="admin-people-top">
        <Find
          value={looking}
          onChange={setLooking}
          what="somebody"
          showing={shown.length}
          total={people.length}
        />
        <Field label="in what order">
          <Picker
            value={order}
            onChange={setOrder}
            options={ORDERS.map((one) => ({ value: one.value, label: one.label }))}
          />
        </Field>
      </div>

      {shown.length === 0 ? (
        <p className="admin-said">Nobody by that name.</p>
      ) : (
        <ul className="admin-rows admin-rows-people">
          {shown.map((one) => (
            <li key={one.id} className="admin-row">
              <Link href={`/admin/people/${one.id}`} className="admin-person-link">
                <span className="admin-person-face" aria-hidden="true">
                  {one.photo ? (
                    // Not next/image: forty pixels, and it changes whenever
                    // somebody uploads a new one.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={one.photo} alt="" />
                  ) : (
                    <span>{one.initials}</span>
                  )}
                </span>

                <span className="admin-person-said">
                  <span className="admin-person-name">
                    {one.name || <em>no name yet</em>}
                  </span>
                  <span className="admin-person-meta">{one.meta}</span>
                </span>

                {one.marks.length > 0 ? (
                  <span className="admin-person-marks">
                    {one.marks.map((mark) => (
                      <span key={mark}>{mark}</span>
                    ))}
                  </span>
                ) : null}

                <span className="admin-person-on" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
