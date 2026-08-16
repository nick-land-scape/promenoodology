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

## Two things in one repository

- **The website** — promenoodology.com
- **The members' app** — everything under `/app`, made for a phone

To put the app on its own address, add `app.promenoodology.com` to the Vercel
project. `proxy.ts` sends that host to `/app`, so `app.promenoodology.com/book`
and `promenoodology.com/app/book` are the same page. The app is `noindex`: it is
for members, not for search engines.

On a phone the app can be added to the home screen and opens without browser
furniture (`public/manifest.webmanifest`).

**Two secret doors, both on the mark.** There is no sign-in link anywhere: knock
three times on the logo in the menu — three clicks inside a second and a half —
and the sign-in page opens. On the front page the same three knocks on the big
logo open the members' app. (Pressing Tab on the front page also reveals a way
in, so the app stays reachable with a keyboard or a screen reader.)

## Where things are

```
app/
  layout.tsx            html, metadata, the stylesheet
  (site)/               the website — shares the menu and contact details
    page.tsx            front page — video square, logo multiplied over it
    stories/            one page per story + the overview (was "projects")
    resources/          the archive: one wall, photographs and quotes mixed
    community/          the grid of names, photo follows the pointer
    newsletter/         a short letter when there is something to come to
    handbook/           how to run your own, and how to ask us for help
    donations/          the public bank account — every gift, one by one, no total
    about/              what we are about
  app/                  the members' app — its own shell and tab bar
    page.tsx            Home — what is coming up, latest news
    book/               Book — ask for a place, spaces, a whole evening
    connect/            Connect — the feed and who is around
    account/            Account — membership, bookings, settings
    app.css             the app's stylesheet
  globals.css           the website's stylesheet, one file on purpose
components/             nav, contact and the interactive bits
components/app/         the app's shell, tab bar, feed and booking form
content/stories/        one text file per story
content/handbook.md     the handbook
data/
  community.csv         who is in the community
  resources.csv         which photo belongs to which project
  events.csv            what is coming up (app)
  news.csv              latest news (app)
  quotes.csv            things people said
  donations.csv         the wall
  posts.csv             the connect feed (app)
lib/                    reads the files above at build time
public/
  hero.mp4              the front page video
  hero-poster.jpg       first frame, shown until the video is ready
  logo.png              the logo (front page)
  logo-mark.png         the logo, cropped tight (menu, favicon)
  community/            portraits
  resources/            story photos, ~1500px, named after their story
```

## Editing the content

No code needed for any of this. Commit the change and Vercel rebuilds the site.

### Add someone to the community

1. Put their photo in `public/community/` (e.g. `img036.jpg`).
2. Add a line to `data/community.csv`:
   `First,Last,Country,img036.jpg,,project`

The fifth column is optional: `orange`, `green` or `blue` colours the name. The
sixth is the story they were part of, and the community page can be sorted by
it.
A row without a photo still shows the name.

### Add photos to a project

1. Put the photos in `public/resources/`.
2. Add one line per photo to `data/resources.csv`:
   `filename.jpg,Photographer Name,2026,dfor500`

The last column is the project tag. A photo with an empty tag only shows up
under "all" in the archive.

### Add or edit a story

One file per story in `content/stories/`. The file name becomes the address
(`dinner-for-500.md` → `/stories/dinner-for-500`). A few `key: value` lines,
a blank line, then as much text as you like:

```
title: dinner for 500
tag: dfor500
order: 3
where: Sheffield, England
when: August 2023
with: EASA COMMONS

## Opportunity
Why it was worth doing.

## Strategy
What we actually did.
```

- `title` — shown as the heading, and as the filter button in the archive.
- `tag` — matches the last column in `data/resources.csv`; that is how the
  photos find their story.
- `order` — position in the stories list and in the prev/next navigation.
- `where`, `when`, `with` — optional; left out, they are simply not shown.
  Without `when`, the years come from the photos.
