import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { supabaseServer } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/rows";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false },
};

export default async function AccountPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileRow>();

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">your profile</h1>
        <p className="page-intro">
          Signed in as {user.email}. This is everything we keep about you, and you can change all of
          it.
        </p>

        <ProfileForm
          name={profile?.name ?? ""}
          country={profile?.country ?? ""}
          listed={profile?.listed ?? true}
        />

        {profile?.role === "admin" ? (
          <p className="auth-switch">
            You are an admin: <Link href="/admin">look after the site →</Link>
          </p>
        ) : null}

        <form action={signOut} className="auth-out">
          <button type="submit" className="text-button">
            sign out
          </button>
        </form>
      </div>
    </main>
  );
}
