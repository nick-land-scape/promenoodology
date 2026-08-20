import Contact from "@/components/Contact";
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
      {children}
      <Contact />
    </>
  );
}
