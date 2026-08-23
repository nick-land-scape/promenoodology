import AppHeader from "@/components/app/AppHeader";
import MySigningIn from "@/components/app/MySigningIn";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { readingIn, requireMember } from "@/lib/app/me";

export const metadata = { title: "Ways to sign in" };
export const dynamic = "force-dynamic";

export default async function SigningInPage() {
  const say = speaking(await readingIn(), await getFrench());
  const me = await requireMember("/app/account/signing-in");

  return (
    <>
      <AppHeader
        eyebrow={say("acc.waysToSignIn")}
        title={say("pg.howYouGetIn")}
        back="/app/account"
      />
      <MySigningIn email={me.email} />
    </>
  );
}
