"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * A picture in the back of the house, at the size it is actually drawn.
 *
 * The archive was fetching the file itself for every card: measured, a card 251
 * pixels wide downloading a 1126-pixel photograph, a hundred and sixty-two times
 * over, plus a full-size portrait behind every 22-pixel face in a dropdown. On
 * this laptop, against a warm cache, that is invisible. On a train it is the
 * whole page.
 *
 * So the same optimiser the front of the house uses, with the sizes said out
 * loud, and a wash underneath until the bytes land — the grid already knows how
 * big every picture is, so nothing moves when they arrive.
 */
export default function Thumb({
  src,
  width,
  height,
  sizes,
  alt = "",
  className,
  fit,
  priority,
  eager,
}: {
  src: string;
  /** The file's real size, so the aspect ratio is right before it loads. */
  width: number;
  height: number;
  /** How wide it will be drawn. Guessing this wrong is the whole problem. */
  sizes: string;
  alt?: string;
  className?: string;
  /** Logos are contained, everything else is cropped to fill. */
  fit?: "contain";
  priority?: boolean;
  /**
   * Load it now rather than when it scrolls into view.
   *
   * For a picture in a dialog. Lazy loading decides by asking whether the
   * element is near the viewport, and inside an overlay that has just appeared
   * the answer comes back "no" and is never asked again — which is how a grid of
   * sixty thumbnails stayed grey for ever. Measured: the same URL injected by
   * hand loaded instantly.
   */
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  // A picture whose measurements we do not have cannot be given to next/image
  // with width and height, and it is not worth a special case: the optimiser is
  // happy to work it out from the file.
  const known = width > 0 && height > 0;

  return (
    <Image
      src={src}
      alt={alt}
      width={known ? width : 800}
      height={known ? height : 800}
      sizes={sizes}
      quality={72}
      priority={priority}
      loading={eager ? "eager" : undefined}
      draggable={false}
      data-loaded={loaded ? "" : undefined}
      className={["admin-thumbnail", fit === "contain" ? "admin-thumbnail-contain" : "", className]
        .filter(Boolean)
        .join(" ")}
      onLoad={() => setLoaded(true)}
    />
  );
}
