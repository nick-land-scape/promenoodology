"use client";

import Face from "./Face";
import { useSay } from "./Words";

/**
 * Who is coming, in a row: three faces and a number.
 *
 * A list of evenings answers "what is on" and used to stop there, which leaves
 * out the half of the answer people actually decide on. Whether you go to a thing
 * on a Saturday is not only a question about the thing. Three faces say more
 * about an evening than a count does, and they say it without anybody having to
 * read a word.
 *
 * Three, and then the rest as a number. Not because three is a magic quantity but
 * because a row is one line high: four faces and a number is wider than the words
 * above them on the narrowest phone this runs on, and a row that wraps because of
 * its decoration is a row that has been decorated.
 *
 * The faces overlap, each one behind the one before it, so the first person to
 * say yes is the one on top and fully drawn. Overlapping is what makes it read as
 * a group rather than a list — three portraits in a line with gaps between them
 * is a directory.
 */
export default function Coming({
  people,
  heads,
}: {
  /** Everybody with a place, oldest booking first. */
  people: { who: string; photo: string | null }[];
  /** How many are expected, guests included — which is more than there are faces. */
  heads: number;
}) {
  const say = useSay();
  if (people.length === 0) return null;

  const shown = people.slice(0, 3);
  /* What the circle says. It counts *people who are not drawn* — including the
     guests nobody has a face for — so the faces plus the number always come to
     the number of places taken. A "+2" beside three faces where five are coming
     is the one thing this must never do. */
  const rest = heads - shown.length;

  return (
    <span
      className="coming"
      /* Said once, as a sentence, because eight portraits read out one after
         another is not an answer to "who is coming". */
      aria-label={say(heads === 1 ? "row.oneComing" : "row.howManyComing").replace(
        "{n}",
        String(heads),
      )}
    >
      {shown.map((one, at) => (
        <span
          className="coming-face"
          key={`${one.who}-${at}`}
          /* Behind the one before it: the first to say yes stays on top. */
          style={{ zIndex: shown.length - at }}
          title={one.who}
        >
          <Face photo={one.photo} name={one.who} />
        </span>
      ))}
      {rest > 0 ? (
        <span className="coming-rest" aria-hidden="true">
          +{rest}
        </span>
      ) : null}
    </span>
  );
}
