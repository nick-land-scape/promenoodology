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
  /** For a "dates" or "times" column: which column holds the other end. */
  until?: string;
  /** For a "when" column: which column holds the hour. */
  time?: string;
  label: string;
  kind:
    | "text"
    | "long"
    | "date"
    | "time"
    | "number"
    | "choice"
    | "story"
    | "photo"
    /** Several people out of the community. Stored as an array of their ids. */
    | "people"
    /** Several partners, the same way. */
    | "partners"
    /**
     * A stretch of days, or a stretch of hours, in one field.
     *
     * Two columns behind one label: "the day it starts" and "and the day it
     * ends" as separate fields read as two unrelated questions, and put the
     * end of something a whole row away from its beginning. The second column
     * is named in `until`.
     */
    | "dates"
    | "times"
    /**
     * Two numbers and a way of finding them.
     *
     * A pin needs a latitude and a longitude, and nobody knows either by heart.
     * This is one cell holding both, with a button that looks the place up by
     * name — so the person filling it in types "Burngreave, Sheffield" rather
     * than reading coordinates off another website. The second column is named
     * in `until`, as with a stretch of days.
     */
    | "where"
    /**
     * A day and an hour as one thing, behind one calendar.
     *
     * An evening's beginning is not a date and, separately, a time — it is a
     * moment. Two controls side by side asked it as two questions. `time` names
     * the column that holds the hour.
     */
    | "when"
    /**
     * The story an evening became, by its id.
     *
     * Not the "story" kind, which writes a *tag* into story_tag so photographs
     * and quotes can find their story. This is a real reference to a row, and it
     * is the only place the two halves of the same thing are joined: an evening
     * is what is going to happen, a story is what happened.
     */
    | "storyref";
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
  blank: Record<string, string | number | boolean | null | string[]>;
  /**
   * Which column stands as the row's name.
   *
   * It is drawn as the heading of the row *and* edited there — it used to be
   * both a heading and, separately, a field further down the grid, which read as
   * a name you could not change with a name you could hidden underneath it.
   */
  title: string;
  /** Does this table have a shown/hidden switch? */
  publishable: boolean;
  /**
   * The column that holds "this one first", if the table has one.
   *
   * Exactly one row may have it. Which is not a database constraint but a rule
   * the save enforces — see rows-actions.
   */
  pinned?: string;
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
    // "add news", because that is what the section is called. "Add a note" had
    // people looking for notes.
    one: "news",
    order: { column: "published_on", ascending: false },
    title: "title",
    publishable: true,
    startsShown: true,
    pinned: "pinned",
    blank: { published_on: "", title: "", text: "", authors: [], pinned: false },
    columns: [
      { key: "title", label: "title", kind: "text", placeholder: "one line" },
      { key: "published_on", label: "dated", kind: "date" },
      {
        key: "authors",
        label: "written by",
        kind: "people",
        hint: "From the community, so a name corrected there is corrected here.",
      },
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
    one: "an event",
    order: { column: "happens_on", ascending: true },
    title: "title",
    publishable: true,
    startsShown: false,
    blank: {
      happens_on: "",
      ends_on: null,
      starts_at: "",
      ends_at: "",
      title: "",
      place: "",
      spots: 0,
      note: "",
      photo_path: null,
      partners: [],
      story_id: null,
      lat: null,
      lng: null,
      needs: "",
      people_fed: null,
    },
    columns: [
      { key: "title", label: "what it is", kind: "text", placeholder: "soup and a walk" },
      { key: "happens_on", time: "starts_at", label: "starts", kind: "when" },
      {
        key: "ends_on",
        time: "ends_at",
        label: "and ends",
        kind: "when",
        hint: "Leave it alone for something that starts and finishes on one day.",
      },
      { key: "place", label: "where", kind: "text", placeholder: "the yard, Burngreave" },
      {
        key: "lat",
        until: "lng",
        label: "on the map",
        kind: "where",
        hint: "Press find it and it looks up whatever is in “where”. Only what has a pin is on the map.",
      },
      {
        key: "partners",
        label: "with",
        kind: "partners",
        hint: "Whoever it is being put on with.",
      },
      {
        key: "spots",
        label: "places",
        kind: "number",
        hint: "How many people can come. 0 means as many as turn up.",
      },
      {
        key: "needs",
        label: "still wanted",
        kind: "long",
        wide: true,
        placeholder: "a pot big enough for forty\na table\nsomebody with a van",
        hint: "One per line. Shown in the app beside what people are bringing, and it recruits itself.",
      },
      {
        key: "people_fed",
        label: "how many ate",
        kind: "number",
        hint: "Filled in afterwards. It is the evidence for the whole argument, so a rough number beats none.",
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
      {
        key: "story_id",
        label: "what came of it",
        kind: "storyref",
        hint: "The story written about it afterwards, if there is one.",
      },
    ],
  },
};

/** Every column a browser is allowed to write for this table. */
export function writableColumns(table: TableName): string[] {
  const spec = TABLES[table];
  const keys = spec.columns.flatMap((column) =>
    // A field can stand for two columns — a stretch of days, or a day and an
    // hour. Both halves are just as writable as one.
    [column.key, column.until, column.time].filter(Boolean) as string[],
  );
  if (spec.pinned) keys.push(spec.pinned);
  return spec.publishable ? [...keys, "published"] : keys;
}

/** What kind a column is, including the second half of a pair. */
export function kindOf(table: TableName, key: string): Column["kind"] | "boolean" | undefined {
  const spec = TABLES[table];
  if (spec.pinned === key) return "boolean";
  const own = spec.columns.find((column) => column.key === key);
  // A "when" column's own key holds the day.
  if (own) return own.kind === "when" ? "date" : own.kind;
  // The hour half of a "when".
  if (spec.columns.some((column) => column.time === key)) return "time";
  const pair = spec.columns.find((column) => column.until === key);
  if (!pair) return undefined;
  // The far end of a pair behaves exactly like the near end.
  if (pair.kind === "dates") return "date";
  if (pair.kind === "times") return "time";
  return pair.kind;
}

/** The values a row holds. The same shape as `blank`, said once. */
export type Values = Record<string, string | number | boolean | null | string[]>;

/**
 * What a brand-new row starts out as.
 *
 * Lived in the editor until the list needed it too — both of them make rows now,
 * and two copies of "what a new evening is" would be two answers to the question
 * within a week.
 *
 * The first day a row asks for starts on today: it is nearly always right, and
 * an empty one is refused outright by the database. A *second* day — the one
 * where something ends — is left alone, because "it ends today as well" is a
 * decision rather than a default.
 */
export function fresh(table: TableName, day: string, over?: Values): Values {
  const spec = TABLES[table];
  const values: Values = { ...spec.blank };

  const first = spec.columns.find(
    (column) => column.kind === "date" || column.kind === "when" || column.kind === "dates",
  );
  if (first) values[first.key] = day;

  if (spec.publishable) values.published = spec.startsShown;
  return { ...values, ...over };
}
