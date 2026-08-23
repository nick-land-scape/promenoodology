import AppHeader from "@/components/app/AppHeader";
import { Bone, BoneSmallSwitcher, BoneSwitcher } from "@/components/app/Bones";
import { readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/** Read: three views, the two ways of looking at the stories, then the covers. */
export default async function Loading() {
  const say = speaking(await readingIn(), await getFrench());
  return (
    <div className="waiting" aria-busy="true">
      <AppHeader eyebrow={say("read.eyebrow")} title={say("read.whatWeHaveDone")} />
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

      <span className="visually-hidden">{say("wait.coming")}</span>
    </div>
  );
}
