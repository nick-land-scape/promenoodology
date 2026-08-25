/**
 * The file Android reads to decide whether this site and that app are the same
 * club.
 *
 * Without it, a sign-in link from an email opens Chrome — which is its own
 * browser with its own cookies, so somebody who tapped the link in their inbox
 * ends up signed in *there* and still signed out in the app. With it, Android
 * checks this file when the app is installed and hands those links straight to
 * it.
 *
 * Served from a route rather than a static file because it must go out as JSON
 * with no redirect and no HTML wrapper, at exactly this address, and because it
 * can then refuse to exist until it is true — see below.
 */

/*
 * The fingerprint of the key that signs what people install.
 *
 * Not the upload key. Play App Signing means Google holds the signing key, so
 * this is the SHA-256 they show under Release → Setup → App signing, listed as
 * "App signing key certificate". Copy the SHA-256 line, colons and all.
 *
 * It is public information — this file is served to anybody who asks — so it
 * lives in the repository rather than in an environment variable, where it can
 * be read, reviewed and noticed when it changes.
 */
const SIGNED_BY = "F6:30:91:8E:A5:5D:83:6B:F4:9F:45:BB:AD:25:DA:55:05:49:27:DB:DE:5F:22:7E:7B:DA:A3:9A:EA:CA:92:F5";

const PACKAGE = "com.promenoodology.community";

export function GET() {
  /*
   * Nothing at all until the fingerprint is here, and that is deliberate.
   *
   * Android caches the result of this check, including the failure. Serving an
   * empty or wrong list once means the app is marked as not owning these links
   * on every phone that asked, and the way back is a reinstall. A 404 is simply
   * "not set up yet", which is retried.
   */
  if (!SIGNED_BY.trim()) {
    return new Response("Not set up yet.", { status: 404 });
  }

  const statement = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: PACKAGE,
        sha256_cert_fingerprints: [SIGNED_BY.trim().toUpperCase()],
      },
    },
  ];

  return new Response(JSON.stringify(statement, null, 2), {
    headers: {
      "Content-Type": "application/json",
      /* A day, because it changes about never — and Android re-checks on its own
         schedule rather than on ours. */
      "Cache-Control": "public, max-age=86400",
    },
  });
}
