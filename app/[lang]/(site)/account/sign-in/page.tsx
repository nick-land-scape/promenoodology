import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/AuthForm";
import { onlyAPath } from "@/lib/auth-code";
import { currentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

/** Why the link in somebody's email did not work, said in words. */
const REASONS: Record<string, string> = {
  used: "That link has already been used, or it has sat too long. Ask for a new code and it will come with a fresh one.",
  device:
    "That link was asked for in a different browser, so it cannot finish here. Ask for a new code below and type it in instead — a code works anywhere.",
  empty: "That link arrived without anything in it. Ask for a new one below.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; from?: string }>;
}) {
  const { link, from } = await searchParams;
  const back = onlyAPath(from);

  // Already in. Back where they were, or the front page — not the profile
  // form, which is not an answer to "sign me in" for somebody already signed in.
  if (await currentProfile()) redirect(back && !back.startsWith("/account") ? back : "/");

  const trouble = link ? REASONS[link] : undefined;

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">welcome back</h1>
        <p className="page-intro">
          Signing in is only useful for keeping your own details straight — everything worth reading
          on this site is open to everybody.
        </p>
        {trouble ? <p className="auth-error">{trouble}</p> : null}
        <SignInForm back={back} />
      </div>
    </main>
  );
}
