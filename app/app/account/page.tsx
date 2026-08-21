import Link from "next/link";
import Photo from "@/components/Photo";
import AppHeader from "@/components/app/AppHeader";
import Leaving from "@/components/app/Leaving";
import MemberCard from "@/components/app/MemberCard";
import { PhotoPreview, PostPreview } from "@/components/app/MyThings";
import { signOut } from "@/app/(site)/account/actions";
import { whenItIs } from "@/lib/app-data";
import { pretty } from "@/lib/admin/when";
import { myBookings, myPhotos, myPosts, requireMember } from "@/lib/app/me";
import { getEvents } from "@/lib/source";

export const metadata = { title: "Account" };

/* Yours, and nobody else's, so there is nothing here worth caching. */
export const dynamic = "force-dynamic";

/* Things this club has to say in writing, kept apart from the settings above
   them: they are not things you change, they are things you are entitled to
   read. */
const LEGAL = [
  { label: "help", href: "/support" },
  { label: "what we do with your data", href: "/privacy" },
  { label: "terms and conditions", href: "/terms" },
  { label: "imprint", href: "/imprint" },
];

const SHOWING = 2;

export default async function AccountPage() {
  const me = await requireMember("/app/account");
  const [mine, events, photos, posts] = await Promise.all([
    myBookings(),
    getEvents(),
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
      <AppHeader eyebrow="you" title="your membership" />

      <div className="account-top">
        <MemberCard
          name={me.name}
          number={me.memberNo}
          since={me.since ? pretty(me.since) : ""}
          country={me.country}
          photo={me.photoPath}
        />
      </div>

      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">you said yes to</h2>
          {yes.length > SHOWING ? (
            <Link className="app-more" href="/app/account/coming">
              all {yes.length} ›
            </Link>
          ) : (
            <span className="app-label">{yes.length}</span>
          )}
        </div>
        {yes.length === 0 ? (
          <p className="app-note">
            Nothing yet. <Link href="/app/events">Have a look at what is on</Link>.
          </p>
        ) : (
          <ul className="row-list">
            {yes.slice(0, SHOWING).map(({ booking, event }) => (
              <li key={booking.id}>
                <div className="row">
                  <span className="row-body">
                    <span className="row-title">{event?.title}</span>
                    <span className="row-meta">{event ? whenItIs(event) : ""}</span>
                    <span className="row-yes">
                      {booking.people} {booking.people === 1 ? "place" : "places"}
                      {booking.bringing ? ` · bringing ${booking.bringing}` : ""}
                      {booking.state === "kept" ? " · kept for you" : ""}
                      {booking.state === "declined" ? " · not this time" : ""}
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
          <span>your personal information</span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link className="wide-row" href="/app/account/signing-in">
          <span>ways to sign in</span>
          <span aria-hidden="true">›</span>
        </Link>
        <Link className="wide-row" href="/app/contact">
          <span>get in touch, or report a bug</span>
          <span aria-hidden="true">›</span>
        </Link>
      </section>

      {/* And the things we have to say in writing, which are not settings. */}
      <section className="app-section app-section-legal">
        <p className="app-label app-label-alone">in writing</p>
        {LEGAL.map((row) => (
          <Link key={row.label} className="wide-row" href={row.href}>
            <span>{row.label}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </section>

      <form action={signOut} className="app-section">
        <button type="submit" className="pill pill-wide">
          sign out
        </button>
      </form>

      <div className="app-section leaving-wrap">
        <Leaving />
      </div>
    </>
  );
}
