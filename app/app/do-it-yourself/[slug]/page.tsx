import { notFound } from "next/navigation";
import Photo from "@/components/Photo";
import AppHeader from "@/components/app/AppHeader";
import HandItOn from "@/components/app/HandItOn";
import { siteUrl } from "@/lib/site";
import { getFrench, getSheet } from "@/lib/source";
import { speaking } from "@/lib/words";
import { readingIn, requireMember } from "@/lib/app/me";

export const revalidate = 60;

/**
 * One sheet, in the app, with the button that matters on it.
 *
 * The same words as the public page — one query, one set of steps — and the one
 * thing that is only here: hand it on. Everything a member does in this app is
 * for people already inside it; this is the single screen whose purpose is
 * somebody who is not.
 */
export default async function AppSheetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const say = speaking(await readingIn(), await getFrench());
  const { slug } = await params;
  await requireMember(`/app/do-it-yourself/${slug}`);
  const lang = await readingIn();
  const sheet = await getSheet(slug, lang);
  if (!sheet) notFound();

  const where = siteUrl(`/do-it-yourself/${sheet.slug}`);

  return (
    <>
      <AppHeader
        eyebrow={say("pg.doItYourself")}
        title={sheet.title}
        back="/app/do-it-yourself"
      />

      {sheet.hook ? <p className="app-sheet-hook">{sheet.hook}</p> : null}

      {sheet.photo ? (
        <span className="app-sheet-shot">
          <Photo src={sheet.photo} alt="" width={1400} height={933} sizes="100vw" />
        </span>
      ) : null}

      {sheet.words ? <p className="app-sheet-words">{sheet.words}</p> : null}

      {sheet.needs.length > 0 ? (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">{say("dsy.whatItTakes")}</h2>
            <span className="app-label">{sheet.needs.length}</span>
          </div>
          <ul className="app-sheet-needs">
            {sheet.needs.map((thing) => (
              <li key={thing}>{thing}</li>
            ))}
          </ul>
          <p className="app-note">
            {say("dsy.borrowed")}
          </p>
        </section>
      ) : null}

      {sheet.steps.length > 0 ? (
        <section className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">{say("dsy.whatToDo")}</h2>
            <span className="app-label">{sheet.steps.length}</span>
          </div>
          <ol className="app-sheet-steps">
            {sheet.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="app-section">
        <div className="app-section-head">
          <h2 className="app-h2">{say("dsy.handItOn")}</h2>
        </div>
        <p className="app-note">
          {sheet.fed
            ? say("dsy.aboutHowMany").replace("{n}", String(sheet.fed))
            : say("dsy.somebodyKnows")}
        </p>
        <HandItOn title={sheet.title} where={where} />
      </section>
    </>
  );
}
