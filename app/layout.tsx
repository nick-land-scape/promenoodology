import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site";
import { getTheme, themeAsCss } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "promeNOODology",
    template: "%s — promeNOODology",
  },
  description:
    "A simple social club, open to everyone. We cook, walk and put on small events that make a place feel like ours.",
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
  alternates: { canonical: "/" },
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
  var choice = localStorage.getItem("promenood-paper");
  document.documentElement.dataset.theme = choice === "dark" ? "dark" : "light";
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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: rememberTheThing }}
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
