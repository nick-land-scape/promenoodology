import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/AuthForm";
import { currentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Join",
  robots: { index: false },
};

export default async function RegisterPage() {
  if (await currentProfile()) redirect("/account");

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">join us</h1>
        <p className="page-intro">
          An account puts your name on the <Link href="/community">community page</Link> and lets
          you keep it up to date. It is not a ticket to anything: everything we do is open whether
          you have one or not.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
