import Link from "next/link";
import { myWaves, readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/**
 * The bubble at the top right: how many people have waved at you.
 *
 * Nothing when nobody has, because a notification bell that is always there and
 * always empty is furniture. It sits in the header on every screen of the app, so
 * it is read once here rather than passed down from four pages.
 */
export default async function WaveBadge() {
  const [{ unseen, waves }, lang, french] = await Promise.all([myWaves(), readingIn(), getFrench()]);
  const say = speaking(lang, french);

  return (
    <Link
      href="/app/waves"
      className="wave-badge"
      aria-label={
        unseen > 0
          ? say("wave.howMany").replace("{n}", String(unseen))
          : say("wave.whoHas")
      }
    >
      <svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">
        {/* A hand, mid-wave. */}
        <path
          d="M8.4 11V5.9a1.3 1.3 0 0 1 2.6 0V11m0-.6V4.7a1.3 1.3 0 0 1 2.6 0V11m0-.6V6.1a1.3 1.3 0 0 1 2.6 0v6.3m-7.8-1.2v-.9a1.3 1.3 0 0 0-2.6 0v3.4c0 3.4 2.4 6.1 5.7 6.1s5.9-2.1 5.9-5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {unseen > 0 ? <em>{unseen > 9 ? "9+" : unseen}</em> : null}
      {/* A quiet dot for waves already read, so the way to them is still there. */}
      {unseen === 0 && waves.length > 0 ? <span aria-hidden="true" /> : null}
    </Link>
  );
}
