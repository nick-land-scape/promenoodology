/**
 * A block of structured data, dropped into the page.
 *
 * The one place on the site that writes a script tag by hand, and it has to:
 * this is data rather than code, and there is no other way to put JSON-LD on a
 * page than inside a script the browser will not run.
 *
 * The escape is not decoration. Every one of these blocks is built out of words
 * somebody typed into /admin — an evening's title, a story's first line — and a
 * "</script>" typed into any of those fields would otherwise close this tag and
 * put the rest of the JSON on the page as markup. Escaping the angle bracket
 * makes that impossible while leaving the JSON exactly as valid as it was.
 */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
