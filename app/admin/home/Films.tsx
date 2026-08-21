"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import InHead from "@/components/admin/InHead";
import Thumb from "@/components/admin/Thumb";
import VideoUploader from "@/components/admin/VideoUploader";
import {
  Bin,
  Empty,
  Field,
  Flag,
  Grip,
  Place,
  Problem,
  SaveBar,
  moved,
  useDragOrder,
  useUnsaved,
} from "@/components/admin/ui";
import { mediaUrl } from "@/lib/supabase/config";
import { addFilm, deleteFilm, reorderFilms, saveFilms } from "./actions";

export type Film = {
  id: string;
  called: string;
  src: string;
  poster: string | null;
  seconds: number | null;
  bytes: number | null;
  published: boolean;
};

/** 4.2 MB, 12 seconds — the two numbers anybody judges a film by. */
function weight(film: Film) {
  const parts: string[] = [];
  if (film.seconds) parts.push(`${film.seconds} seconds`);
  if (film.bytes) parts.push(`${(film.bytes / 1_000_000).toFixed(1)} MB`);
  return parts.join(" · ");
}

/**
 * The films behind the logo on the front page.
 *
 * More than one and the page picks — in the browser, so the front page is still
 * built once for everybody and which film you get is still a surprise. The order
 * here is only the order they are listed in; it does not make one more likely.
 */
export default function Films({ initial }: { initial: Film[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [kept, setKept] = useState(initial);
  const [order, setOrder] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [problem, setProblem] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  const changed = useMemo(
    () => JSON.stringify(rows.map(text)) !== JSON.stringify(kept.map(text)),
    [rows, kept],
  );

  useUnsaved(changed || order, "changes to the front page");

  function edit(id: string, patch: Partial<Film>) {
    setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setJustSaved(false);
  }

  function move(from: number, to: number) {
    const next = moved(rows, from, to);
    if (next === rows) return;
    setRows(next);
    setOrder(true);
  }

  const { dropProps, handleProps, stateOf } = useDragOrder(rows, move);

  function save() {
    setProblem("");
    start(async () => {
      const result = await saveFilms(
        rows.map((row) => ({ id: row.id, called: row.called, published: row.published })),
      );
      if (!result.ok) {
        setProblem(result.error ?? "That did not save.");
        return;
      }
      setKept(rows);
      setJustSaved(true);
      router.refresh();
    });
  }

  function keepOrder() {
    setProblem("");
    start(async () => {
      const result = await reorderFilms(rows.map((row) => row.id));
      if (!result.ok) setProblem(result.error ?? "The order did not save.");
      else setOrder(false);
    });
  }

  function remove(row: Film) {
    if (!confirm(`Take “${row.called || "this film"}” off the front page? It goes to the bin for thirty days.`))
      return;
    setProblem("");
    start(async () => {
      const result = await deleteFilm(row.id);
      if (!result.ok) {
        setProblem(result.error ?? "That did not delete.");
        return;
      }
      setRows((list) => list.filter((one) => one.id !== row.id));
      setKept((list) => list.filter((one) => one.id !== row.id));
      router.refresh();
    });
  }

  const showing = rows.filter((row) => row.published).length;

  return (
    <>
      <Problem>{problem}</Problem>

      <InHead>
        <VideoUploader
          onDone={async (film, file) => {
            const called = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
            const result = await addFilm({
              path: film.path,
              posterPath: film.posterPath,
              called,
              seconds: film.seconds,
              bytes: film.bytes,
            });
            if (!result.ok || !result.id) {
              setProblem(result.error ?? "The film went up but did not get written down.");
              return;
            }
            const fresh: Film = {
              id: result.id,
              called,
              src: mediaUrl(film.path),
              poster: film.posterPath ? mediaUrl(film.posterPath) : null,
              seconds: film.seconds,
              bytes: film.bytes,
              published: true,
            };
            setRows((list) => [...list, fresh]);
            setKept((list) => [...list, fresh]);
            router.refresh();
          }}
        />
      </InHead>

      {order ? (
        <div className="admin-save" style={{ position: "static", marginTop: 0, marginBottom: 16 }}>
          <button type="button" className="admin-btn" onClick={keepOrder} disabled={pending}>
            {pending ? "saving…" : "keep this order"}
          </button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <Empty>
          No films of your own yet, so the front page is showing the one that came with the site.
        </Empty>
      ) : (
        <ul className="admin-rows">
          {rows.map((row, index) => (
            <li
              key={row.id}
              {...dropProps(row, index)}
              className={["admin-row", stateOf(row), row.published ? "" : "admin-row-hidden"]
                .filter(Boolean)
                .join(" ")}
              style={{ flexWrap: "wrap" }}
            >
              <Grip {...handleProps(row)} />
              <Place index={index} total={rows.length} onMove={move} />

              {/* The still, and pressing it plays the film in the same box —
                  which is the only way to tell two films of the same evening
                  apart. */}
              <span className="admin-film">
                {playing === row.id ? (
                  <video src={row.src} autoPlay muted loop playsInline controls={false} />
                ) : row.poster ? (
                  <button
                    type="button"
                    onClick={() => setPlaying(row.id)}
                    title="Play it"
                    aria-label={`Play ${row.called || "this film"}`}
                  >
                    <Thumb src={row.poster} width={0} height={0} sizes="140px" />
                    <em>play it</em>
                  </button>
                ) : (
                  <button type="button" onClick={() => setPlaying(row.id)} title="Play it">
                    <span className="admin-film-none">no still</span>
                    <em>play it</em>
                  </button>
                )}
              </span>

              <span className="admin-row-main" style={{ minWidth: 220 }}>
                <span className="admin-fields">
                  <Field label="what to call it" hint="Only here. The front page shows no words.">
                    <input
                      value={row.called}
                      onChange={(event) => edit(row.id, { called: event.target.value })}
                      placeholder="the kitchen, 2024"
                    />
                  </Field>
                </span>
                <span className="admin-row-note">{weight(row)}</span>
              </span>

              <span
                className="admin-row-side"
                style={{ flexDirection: "column", alignItems: "flex-end", gap: 7 }}
              >
                <Flag
                  on={row.published}
                  onChange={(next) => edit(row.id, { published: next })}
                  labels={["on the front page", "hidden"]}
                />
                <Bin
                  what={row.called || "this film"}
                  onClick={() => remove(row)}
                  disabled={pending}
                />
              </span>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 ? (
        <SaveBar
          onSave={save}
          pending={pending}
          dirty={changed}
          saved={justSaved}
          label="keep the front page"
        >
          <span className="admin-note" style={{ margin: 0 }}>
            {showing === 0
              ? "nothing on: the front page shows the film that came with the site"
              : showing === 1
                ? "one film, so everybody sees the same one"
                : `${showing} films — each visitor gets one of them`}
          </span>
        </SaveBar>
      ) : null}
    </>
  );
}

/** Only the typing, for working out whether anything needs saving. */
function text(row: Film) {
  return { id: row.id, called: row.called, published: row.published };
}
