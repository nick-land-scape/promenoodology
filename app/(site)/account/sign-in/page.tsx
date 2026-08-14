import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/AuthForm";
import { currentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default async function SignInPage() {
  if (await currentProfile()) redirect("/account");

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">welcome back</h1>
        <p className="page-intro">
          Signing in is only useful for keeping your own details straight — everything worth reading
          on this site is open to everybody.
        </p>
        <SignInForm />
      </div>
    </main>
  );
}
