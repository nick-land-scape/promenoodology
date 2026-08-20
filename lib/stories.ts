import fs from "node:fs";
import path from "node:path";
import type { Photo, Resource, Section, Story } from "./content";
import { getResources } from "./data";

/**
 * One story = one text file in content/stories/ + every photo in
 * data/resources.csv that carries its tag.
 *
 * The text files start with a few `key: value` lines, then a blank line, then
 * as many paragraphs as you like:
 *
 *   title: dinner for 500
 *   tag: dfor500
 *   order: 2
 *   where: Sheffield, England
 *   when: August 2023
 *   with: EASA COMMONS
 *
 *   ## Opportunity
 *   Why it was worth doing.
 *
 *   ## Strategy
 *   What we actually did.
 */

const STORIES_DIR = path.join(process.cwd(), "content", "stories");

export function getStories(): Story[] {
  const resources = getResources();

  return fs
    .readdirSync(STORIES_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => parse(file, resources))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getStory(slug: string): Story | undefined {
  return getStories().find((story) => story.slug === slug);
}

/** The stories before and after this one, wrapping around at the ends. */
export function getNeighbours(slug: string) {
  const stories = getStories();
  const index = stories.findIndex((story) => story.slug === slug);
  if (index === -1) return { previous: undefined, next: undefined };
  return {
    previous: stories[(index - 1 + stories.length) % stories.length],
    next: stories[(index + 1) % stories.length],
  };
}

/** tag -> title, for the archive's filter buttons and captions. */
export function getStoryLabels(): Record<string, { title: string; slug: string }> {
  return Object.fromEntries(
    getStories().map((story) => [story.tag, { title: story.title, slug: story.slug }]),
  );
}

function parse(file: string, resources: Resource[]): Story {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(STORIES_DIR, file), "utf8").replace(/^﻿/, "");

  const lines = raw.split(/\r?\n/);
  const fields: Record<string, string> = {};
  let cursor = 0;
  for (; cursor < lines.length; cursor++) {
    const line = lines[cursor].trim();
    if (line === "") break;
    const separator = line.indexOf(":");
    if (separator === -1) break;
    fields[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
  }

  const blocks = lines
    .slice(cursor)
    .join("\n")
    .split(/\n\s*\n/)
    .filter((block) => block.trim().length > 0);

  /** Paragraph text: line breaks inside a paragraph are just wrapping. */
  const flatten = (text: string) => text.replace(/\s*\n\s*/g, " ").trim();

  // A line starting with ## opens a new section. The rest of that block is the
  // section's first paragraph, whether or not a blank line follows the heading.
  const sections: Section[] = [];
  const add = (text: string) => {
    if (!text) return;
    if (sections.length === 0) sections.push({ heading: null, texts: [] });
    sections[sections.length - 1].texts.push(text);
  };

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block.startsWith("##")) {
      add(flatten(block));
      continue;
    }
    const newline = block.indexOf("\n");
    const heading = (newline === -1 ? block : block.slice(0, newline)).replace(/^#+\s*/, "");
    sections.push({ heading, texts: [] });
    if (newline !== -1) add(flatten(block.slice(newline + 1)));
  }

  const tag = fields.tag ?? slug;
  const photos = resources.filter((item) => item.event === tag);

  return {
    slug,
    tag,
    title: fields.title ?? slug.replace(/-/g, " "),
    // `subtitle:` in the text file's header, if it is there.
    subtitle: fields.subtitle ?? "",
    order: Number(fields.order) || 99,
    where: fields.where || null,
    when: fields.when || years(photos).join(", ") || null,
    with: fields.with || null,
    sections,
    lead: sections.flatMap((section) => section.texts)[0] ?? "",
    photos,
    credits: unique(photos.map((photo) => photo.credit)),
    cover: cover(photos),
  };
}

function years(photos: Resource[]) {
  return unique(photos.map((photo) => photo.year)).sort();
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

/** The widest photo makes the better cover. */
function cover(photos: Resource[]): Photo | null {
  if (photos.length === 0) return null;
  const landscape = photos.filter((photo) => photo.photo.width >= photo.photo.height);
  return (landscape[0] ?? photos[0]).photo;
}
