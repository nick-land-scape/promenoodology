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
  const [{ data: rows }, photos] = await Promise.all([
    supabase.from("stories").select("*").eq("published", true).order("position").returns<StoryRow[]>(),
    getResources(),
  ]);
  if (!rows?.length) return fileStories.getStories();

  return rows.map((row) => {
    const mine = photos.filter((photo) => photo.event === row.tag);
    const sections = (row.sections ?? []) as Section[];
    return {
      slug: row.slug,
      tag: row.tag,
      title: row.title,
      order: row.position,
      where: row.place,
      when: row.happened || years(mine).join(", ") || null,
      with: row.made_with,
      sections,
      lead: sections.flatMap((section) => section.texts)[0] ?? "",
      photos: mine,
      credits: unique(mine.map((photo) => photo.credit)),
      cover: cover(mine),
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

export async function getResources(): Promise<Resource[]> {
  if (!hasSupabase()) return files.getResources();

  const supabase = supabasePublic();
  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("published", true)
    .order("position")
    .returns<PhotoRow[]>();
  if (!data?.length) return files.getResources();

  return data.map((row) => ({
    file: row.path,
    credit: row.credit ?? "",
    year: row.year ?? "",
    event: row.story_tag,
    photo: { src: mediaUrl(row.path), width: row.width, height: row.height },
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
  if (!data?.length) return files.getQuotes();

  const faces = await portraits();
  return data.map((row) => ({
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
  if (!data?.length) return files.getDonations();

  const faces = await portraits();
  return data.map((row) => ({
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
    if (data) {
      return { title: data.title, lead: data.lead, blocks: (data.blocks ?? []) as PageBlock[] };
    }
  }

  if (slug === "handbook") {
    const handbook = handbookFromFile();
    return { title: handbook.title, lead: handbook.lead, blocks: handbook.blocks };
  }
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
  if (!data?.length) return appFiles.getEvents();

  return data.map((row) => ({
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
  if (!data?.length) return appFiles.getNews();

  return data.map((row) => ({ date: row.published_on, title: row.title, text: row.text ?? "" }));
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
  const { data } = await supabase
    .from("profiles")
    .select("name, country, photo_path, colour")
    .eq("listed", true)
    .returns<ProfileRow[]>();
  if (!data?.length) return files.getMembers();

  return data.map((row) => {
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

/* ---------------------------------------------------------------- helpers */

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
