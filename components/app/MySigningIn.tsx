"use client";

import { useEffect, useState, useTransition } from "react";
import { changeMyEmail } from "@/app/(site)/account/actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * How you get in, on a screen of its own: the address a code goes to, and Apple.
 *
 * Both halves of "how you sign in" in one place, because they are one question —
 * and because the account screen was becoming a form with a card on top of it.
 */
export default function MySigningIn({ email }: { email: string }) {
  return (
    <>
      <TheAddress email={email} />
      <Apple />
    </>
  );
}

/** The address you sign in with, and how to move it. */
function TheAddress({ email }: { email: string }) {
  const [changing, setChanging] = useState(false);
  const [said, setSaid] = useState<{ words: string; bad?: boolean } | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="app-section">
      <div className="app-section-head">
        <h2 className="app-h2">how you sign in</h2>
      </div>
      <p className="post-text">
        A code to <strong>{email}</strong>. No password, so there is nothing to forget.
      </p>

      {changing ? (
        <form
          className="field-block"
          action={(form) =>
            start(async () => {
              const answer = await changeMyEmail({}, form);
              setSaid({ words: answer.error ?? answer.message ?? "", bad: Boolean(answer.error) });
              if (!answer.error) setChanging(false);
            })
          }
        >
          <div className="field">
            <label htmlFor="me-email">your new address</label>
            <input id="me-email" name="email" type="email" required placeholder="you@somewhere-else.com" />
          </div>
          <div className="form-actions">
            <button type="submit" className="pill pill-solid pill-wide" disabled={pending}>
              {pending ? "sending…" : "send the link"}
            </button>
            <button type="button" className="pill pill-small" onClick={() => setChanging(false)}>
              never mind
            </button>
            <p className="app-note" style={{ paddingTop: 10 }}>
              Nothing moves until you open the link in the new inbox. Until then this address still
              works.
            </p>
          </div>
        </form>
      ) : (
        <div className="form-actions">
          <button type="button" className="pill pill-small" onClick={() => setChanging(true)}>
            use a different address
          </button>
        </div>
      )}

      {said ? <p className={said.bad ? "app-error" : "app-note"}>{said.words}</p> : null}
    </section>
  );
}

/**
 * Sign in with Apple, joined to the account you already have.
 *
 * Two halves of the same thing, and they have to be kept apart. Signing in *with*
 * Apple from the door matches you to an account by the address Apple hands over —
 * which works, until somebody chooses "hide my email" and Apple hands over a
 * relay address that has never been near this club. Then there is nothing to
 * match on, and matching by anything other than a verified address is how you end
 * up in the wrong person's account.
 *
 * So the joining is done from in here, where we already know who you are: you are
 * signed in, you press this, and the Apple identity is added to the account you
 * are standing in. Whatever address Apple gives, it lands on the right person.
 */
function Apple() {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState<string | null>(null);
  const [only, setOnly] = useState(true);
  const [trouble, setTrouble] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stale = false;
    void (async () => {
      const { data, error } = await supabaseBrowser().auth.getUserIdentities();
      if (stale) return;
      if (error) {
        setTrouble("Could not read how this account signs in.");
        setReady(true);
        return;
      }
      const identities: { id: string; provider: string }[] = data?.identities ?? [];
      const apple = identities.find((one) => one.provider === "apple");
      setConnected(apple?.id ?? null);
      // Unlinking the only way in would lock somebody out of their own account.
      setOnly(identities.length < 2);
      setReady(true);
    })();
    return () => {
      stale = true;
    };
  }, []);

  async function connect() {
    setTrouble("");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.linkIdentity({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/account/confirm?next=/app/account` },
    });
    if (error) {
      setBusy(false);
      setTrouble(
        /manual linking|not enabled/i.test(error.message)
          ? "Joining accounts is switched off in Supabase — turn on manual linking and this will work."
          : error.message,
      );
    }
  }

  async function disconnect() {
    if (!connected) return;
    setTrouble("");
    setBusy(true);
    const { data } = await supabaseBrowser().auth.getUserIdentities();
    const apple = (data?.identities ?? []).find(
      (one: { provider: string }) => one.provider === "apple",
    );
    if (!apple) return;
    const { error } = await supabaseBrowser().auth.unlinkIdentity(apple);
    setBusy(false);
    if (error) setTrouble(error.message);
    else setConnected(null);
  }

  return (
    <section className="app-section">
      <div className="app-section-head">
        <h2 className="app-h2">Sign in with Apple</h2>
      </div>

      {!ready ? (
        <p className="app-note">reading…</p>
      ) : connected ? (
        <>
          <p className="post-text">
            Joined to this account. The button on the Apple sign-in screen brings you straight back
            here.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="pill pill-small"
              onClick={() => void disconnect()}
              disabled={busy || only}
              title={only ? "It is the only way into this account at the moment" : undefined}
            >
              {busy ? "…" : "disconnect it"}
            </button>
            {only ? (
              <p className="app-note" style={{ paddingTop: 8 }}>
                It is the only way into this account at the moment, so it cannot be taken off yet.
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <p className="post-text">
            Join it to this account and you can sign in with a face rather than a code. Your account
            stays the same one — this is added to it, not instead of it, so choosing
            &ldquo;hide my email&rdquo; on the Apple screen changes nothing here.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="pill pill-solid pill-wide"
              onClick={() => void connect()}
              disabled={busy}
            >
              {busy ? "asking Apple…" : " Sign in with Apple"}
            </button>
          </div>
        </>
      )}

      {trouble ? <p className="app-error">{trouble}</p> : null}
    </section>
  );
}
