import { at } from "@/lib/lang";
import { SITE_URL, siteUrl } from "@/lib/site";
import { getSitePages } from "@/lib/site-pages";
import { getEvents, getSheets, getStories } from "@/lib/source";

/**
 * The site, written out for a machine that reads.
 *
 * A sitemap says which addresses exist. It does not say what any of them is,
 * which is fine for a search engine — it is going to fetch them all anyway —
 * and useless to a language model, which is answering a question now, from
 * whatever it can get in one or two requests.
 *
 * So: one plain-text page, at /llms.txt, which is the convention that has
 * settled for this. Every page of the site with a line saying what is on it,
 * every evening with its date and place, every sheet with what it is for. Not a
 * copy of the site — a table of contents somebody can read in one go and then
 * fetch the two pages they actually needed.
 *
 * Written in English and pointing at the English addresses, with the French
 * prefix explained once at the top. Two full listings would double the length
 * of the thing for a reader who can be told the rule in one line.
 *
 * It is generated rather than written by hand for the obvious reason: a
 * hand-written index of a site whose contents are edited in /admin is out of
 * date the first time anybody edits anything.
 */

// Rebuilt at most once an hour. It is a listing of things that change daily at
// the very most, and it should not cost a database round trip per crawler.
/** One line, with the newlines taken out so it cannot break the list. */
function line(words: string, most = 200) {
  const one = (words ?? "").replace(/\s+/g, " ").trim();
  if (one.length <= most) return one;
  return `${one.slice(0, most).replace(/[\s,;:.–—-]+\S*$/, "")}…`;
}

/** A dated line for an evening: "22 August 2026 · la friche · Renens". */
function facts(parts: (string | null | undefined)[]) {
  return parts.map((part) => (part ?? "").trim()).filter(Boolean).join(" · ");
}

export async function GET() {
  const [site, stories, events, sheets] = await Promise.all([
    getSitePages(),
    getStories(),
    getEvents(),
    getSheets(),
  ]);

  const on = (slug: string) => site.find((page) => page.slug === slug)?.visible !== false;
  const today = new Date().toISOString().slice(0, 10);

  const out: string[] = [];
  const say = (text = "") => out.push(text);

  say("# promeNOODology");
  say();
  say(
    "> A social club, open to everyone, that cooks and eats in public places — squares, car parks, courtyards — to get people who do not know each other into the same place on purpose. Based around Geneva, Switzerland; the sheets and the handbook are written so anybody anywhere can do the same thing without asking us.",
  );
  say();
  say(
    "The site is in English and French. Every address below is the English one; the French of the same page is the same address with /fr in front of it, so " +
      `${SITE_URL}/events is ${SITE_URL}/fr/events. Both are canonical in their own language.`,
  );
  say();
  say(
    "There is a members' app at /app for signing up to come to things. It is behind a sign-in and not indexed; nothing in it is needed to understand what this collective does.",
  );
  say();

  /* What is on comes first, and it is the only part of this file anybody can
     still act on. Dates in full, because "this Saturday" in a file generated an
     hour ago is a wrong answer waiting to be given. */
  const coming = events
    .filter((event) => event.slug && (event.until || event.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (on("events") && coming.length > 0) {
    say("## What is on");
    say();
    for (const event of coming) {
      const when = event.until ? `${event.date} to ${event.until}` : event.date;
      say(
        `- [${event.title}](${siteUrl(`/events/${event.slug}`)}): ${facts([
          when,
          event.time,
          event.place,
          event.address,
          event.cost,
          line(event.lead || event.subtitle, 160),
        ])}`,
      );
    }
    say();
  }

  /* The sheets, above the stories on purpose: they are the part of this site
     written to be used by somebody who has never heard of us, and the most
     likely honest answer to a question somebody asks an assistant. */
  if (sheets.length > 0) {
    say("## How to do this yourself");
    say();
    say(
      `One sheet per kind of place: what it takes, what to do in order, and what happened when we did it. No account and no permission needed. Index: ${siteUrl("/do-it-yourself")}`,
    );
    say();
    for (const sheet of sheets) {
      say(
        `- [${sheet.title}](${siteUrl(`/do-it-yourself/${sheet.slug}`)}): ${facts([
          line(sheet.hook || sheet.words, 160),
          sheet.steps.length ? `${sheet.steps.length} steps` : null,
          sheet.needs.length ? `${sheet.needs.length} things to bring` : null,
          sheet.fed ? `fed about ${sheet.fed}` : null,
        ])}`,
      );
    }
    say();
  }

  if (on("stories") && stories.length > 0) {
    say("## What we have done");
    say();
    say(`One story per thing we put on. Index: ${siteUrl("/stories")}`);
    say();
    for (const story of stories) {
      say(
        `- [${story.title}](${siteUrl(`/stories/${story.slug}`)}): ${facts([
          story.where,
          story.when,
          story.with,
          line(story.subtitle || story.lead, 160),
        ])}`,
      );
    }
    say();
  }

  /* The evenings that are over. Named but not described: they are the record
     rather than the offer, and the story written about them is the better page
     to be sent to. */
  const been = events
    .filter((event) => event.slug && (event.until || event.date) < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (on("events") && been.length > 0) {
    say("## What has already happened");
    say();
    for (const event of been) {
      say(
        `- [${event.title}](${siteUrl(`/events/${event.slug}`)}): ${facts([
          event.date,
          event.place,
        ])}`,
      );
    }
    say();
  }

  say("## The rest of the site");
  say();
  const rest: [string, string, boolean][] = [
    ["About us", "/about", on("about")],
    [
      "Handbook — how to put on something like this, and how to ask us for help",
      "/handbook",
      on("handbook"),
    ],
    ["Community — the people, and the organisations we work with", "/community", on("community")],
    ["Archive — the photographs, and the things people said", "/archive", on("archive")],
    ["Newsletter — a short letter when there is something to come to", "/newsletter", on("newsletter")],
  ];
  for (const [name, path, visible] of rest) {
    if (visible) say(`- [${name}](${siteUrl(path)})`);
  }
  say();

  say("## Who to ask");
  say();
  say("- Email: info@promeNOODology.com");
  say("- Instagram: https://www.instagram.com/promenoodology/");
  say(`- Privacy: ${siteUrl("/privacy")}`);
  say(`- Who is behind this: ${siteUrl("/imprint")}`);
  say(`- Machine-readable index of every page: ${siteUrl("/sitemap.xml")}`);
  say();
  say(
    "Every page also carries schema.org JSON-LD — Event on an evening, HowTo on a sheet, Article on a story — so the facts on it can be read without parsing the prose.",
  );
  say();
  say(`French: ${siteUrl(at("fr", "/"))}`);

  return new Response(`${out.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Fine to keep for an hour, and fine to serve stale for a day while it is
      // fetched again: nothing here is worth making anybody wait for.
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
