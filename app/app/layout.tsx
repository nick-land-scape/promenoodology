import type { Metadata, Viewport } from "next";
import Photo from "@/components/Photo";
import Crossings from "@/components/app/Crossings";
import Feels from "@/components/app/Feels";
import Keeps from "@/components/app/Keeps";
import Opening from "@/components/app/Opening";
import TabBar from "@/components/app/TabBar";
import Broke from "@/components/app/Broke";
import { Words } from "@/components/app/Words";
import { readingIn, whoIsThis } from "@/lib/app/me";
import { getFrench } from "@/lib/source";
import { saying } from "@/lib/words";
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
  /* Three things every screen under here needs, asked for once.
   *
   * Whose app this is, for the last tab — which shows their face rather than a
   * drawing of a person; the language they read us in; and whatever French has
   * been written in the back of the house. The tab bar is in the layout, so
   * asking on every screen for something that never changes between them would
   * be five questions for one answer. Nobody signed in yet is null, and the tab
   * falls back to the drawing. */
  const [me, lang, french] = await Promise.all([whoIsThis(), readingIn(), getFrench()]);

  return (
    <Words lang={lang} words={saying(lang, french, "app")} you={me?.name?.split(" ")[0] ?? ""}>
      <div className="app-shell" lang={lang}>
        {/* The floor under a white screen: anything uncaught says so on the paper
            instead of leaving nothing at all. */}
        <Broke />
        {/* No curtain: the phone's own launch screen is the whole opening. This
            is what is left of the one that used to be drawn here — taking that
            launch screen away once there is something behind it, and coming back
            to a fresh copy after a long time in a pocket. */}
        <Opening />
        {/* The buzz under every press, and the four screens fetched before
            anybody asks for them. Nothing to look at. */}
        <Feels />
        {/* Where you were on each tab, so coming back to one is coming back. */}
        <Keeps />
        {/* One screen becomes the next instead of replacing it. */}
        <Crossings />
        <div className="app-column">{children}</div>
        <TabBar face={me?.photoPath ? mediaUrl(me.photoPath) : null} />
      </div>
    </Words>
  );
}
