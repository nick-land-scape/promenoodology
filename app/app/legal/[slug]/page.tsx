import { notFound } from "next/navigation";
import AppHeader from "@/components/app/AppHeader";
import { LEGAL, legalSpec } from "@/lib/legal";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { readingIn, requireMember } from "@/lib/app/me";
import { pretty } from "@/lib/admin/when";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: legalSpec(slug)?.title ?? "In writing" };
}

export async function generateStaticParams() {
  return LEGAL.map((page) => ({ slug: page.slug }));
}

/**
 * The written pages, inside the app.
 *
 * They exist on the website too — the app stores need public addresses for the
 * privacy notice and the support page, and those have to be readable by somebody
 * with no account. But opening the website's copy *from* the app dropped a member
 * into the website: its menu, its footer, its top bar, and four ways to wander off
 * into pages that are already in here under Read. An app that leaks into a website
 * is an app somebody leaves.
 *
 * Same words, from the same file. Only the shell is different: a header with the
 * way back, and no menu at all.
 */
export default async function AppLegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const lang = await readingIn();
  const say = speaking(lang, await getFrench());
  await requireMember("/app/account");
  const { slug } = await params;
  const spec = legalSpec(slug);
  if (!spec) notFound();

  /* The name of the page, from the same phrase the row in the account uses.
   *
   * The four of them are named twice — once in the list you press and once at the
   * top of what opens — and they were reading from two places, so a French member
   * pressed "ce que nous faisons de vos données" and arrived at "what we do with
   * your data". The words underneath are still English until somebody writes the
   * French, which is the same fallback everything else on this site has. */
  const named: Record<string, string> = {
    support: "acc.help",
    privacy: "acc.privacy",
    terms: "acc.terms",
    imprint: "acc.imprint",
  };

  return (
    <>
      <AppHeader eyebrow={say("pg.inWriting")} title={named[spec.slug] ? say(named[spec.slug]) : spec.title} back="/app/account" />

      <div className="app-book">
        <p className="app-book-lead">{spec.lead}</p>

        {spec.parts.map((part, index) =>
          part.heading ? (
            <h2 key={part.heading}>{part.heading}</h2>
          ) : (
            <p key={`${index}-${part.text?.slice(0, 20)}`}>{part.text}</p>
          ),
        )}

        <p className="app-note" style={{ padding: "18px 0 0" }}>
          {say("legal.lastChanged").replace("{when}", pretty(spec.changed, lang))}{" "}
          <a href="mailto:info@promeNOODology.com">info@promeNOODology.com</a>.
        </p>
      </div>
    </>
  );
}
