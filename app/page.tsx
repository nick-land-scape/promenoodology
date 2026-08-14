import Image from "next/image";

/**
 * Front page: the video fills the screen, a soft gradient sits on top of it and
 * the logo is multiplied over both. No client-side JavaScript involved — the
 * poster frame shows immediately and the video takes over once it has loaded.
 */
export default function Home() {
  return (
    <main className="hero">
      <h1 className="visually-hidden">promeNOODology</h1>

      {/* eslint-disable-next-line @next/next/no-img-element -- already a small, correctly sized still */}
      <img
        className="hero-poster"
        src="/hero-poster.jpg"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
      />
      <video
        className="hero-video"
        poster="/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* Two multiplied copies: the ink doubles in density over busy parts of
          the picture, while the white of the scan stays invisible. */}
      {[0, 1].map((layer) => (
        <Image
          key={layer}
          className={layer === 0 ? "hero-logo" : "hero-logo hero-logo-ink"}
          src="/logo.png"
          alt=""
          aria-hidden="true"
          width={1600}
          height={1600}
          priority={layer === 0}
          sizes="(max-width: 767px) 74vmin, min(62vmin, 560px)"
        />
      ))}
    </main>
  );
}
