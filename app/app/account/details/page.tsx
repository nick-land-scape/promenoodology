import AppHeader from "@/components/app/AppHeader";
import Settling from "@/components/app/Settling";
import { requireMember } from "@/lib/app/me";

export const metadata = { title: "Your personal information" };
export const dynamic = "force-dynamic";

/**
 * Everything about you, afterwards.
 *
 * The same fields as the screen that asks once, from the same component — because
 * they are the same questions, and two forms over one set of columns is two forms
 * that drift. What changes here is the manners: no explaining line, no "not now",
 * and it goes back to the account rather than into the app.
 */
export default async function DetailsPage() {
  const me = await requireMember("/app/account/details");

  return (
    <>
      <AppHeader
        eyebrow="your personal information"
        title="who you are here"
        back="/app/account"
      />
      <Settling
        back="/app/account"
        userId={me.userId}
        name={me.name}
        city={me.city}
        country={me.country}
        does={me.does}
        skills={me.skills}
        languages={me.languages}
        birthday={me.birthday}
        birthdayShown={me.birthdayShown}
        instagram={me.instagram}
        cannotEat={me.cannotEat}
        phone={me.phone}
        listed={me.listed}
        photo={me.photoPath}
      />
    </>
  );
}
