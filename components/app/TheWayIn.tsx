"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { appleSheet, buzz } from "@/lib/native";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useSay } from "./Words";
import type { Said } from "@/lib/words";

const CODE_LENGTH = 8;

/**
 * The way into the app: one press, or an address and a code.
 *
 * Everything happens on this screen. No navigation between steps, because a
 * navigation on a phone is a white flash and a lost keyboard — the address turns
 * into a row of boxes in place, and the boxes turn into the app.
 *
 * Three ways in, in the order they are worth offering:
 *
 * **Apple**, through the native sheet where there is one. iOS asks, iOS answers,
 * and the token comes back in this process — no page to be redirected to, and
 * nowhere else for the session to end up. That last part is the whole point: the
 * web flow can hand somebody to Safari, sign them in *there*, and leave the app
 * showing the login screen. This project's sibling app was rejected twice for
 * exactly that, and the second time the reviewer called it a loop.
 *
 * **A code** to an address, which is how this club has always worked: there are no
 * passwords, so there is nothing to forget and nothing on any account worth
 * stealing.
 *
 * **A password**, for one account only — the one the app stores' review teams use.
 * They cannot read an inbox, and a review that cannot get in is a rejection. It is
 * behind a line of small text rather than hidden, because a door you cannot see is
 * a door somebody will eventually find and wonder about.
 */
/** How long before another code may be asked for. */
const AGAIN_AFTER = 60_000;

