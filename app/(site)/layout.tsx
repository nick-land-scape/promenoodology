import Contact from "@/components/Contact";
import DarkSwitch from "@/components/DarkSwitch";
import TopBar from "@/components/TopBar";
import Nav from "@/components/Nav";
import { getMenu } from "@/lib/site-pages";

/** The website: menu top left, contact details down the right edge. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Which pages are in the menu, and what they are called, is looked after in
  // /admin — so a page can be taken off the site without touching the code.
  const { main, more } = await getMenu();

  return (
    <>
      <Nav main={main} more={more} />
      {/* Only somebody signed in sees this, and it makes its own room. */}
      <TopBar />
      {children}
      <Contact />
      {/* Bottom right, out of the way of everything: it is a preference about
          the screen rather than a part of the site's own furniture. */}
      <DarkSwitch />
    </>
  );
}
