import Head from "@/components/admin/Head";
import InHead from "@/components/admin/InHead";
import PeopleRows, { type PersonRow } from "@/components/admin/PeopleRows";
import NewPerson from "./NewPerson";
import { requireAdmin } from "@/lib/admin/guard";
import { hay } from "@/lib/admin/find";
import { pretty } from "@/lib/admin/when";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";


export default async function PeoplePage() {
  const me = await requireAdmin();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("profiles")
    .select(
      "id, user_id, email, name, country, role, listed, listed_by_admin, photo_path, colour, joined_on, member_no, city, does, skills, languages, birthday, cannot_eat, phone",
    )
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
        member_no: number | null;
        city: string;
        does: string;
        skills: string[] | null;
        languages: string[] | null;
        birthday: string | null;
        cannot_eat: string;
        phone: string;
      }[]
    >();

  /* One row per person, and only what a list is for.
   *
   * This page used to hand every field of every person to the browser and open a
   * form for each of them: sixty-six forms, sixty-six portraits, one save button
   * for all of it. A list says who somebody is and what state they are in; the
   * rest is on their own page, which is how the evenings and the notes have always
   * worked. */
  const people: PersonRow[] = (data ?? []).map((row) => {
    const marks: string[] = [];
    // The three an admin is actually scanning for.
    if (row.role === "admin") marks.push("admin");
    if (!(row.listed_by_admin ?? row.listed)) marks.push("not on the page");
    if (!row.user_id) marks.push(row.email ? "invited" : "no way in");

    return {
      id: row.id,
      name: row.name ?? "",
      meta: [
        row.member_no ? `no ${String(row.member_no).padStart(4, "0")}` : "not numbered",
        [row.city, row.country].filter(Boolean).join(", "),
        row.joined_on ? `since ${pretty(row.joined_on)}` : null,
        row.does || null,
      ]
        .filter(Boolean)
        .join(" · "),
      hay: hay(
        row.name,
        row.country,
        row.city,
        row.does,
        row.email,
        (row.skills ?? []).join(" "),
        (row.languages ?? []).join(" "),
        row.member_no ? String(row.member_no) : "",
        row.role,
      ),
      photo: row.photo_path ? mediaUrl(row.photo_path) : null,
      initials: initialsOf(row.name ?? ""),
      marks,
      sortName: (row.name ?? "").toLocaleLowerCase(),
      joinedOn: row.joined_on ?? "",
      /* Unnumbered people sort last rather than first: a missing number is not
         number zero, and putting them at the top of "by number" would say the
         newest arrivals have been here longest. */
      memberNo: row.member_no ?? Number.MAX_SAFE_INTEGER,
    };
  });

  return (
    <Head title="people">
      <p className="admin-intro">
        Everybody — the community page and the list of accounts are one list. Most of them have never
        signed in to anything, and do not need to: being on the wall was never meant to require a
        login. Press a name to edit them.
      </p>
      <p className="admin-note">
        Their number is theirs for good, and it is not their place in this list: order the list by
        number and it becomes a history of who has been here longest, which is the point of them.
      </p>
      <p className="admin-note">
        Somebody written down here is on the community page. Somebody invited is also sent a way in —
        and when they use it, their account joins the person already here rather than making a second
        one. There is no public way to join any more: an account starts with an invitation from this
        page.
      </p>
      <InHead>
        <NewPerson />
      </InHead>

      <PeopleRows people={people} />
    </Head>
  );
}

/** A name as two letters, for somebody with no portrait. */
function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}
