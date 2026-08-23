import Link from "next/link";
import Photo from "@/components/Photo";
import AboutYou from "@/components/app/AboutYou";
import AppHeader from "@/components/app/AppHeader";
import Leaving from "@/components/app/Leaving";
import MemberCard from "@/components/app/MemberCard";
import { PhotoPreview, PostPreview } from "@/components/app/MyThings";
import { signOut } from "@/lib/site-actions/account";
import { whenItIs } from "@/lib/app-data";
import { pretty } from "@/lib/admin/when";
import { myBookings, myPhotos, myPosts, readingIn, requireMember } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { sharedEvents } from "@/lib/shared";

export const metadata = { title: "Account" };

/* Yours, and nobody else's, so there is nothing here worth caching. */
export const dynamic = "force-dynamic";

/* Things this club has to say in writing, kept apart from the settings above
   them: they are not things you change, they are things you are entitled to
   read. */
/* Inside the app, not on the website.
 *
 * The words are the same words — one file, read by both — but opening the
 * website's copy from in here dropped a member into the website: its menu, its
 * footer, and four ways to wander off into pages that are already in the app under
 * Read. An app that leaks into a website is an app somebody leaves. */
const LEGAL = [
  { key: "acc.help", href: "/app/legal/support" },
  { key: "acc.privacy", href: "/app/legal/privacy" },
  { key: "acc.terms", href: "/app/legal/terms" },
  { key: "acc.imprint", href: "/app/legal/imprint" },
];

const SHOWING = 2;

export default async function AccountPage() {
  const me = await requireMember("/app/account");
  const lang = await readingIn();
  const say = speaking(lang, await getFrench());
  const [mine, events, photos, posts] = await Promise.all([
    myBookings(),
    sharedEvents(lang),
    myPhotos(),
    myPosts(),
  ]);

  const byId = new Map(events.map((event) => [event.id, event]));
  /* Only the promises. A bookmark is on your list, not on your word — and
     counting the two together made "you said yes to 6" out of one yes and five
     maybes. */
  const yes = mine
    .filter((booking) => booking.state !== "interested")
    .map((booking) => ({ booking, event: byId.get(booking.eventId) }))
    .filter((pair) => Boolean(pair.event))
    .sort((a, b) => (a.event?.date ?? "").localeCompare(b.event?.date ?? ""));

  return (
    <>
      {/* The header stays, and it does not say your name: the card underneath it
          says that, in bigger type, three lines lower. What the header is for is
          telling you which of the four screens you are on. */}
      <AppHeader eyebrow={say("acc.eyebrow")} title={say("acc.yourMembership")} />

      <div className="account-top">
        <MemberCard
          name={me.name}
          number={me.memberNo}
          since={me.since ? pretty(me.since) : ""}
          country={me.country}
          photo={me.photoPath}
        />
        {/* Beside the card on a tablet, and nowhere at all on a phone — where the
            card is the width of the screen and everything here is one tap away
            under "your personal information". */}
        <AboutYou me={me} />
      </div>

      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">{say("acc.youSaidYesTo")}</h2>
          {yes.length > SHOWING ? (
            <Link className="app-more" href="/app/account/coming">
              {say("home.allOfThem").replace("{n}", String(yes.length))}
            </Link>
          ) : (
            <span className="app-label">{yes.length}</span>
          )}
        </div>
        {yes.length === 0 ? (
          <p className="app-note">
            {say("acc.nothingYet")}{" "}
            <Link href="/app/events">{say("acc.haveALook")}</Link>.
          </p>
        ) : (
          <ul className="row-list">
            {yes.slice(0, SHOWING).map(({ booking, event }) => (
              <li key={booking.id}>
                <div className="row">
                  {/* The whole row opens the evening, as everywhere else. */}
                  {event ? (
                    <Link
                      className="row-reach"
                      href={`/app/events/${event.id}`}
                      aria-label={event.title}
                      tabIndex={-1}
                    />
                  ) : null}
                  <span className="row-body">
                    <span className="row-title">{event?.title}</span>
                    <span className="row-meta">
                      {event ? whenItIs(event) : ""}
                    </span>
                    <span className="row-yes">
                      {booking.people}{" "}
                      {say(booking.people === 1 ? "row.place" : "row.places")}
                      {booking.bringing
                        ? ` · ${say("acc.bringing")} ${booking.bringing}`
                        : ""}
                      {booking.state === "kept" ? ` · ${say("row.keptForYou")}` : ""}
                      {booking.state === "declined" ? ` · ${say("row.notThisTime")}` : ""}
                    </span>
                  </span>
                  {event?.photo ? (
                    <span className="row-thumb">
                      <Photo src={event.photo.src} alt="" fill sizes="58px" />
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PhotoPreview photos={photos} />
      <PostPreview posts={posts} />

      {/* The two screens that are about you. */}
      <section className="app-section">
        <Link className="wide-row" href="/app/account/details">
          <span>{say("acc.personalInformation")}</span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link className="wide-row" href="/app/account/signing-in">
          <span>{say("acc.waysToSignIn")}</span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link className="wide-row" href="/app/contact">
          <span>{say("acc.getInTouch")}</span>
          <span aria-hidden="true">›</span>
        </Link>
      </section>

      {/* And the things we have to say in writing, which are not settings. */}
      <section className="app-section app-section-legal">
        <p className="app-label app-label-alone">{say("acc.inWriting")}</p>
        {LEGAL.map((row) => (
          <Link key={row.key} className="wide-row" href={row.href}>
            <span>{say(row.key)}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </section>

      <form action={signOut} className="app-section">
        <button type="submit" className="pill pill-wide">
          {say("acc.signOut")}
        </button>
      </form>

      <div className="app-section leaving-wrap">
        <Leaving />
      </div>
    </>
  );
}
