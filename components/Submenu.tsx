"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A page's own filters, shown as a submenu underneath its entry in the main
 * menu — Nav leaves an empty slot after each link for exactly this.
 *
 * On a phone the menu is a bar along the bottom, where a submenu would be
 * useless, so there the filters simply stay where they are on the page.
 */
export default function Submenu({
  section,
  children,
}: {
  /** Matches the slot Nav leaves, e.g. "resources". */
  section: string;
  children: React.ReactNode;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)");
    const pick = () => setSlot(wide.matches ? document.getElementById(`submenu-${section}`) : null);
    pick();
    wide.addEventListener("change", pick);
    return () => wide.removeEventListener("change", pick);
  }, [section]);

  if (slot) return createPortal(children, slot);
  return <>{children}</>;
}
