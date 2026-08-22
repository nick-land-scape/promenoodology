/**
 * Small line marks for the headings.
 *
 * Not decoration: on a screen that is one column of headings and rows, a mark
 * beside a heading is what lets a thumb find "your photographs" without reading
 * every line above it. So there is one per kind of thing and no more — a plate, a
 * camera, a speech bubble, a calendar, a book, a hand — and they are drawn in the
 * same hairline weight as everything else here, at the size of a capital letter.
 *
 * Deliberately hand-drawn paths rather than an icon package: six shapes do not
 * justify a dependency, and a set that matches this app's line weight does not
 * exist in one anyway.
 */
export type MarkName =
  | "calendar"
  | "news"
  | "book"
  | "plate"
  | "camera"
  | "speech"
  | "hand"
  | "tick"
  | "map";

const PATHS: Record<MarkName, React.ReactNode> = {
  calendar: (
    <>
      <rect x="2.5" y="4" width="15" height="13.5" rx="1.5" />
      <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" />
    </>
  ),
  news: (
    <>
      <path d="M3 5.5h10.5v11H4.5A1.5 1.5 0 0 1 3 15z" />
      <path d="M13.5 8h2.5a1 1 0 0 1 1 1v6a1.5 1.5 0 0 1-3 1.5" />
      <path d="M5.5 8.5h5.5M5.5 11h5.5M5.5 13.5h3.5" />
    </>
  ),
  book: (
    <>
      <path d="M10 5.5C8.5 4 6 3.5 3 4v11c3-.5 5.5 0 7 1.5 1.5-1.5 4-2 7-1.5V4c-3-.5-5.5 0-7 1.5z" />
      <path d="M10 5.5v11" />
    </>
  ),
  plate: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <circle cx="10" cy="10" r="4" />
    </>
  ),
  camera: (
    <>
      <path d="M2.5 7.5h3l1.5-2h6l1.5 2h3v9h-15z" />
      <circle cx="10" cy="11.5" r="3" />
    </>
  ),
  speech: (
    <>
      <path d="M3 5.5h14v8.5H8l-4 3.5v-3.5H3z" />
      <path d="M6.5 8.5h7M6.5 11h4.5" />
    </>
  ),
  hand: (
    <>
      <path d="M7 9V4.5a1.5 1.5 0 0 1 3 0V9" />
      <path d="M10 9V5.5a1.5 1.5 0 0 1 3 0V10" />
      <path d="M13 10V7.5a1.5 1.5 0 0 1 3 0v6a4.5 4.5 0 0 1-4.5 4.5H10a5 5 0 0 1-5-5V10a1.5 1.5 0 0 1 2 -1.4" />
    </>
  ),
  tick: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M6.5 10.5l2.5 2.5 4.5-5" />
    </>
  ),
  map: (
    <>
      <path d="M10 17.5s5.5-5.2 5.5-9a5.5 5.5 0 0 0-11 0c0 3.8 5.5 9 5.5 9z" />
      <circle cx="10" cy="8.5" r="2" />
    </>
  ),
};

export default function Mark({ is }: { is: MarkName }) {
  return (
    <svg
      className="mark"
      viewBox="0 0 20 20"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[is]}
    </svg>
  );
}
