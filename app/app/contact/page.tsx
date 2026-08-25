import AppHeader from "@/components/app/AppHeader";
import TellUs from "@/components/app/TellUs";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { readingIn, requireMember } from "@/lib/app/me";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export const metadata = { title: "Get in touch" };
export default async function ContactPage() {
  const say = speaking(await readingIn(), await getFrench());
  await requireMember("/app/contact");

  return (
    <>
      <AppHeader eyebrow={say("pg.getInTouch")} title={say("pg.sayAnything")} back="/app/account" />
      <TellUs />
    </>
  );
}
