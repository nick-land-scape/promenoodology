"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Photo from "../Photo";
import { notJustYet, sayWhoYouAre } from "@/app/app/actions";
import { setMyPhoto } from "@/lib/site-actions/account";
import { ACCEPTS, uploadPhoto } from "@/lib/admin/upload";
import { buzz } from "@/lib/native";
import { mediaUrl } from "@/lib/supabase/config";

type Props = {
  /** Where to go when it is kept, and whether this is the first time. */
  back?: string;
  /** The language field, handed in from the server where its words live. */
  language?: React.ReactNode;
  first?: boolean;
  userId: string;
  name: string;
  city: string;
  country: string;
  does: string;
  skills: string[];
  languages: string[];
  birthday: string;
  birthdayShown: boolean;
  instagram: string;
  cannotEat: string;
  phone: string;
  listed: boolean;
  photo: string | null;
};

/**
 * Who you are, asked once.
 *
 * Every field here is here for a reason that belongs to this collective rather
 * than because a form usually has one:
 *
 * **What you do** and **what you can bring** — this is a group that improvises
 * kitchens out of salvaged materials and borrowed tools. Knowing who can weld, who
 * has a van and who has done this before is the actual work of putting one
 * together, and it currently lives in whoever happens to remember.
 *
 * **Languages** — five years of interventions in six countries. Somebody who
 * speaks Romanian is the difference between asking a market for surplus and not.
 *
 * **A day and a month** — because a collective wants to know it is your birthday.
 * The year is not asked for and not stored: nobody needs to know how old you are,
 * and a date of birth is the most useful thing in the world to somebody pretending
 * to be you.
 *
 * **What you cannot eat** — a shared kitchen has to know, and it is the one field
 * here that is never shown to anybody but us.
 *
 * All of it optional except a name, and all of it walkable-past: somebody who
 * joined to see what is on this Saturday does not owe us a biography.
 */
