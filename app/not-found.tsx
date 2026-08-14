import Link from "next/link";
import Contact from "@/components/Contact";
import Nav from "@/components/Nav";

export default function NotFound() {
  return (
    <>
      <Nav />
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
