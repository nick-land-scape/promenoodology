/**
 * The shape of each table, as created by supabase/migrations/0001_init.sql.
 *
 * Written by hand rather than generated, so the project needs no extra tooling
 * to build. If a column changes in a migration, change it here too — this file
 * is the one place the rest of the code learns the shape from.
 */

export type StoryRow = {
  /** Where it happened, for the map. Null: not on the map. See migration 0026. */
  lat: number | null;
  lng: number | null;
  /** Roughly how many people ate. */
  people_fed: number | null;
  id: string;
  slug: string;
  title: string;
  /** One line under the title: why it was worth doing. Optional. */
  subtitle: string | null;
  tag: string;
  position: number;
  place: string | null;
  happened: string | null;
  made_with: string | null;
  sections: { heading: string | null; texts: string[] }[];
  published: boolean;
  updated_at: string;
  /** Which photograph stands for the story. Null: worked out from the photos. */
  featured_photo_id: string | null;
};

export type PhotoRow = {
  id: string;
  path: string;
  width: number;
  height: number;
  credit: string;
  year: string;
  story_tag: string | null;
  position: number;
  published: boolean;
  /** Who took it, when they have an account here. The name stays either way. */
  credit_profile_id: string | null;
  /** How it sits on a story page. Null: the automatic cycle decides. */
  layout: PhotoLayout | null;
};

/** The named ways a photograph can be asked to sit. See lib/photo-layout. */
export type PhotoLayout = "wide" | "narrow" | "left" | "right" | "tall";

export type QuoteRow = {
  id: string;
  who: string;
  place: string;
  year: string;
  story_tag: string | null;
  text: string;
  published: boolean;
  created_at: string;
};

export type PageRow = {
  slug: string;
  title: string;
  lead: string;
  blocks: { kind: string; text: string }[];
  updated_at: string;
  visible: boolean;
  nav_label: string | null;
  nav_group: string | null;
  nav_position: number | null;
  /** The few knobs a page may set. See lib/admin/page-settings. */
  settings: Record<string, unknown>;
};

export type EventRow = {
  id: string;
  happens_on: string;
  /** Where it is, for the map. Null until somebody places it. */
  lat: number | null;
  lng: number | null;
  /** What is still wanted for it, one per line. */
  needs: string;
  /** Roughly how many ate. The evidence, so a rough number beats none. */
  people_fed: number | null;
  /** The last day, for anything that runs longer than an evening. */
  ends_on: string | null;
  starts_at: string;
  ends_at: string;
  title: string;
  place: string;
  spots: number;
  note: string;
  photo_path: string | null;
  published: boolean;
  /** Partner ids. See migration 0014. */
  partners: string[];
  /** The story written about it afterwards. See migration 0016. */
  story_id: string | null;
};

export type NewsRow = {
  id: string;
  published_on: string;
  title: string;
  text: string;
  published: boolean;
};

export type DonationRow = {
  id: string;
  given_on: string;
  who: string;
  amount: string;
  note: string;
  profile_id: string | null;
  published: boolean;
};

export type ProfileRow = {
  id: string;
  /** The account they sign in with, or null for somebody who never has. */
  user_id: string | null;
  /** Where to write to them: their login, or the invitation waiting for them. */
  email: string | null;
  name: string;
  country: string;
  role: "member" | "admin";
  /** Their own answer to being on the community page. */
  listed: boolean;
  /** An admin's answer, which wins. Null: whatever they said. */
  listed_by_admin: boolean | null;
  photo_path: string | null;
  colour: string | null;
  joined_on: string;
  /** Given once and never moved. See migration 0015. */
  member_no: number | null;
  /* Who somebody is, beyond a name — see migration 0026. */
  city: string;
  does: string;
  skills: string[];
  languages: string[];
  instagram: string;
  /** A date whose year nobody is meant to read; only the day and month are shown. */
  birthday: string | null;
  birthday_shown: boolean;
  /** Private: the person and admins only, never the community page. */
  cannot_eat: string;
  phone: string;
  /** They have been through "tell us who you are", whether or not they filled it in. */
  settled_in: boolean;
};

export type AssociationRow = {
  id: string;
  name: string;
  url: string | null;
  logo_path: string | null;
  position: number;
  published: boolean;
};

/** A film for the front page. */
export type HeroVideoRow = {
  id: string;
  path: string;
  poster_path: string | null;
  position: number;
  published: boolean;
  called: string;
  seconds: number | null;
  bytes: number | null;
};

export type ApplicationRow = {
  id: string;
  what: string;
  place: string;
  when_roughly: string;
  people: string;
  cost: string;
  about: string;
  contact: string;
  state: "new" | "talking" | "yes" | "no";
  created_at: string;
};

export type NewsletterRow = {
  id: string;
  email: string;
  name: string;
  /** Said yes a second time, from inside their own inbox. */
  confirmed: boolean;
  confirmed_at: string | null;
  /** What the link in the confirmation email carries. Never shown anywhere. */
  token: string;
  created_at: string;
};
