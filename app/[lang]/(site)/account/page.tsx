import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { pretty } from "@/lib/admin/when";
import { supabaseServer } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/rows";
import { signOut } from "@/lib/site-actions/account";
import { isLang, PLAIN, type Lang } from "@/lib/lang";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false },
};

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: asked } = await params;
  const lang: Lang = isLang(asked) ? asked : PLAIN;
  const say = speaking(lang, await getFrench());
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
          city={profile?.city ?? ""}
          country={profile?.country ?? ""}
          words={{
            name: say("you.yourName"),
            showMe: say("you.showMe"),
            saving: say("you.saving"),
            save: say("you.save"),
            town: say("you.theTown"),
            country: say("you.theCountry"),
            optional: say("you.optional"),
          }}
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
