import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Photo from "@/components/Photo";
import { getDonations, getPageHead } from "@/lib/source";
import { pageIsVisible } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "Public bank account",
  description:
    "Everyone who has put something in, one by one. Some with their name, some without.",
  alternates: { canonical: "/donations" },
  // Not listed in the menu or the sitemap yet, so it should not be indexed
  // either. Remove this line when the page goes public.
  robots: { index: false, follow: false },
};

/* On purpose there is no total anywhere on this page. What matters is who
   turned up, not how much was raised. */

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function DonationsPage() {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("donations"))) notFound();

  const [donations, head] = await Promise.all([getDonations(), getPageHead("donations")]);

  return (
    <main className="page">
      <h1 className="page-title">{head.title || "public bank account"}</h1>
      {head.saved ? (
        head.lead ? <p className="page-intro">{head.lead}</p> : null
      ) : (
        <p className="page-intro">
          Everything that comes in, one by one, newest first. Some people put their name to it and
          some would rather not — both are here. We do not show a total: this is not a thermometer,
          it is a list of people who made something possible.
        </p>
      )}

      <p className="page-note">
        Soon this will fill up by itself as gifts come in. Until then it is kept by hand.
      </p>

      <ul className="wall">
        {donations.map((donation) => {
          const anonymous = donation.who === "";
          return (
            <li key={donation.id} className={anonymous ? "brick brick-quiet" : "brick"}>
              <span className="brick-face">
                {donation.photo ? (
                  <Photo src={donation.photo.src} alt="" fill sizes="72px" />
                ) : (
                  <span className="brick-anon" aria-hidden="true">
                    ?
                  </span>
                )}
              </span>
              <span className="brick-who">{anonymous ? "someone" : donation.who}</span>
              <span className="brick-amount">{donation.amount}</span>
              <span className="brick-when">{pretty(donation.when)}</span>
              {donation.note ? <span className="brick-note">“{donation.note}”</span> : null}
            </li>
          );
        })}
      </ul>

      <section className="page-outro">
        <h2 className="app-h2" style={{ font: "inherit", fontSize: "1.3rem", margin: "0 0 8px" }}>
          Putting something in
        </h2>
        <p>
          Nothing here costs money to attend, and it stays that way. Gifts pay for pots, train
          tickets for people who could not otherwise come, and materials we cannot find in a skip.
        </p>
        <p>
          Write to <a href="mailto:info@promeNOODology.com">info@promeNOODology.com</a> and say
          whether you would like your name here or not. If you would rather give time than money,
          the <Link href="/handbook">handbook</Link> is the other way in.
        </p>
      </section>
    </main>
  );
}

/** 12 August 2026 */
function pretty(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
