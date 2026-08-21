"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* Five, which is as many as a phone's bar can hold and exactly as many as this
   app has kinds of thing to do: see what is on, say you are coming, read what has
   already happened, talk to people, and look after your own membership. */
const TABS = [
  { href: "/app", label: "Home", icon: HomeIcon },
  { href: "/app/events", label: "What's on", icon: BookIcon },
  { href: "/app/read", label: "Read", icon: ReadIcon },
  { href: "/app/connect", label: "Connect", icon: ConnectIcon },
  { href: "/app/account", label: "Account", icon: AccountIcon },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="tab"
            aria-current={active ? "page" : undefined}
          >
            <Icon filled={active} />
            <span>{label}</span>
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
