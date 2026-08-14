"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Member } from "@/lib/content";
import { flagFor } from "@/lib/countries";

/** How much larger than the original file a portrait may be drawn. */
const MAX_SCALE = 2.2;

/** 0 = the photo sits exactly under the cursor, 1 = it stays in the middle. */
const PULL_TO_CENTRE = 0.42;

const ORDERS = [
  { key: "last", label: "surname" },
  { key: "first", label: "first name" },
  { key: "country", label: "country" },
] as const;

type Order = (typeof ORDERS)[number]["key"];

/**
 * A grid of names, in the order you choose. Pointing at a name (or focusing it
 * with the keyboard, or holding it on a touch screen) shows that person's
 * photo, which drifts along with the cursor and leans a little towards the
 * side you came from. The name stays readable on top of its own photo.
 *
 * On a device with a mouse the photos are fetched once the page is otherwise
 * idle, so the first hover is instant. On a touch screen — where hovering is
 * not a thing — only the photo actually asked for is fetched.
 */
export default function CommunityGrid({ members }: { members: Member[] }) {
  const [order, setOrder] = useState<Order>("last");
  const [active, setActive] = useState<string | null>(null);
  const [preload, setPreload] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const sorted = useMemo(() => sortMembers(members, order), [members, order]);

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
      element.style.setProperty(
        "--tilt",
        `${(((clientX - middleX) / middleX) * 2.5).toFixed(2)}deg`,
      );
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const clear = (id: string) => setActive((current) => (current === id ? null : current));

  return (
    <>
      <div className="filters">
        <div className="filter-group">
          <span className="filter-label">sort by</span>
          {ORDERS.map((option) => (
            <button
              key={option.key}
              type="button"
              className="text-button"
              aria-pressed={order === option.key}
              onClick={() => setOrder(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="community-grid" onPointerMove={(event) => place(event.clientX, event.clientY)}>
        {sorted.map((member) => {
          const flag = flagFor(member.country);
          return (
            <li key={idOf(member)}>
              <button
                type="button"
                className="community-item"
                data-color={member.color ?? undefined}
                data-active={active === idOf(member) ? "" : undefined}
                onMouseEnter={(event) => {
                  place(event.clientX, event.clientY);
                  setActive(idOf(member));
                }}
                onMouseLeave={() => clear(idOf(member))}
                onFocus={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  place(box.left + box.width / 2, box.top + box.height / 2);
                  setActive(idOf(member));
                }}
                onBlur={() => clear(idOf(member))}
                onTouchStart={(event) => {
                  const touch = event.touches[0];
                  if (touch) place(touch.clientX, touch.clientY);
                  setActive(idOf(member));
                }}
                onTouchEnd={() => clear(idOf(member))}
                aria-label={member.photo ? `Show photo of ${member.name}` : member.name}
              >
                <span className="community-name">{member.name}</span>
                <span className="community-country">
                  {flag ? <span className="community-flag">{flag}</span> : null}
                  {member.country}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="portrait" ref={stage} aria-hidden="true">
        {sorted.map((member) =>
          member.photo && (preload || active === idOf(member)) ? (
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
                  visibility: active === idOf(member) ? "visible" : "hidden",
                } as React.CSSProperties
              }
            />
          ) : null,
        )}
      </div>
    </>
  );
}

function idOf(member: Member) {
  return `${member.first}-${member.last}-${member.country}`;
}

function sortMembers(members: Member[], order: Order) {
  const by = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });
  return [...members].sort((a, b) => {
    if (order === "first") return by(a.first, b.first) || by(a.last, b.last);
    if (order === "country") return by(a.country, b.country) || by(a.last, b.last);
    return by(a.last, b.last) || by(a.first, b.first);
  });
}
