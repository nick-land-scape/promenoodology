/**
 * The four tables that are lists of much the same thing: quotes, news, the wall,
 * and what is on in the app.
 *
 * Rather than four editors that drift apart, each is described here — plain data,
 * no JSX — and one editor reads the description. It is also the allowlist the
 * write action checks against: a column that is not named here cannot be
 * written, whatever a browser sends.
 */

export type Column = {
  key: string;
  label: string;
  kind: "text" | "long" | "date" | "number" | "choice" | "story" | "photo";
  hint?: string;
  placeholder?: string;
  /** Take the whole width of the row rather than sitting in the grid. */
  wide?: boolean;
  options?: { value: string; label: string }[];
};

export type TableName = "quotes" | "news" | "donations" | "events";

export type TableSpec = {
  table: TableName;
  /** "a quote", for the buttons. */
  one: string;
  order: { column: string; ascending: boolean };
  columns: Column[];
  /** What a new row starts out as. */
  blank: Record<string, string | number | null>;
  /** Which column stands as the row's name in the list. */
  title: string;
  /** Does this table have a shown/hidden switch? */
  publishable: boolean;
  /**
   * Is a brand-new row on the site straight away?
   *
   * An evening is not: it is being planned, and a half-written date and place
   * in the members' app is worse than nothing. A quote or a note is — they are
   * finished the moment they are typed.
   */
  startsShown: boolean;
};

export const TABLES: Record<TableName, TableSpec> = {
  quotes: {
    table: "quotes",
    one: "a quote",
    order: { column: "created_at", ascending: true },
    title: "text",
    publishable: true,
    startsShown: true,
    blank: { who: "", place: "", year: "", story_tag: null, text: "" },
    columns: [
      {
        key: "text",
        label: "what they said",
        kind: "long",
        wide: true,
        placeholder: "in their own words, no quotation marks needed",
      },
      { key: "who", label: "who said it", kind: "text", placeholder: "a name" },
      { key: "place", label: "where", kind: "text", placeholder: "Sheffield" },
      { key: "year", label: "year", kind: "text", placeholder: "2023" },
      {
        key: "story_tag",
        label: "about which story",
        kind: "story",
        hint: "So it can be filtered to the thing it was said about.",
      },
    ],
  },

  news: {
    table: "news",
    one: "a note",
    order: { column: "published_on", ascending: false },
    title: "title",
    publishable: true,
    startsShown: true,
    blank: { published_on: "", title: "", text: "" },
    columns: [
      { key: "title", label: "title", kind: "text", placeholder: "one line" },
      { key: "published_on", label: "dated", kind: "date" },
      {
        key: "text",
        label: "the note",
        kind: "long",
        wide: true,
        placeholder: "two or three sentences is plenty",
      },
    ],
  },

  donations: {
    table: "donations",
    one: "a gift",
    order: { column: "given_on", ascending: false },
    title: "who",
    publishable: true,
    startsShown: true,
    blank: { given_on: "", who: "", amount: "", note: "" },
    columns: [
      {
        key: "who",
        label: "who",
        kind: "text",
        placeholder: "leave empty for “someone”",
        hint: "Empty means they would rather stay anonymous.",
      },
      { key: "amount", label: "how much", kind: "text", placeholder: "£20" },
      { key: "given_on", label: "when", kind: "date" },
      {
        key: "note",
        label: "what they said",
        kind: "long",
        wide: true,
        placeholder: "optional — shown in quotation marks",
      },
    ],
  },

  events: {
    table: "events",
    one: "an evening",
    order: { column: "happens_on", ascending: true },
    title: "title",
    publishable: true,
    startsShown: false,
    blank: {
      happens_on: "",
      starts_at: "",
      title: "",
      place: "",
      spots: 0,
      note: "",
      photo_path: null,
    },
    columns: [
      { key: "title", label: "what it is", kind: "text", placeholder: "soup and a walk" },
      { key: "happens_on", label: "which day", kind: "date" },
      { key: "starts_at", label: "from", kind: "text", placeholder: "18:30" },
      { key: "place", label: "where", kind: "text", placeholder: "the yard, Burngreave" },
      {
        key: "spots",
        label: "places",
        kind: "number",
        hint: "How many people can come. 0 means as many as turn up.",
      },
      {
        key: "note",
        label: "anything else",
        kind: "long",
        wide: true,
        placeholder: "bring a bowl",
      },
      {
        key: "photo_path",
        label: "picture",
        kind: "photo",
        hint: "From the archive. Shown at the top of the evening in the app.",
      },
    ],
  },
};

/** Every column a browser is allowed to write for this table. */
export function writableColumns(table: TableName): string[] {
  const spec = TABLES[table];
  const keys = spec.columns.map((column) => column.key);
  return spec.publishable ? [...keys, "published"] : keys;
}
