import AppHeader from "@/components/app/AppHeader";
import { Bone } from "@/components/app/Bones";

/** Connect: two views, the one-line composer, then posts with pictures. */
export default function Loading() {
  return (
    <div className="waiting" aria-busy="true">
      <AppHeader eyebrow="connect" title="what everyone is up to" />

      <div className="waiting-switcher">
        <Bone w="50%" h={40} round />
        <Bone w="50%" h={40} round />
      </div>

      <div className="waiting-row">
        <Bone w={40} h={40} round />
        <span style={{ flex: 1 }}>
          <Bone w="70%" h={14} />
        </span>
        <Bone w={30} h={30} round />
      </div>

      {[0, 1].map((post) => (
        <div className="waiting-post" key={post}>
          <div
            className="waiting-row"
            style={{ borderBottom: 0, paddingBottom: 0 }}
          >
            <Bone w={40} h={40} round />
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

      <span className="visually-hidden">Coming…</span>
    </div>
  );
}
