import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { beforeLaunch } from "./lib/launch";
import { LANGS, PLAIN, isLang, type Lang } from "./lib/lang";
import { whoever } from "./lib/supabase/whoever";

/** The page the site answers with until it opens. */
const HOLDING = "/holding";

/**
 * Three jobs on every request:
 *
 * 1. Until the site opens, anybody who is not signed in is answered with the
 *    holding page and its clock — at whatever address they asked for, so a link
 *    passed around this week still works on the night, and nobody has to be
 *    sent somewhere they did not ask to go.
 *
 * 2. app.promenoodology.com serves the members' app, which lives under /app.
 *    This is a proxy rather than a rewrite in next.config.ts on purpose: a
 *    blanket rewrite would also catch /_next/… and everything in /public, which
 *    would take the app's own stylesheet, photographs and icons down with it.
 *    Anything with a file extension is left alone.
 *
 * 3. Keeping the signed-in session fresh. Supabase tokens are short-lived; this
 *    hands the refreshed cookie back with the response so a member does not get
 *    signed out while reading. It is also the question job 1 turns on, so it is
 *    asked first and only once.
 *
 * 4. Which language the website is read in. Every page of it lives under a
 *    language segment; English is served at the plain address by rewriting it
 *    there invisibly, French is asked for by name at /fr/…. See `language`.
 */
export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const signedIn = await refreshSession(request, response);

  // The holding page comes first: while the site is closed there is nothing
  // else to show, on either address.
  const elsewhere = holding(request, signedIn) ?? subdomain(request);
  if (elsewhere) return keepCookies(response, NextResponse.rewrite(elsewhere, { request }));

  /*
   * The app's front door, decided here rather than in the page.
   *
   * `/app` is the address the phone app itself loads, and for anybody without a
   * session the screen behind it sends them to `/app/enter`. That send is a
   * `redirect()` inside a server component, which by the time it happens has
   * already flushed the beginning of the Home screen — so Next finishes the
   * journey in the browser, with JavaScript. In a browser that is invisible. In
   * the app's web view it is a blank screen: the very first document a new member
   * ever loads is one that has to be completed by a script, and if anything is in
   * the way of that script — and in a web view something is — they get paper and
   * nothing else.
   *
   * One hop, at the edge, before a byte is sent. Only the exact address, because
   * only the exact address is the one the app opens with; everything under it is
   * left to the screens, which know more about who is allowed where than this
   * does.
   */
  if (!signedIn && request.nextUrl.pathname === "/app") {
    const door = new URL("/app/enter", request.url);
    door.searchParams.set("from", "/app");
    return keepCookies(response, NextResponse.redirect(door));
  }

  // Somebody who would rather read French, sent to the French address once and
  // then left alone: it is a redirect rather than a rewrite because the address
  // should say which language you are reading.
  const preferred = sendToFrench(request);
  if (preferred) return keepCookies(response, NextResponse.redirect(preferred));

  const inALanguage = language(request);
  if (inALanguage) {
    return keepCookies(
      response,
      inALanguage.redirect
        ? NextResponse.redirect(inALanguage.to)
        : NextResponse.rewrite(inALanguage.to, { request }),
    );
  }

  return response;
}

/** The parts of the site that have no language: the app, the back of the house,
    the endpoints, and every file. */
function hasNoLanguage(pathname: string) {
  return (
    pathname.includes(".") ||
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/holding")
  );
}

/**
 * The short addresses the written pages are known by.
 *
 * /privacy is what goes in an app store form and a footer link; /legal/privacy
 * is where the route lives. This used to be a rewrite in next.config.ts and
 * that rewrite never once fired: by the time Next looked at it this proxy had
 * already turned /privacy into /en/privacy, which matches nothing, so all five
 * of them answered 404 — including the privacy policy two app stores had been
 * given the address of.
 *
 * It belongs here rather than there for the same reason the language rewrite
 * does. There is one place that decides what a path means, and a second place
 * quietly disagreeing with it is how this happened.
 */
const WRITTEN: Record<string, string> = {
  "/privacy": "/legal/privacy",
  "/imprint": "/legal/imprint",
  "/terms": "/legal/terms",
  "/support": "/legal/support",
  "/help": "/legal/support",
};

/**
 * Where a request goes to be read in a language.
 *
 * English has no prefix and never will: /events is the English page and the
 * rewrite to /en/events happens here, invisibly, because an address that has
 * been shared should not grow a segment. /en/events, if anybody types it, is
 * sent back to /events so there is one English address rather than two.
 *
 * French asks for itself by name and is already where it needs to be — unless
 * it is one of the short addresses above, which is a name for a route rather
 * than a route, in either language.
 */
function language(request: NextRequest): { to: URL; redirect: boolean } | null {
  const { pathname } = request.nextUrl;
  if (hasNoLanguage(pathname)) return null;

  const [, first] = pathname.split("/");
  const under = (lang: string, path: string) =>
    new URL(`/${lang}${path === "/" ? "" : path}${request.nextUrl.search}`, request.url);

  // Already French, and already in the right place.
  if (isLang(first) && first !== PLAIN) {
    const rest = pathname.slice(first.length + 1) || "/";
    const written = WRITTEN[rest];
    return written ? { to: under(first, written), redirect: false } : null;
  }

  // One English address, not two.
  if (first === PLAIN) {
    const rest = pathname.slice(PLAIN.length + 1) || "/";
    return { to: new URL(`${rest}${request.nextUrl.search}`, request.url), redirect: true };
  }

  return { to: under(PLAIN, WRITTEN[pathname] ?? pathname), redirect: false };
}

