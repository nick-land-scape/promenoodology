import type {
  ClubEvent,
  Donation,
  EventPage,
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
import { pretty } from "./admin/when";
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
  const [{ data: rows }, photos, chosen, { data: theirs }, { data: built }, { data: made }] =
    await Promise.all([
    supabase.from("stories").select("*")
      .is("deleted_at", null)
      .eq("published", true)
      .order("position")
      .returns<StoryRow[]>(),
    getResources(),
    coverPaths(),
    // Who was there and who it was made with, for every story at once — one
    // query rather than one per story, because the lists are tiny and there are
    // seven stories.
    supabase
      .from("story_people")
      .select("story_id, position, profiles(name, photo_path)")
      .order("position")
      .returns<
        { story_id: string; position: number; profiles: { name: string; photo_path: string | null } | null }[]
      >(),
    supabase
      .from("story_blocks")
      .select("story_id, position, kind, words, photo_id, layout")
      .order("position")
      .returns<
        {
          story_id: string;
          position: number;
          kind: "heading" | "text" | "photo" | "space";
          words: string;
          photo_id: string | null;
          layout: string | null;
        }[]
      >(),
    supabase
      .from("story_partners")
      .select("story_id, position, associations(name, logo_path, url, published)")
      .order("position")
      .returns<
        {
          story_id: string;
          position: number;
          associations: { name: string; logo_path: string | null; url: string | null; published: boolean } | null;
        }[]
      >(),
  ]);
  if (!rows?.length) return fileStories.getStories();

  /* id → the photograph itself, for the blocks. coverPaths already holds every
     id and its path, and `photos` holds everything about a path, so the two
     together are the lookup and there is no third query. */
  const byPath = new Map(photos.map((photo) => [photo.file, photo]));
  const byId = new Map(
    [...chosen.entries()]
      .map(([id, path]) => [id, byPath.get(path)] as const)
      .filter((pair): pair is [string, NonNullable<(typeof pair)[1]>] => Boolean(pair[1])),
  );

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
      /* Built by hand where anybody has built it: the blocks are the page, in
         the order they are in. A story with none is left to the old rule, which
         is what every story looked like before there was a builder. */
      blocks: (built ?? [])
        .filter((block) => block.story_id === row.id)
        .map((block) => {
          if (block.kind === "photo") {
            const found = block.photo_id ? byId.get(block.photo_id) : undefined;
            if (!found) return null;
            return {
              kind: "photo" as const,
              photo: found.photo,
              caption: [found.credit, found.year].filter(Boolean).join(", "),
              // The block's own layout wins over the photograph's, because a
              // photograph placed by hand was placed at a size on purpose.
              layout: ((block.layout ?? found.layout) as Resource["layout"]) ?? null,
            };
          }
          if (block.kind === "space") return { kind: "space" as const };
          if (!block.words.trim()) return null;
          return { kind: block.kind, words: block.words };
        })
        .filter((block): block is NonNullable<typeof block> => block !== null),
      topics: (row as StoryRow & { topics?: string[] | null }).topics ?? [],
      who: (theirs ?? [])
        .filter((one) => one.story_id === row.id && one.profiles)
        .map((one) => ({
          name: one.profiles!.name,
          photo: one.profiles!.photo_path ? mediaUrl(one.profiles!.photo_path) : null,
        })),
      // A partner taken off the community page is off the stories too: there is
      // one answer to "do we show these people", and it is theirs.
      partners: (made ?? [])
        .filter((one) => one.story_id === row.id && one.associations?.published)
        .map((one) => ({
          name: one.associations!.name,
          logo: one.associations!.logo_path ? mediaUrl(one.associations!.logo_path) : null,
          url: one.associations!.url || null,
        })),
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
    .is("deleted_at", null)
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
    .is("deleted_at", null)
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
    .is("deleted_at", null)
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

/** One leaf of the handbook: what it is called, and the words on it. */
export type Leaf = { id: string; title: string; blocks: PageBlock[] };

/**
 * The handbook, page by page.
 *
 * A handbook that is given away is a thing somebody has to be able to hold a
 * piece of at a time, so the words are kept in leaves and turned rather than
 * scrolled. A handbook with no leaves — before anybody has made one, or with no
 * database to ask — falls back to the one long column it always was, cut at its
 * own headings, which is exactly where a reader would have turned the page
 * anyway.
 */
export async function getHandbookPages(): Promise<Leaf[]> {
  if (hasSupabase()) {
    const supabase = supabasePublic();
    const { data } = await supabase
      .from("handbook_pages")
      .select("id, title, blocks")
      .is("deleted_at", null)
      .eq("published", true)
      .order("position")
      .returns<{ id: string; title: string; blocks: PageBlock[] | null }[]>();

    if (data && data.length > 0) {
      return data.map((leaf) => ({
        id: leaf.id,
        title: leaf.title ?? "",
        blocks: (leaf.blocks ?? []).filter((block) => block.text?.trim()),
      }));
    }
  }

  const page = await getPage("handbook");
  return page ? intoLeaves(page.blocks) : [];
}

/** One long column cut into pages, at the headings it already has. */
export function intoLeaves(blocks: PageBlock[]): Leaf[] {
  const leaves: Leaf[] = [];
  let leaf: PageBlock[] = [];

  const keep = () => {
    if (leaf.length === 0) return;
    const opening = leaf[0];
    leaves.push({
      id: `leaf-${leaves.length + 1}`,
      title: opening.kind === "heading" ? opening.text : "",
      blocks: leaf,
    });
    leaf = [];
  };

  for (const block of blocks) {
    if (block.kind === "heading") keep();
    leaf.push(block);
  }
  keep();

  return leaves;
}

/* -------------------------------------------------------------- the app */

/**
 * The evenings, as the app has to show them.
 *
 * Four things the back of the house has been keeping for a while and the app has
 * been dropping on the floor: the day it ends, the time it ends, who it is being
 * put on with, and how many places have been asked for. An evening that says
 * "1 Aug" when it runs to the third, or that takes a booking for a place that
 * went last week, is not a small inaccuracy — it is the app being wrong about the
 * only thing anybody opens it for.
 *
 * The bookings are counted here rather than asked for per evening: it is one
 * query for all of them, and the read policy only ever returns your own anyway
 * unless you are an admin — so this count is what *you* can see, which is why the
 * screens say "places asked for" rather than pretending to a total.
 */
export async function getEvents(): Promise<ClubEvent[]> {
  if (!hasSupabase()) return appFiles.getEvents();

  const supabase = supabasePublic();
  const [{ data }, { data: programme }, { data: partners }, { data: stories }, { data: bookings }] =
    await Promise.all([
    supabase
      .from("events")
      .select("*")
      .is("deleted_at", null)
      .eq("published", true)
      .order("happens_on")
      .returns<EventRow[]>(),
    /* The days each one runs, in one query for all of them. What may be read of
       these is decided by the event they belong to — see the policies in
       migration 0027 — so this returns the programmes of exactly the evenings
       above and nothing else. */
    supabase
      .from("event_sessions")
      .select("event_id, happens_on, starts_at, ends_at, title, what")
      .order("happens_on")
      .returns<
        {
          event_id: string;
          happens_on: string;
          starts_at: string | null;
          ends_at: string | null;
          title: string;
          what: string;
        }[]
      >(),
    supabase
      .from("associations")
      .select("id, name")
      .is("deleted_at", null)
      .eq("published", true)
      .returns<{ id: string; name: string }[]>(),
    supabase
      .from("stories")
      .select("id, slug, title")
      .is("deleted_at", null)
      .eq("published", true)
      .returns<{ id: string; slug: string; title: string }[]>(),
    supabase
      .from("bookings")
      .select("event_id, people")
      .returns<{ event_id: string; people: number }[]>(),
  ]);

  const named = new Map((partners ?? []).map((one) => [one.id, one.name]));
  const told = new Map((stories ?? []).map((one) => [one.id, one]));
  const asked = new Map<string, number>();
  for (const booking of bookings ?? []) {
    asked.set(booking.event_id, (asked.get(booking.event_id) ?? 0) + (booking.people || 1));
  }

  return (data ?? []).map((row) => {
    const story = row.story_id ? told.get(row.story_id) : undefined;
    return {
      id: row.id,
      date: row.happens_on,
      // Only where it says something the first day does not.
      until: row.ends_on && row.ends_on !== row.happens_on ? row.ends_on : "",
      time: row.starts_at ?? "",
      endTime: row.ends_at ?? "",
      title: row.title,
      place: row.place ?? "",
      spots: row.spots ?? 0,
      note: row.note ?? "",
      photo: row.photo_path
        ? { src: mediaUrl(row.photo_path), width: 1500, height: 1000 }
        : null,
      partners: (row.partners ?? []).map((id) => named.get(id)).filter(Boolean) as string[],
      needs: row.needs ?? "",
      fed: row.people_fed ?? null,
      asked: asked.get(row.id) ?? 0,
      story: story ? { slug: story.slug, title: story.title } : null,
      slug: row.slug ?? "",
      subtitle: row.subtitle ?? "",
      lead: row.lead ?? "",
      address: row.address ?? "",
      cost: row.cost ?? "",
      signUpEmail: row.sign_up_email ?? "",
      partOf: row.part_of ?? "",
      partOfUrl: row.part_of_url ?? "",
      days: (programme ?? [])
        .filter((day) => day.event_id === row.id)
        .map((day) => ({
          date: day.happens_on,
          time: day.starts_at ?? "",
          endTime: day.ends_at ?? "",
          title: day.title ?? "",
          what: day.what ?? "",
        })),
    };
  });
}

/**
 * One evening, at its own address, with the page somebody wrote for it.
 *
 * The list is read whole anyway — it is a few dozen rows and every screen that
 * shows evenings shows several — so the evening itself comes from there, and the
 * only thing asked for separately is the page, which nothing else needs.
 */
export async function getEvent(slug: string): Promise<EventPage | undefined> {
  const event = (await getEvents()).find((one) => one.slug === slug);
  if (!event) return undefined;
  if (!hasSupabase()) return { ...event, blocks: [] };

  const supabase = supabasePublic();
  const [{ data: built }, photos] = await Promise.all([
    supabase
      .from("event_blocks")
      .select("kind, words, photo_id, layout")
      .eq("event_id", event.id)
      .order("position")
      .returns<
        {
          kind: "heading" | "text" | "photo" | "space";
          words: string;
          photo_id: string | null;
          layout: string | null;
        }[]
      >(),
    getResources(),
  ]);

  if (!built || built.length === 0) return { ...event, blocks: [] };

  /* Which file each chosen photograph is, so a block can be matched to the
     picture the archive already knows how to draw. */
  const ids = built.map((block) => block.photo_id).filter(Boolean) as string[];
  const chosen = new Map<string, string>();
  if (ids.length > 0) {
    const { data: rows } = await supabase
      .from("photos")
      .select("id, path")
      .in("id", ids)
      .returns<{ id: string; path: string }[]>();
    for (const row of rows ?? []) chosen.set(row.id, row.path);
  }
  const byPath = new Map(photos.map((photo) => [photo.file, photo]));

  const blocks = built
    .map((block) => {
      if (block.kind === "photo") {
        const path = block.photo_id ? chosen.get(block.photo_id) : undefined;
        const found = path ? byPath.get(path) : undefined;
        if (!found) return null;
        return {
          kind: "photo" as const,
          photo: found.photo,
          caption: [found.credit, found.year].filter(Boolean).join(", "),
          layout: ((block.layout ?? found.layout) as Resource["layout"]) ?? null,
        };
      }
      if (block.kind === "space") return { kind: "space" as const };
      if (!block.words.trim()) return null;
      return { kind: block.kind, words: block.words };
    })
    .filter((block): block is NonNullable<typeof block> => block !== null);

  return { ...event, blocks };
}

export async function getNews(): Promise<NewsItem[]> {
  if (!hasSupabase()) return appFiles.getNews();

  const supabase = supabasePublic();
  const [{ data }, names] = await Promise.all([
    supabase
      .from("news")
      .select("*")
    .is("deleted_at", null)
      // The pinned one first, then the newest. At most one is pinned, which the
      // save enforces.
      .order("pinned", { ascending: false })
      .order("published_on", { ascending: false })
      .returns<(NewsRow & { authors?: string[] | null; pinned?: boolean })[]>(),
    photographerNames(),
  ]);

  return (data ?? []).map((row) => ({
    date: row.published_on,
    title: row.title,
    text: row.text ?? "",
    /* Names looked up now rather than stored. The authors are ids in an array
       with no foreign key behind them, so one that no longer answers is simply
       dropped — a deleted person leaves the byline rather than a hole in it. */
    by: (row.authors ?? []).map((id) => names.get(id)).filter((one): one is string => Boolean(one)),
    pinned: row.pinned === true,
  }));
}

/** The feed is still examples: nobody can post until members can sign in. */
/**
 * The feed.
 *
 * Every word of it used to come out of a CSV file — the posts, the names, the
 * likes, the replies — so nothing anybody wrote in the app could appear on it and
 * nothing on it had ever been in the database. It reads the database now, and
 * only falls back to the file when there is no database at all.
 *
 * Read with the caller's own session rather than the public key: the policy on
 * posts is "signed in to read", so the anon key gets nothing and would quietly
 * show an empty feed to a member who is looking right at their own post.
 */
export async function getPosts(): Promise<Post[]> {
  if (!hasSupabase()) return appFiles.getPosts();

  const { supabaseServer } = await import("./supabase/server");
  const supabase = await supabaseServer();

  const [{ data: posts }, { data: replies }, names] = await Promise.all([
    supabase
      .from("posts")
      .select("id, author_id, place, text, photo_path, photo_paths, created_at")
      .order("created_at", { ascending: false })
      .limit(80)
      .returns<
        {
          id: string;
          author_id: string;
          place: string | null;
          text: string;
          photo_path: string | null;
          photo_paths: string[] | null;
          created_at: string;
        }[]
      >(),
    supabase
      .from("post_replies")
      .select("id, post_id, author_id, text, created_at")
      .order("created_at")
      .returns<
        { id: string; post_id: string; author_id: string; text: string; created_at: string }[]
      >(),
    peopleNames(),
  ]);

  const said = new Map<string, Post["replies"]>();
  for (const reply of replies ?? []) {
    const list = said.get(reply.post_id) ?? [];
    list.push({
      id: reply.id,
      author: names.get(reply.author_id) ?? "somebody",
      authorId: reply.author_id,
      when: howLongAgo(reply.created_at),
      text: reply.text,
    });
    said.set(reply.post_id, list);
  }

  return (posts ?? []).map((row) => {
    /* The old single-picture column is still read: a post written before there
       could be more than one still has its photograph in it. */
    const paths = row.photo_paths?.length
      ? row.photo_paths
      : row.photo_path
        ? [row.photo_path]
        : [];
    return {
      id: row.id,
      author: names.get(row.author_id) ?? "somebody",
      authorId: row.author_id,
      place: row.place ?? "",
      when: howLongAgo(row.created_at),
      text: row.text,
      // A nominal size: the app draws them into a fixed frame and nobody
      // measures a picture on the way in.
      photos: paths.map((path) => ({ src: mediaUrl(path), width: 1200, height: 900 })),
      replies: said.get(row.id) ?? [],
    };
  });
}

/** id → name, for everybody who might have written something. */
async function peopleNames(): Promise<Map<string, string>> {
  const { data } = await supabasePublic()
    .from("profiles")
    .select("id, name")
    .returns<{ id: string; name: string }[]>();
  return new Map((data ?? []).map((row) => [row.id, row.name || "somebody"]));
}

/** "just now", "20 minutes ago", "yesterday", "3 August". */
function howLongAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (hours < 48) return "yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
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
    .is("deleted_at", null)
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

/* ---------------------------------------------------------- the front page */

/** A film behind the logo, and the still shown while it loads. */
export type Film = { id: string; src: string; poster: string | null };

/**
 * The films on the front page, in order.
 *
 * The one that ships with the site answers when the list is empty, and that is
 * not the fallback-to-files habit this file is otherwise careful about: /hero.mp4
 * is not a stale copy of anything in the database, it is the film the front page
 * was built with. Without it an empty list is a sheet of paper with a logo on it.
 */
export async function getHeroVideos(): Promise<Film[]> {
  const builtIn: Film = { id: "built-in", src: "/hero.mp4", poster: "/hero-poster.jpg" };
  if (!hasSupabase()) return [builtIn];

  try {
    const { data } = await supabasePublic()
      .from("hero_videos")
      .select("id, path, poster_path")
      .is("deleted_at", null)
      .eq("published", true)
      .order("position")
      .returns<{ id: string; path: string; poster_path: string | null }[]>();

    const films = (data ?? [])
      .filter((row) => row.path)
      .map((row) => ({
        id: row.id,
        src: mediaUrl(row.path),
        poster: row.poster_path ? mediaUrl(row.poster_path) : null,
      }));

    return films.length > 0 ? films : [builtIn];
  } catch {
    // Before migration 0019 there is no such table.
    return [builtIn];
  }
}

/* ------------------------------------------------------------- everywhere */

/** One place this has happened: an evening still to come, or a story of one. */
export type Placed = {
  id: string;
  title: string;
  where: string;
  when: string;
  lat: number;
  lng: number;
  slug: string | null;
  ahead: boolean;
  fed: number | null;
  /** Something to look at in the list beside the map. */
  cover: string | null;
  /** The story's own line under its title, where it has one. */
  hook: string;
  /** Its first paragraph, for the card that opens when a pin is pressed. */
  lead: string;
};

/**
 * Everywhere this collective has been.
 *
 * Both tables, because both are the same thing at different times: an evening is
 * something that is going to happen in a place, a story is what happened in one.
 * Only what has been given a position — a pin with no coordinates is not a pin,
 * and guessing one from a place name would put a kitchen in the wrong country.
 */
export async function getEverywhere(): Promise<Placed[]> {
  if (!hasSupabase()) return [];

  const supabase = supabasePublic();
  const [{ data: events }, { data: stories }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, place, happens_on, lat, lng, people_fed, story_id, photo_path")
      .is("deleted_at", null)
      .eq("published", true)
      .not("lat", "is", null)
      .returns<
        {
          id: string;
          title: string;
          place: string | null;
          happens_on: string;
          lat: number;
          lng: number;
          people_fed: number | null;
          story_id: string | null;
          photo_path: string | null;
        }[]
      >(),
    supabase
      .from("stories")
      .select("id, slug, title, place, happened, lat, lng, people_fed")
      .is("deleted_at", null)
      .eq("published", true)
      .not("lat", "is", null)
      .returns<
        {
          id: string;
          slug: string;
          title: string;
          place: string | null;
          happened: string | null;
          lat: number;
          lng: number;
          people_fed: number | null;
        }[]
      >(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const told = new Map<string, string>();
  for (const story of stories ?? []) told.set(story.id, story.slug);

  const pins: Placed[] = (stories ?? []).map((story) => ({
    id: `story-${story.id}`,
    title: story.title,
    where: story.place ?? "",
    when: story.happened ?? "",
    lat: story.lat,
    lng: story.lng,
    slug: story.slug,
    ahead: false,
    fed: story.people_fed,
    /* A story's cover, line and first paragraph come from the story itself,
       which the screen asking for this has already read — so they are filled in
       there rather than fetched a second time here. */
    cover: null,
    hook: "",
    lead: "",
  }));

  for (const event of events ?? []) {
    /* An evening that has been written up is already on the map as its story.
       Two pins on one square is a map that looks like a mistake. */
    if (event.story_id && told.has(event.story_id)) continue;
    pins.push({
      id: `event-${event.id}`,
      title: event.title,
      where: event.place ?? "",
      when: pretty(event.happens_on),
      lat: event.lat,
      lng: event.lng,
      slug: event.story_id ? (told.get(event.story_id) ?? null) : null,
      ahead: event.happens_on >= today,
      fed: event.people_fed,
      cover: event.photo_path ? mediaUrl(event.photo_path) : null,
      hook: "",
      lead: "",
    });
  }

  return pins;
}

/**
 * The numbers this collective is actually testing.
 *
 * Not engagement: plates, places, years. The claim is that fun is a currency that
 * brings public space back to life, and these are the only figures that speak to
 * it — so they are counted from what is recorded rather than typed into a banner.
 */
export async function getTheCount(): Promise<{
  fed: number;
  places: number;
  countries: number;
  interventions: number;
  years: number;
}> {
  if (!hasSupabase()) return { fed: 0, places: 0, countries: 0, interventions: 0, years: 0 };

  const supabase = supabasePublic();
  const [{ data: stories }, { data: events }] = await Promise.all([
    supabase
      .from("stories")
      .select("place, happened, people_fed")
      .is("deleted_at", null)
      .eq("published", true)
      .returns<{ place: string | null; happened: string | null; people_fed: number | null }[]>(),
    supabase
      .from("events")
      .select("place, happens_on, people_fed, story_id")
      .is("deleted_at", null)
      .eq("published", true)
      .returns<
        { place: string | null; happens_on: string; people_fed: number | null; story_id: string | null }[]
      >(),
  ]);

  const both = [
    ...(stories ?? []).map((one) => ({ place: one.place, when: one.happened, fed: one.people_fed })),
    // An evening with a story is counted once, as the story.
    ...(events ?? [])
      .filter((one) => !one.story_id)
      .map((one) => ({ place: one.place, when: one.happens_on, fed: one.people_fed })),
  ];

  const places = new Set<string>();
  const countries = new Set<string>();
  const years = new Set<string>();
  let fed = 0;

  for (const one of both) {
    if (one.fed) fed += one.fed;
    const where = (one.place ?? "").trim();
    if (where) {
      places.add(where.toLowerCase());
      /* The last thing after a comma is the country, the way anybody writes a
         place: "the yard, Burngreave, England". Where there is no comma the whole
         thing is taken as the place and no country is claimed. */
      const parts = where.split(",").map((part) => part.trim()).filter(Boolean);
      if (parts.length > 1) countries.add(parts[parts.length - 1].toLowerCase());
    }
    const year = (one.when ?? "").match(/\b(20\d{2})\b/);
    if (year) years.add(year[1]);
  }

  return {
    fed,
    places: places.size,
    countries: countries.size,
    interventions: both.length,
    years: years.size,
  };
}

/* ---------------------------------------------------------------- helpers */

/** id → the path of the photograph, for resolving a story's chosen cover. */
async function coverPaths() {
  if (!hasSupabase()) return new Map<string, string>();
  const { data } = await supabasePublic()
    .from("photos")
    .select("id, path")
    .is("deleted_at", null)
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
