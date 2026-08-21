import type {
  ClubEvent,
  Donation,
  Member,
  NewsItem,
  Photo,
  Post,
  Quote,
  Resource,
  Section,
  Story,
} from "./content";
import * as appFiles from "./app-data";
import * as files from "./data";
import { getHandbook as handbookFromFile } from "./handbook";
import * as fileStories from "./stories";
import { type PageSettings, settingsFor } from "./admin/page-settings";
import { hasSupabase, mediaUrl } from "./supabase/config";
import { supabasePublic } from "./supabase/public";
import type {
  DonationRow,
  EventRow,
  NewsRow,
  PageRow,
  PhotoRow,
  ProfileRow,
  QuoteRow,
  StoryRow,
} from "./supabase/rows";

/**
 * Where the content comes from.
 *
 * Everything the site shows goes through this file. If the database is
 * configured it answers; if it is not, the CSV and text files in /data and
 * /content answer instead, exactly as they did before there was a database.
 * That keeps the site buildable on a laptop with no keys, and standing if the
 * database is ever unreachable.
 */

/* Pages set `export const revalidate = 60` themselves: Next only accepts a
   literal there, so it cannot be shared from here. */

/* --------------------------------------------------------------- stories */

export async function getStories(): Promise<Story[]> {
  if (!hasSupabase()) return fileStories.getStories();

  const supabase = supabasePublic();
  const [{ data: rows }, photos, chosen] = await Promise.all([
    supabase.from("stories").select("*").eq("published", true).order("position").returns<StoryRow[]>(),
    getResources(),
    coverPaths(),
  ]);
  if (!rows?.length) return fileStories.getStories();

  return rows.map((row) => {
    const mine = photos.filter((photo) => photo.event === row.tag);
    const sections = (row.sections ?? []) as Section[];

    // A chosen cover wins; failing that the widest one, which is a decent guess
    // and no more than that.
    const picked = row.featured_photo_id ? chosen.get(row.featured_photo_id) : undefined;
    const found = picked ? mine.find((photo) => photo.file === picked) : undefined;

    return {
      slug: row.slug,
      tag: row.tag,
      title: row.title,
      subtitle: row.subtitle ?? "",
      order: row.position,
      where: row.place,
      when: row.happened || years(mine).join(", ") || null,
      with: row.made_with,
      sections,
      lead: sections.flatMap((section) => section.texts)[0] ?? "",
      photos: mine,
      credits: unique(mine.map((photo) => photo.credit)),
      cover: found?.photo ?? cover(mine),
    };
  });
}

export async function getStory(slug: string) {
  return (await getStories()).find((story) => story.slug === slug);
}

/** The stories before and after this one, wrapping around at the ends. */
export async function getNeighbours(slug: string) {
  const stories = await getStories();
  const index = stories.findIndex((story) => story.slug === slug);
  if (index === -1) return { previous: undefined, next: undefined };
  return {
    previous: stories[(index - 1 + stories.length) % stories.length],
    next: stories[(index + 1) % stories.length],
  };
}

/* ------------------------------------------------------- photos and quotes */

/*
 * An empty table is an answer.
 *
 * Every one of these used to fall back to the files in /data when the query came
 * back with nothing, and that made deletion impossible to finish: emptying the
 * quotes in the back of the house brought back the seven that ship with the
 * repository, and they could not be deleted either, because they were never
 * rows. Reported as "we deleted all quotes but they are still in the archive",
 * and that is exactly what it was.
 *
 * The files are for a copy of the site with no database at all — which is the
 * check at the top of each of these functions, and is the only case they were
 * ever meant for. Once there are keys, the database is the truth, including when
 * its answer is "none".
 */


export async function getResources(): Promise<Resource[]> {
  if (!hasSupabase()) return files.getResources();

  const supabase = supabasePublic();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("photos")
      .select("*")
      .eq("published", true)
      .order("position")
      .returns<PhotoRow[]>(),
    photographerNames(),
  ]);

  return (data ?? []).map((row) => ({
    file: row.path,
    // Somebody who has an account is credited by the name on it, so correcting
    // your own name on your profile corrects it under every photograph you took.
    // The typed one stays for everybody else.
    credit: (row.credit_profile_id ? names.get(row.credit_profile_id) : "") || row.credit || "",
    year: row.year ?? "",
    event: row.story_tag,
    photo: { src: mediaUrl(row.path), width: row.width, height: row.height },
    layout: row.layout ?? null,
  }));
}

