import AppHeader from "@/components/app/AppHeader";
import Feed from "@/components/app/Feed";
import { getPosts } from "@/lib/app-data";
import { getMembers } from "@/lib/data";

export const metadata = { title: "Connect" };

export default function ConnectPage() {
  const posts = getPosts();
  const people = getMembers().sort((a, b) => a.last.localeCompare(b.last));

  return (
    <>
      <AppHeader eyebrow="connect" title="what everyone is up to" />
      <Feed posts={posts} people={people} />
      <p className="app-foot">
        Placeholder screen — posts are examples and nothing is sent anywhere.
      </p>
    </>
  );
}
