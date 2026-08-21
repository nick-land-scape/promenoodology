import Image from "next/image";
import Link from "next/link";
import WaveBadge from "./WaveBadge";

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
};

export default function AppHeader({ eyebrow, title, aside, back }: Props) {
  return (
    <header className="app-header">
      {back ? (
        <Link href={back} className="app-back" aria-label="Back">
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
        <WaveBadge />
      </div>
    </header>
  );
}
