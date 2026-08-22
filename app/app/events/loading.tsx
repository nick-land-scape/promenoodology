import AppHeader from "@/components/app/AppHeader";
import { Bone, BoneHeading, BoneRow } from "@/components/app/Bones";

/** What's on: the switcher, the places, then evenings with two buttons each. */
export default function Loading() {
  return (
    <div className="waiting" aria-busy="true">
      <AppHeader eyebrow="what's on" title="what would you like to join?" />

      <div className="waiting-switcher">
        <Bone w="50%" h={40} round />
        <Bone w="50%" h={40} round />
      </div>

      <div className="waiting-part">
        <BoneHeading wide={132} />
        <div className="waiting-chips">
          <Bone w={104} h={34} round />
          <Bone w={128} h={34} round />
        </div>
      </div>

      {[0, 1, 2, 3].map((row) => (
        <BoneRow key={row} thumb lines={2} button />
      ))}

      <span className="visually-hidden">Coming…</span>
    </div>
  );
}
