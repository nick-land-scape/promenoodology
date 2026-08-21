import AppHeader from "@/components/app/AppHeader";
import MySigningIn from "@/components/app/MySigningIn";
import { requireMember } from "@/lib/app/me";

export const metadata = { title: "Ways to sign in" };
export const dynamic = "force-dynamic";

export default async function SigningInPage() {
  const me = await requireMember("/app/account/signing-in");

  return (
    <>
      <AppHeader eyebrow="ways to sign in" title="how you get in" back="/app/account" />
      <MySigningIn email={me.email} />
    </>
  );
}
