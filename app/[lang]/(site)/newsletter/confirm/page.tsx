import type { Metadata } from "next";
import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/public";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export const metadata: Metadata = {
  title: "On the list",
  robots: { index: false },
};

/**
 * Where the link in the confirmation email lands.
 *
 * The token is the whole of it: it is checked against the one row it was issued
 * for, by a function that can do nothing else — it cannot read an address back,
 * cannot change one, and cannot touch another row. So this page needs nobody to
 * be signed in, which is the point, and it gives nothing away either way.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const done = token
    ? Boolean((await supabasePublic().rpc("confirm_newsletter", { t: token })).data)
    : false;

  return (
    <main className="page">
      <div className="auth">
        {done ? (
          <>
            <h1 className="page-title">you are on the list</h1>
            <p className="page-intro">
              That is all it needed. We write when there is something to come to, and never
              otherwise — and you can ask us to take you off at any time.
            </p>
            <p className="auth-switch">
              In the meantime: the <Link href="/stories">stories</Link>, the{" "}
              <Link href="/archive">archive</Link>, or the{" "}
              <Link href="/community">people</Link>.
            </p>
          </>
        ) : (
          <>
            <h1 className="page-title">that link did not work</h1>
            <p className="page-intro">
              It may have been used already — in which case you are on the list and there is
              nothing more to do. If not, put your address in again and a fresh note will come.
            </p>
            <p className="auth-switch">
              <Link href="/newsletter">back to the newsletter</Link>, or write to{" "}
              <a href="mailto:info@promeNOODology.com">info@promeNOODology.com</a>.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
