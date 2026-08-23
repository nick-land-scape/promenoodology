import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import Waves from "@/components/app/Waves";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { myWaves, readingIn, requireMember } from "@/lib/app/me";

export const metadata = { title: "Waves" };
export const dynamic = "force-dynamic";

export default async function WavesPage() {
  const say = speaking(await readingIn(), await getFrench());
  await requireMember("/app/waves");
  const { waves } = await myWaves();

  return (
    <>
      <AppHeader eyebrow={say("pg.hello")} title={say("pg.whoWaved")} back="/app" />

      {waves.length === 0 ? (
        <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
          {say("pg.nobodyYet")}{" "}
          <Link href="/app/connect">{say("pg.haveALookWho")}</Link>{" "}
          {say("pg.waveCostsNothing")}
        </p>
      ) : (
        <Waves waves={waves} />
      )}
    </>
  );
}