- A line starting with `##` opens a section. The section label is set small and
  in purple; the paragraphs under it are spread through the photographs.

The seven story texts are the final ones from `00_txt_draft4all.docx`. For
SOSETH REBOOT the original wording is used rather than the corrected version,
following the note in the document. `content/handbook.md` works the same way but
is still placeholder text.

### The wall and the quotes

`data/donations.csv` (the public bank account) is `who,when,amount,note` — leave `who` empty for somebody
who would rather stay anonymous, and the wall shows "someone" instead. There is
deliberately **no total anywhere on the page**: it is a list of people, not a
fundraising thermometer. When gifts start arriving automatically this file is
what the live feed replaces.

`data/quotes.csv` is `who,where,year,story,text` — `story` is a story tag, so a
quote can be filtered to the thing it was said about. Both files match names
against the community list to show a face.

### The app's content

Three more CSV files, same idea. In each of them the **last column may contain
commas** — everything after the last fixed column counts as one piece of text.

```
data/events.csv   date,time,title,place,spots,photo,note
data/news.csv     date,title,text
data/posts.csv    author,place,when,likes,replies,photo,text
```

Dates are ISO days (`2026-08-22`); the weekday is worked out for you. Photos are
file names from `public/resources/`, and may be left empty.

**Everything in the app is a placeholder.** Nothing is booked, posted or paid
for — the booking form says so on screen, and each screen has a line at the
bottom making it clear. There are no accounts and no server: it is the design,
working, waiting for a decision about what should sit behind it.

## The backend (Supabase)

The site still reads its content from the files in `/data` and `/content`. The
database is being put in behind it; until the keys are set, everything falls back
to the files, so nothing breaks either way.

**Setting it up**

1. Copy `.env.example` to `.env.local` and paste the two keys from
   Supabase → Project Settings → API Keys. Which variables also belong in Vercel
   is written next to each one.
2. Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor. It makes
   the tables, decides who may read and write what, and creates the `media`
   bucket for photographs.
3. `node scripts/import.mjs` moves everything currently in the files into the
   database, photographs included (`--no-media` to skip the uploads). It is safe
   to run twice: rows are keyed on something stable, so a second run updates.
4. Make yourself an admin: sign in once, then in the SQL editor
   `update profiles set role = 'admin' where id = '<your user id>';`

**Who may do what.** Row level security is on for every table. The public reads
anything marked published; only an admin writes. Members can read the feed and
write their own posts and bookings. Applications from the handbook page can be
written by anybody and read only by admins.

## Design notes

- Paper (`#fffcf6`) rather than screen white; purple, blue and pink as on the
  old site; Times for text, Helvetica for the menu. No web fonts to download.
- The front page logo is two copies multiplied over the video, so the white of
  the scan disappears and the ink doubles in density.
- Contact details run down the left edge, turned a quarter turn. They have
  their own lane (`--lane`) so they never cross the menu or the filters.
- Photos fade up as they scroll into view, using CSS scroll-driven animations —
  no JavaScript, and where the browser lacks them everything is simply there.
- The archive is a wall, not a grid: photographs keep the shape they arrived in,
  each item takes a slightly different width, a few sit at a slight angle, and
  the quotes are the pauses between them.
- A page's filters appear as a submenu under its own entry in the menu
  (`components/Submenu.tsx` puts them there). On a phone, where the menu is a bar
  along the bottom, they stay above the content instead.
- The about statement alternates between two voices, large and then quiet, and
  ends by asking you to join or to run your own.
- Everything stops moving if the system asks for reduced motion.
- The favicon is the two O's cut out of the middle of the logo. The whole
  wordmark turns to mush at 16 pixels; two loops still read. Regenerate the
  icons from `logo.png` with `crop=810:500:1155:1440` if the logo ever changes.
- While a photograph loads, its space is a grey block at the right proportions
  that breathes gently — every image goes through `components/Photo.tsx`.

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
