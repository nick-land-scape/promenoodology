/** Shared types. Safe to import from client components. */

export type Photo = { src: string; width: number; height: number };

export type Member = {
  /** First and last name joined, for showing. */
  name: string;
  first: string;
  last: string;
  country: string;
  color: string | null;
  photo: Photo | null;
};

export type Resource = {
  file: string;
  credit: string;
  year: string;
  event: string | null;
  photo: Photo;
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

export type Story = {
  slug: string;
  /** The short tag used in data/resources.csv to mark this story's photos. */
  tag: string;
  title: string;
  order: number;
  where: string | null;
  when: string | null;
  paragraphs: string[];
  photos: Resource[];
  credits: string[];
  cover: Photo | null;
};
