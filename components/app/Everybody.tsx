"use client";

import { useMemo, useState, useTransition } from "react";
import Photo from "../Photo";
import Sheet from "./Sheet";
import { useSay } from "./Words";
import { buzz } from "@/lib/native";
import { addPerson, invitePerson, savePeople } from "@/app/admin/people/actions";

/** A row of the profiles table, as this screen reads it. */
export type Somebody = {
  id: string;
  name: string;
  country: string;
  city: string;
  does: string;
  skills: string[];
  languages: string[];
  cannot_eat: string;
  phone: string;
  colour: string | null;
  listed: boolean;
  listed_by_admin: boolean | null;
  role: "member" | "admin";
  joined_on: string;
  email: string | null;
  user_id: string | null;
  photo_path: string | null;
  member_no: number | null;
};

type Person = Somebody & { photo: string | null };

/**
 * Everybody in the club, for an admin, on a phone.
 *
 * Three things happen here and they are the three that happen away from a desk:
 * a name gets corrected, somebody gets taken off or put back on the community
 * page, and somebody gets handed the keys. Everything else about a person — their
 * portrait, what they cannot eat, the day they joined — is desk work and stays on
 * the website, where there is room to do it properly.
 *
 * It calls the website's own actions rather than new ones. They already carry the
 * rules: an admin is checked twice, once here and once by the database's policies,
 * and nobody may take the last admin's keys away — including their own. A second
 * set of actions would be a second place for those rules to be forgotten.
 */
