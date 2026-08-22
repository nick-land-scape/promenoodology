import Link from "next/link";
import Contact from "@/components/Contact";
import Nav from "@/components/Nav";
import { PLAIN } from "@/lib/lang";
import { getMenu } from "@/lib/site-pages";

/**
 * Also what a page that has been turned off in /admin answers with — so a page
 * taken off the site reads as one that was never there, rather than as one being
 * kept from you.
 */
export default async function NotFound() {
  const { main, more } = await getMenu();

  return (
    <>
      <Nav main={main} more={more} lang={PLAIN} />
      <main className="page">
        <div className="prose">
          <h1 style={{ font: "inherit", margin: 0 }}>This page took a different walk.</h1>
          <p>
            <Link href="/">Back to the start</Link>
          </p>
        </div>
      </main>
      <Contact />
    </>
  );
}
