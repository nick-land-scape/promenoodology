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
  Haptics?: { impact: (options: { style: string }) => Promise<void> };
  StatusBar?: { setStyle: (options: { style: string }) => Promise<void> };
  SplashScreen?: { hide: (options?: { fadeOutDuration?: number }) => Promise<void> };
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
    return { ok: false, why: said };
  }
}
