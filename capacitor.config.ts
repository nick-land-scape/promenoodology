import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The app, as an app.
 *
 * What is native and what is not, said plainly, because this is the decision the
 * App Store's guideline 4.2 is about.
 *
 * The screens are the ones at /app on the site. They are not copied into the
 * bundle and they are not statically exported: they cannot be, and they should
 * not be — every one of them is a question to the database about *you* (what you
 * signed up for, who waved, what is yours to take down), so a copy in the bundle
 * would be a copy of somebody else's app. So the WebView loads them from the
 * server, and everything a phone can do that a browser cannot is native: the
 * launch screen, push notifications, the share sheet, haptics, the status bar,
 * and knowing when there is no signal.
 *
 * `webDir` is the small bundled shell in native/shell — one page, no network,
 * shown when there is no signal. Capacitor needs a local root even when it is
 * pointed at a server, and this is a better use for it than an empty folder.
 */
const config: CapacitorConfig = {
  // The App ID made in the Apple Developer account, with Sign in with Apple on it.
  appId: "com.promenoodology.community",
  // What the home screen calls it. The full name is for the store listing; a
  // springboard label has room for about eleven characters.
  appName: "promeNOOD",
  webDir: "native/shell",

  server: {
    /* The live app. iOS will not load http:// without an exception, and there is
       no reason to want one: everything here is behind a login. */
    url: "https://www.promenoodology.com/app",
    hostname: "www.promenoodology.com",
    androidScheme: "https",
    /* Which addresses stay inside the app. The website itself does — somebody
       following "the website" from their account should not be thrown out of the
       app to read a story. Anything else (Instagram, a mailto, a link somebody
       posted) opens in the phone's own browser, which is both the rule and the
       kinder behaviour. */
    allowNavigation: [
      "www.promenoodology.com",
      "promenoodology.com",
      "bqdtxqdmdtzffvkvrqpt.supabase.co",
      /* Apple's own sign-in page.
       *
       * The app signs in through the native sheet and never needs this — but if it
       * ever falls back to the web flow, this is the line that decides whether the
       * person comes back into the app or is handed to Safari and left looking at
       * the login screen again. That is the bug the sibling app was rejected for,
       * and it is one missing hostname wide. */
      "appleid.apple.com",
      "appleid.cdn-apple.com",
    ],
  },

  ios: {
    /* Paper, not white: the app's own background shows for an instant during
       rotation and while the WebView is coming up, and white flashes. */
    backgroundColor: "#fffcf6",
    contentInset: "always",
    /* A link opened from an email or a message goes to the app rather than to
       Safari; the two-way half of that is the apple-app-site-association file. */
    limitsNavigationsToAppBoundDomains: false,
  },

  android: {
    backgroundColor: "#fffcf6",
  },

  plugins: {
    SplashScreen: {
      /* It hides itself, and that is not the elegant option — it is the safe one.
       *
       * The elegant version holds the launch screen until the app's own film
       * curtain is drawn and hides it from JavaScript, so the join is invisible.
       * Tried, and the app opened on a launch screen that never left: the whole
       * thing had loaded and was running behind it, keyboard and all, waiting for
       * a call that never arrived. A native curtain that depends on web code to
       * lift is a white screen one deploy away, and no amount of elegance is
       * worth that. The JavaScript call is still there and still lifts it early
       * when it works; this is what happens when it does not.
       *
       * The gap it leaves is paper — the same paper the launch screen and the
       * curtain behind it are painted in, so there is nothing to see except the
       * mark going missing for a moment. Which it did: at a second and a fifth
       * the launch screen left before the WebView had painted anything at all,
       * and the app opened on an empty sheet. Two and a half seconds is longer
       * than the page takes on any real connection, and if it is ever slower
       * than that the curtain behind takes over with the film. */
      launchAutoHide: true,
      launchShowDuration: 2500,
      launchFadeOutDuration: 300,
      backgroundColor: "#fffcf6",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
