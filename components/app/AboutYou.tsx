import Link from "next/link";
import Photo from "../Photo";
import { mediaUrl } from "@/lib/supabase/config";
import type { Me } from "@/lib/app/me";
import { readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/**
 * What the club knows about you, beside the card.
 *
 * Only on a tablet, and that is a layout decision rather than a secret: on a
 * phone the card fills the width and this would be a second card's worth of
 * scrolling before the first thing you came for. On a screen this wide the card
 * sits in the left half and the right half was paper, so the details that are
 * otherwise one tap away are simply *there* — which is what a wide screen is for.
 *
 * Every line is optional, and a line with nothing in it does not appear. What is
 * left, when somebody has filled in nothing at all, is the invitation to.
 */
export default async function AboutYou({ me }: { me: Me }) {
  const say = speaking(await readingIn(), await getFrench());
  const lines: { label: string; value: string }[] = [
    { label: say("me.whereYouAre"), value: [me.city, me.country].filter(Boolean).join(", ") },
    { label: say("me.whatYouDo"), value: me.does },
    { label: say("me.whatYouBring"), value: me.skills.join(", ") },
    { label: say("me.languages"), value: me.languages.join(", ") },
    // The year is never stored, so this is a day and a month, and only if they
    // said it could be seen.
    { label: say("me.birthday"), value: me.birthdayShown ? me.birthday : "" },
    { label: say("me.instagram"), value: me.instagram ? `@${me.instagram}` : "" },
  ].filter((line) => line.value);

  return (
    <aside className="account-you">
      <div className="account-you-head">
        {me.photoPath ? (
          <span className="account-you-photo">
            <Photo src={mediaUrl(me.photoPath)} alt="" width={300} height={400} sizes="120px" />
          </span>
        ) : (
          /* An empty frame rather than nothing at all: a gap where a face should
             be is the clearest possible ask for one, and it keeps the row the
             same shape whether or not anybody has added theirs. */
          <Link className="account-you-photo account-you-photo-none" href="/app/account/details">
            {say("you.addPortrait")}
          </Link>
        )}
        <div>
          <h2 className="app-h2">{me.name || say("you.noNameYet")}</h2>
          <p className="app-note">
            {say(me.listed ? "me.onCommunity" : "me.notOnCommunity")}
          </p>
        </div>
      </div>

      {lines.length > 0 ? (
        <dl className="account-you-list">
          {lines.map((line) => (
            <div key={line.label}>
              <dt>{line.label}</dt>
              <dd>{line.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="app-note">
          {say("you.nothingFilledIn")}
        </p>
      )}

      <Link className="pill pill-small" href="/app/account/details">
        {lines.length > 0 ? "change any of this" : "tell us who you are"}
      </Link>
    </aside>
  );
}
