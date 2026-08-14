import type { Metadata } from "next";
import CommunityGrid from "@/components/CommunityGrid";
import { getMembers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Community",
  description: "The people of promeNOODology.",
  alternates: { canonical: "/community" },
};

export default function CommunityPage() {
  const members = getMembers();

  return (
    <main className="page">
      <h1 className="visually-hidden">Community</h1>
      <CommunityGrid members={members} />
    </main>
  );
}
