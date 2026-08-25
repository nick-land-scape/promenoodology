import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { Idea } from "@/app/app/actions";

/**
 * What the club has been asked to do, in the order the club agrees with it.
 *
 * Read from the view rather than the table (migration 0042): the count and
 * whether you are one of them come back with each row, which is one read instead
 * of one for the ideas and another for every vote in the club followed by the
 * arithmetic.
 *
 * Sorted by agreement and then by age. A suggestion box sorted by date is a list
 * where the best idea anybody has had sinks below whatever was written this
 * morning — and the one thing the votes are for is deciding the order.
 */
export async function whatWeShouldDo(): Promise<Idea[]> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("ideas_counted")
    .select("id, by_person, words, made_at, edited_at, state, answer, answered_by, votes, agreed")
    .order("votes", { ascending: false })
    .order("made_at", { ascending: false })
    .limit(120)
    .returns<
      {
        id: string;
        by_person: string;
        words: string;
        made_at: string;
        edited_at: string | null;
        state: Idea["state"];
        answer: string;
        answered_by: string | null;
        votes: number;
        agreed: boolean;
      }[]
    >();

  /* The view arrives with migration 0042. Before that this is simply an empty
     tab rather than a screen that will not load. */
  if (error) return [];

  const rows = data ?? [];
  const who = [
    ...new Set([
      ...rows.map((row) => row.by_person),
      ...rows.map((row) => row.answered_by).filter((one): one is string => Boolean(one)),
    ]),
  ];

  const { data: people } = who.length
    ? await supabase
        .from("profiles")
        .select("id, name, photo_path")
        .in("id", who)
        .returns<{ id: string; name: string; photo_path: string | null }[]>()
    : { data: [] as { id: string; name: string; photo_path: string | null }[] };

  const named = new Map((people ?? []).map((row) => [row.id, row]));
  const { mediaUrl } = await import("@/lib/supabase/config");

  return rows.map((row) => ({
    id: row.id,
    words: row.words,
    by: named.get(row.by_person)?.name || "somebody",
    byId: row.by_person,
    photo: named.get(row.by_person)?.photo_path
      ? mediaUrl(named.get(row.by_person)!.photo_path as string)
      : null,
    when: row.made_at,
    edited: row.edited_at ?? "",
    votes: Number(row.votes ?? 0),
    agreed: Boolean(row.agreed),
    state: row.state,
    answer: row.answer,
    answeredBy: row.answered_by ? (named.get(row.answered_by)?.name ?? "") : "",
  }));
}
