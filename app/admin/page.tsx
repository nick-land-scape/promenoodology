import Link from "next/link";
import Head from "@/components/admin/Head";
import { Icon } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/guard";
import { GROUPS, sectionsIn } from "@/lib/admin/sections";
import { supabaseServer } from "@/lib/supabase/server";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

/**
 * What the site looks like from behind: a few numbers, anything waiting for an
 * answer, and the way into every section.
 *
 * The numbers are the ones worth glancing at — how much there is, and how much
 * of it nobody can see yet. A story left hidden is the mistake this page exists
 * to catch.
 */

type Count = { all: number; hidden: number };

async function counts() {
  const supabase = await supabaseServer();

  /** One round trip per table, all at once. Only the count comes back. */
  const of = async (table: string): Promise<Count> => {
    const [all, hidden] = await Promise.all([
      supabase.from(table).select("*", { count: "exact", head: true }),
      supabase.from(table).select("*", { count: "exact", head: true }).eq("published", false),
    ]);
    return { all: all.count ?? 0, hidden: hidden.count ?? 0 };
  };

  const [stories, photos, quotes, events, news, donations, people, waiting, list] =
    await Promise.all([
      of("stories"),
      of("photos"),
      of("quotes"),
      of("events"),
      of("news"),
      of("donations"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("applications").select("*", { count: "exact", head: true }).eq("state", "new"),
      supabase.from("newsletter").select("*", { count: "exact", head: true }),
    ]);

  return {
    stories,
    photos,
    quotes,
    events,
    news,
    donations,
    people: people.count ?? 0,
    waiting: waiting.count ?? 0,
    list: list.count ?? 0,
  };
}

export default async function AdminHome() {
  const admin = await requireAdmin();
  const n = await counts();

  const stats: { href: string; value: number; label: string; note?: string }[] = [
    {
      href: "/admin/stories",
      value: n.stories.all - n.stories.hidden,
      label: "stories",
      note: n.stories.hidden > 0 ? `${n.stories.hidden} hidden` : "all shown",
    },
    {
      href: "/admin/photos",
      value: n.photos.all - n.photos.hidden,
      label: "photographs",
      note: n.photos.hidden > 0 ? `${n.photos.hidden} hidden` : "all shown",
    },
    {
      href: "/admin/events",
      value: n.events.all - n.events.hidden,
      label: "evenings on",
      note: n.events.hidden > 0 ? `${n.events.hidden} still being planned` : "nothing in the drawer",
    },
    { href: "/admin/people", value: n.people, label: "people with an account" },
    { href: "/admin/newsletter", value: n.list, label: "on the newsletter" },
  ];

  return (
    <Head
      title="looking after the site"
      action={
        <Link href="/admin/stories" className="admin-btn">
          <Icon name="plus" />
          write something
        </Link>
      }
    >
      <p className="admin-intro">
        {admin.name ? `${admin.name.split(" ")[0]}, ` : ""}everything the site is made of is in
        here. Nothing you change goes anywhere near the design — only the words and the
        photographs.
      </p>

      {n.waiting > 0 ? (
        <p className="admin-error" style={{ borderColor: "var(--purple)", color: "var(--ink)" }}>
          <Link href="/admin/requests">
            {n.waiting} {n.waiting === 1 ? "person has" : "people have"} asked us for a hand and had
            no answer yet →
          </Link>
        </p>
      ) : null}

      <div className="admin-stats">
        {stats.map((stat) => (
          <Link key={stat.href + stat.label} href={stat.href} className="admin-stat">
            <b>{stat.value}</b>
            <span>{stat.label}</span>
            {stat.note ? <em>{stat.note}</em> : null}
          </Link>
        ))}
      </div>

      {GROUPS.map((group) => (
        <section key={group.key} style={{ marginBottom: 26 }}>
          <p className="admin-group-label" style={{ marginBottom: 8 }}>
            {group.label}
          </p>
          <div className="admin-cards">
            {sectionsIn(group.key).map((section) => (
              <Link key={section.href} href={section.href} className="admin-card">
                <span className="admin-card-name">
                  <Icon name={section.icon} />
                  {section.label}
                  {section.href === "/admin/requests" && n.waiting > 0 ? (
                    <span className="admin-count">{n.waiting}</span>
                  ) : null}
                </span>
                <p>{section.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <p className="admin-note">
        Changes show on the site straight away. If a page still looks old, it is a copy your own
        browser kept — a reload settles it.
      </p>
    </Head>
  );
}
