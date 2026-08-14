"use client";

import Link from "next/link";
import { initials, useSession } from "@/lib/session";

/**
 * Two small pieces of the menu that depend on who is looking.
 *
 * Nothing is drawn until we know — a link that changes under somebody's finger
 * is worse than one that arrives a moment late.
 */

/** The way into the back of the house. Only an admin ever sees it. */
export function AdminLink() {
  const session = useSession();
  if (!session?.admin) return null;

  return (
    <Link href="/admin" className="nav-admin">
      look after the site
    </Link>
  );
}

/**
 * Sign in, or your own face. On a phone this sits in the strip at the top,
 * on the right; on a wide screen it is the last line of the menu.
 */
export function SessionButton() {
  const session = useSession();
  if (!session) return null;

  if (!session.signedIn) {
    return (
      <Link href="/account/sign-in" className="session-in">
        sign in
      </Link>
    );
  }

  return (
    <Link href="/account" className="session-you" aria-label={`${session.name} — your profile`}>
      <span className="session-face">
        {session.photo ? (
          // Not next/image: it is 34 pixels and changes whenever somebody
          // uploads a new one, so optimising it would cost more than it saves.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.photo} alt="" />
        ) : (
          <span aria-hidden="true">{initials(session.name)}</span>
        )}
      </span>
      <span className="session-name">your profile</span>
    </Link>
  );
}
