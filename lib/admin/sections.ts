/**
 * Everything the back of the house can look after, in the order it is offered.
 *
 * Plain data with no JSX in it, so both the menu (a client component) and the
 * dashboard (a server one) can read the same list. Adding a section here puts
 * it in the menu and on the dashboard at once.
 *
 * The headings are about what a thing *is*, not where it ends up. "The website"
 * and "the app" was the wrong cut: stories are written once and read in both,
 * and anybody looking for them had to remember which half we had filed them
 * under. What you actually come here to do is write something, or look after a
 * pile of material, or see who is on the other end — so those are the headings.
 */

export type Section = {
  href: string;
  /** The word in the menu. */
  label: string;
  /** The line on the dashboard card. */
  blurb: string;
  /** One of the shapes in components/admin/ui.tsx. */
  icon: string;
  /** Which heading in the menu it sits under. */
  group: "content" | "material" | "wall" | "community" | "post" | "settings" | "site";
  /** The page on the public site this looks after, if there is one. */
  view?: string;
};

export const SECTIONS: Section[] = [
  {
    href: "/admin/stories",
    label: "stories",
    blurb: "What we did, one story each — the text, and what carries the photographs.",
    icon: "stories",
    group: "content",
    view: "/stories",
  },
  {
    href: "/admin/pages",
    label: "pages",
    blurb:
      "Which pages are on the site at all, what the menu calls them, and what each one says — including the handbook, page by page, and the sheets.",
    icon: "pages",
    group: "site",
  },
  {
    href: "/admin/news",
    label: "news",
    blurb: "Short notes on the app's front screen.",
    icon: "news",
    group: "content",
    view: "/app",
  },
  {
    href: "/admin/events",
    label: "events",
    blurb:
      "The evenings: when and where, the days a long one runs, and the page each of them has.",
    icon: "calendar",
    group: "content",
    view: "/app",
  },


  {
    href: "/admin/photos",
    label: "archive",
    blurb: "Every photograph: who took it, which year, which story it belongs to.",
    icon: "photos",
    group: "material",
    view: "/archive",
  },
  {
    href: "/admin/quotes",
    label: "quotes",
    blurb: "The things people said, and where they sit in the archive.",
    icon: "quote",
    group: "material",
    view: "/archive",
  },

  {
    href: "/admin/donations",
    label: "the wall",
    blurb: "Who put something in. No total, on purpose.",
    icon: "wall",
    group: "wall",
    view: "/donations",
  },

  {
    href: "/admin/people",
    label: "people",
    blurb:
      "Everybody: the community page and the accounts, one list. Write somebody down, or invite them.",
    icon: "people",
    group: "community",
    view: "/community",
  },
  {
    href: "/admin/associations",
    label: "partners",
    blurb: "The people we do this with who are not people: a name and a logo.",
    icon: "partners",
    group: "community",
    view: "/community",
  },

  {
    href: "/admin/requests",
    label: "requests",
    blurb: "Anybody asking us for a hand with something of their own.",
    icon: "inbox",
    group: "post",
  },
  {
    href: "/admin/ideas",
    label: "ideas",
    blurb:
      "What members think the club should do, most agreed-with first — and the answer, which is yours to write.",
    icon: "inbox",
    group: "post",
  },
  {
    href: "/admin/reports",
    label: "reported",
    blurb:
      "What members have reported, and what the screening was not sure about — with the pictures, so somebody can actually judge it.",
    icon: "inbox",
    group: "post",
  },
  {
    href: "/admin/feedback",
    label: "what people said",
    blurb: "Bugs, ideas and words sent from inside the app.",
    icon: "inbox",
    group: "post",
  },
  {
    href: "/admin/newsletter",
    label: "newsletter",
    blurb: "Who wants to hear when there is something to come to.",
    icon: "letter",
    group: "post",
  },

  {
    href: "/admin/changes",
    label: "what changed",
    blurb: "Who changed what, and when. Written by the database, not by these pages.",
    icon: "news",
    group: "settings",
  },
  {
    href: "/admin/bin",
    label: "the bin",
    blurb: "Everything deleted in the last thirty days, and the day each one goes for good.",
    icon: "trash",
    group: "settings",
  },
  {
    href: "/admin/settings",
    label: "settings",
    blurb: "The typefaces and the colours the whole site is drawn with — and whether anything is broken.",
    icon: "theme",
    group: "settings",
  },
];

export const GROUPS: { key: Section["group"]; label: string }[] = [
  { key: "content", label: "content" },
  { key: "material", label: "resources" },
  // Its own heading. It sat under "resources" beside the archive and the quotes,
  // and it is not one: those are material a story is made of, and this is a list
  // of people who gave money.
  { key: "wall", label: "the wall" },
  { key: "community", label: "community" },
  // Everything that arrives from outside rather than being written here.
  { key: "post", label: "the post" },
  { key: "settings", label: "settings" },
];

/*
 * "site" is deliberately not in the list above.
 *
 * It holds one thing — pages — and it is drawn at the top of the menu directly
 * under "everything", with no heading of its own: those two answer the same
 * question from two sides, what the site has on it and what shape it is
 * arranged in. Neither is a kind of content, so neither belongs under one of
 * the headings below them. See components/admin/Shell.
 */

/**
 * What is under a heading, in alphabetical order.
 *
 * The order used to be the order they happened to be written down in, which is
 * an order only the person who wrote it knows. Alphabetical is the one order
 * anybody can predict — you look for "events" where the e's are.
 */
export function sectionsIn(group: Section["group"]) {
  return SECTIONS.filter((section) => section.group === group).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

/**
 * The page on the site that whatever you are editing shows up on.
 *
 * Used by the strip along the top, which is where "look at it" now lives — it
 * used to be a button in every section's own header, which meant every section
 * had to remember to pass it, and the two that forgot simply had no way out to
 * the front of the house.
 */
export function viewFor(pathname: string): string | undefined {
  // A story has its own address on the site, so it gets its own answer rather
  // than the whole list of them.
  const story = /^\/admin\/stories\/([^/]+)$/.exec(pathname);
  if (story) return `/stories/${story[1]}`;

  const page = /^\/admin\/pages\/([^/]+)$/.exec(pathname);
  if (page) return `/${page[1] === "home" ? "" : page[1]}`;

  // The longest match wins, so /admin/photos does not answer for /admin/people.
  const match = SECTIONS.filter((section) => pathname.startsWith(section.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];

  return match?.view;
}
