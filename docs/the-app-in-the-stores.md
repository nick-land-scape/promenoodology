# Putting the app in the two stores

The app is at `/app` — four screens on a phone, behind a members' login. This is
what it takes to get that into the App Store and Play Store, what is done, and
what only somebody with the developer accounts can do.

Nothing here is speculative about the code: where it says "done", it is in the
repository and was exercised against the real database.

## What the app actually is now

It was a drawing. The account screen said "Nick Ulrich · NO 0028" to everybody,
the booking form told you what you *would* have asked for — "this is a
placeholder, no message has been sent" — and the two other tabs on it listed
rooms that do not exist. An app store rejects that, and it should: Apple's
guideline 4.2 is about exactly this.

Done, and verified against the database:

- **Every screen is a member's screen.** Not signed in, you are sent to the door
  with a note saying where you were going, so signing in puts you back on the
  screen you wanted.
- **Booking books.** One row per person per evening in `bookings`, which has been
  in the schema since the first migration with the policies to match — a member
  writes their own and reads nobody else's. Asking twice edits the first one.
  Dropping out deletes it. Verified: asked for two places with "a very large pot",
  found the row, saw "you are coming" on the home screen, dropped it, row gone.
- **An evening is the whole evening.** The back of the house has kept a last day,
  a finishing time, who it is with and how many places have been asked for for
  weeks; the app was dropping all four on the floor and showing "1 Aug" for
  something that runs to the third.
- **The account screen is you.** Your name, your portrait, your member number,
  the day you joined, what you have said yes to, and the settings — all of it read
  from your own row.
- **The settings use the website's own actions.** One set of rules about what a
  member may change about themselves, in one place, rather than a second
  implementation that drifts.

Still a drawing, and it needs deciding before or after the first submission:
**Connect**. The feed reads real posts but nothing can be posted from the app. A
tab that only ever shows other people's things is thin but not dishonest; a
"post" button that does nothing is a rejection. Either it gets writing, or it gets
folded into the home screen for the first release.

## Sign in with Apple

Done in the code, off until somebody switches it on.

- A **Sign in with Apple** button at the door, in Apple's own black-and-white,
  which is the one button on this site that is not allowed to be ours.
- **Connect it from your own settings**, which is the half that matters. Signing
  in *with* Apple matches you to an account by the address Apple hands over —
  fine, until somebody chooses "hide my email" and Apple hands over a relay
  address that has never been near this club. Then there is nothing to match on,
  and matching on anything other than a verified address is how somebody ends up
  in the wrong account. Joining it from inside your own settings, where we already
  know who you are, lands it on the right person whatever address Apple offers.
- **Disconnecting** is refused while it is the only way into the account, because
  that is locking somebody out of their own account with one button.

**Done in the Apple Developer account** (21 August 2026):

| | |
|---|---|
| Team ID | `K35XLVJJ3T` |
| App ID (bundle) | `com.promenoodology.community`, Sign in with Apple on |
| Services ID | `com.promenoodology.community.signin` |
| Key ID | `7327ATVLZ9`, the `.p8` downloaded |

**Left to do, in Supabase → Authentication → Providers → Apple:**

| field | what goes in it |
|---|---|
| Client IDs | `com.promenoodology.community.signin,com.promenoodology.community` |
| Secret Key (for OAuth) | the token printed by `node scripts/apple-secret.mjs ~/Downloads/AuthKey_7327ATVLZ9.p8` |
| Allow users without an email | **off** |
| Callback URL | already registered in the Services ID |

The two that catch everybody:

- **Client IDs is not the Team ID.** It is a list of the things that will ask Apple
  for a sign-in: the Services ID for the web, and the app's bundle ID for the
  phone. Both, comma separated, no spaces.
- **The secret is not the `.p8`.** Apple gives a private key; Supabase wants a
  signed token *made with* it, which is what the script prints. Pasting the key
  itself gets `invalid_client` from Apple and no explanation from anybody. The
  script also prints the day the token dies — Apple caps it at six months, and when
  it goes, signing in with Apple stops with no symptom but people not getting in.

Then **Supabase → Authentication → Advanced → manual linking: on**. Without it the
"connect it" button in the app's settings says so rather than failing quietly.

## The reviewers' way in

Both stores need to sign in to review an app with a login on it, and this login
has no password — a code goes to an inbox and a reviewer has no inbox here.

Done: one account whose code does not change, in `lib/review.ts`. It exists only
when `REVIEW_EMAIL` and `REVIEW_CODE` are both set, works for exactly one address
with exactly one code, mints an ordinary session the ordinary way (a one-time
link, made server-side and traded in immediately), and writes a line in the log
every time it is used.

Yours to do:

1. Make a member in **/admin → people** — `review@promenoodology.com` or
   similar. An ordinary member. **Never an admin**, and it should have a portrait
   and a booking or two so the reviewer sees a furnished app rather than an empty
   one.
2. Set `REVIEW_EMAIL` and `REVIEW_CODE` on Vercel. Eight digits, because the code
   page keeps digits and throws everything else away.
3. Put both in **App Store Connect → App Review Information** and in **Play
   Console → App access**, with one line of instructions: *type the address, press
   send, then type this code — no email will arrive and none is needed.*

