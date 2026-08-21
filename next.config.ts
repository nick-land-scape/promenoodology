import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // The three written pages are one route with three addresses: /privacy is a
  // better thing to link to from an app store form than /legal/privacy, and a
  // rewrite keeps the address the reader sees.
  async rewrites() {
    return [
      { source: "/privacy", destination: "/legal/privacy" },
      { source: "/imprint", destination: "/legal/imprint" },
      { source: "/terms", destination: "/legal/terms" },
    ];
  },
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
