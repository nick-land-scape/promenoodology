import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { beforeLaunch } from "./lib/launch";
import { LANGS, PLAIN, isLang, type Lang } from "./lib/lang";

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
 * Where a request goes to be read in a language.
 *
 * English has no prefix and never will: /events is the English page and the
 * rewrite to /en/events happens here, invisibly, because an address that has
 * been shared should not grow a segment. /en/events, if anybody types it, is
 * sent back to /events so there is one English address rather than two.
 *
 * French asks for itself by name and is already where it needs to be.
 */
function language(request: NextRequest): { to: URL; redirect: boolean } | null {
  const { pathname } = request.nextUrl;
  if (hasNoLanguage(pathname)) return null;

  const [, first] = pathname.split("/");

  // Already French, and already in the right place.
  if (isLang(first) && first !== PLAIN) return null;

  // One English address, not two.
  if (first === PLAIN) {
    const rest = pathname.slice(PLAIN.length + 1) || "/";
    return { to: new URL(rest, request.url), redirect: true };
  }

  const to = new URL(`/${PLAIN}${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url);
  return { to, redirect: false };
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

  if (wouldRather(request) !== "fr") return null;

  return new URL(`/fr${pathname === "/" ? "" : pathname}${request.nextUrl.search}`, request.url);
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user);
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
