"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * The header a screen wears while it is on its way.
 *
 * The same header, drawn in the browser. That is the whole point of it: the real
 * one (AppHeader) is a server component, because the badge on its right reads who
 * has waved — so a waiting screen built out of it cannot be shown until the server
 * has answered, which is precisely the moment it stops being needed. Pressing a
 * tab left the *previous* screen's title sitting there for as long as the round
 * trip took: a second and a half of "hello, Marvin" while what everyone is up to
 * was being fetched.
 *
 * This one says its words out of the phrase book the layout already put in the
 * browser (see Words), asks nothing, and therefore appears on the frame after the
 * press.
 *
 * No wave badge — a bone in the shape of one would be a promise that there is
 * something to see. The space is held so nothing moves when the real header
 * arrives with it.
 */
export default function WaitingHead({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="app-header">
      <Link href="/app" className="app-mark" aria-label="promeNOODology">
        <Image src="/logo-mark.png" alt="" width={600} height={582} priority sizes="34px" />
      </Link>
      <div className="app-header-text">
        <p className="app-eyebrow">{eyebrow}</p>
        <h1 className="app-title">{title}</h1>
      </div>
      <div className="app-header-aside" aria-hidden="true">
        <span className="waiting-wave" />
      </div>
    </header>
  );
}
