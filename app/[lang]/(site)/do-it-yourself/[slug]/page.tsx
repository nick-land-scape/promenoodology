import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Photo from "@/components/Photo";
import { getSheet, getSheets } from "@/lib/source";
import { SITE_URL, siteUrl } from "@/lib/site";

export const revalidate = 60;

export async function generateStaticParams() {
  const sheets = await getSheets();
  return sheets.map((sheet) => ({ slug: sheet.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sheet = await getSheet(slug);
  if (!sheet) return { title: "Do it yourself" };
  return {
    title: `${sheet.title} — do it yourself`,
    description:
      sheet.hook ||
      sheet.words.slice(0, 180) ||
      "What it takes, what to do, and a photograph of it working.",
    alternates: { canonical: `/do-it-yourself/${sheet.slug}` },
    openGraph: {
      title: `${sheet.title} — do it yourself`,
      description: sheet.hook || sheet.words.slice(0, 180),
      url: siteUrl(`/do-it-yourself/${sheet.slug}`),
      images: sheet.photo ? [{ url: sheet.photo }] : undefined,
    },
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
export default async function SheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sheet = await getSheet(slug);
  if (!sheet) notFound();

  return (
    <main className="page sheet">
      <p className="sheet-eyebrow">do it yourself</p>
      <h1 className="page-title">{sheet.title}</h1>
      {sheet.hook ? <p className="story-hook sheet-hook">{sheet.hook}</p> : null}
      {sheet.words ? <p className="page-intro">{sheet.words}</p> : null}

      {sheet.photo ? (
        <figure className="sheet-shot">
          <Photo src={sheet.photo} alt="" width={1600} height={1067} sizes="(max-width: 900px) 100vw, 900px" />
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
            <ol>
              {sheet.steps.map((step) => (
                <li key={step}>{step}</li>
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
          <Link href="/handbook">handbook</Link> is the long version of this, and{" "}
          <Link href="/handbook#ask">asking us</Link> costs nothing.
        </p>
        <p className="sheet-pass">
          This page is meant to be passed on. Its address is{" "}
          <span className="sheet-address">
            {SITE_URL.replace(/^https?:\/\//, "")}/do-it-yourself/{sheet.slug}
          </span>
          .
        </p>
      </section>
    </main>
  );
}
