import AppHeader from "@/components/app/AppHeader";
import TellUs from "@/components/app/TellUs";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { readingIn, requireMember } from "@/lib/app/me";

export const metadata = { title: "Get in touch" };
export const dynamic = "force-dynamic";

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
