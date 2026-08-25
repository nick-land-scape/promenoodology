"use client";

import { useState } from "react";
import { useSay } from "./Words";

/**
 * The two things you can do about something you wrote: change it, or take it
 * down.
 *
 * At the top right of the thing rather than under it, and drawn rather than
 * spelled. Under it they were two more words at the end of a post, in a row with
 * "reply" and "pass it on" — which put *your* two private controls in the same
 * line as the two things anybody can do, at the same weight, on every post in the
 * feed. Up here they belong to the post the way a title does, and they are quiet
 * until looked for.
 *
 * Deleting asks first, and asks in the page: the browser's own confirm() box is
 * the one thing on a phone that can be switched off by a setting nobody remembers
 * turning on, and a take-down that silently does nothing is worse than one that
 * asks. The second press is the same button, filled in — no dialogue, no second
 * place to look.
 */
export default function Mine({
  onEdit,
  onDelete,
  pending = false,
  /** What is being taken down, for the words a screen reader reads out. */
  what,
}: {
  /** Left out where a thing cannot be edited. */
  onEdit?: () => void;
  onDelete: () => void;
  pending?: boolean;
  what: string;
}) {
  const say = useSay();
  const [sure, setSure] = useState(false);

  return (
    <span className="mine-marks">
      {onEdit && !sure ? (
        <button
          type="button"
          className="mine-mark"
          onClick={onEdit}
          disabled={pending}
          aria-label={say("mine.editThis").replace("{what}", what)}
          title={say("mine.editThis").replace("{what}", what)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
            <path
              d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}

      <button
        type="button"
        className={sure ? "mine-mark is-sure" : "mine-mark"}
        onClick={() => {
          if (!sure) {
            setSure(true);
            return;
          }
          onDelete();
        }}
        disabled={pending}
        aria-label={say(sure ? "mine.reallyTakeDown" : "mine.takeThisDown").replace("{what}", what)}
        title={say(sure ? "mine.reallyTakeDown" : "mine.takeThisDown").replace("{what}", what)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
          <path
            d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* The way out of having pressed it once. Only there while it is asking, so
          the ordinary state of a post is two marks and not three. */}
      {sure ? (
        <button
          type="button"
          className="mine-mark"
          onClick={() => setSure(false)}
          disabled={pending}
          aria-label={say("report.neverMind")}
          title={say("report.neverMind")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </span>
  );
}
