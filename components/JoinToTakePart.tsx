import Link from "next/link";
import { at, type Lang } from "@/lib/lang";
import type { Said } from "@/lib/words";

/**
 * The two things a member can do about an evening, shown to everybody and
 * working for nobody.
 *
 * They are the app's own controls — count me in, keep it on your list — and they
 * are here switched off on purpose. The alternative was to say nothing, and
 * saying nothing is what the site has been doing: a visitor reads the whole
 * page, decides they would like to come, and finds no way of saying so and no
 * hint that there is one somewhere else.
 *
 * A disabled button is usually a small cruelty. It earns its place exactly when
 * it is the shape of the thing you are being told about — you can see what you
 * would press, and the line under it says what it takes to press it.
 */
export default function JoinToTakePart({
  signUpEmail,
  lang,
  say,
}: {
  signUpEmail?: string;
  lang: Lang;
  say: Said;
}) {
  return (
    <section className="taking-part">
      <span className="taking-part-does">
        <button type="button" className="pill pill-solid" disabled aria-disabled="true">
          {say("part.countMeIn")}
        </button>
        <button type="button" className="pill" disabled aria-disabled="true">
          <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
            <path
              d="M6.5 3.5h11v17l-5.5-4-5.5 4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          {say("part.save")}
        </button>
      </span>

      <p className="taking-part-why">
        {say("part.why")}{" "}
        <Link href="/app/enter">{say("part.join")}</Link> {say("part.bothWork")}
        {signUpEmail ? (
          <>
            {" "}
            {say("part.orWrite")} <a href={`mailto:${signUpEmail}`}>{signUpEmail}</a>,{" "}
            {say("part.takingNames")}
          </>
        ) : null}
      </p>
    </section>
  );
}
