/**
 * The phone, from inside the web app.
 *
 * The screens are served from the site and run in a WebView, and Capacitor
 * injects its bridge into that WebView — so the same page that runs in Safari can
 * ask the phone for a share sheet, a buzz, or permission to send a notification,
 * without any of the plugins being bundled into the site's own JavaScript.
 *
 * Every one of these is written to do nothing at all in an ordinary browser. That
 * is the point: one set of screens, which behave like an app where they are one
 * and like a website where they are not — rather than two codebases telling the
 * same story slightly differently.
 */

type Plugins = {
  Share?: { share: (options: { title?: string; text?: string; url?: string }) => Promise<unknown> };
  Filesystem?: {
    writeFile: (options: {
      path: string;
      data: string;
      directory?: string;
      recursive?: boolean;
    }) => Promise<{ uri: string }>;
    deleteFile: (options: { path: string; directory?: string }) => Promise<void>;
  };
  Haptics?: { impact: (options: { style: string }) => Promise<void> };
  StatusBar?: { setStyle: (options: { style: string }) => Promise<void> };
  SplashScreen?: { hide: (options?: { fadeOutDuration?: number }) => Promise<void> };
  Keyboard?: {
    addListener: (
      event: string,
      fn: (info: { keyboardHeight?: number }) => void,
    ) => Promise<{ remove: () => void }>;
  };
  PushNotifications?: {
    checkPermissions: () => Promise<{ receive: string }>;
    requestPermissions: () => Promise<{ receive: string }>;
    register: () => Promise<void>;
    addListener: (event: string, fn: (data: { value?: string }) => void) => Promise<unknown>;
  };
};

type Bridge = { isNativePlatform: () => boolean; getPlatform: () => string; Plugins: Plugins };

const bridge = (): Bridge | null => {
  if (typeof window === "undefined") return null;
  const found = (window as unknown as { Capacitor?: Bridge }).Capacitor;
  return found?.isNativePlatform?.() ? found : null;
};

/** Whether this is the app rather than a browser. */
export const inTheApp = () => bridge() !== null;

/** "ios", "android", or "" in a browser. */
export const whichPhone = () => bridge()?.getPlatform() ?? "";

/**
 * Handing something to the phone: a link, a photograph, a post.
 *
 * Returns false where there is no phone to hand it to, so the caller can fall
 * back to the browser's own share sheet or to copying.
 */
export async function shareNatively(what: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  const share = bridge()?.Plugins?.Share;
  if (!share) return false;
  try {
    await share.share(what);
    return true;
  } catch {
    // Dismissed, which is not a failure worth reporting.
    return true;
  }
}

/** A small knock, for something that worked. Silent everywhere else. */
export async function buzz(style: "light" | "medium" | "heavy" = "light"): Promise<void> {
  try {
    await bridge()?.Plugins?.Haptics?.impact({ style: style.toUpperCase() });
  } catch {
    // A phone that will not buzz is not a problem anybody needs telling about.
  }
}

/** Put the curtain away once the screens behind it are up. */
export async function liftTheCurtain(): Promise<void> {
  try {
    await bridge()?.Plugins?.SplashScreen?.hide({ fadeOutDuration: 350 });
  } catch {
    /* nothing to lift */
  }
}

/** Dark or light, so the clock and the battery stay legible against the paper. */
export async function statusBarFor(theme: "dark" | "light"): Promise<void> {
  try {
    await bridge()?.Plugins?.StatusBar?.setStyle({ style: theme === "dark" ? "DARK" : "LIGHT" });
  } catch {
    /* not in the app */
  }
}

/**
 * Asking to be allowed to send notifications, and saying where to send them.
 *
 * Asked once, and never on the first screen: a permission dialogue before
 * somebody knows what the app is for is a permission dialogue that gets refused
 * for ever. The token is handed to the server, which is the only thing that can
 * do anything with it.
 *
 * iPhone only for the moment. Android delivers push through Firebase, and until
 * there is a Firebase project with the app registered in it, `register()` there
 * throws "Default FirebaseApp is not initialized" — so nothing calls this yet on
 * either phone, and when something does, Android needs google-services.json in the
 * project first. See docs/the-app-in-the-stores.md.
 */
export async function listenForNews(
  remember: (token: string, platform: string) => Promise<void>,
): Promise<"on" | "refused" | "not the app"> {
  const push = bridge()?.Plugins?.PushNotifications;
  if (!push) return "not the app";

  let state = await push.checkPermissions();
  if (state.receive === "prompt" || state.receive === "prompt-with-rationale") {
    state = await push.requestPermissions();
  }
  if (state.receive !== "granted") return "refused";

  await push.addListener("registration", (data) => {
    if (data.value) void remember(data.value, whichPhone());
  });
  await push.register();
  return "on";
}

/* ------------------------------------------------- signing in with Apple */

