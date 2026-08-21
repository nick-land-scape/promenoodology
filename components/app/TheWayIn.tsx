"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { appleSheet, buzz, inTheApp, whichPhone } from "@/lib/native";
import { supabaseBrowser } from "@/lib/supabase/browser";

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
export default function TheWayIn({ back }: { back: string }) {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [step, setStep] = useState<"choose" | "code">("choose");
  const [joining, setJoining] = useState(false);
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<"" | "apple" | "code" | "in">("");
  const [trouble, setTrouble] = useState("");
  const [said, setSaid] = useState("");
  const codeField = useRef<HTMLInputElement>(null);

  const [onAPhone, setOnAPhone] = useState(false);
  useEffect(() => {
    setOnAPhone(inTheApp());
  }, []);

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
            ? "Sign in with Apple is not switched on yet."
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
      setTrouble("Your email address, please.");
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
      setTrouble(friendly(error.message, joining));
      return;
    }
    setSaid(`A code is on its way to ${address}.`);
    setStep("code");
    window.setTimeout(() => codeField.current?.focus(), 120);
  }

  async function withTheCode(code: string) {
    setTrouble("");
    setBusy("in");
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: "email",
    });
    if (error) {
      setBusy("");
      setDigits("");
      setTrouble(friendly(error.message, joining));
      return;
    }
    arrived();
  }

  async function withAPassword() {
    setTrouble("");
    setBusy("in");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setBusy("");
      setTrouble(error.message);
      return;
    }
    arrived();
  }

  return (
    <main className="doorway">
      <div className="doorway-mark">
        <Image src="/logo.png" alt="promeNOODology" width={1600} height={1600} sizes="60vmin" priority />
      </div>

      {step === "choose" ? (
        <>
          <h1>{joining ? "join us" : "welcome back"}</h1>
          <p className="doorway-said">
            {joining
              ? "There is no list to get on and nothing to pay. An address, one code, and you are one of us."
              : "No passwords here. A code to your inbox, or Apple."}
          </p>

          {/* Apple first on an Apple phone, because it is one press. */}
          {(onAPhone && whichPhone() === "ios") || !onAPhone ? (
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
              {busy === "apple" ? "asking Apple…" : joining ? "Sign up with Apple" : "Sign in with Apple"}
            </button>
          ) : null}

          <p className="doorway-or">or</p>

          <label className="doorway-field">
            <span>your email</span>
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
              placeholder="you@wherever.com"
            />
          </label>

          {showPassword ? (
            <label className="doorway-field">
              <span>password</span>
              <input
                type="password"
                autoComplete="current-password"
                enterKeyHint="go"
                value={password}
                onChange={(change) => setPassword(change.target.value)}
                onKeyDown={(key) => {
                  if (key.key === "Enter") void withAPassword();
                }}
                placeholder="for the review account"
              />
            </label>
          ) : null}

          <button
            type="button"
            className="doorway-go"
            onClick={() => void (showPassword ? withAPassword() : askForACode())}
            disabled={busy !== "" || !email.trim()}
          >
            {busy === "code"
              ? "sending…"
              : busy === "in"
                ? "letting you in…"
                : showPassword
                  ? "sign in"
                  : "send me a code"}
          </button>

          {trouble ? <p className="doorway-trouble">{trouble}</p> : null}

          <div className="doorway-feet">
            <button type="button" onClick={() => { setJoining(!joining); setTrouble(""); }}>
              {joining ? "I have been here before" : "I have no account yet"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPassword(!showPassword);
                setTrouble("");
              }}
            >
              {showPassword ? "use a code instead" : "sign in with a password"}
            </button>
          </div>
        </>
      ) : (
        <>
          <h1>check your inbox</h1>
          <p className="doorway-said">{said}</p>

          {/* One field, eight characters, big enough to read a code back from. */}
          <label className="doorway-field doorway-code">
            <span>the code</span>
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

          {busy === "in" ? <p className="doorway-said">letting you in…</p> : null}
          {trouble ? <p className="doorway-trouble">{trouble}</p> : null}

          <div className="doorway-feet">
            <button type="button" onClick={() => void askForACode()} disabled={busy !== ""}>
              send another
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("choose");
                setDigits("");
                setTrouble("");
              }}
            >
              use a different address
            </button>
          </div>
        </>
      )}
    </main>
  );
}

/** Supabase speaks in error codes; people do not. */
function friendly(message: string, joining: boolean) {
  const text = message.toLowerCase();
  if (text.includes("signups not allowed") || text.includes("not found")) {
    return joining
      ? "That did not work. Try again in a moment."
      : "There is no account with that address yet. Join us instead — it is one press below.";
  }
  if (text.includes("already registered")) return "There is already an account here. Sign in instead.";
  if (text.includes("rate limit") || text.includes("too many") || text.includes("security purposes")) {
    return "That is a lot of codes in a short time. Give it a minute.";
  }
  if (text.includes("expired") || text.includes("invalid") || text.includes("incorrect")) {
    return "That code is wrong, or it has been used already. Ask for a new one.";
  }
  return message;
}
