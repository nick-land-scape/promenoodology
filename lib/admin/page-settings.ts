/**
 * The few things a page can decide about itself.
 *
 * Not a stylesheet with a database behind it. The design lives in globals.css and
 * stays there; this is a short, named list of decisions that are genuinely
 * editorial rather than visual — whether the form at the foot of the handbook is
 * there, whether the stories list counts its photographs, how wide a column of
 * cards wants to be on the page it is on.
 *
 * Adding something here is a decision to hand it over. The test is: would a
 * person who cannot read CSS have an opinion about it, and would getting it
 * wrong be recoverable by turning it back? If not, it belongs in the stylesheet.
 *
 * Plain data, no JSX, so the client editor and the pages themselves read the same
 * list. Every value has a default, and the default is what the site shipped with.
 */

export type Setting =
  | { key: string; kind: "toggle"; label: string; hint?: string; fallback: boolean }
  | {
      key: string;
      kind: "choice";
      label: string;
      hint?: string;
      fallback: string;
      options: { value: string; label: string; hint?: string }[];
    }
  | {
      key: string;
      /** A picture, uploaded here and kept as a path in the bucket. */
      kind: "image";
      label: string;
      hint?: string;
      fallback: "";
      /** Where in the bucket the uploads go. */
      folder: string;
    }
  | {
      key: string;
      kind: "number";
      label: string;
      hint?: string;
      fallback: number;
      min: number;
      max: number;
      unit?: string;
    }
  | { key: string; kind: "text"; label: string; hint?: string; fallback: string }
  | { key: string; kind: "lines"; label: string; hint?: string; fallback: string };

/**
 * A picture behind the words, and the handful of dials that make one usable.
 *
 * This is the one place the line about design living in the stylesheet is
 * deliberately crossed, and it is worth saying why: nobody can choose an opacity
 * for a photograph they have not seen. Which picture, how far back it sits, how
 * it is turned and how much of the window it fills are judgements about a
 * specific image, and they cannot be made anywhere but in front of it.
 *
 * Spread into a page's list to give that page a background. `background` empty
 * means there is none, and every dial below it is then irrelevant rather than
 * wrong.
 */
const BACKGROUND: Setting[] = [
  {
    key: "background",
    kind: "image",
    label: "a picture behind the words",
    hint: "Left empty there is none, and the rest of this panel does nothing.",
    fallback: "",
    folder: "backgrounds",
  },
  {
    key: "backgroundOpacity",
    kind: "number",
    label: "how strong it is",
    hint: "Per cent. Low is usually right: it is behind words that have to stay readable.",
    fallback: 18,
    min: 2,
    max: 100,
    unit: "%",
  },
  {
    key: "backgroundBlend",
    kind: "choice",
    label: "how it meets the paper",
    hint: "Multiply keeps the paper's warmth and drops the picture's white out of it — the same trick the logo in the menu uses.",
    fallback: "multiply",
    options: [
      { value: "multiply", label: "multiply", hint: "White disappears; the ink darkens the paper." },
      { value: "normal", label: "flat", hint: "Just the picture, faded." },
      { value: "screen", label: "screen", hint: "Black disappears; the picture lightens the paper." },
      { value: "overlay", label: "overlay", hint: "Contrast both ways. Strong." },
      { value: "luminosity", label: "grey", hint: "The picture's light, the paper's colour." },
    ],
  },
  {
    key: "backgroundFit",
    kind: "choice",
    label: "how much of the window",
    fallback: "cover",
    options: [
      { value: "cover", label: "fills it", hint: "Cropped to fill the window. Nothing empty, some of it lost." },
      { value: "contain", label: "all of it", hint: "The whole picture, as large as fits. Paper around it." },
      { value: "width", label: "a width you set", hint: "Its own shape, at the size below." },
    ],
  },
  {
    key: "backgroundWidth",
    kind: "number",
    label: "that width",
    hint: "Per cent of the window. Only used when the setting above is “a width you set”.",
    fallback: 100,
    min: 10,
    max: 300,
    unit: "%",
  },
  {
    key: "backgroundRotate",
    kind: "number",
    label: "turned by",
    hint: "Degrees, in fifteens. A turned picture leaves the corners of the window empty unless it is also made bigger.",
    fallback: 0,
    min: -180,
    max: 180,
    unit: "°",
  },
];

