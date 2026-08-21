import Head from "@/components/admin/Head";
import { Empty, Tag } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/guard";
import { pretty } from "@/lib/admin/when";
import { supabaseServer } from "@/lib/supabase/server";
import Notes from "./Notes";

export const dynamic = "force-dynamic";

/**
 * What people said from inside the app.
 *
 * Three kinds, and they are read differently: a bug is a job, an idea is a
 * decision, and a word is a person. A bug arrives with the screen it happened on
 * and the browser it happened in, because "it does not work on my phone" is only
 * useful when we know which phone.
 */
export default async function FeedbackPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("feedback")
    .select("id, kind, text, about, agent, state, created_at, profiles(name)")
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<
      {
        id: string;
        kind: "bug" | "idea" | "note";
        text: string;
        about: string;
        agent: string;
        state: "new" | "seen" | "done";
        created_at: string;
        profiles: { name: string } | null;
      }[]
    >();

  const notes = (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    text: row.text,
    about: row.about,
    agent: row.agent,
    state: row.state,
    when: pretty(row.created_at),
    who: row.profiles?.name || "somebody",
  }));

  return (
    <Head title="what people said">
      <p className="admin-intro">
        Everything sent from inside the app: a bug, an idea, or a word. A bug comes with the screen
        it happened on and the browser it happened in.
      </p>
      {notes.length === 0 ? (
        <Empty>Nothing yet. The way in is the app, under your account.</Empty>
      ) : (
        <Notes initial={notes} />
      )}
    </Head>
  );
}
