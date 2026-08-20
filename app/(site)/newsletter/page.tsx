import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import NewsletterForm from "@/components/NewsletterForm";
import { pageIsVisible } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "A short letter when there is something to come to. Nothing else.",
  alternates: { canonical: "/newsletter" },
};

export default async function NewsletterPage() {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("newsletter"))) notFound();

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">keep in touch</h1>
        <p className="page-intro">
          A short letter when there is something to come to, and nothing in between. No membership,
          no fee, and you can ask us to take you off the list at any time.
        </p>

        <NewsletterForm />

        <p className="auth-switch">
          You can also just look at the <Link href="/community">people</Link>, read the{" "}
          <Link href="/stories">stories</Link>, or write to{" "}
          <a href="mailto:info@promeNOODology.com">info@promeNOODology.com</a>.
        </p>
      </div>
    </main>
  );
}
