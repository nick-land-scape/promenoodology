# Everything Play Console asks for, written down once

Every field in the console, with the answer already written. Copy it across rather
than composing at a form, because a listing written in the box is a listing
written badly, and the answers to the two questionnaires are statements about
what this app does — they should be decided by reading the code, not by guessing
at a dropdown at eleven at night.

Written 24 August 2026, against the app as it stands. Where an answer would change
if the app changed, it says so.

---

## Store listing

**App name** (30 characters): `promeNOODology`

The phone's home screen says *promeNOOD* because a springboard label has room for
about eleven characters. A store listing has thirty, and the club has a name.

**Short description** (80 characters):

> EN: `What's on, who's coming, and everything the club has done. For members.`
> FR: `Ce qui se passe, qui vient, et tout ce que le club a fait. Pour les membres.`

"For members" is doing real work there. Everything behind the first screen needs
an account, and somebody who installs it expecting a public listings app has been
misled by us rather than by Google.

**Full description** (4,000 characters), English:

```
promeNOODology is a club that cooks, walks, builds and writes things down. This is
its app: what is coming up, who is going, and everything we have already done.

What's on
Every evening, walk and workshop the club is putting on, with the day, the hours,
the place and the paragraph it opens with. Say you are coming, say what you are
bringing, and see what is still wanted — a pot, a lift, somebody who can weld.
Put any of it in your own calendar in one tap.

Read
Every project the club has finished, told properly: what we did, who was there and
what we would do differently, with the photographs woven through it. The whole
archive is in here too, and the handbook — which is the club explaining how to put
one of these on yourself, because the point is that you do.

Connect
A quiet feed for the people who were there. What somebody found, what is left over
after Saturday, who is driving past Nyon on Tuesday. No numbers, no ranking, no
strangers.

Your membership
Your card, your member number, the things you have said yes to, and everything
about you that is yours to change or to take down. Leaving deletes it: the
profile, the portrait, what you signed up for, everything you wrote and the
pictures on it. It does not hide it.

An account is needed for all of it, and an account is free. Nothing in this club
is ever paid for — not in the app, not anywhere else.

Available in English and French.
```

French, for the same field:

```
promeNOODology est un club qui cuisine, marche, construit et écrit ce qu'il fait.
Voici son application : ce qui arrive, qui y va, et tout ce que nous avons déjà
fait.

Ce qui se passe
Chaque soirée, balade et atelier que le club organise, avec le jour, les heures,
le lieu et le paragraphe qui l'ouvre. Dites que vous venez, dites ce que vous
apportez, et voyez ce qu'il manque encore — une casserole, une place en voiture,
quelqu'un qui sait souder. Ajoutez n'importe lequel à votre agenda d'un geste.

Lire
Chaque projet que le club a mené, raconté correctement : ce que nous avons fait,
qui était là et ce que nous ferions autrement, avec les photographies tissées dans
le texte. Toute l'archive est ici aussi, et le manuel — le club expliquant comment
en organiser un vous-même, puisque c'est bien l'idée.

Rencontrer
Un fil tranquille pour les gens qui y étaient. Ce que quelqu'un a trouvé, ce qui
reste après samedi, qui passe par Nyon mardi. Pas de chiffres, pas de classement,
pas d'inconnus.

Votre adhésion
Votre carte, votre numéro de membre, ce à quoi vous avez dit oui, et tout ce qui
vous concerne et que vous pouvez changer ou retirer. Partir efface : le profil, le
portrait, vos inscriptions, tout ce que vous avez écrit et les images qui vont
avec. Cela ne le cache pas.

Un compte est nécessaire pour tout cela, et un compte est gratuit. Rien dans ce
club n'est jamais payant — ni dans l'application, ni ailleurs.

Disponible en français et en anglais.
```

**Category**: Events. Social is the other honest answer; Events wins because the
first question anybody opens this app with is "when is the next one".

**Tags**: community, events, club, photography, food — no more. Tags are how Play
decides what to compare this to, and a tag that flatters is a tag that puts the
app beside things it will lose against.

**Contact details**: `info@promeNOODology.com`, and
`https://www.promenoodology.com/support` as the website.

**Privacy policy**: `https://www.promenoodology.com/legal/privacy`

---

## Graphics

| What | Size | Where it is |
| --- | --- | --- |
| App icon | 512×512 PNG, no transparency | `native/art/play-icon-512.png` |
| Feature graphic | 1024×500 PNG | `native/art/play-feature-1024x500.png` |
| Phone screenshots | 2–8, 9:16 | `~/Desktop/promeNOODology app store/play/` |
| Tablet screenshots | optional, 7" and 10" | not made; the app is a phone app |

