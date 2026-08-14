# promeNOODology

The website for promeNOODology — a simple social club, open to everyone.

Built with [Next.js](https://nextjs.org) (App Router, TypeScript) and deployed on
Vercel. Every page is static: nothing is fetched or computed while somebody is
looking at it.

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Where things are

```
app/
  page.tsx              front page — video square, logo multiplied over it
  projects/             one page per project + the overview
  resources/            the whole photo archive, filtered
  community/            the grid of names, photo follows the pointer
  about/                what we are about
  globals.css           the whole stylesheet, one file on purpose
components/             nav, contact, and the four interactive bits
content/projects/       one text file per project
data/
  community.csv         who is in the community
  resources.csv         which photo belongs to which project
lib/                    reads the files above at build time
public/
  hero.mp4              the front page video
  hero-poster.jpg       first frame, shown until the video is ready
  logo.png              the logo (front page)
  logo-mark.png         the logo, cropped tight (menu, favicon)
  community/            portraits
  resources/            project photos
```

## Editing the content

No code needed for any of this. Commit the change and Vercel rebuilds the site.

### Add someone to the community

1. Put their photo in `public/community/` (e.g. `img036.jpg`).
2. Add a line to `data/community.csv`:
   `First,Last,Country,img036.jpg,`

The last column is optional: `orange`, `green` or `blue` colours the name.
A row without a photo still shows the name.

### Add photos to a project

1. Put the photos in `public/resources/`.
2. Add one line per photo to `data/resources.csv`:
   `filename.jpg,Photographer Name,2026,dfor500`

The last column is the project tag. A photo with an empty tag only shows up
under "all" in the archive.

### Add or edit a project

One file per project in `content/projects/`. The file name becomes the address
(`dinner-for-500.md` → `/projects/dinner-for-500`). A few `key: value` lines,
a blank line, then as much text as you like:

```
title: dinner for 500
tag: dfor500
order: 2
where: Genalguacil, Spain

We cooked for as long as people kept arriving.

Every paragraph is separated by a blank line.
```

- `title` — shown as the heading, and as the filter button in the archive.
- `tag` — matches the last column in `data/resources.csv`; that is how the
  photos find their project.
- `order` — position in the projects list and in the prev/next navigation.
- `where` — optional. Leave it out and it is simply not shown.
- `when` — optional; without it the years come from the photos.

**The four project files currently have no text.** The pages work without it
(title, year, photo credits, photos), but they are the place for your own
words — nothing was invented for you.

## Design notes

- Paper (`#fffcf6`) rather than screen white; purple, blue and pink as on the
  old site; Times for text, Helvetica for the menu. No web fonts to download.
- The front page logo is two copies multiplied over the video, so the white of
  the scan disappears and the ink doubles in density.
- Contact details run down the left edge, turned a quarter turn. They have
  their own lane (`--lane`) so they never cross the menu or the filters.
- Photos fade up as they scroll into view, using CSS scroll-driven animations —
  no JavaScript, and where the browser lacks them everything is simply there.
- Everything stops moving if the system asks for reduced motion.

## Notes on the optimisations

Compared with the original hand-written site:

- The background video is re-encoded and its unused audio track stripped:
  2.2 MB → 442 KB. A poster frame shows instantly while it loads.
- Photos are served through Next.js image optimisation as WebP, resized for the
  spot they appear in, and lazily loaded further down the page.
- The CSVs and project files are read at build time instead of being fetched
  and parsed in the browser, so the content is in the HTML on first paint.
- Names in the community grid and photos in the gallery can be reached with a
  keyboard; the photo overlay closes with Escape and steps with arrow keys.
- Titles, descriptions, a social preview image, `sitemap.xml` and `robots.txt`
  are in place. The old `/munity/...` URLs redirect to the new pages.
