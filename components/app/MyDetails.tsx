"use client";

import { useRef, useState, useTransition } from "react";
import { saveProfile, setMyPhoto } from "@/app/(site)/account/actions";
import { ACCEPTS, uploadPhoto } from "@/lib/admin/upload";
import { mediaUrl } from "@/lib/supabase/config";
import Photo from "../Photo";

type Props = {
  /** The login, which is also the only folder in the bucket you may write to. */
  userId: string;
  name: string;
  country: string;
  photo: string | null;
  listed: boolean;
};

/**
 * Your details, on a screen of their own.
 *
 * They used to sit under everything else on the account screen, which made that
 * screen a card, a list of what you had said yes to, and then a form — three
 * different kinds of thing stacked up with nothing between them. A settings
 * screen you go *into* is the ordinary shape for this, and it means the form can
 * have the whole width and no box around it.
 *
 * The actions are the website's own, so there is one set of rules about what a
 * member may change about themselves rather than two that drift.
 */
export default function MyDetails({ userId, name, country, photo, listed }: Props) {
  const [portrait, setPortrait] = useState(photo);
  const [busy, setBusy] = useState(false);
  const [trouble, setTrouble] = useState("");
  const [said, setSaid] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  async function take(chosen: File | null) {
    if (!chosen) return;
    setTrouble("");
    setBusy(true);
    try {
      const uploaded = await uploadPhoto(chosen, `profiles/${userId}`);
      const answer = await setMyPhoto(uploaded.path);
      if (answer.error) setTrouble(answer.error);
      else setPortrait(uploaded.path);
    } catch (error) {
      setTrouble(error instanceof Error ? error.message : "That picture did not go up.");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <>
      <div className="me-strip">
        {/* Tap the picture to change the picture. */}
        <input
          ref={file}
          type="file"
          accept={ACCEPTS}
          hidden
          onChange={(change) => void take(change.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="me-face"
          onClick={() => file.current?.click()}
          disabled={busy}
          aria-label={portrait ? "Choose another portrait" : "Add a portrait"}
        >
          {portrait ? (
            <Photo src={mediaUrl(portrait)} alt="" width={600} height={800} sizes="120px" priority />
          ) : (
            <span className="me-face-none">add a portrait</span>
          )}
          <em>{busy ? "putting it up…" : portrait ? "change" : "add"}</em>
        </button>

        <div className="me-strip-said">
          <p className="app-note" style={{ margin: 0 }}>
            This is the photograph on the community page. It is shrunk on the way up, and the
            camera&rsquo;s notes are left behind.
          </p>
          {portrait ? (
            <button
              type="button"
              className="pill pill-small"
              disabled={busy || pending}
              onClick={() =>
                start(async () => {
                  const answer = await setMyPhoto(null);
                  if (answer.error) setTrouble(answer.error);
                  else setPortrait(null);
                })
              }
            >
              take it off
            </button>
          ) : null}
          {trouble ? <p className="app-error">{trouble}</p> : null}
        </div>
      </div>

      {/* No box around it: this is the whole screen, not a panel on one. */}
      <form
        className="field-list"
        action={(form) =>
          start(async () => {
            const answer = await saveProfile({}, form);
            setSaid(answer.error ?? answer.message ?? "");
          })
        }
      >
        <div className="field">
          <label htmlFor="me-name">your name</label>
          <input id="me-name" name="name" defaultValue={name} required />
        </div>
        <div className="field">
          <label htmlFor="me-country">where you are from</label>
          <input id="me-country" name="country" defaultValue={country} placeholder="optional" />
        </div>

        <label className="me-check">
          <input type="checkbox" name="listed" defaultChecked={listed} />
          <span>show me on the community page</span>
        </label>

        <div className="form-actions">
          <button type="submit" className="pill pill-solid pill-wide" disabled={pending}>
            {pending ? "saving…" : "save"}
          </button>
          {said ? <p className="app-note">{said}</p> : null}
        </div>
      </form>
    </>
  );
}
