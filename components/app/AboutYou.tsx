import Link from "next/link";
import Photo from "../Photo";
import { mediaUrl } from "@/lib/supabase/config";
import type { Me } from "@/lib/app/me";

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
export default function AboutYou({ me }: { me: Me }) {
  const lines: { label: string; value: string }[] = [
    { label: "where you are", value: [me.city, me.country].filter(Boolean).join(", ") },
    { label: "what you do", value: me.does },
    { label: "what you can bring", value: me.skills.join(", ") },
    { label: "languages", value: me.languages.join(", ") },
    // The year is never stored, so this is a day and a month, and only if they
    // said it could be seen.
    { label: "birthday", value: me.birthdayShown ? me.birthday : "" },
    { label: "instagram", value: me.instagram ? `@${me.instagram}` : "" },
  ].filter((line) => line.value);

  return (
    <aside className="account-you">
      <div className="account-you-head">
        {me.photoPath ? (
          <span className="account-you-photo">
            <Photo src={mediaUrl(me.photoPath)} alt="" width={300} height={400} sizes="120px" />
          </span>
        ) : null}
        <div>
          <h2 className="app-h2">{me.name || "no name yet"}</h2>
          <p className="app-note">
            {me.listed
              ? "On the community page, where anybody here can find you."
              : "Not on the community page — only the people cooking see this."}
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
          Nothing filled in yet. The rest of it is how anybody here finds out who can
          weld, who has a van and who speaks Romanian — which is most of how an
          evening actually gets built.
        </p>
      )}

      <Link className="pill pill-small" href="/app/account/details">
        {lines.length > 0 ? "change any of this" : "tell us who you are"}
      </Link>
    </aside>
  );
}
