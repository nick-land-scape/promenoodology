/**
 * The three pages a club has to have in writing.
 *
 * Here rather than in the database, and that is deliberate: these are not content
 * anybody should be redesigning, and a privacy policy that can be edited by
 * whoever is logged in is a promise nobody is keeping. They are read at build time
 * and they are in the repository, so what the site says about itself has a history
 * anybody can read.
 *
 * The privacy page is accurate rather than boilerplate — it says the actual
 * columns, the actual processor and the actual retention, because that is the only
 * kind of privacy policy worth having and because both app stores ask for one that
 * matches what the app really does.
 *
 * The imprint has gaps, marked as gaps. An imprint is a legal statement of who is
 * behind a website and nobody can invent one: the address and the legal form have
 * to come from whoever is behind it. It is better for the page to say plainly that
 * it is unfinished than for it to make something up.
 */

/** A subheading, or a paragraph. A part is one or the other, never both. */
export type LegalPart = { heading: string; text?: never } | { heading?: never; text: string };

export type LegalSpec = {
  slug: "privacy" | "imprint" | "terms";
  title: string;
  lead: string;
  changed: string;
  parts: LegalPart[];
};

/** Filled in once the details are known; until then the page says so. */
const GAP = "— still to be filled in —";

export const LEGAL: LegalSpec[] = [
  {
    slug: "privacy",
    title: "what we do with your data",
    lead: "Short, because we do very little with it.",
    changed: "21 August 2026",
    parts: [
      {
        text: "This site keeps as little about you as it can and sells none of it. There is no advertising on it, no tracking across other websites, and nothing here is passed to anybody who wants to sell you something.",
      },
      { heading: "If you only read the site" },
      {
        text: "Nothing is asked of you and nothing is kept. There are no analytics, no cookie banner and no cookies except the one that remembers you are signed in — which only exists once you have signed in.",
      },
      { heading: "If you are on the community page" },
      {
        text: "Your name, the country you said you are from, and a photograph if you gave us one. All three are shown publicly, which is the point of that page, and you can take yourself off it or change any of it from your own profile at any time.",
      },
      { heading: "If you have an account" },
      {
        text: "Your email address, so a code can be sent to it — there are no passwords on this site, so there is nothing about you worth stealing. Your member number and the day you joined. Which evenings you said you would come to, how many of you, and what you said you would bring. Anything you have written in the members' app and the pictures on it.",
      },
      {
        text: "You can see all of it, change most of it and delete the whole lot from the app: your account, then leave the club. That deletes the rows rather than hiding them — the profile, the pictures, the posts and the login itself.",
      },
      { heading: "If you are on the newsletter" },
      {
        text: "Your email address and nothing else, and only after you have answered the note that asks whether you meant it. Every letter has a way off the list in it.",
      },
      { heading: "Who else can see it" },
      {
        text: "The site runs on Vercel and its database and files are with Supabase, whose servers for this project are in the European Union. Both of them are processors: they hold the data so the site can work, and they do nothing else with it. Email is sent through Infomaniak, in Switzerland. Nobody else has access.",
      },
      { heading: "How long" },
      {
        text: "As long as you are one of us, and thirty days after anything is deleted in the back of the house — deleting something puts it in a bin that empties itself, so a mistake can be undone. Photographs of an evening stay in the archive as a record of it unless you ask us to take one down.",
      },
      { heading: "What you can ask for" },
      {
        text: "A copy of everything we hold about you, a correction, or deletion. Write to info@promeNOODology.com and you will hear back from a person. If you would rather complain to somebody else, the data protection authority where you live will take it.",
      },
    ],
  },
  {
    slug: "terms",
    title: "terms and conditions",
    lead: "What you can expect of us, and what we ask of you.",
    changed: "21 August 2026",
    parts: [
      { heading: "What this is" },
      {
        text: "promeNOODology cooks in public. This website is a record of what we have done and a way of telling people what is coming; the members' app is where the people who cook with us arrange it between them.",
      },
      { heading: "Being a member" },
      {
        text: "Membership is free and there is nothing to pay for. An account starts with an invitation from us rather than a form, because the point of it is knowing who is at the table. You can leave whenever you like, from the app, and everything about you goes with you.",
      },
      { heading: "Coming to an evening" },
      {
        text: "Saying yes in the app is saying you intend to be there, not buying a ticket — nothing is charged and nothing is owed. Say so if you cannot come: places are limited by the size of a kitchen, and somebody else would have taken yours.",
      },
      { heading: "What you write and the pictures you put up" },
      {
        text: "They stay yours. You are giving us permission to show them in the app and, where it is about an evening, on this website. Do not put up anything that is not yours to put up, and nothing that would make somebody else unwelcome — we will take down anything that does, and say why.",
      },
      { heading: "Cooking is cooking" },
      {
        text: "We share recipes, methods and the odd unwise idea. You are responsible for what you cook and eat. Tell us about allergies before an evening rather than after it, and if you cannot eat something, say so — that is a much easier conversation than the alternative.",
      },
      { heading: "When something goes wrong" },
      {
        text: "This site is run by people who also have day jobs. It may be down, wrong or out of date. We fix what we can and we would rather hear about it than not: info@promeNOODology.com.",
      },
      { heading: "Which law" },
      {
        text: `Swiss law, and the courts where we are based. ${GAP} — the seat has to be named here.`,
      },
    ],
  },
  {
    slug: "imprint",
    title: "imprint",
    lead: "Who is behind this website.",
    changed: "21 August 2026",
    parts: [
      {
        text: "An imprint has to say who is legally responsible for a website, and that cannot be guessed at. The lines below are the ones that have to be filled in before this page is finished — everything marked is missing rather than withheld.",
      },
      { heading: "Responsible for this site" },
      { text: `promeNOODology, ${GAP} (legal form and registered name)` },
      { text: `${GAP} (street, postcode, town, country)` },
      { text: `${GAP} (the person answerable for the content)` },
      { heading: "Getting in touch" },
      { text: "info@promeNOODology.com — the fastest way, and it reaches a person." },
      { heading: "Register and numbers" },
      { text: `${GAP} (commercial register or association number, and VAT number if there is one)` },
      { heading: "Pictures" },
      {
        text: "The photographs on this site were taken by the people credited beside them in the archive. They are theirs; ask before using one.",
      },
      { heading: "This website" },
      {
        text: "Built by hand, hosted on Vercel, with its database and files at Supabase. Nothing on it tracks you — see what we do with your data.",
      },
    ],
  },
];

export const legalSpec = (slug: string) => LEGAL.find((page) => page.slug === slug);
