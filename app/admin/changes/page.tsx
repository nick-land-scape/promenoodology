import Link from "next/link";
import Head from "@/components/admin/Head";
import { Empty } from "@/components/admin/ui";
import { pretty } from "@/lib/admin/when";
import { requireAdmin } from "@/lib/admin/guard";
import { binnable } from "@/lib/admin/bin";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "What changed" };
export const dynamic = "force-dynamic";

/** Names a table by what it is called in the menu, not by what it is called. */
const SECTIONS: Record<string, string> = {
  stories: "a story",
  story_blocks: "a story's page",
  photos: "a photograph",
  quotes: "a quote",
  news: "a note",
  events: "an event",
  donations: "a gift",
  associations: "a partner",
  pages: "a page",
  profiles: "somebody",
  theme: "the look of the site",
  hero_videos: "a film on the front page",
};

/** A column named the way the screen names it. */
const FIELDS: Record<string, string> = {
  title: "the title",
  subtitle: "the hook",
  text: "the words",
  words: "the words",
  place: "where",
  happened: "when",
  made_with: "part of",
  tag: "the photo tag",
  slug: "the address",
  published: "on the site",
  credit: "the credit",
  credit_profile_id: "who took it",
  year: "the year",
  story_tag: "which story",
  layout: "how it sits",
  featured_photo_id: "the cover",
  name: "the name",
  country: "where they are from",
  role: "whether they look after the site",
  listed: "whether they are on the community page",
  listed_by_admin: "whether we show them",
  joined_on: "since when",
  photo_path: "the picture",
  logo_path: "the logo",
  happens_on: "the day it starts",
  ends_on: "the day it ends",
  starts_at: "the time it starts",
  ends_at: "the time it ends",
  spots: "how many can come",
  note: "the note",
  pinned: "whether it is pinned",
  authors: "who wrote it",
  partners: "who it is with",
  position: "the order",
  called: "what it is called",
  path: "the file",
  poster_path: "the still",
  seconds: "how long it runs",
  bytes: "what it weighs",
};

const said = (value: string | null) => {
  if (value === null || value === "") return "nothing";
  if (value === "true") return "yes";
  if (value === "false") return "no";
  return `“${value.length > 90 ? `${value.slice(0, 90)}…` : value}”`;
};

export default async function ChangesPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("changes")
    .select("id, at, what, row_id, did, field, was, now, profiles(name)")
    .order("at", { ascending: false })
    .limit(300)
    .returns<
      {
        id: number;
        at: string;
        what: string;
        row_id: string;
        did: string;
        field: string | null;
        was: string | null;
        now: string | null;
        profiles: { name: string } | null;
      }[]
    >();

  const rows = data ?? [];

  return (
    <Head title="what changed">
      <p className="admin-intro">
        The last three hundred changes, newest first — who, when, and which field. It is written by
        the database itself rather than by these pages, so nothing that changes anything can forget
        to say so.
      </p>

      {rows.length === 0 ? (
        <Empty>Nothing has changed since this started keeping count.</Empty>
      ) : (
        <ul className="admin-rows">
          {rows.map((row) => {
            const where = binnable(row.what);
            return (
              <li key={row.id} className="admin-row admin-change">
                <span className="admin-change-when">{pretty(row.at)}</span>

                <span className="admin-row-main">
                  <span className="admin-row-name" style={{ fontStyle: "normal" }}>
                    {row.profiles?.name || "somebody"}{" "}
                    <em className="admin-change-did">{row.did}</em>{" "}
                    {where ? (
                      <Link href={where.href}>{SECTIONS[row.what] ?? row.what}</Link>
                    ) : (
                      (SECTIONS[row.what] ?? row.what)
                    )}
                    {row.field ? ` — ${FIELDS[row.field] ?? row.field}` : ""}
                  </span>

                  {row.did === "edited" ? (
                    <span className="admin-row-meta">
                      {said(row.was)} <span aria-hidden="true">→</span> {said(row.now)}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Head>
  );
}