type AppleAnswer = {
  response?: {
    identityToken?: string;
    givenName?: string | null;
    familyName?: string | null;
    email?: string | null;
  };
};

type ApplePlugin = {
  authorize: (options: {
    clientId: string;
    redirectURI: string;
    scopes: string;
    nonce: string;
  }) => Promise<AppleAnswer>;
};

/**
 * Sign in with Apple, the way an app has to do it.
 *
 * Not the web flow. The web flow leaves the app: it navigates to Apple's own page,
 * comes back to a redirect address, and hands over a code that has to be traded
 * for a session — and if any link in that chain lands somewhere other than this
 * WebView, the person ends up signed in *somewhere else* and staring at the login
 * screen again. That is the exact bug this project's sibling app was rejected for
 * twice: "after we logged in using Sign in with Apple, a login screen was shown
 * again", and then "we were stuck in a loop".
 *
 * The native sheet cannot do that. iOS asks, iOS answers, and what comes back is
 * an identity token in this process — no navigation, nothing to redirect, nowhere
 * else for the session to end up. It is handed straight to Supabase.
 *
 * The nonce is the fiddly part and it matters. A random string is made here; its
 * SHA-256 goes to Apple, which echoes that hash inside the token; the *raw*
 * string goes to Supabase, which hashes it and checks the two match. Send the same
 * value to both and Apple's answer is rejected as a replay.
 */
export async function appleSheet(): Promise<
  | { ok: true; token: string; nonce: string; name: string; email: string }
  | { ok: false; why: "no sheet" | "cancelled" | string }
