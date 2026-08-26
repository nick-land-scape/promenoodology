"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Sheet from "./Sheet";
import Mine from "./Mine";
import Face from "./Face";
import {
  agreeWith,
  answerIdea,
  editMyIdea,
  suggestThis,
  takeDownIdea,
  type Idea,
} from "@/app/app/actions";
import { buzz } from "@/lib/native";
import { useSay } from "./Words";

/**
 * What the club should do next, according to the club.
 *
 * A list, one number per line, and a bar at the foot to write in. Everything this
 * deliberately is not is in migration 0042: no way to vote an idea down, no
 * thread under it, and one answer per idea written by the club rather than argued
 * about by it.
 *
 * Ordered by agreement rather than by date, which is the only thing the votes are
 * for — a suggestion box sorted by date is a list where the best idea anybody has
 * had sinks under whatever was written this morning.
 */
export default function Ideas({
  ideas,
  meId,
  meName,
  mePhoto,
  admin,
}: {
  ideas: Idea[];
  meId: string;
  meName: string;
  /** Your own portrait, for the bar at the foot. */
  mePhoto: string | null;
  /** An admin sees the answer box under each one. Nobody else does. */
  admin: boolean;
}) {
  const say = useSay();

  return (
    <>
      {ideas.length === 0 ? (
        <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
          {say("idea.nothingYet")}
        </p>
      ) : (
        <ul className="ideas">
          {ideas.map((idea) => (
            <One key={idea.id} idea={idea} mine={idea.byId === meId} admin={admin} />
          ))}
        </ul>
      )}

      {/* At the foot, like the feed's own composer and for the same reason: you
          arrive at a list to read it, and a field above the answers is a question
          asked before anybody has heard the ones already there. See .compose-shut. */}
      <Propose meName={meName} mePhoto={mePhoto} />
    </>
  );
}

/**
 * The bar you write a suggestion in.
 *
 * Shut, it is one line saying what it is for; pressed, it opens the sheet with
 * the real field in it. The sheet is always mounted rather than made on the
 * press: on iOS a field focused any later than the tap that asked for it gets a
 * caret and no keyboard.
 */
function Propose({ meName, mePhoto }: { meName: string; mePhoto: string | null }) {
  const say = useSay();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [words, setWords] = useState("");
  const [trouble, setTrouble] = useState("");
  const [said, setSaid] = useState("");
  const [pending, start] = useTransition();
  const inside = useRef<HTMLTextAreaElement>(null);

  function send() {
    setTrouble("");
    setSaid("");
    start(async () => {
      const answer = await suggestThis(words);
      if (!answer.ok) {
        setTrouble(answer.error ?? say("idea.didNotWork"));
        return;
      }
      setWords("");
      setOpen(false);
      setSaid(say("idea.thankYou"));
      void buzz("light");
      router.refresh();
    });
  }

  return (
    <>
      {said ? <p className="app-note idea-thanks">{said}</p> : null}

      <div className="compose compose-shut">
        <div className="compose-top">
          <Face photo={mePhoto} name={meName} />
          <textarea
            rows={1}
            value={words}
            readOnly
            onFocus={() => {
              setOpen(true);
              inside.current?.focus();
            }}
            onClick={() => {
              setOpen(true);
              inside.current?.focus();
            }}
            placeholder={say("idea.placeholder")}
            aria-label={say("idea.yours")}
          />
          <span className="compose-shut-mark" aria-hidden="true">
            +
          </span>
        </div>
      </div>

      <Sheet
        open={open}
        title={say("idea.suggestSomething")}
        said={say("idea.everybodyVotes")}
        onClose={() => setOpen(false)}
      >
        <form
          className="compose compose-in-sheet"
          onSubmit={(submit) => {
            submit.preventDefault();
            send();
          }}
        >
          <div className="compose-top">
            <Face photo={mePhoto} name={meName} />
            <textarea
              ref={inside}
              rows={3}
              value={words}
              onChange={(change) => setWords(change.target.value)}
              placeholder={say("idea.placeholder")}
              aria-label={say("idea.yours")}
            />
          </div>

          <div className="compose-foot">
            <button type="submit" className="pill pill-solid" disabled={pending || !words.trim()}>
              {pending ? "…" : say("idea.suggestIt")}
            </button>
          </div>

          {trouble ? <p className="app-error">{trouble}</p> : null}
        </form>
      </Sheet>
    </>
  );
}

