import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * app.promenoodology.com serves the members' app, which lives under /app.
 *
 * This is a proxy rather than a rewrite in next.config.ts on purpose: a
 * blanket rewrite would also catch /_next/… and everything in /public, which
 * would take the app's own stylesheet, photographs and icons down with it.
 * Here anything with a file extension, and everything Next serves itself, is
 * left alone.
 */
export default function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!host.startsWith("app.")) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isFile = pathname.includes(".");
  if (isFile || pathname === "/app" || pathname.startsWith("/app/")) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL(`/app${pathname === "/" ? "" : pathname}`, request.url));
}

export const config = {
  // Everything except Next's own internals.
  matcher: "/((?!_next/).*)",
};
