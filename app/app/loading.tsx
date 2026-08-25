"use client";

import WaitingHead from "@/components/app/WaitingHead";
import {
  Bone,
  BoneEvening,
  BoneHeading,
  BoneRow,
  BoneTally,
} from "@/components/app/Bones";
import { useSay, useYou } from "@/components/app/Words";

/** Home: what is coming up, the news, two stories, the handbook, the figures. */
export default function Loading() {
  const say = useSay();
  const you = useYou();

  return (
    <div className="waiting" aria-busy="true">
      {/* By name, from the first frame.
       *
       * This said "hello" and the screen that replaced it said "hello, Marvin", so
       * every arrival on this tab was watched to see whether the app knew who you
       * were. It always did: the layout read it before it drew the tab bar, and it
       * is in the browser with the rest of the words. See useYou.
       *
       * Everything under here stays a bone because it comes from the database and
       * takes as long as it takes. A name does not. */}
      <WaitingHead
        eyebrow={say("home.welcome")}
        title={you ? say("home.helloName").replace("{name}", you) : say("home.hello")}
      />

      <div className="waiting-part">
        <BoneHeading wide={168} />
        <div className="waiting-chips">
          <Bone w={104} h={34} />
          <Bone w={128} h={34} />
          <Bone w={96} h={34} />
        </div>
      </div>
      {[0, 1, 2].map((row) => (
        <BoneEvening key={row} lines={3} />
      ))}

      {/* The news: three of them, and no picture. A note in this club is a
          headline, a date beside it and three lines of words. */}
      <div className="waiting-part">
        <BoneHeading wide={124} />
      </div>
      {[0, 1, 2].map((row) => (
        <BoneRow key={row} lines={3} />
      ))}

      {/* Two stories, four by three, side by side. */}
      <div className="waiting-part">
        <BoneHeading wide={180} />
        <div className="waiting-covers">
          <Bone w="100%" h={120} />
          <Bone w="100%" h={120} />
        </div>
      </div>

      {/* The handbook's first heading and the paragraph under it: a number in the
          margin and two lines beside it. */}
      <div className="waiting-part">
        <BoneHeading wide={116} />
        <div className="waiting-row" style={{ padding: "12px 0 0", borderBottom: 0 }}>
          <Bone w={16} h={10} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <Bone w="58%" h={13} />
            <Bone w="86%" h={10} gap={8} />
          </span>
        </div>
      </div>

      {/* And what it all adds up to. */}
      <div className="waiting-part">
        <BoneHeading wide={144} />
      </div>
      <BoneTally />

      <span className="visually-hidden">{say("wait.coming")}</span>
    </div>
  );
}
