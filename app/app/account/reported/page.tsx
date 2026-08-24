import AppHeader from "@/components/app/AppHeader";
import Reported, { type Flagged } from "@/components/app/Reported";
import { requireAppAdmin } from "@/lib/app/admin";
import { readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";
import { speaking } from "@/lib/words";

export const metadata = { title: "Reported" };
export const dynamic = "force-dynamic";

/**
 * What has been reported, on a phone, for an admin.
 *
 * The website's /admin/reports is the same list on a desk, and this is the half
 * that happens away from one — which for this particular list is most of it. A
 * photograph gets reported on a Saturday evening while everybody who could do
 * anything about it is standing in a field, and "I will look at it on Monday" is
 * not an answer when the thing being reported is a photograph of somebody who did
 * not agree to be in it.
 *
 * So the pictures are here, at the size a phone can show them, and the same two
 * decisions are here: it is fine, or take it down. Same rows, same actions as the
 * website — two ways of settling one report is one way too many.
 */
export default async function ReportedPage() {
  await requireAppAdmin();
  const lang = await readingIn();
  const say = speaking(lang, await getFrench());

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("reports")
    .select("id, about_post, about_reply, by_person, because, said, made_at, settled_at")
    .is("settled_at", null)
    .order("made_at", { ascending: false })
    .limit(60)
    .returns<
      {
        id: string;
        about_post: string | null;
        about_reply: string | null;
        by_person: string | null;
        because: string;
        said: string;
        made_at: string;
        settled_at: string | null;
      }[]
    >();

  const reports = error ? [] : (data ?? []);

  const postIds = reports.map((one) => one.about_post).filter((one): one is string => Boolean(one));
  const replyIds = reports
    .map((one) => one.about_reply)
    .filter((one): one is string => Boolean(one));

  const [{ data: posts }, { data: replies }, { data: people }] = await Promise.all([
    postIds.length
      ? supabase
          .from("posts")
          .select("id, author_id, text, photo_paths, photo_path")
          .in("id", postIds)
          .returns<
            {
              id: string;
              author_id: string;
              text: string;
              photo_paths: string[] | null;
              photo_path: string | null;
            }[]
          >()
      : Promise.resolve({ data: [] as never[] }),
    replyIds.length
      ? supabase
          .from("post_replies")
          .select("id, author_id, text")
          .in("id", replyIds)
          .returns<{ id: string; author_id: string; text: string }[]>()
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("profiles").select("id, name").returns<{ id: string; name: string }[]>(),
  ]);

  const named = new Map((people ?? []).map((row) => [row.id, row.name || "somebody"]));
  const post = new Map((posts ?? []).map((row) => [row.id, row]));
  const reply = new Map((replies ?? []).map((row) => [row.id, row]));

  const rows: Flagged[] = reports.map((one) => {
    const about = one.about_post ? post.get(one.about_post) : null;
    const answer = one.about_reply ? reply.get(one.about_reply) : null;
    const paths = about
      ? about.photo_paths?.length
        ? about.photo_paths
        : about.photo_path
          ? [about.photo_path]
          : []
      : [];

    return {
      id: one.id,
      because: one.because,
      said: one.said,
      /* Null is the screening: the one reporter with no name. */
      by: one.by_person ? (named.get(one.by_person) ?? null) : null,
      whose: about
        ? (named.get(about.author_id) ?? "")
        : answer
          ? (named.get(answer.author_id) ?? "")
          : "",
      words: about?.text ?? answer?.text ?? "",
      photos: paths.map((path) => mediaUrl(path)),
      missing: Boolean((one.about_post && !about) || (one.about_reply && !answer)),
    };
  });

  return (
    <>
      <AppHeader
        eyebrow={say("flag.eyebrow")}
        title={say("flag.reported")}
        back="/app/account"
      />

      {error ? (
        <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
          {say("flag.notSetUp")}
        </p>
      ) : rows.length === 0 ? (
        <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
          {say("flag.nothingWaiting")}
        </p>
      ) : (
        <Reported
          rows={rows}
          words={{
            flaggedOnTheWayIn: say("flag.onTheWayIn"),
            reportedBy: say("flag.reportedBy"),
            writtenBy: say("flag.writtenBy"),
            gone: say("flag.gone"),
            itIsFine: say("flag.itIsFine"),
            takeItDown: say("flag.takeItDown"),
            reallyTakeItDown: say("flag.reallyTakeItDown"),
            neverMind: say("report.neverMind"),
            didNotWork: say("row.didNotWork"),
          }}
        />
      )}
    </>
  );
}
