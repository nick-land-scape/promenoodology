import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CommunityGrid from "@/components/CommunityGrid";
import { getMembers } from "@/lib/source";
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

  const members = await getMembers();

  return (
    <main className="page">
      <h1 className="visually-hidden">Community</h1>
      <CommunityGrid members={members} />
    </main>
  );
}
