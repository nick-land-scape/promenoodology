/**
 * Everything the back of the house can look after, in the order it is offered.
 *
 * Plain data with no JSX in it, so both the menu (a client component) and the
 * dashboard (a server one) can read the same list. Adding a section here puts
 * it in the menu and on the dashboard at once.
 */

export type Section = {
  href: string;
  /** The word in the menu. */
  label: string;
  /** The line on the dashboard card. */
  blurb: string;
  /** One of the shapes in components/admin/ui.tsx. */
  icon: string;
  /** Which half of the menu it belongs to. */
  group: "site" | "app" | "people";
  /** The page on the public site this looks after, if there is one. */
  view?: string;
};

export const SECTIONS: Section[] = [
  {
    href: "/admin/stories",
    label: "stories",
    blurb: "What we did, one story each — the text, and what carries the photographs.",
    icon: "stories",
    group: "site",
    view: "/stories",
  },
  {
    href: "/admin/photos",
    label: "the archive",
    blurb: "Every photograph: who took it, which year, which story it belongs to.",
    icon: "photos",
    group: "site",
    view: "/resources",
  },
  {
    href: "/admin/quotes",
    label: "quotes",
    blurb: "The things people said, and where they sit in the archive.",
    icon: "quote",
    group: "site",
    view: "/resources",
  },
  {
    href: "/admin/pages",
    label: "pages",
    blurb: "Which pages are on the site at all, what the menu calls them — and the words on the two that have any.",
    icon: "pages",
    group: "site",
  },
  {
    href: "/admin/donations",
    label: "the wall",
    blurb: "Who put something in. No total, on purpose.",
    icon: "wall",
    group: "site",
    view: "/donations",
  },
  {
    href: "/admin/events",
    label: "what's on",
    blurb: "The evenings in the members' app: date, place, how many can come.",
    icon: "calendar",
    group: "app",
    view: "/app",
  },
  {
    href: "/admin/news",
    label: "news",
    blurb: "Short notes on the app's front screen.",
    icon: "news",
    group: "app",
    view: "/app",
  },
  {
    href: "/admin/people",
    label: "people",
    blurb: "The community list: names, countries, who is shown, who may look after the site.",
    icon: "people",
    group: "people",
    view: "/community",
  },
  {
    href: "/admin/requests",
    label: "requests",
    blurb: "Anybody asking us for a hand with something of their own.",
    icon: "inbox",
    group: "people",
  },
  {
    href: "/admin/newsletter",
    label: "newsletter",
    blurb: "Who wants to hear when there is something to come to.",
    icon: "letter",
    group: "people",
  },
];

export const GROUPS: { key: Section["group"]; label: string }[] = [
  { key: "site", label: "the website" },
  { key: "app", label: "the app" },
  { key: "people", label: "people" },
];

export function sectionsIn(group: Section["group"]) {
  return SECTIONS.filter((section) => section.group === group);
}
