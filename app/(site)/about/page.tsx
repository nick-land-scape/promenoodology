import type { Metadata } from "next";
import Link from "next/link";
import { getPage } from "@/lib/source";

export const metadata: Metadata = {
  title: "About us",
  description:
    "promeNOODology empowers local communities to build social and environmental resilience through active engagement and negotiation with their immediate surroundings.",
  alternates: { canonical: "/about" },
};

/** Used until the database has a page of its own; the shape is the same. */
const STATEMENT = [
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
];

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function AboutPage() {
  const page = await getPage("about");
  const statement = page?.blocks.length ? page.blocks : STATEMENT;

  return (
    <main className="page">
      <h1 className="visually-hidden">About us</h1>

      <div className="statement">
        {statement.map((part, index) => (
          <p key={index} className={`statement-${part.kind}`}>
            {part.text}
          </p>
        ))}

        <div className="statement-actions">
          <Link className="join-primary" href="/join">
            become a member →
          </Link>
          <Link className="join-secondary" href="/handbook">
            or put on your own — the handbook →
          </Link>
        </div>
      </div>
    </main>
  );
}
