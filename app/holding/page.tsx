import type { Metadata } from "next";
import Countdown from "@/components/Countdown";
import { launchInSwitzerland } from "@/lib/launch";

/**
 * The holding page: what the site answers with until it opens.
 *
 * It sits outside the (site) group on purpose, so it arrives without the menu
 * and without the contact lane down the right edge — there is nowhere else to
 * go yet, and the two addresses it does need are on the page itself.
 *
 * While the site is closed the proxy answers every address with this page, so
 * the "do not index" below is what a crawler is told wherever it knocks. That
 * is why robots.txt is left alone: a blanket "stay away" written at build time
 * would still be sitting there the morning after the site opened.
 */
export function generateMetadata(): Metadata {
  const when = launchInSwitzerland();

  return {
    title: "a new site on its way",
    description: when
      ? `A new promeNOODology website opens on ${when}.`
      : "A new promeNOODology website is on its way.",
    robots: { index: false },
  };
}

export default function HoldingPage() {
  return <Countdown when={launchInSwitzerland()} />;
}
