import AppHeader from "@/components/app/AppHeader";
import { Bone, BoneHeading, BoneRow } from "@/components/app/Bones";

/** Account: the card, then previews of what is yours, then the settings rows. */
export default function Loading() {
  return (
    <div className="waiting" aria-busy="true">
      <AppHeader eyebrow="you" title="your membership" />

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

      <span className="visually-hidden">Coming…</span>
    </div>
  );
}