export async function getQuotes(): Promise<Quote[]> {
  if (!hasSupabase()) return files.getQuotes();

  const supabase = supabasePublic();
  const { data } = await supabase
    .from("quotes")
    .select("*")
    .eq("published", true)
    .order("created_at")
    .returns<QuoteRow[]>();

  const faces = await portraits();
  return (data ?? []).map((row) => ({
    id: row.id,
    who: row.who ?? "",
    where: row.place ?? "",
    year: row.year ?? "",
    story: row.story_tag,
    text: row.text,
    photo: faces.get((row.who ?? "").toLowerCase()) ?? null,
  }));
}

export async function getDonations(): Promise<Donation[]> {
  if (!hasSupabase()) return files.getDonations();

  const supabase = supabasePublic();
  const { data } = await supabase
    .from("donations")
    .select("*")
    .eq("published", true)
    .order("given_on", { ascending: false })
    .returns<DonationRow[]>();

  const faces = await portraits();
  return (data ?? []).map((row) => ({
    id: row.id,
    who: row.who ?? "",
    when: row.given_on,
    amount: row.amount ?? "",
    note: row.note ?? "",
    photo: row.who ? faces.get(row.who.toLowerCase()) ?? null : null,
  }));
}

/* ------------------------------------------------------------------ pages */

export type PageBlock = { kind: string; text: string };

/**
 * The about statement as the site shipped with it, before there was anywhere to
 * edit it. It lives here rather than in the page so that both the page and the
 * back of the house get the same words from the same place — otherwise editing
 * the statement would start from a blank screen.
 *
 * Alternating voices: `loud` is set large, `quiet` is the aside underneath.
 */
const ABOUT: { title: string; lead: string; blocks: PageBlock[] } = {
  title: "about us",
  lead: "",
  blocks: [
    {
      kind: "loud",
      text: "promeNOODology empowers local communities to build social and environmental resilience through active engagement and negotiation with their immediate surroundings.",
    },
    {
      kind: "quiet",
      text: "We encourage people to participate in the transformation of their local environments, fostering a culture where failure is seen as a learning opportunity and interdependencies are embraced within a resource-rich ecosystem.",
    },
    {
      kind: "loud",
      text: "promeNOODology offers accessible and repeatable experiences designed to disrupt the ordinary.",
    },
    {
      kind: "quiet",
      text: "Together, we create enjoyable scenarios that highlight individual dependencies and collective resources, promoting a sense of community and shared purpose.",
    },
  ],
};

/**
 * The top of any page: its heading, the line under it, and the few knobs it is
 * allowed to set.
 *
 * Separate from getPage below because most pages have no words of their own —
 * the stories page is made of stories, the archive of photographs — but every
 * page has a heading and a line under it, and those were sitting in the page
 * files where nobody without a code editor could reach them.
 *
 * Anything not saved comes back empty, and the page keeps the words it shipped
 * with. One thing worth knowing: a line typed here is plain text, so a lead that
 * has a link in it today loses the link the first time somebody edits it. That is
 * the price of the field, and it is the right way round — the words matter more
 * than the link, and the link is still in the sentence next to it.
 */
export async function getPageHead(slug: string): Promise<{
  title: string;
  lead: string;
  settings: PageSettings;
  /**
   * Has anybody ever saved this page?
   *
   * It is the difference between "no line yet" and "no line, thank you". Without
   * it an emptied lead fell back to the words in the code, and there was no way
   * to take a line off a page at all — the field looked like it worked and
   * quietly refused.
   */
  saved: boolean;
}> {
  const empty = { title: "", lead: "", settings: settingsFor(slug, {}), saved: false };
  if (!hasSupabase()) return empty;

  try {
    const { data } = await supabasePublic()
      .from("pages")
      .select("title, lead, settings")
      .eq("slug", slug)
      .maybeSingle<Pick<PageRow, "title" | "lead" | "settings">>();
    if (!data) return empty;

    return {
      title: data.title ?? "",
      lead: data.lead ?? "",
      settings: settingsFor(slug, data.settings),
      saved: true,
    };
  } catch {
    // Before migration 0005 there is no settings column and the select fails.
    return empty;
  }
}

export async function getPage(slug: string): Promise<{
  title: string;
  lead: string;
  blocks: PageBlock[];
} | null> {
  if (hasSupabase()) {
    const supabase = supabasePublic();
    const { data } = await supabase
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .maybeSingle<PageRow>();
    // A row with no blocks in it is a page somebody emptied by accident, not a
    // decision to show nothing: fall through to what the site shipped with.
    if (data && (data.blocks ?? []).length > 0) {
      return { title: data.title, lead: data.lead, blocks: (data.blocks ?? []) as PageBlock[] };
    }
  }

  if (slug === "handbook") {
    const handbook = handbookFromFile();
    return { title: handbook.title, lead: handbook.lead, blocks: handbook.blocks };
  }
  if (slug === "about") return ABOUT;
  return null;
}

