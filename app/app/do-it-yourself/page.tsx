import Link from "next/link";
import Photo from "@/components/Photo";
import AppHeader from "@/components/app/AppHeader";
import { sharedSheets } from "@/lib/shared";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { readingIn, requireMember } from "@/lib/app/me";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export const metadata = { title: "Do it yourself" };

/**
 * The sheets, in the app.
 *
 * Members get them here rather than being sent to the website — the app does not
 * hand anybody to Safari — and what they get that a visitor does not is the
 * button to pass one on. A sheet a member cannot forward is a leaflet.
 */
export default async function SheetsPage() {
  const say = speaking(await readingIn(), await getFrench());
  await requireMember("/app/do-it-yourself");
  const lang = await readingIn();
  const sheets = await sharedSheets(lang);

  return (
    <>
      <AppHeader
        eyebrow={say("pg.doItYourself")}
        title={say("read.putOneOn")}
        back="/app/read"
      />

      <p className="app-note" style={{ padding: "14px var(--gutter) 4px" }}>
        {say("dsy.oneSheetPer")}
      </p>

      {sheets.length === 0 ? (
        <p className="app-note" style={{ padding: "10px var(--gutter) 20px" }}>
          {say("dsy.beingWritten")}{" "}
          <Link href="/app/read?of=handbook">{say("dsy.readLink")}</Link>{" "}
          {say("dsy.longVersion")}
        </p>
      ) : (
        <ul className="row-list row-list-inset">
          {sheets.map((sheet) => (
            <li key={sheet.slug}>
              <Link className="everywhere-row" href={`/app/do-it-yourself/${sheet.slug}`}>
                {sheet.photo ? (
                  <span className="everywhere-row-shot">
                    <Photo src={sheet.photo} alt="" fill sizes="88px" />
                  </span>
                ) : (
                  <span className="everywhere-row-shot everywhere-row-none" aria-hidden="true" />
                )}
                <span className="everywhere-row-words">
                  <span className="row-title">{sheet.title}</span>
                  {sheet.hook ? (
                    <span className="everywhere-row-hook">{sheet.hook}</span>
                  ) : null}
                  <span className="row-meta">
                    {[
                      sheet.steps.length ? `${sheet.steps.length} steps` : null,
                      sheet.needs.length ? `${sheet.needs.length} things to find` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
