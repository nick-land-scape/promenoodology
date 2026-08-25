import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LEGAL, legalSpec } from "@/lib/legal";
import { pretty } from "@/lib/admin/when";

export async function generateStaticParams() {
  return LEGAL.map((page) => ({ slug: page.slug }));
}

/**
 * Which address is the real one for a written page.
 *
 * Each of these can be reached four ways — /privacy, /legal/privacy, and both
 * of those with /fr in front — and there is only one page. So there is one
 * canonical for all four, and it is /privacy: the short English one, because it
 * is what an app store form, a bank and a footer link should say, and because
 * the words themselves are only written in English.
 *
 * No hreflang pair, deliberately, and this is the one page type on the site
 * that should not have one. A pair says "the same page, in the other
 * language". /fr/privacy is not that. It is the English privacy policy at a
 * French address, and the honest thing to tell a search engine about it is that
 * it is a copy of /privacy — which a canonical pointing there already does.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const spec = legalSpec(slug);
  if (!spec) return {};

  return {
    title: spec.title,
    description: spec.lead,
    alternates: { canonical: `/${spec.slug}` },
  };
}

/**
 * The three pages a club has to have in writing.
 *
 * One route for all of them because they are one kind of thing: a heading, a line
 * under it, and paragraphs with subheadings. They are not part of the site's
 * design in the way the statement and the handbook are — nobody should be
 * choosing a layout for a privacy policy — so they get the plainest page here and
 * the words live in lib/legal.ts, where they can be read and corrected by
 * somebody who is not looking at a database.
 *
 * They are reachable at /privacy, /imprint and /terms; this route is what those
 * three rewrite to.
 */
export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spec = legalSpec(slug);
  if (!spec) notFound();

  return (
    <main className="page">
      <h1 className="page-title">{spec.title}</h1>
      <p className="page-intro">{spec.lead}</p>

      <div className="legal">
        {spec.parts.map((part, index) =>
          part.heading ? (
            <h2 key={part.heading}>{part.heading}</h2>
          ) : (
            <p key={`${index}-${part.text?.slice(0, 24)}`}>{part.text}</p>
          ),
        )}

        <p className="legal-when">
          Last changed {pretty(spec.changed)}. Anything wrong or missing:{" "}
          <a href="mailto:info@promeNOODology.com">info@promeNOODology.com</a>.
        </p>

        <p className="legal-others">
          {LEGAL.filter((other) => other.slug !== spec.slug).map((other) => (
            <Link key={other.slug} href={`/${other.slug}`}>
              {other.title}
            </Link>
          ))}
        </p>
      </div>
    </main>
  );
}
