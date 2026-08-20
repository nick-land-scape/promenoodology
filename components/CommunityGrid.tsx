"use client";

import Photo from "./Photo";
import Submenu from "./Submenu";
import { useEffect, useMemo, useState } from "react";
import type { Member } from "@/lib/content";

/** How much larger than the original file a portrait may be drawn. */
const MAX_SCALE = 2.2;

/* Two orders, both of them the same thing asked differently: by surname, which
   is how a list of people is normally kept, or by first name, which is how you
   actually think of somebody.

   Country and project used to be here too. They sorted a page nobody reads in
   order — the grid is for finding a face, and grouping sixty-four names by
   thirty countries made thirty lists of two. */
const ORDERS = [
  { key: "last", label: "name" },
  { key: "first", label: "first name" },
] as const;

type Order = (typeof ORDERS)[number]["key"];

/**
 * The people, in the order you choose.
 *
 * Two ways of showing the same thing. On a wide screen it is a grid of names,
 * and pointing at one puts that person's photograph in the middle of the page,
 * behind the names — so everybody else stays readable, as on the old site. On a
 * narrow screen there is nothing to point with, so the photographs are simply
 * there, each beside its name.
 */
export default function CommunityGrid({ members }: { members: Member[] }) {
  const [order, setOrder] = useState<Order>("last");
  const [active, setActive] = useState<string | null>(null);
  const [preload, setPreload] = useState(false);
  const [narrow, setNarrow] = useState(false);

  const sorted = useMemo(() => sortMembers(members, order), [members, order]);

  // The same breakpoint the stylesheet uses, rather than asking what kind of
  // pointer is attached: a laptop with a touchscreen still wants the hover
  // version, and a narrow window still wants the photographs on show.
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 767px)");
    const watch = () => setNarrow(phone.matches);
    watch();
    phone.addEventListener("change", watch);
    return () => phone.removeEventListener("change", watch);
  }, []);

  // With a mouse, the photographs are fetched once the page is otherwise idle,
  // so the first hover is instant.
  useEffect(() => {
    if (narrow) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const handle = idle(() => setPreload(true));
    return () => window.cancelIdleCallback?.(handle as number);
  }, [narrow]);

  const clear = (id: string) => setActive((current) => (current === id ? null : current));

  return (
    <>
      <Submenu section="community">
        <div className="filters">
          <div className="filter-group">
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
      </Submenu>

      <ul
        className="community-grid"
        data-faces={narrow ? "" : undefined}
      >
        {sorted.map((member) => {
          const id = idOf(member);
          return (
            <li key={id}>
              <div
                className="community-item"
                data-color={member.color ?? undefined}
                data-active={!narrow && active === id ? "" : undefined}
                tabIndex={narrow ? undefined : 0}
                onMouseEnter={narrow ? undefined : () => setActive(id)}
                onMouseLeave={narrow ? undefined : () => clear(id)}
                onFocus={narrow ? undefined : () => setActive(id)}
                onBlur={narrow ? undefined : () => clear(id)}
              >
                {narrow ? (
                  <span className="community-face">
                    {member.photo ? (
                      <Photo src={member.photo.src} alt="" fill sizes="90px" loading="lazy" />
                    ) : null}
                  </span>
                ) : null}

                <span className="community-label">
                  <span className="community-name">{member.name}</span>
                  <span className="community-country">{member.country}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* The floating photograph, for anybody with something to point with. */}
      {narrow ? null : (
        <div className="portrait" aria-hidden="true">
          {sorted.map((member) =>
            member.photo && (preload || active === idOf(member)) ? (
              <Photo
                key={member.photo.src}
                src={member.photo.src}
                alt=""
                width={member.photo.width}
                height={member.photo.height}
                sizes="60vh"
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
      )}
    </>
  );
}

function idOf(member: Member) {
  return `${member.first}-${member.last}-${member.country}`;
}

function sortMembers(members: Member[], order: Order) {
  const by = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });
  return [...members].sort((a, b) =>
    order === "first"
      ? by(a.first, b.first) || by(a.last, b.last)
      : by(a.last, b.last) || by(a.first, b.first),
  );
}
