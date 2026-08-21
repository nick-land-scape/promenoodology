# What Vercel needs

Every environment variable this site reads, what happens without it, and where the
value comes from. Set them on the **Production** environment, and on Preview too
if you want branch deploys to behave the same.

```bash
# What is set now
npx vercel env ls production

# Adding one (it asks for the value, so it stays out of your shell history)
npx vercel env add REVIEW_CODE production
```

**Redeploy after changing any of these.** They are read when the site is built,
not when a page is served, so an unchanged deployment keeps the old values.

## The four the site cannot run without

| | where it comes from | without it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | the site falls back to the CSV files in `/data` and nothing in the back of the house saves |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page | as above |
| `NEXT_PUBLIC_SITE_URL` | `https://www.promenoodology.com` | the links in emails point at the wrong host |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → **service_role**, secret | the nightly bin purge cannot run, **leaving the club cannot delete the login**, and the app-review sign-in does not work |

That last one is the one to check first. It is a secret with no row-level security
over it: never put it in anything beginning `NEXT_PUBLIC_`, and never in the app.

## The three for the app in the stores

| | value | without it |
|---|---|---|
| `REVIEW_EMAIL` | the member you make for the reviewers, e.g. `review@promenoodology.com` | Apple and Google cannot sign in, and a submission is rejected on sight |
| `REVIEW_CODE` | **exactly eight digits**, chosen by you | as above. The code page keeps digits and throws everything else away, so letters could never be typed in |
| `CRON_SECRET` | any long random string; Vercel sends it to the nightly job | the bin never empties itself — it only empties when somebody presses the button in it |

`CRON_SECRET` is checked by `/api/purge`, which says exactly which of the two it
is missing when you open it. Right now it says the secret.

## The five for sending the newsletter's one email

Only the newsletter confirmation goes through these; everything about signing in
goes through Supabase's own SMTP settings, which are configured in Supabase rather
than here.

| | value |
|---|---|
| `SMTP_HOST` | `mail.infomaniak.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | the full mailbox address, e.g. `info@promenoodology.com` |
| `SMTP_PASS` | that mailbox's password |
| `SMTP_FROM` | optional; defaults to `SMTP_USER` |

Without them the newsletter form says plainly that it cannot send rather than
claiming an email is on its way.

## Two you probably never need

| | |
|---|---|
| `NEXT_PUBLIC_LAUNCH_AT` | moves the countdown on the holding page. `off` opens the site immediately. Leave unset. |
| `SUPABASE_ACCESS_TOKEN` | only for `scripts/email-templates.mjs`, run from your own machine. **Not** a Vercel variable. |

`VERCEL_PROJECT_PRODUCTION_URL` is set by Vercel itself — nothing to do.

## Apple's three, and why they are not here

`APPLE_TEAM_ID`, `APPLE_KEY_ID` and `APPLE_SERVICE_ID` appear in the code, but only
in `scripts/apple-secret.mjs`, which runs on your machine to make the client secret
Supabase asks for. They have promeNOODology's real values built in as defaults, so
there is nothing to set anywhere:

```bash
node scripts/apple-secret.mjs ~/Downloads/AuthKey_7327ATVLZ9.p8
```

The `.p8` never leaves your machine and is never printed. What it prints is the
token to paste into Supabase, and the date it expires — Apple will not accept one
that lasts longer than six months.
