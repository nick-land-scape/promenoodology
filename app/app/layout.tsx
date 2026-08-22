import type { Metadata, Viewport } from "next";
import Crossings from "@/components/app/Crossings";
import Feels from "@/components/app/Feels";
import PullDown from "@/components/app/PullDown";
import Splash from "@/components/app/Splash";
import TabBar from "@/components/app/TabBar";
import { sharedFilms } from "@/lib/shared";
import "./app.css";

export const metadata: Metadata = {
  title: { default: "promeNOODology", template: "%s — promeNOODology" },
  description: "Events, bookings and the people of promeNOODology.",
  robots: { index: false, follow: false }, // members' app, not a public page
  // Lets a phone add the app to its home screen and open it without browser
  // furniture. The icons it points at have a paper background, because a home
  // screen composites transparency onto black.
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "promeNOOD", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fffcf6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** The members' app: one column, made for a phone, with tabs along the bottom. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  /* The same films the front page plays. Read here so the splash has them the
     moment it is drawn — it is a curtain, not a thing that waits for a fetch. */
  const films = await sharedFilms();

  return (
    <div className="app-shell">
      <Splash films={films} />
      {/* The buzz under every press, and the four screens fetched before anybody
          asks for them. Nothing to look at. */}
      <Feels />
      {/* Pull any screen down to ask the server again. */}
      <PullDown />
      {/* One screen becomes the next instead of replacing it. */}
      <Crossings />
      <div className="app-column">{children}</div>
      <TabBar />
    </div>
  );
}
