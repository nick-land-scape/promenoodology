import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SupportForm from "@/components/SupportForm";
import QuoteThis from "@/components/QuoteThis";
import Handbook from "@/components/Handbook";
import { getHandbookPages, getPage, getPageHead } from "@/lib/source";
import { siteUrl } from "@/lib/site";
import { pageIsVisible } from "@/lib/site-pages";

export const metadata: Metadata = {
  title: "Handbook",
  description:
    "How to put on something like ours in your own street — and how to ask us for help, including money.",
  alternates: { canonical: "/handbook" },
};

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function HandbookPage() {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("handbook"))) notFound();

  const [handbook, head, leaves] = await Promise.all([
    getPage("handbook"),
    getPageHead("handbook"),
    getHandbookPages(),
  ]);
  if (!handbook) notFound();

  /* A book, unless somebody has said otherwise, or unless there is not enough of
     it to be one. Turning it off in /admin gives back the column of words this
     page always was — see the note in the settings about why that switch is
     there at all. */
  const asABook = head.settings.asABook !== false && leaves.length > 1;

  return (
    <main className="page">
      <h1 className="page-title">{handbook.title}</h1>
      {handbook.lead ? <p className="page-intro">{handbook.lead}</p> : null}

      {asABook ? (
        <Handbook
          leaves={leaves}
          title={handbook.title}
          paper={String(head.settings.bookPaper ?? "site")}
          numbers={head.settings.bookNumbers !== false}
          offerSound={head.settings.bookSound !== false}
        />
      ) : (
        <div className="handbook">
          {handbook.blocks.map((block, index) =>
            block.kind === "heading" ? (
              <h2 key={index} className="handbook-heading">
                <span className="handbook-number">{number(handbook.blocks, index)}</span>
                {block.text}
              </h2>
            ) : (
              <p key={index} className="handbook-text">
                {block.text}
              </p>
            ),
          )}
        </div>
      )}

      {/* Straight after the method, before the offer of help: the sheets.
          Somebody who has read this far has already asked "could I do this", and
          the sheets are the version of the answer they can take away and hand to
          somebody else. */}
      <section className="handbook-sheets">
        <h2 className="page-title" style={{ fontSize: "1.6rem" }}>
          or take a sheet
        </h2>
        <p className="page-intro">
          One page per kind of place — a square, a car park, a courtyard — with what
          it takes and what to do in what order. No account and nothing to join:{" "}
          <Link href="/do-it-yourself">do it yourself</Link>.
        </p>
      </section>

      {/* The whole section can be taken away in /admin — heading, form and all.
          The handbook above it is the page; this is an invitation, and there are
          weeks when we are not in a position to make it. */}
      {head.settings.showForm ? (
        <section className="handbook-apply" id="apply">
          <h2 className="page-title" style={{ fontSize: "1.6rem" }}>
            {String(head.settings.formTitle)}
          </h2>
          {String(head.settings.formIntro)
            .split("\n")
            .filter((line) => line.trim())
            .map((line, index) => (
              <p key={index} className="page-intro">
                {line}
              </p>
            ))}
          <SupportForm />
          <p className="page-note">
            Already know people who would come? Send them to the{" "}
            <Link href="/newsletter">newsletter</Link>, and they will hear about the next one.
          </p>
        </section>
      ) : null}
    
      {/* The same offer as on a story: the moment somebody takes the words is
          the moment to hand them the source. */}
      <QuoteThis title={head.title || "the handbook"} url={siteUrl("/handbook")} />
</main>
  );
}

/** Numbers the headings 01, 02, 03 … in the order they appear. */
function number(blocks: { kind: string }[], index: number) {
  const position = blocks.slice(0, index + 1).filter((block) => block.kind === "heading").length;
  return String(position).padStart(2, "0");
}
