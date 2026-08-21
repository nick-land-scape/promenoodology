import Contact from "@/components/Contact";
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
      {/* "Make it dark" lives in the menu's own session row now — see the note
          in Nav. It is still drawn in the bottom corner on a wide screen. */}
    </>
  );
}
