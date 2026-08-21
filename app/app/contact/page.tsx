import AppHeader from "@/components/app/AppHeader";
import TellUs from "@/components/app/TellUs";
import { requireMember } from "@/lib/app/me";

export const metadata = { title: "Get in touch" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  await requireMember("/app/contact");

  return (
    <>
      <AppHeader eyebrow="get in touch" title="say anything" back="/app/account" />
      <TellUs />
    </>
  );
}
