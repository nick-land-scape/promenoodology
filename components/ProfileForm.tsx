"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  changeMyEmail,
  type Result,
  saveProfile,
  setMyPhoto,
} from "@/lib/site-actions/account";
import { ACCEPTS, uploadPhoto } from "@/lib/admin/upload";
import { mediaUrl } from "@/lib/supabase/config";
import Photo from "./Photo";

type Props = {
  /** The login, which is also the only folder in the bucket you may write to. */
  userId: string;
  email: string;
  name: string;
  country: string;
  listed: boolean;
  photo: string | null;
  memberNo: number | null;
  since: string;
};

/**
 * Everything about you that you can change yourself.
 *
 * Three separate things on one page, and separately answered: the portrait is
 * kept the moment it is uploaded because it is a file and there is nothing to
 * weigh up about it; the name and the rest wait for the save; and the address
 * does not move at all until the new inbox answers.
 *
 * Your number is not one of them, and neither is the day you joined. They are
 * facts about you rather than settings, so they are stated and left alone.
 */
export default function ProfileForm({
  userId,
  email,
  name,
  country,
  listed,
  photo,
  memberNo,
  since,
}: Props) {
  const [state, action, pending] = useActionState(saveProfile, {} as Result);
  const [mail, mailAction, mailPending] = useActionState(changeMyEmail, {} as Result);
  const [changing, setChanging] = useState(false);

  const file = useRef<HTMLInputElement>(null);
  const [portrait, setPortrait] = useState(photo);
  const [busy, setBusy] = useState(false);
  const [trouble, setTrouble] = useState("");
  const [, start] = useTransition();

  async function take(chosen: File | null) {
    if (!chosen) return;
    setTrouble("");
    setBusy(true);
    try {
      // Only this folder: the storage policy names it, and anything else is
      // refused by the database rather than by this page.
      const uploaded = await uploadPhoto(chosen, `profiles/${userId}`);
      const answer = await setMyPhoto(uploaded.path);
      if (answer.error) {
        setTrouble(answer.error);
        return;
      }
      setPortrait(uploaded.path);
    } catch (error) {
      setTrouble(error instanceof Error ? error.message : "That picture did not go up.");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  function takeItOff() {
    setTrouble("");
    start(async () => {
      const answer = await setMyPhoto(null);
      if (answer.error) setTrouble(answer.error);
      else setPortrait(null);
    });
  }

  return (
    <>
      {/* The portrait, and the box is the button: you press the picture to
          change the picture. Portrait-shaped, because that is the shape the
          community page draws it in. */}
      <div className="me-portrait">
        <input
          ref={file}
          type="file"
          accept={ACCEPTS}
          hidden
          onChange={(event) => void take(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="me-portrait-box"
          onClick={() => file.current?.click()}
          disabled={busy}
          title={portrait ? "Choose another portrait" : "Add a portrait"}
        >
          {portrait ? (
            <Photo
              src={mediaUrl(portrait)}
              alt=""
              width={600}
              height={800}
              sizes="160px"
              priority
            />
          ) : (
            <span className="me-portrait-none">no portrait</span>
          )}
          <em>{busy ? "putting it up…" : portrait ? "replace it" : "add one"}</em>
        </button>

        <div className="me-portrait-said">
          <p className="me-fact">
            This is the photograph on the community page. Portrait-shaped works best — it is
            shrunk and its camera notes are left behind on the way up.
          </p>
          {portrait ? (
            <button type="button" className="text-button" onClick={takeItOff} disabled={busy}>
              take it off
            </button>
          ) : null}
          {trouble ? <p className="auth-error">{trouble}</p> : null}
        </div>
      </div>

      <form action={action} className="auth-form">
        <label>
          <span>your name</span>
          <input name="name" defaultValue={name} required />
        </label>
        <label>
          <span>where you are from</span>
          <input name="country" defaultValue={country} placeholder="optional" />
        </label>
        <label className="auth-check">
          <input type="checkbox" name="listed" defaultChecked={listed} />
          <span>show me on the community page</span>
        </label>

        {state.error ? <p className="auth-error">{state.error}</p> : null}
        {state.message ? <p className="auth-message">{state.message}</p> : null}

        <button type="submit" className="join-primary" disabled={pending}>
          {pending ? "saving…" : "save →"}
        </button>
      </form>

      {/* Your number and the day you joined: facts, not fields. */}
      <dl className="me-facts">
        <div>
          <dt>member</dt>
          <dd>{memberNo ? `no. ${memberNo}` : "not numbered yet"}</dd>
        </div>
        <div>
          <dt>one of us since</dt>
          <dd>{since || "—"}</dd>
        </div>
      </dl>

      <section className="me-email">
        <p className="me-fact">
          You sign in with <strong>{email}</strong>.
        </p>

        {changing ? (
          <form action={mailAction} className="auth-form">
            <label>
              <span>your new address</span>
              <input name="email" type="email" placeholder="you@somewhere-else.com" required />
            </label>

            {mail.error ? <p className="auth-error">{mail.error}</p> : null}
            {mail.message ? <p className="auth-message">{mail.message}</p> : null}

            <div className="me-email-do">
              <button type="submit" className="join-primary" disabled={mailPending}>
                {mailPending ? "sending…" : "send the link →"}
              </button>
              <button type="button" className="text-button" onClick={() => setChanging(false)}>
                never mind
              </button>
            </div>
            <p className="me-fact">
              Nothing moves until you open the link in the new inbox. Until then this address
              still works.
            </p>
          </form>
        ) : (
          <button type="button" className="text-button" onClick={() => setChanging(true)}>
            use a different address
          </button>
        )}
      </section>
    </>
  );
}
