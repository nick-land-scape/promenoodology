import Contact from "@/components/Contact";
import Nav from "@/components/Nav";

/** The website: menu top left, contact details down the right edge. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
      <Contact />
    </>
  );
}