export default function TheWayIn({ back }: { back: string }) {
  const say = useSay();
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [step, setStep] = useState<"choose" | "code">("choose");
  const [joining, setJoining] = useState(false);
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState("");
  const [busy, setBusy] = useState<"" | "apple" | "code" | "in">("");
  const [trouble, setTrouble] = useState("");
  const [said, setSaid] = useState("");
  /* When the last code went out, and how long until another may be asked for.
   *
   * Not politeness: a resend button anybody can lean on is a way of sending
   * somebody thirty emails, and Supabase's own limiter answers that with an error
   * an hour long. Sixty seconds is longer than the wait for a code that is
   * actually coming and short enough that somebody whose code never arrived is
   * not stuck looking at a dead button. */
  const [sentAt, setSentAt] = useState(0);
  const [waitLeft, setWaitLeft] = useState(0);
  const codeField = useRef<HTMLInputElement>(null);

  /* The countdown, ticking only while there is one. A second's interval that runs
     for the life of the screen would be a second's work every second on a door
     nobody is standing at. */
  useEffect(() => {
    if (!sentAt) return;
    const tick = () => {
      const left = Math.ceil((sentAt + AGAIN_AFTER - Date.now()) / 1000);
      setWaitLeft(left > 0 ? left : 0);
    };
    tick();
    const clock = window.setInterval(tick, 1000);
    return () => window.clearInterval(clock);
  }, [sentAt]);

  /** In. Everything below ends here. */
  function arrived() {
    void buzz("medium");
    // replace, not push: the door should not be behind the app on the back stack.
    router.replace(back);
    router.refresh();
  }

  async function withApple() {
    setTrouble("");
    setBusy("apple");

    const sheet = await appleSheet();

    if (sheet.ok) {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: sheet.token,
        nonce: sheet.nonce,
      });
      if (error) {
        setBusy("");
        setTrouble(error.message);
        return;
      }

      /* Apple hands over a name exactly once — on the very first authorisation,
         and never again. So it is written down now or not at all. */
      if (sheet.name) {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await supabase
            .from("profiles")
            .update({ name: sheet.name })
            .eq("user_id", data.user.id)
            .eq("name", "");
        }
      }

      arrived();
      return;
    }

    if (sheet.why === "cancelled") {
      setBusy("");
      return;
    }

    /* No native sheet — a browser, or Android. The web flow, which comes back to
       /account/confirm and then in here. */
    if (sheet.why === "no sheet") {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/account/confirm?next=${encodeURIComponent(back)}`,
        },
      });
      if (error) {
        setBusy("");
        setTrouble(
          /provider is not enabled/i.test(error.message)
            ? say("door.appleNotOn")
            : error.message,
        );
      }
      return;
    }

    setBusy("");
    setTrouble(sheet.why);
  }

  async function askForACode() {
    const address = email.trim().toLowerCase();
    if (!address.includes("@")) {
      setTrouble(say("door.emailPlease"));
      return;
    }
    setTrouble("");
    setBusy("code");

    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: joining },
    });
    setBusy("");

    if (error) {
      /* An address nobody has an account for.
       *
       * The honest-looking answer — "there is no account with that address" —
       * hands anybody with a list of email addresses a way to find out which of
       * them belong to members of this club. That is worth something to somebody
       * and costs the person at the other end nothing to be told, so it is not
       * told: the code step opens exactly as it would have, saying a code is on
       * its way *if* that address is one of ours. Somebody who mistyped their own
       * address finds out by the code not arriving, which is the same way they
       * would find out anyway.
       *
       * Only when joining is the truth said out loud, because "that address is
       * already a member" is an answer about the address you are holding rather
       * than about somebody else's. */
      if (!joining && /signups not allowed|not found/i.test(error.message)) {
        setSaid(say("door.codeOnItsWay").replace("{email}", address));
        setStep("code");
        setSentAt(Date.now());
        window.setTimeout(() => codeField.current?.focus(), 120);
        return;
      }

      /* Too many codes in an hour, and Supabase's own sender is stingy about it.
       *
       * Going no further would be wrong twice over: anybody who already has a code
       * from five minutes ago can still use it, and the review account's standing
       * code does not depend on an email having been sent at all. So the code step
       * opens anyway and says what happened. */
      if (/rate limit|too many|security purposes|after \d+ seconds/i.test(error.message)) {
        setSaid(say("door.noNewCode"));
        setStep("code");
        setSentAt(Date.now());
        window.setTimeout(() => codeField.current?.focus(), 120);
        return;
      }
      setTrouble(friendly(error.message, joining, say));
      return;
    }
    setSaid(say("door.codeOnItsWay").replace("{email}", address));
    setStep("code");
    setSentAt(Date.now());
    window.setTimeout(() => codeField.current?.focus(), 120);
  }

  async function withTheCode(code: string) {
    setTrouble("");
    setBusy("in");
    const address = email.trim().toLowerCase();

    const { error } = await supabase.auth.verifyOtp({ email: address, token: code, type: "email" });
    if (!error) {
      arrived();
      return;
    }

    /* Refused. One more thing to try before saying no: the standing code.
     *
     * Both app stores have to sign in to review an app with a login on it, and
     * this login has no passwords — a code goes to an inbox and a reviewer has no
     * inbox here. Apple rejected this project's sibling app for exactly that and
     * offered three ways out; this is the second of them, a code that does not
     * change, for one account.
     *
     * It is asked *after* the ordinary code has failed, so it costs nobody
     * anything and there is nothing on this screen to find: no extra field, no
     * hidden gesture, no "sign in as reviewer" for somebody to wonder about. The
     * function it asks answers the same way to every wrong guess, slowly.
     *
     * What comes back is an ordinary one-time link, traded in the ordinary way. */
    const { data, error: refused } = await supabase.functions.invoke("review-sign-in", {
      method: "POST",
      body: { email: address, code },
    });
    const standing = data as { ok?: boolean; token?: string } | null;

    if (!refused && standing?.ok && standing.token) {
      const { error: stillNo } = await supabase.auth.verifyOtp({
        token_hash: standing.token,
        type: "magiclink",
      });
      if (!stillNo) {
        arrived();
        return;
      }
    }

    setBusy("");
    setDigits("");
    setTrouble(friendly(error.message, joining, say));
  }

  return (
    <main className="doorway">
      <div className="doorway-mark">
        <Image src="/logo.png" alt="promeNOODology" width={1600} height={1600} sizes="60vmin" priority />
      </div>

      {step === "choose" ? (
        <>
          <h1>{say(joining ? "door.joinUs" : "door.welcomeBack")}</h1>

          <label className="doorway-field">
            <span>{say("door.yourEmail")}</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="send"
              value={email}
              onChange={(change) => setEmail(change.target.value)}
              onKeyDown={(key) => {
                if (key.key === "Enter") void askForACode();
              }}
              placeholder={say("door.emailEg")}
            />
          </label>

          <button
            type="button"
            className="doorway-go"
            onClick={() => void askForACode()}
            disabled={busy !== "" || !email.trim()}
          >
            {busy === "code"
              ? say("door.sending")
              : busy === "in"
                ? say("door.lettingYouIn")
                : say("door.sendMeACode")}
          </button>

          {/* Apple under the code, not over it: the code is the way in for
              everybody, and this is the way in for whoever would rather not type
              an address. */}
          <p className="doorway-or">{say("door.or")}</p>

          <button
            type="button"
            className="doorway-apple"
            onClick={() => void withApple()}
            disabled={busy !== ""}
          >
            <svg viewBox="0 0 18 22" aria-hidden="true">
              <path
                fill="currentColor"
                d="M14.9 11.6c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.7 1.1 8.9.8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7 1.4 0 1.8.8 3 .7 1.2 0 2-1.1 2.8-2.2.6-.9.9-1.7 1.1-2.2-2.3-.9-2.3-3.4-2.3-3.4zM12.4 4.3c.6-.8 1-1.9.9-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2.1-.5 2.8-1.3z"
              />
            </svg>
            {busy === "apple"
              ? say("door.askingApple")
              : say(joining ? "door.signUpApple" : "door.signInApple")}
          </button>

          {trouble ? <p className="doorway-trouble">{trouble}</p> : null}

          <div className="doorway-feet">
            <button type="button" onClick={() => { setJoining(!joining); setTrouble(""); }}>
              {say(joining ? "door.beenHereBefore" : "door.noAccountYet")}
            </button>
          </div>
        </>
      ) : (
        <>
          <h1>{say("door.checkInbox")}</h1>
          <p className="doorway-said">{said}</p>

          {/* One field, eight characters, big enough to read a code back from. */}
          <label className="doorway-field doorway-code">
            <span>{say("door.theCode")}</span>
            <input
              ref={codeField}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={digits}
              onChange={(change) => {
                const only = change.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
                setDigits(only);
                setTrouble("");
                // Eight in: go, without making anybody find a button.
                if (only.length === CODE_LENGTH) void withTheCode(only);
              }}
              placeholder="········"
            />
          </label>

          {busy === "in" ? <p className="doorway-said">{say("door.lettingYouIn")}</p> : null}
          {trouble ? <p className="doorway-trouble">{trouble}</p> : null}

          <div className="doorway-feet">
            <button
              type="button"
              onClick={() => void askForACode()}
              disabled={busy !== "" || waitLeft > 0}
            >
              {waitLeft > 0
                ? say("door.sendAnotherIn").replace("{n}", String(waitLeft))
                : say("door.sendAnother")}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("choose");
                setDigits("");
                setTrouble("");
              }}
            >
              {say("door.differentAddress")}
            </button>
          </div>
        </>
      )}
    </main>
  );
}

/**
 * Supabase speaks in error codes; people do not.
 *
 * The last line hands back whatever Supabase said, which is English whatever the
 * reader asked for. That is the right way round: an untranslated sentence
 * somebody can search for beats a translated guess at what went wrong.
 */
function friendly(message: string, joining: boolean, say: Said) {
  const text = message.toLowerCase();
  if (text.includes("signups not allowed") || text.includes("not found")) {
    return say(joining ? "door.tryAgainMoment" : "door.noAccountThere");
  }
  if (text.includes("already registered")) return say("door.alreadyAnAccount");
  if (text.includes("rate limit") || text.includes("too many") || text.includes("security purposes")) {
    return say("door.tooManyCodes");
  }
  if (text.includes("expired") || text.includes("invalid") || text.includes("incorrect")) {
    return say("door.codeWrong");
  }
  return message;
}
