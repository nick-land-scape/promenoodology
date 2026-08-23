"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Photo from "../Photo";
import { notJustYet, sayWhoYouAre } from "@/app/app/actions";
import { setMyPhoto } from "@/lib/site-actions/account";
import { ACCEPTS, uploadPhoto } from "@/lib/admin/upload";
import { buzz } from "@/lib/native";
import { mediaUrl } from "@/lib/supabase/config";
import Choose from "./Choose";
import { localeOf, useReading, useSay } from "./Words";

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
/* Thirty-one, always. Trimming the list to the month somebody has picked would
   mean a day that quietly disappears when they change the month afterwards —
   whereas the 31st of February is caught on the way in, once, by the server. */
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

/* Newest first: whoever is filling this in is far likelier to have been born in
   1998 than in 1926, and a list that opens on the year they want is a list they
   do not have to scroll. A hundred and ten years is more than enough. */
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 110 }, (_, index) => THIS_YEAR - index);

export default function Settling(props: Props) {
  const say = useSay();
  /* The names of the months, from the language rather than from a list we keep:
     "novembre" and "November" are the same month and neither is ours to write
     down. Numbered from one, because that is what gets stored. */
  const locale = localeOf(useReading());
  const months = MONTHS.map((month) => ({
    value: String(month),
    label: new Date(Date.UTC(2000, month - 1, 1)).toLocaleDateString(locale, {
      month: "long",
      timeZone: "UTC",
    }),
  }));
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
  /* A day, a month and a year, kept apart rather than as one string somebody has
     to punctuate correctly. What arrives is "7.11" or "7.11.1990" — see
     `sayWhoYouAre`, which is the one place that knows that shape. */
  const [born, setBorn] = useState(() => {
    const [day = "", month = "", year = ""] = (props.birthday || "").split(".");
    return { day, month, year };
  });
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
      setTrouble(error instanceof Error ? error.message : say("me.pictureDidNotGoUp"));
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
        /* Nothing at all unless a day and a month are both there: a month on its
           own is not a birthday, and sending half of one is how a field ends up
           holding "0.11". The year rides along only when it was chosen. */
        birthday:
          born.day && born.month
            ? [born.day, born.month, born.year].filter(Boolean).join(".")
            : "",
        birthdayShown,
        instagram,
        cannotEat,
        phone,
        listed,
      });
      if (!answer.ok) {
        setTrouble(answer.error ?? say("me.didNotSave"));
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
          aria-label={say(portrait ? "me.anotherPortrait" : "me.addAPortrait")}
        >
          {portrait ? (
            <Photo src={mediaUrl(portrait)} alt="" width={600} height={800} sizes="120px" priority />
          ) : (
            <span className="me-face-none">{say("me.addPortraitPlain")}</span>
          )}
          <em>{busy ? say("me.puttingItUp") : say(portrait ? "me.change" : "me.add")}</em>
        </button>
        <div className="me-strip-said">
          <p className="app-note" style={{ margin: 0 }}>
            {say("me.faceOnCommunity")}
          </p>
        </div>
      </div>

      <div className="field-list">
        <div className="field">
          <label htmlFor="who-name">{say("me.yourName")}</label>
          <input
            id="who-name"
            value={name}
            onChange={(change) => setName(change.target.value)}
            placeholder={say("me.whatTheyCallYou")}
            autoComplete="name"
          />
        </div>

        <div className="field">
          <label htmlFor="who-city">{say("me.whereYouAre")}</label>
          <input
            id="who-city"
            value={city}
            onChange={(change) => setCity(change.target.value)}
            placeholder={say("me.cityEg")}
            autoComplete="address-level2"
          />
        </div>

        <div className="field">
          <label htmlFor="who-country">{say("me.andCountry")}</label>
          <input
            id="who-country"
            value={country}
            onChange={(change) => setCountry(change.target.value)}
            placeholder={say("me.countryEg")}
            autoComplete="country-name"
          />
        </div>

        <div className="field">
          <label htmlFor="who-does">{say("me.whatYouDo")}</label>
          <input
            id="who-does"
            value={does}
            onChange={(change) => setDoes(change.target.value)}
            placeholder={say("me.whatYouDoEg")}
          />
        </div>

        <div className="field">
          <label htmlFor="who-skills">{say("me.whatYouBring")}</label>
          <input
            id="who-skills"
            value={skills}
            onChange={(change) => setSkills(change.target.value)}
            placeholder={say("me.whatYouBringEg")}
          />
          <em className="field-said">
            {say("me.commasBetween")}
          </em>
        </div>

        <div className="field">
          <label htmlFor="who-languages">{say("me.languages")}</label>
          <input
            id="who-languages"
            value={languages}
            onChange={(change) => setLanguages(change.target.value)}
            placeholder={say("me.languagesEg")}
          />
        </div>

        {/* Which language we write to you in — a field, among the fields. */}
        {props.language}

        <div className="field">
          <span className="field-label">{say("me.birthday")}</span>
          <div className="birthday-three">
            <Choose
              value={born.day}
              label={say("me.day")}
              onChange={(day) => setBorn((now) => ({ ...now, day }))}
              /* Empty, it says what it is rather than "—": three dashes in a row
                 tell somebody there are three fields and nothing about which is
                 which, and the year is the one nobody expects. */
              options={[
                { value: "", label: say("me.day") },
                ...DAYS.map((day) => ({ value: String(day), label: String(day) })),
              ]}
            />
            <Choose
              value={born.month}
              label={say("me.month")}
              onChange={(month) => setBorn((now) => ({ ...now, month }))}
              options={[{ value: "", label: say("me.month") }, ...months]}
            />
            <Choose
              value={born.year}
              label={say("me.year")}
              onChange={(year) => setBorn((now) => ({ ...now, year }))}
              options={[
                { value: "", label: say("me.year") },
                ...YEARS.map((year) => ({ value: String(year), label: String(year) })),
              ]}
            />
          </div>
          <em className="field-said">{say("me.yearIsYours")}</em>
        </div>

        {born.day && born.month ? (
          <label className="me-check">
            <input
              type="checkbox"
              checked={birthdayShown}
              onChange={(change) => setBirthdayShown(change.target.checked)}
            />
            <span>{say("me.letOthersSee")}</span>
          </label>
        ) : null}

        <div className="field">
          <label htmlFor="who-instagram">{say("me.instagram")}</label>
          <input
            id="who-instagram"
            value={instagram}
            onChange={(change) => setInstagram(change.target.value)}
            placeholder={say("me.withoutTheAt")}
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* The two nobody else ever sees. Said out loud, because a form that asks
          about food and a phone number without saying who reads it is a form
          people lie to. */}
      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">{say("me.onlyForUs")}</h2>
        </div>
        <p className="app-note">{say("me.onlyForUsNote")}</p>

        <div className="field-list">
          <div className="field">
            <label htmlFor="who-eat">{say("me.cannotEat")}</label>
            <input
              id="who-eat"
              value={cannotEat}
              onChange={(change) => setCannotEat(change.target.value)}
              placeholder={say("me.cannotEatEg")}
            />
          </div>
          <div className="field">
            <label htmlFor="who-phone">{say("me.numberForDay")}</label>
            <input
              id="who-phone"
              value={phone}
              onChange={(change) => setPhone(change.target.value)}
              placeholder={say("me.numberForDayEg")}
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
        <span>{say("me.putMeOnCommunity")}</span>
      </label>

      {trouble ? <p className="app-error">{trouble}</p> : null}

      <div className="app-section">
        <button
          type="button"
          className="pill pill-solid pill-wide"
          onClick={keep}
          disabled={pending || busy || !name.trim()}
        >
          {say(pending ? "me.saving" : "me.thatIsMe")}
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
            {say("me.notNow")}
          </button>
        ) : null}
      </div>
    </>
  );
}
