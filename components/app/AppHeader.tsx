import Image from "next/image";
import Link from "next/link";
import WaveBadge from "./WaveBadge";
import { readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

type Props = {
  /** Small line above the title, e.g. "welcome". */
  eyebrow?: string;
  title: string;
  /** Shown on the right, where a screen has one thing to offer. */
  aside?: React.ReactNode;
  /**
   * Where this screen was opened from.
   *
   * The mark goes home; a screen you went *into* needs the way back out of it,
   * and on a phone that is an arrow where the mark would be rather than
   * something at the bottom of the page.
   */
  back?: string;
  /* Whether the wave belongs on this screen.
   *
   * It does on the screens that are about the club — who waved at you is news. On
   * one evening's own screen the right-hand side is where the three things you can
   * do about that evening go, and a hand among them is a fourth thing competing
   * for a thumb. */
  wave?: boolean;
};

/* A server component on purpose, though it says one word of its own.
   
   The badge on the right reads who has waved, from the database, so this header
   cannot cross into the browser without taking that with it — and `useSay` would
   have made it a client component. Its own language, then, read here. */
export default async function AppHeader({
  eyebrow,
  title,
  aside,
  back,
  wave = true,
}: Props) {
  const say = speaking(await readingIn(), await getFrench());

  return (
    <header className="app-header">
      {back ? (
        <Link href={back} className="app-back" aria-label={say("head.back")}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M14.5 5 8 12l6.5 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      ) : (
        <Link href="/app" className="app-mark" aria-label="promeNOODology">
          <Image src="/logo-mark.png" alt="" width={600} height={582} priority sizes="34px" />
        </Link>
      )}
      <div className="app-header-text">
        {eyebrow ? <p className="app-eyebrow">{eyebrow}</p> : null}
        <h1 className="app-title">{title}</h1>
      </div>
      {/* Always the same two things on the right, in the same order: whatever
          this screen offers, then who has waved. */}
      <div className="app-header-aside">
        {aside}
        {wave ? <WaveBadge /> : null}
      </div>
    </header>
  );
}