Both graphics come out of `node scripts/app-icons.mjs`, cut from the same drawing
as the iPhone's icon, so there is one mark and not three.

---

## Data safety

Google's version of Apple's privacy questionnaire, and stricter: it asks per data
type whether it is *collected*, whether it is *shared*, whether it is required,
and what it is for. Sharing means leaving the club's own systems — Supabase is the
club's database, not a third party we hand data to, so nothing here is "shared".

**Does the app collect or share any of the required user data types?** Yes.

| Data type | Collected | Shared | Required | Purpose |
| --- | --- | --- | --- | --- |
| Name | Yes | No | Yes | App functionality, account management |
| Email address | Yes | No | Yes | App functionality, account management |
| Other personal info (country, town, what you do, what you speak) | Yes | No | No | App functionality |
| Photos | Yes | No | No | App functionality, user content |
| Other in-app messages (posts and replies) | Yes | No | No | App functionality |
| Other actions (what you have said yes to) | Yes | No | No | App functionality |

**Not collected, and worth being able to say so**: no location, no contacts, no
calendar, no financial information, no health information, no advertising ID, no
device identifiers, no third-party analytics of any kind. Nothing is collected for
advertising or marketing, because there is none.

**Is all user data encrypted in transit?** Yes — HTTPS everywhere; the app will
not load over anything else.

**Can users request that their data be deleted?** Yes. In the app: Account →
leave the club, which deletes the rows rather than hiding them. On the web:
`https://www.promenoodology.com/support`, which says the same and offers to do it
for anybody who asks. Google checks that URL, so it has to keep saying so.

**Has the app been independently security reviewed?** No. Answer no; "yes" here
means a published report exists.

---

## Content rating (the IARC questionnaire)

**Category**: Social networking — because members write posts and reply to each
other. Choosing "Reference" to get a gentler rating would be a false answer to the
first question, and the rating is void if the answers are wrong.

- Violence, sexual content, profanity, drugs, gambling, horror: **no** to all.
- **Do users interact or exchange content?** Yes — posts, replies and photographs,
  visible only to signed-in members.
- **Can users share their location with other users?** No. The map shows where the
  club's evenings and stories happened, not where anybody is.
- **Is user-provided personal information shared with third parties?** No.
- **Does the app provide unrestricted internet access?** No. Links to anywhere but
  the club's own site open the phone's browser; there is no browser inside.
- **Digital purchases?** None, anywhere, ever.

Expected outcome: PEGI 3 / ESRB Everyone, with an interactive-elements notice for
user interaction. That notice is correct and should not be argued with.

**Target audience**: 18 and over. The club is adults, and answering 13+ pulls the
app into Google's Families policy — a different review, a different set of
requirements, and none of it true of this app.

---

## App access

All of it needs an account, so Google needs one to review with. The same pair
Apple has:

```
Username: review@promenoodology.com
Password: 06691281
```

Instructions to paste into the form:

> Every screen requires an account. Open the app, choose "sign in", enter
> review@promenoodology.com and press continue. When it asks for the code that was
> emailed, enter 06691281 — this is a standing code for this address only, so no
> inbox is needed. Everything is then reachable: what's on, the stories and the
> archive, the members' feed, and the account screen.

---

## The other declarations

- **Ads**: none. The app contains no advertising.
- **News app**: no.
- **COVID-19 contact tracing or status**: no.
- **Government app**: no.
- **Financial features**: none.
- **Account creation**: yes, and required to use the app.

---

## What is not done yet, and would stop a release

**A way to report somebody else's post, and a way to block a member.** Play's
user-generated content policy requires an in-app mechanism for flagging
objectionable content and users; Apple's guideline 1.2 asks for the same, and it
is one of the most common rejections for an app with a feed. Today a member can
take down their *own* post and nothing else. This is a feature, not a form field:
a `reports` table, a `blocks` table, the two controls on a post, and somewhere in
/admin for the club to see what has been flagged. It should be built before either
store sees a build with the feed in it.

**Android App Links.** So a sign-in link from an email opens the app rather than
Chrome. The `assetlinks.json` needs the SHA-256 fingerprint of the *Play* signing
key, which does not exist until the first bundle is uploaded — so this is a job for
the day after the upload, not before it.

**Push on Android.** Firebase, a `google-services.json`, and the
POST_NOTIFICATIONS permission. Deliberately out of the first release.
