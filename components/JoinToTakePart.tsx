import Link from "next/link";

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
export default function JoinToTakePart({ signUpEmail }: { signUpEmail?: string }) {
  return (
    <section className="taking-part">
      <span className="taking-part-does">
        <button type="button" className="pill pill-solid" disabled aria-disabled="true">
          count me in
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
          save this evening
        </button>
      </span>

      <p className="taking-part-why">
        Asking to come and keeping an evening on your list are for members —{" "}
        <Link href="/app/enter">join the community</Link> and both of these work, here and in the
        app.
        {signUpEmail ? (
          <>
            {" "}
            Or write to <a href={`mailto:${signUpEmail}`}>{signUpEmail}</a>, who are taking the
            names for this one.
          </>
        ) : null}
      </p>
    </section>
  );
}
