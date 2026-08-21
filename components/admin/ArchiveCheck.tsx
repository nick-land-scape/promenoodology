"use client";

import { useState } from "react";
import { Button, Icon, Word } from "./ui";

/**
 * Reading every file in the archive and comparing it with what we say about it.
 *
 * Three different things get called "a corrupt image", and only one of them is:
 *
 * A file that will not decode. Genuinely broken, and there is nothing to do with
 * it but delete the row — the picture is gone whatever we say about it.
 *
 * A row that disagrees with its file. Nothing wrong with the picture at all: the
 * wall draws every photograph from the size recorded for it, so a portrait
 * recorded as a landscape is printed in the wrong shape. This is the one that
 * looks broken and is not, and it is fixable without touching the file.
 *
 * A picture that is simply small. 300 pixels across is not damage, it is a
 * thumbnail that was imported instead of the photograph — which no tool can
 * repair, but which is worth knowing about before somebody wonders why the wall
 * looks soft.
 *
 * The measuring happens here rather than on the server because the browser
 * already has a decoder for every format the site accepts, and because 162
 * images is 162 downloads either way — better the machine that is asking.
 */

export type Checked = {
  id: string;
  path: string;
  said: [number, number];
  is: [number, number] | null;
};

function measure(url: string): Promise<[number, number] | null> {
  return new Promise((resolve) => {
    const image = new Image();
    // A file that never answers is as unusable as one that answers wrongly.
    const timer = setTimeout(() => resolve(null), 20_000);
    image.onload = () => {
      clearTimeout(timer);
      resolve([image.naturalWidth, image.naturalHeight]);
    };
    image.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    image.src = url;
  });
}

export default function ArchiveCheck({
  items,
  onFix,
  onDrop,
}: {
  items: { id: string; path: string; url: string; width: number; height: number }[];
  /** Correct the rows that disagree with their files. */
  onFix: (fixes: { id: string; width: number; height: number }[]) => Promise<string | null>;
  /** Throw away the ones whose file will not open at all. */
  onDrop: (ids: string[]) => Promise<string | null>;
}) {
  const [ran, setRan] = useState(false);
  const [busy, setBusy] = useState("");
  const [done, setDone] = useState(0);
  const [found, setFound] = useState<Checked[]>([]);
  const [said, setSaid] = useState("");
  const [problem, setProblem] = useState("");

  async function look() {
    setBusy("reading");
    setProblem("");
    setSaid("");
    setDone(0);

    const out: Checked[] = [];
    // Ten at a time: all 162 at once opens 162 connections and the last ones
    // time out waiting for a socket, which reads as "broken" and is not.
    for (let i = 0; i < items.length; i += 10) {
      const batch = items.slice(i, i + 10);
      const sizes = await Promise.all(batch.map((one) => measure(one.url)));
      batch.forEach((one, at) => {
        out.push({
          id: one.id,
          path: one.path,
          said: [one.width, one.height],
          is: sizes[at],
        });
      });
      setDone(Math.min(items.length, i + 10));
    }

    setFound(out);
    setRan(true);
    setBusy("");
  }

  const dead = found.filter((one) => one.is === null);
  const wrong = found.filter(
    (one) => one.is !== null && (one.is[0] !== one.said[0] || one.is[1] !== one.said[1]),
  );
  const small = found.filter((one) => one.is !== null && Math.max(one.is[0], one.is[1]) < 600);

  async function fix() {
    setBusy("correcting");
    setProblem("");
    const answer = await onFix(
      wrong.map((one) => ({ id: one.id, width: one.is![0], height: one.is![1] })),
    );
    setBusy("");
    if (answer) setProblem(answer);
    else {
      setSaid(
        `${wrong.length} ${wrong.length === 1 ? "photograph" : "photographs"} now say what they measure.`,
      );
      setFound((list) =>
        list.map((one) => (one.is ? { ...one, said: [one.is[0], one.is[1]] as [number, number] } : one)),
      );
    }
  }

  async function drop() {
    if (
      !confirm(
        `Delete ${dead.length} photograph${dead.length === 1 ? "" : "s"} whose file will not open? The rows and the files go, and there is no undo.`,
      )
    ) {
      return;
    }
    setBusy("deleting");
    setProblem("");
    const answer = await onDrop(dead.map((one) => one.id));
    setBusy("");
    if (answer) setProblem(answer);
    else {
      setSaid(`${dead.length} gone.`);
      setFound((list) => list.filter((one) => one.is !== null));
    }
  }

  return (
    <div className="admin-panel admin-check">
      <header className="admin-panel-head">
        <div>
          <h2 className="admin-panel-name">is anything broken?</h2>
          <p className="admin-panel-hint">
            Opens every file in the archive and compares it with what we say about it. Nothing is
            changed until you say so.
          </p>
        </div>
        <Button onClick={look} disabled={Boolean(busy)}>
          <Icon name="search" />
          {busy === "reading"
            ? `${done} of ${items.length}…`
            : ran
              ? "look again"
              : `open all ${items.length}`}
        </Button>
      </header>

      {problem ? <p className="admin-error" style={{ margin: "0 14px 12px" }}>{problem}</p> : null}
      {said ? <p className="admin-ok" style={{ display: "block", margin: "0 14px 12px" }}>{said}</p> : null}

      {ran ? (
        <div className="admin-check-out">
          {dead.length === 0 && wrong.length === 0 ? (
            <p className="admin-check-fine">
              All {found.length} opened, and every one measures what its row says. Nothing is broken.
            </p>
          ) : null}

          {dead.length > 0 ? (
            <div className="admin-check-lot">
              <h3>
                {dead.length} will not open at all
                <Word danger onClick={drop} disabled={Boolean(busy)}>
                  delete {dead.length === 1 ? "it" : "them"}
                </Word>
              </h3>
              <ul>
                {dead.map((one) => (
                  <li key={one.id}>
                    <code>{one.path}</code> — the file is gone or unreadable
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {wrong.length > 0 ? (
            <div className="admin-check-lot">
              <h3>
                {wrong.length} {wrong.length === 1 ? "is" : "are"} printed in the wrong shape
                <Word onClick={fix} disabled={Boolean(busy)}>
                  correct {wrong.length === 1 ? "it" : "them"}
                </Word>
              </h3>
              <ul>
                {wrong.map((one) => (
                  <li key={one.id}>
                    <code>{one.path}</code> — the archive says {one.said[0]}×{one.said[1]}, the file
                    is {one.is![0]}×{one.is![1]}
                  </li>
                ))}
              </ul>
              <p className="admin-note" style={{ margin: "6px 0 0" }}>
                The pictures are fine; the wall is drawing them from the wrong numbers.
              </p>
            </div>
          ) : null}

          {small.length > 0 ? (
            <div className="admin-check-lot">
              <h3>
                {small.length} {small.length === 1 ? "is" : "are"} smaller than the site draws
              </h3>
              <p className="admin-note" style={{ margin: 0 }}>
                Under 600px on the longest edge — a thumbnail was imported rather than the
                photograph. Nothing here can repair that: the pixels were never uploaded. Worth
                replacing from the originals when somebody has them.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
