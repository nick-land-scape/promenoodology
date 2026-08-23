/**
 * The pages a club has to have in writing.
 *
 * Here rather than in the database, and deliberately: these are not content
 * anybody should be redesigning between deploys, and a privacy policy that can be
 * edited by whoever is logged in is a promise nobody is keeping. They are read at
 * build time and they live in the repository, so what the site says about itself
 * has a history anybody can read.
 *
 * They are written to be accurate rather than to be boilerplate. Every processor
 * named below is one this site actually uses; every period is one the code
 * actually enforces; every right listed is one somebody can exercise from inside
 * the app. That is the only kind of privacy notice worth having, and the kind both
 * app stores now check against the app's own behaviour.
 *
 * Two things are marked as missing rather than invented: the legal form and the
 * registered address. An imprint is a statement of who is legally answerable for a
 * website, and nobody can guess one.
 */

export type LegalPart = { heading: string; text?: never } | { heading?: never; text: string };

export type LegalSpec = {
  slug: "privacy" | "imprint" | "terms" | "support";
  title: string;
  lead: string;
  /** The day it last changed, as a date rather than as English. */
  changed: string;
  parts: LegalPart[];
};

/** Filled in once the details are known; until then the page says so. */
const GAP = "\u2014 still to be filled in \u2014";

