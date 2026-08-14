"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Member } from "@/lib/content";

/** How much larger than the original file a portrait may be drawn. */
const MAX_SCALE = 2.2;

/** 0 = the photo sits exactly under the cursor, 1 = it stays in the middle. */
const PULL_TO_CENTRE = 0.42;

/**
 * A grid of names. Pointing at a name (or focusing it with the keyboard, or
 * holding it on a touch screen) shows that person's photo, which drifts along
 * with the cursor and leans a little towards the side you came from.
 *
 * On a device with a mouse the photos are fetched once the page is otherwise
 * idle, so the first hover is instant. On a touch screen — where hovering is
 * not a thing — only the photo actually asked for is fetched.
 */
export default function CommunityGrid({ members }: { members: Member[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [preload, setPreload] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const handle = idle(() => setPreload(true));
    return () => window.cancelIdleCallback?.(handle as number);
  }, []);

  // Written straight onto the element: this runs on every pointer move, and
  // React does not need to re-render for it.
  const place = useCallback((clientX: number, clientY: number) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const element = stage.current;
      if (!element) return;
      const middleX = window.innerWidth / 2;
      const middleY = window.innerHeight / 2;
      element.style.setProperty("--x", `${clientX + (middleX - clientX) * PULL_TO_CENTRE}px`);
      element.style.setProperty("--y", `${clientY + (middleY - clientY) * PULL_TO_CENTRE}px`);
      element.style.setProperty("--tilt", `${(((clientX - middleX) / middleX) * 2.5).toFixed(2)}deg`);
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const clear = (index: number) => setActive((current) => (current === index ? null : current));

  return (
    <>
      <ul
        className="community-grid"
        onPointerMove={(event) => place(event.clientX, event.clientY)}
      >
        {members.map((member, index) => (
          <li key={`${member.name}-${index}`}>
            <button
              type="button"
              className="community-item"
              data-color={member.color ?? undefined}
              onMouseEnter={(event) => {
                place(event.clientX, event.clientY);
                setActive(index);
              }}
              onMouseLeave={() => clear(index)}
              onFocus={(event) => {
                const box = event.currentTarget.getBoundingClientRect();
                place(box.left + box.width / 2, box.top + box.height / 2);
                setActive(index);
              }}
              onBlur={() => clear(index)}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                if (touch) place(touch.clientX, touch.clientY);
                setActive(index);
              }}
              onTouchEnd={() => clear(index)}
              aria-label={member.photo ? `Show photo of ${member.name}` : member.name}
            >
              <span>
                {member.name}
                <br />
                {member.country}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="portrait" ref={stage} aria-hidden="true">
        {members.map((member, index) =>
          member.photo && (preload || active === index) ? (
            <Image
              key={member.photo.src}
              src={member.photo.src}
              alt=""
              width={member.photo.width}
              height={member.photo.height}
              sizes="(max-width: 767px) 80vw, 44vw"
              loading="eager"
              fetchPriority="low"
              style={
                {
                  "--limit": `${Math.round(member.photo.width * MAX_SCALE)}px`,
                  "--ar": member.photo.width / member.photo.height,
                  visibility: active === index ? "visible" : "hidden",
                } as React.CSSProperties
              }
            />
          ) : null,
        )}
      </div>
    </>
  );
}
