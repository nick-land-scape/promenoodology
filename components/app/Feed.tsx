"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import Photo from "../Photo";
import Sheet from "./Sheet";
import Trouble from "./Trouble";
import Ideas from "./Ideas";
import type { Member, Post } from "@/lib/content";
import type { Idea } from "@/app/app/actions";
import {
  replyTo,
  /* Renamed here only: the action that posts and the hook that reads the app's
     own words were both called `say`, which is a fair name for either. */
  say as postToEveryone,
  takeDownMyPost,
  takeDownMyReply,
  wave,
} from "@/app/app/actions";
import { buzz } from "@/lib/native";
import { ACCEPTS, uploadPhoto } from "@/lib/admin/upload";
import { mediaUrl } from "@/lib/supabase/config";
import { useSay } from "./Words";

type Props = {
  posts: Post[];
  people: Member[];
  /** Which profile is reading, so it knows what is yours to take down. */
  meId: string;
  meName: string;
  /** Everybody on the community page who has an account, so a wave has an
      address to go to — a name on that page is not always somebody who can be
      waved at. */
  wavable: { id: string; name: string }[];
  /** Who you have already waved at. */
  waved: string[];
  /** What the club has been asked to do, most agreed with first. */
  ideas: Idea[];
  /** Whether the person reading can answer one. */
  admin: boolean;
};

const MOST = 8;

/**
 * Connect: what people are saying, and who is around.
 *
 * It was a drawing of a social feed — posts out of a CSV file, a like count that
 * went up when you pressed it and nowhere else, a reply count that was a number
 * in a spreadsheet, and a composer that threw away whatever you typed.
 *
 * What it is now, and what it deliberately is not:
 *
 * **Several pictures**, because an evening is not one photograph. They go up as
 * they are chosen rather than when the post is sent, so a post with six
 * photographs on a train does not fail all at once at the end.
 *
 * **A place**, typed, because "where" is the one thing every post here wants to
 * say and a map picker is a permission dialogue nobody asked for.
 *
 * **Replies**, in a table, under the post they answer.
 *
 * **No likes.** Asked for, and right: a like is a number that makes people watch
 * a number. What is left is answering somebody and passing something on.
 */
