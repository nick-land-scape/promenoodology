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
    /* Never, and this is the fix for "the bar gets taller at the bottom".
     *
     * `always` tells WKWebView to add the safe areas to its scroll view as a
     * content *inset* — so the page is laid out inside a shorter viewport and the
     * scroll view lets you scroll into the inset at the end, which is the band of
     * paper that appears under the tab bar when you reach the bottom. Worse, this
     * app also handles the same insets itself in CSS, with `viewport-fit=cover`
     * and `env(safe-area-inset-*)`: two mechanisms accounting for one strip of
     * glass, each unaware of the other.
     *
     * `never` gives the page the whole screen and leaves the insets to the CSS,
     * which is where every rule about them in this app already lives. */
    contentInset: "never",
    /* A link opened from an email or a message goes to the app rather than to
       Safari; the two-way half of that is the apple-app-site-association file. */
    limitsNavigationsToAppBoundDomains: false,
  },

  android: {
    backgroundColor: "#fffcf6",
  },

  plugins: {
    SplashScreen: {
      /* It holds the mark until the web curtain is drawing the same mark.
       *
       * The two pictures are identical — paper, ink, size, position (see
       * scripts/launch-screen.py) — so this is not a splash screen waiting to be
       * replaced by another one, it is the first second of one opening, held by
       * the only thing that can draw before the app is running. The curtain lifts
       * it as soon as it is up; this number is what happens if that call never
       * arrives, and 1.6s is longer than the page takes on any real line. */
      launchAutoHide: true,
      launchShowDuration: 1600,
      launchFadeOutDuration: 220,
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
