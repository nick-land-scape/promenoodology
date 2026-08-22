import Link from "next/link";
import Photo from "@/components/Photo";
import AppHeader from "@/components/app/AppHeader";
import { requireMember } from "@/lib/app/me";
import { getSheets } from "@/lib/source";

export const metadata = { title: "Do it yourself" };

/* The same minute of cache the rest of the reading gets: these are the same words
   for everybody. */
export const revalidate = 60;

/**
 * The sheets, in the app.
 *
 * Members get them here rather than being sent to the website — the app does not
 * hand anybody to Safari — and what they get that a visitor does not is the
 * button to pass one on. A sheet a member cannot forward is a leaflet.
 */
export default async function SheetsPage() {
  await requireMember("/app/do-it-yourself");
  const sheets = await getSheets();

  return (
    <>
      <AppHeader eyebrow="do it yourself" title="put one on yourself" back="/app/read" />

      <p className="app-note" style={{ padding: "14px var(--gutter) 4px" }}>
        One sheet per kind of place. What it takes, what to do in what order, and a
        photograph of it having worked somewhere else — at an address anybody can
        open without an account, so you can send it to whoever has the courtyard.
      </p>

      {sheets.length === 0 ? (
        <p className="app-note" style={{ padding: "10px var(--gutter) 20px" }}>
          The first sheets are being written. The handbook under{" "}
          <Link href="/app/read?of=handbook">read</Link> is the long version in the
          meantime.
        </p>
      ) : (
        <ul className="row-list">
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
