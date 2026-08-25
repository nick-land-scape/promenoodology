import AppHeader from "@/components/app/AppHeader";
import Feed from "@/components/app/Feed";
import { whatWeShouldDo } from "@/lib/app/ideas";
import { readingIn, requireMember } from "@/lib/app/me";
import { getFrench, getPosts } from "@/lib/source";
import { speaking } from "@/lib/words";
import { sharedMembers } from "@/lib/shared";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Connect" };

/* Who is reading decides what is on this screen — what is theirs to take down,
   and their own name in the composer. */
export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const me = await requireMember("/app/connect");
  const say = speaking(await readingIn(), await getFrench());
  const [posts, everybody, ideas] = await Promise.all([
    getPosts(),
    sharedMembers(),
    whatWeShouldDo(),
  ]);
  const people = everybody.sort((a, b) => a.last.localeCompare(b.last));

  /* Who can actually be waved at, and who you have waved at already. The
     community page keeps names; a wave needs the person behind one. */
  const supabase = await supabaseServer();
  const [{ data: rows }, { data: sent }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name")
      .not("user_id", "is", null)
      .returns<{ id: string; name: string }[]>(),
    supabase
      .from("waves")
      .select("to_profile, from_profile")
      .returns<{ to_profile: string; from_profile: string }[]>(),
  ]);

  return (
    <>
      <AppHeader eyebrow={say("con.eyebrow")} title={say("con.whatEveryone")} />
      <Feed
        posts={posts}
        people={people}
        meId={me.id}
        meName={me.name}
        mePhoto={me.photoPath ? mediaUrl(me.photoPath) : null}
        wavable={rows ?? []}
        waved={(sent ?? []).filter((one) => one.from_profile === me.id).map((one) => one.to_profile)}
        ideas={ideas}
        admin={Boolean(me.admin)}
      />
    </>
  );
}
