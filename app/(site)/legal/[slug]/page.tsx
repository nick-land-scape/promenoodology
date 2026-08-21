import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LEGAL, legalSpec } from "@/lib/legal";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return LEGAL.map((page) => ({ slug: page.slug }));
}

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
          Last changed {spec.changed}. Anything wrong or missing:{" "}
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
