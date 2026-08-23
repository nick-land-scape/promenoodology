import AppHeader from "@/components/app/AppHeader";
import ReadingIn from "@/components/app/ReadingIn";
import Settling from "@/components/app/Settling";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";
import { readingIn, requireMember } from "@/lib/app/me";

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
  const lang = await readingIn();
  const say = speaking(lang, await getFrench());

  return (
    <>
      <AppHeader
        eyebrow={say("acc.personalInformation")}
        title={say("pg.whoYouAreHere")}
        back="/app/account"
      />
      <Settling
        back="/app/account"
        /* Which language we write to you in, as a field inside the form rather
           than a section above it: it is an answer about you, of the same kind as
           your name. Not the same as "languages" further down — those are what you
           speak, so somebody can find whoever can talk to the neighbour who came
           out to see what the noise was. */
        language={
          <ReadingIn
            chosen={me.readsIn}
            words={{ label: say("app.readingIn"), note: say("app.readingInNote") }}
          />
        }
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
