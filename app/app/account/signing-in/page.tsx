import AppHeader from "@/components/app/AppHeader";
import MySigningIn from "@/components/app/MySigningIn";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { readingIn, requireMember } from "@/lib/app/me";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export const metadata = { title: "Ways to sign in" };
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
