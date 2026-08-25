import AppHeader from "@/components/app/AppHeader";
import {
  Bone,
  BoneEvening,
  BoneHeading,
  BoneRow,
  BoneTally,
} from "@/components/app/Bones";
import { readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/** Home: what is coming up, the news, two stories, the handbook, the figures. */
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
