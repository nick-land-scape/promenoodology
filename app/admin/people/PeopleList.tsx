"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import InHead from "@/components/admin/InHead";
import Picker from "@/components/admin/Picker";
import Thumb from "@/components/admin/Thumb";
import Uploader from "@/components/admin/Uploader";
import {
  Button,
  Chosen,
  Empty,
  Field,
  Icon,
  Panel,
  Problem,
  SaveBar,
  Tag,
  Tick,
  Word,
  useChosen,
  useUnsaved,
} from "@/components/admin/ui";
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
  /**
   * Theirs for good, and not their place in this list.
   *
   * The number that used to be here was the row's position — it moved whenever
   * anybody was added or renamed, which is exactly what a member number must
   * not do.
   */
  number: number | null;
  isMe: boolean;
};

/** The three answers to "is this person on the community page". */
const SHOWING: Record<string, boolean | null> = { them: null, yes: true, no: false };

const SHOWS = [
  { value: "them", label: "up to them" },
  { value: "yes", label: "always shown" },
  { value: "no", label: "always hidden" },
];

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
  const [adding, setAdding] = useState(false);
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
        was.role !== person.role ||
        was.joined !== person.joined
      );
    });
  }, [people, kept]);

  /* A word before anybody walks away from this. */
  useUnsaved(changed.length > 0, "changes to these people");

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

  /* Choosing several. Nothing here writes: an action changes every chosen row in
     this page's state, and the save button below writes them — so taking a dozen
     names off the community page is as reviewable as taking one off. */
  const pick = useChosen(people);

  /* What the whole selection already agrees on, so the bar shows a state
     rather than an empty field. */
  const picked = people.filter((one) => pick.has(one.id));
  const theirColour =
    picked.length > 0 && picked.every((one) => one.colour === picked[0].colour)
      ? picked[0].colour ?? ""
      : "";

  function applyToChosen(patch: Partial<Person>) {
    setPeople((list) => list.map((one) => (pick.has(one.id) ? { ...one, ...patch } : one)));
    setJustSaved(false);
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
          joined_on: person.joined,
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

      {/* Beside the title, and the panel below opens under it — the form was
          taking up the top of the page every day for the once a month anybody
          adds somebody. */}
      <InHead>
        <Button onClick={() => setAdding((was) => !was)}>
          <Icon name="plus" />
          {adding ? "never mind" : "add somebody"}
        </Button>
      </InHead>

      {adding ? (
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
      ) : null}

      {pick.count > 0 ? (
        <Chosen count={pick.count} what="people" onAll={pick.all} onNone={pick.none}>
          <Picker
            value=""
            onChange={(next) => next && applyToChosen({ listedByAdmin: SHOWING[next] })}
            options={SHOWS}
            empty="on the page"
            label="Put them on the community page, or take them off"
          />
          <input
            placeholder="a country, then Enter"
            aria-label="Where they are all from"
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              applyToChosen({ country: event.currentTarget.value.trim() });
              event.currentTarget.value = "";
            }}
          />
          <Picker
            value={theirColour}
            onChange={(next) => applyToChosen({ colour: next || null })}
            options={COLOURS.map((colour) => ({ value: colour.value, label: colour.label }))}
            empty="a colour"
            label="Set the colour their names are printed in"
          />
        </Chosen>
      ) : null}

      <ul className="admin-rows">
        {people.map((person, index) => (
          <li key={person.id} className="admin-row admin-person">
            {/* Choosing comes first, on the left, where the eye starts and
                where every other list of things you can tick puts it. */}
            <Tick
              on={pick.has(person.id)}
              onChoose={(range) => pick.toggle(person.id, range)}
              label={`Choose ${person.name || "this person"}`}
            />

            <span className="admin-person-body">
              <span className="admin-fields admin-person-fields">
                {/* The portrait is a column of the same table the fields are in,
                    not a picture floating above them: it lines up with the
                    labels, and the rules around it close on all four sides like
                    every other cell.

                    It is its own button, too. It was a round thumbnail beside a
                    button that said "another portrait" — a circle where the page
                    shows a portrait, and a second control doing what clicking the
                    picture obviously ought to do. */}
                <span className="admin-field admin-field-face">
                  <Uploader
                    folder={`profiles/${person.id}`}
                    many={false}
                    trigger={(open, working) => (
                      <button
                        type="button"
                        className="admin-portrait"
                        onClick={open}
                        disabled={working}
                        title={person.photoUrl ? "Choose another portrait" : "Add a portrait"}
                      >
                        {person.photoUrl ? (
                          <Thumb src={person.photoUrl} width={0} height={0} sizes="64px" />
                        ) : (
                          <span className="admin-portrait-none">{initials(person.name)}</span>
                        )}
                        <em>{working ? "…" : person.photoUrl ? "replace" : "add one"}</em>
                      </button>
                    )}
                    onDone={async (uploaded) => portrait(person, uploaded.path)}
                  />
                </span>

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
                <Field label="name in">
                  <Picker
                    value={person.colour ?? ""}
                    onChange={(next) => edit(person.id, { colour: next || null })}
                    options={COLOURS.filter((one) => one.value).map((colour) => ({
                      value: colour.value,
                      label: colour.label,
                    }))}
                    empty="black"
                    label="The colour this name is printed in"
                  />
                </Field>
                <Field label="since">
                  <input
                    type="date"
                    value={person.joined.slice(0, 10)}
                    onChange={(event) => edit(person.id, { joined: event.target.value })}
                  />
                </Field>
                <Field label="may look after the site">
                  {/* The label above says what the answer means: "no — a member"
                      was taking a third of the row to say "no". Nobody may take
                      the last door off themselves, so this one is a fact rather
                      than a control on your own row. */}
                  {person.isMe ? (
                    <span className="admin-said">yes — that is you</span>
                  ) : (
                    <Picker
                      value={person.role}
                      onChange={(next) =>
                        edit(person.id, { role: next === "admin" ? "admin" : "member" })
                      }
                      options={[
                        { value: "member", label: "no" },
                        { value: "admin", label: "yes" },
                      ]}
                      empty={null}
                      label="Whether they may look after the site"
                    />
                  )}
                </Field>
              </span>

              {/* Everything about the person that is not a field: who they are
                  to the site, and the two things you can do about it. */}
              <span className="admin-person-foot">
                <span className="admin-person-who">
                  {person.isMe ? <Tag tone="on">you</Tag> : null}
                  {person.hasAccount ? (
                    <Tag tone="on">can sign in</Tag>
                  ) : person.email ? (
                    <Tag>invited</Tag>
                  ) : (
                    <Tag>no account</Tag>
                  )}
                  {person.hasAccount ? null : (
                    <Word onClick={() => invite(person)} disabled={pending}>
                      {person.email ? "send it again" : "invite them"}
                    </Word>
                  )}
                  {person.email ? (
                    <a href={`mailto:${person.email}`} className="admin-person-mail">
                      {person.email}
                    </a>
                  ) : null}
                </span>

                <span className="admin-person-does">
                  {person.photo ? (
                    <Word danger onClick={() => portrait(person, null)} disabled={pending}>
                      take the portrait off
                    </Word>
                  ) : null}

                  {/* Three answers, one control. They were three buttons in a
                      row, all of them lit the same way, and which one was on was
                      something you worked out rather than read. "Up to them" is
                      genuinely a third answer, not the absence of the other
                      two — only it survives them changing their mind. */}
                  <span className="admin-person-showing">
                    <span>on the page</span>
                    <Picker
                      value={
                        person.listedByAdmin === null ? "them" : person.listedByAdmin ? "yes" : "no"
                      }
                      onChange={(next) => edit(person.id, { listedByAdmin: SHOWING[next] })}
                      options={[
                        {
                          value: "them",
                          label: `up to them — ${person.listed ? "shown" : "hidden"}`,
                        },
                        { value: "yes", label: "always shown" },
                        { value: "no", label: "always hidden" },
                      ]}
                      empty={null}
                      label="Whether they are on the community page"
                    />
                  </span>
                </span>
              </span>
            </span>

            {/* Their own number, given once and never changed — not their place
                in this list, which moves every time somebody is added. Last in
                the row, so it sits in the top right corner of the person rather
                than in the gutter where the ticks are. */}
            <span className="admin-person-no" title="Their member number">
              {person.number ?? "—"}
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
