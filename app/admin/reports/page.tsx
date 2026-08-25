import Head from "@/components/admin/Head";
import ReportRows, { type ReportRow } from "@/components/admin/ReportRows";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

/**
 * What has been reported, and what the screening was unsure about.
 *
 * Two kinds of row in one list, deliberately. A member pressing "report" and the
 * screening flagging a photograph on the way in are the same question — is this
 * all right — asked by different things, and splitting them into two screens
 * would mean two places to look every morning and one of them usually empty.
 *
 * Who reported it says which is which: a name, or nobody, which is the screening.
 *
 * The pictures are shown. That is the point of the page: a report about a
 * photograph, read as a line of text saying "sexual", tells an admin nothing
 * about whether it is true, and the alternative is opening the app on a phone and
 * scrolling the feed until you find it. Everything on this page is behind the
 * admin sign-in, and this is the one screen in the club where somebody is meant
 * to look at a picture in order to decide about it.
 */
export default async function ReportsPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, about_post, about_reply, about_person, by_person, because, said, made_at, settled_at, settled_said",
    )
    .order("made_at", { ascending: false })
    .limit(200)
    .returns<
      {
        id: string;
        about_post: string | null;
        about_reply: string | null;
        about_person: string | null;
        by_person: string | null;
        because: string;
        said: string;
        made_at: string;
        settled_at: string | null;
        settled_said: string;
      }[]
    >();

  /* The table arrives with migration 0041. Until it is run this page says so
     rather than showing a Postgres error to somebody who did not write the
     migration and cannot be expected to read one. */
  if (error) {
    return (
      <Head title="reported">
        <p className="admin-error">
          Nothing to show yet: the reports table is not in the database. Run
          supabase/migrations/0041_reporting_and_blocking.sql and this page starts working.
        </p>
      </Head>
    );
  }

  const reports = data ?? [];

  /* Everything each row is about, fetched in three reads rather than one per
     row. A morning's list is a dozen rows and this would work either way; it is
     three reads because a bad week is two hundred. */
  const postIds = reports.map((one) => one.about_post).filter((one): one is string => Boolean(one));
  const replyIds = reports
    .map((one) => one.about_reply)
    .filter((one): one is string => Boolean(one));
  const peopleIds = [
    ...reports.map((one) => one.by_person),
    ...reports.map((one) => one.about_person),
  ].filter((one): one is string => Boolean(one));

  const [{ data: posts }, { data: replies }, { data: people }] = await Promise.all([
    postIds.length
      ? supabase
          .from("posts")
          .select("id, author_id, text, place, photo_paths, photo_path, created_at")
          .in("id", postIds)
          .returns<
            {
              id: string;
              author_id: string;
              text: string;
              place: string | null;
              photo_paths: string[] | null;
              photo_path: string | null;
              created_at: string;
            }[]
          >()
      : Promise.resolve({ data: [] as never[] }),
    replyIds.length
      ? supabase
          .from("post_replies")
          .select("id, post_id, author_id, text, created_at")
          .in("id", replyIds)
          .returns<
            { id: string; post_id: string; author_id: string; text: string; created_at: string }[]
          >()
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("profiles")
      .select("id, name")
      .returns<{ id: string; name: string }[]>(),
  ]);

  const named = new Map((people ?? []).map((row) => [row.id, row.name || "somebody"]));
  const post = new Map((posts ?? []).map((row) => [row.id, row]));
  const reply = new Map((replies ?? []).map((row) => [row.id, row]));

  const rows: ReportRow[] = reports.map((one) => {
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
      kind: one.about_post ? "post" : one.about_reply ? "reply" : "person",
      because: one.because,
      said: one.said,
      madeAt: one.made_at,
      settled: Boolean(one.settled_at),
      settledSaid: one.settled_said,
      /* Null is the screening. It is the one reporter with no name, and the page
         says so in words rather than leaving a blank where a name goes. */
      by: one.by_person ? (named.get(one.by_person) ?? "somebody") : null,
      whose: about
        ? (named.get(about.author_id) ?? "somebody")
        : answer
          ? (named.get(answer.author_id) ?? "somebody")
          : one.about_person
            ? (named.get(one.about_person) ?? "somebody")
            : "",
      words: about?.text ?? answer?.text ?? "",
      where: about?.place ?? "",
      when: about?.created_at ?? answer?.created_at ?? "",
      photos: paths.map((path) => mediaUrl(path)),
      /* Gone already: somebody took their own post down, or another report was
         settled by deleting it. The row stays — a report that led to something
         being removed is the record that it was. */
      missing: Boolean((one.about_post && !about) || (one.about_reply && !answer)),
    };
  });

  const waiting = rows.filter((row) => !row.settled);
  const done = rows.filter((row) => row.settled);

  return (
    <Head title="reported">
      <p className="admin-intro">
        What members have reported, and what the screening was not sure about. Nothing here has been
        hidden from anybody: a report is somebody asking the club to look, and looking is this page.
      </p>

      {rows.length === 0 ? (
        <p className="admin-empty">Nothing reported. Which is the usual state of it.</p>
      ) : null}

      {waiting.length > 0 ? (
        <>
          <p className="admin-group-label">waiting for somebody</p>
          <ReportRows rows={waiting} />
        </>
      ) : null}

      {done.length > 0 ? (
        <>
          <p className="admin-group-label" style={{ marginTop: 26 }}>
            already dealt with
          </p>
          <ReportRows rows={done} />
        </>
      ) : null}
    </Head>
  );
}
