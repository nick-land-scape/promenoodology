import Link from "next/link";
import Photo from "@/components/Photo";
import AppHeader from "@/components/app/AppHeader";
import MySettings from "@/components/app/MySettings";
import { whenItIs } from "@/lib/app-data";
import { pretty } from "@/lib/admin/when";
import { myBookings, requireMember } from "@/lib/app/me";
import { getEvents } from "@/lib/source";

export const metadata = { title: "Account" };

/* Yours, and nobody else's, so there is nothing here worth caching. */
export const dynamic = "force-dynamic";

const ROWS = [
  { label: "propose a new member", href: "mailto:info@promeNOODology.com" },
  { label: "what we do with your data", href: "/about" },
  { label: "leave the club", href: "mailto:info@promeNOODology.com" },
];

export default async function AccountPage() {
  const me = await requireMember("/app/account");
  const [mine, events] = await Promise.all([myBookings(), getEvents()]);

  const byId = new Map(events.map((event) => [event.id, event]));
  /* What you actually said yes to, newest first — it used to be "the first two
     events stand in for things you said yes to", which is a drawing of an app. */
  const yes = mine
    .map((booking) => ({ booking, event: byId.get(booking.eventId) }))
    .filter((pair): pair is { booking: (typeof mine)[number]; event: NonNullable<typeof pair.event> } =>
      Boolean(pair.event),
    )
    .sort((a, b) => a.event.date.localeCompare(b.event.date));

  return (
    <>
      <AppHeader
        eyebrow="your account"
        title={me.name || "your account"}
        aside={me.admin ? <Link href="/admin">look after the site ↗</Link> : null}
      />

      <section className="app-section">
        <div className="member-card">
          <p className="member-name">{me.name || "no name yet"}</p>
          <p className="member-since">
            {[
              me.since ? `member since ${pretty(me.since)}` : null,
              me.country || null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="member-number">
            {me.memberNo ? `NO ${String(me.memberNo).padStart(4, "0")}` : "not numbered yet"}
          </p>
        </div>
      </section>

      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">you said yes to</h2>
          <span className="app-label">{yes.length}</span>
        </div>
        {yes.length === 0 ? (
          <p className="app-note">
            Nothing yet. <Link href="/app/book">Have a look at what is on</Link>.
          </p>
        ) : (
          <ul className="row-list">
            {yes.map(({ booking, event }) => (
              <li key={booking.id}>
                <div className="row">
                  <span className="row-body">
                    <span className="row-title">{event.title}</span>
                    <span className="row-meta">{whenItIs(event)}</span>
                    <span className="row-yes">
                      {booking.people} {booking.people === 1 ? "place" : "places"}
                      {booking.bringing ? ` · bringing ${booking.bringing}` : ""}
                      {booking.state === "kept" ? " · kept for you" : ""}
                      {booking.state === "declined" ? " · not this time" : ""}
                    </span>
                  </span>
                  {event.photo ? (
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

      <MySettings
        userId={me.userId}
        name={me.name}
        country={me.country}
        email={me.email}
        photo={me.photoPath}
        listed={me.listed}
      />

      <section className="app-section">
        {ROWS.map((row) => (
          <Link key={row.label} className="wide-row" href={row.href}>
            <span>{row.label}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </section>

      <p className="app-foot">
        <Link href="/">Back to the website</Link>.
      </p>
    </>
  );
}
