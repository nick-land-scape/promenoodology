import Photo from "@/components/Photo";
import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import { dateParts } from "@/lib/app-data";
import { getEvents } from "@/lib/source";

export const metadata = { title: "Account" };

const SHORTCUTS = [
  { label: "member card", icon: "▤" },
  { label: "invite", icon: "＋" },
  { label: "saved", icon: "☆" },
  { label: "settings", icon: "⚙" },
];

const ROWS = [
  { label: "propose a new member", href: "mailto:info@promeNOODology.com" },
  { label: "what we do with your data", href: "/about" },
  { label: "leave the club", href: "mailto:info@promeNOODology.com" },
];

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function AccountPage() {
  // The first two events stand in for "things you said yes to".
  const booked = (await getEvents())
    .slice(0, 2)
    .map((event) => ({ ...event, ...dateParts(event.date) }));

  return (
    <>
      <AppHeader eyebrow="your account" title="Nick Ulrich" />

      <section className="app-section">
        <div className="member-card">
          <p className="member-name">Nick Ulrich</p>
          <p className="member-since">member since 2024 · Zürich</p>
          <p className="member-number">NO 0028</p>
        </div>
      </section>

      <ul className="shortcuts">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.label}>
            <button type="button" className="shortcut">
              <span className="shortcut-ring" aria-hidden="true">
                {shortcut.icon}
              </span>
              <span>{shortcut.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">you said yes to</h2>
        </div>
        <ul className="row-list">
          {booked.map((event) => (
            <li key={event.id}>
              <div className="row">
                <span className="row-date">
                  <span className="row-day">{event.day}</span>
                  <span className="row-month">{event.month}</span>
                </span>
                <span className="row-body">
                  <span className="row-title">{event.title}</span>
                  <span className="row-meta">
                    {event.time} · {event.place}
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
      </section>

      <section className="app-section">
        {ROWS.map((row) => (
          <Link key={row.label} className="wide-row" href={row.href}>
            <span>{row.label}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </section>

      <p className="app-foot">
        A preview — nothing is booked or posted yet. <Link href="/">Back to the website</Link>.
      </p>
    </>
  );
}
