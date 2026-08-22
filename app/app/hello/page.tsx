import AppHeader from "@/components/app/AppHeader";
import Settling from "@/components/app/Settling";
import { requireMember } from "@/lib/app/me";

export const metadata = { title: "Who you are" };
export const dynamic = "force-dynamic";

/**
 * Asked once, after joining.
 *
 * Everything on it is optional except a name, and every field is here for a reason
 * that belongs to this collective rather than because forms usually have it — see
 * the note in the component.
 */
export default async function HelloPage() {
  const me = await requireMember("/app/hello");

  return (
    <>
      <AppHeader eyebrow="hello" title="who are you, then?" />
      <Settling
        first
        back="/app"
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
