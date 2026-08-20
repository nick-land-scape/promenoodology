import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPage } from "@/lib/source";
import { pageIsVisible } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "About us",
  description:
    "promeNOODology empowers local communities to build social and environmental resilience through active engagement and negotiation with their immediate surroundings.",
  alternates: { canonical: "/about" },
};

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function AboutPage() {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("about"))) notFound();

  // Whatever the back of the house has saved, or the statement the site shipped
  // with — getPage falls back to it, so this is never empty.
  const page = await getPage("about");
  const statement = page?.blocks ?? [];

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
          <Link className="join-primary" href="/newsletter">
            hear when something is on →
          </Link>
          <Link className="join-secondary" href="/handbook">
            or put on your own — the handbook →
          </Link>
        </div>
      </div>
    </main>
  );
}
