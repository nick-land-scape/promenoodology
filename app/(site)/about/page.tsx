import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About us",
  description:
    "promeNOODology empowers local communities to build social and environmental resilience through active engagement and negotiation with their immediate surroundings.",
  alternates: { canonical: "/about" },
};

/** The statement, in three voices: a claim, an aside, and a promise. */
const STATEMENT = [
  {
    style: "loud",
    text: "promeNOODology empowers local communities to build social and environmental resilience through active engagement and negotiation with their immediate surroundings.",
  },
  {
    style: "quiet",
    text: "We encourage people to participate in the transformation of their local environments, fostering a culture where failure is seen as a learning opportunity and interdependencies are embraced within a resource-rich ecosystem.",
  },
  {
    style: "loud",
    text: "promeNOODology offers accessible and repeatable experiences designed to disrupt the ordinary.",
  },
  {
    style: "quiet",
    text: "Together, we create enjoyable scenarios that highlight individual dependencies and collective resources, promoting a sense of community and shared purpose.",
  },
];

export default function AboutPage() {
  return (
    <main className="page">
      <h1 className="visually-hidden">About us</h1>

      <div className="statement">
        {STATEMENT.map((part, index) => (
          <p key={index} className={`statement-${part.style}`}>
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
