import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { pretty } from "@/lib/admin/when";
import { supabaseServer } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/rows";
import { signOut } from "@/lib/site-actions/account";

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
    .eq("user_id", user.id)
    .single<ProfileRow>();

  return (
    <main className="page">
      <div className="auth">
        <h1 className="page-title">your profile</h1>
        <p className="page-intro">
          This is everything we keep about you, and nearly all of it is yours to change.
        </p>

        <ProfileForm
          userId={user.id}
          email={user.email ?? ""}
          name={profile?.name ?? ""}
          country={profile?.country ?? ""}
          listed={profile?.listed ?? true}
          photo={profile?.photo_path ?? null}
          memberNo={profile?.member_no ?? null}
          since={profile?.joined_on ? pretty(profile.joined_on) : ""}
        />

        {/* The way into the back of the house was here too. It is in the strip
            along the top of every page now, which is one place rather than two.
        */}

        <form action={signOut} className="auth-out">
          <button type="submit" className="text-button">
            sign out
          </button>
        </form>
      </div>
    </main>
  );
}
