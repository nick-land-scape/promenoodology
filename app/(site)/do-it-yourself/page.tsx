import type { Metadata } from "next";
import Link from "next/link";
import Photo from "@/components/Photo";
import { getSheets } from "@/lib/source";

export const metadata: Metadata = {
  title: "Do it yourself",
  description:
    "One sheet per kind of place — a square, a car park, a courtyard — with what it takes, what to do, and a photograph of it working. No account, no permission.",
  alternates: { canonical: "/do-it-yourself" },
};

export const revalidate = 60;

/**
 * The invitation, made passable.
 *
 * Everything else on this site says what we did. This says what you could do,
 * one page per kind of place, and it is the only part of the whole thing written
 * in the second person. No account and no login anywhere near it: a sheet you
 * cannot hand to somebody is not an invitation, it is a brochure.
 */
export default async function DoItYourselfPage() {
  const sheets = await getSheets();

  return (
    <main className="page">
      <h1 className="page-title">do it yourself</h1>
      <p className="page-intro">
        Nothing here is ours to keep. Pick the kind of place you have — a square, a
        car park, a courtyard, a verge nobody looks at — and take the sheet: what it
        takes, what to do in what order, and a photograph of it having worked
        somewhere else. Then tell us how it went, or do not, and put one on anyway.
      </p>

      {sheets.length === 0 ? (
        <p className="page-intro">
          The first sheets are being written. In the meantime the{" "}
          <Link href="/handbook">handbook</Link> is the long version of the same
          thing.
        </p>
      ) : (
        <ul className="sheets">
          {sheets.map((sheet) => (
            <li key={sheet.slug}>
              <Link className="sheet-card" href={`/do-it-yourself/${sheet.slug}`}>
                {sheet.photo ? (
                  <span className="sheet-card-shot">
                    <Photo src={sheet.photo} alt="" width={900} height={600} sizes="(max-width: 700px) 100vw, 460px" />
                  </span>
                ) : null}
                <span className="sheet-card-words">
                  <span className="sheet-card-title">{sheet.title}</span>
                  {sheet.hook ? <span className="story-hook">{sheet.hook}</span> : null}
                  <span className="sheet-card-count">
                    {[
                      sheet.steps.length ? `${sheet.steps.length} steps` : null,
                      sheet.needs.length ? `${sheet.needs.length} things` : null,
                      sheet.fed ? `fed about ${sheet.fed}` : null,
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
    </main>
  );
}
