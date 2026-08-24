import AppHeader from "@/components/app/AppHeader";
import { Bone, BoneHeading, BoneRow } from "@/components/app/Bones";
import { readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/** Home: what is coming up, the news, and three previews. */
export default async function Loading() {
  const say = speaking(await readingIn(), await getFrench());
  return (
    <div className="waiting" aria-busy="true">
      {/* The one header in the app whose words are not known before the answer
          arrives: it says hello by name. Everything else about it is known, so
          only the name is a bone. */}
      <AppHeader eyebrow={say("home.welcome")} title={say("home.hello")} />

      <div className="waiting-part">
        <BoneHeading wide={168} />
        <div className="waiting-chips">
          <Bone w={104} h={34} />
          <Bone w={128} h={34} />
          <Bone w={96} h={34} />
        </div>
      </div>
      {[0, 1, 2].map((row) => (
        <BoneRow key={row} date thumb lines={3} />
      ))}

      <div className="waiting-part">
        <BoneHeading wide={124} />
      </div>
      {[0, 1].map((row) => (
        <BoneRow key={row} lines={3} />
      ))}

      <div className="waiting-part">
        <BoneHeading wide={180} />
        <div className="waiting-covers">
          <Bone w="100%" h={128} />
          <Bone w="100%" h={128} />
        </div>
      </div>

      <span className="visually-hidden">{say("wait.coming")}</span>
    </div>
  );
}