export const LEGAL: LegalSpec[] = [
 {
    slug: "support",
    title: "help",
    lead: "Something not working, or a question. Both reach a person.",
    changed: "2026-08-21",
    parts: [
      {
        text: "There is no ticket system here and no chatbot. Write to info@promeNOODology.com and somebody who can actually do something about it will read it, usually the same week.",
      },
      { heading: "From inside the app" },
      {
        text: "Your account, then get in touch — a bug, an idea, or a word. A bug carries the screen you were on and the phone you were holding with it, which is the difference between us fixing it and us guessing.",
      },
      { heading: "Signing in" },
      {
        text: "There are no passwords. You give your address, a code arrives, you type it in. If the code has not come: look in the spam folder, check the address for a typo, and ask for another one — the old one stops working as soon as a new one is sent. Codes are good for an hour and for one use.",
      },
      {
        text: "If you signed in with Apple and chose to hide your email address, Apple gives us a forwarding address instead of yours. That works, but it means we cannot recognise you by the address you normally use — in the app, under ways to sign in, you can join Apple to the account you already have.",
      },
      { heading: "Your own things" },
      {
        text: "Your name, where you are from, your portrait and whether you are on the community page are all yours to change in the app, under your personal information. Your member number and the day you joined are not — write to us if either is wrong.",
      },
      { heading: "Leaving" },
      {
        text: "Your account, then leave the club, at the bottom. It deletes the rows rather than hiding them: the profile, the portrait, what you signed up for, everything you wrote and the pictures on it, and the login itself. It cannot be undone, which is why it asks twice. If you would rather we did it, write and we will.",
      },
      { heading: "Coming to something" },
      {
        text: "Saying yes in the app is saying you intend to be there, not buying a ticket — nothing is charged and nothing is owed, here or anywhere else in this club. Tell us about allergies before an evening rather than after it.",
      },
      { heading: "If the app will not open" },
      {
        text: "It needs a line to the outside: everything on its screens is the club as it is right now. If it says there is no signal and your phone plainly has one, close it and open it again — and if that does not do it, write to us with the make of phone. That is exactly the kind of thing the bug button is for.",
      },
    ],
  },
  {
    slug: "privacy",
    title: "what we do with your data",
    lead: "Who holds what about you, why, for how long, and how to make us stop.",
    changed: "2026-08-21",
    parts: [
      {
        text: "This notice describes how promeNOODology handles personal data on promenoodology.com and in the promeNOODology members\u2019 app. It is written to be read rather than to be survived, and it is accurate: everything named below is something the site actually does.",
      },
      {
        text: "We sell no personal data, we run no advertising, and we do not track you across other websites. There is no analytics service on this site and no advertising identifier in the app.",
      },

      { heading: "Who is responsible" },
      {
        text: `The controller is promeNOODology, ${GAP} (legal form, registered name and address). Questions, requests and complaints: info@promeNOODology.com, which reaches a person rather than a queue.`,
      },
      {
        text: "We have not appointed a data protection officer; we are not required to. The address above is the one to use.",
      },

      { heading: "If you only read the website" },
      {
        text: "Nothing is asked of you and nothing is stored about you. There is no analytics, no advertising, no cookie banner and no cookie \u2014 the one cookie this site can set exists only once you have signed in, and it exists to keep you signed in.",
      },
      {
        text: "Our hosting provider processes the technical data any web server receives in order to serve a page and to defend itself \u2014 IP address, the address requested, the time, and the browser\u2019s own description of itself. That processing rests on our legitimate interest in operating and securing the site (Art. 6(1)(f) GDPR; Art. 31(1) Swiss FADP). We do not use those logs to build a picture of anybody, and we do not join them to any account.",
      },

      { heading: "If you are on the community page" },
      {
        text: "We publish your name, the country you told us you are from, and a photograph if you gave us one. Publication is on the basis of your consent (Art. 6(1)(a) GDPR), given by turning it on, and you can withdraw it at any moment in the app under your personal information \u2014 the page changes within a minute. An administrator may also hide an entry; nobody can be published against their settings.",
      },

      { heading: "If you have an account" },
      {
        text: "We hold: your email address, so that a sign-in code can be sent to it; your name; the country you gave, if any; your portrait, if you gave one; a member number, allocated once and never re-used; the date you joined; whether you are shown on the community page; which evenings you have said you are coming to or marked to think about, how many of you, and what you said you would bring; anything you have written in the app and the photographs attached to it; whether you have waved at somebody or been waved at; and anything you have sent us through the app\u2019s bug and feedback form, which for a bug report includes the screen you were on and the browser your phone reports.",
      },
      {
        text: "This is processed to perform the membership you asked for (Art. 6(1)(b) GDPR) and, where it concerns keeping the club\u2019s own records straight, on our legitimate interest in running it (Art. 6(1)(f)).",
      },
      {
        text: "There are no passwords on this site. Signing in sends a one-time code to your address, valid for one hour and one use. This is deliberate: an account with no password has nothing on it worth stealing and nothing for anybody to reuse elsewhere.",
      },

      { heading: "If you sign in with Apple" },
      {
        text: "Apple tells us an identifier for you and an email address, and \u2014 on the first authorisation only \u2014 the name you allow it to share. If you choose to hide your email address, Apple gives us a forwarding address of its own instead of yours; we cannot see the address behind it, and mail we send to it is relayed by Apple. We ask Apple for nothing else. Apple\u2019s own handling of that exchange is described in Apple\u2019s privacy policy.",
      },

      { heading: "If you are on the newsletter" },
      {
        text: "We hold your email address and nothing else, and only after you have answered the note that asks whether you meant it \u2014 an address is never added to the list by anybody but its owner. The basis is your consent, and every letter carries the way off the list. Withdrawing it removes the address rather than flagging it.",
      },

      { heading: "Who else can see it" },
      {
        text: "Only the processors this site is built on, each of them under a data processing agreement and none of them permitted to use anything for their own purposes:",
      },
      {
        text: "Vercel Inc., which hosts the site and runs its server code. Supabase, which holds the database, the files and the accounts; this project\u2019s data is stored in the European Union. Infomaniak Network SA in Switzerland, which sends the email. Apple Inc., only where you choose Sign in with Apple.",
      },
      {
        text: "Where a processor is in the United States, transfers rely on the European Commission\u2019s standard contractual clauses together with that provider\u2019s own certification under the EU\u2013US Data Privacy Framework. Nobody outside this list receives personal data from us. We do not sell it, rent it, or hand it to advertisers, and we would resist any request to do so.",
      },
      {
        text: "We disclose data to a public authority only where the law obliges us, and where we may say so, we will.",
      },

      { heading: "How long we keep it" },
      {
        text: "Your account and what is on it, for as long as you are one of us. Delete your account in the app and the rows are deleted \u2014 profile, portrait, sign-ups, posts, replies, waves, the pictures on them, and the login itself. It is not a flag and it is not a queue.",
      },
      {
        text: "Anything an administrator deletes in the back of the house goes to a bin that empties itself after thirty days, so that a mistake on a Tuesday can be undone on a Wednesday. After that it is gone.",
      },
      {
        text: "Photographs of an evening stay in the archive as a record of what happened, with the photographer credited. If you are in one and would rather not be, write to us and we will take it down.",
      },
      {
        text: "Bug reports and feedback are kept until they have been dealt with. Newsletter addresses are kept until they are withdrawn. Server logs are kept by our hosting provider for its own short retention period.",
      },

      { heading: "What you can ask for" },
      {
        text: "You may ask what we hold about you and receive a copy; ask for a correction; ask for deletion; ask us to restrict or to stop a particular processing; object to processing based on our legitimate interest; and ask for what you gave us in a portable form. Where processing rests on consent, you may withdraw it at any time, and the withdrawal does not affect what was lawful before it.",
      },
      {
        text: "Write to info@promeNOODology.com. We will answer within a month; if a request is genuinely complicated we will say so and why, and we will not charge you for asking.",
      },
      {
        text: "If you think we have got it wrong you may complain to a supervisory authority: in Switzerland, the Federal Data Protection and Information Commissioner; in the European Union, the authority where you live or work.",
      },

      { heading: "Automated decisions, and children" },
      {
        text: "We make no automated decisions about anybody and we profile nobody. The app is not for children: an account is for somebody who cooks with us, and we do not knowingly hold data about anyone under sixteen. If one has reached us, tell us and it will go.",
      },

      { heading: "Keeping it safe" },
      {
        text: "Everything travels over an encrypted connection. Access to the database is governed row by row, so one member\u2019s session cannot read another member\u2019s things; the keys that could are held by the server and never sent to a browser. Administrator access is limited to the people who run the club, and every change an administrator makes to content is recorded with their name and the time.",
      },

      { heading: "Changes to this notice" },
      {
        text: "When it changes, the date at the foot of this page changes, and the previous wording remains in this site\u2019s own history. If a change matters to you \u2014 a new processor, a new purpose \u2014 we will say so rather than leaving you to notice.",
      },
    ],
  },
  {
    slug: "terms",
    title: "terms and conditions",
    lead: "What you can expect of us, what we ask of you, and who is answerable for what.",
    changed: "2026-08-21",
    parts: [
      { heading: "1. Who these terms are between" },
      {
        text: `These terms govern the use of promenoodology.com and of the promeNOODology members\u2019 app. They are between you and promeNOODology, ${GAP} (legal form, registered name and address), reachable at info@promeNOODology.com.`,
      },
      {
        text: "Using the site or the app means accepting them. If you do not, the remedy is not to use it \u2014 and everything worth reading here is readable without an account anyway.",
      },

      { heading: "2. What this is" },
      {
        text: "promeNOODology cooks in public. The website is a record of what we have done and a way of saying what is coming; the app is where the people who cook with us arrange it between them. It is a club, not a shop.",
      },

      { heading: "3. Membership" },
      {
        text: "Membership is free. There is nothing to pay, no subscription, no premium anything, and no fee for creating an account \u2014 in the app or anywhere else. You need an account only to use the app.",
      },
      {
        text: "You give an address, we send a code, you type it in. You are responsible for the address you give and for anybody who can read its inbox: whoever holds a valid code can sign in, which is the same trust an emailed password reset asks of you. Tell us at once if you think somebody else is in your account.",
      },
      {
        text: "One account per person. Do not sign in as somebody else, and do not hand your account to anybody.",
      },
      {
        text: "You may leave whenever you like, from the app, and everything about you goes with you \u2014 see what we do with your data. We may close an account that breaks section 5, and we will say why.",
      },

      { heading: "4. Coming to an evening" },
      {
        text: "Saying you are coming is a statement of intent, not a contract and not a ticket. Nothing is charged, nothing is owed, and no place is guaranteed: a kitchen has a size and we will tell you if there is no room.",
      },
      {
        text: "Marking an evening to think about promises nothing at all.",
      },
      {
        text: "Say so if you cannot come. Somebody else would have taken your place, and a table set for twelve with eight at it is a real loss to real people who cooked.",
      },
      {
        text: "An evening can move or be called off \u2014 weather, a kitchen falling through, illness. We will say so as early as we know, and we are not liable for what a cancelled evening cost you to get to.",
      },

      { heading: "5. What you write and the pictures you put up" },
      {
        text: "What you write and photograph stays yours. By putting it in the app you grant us a non-exclusive, worldwide, royalty-free licence to store it, to show it to other members in the app, and \u2014 where it is about an evening \u2014 to show it on this website, together with your name as we hold it. The licence lasts as long as the material is on the site; delete it, or delete your account, and it ends, save for copies already made by other people and for the archive of an evening as described in what we do with your data.",
      },
      {
        text: "Only put up what is yours to put up. Do not put up anything that infringes somebody else\u2019s rights, breaks a law, shows a person who would not want to be shown, or would make somebody unwelcome at this table \u2014 which includes anything hateful about who a person is, anything threatening, and anything a reasonable adult would call harassment.",
      },
      {
        text: "We may take down anything that breaks this section, and we will tell whoever put it up why. We do not review everything in advance and we do not claim to: what is written here is written by members, and the responsibility for it is theirs.",
      },
      {
        text: "If something of yours has been put up by somebody else, write to info@promeNOODology.com and it will come down while we look into it.",
      },

      { heading: "6. Cooking is cooking" },
      {
        text: "We share recipes, methods, and the occasional unwise idea. You cook and eat at your own risk and you are responsible for what you make and serve. Tell us about allergies and intolerances before an evening rather than after it \u2014 we cannot guarantee that any dish is free of any particular ingredient, because a shared kitchen is a shared kitchen.",
      },
      {
        text: "Nothing on this site is professional advice \u2014 not dietary, not medical, not structural, not legal.",
      },

      { heading: "7. The site itself" },
      {
        text: "We give no warranty that the site or the app will be available, uninterrupted, or free of error. We may change, suspend or withdraw any part of either, and we may change these terms; where a change matters we will say so on this page and the date at its foot will change.",
      },
      {
        text: "You may not attempt to break into it, overload it, scrape it wholesale, or use it to send anybody anything they did not ask for.",
      },

      { heading: "8. Liability" },
      {
        text: "We are liable without limit for damage caused intentionally or by gross negligence, for personal injury, and wherever the law does not allow liability to be limited. Otherwise our liability for slight negligence is limited to damage that was foreseeable and typical of this kind of arrangement, and we are not liable for lost profit, lost data, or consequential loss.",
      },
      {
        text: "This club is run by people who also have other jobs. That is not a disclaimer of the paragraph above; it is a description of who you are dealing with.",
      },

      { heading: "9. Third parties" },
      {
        text: "The app is distributed through the Apple App Store and the Google Play Store. Those companies are not parties to these terms, have no obligation to support the app, and are not responsible for it. Where their own rules give you rights against them, this section does not take them away.",
      },

      { heading: "10. Which law, and where" },
      {
        text: `Swiss law applies, excluding its conflict-of-law rules and the Vienna Sales Convention. The place of jurisdiction is our registered seat: ${GAP}. If you are a consumer resident in the European Union, this does not deprive you of the protection of the mandatory law of your own country, nor of the right to bring proceedings where you live.`,
      },
      {
        text: "If any part of these terms turns out to be unenforceable, the rest stands.",
      },

      { heading: "11. Getting in touch" },
      {
        text: "info@promeNOODology.com, or the get in touch screen in the app, which reaches the same people faster.",
      },
    ],
  },
  {
    slug: "imprint",
    title: "imprint",
    lead: "Who is behind this website, and who is answerable for it.",
    changed: "2026-08-21",
    parts: [
      {
        text: "An imprint states who is legally responsible for a website. The lines marked below cannot be invented and are the ones still to be completed \u2014 they are missing rather than withheld.",
      },

      { heading: "Responsible for this site" },
      { text: `promeNOODology, ${GAP} (legal form and registered name)` },
      { text: `${GAP} (street, postcode, town, country)` },
      { text: `Represented by: ${GAP}` },
      { text: `Responsible for the content: ${GAP}` },

      { heading: "Getting in touch" },
      { text: "info@promeNOODology.com \u2014 the fastest way, and it reaches a person." },

      { heading: "Register and numbers" },
      { text: `${GAP} (commercial register or association number, and VAT number where there is one)` },

      { heading: "The app" },
      {
        text: "The promeNOODology members\u2019 app is published by the same body named above, and distributed through the Apple App Store and the Google Play Store. Support: promenoodology.com/support.",
      },

      { heading: "Pictures and words" },
      {
        text: "The photographs on this site were taken by the people credited beside them in the archive, and remain theirs. The texts are ours. Ask before using either \u2014 we are usually delighted, and we like to know where things end up.",
      },

      { heading: "How it is built" },
      {
        text: "Written by hand, hosted by Vercel, with its database and files at Supabase in the European Union, and its email through Infomaniak in Switzerland. Nothing on it tracks you \u2014 see what we do with your data.",
      },

      { heading: "Disputes" },
      {
        text: "We are not obliged to take part in an out-of-court dispute resolution procedure and we do not currently do so. That does not stop you writing to us first, which is usually quicker than anything else.",
      },
    ],
  },
];

export const legalSpec = (slug: string) => LEGAL.find((page) => page.slug === slug);
