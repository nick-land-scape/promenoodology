import AppHeader from "@/components/app/AppHeader";
import { Bone, BoneEvening, BoneHeading } from "@/components/app/Bones";
import { readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/** What's on: two ways of looking, the places, then the evenings. */
export default async function Loading() {
  const say = speaking(await readingIn(), await getFrench());
  return (
    <div className="waiting" aria-busy="true">
      <AppHeader eyebrow={say("on.eyebrow")} title={say("on.whatToJoin")} />

      <div className="waiting-switcher">
        <Bone w="50%" h={40} />
        <Bone w="50%" h={40} />
      </div>

      <div className="waiting-part">
        <BoneHeading wide={132} />
        <div className="waiting-chips">
          <Bone w={104} h={34} />
          <Bone w={128} h={34} />
        </div>
      </div>

      {[0, 1, 2, 3].map((row) => (
        <BoneEvening key={row} />
      ))}

      <span className="visually-hidden">{say("wait.coming")}</span>
    </div>
  );
}