export default function Settling(props: Props) {
  const back = props.back ?? "/app";
  const first = props.first ?? false;
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(props.name);
  const [city, setCity] = useState(props.city);
  const [country, setCountry] = useState(props.country);
  const [does, setDoes] = useState(props.does);
  const [skills, setSkills] = useState(props.skills.join(", "));
  const [languages, setLanguages] = useState(props.languages.join(", "));
  const [birthday, setBirthday] = useState(props.birthday);
  const [birthdayShown, setBirthdayShown] = useState(props.birthdayShown);
  const [instagram, setInstagram] = useState(props.instagram);
  const [cannotEat, setCannotEat] = useState(props.cannotEat);
  const [phone, setPhone] = useState(props.phone);
  const [listed, setListed] = useState(props.listed);

  const [portrait, setPortrait] = useState(props.photo);
  const [busy, setBusy] = useState(false);
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  async function take(chosen: File | null) {
    if (!chosen) return;
    setTrouble("");
    setBusy(true);
    try {
      const uploaded = await uploadPhoto(chosen, `profiles/${props.userId}`);
      const answer = await setMyPhoto(uploaded.path);
      if (answer.error) setTrouble(answer.error);
      else setPortrait(uploaded.path);
    } catch (error) {
      setTrouble(error instanceof Error ? error.message : "That picture did not go up.");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  const asList = (typed: string) => typed.split(",").map((one) => one.trim()).filter(Boolean);

  function keep() {
    setTrouble("");
    start(async () => {
      const answer = await sayWhoYouAre({
        name,
        city,
        country,
        does,
        skills: asList(skills),
        languages: asList(languages),
        birthday,
        birthdayShown,
        instagram,
        cannotEat,
        phone,
        listed,
      });
      if (!answer.ok) {
        setTrouble(answer.error ?? "That did not save.");
        return;
      }
      void buzz("medium");
      router.replace(back);
      router.refresh();
    });
  }

  function later() {
    start(async () => {
      await notJustYet();
      router.replace(back);
      router.refresh();
    });
  }

  return (
    <>
      {first ? (
        <p className="app-note" style={{ padding: "0 var(--gutter) 4px" }}>
          Only the name is needed. The rest is how anybody here finds out who can
          weld, who has a van and who speaks Romanian — which is most of how an
          evening actually gets built.
        </p>
      ) : null}

      <div className="me-strip">
        <input
          ref={file}
          type="file"
          accept={ACCEPTS}
          hidden
          onChange={(change) => void take(change.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="me-face"
          onClick={() => file.current?.click()}
          disabled={busy}
          aria-label={portrait ? "Choose another portrait" : "Add a portrait"}
        >
          {portrait ? (
            <Photo src={mediaUrl(portrait)} alt="" width={600} height={800} sizes="120px" priority />
          ) : (
            <span className="me-face-none">add a portrait</span>
          )}
          <em>{busy ? "putting it up…" : portrait ? "change" : "add"}</em>
        </button>
        <div className="me-strip-said">
          <p className="app-note" style={{ margin: 0 }}>
            A face on the community page. Optional, like everything under it.
          </p>
        </div>
      </div>

      <div className="field-list">
        <div className="field">
          <label htmlFor="who-name">your name</label>
          <input
            id="who-name"
            value={name}
            onChange={(change) => setName(change.target.value)}
            placeholder="what everybody calls you"
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label htmlFor="who-city">where you are</label>
          <input
            id="who-city"
            value={city}
            onChange={(change) => setCity(change.target.value)}
            placeholder="Zürich"
            autoComplete="address-level2"
          />
        </div>

        <div className="field">
          <label htmlFor="who-country">and the country</label>
          <input
            id="who-country"
            value={country}
            onChange={(change) => setCountry(change.target.value)}
            placeholder="Switzerland"
            autoComplete="country-name"
          />
        </div>

        <div className="field">
          <label htmlFor="who-does">what you do</label>
          <input
            id="who-does"
            value={does}
            onChange={(change) => setDoes(change.target.value)}
            placeholder="architecture student, cook, carpenter…"
          />
        </div>

        <div className="field">
          <label htmlFor="who-skills">what you can bring</label>
          <input
            id="who-skills"
            value={skills}
            onChange={(change) => setSkills(change.target.value)}
            placeholder="welding, a van, sourdough, Romanian bureaucracy"
          />
          <em className="field-said">
            Commas between them. This is the one people actually search.
          </em>
        </div>

        <div className="field">
          <label htmlFor="who-languages">languages</label>
          <input
            id="who-languages"
            value={languages}
            onChange={(change) => setLanguages(change.target.value)}
            placeholder="German, English, a little Italian"
          />
        </div>

        {/* Which language we write to you in — a field, among the fields. */}
        {props.language}

        <div className="field">
          <label htmlFor="who-birthday">birthday</label>
          <input
            id="who-birthday"
            value={birthday}
            onChange={(change) => setBirthday(change.target.value)}
            placeholder="7.11"
            inputMode="numeric"
          />
          <em className="field-said">
            Day and month. We do not ask for the year and we do not keep one.
          </em>
        </div>

        {birthday ? (
          <label className="me-check">
            <input
              type="checkbox"
              checked={birthdayShown}
              onChange={(change) => setBirthdayShown(change.target.checked)}
            />
            <span>let the others see it</span>
          </label>
        ) : null}

        <div className="field">
          <label htmlFor="who-instagram">instagram</label>
          <input
            id="who-instagram"
            value={instagram}
            onChange={(change) => setInstagram(change.target.value)}
            placeholder="without the @"
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* The two nobody else ever sees. Said out loud, because a form that asks
          about food and a phone number without saying who reads it is a form
          people lie to. */}
      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">only for us</h2>
        </div>
        <p className="app-note">
          Never on the community page and never in the app: these two are read by
          whoever is cooking, and by nobody else.
        </p>

        <div className="field-list">
          <div className="field">
            <label htmlFor="who-eat">what you cannot eat</label>
            <input
              id="who-eat"
              value={cannotEat}
              onChange={(change) => setCannotEat(change.target.value)}
              placeholder="no nuts, no pork"
            />
          </div>
          <div className="field">
            <label htmlFor="who-phone">a number for the day</label>
            <input
              id="who-phone"
              value={phone}
              onChange={(change) => setPhone(change.target.value)}
              placeholder="for the afternoon of an evening, not for a list"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
        </div>
      </section>

      <label className="me-check" style={{ padding: "12px var(--gutter)" }}>
        <input
          type="checkbox"
          checked={listed}
          onChange={(change) => setListed(change.target.checked)}
        />
        <span>put me on the community page</span>
      </label>

      {trouble ? <p className="app-error">{trouble}</p> : null}

      <div className="app-section">
        <button
          type="button"
          className="pill pill-solid pill-wide"
          onClick={keep}
          disabled={pending || busy || !name.trim()}
        >
          {pending ? "saving…" : "that is me"}
        </button>
        {/* Only the first time. Afterwards this screen is a settings screen, and
            a settings screen with "not now" on it is a settings screen that does
            not trust you to leave. */}
        {first ? (
          <button
            type="button"
            className="compose-shut-again"
            onClick={later}
            disabled={pending}
            style={{ marginTop: 10 }}
          >
            not now — I will fill it in later
          </button>
        ) : null}
      </div>
    </>
  );
}
