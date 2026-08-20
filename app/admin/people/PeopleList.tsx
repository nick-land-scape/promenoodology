"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Uploader from "@/components/admin/Uploader";
import { Button, Empty, Field, Flag, Icon, Panel, Problem, SaveBar, Tag, Word, pretty } from "@/components/admin/ui";
import { mediaUrl } from "@/lib/supabase/config";
import { addPerson, invitePerson, savePeople, setPortrait } from "./actions";

export type Person = {
  id: string;
  /** Their login, or the invitation waiting for them, or nothing yet. */
  email: string;
  hasAccount: boolean;
  name: string;
  country: string;
  role: "member" | "admin";
  /** Their own answer to being on the community page. */
  listed: boolean;
  /** An admin's answer, which wins. Null: whatever they said. */
  listedByAdmin: boolean | null;
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
        was.listedByAdmin !== person.listedByAdmin ||
        was.role !== person.role
      );
    });
  }, [people, kept]);

  /* Writing somebody down, and inviting somebody, are the same form with one
     more field — so it is one form, and the address is what decides. */
  const [newName, setNewName] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [said, setSaid] = useState("");

  function add() {
    setProblem("");
    setSaid("");
    const name = newName.trim();
    const email = newEmail.trim();

    start(async () => {
      const result = email
        ? await invitePerson({ id: null, name, email })
        : await addPerson({ name, country: newCountry });

      if (!result.ok) {
        setProblem(result.error ?? "That did not work.");
        return;
      }
      setSaid(
        email
          ? `${name} is on the community page, and a way in is on its way to ${email}.`
          : `${name} is on the community page. No account, and none needed.`,
      );
      setNewName("");
      setNewCountry("");
      setNewEmail("");
      router.refresh();
    });
  }

  function invite(person: Person) {
    const email = (
      prompt(`An address to invite ${person.name} at:`, person.email) ?? ""
    ).trim();
    if (!email) return;

    setProblem("");
    setSaid("");
    start(async () => {
      const result = await invitePerson({ id: person.id, name: person.name, email });
      if (!result.ok) setProblem(result.error ?? "That did not work.");
      else {
        setSaid(`A way in is on its way to ${email}.`);
        router.refresh();
      }
    });
  }

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
          listed_by_admin: person.listedByAdmin,
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

      {said ? <p className="admin-ok" style={{ display: "block", marginBottom: 14 }}>{said}</p> : null}

      <Panel
        name="somebody new"
        hint="A name is enough. Add an address as well and they are also sent a way in — that is the only way an account gets made now."
      >
        <div className="admin-fields">
          <Field label="name">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="first and last"
            />
          </Field>
          <Field label="from" hint="Optional.">
            <input
              value={newCountry}
              onChange={(event) => setNewCountry(event.target.value)}
              placeholder="a country"
            />
          </Field>
          <Field
            label="email"
            hint="Leave it empty for somebody who only belongs on the page."
          >
            <input
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="only if they should be able to sign in"
            />
          </Field>
          <div className="admin-field">
            <span>add</span>
            <span style={{ paddingTop: 2 }}>
              <Button onClick={add} disabled={pending || !newName.trim()}>
                <Icon name="plus" />
                {newEmail.trim() ? "add and invite" : "write them down"}
              </Button>
            </span>
          </div>
        </div>
      </Panel>

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
                {person.email ? (
                  <a href={`mailto:${person.email}`}>{person.email}</a>
                ) : (
                  "no address — on the page only"
                )}
                {" · since "}
                {pretty(person.joined)}
                {person.isMe ? " · this is you" : ""}
              </span>
            </span>

            <span className="admin-row-side" style={{ flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {person.isMe ? <Tag tone="on">you</Tag> : null}
                {person.hasAccount ? (
                  <Tag tone="on">can sign in</Tag>
                ) : person.email ? (
                  <Tag>invited</Tag>
                ) : (
                  <Tag>no account</Tag>
                )}
              </span>

              {/* Three states, not two. "Up to them" is a different answer from
                  "forced to the same thing they chose", and only one of the two
                  should survive them changing their mind. */}
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="admin-flag"
                  aria-pressed={person.listedByAdmin === null}
                  onClick={() => edit(person.id, { listedByAdmin: null })}
                  title={
                    person.listed
                      ? "They chose to be on the page"
                      : "They chose not to be on the page"
                  }
                >
                  up to them ({person.listed ? "shown" : "hidden"})
                </button>
                <button
                  type="button"
                  className="admin-flag"
                  aria-pressed={person.listedByAdmin === true}
                  onClick={() => edit(person.id, { listedByAdmin: true })}
                  title="On the community page whatever they said"
                >
                  always shown
                </button>
                <button
                  type="button"
                  className="admin-flag"
                  aria-pressed={person.listedByAdmin === false}
                  onClick={() => edit(person.id, { listedByAdmin: false })}
                  title="Off the community page whatever they said"
                >
                  always hidden
                </button>
              </span>
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
                {person.hasAccount ? null : (
                  <Word onClick={() => invite(person)} disabled={pending}>
                    {person.email ? "send the invitation again" : "invite them"}
                  </Word>
                )}
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
        There is no way to delete somebody from here on purpose: a person is what their posts and
        bookings hang off. Taking them off the community page leaves everything intact and can be
        undone.
      </p>
      <p className="admin-note">
        One thing worth being straight about: the invitation goes out through the same public key the
        site uses, so it is this page that only offers it to admins, not the database. A real lock
        means turning signups off in Supabase and giving the site a service-role key — see the note
        in <code>.env.example</code>.
      </p>
    </>
  );
}
