import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { pretty } from "@/lib/admin/when";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import { breadcrumbs, graph, pageMetadata, say as pick, type Bilingual } from "@/lib/seo";
import { getSitePages } from "@/lib/site-pages";
import { getFrench, getNews, getPageHead } from "@/lib/source";
import { speaking } from "@/lib/words";

const TITLE: Bilingual = { en: "News", fr: "Nouvelles" };
const ABOUT: Bilingual = {
  en: "What has changed, what we have decided, and what is about to happen — from the people running the club.",
  fr: "Ce qui a changé, ce que nous avons décidé et ce qui va se passer — par les personnes qui font tourner le club.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const head = await getPageHead("news", lang);

  return pageMetadata({
    lang,
    path: "/news",
    title: head.title || pick(lang, TITLE),
    description: head.lead || pick(lang, ABOUT),
  });
}

/**
 * The news, on the website.
 *
 * The club has been writing these for months and they have only ever been
 * readable inside the app — which is to say, only by the people who already
 * know. "Thirty-five of us now" is not private information; it is the sort of
 * thing somebody deciding whether to come to an evening would like to read.
 *
 * Hidden until somebody says otherwise, and hidden the strict way round: this
 * page asks for its row and refuses without one, where every other page on the
 * site treats a missing row as "shown". That is deliberate — the default there
 * is right, because forgetting to write a row should not take a live page off
 * the site, and it is wrong here, because forgetting to write one would put an
 * unfinished page *on* it. Turn it on in /admin, under pages.
 *
 * Built like what's on, because it is the same kind of page: a name with the
 * date at the left of each entry, a paragraph, and the whole thing in one
 * column. No links out of it — a news item is short enough to be read where it
 * is, and a page of headlines that each need a click is a page that makes you
 * work for four sentences.
 */
export default async function NewsPage({ params }: { params: Promise<{ lang: string }> }) {
  /* Not `pageIsVisible`: that says yes when there is no row at all. Here the
     absence of a row means nobody has turned this on yet. */
  const pages = await getSitePages();
  const row = pages.find((page) => page.slug === "news");
  if (!row?.visible) notFound();

  const { lang: asked } = await params;
  const lang = isLang(asked) ? asked : PLAIN;

  const [news, head, french] = await Promise.all([
    getNews(lang),
    getPageHead("news", lang),
    getFrench(),
  ]);
  const say = speaking(lang, french);

  const held = news.filter((item) => item.pinned);
  const rest = news.filter((item) => !item.pinned);

  return (
    <main className="page">
      <JsonLd
        data={graph(
          breadcrumbs(lang, [
            { name: "promeNOODology", path: "/" },
            { name: head.title || pick(lang, TITLE), path: "/news" },
          ]),
        )}
      />

      <div className="page-head">
        <h1 className="page-title">{head.title || pick(lang, TITLE).toLowerCase()}</h1>
      </div>

      {head.lead ? (
        <p className="page-intro">{head.lead}</p>
      ) : (
        <p className="page-intro">
          {pick(lang, ABOUT)}{" "}
          <Link href={at(lang, "/newsletter")}>{say("news.orByEmail")}</Link>.
        </p>
      )}

      {news.length === 0 ? (
        <p className="empty">{say("news.nothingYet")}</p>
      ) : null}

      {held.length > 0 ? (
        <section className="events-group">
          <h2 className="story-label">{say("news.heldAtTheTop")}</h2>
          <ul className="dated-list">
            {held.map((item) => (
              <Item key={`${item.date}-${item.title}`} item={item} lang={lang} />
            ))}
          </ul>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section className="events-group">
          {held.length > 0 ? <h2 className="story-label">{say("news.theRest")}</h2> : null}
          <ul className="dated-list">
            {rest.map((item) => (
              <Item key={`${item.date}-${item.title}`} item={item} lang={lang} />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function Item({
  item,
  lang,
}: {
  item: { date: string; title: string; text: string; by: string[] };
  lang: Lang;
}) {
  const when = item.date ? new Date(`${item.date}T00:00:00Z`) : null;

  return (
    <li className="dated-item">
      {/* The date at the left, the big number over the month, which is how every
          date in this app and half of this site is drawn. */}
      {when ? (
        <span className="dated-when" aria-hidden="true">
          <b>{when.getUTCDate()}</b>
          <i>
            {when.toLocaleDateString(lang === "fr" ? "fr-CH" : "en-GB", { month: "short" })}
          </i>
          <em>{when.getUTCFullYear()}</em>
        </span>
      ) : null}

      <div className="dated-words">
        <h3 className="dated-name">{item.title}</h3>
        {/* Said out loud for a screen reader, which cannot read the stamp. */}
        <p className="story-meta">
          <span className="visually-hidden">{pretty(item.date)}</span>
          <span aria-hidden="true">{item.by.length > 0 ? item.by.join(", ") : null}</span>
        </p>
        {item.text.split("\n\n").map((paragraph, index) =>
          paragraph.trim() ? <p key={index}>{paragraph.trim()}</p> : null,
        )}
      </div>
    </li>
  );
}
