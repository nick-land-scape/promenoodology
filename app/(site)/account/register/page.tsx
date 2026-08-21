import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinForm } from "@/components/AuthForm";
import { onlyAPath } from "@/lib/auth-code";
import { currentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Join us",
  robots: { index: false },
};

/**
 * Joining.
 *
 * This page used to say "not this way, for now": accounts started with an
 * invitation from the back of the house, which was a reasonable rule for a club
 * of sixty-five people and an impossible one for an app in a store — an app you
 * cannot get into cannot be reviewed, let alone used.
 *
 * So it is a door. An address and a code, or Apple, and nothing to pay. What an
 * account is *for* is worth saying plainly on it, because most of this site does
 * not need one.
 */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  if (await currentProfile()) redirect("/account");
  const { from } = await searchParams;
  const back = onlyAPath(from);

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">join us</h1>
        <p className="page-intro">
          There is no list to get on and nothing to pay. An account is for the members&rsquo; app:
          what is coming up, saying you will be there, and the people who cook with us. Everything
          worth reading on this site is open to everybody either way.
        </p>
        <JoinForm back={back} />
        <p className="auth-switch">
          Only after the letters? The <Link href="/newsletter">newsletter</Link> needs no account at
          all.
        </p>
      </div>
    </main>
  );
}
