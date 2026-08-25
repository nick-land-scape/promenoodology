"use client";

import WaitingHead from "@/components/app/WaitingHead";
import { Bone, BoneSmallSwitcher, BoneSwitcher } from "@/components/app/Bones";
import { useSay } from "@/components/app/Words";

/** Read: three views, the two ways of looking at the stories, then the covers. */
export default function Loading() {
  const say = useSay();

  return (
    <div className="waiting" aria-busy="true">
      <WaitingHead eyebrow={say("read.eyebrow")} title={say("read.whatWeHaveDone")} />
      <BoneSwitcher />
      <BoneSmallSwitcher />

      <div className="waiting-stories">
        {[0, 1].map((cover) => (
          <div className="waiting-story" key={cover}>
            {/* Three by two, as the cover is: a photograph the width of the
                screen is 250 points tall on a phone, and the bone was 220 — thirty
                points of the words below it moving up as each one landed. */}
            <Bone w="100%" h={240} />
            <span className="waiting-story-words">
              {/* Four things, not two: the name, the line under it, where and
                  when, and the two lines of the story itself that make this a list
                  you can choose from rather than a shelf. */}
              <Bone w="66%" h={22} />
              <Bone w="52%" h={12} gap={8} />
              <Bone w="38%" h={10} gap={7} />
              <Bone w="92%" h={11} gap={9} />
              <Bone w="74%" h={11} gap={5} />
            </span>
          </div>
        ))}
      </div>

      <span className="visually-hidden">{say("wait.coming")}</span>
    </div>
  );
}
