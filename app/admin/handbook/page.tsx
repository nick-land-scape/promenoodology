import { redirect } from "next/navigation";

/*
 * This lived in the menu as a section of its own, with the top of its page —
 * the heading, the line under it, the settings — on a second screen under
 * Pages. Two screens for one thing, and no telling which one you were meant to
 * be on. It is all under Pages now; anybody who kept this address is sent
 * there.
 */
export default function Moved() {
  redirect("/admin/pages/handbook");
}
