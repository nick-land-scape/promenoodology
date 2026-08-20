"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Uploader from "@/components/admin/Uploader";
import { Empty, Field, Flag, Problem, SaveBar, Tag, Word, pretty } from "@/components/admin/ui";
import { mediaUrl } from "@/lib/supabase/config";
import { savePeople, setPortrait } from "./actions";

export type Person = {
  id: string;
  name: string;
  country: string;
  role: "member" | "admin";
  listed: boolean;
  colour: string | null;
  photo: string | null;
  photoUrl: string | null;
  joined: string;
  isMe: boolean;
};

/** The three the community page knows how to colour a name with. */
const COLOURS = [
  { value: "", label: "black" },
  { value: "orange", label: "orange" },
  { value: "green", label: "green" },
  { value: "blue", label: "blue" },
];

/** Two letters, for somebody with no portrait. */
function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export default function PeopleList({ initial }: { initial: Person[] }) {
  const router = useRouter();
  const [people, setPeople] = useState(initial);
  const [kept, setKept] = useState(initial);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  const changed = useMemo(() => {
    const before = new Map(kept.map((person) => [person.id, person]));
    return people.filter((person) => {
      const was = before.get(person.id);
      if (!was) return false;
      return (
        was.name !== person.name ||
        was.country !== person.country ||
        was.colour !== person.colour ||
        was.listed !== person.listed ||
        was.role !== person.role
      );
    });
  }, [people, kept]);

  function edit(id: string, patch: Partial<Person>) {
    setPeople((list) => list.map((person) => (person.id === id ? { ...person, ...patch } : person)));
    setJustSaved(false);
  }

  function save() {
    setProblem("");
    start(async () => {
      const result = await savePeople(
        changed.map((person) => ({
          id: person.id,
          name: person.name,
          country: person.country,
          colour: person.colour,
          listed: person.listed,
          role: person.role,
        })),
      );
      if (!result.ok) setProblem(result.error ?? "That did not save.");
      else {
        setKept(people);
        setJustSaved(true);
        router.refresh();
      }
    });
  }

  function portrait(person: Person, path: string | null) {
    setProblem("");
    start(async () => {
      const result = await setPortrait(person.id, path);
      if (!result.ok) {
        setProblem(result.error ?? "The portrait did not save.");
        return;
      }
      const patch = { photo: path, photoUrl: path ? mediaUrl(path) : null };
      edit(person.id, patch);
      setKept((list) =>
        list.map((one) => (one.id === person.id ? { ...one, ...patch } : one)),
      );
      router.refresh();
    });
  }

  if (people.length === 0) {
    return <Empty>Nobody has signed in yet.</Empty>;
  }

  return (
    <>
      <Problem>{problem}</Problem>

      <ul className="admin-rows">
        {people.map((person) => (
          <li key={person.id} className="admin-row" style={{ flexWrap: "wrap" }}>
            <span className="admin-thumb admin-thumb-round">
              {person.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person.photoUrl} alt="" />
              ) : (
                initials(person.name)
              )}
            </span>

            <span className="admin-row-main" style={{ minWidth: 240 }}>
              <span className="admin-fields" style={{ borderTop: 0 }}>
                <Field label="name">
                  <input
                    value={person.name}
                    onChange={(event) => edit(person.id, { name: event.target.value })}
                    placeholder="their name"
                  />
                </Field>
                <Field label="from">
                  <input
                    value={person.country}
                    onChange={(event) => edit(person.id, { country: event.target.value })}
                    placeholder="optional"
                  />
                </Field>
                <Field label="name in" hint="Only for the few names the grid picks out.">
                  <select
                    value={person.colour ?? ""}
                    onChange={(event) => edit(person.id, { colour: event.target.value || null })}
                  >
                    {COLOURS.map((colour) => (
                      <option key={colour.value} value={colour.value}>
                        {colour.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="may look after the site">
                  <select
                    value={person.role}
                    onChange={(event) =>
                      edit(person.id, { role: event.target.value === "admin" ? "admin" : "member" })
                    }
                    disabled={person.isMe}
                  >
                    <option value="member">no — a member</option>
                    <option value="admin">yes — an admin</option>
                  </select>
                </Field>
              </span>

              <span className="admin-row-meta" style={{ marginTop: 6 }}>
                since {pretty(person.joined)}
                {person.isMe ? " — this is you" : ""}
              </span>
            </span>

            <span className="admin-row-side" style={{ flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
              {person.isMe ? <Tag tone="on">you</Tag> : null}
              <Flag
                on={person.listed}
                onChange={(next) => edit(person.id, { listed: next })}
                labels={["on the community page", "not on the page"]}
              />
              <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Uploader
                  folder={`profiles/${person.id}`}
                  many={false}
                  label={person.photoUrl ? "another portrait" : "a portrait"}
                  onDone={async (uploaded) => portrait(person, uploaded.path)}
                />
                {person.photo ? (
                  <Word danger onClick={() => portrait(person, null)} disabled={pending}>
                    no portrait
                  </Word>
                ) : null}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <SaveBar
        onSave={save}
        pending={pending}
        dirty={changed.length > 0}
        saved={justSaved}
        label={changed.length > 1 ? `keep ${changed.length} changes` : "keep the change"}
      >
        <span className="admin-note" style={{ margin: 0 }}>
          a portrait is kept the moment it is uploaded
        </span>
      </SaveBar>

      <p className="admin-note" style={{ marginTop: 18 }}>
        There is no way to delete somebody from here on purpose: a profile is what their posts and
        bookings hang off. Taking them off the community page leaves everything intact and can be
        undone.
      </p>
    </>
  );
}
