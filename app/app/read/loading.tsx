import { Bone, BoneHead, BoneSmallSwitcher, BoneSwitcher } from "@/components/app/Bones";

/** Read: three views, the two ways of looking at the stories, then the covers. */
export default function Loading() {
  return (
    <div className="waiting" aria-busy="true">
      <BoneHead />
      <BoneSwitcher />
      <BoneSmallSwitcher />

      <div className="waiting-stories">
        {[0, 1].map((cover) => (
          <div className="waiting-story" key={cover}>
            <Bone w="100%" h={220} />
            <span className="waiting-story-words">
              <Bone w="66%" h={22} />
              <Bone w="44%" h={11} gap={9} />
            </span>
          </div>
        ))}
      </div>

      <span className="visually-hidden">Coming…</span>
    </div>
  );
}
