import fs from "node:fs";
import path from "node:path";
import type { Photo, Project, Resource } from "./content";
import { getResources } from "./data";

/**
 * One project = one text file in content/projects/ + every photo in
 * data/resources.csv that carries its tag.
 *
 * The text files start with a few `key: value` lines, then a blank line, then
 * as many paragraphs as you like:
 *
 *   title: dinner for 500
 *   tag: dfor500
 *   order: 2
 *   where: Genalguacil, Spain
 *
 *   We cooked for as long as people kept arriving.
 *
 *   The second paragraph.
 */

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

export function getProjects(): Project[] {
  const resources = getResources();

  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => parse(file, resources))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((project) => project.slug === slug);
}

/** The projects before and after this one, wrapping around at the ends. */
export function getNeighbours(slug: string) {
  const projects = getProjects();
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return { previous: undefined, next: undefined };
  return {
    previous: projects[(index - 1 + projects.length) % projects.length],
    next: projects[(index + 1) % projects.length],
  };
}

/** tag -> title, for the archive's filter buttons and captions. */
export function getProjectLabels(): Record<string, { title: string; slug: string }> {
  return Object.fromEntries(
    getProjects().map((project) => [project.tag, { title: project.title, slug: project.slug }]),
  );
}

function parse(file: string, resources: Resource[]): Project {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(PROJECTS_DIR, file), "utf8").replace(/^﻿/, "");

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

  const paragraphs = lines
    .slice(cursor)
    .join("\n")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter((block) => block.length > 0);

  const tag = fields.tag ?? slug;
  const photos = resources.filter((item) => item.event === tag);

  return {
    slug,
    tag,
    title: fields.title ?? slug.replace(/-/g, " "),
    order: Number(fields.order) || 99,
    where: fields.where || null,
    when: fields.when || years(photos).join(", ") || null,
    paragraphs,
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
