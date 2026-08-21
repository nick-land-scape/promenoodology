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
    allowNavigation: ["www.promenoodology.com", "promenoodology.com", "bqdtxqdmdtzffvkvrqpt.supabase.co"],
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
      /* Held until the WebView says it has something to show, then faded. The
         film-and-logo curtain inside the app takes over from here, so the two
         are the same picture and the join is invisible. */
      launchAutoHide: false,
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
