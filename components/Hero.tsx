"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

/**
 * The front page: the video square in the middle, the logo multiplied over it.
 *
 * Moving the pointer nudges the two apart — the video drifts with the cursor,
 * the logo against it. A few pixels only; it should read as the page breathing,
 * not as an effect.
 */
export default function Hero() {
  const stage = useRef<HTMLElement>(null);
  const frame = useRef(0);

  const track = useCallback((clientX: number, clientY: number) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const element = stage.current;
      if (!element) return;
      // -1 … 1 from the middle of the window in both directions.
      element.style.setProperty("--px", ((clientX / window.innerWidth) * 2 - 1).toFixed(3));
      element.style.setProperty("--py", ((clientY / window.innerHeight) * 2 - 1).toFixed(3));
    });
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (event: PointerEvent) => track(event.clientX, event.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame.current);
    };
  }, [track]);

  return (
    <main className="hero" ref={stage}>
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
