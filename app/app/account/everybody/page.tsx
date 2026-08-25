import AppHeader from "@/components/app/AppHeader";
import Everybody, { type Somebody } from "@/components/app/Everybody";
import { requireAppAdmin } from "@/lib/app/admin";
import { readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { supabaseServer } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/supabase/config";
import { speaking } from "@/lib/words";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export const metadata = { title: "Everybody" };

/* Sixty-odd rows about people, read as whoever is asking: the policies decide
   what comes back, so there is nothing here to cache for anybody else. */
/**
 * Everybody in the club, on a phone, for an admin.
 *
 * The website's /admin does all of this and more, on a desk. What is here is the
 * half that happens away from one: somebody asks to be let in at a table on a
 * Sunday, somebody's name is spelled wrong on the community page, somebody has to
 * be given the keys because the person with them is on a train.
 *
 * It reads the same table and calls the same actions the website's people screen
 * calls — including the rule that nobody may lock the last door behind them —
 * because two ways of editing one list is one way too many.
 */
export default async function EverybodyPage() {
  await requireAppAdmin();
  const lang = await readingIn();
  const say = speaking(lang, await getFrench());

  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, name, country, city, does, skills, languages, cannot_eat, phone, colour, listed, listed_by_admin, role, joined_on, email, user_id, photo_path, member_no",
    )
    /* No `deleted_at` here, and that is not an omission: there is no way to delete
       a person. A person is what posts and bookings hang off, so taking one off
       the community page is the honest version of it — and reversible. */
    .order("name")
    .returns<Somebody[]>();

  const people = (data ?? []).map((one) => ({
    ...one,
    photo: one.photo_path ? mediaUrl(one.photo_path) : null,
  }));

  return (
    <>
      <AppHeader
        eyebrow={say("acc.eyebrow")}
        title={say("who.everybody")}
        back="/app/account"
      />
      <Everybody people={people} />
    </>
  );
}
