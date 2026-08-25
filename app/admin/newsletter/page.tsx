import Head from "@/components/admin/Head";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseServer } from "@/lib/supabase/server";
import type { NewsletterRow } from "@/lib/supabase/rows";
import SubscriberList from "./SubscriberList";

/* Blocking, because this page is about whoever is asking: it reads the session
   before it can draw anything, and there is no version of it to prerender for
   everybody. `instant = false` is what `force-dynamic` was called before
   cacheComponents. */
export const instant = false;

export default async function NewsletterPage() {
  await requireAdmin();
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("newsletter")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<NewsletterRow[]>();

  return (
    <Head title="newsletter">
      <p className="admin-intro">
        Everybody who asked to hear when there is something to come to. Nobody else can read this
        list — not even the person who signed up, which is why the form can only ever say
        &ldquo;you are on the list&rdquo; and never show it back to them.
      </p>

      {error ? (
        <p className="admin-error">
          The list could not be read: {error.message}. If it says the table does not exist, run{" "}
          <code>supabase/migrations/0003_newsletter_and_admin.sql</code> — the newsletter form has
          been writing to a table that was never created.
        </p>
      ) : (
        <SubscriberList initial={data ?? []} />
      )}
    </Head>
  );
}
