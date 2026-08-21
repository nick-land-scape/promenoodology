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
 * The newsletter, or your own face if you happen to be signed in. On a phone
 * this sits in the strip at the top, on the right; on a wide screen it is the
 * last line of the menu.
 *
 * There is deliberately no sign-in link: the way in is three knocks on the mark
 * (see Nav).
 */
export function SessionButton() {
  const session = useSession();

  if (!session || !session.signedIn) {
    return (
      <Link href="/newsletter" className="session-in">
        newsletter
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
