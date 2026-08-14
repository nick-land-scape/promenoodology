import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About us",
  description:
    "promeNOODology empowers local communities to build social and environmental resilience through active engagement and negotiation with their immediate surroundings.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="page page-centred">
      <h1 className="visually-hidden">About us</h1>
      <div className="prose">
        <p>
          promeNOODology empowers local communities to build social and environmental resilience
          through active engagement and negotiation with their immediate surroundings.
        </p>
        <p>
          We encourage people to participate in the transformation of their local environments,
          fostering a culture where failure is seen as a learning opportunity and interdependencies
          are embraced within a resource-rich ecosystem.
        </p>
        <p>
          promeNOODology offers accessible and repeatable experiences designed to disrupt the
          ordinary. Together, we create enjoyable scenarios that highlight individual dependencies
          and collective resources, promoting a sense of community and shared purpose.
        </p>
      </div>
    </main>
  );
}
