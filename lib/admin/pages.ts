/**
 * Every page of the site, and what there is to change about it.
 *
 * All of them have a heading and a line under it. Two of them — the about
 * statement and the handbook — are also made of words, in blocks whose kind is
 * part of the design: the statement alternates between two voices because that is
 * the design, and the handbook numbers its own headings because that is the
 * design. The rest are made of stories, photographs, quotes and people, and their
 * own contents are looked after in those sections.
 *
 * Neither is a page builder, and neither should become one. What can be changed
 * is what a page says, in how many parts, and in what order.
 *
 * Plain data, so the client editor reads the same description the server does.
 */

export type BlockKind = {
  value: string;
  /** The word in the little chooser on each block. */
  label: string;
  hint: string;
};

export type PageSpec = {
  slug: string;
  name: string;
  blurb: string;
  /** Where it is on the site. */
  view: string;
  /** Does the page show its title, and the line under it? */
  usesTitle: boolean;
  usesLead: boolean;
  /** Is it made of blocks of words, or of something else? */
  kinds: BlockKind[];
  addLabel: string;
  /** What the page is made of, for the pages that are not made of words. */
  madeOf?: string;
};

export const PAGES: PageSpec[] = [
  {
    slug: "stories",
    name: "stories",
    blurb: "The list of stories: the heading, the line under it, and how wide a card may be.",
    view: "/stories",
    usesTitle: true,
    usesLead: true,
    kinds: [],
    addLabel: "",
    madeOf: "The stories themselves are under Stories.",
  },
  {
    slug: "archive",
    name: "the archive",
    blurb: "The wall of photographs and quotes: its heading, and how wide its columns are.",
    view: "/archive",
    usesTitle: true,
    usesLead: true,
    kinds: [],
    addLabel: "",
    madeOf: "What is on the wall is under The archive and Quotes.",
  },
  {
    slug: "community",
    name: "community",
    blurb: "The grid of names. Its heading is read out rather than shown.",
    view: "/community",
    usesTitle: true,
    usesLead: true,
    kinds: [],
    addLabel: "",
    madeOf: "Who is on it is under People.",
  },
  {
    slug: "about",
    name: "about us",
    blurb:
      "The statement, alternating between two voices: a claim set large, then an aside underneath.",
    view: "/about",
    usesTitle: false,
    usesLead: false,
    addLabel: "another part",
    kinds: [
      { value: "loud", label: "loud", hint: "Set large and bold. A claim." },
      { value: "quiet", label: "quiet", hint: "Smaller and in italics. The aside underneath." },
    ],
  },
  {
    slug: "handbook",
    name: "the handbook",
    blurb: "How to put on your own. Headings are numbered 01, 02, 03 in the order they appear.",
    view: "/handbook",
    usesTitle: true,
    usesLead: true,
    addLabel: "another block",
    kinds: [
      { value: "heading", label: "heading", hint: "Numbered automatically." },
      { value: "text", label: "paragraph", hint: "The words under it." },
    ],
  },
  {
    slug: "newsletter",
    name: "newsletter",
    blurb: "The page with the form on it: its heading and the line under it.",
    view: "/newsletter",
    usesTitle: true,
    usesLead: true,
    kinds: [],
    addLabel: "",
    madeOf: "Who is on the list is under Newsletter.",
  },
  {
    slug: "donations",
    name: "public bank account",
    blurb: "The wall of gifts: its heading and the line under it. Still no total, on purpose.",
    view: "/donations",
    usesTitle: true,
    usesLead: true,
    kinds: [],
    addLabel: "",
    madeOf: "The gifts themselves are under The wall.",
  },
];

export function pageSpec(slug: string): PageSpec | undefined {
  return PAGES.find((page) => page.slug === slug);
}
