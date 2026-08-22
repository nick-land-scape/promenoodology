import type { Metadata, Viewport } from "next";
import { Permanent_Marker } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import { getTheme, themeAsCss } from "@/lib/theme";
import "./globals.css";

/**
 * The one handwritten face on the site, and it has exactly one job.
 *
 * Everything here is Times and Gotham and stays that way. The handbook's cover
 * is the exception: it is the cover of a thing we print and give away, with the
 * mark on it, and the mark is a marker scrawl — so the word underneath it is
 * written in the same hand rather than set in the site's own type, which would
 * read as a label stuck on a book.
 *
 * Fetched at build time and served from our own domain by next/font, so this
 * costs the reader no request to anybody else.
 */
const hand = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--hand",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "promeNOODology",
    template: "%s — promeNOODology",
  },
  description:
    "A simple social club, open to everyone. We cook, walk and put on small events that make a place feel like ours.",
  applicationName: "promeNOODology",
  publisher: "promeNOODology",
  openGraph: {
    title: "promeNOODology",
    description:
      "A simple social club, open to everyone. We cook, walk and put on small events that make a place feel like ours.",
    url: "/",
    siteName: "promeNOODology",
    type: "website",
    images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  /*
   * Proving to Google and Bing that this site is ours.
   *
   * Both of them will hand over a string and ask for it back in the head of the
   * front page before they will show anybody what they know about the site.
   * Here rather than pasted into the markup so that getting verified is setting
   * an environment variable and waiting for a build, rather than a commit — and
   * so that a preview deployment, which is a different address, is not quietly
   * claiming to be the live site.
   *
   * Unset, these are simply absent. Next drops an undefined field.
   */
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  /*
   * No canonical here, and that is the point.
   *
   * Metadata is inherited, so a canonical written at the root is the answer for
   * every page that does not give its own — which meant every screen of the
   * members' app, every page of /admin and anything new declared itself to be a
   * copy of the front page. A canonical is a claim about one page; there is no
   * such thing as a sitewide one. Each page under app/[lang] says its own,
   * through lib/seo, along with where it lives in the other language.
   */
};

export const viewport: Viewport = {
  themeColor: "#fffcf6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Applied before the first paint, so nobody who chose dark is shown a white
 * flash on the way to it. It has to be inline and blocking for that: a
 * component cannot run earlier than the paint it is part of.
 *
 * Only an explicit choice counts. The obvious thing would be to follow the
 * operating system, and the obvious thing is wrong here: paper is what this site
 * is made of, and showing it dark to everybody whose laptop is dark would be
 * deciding, on their behalf and without being asked, that they came for a dark
 * website. They can ask. Until they do, it is paper.
 */
const rememberTheThing = `
try {
  var key = "promenood-paper";
  var asked = window.matchMedia("(prefers-color-scheme: dark)");
  var put = function () {
    var choice = localStorage.getItem(key);
    /* A choice made out loud wins. Otherwise the phone decides — which is what
       people mean when they turn dark mode on: everything, not everything except
       this. */
    var dark = choice === "dark" || (choice !== "light" && asked.matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  };
  put();
  /* And it keeps following while the page is open: a phone on automatic switches
     at sunset, and a page that only looked once is a page that is wrong from then
     until it is reloaded. Anybody who has pressed the switch is unaffected. */
  asked.addEventListener("change", put);
} catch (e) { document.documentElement.dataset.theme = "light"; }
`.trim();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Two typefaces and five colours, or nothing at all if nobody has changed any
  // of them — which is the ordinary case and costs one empty string.
  const look = themeAsCss(await getTheme());

  return (
    // The script below sets data-theme before React arrives, so the attribute it
    // finds is not the one the server sent. That is the intended sequence rather
    // than a bug, and this is the one thing suppressHydrationWarning is for.
    <html lang="en" data-theme="light" className={hand.variable} suppressHydrationWarning>
      <head>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: rememberTheThing }}
        />
        {/*
         * Which language the page is in, said to the browser and to anything
         * reading it out loud.
         *
         * It has to be done here and like this. <html> is drawn by this layout,
         * which sits above the language segment and cannot see it; making it
         * dynamic enough to would mean giving up static generation for the whole
         * site to set one attribute. The address already says the answer, so the
         * page reads it off the address before the first paint — the same trade
         * the theme above makes, for the same reason.
         *
         * What actually tells a search engine which language a page is in is the
         * hreflang pair in its own metadata, not this.
         */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.lang=location.pathname.split('/')[1]==='fr'?'fr':'en'",
          }}
        />
        {/* After globals.css, so it wins; and only what has been changed, so the
            site keeps the look it was drawn with until somebody says otherwise. */}
        {look ? (
          // eslint-disable-next-line react/no-danger
          <style dangerouslySetInnerHTML={{ __html: look }} />
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
