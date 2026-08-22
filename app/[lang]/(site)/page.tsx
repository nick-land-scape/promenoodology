import type { Metadata } from "next";
import Hero from "@/components/Hero";
import JsonLd from "@/components/JsonLd";
import { isLang, PLAIN, type Lang } from "@/lib/lang";
import { graph, organisation, pageMetadata, say, webSite, type Bilingual } from "@/lib/seo";
import { getHeroVideos } from "@/lib/source";

/* The films are looked up here and the page is still built once and cached; it
   is the browser that picks which of them plays. */
export const revalidate = 60;

/**
 * What the front page is, in one line and then in three.
 *
 * The page itself is a film and a mark, and that is the right front page for a
 * collective whose whole argument is that you should come and see. It is also,
 * to anything reading the site without eyes, a blank sheet: there was no title
 * of its own here, no description, no canonical, and one hidden word of text.
 * The highest-authority page on the domain said nothing at all.
 *
 * So the words below. The short one is the description a search result shows and
 * the long one is read out by a screen reader in place of a video with no
 * soundtrack — the same sentences either way, because a page that tells a
 * crawler more than it tells a person is doing something else.
 */
const TITLE: Bilingual = {
  en: "promeNOODology — a social club that cooks in public",
  fr: "promeNOODology — un club social qui cuisine en public",
};

const SHORT: Bilingual = {
  en: "A simple social club, open to everyone. We cook, walk and put on small events that make a place feel like ours — in Geneva and wherever somebody asks.",
  fr: "Un club social tout simple, ouvert à tous. Nous cuisinons, nous marchons et nous organisons de petits événements qui font qu’un lieu devient le nôtre — à Genève et partout où on nous le demande.",
};

const LONG: Bilingual = {
  en: "promeNOODology is a collective that cooks and eats in public places — squares, car parks, courtyards — to get people who do not know each other into the same place on purpose. Everything we have put on is written up as a story, everything that is coming is on the what’s on page, and the handbook and the do-it-yourself sheets are there so you can put on your own without asking anybody.",
  fr: "promeNOODology est un collectif qui cuisine et mange dans des lieux publics — places, parkings, cours — pour réunir volontairement des gens qui ne se connaissent pas. Tout ce que nous avons organisé est raconté dans les récits, tout ce qui vient est sur la page des événements, et le manuel et les fiches « faites-le vous-même » sont là pour que vous organisiez le vôtre sans demander la permission à personne.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;

  return pageMetadata({
    lang,
    path: "/",
    title: say(lang, TITLE),
    description: say(lang, SHORT),
    whole: true,
  });
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const films = await getHeroVideos();

  return (
    <>
      {/* Who we are, once, at the address every other page points back to. */}
      <JsonLd data={graph(organisation(), webSite(lang))} />
      <Hero films={films} heading={say(lang, TITLE)} words={say(lang, LONG)} />
    </>
  );
}
