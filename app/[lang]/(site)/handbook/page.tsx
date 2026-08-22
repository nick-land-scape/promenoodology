import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SupportForm from "@/components/SupportForm";
import QuoteThis from "@/components/QuoteThis";
import Handbook from "@/components/Handbook";
import Linked from "@/components/Linked";
import { getFrench, getHandbookPages, getPage, getPageHead } from "@/lib/source";
import { speaking } from "@/lib/words";
import { siteUrl } from "@/lib/site";
import { at, isLang, PLAIN, type Lang } from "@/lib/lang";
import { pageMetadata, say as pick, type Bilingual } from "@/lib/seo";
import { pageIsVisible } from "@/lib/site-pages";

const TITLE: Bilingual = { en: "Handbook", fr: "Le manuel" };
const ABOUT: Bilingual = {
  en: "How to put on something like ours in your own street — and how to ask us for help, including money.",
  fr: "Comment organiser quelque chose comme le nôtre dans votre propre rue — et comment nous demander un coup de main, y compris de l’argent.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const head = await getPageHead("handbook", lang);

  return pageMetadata({
    lang,
    path: "/handbook",
    title: head.title || pick(lang, TITLE),
    description: head.lead || pick(lang, ABOUT),
  });
}

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function HandbookPage({ params }: { params: Promise<{ lang: string }> }) {
  // Turned off in /admin means gone from here too, not just out of the menu.
  if (!(await pageIsVisible("handbook"))) notFound();

  const { lang: asked } = await params;
  const lang = isLang(asked) ? asked : PLAIN;

  const [handbook, head, leaves, french] = await Promise.all([
    getPage("handbook", lang),
    getPageHead("handbook", lang),
    getHandbookPages(lang),
    getFrench(),
  ]);
  const say = speaking(lang, french);
  if (!handbook) notFound();

  /*
   * One handbook, shown two ways.
   *
   * It used to be two handbooks: a flat list of blocks on the page row for the
   * column, and pages of their own for the book — so turning the switch changed
   * not only how it looked but *what it said*, and anything written since the
   * book arrived simply was not there in the column. The writing is the pages,
   * always; this switch decides whether they are turned or read straight
   * through.
   */
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
          words={{
            cover: say("book.theCover"),
            of: say("book.of"),
            soundOn: say("book.soundOn"),
            soundOff: say("book.soundOff"),
            before: say("book.pageBefore"),
            after: say("book.nextPage"),
          }}
        />
      ) : (
        <div className="handbook">
          {/* The same pages, one after another. A page of a book is where a
              reader would have turned anyway, so read straight through it is
              simply where the headings fall. */}
          {leaves
            .flatMap((leaf) => leaf.blocks)
            .map((block, index, all) =>
              block.kind === "heading" ? (
                <h2 key={index} className="handbook-heading">
                  <span className="handbook-number">{number(all, index)}</span>
                  {block.text}
                </h2>
              ) : (
                <p key={index} className="handbook-text">
                  <Linked>{block.text}</Linked>
                </p>
              ),
            )}
        </div>
      )}

      {/* Straight after the method, before the offer of help: the sheets.
          Somebody who has read this far has already asked "could I do this", and
          the sheets are the version of the answer they can take away and hand to
          somebody else.

          Taken away as a whole in /admin, like the form under it: there are
          weeks when what we have to offer is one of these and not the other. */}
      {head.settings.showSheets !== false ? (
      <section className="handbook-sheets">
        <h2 className="page-title" style={{ fontSize: "1.6rem" }}>
          or take a sheet
        </h2>
        <p className="page-intro">
          One page per kind of place — a square, a car park, a courtyard, a queue —
          for getting people who do not know each other into the same place and
          giving them something to do together. No account and nothing to join:{" "}
          <Link href={at(lang, "/do-it-yourself")}>do it yourself</Link>.
        </p>
      </section>
      ) : null}

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
