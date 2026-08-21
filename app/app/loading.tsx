import { Bone, BoneHead, BoneHeading, BoneRow } from "@/components/app/Bones";

/** Home: what is coming up, the news, and three previews. */
export default function Loading() {
  return (
    <div className="waiting" aria-busy="true">
      <BoneHead />

      <div className="waiting-part">
        <BoneHeading wide={168} />
        <div className="waiting-chips">
          <Bone w={104} h={34} round />
          <Bone w={128} h={34} round />
          <Bone w={96} h={34} round />
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

      <span className="visually-hidden">Coming…</span>
    </div>
  );
}
