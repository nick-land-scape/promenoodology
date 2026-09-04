# Where we stand with the stores — 2 September 2026

Both stores answered on the same day. This is what each said, what has been done
about it, and the short list of what only a person with a phone and a pen can do.

## Apple — rejected, five points, reviewed on an iPad Air 11" (M3), iPadOS 26.6

| Guideline | What they said | State |
|---|---|---|
| 2.1(a) | Sign in with Apple showed an error | A native sheet that fails now falls through to Apple's web sign-in instead of printing the fault. The native cause could not be reproduced here — it needs an Apple ID on a device. **Please try Sign in with Apple once on your iPad before resubmitting.** |
| 5.1.1(v) | No account deletion | It exists: Account → leave the club → "yes, delete everything". They never got in (see 2.1). Apple wants a **screen recording** of it. |
| 2.3 | Could not see the tab bar / the features in the screenshots | Same cause as 2.1. Nothing to change. |
| 4 | Community tab crowded on iPad | The feed, composer and tabs now sit in a 640-point column on tablets instead of stretching across 1180. |
| 1.2 | UGC precautions | All four are in place and the review notes say so: terms sentence at the door (links to terms + privacy), filtering (word list now, model when `ANTHROPIC_API_KEY` is set), reporting, blocking (now also files a report). Apple wants a **screen recording** of terms / flag / block. |

Everything above is web-layer and is live. **No new build is needed** — nothing
native has changed since build 202608261412, which is the one attached to the
version. The review notes were updated through the API and are within the
4,000-character limit.

**Not yet resubmitted, on purpose.** Apple asked for two recordings "captured on a
physical device" to be linked from the review notes. Resubmitting without them
invites the same rejection.

### The two recordings — shot lists

Record on your iPhone (Settings → Control Centre → Screen Recording). Keep each
under a minute. Upload anywhere with a plain link (iCloud, Drive) and paste the
links into the notes — App Store Connect → the version → App Review Information →
Notes — or tell me the links and I will put them in through the API.

**Recording 1 — account deletion**
1. Open the app signed out; sign in with `review@promenoodology.com` and the code `06691281`.
2. Account tab → scroll to the foot → "leave the club".
3. Press it, then "yes, delete everything", then confirm.
4. Stop when the door reappears.
5. Then **recreate the review account** (Account → I have no account yet → same address), or the reviewer cannot sign in. Tell me and I will re-mark it as admin.

**Recording 2 — terms, flag, block**
1. Open the app signed out. Show the door: the sentence "By going on, you agree to the terms and the privacy notice". Tap "the terms" so the terms screen shows; back.
2. Sign in (same account). Connect tab.
3. On a post by somebody else, tap "report" → the form. Pick a reason, send.
4. Open "report" on another post → "block this person". Show the post vanish.
5. Account → who you blocked → show the row → undo it.

Then: App Store Connect → the version → "Submit for Review". The build is already
attached. If you would rather I did it, say so — it is one API call, and I did not
want to do it before the recordings exist.

## Google — Play listing rejected under the Impersonation policy

The flagged "promo graphic" is the club's own wordmark. The trip is the developer
account (heyhey. Management GmbH) not matching the brand (promeNOODology). The
uploaded file was also the wrong shape: 503×505 where Play wants 1024×500.

Both halves are prepared in `~/Desktop/promeNOODology app store/`:

- `play/feature-graphic-1024x500.png` — the same mark, the right size. Upload it
  in Play Console → Store listing → Graphics → Feature graphic, and resubmit.
- `5 — for Google's impersonation appeal.md` — the authorisation letter to sign
  (both parties) and the text for the appeal form. Its three GAPs are the same
  three imprint facts still owed by Nick.

## Still owed

- `ANTHROPIC_API_KEY` on Vercel (Nick). The word-list fence stands in until then.
- Skew Protection: Vercel → Settings → Advanced. Code half is deployed.
- The imprint facts (legal form, address, representatives, register/VAT).
- An Apple ID on a device, so Sign in with Apple can be tried natively once.
