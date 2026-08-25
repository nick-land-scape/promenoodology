import AppHeader from "@/components/app/AppHeader";
import {
  Bone,
  BoneEvening,
  BoneHeading,
  BoneRow,
  BoneTally,
} from "@/components/app/Bones";
import { readingIn, whoIsThis } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/** Home: what is coming up, the news, two stories, the handbook, the figures. */
export default async function Loading() {
  const [lang, french, me] = await Promise.all([readingIn(), getFrench(), whoIsThis()]);
  const say = speaking(lang, french);

  return (
    <div className="waiting" aria-busy="true">
      {/* By name, from the first frame.
       *
       * This said "hello" and the screen that replaced it said "hello Marvin", so
       * every arrival on this tab was watched to see whether it knew who you were.
       * It always did — who you are is in the session this file is already
       * reading to know which language to say hello in — it simply was not asked.
       *
       * Everything under here is a bone because it comes from the database and
       * takes as long as it takes. A name does not: it is the same read the layout
       * around this has already done, and asking again is free. */}
      <AppHeader
        eyebrow={say("home.welcome")}
        title={
          me?.name
            ? say("home.helloName").replace("{name}", me.name.split(" ")[0])
            : say("home.hello")
        }
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
