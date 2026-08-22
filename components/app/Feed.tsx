"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Photo from "../Photo";
import type { Member, Post } from "@/lib/content";
import {
  replyTo,
  say,
  takeDownMyPost,
  takeDownMyReply,
  wave,
} from "@/app/app/actions";
import { buzz } from "@/lib/native";
import { ACCEPTS, uploadPhoto } from "@/lib/admin/upload";
import { mediaUrl } from "@/lib/supabase/config";

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
}: Props) {
  const [view, setView] = useState<"feed" | "people">("feed");
  const [hello, setHello] = useState<Record<string, boolean>>(
    Object.fromEntries(waved.map((id) => [id, true])),
  );
  const [pending, start] = useTransition();

  /* Name → profile, so a row on the community page can find the person behind
     it. Matched on the name because that is all the community page keeps. */
  const byName = new Map(wavable.map((one) => [one.name, one.id]));

  return (
    <>
      <div className="segmented" role="tablist" aria-label="Connect">
        {(["feed", "people"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            onClick={() => setView(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {view === "feed" ? (
        <>
          <Composer meName={meName} />

          {posts.length === 0 ? (
            <p className="app-note" style={{ padding: "18px var(--gutter)" }}>
              Nothing here yet. Say the first thing.
            </p>
          ) : (
            <ul className="feed">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  mine={post.authorId === meId}
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="app-section">
          <div className="app-section-head">
            <h2 className="app-h2">who is around</h2>
            <span className="app-label">{people.length} people</span>
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
                        {already ? "waved" : "wave"}
                      </button>
                    );
                  })()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** Saying something, with as many pictures as it takes and where you were. */
function Composer({ meName }: { meName: string }) {
  const file = useRef<HTMLInputElement>(null);
  const words_ = useRef<HTMLTextAreaElement>(null);
  /* Shut until it is wanted.
   *
   * Open, it is a textarea, a row of pictures, a place and a button — four things
   * asking to be filled in above a feed nobody has read yet. Shut, it is one line
   * that says what it is for. It opens on the first touch and stays open while
   * there is anything in it, so nothing anybody has typed can be folded away. */
  const [open, setOpen] = useState(false);
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
      const box = (window as { __promeShared?: { words?: string; pictures?: string[] } })
        .__promeShared;
      if (!box?.pictures?.length) return;
      delete (window as { __promeShared?: unknown }).__promeShared;

      setOpen(true);
      if (box.words) setWords((was) => was || box.words!);

      const files = box.pictures.map((one, index) => {
        const [head, body] = one.split(",");
        const bytes = Uint8Array.from(atob(body), (letter) => letter.charCodeAt(0));
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
      const answer = await say(words, place, paths);
      if (!answer.ok) {
        setTrouble(answer.error ?? "That did not go up.");
        return;
      }
      void buzz("medium");
      setWords("");
      setPlace("");
      setPaths([]);
      setOpen(false);
    });
  }

  const working = busy > 0;
  /* Anything typed, chosen or named. While there is, the thing stays open: no
     amount of tidying is worth folding away something somebody has written. */
  const started = Boolean(words.trim() || place.trim() || paths.length > 0);
  const shut = !open && !started;

  /* Three shapes, so nothing is mistaken for anything else: a round button with
     a camera in it adds pictures, a line with a pin on it is where you were, and
     the one filled pill posts. It was two identical grey pills side by side
     labelled PICTURES and POST. */
  /*
   * The field is always here, and that is the fix rather than the tidiness.
   *
   * Shut, this used to be a button that opened the real composer and then focused
   * it — and on iOS a field focused by code rather than by a finger gets the caret
   * and no keyboard. The keyboard only comes up for a touch that lands on a field
   * that already exists. So the field exists, shut is one line of it, and tapping
   * it is a touch on a real field: the keyboard comes up because iOS was asked by
   * a finger.
   */
  return (
    <div className={shut ? "compose compose-shut" : "compose"}>
      <div className="compose-top">
        <span className="avatar" aria-hidden="true">
          {initials(meName) || "you"}
        </span>
        <textarea
          ref={words_}
          rows={shut ? 1 : 3}
          value={words}
          onChange={(change) => setWords(change.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="say something to everyone…"
          aria-label="Write a post"
        />
        {shut ? (
          <span className="compose-shut-mark" aria-hidden="true">
            +
          </span>
        ) : null}
      </div>

      {!shut && paths.length > 0 ? (
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
                  setPaths((current) => current.filter((one) => one !== path))
                }
                aria-label="Take this picture off"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="compose-foot" hidden={shut}>
        <input
          ref={file}
          type="file"
          accept={ACCEPTS}
          multiple
          hidden
          onChange={(change) => void take(change.target.files)}
        />

        {/* A camera in a circle. An icon, because "PICTURES" in a pill was the
            same object as "POST" in a pill and the eye could not tell them
            apart. */}
        <button
          type="button"
          className="compose-add"
          onClick={() => file.current?.click()}
          disabled={working || paths.length >= MOST}
          aria-label={
            paths.length > 0
              ? `Add more pictures (${paths.length} so far)`
              : "Add pictures"
          }
          title="Add pictures"
        >
          {working ? (
            <span className="compose-count">{busy}</span>
          ) : (
            <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
              <path
                d="M4 8.5h3l1.4-2h7.2l1.4 2h3V19H4zM12 16.6a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {paths.length > 0 ? <em>{paths.length}</em> : null}
        </button>

        {/* Where you were: a line with a pin on it, so it reads as something to
            fill in rather than something to press. */}
        <label className="compose-where">
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path
              d="M12 21s6.5-6.1 6.5-10.3A6.5 6.5 0 0 0 5.5 10.7C5.5 14.9 12 21 12 21z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle
              cx="12"
              cy="10.4"
              r="2.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <input
            value={place}
            onChange={(change) => setPlace(change.target.value)}
            placeholder="where?"
            aria-label="Where this was"
          />
        </label>

        <button
          type="button"
          className="compose-post"
          onClick={send}
          disabled={pending || working || (!words.trim() && paths.length === 0)}
        >
          {pending ? "posting…" : "post"}
        </button>
      </div>

      {/* A way out that is not posting. Only while the thing is open, and only
          while there is nothing to lose by taking it — shut, it was an offer to
          close something that was already closed. */}
      {!shut && !started ? (
        <button
          type="button"
          className="compose-shut-again"
          onClick={() => setOpen(false)}
        >
          never mind
        </button>
      ) : null}

      {trouble ? <p className="app-error">{trouble}</p> : null}
    </div>
  );
}

/** One post: the words, the pictures, who answered, and passing it on. */
function PostCard({ post, mine }: { post: Post; mine: boolean }) {
  const [open, setOpen] = useState(false);
  const [words, setWords] = useState("");
  const [trouble, setTrouble] = useState("");
  const [pending, start] = useTransition();

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
      setTrouble("Copied, since this browser has nothing to share with.");
    } catch {
      setTrouble(
        "This browser will neither share nor copy. Long-press the text instead.",
      );
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
              if (!confirm("Take this down? The pictures go with it.")) return;
              start(async () => {
                const answer = await takeDownMyPost(post.id);
                if (!answer.ok)
                  setTrouble(answer.error ?? "That did not work.");
              });
            }}
            disabled={pending}
          >
            take it down
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
            ? "reply"
            : `${post.replies.length} ${post.replies.length === 1 ? "reply" : "replies"}`}
        </button>
        <button
          type="button"
          className="post-action"
          onClick={() => void pass()}
        >
          pass it on
        </button>
      </div>

      {post.replies.length > 0 ? (
        <ul className="replies">
          {post.replies.map((reply) => (
            <li key={reply.id}>
              <span className="reply-who">{reply.author}</span> {reply.text}
              <span className="reply-when">{reply.when}</span>
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
              if (!answer.ok)
                setTrouble(answer.error ?? "That did not go through.");
              else setWords("");
            });
          }}
        >
          <input
            value={words}
            onChange={(change) => setWords(change.target.value)}
            placeholder={`answer ${post.author.split(" ")[0]}…`}
            aria-label="Your reply"
          />
          <button
            type="submit"
            className="pill pill-small"
            disabled={pending || !words.trim()}
          >
            {pending ? "…" : "send"}
          </button>
        </form>
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
