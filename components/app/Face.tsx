"use client";

import Photo from "../Photo";

/**
 * Somebody's portrait, or their initials where the club has no picture of them.
 *
 * One drawing rather than four: the composer's bar, the composer's sheet, the top
 * of a post and the ideas tab all had their own, and three of them could not show
 * a photograph at all — which is why the person writing saw their own initials
 * over a feed full of faces.
 *
 * In a file of its own, and not because Feed was crowded: a row of evenings wants
 * a face on it now, and importing one out of Feed would have brought the whole
 * feed — the composer, the reply forms, the reporting sheet — into a screen that
 * has none of those things on it.
 */
export default function Face({ photo, name }: { photo: string | null; name: string }) {
  if (!photo) {
    return (
      <span className="avatar" aria-hidden="true">
        {initials(name)}
      </span>
    );
  }
  return (
    <span className="avatar avatar-photo" aria-hidden="true">
      <Photo src={photo} alt="" fill sizes="44px" />
    </span>
  );
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}
