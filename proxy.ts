import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Two jobs on every request:
 *
 * 1. app.promenoodology.com serves the members' app, which lives under /app.
 *    This is a proxy rather than a rewrite in next.config.ts on purpose: a
 *    blanket rewrite would also catch /_next/… and everything in /public, which
 *    would take the app's own stylesheet, photographs and icons down with it.
 *    Anything with a file extension is left alone.
 *
 * 2. Keeping the signed-in session fresh. Supabase tokens are short-lived; this
 *    hands the refreshed cookie back with the response so a member does not get
 *    signed out while reading.
 */
export default async function proxy(request: NextRequest) {
  const response = subdomain(request);
  return refreshSession(request, response);
}

function subdomain(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  const isFile = pathname.includes(".");
  const alreadyThere = pathname === "/app" || pathname.startsWith("/app/");

  if (!host.startsWith("app.") || isFile || alreadyThere) {
    return NextResponse.next({ request });
  }

  return NextResponse.rewrite(new URL(`/app${pathname === "/" ? "" : pathname}`, request.url), {
    request,
  });
}

async function refreshSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // no database yet: nothing to refresh

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

  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Everything except Next's own internals.
  matcher: "/((?!_next/).*)",
};
