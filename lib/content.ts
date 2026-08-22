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

/**
 * One day of something that runs over several.
 *
 * "Ateliers olfactifs" is four Saturdays and a Sunday, each with its own name
 * and its own hours. An evening on one afternoon has none of these, and says
 * when it is with its own date and time like it always did.
 */
export type EventDay = {
  /** ISO day. */
  date: string;
  time: string;
  endTime: string;
  /** "La cuisine du buisson". */
  title: string;
  /** The sentence under it, as the flyer has one. */
  what: string;
};

export type ClubEvent = {
  id: string;
  /** Its address on the site: /events/<slug>. */
  slug: string;
  /** ISO day, e.g. 2026-08-22. */
  date: string;
  /** The last day, where it runs over more than one. Empty for an evening. */
  until: string;
  time: string;
  /** When it ends, where anybody has said. */
  endTime: string;
  title: string;
  place: string;
  spots: number;
  note: string;
  photo: Photo | null;
  /**
   * Who it is being put on with.
   *
   * Not names any more: the same three things a story's partners carry — what
   * they are called, their mark where they have one, and where to read about
   * them. A row of logos is how anybody recognises an organisation, and a
   * comma-separated list of names is how nobody does.
   */
  partners: { name: string; logo: string | null; url: string | null }[];
  /** What is still wanted for it, one per line. */
  needs: string;
  /** Roughly how many ate, once somebody has counted. */
  fed: number | null;
  /** How many places have been asked for, over all the asking. */
  asked: number;
  /** The story written about it afterwards, if there is one. */
  story: { slug: string; title: string } | null;
  /** The line under the name: "avec le collectif promeNOODology". */
  subtitle: string;
  /** The paragraph it opens with, before the programme. */
  lead: string;
  /** The street, where "place" is a name rather than a way of getting there. */
  address: string;
  /** "gratuit", "£5 on the door". */
  cost: string;
  /** Where to write to come, for the ones somebody else takes the names for. */
  signUpEmail: string;
  /** The larger project or festival it belongs to. */
  partOf: string;
  partOfUrl: string;
  /** The days it runs. Empty for something that happens once. */
  days: EventDay[];
  /**
   * The flyer itself, for taking away.
   *
   * The page says everything the flyer says; it is not the same as having the
   * flyer. The thing that gets printed and pinned to a noticeboard is the PDF.
   */
  flyer: string | null;
};

/**
 * An evening with its own page: everything above, plus what somebody wrote.
 *
 * The same blocks a story's page is built from, so the same component draws
 * both — an evening that deserves more than a flyer's worth of words gets the
 * page a story gets, and one that does not has an empty list here and loses
 * nothing.
 */
export type EventPage = ClubEvent & { blocks: StoryBlock[] };

export type NewsItem = {
  date: string;
  title: string;
  text: string;
  /** Who wrote it. Empty for anything written before anybody was asked. */
  by: string[];
  /** Held at the top, whatever its date. At most one of these. */
  pinned: boolean;
};

export type Reply = {
  id: string;
  author: string;
  authorId: string;
  when: string;
  text: string;
};

export type Post = {
  id: string;
  author: string;
  /** Which profile wrote it, so the app knows whether it is yours to delete. */
  authorId: string;
  place: string;
  when: string;
  text: string;
  /* More than one, because an evening is not one photograph. No likes: a like is
     a number that makes people watch a number. */
  photos: Photo[];
  replies: Reply[];
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

/**
 * One thing on a story's page, in the order somebody put it there.
 *
 * The alternative — text in one list, photographs in another, woven together by
 * a rule — is what this replaces. The rule made every story look like a story
 * from this site and made it impossible to say "this paragraph, then that
 * photograph". A story with no blocks still reads the old way, so nothing had to
 * be converted before this could ship.
 */
export type StoryBlock =
  | { kind: "heading"; words: string }
  | { kind: "text"; words: string }
  | { kind: "space" }
  | { kind: "photo"; photo: Photo; caption: string; layout: Resource["layout"] };

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
  /**
   * The page, block by block. Empty for a story nobody has arranged by hand,
   * which is read the old way instead.
   */
  blocks: StoryBlock[];
  /** What it was about, in a handful of words. Not the tag, which is a key. */
  topics: string[];
  /** Who was there, with their portrait where they have one. */
  who: { name: string; photo: string | null }[];
  /** Which organisations it was made with. */
  partners: { name: string; logo: string | null; url: string | null }[];
};
