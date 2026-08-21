import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TheWayIn from "@/components/app/TheWayIn";
import { whoIsThis } from "@/lib/app/me";

export const metadata: Metadata = { title: "Come in", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * The app's own door.
 *
 * It used to hand people to the website's sign-in page, which is a page: a
 * heading, a paragraph about what an account is for, a menu, a footer, and a form
 * in the middle of it. On a phone, opening an app and being shown a web page about
 * signing in is the moment somebody decides this is not really an app.
 *
 * This is a screen. One thing to press, or an address and a code.
 */
export default async function EnterPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  // Already in — nobody needs a door they are standing inside.
  if (await whoIsThis()) redirect("/app");

  const { from } = await searchParams;
  const back = from && from.startsWith("/app") ? from : "/app";

  return <TheWayIn back={back} />;
}