## What is left for the App Store

**The shell.** The app is a website, and a website in a wrapper that only loads a
URL is what Apple's 4.2 is written to reject. Capacitor is the way in — the same
codebase, in a real native project — and it needs enough native to be an app
rather than a bookmark:

- the shell and the icons bundled in the app rather than fetched,
- push notifications for "there is an evening on Saturday",
- the camera and photo library for the portrait,
- Sign in with Apple through the native sheet rather than a web redirect,
- the share sheet from a story.

Not yet started. It is the next piece of work and the biggest.

**Everything App Store Connect asks for**, none of which is code: a 1024px icon
with no transparency and no rounded corners; screenshots for a 6.9" and a 6.5"
iPhone; a privacy policy at a public URL (`/about` is not one — this needs its own
page); the privacy questionnaire, which for this app is *name, email address,
photograph, and what you have booked, all tied to you and none of it for
advertising*; an age rating; a support URL; and a `PrivacyInfo.xcprivacy` in the
project declaring the reasons for the APIs it uses.

## What Android takes

Everything above about the shell is the same work — Capacitor builds both — and
then Google asks for a different pile:

- **A Play Console developer account**, $25 once. Note the identity check: since
  2023 a personal account has to verify with a government ID and address, and a
  company account needs a D-U-N-S number. It takes days, sometimes weeks, and
  nothing can be published until it clears. If the account does not exist yet,
  **start this first** — it is the longest pole.
- **An AAB, not an APK**, signed by Play App Signing, targeting a recent API
  level (Google raises the floor every August; anything submitted now needs to
  target 15 or later).
- **A data safety form**, which is Google's version of Apple's privacy
  questionnaire and asks for more detail: every kind of data, whether it is
  collected or shared, whether it is encrypted in transit, and whether somebody
  can ask for it to be deleted. Answering "you can ask us to delete your account"
  now needs a **way to ask from inside the app** and a public web page that does
  the same — Google checks the URL.
- **A privacy policy URL**, the same one Apple wants.
- **Store listing**: a 512px icon, a 1024×500 feature graphic, two to eight
  screenshots per form factor, a short description of 80 characters and a long one
  of 4,000.
- **Closed testing before production.** A new personal developer account has to
  run a closed test with at least 12 testers for 14 days before it may apply for
  production access. A company account does not. This catches people out.
- **App access instructions** — the same reviewer login as Apple's.
- **Sign in with Google is not required**, and Apple's rule that an app offering
  other social logins must also offer Apple's does not bite here: this app offers
  a code to an inbox, and Apple's own button beside it.

## The shortest path to both

1. The Play Console identity check, today, because it is the one thing that waits
   on somebody else.
2. Sign in with Apple switched on in Apple Developer and Supabase (an hour of
   clicking, and the code is already there).
3. The reviewer account and its two environment variables.
4. A privacy policy page on the website, and an account-deletion request that
   works from inside the app — Google will not take the app without the second one
   and Apple asks for it too.
5. The Capacitor shell, with push, the photo library and the native Apple sheet.
6. Decide what happens to Connect.
7. Icons, screenshots, the two questionnaires, submit.

## Sending a build to Apple

One command, once the key exists:

```bash
ASC_KEY_ID=ABCD123456 ASC_ISSUER_ID=69a6de00-… ./scripts/ship-ios.sh
```

It syncs the web shell into the native project, archives Release, exports an ipa
and uploads it to App Store Connect — TestFlight first, and from there into
review. The build number is the minute it was built (`202608221945`), so it always
goes up and there is nothing to increment by hand. `MARKETING_VERSION` in the
Xcode project is the version people see, and that one is a decision rather than a
clock.

### The key, once

App Store Connect → Users and Access → Integrations → App Store Connect API →
**Team Keys** → generate one with the role **App Manager**. Then:

- the **Issuer ID** is at the top of that page (a UUID),
- the **Key ID** is the ten characters beside the key,
- the **AuthKey_<KeyID>.p8** downloads exactly once — it cannot be downloaded
  again — and belongs at `~/.appstoreconnect/private_keys/AuthKey_<KeyID>.p8`,
  that folder and that filename, which is where every Apple tool looks.

With the key, `xcodebuild` makes the distribution profile itself; nothing has to
be renewed by hand and nothing about signing is checked into this repository.

### Without a key

The other way is to sign Xcode into the Apple ID once (Xcode → Settings →
Accounts → +) and then use Xcode's own Organizer to upload: Product → Archive,
then Distribute App → App Store Connect. Same result, more clicking, and it has
to be done from this Mac each time.

### What is already true of the project

- The distribution certificate is in this Mac's keychain: *Apple Distribution:
  heyhey. Management GmbH (K35XLVJJ3T)*.
- `DEVELOPMENT_TEAM` is set in the Xcode project, so an archive knows whose it is.
- `ITSAppUsesNonExemptEncryption` is `false` in Info.plist, so TestFlight does not
  stop and ask about export compliance.
- Sign in with Apple is in `App.entitlements`, and the plugin is in the SPM
  package — both verified in an archive.
- A Release archive builds clean unsigned, so anything that fails from here is
  about the account rather than about the code.
