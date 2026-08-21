import BinLink from "@/components/admin/BinLink";
import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { mediaUrl } from "@/lib/supabase/config";
import type { HeroVideoRow } from "@/lib/supabase/rows";
import { supabaseServer } from "@/lib/supabase/server";
import Films, { type Film } from "./Films";

export default async function FrontPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("hero_videos")
    .select("id, path, poster_path, position, published, called, seconds, bytes")
    .is("deleted_at", null)
    .order("position")
    .returns<HeroVideoRow[]>();

  const films: Film[] = (data ?? []).map((row) => ({
    id: row.id,
    called: row.called ?? "",
    src: mediaUrl(row.path),
    poster: row.poster_path ? mediaUrl(row.poster_path) : null,
    seconds: row.seconds,
    bytes: row.bytes,
    published: row.published,
  }));

  return (
    <Head
      title="the front page"
      back={{ href: "/admin/pages", label: "pages" }}
      action={<BinLink table="hero_videos" />}
    >
      <p className="admin-intro">
        The film behind the logo. Add more than one and every visitor gets one of them — picked in
        their own browser, so the page itself is still the same page for everybody.
      </p>
      <p className="admin-note">
        A film is shrunk here before it goes up: no wider than 1280 pixels, no longer than twenty
        seconds, and silent, because the front page never plays sound. That happens in real time, so
        a fifteen-second film takes about fifteen seconds. With no films at all the page shows the
        one that came with the site.
      </p>
      <Films initial={films} />
    </Head>
  );
}
