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
    .select("id, user_id, email, name, country, role, listed, listed_by_admin, photo_path, colour, joined_on")
    .order("name")
    .returns<
      {
        id: string;
        user_id: string | null;
        email: string | null;
        name: string;
        country: string;
        role: "member" | "admin";
        listed: boolean;
        listed_by_admin: boolean | null;
        photo_path: string | null;
        colour: string | null;
        joined_on: string;
      }[]
    >();

  const people: Person[] = (data ?? []).map((row) => ({
    id: row.id,
    email: row.email ?? "",
    hasAccount: row.user_id !== null,
    name: row.name ?? "",
    country: row.country ?? "",
    role: row.role,
    listed: row.listed,
    listedByAdmin: row.listed_by_admin,
    colour: row.colour,
    photo: row.photo_path,
    photoUrl: row.photo_path ? mediaUrl(row.photo_path) : null,
    joined: row.joined_on,
    isMe: row.id === me.id,
  }));

  return (
    <Head title="people">
      <p className="admin-intro">
        Everybody, in alphabetical order — the community page and the list of accounts are one list.
        Most of them have never signed in to anything, and do not need to: being on the wall was
        never meant to require a login.
      </p>
      <p className="admin-note">
        Somebody written down here is on the community page. Somebody invited is also sent a way in —
        and when they use it, their account joins the person already here rather than making a second
        one. There is no public way to join any more: an account starts with an invitation from this
        page.
      </p>
      <PeopleList initial={people} />
    </Head>
  );
}
