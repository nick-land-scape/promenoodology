import Link from "next/link";
import AppHeader from "@/components/app/AppHeader";
import Waves from "@/components/app/Waves";
import { myWaves, requireMember } from "@/lib/app/me";

export const metadata = { title: "Waves" };
export const dynamic = "force-dynamic";

export default async function WavesPage() {
  await requireMember("/app/waves");
  const { waves } = await myWaves();

  return (
    <>
      <AppHeader eyebrow="hello" title="who waved at you" back="/app" />

      {waves.length === 0 ? (
        <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
          Nobody yet. <Link href="/app/connect">Have a look at who is around</Link> — a wave is the
          whole message, so it costs nothing to send one.
        </p>
      ) : (
        <Waves waves={waves} />
      )}
    </>
  );
}
