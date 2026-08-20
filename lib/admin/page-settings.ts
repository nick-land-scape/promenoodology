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

  resources: [
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
