import Head from "@/components/admin/Head";
import IdeaRows, { type IdeaLine } from "@/components/admin/IdeaRows";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

/**
 * What the club has been asked to do, and the club's answer.
 *
 * The same list members see in the app's middle tab, with the one thing they
 * cannot do: write the answer. Here rather than only on a phone because an answer
 * is a paragraph somebody thinks about — "we looked at the oven and it is four
 * thousand francs" is not a sentence anybody composes with a thumb.
 *
 * Ordered by agreement, which is what the votes are for.
 */
export default async function IdeasPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("ideas_counted")
    .select("id, by_person, words, made_at, state, answer, answered_by, votes")
    .order("votes", { ascending: false })
    .order("made_at", { ascending: false })
    .returns<
      {
        id: string;
        by_person: string;
        words: string;
        made_at: string;
        state: IdeaLine["state"];
        answer: string;
        answered_by: string | null;
        votes: number;
      }[]
    >();

  if (error) {
    return (
      <Head title="ideas">
        <p className="admin-error">
          Nothing to show yet: the ideas table is not in the database. Run
          supabase/migrations/0042_what_the_club_should_do.sql and this page starts working.
        </p>
      </Head>
    );
  }

  const rows = data ?? [];
  const { data: people } = await supabase
    .from("profiles")
    .select("id, name")
    .returns<{ id: string; name: string }[]>();
  const named = new Map((people ?? []).map((row) => [row.id, row.name || "somebody"]));

  const lines: IdeaLine[] = rows.map((row) => ({
    id: row.id,
    words: row.words,
    by: named.get(row.by_person) ?? "somebody",
    when: row.made_at,
    votes: Number(row.votes ?? 0),
    state: row.state,
    answer: row.answer,
    answeredBy: row.answered_by ? (named.get(row.answered_by) ?? "") : "",
  }));

  const waiting = lines.filter((line) => !line.answer);
  const answered = lines.filter((line) => line.answer);

  return (
    <Head title="ideas">
      <p className="admin-intro">
        What members have suggested, most agreed-with first. They can write one and agree with each
        other&rsquo;s; the answer is yours, and it is the only reply an idea gets. Saying
        <strong> not now</strong> is a real answer — a suggestion box where nothing is ever refused
        is one nobody believes.
      </p>

      {lines.length === 0 ? (
        <p className="admin-empty">Nothing suggested yet.</p>
      ) : null}

      {waiting.length > 0 ? (
        <>
          <p className="admin-group-label">no answer yet</p>
          <IdeaRows rows={waiting} />
        </>
      ) : null}

      {answered.length > 0 ? (
        <>
          <p className="admin-group-label" style={{ marginTop: 26 }}>
            answered
          </p>
          <IdeaRows rows={answered} />
        </>
      ) : null}
    </Head>
  );
}
