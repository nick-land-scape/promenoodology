/**
 * Looking for one thing in a list of them.
 *
 * The lists in the back of the house have outgrown the eye. Sixty photographs,
 * forty evenings, a year of notes: "where is the one about the bread oven" is
 * answered by scrolling, which is to say by reading everything until it appears.
 *
 * So: a plain contains-the-words match, done in the browser over rows that are
 * already there. No queries, no waiting, nothing to get out of step — the lists
 * are hundreds of rows long, not hundreds of thousands, and a round trip to the
 * database to filter forty evenings would be slower than the filtering.
 *
 * Plain functions in a plain module, so a server page may prepare the haystack
 * and a client component may search it.
 */

/**
 * Down to something two people would spell the same way.
 *
 * Accents come off — the community has Zürich and Gabriela in it, and somebody
 * typing "zurich" is looking for Zürich and knows it. Curly quotes and dashes
 * become straight ones for the same reason: the words are typed on a keyboard
 * and stored as typography.
 */
function plainly(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐-―]/g, "-")
    .toLowerCase();
}

/**
 * Does this row answer to what was typed?
 *
 * Every word has to be in there, in any order and anywhere: "bread sheffield"
 * finds the evening in Sheffield about bread, which is how anybody would go
 * looking for it. Nothing typed matches everything, so a blank field is not a
 * filter.
 */
export function matches(hay: string, query: string): boolean {
  const words = plainly(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const straw = plainly(hay);
  return words.every((word) => straw.includes(word));
}

/** Everything a row can be found by, joined into one string to search. */
export function hay(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
