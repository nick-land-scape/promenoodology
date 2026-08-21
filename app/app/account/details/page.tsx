import AppHeader from "@/components/app/AppHeader";
import MyDetails from "@/components/app/MyDetails";
import { requireMember } from "@/lib/app/me";

export const metadata = { title: "Your personal information" };
export const dynamic = "force-dynamic";

export default async function DetailsPage() {
  const me = await requireMember("/app/account/details");

  return (
    <>
      <AppHeader
        eyebrow="your personal information"
        title="who you are here"
        back="/app/account"
      />
      <MyDetails
        userId={me.userId}
        name={me.name}
        country={me.country}
        photo={me.photoPath}
        listed={me.listed}
      />
    </>
  );
}
