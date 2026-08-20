import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SupportForm from "@/components/SupportForm";
import { getPage, getPageHead } from "@/lib/source";
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

  const [handbook, head] = await Promise.all([getPage("handbook"), getPageHead("handbook")]);
  if (!handbook) notFound();

  return (
    <main className="page">
      <h1 className="page-title">{handbook.title}</h1>
      {handbook.lead ? <p className="page-intro">{handbook.lead}</p> : null}

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
    </main>
  );
}

/** Numbers the headings 01, 02, 03 … in the order they appear. */
function number(blocks: { kind: string }[], index: number) {
  const position = blocks.slice(0, index + 1).filter((block) => block.kind === "heading").length;
  return String(position).padStart(2, "0");
}
