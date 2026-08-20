/** Shared types. Safe to import from client components. */

import type { PhotoLayout } from "./supabase/rows";

export type Photo = { src: string; width: number; height: number };

export type Member = {
  /** First and last name joined, for showing. */
  name: string;
  first: string;
  last: string;
  country: string;
  /** Which story they were part of. Added to community.csv later. */
  project: string;
  color: string | null;
  photo: Photo | null;
};

export type Resource = {
  file: string;
  /** Who took it, as it should read — a member's own name, or the typed one. */
  credit: string;
  year: string;
  event: string | null;
  photo: Photo;
  /** How it should sit on a story page. Null: the automatic cycle decides. */
  layout: PhotoLayout | null;
};

/* ------------------------------------------------- the members' app (/app) */

export type ClubEvent = {
  id: string;
  /** ISO day, e.g. 2026-08-22. */
  date: string;
  time: string;
  title: string;
  place: string;
  spots: number;
  note: string;
  photo: Photo | null;
};

export type NewsItem = {
  date: string;
  title: string;
  text: string;
};

export type Post = {
  id: string;
  author: string;
  place: string;
  when: string;
  likes: number;
  replies: number;
  text: string;
  photo: Photo | null;
};

export type Quote = {
  id: string;
  who: string;
  where: string;
  year: string;
  /** The story tag this was said about, if any. */
  story: string | null;
  text: string;
  /** The portrait from the community list, when we have one. */
  photo: Photo | null;
};

export type Donation = {
  id: string;
  /** Empty when the donor would rather stay anonymous. */
  who: string;
  when: string;
  amount: string;
  note: string;
  photo: Photo | null;
};

/** One photograph as it is shown in a gallery or the lightbox. */
export type Slide = {
  key: string;
  photo: Photo;
  caption: string;
  layout?: PhotoLayout | null;
};

export type Section = {
  /** "Opportunity", "Strategy", … or null for text before any heading. */
  heading: string | null;
  texts: string[];
};

export type Story = {
  slug: string;
  /** The short tag used in data/resources.csv to mark this story's photos. */
  tag: string;
  title: string;
  /** One line under the title: why it was worth doing. Empty is fine. */
  subtitle: string;
  order: number;
  where: string | null;
  when: string | null;
  /** Who it was made with or within, e.g. "EASA COMMONS". */
  with: string | null;
  /** The text, in the sections the text file is written in. */
  sections: Section[];
  /** The first paragraph, for page descriptions. */
  lead: string;
  photos: Resource[];
  credits: string[];
  cover: Photo | null;
};
