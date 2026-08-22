import AppHeader from "@/components/app/AppHeader";
import ReadingIn from "@/components/app/ReadingIn";
import Settling from "@/components/app/Settling";
import { readingIn, requireMember } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

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
        eyebrow="your personal information"
        title="who you are here"
        back="/app/account"
      />
      {/* Which language you read us in, at the top of the screen that is about
          you. It belongs with your name rather than with the settings: it is not
          a preference about the app, it is how you would rather be spoken to. And
          it is not the languages further down the form — those are what you speak,
          so somebody can find whoever can talk to the neighbour who came out to
          see what the noise was. */}
      <ReadingIn
        chosen={me.readsIn}
        words={{ label: say("app.readingIn"), note: say("app.readingInNote") }}
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
