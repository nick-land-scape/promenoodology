import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import PeopleList, { type Person } from "./PeopleList";

export default async function PeoplePage() {
  const me = await requireAdmin();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("profiles")
    .select("id, name, country, role, listed, photo_path, colour, joined_on")
    .order("joined_on")
    .returns<
      {
        id: string;
        name: string;
        country: string;
        role: "member" | "admin";
        listed: boolean;
        photo_path: string | null;
        colour: string | null;
        joined_on: string;
      }[]
    >();

  const people: Person[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name ?? "",
    country: row.country ?? "",
    role: row.role,
    listed: row.listed,
    colour: row.colour,
    photo: row.photo_path,
    photoUrl: row.photo_path ? mediaUrl(row.photo_path) : null,
    joined: row.joined_on,
    isMe: row.id === me.id,
  }));

  return (
    <Head title="people" view="/community">
      <p className="admin-intro">
        Everybody with an account, oldest first. Most of this they can change themselves; a portrait
        and who else may look after the site are the two things they cannot.
      </p>
      <p className="admin-note">
        People appear here when they sign in for the first time. Until then the community page reads
        <code> data/community.csv</code>, so nobody who was on the old list disappears in the
        meantime — but they cannot be edited from here either.
      </p>
      <PeopleList initial={people} />
    </Head>
  );
}
