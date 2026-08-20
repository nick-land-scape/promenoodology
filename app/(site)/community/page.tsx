import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CommunityGrid from "@/components/CommunityGrid";
import Photo from "@/components/Photo";
import type { Partner } from "@/lib/source";
import { getMembers, getPageHead, getPartners } from "@/lib/source";
import { pageIsVisible } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "Community",
  description: "The people of promeNOODology.",
  alternates: { canonical: "/community" },
};

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

/** A logo where there is one, the name where there is not. */
function Logo({ partner }: { partner: Partner }) {
  if (!partner.logo) return <span className="partners-name">{partner.name}</span>;
  return (
    <Photo
      src={partner.logo.src}
      alt={partner.name}
      width={partner.logo.width}
      height={partner.logo.height}
      sizes="160px"
    />
  );
}

export default async function CommunityPage() {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("community"))) notFound();

  const [members, head, partners] = await Promise.all([
    getMembers(),
    getPageHead("community"),
    getPartners(),
  ]);

  return (
    <main className="page">
      {/* The heading is for a screen reader: the grid of names is the page. */}
      <h1 className="visually-hidden">{head.title || "Community"}</h1>
      {head.lead ? <p className="page-intro">{head.lead}</p> : null}
      <div style={{ "--columns": String(head.settings.columns) } as React.CSSProperties}>
        <CommunityGrid members={members} />
      </div>

      {/* The partners, under the names. Provisional: they are here because they
          belong on this page, and quite how they should sit is still being
          decided — a row of logos says the least and assumes the least. */}
      {partners.length > 0 ? (
        <section className="partners">
          <h2 className="partners-label">with</h2>
          <ul className="partners-row">
            {partners.map((partner) => (
              <li key={partner.id}>
                {partner.url ? (
                  <a href={partner.url} target="_blank" rel="noopener noreferrer">
                    <Logo partner={partner} />
                  </a>
                ) : (
                  <Logo partner={partner} />
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