export default function Everybody({ people }: { people: Person[] }) {
  const say = useSay();
  const [looking, setLooking] = useState("");
  const [editing, setEditing] = useState<Person | null>(null);
  const [adding, setAdding] = useState(false);

  const shown = useMemo(() => {
    const asked = looking.trim().toLowerCase();
    if (!asked) return people;
    return people.filter((one) =>
      [one.name, one.country, one.city, one.does, one.email ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(asked),
    );
  }, [people, looking]);

  return (
    <>
      <div className="app-section">
        <div className="app-section-head">
          <p className="app-note" style={{ margin: 0 }}>
            {say("who.onlyAdmins")}
          </p>
          <span className="app-label">
            {say("who.howMany").replace("{n}", String(people.length))}
          </span>
        </div>

        {/* In a block of its own, because a field in this app is a line inside a
            bordered box — on its own it is a label with nothing under it, which
            on dark paper is a label with nothing under it and no way to tell. */}
        <div className="field-block" style={{ margin: "10px 0 0" }}>
          <div className="field">
            <label htmlFor="who-find">{say("who.find")}</label>
            <input
              id="who-find"
              value={looking}
              onChange={(change) => setLooking(change.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <button
          type="button"
          className="pill pill-small"
          style={{ marginTop: 14 }}
          onClick={() => setAdding(true)}
        >
          {say("who.writeSomebodyDown")}
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="app-note" style={{ padding: "0 var(--gutter) 18px" }}>
          {say("who.nobody")}
        </p>
      ) : (
        <ul className="row-list">
          {shown.map((one) => (
            <li key={one.id}>
              <button
                type="button"
                className="row row-pressable"
                onClick={() => {
                  void buzz("light");
                  setEditing(one);
                }}
              >
                <span className={one.photo ? "avatar avatar-photo" : "avatar"}>
                  {one.photo ? (
                    <Photo src={one.photo} alt="" fill sizes="40px" />
                  ) : (
                    <span aria-hidden="true">{first(one.name)}</span>
                  )}
                </span>
                <span className="row-body">
                  <span className="row-title">
                    {one.name || say("card.noName")}
                    {one.role === "admin" ? (
                      <span className="row-badge row-badge-small">
                        {say("who.admin")}
                      </span>
                    ) : null}
                  </span>
                  <span className="row-meta">
                    {[one.city, one.country].filter(Boolean).join(" · ")}
                  </span>
                  {/* The two things about a person an admin is looking for when
                      they open this: are they on the page, and can they get in. */}
                  <span className="row-meta">
                    {[
                      shownOnThePage(one) ? null : say("who.notListed"),
                      one.user_id ? null : say("who.noWayIn"),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="row-arrow" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <OnePerson
        person={editing}
        onClose={() => setEditing(null)}
      />
      <NewPerson open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

/** An admin's answer wins; their own is what stands when there is no answer. */
function shownOnThePage(one: Person) {
  return one.listed_by_admin ?? one.listed;
}

function first(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

/**
 * One person, in the pop-up.
 *
 * A name, a town, what they do, whether they are on the page, whether they have
 * the keys — and a way in for somebody who has never been sent one. Every other
 * field the row carries is passed straight back untouched: the action saves a
 * whole person, and a phone form that quietly blanked what it does not show would
 * lose somebody's languages the first time an admin fixed a typo.
 */
function OnePerson({
  person,
  onClose,
}: {
  person: Person | null;
  onClose: () => void;
}) {
  const say = useSay();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [does, setDoes] = useState("");
  const [listed, setListed] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [said, setSaid] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, start] = useTransition();
  const [inviting, setInviting] = useState(false);

  /* Filled from whoever was pressed, once, when the pop-up opens. Keyed by id
     rather than watched with an effect: a new person means a new form, and React
     will build one for us if we say so. */
  const [was, setWas] = useState<string | null>(null);
  if (person && was !== person.id) {
    setWas(person.id);
    setName(person.name);
    setCity(person.city ?? "");
    setCountry(person.country ?? "");
    setDoes(person.does ?? "");
    setListed(shownOnThePage(person));
    setAdmin(person.role === "admin");
    setEmail(person.email ?? "");
    setSaid("");
    setBad(false);
    setInviting(false);
  }

  function save() {
    if (!person) return;
    setSaid("");
    setBad(false);
    start(async () => {
      const answer = await savePeople([
        {
          id: person.id,
          name,
          country,
          city,
          does,
          colour: person.colour,
          listed: person.listed,
          /* An admin's answer, said outright. Null would mean "leave it to them",
             and a switch somebody has just moved is not that. */
          listed_by_admin: listed,
          role: admin ? "admin" : "member",
          joined_on: person.joined_on,
          skills: person.skills ?? [],
          languages: person.languages ?? [],
          cannot_eat: person.cannot_eat ?? "",
          phone: person.phone ?? "",
        },
      ]);
      if (!answer.ok) {
        setBad(true);
        setSaid(answer.error ?? say("who.somethingWrong"));
        return;
      }
      void buzz("medium");
      setSaid(say("who.saved"));
    });
  }

  function invite() {
    if (!person) return;
    setSaid("");
    setBad(false);
    start(async () => {
      const answer = await invitePerson({ id: person.id, name, email });
      if (!answer.ok) {
        setBad(true);
        setSaid(answer.error ?? say("who.somethingWrong"));
        return;
      }
      void buzz("medium");
      setSaid(say("who.sent"));
      setInviting(false);
    });
  }

  return (
    <Sheet
      open={Boolean(person)}
      title={person?.name || say("who.editing")}
      said={person?.member_no ? `${say("card.no")} ${String(person.member_no).padStart(4, "0")}` : undefined}
      onClose={onClose}
    >
      <form
        className="field-block"
        onSubmit={(submit) => {
          submit.preventDefault();
          save();
        }}
      >
        <div className="field">
          <label htmlFor="who-name">{say("who.theirName")}</label>
          <input
            id="who-name"
            value={name}
            onChange={(change) => setName(change.target.value)}
            disabled={busy}
          />
        </div>

        <div className="field">
          <label htmlFor="who-city">{say("who.theirCity")}</label>
          <input
            id="who-city"
            value={city}
            onChange={(change) => setCity(change.target.value)}
            disabled={busy}
          />
        </div>

        <div className="field">
          <label htmlFor="who-country">{say("who.theirCountry")}</label>
          <input
            id="who-country"
            value={country}
            onChange={(change) => setCountry(change.target.value)}
            disabled={busy}
          />
        </div>

        <div className="field">
          <label htmlFor="who-does">{say("who.whatTheyDo")}</label>
          <input
            id="who-does"
            value={does}
            onChange={(change) => setDoes(change.target.value)}
            disabled={busy}
          />
        </div>

        {/* The two switches are rows of the same block as the fields above them,
            not loose items under it. A `.field` is what gives a row its gutter and
            the hairline that separates it from the row before; without one they
            sat flush against the left edge of the pop-up while every label above
            them started fourteen points in. */}
        <div className="field">
          <label className="me-check">
            <input
              type="checkbox"
              checked={listed}
              onChange={(change) => setListed(change.target.checked)}
              disabled={busy}
            />
            <span>{say("who.onThePage")}</span>
          </label>
        </div>

        <div className="field">
          <label className="me-check">
            <input
              type="checkbox"
              checked={admin}
              onChange={(change) => setAdmin(change.target.checked)}
              disabled={busy}
            />
            <span>{say("who.canGetIn")}</span>
          </label>
        </div>

        {/* A way in, for somebody who has never had one. Behind a press rather
            than in the form, because sending an email is not saving a field. */}
        {inviting ? (
          <div className="field">
            <label htmlFor="who-email">{say("who.theirEmail")}</label>
            <input
              id="who-email"
              type="email"
              value={email}
              onChange={(change) => setEmail(change.target.value)}
              autoComplete="off"
              disabled={busy}
            />
            <button
              type="button"
              className="pill pill-small pill-solid"
              style={{ marginTop: 10 }}
              onClick={invite}
              disabled={busy}
            >
              {say(busy ? "who.sending" : "who.send")}
            </button>
          </div>
        ) : person && !person.user_id ? (
          <div className="field">
            <button
              type="button"
              className="pill pill-small"
              onClick={() => setInviting(true)}
              disabled={busy}
            >
              {say("who.sendAWayIn")}
            </button>
          </div>
        ) : null}

        {said ? (
          <div className="field">
            <p className={bad ? "app-error" : "app-note"} style={{ margin: 0 }}>
              {said}
            </p>
          </div>
        ) : null}

        <div className="form-actions">
          <button
            type="submit"
            className="pill pill-solid pill-wide"
            disabled={busy}
          >
            {say(busy ? "who.saving" : "who.save")}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

/** Somebody written down, which asks nothing of them. */
function NewPerson({ open, onClose }: { open: boolean; onClose: () => void }) {
  const say = useSay();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [said, setSaid] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, start] = useTransition();

  return (
    <Sheet open={open} title={say("who.writeSomebodyDown")} onClose={onClose}>
      <form
        className="field-block"
        onSubmit={(submit) => {
          submit.preventDefault();
          setSaid("");
          setBad(false);
          start(async () => {
            const answer = await addPerson({ name, country });
            if (!answer.ok) {
              setBad(true);
              setSaid(answer.error ?? say("who.somethingWrong"));
              return;
            }
            void buzz("medium");
            setName("");
            setCountry("");
            setSaid(say("who.saved"));
          });
        }}
      >
        <div className="field">
          <label htmlFor="who-new-name">{say("who.theirName")}</label>
          <input
            id="who-new-name"
            value={name}
            onChange={(change) => setName(change.target.value)}
            disabled={busy}
          />
        </div>

        <div className="field">
          <label htmlFor="who-new-country">{say("who.theirCountry")}</label>
          <input
            id="who-new-country"
            value={country}
            onChange={(change) => setCountry(change.target.value)}
            disabled={busy}
          />
        </div>

        {said ? <p className={bad ? "app-error" : "app-note"}>{said}</p> : null}

        <div className="form-actions">
          <button
            type="submit"
            className="pill pill-solid pill-wide"
            disabled={busy || !name.trim()}
          >
            {say(busy ? "who.saving" : "who.add")}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
