import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import CodeEntry from "@/components/CodeEntry";
import { CODE_COOKIE, maskEmail } from "@/lib/auth-code";
import { currentProfile } from "@/lib/supabase/server";
import { resendCode } from "../actions";

export const metadata: Metadata = {
  title: "The code",
  robots: { index: false },
};

/**
 * The second half of signing in, on its own page.
 *
 * It was one page with two forms on it, and the two black buttons read as a
 * choice rather than as a sequence — you could not tell which one you were meant
 * to press. Splitting it leaves one thing to do here, and asking for another
 * code sits underneath as a sentence rather than as a second button.
 */
export default async function CodePage({
  searchParams,
}: {
  searchParams: Promise<{ again?: string }>;
}) {
  if (await currentProfile()) redirect("/account");

  // Nobody arrives here directly: without an address in the cookie there is no
  // code to check.
  const jar = await cookies();
  const email = jar.get(CODE_COOKIE)?.value;
  if (!email) redirect("/account/sign-in");

  const { again } = await searchParams;

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">check your email</h1>
        <p className="page-intro">
          {again ? "A new code is on its way to " : "We sent a code to "}
          <strong>{maskEmail(email)}</strong>. Type it in below — or click the link in the same
          email, which does the same thing.
        </p>

        <CodeEntry />

        {/* Divs rather than paragraphs: a form may not live inside a <p>, and
            the sentence reads better with the button inside it than after it. */}
        <div className="auth-again">
          <div>
            Nothing arrived? Look in the spam folder first — then{" "}
            <form action={resendCode} className="auth-inline">
              <button type="submit" className="text-button">
                send me another code
              </button>
            </form>
            .
          </div>
          <div>
            Wrong address? <Link href="/account/sign-in">start again</Link>.
          </div>
        </div>
      </div>
    </main>
  );
}
