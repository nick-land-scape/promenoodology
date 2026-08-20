/**
 * The two pages whose words are edited but whose shape is fixed.
 *
 * Neither is a free-form page builder, and neither should become one: the about
 * statement alternates between two voices because that is the design, and the
 * handbook numbers its own headings 01, 02, 03 because that is the design. What
 * can be changed is what they say, in how many parts, and in what order.
 *
 * Plain data, so the client editor can read the same description the server does.
 */

export type BlockKind = {
  value: string;
  /** The word in the little chooser on each block. */
  label: string;
  hint: string;
};

export type PageSpec = {
  slug: "about" | "handbook";
  name: string;
  blurb: string;
  /** Where it is on the site. */
  view: string;
  /** Does the page show the title and lead, or only the blocks? */
  usesTitle: boolean;
  usesLead: boolean;
  kinds: BlockKind[];
  addLabel: string;
};

export const PAGES: PageSpec[] = [
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
];

export function pageSpec(slug: string): PageSpec | undefined {
  return PAGES.find((page) => page.slug === slug);
}
