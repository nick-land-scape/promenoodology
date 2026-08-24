import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { pretty } from "@/lib/admin/when";
import { supabaseServer } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/rows";
import { signOut } from "@/lib/site-actions/account";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import { myBookings } from "@/lib/app/me";
import { byDay, placeKey, type Occasion } from "@/lib/occasions";
import { getEvents, getFrench } from "@/lib/source";
import { speaking, type Said } from "@/lib/words";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false },
};

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const say = speaking(lang, await getFrench());
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single<ProfileRow>();

  /* Your places, matched to the evenings they are for.
   *
   * Occasions rather than events, because a place on a programme is a place on
   * one of its days: five Saturdays in September is one event and five things
   * somebody can be coming to, and a list that says "Ateliers olfactifs" four
   * times tells nobody which four Saturdays they said yes to. */
  const [mine, events] = await Promise.all([myBookings(), getEvents(lang)]);
  const occasions = new Map(byDay(events).map((one) => [placeKey(one.id, one.onDay), one]));

  const today = new Date().toISOString().slice(0, 10);
  const places = mine
    .map((booking) => ({
      booking,
      occasion: occasions.get(placeKey(booking.eventId, booking.onDay ?? null)),
    }))
    .filter(
      (one): one is { booking: (typeof mine)[number]; occasion: Occasion } =>
        Boolean(one.occasion) && (one.occasion?.until || one.occasion?.date || "") >= today,
    )
    .sort((a, b) => a.occasion.date.localeCompare(b.occasion.date));

  /* A bookmark and a place are two different answers and belong in two lists:
     one says "I am coming", the other says "I have not decided". Putting them
     together under one heading is how somebody arrives at an evening they only
     ever thought about. */
  const coming = places.filter((one) => one.booking.state !== "interested");
  const kept = places.filter((one) => one.booking.state === "interested");

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">your profile</h1>
        <p className="page-intro">
          This is everything we keep about you, and nearly all of it is yours to change.
        </p>

        <ProfileForm
          userId={user.id}
          email={user.email ?? ""}
          name={profile?.name ?? ""}
          city={profile?.city ?? ""}
          country={profile?.country ?? ""}
          words={{
            name: say("you.yourName"),
            showMe: say("you.showMe"),
            saving: say("you.saving"),
            save: say("you.save"),
            town: say("you.theTown"),
            country: say("you.theCountry"),
            optional: say("you.optional"),
          }}
          listed={profile?.listed ?? true}
          photo={profile?.photo_path ?? null}
          memberNo={profile?.member_no ?? null}
          since={profile?.joined_on ? pretty(profile.joined_on) : ""}
        />

        {/* The way into the back of the house was here too. It is in the strip
            along the top of every page now, which is one place rather than two.
        */}

        {/* What you are coming to, and what you have kept an eye on.
        
            The app has had both of these on its account screen since it existed;
            the website has had a form and nothing else, so a member who signed up
            for four evenings on their phone came here and found no trace of any of
            it. Read-only, deliberately: changing your mind about an evening
            belongs on the evening's own page, where what you would be changing is
            in front of you. */}
        <Mine coming={coming} kept={kept} say={say} lang={lang} />

        <form action={signOut} className="auth-out">
          <button type="submit" className="text-button">
            sign out
          </button>
        </form>
      </div>
    </main>
  );
}

/** The two lists, drawn the same way the news page draws a dated thing. */
function Mine({
  coming,
  kept,
  say,
  lang,
}: {
  coming: { booking: { people: number; bringing: string; guests?: string[]; state: string }; occasion: Occasion }[];
  kept: { occasion: Occasion }[];
  say: Said;
  lang: Lang;
}) {
  if (coming.length === 0 && kept.length === 0) {
    return (
      <section className="auth-mine">
        <h2 className="story-label">{say("mine.yourEvenings")}</h2>
        <p className="empty">
          {say("mine.nothingBooked")}{" "}
          <Link href={at(lang, "/events")}>{say("mine.seeWhatsOn")}</Link>.
        </p>
      </section>
    );
  }

  return (
    <>
      {coming.length > 0 ? (
        <section className="auth-mine">
          <h2 className="story-label">{say("mine.youAreComingTo")}</h2>
          <ul className="dated-list">
            {coming.map(({ booking, occasion }) => (
              <li className="dated-item" key={placeKey(occasion.id, occasion.onDay)}>
                <Stamp when={occasion.date} lang={lang} />
                <div className="dated-words">
                  <h3 className="dated-name">
                    <Link href={at(lang, `/events/${occasion.slug}`)}>{occasion.title}</Link>
                  </h3>
                  <p className="dated-note">
                    {[
                      `${booking.people} ${say(booking.people === 1 ? "row.place" : "row.places")}`,
                      booking.guests?.length ? `${say("row.withGuests")} ${booking.guests.join(", ")}` : "",
                      booking.bringing,
                      booking.state === "kept" ? say("row.keptForYou") : "",
                      booking.state === "declined" ? say("row.notThisTime") : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {kept.length > 0 ? (
        <section className="auth-mine">
          <h2 className="story-label">{say("mine.onYourList")}</h2>
          <ul className="dated-list">
            {kept.map(({ occasion }) => (
              <li className="dated-item" key={placeKey(occasion.id, occasion.onDay)}>
                <Stamp when={occasion.date} lang={lang} />
                <div className="dated-words">
                  <h3 className="dated-name">
                    <Link href={at(lang, `/events/${occasion.slug}`)}>{occasion.title}</Link>
                  </h3>
                  <p className="dated-note">{[occasion.place, occasion.time].filter(Boolean).join(" · ")}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function Stamp({ when, lang }: { when: string; lang: Lang }) {
  if (!when) return null;
  const day = new Date(`${when}T00:00:00Z`);
  return (
    <span className="dated-when" aria-hidden="true">
      <b>{day.getUTCDate()}</b>
      <i>{day.toLocaleDateString(lang === "fr" ? "fr-CH" : "en-GB", { month: "short" })}</i>
    </span>
  );
}
