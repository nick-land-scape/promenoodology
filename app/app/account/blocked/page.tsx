import AppHeader from "@/components/app/AppHeader";
import Blocked, { type Blocked as Person } from "@/components/app/Blocked";
import { readingIn, requireMember } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import { speaking } from "@/lib/words";

export const metadata = { title: "People you have blocked" };
export const dynamic = "force-dynamic";

/**
 * Who you have blocked, and the way back.
 *
 * A block that cannot be found again is a block somebody has to leave the club to
 * undo — and it is the one decision in this app made while annoyed, which is
 * exactly the kind that gets reconsidered. So it is a list with an undo beside
 * each name, and nothing else on the screen.
 *
 * Only ever your own: the policy on the table returns nobody else's rows, because
 * "has this person blocked me" is the question a block exists to stop being
 * asked. Which also means this screen cannot be written any other way.
 */
export default async function BlockedPage() {
  await requireMember("/app/account/blocked");
  const lang = await readingIn();
  const say = speaking(lang, await getFrench());

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("blocks")
    .select("them, made_at")
    .order("made_at", { ascending: false })
    .returns<{ them: string; made_at: string }[]>();

  const blocks = error ? [] : (data ?? []);

  const { data: people } = blocks.length
    ? await supabase
        .from("profiles")
        .select("id, name, photo_path")
        .in(
          "id",
          blocks.map((one) => one.them),
        )
        .returns<{ id: string; name: string; photo_path: string | null }[]>()
    : { data: [] as { id: string; name: string; photo_path: string | null }[] };

  const named = new Map((people ?? []).map((row) => [row.id, row]));

  const rows: Person[] = blocks.map((one) => {
    const person = named.get(one.them);
    return {
      id: one.them,
      name: person?.name || say("flag.somebody"),
      photo: person?.photo_path ? mediaUrl(person.photo_path) : null,
    };
  });

  return (
    <>
      <AppHeader
        eyebrow={say("acc.eyebrow")}
        title={say("block.whoYouBlocked")}
        back="/app/account"
      />

      <p className="app-note" style={{ padding: "14px var(--gutter) 0" }}>
        {say("block.what")}
      </p>

      {rows.length === 0 ? (
        <p className="app-note" style={{ padding: "14px var(--gutter)" }}>
          {say("block.nobody")}
        </p>
      ) : (
        <Blocked rows={rows} words={{ undo: say("block.undo"), didNotWork: say("row.didNotWork") }} />
      )}

    </>
  );
}
