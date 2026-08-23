import AppHeader from "@/components/app/AppHeader";
import { Bone, BoneHeading, BoneRow } from "@/components/app/Bones";
import { readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/** Account: the card, then previews of what is yours, then the settings rows. */
export default async function Loading() {
  const say = speaking(await readingIn(), await getFrench());
  return (
    <div className="waiting" aria-busy="true">
      <AppHeader eyebrow={say("acc.eyebrow")} title={say("acc.yourMembership")} />

      <div className="waiting-card">
        <Bone w="100%" h={180} />
      </div>

      <div className="waiting-part">
        <BoneHeading wide={140} />
      </div>
      <BoneRow lines={3} thumb />

      <div className="waiting-part">
        <BoneHeading wide={158} />
        <div className="waiting-grid">
          {[0, 1, 2, 3, 4, 5].map((tile) => (
            <Bone key={tile} w="100%" h={104} />
          ))}
        </div>
      </div>

      <div className="waiting-rows">
        {[0, 1, 2].map((row) => (
          <Bone key={row} w="100%" h={48} round />
        ))}
      </div>

      <span className="visually-hidden">{say("wait.coming")}</span>
    </div>
  );
}
