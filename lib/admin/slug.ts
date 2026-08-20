/**
 * Turning a title into an address.
 *
 * A story's slug is its URL, and an address that has been shared should not
 * move, so this is only ever used to mint the first one: a fresh story keeps
 * its "untitled-…" address until it is given a real title, and then never
 * changes again unless somebody types a new one by hand.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** A short, unmistakable ending for a name that has to be unique. */
export function suffix(): string {
  return Math.random().toString(36).slice(2, 8);
}
