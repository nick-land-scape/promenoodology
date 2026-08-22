import { Fragment } from "react";

/**
 * Words with the links in them made into links.
 *
 * Everything anybody writes in the back of the house is plain text, deliberately
 * — a rich text editor is a thing that eventually puts somebody's pasted Word
 * formatting on the page. But an address written in a paragraph is an address,
 * and printing "www.least.eco" as ink that cannot be pressed is the site
 * refusing to do the one thing it is better at than paper.
 *
 * Three shapes, and nothing else: a full http(s) address, one beginning www.,
 * and an email. No markdown, no brackets, no syntax to learn or to get wrong —
 * you write the address and it is one.
 *
 * Only ever those three, and always with the scheme decided here rather than
 * taken from the text: a link is a place this page sends somebody, and the list
 * of kinds of place it can send them is not something a paragraph should be able
 * to extend.
 */

const FOUND =
  /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])|(\bwww\.[^\s<>()]+[^\s<>().,;:!?'"])|([\w.+-]+@[\w-]+\.[\w.-]+[\w])/gi;

export default function Linked({ children }: { children: string }) {
  const words = children ?? "";
  const out: React.ReactNode[] = [];

  let at = 0;
  let found: RegExpExecArray | null;
  FOUND.lastIndex = 0;

  while ((found = FOUND.exec(words)) !== null) {
    if (found.index > at) out.push(words.slice(at, found.index));

    const [whole, full, dubdub, email] = found;
    const href = full ? whole : dubdub ? `https://${whole}` : `mailto:${email}`;
    const away = !email;

    out.push(
      <a
        key={`${found.index}-${whole}`}
        href={href}
        {...(away ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {whole}
      </a>,
    );

    at = found.index + whole.length;
  }

  if (at < words.length) out.push(words.slice(at));

  // Nothing found: the words as they were, and no wrapper around them.
  if (out.length === 1 && typeof out[0] === "string") return <>{out[0]}</>;

  return (
    <>
      {out.map((piece, index) => (
        <Fragment key={index}>{piece}</Fragment>
      ))}
    </>
  );
}
