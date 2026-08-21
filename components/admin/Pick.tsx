"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "./ui";

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

/** What the viewer needs to know about a photograph, and how to reach it. */
export type Viewable = {
  id: string;
  url: string;
  width: number;
  height: number;
};

const weigh = (bytes: number) =>
  bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1000)} kB`;

/**
 * One photograph, as big as it can honestly be shown, with the few things you
 * would want to do to it while looking at it.
 *
 * Three things this had wrong. It showed a small file small: `max-width: 100%`
 * lets a picture be its own size or less, so the sixty-two thumbnails in the
 * archive opened at 300 pixels in the middle of a black screen. It is scaled up
 * to fill the frame now, but no further than 2.4× — past that you are looking at
 * a magnified JPEG and it would be kinder to say so, which the caption does.
 *
 * There was no way out of it except closing: to crop the photograph you were
 * looking at, or throw it away, or see the next one, you closed the lightbox and
 * found the card again. Now the arrows, the crop and the bin are here.
 *
 * And it said nothing about the picture. The pixels come from the row; the weight
 * comes from a HEAD request, because the archive does not record it and asking
 * the bucket for the headers is cheaper than storing a number that can go stale.
 */
export function Look({
  items,
  index,
  onIndex,
  onClose,
  onEdit,
  onDelete,
  tools,
}: {
  items: Viewable[];
  index: number;
  onIndex?: (next: number) => void;
  onClose: () => void;
  onEdit?: (item: Viewable) => void;
  onDelete?: (item: Viewable) => void;
  /**
   * Anything else worth doing to the one on screen.
   *
   * A callback would not do for replacing a file: that needs a file input, and a
   * file input belongs to whoever knows where the bytes should go. So the caller
   * hands one in, bound to the photograph this is showing.
   */
  tools?: (item: Viewable) => React.ReactNode;
}) {
  useHeldStill();

  const item = items[index];
  const many = items.length > 1 && Boolean(onIndex);
  const [bytes, setBytes] = useState<number | null>(null);

  const step = useCallback(
    (by: number) => {
      if (!onIndex || items.length === 0) return;
      onIndex((index + by + items.length) % items.length);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, step]);

  /* How heavy it is. A HEAD asks for the headers and none of the bytes. */
  useEffect(() => {
    if (!item) return;
    let dropped = false;
    setBytes(null);

    fetch(item.url, { method: "HEAD" })
      .then((answer) => {
        const said = answer.headers.get("content-length");
        if (!dropped && said) setBytes(Number(said));
      })
      .catch(() => {
        // Not worth a message: the picture is on the screen, so it is there. The
        // caption simply does not mention a weight.
      });

    return () => {
      dropped = true;
    };
  }, [item]);

  if (!item) return null;

  const shown = [
    item.width > 0 ? `${item.width} × ${item.height}` : "size unknown",
    bytes === null ? null : weigh(bytes),
    // Said out loud, because the alternative is somebody wondering why a
    // photograph in the archive looks like that.
    item.width > 0 && Math.max(item.width, item.height) < 600 ? "smaller than the site draws" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="admin-look" role="dialog" aria-modal="true" aria-label="The photograph">
      {/* The backdrop closes; nothing inside the frame does. */}
      <button type="button" className="admin-look-away" onClick={onClose} aria-label="Close" />

      <figure className="admin-look-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt=""
          style={
            {
              // Up to fill the frame, but not past the point where it stops
              // being a photograph.
              "--limit": item.width > 0 ? `${Math.round(item.width * 2.4)}px` : "100%",
            } as React.CSSProperties
          }
        />

        <figcaption>
          <span className="admin-look-facts">{shown}</span>
          {many ? (
            <span className="admin-look-count">
              {index + 1} of {items.length}
            </span>
          ) : null}
        </figcaption>
      </figure>

      {many ? (
        <>
          <button
            type="button"
            className="admin-look-step admin-look-back"
            onClick={() => step(-1)}
            aria-label="The one before"
          >
            ←
          </button>
          <button
            type="button"
            className="admin-look-step admin-look-on"
            onClick={() => step(1)}
            aria-label="The next one"
          >
            →
          </button>
        </>
      ) : null}

      <div className="admin-look-tools">
        {tools ? tools(item) : null}
        {onEdit ? (
          <button type="button" onClick={() => onEdit(item)}>
            <Icon name="crop" />
            crop it
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" className="admin-look-danger" onClick={() => onDelete(item)}>
            <Icon name="trash" />
            delete it
          </button>
        ) : null}
        <button type="button" onClick={onClose}>
          close ×
        </button>
      </div>
    </div>
  );
}
