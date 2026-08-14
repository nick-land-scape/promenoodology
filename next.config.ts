import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The whole site is static — nothing here needs a server at request time.
  images: {
    // Photos are shown small in grids and at most ~1200px on hover / full view.
    imageSizes: [96, 160, 240, 320, 480],
    deviceSizes: [640, 828, 1080, 1200, 1920],
    formats: ["image/webp"],
    // The photographs never change once they are in the repository, so an
    // optimised copy can be kept for a year — by the CDN and by the browser.
    // Adding a new photo means a new file name, so nothing goes stale.
    minimumCacheTTL: 31536000,
  },
  // app.promenoodology.com serves the members' app that lives under /app.
  // Add the subdomain to the project in Vercel and this takes care of the rest.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:path*",
          has: [{ type: "host", value: "app.promenoodology.com" }],
          destination: "/app/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  // Keep links to the old hand-written pages working.
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/munity", destination: "/community", permanent: true },
      { source: "/munity/index.html", destination: "/community", permanent: true },
      { source: "/munity/explained", destination: "/about", permanent: true },
      { source: "/munity/explained/index.html", destination: "/about", permanent: true },
      { source: "/munity/resources", destination: "/resources", permanent: true },
      { source: "/munity/resources/index.html", destination: "/resources", permanent: true },
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
