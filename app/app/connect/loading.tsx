import AppHeader from "@/components/app/AppHeader";
import { Bone, BoneCompose } from "@/components/app/Bones";
import { readingIn } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { speaking } from "@/lib/words";

/** Connect: three views, the posts, and the line you write in at the foot. */
export default async function Loading() {
  const say = speaking(await readingIn(), await getFrench());
  return (
    <div className="waiting" aria-busy="true">
      <AppHeader eyebrow={say("con.eyebrow")} title={say("con.whatEveryone")} />

      {/* Three, not two: what people said, what the club is being asked to do,
          and who is in it. The third arrived with the ideas tab and this stayed
          at two, so the switcher grew a column the moment the screen landed. */}
      <div className="waiting-switcher">
        <Bone w="33%" h={40} />
        <Bone w="33%" h={40} />
        <Bone w="33%" h={40} />
      </div>

      {[0, 1].map((post) => (
        <div className="waiting-post" key={post}>
          <div
            className="waiting-row"
            style={{ borderBottom: 0, paddingBottom: 0 }}
          >
            <Bone w={40} h={40} face />
            <span style={{ flex: 1 }}>
              <Bone w={128} h={14} />
              <Bone w={92} h={9} gap={7} />
            </span>
          </div>
          <div style={{ padding: "10px 18px 0" }}>
            <Bone w="94%" h={12} />
            <Bone w="72%" h={12} gap={7} />
          </div>
          <Bone w="100%" h={210} gap={12} />
        </div>
      ))}

      <BoneCompose />

      <span className="visually-hidden">{say("wait.coming")}</span>
    </div>
  );
}
