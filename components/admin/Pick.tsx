"use client";

import { useEffect } from "react";

/** A photograph as the back of the house passes it around. */
export type Pickable = { path: string; url: string };

/** Stops the page behind an overlay from scrolling under your finger. */
function useHeldStill() {
  useEffect(() => {
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, []);
}

/**
 * Choosing a photograph that is already in the archive, rather than uploading
 * the same one twice. Escape closes it, like the lightbox on the site.
 */
export function Picker({
  photos,
  onPick,
  onClose,
}: {
  photos: Pickable[];
  onPick: (photo: Pickable) => void;
  onClose: () => void;
}) {
  useHeldStill();

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  return (
    <div className="admin-pick" onClick={onClose} role="dialog" aria-modal="true" aria-label="Choose a photograph">
      <div className="admin-pick-box" onClick={(event) => event.stopPropagation()}>
        <header className="admin-pick-head">
          <h2>from the archive</h2>
          <button type="button" className="admin-word" onClick={onClose}>
            close
          </button>
        </header>
        {photos.length === 0 ? (
          <p className="admin-empty" style={{ padding: "24px 14px" }}>
            Nothing in the archive yet — put some photographs in first.
          </p>
        ) : (
          <div className="admin-pick-grid">
            {photos.map((photo) => (
              <button
                key={photo.path}
                type="button"
                onClick={() => {
                  onPick(photo);
                  onClose();
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** One photograph, as big as the window allows. Click anywhere to close. */
export function Look({ url, onClose }: { url: string; onClose: () => void }) {
  useHeldStill();

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  return (
    <button type="button" className="admin-look" onClick={onClose} aria-label="Close">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" />
    </button>
  );
}