/**
 * Somebody who would rather be reading French, sent there once.
 *
 * Three things are asked, in order, and the first that answers wins. What they
 * chose last time, because a choice made out loud beats anything guessed. What
 * their browser says it wants, which is the setting people actually have. And
 * where the request is coming from, which for this collective is worth asking:
 * the summer's programme is on a friche outside Geneva.
 *
 * Only ever from an address with no language on it, and only ever to French —
 * English is where the site already is, so there is nothing to send anybody to,
 * and no way for this to bounce.
 */
function sendToFrench(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (hasNoLanguage(pathname)) return null;

  const [, first] = pathname.split("/");
  if (isLang(first)) return null;

  // Never a crawler. See `aReader`.
  if (!aReader(request)) return null;

  if (wouldRather(request) !== "fr") return null;

  return new URL(`/fr${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url);
}

/**
 * Somebody, rather than something.
 *
 * The guess above is right for a person and wrong for a crawler, and wrong in a
 * way that costs. A crawler asks for the English address, gets moved to the
 * French one, and files the English page as a redirect — so the page that says
 * it is canonical is a page nothing can reach without being sent somewhere
 * else. Both languages are in the sitemap and each says where the other is;
 * a crawler has been told, and does not need to be steered.
 *
 * Matched loosely and on purpose. A false positive costs one visitor one click
 * on the language switch, which is the thing the switch is for; a false
 * negative costs a page in the index.
 */
const NOT_A_PERSON =
  /bot|crawler|spider|crawling|slurp|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|discord|preview|scrape|curl|wget|python-requests|node-fetch|headless|lighthouse|gpt|claude|anthropic|perplexity|chatgpt|openai|applebot|bingpreview/i;

function aReader(request: NextRequest) {
  return !NOT_A_PERSON.test(request.headers.get("user-agent") ?? "");
}

/** Which language this reader would rather have. */
function wouldRather(request: NextRequest): Lang {
  // What they chose, if they have ever chosen. The switcher writes this.
  const chosen = request.cookies.get("lang")?.value;
  if (isLang(chosen)) return chosen;

  /* What the browser asks for. "fr-CH,fr;q=0.9,en;q=0.8" — the languages in
     order of preference, so the first one that is one of ours is the answer.
     Not "does it mention French anywhere": nearly every browser mentions
     English somewhere, and half of them mention French. */
  const asked = request.headers.get("accept-language") ?? "";
  for (const part of asked.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase().slice(0, 2);
    if (LANGS.includes(tag as Lang)) return tag as Lang;
  }

  /* Where they are, which Vercel knows from the request. A weaker signal than
     either of the above and the last one asked: somebody in Geneva with an
     English browser has said what they want more clearly than their IP has. */
  const country = request.headers.get("x-vercel-ip-country") ?? "";
  if (["FR", "BE", "MC", "LU"].includes(country)) return "fr";
  // Switzerland is four languages; the part of it this collective works in is
  // the French-speaking part.
  if (country === "CH") return "fr";

  return PLAIN;
}

/**
 * Where a request goes while the site is still closed, or null to carry on as
 * normal.
 *
 * Signed in and you see the site: that is what an account is for before the
 * doors open. Everybody else gets the clock.
 *
 * Three things are let through. The holding page itself, or it would rewrite to
 * itself for ever. Anything with a file extension — the mark on the page, the
 * icons, robots.txt. And /account, which carries no content at all, only the
 * question of who you are: without it there would be no way to sign in, and so
 * no way past this.
 */
function holding(request: NextRequest, signedIn: boolean) {
  if (signedIn || !beforeLaunch()) return null;

  const { pathname } = request.nextUrl;
  const open =
    pathname === HOLDING ||
    pathname.includes(".") ||
    pathname === "/account" ||
    pathname.startsWith("/account/");

  return open ? null : new URL(HOLDING, request.url);
}

/** The members' app on its own subdomain, or null if this is the website. */
function subdomain(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  const isFile = pathname.includes(".");
  const alreadyThere = pathname === "/app" || pathname.startsWith("/app/");

  if (!host.startsWith("app.") || isFile || alreadyThere) return null;

  return new URL(`/app${pathname === "/" ? "" : pathname}`, request.url);
}

/** Whether somebody is signed in — and a fresh token for them either way. */
async function refreshSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false; // no database yet: nobody is signed in

  /*
   * Nobody is signed in unless there is a token to refresh, and asking anyway
   * costs a round trip to Supabase before a single byte of the page is sent.
   *
   * Every request goes through here — every page, every language switch, every
   * visitor who has never had an account — and for the overwhelming majority of
   * them the answer is a network call to be told "no". A visitor with no
   * Supabase cookie has no session by definition, so the call is skipped and the
   * answer is the same one it would have given.
   */
  const hasToken = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
  if (!hasToken) return false;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  /* From the token rather than from the auth server — the same check without the
     round trip, and it still refreshes an expiring session on the way past. See
     lib/supabase/whoever. */
  return Boolean(await whoever(supabase));
}

/** Carries a refreshed session over to a response decided on afterwards. */
function keepCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) to.cookies.set(cookie);
  return to;
}

export const config = {
  // Everything except Next's own internals.
  matcher: "/((?!_next/).*)",
};
