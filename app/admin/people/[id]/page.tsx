import { notFound } from "next/navigation";
import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import PeopleList, { type Person } from "../PeopleList";

/**
 * One person, on their own page.
 *
 * The editor is the same component the whole list used to be, handed one row and
 * told it is alone — which is deliberate. It knows how to save a person, how to
 * upload a portrait, how to send an invitation and how to refuse to take the last
 * admin's keys away; a second form doing four fifths of that would be a second
 * form to keep in step.
 */
export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireAdmin();
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data: row } = await supabase
    .from("profiles")
    .select(
      "id, user_id, email, name, country, role, listed, listed_by_admin, photo_path, colour, joined_on, member_no, city, does, skills, languages, birthday, cannot_eat, phone",
    )
    .eq("id", id)
    .maybeSingle<{
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
      member_no: number | null;
      city: string;
      does: string;
      skills: string[] | null;
      languages: string[] | null;
      birthday: string | null;
      cannot_eat: string;
      phone: string;
    }>();

  if (!row) notFound();

  const person: Person = {
    id: row.id,
    email: row.email ?? "",
    hasAccount: row.user_id !== null,
    name: row.name ?? "",
    country: row.country ?? "",
    city: row.city ?? "",
    does: row.does ?? "",
    skills: row.skills ?? [],
    languages: row.languages ?? [],
    /* Day and month. The column is a date in a year nobody reads, so the year is
       thrown away here rather than shown to somebody who might believe it. */
    birthday: row.birthday
      ? `${Number(row.birthday.slice(8, 10))}.${Number(row.birthday.slice(5, 7))}`
      : "",
    cannotEat: row.cannot_eat ?? "",
    phone: row.phone ?? "",
    role: row.role,
    listed: row.listed,
    listedByAdmin: row.listed_by_admin,
    colour: row.colour,
    photo: row.photo_path,
    photoUrl: row.photo_path ? mediaUrl(row.photo_path) : null,
    joined: row.joined_on,
    number: row.member_no,
    isMe: row.id === me.id,
  };

  return (
    <Head title={row.name || "somebody"} back={{ href: "/admin/people", label: "people" }}>
      <PeopleList initial={[person]} alone />
    </Head>
  );
}
