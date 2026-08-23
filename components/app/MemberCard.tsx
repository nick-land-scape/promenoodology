"use client";

import Image from "next/image";
import { useState } from "react";
import Tilt from "react-parallax-tilt";
import Photo from "../Photo";
import { mediaUrl } from "@/lib/supabase/config";
import { useSay } from "./Words";

type Props = {
  name: string;
  number: number | null;
  since: string;
  country: string;
  photo: string | null;
};

/**
 * The card, and it behaves like a card.
 *
 * A membership card is an object — the one thing in this app that stands for
 * "you are one of us" — and it was a rectangle with three lines of text in it.
 * This one follows your finger, or your mouse, and catches the light across its
 * face the way a laminated card does under a lamp.
 *
 * react-parallax-tilt rather than hand-written pointer maths, and it earns the
 * dependency: the hand-written version only moved while it was held down, which
 * on a phone is right and with a mouse is wrong — you want it to lean as the
 * pointer crosses it. It also brings the things that are tedious to get right and
 * invisible when they are missing: touch and mouse through one path, a gyroscope
 * where there is one, the glare travelling with the light rather than sweeping on
 * a timer, and a proper spring back to flat when the pointer leaves.
 *
 * Everything on the card sits inside the transformed plane, so the ink leans with
 * the paper — the giveaway of a fake tilt is text that stays flat while its card
 * turns underneath it.
 */
export default function MemberCard({ name, number, since, country, photo }: Props) {
  const say = useSay();
  /* Whether it is being held. The library only sets a transform, so the shadow
     under the card — the thing that makes it look like an object off the page
     rather than a picture printed on it — has to be told separately. */
  const [lifted, setLifted] = useState(false);

  return (
    /* The pointer handlers sit on the stage rather than on the tilt itself: the
       shadow under the card is ours to draw, so the moment it lifts should be
       ours to decide — and the library's own props do not include these. */
    <div
      className="member-stage"
      onPointerEnter={() => setLifted(true)}
      onPointerDown={() => setLifted(true)}
      onPointerLeave={() => setLifted(false)}
      onPointerUp={() => setLifted(false)}
      onPointerCancel={() => setLifted(false)}
    >
      <Tilt
        className={lifted ? "member-card member-card-lifted" : "member-card"}
        /* Shallow. A membership card is stiff — it is not a page turning. */
        tiltMaxAngleX={9}
        tiltMaxAngleY={12}
        perspective={950}
        /* Left at its own size. The library applies its scale the moment the card
           is on the page rather than only while it is being touched, so anything
           but 1 is a card that sits permanently a little too big — which reads as
           a mistake rather than as an effect. */
        scale={1}
        transitionSpeed={900}
        /* The light: one soft, wide highlight that follows the pointer rather
           than a band that sweeps past on a clock. */
        glareEnable
        /* Brighter than it was, because the card is metal now rather than
           laminated paper: metal returns most of the light it is given. */
        glareMaxOpacity={0.55}
        glareColor="#ffffff"
        glarePosition="all"
        glareBorderRadius="10px"
        gyroscope
      >
        {/* The sheen: a band of light lying across the card, which moves on its
            own every few seconds.
            It is the only thing on this screen that moves unasked, and it is here
            for a reason — pressing a card to tilt it is not a thing anybody knows
            to try, and a card that catches the light by itself is one you are more
            likely to touch. Quiet enough not to nag: eight seconds apart, and a
            second and a half to cross. */}
        <span className="member-card-metal" aria-hidden="true" />

        <div className="member-card-face">
          <div className="member-card-top">
            {photo ? (
              <span className="member-card-face-photo">
                <Photo src={mediaUrl(photo)} alt="" width={300} height={400} sizes="72px" />
              </span>
            ) : (
              <span />
            )}
            {/* The mark itself, not a typographic stand-in for it. Top right, so
                the eye lands on the name first and the mark signs it off. */}
            <Image
              className="member-card-logo"
              src="/logo-mark.png"
              alt=""
              width={600}
              height={582}
              sizes="46px"
              priority
            />
          </div>

          <p className="member-name">{name || "no name yet"}</p>
          <p className="member-since">
            {[since ? say("card.memberSince").replace("{when}", since) : null, country || null]
              .filter(Boolean)
              .join(" · ")}
          </p>

          <p className="member-number">
            {number ? (
              <>
                <span aria-hidden="true">{say("card.no")}</span> {String(number).padStart(4, "0")}
              </>
            ) : (
              "not numbered yet"
            )}
          </p>
        </div>
      </Tilt>
    </div>
  );
}
