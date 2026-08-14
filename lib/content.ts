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

export type Project = {
  slug: string;
  /** The short tag used in data/resources.csv to mark this project's photos. */
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
