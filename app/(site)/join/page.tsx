import type { Metadata } from "next";
import Link from "next/link";
import { getMembers } from "@/lib/source";

export const metadata: Metadata = {
  title: "Become a member",
  description:
    "There is no list to get on and nothing to pay. Turn up once and you are part of it.",
  alternates: { canonical: "/join" },
};

const STEPS = [
  {
    title: "Turn up to something",
    text: "Any of it. You do not have to bring anything, know anybody, or be able to cook. Standing next to somebody peeling potatoes counts as taking part.",
  },
  {
    title: "Tell us your name",
    text: "Write to us, or say it out loud on the evening. That is the whole application. We add you to the community list with where you are from, and a photo if you want one there.",
  },
  {
    title: "Come back, or do your own",
    text: "Membership is just the second visit. If you would rather run something where you live, the handbook is yours and we can help pay for it.",
  },
];

// A page may serve a cached copy for a minute before asking the database again.
export const revalidate = 60;

export default async function JoinPage() {
  const members = await getMembers();

  return (
    <main className="page">
      <h1 className="page-title">become a member</h1>
      <p className="page-intro">
        Like a members’ club, without the members’ club. Nothing to pay, nobody to impress, no
        waiting list — {members.length} of us so far, and the only requirement is that you turn up
        once.
      </p>

      <ol className="join-steps">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <span className="join-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="join-body">
              <span className="join-title">{step.title}</span>
              <span className="join-text">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>

      <section className="join-actions">
        <a className="join-primary" href="mailto:info@promeNOODology.com?subject=I%20would%20like%20to%20join">
          write to us →
        </a>
        <Link className="join-secondary" href="/community">
          see who is already here →
        </Link>
      </section>

      <section className="page-outro">
        <p>
          Being a member means your name is on the{" "}
          <Link href="/community">community page</Link>, you hear about what is coming up first, and
          you can borrow the pots. It does not mean you owe us anything.
        </p>
        <p>
          If you would like to support the club instead of, or as well as, coming along, everything
          people have put in is on <Link href="/donations">the wall</Link>.
        </p>
      </section>
    </main>
  );
}
