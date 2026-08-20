import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Join",
  robots: { index: false },
};

/**
 * Joining is closed for now: an account starts with an invitation from
 * /admin → people.
 *
 * The page stays rather than 404ing, because there are links to it in the wild
 * and a door that says "not this way, try here" is worth more than a page that
 * says nothing. The newsletter is the honest thing to offer instead — it is what
 * an account was mostly for anyway.
 */
export default async function RegisterPage() {
  if (await currentProfile()) redirect("/account");

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">not this way, for now</h1>
        <p className="page-intro">
          Accounts are closed at the moment. They start with an invitation from us, so there is
          nothing to fill in here — and nothing you are missing: everything worth reading on this
          site is open to everybody, with an account or without one.
        </p>
        <p className="page-intro">
          Put your address on the <Link href="/newsletter">newsletter</Link> and you will hear when
          there is something to come to. If you would rather just write,{" "}
          <a href="mailto:info@promeNOODology.com">info@promeNOODology.com</a> reaches us.
        </p>
        <p className="auth-switch">
          Already have an account? <Link href="/account/sign-in">Sign in</Link>.
        </p>
      </div>
    </main>
  );
}
