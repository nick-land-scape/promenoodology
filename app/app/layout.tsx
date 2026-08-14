import type { Metadata, Viewport } from "next";
import TabBar from "@/components/app/TabBar";
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
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="app-column">{children}</div>
      <TabBar />
    </div>
  );
}
