import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Photo from "@/components/Photo";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import { breadcrumbs, graph, pageMetadata, picture, trim, US } from "@/lib/seo";
import { getSheet, getSheets, type Sheet } from "@/lib/source";
import { SITE_URL, siteUrl } from "@/lib/site";

export const revalidate = 60;

export async function generateStaticParams() {
  const sheets = await getSheets();
  return sheets.map((sheet) => ({ slug: sheet.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}): Promise<Metadata> {
  const { slug, lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const sheet = await getSheet(slug, lang);
  if (!sheet) return { title: "Do it yourself" };

  return pageMetadata({
    lang,
    path: `/do-it-yourself/${sheet.slug}`,
    title: `${sheet.title} — do it yourself`,
    description:
      sheet.hook ||
      trim(sheet.words, 180) ||
      "What it takes, what to do, and a photograph of it working.",
    image: sheet.photo,
    type: "article",
  });
}

/**
 * A sheet, as a set of instructions.
 *
 * The one page type on this site that maps onto a schema.org type exactly: a
 * list of what it takes and a numbered list of what to do is a HowTo, and
 * saying so is the difference between "somebody wrote a page about car parks"
 * and "here is how to do this, in eight steps, and here is what you need".
 *
 * That matters more for the machines that answer questions than for the ones
 * that rank pages. Somebody asking an assistant how to get their street eating
 * together is asking for exactly this, and this is how it gets handed over
 * whole instead of paraphrased.
 */
function asHowTo(sheet: Sheet, lang: Lang) {
  const url = siteUrl(at(lang, `/do-it-yourself/${sheet.slug}`));

  return {
    "@type": "HowTo",
    "@id": url,
    url,
    name: sheet.title,
    inLanguage: lang,
    description: trim(sheet.hook || sheet.words),
    image: picture(sheet.photo) ? [picture(sheet.photo)] : undefined,
    publisher: { "@id": US },
    supply: sheet.needs.map((thing) => ({ "@type": "HowToSupply", name: thing })),
    step: sheet.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      /* The step's own words as its name, cut short, and the whole thing as the
         text. A step here is a sentence rather than a heading, and inventing a
         heading for it would be writing something the page does not say. */
      name: trim(step, 80),
      text: step,
      url: `${url}#step-${index + 1}`,
    })),
  };
}

/**
 * One sheet: a kind of place, and how to cook in it.
 *
 * Set as a sheet rather than as an article — the numbered steps carry the page,
 * the materials list sits beside them, and the photograph is evidence rather than
 * decoration. It is meant to be read standing up, on a phone, by somebody who has
 * already decided to try, so nothing on it is an argument for trying.
 */
export default async function SheetPage({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}) {
  const { slug, lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  // In the language it is being read in. Asked without one, the French address
  // served the English sheet — a translated page nobody could get to.
  const sheet = await getSheet(slug, lang);
  if (!sheet) notFound();

  return (
    <main className="page sheet">
      <JsonLd
        data={graph(
          asHowTo(sheet, lang),
          breadcrumbs(lang, [
            { name: "promeNOODology", path: "/" },
            { name: "do it yourself", path: "/do-it-yourself" },
            { name: sheet.title, path: `/do-it-yourself/${sheet.slug}` },
          ]),
        )}
      />
      <p className="sheet-eyebrow">do it yourself</p>
      <h1 className="page-title">{sheet.title}</h1>
      {sheet.hook ? <p className="story-hook sheet-hook">{sheet.hook}</p> : null}
      {sheet.words ? <p className="page-intro">{sheet.words}</p> : null}

      {sheet.photo ? (
        <figure className="sheet-shot">
          <Photo
            src={sheet.photo}
            alt={sheet.title}
            width={1600}
            height={1067}
            sizes="(max-width: 900px) 100vw, 900px"
          />
          <figcaption>
            {sheet.fed
              ? `Somewhere else, on a day like the one you are planning. About ${sheet.fed} people stayed and ate.`
              : "Somewhere else, on a day like the one you are planning."}
          </figcaption>
        </figure>
      ) : null}

      <div className="sheet-two">
        {sheet.needs.length > 0 ? (
          <section className="sheet-needs">
            <h2>what it takes</h2>
            <ul>
              {sheet.needs.map((thing) => (
                <li key={thing}>{thing}</li>
              ))}
            </ul>
            <p className="sheet-aside">
              Borrowed beats bought, every time, and nothing on this list has to
              match anything else on it. Half of it is not cooking equipment: the
              chalk, the game, the one light and the spare seat are what turn a
              place into an evening.
            </p>
          </section>
        ) : null}

        {sheet.steps.length > 0 ? (
          <section className="sheet-steps">
            <h2>what to do</h2>
            {/* Each step at its own address. The structured data points at
                these, and somebody sending a friend "the bit about the tables"
                has something to send. */}
            <ol>
              {sheet.steps.map((step, index) => (
                <li key={step} id={`step-${index + 1}`}>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>

      {/* The one thing this page asks for, and it is not money or an account. */}
      <section className="sheet-foot">
        <h2>and then</h2>
        <p>
          Send us a photograph of the people, not of the food. That is the whole ask
          — no forms, no affiliation, nothing to join. If you want a hand first, the{" "}
          <Link href={at(lang, "/handbook")}>handbook</Link> is the long version of this, and{" "}
          <Link href={`${at(lang, "/handbook")}#ask`}>asking us</Link> costs nothing.
        </p>
        <p className="sheet-pass">
          This page is meant to be passed on. Its address is{" "}
          <span className="sheet-address">
            {SITE_URL.replace(/^https?:\/\//, "")}
            {at(lang, `/do-it-yourself/${sheet.slug}`)}
          </span>
          .
        </p>
      </section>
    </main>
  );
}