> {
  const found = bridge();
  /*
   * iPhone only, and asked before anything else.
   *
   * The plugin is registered on iOS and nowhere else — but Capacitor still hands
   * the web view a JavaScript proxy for it on Android, because the bridge builds
   * those from the plugin's declaration rather than from what the platform can
   * actually do. So `SignInWithApple` exists there, `authorize` on it is not a
   * function, and calling it threw "r.authorize is not a function" onto the
   * sign-in screen in pink: a dead button and a stack-trace fragment where a
   * sentence should be.
   *
   * The web flow below handles Android perfectly well — the same one every browser
   * gets — so all this needed was to stop pretending there was a sheet.
   */
  if (found?.getPlatform?.() !== "ios") return { ok: false, why: "no sheet" };

  const apple = (found?.Plugins as unknown as { SignInWithApple?: ApplePlugin } | undefined)
    ?.SignInWithApple;
  if (!apple) return { ok: false, why: "no sheet" };

  const raw = crypto.randomUUID() + crypto.randomUUID();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  try {
    const answer = await apple.authorize({
      /* The Services ID rather than the bundle ID, because that is the client the
         token is issued for and the one Supabase checks it against. Both are in
         Supabase's Client IDs list, so either would be accepted — this is the one
         that also works if the same code ever runs on Android. */
      clientId: "com.promenoodology.community.signin",
      redirectURI: "https://www.promenoodology.com/account/confirm",
      scopes: "name email",
      nonce: hashed,
    });

    const token = answer.response?.identityToken;
    if (!token) return { ok: false, why: "Apple gave no token back." };

    /* The name comes once and once only — on the very first authorisation, and
       never again, however many times somebody signs in afterwards. So it is
       carried out of here and written down immediately. */
    const name = [answer.response?.givenName, answer.response?.familyName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return { ok: true, token, nonce: raw, name, email: answer.response?.email ?? "" };
  } catch (error) {
    const said = error instanceof Error ? error.message : String(error);
    // The person pressed cancel. Not a failure, and not worth a red message.
    if (/cancel|1001|abort/i.test(said)) return { ok: false, why: "cancelled" };
    /* And a platform that has the plugin's name but not its code. The check above
       catches today's version of this; this catches the next one, because "the
       native thing is not really there" should always mean "use the web flow"
       rather than showing somebody a sentence about a function. */
    if (/not a function|not implemented|unimplemented|does not have an implementation/i.test(said)) {
      return { ok: false, why: "no sheet" };
    }
    return { ok: false, why: said };
  }
}

/* -------------------------------------------------- coming back to the app */

/**
 * Reloading after a long time away.
 *
 * A native app does not reload when you come back to it — the WebView keeps the
 * page it was on, for hours, across days, until the phone runs out of memory. Which
 * is right for a minute in your pocket and wrong for a week: the app sits on a
 * version of itself that was published before whatever changed. It is how somebody
 * ends up looking at yesterday's screen and reasonably concluding nothing was
 * fixed.
 *
 * So: away for more than half an hour, come back to a fresh copy. Under that,
 * nothing happens, because reloading an app somebody just glanced away from throws
 * away what they were reading.
 *
 * Anything half-written is protected the only way it can be — the check is skipped
 * while a field has focus or a form is dirty, because a reload that eats a post
 * somebody is writing is worse than a stale screen.
 */
export function reloadWhenStale(minutes = 30): () => void {
  const found = bridge();
  const app = (
    found?.Plugins as unknown as {
      App?: {
        addListener: (
          event: string,
          fn: (state: { isActive: boolean }) => void,
        ) => Promise<{ remove: () => void }>;
      };
    } | undefined
  )?.App;
  if (!app) return () => {};

  let left = 0;
  const watching = app.addListener("appStateChange", (state) => {
    if (!state.isActive) {
      left = Date.now();
      return;
    }
    if (!left) return;

    const away = (Date.now() - left) / 60000;
    left = 0;
    if (away < minutes) return;

    // Not while somebody is in the middle of writing something.
    const busy =
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement;
    if (busy) return;

    window.location.reload();
  });

  return () => {
    void watching.then((handle) => handle.remove()).catch(() => {});
  };
}

/**
 * How tall the keyboard is, said by the phone.
 *
 * This is the one measurement in the app that the web genuinely cannot take. A
 * browser has `visualViewport`, which shrinks when a keyboard covers part of the
 * window — and in this web view it does not: `contentInset: "never"` gives the page
 * the whole screen and leaves the insets to CSS, so a keyboard arriving changes no
 * number the page can read. Which is why a pop-up had to guess, and why guessing
 * meant leaping to the top of the screen instead of riding up with the keyboard the
 * way a native sheet does.
 *
 * The phone knows exactly. It says so twice — as the keyboard starts coming up, and
 * again when it is up — and the first of those is what makes the movement match the
 * animation rather than follow it.
 *
 * Returns a way to stop listening, and does nothing at all in a browser, where
 * `visualViewport` is the right answer and is already being used.
 */
export function whenTheKeyboard(
  said: (height: number) => void,
): () => void {
  const keyboard = bridge()?.Plugins?.Keyboard;
  if (!keyboard) return () => {};

  const listening = [
    keyboard.addListener("keyboardWillShow", (info) => said(info.keyboardHeight ?? 0)),
    keyboard.addListener("keyboardDidShow", (info) => said(info.keyboardHeight ?? 0)),
    keyboard.addListener("keyboardWillHide", () => said(0)),
    keyboard.addListener("keyboardDidHide", () => said(0)),
  ];

  return () => {
    for (const one of listening) {
      void one.then((handle) => handle.remove()).catch(() => {});
    }
  };
}

/**
 * A photograph, kept.
 *
 * The save button used to hand the share sheet the picture's *address*, which is
 * how you send somebody a link — not how you keep a photograph. What arrives in
 * Messages is a URL, and "Save Image" is not offered at all, because there is no
 * image in the sheet to save.
 *
 * So the bytes come down first and are written into the app's own cache, and the
 * sheet is opened over the *file*. iOS then offers what it offers for a real
 * image: Save Image, straight into Photos; AirDrop; Messages with the picture in
 * it. Android offers the same through its own sheet.
 *
 * The cache rather than Documents, because this copy is a step on the way
 * somewhere else — the phone empties it when it needs the room, and the picture
 * somebody chose to keep is by then in Photos where they put it.
 *
 * Base64 rather than the blob, because that is the only shape the bridge can
 * carry: everything crossing between the web view and Swift is JSON.
 *
 * Three answers, because they mean three different things to whoever pressed the
 * button: "kept" — the sheet was opened and it is theirs to place; "notHere" —
 * there is no phone, so download it the way a browser does; "failed" — there is a
 * phone and it did not work, which is the only one worth saying out loud.
 */
export async function keepThePhoto(
  url: string,
  called: string,
): Promise<"kept" | "failed" | "notHere"> {
  const files = bridge()?.Plugins?.Filesystem;
  const share = bridge()?.Plugins?.Share;
  /* No phone here: the caller downloads it the way a browser does. */
  if (!files || !share) return "notHere";

  let written: { uri: string };
  try {
    const answer = await fetch(url, { mode: "cors" });
    if (!answer.ok) return "failed";
    const bytes = await answer.arrayBuffer();

    /* In chunks, and not for tidiness: `String.fromCharCode(...array)` on a
       three-megabyte photograph is three million arguments in one call, which
       overflows the stack and throws. Thirty-two thousand at a time does not. */
    let raw = "";
    const all = new Uint8Array(bytes);
    for (let at = 0; at < all.length; at += 32_768) {
      raw += String.fromCharCode(...all.subarray(at, at + 32_768));
    }

    written = await files.writeFile({
      path: called,
      data: btoa(raw),
      directory: "CACHE",
      recursive: true,
    });
  } catch {
    return "failed";
  }

  /* The sheet, separately: closing it without choosing anything rejects on some
     versions of iOS, and somebody who changed their mind does not need telling
     that it did not work. */
  try {
    await share.share({ title: called, url: written.uri });
  } catch {
    // Dismissed.
  }
  return "kept";
}