export default function Feed({
  posts,
  people,
  meId,
  meName,
  wavable,
  waved,
  ideas,
  admin,
}: Props) {
  const say = useSay();
  /* Three ways of looking at the same club: what people said, what the club is
     being asked to do, and who is in it. Ideas in the middle deliberately — it is
     the one of the three nobody arrives looking for, and a tab at the end of a row
     is a tab that gets found in a month. */
  const [view, setView] = useState<"feed" | "ideas" | "people">("feed");
  const [hello, setHello] = useState<Record<string, boolean>>(
    Object.fromEntries(waved.map((id) => [id, true])),
  );
  const [pending, start] = useTransition();

  /* Name → profile, so a row on the community page can find the person behind
     it. Matched on the name because that is all the community page keeps. */
  const byName = new Map(wavable.map((one) => [one.name, one.id]));

  return (
    <>
      <div className="segmented" role="tablist" aria-label={say("con.switch")}>
        {(["feed", "ideas", "people"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            onClick={() => setView(option)}
          >
            {say(`con.${option}`)}
          </button>
        ))}
      </div>

      {view === "ideas" ? (
        <Ideas ideas={ideas} meId={meId} meName={meName} admin={admin} />
      ) : null}

      {view === "feed" ? (
        <>
          {posts.length === 0 ? (
            <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
              {say("con.nothingYet")}
            </p>
          ) : (
            <ul className="feed">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  mine={post.authorId === meId}
                  meId={meId}
                />
              ))}
            </ul>
          )}

          {/* Under the feed, not over it. It was the first thing on the screen,
              which put a question before the answers: you arrive at a feed to
              read it, and what everybody else said was below the fold behind a
              field nobody had asked for. At the foot it is where a thumb already
              is, and it stays there while the feed goes past underneath — see the
              note on .compose-shut. */}
          <Composer meName={meName} />
        </>
      ) : null}

      {/* Named rather than left as the `else` of the feed.
      
          This was written as one ternary when there were two views — feed, or
          otherwise the people — which is exactly right for two and quietly wrong
          for three: the ideas tab walked into the `else` and drew who is around
          underneath itself. A branch that means "not the feed" is a branch that
          breaks the day a third tab arrives. */}
      {view === "people" ? (
        <div className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">{say("con.whoIsAround")}</h2>
            <span className="app-label">
              {people.length} {say("con.howManyPeople")}
            </span>
          </div>
          {/* Two columns of these on a tablet: a name and a country in a row a
              thousand points wide is mostly empty room. */}
          <ul className="row-list row-list-people">
            {people.map((member) => (
              <li key={`${member.first}-${member.last}`}>
                <div className="row">
                  {member.photo ? (
                    <span className="avatar avatar-photo">
                      <Photo src={member.photo.src} alt="" fill sizes="40px" />
                    </span>
                  ) : (
                    <span className="avatar" aria-hidden="true">
                      {initials(member.name)}
                    </span>
                  )}
                  <span className="row-body">
                    <span className="row-title">{member.name}</span>
                    <span className="row-meta">{member.country}</span>
                  </span>

                  {/* A wave is the whole message: no subject, no words, no
                      thread. Only offered to somebody who has an account to
                      receive it, and never to yourself. */}
                  {(() => {
                    const id = byName.get(member.name);
                    if (!id || id === meId) return null;
                    const already = hello[id];
                    return (
                      <button
                        type="button"
                        className={
                          already
                            ? "pill pill-small"
                            : "pill pill-small pill-solid"
                        }
                        disabled={already || pending}
                        onClick={() =>
                          start(async () => {
                            const answer = await wave(id);
                            if (answer.ok)
                              setHello((current) => ({
                                ...current,
                                [id]: true,
                              }));
                          })
                        }
                      >
                        {say(already ? "con.waved" : "con.wave")}
                      </button>
                    );
                  })()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

/** Saying something, with as many pictures as it takes and where you were. */
function Composer({ meName }: { meName: string }) {
  const say = useSay();
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const words_ = useRef<HTMLTextAreaElement>(null);
  /* Shut until it is wanted.
   *
   * Open, it is a textarea, a row of pictures, a place and a button — four things
   * asking to be filled in above a feed nobody has read yet. Shut, it is one line
   * that says what it is for. It opens on the first touch and stays open while
   * there is anything in it, so nothing anybody has typed can be folded away. */
  const [open, setOpen] = useState(false);
  /** The real field, inside the sheet: the one that gets the keyboard. */
  const inside = useRef<HTMLTextAreaElement>(null);
  const [words, setWords] = useState("");
  const [place, setPlace] = useState("");
  const [paths, setPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(0);
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

  const me = supabaseUserFolder();

  /* Photographs shared to the app from somewhere else on the phone.
   *
   * The native side leaves them on `window.__promeShared` and shouts once, then
   * navigates here — so this listens for the shout and also looks on mount, for
   * the cold start where the app arrives after the message. Everything after that
   * is the ordinary composer: the same upload, the same eight-picture limit, the
   * same post button. Nothing is sent anywhere until somebody presses it. */
  useEffect(() => {
    const collect = () => {
      const box = (
        window as { __promeShared?: { words?: string; pictures?: string[] } }
      ).__promeShared;
      if (!box?.pictures?.length) return;
      delete (window as { __promeShared?: unknown }).__promeShared;

      setOpen(true);
      if (box.words) setWords((was) => was || box.words!);

      const files = box.pictures.map((one, index) => {
        const [head, body] = one.split(",");
        const bytes = Uint8Array.from(atob(body), (letter) =>
          letter.charCodeAt(0),
        );
        const type = /:(.*?);/.exec(head)?.[1] ?? "image/jpeg";
        return new File([bytes], `shared-${index + 1}.jpg`, { type });
      });
      const carrier = new DataTransfer();
      for (const file of files) carrier.items.add(file);
      void take(carrier.files);
    };

    collect();
    window.addEventListener("prome:shared", collect);
    return () => window.removeEventListener("prome:shared", collect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function take(chosen: FileList | null) {
    const pictures = Array.from(chosen ?? []);
    if (pictures.length === 0) return;
    setTrouble("");

    const room = MOST - paths.length;
    if (room <= 0) {
      setTrouble(`Eight pictures is the most on one post.`);
      return;
    }

    /* One at a time on purpose: several phone photographs at once each want a
       canvas the size of the picture, and a phone runs out of memory before it
       runs out of patience. */
    for (const picture of pictures.slice(0, room)) {
      setBusy((count) => count + 1);
      try {
        const uploaded = await uploadPhoto(picture, `posts/${await me}`);
        setPaths((current) => [...current, uploaded.path]);
      } catch (error) {
        setTrouble(
          error instanceof Error
            ? error.message
            : `${picture.name} did not go up.`,
        );
      } finally {
        setBusy((count) => count - 1);
      }
    }
    if (file.current) file.current.value = "";
  }

  function send() {
    setTrouble("");
    start(async () => {
      const answer = await postToEveryone(words, place, paths);
      if (!answer.ok) {
        setTrouble(answer.error ?? say("post.didNotGoUp"));
        return;
      }
      void buzz("medium");
      setWords("");
      setPlace("");
      setPaths([]);
      setOpen(false);
      /* Asked for from here rather than invalidated from inside the action — see
         the note above `carefully` in app/app/actions.ts. A refresh that fails
         leaves the screen as it was, and the post is already saved by then. */
      router.refresh();
    });
  }

  const working = busy > 0;
  /* Anything typed, chosen or named. While there is, the thing stays open: no
     amount of tidying is worth folding away something somebody has written. */

  /* Three shapes in the sheet, so nothing is mistaken for anything else: a round
     button with a camera in it adds pictures, a line with a pin on it is where you
     were, and the one filled pill posts.

     The line on the screen behind is read-only on purpose. It is a door, not a
     field: typing into it would put words somewhere the pictures and the place
     cannot follow, and the real field is one press away with the keyboard already
     coming up. */

  return (
    <>
      {/* The line you press, and nothing else on the screen.
          The whole composer used to unfold here — three controls, a row of
          thumbnails and a way out — pushing the feed down the screen before a word
          had been typed. */}
      <div className="compose compose-shut">
        <div className="compose-top">
          <span className="avatar" aria-hidden="true">
            {initials(meName) || say("con.you")}
          </span>
          <textarea
            ref={words_}
            rows={1}
            value={words}
            readOnly
            onFocus={() => {
              setOpen(true);
              /* Straight into the real field inside the sheet, in the same breath
                 as the press. The sheet is always mounted for exactly this reason:
                 on iOS a field focused any later than the tap that asked for it
                 gets a caret and no keyboard. */
              inside.current?.focus();
            }}
            onClick={() => {
              setOpen(true);
              inside.current?.focus();
            }}
            placeholder={say("post.sayToEveryone")}
            aria-label={say("post.writeAPost")}
          />
          <span className="compose-shut-mark" aria-hidden="true">
            +
          </span>
        </div>
      </div>

      <Sheet
        open={open}
        title={say("post.saySomething")}
        said={say("post.everybodySees")}
        onClose={() => setOpen(false)}
      >
        <div className="compose compose-in-sheet">
          <div className="compose-top">
            <span className="avatar" aria-hidden="true">
              {initials(meName) || say("con.you")}
            </span>
            <textarea
              ref={inside}
              rows={4}
              value={words}
              onChange={(change) => setWords(change.target.value)}
              placeholder={say("post.sayToEveryone")}
              aria-label={say("post.writeAPost")}
            />
          </div>

          {paths.length > 0 ? (
            <ul className="compose-pics">
              {paths.map((path) => (
                <li key={path}>
                  <Photo
                    src={mediaUrl(path)}
                    alt=""
                    width={300}
                    height={300}
                    sizes="88px"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPaths((current) =>
                        current.filter((one) => one !== path),
                      )
                    }
                    aria-label={say("post.takePictureOff")}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="compose-foot">
            <input
              ref={file}
              type="file"
              accept={ACCEPTS}
              multiple
              hidden
              onChange={(change) => void take(change.target.files)}
            />
            <button
              type="button"
              className="compose-add"
              onClick={() => file.current?.click()}
              disabled={working}
              aria-label={say("post.addPictures")}
              title={say("post.addPictures")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M3.5 7.5h3l1.5-2h8l1.5 2h3v11h-17z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="13"
                  r="3.2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              {working ? <span className="compose-count">{busy}</span> : null}
            </button>

            <label className="compose-where">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 21s6-5.7 6-10a6 6 0 1 0-12 0c0 4.3 6 10 6 10z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="12"
                  cy="11"
                  r="2.2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <input
                value={place}
                onChange={(change) => setPlace(change.target.value)}
                placeholder={say("post.where")}
                aria-label={say("post.whereLabel")}
              />
            </label>

            <button
              type="button"
              className="compose-post"
              onClick={send}
              disabled={
                pending || working || (!words.trim() && paths.length === 0)
              }
            >
              {say(pending ? "post.posting" : "post.post")}
            </button>
          </div>

          {trouble ? <p className="app-error">{trouble}</p> : null}
        </div>
      </Sheet>
    </>
  );
}

/** One post: the words, the pictures, who answered, and passing it on. */
function PostCard({
  post,
  mine,
  /** So a reply of your own is not offered a way to report itself. */
  meId,
}: {
  post: Post;
  mine: boolean;
  meId: string;
}) {
  const say = useSay();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [words, setWords] = useState("");
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();
  /* What is being complained about, or null. A post or one of its replies —
     the same sheet either way, because it is the same decision. */
  const [wrong, setWrong] = useState<
    null | { about: { post: string } | { reply: string }; who: string; whoId: string }
  >(null);

  async function pass() {
    const url = `${window.location.origin}/app/connect`;
    const said = `${post.author}: ${post.text}`.slice(0, 200);
    if (navigator.share) {
      try {
        await navigator.share({ title: "promeNOODology", text: said, url });
      } catch {
        // Dismissed. Nothing to say about it.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${said}\n${url}`);
      setTrouble(say("post.copied"));
    } catch {
      setTrouble(say("post.neitherShare"));
    }
  }

  return (
    <li className="post">
      <div className="post-head">
        <span className="avatar" aria-hidden="true">
          {initials(post.author)}
        </span>
        <span className="row-body">
          <span className="post-who">{post.author}</span>
          <span className="row-meta">
            {[post.place, post.when].filter(Boolean).join(" · ")}
          </span>
        </span>
        {mine ? (
          <button
            type="button"
            className="post-action"
            onClick={() => {
              if (!confirm(say("post.reallyTakeDown"))) return;
              start(async () => {
                const answer = await takeDownMyPost(post.id);
                if (!answer.ok) {
                  setTrouble(answer.error ?? say("join.didNotWork"));
                  return;
                }
                router.refresh();
              });
            }}
            disabled={pending}
          >
            {say("post.takeItDown")}
          </button>
        ) : null}
      </div>

      {post.text ? <p className="post-text">{post.text}</p> : null}

      {/* One fills the width; several become a strip you push sideways, which is
          what a phone does with more than one picture. */}
      {post.photos.length === 1 ? (
        <div className="post-photo">
          <Photo
            src={post.photos[0].src}
            alt=""
            fill
            sizes="(max-width: 560px) 100vw, 560px"
          />
        </div>
      ) : post.photos.length > 1 ? (
        <ul className="post-strip">
          {post.photos.map((photo) => (
            <li key={photo.src}>
              <Photo
                src={photo.src}
                alt=""
                width={900}
                height={900}
                sizes="72vw"
              />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="post-actions">
        <button
          type="button"
          className="post-action"
          onClick={() => setOpen(!open)}
        >
          {post.replies.length === 0
            ? say("post.reply")
            : `${post.replies.length} ${say(
                post.replies.length === 1 ? "post.oneReply" : "post.manyReplies",
              )}`}
        </button>
        <button
          type="button"
          className="post-action"
          onClick={() => void pass()}
        >
          {say("post.passItOn")}
        </button>

        {/* On somebody else's post only: your own needs no reporting, and the
            control that takes it down is already in its header. Quiet and last,
            because it is the rarest thing anybody does here and putting it beside
            "reply" at the same weight would make the feed look like a place where
            people are usually in trouble. */}
        {mine ? null : (
          <button
            type="button"
            className="post-action post-action-quiet"
            onClick={() =>
              setWrong({ about: { post: post.id }, who: post.author, whoId: post.authorId })
            }
          >
            {say("report.report")}
          </button>
        )}
      </div>

      {post.replies.length > 0 ? (
        <ul className="replies">
          {post.replies.map((reply) => (
            <li key={reply.id}>
              <span className="reply-who">{reply.author}</span> {reply.text}
              <span className="reply-when">{reply.when}</span>
              {/* A reply is a line of type, so this is a word at the end of it
                  rather than a button under it. It appears on hover on a laptop
                  and is always there on a phone, where there is no hover and a
                  thing you cannot see is a thing you do not have. */}
              {reply.authorId === meId ? null : (
                <button
                  type="button"
                  className="reply-report"
                  onClick={() =>
                    setWrong({
                      about: { reply: reply.id },
                      who: reply.author,
                      whoId: reply.authorId,
                    })
                  }
                >
                  {say("report.report")}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <form
          className="reply-form"
          onSubmit={(submit) => {
            submit.preventDefault();
            setTrouble("");
            start(async () => {
              const answer = await replyTo(post.id, words);
              if (!answer.ok) {
                setTrouble(answer.error ?? say("join.didNotGoThrough"));
                return;
              }
              setWords("");
              router.refresh();
            });
          }}
        >
          <input
            value={words}
            onChange={(change) => setWords(change.target.value)}
            placeholder={say("post.answerName").replace("{name}", post.author.split(" ")[0])}
            aria-label={say("post.yourReply")}
          />
          <button
            type="submit"
            className="pill pill-small"
            disabled={pending || !words.trim()}
          >
            {pending ? "…" : say("post.send")}
          </button>
        </form>
      ) : null}

      {wrong ? (
        <Trouble
          open
          onClose={() => setWrong(null)}
          about={wrong.about}
          who={wrong.who}
          whoId={wrong.whoId}
          onDone={(words) => setTrouble(words)}
        />
      ) : null}

      {trouble ? <p className="app-error">{trouble}</p> : null}
    </li>
  );
}

/**
 * Which folder in the bucket is yours.
 *
 * The storage policy names it after the login rather than the profile, so this
 * has to ask the browser's own client who is signed in rather than being told by
 * the page — the page knows the profile id, which is a different number.
 */
async function supabaseUserFolder(): Promise<string> {
  const { supabaseBrowser } = await import("@/lib/supabase/browser");
  const {
    data: { user },
  } = await supabaseBrowser().auth.getUser();
  return user?.id ?? "nobody";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}
