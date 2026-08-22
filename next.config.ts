import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * How long the browser may keep a page it has already fetched.
   *
   * This is the difference between an app and a website in a wrapper. Every screen
   * in /app is dynamic — it is about *you*, so it cannot be cached for everybody —
   * and Next keeps dynamic pages in the client router for exactly zero seconds by
   * default. So switching tabs asked the server again, every time, over whatever
   * signal the phone had: three taps between Home and What's on was three round
   * trips for three pages that had not changed.
   *
   * Thirty seconds. Long enough that moving around the app is instant, short
   * enough that anything anybody actually does — signing up for an evening, waving
   * back, posting — is seen straight away, because every one of those calls
   * revalidates the paths it touched and that clears this too.
   */
  experimental: {
    /* Five minutes, up from thirty seconds.
     *
     * What this buys is the second and every later visit to a tab: the router
     * still has the screen and shows it with no round trip and no skeleton at
     * all. Thirty seconds meant a member who read the news, looked at what's on
     * and came back was served three fetches for two screens that had not
     * changed. Anything anybody actually does — signing up, waving, posting —
     * revalidates the paths it touches, which clears this too, so the risk is not
     * staleness but a five-minute-old list of evenings that were published a
     * moment ago. */
    staleTimes: { dynamic: 300, static: 600 },
  },
  // The whole site is static — nothing here needs a server at request time.
  images: {
    // Photos are shown small in grids and at most ~1200px on hover / full view.
    imageSizes: [96, 160, 240, 320, 480],
    deviceSizes: [640, 828, 1080, 1200, 1920],
    formats: ["image/webp"],
    // Photographs live in Supabase storage once the content has been imported.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    // The photographs never change once they are in the repository, so an
    // optimised copy can be kept for a year — by the CDN and by the browser.
    // Adding a new photo means a new file name, so nothing goes stale.
    minimumCacheTTL: 31536000,
  },
  // The app.promenoodology.com subdomain is handled in middleware.ts, where
  // Next's own files and everything in /public can be left alone.

  // Keep links to the old hand-written pages working.
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      // Projects became stories.
      { source: "/projects", destination: "/stories", permanent: true },
      // The archive was at /resources until it was called what it is. Both of
      // these outlive the rename, because a link somebody kept is a promise.
      { source: "/resources", destination: "/archive", permanent: true },
      { source: "/resources/quotes", destination: "/archive", permanent: true },
      // "become a member" is gone; the newsletter is the way to keep in touch.
      { source: "/join", destination: "/newsletter", permanent: true },
      { source: "/projects/:slug", destination: "/stories/:slug", permanent: true },
      { source: "/munity", destination: "/community", permanent: true },
      { source: "/munity/index.html", destination: "/community", permanent: true },
      { source: "/munity/explained", destination: "/about", permanent: true },
      { source: "/munity/explained/index.html", destination: "/about", permanent: true },
      { source: "/munity/resources", destination: "/archive", permanent: true },
      // The app's second tab was "book", which promised a transaction that does
      // not exist. Anybody with it on a home screen still lands somewhere.
      { source: "/app/book", destination: "/app/events", permanent: true },
      { source: "/munity/resources/index.html", destination: "/archive", permanent: true },
    ];
  },
  /*
   * The written pages' short addresses used to be rewritten here, and it never
   * worked: the proxy turns /privacy into /en/privacy before Next looks at this
   * list, so /privacy, /imprint, /terms, /support and /help all answered 404.
   * They live in proxy.ts now, next to the language rewrite that was eating
   * them — see WRITTEN there.
   */
  async headers() {
    return [
      {
        // The video and the logo never change — let browsers keep them.
        source: "/:file(hero.mp4|hero-poster.jpg|logo.png|logo-mark.png)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Same for the photographs themselves.
        source: "/:folder(community|resources)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
