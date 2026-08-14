import type { Metadata, Viewport } from "next";
import Contact from "@/components/Contact";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://promenoodology.com"),
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
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
        <Contact />
      </body>
    </html>
  );
}
