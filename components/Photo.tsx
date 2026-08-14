"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * next/image with a placeholder while it loads: until the file arrives the
 * element is a quietly pulsing grey block at exactly the right proportions, so
 * nothing jumps when the photograph appears.
 *
 * The state lives on the element as data-loaded; the two rules that do the work
 * are in globals.css under "loading".
 */
export default function Photo({ className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      className={["photo", className].filter(Boolean).join(" ")}
      data-loaded={loaded ? "" : undefined}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
    />
  );
}
