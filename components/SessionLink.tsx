"use client";

import Link from "next/link";
import { initials, useSession } from "@/lib/session";

/**
 * The one piece of the menu that depends on who is looking.
 *
 * Nothing is drawn until we know — a link that changes under somebody's finger
 * is worse than one that arrives a moment late.
 *
 * The admin's way in used to be here as well. It is in the strip along the top
 * now, where it also says who you are.
 */

/**
 * Your own face, once you are signed in. On a phone this sits in the strip at the
 * top, on the right; on a wide screen it is the last line of the menu.
 *
 * It used to say "newsletter" to anybody signed out, which made one slot do two
 * unrelated jobs: a member signed in lost the link to the newsletter entirely,
 * as though signing in were a way of unsubscribing. The newsletter is a menu item
 * of its own now, at every width, and this row is only ever about who you are.
 *
 * Nothing at all when nobody is signed in — for now. The way in is three knocks
 * on the mark (see Nav), and a sign-in link belongs here rather than a link to
 * something else; it goes in when there is one to point at.
 */
export function SessionButton() {
  const session = useSession();

  if (!session || !session.signedIn) return null;

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
