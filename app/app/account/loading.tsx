"use client";

import WaitingHead from "@/components/app/WaitingHead";
import { Bone, BoneHeading, BoneRow } from "@/components/app/Bones";
import { useSay } from "@/components/app/Words";

/** Account: the card, what is yours in three previews, then the rows. */
export default function Loading() {
  const say = useSay();

  return (
    <div className="waiting" aria-busy="true">
      <WaitingHead eyebrow={say("acc.eyebrow")} title={say("acc.yourMembership")} />

      {/* A card's own proportions, 85.6 by 54, which on a phone is 214 points
          tall inside the gutter. The bone was 180, so the whole screen under it
          moved down by a finger's width the moment the card arrived. */}
      <div className="waiting-card">
        <Bone w="100%" h={214} />
      </div>

      {/* What you said yes to: two of them, with the evening's thumbnail on the
          right — these rows are not the ones on What's on, which lead with the
          date on a picture. Here the picture is a thumbnail at the end. */}
      <div className="waiting-part">
        <BoneHeading wide={140} />
      </div>
      {[0, 1].map((row) => (
        <BoneRow key={row} lines={3} thumb />
      ))}

      {/* Your photographs: six squares, three abreast. */}
      <div className="waiting-part">
        <BoneHeading wide={158} />
        <div className="waiting-grid">
          {[0, 1, 2, 3, 4, 5].map((tile) => (
            <Bone key={tile} w="100%" h={104} />
          ))}
        </div>
      </div>

      {/* And what you said, which was missing here entirely: two posts, each with
          its picture at the end of the row. */}
      <div className="waiting-part">
        <BoneHeading wide={132} />
      </div>
      {[0, 1].map((row) => (
        <BoneRow key={row} lines={2} thumb />
      ))}

      {/* The settings, and then the four written pages under their own label. The
          count is what everybody has: three settings, and one more for the block
          list. An admin has two beyond that, and a bone for a row only some people
          have is a bone that lies to most of them. */}
      <div className="waiting-rows">
        {[0, 1, 2, 3].map((row) => (
          <Bone key={row} w="100%" h={48} />
        ))}
      </div>

      <div className="waiting-part">
        <Bone w={78} h={9} />
      </div>
      <div className="waiting-rows" style={{ paddingTop: 0 }}>
        {[0, 1, 2, 3, 4].map((row) => (
          <Bone key={row} w="100%" h={48} />
        ))}
      </div>

      {/* And the way out. */}
      <div className="waiting-part">
        <Bone w="100%" h={46} />
      </div>

      <span className="visually-hidden">{say("wait.coming")}</span>
    </div>
  );
}
