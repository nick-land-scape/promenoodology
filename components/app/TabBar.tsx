"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buzz } from "@/lib/native";
import { useSay } from "@/components/app/Words";

/* Five, which is as many as a phone's bar can hold and exactly as many as this
   app has kinds of thing to do: see what is on, say you are coming, read what has
   already happened, talk to people, and look after your own membership. */
const TABS = [
  { href: "/app", key: "tab.home", icon: HomeIcon },
  { href: "/app/events", key: "tab.whatsOn", icon: BookIcon },
  { href: "/app/read", key: "tab.read", icon: ReadIcon },
  { href: "/app/connect", key: "tab.connect", icon: ConnectIcon },
  { href: "/app/account", key: "tab.account", icon: AccountIcon },
];

export default function TabBar({ face }: { face?: string | null }) {
  const pathname = usePathname();
  const say = useSay();

  /* Not on the door. There is nothing to switch between until somebody is in,
     and four tabs under a sign-in screen are four dead ends. */
  if (pathname === "/app/enter") return null;

  return (
    <nav className="tabbar" aria-label={say("tab.main")}>
      {TABS.map(({ href, key, icon: Icon }) => {
        const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="tab"
            /* Not prefetched here. Feels asks for all five on the first idle
               moment of every screen, and a Link that also prefetches asks for
               the same screen a second time under a different key — every screen
               in this app is worked out per person, so that is a second full
               render, session and database and all. Counted on a live screen: one
               tab press was fetching thirteen screens. */
            prefetch={false}
            aria-current={active ? "page" : undefined}
            /* Pressing the tab you are already on goes to the top of it, which is
               what every other app on the phone does and the one gesture people
               try without being told. */
            onClick={(press) => {
              if (!active) return;
              press.preventDefault();
              void buzz("light");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {/* The last tab is you, so it shows you.
                A drawing of a person where a photograph could be is the app not
                knowing who is holding it. */}
            {href === "/app/account" && face ? (
              <span className={active ? "tab-face tab-face-on" : "tab-face"}>
                <Image src={face} alt="" width={44} height={44} sizes="22px" />
              </span>
            ) : (
              <Icon filled={active} />
            )}
            <span>{say(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* Plain line icons, filled in when the tab is the one you are on. */

type IconProps = { filled?: boolean };

function frame(children: React.ReactNode) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function HomeIcon({ filled }: IconProps) {
  return frame(
    <path
      d="M3.5 10.5 12 3.5l8.5 7v9a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />,
  );
}

function BookIcon({ filled }: IconProps) {
  return frame(
    <>
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15.5"
        rx="1.5"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M3.5 9.5h17" stroke={filled ? "var(--paper)" : "currentColor"} strokeWidth="1.4" />
      <path d="M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>,
  );
}

function ReadIcon({ filled }: IconProps) {
  return frame(
    <>
      <path
        d="M4 5.5h6.5A1.5 1.5 0 0 1 12 7v12a1.3 1.3 0 0 0-1.3-1.3H4zM20 5.5h-6.5A1.5 1.5 0 0 0 12 7v12a1.3 1.3 0 0 1 1.3-1.3H20z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </>,
  );
}

function ConnectIcon({ filled }: IconProps) {
  return frame(
    <>
      <circle
        cx="8.5"
        cy="8"
        r="3.2"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle
        cx="16"
        cy="10"
        r="2.6"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M3 19.5c0-2.8 2.5-4.6 5.5-4.6s5.5 1.8 5.5 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M15.5 15c2.9 0 5.5 1.6 5.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>,
  );
}

function AccountIcon({ filled }: IconProps) {
  return frame(
    <>
      <circle cx="12" cy="12" r="8.7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle
        cx="12"
        cy="9.7"
        r="3"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.2 19.2c1-2.5 3.2-3.8 5.8-3.8s4.8 1.3 5.8 3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>,
  );
}
