"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bin, Problem, Tag, Word } from "@/components/admin/ui";
import { forgetNote, markNote } from "./actions";

export type Note = {
  id: string;
  kind: "bug" | "idea" | "note";
  text: string;
  about: string;
  agent: string;
  state: "new" | "seen" | "done";
  when: string;
  who: string;
};

const WORD: Record<Note["kind"], string> = { bug: "a bug", idea: "an idea", note: "a word" };

/** What people said, and marking one as read or dealt with. */
export default function Notes({ initial }: { initial: Note[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initial);
  const [only, setOnly] = useState<"all" | Note["kind"]>("all");
  const [problem, setProblem] = useState("");
  const [pending, start] = useTransition();

  const shown = only === "all" ? notes : notes.filter((note) => note.kind === only);

  function mark(note: Note, state: Note["state"]) {
    setProblem("");
    start(async () => {
      const answer = await markNote(note.id, state);
      if (!answer.ok) {
        setProblem(answer.error ?? "That did not save.");
        return;
      }
      setNotes((list) => list.map((one) => (one.id === note.id ? { ...one, state } : one)));
      router.refresh();
    });
  }

  return (
    <>
      <Problem>{problem}</Problem>

      <div className="admin-chips">
        {(["all", "bug", "idea", "note"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            className="admin-chip"
            aria-pressed={only === kind}
            onClick={() => setOnly(kind)}
          >
            {kind === "all" ? "everything" : WORD[kind]}
            <em>{kind === "all" ? notes.length : notes.filter((one) => one.kind === kind).length}</em>
          </button>
        ))}
      </div>

      <ul className="admin-rows">
        {shown.map((note) => (
          <li key={note.id} className="admin-row">
            <span className="admin-row-main">
              <span className="admin-row-meta">
                {WORD[note.kind]} · {note.who} · {note.when}
              </span>
              <span className="admin-row-name" style={{ fontStyle: "normal" }}>
                {note.text}
              </span>
              {note.about || note.agent ? (
                <span className="admin-row-note" style={{ textTransform: "none", letterSpacing: 0 }}>
                  {[note.about, note.agent].filter(Boolean).join(" — ")}
                </span>
              ) : null}
            </span>

            <span className="admin-row-side" style={{ gap: 10 }}>
              {note.state === "new" ? <Tag tone="warn">new</Tag> : null}
              {note.state === "done" ? <Tag tone="on">dealt with</Tag> : null}
              {note.state !== "done" ? (
                <Word onClick={() => mark(note, "done")} disabled={pending}>
                  dealt with
                </Word>
              ) : (
                <Word onClick={() => mark(note, "seen")} disabled={pending}>
                  put it back
                </Word>
              )}
              <Bin
                what="this note"
                onClick={() => {
                  if (!confirm("Delete this note? There is no bin for these.")) return;
                  start(async () => {
                    const answer = await forgetNote(note.id);
                    if (!answer.ok) {
                      setProblem(answer.error ?? "That did not delete.");
                      return;
                    }
                    setNotes((list) => list.filter((one) => one.id !== note.id));
                    router.refresh();
                  });
                }}
                disabled={pending}
              />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
