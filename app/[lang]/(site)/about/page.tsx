import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import PageBackground from "@/components/PageBackground";
import QuoteThis from "@/components/QuoteThis";
import { getPage, getPageHead } from "@/lib/source";
import { siteUrl } from "@/lib/site";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import {
  breadcrumbs,
  graph,
  organisation,
  pageMetadata,
  say,
  trim,
  US,
  type Bilingual,
} from "@/lib/seo";
import { pageIsVisible } from "@/lib/site-pages";

const TITLE: Bilingual = { en: "About us", fr: "Qui nous sommes" };

const ABOUT: Bilingual = {
  en: "promeNOODology empowers local communities to build social and environmental resilience through active engagement and negotiation with their immediate surroundings.",
  fr: "promeNOODology aide les communautés locales à bâtir une résilience sociale et environnementale par un engagement actif et une négociation avec ce qui les entoure immédiatement.",
};

/* The statement is written in /admin and translated beside itself there, so the
   description a search engine shows is the first line of the real thing rather
   than a summary of it kept somewhere else and left to go stale. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const [head, page] = await Promise.all([getPageHead("about", lang), getPage("about", lang)]);
  const first = page?.blocks?.find((part) => part.text?.trim())?.text ?? "";

  return pageMetadata({
    lang,
    path: "/about",
    title: head.title || say(lang, TITLE),
    description: head.lead || trim(first) || say(lang, ABOUT),
  });
}

// A page may serve a cached copy for a minute before asking the database again.
export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;

  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("about"))) notFound();

  // Whatever the back of the house has saved, or the statement the site shipped
  // with — getPage falls back to it, so this is never empty. In the language it
  // is being read in: the statement is translated beside itself in /admin, and
  // asking for it without saying which language served the French page English.
  const [page, head] = await Promise.all([getPage("about", lang), getPageHead("about", lang)]);
  const statement = page?.blocks ?? [];

  return (
    <main className="page">
      {/* The statement, as the thing this organisation says about itself. An
          AboutPage rather than a plain page, and it names the collective it is
          about by the id every other page on the site uses. */}
      <JsonLd
        data={graph(
          {
            "@type": "AboutPage",
            "@id": siteUrl(at(lang, "/about")),
            url: siteUrl(at(lang, "/about")),
            name: head.title || say(lang, TITLE),
            inLanguage: lang,
            mainEntity: { "@id": US },
            description: head.lead || trim(statement.map((part) => part.text).join(" ")),
          },
          organisation(),
          breadcrumbs(lang, [
            { name: "promeNOODology", path: "/" },
            { name: head.title || say(lang, TITLE), path: "/about" },
          ]),
        )}
      />
      <PageBackground settings={head.settings} />
      <h1 className="visually-hidden">{head.title || say(lang, TITLE)}</h1>

      <div className="statement">
        {statement.map((part, index) => (
          <p key={index} className={`statement-${part.kind}`}>
            {part.text}
          </p>
        ))}

        <div className="statement-actions">
          <Link className="join-primary" href={at(lang, "/newsletter")}>
            hear when something is on →
          </Link>
          <Link className="join-secondary" href={at(lang, "/handbook")}>
            or put on your own — the handbook →
          </Link>
        </div>
      </div>

      {/* The same offer as on a story: the moment somebody takes the words is
          the moment to hand them the source. */}
      <QuoteThis title={head.title || "about us"} url={siteUrl(at(lang, "/about"))} />
</main>
  );
}
