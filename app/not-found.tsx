import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="prose">
        <h1 style={{ font: "inherit", margin: 0 }}>This page took a different walk.</h1>
        <p>
          <Link href="/">Back to the start</Link>
        </p>
      </div>
    </main>
  );
}
