"use client";

import Link from "next/link";
import { keepThePhoto } from "@/lib/native";
import Photo from "./Photo";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Slide } from "@/lib/content";

type Props = {
  slides: Slide[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  /** Which story a photograph belongs to, if any — shown as a way through. */
  storyOf?: (slide: Slide) => { title: string; slug: string } | null;
};

/**
 * One photo at a time, with the same plain text controls the rest of the site
 * uses. Arrow keys and Escape work too.
 */
export default function Lightbox({
  slides,
  index,
  onIndex,
  onClose,
  storyOf,
}: Props) {
  const [saving, setSaving] = useState<"" | "working" | "failed">("");
  /*
   * Zoom.
   *
   * An archive of photographs somebody took in a car park at night is a set of
   * pictures with things in the corners of them — a face, a sign, how the table
   * was built — and until now the only way to see any of that was to save the file
   * and open it somewhere else. So: pinch it, or tap it twice.
   *
   * Written by hand rather than left to the browser. A lightbox is a fixed layer
   * over a page that is not scrolling, and the browser's own pinch zooms the whole
   * screen — the caption, the arrows and the close button with it — which on a
   * phone means zooming in and having no way back out. This zooms the photograph
   * and nothing else.
   */
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  /* Whether a finger is on it. The jump to 2.5 on a double tap should glide; the
     picture under a moving hand should not, and a transition there is a photograph
     trailing a fifth of a second behind the thumb. */
  const [holding, setHolding] = useState(false);
  const shot = useRef<HTMLDivElement>(null);

  /** How far the picture may be pushed before its own edge comes inside the glass. */
  function held(next: { x: number; y: number }, at: number) {
    const box = shot.current?.getBoundingClientRect();
    if (!box) return next;
    /* The rectangle is the drawn one, so it already has the current zoom in it —
       the room to move is what the picture would overhang at the *new* zoom. */
    const wide = (box.width / zoom) * at;
    const tall = (box.height / zoom) * at;
    const acrossBy = Math.max(0, (wide - window.innerWidth) / 2);
    const downBy = Math.max(0, (tall - window.innerHeight) / 2);
    return {
      x: Math.max(-acrossBy, Math.min(acrossBy, next.x)),
      y: Math.max(-downBy, Math.min(downBy, next.y)),
    };
  }

  /* Zoom about a point rather than about the middle: tapping twice on a face
     should bring that face closer, not the centre of the picture. */
  function zoomTo(at: number, about?: { x: number; y: number }) {
    const next = Math.max(1, Math.min(4, at));
    if (next === 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const box = shot.current?.getBoundingClientRect();
    if (!box || !about) {
      setZoom(next);
      setPan((now) => held(now, next));
      return;
    }
    const middleX = box.left + box.width / 2;
    const middleY = box.top + box.height / 2;
    const by = next / zoom;
    setZoom(next);
    setPan((now) =>
      held(
        {
          x: now.x - (about.x - middleX) * (by - 1),
          y: now.y - (about.y - middleY) * (by - 1),
        },
        next,
      ),
    );
  }

  const slide = slides[index];
  const many = slides.length > 1;
  const story = slide && storyOf ? storyOf(slide) : null;
  const step = (by: number) =>
    onIndex((index + by + slides.length) % slides.length);

  /* A new photograph arrives at its own size. Carrying somebody's zoom from one
     picture to the next lands them in the corner of something else. */
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      /* Escape comes out of the zoom before it comes out of the lightbox, which is
         the order somebody presses it in. */
      if (event.key === "Escape") {
        if (zoom > 1) zoomTo(1);
        else onClose();
      }
      /* And the arrows step through the set only at life size: zoomed in, they are
         how you move around the picture. */
      if (event.key === "ArrowRight") {
        if (zoom > 1) setPan((now) => held({ ...now, x: now.x - 60 }, zoom));
        else step(1);
      }
      if (event.key === "ArrowLeft") {
        if (zoom > 1) setPan((now) => held({ ...now, x: now.x + 60 }, zoom));
        else step(-1);
      }
      if (event.key === "ArrowUp" && zoom > 1) {
        setPan((now) => held({ ...now, y: now.y + 60 }, zoom));
      }
      if (event.key === "ArrowDown" && zoom > 1) {
        setPan((now) => held({ ...now, y: now.y - 60 }, zoom));
      }
      if (event.key === "+" || event.key === "=") zoomTo(zoom * 1.5);
      if (event.key === "-") zoomTo(zoom / 1.5);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /**
   * Saving the photograph.
   *
   * Two ways, one button. In the app the bytes go to a file and the phone's sheet
   * is opened over it, so the picture can go into Photos — see below, and
   * keepThePhoto in lib/native.
   *
   * In a browser: not `<a download>` on the address, because the files are on the
   * storage host rather than on this one and a browser ignores the download
   * attribute across origins — it would open the picture in a tab and leave
   * whoever pressed it to work out the rest. Fetching the bytes and handing over a
   * blob works because the bucket is public and sends the headers for it, and it
   * means the file arrives with a name that says what it is rather than a UUID.
   */
  async function save() {
    if (!slide) return;
    setSaving("working");

    const ext = slide.photo.src.split(".").pop()?.split("?")[0] ?? "jpg";
    const named = (slide.caption || "promeNOODology")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const file = `${named || "photograph"}.${ext}`;

    /* Inside the app, the photograph really is saved.
     *
     * A web view has no downloads folder and no download manager: an anchor with
     * a `download` attribute — blob URL or not — does nothing at all, silently,
     * which is exactly what "the save button does not work" was. So the bytes are
     * written to a file on the phone and the phone's own sheet is opened over
     * *that*, which is what puts "Save Image" in it — straight into Photos, or
     * AirDrop, or Messages with the picture in it rather than a link to it. See
     * keepThePhoto in lib/native.
     *
     * "notHere" means there is no phone, and the browser's own way follows. */
    const kept = await keepThePhoto(slide.photo.src, file);
    if (kept !== "notHere") {
      setSaving(kept === "kept" ? "" : "failed");
      return;
    }

    try {
      const answer = await fetch(slide.photo.src, { mode: "cors" });
      if (!answer.ok) throw new Error(String(answer.status));
      const blob = await answer.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = file;
      document.body.append(link);
      link.click();
      link.remove();
      // Given a moment to start, then let go of the bytes.
      window.setTimeout(() => URL.revokeObjectURL(url), 20_000);
      setSaving("");
    } catch {
      setSaving("failed");
    }
  }

  /*
   * Rendered into a node of its own at the end of the body.
   *
   * A photograph on its own is over everything, and it cannot be over everything
   * from inside the page. The lightbox is opened from wherever the pictures are —
   * a story, the archive wall, an evening — so it was a child of that page's own
   * wrapper, while the site's menu and the strip along the top are children of the
   * body. A z-index only orders things inside the box they are in: on a phone the
   * save and close buttons are pinned to the top right of the screen and the menu
   * to the bottom, so both ended up *underneath* the site's own furniture. Nothing
   * was the wrong colour; the buttons were behind a bar.
   *
   * Into a node made by hand rather than into the body itself, because React keeps
   * a list of what is in the body's tree and puts that list back on every render —
   * see the same note in components/app/Sheet.
   */
  const [into, setInto] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const host = document.createElement("div");
    host.className = "lightbox-host";
    document.body.append(host);
    setInto(host);
    return () => host.remove();
  }, []);

  /* Everything below is a hook, and every hook has to be called on every render —
     including the renders that end in the early return under them. They were
     written after it, which React tolerated only while the early return happened
     to be rare; the moment there was a second reason to take it (waiting for the
     node this is drawn into) the order of hooks changed between renders and React
     said so. Hooks first, decisions after.

     Swiping.
   *
   * Arrows are for a mouse. On a phone the way through a set of photographs is a
   * thumb, and a lightbox that ignores one feels like a web page — which is what
   * it was. Horizontal only, and only past a distance no accidental drag covers:
   * a vertical swipe still belongs to the page underneath.
   */
  const from = useRef<{ x: number; y: number } | null>(null);
  /* What the fingers were doing when they last moved: the gap between two of
     them, where they were between them, and where the picture was pushed to. All
     of it in a ref, because none of it should draw a frame by itself — only what
     it works out should. */
  const fingers = useRef<{
    gap: number;
    middle: { x: number; y: number };
    zoom: number;
    pan: { x: number; y: number };
  } | null>(null);
  const tapped = useRef(0);

  if (!slide || !into) return null;


  const gapOf = (touches: React.TouchList) => {
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };
  const middleOf = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  return createPortal(
    <div
      className={zoom > 1 ? "lightbox is-close" : "lightbox"}
      role="dialog"
      aria-modal="true"
      aria-label={slide.caption}
      /* Zoomed in, a press on the dark is a finger letting go of a drag rather
         than somebody asking to close. */
      onClick={() => {
        if (zoom > 1) return;
        onClose();
      }}
      onTouchStart={(touch) => {
        setHolding(true);
        if (touch.touches.length === 2) {
          fingers.current = {
            gap: gapOf(touch.touches),
            middle: middleOf(touch.touches),
            zoom,
            pan,
          };
          from.current = null;
          return;
        }
        const one = touch.touches[0];
        from.current = { x: one.clientX, y: one.clientY };
        fingers.current = null;
      }}
      onTouchMove={(touch) => {
        /* Two fingers: the gap between them is the zoom, and where they are
           between them is what stays under them. */
        const held2 = fingers.current;
        if (touch.touches.length === 2 && held2) {
          touch.preventDefault();
          const next = Math.max(1, Math.min(4, (held2.zoom * gapOf(touch.touches)) / held2.gap));
          const now = middleOf(touch.touches);
          const box = shot.current?.getBoundingClientRect();
          if (!box) return;
          const middleX = box.left + box.width / 2;
          const middleY = box.top + box.height / 2;
          const by = next / held2.zoom;
          setZoom(next);
          setPan(
            held(
              {
                x:
                  held2.pan.x -
                  (held2.middle.x - middleX) * (by - 1) +
                  (now.x - held2.middle.x),
                y:
                  held2.pan.y -
                  (held2.middle.y - middleY) * (by - 1) +
                  (now.y - held2.middle.y),
              },
              next,
            ),
          );
          return;
        }

        // One finger, zoomed in: the picture follows it.
        const start = from.current;
        if (!start || zoom <= 1) return;
        touch.preventDefault();
        const one = touch.touches[0];
        setPan((was) =>
          held(
            { x: was.x + (one.clientX - start.x), y: was.y + (one.clientY - start.y) },
            zoom,
          ),
        );
        from.current = { x: one.clientX, y: one.clientY };
      }}
      onTouchEnd={(touch) => {
        setHolding(false);
        const start = from.current;
        from.current = null;
        if (fingers.current) {
          fingers.current = null;
          /* Let go somewhere near life size and it settles back to it, the way a
             photograph in any other app does. */
          if (zoom < 1.15) zoomTo(1);
          return;
        }
        if (!start) return;

        const one = touch.changedTouches[0];
        const across = one.clientX - start.x;
        const down = one.clientY - start.y;
        const moved = Math.abs(across) > 10 || Math.abs(down) > 10;

        /* Two taps in a row, in about the same place: closer, or back to life
           size. Measured here rather than with a dblclick, which a phone does not
           send. */
        if (!moved) {
          const now = Date.now();
          if (now - tapped.current < 320) {
            tapped.current = 0;
            zoomTo(zoom > 1 ? 1 : 2.5, { x: one.clientX, y: one.clientY });
            return;
          }
          tapped.current = now;
          return;
        }

        // Zoomed in, a drag was a drag. The set is stepped through at life size.
        if (zoom > 1 || !many) return;
        // A swipe, not a scroll and not a tap.
        if (Math.abs(across) < 45 || Math.abs(across) < Math.abs(down)) return;
        step(across < 0 ? 1 : -1);
      }}
      /* A trackpad pinch arrives as a wheel with ctrl held; a plain wheel over a
         photograph on a laptop is somebody expecting it to get bigger. */
      onWheel={(wheel) => {
        if (!wheel.ctrlKey && !wheel.metaKey) return;
        wheel.preventDefault();
        zoomTo(zoom * (wheel.deltaY < 0 ? 1.12 : 0.89), {
          x: wheel.clientX,
          y: wheel.clientY,
        });
      }}
      onDoubleClick={(press) => {
        press.preventDefault();
        zoomTo(zoom > 1 ? 1 : 2.5, { x: press.clientX, y: press.clientY });
      }}
    >
      {/* The frame is exactly the size of the photo, so the photo itself ends up
          in the middle of the screen; everything else hangs off its corners.
          Clicks inside the frame belong to the frame, not to the backdrop. */}
      <div
        className="lightbox-frame"
        onClick={(event) => event.stopPropagation()}
      >
        {/* The zoom is on the picture and not on the frame, because the frame is
            what the caption, the arrows and the close button hang off — and those
            should stay where they are however close you get to the photograph. */}
        <div
          className={holding ? "lightbox-shot is-held" : "lightbox-shot"}
          ref={shot}
          style={{
            transform: `translate3d(${Math.round(pan.x)}px, ${Math.round(pan.y)}px, 0) scale(${zoom})`,
          }}
        >
          <Photo
            key={slide.photo.src}
            src={slide.photo.src}
            alt=""
            width={slide.photo.width}
            height={slide.photo.height}
            sizes="90vw"
            priority
            style={
              {
                "--limit": `${Math.round(slide.photo.width * 2.4)}px`,
                "--ar": slide.photo.width / slide.photo.height,
              } as React.CSSProperties
            }
          />
        </div>

        {/* The two things you can do, together, above the top right corner: keep
            it, or close it. They were at opposite corners, which made the save
            look like a caption on the other side of the picture. */}
        <div className="lightbox-tools">
          <button
            type="button"
            className="lightbox-save"
            onClick={() => void save()}
            title="Save this photograph"
            aria-label="Save this photograph"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M4.5 19.5h15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              {saving === "working"
                ? "saving…"
                : saving === "failed"
                  ? "would not save"
                  : "save"}
            </span>
          </button>

          <button
            type="button"
            className="text-button lightbox-close"
            onClick={onClose}
            autoFocus
            aria-label="Close the photo"
          >
            close ×
          </button>
        </div>

        <figcaption className="lightbox-caption">
          {slide.caption}
          {story ? (
            <>
              {slide.caption ? " · " : null}
              <Link href={`/stories/${story.slug}`} onClick={onClose}>
                {story.title} →
              </Link>
            </>
          ) : null}
        </figcaption>

        {many ? (
          <div className="lightbox-controls">
            <button
              type="button"
              className="text-button"
              onClick={() => step(-1)}
            >
              ← previous
            </button>
            <span className="lightbox-count">
              {index + 1} / {slides.length}
            </span>
            <button
              type="button"
              className="text-button"
              onClick={() => step(1)}
            >
              next →
            </button>
          </div>
        ) : null}
      </div>

      {/* Quietly fetch the neighbours so stepping through feels instant. */}
      {many ? (
        <div className="lightbox-preload" aria-hidden="true">
          {[-1, 1].map((by) => {
            const neighbour =
              slides[(index + by + slides.length) % slides.length];
            return (
              <Photo
                key={`${by}-${neighbour.photo.src}`}
                src={neighbour.photo.src}
                alt=""
                width={neighbour.photo.width}
                height={neighbour.photo.height}
                sizes="90vw"
                loading="eager"
                fetchPriority="low"
              />
            );
          })}
        </div>
      ) : null}
    </div>,
    into,
  );
}
