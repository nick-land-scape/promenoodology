import AppHeader from "@/components/app/AppHeader";
import Feed from "@/components/app/Feed";
import { requireMember } from "@/lib/app/me";
import { getMembers, getPosts } from "@/lib/source";

export const metadata = { title: "Connect" };

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function ConnectPage() {
  await requireMember("/app/connect");
  const posts = await getPosts();
  const people = (await getMembers()).sort((a, b) => a.last.localeCompare(b.last));

  return (
    <>
      <AppHeader eyebrow="connect" title="what everyone is up to" />
      <Feed posts={posts} people={people} />
    </>
  );
}
