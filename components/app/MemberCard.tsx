"use client";

import Image from "next/image";
import { useState } from "react";
import Tilt from "react-parallax-tilt";
import { buzz } from "@/lib/native";
import { useSay } from "./Words";

type Props = {
  name: string;
  number: number | null;
  since: string;
  country: string;
};

/**
 * The card, and it behaves like a card.
 *
 * A membership card is an object — the one thing in this app that stands for
 * "you are one of us" — and it was a rectangle with three lines of text in it.
 * This one follows your finger, or your mouse, catches the light across its face
 * the way a real card does under a lamp, and turns over when you ask it to.
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
 *
 * No photograph on it. A face belongs on a document that has to prove you are
 * you, and this proves nothing — it says somebody knows you, which is what the
 * back of it now says in words. It was also the one element that had to be
 * inverted, masked and re-cropped for dark paper, and the card reads better
 * without it: a name, a number and a mark, which is what a membership card is.
 */
export default function MemberCard({ name, number, since, country }: Props) {
  const say = useSay();
  /* Whether it is being held. The library only sets a transform, so the shadow
     under the card — the thing that makes it look like an object off the page
     rather than a picture printed on it — has to be told separately. */
  const [lifted, setLifted] = useState(false);
  const [over, setOver] = useState(false);

  function turn() {
    void buzz("medium");
    setOver((now) => !now);
  }

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
        className={[
          "member-card",
          lifted ? "member-card-lifted" : "",
          over ? "member-card-over" : "",
        ]
          .filter(Boolean)
          .join(" ")}
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
        {/*
         * The card turns over, and both sides are here at once.
         *
         * Two faces on one plane rather than swapping the contents of one: a card
         * that changes what it says while facing you is a screen, and a card that
         * rotates away and comes back with the other side on it is a card. The
         * back is pre-turned so that when the plane flips it lands face-on.
         *
         * The button is the whole card, because on a phone anything smaller than
         * the whole card is a target somebody misses — and it is a button rather
         * than a div with a handler so the keyboard and a screen reader get it
         * for nothing.
         */}
        <button
          type="button"
          className="member-turn"
          aria-pressed={over}
          aria-label={say("card.turnOver")}
          onClick={turn}
        >
          <span className="member-card-plane">
            <span className="member-card-side member-card-front">
              {/* The sheen: a band of light lying across the card, which moves on
                  its own every few seconds. It is the only thing on this screen
                  that moves unasked, and it is here for a reason — pressing a card
                  is not a thing anybody knows to try, and a card that catches the
                  light by itself is one you are more likely to touch. */}
              <span className="member-card-metal" aria-hidden="true" />

              <span className="member-card-face">
                <span className="member-card-top">
                  {/* The mark itself, not a typographic stand-in for it. Top
                      right, so the eye lands on the name first and the mark signs
                      it off. */}
                  <Image
                    className="member-card-logo"
                    src="/logo-mark.png"
                    alt=""
                    width={600}
                    height={582}
                    sizes="46px"
                    priority
                  />
                </span>

                <span className="member-name">{name || say("card.noName")}</span>
                <span className="member-since">
                  {[since ? say("card.memberSince").replace("{when}", since) : null, country || null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>

                <span className="member-number">
                  {number ? (
                    <>
                      <span aria-hidden="true">{say("card.no")}</span>{" "}
                      {String(number).padStart(4, "0")}
                    </>
                  ) : (
                    say("card.notNumbered")
                  )}
                </span>
              </span>
            </span>

            <span className="member-card-side member-card-back">
              <span className="member-card-metal" aria-hidden="true" />
              <span className="member-card-face">
                <span className="member-card-top">
                  <span className="member-back-label">{say("card.theBack")}</span>
                </span>
                {/* The stripe a card has on the back of it, and nothing written
                    on it: it is the shape that says "card", and inventing a
                    barcode for a club that scans nothing would be a lie drawn in
                    ink. Across the top, where a real one is. */}
                <span className="member-back-stripe" aria-hidden="true" />
                <span className="member-back-said">{say("card.whatItIs")}</span>
              </span>
            </span>
          </span>
        </button>
      </Tilt>
    </div>
  );
}
