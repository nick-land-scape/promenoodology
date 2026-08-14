import type { Metadata } from "next";
import CommunityGrid from "@/components/CommunityGrid";
import { getMembers } from "@/lib/source";

export const metadata: Metadata = {
  title: "Community",
  description: "The people of promeNOODology.",
  alternates: { canonical: "/community" },
};

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function CommunityPage() {
  const members = await getMembers();

  return (
    <main className="page">
      <h1 className="visually-hidden">Community</h1>
      <CommunityGrid members={members} />
    </main>
  );
}