/** slug → what that page may set. A page with nothing here sets nothing. */
export const PAGE_SETTINGS: Record<string, Setting[]> = {
  stories: [
    {
      key: "showPhotoCount",
      kind: "toggle",
      label: "count the photographs",
      hint: "“12 photos” after the place and the date. Off by default: it says how much there is, not what it was.",
      fallback: false,
    },
    {
      key: "columnWidth",
      kind: "number",
      label: "narrowest a card may be",
      hint: "The list fits as many cards per row as this allows. Bigger means fewer and larger.",
      fallback: 260,
      min: 180,
      max: 480,
      unit: "px",
    },
  ],

  about: [...BACKGROUND],

  handbook: [
    {
      key: "showForm",
      kind: "toggle",
      label: "the “ask us for a hand” form",
      hint: "Off takes the whole section away — heading, form and all. The handbook itself stays.",
      fallback: true,
    },
    {
      key: "formTitle",
      kind: "text",
      label: "what the form is called",
      fallback: "ask us for a hand",
    },
    {
      key: "formIntro",
      kind: "lines",
      label: "the words above the form",
      hint: "One paragraph per line.",
      fallback:
        "If you are doing something in public space and it would happen sooner with help, tell us about it. Help can be money for materials, pots and tables to borrow, or two of us turning up on the day. We would rather fund ten small things badly than one big thing properly.",
    },
  ],

  archive: [
    {
      key: "columnWidth",
      kind: "number",
      label: "narrowest a column of the wall",
      hint: "The wall is columns, not a grid — every photograph keeps its own shape. This is the narrowest a column may be, so bigger means fewer and wider.",
      fallback: 220,
      min: 140,
      max: 480,
      unit: "px",
    },
  ],

  community: [
    {
      key: "columns",
      kind: "number",
      label: "how many names across",
      hint: "A count rather than a width, because that is the thing anybody looking at the page has an opinion about. On a phone it is two whatever this says — there is no room to argue.",
      fallback: 6,
      min: 2,
      max: 12,
    },
  ],
};

export type PageSettings = Record<string, string | number | boolean>;

/** What a page actually has, defaults filled in for whatever it does not say. */
export function settingsFor(slug: string, saved: unknown): PageSettings {
  const spec = PAGE_SETTINGS[slug] ?? [];
  const stored = (saved ?? {}) as Record<string, unknown>;
  const out: PageSettings = {};

  for (const setting of spec) {
    const value = stored[setting.key];

    if (setting.kind === "toggle") {
      out[setting.key] = typeof value === "boolean" ? value : setting.fallback;
      continue;
    }
    if (setting.kind === "number") {
      const number = Number(value);
      out[setting.key] =
        Number.isFinite(number) && number >= setting.min && number <= setting.max
          ? number
          : setting.fallback;
      continue;
    }
    if (setting.kind === "choice") {
      const allowed = setting.options.some((option) => option.value === value);
      out[setting.key] = allowed ? String(value) : setting.fallback;
      continue;
    }
    if (setting.kind === "image") {
      // A picture is the one text field where empty means empty: there is no
      // shipped background to fall back to, and "none" is a real answer.
      out[setting.key] = typeof value === "string" ? value : "";
      continue;
    }
    // An emptied text field means "put the original back", not "show nothing":
    // there is no way to say the latter, and every way to say it by accident.
    out[setting.key] =
      typeof value === "string" && value.trim() ? value : setting.fallback;
  }

  return out;
}

/** Only what this page is allowed to set, and only in the right shape. */
export function cleanSettings(slug: string, incoming: unknown): PageSettings {
  const spec = PAGE_SETTINGS[slug] ?? [];
  const stored = (incoming ?? {}) as Record<string, unknown>;
  const out: PageSettings = {};

  for (const setting of spec) {
    const value = stored[setting.key];
    if (value === undefined) continue;

    if (setting.kind === "toggle") {
      out[setting.key] = Boolean(value);
    } else if (setting.kind === "choice") {
      if (setting.options.some((option) => option.value === value)) {
        out[setting.key] = String(value);
      }
    } else if (setting.kind === "image") {
      // Only somewhere in our own bucket, and only a path — never a URL typed
      // in from elsewhere, which would be a way of putting anything on the page.
      const path = String(value ?? "");
      out[setting.key] = /^[a-z0-9/_-]+\.[a-z]{3,4}$/i.test(path) ? path : "";
    } else if (setting.kind === "number") {
      const number = Math.round(Number(value));
      if (Number.isFinite(number)) {
        out[setting.key] = Math.min(setting.max, Math.max(setting.min, number));
      }
    } else {
      out[setting.key] = String(value).trim();
    }
  }

  return out;
}
