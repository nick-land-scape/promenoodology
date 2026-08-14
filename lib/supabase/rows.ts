/**
 * The shape of each table, as created by supabase/migrations/0001_init.sql.
 *
 * Written by hand rather than generated, so the project needs no extra tooling
 * to build. If a column changes in a migration, change it here too — this file
 * is the one place the rest of the code learns the shape from.
 */

export type StoryRow = {
  id: string;
  slug: string;
  title: string;
  tag: string;
  position: number;
  place: string | null;
  happened: string | null;
  made_with: string | null;
  sections: { heading: string | null; texts: string[] }[];
  published: boolean;
  updated_at: string;
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
};

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
};

export type EventRow = {
  id: string;
  happens_on: string;
  starts_at: string;
  title: string;
  place: string;
  spots: number;
  note: string;
  photo_path: string | null;
  published: boolean;
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
  name: string;
  country: string;
  role: "member" | "admin";
  listed: boolean;
  photo_path: string | null;
  colour: string | null;
  joined_on: string;
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
