"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Puts a button up beside the page's title.
 *
 * "Add photographs" was sitting inside the filter box, among the fields that say
 * which photographs you are looking at — so the one thing that *makes* a
 * photograph was filed under looking rather than doing, and on a long archive
 * you scrolled up past sixty pictures to reach it.
 *
 * It belongs in the header, and the header is rendered by the page above, in a
 * server component that cannot hold the state the uploader needs. So the button
 * stays where its state is and is drawn where it belongs, which is what a portal
 * is for.
 */
export default function InHead({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  // After the first paint, because on the server there is no header to find.
  useEffect(() => {
    setSlot(document.getElementById("admin-head-slot"));
  }, []);

  if (!slot) return null;
  return createPortal(children, slot);
}
