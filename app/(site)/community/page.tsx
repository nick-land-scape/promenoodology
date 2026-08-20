import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CommunityGrid from "@/components/CommunityGrid";
import { getMembers, getPageHead } from "@/lib/source";
import { pageIsVisible } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "Community",
  description: "The people of promeNOODology.",
  alternates: { canonical: "/community" },
};

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function CommunityPage() {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("community"))) notFound();

  const [members, head] = await Promise.all([getMembers(), getPageHead("community")]);

  return (
    <main className="page">
      {/* The heading is for a screen reader: the grid of names is the page. */}
      <h1 className="visually-hidden">{head.title || "Community"}</h1>
      {head.lead ? <p className="page-intro">{head.lead}</p> : null}
      <div style={{ "--name": `${head.settings.columnWidth}px` } as React.CSSProperties}>
        <CommunityGrid members={members} />
      </div>
    </main>
  );
}
