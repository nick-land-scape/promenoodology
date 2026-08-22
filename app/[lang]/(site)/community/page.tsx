import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CommunityGrid from "@/components/CommunityGrid";
import type { Partner } from "@/lib/source";
import { getMembers, getPageHead, getPartners } from "@/lib/source";
import { isLang, PLAIN, type Lang } from "@/lib/lang";
import { pageMetadata, say, type Bilingual } from "@/lib/seo";
import { pageIsVisible } from "@/lib/site-pages";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

const TITLE: Bilingual = { en: "Community", fr: "La communauté" };
const ABOUT: Bilingual = {
  en: "The people of promeNOODology — everybody who has cooked, walked or turned up, and the organisations we have done it with.",
  fr: "Les gens de promeNOODology — tous ceux qui ont cuisiné, marché ou sont venus, et les organisations avec qui nous l’avons fait.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const head = await getPageHead("community", lang);

  return pageMetadata({
    lang,
    path: "/community",
    title: head.title || say(lang, TITLE),
    description: head.lead || say(lang, ABOUT),
  });
}

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

/**
 * A logo where there is one, the name where there is not.
 *
 * A plain img rather than next/image, and deliberately: a logo is very often an
 * SVG, which next/image refuses to touch unless the whole project opts into
 * serving arbitrary SVG through its optimiser. A logo is thirty pixels tall and
 * there is nothing to optimise — so it is fetched as it is, and a vector stays a
 * vector.
 */
function Logo({ partner }: { partner: Partner }) {
  if (!partner.logo) return <span className="partners-name">{partner.name}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={partner.logo.src} alt={partner.name} loading="lazy" />;
}

export default async function CommunityPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: asked } = await params;
  const lang = isLang(asked) ? asked : PLAIN;
  const say = speaking(lang, await getFrench());

  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("community"))) notFound();

  const [members, head, partners] = await Promise.all([
    getMembers(),
    getPageHead("community", lang),
    getPartners(),
  ]);

  return (
    <main className="page">
      {/* The heading is for a screen reader: the grid of names is the page. */}
      <h1 className="visually-hidden">{head.title || "Community"}</h1>
      {head.lead ? <p className="page-intro">{head.lead}</p> : null}
      <div style={{ "--columns": String(head.settings.columns) } as React.CSSProperties}>
        <CommunityGrid members={members} />
      </div>

      {/* The partners, under the names. Provisional: they are here because they
          belong on this page, and quite how they should sit is still being
          decided — a row of logos says the least and assumes the least. */}
      {partners.length > 0 ? (
        <section className="partners">
          <h2 className="partners-label">{say("site.with")}</h2>
          <ul className="partners-row">
            {partners.map((partner) => (
              <li key={partner.id}>
                {partner.url ? (
                  <a href={partner.url} target="_blank" rel="noopener noreferrer">
                    <Logo partner={partner} />
                  </a>
                ) : (
                  <Logo partner={partner} />
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
