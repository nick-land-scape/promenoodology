import { notFound } from "next/navigation";
import { LANGS, isLang } from "@/lib/lang";

/**
 * The language the site is being read in, as a segment of the address.
 *
 * Every page of the website sits under this. English keeps the plain address —
 * the proxy rewrites /events to /en/events without the reader ever seeing it —
 * and French is one segment in, at /fr/events, so a French page is a thing that
 * can be linked to and indexed rather than a state a browser is in.
 *
 * Nothing but a guard and a pass-through: the look of the site is decided by
 * the layout inside this one, and the language it is read in is not a design
 * decision.
 */
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function InALanguage({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // A dynamic segment at the root of the site matches anything at all, so
  // /nonsense would otherwise be answered by the front page in a language
  // called "nonsense".
  if (!isLang(lang)) notFound();

  return children;
}
