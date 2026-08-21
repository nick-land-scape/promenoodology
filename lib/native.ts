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
