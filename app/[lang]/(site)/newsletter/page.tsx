import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import NewsletterForm from "@/components/NewsletterForm";
import { isLang, PLAIN, type Lang } from "@/lib/lang";
import { pageMetadata, say, type Bilingual } from "@/lib/seo";
import { pageIsVisible } from "@/lib/site-pages";
import { getPageHead } from "@/lib/source";

const TITLE: Bilingual = { en: "Newsletter", fr: "La lettre" };
const ABOUT: Bilingual = {
  en: "A short letter when there is something to come to. Nothing else.",
  fr: "Une courte lettre quand il y a quelque chose où venir. Rien d’autre.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const head = await getPageHead("newsletter", lang);

  return pageMetadata({
    lang,
    path: "/newsletter",
    title: head.title || say(lang, TITLE),
    description: head.lead || say(lang, ABOUT),
  });
}

export default async function NewsletterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: asked } = await params;
  const lang = isLang(asked) ? asked : PLAIN;

  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("newsletter"))) notFound();

  const head = await getPageHead("newsletter", lang);

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">{head.title || "keep in touch"}</h1>
        {head.saved ? (
          head.lead ? <p className="page-intro">{head.lead}</p> : null
        ) : (
          <p className="page-intro">
            A short letter when there is something to come to, and nothing in between. No
            membership, no fee, and you can ask us to take you off the list at any time.
          </p>
        )}

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
