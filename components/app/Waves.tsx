"use client";

import { useEffect, useState, useTransition } from "react";
import Photo from "../Photo";
import { wave, waveseen } from "@/app/app/actions";
import type { Wave } from "@/lib/app/me";
import { mediaUrl } from "@/lib/supabase/config";

/**
 * Who waved, and waving back.
 *
 * Opening this screen is reading them, so that is when they are marked as seen —
 * not when the bubble is pressed, which would clear the count before anybody had
 * looked at anything. The ones that were new keep their mark for as long as you
 * are on the screen, so you can see which ones they were.
 */
export default function Waves({ waves }: { waves: Wave[] }) {
  const [waved, setWaved] = useState<Record<string, boolean>>({});
  const [, start] = useTransition();

  useEffect(() => {
    // Once, on arrival. The count in the header is gone by the next screen.
    void waveseen();
  }, []);

  return (
    <ul className="row-list">
      {waves.map((one) => {
        const back = waved[one.whoId] ?? one.waved;
        return (
          <li key={one.id}>
            <div className={one.seen ? "row" : "row row-new"}>
              {one.photo ? (
                <span className="avatar avatar-photo">
                  <Photo src={mediaUrl(one.photo)} alt="" fill sizes="40px" />
                </span>
              ) : (
                <span className="avatar" aria-hidden="true">
                  {one.who
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </span>
              )}

              <span className="row-body">
                <span className="row-title">{one.who}</span>
                <span className="row-meta">waved {one.when}</span>
              </span>

              <button
                type="button"
                className={back ? "pill pill-small" : "pill pill-small pill-solid"}
                disabled={back}
                onClick={() =>
                  start(async () => {
                    const answer = await wave(one.whoId);
                    if (answer.ok) setWaved((current) => ({ ...current, [one.whoId]: true }));
                  })
                }
              >
                {back ? "waved back" : "wave back"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
