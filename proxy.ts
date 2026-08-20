import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { beforeLaunch } from "./lib/launch";

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
 */
export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const signedIn = await refreshSession(request, response);

  // The holding page comes first: while the site is closed there is nothing
  // else to show, on either address.
  const elsewhere = holding(request, signedIn) ?? subdomain(request);
  if (!elsewhere) return response;

  return keepCookies(response, NextResponse.rewrite(elsewhere, { request }));
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
