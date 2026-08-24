"use client";

import { useState, useTransition } from "react";
import Sheet from "./Sheet";
import { blockThem, reportThis, type Because } from "@/app/app/actions";
import { useSay } from "./Words";

/**
 * What you can do about something somebody else wrote.
 *
 * Two things, and they are deliberately in one sheet because they are the two
 * halves of one moment: something is wrong, and you are deciding whether it is
 * the club's problem or yours. Reporting hands it over. Blocking settles it
 * yourself, immediately, without anybody's agreement.
 *
 * The reasons are five and no more. A list of fifteen is a form; five is a
 * sentence somebody can read while annoyed, which is the state anybody pressing
 * this button is in. "Something else" carries the rest, and the field underneath
 * is where the actual information usually ends up.
 *
 * Nothing here promises that the post will disappear. It says somebody will look,
 * because that is what happens — a post that vanishes the moment one person
 * objects is a feed run by whoever objects the most.
 */
export default function Trouble({
  open,
  onClose,
  /** What is being reported: a post, or one reply to one. */
  about,
  /** Whose it is — for the wording, and for the block. */
  who,
  whoId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  about: { post: string } | { reply: string };
  who: string;
  whoId: string;
  onDone: (said: string) => void;
}) {
  const say = useSay();
  const [because, setBecause] = useState<Because>("abuse");
  const [said, setSaid] = useState("");
  const [asking, setAsking] = useState(false);
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  const first = who.split(" ")[0];

  const reasons: { key: Because; word: string }[] = [
    { key: "abuse", word: say("report.abuse") },
    { key: "not true", word: say("report.notTrue") },
    { key: "not theirs", word: say("report.notTheirs") },
    { key: "nothing to do with us", word: say("report.notOurs") },
    { key: "something else", word: say("report.somethingElse") },
  ];

  function send() {
    setTrouble("");
    start(async () => {
      const answer = await reportThis({
        ...("post" in about ? { post: about.post } : { reply: about.reply }),
        because,
        said,
      });
      if (!answer.ok) {
        setTrouble(answer.error ?? say("join.didNotGoThrough"));
        return;
      }
      setSaid("");
      onDone(say("report.thankYou"));
      onClose();
    });
  }

  function block() {
    setTrouble("");
    start(async () => {
      const answer = await blockThem(whoId);
      if (!answer.ok) {
        setTrouble(answer.error ?? say("join.didNotGoThrough"));
        return;
      }
      onDone(say("report.blocked").replace("{name}", first));
      onClose();
    });
  }

  return (
    <Sheet
      open={open}
      title={say("report.whatIsWrong")}
      said={say("report.somebodyWillLook")}
      onClose={onClose}
    >
      <div className="field-block">
        {/* Radios rather than a select: five things you can see at once beat five
            things behind a tap, and the one you want is usually the first. */}
        <fieldset className="trouble-why">
          <legend>{say("report.why")}</legend>
          {reasons.map((reason) => (
            <label key={reason.key}>
              <input
                type="radio"
                name="because"
                checked={because === reason.key}
                onChange={() => setBecause(reason.key)}
              />
              <span>{reason.word}</span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>{say("report.anythingElse")}</span>
          <textarea
            value={said}
            onChange={(change) => setSaid(change.target.value)}
            rows={3}
            placeholder={say("report.inYourWords")}
          />
        </label>

        <button
          type="button"
          className="pill pill-solid"
          onClick={send}
          disabled={pending}
        >
          {pending ? "…" : say("report.sendIt")}
        </button>

        {/* And the other half: doing it yourself. Under a rule, because it is a
            different kind of act — nobody is asked, nobody is told, and it takes
            effect before the sheet has closed. */}
        <div className="trouble-block">
          <p className="app-note">
            {say("report.orBlock").replace("{name}", first)}
          </p>
          {asking ? (
            <div className="trouble-sure">
              <button
                type="button"
                className="pill pill-small pill-solid"
                onClick={block}
                disabled={pending}
              >
                {say("report.blockThem").replace("{name}", first)}
              </button>
              <button
                type="button"
                className="pill pill-small"
                onClick={() => setAsking(false)}
                disabled={pending}
              >
                {say("report.neverMind")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="pill pill-small"
              onClick={() => setAsking(true)}
              disabled={pending}
            >
              {say("report.beDoneWith").replace("{name}", first)}
            </button>
          )}
        </div>

        {trouble ? <p className="app-error">{trouble}</p> : null}
      </div>
    </Sheet>
  );
}
