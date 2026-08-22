import type { Metadata, Viewport } from "next";
import Photo from "@/components/Photo";
import Crossings from "@/components/app/Crossings";
import Feels from "@/components/app/Feels";
import Splash from "@/components/app/Splash";
import TabBar from "@/components/app/TabBar";
import { whoIsThis } from "@/lib/app/me";
import { mediaUrl } from "@/lib/supabase/config";
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
  /* Whose app this is, for the last tab — which shows their face rather than a
     drawing of a person. Read here because the bar is in the layout: asking on
     every screen for something that never changes between them would be five
     questions for one answer. Nobody signed in yet is null, and the tab falls
     back to the drawing. */
  const me = await whoIsThis();
  return (
    <div className="app-shell">
      <Splash />
      {/* The buzz under every press, and the four screens fetched before anybody
          asks for them. Nothing to look at. */}
      <Feels />
      {/* One screen becomes the next instead of replacing it. */}
      <Crossings />
      <div className="app-column">{children}</div>
      <TabBar face={me?.photoPath ? mediaUrl(me.photoPath) : null} />
    </div>
  );
}