function One({ idea, mine, admin }: { idea: Idea; mine: boolean; admin: boolean }) {
  const say = useSay();
  const [agreed, setAgreed] = useState(idea.agreed);
  const [votes, setVotes] = useState(idea.votes);
  const [words, setWords] = useState(idea.words);
  const [edited, setEdited] = useState(Boolean(idea.edited));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(idea.words);
  const [gone, setGone] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [answer, setAnswer] = useState(idea.answer);
  const [state, setState] = useState(idea.state);
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  if (gone) return null;

  function agree() {
    const now = !agreed;
    /* Moved before the server is asked, and put back if it says no. The number is
       the only thing on the screen that changes, and waiting a round trip to see
       it move makes a button feel broken. */
    setAgreed(now);
    setVotes((count) => count + (now ? 1 : -1));
    void buzz("light");
    start(async () => {
      const said = await agreeWith(idea.id, now);
      if (!said.ok) {
        setAgreed(!now);
        setVotes((count) => count + (now ? -1 : 1));
        setTrouble(said.error ?? say("idea.didNotWork"));
      }
    });
  }

  return (
    <li className="idea">
      {/* The count is the button. A separate arrow beside a number is two things
          to aim at where there is one decision. */}
      <button
        type="button"
        className={agreed ? "idea-agree is-on" : "idea-agree"}
        onClick={agree}
        disabled={pending}
        aria-pressed={agreed}
        aria-label={say(agreed ? "idea.youAgree" : "idea.agree")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" width="13" height="13">
          <path
            d="M12 5l7 8h-4v6h-6v-6H5z"
            fill={agreed ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <b>{votes}</b>
      </button>

      <div className="idea-body">
        {/* Yours only. An admin who wants something gone reports it first and
            settles the report, which leaves a record of why it went — see
            /admin/reports. A pair of delete buttons on every post in the club,
            visible to two people, is a different app. */}
        {mine && !editing ? (
          <Mine
            what={say("mine.thisIdea")}
            pending={pending}
            onEdit={() => {
              setDraft(words);
              setEditing(true);
            }}
            onDelete={() =>
              start(async () => {
                const said = await takeDownIdea(idea.id);
                if (!said.ok) {
                  setTrouble(said.error ?? say("idea.didNotWork"));
                  return;
                }
                setGone(true);
              })
            }
          />
        ) : null}

        {editing ? (
          <form
            className="idea-editing"
            onSubmit={(submit) => {
              submit.preventDefault();
              setTrouble("");
              start(async () => {
                const said = await editMyIdea(idea.id, draft);
                if (!said.ok) {
                  setTrouble(said.error ?? say("idea.didNotWork"));
                  return;
                }
                setWords(draft.trim());
                setEdited(true);
                setEditing(false);
              });
            }}
          >
            <textarea
              value={draft}
              onChange={(change) => setDraft(change.target.value)}
              rows={3}
              aria-label={say("idea.yours")}
            />
            <div className="idea-feet">
              <button type="submit" className="pill pill-small pill-solid" disabled={pending}>
                {say("idea.saveEdit")}
              </button>
              <button
                type="button"
                className="pill pill-small"
                onClick={() => {
                  setDraft(words);
                  setEditing(false);
                }}
                disabled={pending}
              >
                {say("report.neverMind")}
              </button>
            </div>
          </form>
        ) : (
          <p className="idea-words">{words}</p>
        )}

        {/* Who, when, and whether it has been changed since. */}
        <p className="idea-who">
          <span className="idea-face">
            <Face photo={idea.photo} name={idea.by} />
          </span>
          <span>
            {idea.by} · {howLongAgo(idea.when)}
            {edited ? ` · ${say("idea.edited")}` : ""}
          </span>
          {idea.state !== "open" ? (
            <span className={`idea-state idea-state-${idea.state.replace(" ", "-")}`}>
              {say(`idea.${idea.state === "not now" ? "notNow" : idea.state}`)}
            </span>
          ) : null}
        </p>

        {/* The club's answer, where there is one. Everybody sees it; only an admin
            can write it. */}
        {answer ? (
          <p className="idea-answer">
            <em>{say("idea.theClubSays")}</em> {answer}
          </p>
        ) : null}

        {admin ? (
          answering ? (
            <form
              className="idea-answering"
              onSubmit={(submit) => {
                submit.preventDefault();
                setTrouble("");
                start(async () => {
                  const said = await answerIdea(idea.id, state, answer);
                  if (!said.ok) {
                    setTrouble(said.error ?? say("idea.didNotWork"));
                    return;
                  }
                  setAnswering(false);
                });
              }}
            >
              <div className="idea-states">
                {(["open", "doing", "done", "not now"] as const).map((one) => (
                  <button
                    key={one}
                    type="button"
                    className={state === one ? "chip is-on" : "chip"}
                    aria-pressed={state === one}
                    onClick={() => setState(one)}
                  >
                    {say(`idea.${one === "not now" ? "notNow" : one}`)}
                  </button>
                ))}
              </div>
              <textarea
                value={answer}
                onChange={(change) => setAnswer(change.target.value)}
                placeholder={say("idea.answerHint")}
                rows={2}
              />
              <div className="idea-feet">
                <button type="submit" className="pill pill-small pill-solid" disabled={pending}>
                  {say("idea.saveAnswer")}
                </button>
                <button
                  type="button"
                  className="pill pill-small"
                  onClick={() => setAnswering(false)}
                  disabled={pending}
                >
                  {say("report.neverMind")}
                </button>

                {/* Taking the answer back.
                
                    An answer written in haste, or one that has stopped being
                    true — "we are doing it" six months later — had no way out
                    except writing over it, and an empty box saved as an answer is
                    still an answer as far as the app is concerned. This clears
                    both halves: the words and the state go back to where an idea
                    starts, which is open and unanswered. */}
                {answer ? (
                  <button
                    type="button"
                    className="post-action post-action-quiet"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const said = await answerIdea(idea.id, "open", "");
                        if (!said.ok) {
                          setTrouble(said.error ?? say("idea.didNotWork"));
                          return;
                        }
                        setAnswer("");
                        setState("open");
                        setAnswering(false);
                      })
                    }
                  >
                    {say("idea.removeAnswer")}
                  </button>
                ) : null}
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="post-action"
              onClick={() => setAnswering(true)}
              disabled={pending}
            >
              {answer ? say("idea.changeAnswer") : say("idea.answerIt")}
            </button>
          )
        ) : null}

        {trouble ? <p className="app-error">{trouble}</p> : null}
      </div>
    </li>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

/** "just now", "3 hours ago", "yesterday", "12 August". */
function howLongAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 8) return `${days} days`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}
