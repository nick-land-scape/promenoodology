# promeNOODology

The website for promeNOODology — a simple social club, open to everyone.

Built with [Next.js](https://nextjs.org) (App Router, TypeScript) and deployed on Vercel.
Every page is static: nothing is fetched or computed while somebody is looking at it.

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Where things are

```
app/
  page.tsx            front page — full-screen video, gradient, logo on top
  community/          the grid of names, photo on hover
  resources/          photos, filtered by event and year
  about/              what we are about
  globals.css         the whole stylesheet, one file on purpose
components/           the three interactive bits
data/
  community.csv       who is in the community
  resources.csv       which photo belongs to which event
lib/data.ts           reads the CSVs at build time
public/
  hero.mp4            the background video
  hero-poster.jpg     first frame, shown until the video is ready
  logo.png            the logo (front page)
  logo-mark.png       the logo, cropped tight (menu, favicon)
  community/          portraits
  resources/          event photos
```

## Editing the content

No code needed for the usual updates.

**Add someone to the community**

1. Put their photo in `public/community/` (e.g. `img036.jpg`).
2. Add a line to `data/community.csv`:
   `First,Last,Country,img036.jpg,` — the last column is optional and can be
   `orange`, `green` or `blue` to colour the name.

A row without a photo still shows the name.

**Add event photos**

1. Put the photos in `public/resources/`.
2. Add one line per photo to `data/resources.csv`:
   `filename.jpg,Photographer Name,2026,eventtag`

The event tags are spelled out for the filter buttons in `lib/content.ts`
(`EVENT_LABELS`). Add a new tag there and a filter button appears by itself.
A photo with an empty tag only shows up under "all".

Commit the change and Vercel rebuilds the site.

## Notes on the optimisations

Compared with the original hand-written site:

- The background video is re-encoded and has its (unused) audio track stripped:
  2.2 MB → 442 KB. A poster frame shows instantly while it loads.
- Photos are served through Next.js image optimisation as WebP, resized for the
  spot they appear in, and lazily loaded further down the page.
- The CSVs are read at build time instead of being fetched and parsed in the
  browser, so names and photos are in the HTML on first paint.
- Names in the community grid and photos in the gallery can be reached with a
  keyboard, and the video is replaced by the still frame for anyone who asked
  the system for reduced motion.
- Titles, descriptions, a social preview image, `sitemap.xml` and `robots.txt`
  are in place. The old `/munity/...` URLs redirect to the new ones.
