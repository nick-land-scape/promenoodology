import type { PhotoLayout } from "./supabase/rows";

/**
 * How a photograph sits on a story page.
 *
 * The page lays everything on twelve columns and cycles through eight variants:
 * a different width, a different starting column, a different vertical offset, a
 * fraction of a degree of rotation. Nothing lines up and nothing breaks, and
 * that is the design — so the automatic cycle stays the default, and always
 * will.
 *
 * These are for the photographs that want a word said about them: a panorama
 * that should stay wide, a portrait that should not be stretched over seven
 * columns. Names rather than numbers, and each one is a variant the design
 * already contains — so a choice made here can be wrong for the picture, but it
 * cannot put a photograph half off the page or leave a column of nothing.
 */
export const LAYOUTS: { value: PhotoLayout; label: string; hint: string }[] = [
  { value: "wide", label: "wide", hint: "Most of the width. For a panorama, or the one that opens it." },
  { value: "narrow", label: "narrow", hint: "A third or so. For a portrait, or a detail." },
  { value: "left", label: "left", hint: "Held to the left edge." },
  { value: "right", label: "right", hint: "Held to the right, set a little lower." },
  { value: "tall", label: "tall", hint: "Narrow and dropped well down the page." },
];

/**
 * Which of the eight automatic variants a named layout borrows.
 *
 * They are not new geometry: each one points at a variant already in the
 * stylesheet, so a story with every photograph named still looks like a story
 * from this site rather than like a form somebody filled in.
 */
const AS_VARIANT: Record<PhotoLayout, number> = {
  wide: 0, // 1 / span 7
  narrow: 1, // 9 / span 4, dropped
  left: 4, // 1 / span 5
  right: 3, // 8 / span 5
  tall: 7, // 7 / span 5, dropped furthest
};

/** The variant this photograph should use, named or cycled. */
export function variantFor(layout: PhotoLayout | null | undefined, index: number): number {
  if (layout && layout in AS_VARIANT) return AS_VARIANT[layout];
  return index % 8;
}