/* -------------------------------------------------------------- the app */

export async function getEvents(): Promise<ClubEvent[]> {
  if (!hasSupabase()) return appFiles.getEvents();

  const supabase = supabasePublic();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("published", true)
    .order("happens_on")
    .returns<EventRow[]>();

  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.happens_on,
    time: row.starts_at ?? "",
    title: row.title,
    place: row.place ?? "",
    spots: row.spots ?? 0,
    note: row.note ?? "",
    photo: row.photo_path
      ? { src: mediaUrl(row.photo_path), width: 1500, height: 1000 }
      : null,
  }));
}

export async function getNews(): Promise<NewsItem[]> {
  if (!hasSupabase()) return appFiles.getNews();

  const supabase = supabasePublic();
  const { data } = await supabase
    .from("news")
    .select("*")
    .eq("published", true)
    .order("published_on", { ascending: false })
    .returns<NewsRow[]>();

  return (data ?? []).map((row) => ({ date: row.published_on, title: row.title, text: row.text ?? "" }));
}

/** The feed is still examples: nobody can post until members can sign in. */
export async function getPosts(): Promise<Post[]> {
  return appFiles.getPosts();
}

/* --------------------------------------------------------------- community */

/**
 * The community list. People become rows in `profiles` when they sign in; until
 * then data/community.csv is the list, so nobody disappears in the meantime.
 */
export async function getMembers(): Promise<Member[]> {
  if (!hasSupabase()) return files.getMembers();

  const supabase = supabasePublic();
  // Not filtered here: whether somebody is shown is "they said yes, unless an
  // admin said otherwise", which is two columns and one question. The policy on
  // the table asks it as well, so a row that should not be seen is not returned
  // even if this ever forgot to.
  const { data } = await supabase
    .from("profiles")
    .select("name, country, photo_path, colour, listed, listed_by_admin")
    .returns<ProfileRow[]>();
  const shown = (data ?? []).filter((row) => row.listed_by_admin ?? row.listed);

  return shown.map((row) => {
    const parts = (row.name ?? "").split(" ");
    return {
      name: row.name ?? "",
      first: parts[0] ?? "",
      last: parts.slice(1).join(" "),
      country: row.country ?? "",
      project: "",
      color: row.colour,
      photo: row.photo_path
        ? { src: mediaUrl(row.photo_path), width: 600, height: 800 }
        : null,
    };
  });
}

/* ------------------------------------------------------------------ partners */

/** A partner as the community page shows one. */
export type Partner = { id: string; name: string; url: string | null; logo: Photo | null };

export async function getPartners(): Promise<Partner[]> {
  if (!hasSupabase()) return [];

  try {
    const { data } = await supabasePublic()
      .from("associations")
      .select("id, name, url, logo_path")
      .eq("published", true)
      .order("position")
      .returns<{ id: string; name: string; url: string | null; logo_path: string | null }[]>();

    return (data ?? [])
      .filter((row) => row.name)
      .map((row) => ({
        id: row.id,
        name: row.name,
        url: row.url,
        // The size is nominal: a logo is drawn to a height and keeps its shape,
        // and nobody measures one on the way in.
        logo: row.logo_path ? { src: mediaUrl(row.logo_path), width: 400, height: 200 } : null,
      }));
  } catch {
    // Before migration 0006 there is no such table.
    return [];
  }
}

/* ---------------------------------------------------------------- helpers */

/** id → the path of the photograph, for resolving a story's chosen cover. */
async function coverPaths() {
  if (!hasSupabase()) return new Map<string, string>();
  const { data } = await supabasePublic()
    .from("photos")
    .select("id, path")
    .returns<{ id: string; path: string }[]>();
  return new Map((data ?? []).map((row) => [row.id, row.path]));
}

/** id → name, for photographs credited to somebody with an account. */
async function photographerNames() {
  if (!hasSupabase()) return new Map<string, string>();
  const { data } = await supabasePublic()
    .from("profiles")
    .select("id, name")
    .returns<{ id: string; name: string }[]>();
  return new Map((data ?? []).filter((row) => row.name).map((row) => [row.id, row.name]));
}

/** name (lower case) -> portrait, so quotes and the wall can show a face. */
async function portraits() {
  const members = await getMembers();
  return new Map(
    members.filter((member) => member.photo).map((member) => [member.name.toLowerCase(), member.photo!]),
  );
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function years(photos: Resource[]) {
  return unique(photos.map((photo) => photo.year)).sort();
}

function cover(photos: Resource[]): Photo | null {
  if (photos.length === 0) return null;
  const landscape = photos.filter((photo) => photo.photo.width >= photo.photo.height);
  return (landscape[0] ?? photos[0]).photo;
}

export { getFilters } from "./data";
