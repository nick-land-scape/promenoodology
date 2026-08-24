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
  tight = false,
  wordsOnly = false,
}: {
  signUpEmail?: string;
  lang: Lang;
  say: Said;
  /**
   * In the header rather than in the page.
   *
   * The same two controls, with the paragraph under them left off: at the top of
   * the page they sit beside the title, and three lines of explanation beside a
   * title is a title nobody reads.
   */
  tight?: boolean;
  /**
   * The explanation without the controls.
   *
   * Because the controls are in the header, and a second pair of the same two
   * grey buttons further down the same page does not read as a reminder — it
   * reads as a page that has been assembled twice. What belongs at the foot is
   * the answer to "why are those grey", which is a sentence.
   */
  wordsOnly?: boolean;
}) {
  return (
    <section className={tight ? "taking-part taking-part-tight" : "taking-part"}>
      {wordsOnly ? null : (
      <span className="taking-part-does">
        <button type="button" className="pill pill-solid" disabled aria-disabled="true">
          {say("part.countMeIn")}
        </button>
        {/* The bookmark is a shape everybody knows, so it says its own name only
            when there is a pointer on it — which is what buys the room for the
            calendar link beside it. The name is still there for a keyboard and for
            anything reading the page out; it is the *drawing* that carries it. */}
        <button
          type="button"
          className="pill pill-quiet"
          disabled
          aria-disabled="true"
          aria-label={say("part.save")}
          title={say("part.save")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
            <path
              d="M6.5 3.5h11v17l-5.5-4-5.5 4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span aria-hidden="true">{say("part.save")}</span>
        </button>
      </span>
      )}

      {tight ? null : (
      <p className="taking-part-why">
        {say("part.needsAccount")}{" "}
        <Link href="/app/enter">{say("part.join")}</Link> {say("part.bothWork")}
        {signUpEmail ? (
          <>
            {" "}
            {say("part.orWrite")} <a href={`mailto:${signUpEmail}`}>{signUpEmail}</a>,{" "}
            {say("part.takingNames")}
          </>
        ) : null}
      </p>
      )}
    </section>
  );
}
